# ADR-0004: Offset Pagination vs. Keyset Cursor Pagination

- **Status**: ACCEPTED
- **Author**: DataScope Architecture Working Group
- **Scope**: Enterprise Discovery Core Engine

---

## 1. Context & Problem Statement

Users need both direct page jumps (e.g., jumping directly to page 50) and high-throughput sequential data export and infinite scrolling without offset degradation.

---

## 2. Considered Alternatives

1. Pure Offset Pagination only (slow for deep offsets like OFFSET 500000)
2. Pure Cursor Pagination only (prevents direct jump to arbitrary page numbers)

---

## 3. Decision Outcome

**Selected Approach**: Hybrid Pagination: Standard Offset pagination for UI table exploration with direct page jumping, and Keyset Cursor pagination for sequential deep traversal and bulk CSV streaming.

**Rationale**:
Business users in data explorer tables expect standard page numbers ("Jump to page 12 of 400"). At the same time, keyset cursor pagination (WHERE (record_date, id) < (cursor_date, cursor_id)) guarantees O(1) index seek performance regardless of depth.

### Positive Consequences & Advantages:
- Best of both worlds: intuitive UI navigation + O(1) deep export streaming
- No skipped or duplicated rows during cursor iteration

### Negative Consequences & Trade-offs:
- Requires maintaining two query execution paths in SearchEngine

---

## 4. Performance Implications

Cursor pagination maintains ~4ms response time even at row 100,000, avoiding the O(N) offset scan penalty.

---

## 5. Future Scalability & Limitations

Keyset cursors require a deterministic, indexed order column (such as record_date, id).
