'use client';

import React, { useState } from 'react';
import {
  useGetDataQualityOverviewQuery,
  useUpdateDataQualityIssueMutation,
  useGetDatasetsQuery,
} from '@/store/services/dataScopeApi';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  IconQuality,
  IconCheck,
  IconRefresh,
  IconShield,
} from '@/components/ui/icons';

export default function DataQualityPage() {
  const [selectedDataset, setSelectedDataset] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  const { data: datasets = [] } = useGetDatasetsQuery();
  const {
    data: overview,
    isLoading,
    isFetching,
    refetch,
  } = useGetDataQualityOverviewQuery({
    datasetId: selectedDataset,
    severity: selectedSeverity,
    status: selectedStatus,
  });

  const [updateIssueStatus, { isLoading: isUpdating }] = useUpdateDataQualityIssueMutation();

  const handleUpdateStatus = async (issueId: string, status: 'open' | 'reviewed' | 'resolved') => {
    try {
      await updateIssueStatus({ issueId, status }).unwrap();
    } catch (err) {
      console.error('Failed to update quality issue status:', err);
    }
  };

  const getSeverityBadgeVariant = (sev: string) => {
    switch (sev) {
      case 'critical':
        return 'danger';
      case 'high':
        return 'danger';
      case 'medium':
        return 'warning';
      case 'low':
      default:
        return 'default';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'success';
      case 'reviewed':
        return 'info';
      case 'open':
      default:
        return 'warning';
    }
  };

  return (
    <div className="flex-1 space-y-6 p-4 sm:p-6 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <IconQuality className="h-6 w-6 text-emerald-400" />
              <span>Data Quality & Integrity Monitoring</span>
            </h1>
            <Badge variant="success" size="sm">
              Continuous
            </Badge>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Realtime schema conformance, null checks, and referential integrity scores computed across indexed datasets.
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
            <span>Re-scan Now</span>
          </Button>
        </div>
      </div>

      {/* KPI Dimension Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
        <div className="p-4 rounded-lg border border-slate-800 bg-slate-900 col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Overall Score</span>
            <IconShield className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">
            {overview ? `${overview.overallScore}%` : '...'}
          </div>
          <div className="mt-1 text-[11px] text-emerald-400 font-medium">
            Production Grade SLA
          </div>
        </div>

        <div className="p-4 rounded-lg border border-slate-800 bg-slate-900">
          <div className="text-xs text-slate-400">Completeness</div>
          <div className="mt-2 text-2xl font-bold text-white">
            {overview ? `${overview.dimensions.completeness}%` : '...'}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Non-null attribute coverage</div>
        </div>

        <div className="p-4 rounded-lg border border-slate-800 bg-slate-900">
          <div className="text-xs text-slate-400">Uniqueness</div>
          <div className="mt-2 text-2xl font-bold text-white">
            {overview ? `${overview.dimensions.uniqueness}%` : '...'}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Zero duplicate primary keys</div>
        </div>

        <div className="p-4 rounded-lg border border-slate-800 bg-slate-900">
          <div className="text-xs text-slate-400">Validity</div>
          <div className="mt-2 text-2xl font-bold text-white">
            {overview ? `${overview.dimensions.validity}%` : '...'}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Type & domain conformance</div>
        </div>

        <div className="p-4 rounded-lg border border-slate-800 bg-slate-900">
          <div className="text-xs text-slate-400">Consistency</div>
          <div className="mt-2 text-2xl font-bold text-white">
            {overview ? `${overview.dimensions.consistency}%` : '...'}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Referential harmony</div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="p-3 rounded-lg border border-slate-800 bg-slate-900 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Dataset:</span>
            <select
              value={selectedDataset}
              onChange={(e) => setSelectedDataset(e.target.value)}
              className="rounded border border-slate-700 bg-slate-800 px-2.5 py-1 text-slate-200 focus:outline-none"
            >
              <option value="ALL">All Active Datasets</option>
              {datasets.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Severity:</span>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="rounded border border-slate-700 bg-slate-800 px-2.5 py-1 text-slate-200 focus:outline-none"
            >
              <option value="ALL">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded border border-slate-700 bg-slate-800 px-2.5 py-1 text-slate-200 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="open">Open</option>
              <option value="reviewed">Under Review</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-400">
          <span>Active Issues:</span>
          <span className="font-semibold text-white">{overview?.totalIssues ?? 0}</span>
        </div>
      </div>

      {/* Quality Issues List */}
      <div className="rounded-lg border border-slate-800 bg-slate-900 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Identified Quality Observations</h2>
          <span className="text-xs text-slate-400">
            {overview?.issues.length ?? 0} issue records displayed
          </span>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-xs text-slate-400">
            Scanning datasets and aggregating verification heuristics...
          </div>
        ) : !overview || overview.issues.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <IconCheck className="h-8 w-8 text-emerald-400 mx-auto" />
            <div className="text-sm font-medium text-white">No Quality Violations Detected</div>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              All indexed fields and records satisfy completeness, uniqueness, and domain constraints.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-medium">
                <tr>
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3">Dataset & Target Field</th>
                  <th className="px-4 py-3">Issue Classification</th>
                  <th className="px-4 py-3">Observation Details</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {overview.issues.map((issue) => (
                  <tr key={issue.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <Badge variant={getSeverityBadgeVariant(issue.severity)} size="sm">
                        {issue.severity.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-white">{issue.datasetName}</div>
                      <div className="text-slate-400 font-mono text-[11px]">field: {issue.fieldName}</div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded border border-slate-700 bg-slate-800 text-slate-300 font-mono text-[11px]">
                        {issue.issueType}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 max-w-md">
                      <p className="text-slate-200">{issue.description}</p>
                      <span className="text-[11px] text-slate-500">
                        Detected: {new Date(issue.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <Badge variant={getStatusBadgeVariant(issue.status)} size="sm">
                        {issue.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        {issue.status === 'open' && (
                          <Button
                            variant="subtle"
                            size="sm"
                            disabled={isUpdating}
                            onClick={() => handleUpdateStatus(issue.id, 'reviewed')}
                            className="text-xs"
                          >
                            Mark Reviewed
                          </Button>
                        )}
                        {issue.status !== 'resolved' && (
                          <Button
                            variant="primary"
                            size="sm"
                            disabled={isUpdating}
                            onClick={() => handleUpdateStatus(issue.id, 'resolved')}
                            className="text-xs"
                          >
                            Resolve
                          </Button>
                        )}
                        {issue.status === 'resolved' && (
                          <span className="text-emerald-400 font-medium text-xs flex items-center gap-1">
                            <IconCheck className="h-3.5 w-3.5" />
                            Resolved
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
