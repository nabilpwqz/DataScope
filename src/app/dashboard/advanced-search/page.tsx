'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  setFilters,
  setFilterLogicalOperator,
  setSearch,
  setDebouncedSearch,
  setSearchType,
  setPage,
  setPageSize,
} from '@/store/slices/searchConfigSlice';
import { setSelectedDatasetId } from '@/store/slices/datasetSlice';
import { setSaveModalOpen } from '@/store/slices/savedViewsSlice';
import {
  useSearchRecordsQuery,
  useGetDatasetsQuery,
} from '@/store/services/dataScopeApi';
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
  Download,
  Copy,
  Check,
  Bookmark,
  Layers,
  Zap,
  Filter,
  Search,
  FileCode,
  CheckCircle2,
} from 'lucide-react';

interface FieldOption {
  field: string;
  label: string;
  type: 'string' | 'number' | 'select' | 'date';
  options?: string[];
}

const availableFields: FieldOption[] = [
  {
    field: 'status',
    label: 'Status',
    type: 'select',
    options: ['Active', 'Pending', 'Archived', 'Suspended', 'Completed', 'Flagged'],
  },
  {
    field: 'country',
    label: 'Country',
    type: 'select',
    options: [
      'Germany',
      'United States',
      'United Kingdom',
      'France',
      'Japan',
      'Canada',
      'Australia',
      'Switzerland',
      'Singapore',
    ],
  },
  { field: 'numericValue', label: 'Revenue ($)', type: 'number' },
  {
    field: 'category',
    label: 'Market Segment',
    type: 'select',
    options: [
      'Enterprise',
      'Mid-Market',
      'Tier 1 Partner',
      'SMB',
      'Strategic Wholesale',
      'Public Sector',
    ],
  },
  {
    field: 'region',
    label: 'Region',
    type: 'select',
    options: ['DACH', 'Americas', 'EMEA', 'APAC', 'Nordics'],
  },
  { field: 'title', label: 'Company / Title', type: 'string' },
  { field: 'recordKey', label: 'Account Key', type: 'string' },
  { field: 'recordDate', label: 'Contract Date', type: 'date' },
];

const presetTemplates = [
  {
    name: 'High-Value Enterprise',
    description: 'Active accounts with revenue > $50,000 in Enterprise category',
    conditions: [
      { id: 'p1', field: 'status', operator: 'equals' as FilterOperator, value: 'Active' },
      { id: 'p2', field: 'numericValue', operator: 'greater_than' as FilterOperator, value: 50000 },
      { id: 'p3', field: 'category', operator: 'equals' as FilterOperator, value: 'Enterprise' },
    ],
    logicalOp: 'AND' as const,
    strategy: 'hybrid' as const,
  },
  {
    name: 'European DACH Leaders',
    description: 'Active accounts registered in Germany across the DACH economic region',
    conditions: [
      { id: 'p1', field: 'region', operator: 'equals' as FilterOperator, value: 'DACH' },
      { id: 'p2', field: 'country', operator: 'equals' as FilterOperator, value: 'Germany' },
      { id: 'p3', field: 'status', operator: 'equals' as FilterOperator, value: 'Active' },
    ],
    logicalOp: 'AND' as const,
    strategy: 'trgm' as const,
  },
  {
    name: 'At-Risk & Flagged',
    description: 'Accounts requiring audit intervention (Suspended or Flagged status)',
    conditions: [
      { id: 'p1', field: 'status', operator: 'equals' as FilterOperator, value: 'Flagged' },
      { id: 'p2', field: 'status', operator: 'equals' as FilterOperator, value: 'Suspended' },
    ],
    logicalOp: 'OR' as const,
    strategy: 'exact' as const,
  },
  {
    name: 'Mid-Market Growth',
    description: 'Mid-Market accounts with revenue between $10,000 and $75,000',
    conditions: [
      { id: 'p1', field: 'category', operator: 'equals' as FilterOperator, value: 'Mid-Market' },
      { id: 'p2', field: 'numericValue', operator: 'between' as FilterOperator, value: 10000, valueTo: 75000 },
      { id: 'p3', field: 'status', operator: 'equals' as FilterOperator, value: 'Active' },
    ],
    logicalOp: 'AND' as const,
    strategy: 'hybrid' as const,
  },
];

export default function AdvancedSearchPage() {
  const dispatch = useAppDispatch();
  const { selectedDatasetId } = useAppSelector((state) => state.dataset);
  const { page, pageSize } = useAppSelector((state) => state.searchConfig);

  // Available datasets
  const { data: datasets = [], isLoading: isDatasetsLoading } = useGetDatasetsQuery();
  const activeDataset = datasets.find((d) => d.id === selectedDatasetId) || datasets[0];

  // Local builder states
  const [conditions, setConditions] = useState<FilterCondition[]>([
    { id: 'c1', field: 'status', operator: 'equals', value: 'Active' },
    { id: 'c2', field: 'country', operator: 'equals', value: 'Germany' },
    { id: 'c3', field: 'numericValue', operator: 'greater_than', value: 10000 },
  ]);
  const [logicalOp, setLogicalOp] = useState<'AND' | 'OR'>('AND');
  const [keywordSearch, setKeywordSearch] = useState('');
  const [selectedStrategy, setSelectedStrategy] = useState<'hybrid' | 'fts' | 'trgm' | 'exact'>('hybrid');
  const [activeSqlTab, setActiveSqlTab] = useState<'sql' | 'explain'>('sql');
  const [copiedSql, setCopiedSql] = useState(false);

  // Query search records
  const effectiveDatasetId = selectedDatasetId || (datasets.length > 0 ? datasets[0].id : 'ds-sales-01');
  const { data: searchResponse, isLoading, isFetching } = useSearchRecordsQuery({
    datasetId: effectiveDatasetId,
    search: keywordSearch,
    searchType: selectedStrategy,
    filters: conditions,
    filterLogicalOperator: logicalOp,
    page,
    pageSize,
  });

  const handleDatasetChange = (newDatasetId: string) => {
    dispatch(setSelectedDatasetId(newDatasetId));
    dispatch(setPage(1));
  };

  const handleAddCondition = () => {
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

  const handleUpdateCondition = (id: string, updates: Partial<FilterCondition>) => {
    setConditions(conditions.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const handleRemoveCondition = (id: string) => {
    setConditions(conditions.filter((c) => c.id !== id));
  };

  const handleClearAll = () => {
    setConditions([]);
    setKeywordSearch('');
  };

  const handleApplyPreset = (preset: typeof presetTemplates[0]) => {
    setConditions(preset.conditions);
    setLogicalOp(preset.logicalOp);
    setSelectedStrategy(preset.strategy);
    dispatch(setPage(1));
  };

  const handleSyncToExplorer = () => {
    dispatch(setFilters(conditions));
    dispatch(setFilterLogicalOperator(logicalOp));
    dispatch(setSearch(keywordSearch));
    dispatch(setDebouncedSearch(keywordSearch));
    dispatch(setSearchType(selectedStrategy));
  };

  const handleOpenSaveViewModal = () => {
    handleSyncToExplorer();
    dispatch(setSaveModalOpen(true));
  };

  // Client-side CSV export of currently retrieved records
  const handleExportCsv = () => {
    if (!searchResponse?.records || searchResponse.records.length === 0) return;
    const headers = [
      'Record Key',
      'Title',
      'Status',
      'Market Segment',
      'Country',
      'Region',
      'Revenue ($)',
      'Contract Date',
    ];
    const rows = searchResponse.records.map((r) => [
      `"${r.recordKey}"`,
      `"${(r.title || '').replace(/"/g, '""')}"`,
      `"${r.status}"`,
      `"${r.category}"`,
      `"${r.country}"`,
      `"${r.region}"`,
      r.numericValue,
      `"${r.recordDate}"`,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `datascope_query_${effectiveDatasetId}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Generate realistic Pushdown SQL preview
  const generatedSql = useMemo(() => {
    const whereClauses = [`dataset_id = '${effectiveDatasetId}'`];
    if (keywordSearch) {
      if (selectedStrategy === 'fts') {
        whereClauses.push(
          `to_tsvector('english', title || ' ' || category || ' ' || country) @@ plainto_tsquery('english', '${keywordSearch}')`
        );
      } else if (selectedStrategy === 'trgm') {
        whereClauses.push(`(title % '${keywordSearch}' OR category % '${keywordSearch}')`);
      } else if (selectedStrategy === 'exact') {
        whereClauses.push(`title = '${keywordSearch}'`);
      } else {
        whereClauses.push(
          `(to_tsvector('english', title) @@ plainto_tsquery('${keywordSearch}') OR title ILIKE '%${keywordSearch}%')`
        );
      }
    }

    const filterClauses = conditions.map((c) => {
      const col = c.field === 'numericValue' ? 'numeric_value' : c.field === 'recordDate' ? 'record_date' : c.field === 'recordKey' ? 'record_key' : c.field;
      if (c.operator === 'equals') return `${col} = '${c.value}'`;
      if (c.operator === 'greater_than') return `${col} > ${c.value}`;
      if (c.operator === 'less_than') return `${col} < ${c.value}`;
      if (c.operator === 'between') return `${col} BETWEEN ${c.value} AND ${c.valueTo || c.value}`;
      if (c.operator === 'contains') return `${col} ILIKE '%${c.value}%'`;
      if (c.operator === 'starts_with') return `${col} ILIKE '${c.value}%'`;
      if (c.operator === 'is_null') return `${col} IS NULL`;
      if (c.operator === 'is_not_null') return `${col} IS NOT NULL`;
      return `${col} ${c.operator} '${c.value}'`;
    });

    if (filterClauses.length > 0) {
      whereClauses.push(`(\n    ${filterClauses.join(`\n    ${logicalOp} `)}\n  )`);
    }

    return `-- PostgreSQL 15 Pushdown Query Execution Plan
-- Evaluated against partitioned enterprise records
SELECT
  id,
  record_key,
  title,
  status,
  category,
  country,
  region,
  numeric_value,
  record_date,
  data
FROM dataset_records
WHERE ${whereClauses.join('\n  AND ')}
ORDER BY record_date DESC
LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize};`;
  }, [effectiveDatasetId, keywordSearch, selectedStrategy, conditions, logicalOp, page, pageSize]);

  const simulatedExplain = useMemo(() => {
    const execTime = searchResponse?.executionTimeMs || 3.42;
    const rowCount = searchResponse?.totalRecords || 0;
    return `Bitmap Heap Scan on dataset_records  (cost=4.82..142.18 rows=${rowCount} width=340) (actual time=0.812..${execTime.toFixed(2)} rows=${Math.min(pageSize, rowCount)} loops=1)
  Recheck Cond: (dataset_id = '${effectiveDatasetId}'::text)
  Filter: (${conditions.map((c) => `${c.field} ${c.operator} ${c.value}`).join(` ${logicalOp} `) || 'true'})
  Rows Scanned in Index: ${rowCount}
  Buffers: shared hit=48 (L1 in-memory LRU cache)
  ->  Bitmap Index Scan on idx_records_composite  (cost=0.00..4.81 rows=${rowCount} width=0) (actual time=0.184..0.184 loops=1)
        Index Cond: (dataset_id = '${effectiveDatasetId}'::text)
Planning Time: 0.162 ms
Execution Time: ${execTime.toFixed(3)} ms
Index Technique: Composite B-tree + GIN Trigram similarity (sub-second scan)`;
  }, [searchResponse, effectiveDatasetId, conditions, logicalOp, pageSize]);

  const handleCopySql = () => {
    const textToCopy = activeSqlTab === 'sql' ? generatedSql : simulatedExplain;
    navigator.clipboard.writeText(textToCopy);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 max-w-7xl mx-auto w-full text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Link href="/dashboard" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              Workspace
            </Link>
            <span>/</span>
            <span className="text-slate-900 dark:text-slate-200 font-medium">Advanced Search</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <SlidersHorizontal className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            <span>Advanced Search &amp; Visual Query Builder</span>
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-2xl">
            Construct complex boolean filter trees with PostgreSQL pushdown execution, full-text trigram indexing, and live EXPLAIN ANALYZE inspection.
          </p>
        </div>

        {/* Global Header Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenSaveViewModal}
            className="text-xs gap-1.5 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Bookmark className="h-3.5 w-3.5 text-amber-500" />
            <span>Save as View</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={!searchResponse?.records || searchResponse.records.length === 0}
            className="text-xs gap-1.5 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Download className="h-3.5 w-3.5 text-blue-500" />
            <span>Export CSV</span>
          </Button>

          <Link href="/dashboard/explorer">
            <Button
              variant="primary"
              size="sm"
              onClick={handleSyncToExplorer}
              className="text-xs gap-1.5 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            >
              <span>Flagship Explorer</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Target Dataset Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm text-xs">
        <div className="flex flex-wrap items-center gap-2.5 min-w-0">
          <Database className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <label htmlFor="dataset-select" className="font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
            Target Dataset:
          </label>
          <select
            id="dataset-select"
            value={effectiveDatasetId}
            onChange={(e) => handleDatasetChange(e.target.value)}
            className="h-7 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-2.5 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            {datasets.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.category})
              </option>
            ))}
          </select>
          <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">|</span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline truncate max-w-xs">
            {activeDataset?.description || 'Partitioned business records'}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="outline" size="sm" className="whitespace-nowrap text-[11px]">
            <span className="font-mono font-semibold">{activeDataset?.totalRecords?.toLocaleString() || '110,000'}</span> records
          </Badge>
          <Badge variant="info" size="sm" className="whitespace-nowrap">
            {activeDataset?.category || 'Enterprise'}
          </Badge>
        </div>
      </div>

      {/* Preset Query Templates Strip */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>Enterprise Query Presets</span>
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Click any template to populate multi-condition rules
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {presetTemplates.map((preset) => (
            <button
              key={preset.name}
              onClick={() => handleApplyPreset(preset)}
              className="text-left p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/10 transition-colors duration-150 group shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {preset.name}
                </span>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                  {preset.strategy}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                {preset.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Main Visual Query Builder Box */}
      <div className="p-5 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-6">
        {/* Top: Keyword search & Search Strategy */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Text Search (Full-Text or Trigram)</span>
              <span className="text-[11px] font-normal text-slate-500">Optional text matching filter</span>
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={keywordSearch}
                onChange={(e) => setKeywordSearch(e.target.value)}
                placeholder="e.g. Acrobat Logistics, Siemens, Cloud Migration..."
                className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              PostgreSQL Indexing Strategy
            </label>
            <select
              value={selectedStrategy}
              onChange={(e) => setSelectedStrategy(e.target.value as any)}
              className="w-full h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
            >
              <option value="hybrid">Hybrid (FTS + Trigram Substring)</option>
              <option value="fts">PostgreSQL FTS (to_tsvector)</option>
              <option value="trgm">pg_trgm Fuzzy Similarity</option>
              <option value="exact">Exact Substring (ILIKE)</option>
            </select>
          </div>
        </div>

        {/* Logical Operator & Rule Tree Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Combine Rule Conditions:
            </span>
            <div className="flex items-center rounded-md border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-950 p-0.5">
              <button
                type="button"
                onClick={() => setLogicalOp('AND')}
                className={`px-3 py-1 text-xs rounded font-semibold transition-colors duration-150 ${
                  logicalOp === 'AND'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                AND (Match All)
              </button>
              <button
                type="button"
                onClick={() => setLogicalOp('OR')}
                className={`px-3 py-1 text-xs rounded font-semibold transition-colors duration-150 ${
                  logicalOp === 'OR'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                OR (Match Any)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAll}
              className="text-xs text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 border-slate-300 dark:border-slate-700"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset Conditions
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddCondition}
              className="text-xs text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Condition Rule
            </Button>
          </div>
        </div>

        {/* Dynamic Condition Rows */}
        <div className="space-y-3">
          {conditions.length === 0 ? (
            <div className="p-8 text-center rounded-lg border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 space-y-2">
              <Filter className="h-8 w-8 mx-auto text-slate-400" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                No active filter conditions
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Add condition rules above or choose an enterprise preset to filter records.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddCondition}
                className="mt-2 text-xs text-emerald-600 dark:text-emerald-400"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add First Condition Rule
              </Button>
            </div>
          ) : (
            conditions.map((cond, index) => {
              const fieldConfig = availableFields.find((f) => f.field === cond.field) || availableFields[0];
              const isBetween = cond.operator === 'between';
              const isNullCheck = cond.operator === 'is_null' || cond.operator === 'is_not_null';

              return (
                <div
                  key={cond.id}
                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 transition-colors"
                >
                  <span className="font-mono text-xs text-slate-400 dark:text-slate-500 font-bold w-6 shrink-0 self-center sm:self-auto">
                    #{index + 1}
                  </span>

                  {/* Field Selector */}
                  <select
                    value={cond.field}
                    onChange={(e) => handleUpdateCondition(cond.id, { field: e.target.value })}
                    className="h-8 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full sm:w-44"
                  >
                    {availableFields.map((f) => (
                      <option key={f.field} value={f.field}>
                        {f.label}
                      </option>
                    ))}
                  </select>

                  {/* Operator Selector */}
                  <select
                    value={cond.operator}
                    onChange={(e) => handleUpdateCondition(cond.id, { operator: e.target.value as FilterOperator })}
                    className="h-8 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full sm:w-36 font-mono"
                  >
                    <option value="equals">equals (=)</option>
                    <option value="contains">contains (ILIKE)</option>
                    <option value="starts_with">starts with</option>
                    <option value="greater_than">greater than (&gt;)</option>
                    <option value="less_than">less than (&lt;)</option>
                    <option value="between">between range</option>
                    <option value="is_null">is null</option>
                    <option value="is_not_null">is not null</option>
                  </select>

                  {/* Value Inputs */}
                  {isNullCheck ? (
                    <div className="flex-1 px-3 py-1.5 rounded bg-slate-200/50 dark:bg-slate-800/50 text-[11px] text-slate-500 dark:text-slate-400 italic">
                      [No Value Required]
                    </div>
                  ) : isBetween ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type={fieldConfig.type === 'number' ? 'number' : 'text'}
                        placeholder="From"
                        value={cond.value !== undefined ? cond.value : ''}
                        onChange={(e) =>
                          handleUpdateCondition(cond.id, {
                            value: fieldConfig.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value,
                          })
                        }
                        className="h-8 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-1/2 font-mono"
                      />
                      <span className="text-xs text-slate-400">to</span>
                      <input
                        type={fieldConfig.type === 'number' ? 'number' : 'text'}
                        placeholder="To"
                        value={cond.valueTo !== undefined ? cond.valueTo : ''}
                        onChange={(e) =>
                          handleUpdateCondition(cond.id, {
                            valueTo: fieldConfig.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value,
                          })
                        }
                        className="h-8 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-1/2 font-mono"
                      />
                    </div>
                  ) : fieldConfig.type === 'select' && fieldConfig.options ? (
                    <select
                      value={String(cond.value)}
                      onChange={(e) => handleUpdateCondition(cond.id, { value: e.target.value })}
                      className="h-8 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 flex-1 w-full sm:w-auto"
                    >
                      {fieldConfig.options.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={fieldConfig.type === 'number' ? 'number' : fieldConfig.type === 'date' ? 'date' : 'text'}
                      value={cond.value !== undefined ? cond.value : ''}
                      onChange={(e) =>
                        handleUpdateCondition(cond.id, {
                          value: fieldConfig.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value,
                        })
                      }
                      placeholder={fieldConfig.type === 'number' ? 'Enter numerical threshold' : 'Enter match string'}
                      className="h-8 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 flex-1 w-full sm:w-auto font-mono"
                    />
                  )}

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveCondition(cond.id)}
                    aria-label={`Remove condition rule ${index + 1}`}
                    className="h-8 w-8 flex items-center justify-center rounded-md border border-slate-300 dark:border-slate-700 text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* SQL Translation & EXPLAIN ANALYZE Inspector */}
      <div className="p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-md border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 p-0.5">
              <button
                type="button"
                onClick={() => setActiveSqlTab('sql')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded font-semibold transition-colors ${
                  activeSqlTab === 'sql'
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Code2 className="h-3.5 w-3.5" />
                <span>Generated Pushdown SQL</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSqlTab('explain')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded font-semibold transition-colors ${
                  activeSqlTab === 'explain'
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <FileCode className="h-3.5 w-3.5" />
                <span>EXPLAIN Execution Plan</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              Engine: PostgreSQL 15 (B-tree + GIN)
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopySql}
              className="text-xs gap-1 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {copiedSql ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-slate-500" />
                  <span>Copy Snippet</span>
                </>
              )}
            </Button>
          </div>
        </div>

        <pre className="p-3.5 rounded-lg bg-slate-900 text-slate-200 text-[11px] font-mono overflow-x-auto border border-slate-800 leading-relaxed">
          {activeSqlTab === 'sql' ? generatedSql : simulatedExplain}
        </pre>
      </div>

      {/* Query Execution Telemetry Strip & Result Table */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>Query Execution Results</span>
            </h2>
            <Badge variant="info" size="sm" className="font-mono">
              {searchResponse?.totalRecords.toLocaleString() || 0} Matched
            </Badge>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
              <Clock className="h-3.5 w-3.5" />
              <span>Latency: <span className="font-mono">{searchResponse?.executionTimeMs || 0}</span> ms</span>
            </span>

            <span className="text-slate-300 dark:text-slate-700">|</span>

            <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
              <span>Cache:</span>
              <span
                className={`font-mono px-1.5 py-0.5 rounded font-bold text-[10px] ${
                  searchResponse?.cacheHit
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400'
                    : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {searchResponse?.cacheHit ? 'HIT (L1)' : 'MISS (DB)'}
              </span>
            </span>
          </div>
        </div>

        {/* Data Table Container */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-sm flex flex-col">
          <div className="h-[440px] flex flex-col">
            <VirtualizedDataTable
              records={searchResponse?.records || []}
              isLoading={isLoading || isFetching}
              searchQuery={keywordSearch}
            />
          </div>

          {/* Table Pagination */}
          <DataTablePagination
            totalRecords={searchResponse?.totalRecords || 0}
            currentPage={page}
            pageSize={pageSize}
            totalPages={searchResponse?.totalPages || 1}
            hasNextPage={searchResponse?.hasNextPage || false}
            hasPrevPage={searchResponse?.hasPrevPage || false}
            executionTimeMs={searchResponse?.executionTimeMs}
            cacheHit={searchResponse?.cacheHit}
          />
        </div>
      </div>
    </div>
  );
}
