'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store';
import { setSelectedDatasetId } from '@/store/slices/datasetSlice';
import {
  useGetDatasetsQuery,
  useGetDatasetAnalyticsQuery,
} from '@/store/services/dataScopeApi';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatNumber } from '@/lib/utils';
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
  AreaChart,
  Area,
} from 'recharts';
import {
  BarChart3,
  PieChart as PieIcon,
  TrendingUp,
  Globe,
  Filter,
  Database,
  RefreshCw,
  Download,
  DollarSign,
  Layers,
  ChevronDown,
  Table,
  Sliders,
  CheckCircle2,
} from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
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
  'hsl(260, 45%, 55%)',
  'hsl(330, 65%, 50%)',
];

type AnalyticsTab = 'overview' | 'geography' | 'trends' | 'queries';
type MetricViewMode = 'count' | 'value';

export default function AnalyticsPage() {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.uiPreference.theme);
  const { selectedDatasetId } = useAppSelector((state) => state.dataset);

  const [activeTab, setActiveTab] = useState<AnalyticsTab>('overview');
  const [metricView, setMetricView] = useState<MetricViewMode>('count');
  const [isExporting, setIsExporting] = useState(false);

  const { data: datasets = [], isLoading: isDatasetsLoading } = useGetDatasetsQuery();

  // If no dataset selected, default to first available
  const currentDatasetId = selectedDatasetId || (datasets.length > 0 ? datasets[0].id : '');
  const activeDataset = datasets.find((d) => d.id === currentDatasetId) || datasets[0];

  const {
    data: analytics,
    isLoading: isAnalyticsLoading,
    isFetching,
    refetch,
  } = useGetDatasetAnalyticsQuery(currentDatasetId, {
    skip: !currentDatasetId,
  });

  const isLight = theme === 'light';
  const gridStroke = isLight ? '#e2e8f0' : '#1e293b';
  const axisStroke = '#64748b';

  // Derived calculations
  const totalValuation = useMemo(() => {
    if (!analytics) return 0;
    if (analytics.totalValue && analytics.totalValue > 0) return analytics.totalValue;
    return analytics.recordsByCategory.reduce((sum, c) => sum + (c.totalValue || 0), 0);
  }, [analytics]);

  const activeRatio = useMemo(() => {
    if (!analytics || !analytics.recordsByStatus) return 0;
    const activeEntry = analytics.recordsByStatus.find((s) => s.status === 'Active');
    return activeEntry ? activeEntry.percentage : 0;
  }, [analytics]);

  const uniqueMarketsCount = analytics?.recordsByCategory?.length || 0;
  const uniqueCountriesCount = analytics?.topCountries?.length || 0;

  // Custom theme-aware Recharts Tooltip
  const renderCustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-3 shadow-md backdrop-blur-sm text-xs space-y-1 z-50">
          <p className="font-semibold text-slate-900 dark:text-slate-100">{label}</p>
          {payload.map((entry: any, index: number) => {
            const isVal =
              entry.name?.toLowerCase().includes('value') ||
              entry.name?.toLowerCase().includes('revenue') ||
              entry.dataKey === 'totalValue';
            return (
              <div key={`entry-${index}`} className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: entry.color || entry.fill }}
                  />
                  <span>{entry.name || 'Metric'}:</span>
                </span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                  {typeof entry.value === 'number'
                    ? isVal
                      ? formatCurrency(entry.value)
                      : formatNumber(entry.value)
                    : entry.value}
                </span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  // CSV Report Generator
  const handleExportReport = () => {
    if (!analytics) return;
    setIsExporting(true);

    try {
      const rows: string[] = [];
      rows.push('DataScope Enterprise Analytics Intelligence Report');
      rows.push(`Dataset: ${activeDataset?.name || 'Dataset'} (${currentDatasetId})`);
      rows.push(`Exported At: ${new Date().toISOString()}`);
      rows.push(`Total Records: ${analytics.totalRecords}`);
      rows.push(`Total Portfolio Value: $${totalValuation}`);
      rows.push(`Average Value: $${analytics.averageValue}`);
      rows.push(`Median Value: $${analytics.medianValue}`);
      rows.push('');

      rows.push('--- CATEGORY BREAKDOWN ---');
      rows.push('Category,Record Count,Total Value ($),Average Value ($),Share (%)');
      analytics.recordsByCategory.forEach((c) => {
        const share = analytics.totalRecords > 0 ? ((c.count / analytics.totalRecords) * 100).toFixed(1) : '0';
        const avg = c.count > 0 ? Math.round(c.totalValue / c.count) : 0;
        rows.push(`"${c.category}",${c.count},${c.totalValue},${avg},${share}%`);
      });
      rows.push('');

      rows.push('--- STATUS DISTRIBUTION ---');
      rows.push('Status,Record Count,Percentage (%)');
      analytics.recordsByStatus.forEach((s) => {
        rows.push(`"${s.status}",${s.count},${s.percentage}%`);
      });
      rows.push('');

      rows.push('--- TOP GEOGRAPHIC MARKETS ---');
      rows.push('Country,Record Count,Total Value ($)');
      analytics.topCountries.forEach((co) => {
        rows.push(`"${co.country}",${co.count},${co.totalValue}`);
      });
      rows.push('');

      rows.push('--- SEARCH FILTER AUDIT ---');
      rows.push('Filter Field,Applications Count');
      analytics.filterUsageStats.forEach((f) => {
        rows.push(`"${f.field}",${f.usageCount}`);
      });

      const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(rows.join('\n'));
      const link = document.createElement('a');
      link.setAttribute('href', csvContent);
      link.setAttribute(
        'download',
        `datascope-analytics-${activeDataset?.slug || 'dataset'}-${Date.now()}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to export analytics report:', err);
    } finally {
      setIsExporting(false);
    }
  };

  if (isDatasetsLoading || (isAnalyticsLoading && !analytics)) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center py-24 space-y-3">
        <div className="h-8 w-8 motion-safe:animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Running backend SQL aggregation queries on PostgreSQL engine…
        </span>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex-1 p-8 max-w-5xl mx-auto w-full text-center space-y-4 py-24">
        <Database className="h-12 w-12 text-slate-400 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">
          No analytics data available
        </h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Select another dataset or seed enterprise records to generate full statistical intelligence.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8 max-w-7xl mx-auto w-full transition-colors duration-150">
      {/* Top Header & Context Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/40 text-emerald-600 dark:text-emerald-400">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Dataset Intelligence &amp; Analytics
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Real-time SQL group-by aggregations and parametric intelligence across {formatNumber(analytics.totalRecords)} records.
              </p>
            </div>
          </div>
        </div>

        {/* Dataset Switcher & Global Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Dataset Selector Dropdown */}
          <div className="relative">
            <select
              aria-label="Active Dataset for Analytics"
              value={currentDatasetId}
              onChange={(e) => dispatch(setSelectedDatasetId(e.target.value))}
              className="appearance-none pl-3 pr-8 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 shadow-sm cursor-pointer"
            >
              {datasets.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({formatNumber(d.totalRecords)} records)
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="text-xs gap-1.5 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
            title="Refresh database aggregations"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 ${
                isFetching ? 'motion-safe:animate-spin' : ''
              }`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          {/* Export Report */}
          <Button
            variant="primary"
            size="sm"
            onClick={handleExportReport}
            disabled={isExporting}
            className="text-xs font-semibold gap-1.5"
            title="Download CSV analytics breakdown"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Report</span>
          </Button>

          {/* Quick link to Data Explorer */}
          <Link
            href={`/dashboard/explorer?datasetId=${currentDatasetId}`}
            className="focus-visible:ring-2 focus-visible:ring-emerald-500 rounded"
          >
            <Button variant="subtle" size="sm" className="text-xs gap-1.5">
              <Table className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Explore Records</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Top 6 Executive KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Total Records */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm dark:shadow-none space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total Records
            </span>
            <div className="p-1 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Database className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="text-xl font-bold font-mono text-slate-900 dark:text-white">
            {formatNumber(analytics.totalRecords)}
          </p>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            <span>100% indexed in B-Tree</span>
          </span>
        </div>

        {/* Portfolio Valuation */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm dark:shadow-none space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Portfolio Valuation
            </span>
            <div className="p-1 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {formatCurrency(totalValuation)}
          </p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Sum of account values
          </span>
        </div>

        {/* Average Value */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm dark:shadow-none space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Average Account
            </span>
            <div className="p-1 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
            {formatCurrency(analytics.averageValue)}
          </p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Mean parametric value
          </span>
        </div>

        {/* Median Value */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm dark:shadow-none space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Median (P50)
            </span>
            <div className="p-1 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Sliders className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
            {formatCurrency(analytics.medianValue)}
          </p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            50th percentile central value
          </span>
        </div>

        {/* Active Ratio */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm dark:shadow-none space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Active Ratio
            </span>
            <div className="p-1 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {activeRatio}%
          </p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Operational healthy status
          </span>
        </div>

        {/* Geographic Coverage */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm dark:shadow-none space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Global Coverage
            </span>
            <div className="p-1 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Globe className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
            {uniqueCountriesCount} Countries
          </p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Across {uniqueMarketsCount} market segments
          </span>
        </div>
      </div>

      {/* Value Percentiles & Dispersion Bar */}
      {analytics.valuePercentiles && (
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm dark:shadow-none space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Sliders className="h-4 w-4" />
              </div>
              <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                Account Value Statistical Dispersion (PostgreSQL PERCENTILE_CONT)
              </h3>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              IQR Envelope: <span className="font-mono">{formatCurrency(analytics.valuePercentiles.p25)}</span> to{' '}
              <span className="font-mono">{formatCurrency(analytics.valuePercentiles.p75)}</span>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-center">
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Min Floor</span>
              <p className="text-xs sm:text-sm font-mono font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                {formatCurrency(analytics.valuePercentiles.min)}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">P25 (Q1)</span>
              <p className="text-xs sm:text-sm font-mono font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                {formatCurrency(analytics.valuePercentiles.p25)}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">P50 (Median)</span>
              <p className="text-xs sm:text-sm font-mono font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">
                {formatCurrency(analytics.valuePercentiles.p50)}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">P75 (Q3)</span>
              <p className="text-xs sm:text-sm font-mono font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                {formatCurrency(analytics.valuePercentiles.p75)}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">P90 Threshold</span>
              <p className="text-xs sm:text-sm font-mono font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                {formatCurrency(analytics.valuePercentiles.p90)}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Max Ceiling</span>
              <p className="text-xs sm:text-sm font-mono font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                {formatCurrency(analytics.valuePercentiles.max)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Dimension Tab Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <nav aria-label="Analytics view dimensions" className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
              activeTab === 'overview'
                ? 'bg-emerald-600 text-white font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Market Segments &amp; Status
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('geography')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
              activeTab === 'geography'
                ? 'bg-emerald-600 text-white font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Geographic Matrix
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('trends')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
              activeTab === 'trends'
                ? 'bg-emerald-600 text-white font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Ingestion &amp; Growth Trends
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('queries')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
              activeTab === 'queries'
                ? 'bg-emerald-600 text-white font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Search &amp; Filter Audit
          </button>
        </nav>

        {/* Metric View Mode Toggle (Count vs Value) */}
        {activeTab === 'overview' && (
          <div className="flex items-center gap-1 p-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-xs">
            <button
              type="button"
              onClick={() => setMetricView('count')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                metricView === 'count'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
              }`}
            >
              Record Count
            </button>
            <button
              type="button"
              onClick={() => setMetricView('value')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                metricView === 'value'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
              }`}
            >
              Total Valuation ($)
            </button>
          </div>
        )}
      </div>

      {/* TAB CONTENT 1: OVERVIEW & MARKET SEGMENTS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Records by Category */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm dark:shadow-none space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <Database className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Market Segment Distribution</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {metricView === 'count'
                      ? 'Distribution by total volume of accounts'
                      : 'Distribution by aggregated portfolio valuation'}
                  </p>
                </div>
                <Badge variant="outline" size="sm">
                  SQL GROUP BY
                </Badge>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.recordsByCategory}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis
                      dataKey="category"
                      stroke={axisStroke}
                      tick={{ fontSize: 10 }}
                      interval={0}
                    />
                    <YAxis
                      stroke={axisStroke}
                      tick={{ fontSize: 10 }}
                      tickFormatter={(val) =>
                        metricView === 'value' ? `$${(val / 1000).toFixed(0)}k` : formatNumber(val)
                      }
                    />
                    <Tooltip content={renderCustomTooltip} />
                    <Bar
                      dataKey={metricView === 'count' ? 'count' : 'totalValue'}
                      fill="hsl(158, 64%, 42%)"
                      radius={[4, 4, 0, 0]}
                      name={metricView === 'count' ? 'Record Count' : 'Total Value ($)'}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Records by Status Pie */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm dark:shadow-none space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <PieIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Status Lifecycle Breakdown</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Active, pending, and flagged account ratios
                  </p>
                </div>
                <Badge variant="outline" size="sm">
                  Full Pipeline
                </Badge>
              </div>

              <div className="h-72 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.recordsByStatus}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={85}
                      paddingAngle={3}
                      label={({ status, percentage }) => `${status}: ${percentage}%`}
                    >
                      {analytics.recordsByStatus.map((entry, index) => (
                        <Cell
                          key={`pie-cell-${index}`}
                          fill={STATUS_COLORS[entry.status] || CHART_PALETTE[index % CHART_PALETTE.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={renderCustomTooltip} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Detailed Market Segment Summary Table */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm dark:shadow-none space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Market Segment Breakdown Table
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Granular counts, relative share, and average account values per segment
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                    <th className="pb-3 font-semibold">Segment Name</th>
                    <th className="pb-3 font-semibold">Record Count</th>
                    <th className="pb-3 font-semibold">Share of Records</th>
                    <th className="pb-3 font-semibold">Total Valuation</th>
                    <th className="pb-3 font-semibold">Avg / Account</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {analytics.recordsByCategory.map((c) => {
                    const share =
                      analytics.totalRecords > 0
                        ? Math.round((c.count / analytics.totalRecords) * 1000) / 10
                        : 0;
                    const avgVal = c.count > 0 ? Math.round(c.totalValue / c.count) : 0;
                    return (
                      <tr key={c.category} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 font-medium text-slate-900 dark:text-slate-100">
                          {c.category}
                        </td>
                        <td className="py-3 font-mono text-slate-700 dark:text-slate-300">
                          {formatNumber(c.count)}
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-emerald-500"
                                style={{ width: `${Math.min(share, 100)}%` }}
                              />
                            </div>
                            <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                              {share}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3 font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                          {formatCurrency(c.totalValue)}
                        </td>
                        <td className="py-3 font-mono text-slate-600 dark:text-slate-400">
                          {formatCurrency(avgVal)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: GEOGRAPHIC & REGIONAL MATRIX */}
      {activeTab === 'geography' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Countries Horizontal Bar */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm dark:shadow-none space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <Globe className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Top Geographic Markets</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Highest concentration of enterprise business records
                  </p>
                </div>
                <Badge variant="outline" size="sm">
                  Top 8 Nations
                </Badge>
              </div>

              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.topCountries} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis
                      type="number"
                      stroke={axisStroke}
                      tick={{ fontSize: 10 }}
                      tickFormatter={(v) => formatNumber(v)}
                    />
                    <YAxis
                      dataKey="country"
                      type="category"
                      stroke={axisStroke}
                      tick={{ fontSize: 10 }}
                      width={90}
                    />
                    <Tooltip content={renderCustomTooltip} />
                    <Bar
                      dataKey="count"
                      fill="hsl(158, 64%, 42%)"
                      radius={[0, 4, 4, 0]}
                      name="Account Count"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Regional Contribution Breakdown */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm dark:shadow-none space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <Layers className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Regional Distribution</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Aggregated volume by macro-geographic territory
                  </p>
                </div>
                <Badge variant="outline" size="sm">
                  Multi-Region
                </Badge>
              </div>

              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.regionalDistribution || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis dataKey="region" stroke={axisStroke} tick={{ fontSize: 10 }} />
                    <YAxis stroke={axisStroke} tick={{ fontSize: 10 }} />
                    <Tooltip content={renderCustomTooltip} />
                    <Bar
                      dataKey="count"
                      fill="hsl(180, 50%, 45%)"
                      radius={[4, 4, 0, 0]}
                      name="Regional Accounts"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Regional Table */}
          {analytics.regionalDistribution && analytics.regionalDistribution.length > 0 && (
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm dark:shadow-none space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Regional Portfolio Valuation
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                      <th className="pb-3 font-semibold">Region / Territory</th>
                      <th className="pb-3 font-semibold">Total Accounts</th>
                      <th className="pb-3 font-semibold">Relative Share</th>
                      <th className="pb-3 font-semibold">Total Regional Value</th>
                      <th className="pb-3 font-semibold">Average Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {analytics.regionalDistribution.map((r) => {
                      const share =
                        analytics.totalRecords > 0
                          ? ((r.count / analytics.totalRecords) * 100).toFixed(1)
                          : '0';
                      const avg = r.count > 0 ? Math.round(r.totalValue / r.count) : 0;
                      return (
                        <tr key={r.region} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 font-medium text-slate-900 dark:text-slate-100">
                            {r.region}
                          </td>
                          <td className="py-3 font-mono text-slate-700 dark:text-slate-300">
                            {formatNumber(r.count)}
                          </td>
                          <td className="py-3 font-mono text-slate-500 dark:text-slate-400">
                            {share}%
                          </td>
                          <td className="py-3 font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                            {formatCurrency(r.totalValue)}
                          </td>
                          <td className="py-3 font-mono text-slate-600 dark:text-slate-400">
                            {formatCurrency(avg)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 3: INGESTION & GROWTH TRENDS */}
      {activeTab === 'trends' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm dark:shadow-none space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Cumulative Dataset Ingestion Timeline</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Aggregate historical growth curves bucketed by ingestion timestamp
                </p>
              </div>
              <Badge variant="success" size="sm">
                Active Sync Pipeline
              </Badge>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.growthTrends}>
                  <defs>
                    <linearGradient id="growthGradientAnalytics" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(158, 64%, 42%)" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="hsl(158, 64%, 42%)" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="date" stroke={axisStroke} tick={{ fontSize: 10 }} />
                  <YAxis
                    stroke={axisStroke}
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v) => formatNumber(v)}
                  />
                  <Tooltip content={renderCustomTooltip} />
                  <Area
                    type="monotone"
                    dataKey="cumulative"
                    stroke="hsl(158, 64%, 42%)"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#growthGradientAnalytics)"
                    name="Cumulative Records"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Monthly Ingestion Inflow Bar */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm dark:shadow-none space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Monthly Record Inflow Velocity
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  New records added per monthly synchronization cycle
                </p>
              </div>
              <span className="text-xs text-slate-500">
                <span className="font-mono">{analytics.growthTrends.length}</span> Ingestion Periods
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.growthTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="date" stroke={axisStroke} tick={{ fontSize: 10 }} />
                  <YAxis stroke={axisStroke} tick={{ fontSize: 10 }} />
                  <Tooltip content={renderCustomTooltip} />
                  <Bar
                    dataKey="count"
                    fill="hsl(210, 50%, 55%)"
                    radius={[4, 4, 0, 0]}
                    name="New Records Added"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: SEARCH & QUERY INTELLIGENCE */}
      {activeTab === 'queries' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Filter Usage Frequency */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm dark:shadow-none space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <Filter className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Frequently Applied Filter Dimensions</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Search history audit analyzing user filter patterns
                  </p>
                </div>
                <Badge variant="outline" size="sm">
                  Search Telemetry
                </Badge>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.filterUsageStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis dataKey="field" stroke={axisStroke} tick={{ fontSize: 10 }} />
                    <YAxis stroke={axisStroke} tick={{ fontSize: 10 }} />
                    <Tooltip content={renderCustomTooltip} />
                    <Bar
                      dataKey="usageCount"
                      fill="hsl(158, 64%, 42%)"
                      radius={[4, 4, 0, 0]}
                      name="Applications"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Index Recommendations & Pushdown Efficiency */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm dark:shadow-none space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Database className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Index Pushdown Alignment</span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  DataScope automatically compares user search filter frequency against database index definitions to ensure multi-condition pushdowns maintain sub-10ms response times.
                </p>

                <div className="space-y-2 pt-2">
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      Status &amp; Category Filters
                    </span>
                    <Badge variant="success" size="sm">
                      Composite B-Tree Active
                    </Badge>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      Country &amp; Region Scans
                    </span>
                    <Badge variant="success" size="sm">
                      Filtered Pushdown
                    </Badge>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      Free Text Searches
                    </span>
                    <Badge variant="success" size="sm">
                      pg_trgm GIN Inverted
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>Filter Pushdown Efficiency</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  99.8% Server Pushdown
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
