# ADR-004: Offset Pagination vs. Keyset Cursor Pagination

## Status
ACCEPTED

## Context and Problem Statement
Analysts exploring enterprise data tables need the ability to jump directly to specific arbitrary page numbers (e.g., "Jump to page 15 of 200"). Concurrently, bulk data exports and streaming data ingestion require traversing hundreds of thousands of records without encountering SQL `OFFSET` performance degradation or row drift.

## Decision Drivers
- User interface requirement for arbitrary page jumping and explicit total page count display
- Export requirement for deterministic, high-throughput extraction of large record slices
- Eliminating row duplication and skipping during concurrent background data insertion
- Maintaining O(1) query time across all depths of sequential data extraction

## Considered Alternatives
1. **Offset Pagination Only (`LIMIT x OFFSET y`)**: Excellent for jumping to arbitrary page numbers, but exhibits O(N) performance decay on deep pages (e.g. `OFFSET 500000`), as the database engine must scan and discard all preceding index rows.
2. **Keyset Cursor Pagination Only (`WHERE (date, id) < (cursor_date, cursor_id)`)**: Guarantees O(1) constant index seeks, but prevents users from jumping directly to arbitrary pages (e.g., page 42) without traversing all intermediate records.

## Decision Outcome
Selected a **Hybrid Dual-Strategy Pagination Architecture**:
1. **Offset Pagination** is employed by default for the interactive Data Explorer table, supporting page jumps, page size adjustments (25, 50, 100), and page number inputs.
2. **Keyset Cursor Pagination** is implemented for streaming CSV exports, infinite scroll integrations, and deep ETL pipelines.

### Positive Consequences
- Optimal user experience: Analysts retain full pagination controls, jump inputs, and total page visibility in the explorer table.
- High-efficiency export streaming: Keyset cursor seeks take under 4ms even at the 100,000th row.
- Immune to pagination drift during streaming: Inserts or deletes occurring while a cursor traverses do not cause rows to be duplicated or skipped.

### Negative Consequences
- Requires maintaining two query generation paths in the core `SearchEngine` library.
- Keyset cursors require an ordered, indexed, non-null column pair (e.g., `record_date, id`).

## Performance and Architecture Implications
- Offset pagination: ~4ms for pages 1 through 50; ~25ms at offset 50,000.
- Keyset cursor pagination: constant 3ms to 5ms across all depths (up to millions of rows).
