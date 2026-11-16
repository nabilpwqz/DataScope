/**
 * SQL Pushdown Query Builder Optimizer for compound boolean filter trees.
 */

export interface PushdownCondition {
  field: string;
  operator: string;
  value: unknown;
}

export function compilePushdownWhereClause(datasetId: string, conditions: PushdownCondition[], logicalOp: 'AND' | 'OR' = 'AND'): string {
  const baseClause = `dataset_id = '${datasetId}'`;
  if (!conditions || conditions.length === 0) {
    return baseClause;
  }

  const subClauses = conditions.map((c) => {
    const col = c.field === 'numericValue' ? 'numeric_value' : c.field === 'recordDate' ? 'record_date' : c.field;
    if (c.operator === 'equals') return `${col} = '${c.value}'`;
    if (c.operator === 'greater_than') return `${col} > ${c.value}`;
    if (c.operator === 'less_than') return `${col} < ${c.value}`;
    return `${col} = '${c.value}'`;
  });

  return `${baseClause} AND (${subClauses.join(` ${logicalOp} `)})`;
}
