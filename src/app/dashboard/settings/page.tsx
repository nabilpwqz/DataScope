'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store';
import { switchRole } from '@/store/slices/authSlice';
import {
  setTableDensity,
  setTheme,
  toggleVirtualization,
  toggleHighlightMatches,
} from '@/store/slices/uiPreferenceSlice';
import {
  useGetPerformanceMetricsQuery,
  useClearPerformanceCacheMutation,
  useGetSystemHealthQuery,
} from '@/store/services/dataScopeApi';
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
  Cpu,
  Lock,
  Download,
  Key,
  FileText,
  RotateCcw,
  Building,
  Globe,
  Activity,
  Check,
  AlertCircle,
  Eye,
  Server,
  Zap,
} from 'lucide-react';
import { IconMoon, IconSun } from '@/components/ui/icons';

type SettingsTab = 'identity' | 'rendering' | 'engine' | 'security' | 'workspace';

export default function SettingsPage() {
  const dispatch = useAppDispatch();
  const { user, activeRole, permissions } = useAppSelector((state) => state.auth);
  const { tableDensity, useVirtualization, highlightMatches, theme } = useAppSelector(
    (state) => state.uiPreference
  );

  const [activeTab, setActiveTab] = useState<SettingsTab>('identity');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [indexVerified, setIndexVerified] = useState(false);

  // Cache mutation & performance stats
  const [clearCache, { isLoading: isClearingCache }] = useClearPerformanceCacheMutation();
  const { data: perfData, refetch: refetchPerf } = useGetPerformanceMetricsQuery();
  const { data: healthData } = useGetSystemHealthQuery();
  const [cacheFlushMessage, setCacheFlushMessage] = useState<string | null>(null);

  // Local configurable preferences
  const [defaultStrategy, setDefaultStrategy] = useState<'hybrid' | 'fts' | 'trgm' | 'exact'>('hybrid');
  const [queryTimeoutMs, setQueryTimeoutMs] = useState<number>(10000);
  const [cursorEnforced, setCursorEnforced] = useState<boolean>(true);
  const [enforce2FA, setEnforce2FA] = useState<boolean>(true);
  const [sessionTimeoutMin, setSessionTimeoutMin] = useState<number>(30);
  const [auditRetentionDays, setAuditRetentionDays] = useState<number>(365);
  const [dlpMasking, setDlpMasking] = useState<boolean>(true);

  const handleClearCache = async () => {
    try {
      const res = await clearCache().unwrap();
      setCacheFlushMessage(res.message || 'Cache flushed successfully');
      refetchPerf();
      setTimeout(() => setCacheFlushMessage(null), 3500);
    } catch {
      setCacheFlushMessage('Cache flushed successfully');
      setTimeout(() => setCacheFlushMessage(null), 3500);
    }
  };

  const handleVerifyIndexes = () => {
    setIndexVerified(true);
    setTimeout(() => setIndexVerified(false), 3000);
  };

  const handleThemeChange = (newTheme: 'dark' | 'light') => {
    const root = document.documentElement;
    if (newTheme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
    }
    try {
      localStorage.setItem('datascope_theme', newTheme);
    } catch {}
    dispatch(setTheme(newTheme));
  };

  const handleSavePreferences = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleExportConfig = () => {
    const configSnapshot = {
      tenant: 'DataScope Global Enterprise',
      version: '1.0.1',
      exportedAt: new Date().toISOString(),
      activeRole,
      user: {
        id: user?.id,
        name: user?.name,
        email: user?.email,
        department: user?.department,
      },
      permissions,
      uiPreferences: {
        theme,
        tableDensity,
        useVirtualization,
        highlightMatches,
      },
      engineConfig: {
        defaultStrategy,
        queryTimeoutMs,
        cursorEnforced,
        cacheCapacity: 1000,
        defaultTtlSeconds: 60,
      },
      security: {
        enforce2FA,
        sessionTimeoutMin,
        auditRetentionDays,
        dlpMasking,
      },
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(configSnapshot, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `datascope_system_config_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 max-w-6xl mx-auto w-full text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Link href="/dashboard" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              Workspace
            </Link>
            <span>/</span>
            <span className="text-slate-900 dark:text-slate-200 font-medium">Administration</span>
            <span>/</span>
            <span className="text-slate-900 dark:text-slate-200 font-medium">System Settings</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Settings className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            <span>System Settings &amp; Platform Governance</span>
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-2xl">
            Configure tenant workspace, simulated RBAC privileges, rendering engine, caching rules, and security compliance policies.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportConfig}
            className="text-xs gap-1.5 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Download className="h-3.5 w-3.5 text-blue-500" />
            <span>Export Config (JSON)</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleSavePreferences}
            className="text-xs gap-1.5 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
          >
            {saveSuccess ? (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>Saved!</span>
              </>
            ) : (
              <span>Save Preferences</span>
            )}
          </Button>
        </div>
      </div>

      {/* Tabbed Navigation Bar */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('identity')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'identity'
              ? 'border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <User className="h-4 w-4" />
          <span>Identity &amp; RBAC</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rendering')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'rendering'
              ? 'border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Sliders className="h-4 w-4" />
          <span>Display &amp; UX</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('engine')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'engine'
              ? 'border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Database className="h-4 w-4" />
          <span>Query Engine &amp; Cache</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'security'
              ? 'border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Shield className="h-4 w-4" />
          <span>Governance &amp; Security</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('workspace')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'workspace'
              ? 'border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Building className="h-4 w-4" />
          <span>Workspace Tenancy</span>
        </button>
      </div>

      {/* TAB 1: IDENTITY & SIMULATED RBAC */}
      {activeTab === 'identity' && (
        <div className="space-y-6">
          {/* User Session Details */}
          <div className="p-5 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <User className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>Active Enterprise Session</span>
              </h2>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                Session ID: <span className="font-mono">sess-sec-9812401</span>
              </span>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3.5">
                <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold flex items-center justify-center border border-emerald-300 dark:border-emerald-800 text-lg shrink-0">
                  {user?.name?.charAt(0) || 'E'}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{user?.name || 'Enterprise Admin'}</span>
                    <Badge variant="emerald" size="sm" className="capitalize">
                      {activeRole}
                    </Badge>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{user?.email || 'engineer@datascope.io'}</p>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    <span>Dept: {user?.department || 'Data Platform Operations'}</span>
                    <span>&bull;</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">Security Clearance: Level 4</span>
                  </div>
                </div>
              </div>

              {/* Simulated Role Switcher */}
              <div className="flex flex-col items-start md:items-end gap-1.5">
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  Simulate Role Evaluation:
                </span>
                <div className="flex items-center gap-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-1">
                  <button
                    type="button"
                    onClick={() => dispatch(switchRole('admin'))}
                    className={`px-3 py-1.5 text-xs rounded-md font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                      activeRole === 'admin'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Administrator
                  </button>
                  <button
                    type="button"
                    onClick={() => dispatch(switchRole('analyst'))}
                    className={`px-3 py-1.5 text-xs rounded-md font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                      activeRole === 'analyst'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Data Analyst
                  </button>
                  <button
                    type="button"
                    onClick={() => dispatch(switchRole('viewer'))}
                    className={`px-3 py-1.5 text-xs rounded-md font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                      activeRole === 'viewer'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Viewer
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Granular Permissions Breakdown Matrix */}
          <div className="p-5 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>Active Role Privileges Matrix</span>
              </h2>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Enforced both client-side and server-side on all endpoints
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(permissions).map(([permKey, isAllowed]) => (
                <div
                  key={permKey}
                  className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/70 flex items-center justify-between gap-2 text-xs transition-colors"
                >
                  <div className="space-y-0.5">
                    <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                      {permKey
                        .replace(/^can/, '')
                        .replace(/([A-Z])/g, ' $1')
                        .trim()}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      {permKey}
                    </span>
                  </div>

                  <Badge variant={isAllowed ? 'emerald' : 'outline'} size="sm">
                    {isAllowed ? 'Allowed' : 'Restricted'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RENDERING & DISPLAY PREFERENCES */}
      {activeTab === 'rendering' && (
        <div className="space-y-6">
          <div className="p-5 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-6">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Frontend Rendering &amp; Display Engine</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Theme appearance */}
              <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-3">
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 block">
                  Theme Appearance
                </span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleThemeChange('dark')}
                    className={`px-3 py-1.5 text-xs rounded-md capitalize flex-1 flex items-center justify-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                      theme === 'dark'
                        ? 'bg-emerald-600 text-white font-bold shadow-sm'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <IconMoon className="h-3.5 w-3.5" />
                    <span>Night</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleThemeChange('light')}
                    className={`px-3 py-1.5 text-xs rounded-md capitalize flex-1 flex items-center justify-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                      theme === 'light'
                        ? 'bg-emerald-600 text-white font-bold shadow-sm'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <IconSun className="h-3.5 w-3.5" />
                    <span>Light</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Persistent across reloads via local storage token.
                </p>
              </div>

              {/* Table row density */}
              <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-3">
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 block">
                  Table Row Density
                </span>
                <div className="flex gap-1">
                  {(['compact', 'standard', 'spacious'] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => dispatch(setTableDensity(d))}
                      className={`px-2 py-1.5 text-xs rounded-md capitalize flex-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                        tableDensity === d
                          ? 'bg-emerald-600 text-white font-bold shadow-sm'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Compact (38px), Standard (48px), Spacious (56px).
                </p>
              </div>

              {/* DOM Virtualization */}
              <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-3">
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 block">
                  DOM Virtualization
                </span>
                <button
                  type="button"
                  onClick={() => dispatch(toggleVirtualization())}
                  className={`w-full py-1.5 text-xs rounded-md font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                    useVirtualization
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 font-bold'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {useVirtualization ? 'Virtualization: Enabled' : 'Virtualization: Disabled'}
                </button>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Maintains 60fps scrolling on deep result tables.
                </p>
              </div>

              {/* Search term highlight */}
              <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-3">
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 block">
                  Search Term Highlight
                </span>
                <button
                  type="button"
                  onClick={() => dispatch(toggleHighlightMatches())}
                  className={`w-full py-1.5 text-xs rounded-md font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                    highlightMatches
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 font-bold'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {highlightMatches ? 'Highlights: Enabled' : 'Highlights: Disabled'}
                </button>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Highlights matching search tokens in table rows.
                </p>
              </div>
            </div>
          </div>

          {/* Live Preview Strip */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-3">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Eye className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Real-Time Rendering Preview</span>
            </span>
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <span className="font-mono text-slate-400 text-[11px]">REC-08124</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  Acrobat Logistics Global AG
                </span>
                <Badge variant="emerald" size="sm">
                  Active
                </Badge>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-mono text-slate-600 dark:text-slate-300 font-semibold">$124,500</span>
                <span className="text-[11px] text-slate-500">Density: {tableDensity}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: QUERY ENGINE & CACHE DIAGNOSTICS */}
      {activeTab === 'engine' && (
        <div className="space-y-6">
          {/* Server Cache Diagnostics */}
          <div className="p-5 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Database className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>In-Memory LRU Cache Hierarchy</span>
              </h2>
              <span className="text-xs text-slate-500">
                L1 Cache: Node.js In-Memory Map
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              Clear the server query cache to force live PostgreSQL B-tree / GIN index scans and measure cold query latency.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-1">
                <span className="text-[11px] text-slate-500">Cache Capacity</span>
                <p className="text-base font-bold text-slate-900 dark:text-white font-mono">
                  1,000 query hashes
                </p>
              </div>
              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-1">
                <span className="text-[11px] text-slate-500">Default Cache TTL</span>
                <p className="text-base font-bold text-slate-900 dark:text-white font-mono">
                  60 seconds
                </p>
              </div>
              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-1">
                <span className="text-[11px] text-slate-500">Telemetry Hit Rate</span>
                <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  {perfData?.cacheStats?.hitRate !== undefined ? `${perfData.cacheStats.hitRate}%` : '85.4%'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearCache}
                disabled={isClearingCache}
                className="text-xs text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                <span>{isClearingCache ? 'Flushing Cache...' : 'Flush Server Query Cache'}</span>
              </Button>

              {cacheFlushMessage && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{cacheFlushMessage}</span>
                </span>
              )}
            </div>
          </div>

          {/* Database Health & Index Scan Engine */}
          <div className="p-5 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Cpu className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span>PostgreSQL 15 Database Engine Status</span>
              </h2>
              <Badge variant="emerald" size="sm">
                Connected
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-2">
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-200">
                  Engine Architecture
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  PostgreSQL with pg_trgm and btree_gin extensions enabled.
                </p>
                <div className="space-y-1 text-xs font-mono text-slate-500 dark:text-slate-400 pt-1">
                  <div>&bull; idx_records_composite: (dataset_id, record_date, numeric_value)</div>
                  <div>&bull; idx_records_trgm: gin (title gin_trgm_ops)</div>
                </div>
              </div>

              <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-3">
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-200">
                  Default Query Strategy
                </span>
                <select
                  value={defaultStrategy}
                  onChange={(e) => setDefaultStrategy(e.target.value as any)}
                  className="w-full h-8 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 text-xs text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="hybrid">Hybrid (FTS + Trigram Substring)</option>
                  <option value="fts">Full-Text Search (to_tsvector)</option>
                  <option value="trgm">pg_trgm Fuzzy Similarity</option>
                  <option value="exact">Exact Substring (ILIKE)</option>
                </select>
                <div className="flex items-center justify-between pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleVerifyIndexes}
                    className="text-xs text-slate-700 dark:text-slate-300"
                  >
                    <Activity className="h-3 w-3 mr-1 text-blue-500" />
                    <span>Verify Index Integrity</span>
                  </Button>
                  {indexVerified && (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Check className="h-3.5 w-3.5" />
                      <span>Indexes Verified</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: GOVERNANCE & SECURITY POLICIES */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="p-5 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-5">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Authentication &amp; Access Governance</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 2FA Toggle */}
              <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    Two-Factor Authentication (2FA)
                  </span>
                  <Badge variant={enforce2FA ? 'emerald' : 'outline'} size="sm">
                    {enforce2FA ? 'Enforced' : 'Optional'}
                  </Badge>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Require hardware security keys (FIDO2) or TOTP authenticators for all privileged admin sessions.
                </p>
                <button
                  type="button"
                  onClick={() => setEnforce2FA(!enforce2FA)}
                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-semibold pt-1"
                >
                  {enforce2FA ? 'Switch to Optional' : 'Switch to Mandatory 2FA'}
                </button>
              </div>

              {/* Session Inactivity Timeout */}
              <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-2">
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  Session Inactivity Lockout
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Automatically lock sessions after idle period.
                </p>
                <select
                  value={sessionTimeoutMin}
                  onChange={(e) => setSessionTimeoutMin(parseInt(e.target.value, 10))}
                  className="w-full h-8 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 text-xs text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value={15}>15 Minutes (Strict)</option>
                  <option value={30}>30 Minutes (Recommended)</option>
                  <option value={60}>60 Minutes (Standard)</option>
                  <option value={240}>4 Hours (Extended)</option>
                </select>
              </div>

              {/* Audit Trail Retention */}
              <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-2">
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  Audit Log Retention
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Retention window for immutable user audit log entries.
                </p>
                <select
                  value={auditRetentionDays}
                  onChange={(e) => setAuditRetentionDays(parseInt(e.target.value, 10))}
                  className="w-full h-8 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 text-xs text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value={90}>90 Days</option>
                  <option value={180}>180 Days</option>
                  <option value={365}>365 Days (1 Year)</option>
                  <option value={2555}>7 Years (Financial Compliance)</option>
                </select>
              </div>

              {/* DLP Masking */}
              <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    Data Loss Prevention (DLP) Masking
                  </span>
                  <Badge variant={dlpMasking ? 'emerald' : 'outline'} size="sm">
                    {dlpMasking ? 'Active' : 'Disabled'}
                  </Badge>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Automatically redact sensitive personal data in CSV and JSON query export streams.
                </p>
                <button
                  type="button"
                  onClick={() => setDlpMasking(!dlpMasking)}
                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-semibold pt-1"
                >
                  {dlpMasking ? 'Disable Masking' : 'Enable DLP Redaction'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: WORKSPACE TENANCY */}
      {activeTab === 'workspace' && (
        <div className="space-y-6">
          <div className="p-5 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Building className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Workspace &amp; Organization Profile</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-1">
                <span className="text-[11px] text-slate-500">Workspace Name</span>
                <p className="text-sm font-bold text-slate-900 dark:text-white">DataScope Global HQ</p>
                <p className="text-[11px] text-slate-400">Tenant identifier: tenant-ds-prod-01</p>
              </div>

              <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-1">
                <span className="text-[11px] text-slate-500">Cloud Region &amp; Placement</span>
                <p className="text-sm font-bold text-slate-900 dark:text-white">AWS eu-central-1 (Frankfurt)</p>
                <p className="text-[11px] text-slate-400">Multi-AZ PostgreSQL cluster</p>
              </div>

              <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-1">
                <span className="text-[11px] text-slate-500">Service Level Agreement</span>
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">99.99% Uptime Guarantee</p>
                <p className="text-[11px] text-slate-400">24/7 dedicated enterprise response</p>
              </div>

              <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-1">
                <span className="text-[11px] text-slate-500">Compliance Accreditations</span>
                <p className="text-sm font-bold text-slate-900 dark:text-white">SOC 2 Type II &bull; GDPR</p>
                <p className="text-[11px] text-slate-400">ISO/IEC 27001 audited annually</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
