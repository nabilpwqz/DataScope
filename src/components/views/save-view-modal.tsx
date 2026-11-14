'use client';

import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { setSaveModalOpen } from '@/store/slices/savedViewsSlice';
import { useCreateSavedViewMutation } from '@/store/services/dataScopeApi';
import { Button } from '../ui/button';
import { BookmarkCheck, X, Share2 } from 'lucide-react';

export const SaveViewModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isSaveModalOpen } = useAppSelector((state) => state.savedViews);
  const { selectedDatasetId } = useAppSelector((state) => state.dataset);
  const { search, searchType, filters, filterLogicalOperator, sort, pageSize } = useAppSelector(
    (state) => state.searchConfig
  );
  const { visibleColumns } = useAppSelector((state) => state.uiPreference);
  const { permissions } = useAppSelector((state) => state.auth);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isShared, setIsShared] = useState(false);

  const [createView, { isLoading }] = useCreateSavedViewMutation();

  if (!isSaveModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const visibleColsArray = Object.keys(visibleColumns).filter((k) => visibleColumns[k] !== false);

    try {
      await createView({
        datasetId: selectedDatasetId,
        name: name.trim(),
        description: description.trim(),
        isShared: isShared && permissions.canShareViews,
        searchQuery: search,
        searchType,
        filterConfig: filters,
        filterLogicalOperator,
        sortConfig: sort,
        visibleColumns: visibleColsArray,
        pageSize,
      }).unwrap();

      dispatch(setSaveModalOpen(false));
      setName('');
      setDescription('');
    } catch (err) {
      alert('Failed to save view');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 motion-safe:animate-in motion-safe:fade-in-50">
      <div className="flex flex-col w-full max-w-lg rounded-xl border border-slate-800 bg-slate-950 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <BookmarkCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">Save Current View</h3>
              <p className="text-xs text-slate-400">
                Preserve active search criteria, filters, sorting, and column visibility.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => dispatch(setSaveModalOpen(false))}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">View name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Q3 DACH Enterprise High-Revenue"
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Description (Optional)</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What this view is used for..."
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500"
            />
          </div>

          {permissions.canShareViews && (
            <label className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-800 bg-slate-900 cursor-pointer">
              <input
                type="checkbox"
                checked={isShared}
                onChange={(e) => setIsShared(e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-emerald-600 focus:ring-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              />
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Share2 className="h-3.5 w-3.5 text-emerald-400" />
                  Share with authorized team members
                </span>
                <span className="text-xs text-slate-400">
                  Allow other team members and viewers to discover and load this view.
                </span>
              </div>
            </label>
          )}

          {/* Config Preview Summary */}
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-400 space-y-1">
            <div>
              Active filters: <strong className="text-slate-200">{filters.length} conditions</strong>
            </div>
            <div>
              Search query: <strong className="text-slate-200">&quot;{search || '(None)'}&quot;</strong>
            </div>
            <div>
              Sort strategy: <strong className="text-slate-200">{sort[0]?.field || 'Date'} {sort[0]?.direction || 'desc'}</strong>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => dispatch(setSaveModalOpen(false))}
              className="text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isLoading}
              className="text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              Save view configuration
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
