# Query 1: PostgreSQL Full-Text Search (search_tsv GIN Index Scan)

## Executed Query
```sql
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
            SELECT id, record_key, title, ts_rank(search_tsv, plainto_tsquery('english', 'Robotics')) as rank
            FROM dataset_records
            WHERE dataset_id = 'ds-sales-01' AND search_tsv @@ plainto_tsquery('english', 'Robotics')
            ORDER BY rank DESC
            LIMIT 25;
```

## Raw EXPLAIN (ANALYZE, BUFFERS) Execution Plan
```text
Limit  (cost=1912.65..1912.71 rows=25 width=68) (actual time=9.142..9.146 rows=25.00 loops=1)
  Output: id, record_key, title, (ts_rank(search_tsv, '''robot'''::tsquery))
  Buffers: shared hit=4406 read=251
  ->  Sort  (cost=1912.65..1914.01 rows=546 width=68) (actual time=9.140..9.142 rows=25.00 loops=1)
        Output: id, record_key, title, (ts_rank(search_tsv, '''robot'''::tsquery))
        Sort Key: (ts_rank(dataset_records.search_tsv, '''robot'''::tsquery)) DESC
        Sort Method: top-N heapsort  Memory: 28kB
        Buffers: shared hit=4406 read=251
        ->  Bitmap Heap Scan on public.dataset_records  (cost=20.22..1897.24 rows=546 width=68) (actual time=1.629..8.143 rows=5000.00 loops=1)
              Output: id, record_key, title, ts_rank(search_tsv, '''robot'''::tsquery)
              Recheck Cond: (dataset_records.search_tsv @@ '''robot'''::tsquery)
              Filter: (dataset_records.dataset_id = 'ds-sales-01'::text)
              Heap Blocks: exact=4647
              Buffers: shared hit=4403 read=251
              ->  Bitmap Index Scan on idx_records_search_tsv_gin  (cost=0.00..20.09 rows=600 width=0) (actual time=1.098..1.098 rows=5000.00 loops=1)
                    Index Cond: (dataset_records.search_tsv @@ '''robot'''::tsquery)
                    Index Searches: 1
                    Buffers: shared hit=7
Query Identifier: -7356767137670743237
Planning:
  Buffers: shared hit=138 read=13
Planning Time: 1.156 ms
Execution Time: 9.190 ms
```
