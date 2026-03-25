import { describe, expect, it } from 'vitest';
import { connectionAlreadyExists, resolveWorkflowConnection } from '@/lib/workflow-connections';

describe('resolveWorkflowConnection', () => {
  it('creates a directed edge from output to input', () => {
    expect(
      resolveWorkflowConnection(
        { nodeId: 'node-a', port: 'output' },
        { nodeId: 'node-b', port: 'input' }
      )
    ).toEqual({ source: 'node-a', target: 'node-b' });
  });

  it('normalizes reversed drag direction to source/target', () => {
    expect(
      resolveWorkflowConnection(
        { nodeId: 'node-a', port: 'input' },
        { nodeId: 'node-b', port: 'output' }
      )
    ).toEqual({ source: 'node-b', target: 'node-a' });
  });

  it('rejects self-connections and same-port connections', () => {
    expect(
      resolveWorkflowConnection(
        { nodeId: 'node-a', port: 'output' },
        { nodeId: 'node-a', port: 'input' }
      )
    ).toBeNull();

    expect(
      resolveWorkflowConnection(
        { nodeId: 'node-a', port: 'output' },
        { nodeId: 'node-b', port: 'output' }
      )
    ).toBeNull();
  });
});

describe('connectionAlreadyExists', () => {
  it('detects duplicate directed edges', () => {
    const edges = [
      { id: 'edge-1', source: 'node-a', target: 'node-b' },
      { id: 'edge-2', source: 'node-c', target: 'node-d' },
    ];

    expect(connectionAlreadyExists(edges, { source: 'node-a', target: 'node-b' })).toBe(true);
    expect(connectionAlreadyExists(edges, { source: 'node-b', target: 'node-a' })).toBe(false);
  });
});
