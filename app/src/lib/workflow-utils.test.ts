import { describe, expect, it } from 'vitest';
import { createStarterWorkflowGraph, getDefaultNodeConfig, getDefaultNodePosition } from '@/lib/workflow-utils';

describe('createStarterWorkflowGraph', () => {
  it('creates an edge that references existing starter nodes', () => {
    const graph = createStarterWorkflowGraph();

    expect(graph.nodes).toHaveLength(2);
    expect(graph.edges).toHaveLength(1);

    const nodeIds = new Set(graph.nodes.map((node) => node.id));
    const [edge] = graph.edges;

    expect(nodeIds.has(edge.source)).toBe(true);
    expect(nodeIds.has(edge.target)).toBe(true);
  });
});

describe('getDefaultNodePosition', () => {
  it('places a new node near the center of the visible canvas viewport', () => {
    const position = getDefaultNodePosition([], {
      scrollLeft: 200,
      scrollTop: 100,
      clientWidth: 1000,
      clientHeight: 800,
    });

    expect(position.x).toBe(565);
    expect(position.y).toBe(500);
  });
});

describe('getDefaultNodeConfig', () => {
  it('returns node-type specific defaults', () => {
    expect(getDefaultNodeConfig('agent')).toEqual({
      agentId: '',
      agentName: '',
      timeoutSeconds: 300,
      retryOnFailure: true,
    });
    expect(getDefaultNodeConfig('decision')).toEqual({ condition: '' });
    expect(getDefaultNodeConfig('input')).toEqual({});
  });
});
