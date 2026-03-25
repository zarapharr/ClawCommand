import type { WorkflowEdge } from '@/types/enterprise';

export type WorkflowPort = 'input' | 'output';

export interface ConnectionEndpoint {
  nodeId: string;
  port: WorkflowPort;
}

export interface WorkflowConnection {
  source: string;
  target: string;
}

export function resolveWorkflowConnection(
  start: ConnectionEndpoint,
  end: ConnectionEndpoint
): WorkflowConnection | null {
  if (start.nodeId === end.nodeId) return null;
  if (start.port === end.port) return null;

  return start.port === 'output'
    ? { source: start.nodeId, target: end.nodeId }
    : { source: end.nodeId, target: start.nodeId };
}

export function connectionAlreadyExists(
  edges: WorkflowEdge[],
  connection: WorkflowConnection
): boolean {
  return edges.some((edge) => edge.source === connection.source && edge.target === connection.target);
}
