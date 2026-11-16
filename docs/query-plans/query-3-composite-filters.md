# Query 3: Multi-Column Composite Filter (dataset_id, status, country, record_date DESC)

## Executed Query
```sql
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
            SELECT id, record_key, title, status, country, numeric_value, record_date
            FROM dataset_records
            WHERE dataset_id = 'ds-sales-01'
              AND status = 'Active'
              AND country = 'Germany'
            ORDER BY record_date DESC
            LIMIT 25;
```

## Raw EXPLAIN (ANALYZE, BUFFERS) Execution Plan
```text
Limit  (cost=0.42..33.26 rows=25 width=97) (actual time=0.070..0.104 rows=25.00 loops=1)
  Output: id, record_key, title, status, country, numeric_value, record_date
  Buffers: shared hit=18 read=3
  ->  Index Scan using idx_records_filter_composite on public.dataset_records  (cost=0.42..9774.34 rows=7441 width=97) (actual time=0.069..0.101 rows=25.00 loops=1)
        Output: id, record_key, title, status, country, numeric_value, record_date
        Index Cond: ((dataset_records.dataset_id = 'ds-sales-01'::text) AND (dataset_records.status = 'Active'::text) AND (dataset_records.country = 'Germany'::text))
        Index Searches: 1
        Buffers: shared hit=18 read=3
Query Identifier: -4090552820788889613
Planning Time: 0.177 ms
Execution Time: 0.129 ms
```
