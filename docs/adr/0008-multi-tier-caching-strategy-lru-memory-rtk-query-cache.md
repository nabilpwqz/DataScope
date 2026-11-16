# ADR-0008: Multi-Tier Caching Strategy (LRU Memory + RTK Query Cache)

- **Status**: ACCEPTED
- **Author**: DataScope Architecture Working Group
- **Scope**: Enterprise Discovery Core Engine

---

## 1. Context & Problem Statement

Repeatedly executing identical multi-condition search queries strains database CPU and increases p95 response latency unnecessarily.

---

## 2. Considered Alternatives

1. No server caching (every query hits PostgreSQL, causing CPU spikes under concurrent user load)
2. Unbounded in-memory map (causes memory leaks as search permutations grow)
3. Client-only cache (does not benefit other analysts running identical queries)

---

## 3. Decision Outcome

**Selected Approach**: Two-tier caching: Tier 1 Client-side RTK Query cache (60s TTL, auto deduplication), and Tier 2 Server-side in-memory LRU Cache with deterministic query hashing (SHA-256).

**Rationale**:
Combining client-side request deduplication with a server-side LRU cache (500 items, 60s TTL) guarantees sub-15ms retrieval times for repeated queries while bounding server RAM.

### Positive Consequences & Advantages:
- Sub-15ms latency for cached queries
- Automatic eviction of oldest entries when cache hits maximum limit
- Automatic invalidation per dataset when records or views are modified

### Negative Consequences & Trade-offs:
- Cache invalidation discipline must be maintained on write paths

---

## 4. Performance Implications

Achieves high cache hit rates in typical enterprise discovery patterns, reducing database CPU load by over 3x.

---

## 5. Future Scalability & Limitations

In multi-instance containerized clusters, local memory cache is replaced with Redis Cluster.
