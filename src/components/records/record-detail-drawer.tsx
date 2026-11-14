'use client';

import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { closeRecordDetail, openRecordDetail } from '@/store/slices/datasetSlice';
import {
  useGetRecordDetailsQuery,
  useUpdateRecordStatusMutation,
} from '@/store/services/dataScopeApi';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import {
  X,
  History,
  GitFork,
  FileText,
  Calendar,
  Building,
  DollarSign,
  Globe,
  Tag,
  CheckCircle,
  Clock,
  Shield,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export const RecordDetailDrawer: React.FC = () => {
  const dispatch = useAppDispatch();
  const { selectedDatasetId, selectedRecordId, isDetailDrawerOpen } = useAppSelector(
    (state) => state.dataset
  );
  const { permissions } = useAppSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState<'info' | 'relations' | 'history'>('info');
  const [newStatus, setNewStatus] = useState<string>('');
  const [statusReason, setStatusReason] = useState<string>('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);

  const { data, isLoading, error } = useGetRecordDetailsQuery(
    { datasetId: selectedDatasetId, recordId: selectedRecordId! },
    { skip: !selectedRecordId || !isDetailDrawerOpen }
  );

  const [updateRecordStatus, { isLoading: isMutating }] = useUpdateRecordStatusMutation();

  if (!isDetailDrawerOpen || !selectedRecordId) return null;

  const record = data?.record;
  const relatedRecords = data?.relatedRecords || [];
  const history = data?.history || [];

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStatus || !selectedRecordId) return;
    try {
      await updateRecordStatus({
        datasetId: selectedDatasetId,
        recordId: selectedRecordId,
        status: newStatus,
        reason: statusReason || 'Updated via Record Detail Inspector',
      }).unwrap();
      setIsUpdatingStatus(false);
      setNewStatus('');
      setStatusReason('');
    } catch (err) {
      alert('Failed to update record status');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/75 motion-safe:animate-in motion-safe:fade-in-50">
      <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-xl bg-slate-950 border-l border-slate-800 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded bg-emerald-600/20 text-emerald-400 font-mono font-bold text-sm border border-emerald-500/30">
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-mono text-xs text-emerald-400">
                  {record?.recordKey || 'Loading record…'}
                </span>
                <h2 className="text-base font-semibold text-slate-100 truncate max-w-xs">
                  {record?.title || 'Record Inspector'}
                </h2>
              </div>
            </div>

            <button
              onClick={() => dispatch(closeRecordDetail())}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-slate-800 bg-slate-900/40 px-6 text-xs font-medium">
            <button
              onClick={() => setActiveTab('info')}
              className={`py-3 px-4 border-b-2 flex items-center gap-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                activeTab === 'info'
                  ? 'border-emerald-500 text-emerald-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              Information
            </button>
            <button
              onClick={() => setActiveTab('relations')}
              className={`py-3 px-4 border-b-2 flex items-center gap-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                activeTab === 'relations'
                  ? 'border-emerald-500 text-emerald-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <GitFork className="h-3.5 w-3.5" />
              Related Records ({relatedRecords.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-3 px-4 border-b-2 flex items-center gap-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                activeTab === 'history'
                  ? 'border-emerald-500 text-emerald-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <History className="h-3.5 w-3.5" />
              Audit Trail ({history.length})
            </button>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {isLoading ? (
              <div className="py-20 text-center space-y-3">
                <div className="h-7 w-7 motion-safe:animate-spin rounded-full border-2 border-emerald-500 border-t-transparent mx-auto" />
                <span className="text-xs text-slate-400">Loading full record lineage…</span>
              </div>
            ) : !record ? (
              <div className="py-20 text-center text-xs text-slate-400">Record not found.</div>
            ) : (
              <>
                {/* Tab 1: Detailed Information */}
                {activeTab === 'info' && (
                  <div className="space-y-6">
                    {/* Status & Quick Action Banner */}
                    <div className="p-4 rounded-lg border border-slate-800 bg-slate-900/60 flex items-center justify-between">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-slate-400">
                          Current lifecycle status
                        </span>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              record.status === 'Active'
                                ? 'success'
                                : record.status === 'Pending'
                                ? 'warning'
                                : 'danger'
                            }
                          >
                            {record.status}
                          </Badge>
                          <span className="text-xs text-slate-400 font-mono">
                            Updated {formatDateTime(record.updatedAt)}
                          </span>
                        </div>
                      </div>

                      {permissions.canModifyRecords && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsUpdatingStatus(!isUpdatingStatus)}
                          className="text-xs"
                        >
                          Change Status
                        </Button>
                      )}
                    </div>

                    {/* Inline Status Update Form */}
                    {isUpdatingStatus && (
                      <form
                        onSubmit={handleStatusSubmit}
                        className="p-4 rounded-xl border border-blue-500/30 bg-blue-950/20 space-y-3 animate-in fade-in-50"
                      >
                        <h4 className="text-xs font-semibold text-blue-300">
                          Update Record Lifecycle Status
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          <select
                            value={newStatus}
                            onChange={(e) => setNewStatus(e.target.value)}
                            required
                            className="rounded border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                          >
                            <option value="">Select new status...</option>
                            <option value="Active">Active</option>
                            <option value="Pending">Pending</option>
                            <option value="Suspended">Suspended</option>
                            <option value="Completed">Completed</option>
                            <option value="Archived">Archived</option>
                            <option value="Flagged">Flagged</option>
                          </select>
                          <input
                            type="text"
                            value={statusReason}
                            onChange={(e) => setStatusReason(e.target.value)}
                            placeholder="Audit change reason..."
                            className="rounded border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => setIsUpdatingStatus(false)}
                          >
                            Cancel
                          </Button>
                          <Button variant="primary" size="xs" type="submit" isLoading={isMutating}>
                            Save Audit Change
                          </Button>
                        </div>
                      </form>
                    )}

                    {/* Key Attributes Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/40">
                        <span className="text-[11px] text-slate-400 font-medium">Annual Revenue</span>
                        <p className="mt-1 text-base font-mono font-bold text-emerald-400">
                          {formatCurrency(record.numericValue)}
                        </p>
                      </div>

                      <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/40">
                        <span className="text-[11px] text-slate-400 font-medium">Market Segment</span>
                        <p className="mt-1 text-sm font-semibold text-slate-200">
                          {record.category}
                        </p>
                      </div>

                      <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/40">
                        <span className="text-[11px] text-slate-400 font-medium">Jurisdiction / Country</span>
                        <p className="mt-1 text-sm font-semibold text-slate-200">
                          {record.country} ({record.region})
                        </p>
                      </div>

                      <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/40">
                        <span className="text-[11px] text-slate-400 font-medium">Effective Date</span>
                        <p className="mt-1 text-sm font-mono text-slate-300">
                          {formatDateTime(record.recordDate)}
                        </p>
                      </div>
                    </div>

                    {/* Extensible JSON Metadata */}
                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-slate-300">
                        Extended JSON attributes (metadata)
                      </span>
                      <pre className="p-4 rounded-lg border border-slate-800 bg-slate-900 text-xs font-mono text-slate-300 overflow-x-auto">
                        {JSON.stringify(record.metadata, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Tab 2: Related Records */}
                {activeTab === 'relations' && (
                  <div className="space-y-3">
                    {relatedRecords.length === 0 ? (
                      <div className="py-12 text-center text-xs text-slate-400">
                        No explicit entity relationships found for this record.
                      </div>
                    ) : (
                      relatedRecords.map((rel) => (
                        <div
                          key={rel.id}
                          className="p-3 rounded-lg border border-slate-800 bg-slate-900/50 flex items-center justify-between hover:border-slate-700 transition-colors"
                        >
                          <div className="flex flex-col">
                            <span className="text-xs capitalize text-emerald-400">
                              {rel.relationshipType.replace(/_/g, ' ')}
                            </span>
                            <span className="text-sm font-semibold text-slate-100">
                              {rel.targetRecord?.title || rel.targetRecordId}
                            </span>
                            <span className="text-xs text-slate-400">
                              Key: <code className="font-mono text-emerald-400">{rel.targetRecord?.recordKey || '-'}</code> | {rel.targetRecord?.country}
                            </span>
                          </div>

                          {rel.targetRecord && (
                            <Button
                              variant="outline"
                              size="xs"
                              onClick={() => dispatch(openRecordDetail(rel.targetRecordId))}
                              className="text-xs gap-1"
                            >
                              <span>Inspect</span>
                              <ArrowRight className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Tab 3: Historical Audit Trail */}
                {activeTab === 'history' && (
                  <div className="space-y-4">
                    {history.length === 0 ? (
                      <div className="py-12 text-center text-xs text-slate-400">
                        No previous audit revisions recorded for this record.
                      </div>
                    ) : (
                      <div className="relative border-l border-slate-800 ml-3 space-y-6">
                        {history.map((h) => (
                          <div key={h.id} className="relative pl-6">
                            <span className="absolute -left-1.5 top-1 h-3 w-3 rounded-full border-2 border-slate-950 bg-blue-500" />
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="purple" size="sm">
                                  {h.changeType}
                                </Badge>
                                <span className="text-[11px] text-slate-400 font-mono">
                                  {formatDateTime(h.createdAt)}
                                </span>
                              </div>
                              <span className="text-xs text-slate-200">
                                Changed by <strong className="text-white">{h.changedByName}</strong>
                              </span>
                              {h.diffPayload && (
                                <div className="mt-1 p-2.5 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300">
                                  {h.diffPayload.field && (
                                    <div>
                                      Field: <strong className="text-blue-300">{h.diffPayload.field}</strong>
                                    </div>
                                  )}
                                  {h.diffPayload.oldValue !== undefined && (
                                    <div>
                                      From: <span className="text-rose-400">{String(h.diffPayload.oldValue)}</span>
                                    </div>
                                  )}
                                  {h.diffPayload.newValue !== undefined && (
                                    <div>
                                      To: <span className="text-emerald-400">{String(h.diffPayload.newValue)}</span>
                                    </div>
                                  )}
                                  {h.diffPayload.reason && (
                                    <div className="text-slate-400 italic mt-0.5">
                                      &quot;{h.diffPayload.reason}&quot;
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

