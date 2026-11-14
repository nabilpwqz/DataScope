'use client';

import React from 'react';
import { useAppSelector } from '@/store';
import { useGetDatasetAnalyticsQuery } from '@/store/services/dataScopeApi';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
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
} from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  Active: 'hsl(158, 64%, 42%)',
  Pending: 'hsl(38, 92%, 50%)',
  Suspended: 'hsl(0, 72%, 51%)',
  Archived: 'hsl(215, 15%, 55%)',
  Completed: 'hsl(160, 60%, 55%)',
  Flagged: 'hsl(340, 75%, 55%)',
};

const CHART_COLORS = [
  'hsl(158, 64%, 42%)',
  'hsl(180, 50%, 45%)',
  'hsl(210, 50%, 55%)',
  'hsl(38, 92%, 50%)',
  'hsl(150, 60%, 40%)',
  'hsl(200, 60%, 50%)',
];

const tooltipStyle = {
  backgroundColor: 'hsl(220, 18%, 10%)',
  borderColor: 'hsl(220, 15%, 18%)',
  borderRadius: '6px',
  fontSize: '12px',
  color: 'hsl(210, 25%, 96%)',
};

export default function AnalyticsPage() {
  const { selectedDatasetId } = useAppSelector((state) => state.dataset);
  const { data: analytics, isLoading } = useGetDatasetAnalyticsQuery(selectedDatasetId);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center py-24 space-y-3">
        <div className="h-8 w-8 motion-safe:animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        <span className="text-xs text-slate-400">
          Running backend SQL aggregation queries on 100,000+ records…
        </span>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-emerald-400" />
            <span>Dataset Intelligence &amp; Analytics</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time backend SQL group-by aggregations executed across {analytics.totalRecords.toLocaleString()} records.
          </p>
        </div>

        <Badge variant="success" size="md">
          SQL Aggregations Optimized
        </Badge>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-lg border border-slate-800 bg-slate-900/50">
          <span className="text-xs font-medium text-slate-400">
            Total dataset records
          </span>
          <p className="mt-2 text-2xl font-bold font-mono text-white">
            {analytics.totalRecords.toLocaleString()}
          </p>
        </div>

        <div className="p-5 rounded-lg border border-slate-800 bg-slate-900/50">
          <span className="text-xs font-medium text-slate-400">
            Average revenue per account
          </span>
          <p className="mt-2 text-2xl font-bold font-mono text-emerald-400">
            {formatCurrency(analytics.averageValue)}
          </p>
        </div>

        <div className="p-5 rounded-lg border border-slate-800 bg-slate-900/50">
          <span className="text-xs font-medium text-slate-400">
            Active status ratio
          </span>
          <p className="mt-2 text-2xl font-bold font-mono text-slate-100">
            {analytics.recordsByStatus.find((s) => s.status === 'Active')?.percentage || 0}%
          </p>
        </div>
      </div>

      {/* Charts Grid Row 1: Category Bar & Status Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Records by Category */}
        <div className="p-6 rounded-lg border border-slate-800 bg-slate-900/40 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Database className="h-4 w-4 text-emerald-400" />
              <span>Records by market segment</span>
            </h3>
            <span className="text-xs text-slate-500">GROUP BY category</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.recordsByCategory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="category" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="hsl(158, 64%, 42%)" radius={[4, 4, 0, 0]} name="Record Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Records by Status Pie */}
        <div className="p-6 rounded-lg border border-slate-800 bg-slate-900/40 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <PieIcon className="h-4 w-4 text-emerald-400" />
              <span>Status lifecycle distribution</span>
            </h3>
            <span className="text-xs text-slate-500">GROUP BY status</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.recordsByStatus}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  label={({ status, percentage }) => `${status}: ${percentage}%`}
                >
                  {analytics.recordsByStatus.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={STATUS_COLORS[entry.status] || CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Grid Row 2: Ingestion & Growth Trends */}
      <div className="p-6 rounded-lg border border-slate-800 bg-slate-900/40 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <span>Cumulative ingestion and growth trends</span>
          </h3>
          <span className="text-xs text-slate-500">Date bucket grouping</span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={analytics.growthTrends}>
              <defs>
                <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(158, 64%, 42%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(158, 64%, 42%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 10 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area
                type="monotone"
                dataKey="cumulative"
                stroke="hsl(158, 64%, 42%)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#growthGradient)"
                name="Cumulative Records"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Grid Row 3: Top Countries & Filter Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Countries */}
        <div className="p-6 rounded-lg border border-slate-800 bg-slate-900/40 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Globe className="h-4 w-4 text-emerald-400" />
              <span>Top geographic markets</span>
            </h3>
            <span className="text-xs text-slate-500">Top 8 countries</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.topCountries} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis dataKey="country" type="category" stroke="#64748b" tick={{ fontSize: 10 }} width={80} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="hsl(158, 64%, 42%)" radius={[0, 4, 4, 0]} name="Account Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Most Frequently Used Filters */}
        <div className="p-6 rounded-lg border border-slate-800 bg-slate-900/40 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Filter className="h-4 w-4 text-emerald-400" />
              <span>Most frequently applied filter dimensions</span>
            </h3>
            <span className="text-xs text-slate-500">Search audit analysis</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.filterUsageStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="field" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="usageCount" fill="hsl(158, 64%, 42%)" radius={[4, 4, 0, 0]} name="Filter Applications" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
