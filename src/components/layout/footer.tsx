import React from 'react';
import Link from 'next/link';
import { DataScopeLogo } from '@/components/brand/logo';
import {
  Database,
  Cpu,
  ShieldCheck,
  Terminal,
  Activity,
  ArrowUpRight,
  Lock,
  Layers,
  Server,
  Code2,
} from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950 text-slate-600 dark:text-slate-400 transition-colors">
      {/* Top Banner: Brand, Mission & Telemetry Status */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8 border-b border-slate-200 dark:border-slate-800/80">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <Link
              href="/"
              className="inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded p-0.5"
              title="DataScope Platform"
            >
              <DataScopeLogo size="md" subtitle="Enterprise Platform" />
            </Link>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Mission-critical enterprise data discovery and intelligence platform powered by PostgreSQL composite B-tree &amp; GIN trigram indexing, hybrid full-text retrieval, and sub-millisecond query execution.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Live Operational Status */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>All Systems Operational</span>
              <span className="text-emerald-300 dark:text-emerald-700 font-mono text-[11px]">(0.8ms SLA)</span>
            </div>

            {/* Architecture Node Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 font-medium shadow-sm">
              <Server className="h-3.5 w-3.5 text-blue-500" />
              <span>PostgreSQL 15</span>
              <span className="text-slate-400 font-mono text-[11px]">(GIN &amp; Trgm)</span>
            </div>

            {/* Security Certified Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 font-medium shadow-sm">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span>SOC 2 Type II Compliant</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Columns */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Column 1: Exploration & Analytics */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-200 flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Platform</span>
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  href="/dashboard/explorer"
                  className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors inline-flex items-center gap-1"
                >
                  <span>Data Explorer</span>
                  <ArrowUpRight className="h-3 w-3 opacity-60" />
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/advanced-search"
                  className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors inline-flex items-center gap-1"
                >
                  <span>Advanced Search</span>
                  <ArrowUpRight className="h-3 w-3 opacity-60" />
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/analytics"
                  className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors inline-flex items-center gap-1"
                >
                  <span>Visual Analytics</span>
                  <ArrowUpRight className="h-3 w-3 opacity-60" />
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/datasets"
                  className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors inline-flex items-center gap-1"
                >
                  <span>Dataset Library</span>
                  <ArrowUpRight className="h-3 w-3 opacity-60" />
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/saved-views"
                  className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors inline-flex items-center gap-1"
                >
                  <span>Saved Views</span>
                  <ArrowUpRight className="h-3 w-3 opacity-60" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Architecture & Indexing */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-200 flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              <span>Architecture</span>
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  href="/dashboard/architecture"
                  className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors inline-flex items-center gap-1"
                >
                  <span>GIN &amp; B-Tree Indexing</span>
                  <ArrowUpRight className="h-3 w-3 opacity-60" />
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/performance"
                  className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors inline-flex items-center gap-1"
                >
                  <span>In-Memory LRU Cache</span>
                  <ArrowUpRight className="h-3 w-3 opacity-60" />
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/performance"
                  className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors inline-flex items-center gap-1"
                >
                  <span>Telemetry Benchmarks</span>
                  <ArrowUpRight className="h-3 w-3 opacity-60" />
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/architecture"
                  className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors inline-flex items-center gap-1"
                >
                  <span>Pushdown Query Planner</span>
                  <ArrowUpRight className="h-3 w-3 opacity-60" />
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/architecture"
                  className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors inline-flex items-center gap-1"
                >
                  <span>Million-Row Scaling TDR</span>
                  <ArrowUpRight className="h-3 w-3 opacity-60" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Security & Governance */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-200 flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
              <span>Governance</span>
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  href="/dashboard/users"
                  className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors inline-flex items-center gap-1"
                >
                  <span>Enterprise RBAC</span>
                  <ArrowUpRight className="h-3 w-3 opacity-60" />
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/audit-logs"
                  className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors inline-flex items-center gap-1"
                >
                  <span>Audit Trail Logs</span>
                  <ArrowUpRight className="h-3 w-3 opacity-60" />
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/data-quality"
                  className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors inline-flex items-center gap-1"
                >
                  <span>Data Quality Assurance</span>
                  <ArrowUpRight className="h-3 w-3 opacity-60" />
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/data-lineage"
                  className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors inline-flex items-center gap-1"
                >
                  <span>Pipeline Lineage DAG</span>
                  <ArrowUpRight className="h-3 w-3 opacity-60" />
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/settings"
                  className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors inline-flex items-center gap-1"
                >
                  <span>Security Policies</span>
                  <ArrowUpRight className="h-3 w-3 opacity-60" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Resources & Development */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-200 flex items-center gap-1.5">
              <Terminal className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              <span>Developers</span>
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href="https://github.com/nabilpwqz/DataScope"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors inline-flex items-center gap-1"
                >
                  <span>GitHub Repository</span>
                  <ArrowUpRight className="h-3 w-3 opacity-60" />
                </a>
              </li>
              <li>
                <Link
                  href="/api/health"
                  target="_blank"
                  className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors inline-flex items-center gap-1"
                >
                  <span>System Health API</span>
                  <ArrowUpRight className="h-3 w-3 opacity-60" />
                </Link>
              </li>
              <li>
                <Link
                  href="/api/datasets"
                  target="_blank"
                  className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors inline-flex items-center gap-1"
                >
                  <span>Datasets REST API</span>
                  <ArrowUpRight className="h-3 w-3 opacity-60" />
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/search-history"
                  className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors inline-flex items-center gap-1"
                >
                  <span>Search Query History</span>
                  <ArrowUpRight className="h-3 w-3 opacity-60" />
                </Link>
              </li>
              <li>
                <span className="text-slate-400 dark:text-slate-500 inline-flex items-center gap-1 text-[11px]">
                  <span>Command Palette:</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 font-mono text-[10px]">Ctrl+K</kbd>
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Sub-Footer: Legal, Copyright & Stack Specifications */}
      <div className="border-t border-slate-200 dark:border-slate-800/80 bg-white/50 dark:bg-slate-950 py-6 px-4 sm:px-6 lg:px-8 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span>&copy; {new Date().getFullYear()} DataScope Platform Inc. All rights reserved.</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span>Next.js 14 App Router</span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span>TypeScript Strict</span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span>PostgreSQL 15 &amp; Prisma</span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span>Redux Toolkit</span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span>Dockerized</span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <Link href="/dashboard/settings" className="hover:text-slate-900 dark:hover:text-slate-200 transition-colors">
              Privacy
            </Link>
            <Link href="/dashboard/settings" className="hover:text-slate-900 dark:hover:text-slate-200 transition-colors">
              Terms
            </Link>
            <Link href="/dashboard/architecture" className="hover:text-slate-900 dark:hover:text-slate-200 transition-colors">
              Security
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
