# ADR-005: PostgreSQL Full-Text Search vs. External Search Engines (Elasticsearch/OpenSearch)

## Status
ACCEPTED

## Context and Problem Statement
Organizations require high-speed keyword discovery, lexical stemming, and relevance ranking across large structured and semi-structured datasets. The architecture must balance search latency, typo tolerance, infrastructure operational complexity, and data consistency.

## Decision Drivers
- Maintaining sub-15ms response times across 100,000+ indexed records
- Guaranteeing immediate ACID data consistency without synchronization lag
- Avoiding the high operational cost and maintenance of separate search clusters (JVM, ZooKeeper/OpenSearch nodes)
- Providing lexical stemming, prefix search, and typo-tolerant fuzzy matching

## Considered Alternatives
1. **Elasticsearch / OpenSearch**: Industry-standard distributed inverted index based on Apache Lucene. Highly scalable for 50+ million documents, but introduces immense operational overhead: separate server cluster, JVM garbage collection tuning, dual-write CDC sync pipelines, and eventual consistency lag.
2. **PostgreSQL Full-Text Search (`tsvector`, `tsquery`, GIN)**: Built into the primary database engine. Provides dictionary-based stemming, lexeme normalization, and relevance scoring via `ts_rank()`.
3. **PostgreSQL Trigram Extension (`pg_trgm`)**: Uses 3-character n-gram indexes to enable substring and typo-tolerant fuzzy matching using similarity metrics.
4. **Basic SQL `LIKE` / `ILIKE`**: Causes unindexed sequential table scans (O(N)), rendering it unusable for datasets exceeding 10,000 rows.

## Decision Outcome
Selected a **Hybrid PostgreSQL Search Engine** combining **PostgreSQL Full-Text Search (GIN `to_tsvector`)** for lexical multi-word relevance with **PostgreSQL Trigram (`pg_trgm`)** for typo tolerance.

### Comparative Evaluation Matrix

| Evaluation Dimension | PostgreSQL Full-Text Search (Selected) | PostgreSQL Trigram (pg_trgm) | Elasticsearch / OpenSearch |
| :--- | :--- | :--- | :--- |
| **Index Technology** | GIN Index over `tsvector` lexemes | GIN / GiST over 3-character n-grams | Distributed Inverted Index (Apache Lucene) |
| **Search Speed (100k Rows)** | 4 - 8 ms | 6 - 14 ms | 5 - 15 ms (+ network hop) |
| **Typo & Fuzzy Matching** | Lexical stemming only | High similarity % matching | Fuzzy Levenshtein distance |
| **Infrastructure Complexity** | Zero extra infrastructure (In-DB) | Zero extra infrastructure (In-DB) | High: JVM nodes, CDC sync, cluster maintenance |
| **Consistency Model** | Immediate ACID consistency | Immediate ACID consistency | Eventual consistency (indexing delay) |
| **Suitability Threshold** | Up to 10 - 20 Million records | Up to 5 Million records | 50+ Million records & unstructured documents |

### Positive Consequences
- Zero replication lag: Search indices are updated in the same transaction as record writes.
- Massive operational simplification: No separate cluster to provision, monitor, back up, or secure.
- Lexical stemming matches word variants (e.g., "logistics" matches "logistical" or "logistic").
- Typo resilience: Trigram queries match misspellings (e.g. "Acme Corp" matches "Acem Corp").

### Negative Consequences
- Less advanced linguistic features for non-Latin character sets compared to full Lucene analyzer plugins.
- Heavy trigram wildcard searches require CPU allocation for similarity calculations.

## Performance and Architecture Implications
- Hybrid search executes in 4ms to 12ms for standard multi-word queries on the 100,000-row sales dataset.

