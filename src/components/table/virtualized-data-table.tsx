'use client';

import React, { useRef, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  openRecordDetail,
  toggleRowSelection,
  selectAllRows,
  clearRowSelection,
} from '@/store/slices/datasetSlice';
import { toggleColumnSort, clearFilters } from '@/store/slices/searchConfigSlice';
import { DatasetRecord, SortCondition } from '@/types';
import { SearchHighlighter } from './search-highlighter';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  CheckSquare,
  Square,
  Download,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FilterX,
} from 'lucide-react';

interface VirtualizedDataTableProps {
  records: DatasetRecord[];
  isLoading: boolean;
  searchQuery: string;
}

export const VirtualizedDataTable: React.FC<VirtualizedDataTableProps> = ({
  records,
  isLoading,
  searchQuery,
}) => {
  const dispatch = useAppDispatch();
  const parentRef = useRef<HTMLDivElement>(null);

  const { visibleColumns, tableDensity, useVirtualization, highlightMatches } = useAppSelector(
    (state) => state.uiPreference
  );
  const { sort } = useAppSelector((state) => state.searchConfig);
  const { selectedRowIds } = useAppSelector((state) => state.dataset);
  const { permissions } = useAppSelector((state) => state.auth);

  const selectedCount = Object.keys(selectedRowIds).length;
  const isAllSelected = records.length > 0 && records.every((r) => selectedRowIds[r.id]);

  // Row heights based on density
  const rowHeight = useMemo(() => {
    switch (tableDensity) {
      case 'compact':
        return 38;
      case 'spacious':
        return 58;
      case 'standard':
      default:
        return 46;
    }
  }, [tableDensity]);

  // TanStack Virtualizer for high-throughput 60fps rendering
  const rowVirtualizer = useVirtualizer({
    count: records.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 10,
  });

  const handleExportSelected = () => {
    const selectedList = records.filter((r) => selectedRowIds[r.id]);
    if (selectedList.length === 0) return;

    const csvHeader = 'Record Key,Title,Category,Status,Value,Country,Region,Date\n';
    const csvLines = selectedList.map((r) => {
      const escapedTitle = `"${(r.title || '').replace(/"/g, '""')}"`;
      return `${r.recordKey},${escapedTitle},${r.category},${r.status},${r.numericValue},${r.country},${r.region},${r.recordDate}`;
    });
    const blob = new Blob([csvHeader + csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `datascope-selected-${selectedList.length}-records-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSelectAll = () => {
    if (isAllSelected) {
      dispatch(clearRowSelection());
    } else {
      dispatch(selectAllRows(records.map((r) => r.id)));
    }
  };

  const getSortIcon = (field: string) => {
    const s = sort.find((item) => item.field === field);
    if (!s) return <ArrowUpDown className="h-3 w-3 text-slate-500 opacity-0 group-hover:opacity-100" />;
    return s.direction === 'asc' ? (
      <ArrowUp className="h-3.5 w-3.5 text-blue-400 font-bold" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5 text-blue-400 font-bold" />
    );
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Active':
        return 'success';
      case 'Pending':
        return 'warning';
      case 'Suspended':
      case 'Flagged':
        return 'danger';
      case 'Completed':
        return 'info';
      case 'Archived':
      default:
        return 'default';
    }
  };

  if (isLoading && records.length === 0) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center py-24 space-y-3">
        <div className="h-8 w-8 motion-safe:animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        <span className="text-xs text-slate-400">Querying indexed database records…</span>
      </div>
    );
  }

  if (records.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 border border-slate-800 text-slate-400 mb-3">
          <FilterX className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-semibold text-slate-200">No records match the current criteria</h3>
        <p className="mt-1 text-xs text-slate-400 max-w-sm">
          Try loosening your filter conditions, switching to Trigram fuzzy search, or clearing active filters.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => dispatch(clearFilters())}
          className="mt-4 text-xs"
        >
          Reset All Filters
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 bg-slate-950 overflow-hidden">
      {/* Bulk Action Bar (when rows are selected) */}
      {selectedCount > 0 && (
        <div className="flex items-center justify-between px-4 py-2 bg-emerald-950/60 border-b border-emerald-800/60 text-xs text-emerald-200 transition-colors">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-emerald-400" />
            <span>
              <strong>{selectedCount}</strong> {selectedCount === 1 ? 'record' : 'records'} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            {permissions.canExportData && (
              <Button
                variant="subtle"
                size="xs"
                onClick={handleExportSelected}
                className="text-xs gap-1"
              >
                <Download className="h-3 w-3" />
                Export Selected
              </Button>
            )}
            <Button
              variant="ghost"
              size="xs"
              onClick={() => dispatch(clearRowSelection())}
              className="text-xs text-slate-400 hover:text-white"
            >
              Deselect All
            </Button>
          </div>
        </div>
      )}

      {/* Main Table Scroll Container */}
      <div
        ref={parentRef}
        className="flex-1 overflow-auto relative custom-scrollbar select-text"
        style={{ contain: 'strict', WebkitOverflowScrolling: 'touch' }}
      >
        <table className="w-full text-left border-collapse table-fixed min-w-[960px]">
          {/* Sticky Table Header */}
          <thead className="sticky top-0 z-10 bg-slate-900 border-b border-slate-800 text-xs font-semibold text-slate-300 shadow-sm">
            <tr className="flex items-center min-w-[960px]">
              {/* Checkbox column */}
              <th className="w-10 shrink-0 px-3 py-3 text-center">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={handleSelectAll}
                  aria-label="Select all rows"
                  className="h-3.5 w-3.5 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </th>

              {visibleColumns.recordKey !== false && (
                <th
                  onClick={() => dispatch(toggleColumnSort('recordKey'))}
                  className="w-32 shrink-0 px-4 py-3 cursor-pointer hover:text-white group select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Key</span>
                    {getSortIcon('recordKey')}
                  </div>
                </th>
              )}

              {visibleColumns.title !== false && (
                <th
                  onClick={() => dispatch(toggleColumnSort('title'))}
                  className="w-72 shrink-0 px-4 py-3 cursor-pointer hover:text-white group select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Company / Title</span>
                    {getSortIcon('title')}
                  </div>
                </th>
              )}

              {visibleColumns.category !== false && (
                <th
                  onClick={() => dispatch(toggleColumnSort('category'))}
                  className="w-36 shrink-0 px-4 py-3 cursor-pointer hover:text-white group select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Segment</span>
                    {getSortIcon('category')}
                  </div>
                </th>
              )}

              {visibleColumns.status !== false && (
                <th
                  onClick={() => dispatch(toggleColumnSort('status'))}
                  className="w-32 shrink-0 px-4 py-3 cursor-pointer hover:text-white group select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Status</span>
                    {getSortIcon('status')}
                  </div>
                </th>
              )}

              {visibleColumns.numericValue !== false && (
                <th
                  onClick={() => dispatch(toggleColumnSort('numericValue'))}
                  className="w-40 shrink-0 px-4 py-3 cursor-pointer hover:text-white group select-none text-right"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Revenue ($)</span>
                    {getSortIcon('numericValue')}
                  </div>
                </th>
              )}

              {visibleColumns.country !== false && (
                <th
                  onClick={() => dispatch(toggleColumnSort('country'))}
                  className="w-36 shrink-0 px-4 py-3 cursor-pointer hover:text-white group select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Country</span>
                    {getSortIcon('country')}
                  </div>
                </th>
              )}

              {visibleColumns.region !== false && (
                <th
                  onClick={() => dispatch(toggleColumnSort('region'))}
                  className="w-32 shrink-0 px-4 py-3 cursor-pointer hover:text-white group select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Region</span>
                    {getSortIcon('region')}
                  </div>
                </th>
              )}

              {visibleColumns.recordDate !== false && (
                <th
                  onClick={() => dispatch(toggleColumnSort('recordDate'))}
                  className="w-36 shrink-0 px-4 py-3 cursor-pointer hover:text-white group select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Date</span>
                    {getSortIcon('recordDate')}
                  </div>
                </th>
              )}

              <th className="w-16 shrink-0 px-3 py-3 text-right">Action</th>
            </tr>
          </thead>

          {/* Table Body with Optional Virtualization */}
          <tbody
            className="divide-y divide-slate-800/60 font-sans text-xs"
            style={
              useVirtualization
                ? {
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    position: 'relative',
                  }
                : undefined
            }
          >
            {useVirtualization ? (
              rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const record = records[virtualRow.index];
                if (!record) return null;
                const isSelected = !!selectedRowIds[record.id];

                return (
                  <tr
                    key={record.id}
                    onClick={() => dispatch(openRecordDetail(record.id))}
                    className={`absolute left-0 top-0 w-full min-w-[960px] flex items-center transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-blue-900/20 hover:bg-blue-900/30'
                        : 'hover:bg-slate-900/70 even:bg-slate-950 odd:bg-slate-900/30'
                    }`}
                    style={{
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <td
                      className="w-10 shrink-0 px-3 py-2 text-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        dispatch(toggleRowSelection(record.id));
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        aria-label={`Select record ${record.recordKey}`}
                        className="h-3.5 w-3.5 rounded border-slate-700 bg-slate-800 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                    </td>

                    {visibleColumns.recordKey !== false && (
                      <td className="w-32 shrink-0 px-4 py-2 font-mono text-emerald-400 font-medium truncate">
                        <SearchHighlighter
                          text={record.recordKey}
                          searchQuery={searchQuery}
                          enabled={highlightMatches}
                        />
                      </td>
                    )}

                    {visibleColumns.title !== false && (
                      <td className="w-72 shrink-0 px-4 py-2 text-slate-100 font-medium truncate">
                        <SearchHighlighter
                          text={record.title}
                          searchQuery={searchQuery}
                          enabled={highlightMatches}
                        />
                      </td>
                    )}

                    {visibleColumns.category !== false && (
                      <td className="w-36 shrink-0 px-4 py-2 text-slate-400 truncate">
                        {record.category}
                      </td>
                    )}

                    {visibleColumns.status !== false && (
                      <td className="w-32 shrink-0 px-4 py-2">
                        <Badge variant={getStatusBadgeVariant(record.status)} size="sm">
                          {record.status}
                        </Badge>
                      </td>
                    )}

                    {visibleColumns.numericValue !== false && (
                      <td className="w-40 shrink-0 px-4 py-2 text-right font-mono font-medium text-emerald-400">
                        {formatCurrency(record.numericValue)}
                      </td>
                    )}

                    {visibleColumns.country !== false && (
                      <td className="w-36 shrink-0 px-4 py-2 text-slate-300 truncate">
                        <SearchHighlighter
                          text={record.country}
                          searchQuery={searchQuery}
                          enabled={highlightMatches}
                        />
                      </td>
                    )}

                    {visibleColumns.region !== false && (
                      <td className="w-32 shrink-0 px-4 py-2 text-slate-400 truncate">
                        {record.region}
                      </td>
                    )}

                    {visibleColumns.recordDate !== false && (
                      <td className="w-36 shrink-0 px-4 py-2 text-slate-400 font-mono">
                        {formatDate(record.recordDate)}
                      </td>
                    )}

                    <td className="w-16 shrink-0 px-3 py-2 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-slate-400 hover:text-white"
                        title="View details"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </td>
                  </tr>
                );
              })
            ) : (
              // Standard rendering (for benchmarking or smaller pages)
              records.map((record) => {
                const isSelected = !!selectedRowIds[record.id];
                return (
                  <tr
                    key={record.id}
                    onClick={() => dispatch(openRecordDetail(record.id))}
                    className={`flex items-center min-w-[960px] transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-blue-900/20 hover:bg-blue-900/30'
                        : 'hover:bg-slate-900/70 even:bg-slate-950 odd:bg-slate-900/30'
                    }`}
                  >
                    <td
                      className="w-10 shrink-0 px-3 py-2.5 text-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        dispatch(toggleRowSelection(record.id));
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        aria-label={`Select record ${record.recordKey}`}
                        className="h-3.5 w-3.5 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>

                    {visibleColumns.recordKey !== false && (
                      <td className="w-32 shrink-0 px-4 py-2.5 font-mono text-blue-400 font-medium truncate">
                        <SearchHighlighter
                          text={record.recordKey}
                          searchQuery={searchQuery}
                          enabled={highlightMatches}
                        />
                      </td>
                    )}

                    {visibleColumns.title !== false && (
                      <td className="w-72 shrink-0 px-4 py-2.5 text-slate-100 font-medium truncate">
                        <SearchHighlighter
                          text={record.title}
                          searchQuery={searchQuery}
                          enabled={highlightMatches}
                        />
                      </td>
                    )}

                    {visibleColumns.category !== false && (
                      <td className="w-36 shrink-0 px-4 py-2.5 text-slate-400 truncate">
                        {record.category}
                      </td>
                    )}

                    {visibleColumns.status !== false && (
                      <td className="w-32 shrink-0 px-4 py-2.5">
                        <Badge variant={getStatusBadgeVariant(record.status)} size="sm">
                          {record.status}
                        </Badge>
                      </td>
                    )}

                    {visibleColumns.numericValue !== false && (
                      <td className="w-40 shrink-0 px-4 py-2.5 text-right font-mono font-medium text-emerald-400">
                        {formatCurrency(record.numericValue)}
                      </td>
                    )}

                    {visibleColumns.country !== false && (
                      <td className="w-36 shrink-0 px-4 py-2.5 text-slate-300 truncate">
                        <SearchHighlighter
                          text={record.country}
                          searchQuery={searchQuery}
                          enabled={highlightMatches}
                        />
                      </td>
                    )}

                    {visibleColumns.region !== false && (
                      <td className="w-32 shrink-0 px-4 py-2.5 text-slate-400 truncate">
                        {record.region}
                      </td>
                    )}

                    {visibleColumns.recordDate !== false && (
                      <td className="w-36 shrink-0 px-4 py-2.5 text-slate-400 font-mono">
                        {formatDate(record.recordDate)}
                      </td>
                    )}

                    <td className="w-16 shrink-0 px-3 py-2.5 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-slate-400 hover:text-white"
                        title="View details"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

