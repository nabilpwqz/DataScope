import { describe, it, expect } from 'vitest';
import { sanitizeIdentifier, escapeSqlString, buildInClause, clampLimitOffset } from '@/lib/db/sql-utils';

describe('SQL Utilities & Sanitization', () => {
  it('sanitizes valid identifiers and rejects unsafe characters', () => {
    expect(sanitizeIdentifier('numeric_value')).toBe('numeric_value');
    expect(sanitizeIdentifier('datasetId; DROP TABLE users;')).toBe('datasetIdDROPTABLEusers');
    expect(() => sanitizeIdentifier(';--')).toThrow();
  });

  it('escapes single quotes correctly for string literals', () => {
    expect(escapeSqlString("O'Reilly")).toBe("O''Reilly");
    expect(escapeSqlString("normal string")).toBe("normal string");
  });

  it('builds SQL IN clauses safely', () => {
    expect(buildInClause(['Active', 'Pending', "O'Brien"])).toBe("('Active', 'Pending', 'O''Brien')");
    expect(buildInClause([])).toBe('(NULL)');
  });

  it('clamps limit and offset within bounded ranges', () => {
    expect(clampLimitOffset(500, -10, 100)).toEqual({ limit: 100, offset: 0 });
    expect(clampLimitOffset(25, 50, 100)).toEqual({ limit: 25, offset: 50 });
  });
});
