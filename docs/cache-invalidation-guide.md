# Cache Invalidation Strategy and Tag Topology

## Cache Layers
1. **Client L1 (RTK Query)**: In-memory store keyed by serialized query parameters. `keepUnusedDataFor: 60` seconds.
2. **Server L2 (SharedQueryCache)**: Node.js memory LRU cache for identical database queries. Sub-15ms hits.

## Tag Invalidation Triggers
- Record Mutation -> `invalidatesTags: ['Record', 'Dataset']`
- Saved View Creation -> `invalidatesTags: ['SavedView']`
- Access Permission Change -> Purges cache for affected user sessions.
