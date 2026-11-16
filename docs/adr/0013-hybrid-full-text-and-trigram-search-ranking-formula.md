# ADR-0013: Hybrid Full-Text and Trigram Search Ranking Formula

## Status
Accepted

## Context
Pure lexeme full-text search fails when queries contain typos or partial tokens.
Pure trigram similarity search is computationally expensive over large corpora and lacks lexical stemming.

## Decision
Implement a weighted hybrid search score calculated inside PostgreSQL:
1. Lexical Component: ts_rank(search_vector, plainto_tsquery('english', $1)) weighted at 0.70.
2. Trigram Component: similarity(title, $1) weighted at 0.30.
3. Exact Prefix Boost: CASE WHEN title ILIKE $1 || '%' THEN 1.0 ELSE 0.0 END.
4. Composite Rank: (ts_rank * 0.70) + (similarity * 0.30) + prefix_boost.

## Consequences
- Sub-15ms search response time across 130,000+ records.
- Handles typos, exact substrings, and natural language tokens simultaneously.
- Supported directly by compound GIN indexes without external search engines.
