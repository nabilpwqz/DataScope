# DataScope Testing Strategy and Quality Matrix

## Testing Pyramid
1. **Unit Tests (Vitest)**: Pure functions, formatters, validation schemas, SQL sanitizers, telemetry aggregators. Target: 100% pass rate.
2. **Integration Tests (Vitest + DB)**: Authentication, RBAC policy enforcement, search hash generation, saved views.
3. **Lint & Sloplint Audits**: Hallmark craft compliance enforcing 0 FAIL violations on typography, layout, and contrast.
4. **Production Build Verification**: Full Next.js static and dynamic route prerendering.
