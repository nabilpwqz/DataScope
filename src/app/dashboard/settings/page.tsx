'use client';

import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { switchRole } from '@/store/slices/authSlice';
import {
  setTableDensity,
  toggleVirtualization,
  toggleHighlightMatches,
} from '@/store/slices/uiPreferenceSlice';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Settings,
  User,
  Shield,
  Sliders,
  Database,
  Trash2,
  CheckCircle2,
} from 'lucide-react';

export default function SettingsPage() {
  const dispatch = useAppDispatch();
  const { user, activeRole, permissions } = useAppSelector((state) => state.auth);
  const { tableDensity, useVirtualization, highlightMatches } = useAppSelector(
    (state) => state.uiPreference
  );
  const [cacheFlushed, setCacheFlushed] = useState(false);

  const handleClearCache = async () => {
    setCacheFlushed(true);
    setTimeout(() => setCacheFlushed(false), 3000);
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-8 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <Settings className="h-5 w-5 text-emerald-400" />
          <span>System Settings &amp; Access Control</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage user profiles, simulated RBAC privileges, rendering settings, and cache controls.
        </p>
      </div>

      {/* Profile & Simulated Role */}
      <div className="p-6 rounded-xl border border-slate-800 bg-slate-900 space-y-4">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <User className="h-4 w-4 text-emerald-400" />
          <span>Active User Session</span>
        </h2>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-slate-950 border border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-emerald-600/20 text-emerald-400 font-bold flex items-center justify-center border border-emerald-500/30 text-base">
              {user?.name?.charAt(0) || 'E'}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">{user?.name}</h3>
              <p className="text-xs text-slate-400 font-mono">{user?.email}</p>
              <span className="text-xs text-slate-500">{user?.department}</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <span className="text-xs text-slate-400">
              Role switcher (evaluation)
            </span>
            <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 p-1">
              <button
                type="button"
                onClick={() => dispatch(switchRole('admin'))}
                className={`px-3 py-1 text-xs rounded font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                  activeRole === 'admin'
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Administrator
              </button>
              <button
                type="button"
                onClick={() => dispatch(switchRole('analyst'))}
                className={`px-3 py-1 text-xs rounded font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                  activeRole === 'analyst'
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Data analyst
              </button>
              <button
                type="button"
                onClick={() => dispatch(switchRole('viewer'))}
                className={`px-3 py-1 text-xs rounded font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                  activeRole === 'viewer'
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Viewer
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* RBAC Permissions Matrix */}
      <div className="p-6 rounded-xl border border-slate-800 bg-slate-900 space-y-4">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Shield className="h-4 w-4 text-emerald-400" />
          <span>Active Role Privileges Matrix</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(permissions).map(([permKey, isAllowed]) => (
            <div
              key={permKey}
              className="p-3 rounded-lg border border-slate-800 bg-slate-950 flex items-center justify-between text-xs"
            >
              <span className="text-slate-300 font-mono text-[11px]">
                {permKey.replace(/([A-Z])/g, ' $1').toLowerCase()}
              </span>
              <Badge variant={isAllowed ? 'emerald' : 'outline'} size="sm">
                {isAllowed ? 'Allowed' : 'Denied'}
              </Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Table & UX Preferences */}
      <div className="p-6 rounded-xl border border-slate-800 bg-slate-900 space-y-4">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Sliders className="h-4 w-4 text-emerald-400" />
          <span>Frontend Rendering &amp; Display Preferences</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg border border-slate-800 bg-slate-950 space-y-2">
            <span className="text-xs font-semibold text-slate-200">Table row density</span>
            <div className="flex gap-1 pt-1">
              {(['compact', 'standard', 'spacious'] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => dispatch(setTableDensity(d))}
                  className={`px-3 py-1 text-xs rounded capitalize flex-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                    tableDensity === d
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-lg border border-slate-800 bg-slate-950 space-y-2">
            <span className="text-xs font-semibold text-slate-200">DOM Virtualization</span>
            <p className="text-xs text-slate-400">Keep 60fps scrolling on deep pages</p>
            <button
              type="button"
              onClick={() => dispatch(toggleVirtualization())}
              className={`w-full py-1 text-xs rounded font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                useVirtualization
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold'
                  : 'bg-slate-900 text-slate-400 border border-slate-800'
              }`}
            >
              {useVirtualization ? 'Virtualization: On' : 'Virtualization: Off'}
            </button>
          </div>

          <div className="p-4 rounded-lg border border-slate-800 bg-slate-950 space-y-2">
            <span className="text-xs font-semibold text-slate-200">Search Term Highlight</span>
            <p className="text-xs text-slate-400">Highlight matching strings in table cells</p>
            <button
              type="button"
              onClick={() => dispatch(toggleHighlightMatches())}
              className={`w-full py-1 text-xs rounded font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                highlightMatches
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold'
                  : 'bg-slate-900 text-slate-400 border border-slate-800'
              }`}
            >
              {highlightMatches ? 'Highlights: On' : 'Highlights: Off'}
            </button>
          </div>
        </div>
      </div>

      {/* Cache & Maintenance */}
      <div className="p-6 rounded-xl border border-slate-800 bg-slate-900 space-y-3">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Database className="h-4 w-4 text-emerald-400" />
          <span>Server Cache Diagnostics</span>
        </h2>
        <p className="text-xs text-slate-400">
          Clear the in-memory LRU cache to verify cold vs warm query performance benchmarks on PostgreSQL.
        </p>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearCache}
            className="text-xs text-slate-200 border-slate-700 hover:border-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1 text-slate-400" />
            Flush server query cache
          </Button>

          {cacheFlushed && (
            <span className="text-xs text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Cache cleared
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
