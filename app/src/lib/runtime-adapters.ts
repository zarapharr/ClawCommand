import type { Agent, CronJob, Session } from '@/types';
import { mockAgents, mockCronJobs, mockSessions } from '@/data/mock-data';
import { defaultEnvironmentProfile } from '@/config/environment-profile';
import { redactValue } from '@/lib/environment-session';

export type RuntimeSource = 'live' | 'fallback';
export type HealthState = 'healthy' | 'degraded' | 'offline';

export interface RuntimeFeed<T> {
  data: T;
  source: RuntimeSource;
  path: string;
  note?: string;
  lastSyncAt?: string;
  freshnessMs?: number;
  health: HealthState;
  stale: boolean;
}

export interface OperatorAuditEntry {
  id: string;
  commandId: string;
  timestamp: string;
  targetType: 'agent' | 'session' | 'cron';
  targetId: string;
  action: 'start' | 'stop' | 'retry' | 'kill' | 'escalate';
  actor: string;
  source: RuntimeSource;
  payloadPreview: string;
  status: 'success' | 'failed';
  result?: string;
  error?: string;
}

export interface DecisionLogEntry {
  id: string;
  timestamp: string;
  decision: string;
  reason: string;
  targetType: OperatorAuditEntry['targetType'];
  targetId: string;
}

type RuntimeBlob = {
  agents?: Agent[];
  sessions?: Session[];
  cronJobs?: CronJob[];
  interactionStats?: {
    totalMessages: number;
    activeSessions: number;
    errorsLastHour: number;
  };
  diagnostics?: {
    adapterHealth: 'ok' | 'degraded' | 'offline';
    lastSyncAt: string;
  };
};

const STORAGE_KEYS = {
  runtime: 'clawcommand.runtime',
  agents: 'clawcommand.runtime.agents',
  sessions: 'clawcommand.runtime.sessions',
  cron: 'clawcommand.runtime.cron',
  audit: 'clawcommand.audit.actions',
  decisions: 'clawcommand.operator.decisions',
  interaction: 'clawcommand.interaction.stats',
  diagnostics: 'clawcommand.runtime.diagnostics',
};

const STALE_AFTER_MS = 90_000;

function isProduction(): boolean {
  return (import.meta.env.MODE === 'production') || (import.meta.env.VITE_DISABLE_MOCK_FALLBACK === '1');
}

function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function runtimeBlob(): RuntimeBlob {
  if (typeof window === 'undefined') return {};

  const globalBlob = (window as Window & { __CLAWCOMMAND_RUNTIME__?: RuntimeBlob }).__CLAWCOMMAND_RUNTIME__;
  if (globalBlob) return globalBlob;

  const localBlob = safeJsonParse<RuntimeBlob>(localStorage.getItem(STORAGE_KEYS.runtime));
  return localBlob ?? {};
}

function getLastSyncAt(blob: RuntimeBlob): string | undefined {
  if (blob.diagnostics?.lastSyncAt) return blob.diagnostics.lastSyncAt;
  if (typeof window === 'undefined') return undefined;
  const diagnostics = safeJsonParse<{ lastSyncAt?: string }>(localStorage.getItem(STORAGE_KEYS.diagnostics));
  return diagnostics?.lastSyncAt;
}

function toHealth(source: RuntimeSource, stale: boolean, adapterHealth?: 'ok' | 'degraded' | 'offline'): HealthState {
  if (adapterHealth === 'offline') return 'offline';
  if (source === 'fallback') return 'offline';
  if (stale || adapterHealth === 'degraded') return 'degraded';
  return 'healthy';
}

function getRuntimeCollection<T>(candidatePath: string, localStorageKey: string, fallback: T): RuntimeFeed<T> {
  const blob = runtimeBlob();
  const fromBlob = candidatePath.split('.').reduce<unknown>((acc, key) => {
    if (!acc || typeof acc !== 'object') return undefined;
    return (acc as Record<string, unknown>)[key];
  }, blob);

  const lastSyncAt = getLastSyncAt(blob);
  const freshnessMs = lastSyncAt ? Date.now() - new Date(lastSyncAt).getTime() : undefined;
  const stale = freshnessMs !== undefined && freshnessMs > STALE_AFTER_MS;
  const adapterHealth = blob.diagnostics?.adapterHealth;

  if (fromBlob) {
    const source: RuntimeSource = 'live';
    return {
      data: fromBlob as T,
      source,
      path: `window.__CLAWCOMMAND_RUNTIME__.${candidatePath}`,
      lastSyncAt,
      freshnessMs,
      stale,
      health: toHealth(source, stale, adapterHealth),
    };
  }

  if (typeof window !== 'undefined') {
    const fromStorage = safeJsonParse<T>(localStorage.getItem(localStorageKey));
    if (fromStorage) {
      const source: RuntimeSource = 'live';
      return {
        data: fromStorage,
        source,
        path: `localStorage:${localStorageKey}`,
        lastSyncAt,
        freshnessMs,
        stale,
        health: toHealth(source, stale, adapterHealth),
      };
    }
  }

  if (isProduction()) {
    return {
      data: Array.isArray(fallback) ? [] as T : fallback,
      source: 'fallback',
      path: `disabled-fallback:${localStorageKey}`,
      note: 'Runtime adapter data unavailable. Mock fallback disabled for production readiness.',
      lastSyncAt,
      freshnessMs,
      stale: true,
      health: 'offline',
    };
  }

  return {
    data: fallback,
    source: 'fallback',
    path: `mock:${localStorageKey}`,
    note: 'No runtime adapter data detected, using safe fallback.',
    lastSyncAt,
    freshnessMs,
    stale: true,
    health: 'degraded',
  };
}

export function getAgentsFeed(): RuntimeFeed<Agent[]> {
  return getRuntimeCollection<Agent[]>('agents', STORAGE_KEYS.agents, mockAgents);
}

export function getSessionsFeed(): RuntimeFeed<Session[]> {
  return getRuntimeCollection<Session[]>('sessions', STORAGE_KEYS.sessions, mockSessions);
}

export function getCronFeed(): RuntimeFeed<CronJob[]> {
  return getRuntimeCollection<CronJob[]>('cronJobs', STORAGE_KEYS.cron, mockCronJobs);
}

export function getInteractionStats(): RuntimeFeed<{ totalMessages: number; activeSessions: number; errorsLastHour: number }> {
  return getRuntimeCollection('interactionStats', STORAGE_KEYS.interaction, {
    totalMessages: mockSessions.reduce((acc, s) => acc + s.messageCount, 0),
    activeSessions: mockSessions.filter((s) => s.status === 'active').length,
    errorsLastHour: mockAgents.filter((a) => a.status === 'error').length,
  });
}

export function getDiagnostics(): RuntimeFeed<{ adapterHealth: 'ok' | 'degraded' | 'offline'; lastSyncAt: string }> {
  return getRuntimeCollection('diagnostics', STORAGE_KEYS.diagnostics, {
    adapterHealth: 'degraded',
    lastSyncAt: new Date().toISOString(),
  });
}

export function sanitizePayloadPreview(payload: unknown): string {
  const raw = typeof payload === 'string' ? payload : JSON.stringify(payload);
  if (!raw) return 'none';
  return redactValue(raw, defaultEnvironmentProfile.redaction).slice(0, 240);
}

export function appendDecisionLog(entry: Omit<DecisionLogEntry, 'id' | 'timestamp'>): DecisionLogEntry {
  const fullEntry: DecisionLogEntry = {
    ...entry,
    id: `decision-${Date.now()}`,
    timestamp: new Date().toISOString(),
  };

  if (typeof window === 'undefined') return fullEntry;
  const existing = safeJsonParse<DecisionLogEntry[]>(localStorage.getItem(STORAGE_KEYS.decisions)) ?? [];
  localStorage.setItem(STORAGE_KEYS.decisions, JSON.stringify([fullEntry, ...existing].slice(0, 100)));
  return fullEntry;
}

export function readDecisionLog(): DecisionLogEntry[] {
  if (typeof window === 'undefined') return [];
  return safeJsonParse<DecisionLogEntry[]>(localStorage.getItem(STORAGE_KEYS.decisions)) ?? [];
}

export function appendOperatorAudit(entry: Omit<OperatorAuditEntry, 'id' | 'timestamp' | 'commandId'>): OperatorAuditEntry {
  const fullEntry: OperatorAuditEntry = {
    ...entry,
    id: `audit-${Date.now()}`,
    commandId: `cmd-${Date.now()}`,
    timestamp: new Date().toISOString(),
  };

  if (typeof window === 'undefined') return fullEntry;

  const existing = safeJsonParse<OperatorAuditEntry[]>(localStorage.getItem(STORAGE_KEYS.audit)) ?? [];
  localStorage.setItem(STORAGE_KEYS.audit, JSON.stringify([fullEntry, ...existing].slice(0, 200)));
  return fullEntry;
}

export function readOperatorAudit(): OperatorAuditEntry[] {
  if (typeof window === 'undefined') return [];
  return safeJsonParse<OperatorAuditEntry[]>(localStorage.getItem(STORAGE_KEYS.audit)) ?? [];
}

export async function runOperatorAction(input: {
  targetType: OperatorAuditEntry['targetType'];
  targetId: string;
  action: OperatorAuditEntry['action'];
  payload?: unknown;
  source: RuntimeSource;
}): Promise<OperatorAuditEntry> {
  const endpoint = (import.meta.env.VITE_RUNTIME_ACTION_ENDPOINT as string | undefined)?.trim();
  const payloadPreview = sanitizePayloadPreview(input.payload ?? {});

  try {
    if (endpoint) {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...input, payloadPreview }),
      });

      if (!response.ok) {
        throw new Error(`Action endpoint failed with status ${response.status}`);
      }
    }

    appendDecisionLog({
      decision: `${input.action} ${input.targetType}:${input.targetId}`,
      reason: 'Operator invoked action from mission control UI',
      targetId: input.targetId,
      targetType: input.targetType,
    });

    return appendOperatorAudit({
      action: input.action,
      actor: 'mission-control-ui',
      source: input.source,
      targetId: input.targetId,
      targetType: input.targetType,
      payloadPreview,
      status: 'success',
      result: endpoint ? 'Dispatched to runtime endpoint' : 'Captured in local action ledger',
    });
  } catch (error) {
    return appendOperatorAudit({
      action: input.action,
      actor: 'mission-control-ui',
      source: input.source,
      targetId: input.targetId,
      targetType: input.targetType,
      payloadPreview,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown action failure',
    });
  }
}
