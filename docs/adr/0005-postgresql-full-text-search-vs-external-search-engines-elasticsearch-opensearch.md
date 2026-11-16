# ADR-0005: PostgreSQL Full-Text Search vs. External Search Engines (Elasticsearch/OpenSearch)

- **Status**: ACCEPTED
- **Author**: DataScope Architecture Working Group
- **Scope**: Enterprise Discovery Core Engine

---

## 1. Context & Problem Statement

Organizations require fast keyword discovery and relevance ranking across large structured records without adding complex infrastructure overhead, synchronization lag, and multiple operational clusters.

---

## 2. Considered Alternatives

1. Elasticsearch / OpenSearch (powerful distributed inverted index, but requires running external JVM clusters, dual-write synchronization pipelines, and high hosting costs)
2. PostgreSQL Full-Text Search (tsvector, tsquery, GIN indexes, ts_rank)
3. Simple SQL LIKE / ILIKE (slow O(N) full table scan, lacks lexical stemming or word relevance ranking)

---

## 3. Decision Outcome

**Selected Approach**: PostgreSQL native Full-Text Search with GIN indexing, complemented by PostgreSQL Trigram (pg_trgm) for fuzzy typo tolerance.

**Rationale**:
For datasets from 100,000 to 5,000,000 records, PostgreSQL native FTS delivers index scan query times in 1.4-8ms without requiring an external cluster or Change-Data-Capture (CDC) sync pipelines. It eliminates dual-write split-brain issues.

### Positive Consequences & Advantages:
- Single database engine for transactions, relational models, and search
- Zero replication lag between write and search availability
- Built-in lexical stemming (e.g., "logistics" matches "logistical")
- Relevance scoring via ts_rank()

### Negative Consequences & Trade-offs:
- Less feature-rich in multi-language phonetic algorithms compared to Lucene/Elasticsearch

---

## 4. Performance Implications

GIN index queries execute in 6-12ms for multi-word queries across 100,000+ records.

---

## 5. Future Scalability & Limitations

If search volume exceeds 50 million records with heavy unstructured natural language document text, Elasticsearch or OpenSearch can be deployed as an auxiliary read replica.
