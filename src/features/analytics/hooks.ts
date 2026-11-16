import {
  useGetDatasetAnalyticsQuery,
  useGetPerformanceMetricsQuery,
  useClearPerformanceCacheMutation,
} from '@/store/services/dataScopeApi';

export function useDatasetAnalytics(datasetId: string) {
  const query = useGetDatasetAnalyticsQuery(datasetId, { skip: !datasetId });
  return {
    ...query,
    analytics: query.data,
  };
}

export function usePerformanceMetrics() {
  const query = useGetPerformanceMetricsQuery();
  const [clearCache, clearStatus] = useClearPerformanceCacheMutation();

  return {
    ...query,
    metrics: query.data?.metrics || [],
    cacheStats: query.data?.cacheStats,
    clearCache: () => clearCache().unwrap(),
    isClearing: clearStatus.isLoading,
  };
}
