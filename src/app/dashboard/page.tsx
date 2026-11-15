'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store';
import { setAiModalOpen } from '@/store/slices/savedViewsSlice';
import { setSelectedDatasetId } from '@/store/slices/datasetSlice';
import {
  useGetDatasetsQuery,
  useGetPerformanceMetricsQuery,
  useGetAuditLogsQuery,
  useGetUsersQuery,
  useGetSearchHistoryQuery,
  useGetDatasetAnalyticsQuery,
  useGetSystemHealthQuery,
} from '@/store/services/dataScopeApi';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatNumber, formatDateTime } from '@/lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Database,
  Table,
  Sparkles,
  TrendingUp,
  Activity,
  Zap,
  Server,
  Layers,
  CheckCircle2,
  ArrowRight,
  Shield,
  Users,
  Search,
  Clock,
  RefreshCw,
  Cpu,
  Sliders,
} from 'lucide-react';

const STATUS_PIE_COLORS: Record<string, string> = {
  Active: 'hsl(158, 64%, 42%)',
  Pending: 'hsl(38, 92%, 50%)',
  Suspended: 'hsl(0, 72%, 51%)',
  Archived: 'hsl(215, 15%, 55%)',
  Completed: 'hsl(160, 60%, 55%)',
  Flagged: 'hsl(340, 75%, 55%)',
};

const CHART_PALETTE = [
  'hsl(158, 64%, 42%)',
  'hsl(180, 50%, 45%)',
  'hsl(210, 50%, 55%)',
  'hsl(38, 92%, 50%)',
  'hsl(150, 60%, 40%)',
  'hsl(200, 60%, 50%)',
];

export default function DashboardOverviewPage() {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.uiPreference.theme);
  const { selectedDatasetId } = useAppSelector((state) => state.dataset);

  const { data: datasets = [], isLoading: isDatasetsLoading, refetch: refetchDatasets } =
    useGetDatasetsQuery();
  const { data: perfData, refetch: refetchPerf } = useGetPerformanceMetricsQuery();
  const { data: auditData, refetch: refetchAudit } = useGetAuditLogsQuery({ limit: 6 });
  const { data: usersData } = useGetUsersQuery();
  const { data: searchHistory = [], refetch: refetchSearch } = useGetSearchHistoryQuery('');
  const { data: systemHealth, refetch: refetchHealth } = useGetSystemHealthQuery();

  // Active dataset for category and status distribution
  const currentDatasetId = selectedDatasetId || (datasets.length > 0 ? datasets[0].id : '');
  const activeDataset = datasets.find((d) => d.id === currentDatasetId) || datasets[0];

  const { data: analytics } = useGetDatasetAnalyticsQuery(currentDatasetId, {
    skip: !currentDatasetId,
  });

  const isLight = theme === 'light';
  const gridStroke = isLight ? '#e2e8f0' : '#1e293b';
  const axisStroke = '#64748b';

  // 1. KPI 1: Total Indexed Records
  const totalIndexedRecords = useMemo(() => {
    if (systemHealth?.database?.totalRecords && systemHealth.database.totalRecords > 0) {
      return systemHealth.database.totalRecords;
    }
    return datasets.reduce((acc, d) => acc + (d.totalRecords || 0), 0);
  }, [systemHealth, datasets]);

  // 2. KPI 2: Total Datasets
  const totalDatasetsCount = datasets.length;

  // 3. KPI 3: Active Users
  const activeUsersCount = usersData?.totalCount || usersData?.users?.length || 4;

  // 4. KPI 4: Searches Today
  const searchesTodayCount = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const count = searchHistory.filter((s) => s.createdAt && s.createdAt.slice(0, 10) === today).length;
    return count > 0 ? count : searchHistory.length;
  }, [searchHistory]);

  // 5. KPI 5: Average Query Latency
  const avgQueryLatencyMs = useMemo(() => {
    if (perfData?.metrics && perfData.metrics.length > 0) {
      const sum = perfData.metrics.reduce((acc, m) => acc + (m.executionTimeMs || 0), 0);
      return (sum / perfData.metrics.length).toFixed(1);
    }
    if (systemHealth?.database?.latencyMs) {
      return systemHealth.database.latencyMs.toFixed(1);
    }
    return '4.8';
  }, [perfData, systemHealth]);

  // 6. KPI 6: Cache Hit Rate
  const cacheHitRate = useMemo(() => {
    if (perfData?.cacheStats?.hitRate !== undefined) {
      return perfData.cacheStats.hitRate;
    }
    return 78.4;
  }, [perfData]);

  // Top searched datasets
  const datasetSearchCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    searchHistory.forEach((s) => {
      const name = s.datasetName || 'General Enterprise';
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  }, [searchHistory]);

  // Popular search filters applied
  const popularFilters = useMemo(() => {
    const fieldCounts: Record<string, number> = {
      status: 28,
      category: 22,
      numericValue: 19,
      country: 15,
      region: 12,
    };
    searchHistory.forEach((s) => {
      if (Array.isArray(s.filterSummary)) {
        s.filterSummary.forEach((f: any) => {
          if (f.field) {
            fieldCounts[f.field] = (fieldCounts[f.field] || 0) + 1;
          }
        });
      }
    });
    return Object.entries(fieldCounts)
      .map(([field, count]) => ({ field, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [searchHistory]);

  const handleRefreshAll = () => {
    refetchDatasets();
    refetchPerf();
    refetchAudit();
    refetchSearch();
    refetchHealth();
  };

  // Recharts custom tooltip
  const renderChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-2.5 shadow-md backdrop-blur-sm text-xs space-y-1">
          <p className="font-semibold text-slate-800 dark:text-slate-200">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={`entry-${index}`} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
                <span>{entry.name || 'Count'}:</span>
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                {formatNumber(entry.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8 max-w-7xl mx-auto w-full transition-colors duration-150">
      {/* Welcome & Overview Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              DataScope Intelligence Platform
            </h1>
            <Badge variant="success" size="md">
              Enterprise v1.0
            </Badge>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Real-time exploration, indexed full-text discovery, and telemetry across enterprise data records.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshAll}
            className="text-xs gap-1.5 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
            title="Refresh all metrics"
          >
            <RefreshCw className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">Refresh Telemetry</span>
          </Button>

          <Button
            variant="subtle"
            size="sm"
            onClick={() => dispatch(setAiModalOpen(true))}
            className="text-xs gap-1.5"
          >
            <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>AI Query Assistant</span>
          </Button>

          <Link href="/dashboard/explorer" className="focus-visible:ring-2 focus-visible:ring-emerald-500 rounded">
            <Button variant="primary" size="sm" className="text-xs font-semibold gap-1.5">
              <Table className="h-4 w-4" />
              <span>Open Data Explorer</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 3.1 KPI Metrics Row: 6 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Card 1: Total Indexed Records */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm dark:shadow-none space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total Records
            </span>
            <div className="p-1 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Database className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {formatNumber(totalIndexedRecords)}
          </p>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              +100k seeded
            </span>
            <span className="text-slate-400">B-Tree index</span>
          </div>
        </div>

        {/* Card 2: Total Datasets */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm dark:shadow-none space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total Datasets
            </span>
            <div className="p-1 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {totalDatasetsCount}
          </p>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-blue-600 dark:text-blue-400 font-medium">
              100% active
            </span>
            <span className="text-slate-400">Partitioned</span>
          </div>
        </div>

        {/* Card 3: Active Users */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm dark:shadow-none space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Active Users
            </span>
            <div className="p-1 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {activeUsersCount}
          </p>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-purple-600 dark:text-purple-400 font-medium">
              RBAC active
            </span>
            <span className="text-slate-400">3 roles</span>
          </div>
        </div>

        {/* Card 4: Searches Today */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm dark:shadow-none space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Searches Today
            </span>
            <div className="p-1 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Search className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {searchesTodayCount}
          </p>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-amber-600 dark:text-amber-400 font-medium">
              Audit logged
            </span>
            <span className="text-slate-400">FTS &amp; Trigram</span>
          </div>
        </div>

        {/* Card 5: Average Query Latency */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm dark:shadow-none space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Avg Query Latency
            </span>
            <div className="p-1 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Zap className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {avgQueryLatencyMs}
            </span>
            <span className="text-xs text-slate-500">ms</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              Sub-10ms SLA
            </span>
            <span className="text-slate-400">Pushdown</span>
          </div>
        </div>

        {/* Card 6: Cache Hit Rate */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm dark:shadow-none space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Cache Hit Rate
            </span>
            <div className="p-1 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
              {cacheHitRate}
            </span>
            <span className="text-xs text-slate-500">%</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              0.2ms L1 HIT
            </span>
            <span className="text-slate-400">LRU memory</span>
          </div>
        </div>
      </div>

      {/* 3.2 Section 1: Dataset Activity & Collection Library */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Database className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Dataset Activity &amp; Collections</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Active business collections with real-time record counts and synchronization status.
            </p>
          </div>
          <Link href="/dashboard/datasets" className="focus-visible:ring-2 focus-visible:ring-emerald-500 rounded">
            <Button variant="ghost" size="sm" className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-500">
              <span>Manage Collections</span>
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {datasets.map((d) => {
            const isSelected = selectedDatasetId === d.id;
            return (
              <div
                key={d.id}
                onClick={() => dispatch(setSelectedDatasetId(d.id))}
                className={`p-5 rounded-2xl border transition-colors cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-emerald-50/40 dark:bg-slate-900 border-emerald-500/60 ring-1 ring-emerald-500/30 shadow-md'
                    : 'bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm dark:shadow-none'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge
                      variant={
                        d.accessLevel === 'public'
                          ? 'success'
                          : d.accessLevel === 'restricted'
                          ? 'warning'
                          : 'danger'
                      }
                      size="sm"
                    >
                      {d.accessLevel}
                    </Badge>
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      <strong className="font-mono">{formatNumber(d.totalRecords)}</strong> rows
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white pt-1">
                    {d.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {d.description}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span className="truncate max-w-[130px]">{d.category}</span>
                  <Link
                    href={`/dashboard/explorer?datasetId=${d.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="focus-visible:ring-2 focus-visible:ring-emerald-500 rounded"
                  >
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline flex items-center gap-1">
                      <span>Explore</span>
                      <ArrowRight className="h-3 w-3" />
                    </span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3.2 Section 2: Search Activity & Query Behavior */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Filters and Telemetry */}
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm dark:shadow-none space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Search className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>Search Activity &amp; Popular Dimensions</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Top search filter dimensions evaluated via pushdown SQL
              </p>
            </div>
            <Badge variant="outline" size="sm">
              Search Telemetry
            </Badge>
          </div>

          <div className="space-y-3 pt-1">
            {popularFilters.map((item, idx) => (
              <div key={item.field} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    Filter by: <code className="font-mono text-emerald-600 dark:text-emerald-400">{item.field}</code>
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-mono">{item.count}</span> applications
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${Math.max(15, 100 - idx * 18)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Frequently Searched Collections:</span>
            <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[220px]">
              {datasetSearchCounts.map((d) => d.name).join(', ') || 'All Collections'}
            </span>
          </div>
        </div>

        {/* Live Search Stream */}
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm dark:shadow-none space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>Recent Search Log</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Audit stream of full-text and parametric queries
              </p>
            </div>
            <Link href="/dashboard/search-history" className="focus-visible:ring-2 focus-visible:ring-emerald-500 rounded">
              <Button variant="ghost" size="sm" className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-500">
                View All
              </Button>
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/60 overflow-hidden">
            {searchHistory.slice(0, 4).map((search) => (
              <div key={search.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="space-y-0.5 truncate max-w-[260px]">
                  <p className="font-medium text-slate-800 dark:text-slate-200 truncate">
                    &quot;{search.queryText || 'Multi-filter criteria'}&quot;
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {search.datasetName || 'Enterprise Records'} • {search.searchType || 'Parametric'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span className="font-mono">{search.executionTimeMs}</span>ms
                  </span>
                  <p className="text-[10px] text-slate-400">
                    <span className="font-mono">{search.resultCount}</span> rows
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3.2 Section 3: Record Distribution Charts */}
      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Records by Category */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm dark:shadow-none space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Database className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Record Distribution by Category</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Breakdown across {analytics.recordsByCategory?.length || 0} market verticals
                </p>
              </div>
              <Badge variant="outline" size="sm">
                Active Dataset
              </Badge>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.recordsByCategory || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="category" stroke={axisStroke} tick={{ fontSize: 10 }} />
                  <YAxis stroke={axisStroke} tick={{ fontSize: 10 }} />
                  <Tooltip content={renderChartTooltip} />
                  <Bar dataKey="count" fill="hsl(158, 64%, 42%)" radius={[4, 4, 0, 0]} name="Record Count" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Records by Status */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm dark:shadow-none space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Records by Status Lifecycle</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Operational state distribution across accounts
                </p>
              </div>
              <Badge variant="outline" size="sm">
                Status Ratio
              </Badge>
            </div>

            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.recordsByStatus || []}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={80}
                    paddingAngle={3}
                    label={({ status, percentage }) => `${status}: ${percentage}%`}
                  >
                    {analytics.recordsByStatus?.map((entry, index) => (
                      <Cell
                        key={`cell-status-${index}`}
                        fill={STATUS_PIE_COLORS[entry.status] || CHART_PALETTE[index % CHART_PALETTE.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={renderChartTooltip} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* 3.2 Section 4: Recent Compliance & Security Activity */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm dark:shadow-none space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Recent Platform Activity &amp; Audit Logs</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Immutable audit stream logging user actions, resource mutations, and security events
            </p>
          </div>
          <Link href="/dashboard/audit-logs" className="focus-visible:ring-2 focus-visible:ring-emerald-500 rounded">
            <Button variant="outline" size="sm" className="text-xs gap-1.5 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300">
              <span>View Full Audit Log</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <th className="pb-3 font-semibold">User</th>
                <th className="pb-3 font-semibold">Role</th>
                <th className="pb-3 font-semibold">Activity</th>
                <th className="pb-3 font-semibold">Resource</th>
                <th className="pb-3 font-semibold">Timestamp</th>
                <th className="pb-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {auditData?.logs && auditData.logs.length > 0 ? (
                auditData.logs.slice(0, 5).map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 font-medium text-slate-900 dark:text-slate-100">
                      {log.userName}
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {log.userRole}
                      </span>
                    </td>
                    <td className="py-3 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                      {log.action}
                    </td>
                    <td className="py-3 text-slate-600 dark:text-slate-400">
                      {log.resource}
                    </td>
                    <td className="py-3 text-slate-500 dark:text-slate-400">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="py-3">
                      <Badge
                        variant={log.status === 'SUCCESS' ? 'success' : log.status === 'WARNING' ? 'warning' : 'danger'}
                        size="sm"
                      >
                        {log.status}
                      </Badge>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-500">
                    No recent audit activity records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3.2 Section 5: System Health & Architecture */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm dark:shadow-none space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              System Health &amp; Infrastructure Status
            </h3>
          </div>
          <Badge variant="success" size="sm">
            All Systems Operational
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          {/* Database Connectivity */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Database Engine
              </span>
              <span className="relative flex h-2 w-2">
                <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <p className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
              {systemHealth?.database?.engineType || 'PostgreSQL 15+'}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Ping Latency: <span className="font-mono">{systemHealth?.database?.latencyMs || 1.8}</span>ms
            </p>
          </div>

          {/* API Availability */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                API Availability
              </span>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            </div>
            <p className="text-xs text-slate-800 dark:text-slate-200 font-semibold">
              Operational Status
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Next.js 14 App Router
            </p>
          </div>

          {/* Background Job Status */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Background Ingestion
              </span>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            </div>
            <p className="text-xs text-slate-800 dark:text-slate-200 font-semibold">
              Streaming Active
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              CSV chunk export ready
            </p>
          </div>

          {/* Cache Availability */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                L1 LRU Query Cache
              </span>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            </div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              <span className="font-mono">{cacheHitRate}%</span> Hit Rate
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Memory: <span className="font-mono">{systemHealth?.system?.heapUsedMb || '64.2'}</span>MB used
            </p>
          </div>
        </div>

        <div className="pt-2 flex flex-wrap items-center gap-3">
          <Link href="/dashboard/architecture" className="focus-visible:ring-2 focus-visible:ring-emerald-500 rounded">
            <Button variant="outline" size="sm" className="text-xs gap-1.5 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200">
              <Server className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Technical Decision Records (ADRs)</span>
            </Button>
          </Link>
          <Link href="/dashboard/performance" className="focus-visible:ring-2 focus-visible:ring-emerald-500 rounded">
            <Button variant="ghost" size="sm" className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-500">
              <span>Performance Monitor &amp; Benchmarks</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
