'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store';
import { toggleSidebar, setMobileMenuOpen } from '@/store/slices/uiPreferenceSlice';
import { logout } from '@/store/slices/authSlice';
import {
  IconDatabase,
  IconTable,
  IconSliders,
  IconBookmark,
  IconHistory,
  IconChart,
  IconActivity,
  IconLayers,
  IconSettings,
  IconServer,
  IconQuality,
  IconGitBranch,
  IconUsers,
  IconFileText,
  IconChevronLeft,
  IconChevronRight,
  IconLogout,
  IconX,
} from '@/components/ui/icons';
import { DataScopeLogo } from '@/components/brand/logo';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { sidebarCollapsed, mobileMenuOpen } = useAppSelector((state) => state.uiPreference);
  const { activeRole } = useAppSelector((state) => state.auth);

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Continue client cleanup
    }
    dispatch(logout());
    dispatch(setMobileMenuOpen(false));
    router.push('/');
  };

  const navSections = [
    {
      title: 'Workspace',
      items: [
        {
          label: 'Overview',
          href: '/dashboard',
          icon: IconLayers,
        },
        {
          label: 'Dataset Library',
          href: '/dashboard/datasets',
          icon: IconDatabase,
        },
        {
          label: 'Data Explorer',
          href: '/dashboard/explorer',
          icon: IconTable,
          badge: 'Core',
          badgeColor: 'success' as const,
        },
        {
          label: 'Advanced Search',
          href: '/dashboard/advanced-search',
          icon: IconSliders,
        },
        {
          label: 'Saved Views',
          href: '/dashboard/saved-views',
          icon: IconBookmark,
        },
        {
          label: 'Search History',
          href: '/dashboard/search-history',
          icon: IconHistory,
        },
      ],
    },
    {
      title: 'Intelligence',
      items: [
        {
          label: 'Data Analytics',
          href: '/dashboard/analytics',
          icon: IconChart,
        },
        {
          label: 'Data Quality',
          href: '/dashboard/data-quality',
          icon: IconQuality,
          badge: 'Score',
          badgeColor: 'success' as const,
        },
        {
          label: 'Data Lineage',
          href: '/dashboard/data-lineage',
          icon: IconGitBranch,
        },
      ],
    },
    {
      title: 'Administration',
      items: [
        {
          label: 'Users & Roles',
          href: '/dashboard/users',
          icon: IconUsers,
        },
        {
          label: 'Audit Logs',
          href: '/dashboard/audit-logs',
          icon: IconFileText,
        },
        {
          label: 'System Settings',
          href: '/dashboard/settings',
          icon: IconSettings,
        },
      ],
    },
    {
      title: 'System',
      items: [
        {
          label: 'Performance Monitor',
          href: '/dashboard/performance',
          icon: IconActivity,
          badge: 'Live',
          badgeColor: 'success' as const,
        },
        {
          label: 'Architecture & ADRs',
          href: '/dashboard/architecture',
          icon: IconServer,
          badge: 'Docs',
          badgeColor: 'default' as const,
        },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/75 md:hidden motion-safe:animate-in motion-safe:fade-in-50"
          onClick={() => dispatch(setMobileMenuOpen(false))}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'flex flex-col border-r border-slate-800 bg-slate-950 select-none transition-transform duration-200 ease-in-out',
          // Mobile: slide-in fixed drawer on phones & tablets
          'fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw]',
          mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full',
          // Desktop: relative in standard flex flow
          'md:relative md:translate-x-0 md:z-30',
          sidebarCollapsed ? 'md:w-16' : 'md:w-64'
        )}
      >
        {/* Brand Header with Bespoke Logo */}
        <div className="flex h-16 items-center justify-between px-3 border-b border-slate-800">
          <Link
            href="/"
            onClick={() => dispatch(setMobileMenuOpen(false))}
            className="flex items-center gap-2 overflow-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 rounded p-1"
            title="DataScope Home"
          >
            <DataScopeLogo
              size="md"
              showText={!sidebarCollapsed || mobileMenuOpen}
              subtitle="Enterprise v1.0"
            />
          </Link>

          {/* Mobile close button */}
          <button
            onClick={() => dispatch(setMobileMenuOpen(false))}
            className="md:hidden flex h-8 w-8 items-center justify-center rounded border border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close navigation menu"
          >
            <IconX className="h-4 w-4" />
          </button>

          {/* Desktop collapse button */}
          <button
            onClick={() => dispatch(toggleSidebar())}
            className="hidden md:flex h-7 w-7 items-center justify-center rounded border border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? (
              <IconChevronRight className="h-4 w-4" />
            ) : (
              <IconChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Role Indicator Banner */}
        {!sidebarCollapsed || mobileMenuOpen ? (
          <div className="mx-3 mt-3 p-2.5 rounded border border-slate-800 bg-slate-900/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'h-2 w-2 rounded-full motion-safe:animate-pulse',
                  activeRole === 'admin'
                    ? 'bg-emerald-400'
                    : activeRole === 'analyst'
                    ? 'bg-slate-300'
                    : 'bg-emerald-500'
                )}
              />
              <span className="text-xs text-slate-300 font-medium capitalize">
                Role: <strong className="text-white">{activeRole}</strong>
              </span>
            </div>
            <Badge variant="success" size="sm">
              RBAC active
            </Badge>
          </div>
        ) : (
          <div className="mx-auto mt-3 hidden md:block" title={`Current Role: ${activeRole}`}>
            <span
              className={cn(
                'block h-2.5 w-2.5 rounded-full motion-safe:animate-pulse',
                activeRole === 'admin'
                  ? 'bg-emerald-400'
                  : activeRole === 'analyst'
                  ? 'bg-slate-300'
                  : 'bg-emerald-500'
              )}
            />
          </div>
        )}

      {/* Navigation List */}
      <nav className="flex-1 space-y-4 px-2.5 py-3 overflow-y-auto" aria-label="Dashboard navigation">
        {navSections.map((section, sectionIdx) => (
          <div key={section.title} className="space-y-1">
            {!sidebarCollapsed ? (
              <div className="px-3 pt-1 pb-1 text-xs font-semibold text-slate-500">
                {section.title}
              </div>
            ) : (
              sectionIdx > 0 && <div className="my-2 border-t border-slate-800" />
            )}

            {section.items.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => dispatch(setMobileMenuOpen(false))}
                  className={cn(
                    'group flex items-center gap-3 rounded px-3 py-1.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500',
                    isActive
                      ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/30'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  )}
                  title={sidebarCollapsed ? `${section.title}: ${item.label}` : undefined}
                >
                  <Icon
                    className={cn(
                      'h-4 w-4 shrink-0 transition-colors',
                      isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'
                    )}
                  />
                  {(!sidebarCollapsed || mobileMenuOpen) && (
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
          </div>
        ))}
      </nav>

      {/* Footer System Status & Sign Out */}
      <div className="p-3 border-t border-slate-800 bg-slate-950 space-y-2">
        {!sidebarCollapsed || mobileMenuOpen ? (
          <>
            <div className="flex flex-col gap-1 text-xs text-slate-400">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">PostgreSQL engine:</span>
                <span className="text-emerald-400 font-semibold font-mono text-[11px]">Ready (pg_trgm)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Indexed records:</span>
                <span className="font-mono text-slate-200 text-[11px]">110,000+</span>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 mt-2 px-3 py-1.5 rounded border border-slate-800 bg-slate-900/80 text-xs text-slate-400 hover:text-rose-300 hover:border-rose-500/40 hover:bg-rose-950/20 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <IconLogout className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 hidden md:flex" title="PostgreSQL 110,000+ Records Ready">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <button
              onClick={handleSignOut}
              className="p-1.5 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition-colors"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <IconLogout className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
    </>
  );
};
