'use client';

import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { setPage, setPageSize, setPaginationType } from '@/store/slices/searchConfigSlice';
import { Button } from '../ui/button';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Database,
  ArrowRight,
} from 'lucide-react';

interface DataTablePaginationProps {
  totalRecords: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  executionTimeMs?: number;
  cacheHit?: boolean;
}

export const DataTablePagination: React.FC<DataTablePaginationProps> = ({
  totalRecords,
  currentPage,
  pageSize,
  totalPages,
  hasNextPage,
  hasPrevPage,
  executionTimeMs = 0,
  cacheHit = false,
}) => {
  const dispatch = useAppDispatch();
  const { paginationType } = useAppSelector((state) => state.searchConfig);
  const [jumpInput, setJumpInput] = useState('');

  const startIdx = totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIdx = Math.min(totalRecords, currentPage * pageSize);

  const handleJump = (e: React.FormEvent) => {
    e.preventDefault();
    const targetPage = parseInt(jumpInput, 10);
    if (!isNaN(targetPage) && targetPage >= 1 && targetPage <= totalPages) {
      dispatch(setPage(targetPage));
      setJumpInput('');
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-slate-800 bg-slate-950/90 text-xs text-slate-400">
      {/* Left: Summary and latency stats */}
      <div className="flex items-center gap-3">
        <span>
          Showing <strong className="text-slate-100 font-mono">{startIdx.toLocaleString()}</strong> to{' '}
          <strong className="text-slate-100 font-mono">{endIdx.toLocaleString()}</strong> of{' '}
          <strong className="text-blue-400 font-mono">{totalRecords.toLocaleString()}</strong> records
        </span>

        {executionTimeMs !== undefined && (
          <span className="hidden md:inline-flex items-center gap-1 font-mono text-[11px] text-slate-500 border-l border-slate-800 pl-3">
            <span
              className={`h-1.5 w-1.5 rounded-full ${cacheHit ? 'bg-amber-400' : 'bg-emerald-400'}`}
            />
            {cacheHit ? 'Cache Hit' : 'Query Time'}: {executionTimeMs}ms
          </span>
        )}
      </div>

      {/* Right: Controls & Page Jump */}
      <div className="flex items-center gap-4">
        {/* Page Size Selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-500">Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => dispatch(setPageSize(Number(e.target.value)))}
            aria-label="Records per page"
            className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            {[10, 25, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        {/* Direct Page Jump Form */}
        <form onSubmit={handleJump} className="hidden sm:flex items-center gap-1">
          <span className="text-[11px] text-slate-500">Jump to:</span>
          <input
            type="number"
            min={1}
            max={totalPages || 1}
            value={jumpInput}
            onChange={(e) => setJumpInput(e.target.value)}
            placeholder={String(currentPage)}
            className="w-12 rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 text-center text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 font-mono"
          />
          <span className="text-slate-500">/ {totalPages.toLocaleString()}</span>
        </form>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => dispatch(setPage(1))}
            disabled={!hasPrevPage}
            className="h-8 w-8 text-slate-400 hover:text-white"
            title="First Page"
          >
            <ChevronsLeft className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => dispatch(setPage(currentPage - 1))}
            disabled={!hasPrevPage}
            className="h-8 w-8 text-slate-400 hover:text-white"
            title="Previous Page"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>

          <span className="px-2 text-xs font-mono font-medium text-slate-200">
            {currentPage} of {totalPages || 1}
          </span>

          <Button
            variant="outline"
            size="icon"
            onClick={() => dispatch(setPage(currentPage + 1))}
            disabled={!hasNextPage}
            className="h-8 w-8 text-slate-400 hover:text-white"
            title="Next Page"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => dispatch(setPage(totalPages))}
            disabled={!hasNextPage}
            className="h-8 w-8 text-slate-400 hover:text-white"
            title="Last Page"
          >
            <ChevronsRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

