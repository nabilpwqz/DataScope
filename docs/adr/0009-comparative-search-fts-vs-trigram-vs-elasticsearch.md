# ADR 0009: Comparative Search Architecture: PostgreSQL FTS vs. Trigram vs. Elasticsearch

## Context and Problem Statement

DataScope requires a high-performance search engine to power instant interactive discovery across enterprise datasets with 100,000+ to 1,000,000+ records. The system must support lexical searching, token matching, typo tolerance, multi-column filtering, and sub-15 millisecond query execution directly inside the relational data store without incurring severe infrastructure operational overhead.

Three primary search architectural patterns were investigated:
1. PostgreSQL Native Full-Text Search (tsvector + GIN indexing)
2. PostgreSQL Trigram Extension (pg_trgm + GIN indexing)
3. External Dedicated Search Cluster (Elasticsearch / OpenSearch via CDC pipeline)

## Comparative Decision Matrix

| Evaluation Dimension | PostgreSQL Full-Text Search (Selected) | PostgreSQL Trigram (pg_trgm) | Elasticsearch / OpenSearch |
|---|---|---|---|
| **Index Technology** | GIN index over pre-computed `tsvector` lexemes | GIN / GiST over 3-character n-grams | Distributed inverted index (Apache Lucene) |
| **Search Speed (100k Rows)** | 2.4 - 9.2 ms (in-engine index scan) | 6.5 - 18.2 ms (similarity scan) | 5.0 - 15.0 ms (plus network round-trip hop) |
| **Typo & Fuzzy Matching** | Lexical stemming and prefix matching | Excellent substring & similarity % matching | Levenshtein distance & phonetic analyzers |
| **Storage Overhead** | Low: ~12% table size for tsvector | Moderate: ~35% table size for n-grams | High: 100%+ (duplicate copy of all data) |
| **Infrastructure Complexity** | Zero extra infrastructure (In-DB) | Zero extra infrastructure (Extension) | High: JVM tuning, cluster nodes, dual-write CDC |
| **Consistency Model** | Immediate ACID consistency | Immediate ACID consistency | Eventual consistency (indexing delay) |
| **Suitability Threshold** | Up to 20,000,000 records | Up to 5,000,000 records | 50,000,000+ records & distributed logging |

## Concrete Obsolescence Thresholds

To prevent architectural stagnation, DataScope defines explicit quantitative obsolescence thresholds when the search subsystem must transition to the next tier:

1. **PostgreSQL Trigram (pg_trgm) Obsolescence Threshold: 5 Million Records**
   - *Rationale*: Trigram GIN indexes experience steep write amplification and index size growth once tables exceed 5,000,000 records. At 5M+ records, GIN trigram index creation and vacuuming create significant disk I/O pressure, and similarity queries degrade beyond acceptable interactive UI thresholds (> 200 ms).
   - *Transition Action*: Deprecate broad `%` similarity operator and restrict trigram searches to prefix ILIKE patterns backed by btree or FTS.

2. **PostgreSQL Full-Text Search (FTS) Obsolescence Threshold: 20 Million Records**
   - *Rationale*: Native PostgreSQL FTS with GIN indexes scales efficiently up to 20,000,000 records on modern SSD storage with proper memory allocation (`shared_buffers` >= 8 GB, `work_mem` >= 64 MB). Beyond 20M records, concurrent multi-term searches under heavy write load encounter lock contention, buffer pool churn, and index update latencies.
   - *Transition Action*: Deploy an external distributed search cluster (OpenSearch or Elasticsearch) fed asynchronously via PostgreSQL logical replication (Debezium / Kafka CDC connector) or read replicas with PgBouncer.

## Decision Outcome

**Selected Architecture: Hybrid In-Database Engine (PostgreSQL FTS + B-Tree Filtering)**

DataScope adopts native PostgreSQL Full-Text Search backed by stored `tsvector` generated columns and GIN indexing, complemented by composite B-Tree indexes for relational filters `(dataset_id, status, country, record_date DESC)` and keyset cursors.

### Consequences
- **Positive**: Zero operational overhead, immediate consistency on record mutations, sub-10 ms query execution on 120,000+ live records, simplified disaster recovery.
- **Negative**: Typo tolerance is limited to lexical stemming and prefix matching rather than arbitrary edit-distance permutations. When fuzziness is strictly required, pg_trgm is selectively activated on small-scale filtered subsets.
