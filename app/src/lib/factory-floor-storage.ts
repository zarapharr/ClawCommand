export const FACTORY_LAYOUT_STORAGE_KEY = 'clawcommand.factory.layout';
export const FACTORY_EDGES_STORAGE_KEY = 'clawcommand.factory.edges';

export interface FactoryAgentPosition {
  x: number;
  y: number;
}

export type FactoryLayout = Record<string, FactoryAgentPosition>;

export interface ManualFactoryEdge {
  from: string;
  to: string;
}

export function normalizeFactoryEdges(edges: ManualFactoryEdge[]): ManualFactoryEdge[] {
  const seen = new Set<string>();
  const next: ManualFactoryEdge[] = [];

  for (const edge of edges) {
    const from = edge.from?.trim();
    const to = edge.to?.trim();
    if (!from || !to || from === to) continue;
    const key = `${from}->${to}`;
    if (seen.has(key)) continue;
    seen.add(key);
    next.push({ from, to });
  }

  return next;
}

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 50;
  return Math.max(5, Math.min(95, value));
}

export function loadFactoryLayout(): FactoryLayout {
  const parsed = safeParse<Record<string, { x?: number; y?: number }>>(localStorage.getItem(FACTORY_LAYOUT_STORAGE_KEY));
  if (!parsed || typeof parsed !== 'object') return {};

  const next: FactoryLayout = {};
  for (const [agentId, position] of Object.entries(parsed)) {
    if (!position || typeof position !== 'object') continue;
    next[agentId] = {
      x: clampPercent(Number(position.x)),
      y: clampPercent(Number(position.y)),
    };
  }
  return next;
}

export function saveFactoryLayout(layout: FactoryLayout): void {
  localStorage.setItem(FACTORY_LAYOUT_STORAGE_KEY, JSON.stringify(layout));
}

export function loadFactoryEdges(): ManualFactoryEdge[] {
  const parsed = safeParse<Array<{ from?: string; to?: string }>>(localStorage.getItem(FACTORY_EDGES_STORAGE_KEY));
  if (!Array.isArray(parsed)) return [];

  return normalizeFactoryEdges(parsed.map((edge) => ({ from: edge.from || '', to: edge.to || '' })));
}

export function saveFactoryEdges(edges: ManualFactoryEdge[]): void {
  localStorage.setItem(FACTORY_EDGES_STORAGE_KEY, JSON.stringify(normalizeFactoryEdges(edges)));
}

export function clearFactoryFloorStorage(): void {
  localStorage.removeItem(FACTORY_LAYOUT_STORAGE_KEY);
  localStorage.removeItem(FACTORY_EDGES_STORAGE_KEY);
}
