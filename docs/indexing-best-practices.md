# PostgreSQL Composite Indexing Best Practices

## Column Order Principles
Composite B-tree indexes must order columns by cardinality and filter frequency:
1. **Equality Columns First**: High-frequency equality filters (e.g. `dataset_id`, `status`, `country`).
2. **Range Columns Last**: Numerical ranges or date ranges (e.g. `record_date`, `numeric_value`).

## Example Compound Index
```sql
CREATE INDEX idx_records_filter_composite
ON dataset_records (dataset_id, status, country, record_date);
```
This enables PostgreSQL to perform single-pass index scans when evaluating compound queries.
