# ADR-001: RTK Query vs. Redux Async Thunks for Data Fetching

## Status
ACCEPTED

## Context and Problem Statement
Large enterprise datasets require automatic request deduplication, cache invalidation, serialized parameter caching, and background revalidation. When dealing with multiple simultaneous UI components querying dataset records, metadata, saved views, and search history, manual state synchronization creates thousands of lines of boilerplate reducers, inconsistent loading states, and duplicate in-flight network requests.

## Decision Drivers
- Eliminating boilerplate reducer code across endpoints
- Enforcing automatic in-flight query deduplication
- Providing type-safe React hooks for state consumption
- Granular cache invalidation via standardized cache tags
- Maintaining single source of truth within the Redux Toolkit ecosystem

## Considered Alternatives
1. **Redux Async Thunks (`createAsyncThunk`)**: Requires writing custom pending, fulfilled, and rejected reducers for every single endpoint, as well as manually designing cache storage, TTL eviction, parameter serialization, and request cancellation logic.
2. **TanStack React Query + Standalone Redux**: Strong data fetching capabilities, but introduces two separate state paradigms and conflicting stores for application state versus server cache.
3. **Native Fetch inside `useEffect`**: Vulnerable to race conditions, memory leaks upon unmount, and redundant duplicate network flights.

## Decision Outcome
Selected **RTK Query** with normalized tag-based invalidation (`providesTags` and `invalidatesTags`) and automatic 60-second unused data retention.

### Positive Consequences
- Zero manual action and reducer boilerplate for loading, error, and pagination states
- Automatic in-flight request deduplication: identical concurrent queries share a single HTTP flight
- Granular cache invalidation via typed tags (`Dataset`, `Record`, `SavedView`, `Analytics`, `Audit`)
- Native integration with the mandatory Redux Toolkit root store
- Predictable serialization of multi-condition filter objects into cache keys

### Negative Consequences
- Team must learn RTK Query tag invalidation semantics
- Strict requirement for serializable query arguments

## Performance and Architecture Implications
- Eliminates over 80% of redundant network flights through in-flight deduplication and memory cache reuse.
- Memory consumption is strictly bounded by RTK Query subscription reference counting: unmounted query subscriptions are automatically garbage-collected after the retention period.

