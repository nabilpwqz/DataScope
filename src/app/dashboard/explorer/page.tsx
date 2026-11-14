'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  setSearch,
  setDebouncedSearch,
  setSearchType,
  setSearchField,
  applySavedViewConfig,
} from '@/store/slices/searchConfigSlice';
import { setSaveModalOpen } from '@/store/slices/savedViewsSlice';
import {
  useSearchRecordsQuery,
  useTriggerExportMutation,
  useGetDatasetByIdQuery,
} from '@/store/services/dataScopeApi';
import { VirtualizedDataTable } from '@/components/table/virtualized-data-table';
import { DataTablePagination } from '@/components/table/data-table-pagination';
import { DynamicFilterBar } from '@/components/filter/dynamic-filter-bar';
import { FilterBuilder } from '@/components/filter/filter-builder';
import { ColumnVisibilityDropdown } from '@/components/table/column-visibility-dropdown';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { debounce } from '@/lib/utils';
import {
  Search,
  SlidersHorizontal,
  BookmarkPlus,
  Download,
  Sparkles,
  Zap,
  RotateCcw,
  Layers,
  Cpu,
  Clock,
  CheckCircle,
} from 'lucide-react';

export default function DataExplorerPage() {
  const dispatch = useAppDispatch();
  const { selectedDatasetId } = useAppSelector((state) => state.dataset);
  const {
    search,
    debouncedSearch,
    searchType,
    searchField,
    filters,
    filterLogicalOperator,
    sort,
    page,
    pageSize,
    paginationType,
    cursor,
  } = useAppSelector((state) => state.searchConfig);
  const { permissions } = useAppSelector((state) => state.auth);

  const [isFilterBuilderOpen, setIsFilterBuilderOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Fetch Dataset metadata
  const { data: dataset } = useGetDatasetByIdQuery(selectedDatasetId);

  // RTK Query: Execute high performance backend search
  const {
    data: searchResponse,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useSearchRecordsQuery(
    {
      datasetId: selectedDatasetId,
      search: debouncedSearch,
      searchType,
      searchField: searchField || undefined,
      filters,
      filterLogicalOperator,
      sort,
      page,
      pageSize,
      paginationType,
      cursor: cursor || undefined,
    },
    {
      // Refetch on dataset switch
      refetchOnMountOrArgChange: true,
    }
  );

  // Debounce search input by 300ms to prevent excessive API calls
  const debouncedDispatchSearch = useCallback(
    debounce((value: string) => {
      dispatch(setDebouncedSearch(value));
    }, 300),
    [dispatch]
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    dispatch(setSearch(val));
    debouncedDispatchSearch(val);
  };

  const [triggerExport] = useTriggerExportMutation();

  const handleExportCsv = async () => {
    if (!permissions.canExportData) {
      alert('Viewer role cannot export datasets. Switch to Analyst or Admin in header.');
      return;
    }

    try {
      setIsExporting(true);
      const res = await triggerExport({
        datasetId: selectedDatasetId,
        filters,
        search: debouncedSearch,
      }).unwrap();

      // Trigger file download
      window.open(res.downloadUrl, '_blank');
    } catch (err: any) {
      alert(err.data?.error || 'Failed to export CSV');
    } finally {
      setIsExporting(false);
    }
  };

  const records = searchResponse?.records || [];
  const totalRecords = searchResponse?.totalRecords || 0;
  const executionTimeMs = searchResponse?.executionTimeMs || 0;
  const cacheHit = searchResponse?.cacheHit || false;
  const totalPages = searchResponse?.totalPages || 1;

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 bg-slate-950 overflow-hidden">
      {/* Search & Control Action Bar */}
      <div className="flex flex-col gap-3 px-6 py-3 border-b border-slate-800 bg-slate-900/40">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left: Global Search + Strategy Picker */}
          <div className="flex flex-wrap items-center gap-2 flex-1 max-w-3xl">
            <div className="relative flex-1 min-w-[240px]">
              <Input
                type="text"
                value={search}
                onChange={handleSearchChange}
                placeholder="Search across 100,000+ indexed records (e.g. Siemens, Germany, Logistics)..."
                icon={<Search className="h-4 w-4 text-slate-400" />}
                className="bg-slate-950 border-slate-700 text-sm h-9"
              />
              {isFetching && (
                <div className="absolute right-3 top-2.5">
                  <div className="h-4 w-4 motion-safe:animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                </div>
              )}
            </div>

            {/* Field scope selector */}
            <select
              value={searchField}
              onChange={(e) => dispatch(setSearchField(e.target.value))}
              aria-label="Filter search by specific field"
              className="h-9 rounded-md border border-slate-700 bg-slate-900 px-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="">All Fields</option>
              <option value="title">Company Name</option>
              <option value="recordKey">Account Key</option>
              <option value="country">Country</option>
              <option value="category">Segment</option>
            </select>

            {/* Search Engine Strategy Selector */}
            <div className="flex items-center rounded-md border border-slate-800 bg-slate-950 p-1">
              <span className="text-xs text-slate-400 px-1.5 hidden sm:inline">
                Engine:
              </span>
              <button
                onClick={() => dispatch(setSearchType('hybrid'))}
                title="Hybrid: Full-text search + Substring matching"
                className={`px-2 py-0.5 text-xs font-medium rounded transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                  searchType === 'hybrid'
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Hybrid
              </button>
              <button
                onClick={() => dispatch(setSearchType('fts'))}
                title="PostgreSQL Full-Text Search (tsvector @@ tsquery)"
                className={`px-2 py-0.5 text-xs font-medium rounded transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                  searchType === 'fts'
                    ? 'bg-slate-700 text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                FTS
              </button>
              <button
                onClick={() => dispatch(setSearchType('trgm'))}
                title="PostgreSQL Trigram Search (similarity & fuzzy typo matching)"
                className={`px-2 py-0.5 text-xs font-medium rounded transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                  searchType === 'trgm'
                    ? 'bg-emerald-700 text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Trigram
              </button>
              <button
                onClick={() => dispatch(setSearchType('exact'))}
                title="Exact substring match (ILIKE)"
                className={`px-2 py-0.5 text-xs font-medium rounded transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                  searchType === 'exact'
                    ? 'bg-slate-800 text-emerald-400 border border-emerald-500/40 font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Exact
              </button>
            </div>
          </div>

          {/* Right: Actions (Save View, Export, Columns) */}
          <div className="flex items-center gap-2">
            {permissions.canCreateSavedViews && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => dispatch(setSaveModalOpen(true))}
                className="text-xs text-slate-300 border-slate-700 bg-slate-900/80 hover:bg-slate-800"
              >
                <BookmarkPlus className="h-3.5 w-3.5 text-blue-400" />
                <span className="hidden sm:inline">Save View</span>
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              isLoading={isExporting}
              disabled={!permissions.canExportData}
              className="text-xs text-slate-300 border-slate-700 bg-slate-900/80 hover:bg-slate-800"
            >
              <Download className="h-3.5 w-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Export CSV</span>
            </Button>

            <ColumnVisibilityDropdown />
          </div>
        </div>
      </div>

      {/* Dynamic Filter Badges Bar */}
      <DynamicFilterBar onOpenAdvancedBuilder={() => setIsFilterBuilderOpen(true)} />

      {/* Flagship Virtualized Data Table */}
      <div className="flex-1 min-h-0 relative flex flex-col">
        <VirtualizedDataTable
          records={records}
          isLoading={isLoading}
          searchQuery={debouncedSearch}
        />
      </div>

      {/* Pagination Footer */}
      <DataTablePagination
        totalRecords={totalRecords}
        currentPage={page}
        pageSize={pageSize}
        totalPages={totalPages}
        hasNextPage={searchResponse?.hasNextPage || false}
        hasPrevPage={searchResponse?.hasPrevPage || false}
        executionTimeMs={executionTimeMs}
        cacheHit={cacheHit}
      />

      {/* Visual Query Builder Modal */}
      <FilterBuilder
        isOpen={isFilterBuilderOpen}
        onClose={() => setIsFilterBuilderOpen(false)}
      />
    </div>
  );
}

