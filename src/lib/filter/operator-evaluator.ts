/**
 * Pure evaluator for client-side filter condition testing.
 */

export function evaluateFilterCondition(recordValue: unknown, operator: string, targetValue: unknown, targetValueTo?: unknown): boolean {
  if (operator === 'is_null') return recordValue === null || recordValue === undefined || recordValue === '';
  if (operator === 'is_not_null') return recordValue !== null && recordValue !== undefined && recordValue !== '';

  if (recordValue === null || recordValue === undefined) return false;

  const rStr = String(recordValue).toLowerCase();
  const tStr = String(targetValue ?? '').toLowerCase();

  switch (operator) {
    case 'equals':
      return typeof recordValue === 'number'
        ? Number(recordValue) === Number(targetValue)
        : rStr === tStr;
    case 'contains':
      return rStr.includes(tStr);
    case 'starts_with':
      return rStr.startsWith(tStr);
    case 'greater_than':
      return Number(recordValue) > Number(targetValue);
    case 'less_than':
      return Number(recordValue) < Number(targetValue);
    case 'between':
      return Number(recordValue) >= Number(targetValue) && Number(recordValue) <= Number(targetValueTo ?? targetValue);
    default:
      return true;
  }
}
