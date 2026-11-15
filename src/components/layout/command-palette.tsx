'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/store';
import { setAiModalOpen } from '@/store/slices/savedViewsSlice';
import { switchRole } from '@/store/slices/authSlice';
import { UserRole } from '@/types';
import {
  IconSearch,
  IconLayers,
  IconDatabase,
  IconTable,
  IconSliders,
  IconBookmark,
  IconHistory,
  IconChart,
  IconQuality,
  IconGitBranch,
  IconUsers,
  IconFileText,
  IconSettings,
  IconActivity,
  IconServer,
  IconSparkles,
  IconSun,
  IconX,
} from '@/components/ui/icons';

interface CommandItem {
  id: string;
  category: 'Workspace' | 'Intelligence' | 'Administration' | 'System' | 'Actions';
  title: string;
  description: string;
  href?: string;
  action?: () => void;
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
}

export const CommandPalette: React.FC = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global keyboard listener for Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    const handleCustomOpen = () => setIsOpen(true);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('datascope:open-command-palette', handleCustomOpen);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('datascope:open-command-palette', handleCustomOpen);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const items: CommandItem[] = useMemo(() => [
    // Workspace
    {
      id: 'nav-overview',
      category: 'Workspace',
      title: 'Overview Dashboard',
      description: 'System telemetry, KPI summaries, and data activity.',
      href: '/dashboard',
      icon: IconLayers,
    },
    {
      id: 'nav-datasets',
      category: 'Workspace',
      title: 'Dataset Library',
      description: 'Explore, manage, and inspect enterprise schemas.',
      href: '/dashboard/datasets',
      icon: IconDatabase,
    },
    {
      id: 'nav-explorer',
      category: 'Workspace',
      title: 'Data Explorer',
      description: 'Primary workspace for filtering and full-text search.',
      href: '/dashboard/explorer',
      icon: IconTable,
      shortcut: 'Core',
    },
    {
      id: 'nav-advanced-search',
      category: 'Workspace',
      title: 'Advanced Search',
      description: 'Multi-criteria parametric filtering engine.',
      href: '/dashboard/advanced-search',
      icon: IconSliders,
    },
    {
      id: 'nav-saved-views',
      category: 'Workspace',
      title: 'Saved Views',
      description: 'Stored query configurations and shared perspectives.',
      href: '/dashboard/saved-views',
      icon: IconBookmark,
    },
    {
      id: 'nav-history',
      category: 'Workspace',
      title: 'Search History',
      description: 'Audit trail of recent query and filter operations.',
      href: '/dashboard/search-history',
      icon: IconHistory,
    },

    // Intelligence
    {
      id: 'nav-analytics',
      category: 'Intelligence',
      title: 'Data Analytics',
      description: 'Distribution metrics, category trends, and statistics.',
      href: '/dashboard/analytics',
      icon: IconChart,
    },
    {
      id: 'nav-quality',
      category: 'Intelligence',
      title: 'Data Quality & Health',
      description: 'Completeness, uniqueness, validity, and issue tracking.',
      href: '/dashboard/data-quality',
      icon: IconQuality,
    },
    {
      id: 'nav-lineage',
      category: 'Intelligence',
      title: 'Data Lineage Graph',
      description: 'Interactive pipeline and consumer dependency graph.',
      href: '/dashboard/data-lineage',
      icon: IconGitBranch,
    },

    // Administration
    {
      id: 'nav-users',
      category: 'Administration',
      title: 'Users & Roles (RBAC)',
      description: 'Platform user directory and permission governance.',
      href: '/dashboard/users',
      icon: IconUsers,
    },
    {
      id: 'nav-audit-logs',
      category: 'Administration',
      title: 'Security Audit Logs',
      description: 'Immutable trail of user actions, exports, and changes.',
      href: '/dashboard/audit-logs',
      icon: IconFileText,
    },
    {
      id: 'nav-settings',
      category: 'Administration',
      title: 'System Settings',
      description: 'Preferences, caching intervals, and security configurations.',
      href: '/dashboard/settings',
      icon: IconSettings,
    },

    // System
    {
      id: 'nav-performance',
      category: 'System',
      title: 'Performance Monitor',
      description: 'Sub-millisecond query latency and LRU cache telemetry.',
      href: '/dashboard/performance',
      icon: IconActivity,
    },
    {
      id: 'nav-architecture',
      category: 'System',
      title: 'Architecture & ADRs',
      description: 'Architectural decision records and technical documentation.',
      href: '/dashboard/architecture',
      icon: IconServer,
    },

    // Quick Actions
    {
      id: 'action-ai',
      category: 'Actions',
      title: 'Open AI Assistant',
      description: 'Translate natural language inquiries into exact queries.',
      action: () => dispatch(setAiModalOpen(true)),
      icon: IconSparkles,
      shortcut: 'NLQ',
    },
    {
      id: 'action-theme',
      category: 'Actions',
      title: 'Toggle Color Theme',
      description: 'Switch between light and dark interface palettes.',
      action: () => {
        const themeBtn = document.querySelector('button[aria-label="Toggle theme"]') as HTMLButtonElement | null;
        themeBtn?.click();
      },
      icon: IconSun,
    },
    {
      id: 'action-role-admin',
      category: 'Actions',
      title: 'Switch Role to Admin',
      description: 'Activate full administrator access and permissions.',
      action: () => dispatch(switchRole('admin' as UserRole)),
      icon: IconUsers,
    },
    {
      id: 'action-role-analyst',
      category: 'Actions',
      title: 'Switch Role to Analyst',
      description: 'Activate data analyst views and export privileges.',
      action: () => dispatch(switchRole('analyst' as UserRole)),
      icon: IconUsers,
    },
  ], [dispatch]);

  const filteredItems = useMemo(() => {
    if (!query.trim()) return items;
    const lower = query.toLowerCase().trim();
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(lower) ||
        item.description.toLowerCase().includes(lower) ||
        item.category.toLowerCase().includes(lower)
    );
  }, [items, query]);

  const executeItem = (item: CommandItem) => {
    setIsOpen(false);
    if (item.href) {
      router.push(item.href);
    } else if (item.action) {
      item.action();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (filteredItems.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % filteredItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = filteredItems[activeIndex];
      if (selected) executeItem(selected);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/60 backdrop-blur-sm"
      onClick={() => setIsOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
    >
      <div
        className="relative w-full max-w-2xl rounded-lg border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[75vh]"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-800 bg-slate-950/80">
          <IconSearch className="h-5 w-5 text-emerald-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            placeholder="Search views, datasets, pages, or quick actions..."
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-400 focus:outline-none"
          />
          <button
            onClick={() => setIsOpen(false)}
            aria-label="Close command palette"
            className="p-1 rounded text-slate-400 hover:text-slate-200 transition-colors"
          >
            <IconX className="h-4 w-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">
              No matching pages, views, or actions found for &ldquo;{query}&rdquo;.
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === activeIndex;

              return (
                <div
                  key={item.id}
                  onClick={() => executeItem(item)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-md cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-emerald-950/50 border border-emerald-500/40 text-slate-100'
                      : 'hover:bg-slate-800/60 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded border ${
                        isSelected
                          ? 'border-emerald-500/50 bg-emerald-900/40 text-emerald-300'
                          : 'border-slate-800 bg-slate-950 text-slate-400'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold truncate">{item.title}</span>
                        <span className="text-xs font-medium px-1.5 py-0.5 rounded border border-slate-700 bg-slate-800/80 text-slate-400">
                          {item.category}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 truncate">{item.description}</span>
                    </div>
                  </div>

                  {item.shortcut && (
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded border border-slate-700 bg-slate-800 text-slate-300 shrink-0">
                      {item.shortcut}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Keyboard Helper Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-slate-800 bg-slate-950 text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1.5 py-0.5 rounded border border-slate-700 bg-slate-800 font-mono text-[10px]">
                ↑
              </kbd>{' '}
              <kbd className="px-1.5 py-0.5 rounded border border-slate-700 bg-slate-800 font-mono text-[10px]">
                ↓
              </kbd>{' '}
              to navigate
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded border border-slate-700 bg-slate-800 font-mono text-[10px]">
                Enter
              </kbd>{' '}
              to select
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded border border-slate-700 bg-slate-800 font-mono text-[10px]">
                Esc
              </kbd>{' '}
              to close
            </span>
          </div>
          <span className="text-emerald-400 font-medium">DataScope Command</span>
        </div>
      </div>
    </div>
  );
};
