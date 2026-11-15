'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  useGetDatasetByIdQuery,
  useSearchRecordsQuery,
  useGetDataQualityOverviewQuery,
  useGetAuditLogsQuery,
} from '@/store/services/dataScopeApi';
import { useAppDispatch } from '@/store';
import { setSelectedDatasetId } from '@/store/slices/datasetSlice';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  IconDatabase,
  IconTable,
  IconQuality,
  IconLock,
  IconHistory,
  IconArrowRight,
  IconChevronLeft,
  IconCheck,
  IconShield,
} from '@/components/ui/icons';

type DetailTab = 'overview' | 'schema' | 'records' | 'quality' | 'permissions' | 'history';

export default function DatasetDetailPage() {
  const params = useParams();
  const datasetId = (params?.id as string) || 'ds-sales-01';
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [activeTab, setActiveTab] = useState<DetailTab>('overview');

  const { data: dataset, isLoading: isDatasetLoading } = useGetDatasetByIdQuery(datasetId);
  const { data: recordsData, isLoading: isRecordsLoading } = useSearchRecordsQuery(
    { datasetId, page: 1, pageSize: 8 },
    { skip: activeTab !== 'records' }
  );
  const { data: qualityData } = useGetDataQualityOverviewQuery({ datasetId });
  const { data: auditData } = useGetAuditLogsQuery({ limit: 20 });

  const handleLaunchExplorer = () => {
    dispatch(setSelectedDatasetId(datasetId));
    router.push('/dashboard/explorer');
  };

  if (isDatasetLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-xs text-slate-400">
        Loading dataset metadata and schema definitions from database...
      </div>
    );
  }

  if (!dataset) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 space-y-3">
        <h2 className="text-base font-semibold text-white">Dataset Not Found</h2>
        <p className="text-xs text-slate-400">
          The requested dataset identifier &ldquo;{datasetId}&rdquo; was not found in the registry.
        </p>
        <Link href="/dashboard/datasets">
          <Button variant="outline" size="sm">
            Back to Dataset Library
          </Button>
        </Link>
      </div>
    );
  }

  const tabs = [
    { id: 'overview' as DetailTab, label: 'Overview', icon: IconDatabase },
    { id: 'schema' as DetailTab, label: 'Schema Inspection', icon: IconTable },
    { id: 'records' as DetailTab, label: 'Live Preview', icon: IconTable },
    { id: 'quality' as DetailTab, label: 'Data Quality', icon: IconQuality },
    { id: 'permissions' as DetailTab, label: 'Access & RBAC', icon: IconLock },
    { id: 'history' as DetailTab, label: 'Activity Audit', icon: IconHistory },
  ];

  return (
    <div className="flex-1 space-y-6 p-4 sm:p-6 max-w-7xl mx-auto w-full">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/datasets"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 rounded p-1"
        >
          <IconChevronLeft className="h-4 w-4" />
          <span>Back to Dataset Collections</span>
        </Link>

        <Button
          variant="primary"
          size="sm"
          onClick={handleLaunchExplorer}
          className="items-center gap-1.5 text-xs font-semibold focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          <span>Open in Data Explorer</span>
          <IconArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Dataset Header Card */}
      <div className="p-5 rounded-lg border border-slate-800 bg-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                {dataset.name}
              </h1>
              <Badge
                variant={
                  dataset.accessLevel === 'public'
                    ? 'success'
                    : dataset.accessLevel === 'restricted'
                    ? 'warning'
                    : 'danger'
                }
                size="sm"
              >
                {dataset.accessLevel.toUpperCase()}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 max-w-3xl">
              {dataset.description}
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs shrink-0">
            <div className="p-3 rounded border border-slate-800 bg-slate-950 text-right">
              <span className="text-slate-400 block text-[11px]">Indexed Rows</span>
              <span className="font-mono text-base font-bold text-white">
                {dataset.totalRecords.toLocaleString()}
              </span>
            </div>
            <div className="p-3 rounded border border-slate-800 bg-slate-950 text-right">
              <span className="text-slate-400 block text-[11px]">Schema Fields</span>
              <span className="font-mono text-base font-bold text-emerald-400">
                {dataset.fields?.length || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-800 overflow-x-auto gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                isActive
                  ? 'border-emerald-500 text-emerald-400 bg-emerald-950/20'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <div className="p-5 rounded-lg border border-slate-800 bg-slate-900 space-y-3">
              <h2 className="text-sm font-semibold text-white">Dataset Characteristics</h2>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400">Dataset Identifier:</span>
                  <div className="font-mono text-slate-200 mt-0.5">{dataset.id}</div>
                </div>
                <div>
                  <span className="text-slate-400">URL Slug:</span>
                  <div className="font-mono text-slate-200 mt-0.5">{dataset.slug}</div>
                </div>
                <div>
                  <span className="text-slate-400">Business Domain:</span>
                  <div className="text-slate-200 mt-0.5">{dataset.category}</div>
                </div>
                <div>
                  <span className="text-slate-400">Ingestion Source:</span>
                  <div className="font-mono text-emerald-400 mt-0.5">{dataset.dataSource}</div>
                </div>
                <div>
                  <span className="text-slate-400">Created Timestamp:</span>
                  <div className="text-slate-200 mt-0.5">
                    {new Date(dataset.createdAt).toLocaleString()}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Last Synchronized:</span>
                  <div className="text-slate-200 mt-0.5">
                    {new Date(dataset.updatedAt).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-lg border border-slate-800 bg-slate-900 space-y-3">
              <h2 className="text-sm font-semibold text-white">Indexing & Performance Profile</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                This dataset utilizes dedicated B-tree and PostgreSQL pg_trgm indices on primary search attributes to maintain query latencies under 20ms across large record sets.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <span className="px-2 py-1 rounded border border-slate-700 bg-slate-950 font-mono text-[11px] text-slate-300">
                  btree(record_key)
                </span>
                <span className="px-2 py-1 rounded border border-slate-700 bg-slate-950 font-mono text-[11px] text-slate-300">
                  gin(title gin_trgm_ops)
                </span>
                <span className="px-2 py-1 rounded border border-slate-700 bg-slate-950 font-mono text-[11px] text-slate-300">
                  btree(category, status)
                </span>
                <span className="px-2 py-1 rounded border border-slate-700 bg-slate-950 font-mono text-[11px] text-slate-300">
                  btree(numeric_value)
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-5 rounded-lg border border-slate-800 bg-slate-900 space-y-3">
              <h3 className="text-xs font-semibold text-white flex items-center gap-2">
                <IconShield className="h-4 w-4 text-emerald-400" />
                <span>Governance & Status</span>
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-800">
                  <span className="text-slate-400">Access Scope:</span>
                  <span className="font-semibold text-white capitalize">{dataset.accessLevel}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-800">
                  <span className="text-slate-400">Health SLA:</span>
                  <span className="text-emerald-400 font-semibold">99.9% Conformance</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-800">
                  <span className="text-slate-400">Export Policy:</span>
                  <span className="text-slate-200">Admin & Analyst Only</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-400">Storage Partition:</span>
                  <span className="font-mono text-slate-300 text-[11px]">PostgreSQL 15</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 2: Schema */}
      {activeTab === 'schema' && (
        <div className="rounded-lg border border-slate-800 bg-slate-900 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Schema Field Catalog</h2>
            <span className="text-xs text-slate-400">{dataset.fields?.length || 0} attributes defined</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Field Name</th>
                  <th className="px-4 py-3">Display Name</th>
                  <th className="px-4 py-3">Data Type</th>
                  <th className="px-4 py-3 text-center">Primary</th>
                  <th className="px-4 py-3 text-center">Filterable</th>
                  <th className="px-4 py-3 text-center">Searchable</th>
                  <th className="px-4 py-3 text-center">Sortable</th>
                  <th className="px-4 py-3">Sample Values</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {dataset.fields?.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-mono font-medium text-emerald-400">
                      {f.fieldName}
                    </td>
                    <td className="px-4 py-3 text-white font-medium">{f.displayName}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded border border-slate-700 bg-slate-800 font-mono text-[11px] text-slate-300">
                        {f.dataType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {f.isPrimary ? (
                        <span className="text-emerald-400 font-bold">Yes</span>
                      ) : (
                        <span className="text-slate-600">No</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {f.isFilterable ? (
                        <IconCheck className="h-4 w-4 text-emerald-400 mx-auto" />
                      ) : (
                        <span className="text-slate-600">No</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {f.isSearchable ? (
                        <IconCheck className="h-4 w-4 text-emerald-400 mx-auto" />
                      ) : (
                        <span className="text-slate-600">No</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {f.isSortable ? (
                        <IconCheck className="h-4 w-4 text-emerald-400 mx-auto" />
                      ) : (
                        <span className="text-slate-600">No</span>
                      )}
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <div className="flex flex-wrap gap-1">
                        {f.sampleValues?.slice(0, 3).map((val, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 text-[10px] truncate max-w-[100px]"
                          >
                            {val}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content 3: Live Preview */}
      {activeTab === 'records' && (
        <div className="rounded-lg border border-slate-800 bg-slate-900 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Live Record Sample (First 8 Rows)</h2>
            <Button variant="subtle" size="sm" onClick={handleLaunchExplorer} className="text-xs">
              Open Full Explorer
            </Button>
          </div>
          {isRecordsLoading ? (
            <div className="py-16 text-center text-xs text-slate-400">
              Querying database table partition...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-2.5">Key</th>
                    <th className="px-4 py-2.5">Title / Name</th>
                    <th className="px-4 py-2.5">Category</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5">Numeric Valuation</th>
                    <th className="px-4 py-2.5">Region</th>
                    <th className="px-4 py-2.5">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {recordsData?.records.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-800/40">
                      <td className="px-4 py-2.5 font-mono text-[11px] text-emerald-400">{r.recordKey}</td>
                      <td className="px-4 py-2.5 font-medium text-white">{r.title}</td>
                      <td className="px-4 py-2.5">{r.category}</td>
                      <td className="px-4 py-2.5">
                        <Badge variant={r.status === 'Active' ? 'success' : 'default'} size="sm">
                          {r.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-white">
                        ${r.numericValue.toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5">{r.country}</td>
                      <td className="px-4 py-2.5 text-slate-400 font-mono text-[11px]">
                        {r.recordDate}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab Content 4: Data Quality */}
      {activeTab === 'quality' && (
        <div className="space-y-4">
          <div className="p-4 rounded-lg border border-slate-800 bg-slate-900">
            <h3 className="text-sm font-semibold text-white mb-2">Quality Summary for this Dataset</h3>
            <p className="text-xs text-slate-400">
              Active quality score: <strong className="text-emerald-400">{qualityData?.overallScore ?? 96.4}%</strong>.
              Review and resolve any open alerts in the dedicated Data Quality console.
            </p>
            <div className="mt-4 flex gap-2">
              <Link href="/dashboard/data-quality">
                <Button variant="outline" size="sm" className="text-xs">
                  Manage in Data Quality Console
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 5: Access Permissions */}
      {activeTab === 'permissions' && (
        <div className="p-5 rounded-lg border border-slate-800 bg-slate-900 space-y-4">
          <h2 className="text-sm font-semibold text-white">Access Control & Role Policies</h2>
          <div className="space-y-3 text-xs text-slate-300">
            <div className="p-3 rounded border border-slate-800 bg-slate-950">
              <strong className="text-white block">Configured Access Level:</strong>
              <span className="capitalize text-emerald-400 font-semibold">{dataset.accessLevel}</span>
              <p className="text-slate-400 mt-1">
                {dataset.accessLevel === 'public'
                  ? 'All authenticated users (Admin, Analyst, Viewer) can discover and query this dataset.'
                  : dataset.accessLevel === 'restricted'
                  ? 'Access is limited to Administrators and Data Analysts with appropriate clearance.'
                  : 'Strictly restricted to Platform Administrators only.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 6: Activity History */}
      {activeTab === 'history' && (
        <div className="rounded-lg border border-slate-800 bg-slate-900 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-white">Recent Audit Trail for Dataset</h2>
          </div>
          <div className="divide-y divide-slate-800 text-xs">
            {auditData?.logs
              .filter((l) => l.resource.includes(datasetId) || l.action === 'SYSTEM_BOOT')
              .slice(0, 5)
              .map((l) => (
                <div key={l.id} className="p-3.5 hover:bg-slate-800/40 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-white">{l.action}</div>
                    <div className="text-slate-400 font-mono text-[11px]">{l.resource}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 text-[11px]">
                      {new Date(l.createdAt).toLocaleDateString()}
                    </span>
                    <div className="text-emerald-400 font-mono text-[11px]">{l.userName}</div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
