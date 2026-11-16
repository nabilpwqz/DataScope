/**
 * Data lineage graph validation and connectivity verification.
 */

export interface LineageNode {
  id: string;
  name: string;
  type: 'source' | 'pipeline' | 'dataset' | 'consumer';
}

export interface LineageEdge {
  source: string;
  target: string;
}

export function validateLineageGraph(nodes: LineageNode[], edges: LineageEdge[]) {
  const nodeIds = new Set(nodes.map((n) => n.id));
  const invalidEdges = edges.filter((e) => !nodeIds.has(e.source) || !nodeIds.has(e.target));

  return {
    isValid: invalidEdges.length === 0,
    nodeCount: nodes.length,
    edgeCount: edges.length,
    invalidEdges,
  };
}
