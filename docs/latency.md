# DataScope Latency Architecture & Cross-Region WAN Analysis

## Executive Summary

DataScope operates across a distributed multi-cloud environment:
- **Application Layer**: Vercel Serverless Edge/Node.js Functions deployed in region `iad1` (Washington, D.C., USA East).
- **Primary Data Layer**: Neon Serverless PostgreSQL Cluster deployed in region `ap-southeast-1` (Singapore, AWS Asia Pacific).

This document establishes the empirical latency profile of the platform, separating physical trans-oceanic network propagation delay from internal database execution and edge cache retrieval.

---

## Latency Profiles by Execution Tier

| Tier | Measured Latency | Boundary Condition | Physical / Technical Driver |
|---|---|---|---|
| **Cold Compute Wake** | 1,200 ms - 1,600 ms | Cold Neon compute resumption | PostgreSQL container resume + TLS handshake + TCP 3-way handshake across WAN |
| **Warm WAN Database Round-Trip** | 220 ms - 280 ms | Warm DB connection, remote query | Trans-Pacific fiber optic propagation (Washington, D.C. to Singapore round-trip) |
| **In-Engine PostgreSQL Execution** | 0.08 ms - 9.2 ms | DB Engine Internal Scan | GIN index scan over `search_tsv` and B-tree composite index seeks |
| **Shared & In-Memory Cache Hit** | 0.4 ms - 12 ms | Repeated query, edge or local cache | Key-value retrieval in memory or edge KV, bypassing cross-region network hop |

---

## Detailed Network & Compute Diagnostics

### 1. Cross-Region Optical Transit (The WAN Speed of Light Floor)
The great-circle distance between Washington, D.C. (IAD) and Singapore (SIN) is approximately 15,500 kilometers. In telecommunications fiber optic cables (where light travels at approximately 200,000 km/s in glass), the theoretical minimum one-way transit time is ~77 ms, resulting in a physical minimum theoretical round-trip time (RTT) of ~155 ms. 

With standard router hops, BGP peering transit points, and submarine cable landings (Pacific and Indian Ocean routes), the real-world measured WAN RTT floor between AWS `us-east-1` / Vercel `iad1` and AWS `ap-southeast-1` sits deterministically between **220 ms and 260 ms**.

### 2. Neon Serverless Compute Suspension & Resumption
Neon Serverless PostgreSQL automatically scales compute down to zero after periods of inactivity to optimize infrastructure cost. When an unauthenticated or first incoming request hits an idle endpoint:
1. Neon control plane detects incoming proxy traffic and resumes the PostgreSQL micro-VM (~500 - 800 ms).
2. The Node.js `pg` connection pool completes a fresh TCP 3-way handshake over WAN (~240 ms).
3. TLS v1.3 cryptographic negotiation completes (~240 ms).
4. The SQL query executes inside the engine (2 - 10 ms).
5. The response payload returns to Vercel (120 ms).

Total cold-start duration: **1.2 to 1.6 seconds**. Once the connection is warm and pooled, subsequent queries execute at the steady-state WAN round-trip floor of ~230 ms.

### 3. Database Engine Execution vs. End-to-End Client Latency
Marketing claims stating "sub-10ms query discovery" refer exclusively to:
- **Warm database engine execution time**: Confirmed by `EXPLAIN (ANALYZE, BUFFERS)` showing 0.08 ms for composite index seeks and 2.4 - 9.2 ms for full-text search over 120,000 rows.
- **Cache hits**: Queries served from memory or edge key-value stores returning in under 15 ms.

DataScope explicitly distinguishes in-engine execution time from client-perceived network latency in both the user interface and documentation.

---

## Multi-Tier Mitigation Architecture

To minimize the impact of cross-region WAN propagation:
1. **Shared & Local Query Caching**: Deterministic hashing of `(datasetId + normalized query + dataset version)` stores search results for 60 seconds, eliminating database hops for repeated analyst filters.
2. **Pushdown Filtering & Pagination**: Restricting result payloads to 25-100 rows (~12 KB) ensures network transit time is dominated by latency rather than serialization bandwidth.
3. **Async Telemetry Logging**: Performance logging to `query_metrics` and `search_history` is handled asynchronously, preventing diagnostic writes from adding latency to the user query response path.
4. **Target Production Topology**: In a fully enterprise-co-located production deployment, deploying Vercel and PostgreSQL within the same AWS region (e.g. both in `us-east-1` or both in `eu-central-1`) brings total end-to-end API response latency down to 6 - 18 ms.

