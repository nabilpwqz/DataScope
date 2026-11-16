# Multi-Tenant Partitioning and Security Isolation

## Isolation Architecture
1. **Row-Level Security**: Every record contains an immutable `dataset_id` reference.
2. **Access Permissions Enforcement**: Server-side SQL queries mandate `INNER JOIN access_permissions` or explicit `WHERE dataset_id = $1` scopes.
3. **Cross-Tenant Prevention**: Users cannot query or join records outside their explicitly assigned dataset permissions.
