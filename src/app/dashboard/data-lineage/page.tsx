'use client';

import React, { useState } from 'react';
import { useGetDataLineageQuery } from '@/store/services/dataScopeApi';
import { DataLineageNode } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  IconGitBranch,
  IconDatabase,
  IconServer,
  IconRefresh,
  IconShield,
  IconArrowRight,
} from '@/components/ui/icons';

export default function DataLineagePage() {
  const { data: graph, isLoading, isFetching, refetch } = useGetDataLineageQuery();
  const [selectedNodeId, setSelectedNodeId] = useState<string>('ds-sales-01');

  const selectedNode = graph?.nodes.find((n) => n.id === selectedNodeId) || graph?.nodes[0];

  const upstreamEdges = graph?.edges.filter((e) => e.target === selectedNode?.id) || [];
  const downstreamEdges = graph?.edges.filter((e) => e.source === selectedNode?.id) || [];

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'source':
        return IconServer;
      case 'pipeline':
        return IconGitBranch;
      case 'dataset':
        return IconDatabase;
      case 'consumer':
      default:
        return IconShield;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success" size="sm">Active</Badge>;
      case 'syncing':
        return <Badge variant="warning" size="sm">Syncing</Badge>;
      case 'idle':
        return <Badge variant="default" size="sm">Idle</Badge>;
      default:
        return <Badge variant="default" size="sm">{status}</Badge>;
    }
  };

  const sources = graph?.nodes.filter((n) => n.type === 'source') || [];
  const pipelines = graph?.nodes.filter((n) => n.type === 'pipeline') || [];
  const datasets = graph?.nodes.filter((n) => n.type === 'dataset') || [];
  const consumers = graph?.nodes.filter((n) => n.type === 'consumer') || [];

  return (
    <div className="flex-1 space-y-6 p-4 sm:p-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <IconGitBranch className="h-6 w-6 text-emerald-400" />
              <span>Enterprise Data Lineage Graph</span>
            </h1>
            <Badge variant="success" size="sm">
              Live Topology
            </Badge>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            End-to-end data provenance tracking from origin ingestion sources to consumer query endpoints.
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
            <span>Refresh Topology</span>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-24 text-center text-xs text-slate-400">
          Constructing pipeline provenance graph and verifying node heartbeats...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Visual Pipeline Columns */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-4 rounded-lg border border-slate-800 bg-slate-900">
              <div className="text-xs font-semibold text-slate-400 mb-4 flex items-center justify-between">
                <span>Provenance Flow Stages</span>
                <span className="text-[11px] text-slate-500">Click any component to inspect metadata</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {/* Column 1: Sources */}
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-emerald-400 border-b border-slate-800 pb-1.5">
                    1. Data Sources
                  </div>
                  <div className="space-y-2">
                    {sources.map((node) => {
                      const isSelected = selectedNode?.id === node.id;
                      const Icon = getNodeIcon(node.type);
                      return (
                        <div
                          key={node.id}
                          onClick={() => setSelectedNodeId(node.id)}
                          className={`p-3 rounded-md border cursor-pointer transition-colors ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-950/40 text-white'
                              : 'border-slate-800 bg-slate-950/80 hover:border-slate-700 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-emerald-400 shrink-0" />
                            <div className="font-semibold text-xs truncate">{node.name}</div>
                          </div>
                          <div className="mt-2 flex items-center justify-between text-[11px]">
                            <span className="text-slate-400 font-mono">Source</span>
                            {getStatusBadge(node.status)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Column 2: Pipelines */}
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-emerald-400 border-b border-slate-800 pb-1.5">
                    2. Ingestion & Index
                  </div>
                  <div className="space-y-2">
                    {pipelines.map((node) => {
                      const isSelected = selectedNode?.id === node.id;
                      const Icon = getNodeIcon(node.type);
                      return (
                        <div
                          key={node.id}
                          onClick={() => setSelectedNodeId(node.id)}
                          className={`p-3 rounded-md border cursor-pointer transition-colors ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-950/40 text-white'
                              : 'border-slate-800 bg-slate-950/80 hover:border-slate-700 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-emerald-400 shrink-0" />
                            <div className="font-semibold text-xs truncate">{node.name}</div>
                          </div>
                          <div className="mt-2 flex items-center justify-between text-[11px]">
                            <span className="text-slate-400 font-mono">Worker</span>
                            {getStatusBadge(node.status)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Column 3: Datasets */}
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-emerald-400 border-b border-slate-800 pb-1.5">
                    3. Managed Datasets
                  </div>
                  <div className="space-y-2">
                    {datasets.map((node) => {
                      const isSelected = selectedNode?.id === node.id;
                      const Icon = getNodeIcon(node.type);
                      return (
                        <div
                          key={node.id}
                          onClick={() => setSelectedNodeId(node.id)}
                          className={`p-3 rounded-md border cursor-pointer transition-colors ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-950/40 text-white'
                              : 'border-slate-800 bg-slate-950/80 hover:border-slate-700 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-emerald-400 shrink-0" />
                            <div className="font-semibold text-xs truncate">{node.name}</div>
                          </div>
                          <div className="mt-2 flex items-center justify-between text-[11px]">
                            <span className="text-slate-400 font-mono">
                              {node.metadata.records ? `${node.metadata.records.toLocaleString()} rows` : 'Table'}
                            </span>
                            {getStatusBadge(node.status)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Column 4: Consumers */}
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-emerald-400 border-b border-slate-800 pb-1.5">
                    4. Downstream
                  </div>
                  <div className="space-y-2">
                    {consumers.map((node) => {
                      const isSelected = selectedNode?.id === node.id;
                      const Icon = getNodeIcon(node.type);
                      return (
                        <div
                          key={node.id}
                          onClick={() => setSelectedNodeId(node.id)}
                          className={`p-3 rounded-md border cursor-pointer transition-colors ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-950/40 text-white'
                              : 'border-slate-800 bg-slate-950/80 hover:border-slate-700 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-emerald-400 shrink-0" />
                            <div className="font-semibold text-xs truncate">{node.name}</div>
                          </div>
                          <div className="mt-2 flex items-center justify-between text-[11px]">
                            <span className="text-slate-400 font-mono">Consumer</span>
                            {getStatusBadge(node.status)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Ingestion & Dependency Protocols Table */}
            <div className="rounded-lg border border-slate-800 bg-slate-900 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                <h3 className="text-xs font-semibold text-white">Lineage Relationship Matrix</h3>
                <span className="text-[11px] text-slate-400">{graph?.edges.length ?? 0} active links</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-2.5">Source Entity</th>
                      <th className="px-4 py-2.5">Target Destination</th>
                      <th className="px-4 py-2.5">Protocol</th>
                      <th className="px-4 py-2.5">Channel Security</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {graph?.edges.map((edge) => (
                      <tr key={edge.id} className="hover:bg-slate-800/40">
                        <td className="px-4 py-2.5 font-medium text-white">{edge.source}</td>
                        <td className="px-4 py-2.5 font-medium text-emerald-400 flex items-center gap-1.5">
                          <IconArrowRight className="h-3 w-3 text-slate-500" />
                          <span>{edge.target}</span>
                        </td>
                        <td className="px-4 py-2.5 font-mono text-[11px] text-slate-400">{edge.protocol}</td>
                        <td className="px-4 py-2.5">
                          <span className="px-2 py-0.5 rounded border border-slate-700 bg-slate-800 text-[11px]">
                            {edge.label || 'Authenticated'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Node Inspector Sidebar */}
          <div className="space-y-4">
            {selectedNode ? (
              <div className="p-5 rounded-lg border border-slate-800 bg-slate-900 space-y-4 sticky top-20">
                <div className="border-b border-slate-800 pb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-emerald-400 capitalize">
                      {selectedNode.type} Node
                    </span>
                    {getStatusBadge(selectedNode.status)}
                  </div>
                  <h2 className="mt-1 text-base font-bold text-white">{selectedNode.name}</h2>
                  <p className="mt-1 text-xs text-slate-400">{selectedNode.description}</p>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Node Identifier:</span>
                    <span className="font-mono text-slate-200">{selectedNode.id}</span>
                  </div>

                  {selectedNode.metadata.owner && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Engineering Owner:</span>
                      <span className="text-slate-200 font-medium">{selectedNode.metadata.owner}</span>
                    </div>
                  )}

                  {selectedNode.metadata.records !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Indexed Rows:</span>
                      <span className="font-mono text-white font-semibold">
                        {selectedNode.metadata.records.toLocaleString()}
                      </span>
                    </div>
                  )}

                  {selectedNode.metadata.lastSync && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Sync Cadence:</span>
                      <span className="text-slate-300">{selectedNode.metadata.lastSync}</span>
                    </div>
                  )}

                  {selectedNode.metadata.destination && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Default Target:</span>
                      <span className="text-slate-300 font-mono text-[11px]">
                        {selectedNode.metadata.destination}
                      </span>
                    </div>
                  )}
                </div>

                {/* Upstream & Downstream Connected Entities */}
                <div className="border-t border-slate-800 pt-3 space-y-3">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400">
                      Upstream Feeds ({upstreamEdges.length})
                    </span>
                    <div className="mt-1 space-y-1">
                      {upstreamEdges.length === 0 ? (
                        <div className="text-[11px] text-slate-500 italic">Top-level primary origin</div>
                      ) : (
                        upstreamEdges.map((e) => (
                          <div
                            key={e.id}
                            onClick={() => setSelectedNodeId(e.source)}
                            className="p-1.5 rounded border border-slate-800 bg-slate-950 text-xs text-slate-300 hover:border-emerald-500/50 cursor-pointer flex items-center justify-between"
                          >
                            <span className="truncate">{e.source}</span>
                            <span className="text-[10px] font-mono text-emerald-400">{e.protocol}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-slate-400">
                      Downstream Consumers ({downstreamEdges.length})
                    </span>
                    <div className="mt-1 space-y-1">
                      {downstreamEdges.length === 0 ? (
                        <div className="text-[11px] text-slate-500 italic">Terminal consumption endpoint</div>
                      ) : (
                        downstreamEdges.map((e) => (
                          <div
                            key={e.id}
                            onClick={() => setSelectedNodeId(e.target)}
                            className="p-1.5 rounded border border-slate-800 bg-slate-950 text-xs text-slate-300 hover:border-emerald-500/50 cursor-pointer flex items-center justify-between"
                          >
                            <span className="truncate">{e.target}</span>
                            <span className="text-[10px] font-mono text-emerald-400">{e.protocol}</span>
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
