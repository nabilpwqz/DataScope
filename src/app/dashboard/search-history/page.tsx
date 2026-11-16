'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store';
import { setSearch, setDebouncedSearch, setSearchType } from '@/store/slices/searchConfigSlice';
import { useGetSearchHistoryQuery, useClearSearchHistoryMutation } from '@/store/services/dataScopeApi';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/utils';
import { History, Play, Search, Trash2 } from 'lucide-react';

export default function SearchHistoryPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { selectedDatasetId } = useAppSelector((state) => state.dataset);
  const { data: history = [] } = useGetSearchHistoryQuery(selectedDatasetId);
  const [clearHistory, { isLoading: isClearing }] = useClearSearchHistoryMutation();

  const handleClearHistory = async () => {
    if (confirm('Are you sure you want to clear your search history?')) {
      await clearHistory().unwrap();
    }
  };

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
            <History className="h-5 w-5 text-emerald-400" />
            <span>Search Query History &amp; Audit</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Audit log of executed queries, search engines utilized, and response latencies.
          </p>
        </div>

        {history.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearHistory}
            isLoading={isClearing}
            className="text-xs text-rose-400 border-rose-900/50 hover:bg-rose-950/40 hover:text-rose-300 gap-1.5"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear History</span>
          </Button>
        )}
      </div>

      {/* History Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-950 border-b border-slate-800 text-xs font-semibold text-slate-300">
            <tr>
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">Query / filter expression</th>
              <th className="px-4 py-3">Engine</th>
              <th className="px-4 py-3 text-right">Matches</th>
              <th className="px-4 py-3 text-right">Execution latency</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {history.map((entry) => (
              <tr key={entry.id} className="hover:bg-slate-800/50 transition-colors">
                <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">
                  {formatDateTime(entry.createdAt)}
                </td>
                <td className="px-4 py-3 font-semibold text-slate-100 flex items-center gap-2">
                  <Search className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>&quot;{entry.queryText}&quot;</span>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="emerald" size="sm">
                    {entry.searchType}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right font-mono font-medium text-slate-200">
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
                    className="text-xs gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
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
