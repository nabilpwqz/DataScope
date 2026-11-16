# DataScope Platform Architecture & Codebase Audit Report

Date: 2026-11-16
Status: Phase 0 Audit Complete (Zero Code Modifications Applied)
Scope: Full Repository Inspection across src/, drizzle/, scripts/, and tests/
Environment: Next.js 14.2 App Router, TypeScript 5.6, Neon PostgreSQL (Remote AWS ap-southeast-1), Vercel Serverless (AWS us-east-1 iad1)

---

## 1. Executive Summary

This audit establishes the comprehensive architectural baseline of the DataScope enterprise platform prior to the execution of Phase 1 through Phase 11. While the application currently features a functional presentation layer and working database connectivity across approximately 120,000 records, critical gaps exist between the live deployed environment and the rigorous assessment specification:

1. **Embedded PGlite on Live Site**: The live deployment at `https://data-scope-flax.vercel.app/api/health` currently reports `engineType: "embedded-pglite"`. In-process WASM PostgreSQL does not persist writes across serverless container lifecycles, cannot scale, and fails the enterprise PostgreSQL requirement.
2. **Serverless In-Memory Caching**: The current cache operates as an ephemeral in-memory LRU Map. In serverless edge and lambda deployments, memory is not shared across instances, causing low hit rates and inconsistent cache invalidation.
3. **Hardcoded UI Statistics & SLAs**: Synthetic latency figures (0.8ms, 1.42ms, 4.2ms, 6.1ms), static SLA badges ("All Systems Operational 0.8ms SLA"), and outdated infrastructure claims ("Isolated Dedicated Node", "PostgreSQL & Prisma") exist across landing, footer, and settings pages.
4. **Initial Explorer State**: The server-rendered HTML for the Explorer shows "0 records / Query Time 0ms" prior to client-side hydration.
5. **Role-Based Access Control Gaps**: While client-side role toggles have been removed in local source, older deployed builds still exhibit client-side role switching and fallbacks to static administrative identities ("Elena Rostova").

No code changes have been applied during Phase 0. Every item below details file paths, lines of code, and architectural discrepancies against the 60-mark evaluation rubric.

---

## 2. Inventory of Hardcoded Stats and Aspirational Claims in UI

A systematic review across all user interface templates and components identified 38 specific occurrences of synthetic metrics, aspirational latency figures, and hardcoded claims:

### 2.1 Landing Page ([src/app/page.tsx](file:///c:/Users/Nabil/Desktop/DataScope/src/app/page.tsx))
- Line 146: `LATENCY: 3.42ms` - Hardcoded simulated engine latency badge.
- Line 161: `0.81 ms` - Synthetic Exact Key Lookup benchmark badge.
- Line 168: `1.42 ms` - Synthetic Trigram Index benchmark badge.
- Line 175: `1.19 ms` - Synthetic Full-Text Vector benchmark badge.
- Line 246: `Engine Scan: < 10.0 ms | Cloud HTTP: 80-250 ms` - Static header text.
- Line 249: `Hardware: Isolated Dedicated Node` - Inaccurate infrastructure description (runs on shared serverless compute).
- Line 277: `0.8 ms` - Hardcoded exact lookup benchmark card.
- Line 326: `4.2 ms` - Hardcoded trigram benchmark card.
- Line 365: `6.1 ms` - Hardcoded composite filter benchmark card.
- Line 424: `0.2 ms` - Hardcoded LRU cache benchmark card.
- Line 474: `Cold: 6.1ms` - Hardcoded telemetry envelope.
- Line 478: `Warm: 0.8ms` - Hardcoded telemetry envelope.
- Line 482: `Cached: 0.2ms` - Hardcoded telemetry envelope.

### 2.2 Global Footer ([src/components/layout/footer.tsx](file:///c:/Users/Nabil/Desktop/DataScope/src/components/layout/footer.tsx))
- Line 26: `(0.8ms SLA)` - Hardcoded operational SLA claim in global system status badge.

### 2.3 Spatial Data Lens ([src/components/landing/spatial-data-lens.tsx](file:///c:/Users/Nabil/Desktop/DataScope/src/components/landing/spatial-data-lens.tsx))
- Line 18: `metric: '0.8ms'` - Hardcoded spatial node latency badge.
- Line 273: `4.2 ms` - Hardcoded query execution badge in canvas visualization.

### 2.4 Performance Monitor ([src/app/dashboard/performance/page.tsx](file:///c:/Users/Nabil/Desktop/DataScope/src/app/dashboard/performance/page.tsx))
- Historical/fallback state in older builds: `hits: 142, misses: 48, hitRate: 74.7%` displayed simultaneously with empty table state (`No query metrics logged yet`).
- Line 53: `totalIndexedRecords: 120000` - Static fallback when datasets table is empty.

### 2.5 Settings & Governance ([src/app/dashboard/settings/page.tsx](file:///c:/Users/Nabil/Desktop/DataScope/src/app/dashboard/settings/page.tsx))
- Line 889: `~ 0.8 ms` - Static local execution metric.
- Line 1149: `0.8 ms` - Hardcoded exact index scan latency.
- Line 1185: `4.2 ms` - Hardcoded trigram search latency.
- Line 1762: `99.99% Uptime` - Static SLA claim without uptime monitor integration.
- Line 1888: `99.99% Uptime Guarantee` - Static enterprise SLA text.

### 2.6 Architecture & ADR Documentation ([src/app/dashboard/architecture/page.tsx](file:///c:/Users/Nabil/Desktop/DataScope/src/app/dashboard/architecture/page.tsx))
- Line 556: `-- Execution time: ~4.2ms across 110,000 records. Payload: 12.4 KB` - Static SQL code comment.
- Line 998: `-- Guarantees identical sub-4ms response whether at row 100 or row 10,000,000` - Static SQL code comment.
- Line 1801: `Sub-8ms exact and stemmed lexical discovery` - Static markdown claim.
- Line 2023: `sub-10ms in-database execution times without the massive operational burden...` - Static marketing claim.

### 2.7 Dataset Detail Page ([src/app/dashboard/datasets/[id]/page.tsx](file:///c:/Users/Nabil/Desktop/DataScope/src/app/dashboard/datasets/[id]/page.tsx))
- Line 245: `99.9%` - Static reliability KPI badge.

### 2.8 System Architecture SVG ([public/images/system-architecture-diagram.svg](file:///c:/Users/Nabil/Desktop/DataScope/public/images/system-architecture-diagram.svg))
- Line 153: `DRIZZLE ORM + PRISMA 5.22` - Mentions legacy Prisma ORM.
- Line 178: `Prisma Client 5.22` - Mentions legacy Prisma Client.

---

## 3. Route Handlers Security & Authorization Matrix

Inspection of all 24 API route handlers in `src/app/api/`:

| Route File | HTTP Methods | Checks Session | Checks Role | Dataset-Level Perms | Zod Validation | Mock Fallback Present | Security Finding |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `src/app/api/ai/search-assistant/route.ts` | POST | Yes | Yes (Analyst+) | Yes | Yes (Zod AST) | No | Protected: Requires valid session and analyst role. Input validated against strict schema. |
| `src/app/api/audit-logs/route.ts` | GET, POST | Yes | Yes (Admin) | No | Yes | No | Protected: Enforces admin role for audit log inspection and creation. |
| `src/app/api/auth/[...nextauth]/route.ts` | GET, POST | Public | N/A | N/A | Yes | No | Standard NextAuth handler for credentials provider authentication. |
| `src/app/api/auth/firebase/route.ts` | POST | Public | Yes | No | No | No | Legacy endpoint: Accepts Firebase token payload; must be unified into NextAuth flow. |
| `src/app/api/auth/login/route.ts` | POST | Public | N/A | N/A | Yes | No | Public credentials login endpoint returning session JWT. |
| `src/app/api/auth/logout/route.ts` | POST | Public | N/A | N/A | No | No | Clears authentication session cookies. |
| `src/app/api/auth/me/route.ts` | GET | Yes | Yes | No | No | No | Returns active authenticated user identity from session. |
| `src/app/api/auth/register/route.ts` | POST | Public | Yes | No | Yes | No | Public self-registration endpoint; validates password strength with bcrypt hashing. |
| `src/app/api/auth/switch-role/route.ts` | POST | Yes | Yes (Admin) | No | Yes | No | Role switching restricted to Admin session. |
| `src/app/api/benchmark/route.ts` | GET | Yes | Yes (Analyst+) | No | No | No | Protected: Benchmarks must only be executed by authenticated analysts/admins. |
| `src/app/api/data-lineage/route.ts` | GET | Yes | Yes (Viewer+) | Yes | No | No | Returns lineage topology for permitted datasets. |
| `src/app/api/data-quality/route.ts` | GET, PATCH | Yes | Yes (Analyst+) | Yes | Yes | No | Returns quality scores; PATCH restricted to Admin role. |
| `src/app/api/datasets/route.ts` | GET, POST | Yes | Yes | Yes (Table) | Yes (POST) | No | Filters dataset listing based on `access_permissions` table. POST requires admin. |
| `src/app/api/datasets/[id]/analytics/route.ts` | GET | Yes | Yes (Analyst+) | Yes (Table) | Yes | No | Verifies analyst role and dataset read permission via `access_permissions`. |
| `src/app/api/datasets/[id]/export/route.ts` | POST, GET | Yes | Yes (Analyst+) | Yes (Table) | Yes | No | Verifies export permission (`can_export = true`) in `access_permissions`. Streams via cursor. |
| `src/app/api/datasets/[id]/records/route.ts` | POST | Yes | Yes (Viewer+) | Yes (Table) | Yes | No | Validates pagination (max 100), filters (max 10), and checks `can_read`. |
| `src/app/api/datasets/[id]/records/[recordId]/comments/route.ts` | GET, POST | Yes | Yes (Analyst+) | Yes (Table) | Yes | No | Verifies dataset access before reading or inserting record investigation comments. |
| `src/app/api/datasets/[id]/records/[recordId]/route.ts` | GET, PATCH | Yes | Yes | Yes (Table) | Yes | No | GET requires `can_read`; PATCH requires `can_write` (Admin only). |
| `src/app/api/datasets/[id]/route.ts` | GET, PATCH, DELETE | Yes | Yes (Admin) | Yes (Table) | Yes | No | Dataset modification and deletion strictly guarded by Admin role. |
| `src/app/api/health/route.ts` | GET | Public | None | None | None | No | Public healthcheck reporting active DB engine, connection status, and measured latency. |
| `src/app/api/performance/route.ts` | GET, DELETE | Yes | Yes (Analyst+) | No | No | No | GET returns live query_metrics; DELETE requires Admin role. |
| `src/app/api/saved-views/route.ts` | GET, POST | Yes | Yes (Analyst+) | Yes (Table) | Yes | No | Lists user/shared views for permitted datasets; POST requires analyst/admin. |
| `src/app/api/saved-views/[id]/route.ts` | DELETE, PATCH | Yes | Yes (Analyst+) | Yes (Table) | Yes | No | Enforces view ownership (`user_id === session.userId`) or Admin override. |
| `src/app/api/search-history/route.ts` | GET, POST, DELETE | Yes | Yes (Viewer+) | No | Yes | No | Scoped to authenticated user ID. DELETE clears active user history. |
| `src/app/api/users/route.ts` | GET, PATCH | Yes | Yes (Admin) | No | Yes | No | User management strictly guarded by Admin authorization. |

---

## 4. Database, Driver & ORM Architecture

### 4.1 ORM Consolidation Status
- **Prisma ORM**: Completely purged from local codebase (`package.json`, `prisma/` folder deleted). However, legacy diagrams and deployed marketing copy still reference Prisma.
- **Drizzle ORM (`drizzle-orm@^0.36.1`, `drizzle-kit@^0.31.11`)**: Established as the sole Object-Relational Mapping standard.
- **Drizzle Migrations**: Located in `drizzle/migrations/0000_initial_schema.sql`.

### 4.2 Database Driver & Connection Setup
- Driver: `pg` (`pg.Pool`) with pooled connection reuse via global singleton in `src/lib/db/index.ts`.
- Embedded Fallback: `@electric-sql/pglite` currently exists as an in-memory fallback when `process.env.DATABASE_URL` is empty. On Vercel, this caused `/api/health` to report `embedded-pglite`.
- Required Phase 1 Fix: Explicitly remove PGlite from the production path so the application strictly requires a hosted PostgreSQL connection in `iad1`. PGlite will be restricted to local Vitest integration test environments.

---

## 5. Indexes & Search Architecture Analysis

### 5.1 Active Database Indexes (PostgreSQL)
1. **Full-Text Search**: Stored generated column `search_tsv tsvector` indexed via GIN (`idx_records_search_tsv_gin`).
2. **Trigram Similarity**: GIN trigram index on `title gin_trgm_ops` (`idx_records_trgm_title`).
3. **Composite B-Tree Indexes**:
   - `idx_records_composite_filter`: `(dataset_id, status, country, record_date DESC)`
   - `idx_records_numeric`: `(dataset_id, numeric_value)`
   - `idx_records_keyset_cursor`: `(dataset_id, record_date DESC, id DESC)`
4. **Foreign Key & Lookup B-Trees**:
   - `idx_records_dataset_date`: `(dataset_id, record_date DESC)`
   - `idx_records_record_key`: `(record_key)`
   - `idx_saved_views_dataset`, `idx_saved_views_user`, `idx_search_hist_user`, `idx_perf_logs_created`, `idx_audit_logs_created`, `idx_quality_issues_dataset`.

### 5.2 Areas for Phase 4 Verification
- Keyset cursor pagination must be verified as the primary default in the Data Explorer UI, with OFFSET reserved strictly for direct page jumping.
- Execution plans for 5 core queries must be validated at both 120,000 and 1,000,000 records using `EXPLAIN (ANALYZE, BUFFERS)` to prove zero sequential scans on indexed paths.

---

## 6. Cache Implementation Analysis

### 6.1 Current Architecture
The cache in [src/lib/cache/lru-cache.ts](file:///c:/Users/Nabil/Desktop/DataScope/src/lib/cache/lru-cache.ts) implements `SharedQueryCache`. While it includes Upstash Redis REST URL integration logic, it falls back to an in-memory `Map` when Redis environment variables are unset.

### 6.2 Serverless Deficiencies
1. On Vercel serverless micro-containers (`iad1`), in-memory maps are isolated per container instance.
2. In-memory entries are lost on container shutdown or cold starts.
3. Cache invalidation on dataset writes only affects the container executing the write, creating potential consistency drift across sibling containers.

### 6.3 Required Phase 5 Architecture
- Shared distributed Redis cache (Upstash Redis or Vercel KV).
- Cache key structure: `hash(datasetId + normalized query + dataset version)`.
- Invalidation mechanism: Atomic dataset version increment (`dataset_version` bump) on write or import paths.

---

## 7. Missing Deliverables vs. 60-Mark Evaluation Rubric

| Rubric Dimension | Marks | Required Deliverables | Status | Deficiencies to Remediate |
| :--- | :--- | :--- | :--- | :--- |
| **Data Fetching** | 12 | Server Components initial load, RTK Query interactions, 300ms debounce, AbortController cancellation, retry with backoff, optimistic updates, cursor pagination | Partial | Server-rendered Explorer HTML shows 0 records before hydration; must pre-fetch initial dataset metadata and first page on server. |
| **Search & Optimization** | 12 | Keyset pagination default, tsvector GIN, pg_trgm GIN, composite B-tree indexes, parameterized Drizzle queries, 5 EXPLAIN ANALYZE plans | Partial | Keyset cursor needs full wiring into Explorer UI controls; query plans documented at 120k but need 1M verification. |
| **Frontend Architecture** | 9 | Feature-based folders (`features/*`), TanStack Table + Virtualization, column visibility/resize, memoized rows, zero Hallmark sloplint FAIL | Partial | Need clean migration to `src/features/*` structure; ensure virtual table handles dynamic column sizing cleanly. |
| **State Management** | 6 | Redux Toolkit slices (`auth`, `dataset`, `searchConfig`, `savedViews`, `uiPrefs`), URL searchParams bidirectional sync | Substantial | URL bidirectional sync implemented; verify full link reproduction and store hydration across shared links. |
| **DB & Query Design** | 6 | Drizzle ORM exclusive, 13 core tables, idempotent batched seed script (120k and 1M), relational integrity | Substantial | Drizzle schema and migrations complete; ensure seed script seamlessly scales to 1M rows via `SEED_SIZE=1000000`. |
| **Performance** | 6 | Real k6 load benchmark, p50/p95/p99 recorded, live metrics monitor reading from query_metrics, honest stats | Partial | k6 benchmark script created; must run against live deployed endpoint and replace all aspirational numbers with measured data. |
| **Decision Making** | 6 | >= 8 detailed ADRs with all 8 required sections in docs/adr/ and /dashboard/architecture | Complete | 9 ADRs fully authored with all 8 required sections. |
| **Documentation** | 3 | Complete README matching all spec sections, Mermaid diagrams, OpenAPI/Markdown API reference | Substantial | README contains comprehensive architecture and scaling sections; update diagrams to remove legacy Prisma references. |

---

## 8. Summary & Next Steps

This audit confirms that the core architectural building blocks are established locally, but critical production configuration, real database connectivity in Vercel `iad1`, shared caching, feature folder re-organization, and elimination of remaining synthetic numbers are mandatory to achieve full compliance across all 60 marks.
