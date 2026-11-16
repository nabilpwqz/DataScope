import { AnalyticsSummary, PerformanceMetric } from '@/types';

export async function fetchDatasetAnalyticsApi(datasetId: string): Promise<AnalyticsSummary> {
  const res = await fetch(`/api/datasets/${encodeURIComponent(datasetId)}/analytics`);
  if (!res.ok) throw new Error('Failed to fetch dataset analytics');
  return res.json();
}

export async function fetchPerformanceMetricsApi(): Promise<{
  metrics: PerformanceMetric[];
  cacheStats: any;
}> {
  const res = await fetch('/api/performance');
  if (!res.ok) throw new Error('Failed to fetch performance metrics');
  return res.json();
}

