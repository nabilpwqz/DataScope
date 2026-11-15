'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store';
import { setSelectedDatasetId } from '@/store/slices/datasetSlice';
import {
  useGetDatasetsQuery,
  useCreateDatasetMutation,
  useUpdateDatasetMutation,
  useDeleteDatasetMutation,
} from '@/store/services/dataScopeApi';
import { Dataset } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  IconDatabase,
  IconTable,
  IconSearch,
  IconGrid,
  IconList,
  IconPlus,
  IconArrowRight,
  IconCheck,
  IconX,
  IconLock,
  IconRefresh,
} from '@/components/ui/icons';

export default function DatasetsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { data: datasets = [], isLoading, isFetching, refetch } = useGetDatasetsQuery();
  const { selectedDatasetId } = useAppSelector((state) => state.dataset);
  const { activeRole, permissions } = useAppSelector((state) => state.auth);

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedAccessLevel, setSelectedAccessLevel] = useState('ALL');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingDataset, setEditingDataset] = useState<Dataset | null>(null);
  const [deletingDataset, setDeletingDataset] = useState<Dataset | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Sales & Operations');
  const [formDescription, setFormDescription] = useState('');
  const [formSource, setFormSource] = useState('PostgreSQL CDC Stream');
  const [formAccessLevel, setFormAccessLevel] = useState<'public' | 'restricted' | 'admin_only'>('public');
  const [formError, setFormError] = useState<string | null>(null);

  const [createDataset, { isLoading: isCreating }] = useCreateDatasetMutation();
  const [updateDataset, { isLoading: isUpdating }] = useUpdateDatasetMutation();
  const [deleteDataset, { isLoading: isDeleting }] = useDeleteDatasetMutation();

  const isAdmin = activeRole === 'admin';

  // Categories list derived from datasets
  const categories = useMemo(() => {
    const set = new Set<string>();
    datasets.forEach((d) => {
      if (d.category) set.add(d.category);
    });
    return Array.from(set);
  }, [datasets]);

  // Total metrics
  const totalRecords = useMemo(
    () => datasets.reduce((acc, d) => acc + (d.totalRecords || 0), 0),
    [datasets]
  );
  const totalFields = useMemo(
    () => datasets.reduce((acc, d) => acc + (d.fields?.length || 0), 0),
    [datasets]
  );

  // Filtered dataset list
  const filteredDatasets = useMemo(() => {
    return datasets.filter((d) => {
      const matchesSearch =
        !searchQuery.trim() ||
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.dataSource.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.slug.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = selectedCategory === 'ALL' || d.category === selectedCategory;
      const matchesAccess = selectedAccessLevel === 'ALL' || d.accessLevel === selectedAccessLevel;

      return matchesSearch && matchesCategory && matchesAccess;
    });
  }, [datasets, searchQuery, selectedCategory, selectedAccessLevel]);

  const handleSelect = (id: string) => {
    dispatch(setSelectedDatasetId(id));
  };

  const handleOpenCreate = () => {
    setFormName('');
    setFormCategory('Enterprise Analytics');
    setFormDescription('');
    setFormSource('PostgreSQL Realtime Ingest');
    setFormAccessLevel('public');
    setFormError(null);
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (d: Dataset) => {
    setEditingDataset(d);
    setFormName(d.name);
    setFormCategory(d.category);
    setFormDescription(d.description);
    setFormSource(d.dataSource);
    setFormAccessLevel(d.accessLevel);
    setFormError(null);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Dataset title is required');
      return;
    }
    try {
      setFormError(null);
      await createDataset({
        name: formName.trim(),
        category: formCategory,
        description: formDescription.trim(),
        dataSource: formSource.trim(),
        accessLevel: formAccessLevel,
      }).unwrap();
      setIsCreateModalOpen(false);
    } catch (err: any) {
      setFormError(err?.data?.error || 'Failed to create dataset');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDataset || !formName.trim()) return;
    try {
      setFormError(null);
      await updateDataset({
        id: editingDataset.id,
        name: formName.trim(),
        category: formCategory,
        description: formDescription.trim(),
        dataSource: formSource.trim(),
        accessLevel: formAccessLevel,
      }).unwrap();
      setEditingDataset(null);
    } catch (err: any) {
      setFormError(err?.data?.error || 'Failed to update dataset');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingDataset) return;
    try {
      await deleteDataset(deletingDataset.id).unwrap();
      if (selectedDatasetId === deletingDataset.id && datasets.length > 1) {
        const remaining = datasets.find((d) => d.id !== deletingDataset.id);
        if (remaining) dispatch(setSelectedDatasetId(remaining.id));
      }
      setDeletingDataset(null);
    } catch (err) {
      console.error('Failed to delete dataset:', err);
    }
  };

  const getAccessBadgeVariant = (lvl: string) => {
    switch (lvl) {
      case 'public':
        return 'success';
      case 'restricted':
        return 'warning';
      case 'admin_only':
      default:
        return 'danger';
    }
  };

  return (
    <div className="flex-1 space-y-6 p-4 sm:p-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <IconDatabase className="h-6 w-6 text-emerald-400" />
              <span>Dataset Library & Schema Registry</span>
            </h1>
            <Badge variant="success" size="sm">
              Live Registry
            </Badge>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Discover, configure, and inspect schemas across relational business data partitions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="items-center gap-1.5 text-xs text-slate-300 focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <IconRefresh className={`h-3.5 w-3.5 ${isFetching ? 'motion-safe:animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>

          {isAdmin && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenCreate}
              className="items-center gap-1.5 text-xs font-semibold focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <IconPlus className="h-3.5 w-3.5" />
              <span>Create Dataset</span>
            </Button>
          )}
        </div>
      </div>

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-lg border border-slate-800 bg-slate-900">
          <span className="text-xs text-slate-400 block">Total Datasets</span>
          <div className="mt-1 text-2xl font-bold text-white">{datasets.length}</div>
          <span className="text-[11px] text-emerald-400 font-medium">Active Collections</span>
        </div>

        <div className="p-4 rounded-lg border border-slate-800 bg-slate-900">
          <span className="text-xs text-slate-400 block">Indexed Row Volume</span>
          <div className="mt-1 text-2xl font-bold font-mono text-white">
            {totalRecords.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500">PostgreSQL Partitions</span>
        </div>

        <div className="p-4 rounded-lg border border-slate-800 bg-slate-900">
          <span className="text-xs text-slate-400 block">Schema Attributes</span>
          <div className="mt-1 text-2xl font-bold font-mono text-emerald-400">{totalFields}</div>
          <span className="text-[11px] text-slate-500">Strongly Typed Fields</span>
        </div>

        <div className="p-4 rounded-lg border border-slate-800 bg-slate-900">
          <span className="text-xs text-slate-400 block">Active Storage Engine</span>
          <div className="mt-1 text-base font-bold text-white truncate">Neon Serverless</div>
          <span className="text-[11px] text-emerald-400 font-medium">Enterprise Partition</span>
        </div>
      </div>

      {/* Search, Filter & Layout Bar */}
      <div className="p-3 rounded-lg border border-slate-800 bg-slate-900 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Free Text Filter */}
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded border border-slate-800 flex-1 max-w-sm">
            <IconSearch className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter datasets by title, schema, or origin..."
              className="bg-transparent text-slate-200 placeholder-slate-400 focus:outline-none text-xs w-full"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-slate-400 hover:text-white"
                aria-label="Clear search"
              >
                <IconX className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 hidden sm:inline">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              aria-label="Filter by category"
              className="rounded border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Access Level Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 hidden sm:inline">Access:</span>
            <select
              value={selectedAccessLevel}
              onChange={(e) => setSelectedAccessLevel(e.target.value)}
              aria-label="Filter by access level"
              className="rounded border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Access Levels</option>
              <option value="public">Public</option>
              <option value="restricted">Restricted</option>
              <option value="admin_only">Admin Only</option>
            </select>
          </div>
        </div>

        {/* View Switcher Controls */}
        <div className="flex items-center gap-1 border border-slate-800 bg-slate-950 p-1 rounded">
          <button
            onClick={() => setViewMode('grid')}
            aria-label="Grid layout view"
            className={`p-1.5 rounded transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 ${
              viewMode === 'grid'
                ? 'bg-slate-800 text-emerald-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <IconGrid className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            aria-label="Table list view"
            className={`p-1.5 rounded transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 ${
              viewMode === 'table'
                ? 'bg-slate-800 text-emerald-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <IconList className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Dataset Content Section */}
      {isLoading ? (
        <div className="py-24 text-center text-xs text-slate-400">
          Loading datasets and schema attributes from persistent storage...
        </div>
      ) : filteredDatasets.length === 0 ? (
        <div className="py-20 text-center space-y-3 rounded-lg border border-slate-800 bg-slate-900/60 p-6">
          <IconDatabase className="h-8 w-8 text-slate-500 mx-auto" />
          <h2 className="text-sm font-semibold text-white">No Matching Datasets Found</h2>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            No dataset collections matched your active filter criteria. Try resetting your search query or category filters.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('ALL');
              setSelectedAccessLevel('ALL');
            }}
            className="text-xs"
          >
            Clear Active Filters
          </Button>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDatasets.map((d) => {
            const isSelected = selectedDatasetId === d.id;
            return (
              <div
                key={d.id}
                className={`rounded-lg border p-5 flex flex-col justify-between transition-colors bg-slate-900/70 ${
                  isSelected
                    ? 'border-emerald-500/80 ring-1 ring-emerald-500/50 shadow-lg'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant={getAccessBadgeVariant(d.accessLevel)} size="sm">
                      {d.accessLevel.toUpperCase()}
                    </Badge>

                    {isSelected && (
                      <span className="flex items-center gap-1 text-xs text-emerald-400 font-semibold">
                        <IconCheck className="h-3.5 w-3.5" /> Active in Explorer
                      </span>
                    )}
                  </div>

                  <div>
                    <h2 className="text-base font-semibold text-white">{d.name}</h2>
                    <span className="text-[11px] font-mono text-slate-400 block mt-0.5">slug: {d.slug}</span>
                    <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                      {d.description}
                    </p>
                  </div>

                  {/* Metadata Summary */}
                  <div className="space-y-1.5 pt-3 border-t border-slate-800 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Total Indexed Rows:</span>
                      <span className="font-mono font-bold text-white">
                        {d.totalRecords.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Category:</span>
                      <span className="text-slate-300">{d.category}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Ingestion Source:</span>
                      <span className="text-emerald-400 font-mono text-[11px] truncate max-w-[160px]">
                        {d.dataSource}
                      </span>
                    </div>
                  </div>

                  {/* Schema Attributes Tags */}
                  <div className="pt-2">
                    <span className="text-xs text-slate-400 font-medium">
                      Schema Attributes ({d.fields?.length || 0}):
                    </span>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {d.fields?.slice(0, 5).map((f) => (
                        <span
                          key={f.id}
                          className="text-[11px] font-mono px-1.5 py-0.5 rounded border border-slate-700 bg-slate-800 text-slate-300"
                        >
                          {f.fieldName}
                        </span>
                      ))}
                      {(d.fields?.length || 0) > 5 && (
                        <span className="text-xs text-slate-500 px-1 py-0.5">
                          +{d.fields.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="pt-4 mt-4 border-t border-slate-800 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Link
                      href={`/dashboard/datasets/${d.id}`}
                      className="focus-visible:ring-2 focus-visible:ring-emerald-500 rounded flex-1"
                    >
                      <Button variant="outline" size="xs" className="text-xs w-full">
                        Schema & Details
                      </Button>
                    </Link>

                    <Button
                      variant={isSelected ? 'secondary' : 'subtle'}
                      size="xs"
                      onClick={() => handleSelect(d.id)}
                      className="text-xs focus-visible:ring-2 focus-visible:ring-emerald-500"
                    >
                      {isSelected ? 'Active' : 'Set Active'}
                    </Button>

                    <Button
                      variant="primary"
                      size="xs"
                      onClick={() => {
                        handleSelect(d.id);
                        router.push('/dashboard/explorer');
                      }}
                      className="text-xs items-center gap-1 focus-visible:ring-2 focus-visible:ring-emerald-500"
                    >
                      <span>Explorer</span>
                      <IconArrowRight className="h-3 w-3" />
                    </Button>
                  </div>

                  {isAdmin && (
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => handleOpenEdit(d)}
                        className="text-[11px] text-slate-400 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 rounded px-1"
                      >
                        Edit Metadata
                      </button>
                      <span className="text-slate-600 text-xs">|</span>
                      <button
                        onClick={() => setDeletingDataset(d)}
                        className="text-[11px] text-rose-400 hover:text-rose-300 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 rounded px-1"
                      >
                        Delete / Archive
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* High-Density Tabular View */
        <div className="rounded-lg border border-slate-800 bg-slate-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-medium">
                <tr>
                  <th className="px-4 py-3">Dataset Collection</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Access Level</th>
                  <th className="px-4 py-3 text-right">Indexed Records</th>
                  <th className="px-4 py-3 text-center">Attributes</th>
                  <th className="px-4 py-3">Ingestion Source</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredDatasets.map((d) => {
                  const isSelected = selectedDatasetId === d.id;
                  return (
                    <tr
                      key={d.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isSelected ? 'bg-emerald-950/20' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div>
                            <Link
                              href={`/dashboard/datasets/${d.id}`}
                              className="font-semibold text-white hover:text-emerald-400 transition-colors"
                            >
                              {d.name}
                            </Link>
                            <span className="text-[11px] font-mono text-slate-400 block">
                              {d.slug}
                            </span>
                          </div>
                          {isSelected && (
                            <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" title="Active" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{d.category}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge variant={getAccessBadgeVariant(d.accessLevel)} size="sm">
                          {d.accessLevel.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-white whitespace-nowrap">
                        {d.totalRecords.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-emerald-400 whitespace-nowrap">
                        {d.fields?.length || 0}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-400 truncate max-w-xs">
                        {d.dataSource}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <Link href={`/dashboard/datasets/${d.id}`}>
                            <Button variant="subtle" size="xs" className="text-xs">
                              Details
                            </Button>
                          </Link>

                          <Button
                            variant={isSelected ? 'secondary' : 'outline'}
                            size="xs"
                            onClick={() => handleSelect(d.id)}
                            className="text-xs"
                          >
                            {isSelected ? 'Active' : 'Select'}
                          </Button>

                          <Button
                            variant="primary"
                            size="xs"
                            onClick={() => {
                              handleSelect(d.id);
                              router.push('/dashboard/explorer');
                            }}
                            className="text-xs"
                          >
                            Explorer
                          </Button>

                          {isAdmin && (
                            <button
                              onClick={() => handleOpenEdit(d)}
                              className="px-2 py-1 rounded text-slate-400 hover:text-white transition-colors"
                              title="Edit Metadata"
                            >
                              Edit
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal 1: Create Dataset Modal */}
      {isCreateModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setIsCreateModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-lg rounded-lg border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <IconDatabase className="h-4 w-4 text-emerald-400" />
                <span>Create New Dataset Partition</span>
              </h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white"
                aria-label="Close modal"
              >
                <IconX className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4 text-xs">
              {formError && (
                <div className="p-3 rounded border border-rose-500/40 bg-rose-950/30 text-rose-300">
                  {formError}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-slate-300 font-medium block">Dataset Title</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Enterprise Supply Chain Ledger 2025"
                  className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium block">Business Category</label>
                  <input
                    type="text"
                    required
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="e.g. Supply Chain"
                    className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-medium block">Access Clearance</label>
                  <select
                    value={formAccessLevel}
                    onChange={(e) => setFormAccessLevel(e.target.value as any)}
                    className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 text-xs cursor-pointer"
                  >
                    <option value="public">Public (All Users)</option>
                    <option value="restricted">Restricted (Analyst+)</option>
                    <option value="admin_only">Admin Only</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium block">Ingestion Source System</label>
                <input
                  type="text"
                  required
                  value={formSource}
                  onChange={(e) => setFormSource(e.target.value)}
                  placeholder="e.g. Apache Kafka Ingestion Stream"
                  className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium block">Description & Purpose</label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Summarize the dataset purpose, expected schema constraints, and refresh cadence..."
                  className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isCreating}
                  className="items-center gap-1.5"
                >
                  <span>{isCreating ? 'Creating...' : 'Provision Dataset'}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Edit Dataset Metadata */}
      {editingDataset && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setEditingDataset(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-lg rounded-lg border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950">
              <h2 className="text-sm font-semibold text-white">
                Edit Metadata: {editingDataset.name}
              </h2>
              <button
                onClick={() => setEditingDataset(null)}
                className="text-slate-400 hover:text-white"
                aria-label="Close modal"
              >
                <IconX className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-5 space-y-4 text-xs">
              {formError && (
                <div className="p-3 rounded border border-rose-500/40 bg-rose-950/30 text-rose-300">
                  {formError}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-slate-300 font-medium block">Dataset Title</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium block">Category</label>
                  <input
                    type="text"
                    required
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-medium block">Access Clearance</label>
                  <select
                    value={formAccessLevel}
                    onChange={(e) => setFormAccessLevel(e.target.value as any)}
                    className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 text-xs cursor-pointer"
                  >
                    <option value="public">Public (All Users)</option>
                    <option value="restricted">Restricted (Analyst+)</option>
                    <option value="admin_only">Admin Only</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium block">Data Source</label>
                <input
                  type="text"
                  required
                  value={formSource}
                  onChange={(e) => setFormSource(e.target.value)}
                  className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium block">Description</label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 text-xs resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingDataset(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Delete / Archive Confirmation */}
      {deletingDataset && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setDeletingDataset(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-md rounded-lg border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-rose-400">
                Confirm Dataset Removal
              </h2>
              <button
                onClick={() => setDeletingDataset(null)}
                className="text-slate-400 hover:text-white"
                aria-label="Close"
              >
                <IconX className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs text-slate-300">
              <p>
                Are you sure you want to delete dataset{' '}
                <strong className="text-white">{deletingDataset.name}</strong>?
              </p>
              <div className="p-3 rounded border border-rose-500/30 bg-rose-950/20 text-rose-300">
                Warning: This action will purge all associated records (
                {deletingDataset.totalRecords.toLocaleString()} rows), field definitions, and quality issue records from the database. This action is permanently recorded in the compliance audit log.
              </div>
            </div>

            <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeletingDataset(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
              >
                {isDeleting ? 'Deleting...' : 'Confirm Deletion'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
