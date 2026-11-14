'use client';

import React from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { switchRole } from '@/store/slices/authSlice';
import { setSelectedDatasetId } from '@/store/slices/datasetSlice';
import { setAiModalOpen } from '@/store/slices/savedViewsSlice';
import { useGetDatasetsQuery } from '@/store/services/dataScopeApi';
import { UserRole } from '@/types';
import { Button } from '../ui/button';
import {
  Sparkles,
  Database,
  BookOpen,
} from 'lucide-react';
import Link from 'next/link';

export const Header: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user, activeRole } = useAppSelector((state) => state.auth);
  const { selectedDatasetId } = useAppSelector((state) => state.dataset);
  const { data: datasets = [] } = useGetDatasetsQuery();

  const handleRoleChange = (role: UserRole) => {
    dispatch(switchRole(role));
  };

  const handleDatasetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch(setSelectedDatasetId(e.target.value));
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-800 bg-slate-950 px-6">
      {/* Left: Active Dataset Selector */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 rounded-md border border-slate-800 bg-slate-900 px-3 py-1.5 shadow-sm">
          <Database className="h-4 w-4 text-emerald-400" />
          <span className="text-xs font-medium text-slate-400">Dataset:</span>
          <select
            value={selectedDatasetId}
            onChange={handleDatasetChange}
            aria-label="Select active business dataset"
            className="bg-transparent text-sm font-semibold text-slate-100 focus:outline-none cursor-pointer"
          >
            {datasets.map((d) => (
              <option key={d.id} value={d.id} className="bg-slate-900 text-slate-200">
                {d.name} ({d.totalRecords.toLocaleString()} rows)
              </option>
            ))}
          </select>
        </div>

        {/* AI Assistant Quick Trigger */}
        <Button
          variant="subtle"
          size="sm"
          onClick={() => dispatch(setAiModalOpen(true))}
          className="hidden md:inline-flex items-center gap-1.5 text-xs text-emerald-400 border-emerald-500/30 bg-emerald-950/40 hover:bg-emerald-900/40"
        >
          <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
          <span>AI Search Assistant</span>
          <span className="ml-1 rounded bg-emerald-500/20 px-1 py-0.5 text-xs text-emerald-300">
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

      {/* Right: Role Switcher & User Profile */}
      <div className="flex items-center gap-3">
        {/* Rapid Role Switcher for Test / Evaluation */}
        <div className="flex items-center gap-1 rounded-md border border-slate-800 bg-slate-900 p-1">
          <span className="px-2 text-xs text-slate-400 hidden sm:inline">
            Role:
          </span>
          <button
            onClick={() => handleRoleChange('admin')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 ${
              activeRole === 'admin'
                ? 'bg-slate-700 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Admin
          </button>
          <button
            onClick={() => handleRoleChange('analyst')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 ${
              activeRole === 'analyst'
                ? 'bg-emerald-700 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Analyst
          </button>
          <button
            onClick={() => handleRoleChange('viewer')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 ${
              activeRole === 'viewer'
                ? 'bg-slate-800 text-emerald-400 border border-emerald-500/40 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Viewer
          </button>
        </div>

        {/* Documentation / ADRs Hub Button */}
        <Link href="/dashboard/architecture" className="focus-visible:ring-2 focus-visible:ring-emerald-500 rounded">
          <Button variant="outline" size="sm" className="hidden lg:flex items-center gap-1.5 text-xs text-slate-300">
            <BookOpen className="h-3.5 w-3.5 text-emerald-400" />
            <span>Architecture &amp; ADRs</span>
          </Button>
        </Link>

        {/* User Profile Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-emerald-400 font-semibold text-xs border border-slate-700">
            {user?.name ? user.name.charAt(0) : 'U'}
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-medium text-slate-200 leading-tight">
              {user?.name || 'Elena Rostova'}
            </span>
            <span className="text-xs text-slate-400 capitalize">
              {user?.department || 'Enterprise Ops'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
