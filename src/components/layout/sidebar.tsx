'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store';
import { toggleSidebar } from '@/store/slices/uiPreferenceSlice';
import {
  Database,
  Search,
  Table,
  SlidersHorizontal,
  BookmarkCheck,
  History,
  BarChart3,
  Activity,
  Layers,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Server,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { sidebarCollapsed } = useAppSelector((state) => state.uiPreference);
  const { activeRole } = useAppSelector((state) => state.auth);

  const navItems = [
    {
      label: 'Overview',
      href: '/dashboard',
      icon: Layers,
    },
    {
      label: 'Dataset Library',
      href: '/dashboard/datasets',
      icon: Database,
    },
    {
      label: 'Data Explorer',
      href: '/dashboard/explorer',
      icon: Table,
      badge: 'Flagship',
      badgeColor: 'info' as const,
    },
    {
      label: 'Advanced Search',
      href: '/dashboard/advanced-search',
      icon: SlidersHorizontal,
    },
    {
      label: 'Saved Views',
      href: '/dashboard/saved-views',
      icon: BookmarkCheck,
    },
    {
      label: 'Search History',
      href: '/dashboard/search-history',
      icon: History,
    },
    {
      label: 'Data Analytics',
      href: '/dashboard/analytics',
      icon: BarChart3,
    },
    {
      label: 'Performance Monitor',
      href: '/dashboard/performance',
      icon: Activity,
      badge: 'Live',
      badgeColor: 'success' as const,
    },
    {
      label: 'Architecture & ADRs',
      href: '/dashboard/architecture',
      icon: Server,
      badge: 'Docs',
      badgeColor: 'purple' as const,
    },
    {
      label: 'Settings & Access',
      href: '/dashboard/settings',
      icon: Settings,
    },
  ];

  return (
    <aside
      className={cn(
        'relative flex flex-col border-r border-slate-800 bg-slate-950/95 backdrop-blur transition-all duration-300 z-30 select-none',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800/80">
        <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 shadow-md shadow-blue-500/20 text-white font-bold text-lg">
            <Zap className="h-5 w-5" />
          </div>
          {!sidebarCollapsed && (
            <div className="flex flex-col">
              <span className="font-bold tracking-tight text-slate-100 text-base leading-none">
                DataScope
              </span>
              <span className="text-[10px] text-blue-400 font-mono tracking-wider uppercase mt-1">
                Enterprise v1.0
              </span>
            </div>
          )}
        </Link>
        <button
          onClick={() => dispatch(toggleSidebar())}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Role Indicator Banner */}
      {!sidebarCollapsed ? (
        <div className="mx-3 mt-3 p-2.5 rounded-lg border border-slate-800/90 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'h-2 w-2 rounded-full animate-pulse',
                activeRole === 'admin'
                  ? 'bg-purple-400'
                  : activeRole === 'analyst'
                  ? 'bg-blue-400'
                  : 'bg-emerald-400'
              )}
            />
            <span className="text-xs text-slate-300 font-medium capitalize">
              Role: <strong className="text-white">{activeRole}</strong>
            </span>
          </div>
          <Badge
            variant={activeRole === 'admin' ? 'purple' : activeRole === 'analyst' ? 'info' : 'success'}
            size="sm"
          >
            RBAC Active
          </Badge>
        </div>
      ) : (
        <div className="mx-auto mt-3" title={`Current Role: ${activeRole}`}>
          <div
            className={cn(
              'h-2.5 w-2.5 rounded-full animate-pulse',
              activeRole === 'admin'
                ? 'bg-purple-400'
                : activeRole === 'analyst'
                ? 'bg-blue-400'
                : 'bg-emerald-400'
            )}
          />
        </div>
      )}

      {/* Navigation List */}
      <nav className="flex-1 space-y-1.5 px-2.5 py-4 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              )}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <Icon
                className={cn(
                  'h-4 w-4 shrink-0 transition-transform group-hover:scale-110',
                  isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-200'
                )}
              />
              {!sidebarCollapsed && (
                <div className="flex flex-1 items-center justify-between overflow-hidden">
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <Badge variant={item.badgeColor} size="sm">
                      {item.badge}
                    </Badge>
                  )}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer System Status */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950">
        {!sidebarCollapsed ? (
          <div className="flex flex-col gap-1 text-[11px] text-slate-400">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">PostgreSQL Engine:</span>
              <span className="font-mono text-emerald-400 font-semibold">Ready (pg_trgm)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Indexed Records:</span>
              <span className="font-mono text-slate-200">110,000+</span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center" title="PostgreSQL 110,000+ Records Ready">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
          </div>
        )}
      </div>
    </aside>
  );
};
