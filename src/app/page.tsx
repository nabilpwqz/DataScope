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
  CheckCircle2,
  Server,
  Sparkles,
  BarChart3,
  Lock,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b border-slate-800 bg-slate-950/80 px-6 backdrop-blur md:px-12">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 shadow-md shadow-blue-500/20 text-white font-bold text-lg">
            <Zap className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold tracking-tight text-white text-base">DataScope</span>
            <span className="text-[10px] text-blue-400 font-mono tracking-wider uppercase">
              Enterprise Data Intelligence
            </span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-6 text-xs text-slate-400 font-medium">
          <Link href="#architecture" className="hover:text-white transition-colors">
            Architecture
          </Link>
          <Link href="#search-engine" className="hover:text-white transition-colors">
            Search Engine
          </Link>
          <Link href="#data-table" className="hover:text-white transition-colors">
            Virtual Table
          </Link>
          <Link href="#benchmarks" className="hover:text-white transition-colors">
            Benchmarks
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="text-xs text-slate-300">
              Sign In
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="primary" size="sm" className="text-xs font-semibold gap-1.5">
              <span>Launch Platform</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 py-20 md:py-28 max-w-6xl mx-auto w-full text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/30 bg-blue-950/40 text-blue-300 text-xs font-medium animate-in fade-in-50">
          <Sparkles className="h-3.5 w-3.5 text-blue-400" />
          <span>High-Throughput Discovery Across 100,000+ Business Records</span>
          <Badge variant="purple" size="sm">
            PostgreSQL GIN Indexed
          </Badge>
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
          Explore, Search, and Analyze <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Millions of Structured Records
          </span>{' '}
          at 60fps
        </h1>

        <p className="text-sm md:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Engineered for data-intensive enterprise workloads. Pushdown SQL filtering, multi-engine full-text discovery, Redux Toolkit state architecture, and sub-10ms query execution.
        </p>

        {/* Hero CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link href="/dashboard/explorer">
            <Button variant="primary" size="lg" className="text-sm font-semibold gap-2 shadow-lg shadow-blue-600/30">
              <Table className="h-4 w-4" />
              <span>Explore 100,000+ Live Records</span>
            </Button>
          </Link>
          <Link href="/dashboard/architecture">
            <Button variant="outline" size="lg" className="text-sm font-medium gap-2 text-slate-200 border-slate-700 bg-slate-900/60">
              <Server className="h-4 w-4 text-purple-400" />
              <span>Review 8+ ADRs &amp; Architecture</span>
            </Button>
          </Link>
        </div>

        {/* Live Metrics Ribbon */}
        <div className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 text-center">
            <span className="text-2xl font-bold font-mono text-white">110,000+</span>
            <p className="text-[11px] text-slate-400 mt-0.5">Seeded Enterprise Rows</p>
          </div>
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 text-center">
            <span className="text-2xl font-bold font-mono text-emerald-400">&lt; 8 ms</span>
            <p className="text-[11px] text-slate-400 mt-0.5">Indexed Search Latency</p>
          </div>
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 text-center">
            <span className="text-2xl font-bold font-mono text-blue-400">60 FPS</span>
            <p className="text-[11px] text-slate-400 mt-0.5">TanStack Virtual Scrolling</p>
          </div>
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 text-center">
            <span className="text-2xl font-bold font-mono text-purple-400">3 Roles</span>
            <p className="text-[11px] text-slate-400 mt-0.5">RBAC &amp; Dataset Security</p>
          </div>
        </div>
      </section>

      {/* Feature Pillar Grid */}
      <section id="architecture" className="py-16 px-6 max-w-6xl mx-auto w-full space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Engineered for Industrial Data Discovery
          </h2>
          <p className="text-xs text-slate-400 max-w-xl mx-auto">
            Architectural solutions designed to eliminate frontend bottlenecks, avoid memory leaks, and optimize PostgreSQL queries.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/40 space-y-3">
            <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 w-fit">
              <Database className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Pushdown Server Filtering</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Never ship millions of rows to the browser. Multi-condition AND/OR rules, date ranges, and numeric thresholds are compiled into parameterized SQL using composite B-Tree indexes.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/40 space-y-3">
            <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 w-fit">
              <Search className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Hybrid PostgreSQL Search</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Combines PostgreSQL native Full-Text Search (<code className="font-mono text-blue-300">tsvector</code> with GIN indexing) and Trigram similarity (<code className="font-mono text-purple-300">pg_trgm</code>) for typo-tolerant queries.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/40 space-y-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 w-fit">
              <Table className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Virtualized 60fps Data Table</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              DOM virtualization via TanStack Virtual ensures only visible rows are rendered. Features column sorting, visibility toggles, cell search highlighting, and multi-row selection.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/40 space-y-3">
            <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400 w-fit">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Two-Tier Caching Architecture</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Client-side RTK Query request deduplication prevents duplicate network flights. Server-side LRU cache serves identical repeated queries in sub-1ms response times.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/40 space-y-3">
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 w-fit">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-white">AI Search Assistant (NLQ)</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Allows analysts to query data using natural language (&quot;Find active customers from Germany with revenue greater than $10,000&quot;), validating conditions before SQL execution.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/40 space-y-3">
            <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 w-fit">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Granular Role-Based Access</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Three distinct personas: Administrator, Data Analyst, and Viewer. Dataset-level permission checks prevent unauthorized access even if request parameters are manipulated.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800 bg-slate-950 py-8 px-6 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-blue-400" />
            <span className="font-bold text-slate-300">DataScope</span> &bull; Enterprise Data Discovery Platform
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span>Next.js 14 App Router</span>
            <span>&bull;</span>
            <span>Redux Toolkit + RTK Query</span>
            <span>&bull;</span>
            <span>PostgreSQL + Drizzle ORM</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
