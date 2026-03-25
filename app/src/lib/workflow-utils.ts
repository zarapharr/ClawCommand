import type { WorkflowEdge, WorkflowNode } from '@/types/enterprise';

export interface WorkflowViewport {
  scrollLeft: number;
  scrollTop: number;
  clientWidth: number;
  clientHeight: number;
}

export function createStarterWorkflowGraph(): {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
} {
  const inputId = `node-${Date.now()}`;
  const outputId = `node-${Date.now() + 1}`;

  return {
    nodes: [
      { id: inputId, type: 'input', position: { x: 150, y: 250 }, config: {} },
      { id: outputId, type: 'output', position: { x: 550, y: 250 }, config: {} },
    ],
    edges: [
      { id: `edge-${Date.now()}`, source: inputId, target: outputId },
    ],
  };
}

export function getDefaultNodePosition(
  existingNodes: WorkflowNode[],
  viewport?: WorkflowViewport
): WorkflowNode['position'] {
  const index = existingNodes.length;
  const col = index % 4;
  const row = Math.floor(index / 4);

  const anchorX = viewport ? viewport.scrollLeft + viewport.clientWidth / 2 : 350;
  const anchorY = viewport ? viewport.scrollTop + viewport.clientHeight / 2 : 250;

  return {
    x: Math.max(80, Math.round(anchorX + (col - 1.5) * 90)),
    y: Math.max(80, Math.round(anchorY + row * 90)),
  };
}

export function getDefaultNodeConfig(type: WorkflowNode['type']): WorkflowNode['config'] {
  if (type === 'agent' || type === 'supervisor') {
    return { agentId: '', agentName: '', timeoutSeconds: 300, retryOnFailure: true };
  }

  if (type === 'decision') {
    return { condition: '' };
  }

  return {};
}
