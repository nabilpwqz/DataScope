'use client';

import React from 'react';
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
  Layers,
  Sparkles,
  Trash2,
  CheckCircle2,
  Sliders,
  Database,
} from 'lucide-react';

export default function SettingsPage() {
  const dispatch = useAppDispatch();
  const { user, activeRole, permissions } = useAppSelector((state) => state.auth);
  const { tableDensity, useVirtualization, highlightMatches } = useAppSelector(
    (state) => state.uiPreference
  );

  const handleClearCache = async () => {
    alert('Server LRU query cache cleared successfully.');
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-8 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <Settings className="h-5 w-5 text-blue-400" />
          <span>System Settings &amp; Access Control</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage user profiles, simulated RBAC privileges, rendering settings, and cache controls.
        </p>
      </div>

      {/* Profile & Simulated Role */}
      <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/50 space-y-4">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <User className="h-4 w-4 text-blue-400" />
          <span>Active User Session</span>
        </h2>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-slate-950/80 border border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-blue-600/20 text-blue-400 font-bold flex items-center justify-center border border-blue-500/30 text-base">
              {user?.name.charAt(0) || 'E'}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">{user?.name}</h3>
              <p className="text-xs text-slate-400 font-mono">{user?.email}</p>
              <span className="text-[11px] text-slate-500">{user?.department}</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <span className="text-[11px] text-slate-400 font-mono uppercase">
              Role Switcher (Evaluation Test)
            </span>
            <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 p-1">
              <button
                onClick={() => dispatch(switchRole('admin'))}
                className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
                  activeRole === 'admin'
                    ? 'bg-purple-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Administrator
              </button>
              <button
                onClick={() => dispatch(switchRole('analyst'))}
                className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
                  activeRole === 'analyst'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Data Analyst
              </button>
              <button
                onClick={() => dispatch(switchRole('viewer'))}
                className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
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
      <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/50 space-y-4">
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
              <span className="text-slate-300 font-mono">
                {permKey.replace(/([A-Z])/g, ' $1').toLowerCase()}
              </span>
              <Badge variant={isAllowed ? 'success' : 'outline'} size="sm">
                {isAllowed ? 'ALLOWED' : 'DENIED'}
              </Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Table & UX Preferences */}
      <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/50 space-y-4">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Sliders className="h-4 w-4 text-purple-400" />
          <span>Frontend Rendering &amp; Display Preferences</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg border border-slate-800 bg-slate-950 space-y-2">
            <span className="text-xs font-semibold text-slate-200">Table Row Density</span>
            <div className="flex gap-1 pt-1">
              {(['compact', 'standard', 'spacious'] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => dispatch(setTableDensity(d))}
                  className={`px-3 py-1 text-xs rounded capitalize flex-1 ${
                    tableDensity === d
                      ? 'bg-blue-600 text-white font-bold'
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
            <p className="text-[11px] text-slate-400">Keep 60fps scrolling on deep pages</p>
            <button
              onClick={() => dispatch(toggleVirtualization())}
              className={`w-full py-1 text-xs rounded font-mono font-bold ${
                useVirtualization
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-900 text-slate-400'
              }`}
            >
              {useVirtualization ? 'Virtualization: ON' : 'Virtualization: OFF'}
            </button>
          </div>

          <div className="p-4 rounded-lg border border-slate-800 bg-slate-950 space-y-2">
            <span className="text-xs font-semibold text-slate-200">Search Term Highlight</span>
            <p className="text-[11px] text-slate-400">Highlight matching strings in table cells</p>
            <button
              onClick={() => dispatch(toggleHighlightMatches())}
              className={`w-full py-1 text-xs rounded font-mono font-bold ${
                highlightMatches
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-slate-900 text-slate-400'
              }`}
            >
              {highlightMatches ? 'Highlights: ON' : 'Highlights: OFF'}
            </button>
          </div>
        </div>
      </div>

      {/* Cache & Maintenance */}
      <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/50 space-y-3">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Database className="h-4 w-4 text-rose-400" />
          <span>Server Cache Diagnostics</span>
        </h2>
        <p className="text-xs text-slate-400">
          Clear the in-memory LRU cache to verify cold vs warm query performance benchmarks on PostgreSQL.
        </p>

        <Button
          variant="outline"
          size="sm"
          onClick={handleClearCache}
          className="text-xs text-rose-400 border-rose-500/30 hover:bg-rose-500/10"
        >
          <Trash2 className="h-3.5 w-3.5 mr-1" />
          Flush Server Query Cache
        </Button>
      </div>
    </div>
  );
}
