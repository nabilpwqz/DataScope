import { describe, it, expect } from 'vitest';
import { validateLineageGraph, LineageNode, LineageEdge } from '@/lib/lineage/graph-validator';

describe('Lineage Graph Validator', () => {
  it('validates graph edges against existing nodes', () => {
    const nodes: LineageNode[] = [
      { id: 'src-1', name: 'CRM Source', type: 'source' },
      { id: 'pipe-1', name: 'CDC Worker', type: 'pipeline' },
    ];
    const edges: LineageEdge[] = [{ source: 'src-1', target: 'pipe-1' }];
    const res = validateLineageGraph(nodes, edges);
    expect(res.isValid).toBe(true);
    expect(res.nodeCount).toBe(2);
  });

  it('detects orphaned edges referencing missing nodes', () => {
    const nodes: LineageNode[] = [{ id: 'src-1', name: 'CRM', type: 'source' }];
    const edges: LineageEdge[] = [{ source: 'src-1', target: 'missing-node' }];
    const res = validateLineageGraph(nodes, edges);
    expect(res.isValid).toBe(false);
    expect(res.invalidEdges.length).toBe(1);
  });
});
