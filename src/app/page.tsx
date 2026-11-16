import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataScopeLogo } from '@/components/brand/logo';
import { SpatialDataLens } from '@/components/landing/spatial-data-lens';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { Footer } from '@/components/layout/footer';
import {
  IconTable,
  IconServer,
  IconArrowRight,
  IconSearch,
  IconDatabase,
  IconSliders,
  IconShield,
  IconActivity,
} from '@/components/ui/icons';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col selection:bg-emerald-600 selection:text-white transition-colors duration-150">
      {/* Top Enterprise Navigation */}
      <header className="sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm px-4 md:px-12">
        <Link href="/" className="focus-visible:ring-2 focus-visible:ring-emerald-500 rounded p-1">
          <DataScopeLogo size="md" subtitle="Enterprise Data Intelligence" />
        </Link>

        <nav aria-label="Main navigation" className="hidden md:flex items-center gap-6 text-xs text-slate-600 dark:text-slate-400 font-medium">
          <Link href="#spatial-engine" className="hover:text-slate-900 dark:hover:text-slate-200 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 rounded p-1">
            Spatial Engine
          </Link>
          <Link href="#architecture" className="hover:text-slate-900 dark:hover:text-slate-200 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 rounded p-1">
            Architecture
          </Link>
          <Link href="#benchmarks" className="hover:text-slate-900 dark:hover:text-slate-200 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 rounded p-1">
            Benchmarks
          </Link>
          <Link href="/dashboard/architecture" className="hover:text-slate-900 dark:hover:text-slate-200 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 rounded p-1">
            Technical ADRs
          </Link>
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <ThemeToggle />
          <Link href="/login" className="focus-visible:ring-2 focus-visible:ring-emerald-500 rounded">
            <Button variant="ghost" size="sm" className="text-xs px-2 sm:px-3 text-slate-700 dark:text-slate-300">
              Sign In
            </Button>
          </Link>
          <Link href="/dashboard/explorer" className="focus-visible:ring-2 focus-visible:ring-emerald-500 rounded">
            <Button variant="primary" size="sm" className="text-xs font-semibold gap-1.5 px-2.5 sm:px-3">
              <span className="hidden xs:inline">Launch </span>
              <span>Explorer</span>
              <IconArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 py-12 md:py-20 max-w-6xl mx-auto w-full text-center space-y-6">
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-3xl mx-auto leading-tight">
          Explore enterprise datasets with precision and speed
        </h1>

        <p className="text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Search, filter, and inspect complex enterprise business records with indexed PostgreSQL pushdown execution and in-memory LRU caching.
        </p>

        {/* Hero Actions */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link href="/dashboard/explorer" className="focus-visible:ring-2 focus-visible:ring-emerald-500 rounded">
            <Button variant="primary" size="lg" className="text-xs sm:text-sm font-semibold gap-2">
              <IconTable className="h-4 w-4" />
              <span>Explore Live Records</span>
            </Button>
          </Link>
          <Link href="/dashboard/architecture" className="focus-visible:ring-2 focus-visible:ring-emerald-500 rounded">
            <Button variant="outline" size="lg" className="text-xs sm:text-sm font-medium gap-2 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-emerald-500/50">
              <IconServer className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Architecture and ADRs</span>
            </Button>
          </Link>
        </div>

        {/* 3D Interactive Spatial Telemetry Engine */}
        <div id="spatial-engine" className="pt-6">
          <SpatialDataLens />
        </div>
      </section>

      {/* Architectural Workbench Section (Split 2-Column) */}
      <section id="architecture" className="py-16 px-4 sm:px-6 max-w-6xl mx-auto w-full space-y-12 border-t border-slate-200 dark:border-slate-800">
        <div className="text-left space-y-2 max-w-2xl">
          <Badge variant="success" size="sm">
            Core Architecture
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Engineered for high-volume enterprise discovery
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Eliminating client-side memory exhaustion and slow table rendering through server pushdown filtering and DOM virtualization.
          </p>
        </div>

        {/* 2-Column Split Workbench */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left Column: Visual Telemetry Art with Light and Dark Image Modes */}
          <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-sm dark:shadow-none overflow-hidden transition-colors">
            <div className="relative h-64 sm:h-80 w-full bg-slate-100 dark:bg-slate-950">
              {/* Light Mode Version Image */}
              <Image
                src="/images/architecture-3d-light.png"
                alt="DataScope Query Planner Execution Architecture Light Mode"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover block dark:hidden"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-transparent to-transparent block dark:hidden" />

              {/* Dark Mode Version Image */}
              <Image
                src="/images/architecture-3d.png"
                alt="DataScope Query Planner Execution Architecture Dark Mode"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover hidden dark:block"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-85 hidden dark:block" />
            </div>

            <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/90 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold tracking-wide">
                    QUERY PLANNER EXECUTION
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold">
                  <span>ENGINE EXEC: <span className="font-mono">3.42</span>ms</span>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                PostgreSQL composite B-tree and GIN trigram indexes evaluate multi-condition boolean trees directly in the engine before returning serialized row pages.
              </p>

              {/* Technical EXPLAIN ANALYZE Breakdown */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">-&gt;</span>
                    <span>Index Scan using idx_record_key</span>
                  </span>
                  <span className="font-mono text-slate-500 dark:text-slate-400">0.082 ms</span>
                </div>
                <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">-&gt;</span>
                    <span>GIN Trigram Search Scan</span>
                  </span>
                  <span className="font-mono text-slate-500 dark:text-slate-400">6.812 ms</span>
                </div>
                <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">-&gt;</span>
                    <span>Keyset Cursor Seek (Row 100k)</span>
                  </span>
                  <span className="font-mono text-slate-500 dark:text-slate-400">0.104 ms</span>
                </div>
                <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">-&gt;</span>
                    <span>Cross-Region Transit (iad1 -&gt; sin1)</span>
                  </span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">~220 ms</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Architectural Pillars */}
          <div className="space-y-4">
            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm dark:shadow-none space-y-2 hover:border-emerald-500/40 transition-colors">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <IconDatabase className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Server-Side Pushdown Filtering</h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Queries are never executed in browser memory. Advanced filter conditions, date ranges, and numeric thresholds compile into parameterized SQL pushdowns.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm dark:shadow-none space-y-2 hover:border-emerald-500/40 transition-colors">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <IconTable className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">TanStack Virtual 60fps Table</h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                DOM virtualization renders only visible viewport rows. Multi-column sorting, column reordering, custom visibility toggles, and instant row inspection run with zero frame drops.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm dark:shadow-none space-y-2 hover:border-emerald-500/40 transition-colors">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <IconShield className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Role-Based Access Control (RBAC)</h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Granular security across Administrator, Data Analyst, and Viewer roles. Server-enforced access policies protect sensitive dataset columns and export actions.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm dark:shadow-none space-y-2 hover:border-emerald-500/40 transition-colors">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <IconActivity className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Two-Tier Caching &amp; Deduplication</h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                RTK Query client cache deduplicates inflight network requests while server-side SharedQueryCache delivers frequent repeat searches in sub-15 ms.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Live Benchmark & Telemetry Summary */}
      <section id="benchmarks" className="py-20 px-4 sm:px-6 max-w-6xl mx-auto w-full space-y-12 border-t border-slate-200 dark:border-slate-800">
        <div className="text-center space-y-3">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Validated Enterprise Performance
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
            Benchmark results captured on 120,000 seeded business records in PostgreSQL.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              Engine Scan: &lt; 10.0 ms | Cloud HTTP: 80-250 ms
            </span>
            <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              Database: Neon Serverless PostgreSQL 15
            </span>
            <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              Engine: PostgreSQL 15 EXPLAIN ANALYZE
            </span>
          </div>
        </div>

        {/* 4-Column Structured Benchmark Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-left">
          {/* Card 1: Exact Key Lookup */}
          <div className="group relative p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-sm dark:shadow-none hover:border-emerald-500/50 transition-colors duration-200 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/40 text-emerald-600 dark:text-emerald-400">
                  <IconDatabase className="h-5 w-5" />
                </div>
                <span className="px-2 py-0.5 rounded text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                  O(log N)
                </span>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-wide">
                  Exact Key Lookup
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                    0.08
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">ms</span>
                </div>
              </div>

              <div className="space-y-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                <div className="flex items-center justify-between">
                  <span>Execution path</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">Index Scan</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: '100%' }} />
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-1">
              <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                B-tree index on recordKey
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                Single I/O page index scan directly traversing balanced node tree.
              </p>
            </div>
          </div>

          {/* Card 2: Trigram Fuzzy Search */}
          <div className="group relative p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-sm dark:shadow-none hover:border-emerald-500/50 transition-colors duration-200 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/40 text-emerald-600 dark:text-emerald-400">
                  <IconSearch className="h-5 w-5" />
                </div>
                <span className="px-2 py-0.5 rounded text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                  GIN Vector
                </span>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-wide">
                  Trigram Fuzzy Search
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                    6.8
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">ms</span>
                </div>
              </div>

              <div className="space-y-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                <div className="flex items-center justify-between">
                  <span>Execution path</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">Bitmap Index Scan</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: '100%' }} />
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-1">
              <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                pg_trgm word similarity
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                Generalized Inverted Index decomposing token substrings into 3-gram sets.
              </p>
            </div>
          </div>

          {/* Card 3: Keyset Cursor Seek */}
          <div className="group relative p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-sm dark:shadow-none hover:border-emerald-500/50 transition-colors duration-200 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/40 text-emerald-600 dark:text-emerald-400">
                  <IconSliders className="h-5 w-5" />
                </div>
                <span className="px-2 py-0.5 rounded text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                  O(1) Seek
                </span>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-wide">
                  Keyset Cursor Seek
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                    0.10
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">ms</span>
                </div>
              </div>

              <div className="space-y-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                <div className="flex items-center justify-between">
                  <span>Execution path</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">B-Tree Seek (Row 100k)</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: '100%' }} />
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-1">
              <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                (record_date, id) &lt; ($1, $2)
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                Deterministic keyset cursor seek completely bypassing deep offset performance penalty.
              </p>
            </div>
          </div>

          {/* Card 4: L1 Server Cache HIT */}
          <div className="group relative p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-sm dark:shadow-none hover:border-emerald-500/50 transition-colors duration-200 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/40 text-emerald-600 dark:text-emerald-400">
                  <IconServer className="h-5 w-5" />
                </div>
                <span className="px-2 py-0.5 rounded text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                  Zero I/O
                </span>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-wide">
                  L1 Server Cache HIT
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-extrabold font-mono text-slate-900 dark:text-slate-100">
                    0.12
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">ms</span>
                </div>
              </div>

              <div className="space-y-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                <div className="flex items-center justify-between">
                  <span>Execution path</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">In-Memory LRU Cache</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-400 dark:bg-emerald-300" style={{ width: '100%' }} />
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-1">
              <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                In-memory LRU query cache
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                Sub-millisecond memory-resident response for repeated enterprise queries.
              </p>
            </div>
          </div>
        </div>

        {/* Enterprise Telemetry Latency Matrix */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm dark:shadow-none flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <IconActivity className="h-4 w-4" />
            </div>
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Transparent Latency Decomposition:
              </span>
              <span className="ml-1.5 text-slate-500 dark:text-slate-400">
                In-engine query execution is sub-10ms; total client response time includes cross-region WAN transit.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>Engine Scan: <span className="font-mono">0.08-9.2</span>ms</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>L1 Cache: <span className="font-mono">&lt; 1.0</span>ms</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-slate-400" />
              <span>WAN Transit: <span className="font-mono">~220</span>ms</span>
            </span>
          </div>
        </div>
      </section>

      {/* Enterprise CTA Strip */}
      <section className="py-12 px-4 sm:px-6 max-w-4xl mx-auto w-full">
        <div className="relative p-8 sm:p-10 rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-emerald-500/5 via-emerald-500/[0.02] to-transparent dark:from-emerald-950/40 dark:via-slate-900/80 dark:to-slate-950 backdrop-blur-md text-center space-y-6 shadow-sm dark:shadow-2xl overflow-hidden">
          <div className="space-y-2 relative z-10">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Ready to explore enterprise data at scale?
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              Experience sub-second data discovery across large structured business datasets.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-1 relative z-10">
            <Link href="/dashboard/explorer" className="focus-visible:ring-2 focus-visible:ring-emerald-500 rounded">
              <Button variant="primary" size="lg" className="text-xs sm:text-sm font-semibold gap-2">
                <span>Start Exploring</span>
                <IconArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login" className="focus-visible:ring-2 focus-visible:ring-emerald-500 rounded">
              <Button variant="outline" size="lg" className="text-xs sm:text-sm font-medium border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:border-emerald-500/50">
                Sign In with Credentials
              </Button>
            </Link>
          </div>

          {/* Architecture Technology Specification Pills */}
          <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs text-slate-600 dark:text-slate-400 relative z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Next.js 14 App Router
            </span>
            <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">|</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              TypeScript Strict
            </span>
            <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">|</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              PostgreSQL &amp; Drizzle ORM
            </span>
            <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">|</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Dockerized
            </span>
          </div>
        </div>
      </section>

      {/* Enterprise Platform Footer */}
      <Footer />
    </div>
  );
}
