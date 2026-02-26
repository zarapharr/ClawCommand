import type { Agent, CronJob, Session } from '@/types';
import { mockAgents, mockCronJobs, mockSessions } from '@/data/mock-data';
import { defaultEnvironmentProfile } from '@/config/environment-profile';
import { redactValue } from '@/lib/environment-session';

export type RuntimeSource = 'live' | 'fallback';

export interface RuntimeFeed<T> {
  data: T;
  source: RuntimeSource;
  path: string;
  note?: string;
}

export interface OperatorAuditEntry {
  id: string;
  timestamp: string;
  targetType: 'agent' | 'session' | 'cron';
  targetId: string;
  action: 'start' | 'stop' | 'retry' | 'kill' | 'escalate';
  actor: string;
  source: RuntimeSource;
  payloadPreview: string;
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
  interaction: 'clawcommand.interaction.stats',
  diagnostics: 'clawcommand.runtime.diagnostics',
};

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

function getRuntimeCollection<T>(candidatePath: string, localStorageKey: string, fallback: T): RuntimeFeed<T> {
  const blob = runtimeBlob();
  const fromBlob = candidatePath.split('.').reduce<unknown>((acc, key) => {
    if (!acc || typeof acc !== 'object') return undefined;
    return (acc as Record<string, unknown>)[key];
  }, blob);

  if (fromBlob) {
    return { data: fromBlob as T, source: 'live', path: `window.__CLAWCOMMAND_RUNTIME__.${candidatePath}` };
  }

  if (typeof window !== 'undefined') {
    const fromStorage = safeJsonParse<T>(localStorage.getItem(localStorageKey));
    if (fromStorage) {
      return { data: fromStorage, source: 'live', path: `localStorage:${localStorageKey}` };
    }
  }

  return {
    data: fallback,
    source: 'fallback',
    path: `mock:${localStorageKey}`,
    note: 'No runtime adapter data detected, using safe fallback.',
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

export function appendOperatorAudit(entry: Omit<OperatorAuditEntry, 'id' | 'timestamp'>): OperatorAuditEntry {
  const fullEntry: OperatorAuditEntry = {
    ...entry,
    id: `audit-${Date.now()}`,
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

  if (endpoint) {
    await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...input, payloadPreview }),
    });
  }

  return appendOperatorAudit({
    action: input.action,
    actor: 'mission-control-ui',
    source: input.source,
    targetId: input.targetId,
    targetType: input.targetType,
    payloadPreview,
  });
}
