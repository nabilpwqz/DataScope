# DataScope Data Lifecycle and Archival Policy

## Storage Tiers
- **Hot Tier (0-90 Days)**: PostgreSQL SSD storage. Instantaneous sub-15ms B-tree and GIN indexing for interactive exploratory analysis.
- **Warm Tier (91-365 Days)**: Partitioned PostgreSQL tables with compressed B-trees. Read-only querying.
- **Cold Tier (365+ Days)**: Automated export to S3/GCS Parquet columnar archives for historical compliance and audit logging.

## Deletion Governance
Hard deletes are prohibited on transactional tables. Soft delete flags (`status = 'Archived'`) ensure complete audit traceability.
