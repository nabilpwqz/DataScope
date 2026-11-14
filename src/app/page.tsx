import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Zap,
  Database,
  Search,
  Table,
  SlidersHorizontal,
  Activity,
  Layers,
  ArrowRight,
  ShieldCheck,
  Server,
  BarChart3,
  Lock,
  CheckCircle2,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-600 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b border-slate-800 bg-slate-950 px-6 md:px-12">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded bg-emerald-600 text-white font-bold text-lg shadow-sm">
            <Zap className="h-5 w-5" />
          </div>
          <div className="flex flex-col text-left">
            <span className="font-bold text-white text-base leading-tight">DataScope</span>
            <span className="text-xs text-slate-400">
              Enterprise data discovery platform
            </span>
          </div>
        </div>

        <nav aria-label="Main navigation" className="hidden md:flex items-center gap-6 text-xs text-slate-400 font-medium">
          <Link href="#architecture" className="hover:text-slate-200 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 rounded p-1">
            Architecture
          </Link>
          <Link href="#search-engine" className="hover:text-slate-200 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 rounded p-1">
            Search engine
          </Link>
          <Link href="#data-table" className="hover:text-slate-200 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 rounded p-1">
            Virtual table
          </Link>
          <Link href="#benchmarks" className="hover:text-slate-200 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 rounded p-1">
            Benchmarks
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/login" className="focus-visible:ring-2 focus-visible:ring-emerald-500 rounded">
            <Button variant="ghost" size="sm" className="text-xs text-slate-300">
              Sign in
            </Button>
          </Link>
          <Link href="/dashboard" className="focus-visible:ring-2 focus-visible:ring-emerald-500 rounded">
            <Button variant="primary" size="sm" className="text-xs font-semibold gap-1.5">
              <span>Launch platform</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 py-16 md:py-24 max-w-6xl mx-auto w-full text-center space-y-6">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white max-w-2xl mx-auto leading-tight">
          Explore enterprise data at scale
        </h1>

        <p className="text-sm md:text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
          Search, filter, and analyze indexed business records with sub-10ms query execution.
        </p>

        {/* Hero Actions */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link href="/dashboard/explorer" className="focus-visible:ring-2 focus-visible:ring-emerald-500 rounded">
            <Button variant="primary" size="lg" className="text-sm font-semibold gap-2">
              <Table className="h-4 w-4" />
              <span>Explore live records</span>
            </Button>
          </Link>
          <Link href="/dashboard/architecture" className="focus-visible:ring-2 focus-visible:ring-emerald-500 rounded">
            <Button variant="outline" size="lg" className="text-sm font-medium gap-2 text-slate-200 border-slate-700 bg-slate-900">
              <Server className="h-4 w-4 text-emerald-400" />
              <span>Review architecture and ADRs</span>
            </Button>
          </Link>
        </div>

        {/* Live Metrics Grid */}
        <div className="pt-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
          <div className="p-4 rounded-lg border border-slate-800 bg-slate-900/60">
            <span className="text-2xl font-bold font-mono text-white">110,000+</span>
            <p className="text-xs text-slate-400 mt-1">Seeded enterprise rows</p>
          </div>
          <div className="p-4 rounded-lg border border-slate-800 bg-slate-900/60">
            <span className="text-2xl font-bold font-mono text-emerald-400">&lt; 8 ms</span>
            <p className="text-xs text-slate-400 mt-1">Indexed search latency</p>
          </div>
          <div className="p-4 rounded-lg border border-slate-800 bg-slate-900/60">
            <span className="text-2xl font-bold font-mono text-slate-100">60 FPS</span>
            <p className="text-xs text-slate-400 mt-1">TanStack virtual scrolling</p>
          </div>
          <div className="p-4 rounded-lg border border-slate-800 bg-slate-900/60">
            <span className="text-2xl font-bold font-mono text-emerald-400">3 Roles</span>
            <p className="text-xs text-slate-400 mt-1">Granular RBAC security</p>
          </div>
        </div>

        {/* Live Interactive Table Preview Frame */}
        <div className="pt-8 max-w-4xl mx-auto w-full text-left">
          <div className="rounded-xl border border-slate-800 bg-slate-900/90 overflow-hidden">
            {/* Header of mock window */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950 text-xs">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-700 inline-block" />
                <span className="h-2.5 w-2.5 rounded-full bg-slate-700 inline-block" />
                <span className="h-2.5 w-2.5 rounded-full bg-slate-700 inline-block" />
                <span className="ml-2 text-slate-400">dataset: <code className="font-mono text-slate-300">global-sales</code> (100,000 rows)</span>
              </div>
              <div className="flex items-center gap-3 text-slate-400">
                <span>Query: <strong className="font-mono text-emerald-400">4.2ms</strong></span>
                <span>Cache: <strong className="font-semibold text-slate-200">HIT</strong></span>
              </div>
            </div>

            {/* Simulated Live Table Header & Rows */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400">
                    <th className="py-2.5 px-4 font-medium">Account key</th>
                    <th className="py-2.5 px-4 font-medium">Company name</th>
                    <th className="py-2.5 px-4 font-medium">Segment</th>
                    <th className="py-2.5 px-4 font-medium">Status</th>
                    <th className="py-2.5 px-4 font-medium">Annual revenue</th>
                    <th className="py-2.5 px-4 font-medium">Country</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-4 font-mono text-emerald-400">ACC-0000001</td>
                    <td className="py-2.5 px-4 font-medium text-slate-100">Global Acrobat Logistics Holdings</td>
                    <td className="py-2.5 px-4">Enterprise</td>
                    <td className="py-2.5 px-4"><Badge variant="success" size="sm">Active</Badge></td>
                    <td className="py-2.5 px-4 font-mono">$1,850,000</td>
                    <td className="py-2.5 px-4">Germany</td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-4 font-mono text-emerald-400">ACC-0000002</td>
                    <td className="py-2.5 px-4 font-medium text-slate-100">Apex Data Systems Solutions</td>
                    <td className="py-2.5 px-4">Mid-Market</td>
                    <td className="py-2.5 px-4"><Badge variant="success" size="sm">Active</Badge></td>
                    <td className="py-2.5 px-4 font-mono">$285,000</td>
                    <td className="py-2.5 px-4">United States</td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-4 font-mono text-emerald-400">ACC-0000003</td>
                    <td className="py-2.5 px-4 font-medium text-slate-100">Integrated Aura Healthtech Ventures</td>
                    <td className="py-2.5 px-4">Tier 1 Partner</td>
                    <td className="py-2.5 px-4"><Badge variant="warning" size="sm">Pending</Badge></td>
                    <td className="py-2.5 px-4 font-mono">$450,000</td>
                    <td className="py-2.5 px-4">United Kingdom</td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-4 font-mono text-emerald-400">ACC-0000004</td>
                    <td className="py-2.5 px-4 font-medium text-slate-100">NextGen Bavaria Robotics Technologies</td>
                    <td className="py-2.5 px-4">Enterprise</td>
                    <td className="py-2.5 px-4"><Badge variant="success" size="sm">Active</Badge></td>
                    <td className="py-2.5 px-4 font-mono">$3,200,000</td>
                    <td className="py-2.5 px-4">Germany</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Showing 4 of 100,000 records</span>
              <Link href="/dashboard/explorer" className="text-emerald-400 hover:text-emerald-300 font-medium">
                Open full virtualized explorer
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillar Grid */}
      <section id="architecture" className="py-16 px-6 max-w-6xl mx-auto w-full space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Engineered for industrial data discovery
          </h2>
          <p className="text-xs text-slate-400 max-w-xl mx-auto">
            Architectural solutions designed to eliminate frontend bottlenecks, avoid memory leaks, and optimize PostgreSQL queries.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-lg border border-slate-800 bg-slate-900 space-y-3">
            <div className="p-2.5 rounded bg-emerald-500/10 text-emerald-400 w-fit">
              <Database className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Pushdown server filtering</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Never ship millions of rows to the browser. Multi-condition AND/OR rules, date ranges, and numeric thresholds compile into parameterized SQL using composite indexes.
            </p>
          </div>

          <div className="p-6 rounded-lg border border-slate-800 bg-slate-900 space-y-3">
            <div className="p-2.5 rounded bg-emerald-500/10 text-emerald-400 w-fit">
              <Search className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Hybrid PostgreSQL search</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Combines native full-text search with tsvector and GIN indexing plus trigram similarity for typo-tolerant fuzzy discovery.
            </p>
          </div>

          <div className="p-6 rounded-lg border border-slate-800 bg-slate-900 space-y-3">
            <div className="p-2.5 rounded bg-emerald-500/10 text-emerald-400 w-fit">
              <Table className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Virtualized 60fps data table</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              DOM virtualization via TanStack Virtual ensures only visible rows render. Features multi-column sorting, column resizing, visibility toggles, and row selection.
            </p>
          </div>

          <div className="p-6 rounded-lg border border-slate-800 bg-slate-900 space-y-3">
            <div className="p-2.5 rounded bg-emerald-500/10 text-emerald-400 w-fit">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Two-tier caching architecture</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Client-side RTK Query request deduplication prevents redundant network flights. Server-side LRU cache serves identical repeat queries in sub-1ms response times.
            </p>
          </div>

          <div className="p-6 rounded-lg border border-slate-800 bg-slate-900 space-y-3">
            <div className="p-2.5 rounded bg-emerald-500/10 text-emerald-400 w-fit">
              <SlidersHorizontal className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Visual query builder and NLQ</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Allows analysts to construct complex boolean rule trees or query data using natural language, validating all conditions against field permissions before execution.
            </p>
          </div>

          <div className="p-6 rounded-lg border border-slate-800 bg-slate-900 space-y-3">
            <div className="p-2.5 rounded bg-emerald-500/10 text-emerald-400 w-fit">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Granular role-based access</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Three personas: Administrator, Data Analyst, and Viewer. Server-enforced dataset permissions prevent unauthorized record access and unauthorized exports.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800 bg-slate-950 py-8 px-6 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-emerald-600 flex items-center justify-center text-white">
              <Zap className="h-2.5 w-2.5" />
            </div>
            <span className="font-semibold text-slate-300">DataScope</span>
            <span className="text-slate-600">|</span>
            <span>Enterprise data discovery platform</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span>Next.js 14 App Router</span>
            <span className="text-slate-600">|</span>
            <span>Redux Toolkit and RTK Query</span>
            <span className="text-slate-600">|</span>
            <span>PostgreSQL and Drizzle ORM</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
