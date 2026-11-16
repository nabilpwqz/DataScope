/**
 * Quality rules engine calculating health scores across completeness, uniqueness, and validity.
 */

export interface QualityMetrics {
  totalRecords: number;
  nullCount: number;
  duplicateCount: number;
  invalidFormatCount: number;
}

export function calculateQualityHealthScore(metrics: QualityMetrics): number {
  if (metrics.totalRecords === 0) return 100;
  const completeness = 1 - metrics.nullCount / metrics.totalRecords;
  const uniqueness = 1 - metrics.duplicateCount / metrics.totalRecords;
  const validity = 1 - metrics.invalidFormatCount / metrics.totalRecords;

  const score = (completeness * 0.4 + uniqueness * 0.4 + validity * 0.2) * 100;
  return Math.max(0, Math.min(100, Math.round(score * 10) / 10));
}
