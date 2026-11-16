# DataScope Platform Architecture & Codebase Audit Report

Date: 2026-11-16
Status: Phase 0 Audit Complete (Zero Code Modifications Applied)
Scope: Full Repository Inspection across src/, drizzle/, prisma/, scripts/, and tests/
Environment: Next.js 14 App Router, TypeScript, Neon PostgreSQL (Remote AWS ap-southeast-1), Vercel Serverless (AWS us-east-1 iad1)

---

## 1. Executive Summary

This audit establishes the baseline architectural state of the DataScope enterprise platform prior to execution of Phase 1 through Phase 10 remediation. The codebase exhibits a functional presentation layer and working database connectivity across approximately 120,000 records. However, systematic inspection reveals critical vulnerabilities in server-side authorization enforcement, dual-ORM dependency bloat, ephemeral in-memory caching incompatible with serverless environments, hardcoded marketing performance claims, and missing enterprise specifications.

No code modifications have been made during Phase 0. Every finding below details exact file locations, lines of code, and architectural discrepancies against the required specification.

---

## 2. Hardcoded Metrics and Aspirational Claims in UI and Code

A comprehensive scan across all UI pages, components, and server routes identified 36 specific occurrences of hardcoded metrics, aspirational latency figures, and hardcoded user identities.

### 2.1 Aspirational Latency Claims and SLAs

The landing page, footer, settings, and architecture pages display synthetic latency metrics that do not reflect actual live round-trip measurements:

1. [footer.tsx](file:///c:/Users/Nabil/Desktop/DataScope/src/components/layout/footer.tsx#L26)
   - Line 26: `(0.8ms SLA)` - Hardcoded operational SLA in global footer.
2. [spatial-data-lens.tsx](file:///c:/Users/Nabil/Desktop/DataScope/src/components/landing/spatial-data-lens.tsx#L18)
   - Line 18: `metric: '0.8ms'` - Hardcoded spatial node latency badge.
   - Line 273: `4.2 ms` - Hardcoded query execution metric badge.
3. [page.tsx](file:///c:/Users/Nabil/Desktop/DataScope/src/app/page.tsx#L146)
   - Line 146: `LATENCY: 3.42ms` - Hardcoded simulated engine latency badge.
   - Line 161: `0.81 ms` - Hardcoded Exact Key Lookup latency.
   - Line 168: `1.42 ms` - Hardcoded Trigram Index latency.
   - Line 175: `1.19 ms` - Hardcoded Full-Text Vector latency.
   - Line 246: `Engine Scan: < 10.0 ms | Cloud HTTP: 80-250 ms` - Static header text.
   - Line 249: `Hardware: Isolated Dedicated Node` - Inaccurate infrastructure description (database runs on shared serverless Neon compute).
   - Line 277: `0.8 ms` - Hardcoded exact lookup benchmark card.
   - Line 326: `4.2 ms` - Hardcoded trigram benchmark card.
   - Line 365: `6.1 ms` - Hardcoded composite filter benchmark card.
   - Line 424: `0.2 ms` - Hardcoded LRU cache benchmark card.
   - Line 474: `Cold: 6.1ms` - Hardcoded telemetry envelope.
   - Line 478: `Warm: 0.8ms` - Hardcoded telemetry envelope.
   - Line 482: `Cached: 0.2ms` - Hardcoded telemetry envelope.
4. [settings/page.tsx](file:///c:/Users/Nabil/Desktop/DataScope/src/app/dashboard/settings/page.tsx#L889)
   - Line 889: `~ 0.8 ms` - Hardcoded local execution metric.
   - Line 1149: `0.8 ms` - Hardcoded exact index scan latency.
   - Line 1185: `4.2 ms` - Hardcoded trigram search latency.
   - Line 1762: `99.99% Uptime` - Static SLA claim without uptime monitor backing.
   - Line 1888: `99.99% Uptime Guarantee` - Static enterprise SLA text.
5. [architecture/page.tsx](file:///c:/Users/Nabil/Desktop/DataScope/src/app/dashboard/architecture/page.tsx#L556)
   - Line 556: `-- Execution time: ~4.2ms across 110,000 records. Payload: 12.4 KB` - Static SQL code comment.
   - Line 998: `-- Guarantees identical sub-4ms response whether at row 100 or row 10,000,000` - Static SQL code comment.
   - Line 1801: `Sub-8ms exact and stemmed lexical discovery` - Static markdown claim.
   - Line 2023: `sub-10ms in-database execution times without the massive operational burden of maintaining external Elasticsearch clusters.` - Static conclusion claim.

### 2.2 Hardcoded User Identities and Mock Fallbacks

Multiple route handlers and UI components bypass real authentication by falling back to static user names and identities:

1. [header.tsx](file:///c:/Users/Nabil/Desktop/DataScope/src/components/layout/header.tsx#L168)
   - Line 168: `{user?.name || 'Elena Rostova'}` - Header falls back to static administrator name.
2. [saved-views/page.tsx](file:///c:/Users/Nabil/Desktop/DataScope/src/app/dashboard/saved-views/page.tsx#L142)
   - Line 142: `Author: {v.authorName || 'Marcus Vance'}` - Saved views fallback author.
3. [advanced-search/page.tsx](file:///c:/Users/Nabil/Desktop/DataScope/src/app/dashboard/advanced-search/page.tsx#L56)
   - Lines 56-90: `const fallbackDatasets = [...]` - Hardcoded client dataset mock.
   - Line 388: `const availableDatasets = remoteDatasets.length > 0 ? remoteDatasets : fallbackDatasets;` - Renders mock datasets if API is slow or unauthenticated.
4. [authSlice.ts](file:///c:/Users/Nabil/Desktop/DataScope/src/store/slices/authSlice.ts#L15)
   - Lines 15, 25: Initial Redux mock identities (`Elena Rostova`, `Marcus Vance`).
5. [role-banner.tsx](file:///c:/Users/Nabil/Desktop/DataScope/src/components/layout/role-banner.tsx)
   - Interactive client-side role toggle button allowing unauthenticated role elevation directly in the browser DOM.

---

## 3. API Route Handlers Security & Authorization Matrix

A complete inspection of all 24 route handlers in `src/app/api/` was conducted to evaluate:
- Session verification (JWT / NextAuth session check).
- Role verification (admin / analyst / viewer).
- Dataset-level permission enforcement (checking dataset authorization table).
- Zod schema input validation (rejecting unknown fields, capping page size at 100, capping filters at 10, string length limits).
- Unauthenticated mock identity fallbacks.

| Route File | HTTP Methods | Checks Session | Checks Role | Dataset-Level Perms | Zod Validation | Mock Fallback Present | Security Finding |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `src/app/api/ai/search-assistant/route.ts` | POST | No | No | No | No | No | Critical: Open endpoint, no auth or role check. Arbitrary prompts accepted without Zod validation. |
| `src/app/api/audit-logs/route.ts` | GET, POST | Yes | Yes | No | Yes | Yes (Elena Rostova) | Vulnerable: Falls back to 'usr-admin-01' and 'Elena Rostova' if auth token is absent. |
| `src/app/api/auth/firebase/route.ts` | POST | No | Yes | No | No | No | High: Accepts client UID and role without server-side Firebase Admin SDK token verification. |
| `src/app/api/auth/login/route.ts` | POST | No | No | No | No | No | Standard public login endpoint; lacks Zod validation on email/password. |
| `src/app/api/auth/logout/route.ts` | POST | No | No | No | No | No | Public token clearing route. |
| `src/app/api/auth/me/route.ts` | GET | Yes | No | No | No | No | Reads token payload; no database re-verification of user status. |
| `src/app/api/auth/register/route.ts` | POST | No | Yes | No | Yes | No | Uses Zod schema for registration; allows self-assigned roles without admin authorization. |
| `src/app/api/auth/switch-role/route.ts` | POST | No | Yes | No | No | Yes (Mock Tokens) | Critical: Generates signed JWT for any requested role without verifying requester identity. |
| `src/app/api/benchmark/route.ts` | GET | No | No | No | No | No | Open read-only benchmark endpoint; no session check. |
| `src/app/api/data-lineage/route.ts` | GET | No | No | No | No | No | Open endpoint; returns dataset topology without authorization. |
| `src/app/api/data-quality/route.ts` | GET, PATCH | Yes | Yes | No | No | Yes (Elena Rostova) | Patch action updates quality issues with mock fallback user name. |
| `src/app/api/datasets/route.ts` | GET, POST | Yes | Yes | Yes (static) | Yes (POST) | Yes (Admin Default) | Critical: GET defaults unauthenticated requests to `admin` role (line 15). Checks static column rather than permissions table. |
| `src/app/api/datasets/[id]/analytics/route.ts` | GET | No | No | No | Yes | No | Critical: Bypasses authentication completely; any client can fetch dataset analytics. |
| `src/app/api/datasets/[id]/export/route.ts` | POST, GET | Yes | Yes | No | No | Yes (usr-analyst-01) | Vulnerable: Verifies export permission but does not verify dataset-level access permissions. |
| `src/app/api/datasets/[id]/records/route.ts` | POST | Yes | Yes | Yes (static) | No | No | High: Static map `datasetAccessLevels` used instead of `access_permissions` table. Missing Zod validation on filters/pageSize. |
| `src/app/api/datasets/[id]/records/[recordId]/comments/route.ts` | GET, POST | Yes | Yes | No | No | Yes (Elena Rostova) | Vulnerable: Falls back to 'Elena Rostova' for comments if token absent. No dataset check. |
| `src/app/api/datasets/[id]/records/[recordId]/route.ts` | GET, PATCH | Yes | Yes | No | Yes | Yes (Elena Rostova) | Vulnerable: PATCH falls back to 'Elena Rostova'. No dataset ownership/permission check. |
| `src/app/api/datasets/[id]/route.ts` | GET, PATCH, DELETE | Yes | Yes | Yes (static) | Yes | Yes (Elena Rostova) | PATCH/DELETE checks role === 'admin' but actor name falls back to static mock user. |
| `src/app/api/health/route.ts` | GET | No | No | No | No | No | Standard public health check; measures live DB latency. |
| `src/app/api/performance/route.ts` | GET, DELETE | No | No | No | No | No | Critical: Open endpoint; allows unauthenticated clients to wipe performance logs via DELETE. |
| `src/app/api/saved-views/route.ts` | GET, POST | Yes | Yes | No | Yes | Yes (Marcus Vance) | Vulnerable: POST falls back to 'usr-analyst-01' and 'Marcus Vance'. No dataset permission check. |
| `src/app/api/saved-views/[id]/route.ts` | DELETE, PATCH | Yes | Yes | No | Yes | Yes (usr-analyst-01) | Vulnerable: Any authenticated user can modify views; no ownership check against view.user_id. |
| `src/app/api/search-history/route.ts` | GET, POST | Yes | No | No | Yes | Yes (usr-analyst-01) | Vulnerable: Returns search history using mock user fallback if unauthenticated. |
| `src/app/api/users/route.ts` | GET, PATCH | Yes | Yes | No | No | Yes (Elena Rostova) | Admin role check implemented; actor audit logging falls back to Elena Rostova. |

### 3.1 Key Vulnerabilities Identified
1. **Missing Global Middleware**: No `middleware.ts` exists in the repository. Unauthenticated HTTP requests directly hit `/dashboard/*` and `/api/*` endpoints.
2. **Client-Side Role Switching**: The endpoint `/api/auth/switch-role` mints valid JWTs for arbitrary roles upon client request without verifying admin authorization.
3. **Absence of Centralized `authorize()` Guard**: Each route attempts ad-hoc token extraction. When tokens are missing or invalid, several routes fall back to administrative mock identities (`usr-admin-01` / `Elena Rostova`).
4. **Hardcoded Dataset Access Mapping**: Dataset permission is verified against a hardcoded in-memory Map or the `datasets.access_level` column rather than an explicit `access_permissions` table.

---

## 4. Database & ORM Architecture (Dual-ORM Analysis)

The project currently maintains both **Drizzle ORM** and **Prisma ORM** simultaneously, introducing dependency bloat, divergent schema definitions, and runtime synchronization hazards.

### 4.1 Dependency Status
- `@prisma/client`: `5.22.0` (installed in `package.json`).
- `prisma`: `5.22.0` (installed as root dependency).
- `drizzle-orm`: `^0.36.1` (installed in `package.json`).
- `drizzle-kit`: Not installed in `dependencies` or `devDependencies`.
- `pg`: `^8.13.1` (used by raw SQL client pools).

### 4.2 Schema Divergence
1. **Prisma Schema (`prisma/schema.prisma`)**:
   - Contains definitions for 13 models: `User`, `UserPreference`, `Dataset`, `DatasetField`, `DatasetRecord`, `RecordRelationship`, `RecordHistory`, `SavedView`, `SearchHistory`, `AuditLog`, `DataQualityIssue`, `RecordComment`, `QueryPerformanceLog`.
   - Lacks an explicit `AccessPermission` model.
   - Lacks an explicit `Role` model (roles are stored as strings).
   - Lacks `ExportJob` model.
2. **Drizzle Schema (`src/lib/db/schema.ts` / `drizzle/schema.ts`)**:
   - Defines tables using `pgTable`: `users`, `userPreferences`, `datasets`, `datasetFields`, `datasetRecords`, `recordRelationships`, `recordHistory`, `savedViews`, `searchHistory`, `exportJobs`, `queryPerformanceLogs`, `auditLogs`, `recordComments`, `dataQualityIssues`.
   - Lacks `roles` table (required by Phase 2).
   - Lacks `access_permissions` table (required by Phase 1 and Phase 2).
   - Table `query_performance_logs` diverges from the required `query_metrics` entity name.

### 4.3 Raw SQL vs ORM Usage
The core query execution path in [search-engine.ts](file:///c:/Users/Nabil/Desktop/DataScope/src/lib/search/search-engine.ts) and [db/index.ts](file:///c:/Users/Nabil/Desktop/DataScope/src/lib/db/index.ts) bypasses both Drizzle and Prisma, executing raw string-concatenated SQL queries via `pg.Pool`. While parameterized in parts, this leaves Drizzle underutilized as the primary ORM.

---

## 5. Database Indexes & Search Architecture

Current database indexes inspected from `drizzle/migrations/0000_initial_schema.sql` and the remote Neon PostgreSQL instance:

### 5.1 Existing Indexes
```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS btree_gin;

CREATE INDEX idx_records_dataset_date ON dataset_records (dataset_id, record_date DESC);
CREATE INDEX idx_records_composite_filter ON dataset_records (dataset_id, status, country, numeric_value);
CREATE INDEX idx_records_trgm_title ON dataset_records USING gin (title gin_trgm_ops);
CREATE INDEX idx_records_fts ON dataset_records USING gin (to_tsvector('english', title || ' ' || category || ' ' || country || ' ' || record_key));
CREATE INDEX idx_records_record_key ON dataset_records (record_key);
CREATE INDEX idx_saved_views_dataset ON saved_views (dataset_id);
CREATE INDEX idx_saved_views_user ON saved_views (user_id);
CREATE INDEX idx_search_hist_user ON search_history (user_id, dataset_id);
CREATE INDEX idx_perf_logs_created ON query_performance_logs (created_at DESC);
CREATE INDEX idx_audit_logs_created ON audit_logs (created_at DESC);
CREATE INDEX idx_quality_issues_dataset ON data_quality_issues (dataset_id);
```

### 5.2 Deficiencies vs Phase 3 Specification
1. **Missing Generated `tsvector` Stored Column**: The current full-text index `idx_records_fts` is an expression index computed on `to_tsvector('english', ...)`. Phase 3 requires a generated `tsvector` column on `dataset_records` with a direct GIN index for faster updates and predictable planner cost estimation.
2. **Missing Keyset Cursor Index**: Keyset pagination requires a deterministic compound index on `(dataset_id, record_date DESC, id DESC)`. The current index `(dataset_id, record_date DESC)` causes secondary file sorts when tiebreaking on `id`.
3. **Missing Specific Composite Indexes**: Filtering on `(dataset_id, status, country, created_at DESC)` and `(dataset_id, numeric_value)` are not indexed cleanly for range scans with date ordering.
4. **Pagination Implementation**: [search-engine.ts](file:///c:/Users/Nabil/Desktop/DataScope/src/lib/search/search-engine.ts) relies exclusively on `LIMIT $n OFFSET $m`. At high offsets (e.g., page 5,000 on 1M rows), PostgreSQL must scan and discard all preceding rows. Keyset cursor pagination must be implemented as the default forward/backward pagination mechanism.

---

## 6. Cache Implementation Analysis

The current cache is implemented in [lru-cache.ts](file:///c:/Users/Nabil/Desktop/DataScope/src/lib/cache/lru-cache.ts) as an in-memory `Map` with a maximum item limit of 1,000 entries and a 60-second TTL.

### 6.1 Limitations in Serverless Architecture
1. **Instance Isolation**: On Vercel, requests are distributed across distinct serverless Lambda micro-containers in `iad1`. Each container runs an isolated JavaScript heap. A cache entry created in Lambda A is completely invisible to Lambda B.
2. **Container Lifecycle**: Serverless instances terminate after idle periods. In-memory cache hit rates drop to near-zero during intermittent traffic spikes or cold invocations.
3. **Invalidation Inconsistency**: Calling `invalidateDataset(datasetId)` on one serverless instance invalidates only that single container's memory map, leading to stale reads across other active lambdas.
4. **Lack of Dataset Versioning**: The cache keys are formatted as `query:${datasetId}:${hash}`. They lack dataset schema/data version numbers, preventing instant cluster-wide invalidation upon write operations.

### 6.2 Required Architecture (Phase 4)
- Shared external cache (Upstash Redis or Vercel KV via REST API).
- Key format: `hash(datasetId + normalized query + dataset version)`.
- Invalidation via atomic counter increment on `dataset_version`.

---

## 7. Missing Deliverables vs. Full Specification

A systematic review of the 10 project phases identifies the following pending deliverables:

| Phase | Required Deliverable | Current State | Missing Items |
| :--- | :--- | :--- | :--- |
| **Phase 0** | AUDIT.md Report | Not committed | Complete this document and commit. |
| **Phase 1** | NextAuth with Credentials & JWT | Custom JOSE JWT | Install NextAuth, build `/login` and `/register` with credentials provider, implement `middleware.ts`, delete client role switcher, build `authorize()` guard, create `access_permissions` table, write Viewer 403 test. |
| **Phase 2** | Drizzle ORM Single Standard | Dual ORM (Prisma + Drizzle) | Remove `@prisma/client`, `prisma`, and `prisma/`. Add `drizzle-kit`. Add `roles`, `access_permissions`, `query_metrics` tables. Create idempotent seed script with 1M rows option using batched COPY/inserts. |
| **Phase 3** | Search & Indexing Upgrades | Expression GIN, Offset paging | Add generated `tsvector` column with GIN index; add `(dataset_id, status, country, created_at DESC)` and keyset compound index; implement cursor pagination; generate EXPLAIN ANALYZE BUFFERS for 5 queries at 120k and 1M rows into `docs/query-plans/`; write FTS vs Trigram vs Elasticsearch ADR. |
| **Phase 4** | Latency & Shared Caching | In-memory LRU, ~220ms DB WAN | Replace LRU with shared Upstash Redis / KV cache; log all queries to `query_metrics`; enforce Performance Monitor reads exclusively from `query_metrics`. |
| **Phase 5** | Frontend Data Fetching & Sync | Redux + partial RTK Query | Sync filters/sort/page/columns with URL `searchParams` for back/forward navigation; ensure Server Components load initial state; enforce 300ms debounce and AbortController cancellation; implement TanStack Table + Virtualization with memoized rows. |
| **Phase 6** | Feature Completion | Incomplete AI and Export | Stream cursor-based CSV export from server; add background job for >50k rows; implement AI NLQ with Zod validation and strict operator allowlist; verify Saved Views and Analytics SQL aggregations. |
| **Phase 7** | Tests & CI Configuration | Basic Vitest tests | Vitest unit tests, integration tests against real Postgres, API permission tests, 3 Playwright e2e flows, GitHub Actions CI workflow (lint, typecheck, test, build), Dockerfile + docker-compose, `.env.example`. |
| **Phase 8** | Real Performance Report | Static marketing claims | Execute k6 load tests on deployed URL at 120k and 1M rows; generate `docs/performance-report.md`; remove all false claims ("0.8ms", "4.2ms", "Isolated Dedicated Node") from UI and docs. |
| **Phase 9** | Documentation & ADRs | Partial README | Standardize >=8 ADRs in `docs/adr/` with 8 required sections; add Mermaid diagrams (frontend, data fetching, search, ER); OpenAPI specification. |
| **Phase 10**| Final Verification | Pending completion | Verify desktop and 390px mobile viewport across all 3 roles; confirm unauthenticated `/dashboard` redirect; map spec sections 1-21 in completion checklist. |

---

## 8. Remediation Plan

Remediation will proceed in strict chronological sequence:
1. **Phase 0 Completion**: Commit `AUDIT.md` to repository.
2. **Phase 1 Execution**: Implement NextAuth credentials provider, `middleware.ts`, centralized `authorize()` helper, `access_permissions` table, and write automated test proving 403 authorization denial for Viewers.
3. **Phase 2 Execution**: Completely remove Prisma, standardize on Drizzle ORM, update schema for all required entities, and upgrade `scripts/seed.ts` for 120k and 1M row generation.
4. **Subsequent Phases**: Execute Phases 3 through 10 in accordance with the specification.

