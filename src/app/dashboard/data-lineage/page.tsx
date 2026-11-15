'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useGetDataLineageQuery } from '@/store/services/dataScopeApi';
import { DataLineageNode } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  GitBranch,
  Database,
  Server,
  RefreshCw,
  Shield,
  ArrowRight,
  Lock,
  Globe,
  Zap,
  Activity,
  ShieldCheck,
  Search,
  Download,
  Layers,
  CheckCircle2,
} from 'lucide-react';

export default function DataLineagePage() {
  const { data: graph, isLoading, isFetching, refetch } = useGetDataLineageQuery();
  const [selectedNodeId, setSelectedNodeId] = useState<string>('ds-sales-01');

  // Matrix Filter States
  const [matrixSearch, setMatrixSearch] = useState<string>('');
  const [stageFilter, setStageFilter] = useState<string>('all');

  const selectedNode = graph?.nodes.find((n) => n.id === selectedNodeId) || graph?.nodes[0];
  const upstreamEdges = graph?.edges.filter((e) => e.target === selectedNode?.id) || [];
  const downstreamEdges = graph?.edges.filter((e) => e.source === selectedNode?.id) || [];

  const nodeMap = useMemo(() => {
    const map: Record<string, DataLineageNode> = {};
    if (graph?.nodes) {
      for (const node of graph.nodes) {
        map[node.id] = node;
      }
    }
    return map;
  }, [graph?.nodes]);

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'source':
        return Server;
      case 'pipeline':
        return GitBranch;
      case 'dataset':
        return Database;
      case 'consumer':
      default:
        return Shield;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="emerald" size="sm">Active</Badge>;
      case 'syncing':
        return <Badge variant="warning" size="sm">Syncing</Badge>;
      case 'idle':
        return <Badge variant="outline" size="sm">Idle</Badge>;
      default:
        return <Badge variant="outline" size="sm">{status}</Badge>;
    }
  };

  const getProtocolBadge = (protocol: string = '') => {
    if (protocol.includes('PostgreSQL')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 text-[11px] font-medium whitespace-nowrap">
          <Database className="h-3 w-3 shrink-0" />
          <span>{protocol}</span>
        </span>
      );
    }
    if (protocol === 'mTLS') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[11px] font-medium whitespace-nowrap">
          <Shield className="h-3 w-3 shrink-0" />
          <span>{protocol}</span>
        </span>
      );
    }
    if (protocol.includes('HTTPS')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800 text-[11px] font-medium whitespace-nowrap">
          <Globe className="h-3 w-3 shrink-0" />
          <span>{protocol}</span>
        </span>
      );
    }
    if (protocol.includes('IPC') || protocol.includes('Queue')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 text-[11px] font-medium whitespace-nowrap">
          <Zap className="h-3 w-3 shrink-0" />
          <span>{protocol}</span>
        </span>
      );
    }
    if (protocol.includes('Hash')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 text-[11px] font-medium whitespace-nowrap">
          <Lock className="h-3 w-3 shrink-0" />
          <span>{protocol}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-medium whitespace-nowrap">
        <Activity className="h-3 w-3 shrink-0 text-slate-400" />
        <span>{protocol}</span>
      </span>
    );
  };

  const getSecurityBadge = (security: string = '') => {
    const isEncrypted =
      security.includes('TLS') ||
      security.includes('mTLS') ||
      security.includes('Hash') ||
      security.includes('SOX') ||
      security.includes('Append');
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border whitespace-nowrap ${
          isEncrypted
            ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
            : 'bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
        }`}
      >
        {isEncrypted ? (
          <Lock className="h-2.5 w-2.5 text-emerald-500 shrink-0" />
        ) : (
          <ShieldCheck className="h-2.5 w-2.5 text-slate-400 shrink-0" />
        )}
        <span>{security}</span>
      </span>
    );
  };

  const sources = graph?.nodes.filter((n) => n.type === 'source') || [];
  const pipelines = graph?.nodes.filter((n) => n.type === 'pipeline') || [];
  const datasets = graph?.nodes.filter((n) => n.type === 'dataset') || [];
  const consumers = graph?.nodes.filter((n) => n.type === 'consumer') || [];

  // Filtered matrix edges
  const filteredEdges = useMemo(() => {
    if (!graph?.edges) return [];
    return graph.edges.filter((edge) => {
      // Stage filter
      if (stageFilter === 'ingestion' && !edge.source.startsWith('src-')) return false;
      if (stageFilter === 'validation' && !(edge.source.startsWith('pipe-') && edge.target.startsWith('pipe-'))) return false;
      if (stageFilter === 'persistence' && !(edge.source.startsWith('pipe-') && edge.target.startsWith('ds-'))) return false;
      if (stageFilter === 'consumption' && !edge.source.startsWith('ds-')) return false;

      // Search query filter
      if (matrixSearch.trim()) {
        const query = matrixSearch.toLowerCase();
        const srcNode = nodeMap[edge.source];
        const tgtNode = nodeMap[edge.target];
        const matchSource = edge.source.toLowerCase().includes(query) || (srcNode?.name || '').toLowerCase().includes(query);
        const matchTarget = edge.target.toLowerCase().includes(query) || (tgtNode?.name || '').toLowerCase().includes(query);
        const matchProtocol = (edge.protocol || '').toLowerCase().includes(query);
        const matchSecurity = (edge.label || '').toLowerCase().includes(query);
        return matchSource || matchTarget || matchProtocol || matchSecurity;
      }
      return true;
    });
  }, [graph?.edges, stageFilter, matrixSearch, nodeMap]);

  // Export Matrix to CSV
  const handleExportMatrixCsv = () => {
    if (!graph?.edges || graph.edges.length === 0) return;
    const headers = [
      'Edge ID',
      'Source Entity ID',
      'Source Entity Name',
      'Target Destination ID',
      'Target Destination Name',
      'Protocol',
      'Channel Security',
    ];
    const rows = graph.edges.map((e) => {
      const s = nodeMap[e.source];
      const t = nodeMap[e.target];
      return [
        `"${e.id}"`,
        `"${e.source}"`,
        `"${(s?.name || '').replace(/"/g, '""')}"`,
        `"${e.target}"`,
        `"${(t?.name || '').replace(/"/g, '""')}"`,
        `"${e.protocol || ''}"`,
        `"${e.label || ''}"`,
      ];
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `datascope_lineage_matrix_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="flex-1 space-y-6 p-4 sm:p-8 max-w-7xl mx-auto w-full text-slate-900 dark:text-slate-100 transition-colors">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Link href="/dashboard" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              Workspace
            </Link>
            <span>/</span>
            <span className="text-slate-900 dark:text-slate-200 font-medium">Intelligence</span>
            <span>/</span>
            <span className="text-slate-900 dark:text-slate-200 font-medium">Data Lineage</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <GitBranch className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            <span>Enterprise Data Lineage &amp; Provenance Graph</span>
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-2xl">
            End-to-end data provenance tracking from origin ingestion sources through pipeline validation and PostgreSQL partitioned persistence to downstream consumption endpoints.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${isFetching ? 'motion-safe:animate-spin' : ''}`} />
            <span>Refresh Topology</span>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-24 text-center text-xs text-slate-500 dark:text-slate-400">
          Constructing pipeline provenance graph and verifying node heartbeats...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Visual Pipeline Columns & Lineage Relationship Matrix */}
          <div className="lg:col-span-2 space-y-6">
            {/* Provenance Flow Stages */}
            <div className="p-5 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-4">
              <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-100 dark:border-slate-800/80">
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Layers className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Provenance Flow Stages</span>
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Click any component to inspect entity metadata
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {/* Column 1: Sources */}
                <div className="space-y-2.5">
                  <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 pb-1 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <span>1. Ingestion Sources</span>
                    <Badge variant="outline" size="sm" className="text-[10px]">3</Badge>
                  </div>
                  <div className="space-y-2">
                    {sources.map((node) => {
                      const isSelected = selectedNode?.id === node.id;
                      const Icon = getNodeIcon(node.type);
                      return (
                        <div
                          key={node.id}
                          onClick={() => setSelectedNodeId(node.id)}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors duration-150 shadow-sm ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-slate-900 dark:text-white'
                              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/70 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <div className="font-semibold text-xs truncate">{node.name}</div>
                          </div>
                          <div className="mt-2 flex items-center justify-between text-[11px]">
                            <span className="text-slate-500 font-mono text-[10px]">{node.id}</span>
                            {getStatusBadge(node.status)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Column 2: Pipelines */}
                <div className="space-y-2.5">
                  <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 pb-1 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <span>2. Ingestion Workers</span>
                    <Badge variant="outline" size="sm" className="text-[10px]">2</Badge>
                  </div>
                  <div className="space-y-2">
                    {pipelines.map((node) => {
                      const isSelected = selectedNode?.id === node.id;
                      const Icon = getNodeIcon(node.type);
                      return (
                        <div
                          key={node.id}
                          onClick={() => setSelectedNodeId(node.id)}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors duration-150 shadow-sm ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-slate-900 dark:text-white'
                              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/70 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <div className="font-semibold text-xs truncate">{node.name}</div>
                          </div>
                          <div className="mt-2 flex items-center justify-between text-[11px]">
                            <span className="text-slate-500 font-mono text-[10px]">{node.id}</span>
                            {getStatusBadge(node.status)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Column 3: Datasets */}
                <div className="space-y-2.5">
                  <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 pb-1 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <span>3. Managed Datasets</span>
                    <Badge variant="outline" size="sm" className="text-[10px]">3</Badge>
                  </div>
                  <div className="space-y-2">
                    {datasets.map((node) => {
                      const isSelected = selectedNode?.id === node.id;
                      const Icon = getNodeIcon(node.type);
                      return (
                        <div
                          key={node.id}
                          onClick={() => setSelectedNodeId(node.id)}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors duration-150 shadow-sm ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-slate-900 dark:text-white'
                              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/70 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <div className="font-semibold text-xs truncate">{node.name}</div>
                          </div>
                          <div className="mt-2 flex items-center justify-between text-[11px]">
                            <span className="text-slate-500 font-mono text-[10px]">{node.id}</span>
                            {getStatusBadge(node.status)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Column 4: Consumers */}
                <div className="space-y-2.5">
                  <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 pb-1 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <span>4. Consumer Endpoints</span>
                    <Badge variant="outline" size="sm" className="text-[10px]">3</Badge>
                  </div>
                  <div className="space-y-2">
                    {consumers.map((node) => {
                      const isSelected = selectedNode?.id === node.id;
                      const Icon = getNodeIcon(node.type);
                      return (
                        <div
                          key={node.id}
                          onClick={() => setSelectedNodeId(node.id)}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors duration-150 shadow-sm ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-slate-900 dark:text-white'
                              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/70 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <div className="font-semibold text-xs truncate">{node.name}</div>
                          </div>
                          <div className="mt-2 flex items-center justify-between text-[11px]">
                            <span className="text-slate-500 font-mono text-[10px]">{node.id}</span>
                            {getStatusBadge(node.status)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* UPGRADED: Lineage Relationship Matrix Section */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm overflow-hidden space-y-4 p-5 sm:p-6">
              {/* Matrix Header & Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <GitBranch className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Lineage Relationship Matrix</span>
                    </h3>
                    <Badge variant="emerald" size="sm">
                      {graph?.edges.length ?? 12} active links
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Live connection protocols, transport cryptography, and inter-entity lineage mappings.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportMatrixCsv}
                    className="text-xs gap-1.5 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    <Download className="h-3.5 w-3.5 text-blue-500" />
                    <span>Export Matrix (CSV)</span>
                  </Button>
                </div>
              </div>

              {/* Filters & Search Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Stage Filter Buttons */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setStageFilter('all')}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                      stageFilter === 'all'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    All ({graph?.edges.length || 12})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStageFilter('ingestion')}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                      stageFilter === 'ingestion'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Ingestion (3)
                  </button>
                  <button
                    type="button"
                    onClick={() => setStageFilter('validation')}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                      stageFilter === 'validation'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Workers (1)
                  </button>
                  <button
                    type="button"
                    onClick={() => setStageFilter('persistence')}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                      stageFilter === 'persistence'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Persistence (3)
                  </button>
                  <button
                    type="button"
                    onClick={() => setStageFilter('consumption')}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                      stageFilter === 'consumption'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Consumers (5)
                  </button>
                </div>

                {/* Search Input */}
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={matrixSearch}
                    onChange={(e) => setMatrixSearch(e.target.value)}
                    placeholder="Filter by link, protocol, or entity"
                    className="w-full h-8 pl-8 pr-3 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Matrix Table */}
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-x-auto shadow-sm">
                <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold">
                    <tr>
                      <th className="px-4 py-3">Source Entity</th>
                      <th className="px-3 py-3 text-center">Flow</th>
                      <th className="px-4 py-3">Target Destination</th>
                      <th className="px-4 py-3">Protocol</th>
                      <th className="px-4 py-3">Channel Security</th>
                      <th className="px-4 py-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 bg-white dark:bg-slate-900/40">
                    {filteredEdges.map((edge) => {
                      const srcNode = nodeMap[edge.source];
                      const tgtNode = nodeMap[edge.target];
                      const isConnectedToActive =
                        selectedNode?.id === edge.source || selectedNode?.id === edge.target;

                      return (
                        <tr
                          key={edge.id}
                          className={`transition-colors duration-150 hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                            isConnectedToActive
                              ? 'bg-emerald-50/50 dark:bg-emerald-950/20'
                              : ''
                          }`}
                        >
                          {/* Source Entity */}
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => setSelectedNodeId(edge.source)}
                              className="text-left group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 rounded"
                            >
                              <div className="font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                {srcNode?.name || edge.source}
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                  {edge.source}
                                </span>
                                <span className="text-[10px] text-slate-400 capitalize">
                                  {srcNode?.type || 'node'}
                                </span>
                              </div>
                            </button>
                          </td>

                          {/* Flow Arrow */}
                          <td className="px-3 py-3 text-center">
                            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500">
                              <ArrowRight className="h-3 w-3 text-emerald-500" />
                            </span>
                          </td>

                          {/* Target Destination */}
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => setSelectedNodeId(edge.target)}
                              className="text-left group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 rounded"
                            >
                              <div className="font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                {tgtNode?.name || edge.target}
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                  {edge.target}
                                </span>
                                <span className="text-[10px] text-slate-400 capitalize">
                                  {tgtNode?.type || 'node'}
                                </span>
                              </div>
                            </button>
                          </td>

                          {/* Protocol */}
                          <td className="px-4 py-3">
                            {getProtocolBadge(edge.protocol)}
                          </td>

                          {/* Channel Security */}
                          <td className="px-4 py-3">
                            {getSecurityBadge(edge.label)}
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3 text-right">
                            <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
                              <span>Live</span>
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Node Inspector Sidebar */}
          <div className="space-y-4">
            {selectedNode ? (
              <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-4 sticky top-20">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 capitalize">
                      {selectedNode.type} Node
                    </span>
                    {getStatusBadge(selectedNode.status)}
                  </div>
                  <h2 className="mt-1 text-base font-bold text-slate-900 dark:text-white">{selectedNode.name}</h2>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{selectedNode.description}</p>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Node Identifier:</span>
                    <span className="font-mono text-slate-900 dark:text-slate-200 text-[11px] font-semibold">{selectedNode.id}</span>
                  </div>

                  {selectedNode.metadata.owner && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Engineering Owner:</span>
                      <span className="text-slate-900 dark:text-slate-200 font-medium">{selectedNode.metadata.owner}</span>
                    </div>
                  )}

                  {selectedNode.metadata.records !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Indexed Rows:</span>
                      <span className="font-mono text-slate-900 dark:text-white font-semibold">
                        {selectedNode.metadata.records.toLocaleString()}
                      </span>
                    </div>
                  )}

                  {selectedNode.metadata.lastSync && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Sync Cadence:</span>
                      <span className="text-slate-700 dark:text-slate-300">{selectedNode.metadata.lastSync}</span>
                    </div>
                  )}

                  {selectedNode.metadata.destination && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Default Target:</span>
                      <span className="text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                        {selectedNode.metadata.destination}
                      </span>
                    </div>
                  )}
                </div>

                {/* Upstream & Downstream Connected Entities */}
                <div className="border-t border-slate-200 dark:border-slate-800 pt-3 space-y-3">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      Upstream Feeds ({upstreamEdges.length})
                    </span>
                    <div className="mt-1.5 space-y-1">
                      {upstreamEdges.length === 0 ? (
                        <div className="text-[11px] text-slate-400 dark:text-slate-500 italic">Top-level primary origin</div>
                      ) : (
                        upstreamEdges.map((e) => (
                          <div
                            key={e.id}
                            onClick={() => setSelectedNodeId(e.source)}
                            className="p-2 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-700 dark:text-slate-300 hover:border-emerald-500/50 cursor-pointer flex items-center justify-between transition-colors"
                          >
                            <span className="font-medium truncate">{nodeMap[e.source]?.name || e.source}</span>
                            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">{e.protocol}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      Downstream Consumers ({downstreamEdges.length})
                    </span>
                    <div className="mt-1.5 space-y-1">
                      {downstreamEdges.length === 0 ? (
                        <div className="text-[11px] text-slate-400 dark:text-slate-500 italic">Terminal consumption endpoint</div>
                      ) : (
                        downstreamEdges.map((e) => (
                          <div
                            key={e.id}
                            onClick={() => setSelectedNodeId(e.target)}
                            className="p-2 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-700 dark:text-slate-300 hover:border-emerald-500/50 cursor-pointer flex items-center justify-between transition-colors"
                          >
                            <span className="font-medium truncate">{nodeMap[e.target]?.name || e.target}</span>
                            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">{e.protocol}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
