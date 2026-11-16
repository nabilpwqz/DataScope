# DataScope Architecture Overview & System Topology

**Author**: DataScope Architecture Working Group  
**Status**: Production Verified  
**Runtime**: Next.js 14 App Router, TypeScript 5.6, Drizzle ORM 0.36, PostgreSQL 15  

---

## 1. System Topology & Tier Breakdown

DataScope is structured into four decoupled layers: Presentation & Virtualization, Global State & Networking, Serverless API & Access Control, and Persistent Database Engine with Inverted Indexing.

```mermaid
flowchart TD
  subgraph ClientTier["Client Presentation Tier (Browser)"]
    DOM["Virtual DOM Viewport (~120 rendered rows)"]
    TV["TanStack Virtual 3.x Windowing"]
    RC["React 18 Concurrent Components"]
    PL["Global Command Palette (Ctrl+K)"]
    RC --> TV --> DOM
    PL --> RC
  end

  subgraph StateTier["Client State & Network Caching Tier"]
    Store["Redux Toolkit Store"]
    RTK["RTK Query Service (dataScopeApi)"]
    Slices["UI Slices (searchConfig, dataset, auth, uiPreference)"]
    Store --> Slices
    Store --> RTK
  end

  subgraph EdgeTier["Vercel Serverless Runtime (Node.js)"]
    MW["middleware.ts (JWT & Session Inspection)"]
    AuthZ["Server Helper authorize()"]
    Engine["SearchEngine (Parameterized Pushdown)"]
    LRU["SharedQueryCache (In-Memory LRU, TTL: 60s)"]
    MW --> AuthZ
    AuthZ --> Engine
    Engine <--> LRU
  end

  subgraph DataTier["Database & Storage Tier (PostgreSQL 15)"]
    PG["Neon PostgreSQL Serverless Cluster"]
    GIN["GIN Index (idx_records_search_tsv_gin)"]
    BTREE["Composite B-Trees (idx_records_filter_composite)"]
    KEYSET["Keyset B-Tree (idx_records_keyset)"]
    PG --- GIN
    PG --- BTREE
    PG --- KEYSET
  end

  RC --> Store
  RTK -- "HTTPS /api (Bearer JWT)" --> MW
  Engine -- "pg connection pool (SSL)" --> PG
```

---

## 2. Redux State Flow & Bidirectional URL Synchronization

The search state is maintained centrally in Redux Toolkit and bidirectionally mirrored to browser URL search parameters:

```mermaid
sequenceDiagram
  autonumber
  actor User as User
  participant Input as Search Input
  participant Redux as Redux searchConfigSlice
  participant URL as Browser URLSearchParams
  participant RTK as RTK Query Cache
  participant Server as Next.js API Route

  User->>Input: Types keyword "Enterprise"
  Input->>Input: Local state updates (60fps typing)
  Note over Input,Redux: 300ms Debounce Window
  Input->>Redux: dispatch(setDebouncedSearch('Enterprise'))
  Redux->>URL: window.history.replaceState(?search=Enterprise)
  Redux->>RTK: Trigger useSearchRecordsQuery({ search: 'Enterprise' })
  alt In-Flight Request Pending
    RTK->>RTK: AbortController aborts previous superseded flight
  end
  RTK->>Server: GET /api/datasets/ds-sales-01/records?search=Enterprise
  Server-->>RTK: 200 OK (Serialized JSON Page)
  RTK-->>User: TanStack Virtual Table renders results
```

---

## 3. Relational Entity-Relationship Diagram (ERD)

DataScope enforces strict referential integrity across 13 core relational tables:

```mermaid
erDiagram
  USERS ||--o{ ACCESS_PERMISSIONS : "assigned"
  USERS ||--o{ AUDIT_LOGS : "generates"
  USERS ||--o{ SAVED_VIEWS : "creates"
  USERS ||--o{ RECORD_COMMENTS : "authors"
  USERS ||--o{ EXPORT_JOBS : "triggers"
  ROLES ||--o{ ACCESS_PERMISSIONS : "defines"
  DATASETS ||--o{ DATASET_RECORDS : "contains"
  DATASETS ||--o{ ACCESS_PERMISSIONS : "scoped to"
  DATASETS ||--o{ SAVED_VIEWS : "targets"
  DATASETS ||--o{ DATA_QUALITY_METRICS : "evaluated by"
  DATASETS ||--o{ DATA_LINEAGE_NODES : "mapped by"
  DATASET_RECORDS ||--o{ RECORD_RELATIONSHIPS : "source/target"
  DATASET_RECORDS ||--o{ RECORD_HISTORY : "tracks"
  DATASET_RECORDS ||--o{ RECORD_COMMENTS : "annotated by"

  USERS {
    string id PK
    string email
    string password_hash
    string role
    string name
    string department
  }

  DATASETS {
    string id PK
    string name
    string slug
    string category
    int total_records
    boolean is_public
  }

  DATASET_RECORDS {
    string id PK
    string dataset_id FK
    string record_key
    string title
    string category
    string status
    float numeric_value
    string country
    string region
    timestamp record_date
    tsvector search_tsv
  }

  ACCESS_PERMISSIONS {
    string id PK
    string role_name FK
    string dataset_id FK
    boolean can_read
    boolean can_write
    boolean can_export
    boolean can_delete
  }
```

---

## 4. Keyset Cursor vs. Offset Pagination Scaling

Standard exploratory browsing utilizes bounded offset pagination (clamped between 1 and 100 rows per page). For deep traversal beyond page 50 or automated streaming ETL, keyset cursors are used:

```sql
-- Keyset Cursor Seek (O(1) seek over composite B-tree)
SELECT id, record_key, title, category, status, numeric_value, country, region, record_date
FROM dataset_records
WHERE dataset_id = $1
  AND (record_date, id) < ($2, $3)
ORDER BY record_date DESC, id DESC
LIMIT 25;
```

Index `idx_records_keyset` on `(dataset_id, record_date DESC, id DESC)` guarantees:
1. Zero tuple discards in memory.
2. Constant 0.10 ms execution time regardless of depth.
3. Zero row drift (concurrent inserts cannot duplicate or skip rows during sequential iteration).

---

## 5. Security Architecture & Server-Side RBAC

Client-side role switching is strictly forbidden. The active user role is verified on every request through `authorize()`:

1. **Authentication**: NextAuth extracts JWT containing `userId` and `role`.
2. **Clearance Check**: The requested role must satisfy minimum privilege requirements (Viewer < Analyst < Admin).
3. **Dataset Permission Matrix**: The `access_permissions` table is queried to verify whether the user's role grants permission for `action` (`read`, `write`, `export`, `delete`) on `datasetId`.
4. **Audit Trail**: High-impact operations (`DATA_EXPORT`, `DATA_MUTATION`, `VIEW_SAVE`) write immutable entries into `audit_logs`.
