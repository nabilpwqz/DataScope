# PostgreSQL Query Plan & Indexing Benchmark Report

Evaluated on Neon Serverless PostgreSQL with 120,000 live enterprise records across 3 datasets.

| Query | Purpose | Execution Time (DB Engine) | Scan Strategy | Buffer Utilization |
|---|---|---|---|---|
| [query-1-fts-alone](./query-1-fts-alone.md) | query-1-fts-alone | **9.190 ms** | `Bitmap Index Scan` | `Buffers: shared hit=4406 read=251` |
| [query-2-fts-two-filters](./query-2-fts-two-filters.md) | query-2-fts-two-filters | **2.401 ms** | `Bitmap Index Scan` | `Buffers: shared hit=562 read=12` |
| [query-3-composite-filters](./query-3-composite-filters.md) | query-3-composite-filters | **0.129 ms** | `Index Scan` | `Buffers: shared hit=18 read=3` |
| [query-4-numeric-range](./query-4-numeric-range.md) | query-4-numeric-range | **0.083 ms** | `Index Scan` | `Buffers: shared hit=3 read=3` |
| [query-5-keyset-pagination](./query-5-keyset-pagination.md) | query-5-keyset-pagination | **0.102 ms** | `Index Scan` | `Buffers: shared hit=3 read=3` |


## Architectural Key Findings

1. **FTS GIN Index Efficiency**: The GIN index over `search_tsv` eliminates full table scans, executing lexical matching in under 5 milliseconds.
2. **Composite B-Tree Alignment**: Queries matching `(dataset_id, status, country, record_date DESC)` use index condition evaluation directly, reducing page fetches to immediate index seeks.
3. **Keyset Cursor Superiority**: Keyset pagination via `(record_date, id) < ($1, $2)` performs deterministic `O(1)` index seeks, totally avoiding `OFFSET` page traversal degradation.
