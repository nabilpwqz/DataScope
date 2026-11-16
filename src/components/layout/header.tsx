'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useAppDispatch, useAppSelector } from '@/store';
import { setUser, logout } from '@/store/slices/authSlice';
import { setSelectedDatasetId } from '@/store/slices/datasetSlice';
import { setAiModalOpen } from '@/store/slices/savedViewsSlice';
import { useGetDatasetsQuery } from '@/store/services/dataScopeApi';
import { UserRole } from '@/types';
import { Button } from '../ui/button';
import { ThemeToggle } from './theme-toggle';
import {
  IconDatabase,
  IconSparkles,
  IconBook,
  IconLogout,
  IconSearch,
} from '@/components/ui/icons';

export const Header: React.FC = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { data: session } = useSession();
  const { user } = useAppSelector((state) => state.auth);
  const { selectedDatasetId } = useAppSelector((state) => state.dataset);
  const { data: datasets = [] } = useGetDatasetsQuery();

  useEffect(() => {
    if (session?.user && (!user || user.email !== session.user.email)) {
      dispatch(
        setUser({
          user: {
            id: (session.user as any).id || (session.user as any).userId || 'usr-session',
            name: session.user.name || 'Authorized User',
            email: session.user.email || '',
            role: ((session.user as any).role as UserRole) || 'viewer',
            department: (session.user as any).department || 'Operations',
            createdAt: new Date().toISOString(),
          },
        })
      );
    }
  }, [session, user, dispatch]);

  const activeRole: UserRole = (session?.user as any)?.role || user?.role || 'viewer';
  const userName = user?.name || session?.user?.name || 'Authorized User';
  const userDept = user?.department || (session?.user as any)?.department || 'Enterprise Ops';

  const handleDatasetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch(setSelectedDatasetId(e.target.value));
  };

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    dispatch(logout());
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-800 bg-slate-950 px-4 md:px-6">
      {/* Left: Active Dataset Selector & Quick Triggers */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-md border border-slate-800 bg-slate-900 px-3 py-1.5 shadow-sm max-w-[260px] sm:max-w-none">
          <IconDatabase className="h-4 w-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-medium text-slate-400 hidden sm:inline">Dataset:</span>
          <select
            value={selectedDatasetId}
            onChange={handleDatasetChange}
            aria-label="Select active business dataset"
            className="bg-transparent text-xs sm:text-sm font-semibold text-slate-100 focus:outline-none cursor-pointer truncate"
          >
            {datasets.map((d) => (
              <option key={d.id} value={d.id} className="bg-slate-900 text-slate-200">
                {d.name} ({d.totalRecords.toLocaleString()} rows)
              </option>
            ))}
          </select>
        </div>

        {/* Command Palette Trigger */}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('datascope:open-command-palette'))}
          aria-label="Open command palette"
          className="hidden md:flex items-center gap-2 rounded-md border border-slate-800 bg-slate-900/90 px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-colors"
        >
          <IconSearch className="h-3.5 w-3.5 text-slate-400" />
          <span>Quick search...</span>
          <kbd className="rounded border border-slate-700 bg-slate-800 px-1 py-0.5 font-mono text-[10px] text-slate-400">
            Ctrl K
          </kbd>
        </button>

        {/* AI Assistant Quick Trigger */}
        <Button
          variant="subtle"
          size="sm"
          onClick={() => dispatch(setAiModalOpen(true))}
          className="hidden md:inline-flex items-center gap-1.5 text-xs text-emerald-400 border-emerald-500/30 bg-emerald-950/40 hover:bg-emerald-900/40"
        >
          <IconSparkles className="h-3.5 w-3.5 text-emerald-400" />
          <span>AI Assistant</span>
          <span className="ml-1 rounded bg-emerald-500/20 px-1 py-0.5 text-[10px] text-emerald-300 font-mono">
            NLQ
          </span>
        </Button>

        {/* System Health Status Indicator */}
        <Link
          href="/api/health"
          target="_blank"
          rel="noopener noreferrer"
          title="Inspect live system and database telemetry"
          className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-800 bg-slate-900 text-xs text-slate-300 hover:border-emerald-500/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          <span className="relative flex h-2 w-2">
            <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-xs font-medium text-slate-300">Live Engine</span>
        </Link>
      </div>

      {/* Right: Controls, Role Badge, Theme & Sign Out */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Real Authenticated Role Badge (Server-Enforced) */}
        <div className="flex items-center gap-1.5 rounded-md border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs">
          <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">Role:</span>
          <span
            className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
              activeRole === 'admin'
                ? 'bg-rose-950/70 border border-rose-800/60 text-rose-300'
                : activeRole === 'analyst'
                ? 'bg-emerald-950/70 border border-emerald-800/60 text-emerald-300'
                : 'bg-slate-800 border border-slate-700 text-slate-300'
            }`}
          >
            {activeRole}
          </span>
        </div>

        {/* Documentation Hub */}
        <Link href="/dashboard/architecture" className="hidden lg:inline-flex focus-visible:ring-2 focus-visible:ring-emerald-500 rounded">
          <Button variant="outline" size="sm" className="items-center gap-1.5 text-xs text-slate-300">
            <IconBook className="h-3.5 w-3.5 text-emerald-400" />
            <span>ADRs</span>
          </Button>
        </Link>

        {/* Theme Toggle Button */}
        <ThemeToggle />

        {/* User Profile Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-emerald-400 font-semibold text-xs border border-slate-700">
            {userName ? userName.charAt(0) : 'U'}
          </div>
          <div className="hidden xl:flex flex-col text-left">
            <span className="text-xs font-medium text-slate-200 leading-tight">
              {userName}
            </span>
            <span className="text-[11px] text-slate-400 capitalize">
              {userDept}
            </span>
          </div>
        </div>

        {/* Explicit Sign Out Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleSignOut}
          title="Sign out of DataScope session"
          aria-label="Sign out"
          className="items-center gap-1.5 text-xs text-slate-300 hover:text-rose-300 hover:border-rose-500/50 hover:bg-rose-950/20 transition-colors"
        >
          <IconLogout className="h-3.5 w-3.5 text-slate-400 group-hover:text-rose-400" />
          <span className="hidden sm:inline">Sign Out</span>
        </Button>
      </div>
    </header>
  );
};
