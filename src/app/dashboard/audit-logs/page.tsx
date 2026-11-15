'use client';

import React, { useState } from 'react';
import { useGetAuditLogsQuery } from '@/store/services/dataScopeApi';
import { AuditLog } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  IconFileText,
  IconSearch,
  IconRefresh,
  IconShield,
  IconX,
} from '@/components/ui/icons';

export default function AuditLogsPage() {
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const { data, isLoading, isFetching, refetch } = useGetAuditLogsQuery({
    action: actionFilter,
    status: statusFilter,
    search: searchQuery,
    limit: 100,
  });

  const logs = data?.logs || [];

  const getStatusBadgeVariant = (st: string) => {
    switch (st) {
      case 'SUCCESS':
        return 'success';
      case 'WARNING':
        return 'warning';
      case 'FAILURE':
        return 'danger';
      default:
        return 'default';
    }
  };

  return (
    <div className="flex-1 space-y-6 p-4 sm:p-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <IconFileText className="h-6 w-6 text-emerald-400" />
              <span>Compliance & Security Audit Logs</span>
            </h1>
            <Badge variant="success" size="sm">
              Append Only
            </Badge>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Immutable chronicle of administrative, authentication, search, and export activities.
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
            <span>Refresh Ledger</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 rounded-lg border border-slate-800 bg-slate-900 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Action Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Action:</span>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="rounded border border-slate-700 bg-slate-800 px-2.5 py-1 text-slate-200 focus:outline-none"
            >
              <option value="ALL">All Actions</option>
              <option value="SYSTEM_BOOT">SYSTEM_BOOT</option>
              <option value="RECORD_SEARCH">RECORD_SEARCH</option>
              <option value="SAVED_VIEW_CREATE">SAVED_VIEW_CREATE</option>
              <option value="DATA_EXPORT">DATA_EXPORT</option>
              <option value="DATA_QUALITY_STATUS_UPDATE">DATA_QUALITY_STATUS_UPDATE</option>
              <option value="USER_ROLE_UPDATE">USER_ROLE_UPDATE</option>
              <option value="PERMISSIONS_AUDIT">PERMISSIONS_AUDIT</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded border border-slate-700 bg-slate-800 px-2.5 py-1 text-slate-200 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUCCESS">SUCCESS</option>
              <option value="WARNING">WARNING</option>
              <option value="FAILURE">FAILURE</option>
            </select>
          </div>

          {/* Search Input */}
          <div className="flex items-center gap-1.5 bg-slate-800 rounded px-2.5 py-1 border border-slate-700">
            <IconSearch className="h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search user, action, resource..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-slate-200 placeholder-slate-400 focus:outline-none text-xs w-48 sm:w-64"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-400">
          <span>Logged Records:</span>
          <span className="font-semibold text-white">{logs.length}</span>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-lg border border-slate-800 bg-slate-900 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Security Event Trail</h2>
          <span className="text-xs text-slate-400">Ordered by timestamp (newest first)</span>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-xs text-slate-400">
            Streaming ledger entries from PostgreSQL audit partition...
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            No audit log entries found matching current filter parameters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-medium">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Actor / Principal</th>
                  <th className="px-4 py-3">Action Type</th>
                  <th className="px-4 py-3">Target Resource</th>
                  <th className="px-4 py-3">Network IP</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-medium text-white">{log.userName}</div>
                      <div className="text-xs text-slate-400 capitalize">{log.userRole}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded border border-slate-700 bg-slate-800 font-mono text-[11px] text-emerald-400">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate text-slate-300 font-mono text-[11px]">
                      {log.resource}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-mono text-[11px] text-slate-400">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge variant={getStatusBadgeVariant(log.status)} size="sm">
                        {log.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <Button
                        variant="subtle"
                        size="sm"
                        onClick={() => setSelectedLog(log)}
                        className="text-xs"
                      >
                        Inspect
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payload Inspection Modal */}
      {selectedLog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setSelectedLog(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-xl rounded-lg border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950">
              <div className="flex items-center gap-2">
                <IconShield className="h-4 w-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">
                  Audit Record: {selectedLog.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-white"
                aria-label="Close details"
              >
                <IconX className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 pb-3 border-b border-slate-800">
                <div>
                  <span className="text-slate-400">Action:</span>
                  <div className="font-semibold text-white">{selectedLog.action}</div>
                </div>
                <div>
                  <span className="text-slate-400">Resource:</span>
                  <div className="font-mono text-slate-200 truncate">{selectedLog.resource}</div>
                </div>
                <div>
                  <span className="text-slate-400">Principal:</span>
                  <div className="text-slate-200">
                    {selectedLog.userName} ({selectedLog.userRole})
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Recorded At:</span>
                  <div className="text-slate-200">{new Date(selectedLog.createdAt).toISOString()}</div>
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block mb-1">Payload Metadata:</span>
                <pre className="p-3 rounded bg-slate-950 border border-slate-800 font-mono text-[11px] text-emerald-400 overflow-x-auto max-h-56">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            </div>

            <div className="px-4 py-2.5 border-t border-slate-800 bg-slate-950 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setSelectedLog(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
