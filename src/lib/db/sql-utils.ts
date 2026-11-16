/**
 * Safe SQL string and identifier sanitization utility for PostgreSQL query pushdown.
 */

export function sanitizeIdentifier(identifier: string): string {
  // Allow only alphanumeric characters and underscores
  const clean = identifier.replace(/[^a-zA-Z0-9_]/g, '');
  if (!clean || clean.length === 0) {
    throw new Error('Invalid SQL identifier');
  }
  return clean;
}

export function escapeSqlString(str: string): string {
  return str.replace(/'/g, "''");
}

export function buildInClause(values: string[]): string {
  if (!values || values.length === 0) return '(NULL)';
  return `(${values.map((v) => `'${escapeSqlString(v)}'`).join(', ')})`;
}

export function clampLimitOffset(limit: number, offset: number, maxLimit = 100): { limit: number; offset: number } {
  const safeLimit = Math.max(1, Math.min(limit || 25, maxLimit));
  const safeOffset = Math.max(0, offset || 0);
  return { limit: safeLimit, offset: safeOffset };
}
