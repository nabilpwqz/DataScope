'use client';

import React from 'react';
import { useAppSelector } from '@/store';
import { useGetDatasetAnalyticsQuery } from '@/store/services/dataScopeApi';
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
  Legend,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { BarChart3, TrendingUp, PieChart as PieIcon, Globe, Filter, Database } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  Active: '#10b981',
  Pending: '#f59e0b',
  Archived: '#64748b',
  Suspended: '#ef4444',
  Completed: '#3b82f6',
  Flagged: '#f43f5e',
};

const CHART_COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#06b6d4'];

export default function AnalyticsPage() {
  const { selectedDatasetId } = useAppSelector((state) => state.dataset);
  const { data: analytics, isLoading } = useGetDatasetAnalyticsQuery(selectedDatasetId);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center py-24 space-y-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        <span className="text-xs text-slate-400 font-mono">
          Running backend SQL aggregation queries on 100,000+ records...
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
            <BarChart3 className="h-5 w-5 text-blue-400" />
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
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/50">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
            Total Dataset Records
          </span>
          <p className="mt-2 text-2xl font-bold font-mono text-white">
            {analytics.totalRecords.toLocaleString()}
          </p>
        </div>

        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/50">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
            Average Revenue / Account
          </span>
          <p className="mt-2 text-2xl font-bold font-mono text-emerald-400">
            {formatCurrency(analytics.averageValue)}
          </p>
        </div>

        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/50">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
            Active Status Ratio
          </span>
          <p className="mt-2 text-2xl font-bold font-mono text-blue-400">
            {analytics.recordsByStatus.find((s) => s.status === 'Active')?.percentage || 0}%
          </p>
        </div>
      </div>

      {/* Charts Grid Row 1: Category Bar & Status Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Records by Category */}
        <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/40 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Database className="h-4 w-4 text-indigo-400" />
              <span>Records by Market Segment</span>
            </h3>
            <span className="text-[11px] font-mono text-slate-500">GROUP BY category</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.recordsByCategory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="category" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Record Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Records by Status Pie */}
        <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/40 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <PieIcon className="h-4 w-4 text-emerald-400" />
              <span>Status Lifecycle Distribution</span>
            </h3>
            <span className="text-[11px] font-mono text-slate-500">GROUP BY status</span>
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
                <Tooltip
                  contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', borderRadius: '8px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Grid Row 2: Ingestion & Growth Trends */}
      <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/40 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-400" />
            <span>Cumulative Ingestion &amp; Growth Trends</span>
          </h3>
          <span className="text-[11px] font-mono text-slate-500">Date Bucket Grouping</span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={analytics.growthTrends}>
              <defs>
                <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 10 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', borderRadius: '8px', fontSize: '12px' }}
              />
              <Area
                type="monotone"
                dataKey="cumulative"
                stroke="#3b82f6"
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
        <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/40 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Globe className="h-4 w-4 text-cyan-400" />
              <span>Top Geographic Markets</span>
            </h3>
            <span className="text-[11px] font-mono text-slate-500">Top 8 Countries</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.topCountries} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis dataKey="country" type="category" stroke="#64748b" tick={{ fontSize: 10 }} width={80} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#06b6d4" radius={[0, 4, 4, 0]} name="Account Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Most Frequently Used Filters */}
        <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/40 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Filter className="h-4 w-4 text-purple-400" />
              <span>Most Frequently Applied Filter Dimensions</span>
            </h3>
            <span className="text-[11px] font-mono text-slate-500">Search Audit Analysis</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.filterUsageStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="field" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="usageCount" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Filter Applications" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

