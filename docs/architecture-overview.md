# DataScope Architecture Overview

## System Architecture

DataScope is an enterprise-grade data discovery, exploration, and intelligence platform built on Next.js 14/15 App Router, Redux Toolkit with RTK Query, PostgreSQL with Drizzle ORM, and TanStack Virtual table rendering.

```mermaid
flowchart TD
    subgraph Client ["Client Layer (Browser)"]
        UI["React 18 Concurrent UI"]
        RTK["Redux Toolkit Store"]
        RTKQ["RTK Query Cache (Tier 1)"]
        VTable["TanStack Virtual Data Table"]
        Debounce["300ms Search Debouncer"]
    end

    subgraph API ["Next.js App Router API Layer"]
        AuthHandler["JWT & Firebase Auth Handler"]
        RBACGate["Server-Side RBAC Enforcement"]
        SearchHandler["Pushdown Search & Filter Engine"]
        LRUCache["In-Memory LRU Cache (Tier 2)"]
        ExportStreamer["Streaming CSV Export Engine"]
    end

    subgraph Storage ["Enterprise Persistence Layer"]
        PG["PostgreSQL Database (Neon / AWS RDS)"]
        FTS["GIN tsvector Index"]
        TRGM["GIN pg_trgm Index"]
        BTREE["Composite B-Tree Indexes"]
    end

    UI --> Debounce
    Debounce --> RTK
    RTK --> RTKQ
    RTKQ -->|Cache Hit 0ms| UI
    RTKQ -->|Cache Miss HTTP| AuthHandler

    AuthHandler --> RBACGate
    RBACGate --> SearchHandler
    SearchHandler <--> LRUCache
    SearchHandler --> FTS
    SearchHandler --> TRGM
    SearchHandler --> BTREE
    SearchHandler --> PG

    SearchHandler --> VTable
    ExportStreamer --> PG
```

---

## 2. Redux Store & State Synchronization Flow

The client state is structured into focused slices with clear separation between UI state, filter configuration, active dataset selection, and the RTK Query cache:

```mermaid
flowchart LR
    subgraph Store ["Redux Store Architecture"]
        authSlice["authSlice\n(User, Role, RBAC Privileges)"]
        searchConfigSlice["searchConfigSlice\n(Filters, Debounced Search, Sort, Page)"]
        datasetSlice["datasetSlice\n(Active Dataset, Selected Rows, Drawer)"]
        uiPreferenceSlice["uiPreferenceSlice\n(Density, Column Visibility, Theme)"]
        dataScopeApi["dataScopeApi\n(RTK Query Normalized Cache)"]
    end

    searchConfigSlice -->|Serialized Cache Key| dataScopeApi
    datasetSlice -->|Dataset ID Context| dataScopeApi
    dataScopeApi -->|Invalidates on Mutation| dataScopeApi
```

### Slice Responsibilities
- `searchConfigSlice`: Tracks search query, debounced search string, multi-condition filter rules, logical operator (`AND`/`OR`), sort definitions, and pagination settings.
- `datasetSlice`: Tracks the active selected dataset (`ds-sales-01`, `ds-telemetry-02`, `ds-finance-03`), multi-row selection maps (`selectedRowIds`), and detail drawer open state.
- `authSlice`: Maintains the authenticated user profile, active role (`admin`, `analyst`, `viewer`), and granular permission flags (`canExportData`, `canManageDatasets`, `canModifyRecords`).
- `uiPreferenceSlice`: Stores local UI settings such as table density (compact, comfortable, dense), custom column visibility toggles, and virtualized rendering switches.
- `dataScopeApi`: The primary RTK Query slice managing server cache lifecycle, query deduplication, optimistic updates, and tag invalidation.

---

## 3. Role-Based Access Control (RBAC) Matrix

DataScope enforces security at both the **Client UI layer** (disabling buttons, concealing restricted actions) and the **Server API layer** (verifying signed HS256 JWT tokens and denying unauthorized HTTP requests).

| Privilege Flag | Administrator | Data Analyst | Viewer | Server-Side Enforcement Point |
| :--- | :---: | :---: | :---: | :--- |
| `canManageUsers` | Allowed | Denied | Denied | `POST /api/users`, `DELETE /api/users/[id]` |
| `canManageDatasets` | Allowed | Denied | Denied | `POST /api/datasets`, `DELETE /api/datasets/[id]` |
| `canExportData` | Allowed | Allowed | Denied | `POST /api/datasets/[id]/export` |
| `canCreateSavedViews` | Allowed | Allowed | Denied | `POST /api/saved-views` |
| `canShareViews` | Allowed | Allowed | Denied | `PATCH /api/saved-views/[id]` |
| `canModifyRecords` | Allowed | Allowed | Denied | `PATCH /api/datasets/[id]/records/[recordId]` |
| `canAccessRestrictedDatasets` | Allowed | Allowed | Denied | `GET /api/datasets/ds-telemetry-02/*` |
| `canAccessAdminOnlyDatasets` | Allowed | Denied | Denied | `GET /api/datasets/ds-finance-03/*` |
| `canViewSystemAnalytics` | Allowed | Allowed | Allowed | Read-only analytics dashboard |

---

## 4. Entity Relationship Diagram

```mermaid
erDiagram
    users ||--o{ user_preferences : "configures"
    users ||--o{ saved_views : "authors"
    users ||--o{ audit_logs : "triggers"
    users ||--o{ record_comments : "writes"

    datasets ||--o{ dataset_fields : "defines"
    datasets ||--o{ dataset_records : "contains"
    datasets ||--o{ saved_views : "categorizes"
    datasets ||--o{ data_quality_issues : "monitors"

    dataset_records ||--o{ record_history : "tracks"
    dataset_records ||--o{ record_relationships : "links"
    dataset_records ||--o{ record_comments : "receives"

    users {
        string id PK
        string email
        string name
        string role
        string password_hash
        timestamp created_at
    }

    datasets {
        string id PK
        string name
        string slug
        string access_level
        int total_records
    }

    dataset_records {
        string id PK
        string dataset_id FK
        string record_key
        string title
        string category
        string status
        decimal numeric_value
        string country
        date record_date
        tsvector tsv
    }
```

