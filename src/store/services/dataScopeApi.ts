import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import {
  Dataset,
  SearchQueryRequest,
  SearchQueryResponse,
  DatasetRecord,
  RecordRelationship,
  RecordHistoryItem,
  SavedView,
  SearchHistoryEntry,
  AnalyticsSummary,
  PerformanceMetric,
  AuditLog,
  DataQualityOverview,
  DataLineageGraph,
  RecordComment,
  UserSummary,
} from '@/types';
import { AISearchResult } from '@/lib/search/ai-assistant';

export interface RecordDetailResponse {
  record: DatasetRecord;
  relatedRecords: RecordRelationship[];
  history: RecordHistoryItem[];
}

export const dataScopeApi = createApi({
  reducerPath: 'dataScopeApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    prepareHeaders: (headers, { getState }) => {
      // In production, attaches Bearer token from auth state
      const state = getState() as any;
      const token = state.auth?.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: [
    'Dataset',
    'Record',
    'SavedView',
    'SearchHistory',
    'Analytics',
    'Performance',
    'AuditLog',
    'DataQuality',
    'DataLineage',
    'User',
    'Comment',
  ],
  keepUnusedDataFor: 60, // 60 seconds cache TTL
  refetchOnReconnect: true,
  endpoints: (builder) => ({
    // 1. Datasets
    getDatasets: builder.query<Dataset[], void>({
      query: () => '/datasets',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Dataset' as const, id })),
              { type: 'Dataset', id: 'LIST' },
            ]
          : [{ type: 'Dataset', id: 'LIST' }],
    }),

    getDatasetById: builder.query<Dataset, string>({
      query: (id) => `/datasets/${id}`,
      providesTags: (result, error, id) => [{ type: 'Dataset', id }],
    }),

    createDataset: builder.mutation<Dataset, Partial<Dataset>>({
      query: (body) => ({
        url: '/datasets',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'Dataset', id: 'LIST' },
        { type: 'AuditLog', id: 'LIST' },
      ],
    }),

    updateDataset: builder.mutation<Dataset, { id: string } & Partial<Dataset>>({
      query: ({ id, ...body }) => ({
        url: `/datasets/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'Dataset', id: arg.id },
        { type: 'Dataset', id: 'LIST' },
        { type: 'AuditLog', id: 'LIST' },
      ],
    }),

    deleteDataset: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/datasets/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Dataset', id },
        { type: 'Dataset', id: 'LIST' },
        { type: 'AuditLog', id: 'LIST' },
      ],
    }),

    // 2. Search & Records
    searchRecords: builder.query<SearchQueryResponse, SearchQueryRequest>({
      query: (body) => ({
        url: `/datasets/${body.datasetId}/records`,
        method: 'POST',
        body,
      }),
      // Caching key is serialized by body params automatically
      providesTags: (result, error, arg) => [
        { type: 'Record', id: `DATASET_${arg.datasetId}` },
      ],
    }),

    // 3. Record Details with relations & audit trail
    getRecordDetails: builder.query<RecordDetailResponse, { datasetId: string; recordId: string }>({
      query: ({ datasetId, recordId }) => `/datasets/${datasetId}/records/${recordId}`,
      providesTags: (result, error, arg) => [{ type: 'Record', id: arg.recordId }],
    }),

    updateRecordStatus: builder.mutation<
      DatasetRecord,
      { datasetId: string; recordId: string; status: string; reason?: string }
    >({
      query: ({ datasetId, recordId, status, reason }) => ({
        url: `/datasets/${datasetId}/records/${recordId}`,
        method: 'PATCH',
        body: { status, reason },
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'Record', id: arg.recordId },
        { type: 'Record', id: `DATASET_${arg.datasetId}` },
        { type: 'Analytics', id: arg.datasetId },
      ],
    }),

    // 4. Saved Views
    getSavedViews: builder.query<SavedView[], string>({
      query: (datasetId) => `/saved-views?datasetId=${datasetId}`,
      providesTags: (result, error, datasetId) => [
        { type: 'SavedView', id: `DATASET_${datasetId}` },
      ],
    }),

    createSavedView: builder.mutation<SavedView, Partial<SavedView>>({
      query: (body) => ({
        url: '/saved-views',
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'SavedView', id: `DATASET_${arg.datasetId}` },
      ],
    }),

    deleteSavedView: builder.mutation<{ success: boolean }, { id: string; datasetId: string }>({
      query: ({ id }) => ({
        url: `/saved-views/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'SavedView', id: `DATASET_${arg.datasetId}` },
      ],
    }),

    // 5. Search History
    getSearchHistory: builder.query<SearchHistoryEntry[], string>({
      query: (datasetId) => `/search-history?datasetId=${datasetId}`,
      providesTags: [{ type: 'SearchHistory', id: 'LIST' }],
    }),

    // 6. Analytics Aggregations
    getDatasetAnalytics: builder.query<AnalyticsSummary, string>({
      query: (datasetId) => `/datasets/${datasetId}/analytics`,
      providesTags: (result, error, id) => [{ type: 'Analytics', id }],
    }),

    // 7. Search Performance Metrics
    getPerformanceMetrics: builder.query<{ metrics: PerformanceMetric[]; cacheStats: any }, void>({
      query: () => '/performance',
      providesTags: [{ type: 'Performance', id: 'STATS' }],
    }),

    // 8. AI Search Assistant
    parseNaturalLanguageSearch: builder.mutation<
      AISearchResult,
      { prompt: string; datasetId: string }
    >({
      query: (body) => ({
        url: '/ai/search-assistant',
        method: 'POST',
        body,
      }),
    }),

    // 9. Export Data (CSV Streaming / Background Job)
    triggerExport: builder.mutation<
      { exportId: string; downloadUrl: string; totalRows: number },
      { datasetId: string; filters?: any[]; search?: string }
    >({
      query: ({ datasetId, ...body }) => ({
        url: `/datasets/${datasetId}/export`,
        method: 'POST',
        body,
      }),
    }),

    // 10. Audit Logs
    getAuditLogs: builder.query<
      { logs: AuditLog[]; totalCount: number; viewerRole: string },
      { limit?: number; action?: string; status?: string; search?: string } | void
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.limit) queryParams.set('limit', String(params.limit));
        if (params?.action) queryParams.set('action', params.action);
        if (params?.status) queryParams.set('status', params.status);
        if (params?.search) queryParams.set('search', params.search);
        const qs = queryParams.toString();
        return `/audit-logs${qs ? `?${qs}` : ''}`;
      },
      providesTags: [{ type: 'AuditLog', id: 'LIST' }],
    }),

    createAuditLog: builder.mutation<{ success: boolean; logId: string }, Partial<AuditLog>>({
      query: (body) => ({
        url: '/audit-logs',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'AuditLog', id: 'LIST' }],
    }),

    // 11. Data Quality
    getDataQualityOverview: builder.query<
      DataQualityOverview,
      { datasetId?: string; status?: string; severity?: string } | void
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.datasetId) queryParams.set('datasetId', params.datasetId);
        if (params?.status) queryParams.set('status', params.status);
        if (params?.severity) queryParams.set('severity', params.severity);
        const qs = queryParams.toString();
        return `/data-quality${qs ? `?${qs}` : ''}`;
      },
      providesTags: [{ type: 'DataQuality', id: 'OVERVIEW' }],
    }),

    updateDataQualityIssue: builder.mutation<
      { success: boolean },
      { issueId: string; status: 'open' | 'reviewed' | 'resolved' }
    >({
      query: (body) => ({
        url: '/data-quality',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: [
        { type: 'DataQuality', id: 'OVERVIEW' },
        { type: 'AuditLog', id: 'LIST' },
      ],
    }),

    // 12. Data Lineage
    getDataLineage: builder.query<DataLineageGraph, void>({
      query: () => '/data-lineage',
      providesTags: [{ type: 'DataLineage', id: 'GRAPH' }],
    }),

    // 13. Platform Users & Roles
    getUsers: builder.query<
      { users: UserSummary[]; totalCount: number; viewerRole: string },
      void
    >({
      query: () => '/users',
      providesTags: [{ type: 'User', id: 'LIST' }],
    }),

    updateUserRole: builder.mutation<
      { success: boolean; user: any },
      { userId: string; role: 'admin' | 'analyst' | 'viewer' }
    >({
      query: (body) => ({
        url: '/users',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: [
        { type: 'User', id: 'LIST' },
        { type: 'AuditLog', id: 'LIST' },
      ],
    }),

    // 14. Record Collaboration Comments
    getRecordComments: builder.query<
      { comments: RecordComment[] },
      { datasetId: string; recordId: string }
    >({
      query: ({ datasetId, recordId }) => `/datasets/${datasetId}/records/${recordId}/comments`,
      providesTags: (result, error, arg) => [{ type: 'Comment', id: arg.recordId }],
    }),

    addRecordComment: builder.mutation<
      { comment: RecordComment },
      { datasetId: string; recordId: string; content: string }
    >({
      query: ({ datasetId, recordId, content }) => ({
        url: `/datasets/${datasetId}/records/${recordId}/comments`,
        method: 'POST',
        body: { content },
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'Comment', id: arg.recordId },
        { type: 'Record', id: arg.recordId },
        { type: 'AuditLog', id: 'LIST' },
      ],
    }),

    // 15. System Health
    getSystemHealth: builder.query<
      {
        status: string;
        timestamp: string;
        version: string;
        database: {
          healthy: boolean;
          engineType: string;
          latencyMs: number;
          totalDatasets: number;
          totalRecords: number;
        };
        system: { rssMb: string; heapUsedMb: string; heapTotalMb: string };
      },
      void
    >({
      query: () => '/health',
      providesTags: [{ type: 'Performance', id: 'HEALTH' }],
    }),
  }),
});

export const {
  useGetDatasetsQuery,
  useGetDatasetByIdQuery,
  useCreateDatasetMutation,
  useUpdateDatasetMutation,
  useDeleteDatasetMutation,
  useSearchRecordsQuery,
  useGetRecordDetailsQuery,
  useUpdateRecordStatusMutation,
  useGetSavedViewsQuery,
  useCreateSavedViewMutation,
  useDeleteSavedViewMutation,
  useGetSearchHistoryQuery,
  useGetDatasetAnalyticsQuery,
  useGetPerformanceMetricsQuery,
  useParseNaturalLanguageSearchMutation,
  useTriggerExportMutation,
  useGetAuditLogsQuery,
  useCreateAuditLogMutation,
  useGetDataQualityOverviewQuery,
  useUpdateDataQualityIssueMutation,
  useGetDataLineageQuery,
  useGetUsersQuery,
  useUpdateUserRoleMutation,
  useGetRecordCommentsQuery,
  useAddRecordCommentMutation,
  useGetSystemHealthQuery,
} = dataScopeApi;

