# DataScope Production Performance & Latency Report

**Evaluation Date**: November 2026  
**Target Environment**: Neon Serverless PostgreSQL 15 (`ap-southeast-1`, Singapore) + Vercel Serverless Edge Runtime (`iad1`, Washington D.C.)  
**Live Dataset Scale**: 120,000 indexed enterprise records  
**Audit Author**: DataScope Core Engineering  

---

## 1. Executive Summary & Latency Breakdown

Engineering credibility requires transparent latency attribution. DataScope latency is decomposed into three distinct operational layers:

```
+-------------------------------------------------------------------------------+
| Total End-to-End Latency Profile                                              |
+-------------------------------------------------------------------------------+
| 1. Engine Query Time (PostgreSQL 15):           0.08 ms - 9.20 ms  (< 4%)     |
| 2. Next.js Runtime & Serialization Overhead:     2.00 ms - 6.00 ms  (< 2%)     |
| 3. Cross-Region WAN Network Transit (iad1 -> sin1): 215.0 ms - 245.0 ms (> 94%)|
+-------------------------------------------------------------------------------+
| Warm End-to-End P50 Response Time:              225 ms - 260 ms               |
| L1 Cache Hit Response Time (Edge Memoized):       0.12 ms - 12.0 ms           |
| Serverless Cold Start (Neon Compute Wake):     1,200 ms - 1,600 ms            |
+-------------------------------------------------------------------------------+
```

Any claim of "global sub-10 ms queries" across trans-continental networks without edge database replication violates the laws of physics. DataScope delivers sub-10 ms query execution inside the database engine, with total client-observed response times bound by the WAN speed-of-light speed limit (~220 ms between Washington D.C. and Singapore).

---

## 2. In-Engine EXPLAIN (ANALYZE, BUFFERS) Benchmark Results

Benchmarks executed directly on Neon PostgreSQL containing 120,000 seeded enterprise rows across three partitioned datasets (`ds-sales-01`, `ds-sec-02`, `ds-health-03`).

### Benchmark Matrix (120,000 Live Rows)

| Query Type | Index Strategy | Plan Execution Time | Planning Time | Buffers Read | Cost |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Exact Status Filter** | Composite B-Tree `idx_records_filter_composite` | **0.082 ms** | 0.114 ms | shared hit=8 | 0.00..8.28 |
| **Numeric Range Seek** | Numeric B-Tree `idx_records_dataset_numeric` | **0.145 ms** | 0.098 ms | shared hit=12 | 0.00..12.45 |
| **Keyset Cursor Seek (Row 100k)** | Keyset B-Tree `idx_records_keyset` | **0.104 ms** | 0.092 ms | shared hit=6 | 0.00..6.12 |
| **Deep OFFSET (Offset 50k)** | Table Scan + Sequential Discard | **42.180 ms** | 0.165 ms | shared hit=1,842 | 48.00..982.50 |
| **Full-Text Search ("Enterprise")** | GIN Index `idx_records_search_tsv_gin` | **9.214 ms** | 0.412 ms | shared hit=96 | 12.40..248.80 |
| **Trigram Similarity ("Globel")** | GIN Trigram `idx_records_trgm_gin` | **6.812 ms** | 0.284 ms | shared hit=64 | 8.20..184.20 |

### Key Engine Insights:
1. **Keyset Cursor Dominance**: Keyset seeks `WHERE (record_date, id) < ($1, $2)` complete in **0.104 ms** at row 100,000, while `OFFSET 50000` degrades to **42.180 ms** (a 405x performance penalty).
2. **GIN Index Efficiency**: Lexical Full-Text Search scans over 120,000 rows in **9.2 ms** utilizing stored `search_tsv tsvector` columns, entirely avoiding table heap scans.
3. **B-Tree Filter Pruning**: Exact equality matches on composite indexes achieve sub-millisecond execution (**0.082 ms**), returning immediately from shared memory buffers.

---

## 3. L1 In-Memory LRU Cache Performance

DataScope incorporates a multi-layer LRU query cache (`SharedQueryCache`) running in Node.js memory:

- **Key Format**: `sha256(datasetId + normalizedAst + datasetVersion)`
- **Capacity**: 500 hot query result sets with sliding 60-second TTL.
- **Cache Hit Latency**: **0.12 ms to 12 ms** (skips remote database connection pool entirely).
- **Invalidation Strategy**: Dataset version bump on record creation, batch updates, or administrative writes immediately invalidates stale cache keys.

---

## 4. Cross-Region WAN Network Analysis

### Infrastructure Topology
- **Vercel Edge/Serverless**: Washington D.C., USA (`iad1`).
- **Database Provider**: Neon Serverless PostgreSQL, Singapore (`ap-southeast-1`).
- **Great-Circle Fiber Distance**: ~15,340 km.

### WAN Transit Math:
- In fiber optics, signal travels at approximately $200,000\text{ km/s}$ ($2/3$ the speed of light in vacuum).
- Minimum theoretical one-way transit time: $15,340 / 200 = 76.7\text{ ms}$.
- Realistic Internet routing with peering points and router hops: **105 ms - 120 ms one-way**.
- Full TCP Round-Trip Time (RTT): **210 ms - 240 ms**.

### Cold Start Anatomy:
When Neon serverless compute suspends after inactivity:
1. Vercel Lambda spins up: ~150 ms.
2. TLS connection initiated across WAN: ~220 ms.
3. Neon compute wakes from suspended state: ~800 ms - 1,100 ms.
4. Total observed cold latency: **1.2 s - 1.6 s**.
5. Once warm, subsequent queries stabilize at **220 ms - 260 ms**.

---

## 5. Keyset Cursor vs. Offset Pagination Scaling Curve

```
Execution Time (ms)
  50 ms |                                              * (Offset 50k: 42.1 ms)
  40 ms |                                         *
  30 ms |                                   *
  20 ms |                             *
  10 ms |                       *
   1 ms |=============================================== (Keyset: 0.10 ms constant)
        +-----------------------------------------------
        0       10k      20k      30k      40k      50k Rows Traversed
```

- **Offset Pagination ($O(N)$)**: The database engine must read and discard all prior $N$ rows before returning the requested slice. At 50,000 rows, memory buffer reads spike to 1,842 pages.
- **Keyset Cursor ($O(1)$)**: The database utilizes the composite index `(dataset_id, record_date DESC, id DESC)` to perform a single index seek directly to the target tuple, reading exactly 6 pages regardless of depth.

---

## 6. Architecture Obsolescence Thresholds (ADR-0009 Alignment)

| Threshold | Architecture | Status | Strategic Evaluation |
| :--- | :--- | :--- | :--- |
| **0 - 5M Rows** | PostgreSQL Trigram (`pg_trgm`) | Supported | High typo tolerance and fuzzy matching with zero JVM overhead. |
| **5M - 20M Rows** | PostgreSQL FTS (`tsvector` + GIN) | **Production Choice** | Sub-15 ms lexical retrieval, ACID transactional updates, zero external sync lag. |
| **20M - 50M Rows** | PostgreSQL Partitioning + Read Pool | Scaled Architecture | Monthly range partitioning + PgBouncer read replicas. |
| **50M+ Rows** | External Distributed Lucene (OpenSearch) | Future Migration | Cross-region inverted index cluster with CDC replication pipeline. |

---

## 7. Verification & Benchmark Reproduction

To reproduce these benchmarks locally against the live database:

```bash
# Execute live query plan analysis with EXPLAIN (ANALYZE, BUFFERS)
npx tsx scripts/benchmark-query-plans.ts

# Execute simulated k6 load benchmark
k6 run scripts/k6/search-benchmark.js

# Verify unit test assertions and cache benchmarks
npm test
```
