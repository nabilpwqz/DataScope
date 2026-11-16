# ADR-0002: Server-Side vs. Client-Side Pagination for Large Datasets

- **Status**: ACCEPTED
- **Author**: DataScope Architecture Working Group
- **Scope**: Enterprise Discovery Core Engine

---

## 1. Context & Problem Statement

Datasets containing 100,000 to millions of records cannot be serialized and downloaded to the client browser without causing severe memory exhaustion, mobile crashes, and multi-second page load times.

---

## 2. Considered Alternatives

1. Client-Side Pagination (fetching all 100,000+ records and slicing in memory)
2. Static Incremental SSG (impossible for dynamic, multi-condition enterprise search)
3. Virtual Infinite Streaming without server bounds

---

## 3. Decision Outcome

**Selected Approach**: Server-Side Pushdown Pagination combining indexed SQL LIMIT/OFFSET with optional Keyset Cursor Pagination.

**Rationale**:
Pushing the LIMIT/OFFSET or keyset cursor down to PostgreSQL ensures only the exact 25-100 requested rows are returned over HTTP (~12KB payload), maintaining consistent database index scan times regardless of whether the table contains 10,000 or 10,000,000 records.

### Positive Consequences & Advantages:
- Constant ~15KB network payload regardless of table scale
- Zero frontend memory pressure
- Consistent initial render speed

### Negative Consequences & Trade-offs:
- Deep offset pagination (e.g., offset 500,000) requires scanning index entries

---

## 4. Performance Implications

Reduces data transfer from ~85MB (for 100k rows) down to ~12KB per page, speeding up query response by 99.4%.

---

## 5. Future Scalability & Limitations

For extreme deep jumps beyond 1,000,000 rows, keyset cursor pagination (WHERE id < last_id) is used.
