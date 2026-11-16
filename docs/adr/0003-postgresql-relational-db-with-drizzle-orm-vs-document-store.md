# ADR-0003: PostgreSQL Relational DB with Drizzle ORM vs. Document Store

- **Status**: ACCEPTED
- **Author**: DataScope Architecture Working Group
- **Scope**: Enterprise Discovery Core Engine

---

## 1. Context & Problem Statement

Enterprise data intelligence requires strict ACID transactions, complex multi-field composite indexing, relational integrity for audit history and entity relationships, and native full-text search capabilities.

---

## 2. Considered Alternatives

1. MongoDB (flexible schema but expensive aggregation pipeline memory limits and weaker composite joins)
2. SQLite (lacks native full-text ranking vectors and enterprise concurrent write capabilities)
3. Pure In-Memory JSON (not persistent, fails enterprise data requirements)

---

## 3. Decision Outcome

**Selected Approach**: PostgreSQL with Drizzle ORM, utilizing composite B-Trees, JSONB for extensible attributes, and GIN indexes for Full-Text Search.

**Rationale**:
PostgreSQL offers the best combination of relational integrity for core entities (Users, Datasets, Records, Audit History) alongside native JSONB indexing and powerful full-text search (tsvector, tsquery, ts_rank) and trigram fuzzy matching (pg_trgm).

### Positive Consequences & Advantages:
- ACID guarantees for enterprise compliance and audit tracking
- Exceptional composite indexing on (dataset_id, status, numeric_value)
- Native full-text search and trigram fuzzy similarity without external server dependencies
- Drizzle ORM provides end-to-end TypeScript type safety

### Negative Consequences & Trade-offs:
- Requires schema migration discipline for relational structural changes

---

## 4. Performance Implications

PostgreSQL query optimizer generates optimal B-tree index scans in under 5ms across 100,000+ rows.

---

## 5. Future Scalability & Limitations

For global multi-region write replication across continents, CockroachDB or AWS Aurora Global DB would be used.
