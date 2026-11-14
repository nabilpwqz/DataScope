'use client';

import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  setFilters,
  setFilterLogicalOperator,
  setSearch,
  setDebouncedSearch,
  setSearchType,
} from '@/store/slices/searchConfigSlice';
import { useSearchRecordsQuery } from '@/store/services/dataScopeApi';
import { VirtualizedDataTable } from '@/components/table/virtualized-data-table';
import { DataTablePagination } from '@/components/table/data-table-pagination';
import { FilterCondition, FilterOperator } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  SlidersHorizontal,
  Plus,
  Trash2,
  Play,
  Sparkles,
  Code2,
  Clock,
  Database,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import Link from 'next/link';

const availableFields = [
  { field: 'status', label: 'Status', type: 'select', options: ['Active', 'Pending', 'Archived', 'Suspended', 'Completed', 'Flagged'] },
  { field: 'country', label: 'Country', type: 'select', options: ['Germany', 'United States', 'United Kingdom', 'France', 'Japan', 'Canada', 'Australia', 'Switzerland', 'Singapore'] },
  { field: 'numericValue', label: 'Revenue ($)', type: 'number' },
  { field: 'category', label: 'Market Segment', type: 'select', options: ['Enterprise', 'Mid-Market', 'Tier 1 Partner', 'SMB', 'Strategic Wholesale', 'Public Sector'] },
  { field: 'region', label: 'Region', type: 'select', options: ['DACH', 'Americas', 'EMEA', 'APAC', 'Nordics'] },
  { field: 'title', label: 'Company / Title', type: 'string' },
  { field: 'recordKey', label: 'Account Key', type: 'string' },
  { field: 'recordDate', label: 'Contract Date', type: 'date' },
];

export default function AdvancedSearchPage() {
  const dispatch = useAppDispatch();
  const { selectedDatasetId } = useAppSelector((state) => state.dataset);
  const { searchType, page, pageSize } = useAppSelector((state) => state.searchConfig);

  const [conditions, setConditions] = useState<FilterCondition[]>([
    { id: 'c1', field: 'status', operator: 'equals', value: 'Active' },
    { id: 'c2', field: 'country', operator: 'equals', value: 'Germany' },
    { id: 'c3', field: 'numericValue', operator: 'greater_than', value: 10000 },
  ]);
  const [logicalOp, setLogicalOp] = useState<'AND' | 'OR'>('AND');
  const [keywordSearch, setKeywordSearch] = useState('');
  const [selectedStrategy, setSelectedStrategy] = useState<'hybrid' | 'fts' | 'trgm' | 'exact'>('hybrid');

  // Trigger query with state
  const { data: searchResponse, isLoading, isFetching } = useSearchRecordsQuery({
    datasetId: selectedDatasetId,
    search: keywordSearch,
    searchType: selectedStrategy,
    filters: conditions,
    filterLogicalOperator: logicalOp,
    page: 1,
    pageSize: 25,
  });

  const handleAdd = () => {
    setConditions([
      ...conditions,
      {
        id: `c-${Date.now()}`,
        field: 'category',
        operator: 'equals',
        value: 'Enterprise',
      },
    ]);
  };

  const handleUpdate = (id: string, updates: Partial<FilterCondition>) => {
    setConditions(conditions.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const handleRemove = (id: string) => {
    setConditions(conditions.filter((c) => c.id !== id));
  };

  const handleSyncToExplorer = () => {
    dispatch(setFilters(conditions));
    dispatch(setFilterLogicalOperator(logicalOp));
    dispatch(setSearch(keywordSearch));
    dispatch(setDebouncedSearch(keywordSearch));
    dispatch(setSearchType(selectedStrategy));
  };

  // Generate simulated SQL preview for transparency
  const generateSqlPreview = () => {
    const whereClauses = [`dataset_id = '${selectedDatasetId}'`];
    if (keywordSearch) {
      if (selectedStrategy === 'fts') {
        whereClauses.push(`to_tsvector('english', title) @@ plainto_tsquery('${keywordSearch}')`);
      } else if (selectedStrategy === 'trgm') {
        whereClauses.push(`title % '${keywordSearch}'`);
      } else {
        whereClauses.push(`title ILIKE '%${keywordSearch}%'`);
      }
    }
    const filterClauses = conditions.map((c) => {
      if (c.operator === 'equals') return `${c.field} = '${c.value}'`;
      if (c.operator === 'greater_than') return `${c.field} > ${c.value}`;
      if (c.operator === 'less_than') return `${c.field} < ${c.value}`;
      if (c.operator === 'contains') return `${c.field} ILIKE '%${c.value}%'`;
      return `${c.field} ${c.operator} ${c.value}`;
    });

    if (filterClauses.length > 0) {
      whereClauses.push(`(${filterClauses.join(` ${logicalOp} `)})`);
    }

    return `SELECT * FROM dataset_records\nWHERE ${whereClauses.join('\n  AND ')}\nORDER BY numeric_value DESC\nLIMIT 25 OFFSET 0;`;
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-indigo-400" />
            <span>Advanced Search &amp; Visual Query Builder</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Build multi-condition search queries with real-time pushdown execution and SQL inspection.
          </p>
        </div>

        <Link href="/dashboard/explorer">
          <Button
            variant="primary"
            size="sm"
            onClick={handleSyncToExplorer}
            className="text-xs gap-1.5 font-semibold"
          >
            <span>Open in Flagship Explorer</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Query Builder Configuration Box */}
      <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/60 space-y-5">
        {/* Top: Keyword search & Engine selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Keyword Search (Optional)
            </label>
            <input
              type="text"
              value={keywordSearch}
              onChange={(e) => setKeywordSearch(e.target.value)}
              placeholder="e.g. Acrobat Logistics, Siemens, Cloud..."
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 font-sans"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              PostgreSQL Search Strategy
            </label>
            <select
              value={selectedStrategy}
              onChange={(e) => setSelectedStrategy(e.target.value as any)}
              className="w-full h-9 rounded-md border border-slate-700 bg-slate-950 px-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
            >
              <option value="hybrid">Hybrid (FTS + Substring)</option>
              <option value="fts">PostgreSQL Full-Text Search (tsvector)</option>
              <option value="trgm">PostgreSQL Trigram (pg_trgm Fuzzy)</option>
              <option value="exact">Exact Match (ILIKE)</option>
            </select>
          </div>
        </div>

        {/* Logical Operator */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <span className="text-xs font-medium text-slate-300">
            Combine Filter Conditions via:
          </span>
          <div className="flex items-center rounded border border-slate-700 bg-slate-950 p-0.5">
            <button
              onClick={() => setLogicalOp('AND')}
              className={`px-3 py-1 text-xs rounded font-bold transition-colors ${
                logicalOp === 'AND' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              AND (All Conditions)
            </button>
            <button
              onClick={() => setLogicalOp('OR')}
              className={`px-3 py-1 text-xs rounded font-bold transition-colors ${
                logicalOp === 'OR' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              OR (Any Condition)
            </button>
          </div>
        </div>

        {/* Condition Rows */}
        <div className="space-y-2.5">
          {conditions.map((cond, index) => {
            const fieldConfig = availableFields.find((f) => f.field === cond.field) || availableFields[0];
            return (
              <div
                key={cond.id}
                className="flex flex-col sm:flex-row items-center gap-2 p-3 rounded-lg border border-slate-800 bg-slate-950/70"
              >
                <span className="font-mono text-xs text-slate-500 font-bold w-6">#{index + 1}</span>

                <select
                  value={cond.field}
                  onChange={(e) => handleUpdate(cond.id, { field: e.target.value })}
                  className="h-8 rounded border border-slate-700 bg-slate-900 px-2 text-xs text-slate-200 focus:outline-none w-full sm:w-44"
                >
                  {availableFields.map((f) => (
                    <option key={f.field} value={f.field}>
                      {f.label}
                    </option>
                  ))}
                </select>

                <select
                  value={cond.operator}
                  onChange={(e) => handleUpdate(cond.id, { operator: e.target.value as FilterOperator })}
                  className="h-8 rounded border border-slate-700 bg-slate-900 px-2 text-xs text-slate-200 focus:outline-none w-full sm:w-36 font-mono"
                >
                  <option value="equals">equals (=)</option>
                  <option value="greater_than">greater than (&gt;)</option>
                  <option value="less_than">less than (&lt;)</option>
                  <option value="contains">contains (ILIKE)</option>
                  <option value="starts_with">starts with</option>
                </select>

                {fieldConfig.type === 'select' && fieldConfig.options ? (
                  <select
                    value={String(cond.value)}
                    onChange={(e) => handleUpdate(cond.id, { value: e.target.value })}
                    className="h-8 rounded border border-slate-700 bg-slate-900 px-2 text-xs text-slate-200 focus:outline-none flex-1 w-full sm:w-auto"
                  >
                    {fieldConfig.options.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={fieldConfig.type === 'number' ? 'number' : 'text'}
                    value={cond.value !== undefined ? cond.value : ''}
                    onChange={(e) =>
                      handleUpdate(cond.id, {
                        value: fieldConfig.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value,
                      })
                    }
                    className="h-8 rounded border border-slate-700 bg-slate-900 px-2 text-xs text-slate-200 focus:outline-none flex-1 w-full sm:w-auto font-mono"
                  />
                )}

                <button
                  onClick={() => handleRemove(cond.id)}
                  className="h-8 w-8 flex items-center justify-center rounded border border-slate-800 text-slate-400 hover:text-rose-400 hover:bg-slate-900"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Builder Footer Actions */}
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAdd}
            className="text-xs text-blue-400 border-blue-500/30 hover:bg-blue-500/10"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Rule
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setConditions([
                { id: 'c1', field: 'status', operator: 'equals', value: 'Active' },
                { id: 'c2', field: 'country', operator: 'equals', value: 'Germany' },
                { id: 'c3', field: 'numericValue', operator: 'greater_than', value: 10000 },
              ]);
              setLogicalOp('AND');
            }}
            className="text-xs text-amber-400"
          >
            <Sparkles className="h-3.5 w-3.5 mr-1" />
            Load Problem Statement Example
          </Button>
        </div>
      </div>

      {/* SQL Translation Preview */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 font-mono text-xs space-y-2">
        <div className="flex items-center justify-between text-slate-400">
          <span className="flex items-center gap-1.5 text-indigo-400 font-semibold">
            <Code2 className="h-4 w-4" />
            Generated Pushdown SQL Query
          </span>
          <span className="text-[11px] text-slate-500">Parameterized execution</span>
        </div>
        <pre className="p-3 rounded-lg bg-slate-900/90 text-slate-300 text-[11px] overflow-x-auto border border-slate-800/80">
          {generateSqlPreview()}
        </pre>
      </div>

      {/* Search Result Overview */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <span>Query Execution Results</span>
            <Badge variant="info" size="sm">
              {searchResponse?.totalRecords.toLocaleString() || 0} Matched
            </Badge>
          </h2>

          <span className="font-mono text-xs text-emerald-400">
            Latency: {searchResponse?.executionTimeMs || 0}ms &bull; Cache: {searchResponse?.cacheHit ? 'HIT' : 'MISS'}
          </span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden h-[450px] flex flex-col">
          <VirtualizedDataTable
            records={searchResponse?.records || []}
            isLoading={isLoading || isFetching}
            searchQuery={keywordSearch}
          />
        </div>
      </div>
    </div>
  );
}
