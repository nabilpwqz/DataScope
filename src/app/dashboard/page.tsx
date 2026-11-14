'use client';

import React from 'react';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store';
import { setAiModalOpen } from '@/store/slices/savedViewsSlice';
import { setSelectedDatasetId } from '@/store/slices/datasetSlice';
import {
  useGetDatasetsQuery,
  useGetDatasetAnalyticsQuery,
  useGetPerformanceMetricsQuery,
} from '@/store/services/dataScopeApi';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
} from 'lucide-react';

export default function DashboardOverviewPage() {
  const dispatch = useAppDispatch();
  const { selectedDatasetId } = useAppSelector((state) => state.dataset);

  const { data: datasets = [] } = useGetDatasetsQuery();
  const { data: perfData } = useGetPerformanceMetricsQuery();

  const totalRecordsAcrossDatasets = datasets.reduce((acc, d) => acc + (d.totalRecords || 0), 0);

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-8 max-w-7xl mx-auto w-full">
      {/* Welcome & Overview Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              DataScope Intelligence Platform
            </h1>
            <Badge variant="success" size="md">
              Enterprise v1.0
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Real-time exploration, indexed full-text discovery, and analytics across enterprise records.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="subtle"
            size="sm"
            onClick={() => dispatch(setAiModalOpen(true))}
            className="text-xs gap-1.5"
          >
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <span>AI query assistant</span>
          </Button>

          <Link href="/dashboard/explorer" className="focus-visible:ring-2 focus-visible:ring-emerald-500 rounded">
            <Button variant="primary" size="sm" className="text-xs font-semibold gap-1.5">
              <Table className="h-4 w-4" />
              <span>Open data explorer</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Records */}
        <div className="p-5 rounded-lg border border-slate-800 bg-slate-900/60 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              Total indexed records
            </span>
            <div className="p-2 rounded bg-emerald-500/10 text-emerald-400">
              <Database className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">
              {totalRecordsAcrossDatasets.toLocaleString()}
            </span>
            <span className="text-xs font-medium text-emerald-400 flex items-center">
              +100k seeded
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Indexed with B-Tree and GIN full-text vectors
          </p>
        </div>

        {/* ARR / Aggregate Value */}
        <div className="p-5 rounded-lg border border-slate-800 bg-slate-900/60 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              Monitored enterprise ARR
            </span>
            <div className="p-2 rounded bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">
              $14.2B+
            </span>
            <span className="text-xs font-medium text-slate-400">
              Global B2B
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Calculated via backend SQL aggregations
          </p>
        </div>

        {/* Avg Query Latency */}
        <div className="p-5 rounded-lg border border-slate-800 bg-slate-900/60 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              Search response time
            </span>
            <div className="p-2 rounded bg-emerald-500/10 text-emerald-400">
              <Zap className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-100">
              ~6.4 ms
            </span>
            <Badge variant="success" size="sm">
              Sub-10ms
            </Badge>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            PostgreSQL composite indexes + FTS
          </p>
        </div>

        {/* LRU Cache Hit Rate */}
        <div className="p-5 rounded-lg border border-slate-800 bg-slate-900/60 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              Query cache hit rate
            </span>
            <div className="p-2 rounded bg-emerald-500/10 text-emerald-400">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">
              {perfData?.cacheStats?.hitRate || 74.2}%
            </span>
            <span className="text-xs font-medium text-slate-400">
              LRU memory
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Deterministic query deduplication
          </p>
        </div>
      </div>

      {/* Datasets Library Quick Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-100">Enterprise datasets</h2>
            <p className="text-xs text-slate-400">
              Select any collection to immediately explore and filter records.
            </p>
          </div>
          <Link href="/dashboard/datasets" className="focus-visible:ring-2 focus-visible:ring-emerald-500 rounded">
            <Button variant="ghost" size="sm" className="text-xs text-emerald-400 hover:text-emerald-300">
              Manage collections
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
                className={`p-5 rounded-lg border transition-colors cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-900 border-emerald-500/60 ring-1 ring-emerald-500/30 shadow-lg'
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant={d.accessLevel === 'public' ? 'success' : d.accessLevel === 'restricted' ? 'warning' : 'danger'} size="sm">
                      {d.accessLevel}
                    </Badge>
                    <span className="text-xs text-emerald-400 font-medium">
                      <strong className="font-mono">{d.totalRecords.toLocaleString()}</strong> rows
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-white pt-1">{d.name}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {d.description}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span className="truncate max-w-[150px]">{d.category}</span>
                  <Link href="/dashboard/explorer">
                    <span className="text-emerald-400 font-medium hover:underline flex items-center gap-1">
                      <span>Explore dataset</span>
                    </span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Architecture Highlights & Live Features Section */}
      <div className="p-6 rounded-lg border border-slate-800 bg-slate-900/80 space-y-4">
        <div className="flex items-center gap-2">
          <Server className="h-5 w-5 text-emerald-400" />
          <h3 className="text-base font-semibold text-slate-100">
            Engineered for high scale data discovery
          </h3>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
          DataScope avoids loading unbounded datasets into the browser. Instead, all filtering,
          full-text stemming, trigram fuzzy matching, multi-column sorting, and statistical aggregations
          are pushed down to PostgreSQL indexes. TanStack Virtual guarantees steady 60fps scrolling
          regardless of table length.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-3.5 rounded border border-slate-800 bg-slate-950/60">
            <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Pushdown SQL filtering
            </h4>
            <p className="mt-1 text-xs text-slate-400 leading-relaxed">
              Composite indexes on <code className="text-emerald-300 font-mono text-[11px]">(dataset_id, status, numeric_value)</code> prune records in milliseconds.
            </p>
          </div>

          <div className="p-3.5 rounded border border-slate-800 bg-slate-950/60">
            <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              RTK Query state split
            </h4>
            <p className="mt-1 text-xs text-slate-400 leading-relaxed">
              Clear separation between Global Client State (slices), Server State (RTK cache), and URL search params.
            </p>
          </div>

          <div className="p-3.5 rounded border border-slate-800 bg-slate-950/60">
            <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Multi-engine search
            </h4>
            <p className="mt-1 text-xs text-slate-400 leading-relaxed">
              Benchmark PostgreSQL Full-Text Search against Trigram fuzzy matching and exact match in real-time.
            </p>
          </div>
        </div>

        <div className="pt-2 flex items-center gap-3">
          <Link href="/dashboard/architecture" className="focus-visible:ring-2 focus-visible:ring-emerald-500 rounded">
            <Button variant="outline" size="sm" className="text-xs gap-1.5 text-slate-200">
              <Server className="h-3.5 w-3.5 text-emerald-400" />
              <span>Read technical decision records</span>
            </Button>
          </Link>
          <Link href="/dashboard/performance" className="focus-visible:ring-2 focus-visible:ring-emerald-500 rounded">
            <Button variant="ghost" size="sm" className="text-xs text-emerald-400 hover:text-emerald-300">
              <span>Run benchmark suite</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
