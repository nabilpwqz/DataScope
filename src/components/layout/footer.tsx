import React from 'react';
import Link from 'next/link';
import { DataScopeLogo } from '@/components/brand/logo';
import { ArrowUpRight } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-400 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          {/* Brand & Operational Status */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/"
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded p-0.5"
              title="DataScope Platform"
            >
              <DataScopeLogo size="sm" subtitle="Enterprise Platform" />
            </Link>

            <span className="hidden sm:inline text-slate-300 dark:text-slate-700">|</span>

            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
              <span>All Systems Operational</span>
              <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500">(0.8ms SLA)</span>
            </div>
          </div>

          {/* Essential Navigation Links */}
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/dashboard/explorer"
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              Explorer
            </Link>
            <Link
              href="/dashboard/architecture"
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              Architecture
            </Link>
            <Link
              href="/dashboard/performance"
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              Benchmarks
            </Link>
            <a
              href="https://github.com/nabilpwqz/DataScope"
              target="_blank"
              rel="noreferrer"
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors inline-flex items-center gap-0.5"
            >
              <span>GitHub</span>
              <ArrowUpRight className="h-3 w-3 opacity-60" />
            </a>
            <Link
              href="/dashboard/settings"
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              Privacy &amp; Terms
            </Link>
          </div>
        </div>

        {/* Minimal Copyright & Stack */}
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400 dark:text-slate-500">
          <span>&copy; {new Date().getFullYear()} DataScope Platform Inc. All rights reserved.</span>
          <div className="flex items-center gap-3">
            <span>Next.js 14</span>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <span>PostgreSQL 15</span>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <span>TypeScript Strict</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
