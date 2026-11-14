'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store';
import { setSearch, setDebouncedSearch, setSearchType } from '@/store/slices/searchConfigSlice';
import { useGetSearchHistoryQuery } from '@/store/services/dataScopeApi';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/utils';
import { History, Play, Clock, Search, Database, ArrowRight } from 'lucide-react';

export default function SearchHistoryPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { selectedDatasetId } = useAppSelector((state) => state.dataset);
  const { data: history = [], isLoading } = useGetSearchHistoryQuery(selectedDatasetId);

  const handleRerun = (queryText: string, searchType: string) => {
    dispatch(setSearch(queryText));
    dispatch(setDebouncedSearch(queryText));
    dispatch(setSearchType(searchType as any));
    router.push('/dashboard/explorer');
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <History className="h-5 w-5 text-indigo-400" />
            <span>Search Query History &amp; Audit</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Audit log of executed queries, search engines utilized, and response latencies.
          </p>
        </div>
      </div>

      {/* History Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-900/80 border-b border-slate-800 text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">Query / Filter Expression</th>
              <th className="px-4 py-3">Engine</th>
              <th className="px-4 py-3 text-right">Matches</th>
              <th className="px-4 py-3 text-right">Execution Latency</th>
              <th className="px-4 py-3 text-right">Rerun</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {history.map((entry) => (
              <tr key={entry.id} className="hover:bg-slate-900/60 transition-colors">
                <td className="px-4 py-3 text-slate-400 font-mono">
                  {formatDateTime(entry.createdAt)}
                </td>
                <td className="px-4 py-3 font-semibold text-slate-100 flex items-center gap-2">
                  <Search className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                  <span>&quot;{entry.queryText}&quot;</span>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="purple" size="sm">
                    {entry.searchType.toUpperCase()}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right font-mono font-medium text-blue-400">
                  {entry.resultCount.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right font-mono font-semibold text-emerald-400">
                  {entry.executionTimeMs} ms
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => handleRerun(entry.queryText, entry.searchType)}
                    className="text-[11px] gap-1"
                  >
                    <span>Rerun</span>
                    <Play className="h-3 w-3 fill-current" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

