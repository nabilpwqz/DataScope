# ADR-0006: Client-Side Search Debouncing (300ms)

- **Status**: ACCEPTED
- **Author**: DataScope Architecture Working Group
- **Scope**: Enterprise Discovery Core Engine

---

## 1. Context & Problem Statement

Typing in search bars fires change events on every keystroke. For a 10-character query, firing 10 simultaneous API requests degrades server resources, floods database connections, and creates race condition flickering.

---

## 2. Considered Alternatives

1. Immediate API flight on each keystroke (wastes server resources, triggers race conditions)
2. Search only on explicit "Enter" keypress (poor UX, lacks responsive feedback)
3. Throttling (fires at fixed intervals, still captures incomplete words)

---

## 3. Decision Outcome

**Selected Approach**: 300ms Debouncing on the search input, updating debouncedSearch in Redux only after user pauses typing.

**Rationale**:
A 300ms debounce interval feels instant to the user while discarding 70-90% of intermediate keystroke API requests. Coupled with RTK Query in-flight cancellation, race conditions are eliminated.

### Positive Consequences & Advantages:
- Reduces API request volume by up to 85% during rapid typing
- Eliminates out-of-order race conditions where an earlier slow query overwrites a newer fast query
- Smooth 60fps typing experience without input lag

### Negative Consequences & Trade-offs:
- 300ms delay before server query initiates

---

## 4. Performance Implications

Cuts backend query rate from ~10 req/sec down to 1-2 req/sec per active searching user.

---

## 5. Future Scalability & Limitations

Can be dynamically adjusted based on network condition (e.g., 200ms on fast fiber, 450ms on mobile 3G).
