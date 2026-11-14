'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store';
import { applySavedViewConfig } from '@/store/slices/searchConfigSlice';
import {
  useGetSavedViewsQuery,
  useDeleteSavedViewMutation,
} from '@/store/services/dataScopeApi';
import { SavedView } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import {
  BookmarkCheck,
  Play,
  Trash2,
  Share2,
  User,
  ArrowRight,
} from 'lucide-react';

export default function SavedViewsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { selectedDatasetId } = useAppSelector((state) => state.dataset);
  const { user, activeRole } = useAppSelector((state) => state.auth);

  const { data: views = [], isLoading, refetch } = useGetSavedViewsQuery(selectedDatasetId);
  const [deleteSavedView] = useDeleteSavedViewMutation();

  const handleApplyView = (view: SavedView) => {
    dispatch(
      applySavedViewConfig({
        search: view.searchQuery,
        searchType: (view.searchType as 'hybrid' | 'fts' | 'trgm' | 'exact') || 'hybrid',
        filters: view.filterConfig,
        filterLogicalOperator: view.filterLogicalOperator,
        sort: view.sortConfig,
        pageSize: view.pageSize,
      })
    );
    router.push('/dashboard/explorer');
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this saved view?')) {
      await deleteSavedView({ id, datasetId: selectedDatasetId });
      refetch();
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <BookmarkCheck className="h-5 w-5 text-emerald-400" />
            <span>Saved Views &amp; Filter Presets</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Access frequently used search configurations, multi-column sorts, and shared team views.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/dashboard/explorer')}
          className="text-xs gap-1.5 focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          <span>Create new view in explorer</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Views Grid */}
      {isLoading ? (
        <div className="py-20 text-center space-y-3">
          <div className="h-7 w-7 motion-safe:animate-spin rounded-full border-2 border-emerald-500 border-t-transparent mx-auto" />
          <span className="text-xs text-slate-400">Loading saved views…</span>
        </div>
      ) : views.length === 0 ? (
        <div className="py-20 text-center p-8 rounded-lg border border-slate-800 bg-slate-900/30">
          <BookmarkCheck className="h-10 w-10 text-slate-600 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-200">No saved views yet</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Construct your search and filters in the Data Explorer, then click &quot;Save View&quot; to preserve it here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {views.map((v) => (
            <div
              key={v.id}
              className="p-5 rounded-lg border border-slate-800 bg-slate-900/50 hover:border-slate-700 transition-colors flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant={v.isShared ? 'success' : 'default'} size="sm">
                    {v.isShared ? 'Team shared' : 'Private'}
                  </Badge>
                  <span className="text-xs text-slate-500">
                    {formatDate(v.createdAt)}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-white">{v.name}</h3>
                  {v.description && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{v.description}</p>
                  )}
                </div>

                {/* Filter preview chips */}
                <div className="pt-2 border-t border-slate-800 space-y-1.5">
                  <span className="text-xs text-slate-400">
                    Configured conditions ({v.filterConfig?.length || 0}):
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {v.filterConfig?.map((fc, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono"
                      >
                        {fc.field} {fc.operator} {String(fc.value)}
                      </span>
                    ))}
                    {v.searchQuery && (
                      <span className="text-xs px-2 py-0.5 rounded bg-amber-950/60 border border-amber-900/40 text-amber-300 font-mono">
                        Query: &quot;{v.searchQuery}&quot;
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-xs text-slate-500 flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />
                  <span>Author: {v.authorName || 'Marcus Vance'}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between gap-2">
                <Button
                  variant="primary"
                  size="xs"
                  onClick={() => handleApplyView(v)}
                  className="text-xs gap-1.5 flex-1 font-semibold focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  <Play className="h-3 w-3 fill-current" />
                  <span>Apply and explore</span>
                </Button>

                {(activeRole === 'admin' || v.userId === user?.id) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => handleDelete(v.id, e)}
                    className="h-7 w-7 text-slate-400 hover:text-rose-400 focus-visible:ring-2 focus-visible:ring-emerald-500"
                    title="Delete saved view"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
