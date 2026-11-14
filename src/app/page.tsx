import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataScopeLogo } from '@/components/brand/logo';
import { SpatialDataLens } from '@/components/landing/spatial-data-lens';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import {
  IconTable,
  IconServer,
  IconArrowRight,
  IconSearch,
  IconDatabase,
  IconSliders,
  IconShield,
  IconActivity,
  IconChart,
} from '@/components/ui/icons';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-600 selection:text-white">
      {/* Top Enterprise Navigation */}
      <header className="sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b border-slate-800 bg-slate-950/90 backdrop-blur-md px-4 md:px-12">
        <Link href="/" className="focus-visible:ring-2 focus-visible:ring-emerald-500 rounded p-1">
          <DataScopeLogo size="md" subtitle="Enterprise Data Intelligence" />
        </Link>

        <nav aria-label="Main navigation" className="hidden md:flex items-center gap-6 text-xs text-slate-400 font-medium">
          <Link href="#spatial-engine" className="hover:text-slate-200 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 rounded p-1">
            Spatial Engine
          </Link>
          <Link href="#architecture" className="hover:text-slate-200 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 rounded p-1">
            Architecture
          </Link>
          <Link href="#benchmarks" className="hover:text-slate-200 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 rounded p-1">
            Benchmarks
          </Link>
          <Link href="/dashboard/architecture" className="hover:text-slate-200 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 rounded p-1">
            Technical ADRs
          </Link>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <Link href="/login" className="focus-visible:ring-2 focus-visible:ring-emerald-500 rounded">
            <Button variant="ghost" size="sm" className="text-xs text-slate-300">
              Sign In
            </Button>
          </Link>
          <Link href="/dashboard/explorer" className="focus-visible:ring-2 focus-visible:ring-emerald-500 rounded">
            <Button variant="primary" size="sm" className="text-xs font-semibold gap-1.5">
              <span>Launch Explorer</span>
              <IconArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 py-12 md:py-20 max-w-6xl mx-auto w-full text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-950/40 text-emerald-400 text-xs font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 motion-safe:animate-ping" />
          <span>PostgreSQL 15 Trigram &amp; GIN Powered Architecture</span>
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white max-w-3xl mx-auto leading-tight">
          Explore enterprise datasets with precision and speed
        </h1>

        <p className="text-xs sm:text-sm md:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Search, filter, and inspect complex business records with sub-10ms query execution, DOM virtualization, and strict role-based access controls.
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
            <Button variant="outline" size="lg" className="text-xs sm:text-sm font-medium gap-2 text-slate-200 border-slate-700 bg-slate-900 hover:border-emerald-500/50">
              <IconServer className="h-4 w-4 text-emerald-400" />
              <span>Architecture and ADRs</span>
            </Button>
          </Link>
        </div>

        {/* 3D Interactive Spatial Telemetry Engine */}
        <div id="spatial-engine" className="pt-6">
          <SpatialDataLens />
        </div>
      </section>

      {/* Architectural Workbench Section (Split 2-Column, NOT 3 cards in a row) */}
      <section id="architecture" className="py-16 px-4 sm:px-6 max-w-6xl mx-auto w-full space-y-12 border-t border-slate-800">
        <div className="text-left space-y-2 max-w-2xl">
          <Badge variant="success" size="sm">
            Core Architecture
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Engineered for high-volume enterprise discovery
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Eliminating client-side memory exhaustion and slow table rendering through server pushdown filtering and DOM virtualization.
          </p>
        </div>

        {/* 2-Column Split Workbench */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left Column: Visual Telemetry Art */}
          <div className="relative rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-2xl">
            <div className="relative h-64 sm:h-80 w-full">
              <Image
                src="/images/architecture-3d.png"
                alt="3D Telemetry Cube & Query Laser"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
            </div>
            <div className="p-5 border-t border-slate-800 bg-slate-950/90 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-emerald-400 font-semibold">QUERY PLANNER EXECUTION</span>
                <span className="text-slate-400">LATENCY: 3.42ms</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                PostgreSQL composite B-tree and GIN trigram indexes evaluate multi-condition boolean trees directly in the engine before returning serialized row pages.
              </p>
            </div>
          </div>

          {/* Right Column: Architectural Pillars */}
          <div className="space-y-4">
            <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2 hover:border-emerald-500/40 transition-colors">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded bg-emerald-500/10 text-emerald-400">
                  <IconDatabase className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-semibold text-white">Server-Side Pushdown Filtering</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Queries are never executed in browser memory. Advanced filter conditions, date ranges, and numeric thresholds compile into parameterized SQL pushdowns.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2 hover:border-emerald-500/40 transition-colors">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded bg-emerald-500/10 text-emerald-400">
                  <IconTable className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-semibold text-white">TanStack Virtual 60fps Table</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                DOM virtualization renders only visible viewport rows. Multi-column sorting, column reordering, custom visibility toggles, and instant row inspection run with zero frame drops.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2 hover:border-emerald-500/40 transition-colors">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded bg-emerald-500/10 text-emerald-400">
                  <IconShield className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-semibold text-white">Role-Based Access Control (RBAC)</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Granular security across Administrator, Data Analyst, and Viewer roles. Server-enforced access policies protect sensitive dataset columns and export actions.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2 hover:border-emerald-500/40 transition-colors">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded bg-emerald-500/10 text-emerald-400">
                  <IconActivity className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-semibold text-white">Two-Tier Caching &amp; Deduplication</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                RTK Query client cache deduplicates inflight network requests while server-side LRU cache serves frequent searches in sub-1ms response times.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Live Benchmark & Telemetry Summary */}
      <section id="benchmarks" className="py-16 px-4 sm:px-6 max-w-6xl mx-auto w-full space-y-8 border-t border-slate-800">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Validated Enterprise Performance
          </h2>
          <p className="text-xs text-slate-400 max-w-lg mx-auto">
            Benchmark results captured on 110,000 seeded business records in PostgreSQL.
          </p>
        </div>

        {/* 4-Column Structured Benchmark Table */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-left">
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/70 space-y-1">
            <span className="text-xs text-slate-400 font-medium">Exact Key Lookup</span>
            <div className="text-2xl font-bold font-mono text-emerald-400">0.8 ms</div>
            <p className="text-[11px] text-slate-500">B-tree index on recordKey</p>
          </div>

          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/70 space-y-1">
            <span className="text-xs text-slate-400 font-medium">Trigram Fuzzy Search</span>
            <div className="text-2xl font-bold font-mono text-emerald-400">4.2 ms</div>
            <p className="text-[11px] text-slate-500">pg_trgm word similarity</p>
          </div>

          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/70 space-y-1">
            <span className="text-xs text-slate-400 font-medium">Composite Multi-Filter</span>
            <div className="text-2xl font-bold font-mono text-emerald-400">6.1 ms</div>
            <p className="text-[11px] text-slate-500">Status, date range, numeric</p>
          </div>

          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/70 space-y-1">
            <span className="text-xs text-slate-400 font-medium">L1 Server Cache HIT</span>
            <div className="text-2xl font-bold font-mono text-slate-100">0.2 ms</div>
            <p className="text-[11px] text-slate-500">In-memory LRU query cache</p>
          </div>
        </div>
      </section>

      {/* Enterprise CTA Strip */}
      <section className="py-12 px-4 sm:px-6 max-w-4xl mx-auto w-full">
        <div className="p-8 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 backdrop-blur-md text-center space-y-4">
          <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Ready to explore enterprise data at scale?
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            Experience sub-second data discovery across large structured business datasets.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link href="/dashboard/explorer" className="focus-visible:ring-2 focus-visible:ring-emerald-500 rounded">
              <Button variant="primary" size="md" className="text-xs font-semibold gap-1.5">
                <span>Start Exploring</span>
                <IconArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
            <Link href="/login" className="focus-visible:ring-2 focus-visible:ring-emerald-500 rounded">
              <Button variant="outline" size="md" className="text-xs font-medium border-slate-700 bg-slate-900">
                Sign In with Credentials
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800 bg-slate-950 py-8 px-4 sm:px-12 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <DataScopeLogo size="sm" subtitle="Enterprise Platform" />
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-slate-400">
            <span>Next.js 14 App Router</span>
            <span className="text-slate-700">|</span>
            <span>TypeScript Strict</span>
            <span className="text-slate-700">|</span>
            <span>PostgreSQL &amp; Prisma</span>
            <span className="text-slate-700">|</span>
            <span>Dockerized</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
