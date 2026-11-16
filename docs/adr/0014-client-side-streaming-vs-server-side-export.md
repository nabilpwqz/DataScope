# ADR-0014: Client-Side Streaming vs Server-Side Data Export Architecture

## Status
Accepted

## Context
Exporting large query result sets to CSV or JSON can cause buffer overflows if formatted entirely in server RAM.

## Decision
Implement dual-mode export architecture based on result volume:
1. Page-level export (< 1,000 rows): Handled client-side from existing Redux cache using RFC 4180 CSV serializer.
2. Bulk dataset export (10,000+ rows): Handled via server-side streaming cursor (GET /api/datasets/[id]/export) piping database rows directly into the HTTP response stream with Content-Disposition headers.

## Consequences
- Instant export for filtered table views with zero network overhead.
- Constant server memory usage during multi-megabyte bulk exports.
- Browser receives streaming chunks without socket timeout disconnects.
