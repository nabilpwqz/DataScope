/**
 * Statistical calculations for dataset numeric fields.
 */

export function calculateSummaryStats(values: number[]) {
  if (!values || values.length === 0) {
    return { min: 0, max: 0, mean: 0, sum: 0, median: 0 };
  }
  const clean = values.filter((v) => typeof v === 'number' && !isNaN(v));
  if (clean.length === 0) {
    return { min: 0, max: 0, mean: 0, sum: 0, median: 0 };
  }

  const sorted = [...clean].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, n) => acc + n, 0);
  const mean = sum / sorted.length;
  const min = sorted[0];
  const max = sorted[sorted.length - 1];

  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

  return {
    min,
    max,
    mean: Math.round(mean * 100) / 100,
    sum,
    median: Math.round(median * 100) / 100,
  };
}
