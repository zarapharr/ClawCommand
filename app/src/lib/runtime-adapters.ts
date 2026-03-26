import type { Agent, CronJob, Session } from '@/types';
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

type LedgerSnapshot = {
  audit?: OperatorAuditEntry[];
  decisions?: DecisionLogEntry[];
  adapterHealth?: 'ok' | 'degraded' | 'offline';
  lastSyncAt?: string;
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
  ledgerStatus: 'clawcommand.runtime.ledger.status',
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

type LedgerAdapterHealth = {
  adapterHealth: 'ok' | 'degraded' | 'offline';
  note?: string;
  lastSyncAt?: string;
};

function readLedgerStatus(): LedgerAdapterHealth {
  if (typeof window === 'undefined') {
    return { adapterHealth: 'degraded', note: 'No browser runtime context available.' };
  }

  return safeJsonParse<LedgerAdapterHealth>(localStorage.getItem(STORAGE_KEYS.ledgerStatus)) ?? {
    adapterHealth: 'degraded',
    note: 'Ledger endpoint not configured. Running in local ledger mode.',
  };
}

function writeLedgerStatus(status: LedgerAdapterHealth): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.ledgerStatus, JSON.stringify(status));
}

function getLastSyncAt(blob: RuntimeBlob): string | undefined {
  if (blob.diagnostics?.lastSyncAt) return blob.diagnostics.lastSyncAt;
  if (typeof window === 'undefined') return undefined;
  const diagnostics = safeJsonParse<{ lastSyncAt?: string }>(localStorage.getItem(STORAGE_KEYS.diagnostics));
  if (diagnostics?.lastSyncAt) return diagnostics.lastSyncAt;
  return readLedgerStatus().lastSyncAt;
}

function toHealth(source: RuntimeSource, stale: boolean, adapterHealth?: 'ok' | 'degraded' | 'offline'): HealthState {
  if (adapterHealth === 'offline') return 'offline';
  if (source === 'fallback') return 'offline';
  if (stale || adapterHealth === 'degraded') return 'degraded';
  return 'healthy';
}

export function formatFreshnessLabel(lastSyncAt?: string, freshnessMs?: number): string {
  if (!lastSyncAt && freshnessMs === undefined) return 'unknown';

  const ageMs = freshnessMs ?? (lastSyncAt ? Date.now() - new Date(lastSyncAt).getTime() : undefined);
  if (ageMs === undefined || Number.isNaN(ageMs)) return 'unknown';

  if (ageMs < 1_000) return 'just now';
  const seconds = Math.floor(ageMs / 1_000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

function getRuntimeCollection<T>(candidatePath: string, localStorageKey: string, fallback: T): RuntimeFeed<T> {
  const blob = runtimeBlob();
  const fromBlob = candidatePath.split('.').reduce<unknown>((acc, key) => {
    if (!acc || typeof acc !== 'object') return undefined;
    return (acc as Record<string, unknown>)[key];
  }, blob);

  const lastSyncAt = getLastSyncAt(blob);
  const freshnessMs = lastSyncAt ? Date.now() - new Date(lastSyncAt).getTime() : undefined;
  const stale = freshnessMs === undefined ? true : freshnessMs > STALE_AFTER_MS;
  const adapterHealth = blob.diagnostics?.adapterHealth ?? readLedgerStatus().adapterHealth;

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
  return getRuntimeCollection<Agent[]>('agents', STORAGE_KEYS.agents, []);
}

export function getSessionsFeed(): RuntimeFeed<Session[]> {
  return getRuntimeCollection<Session[]>('sessions', STORAGE_KEYS.sessions, []);
}

export function getCronFeed(): RuntimeFeed<CronJob[]> {
  return getRuntimeCollection<CronJob[]>('cronJobs', STORAGE_KEYS.cron, []);
}

export function getInteractionStats(): RuntimeFeed<{ totalMessages: number; activeSessions: number; errorsLastHour: number }> {
  return getRuntimeCollection('interactionStats', STORAGE_KEYS.interaction, {
    totalMessages: 0,
    activeSessions: 0,
    errorsLastHour: 0,
  });
}

export function getDiagnostics(): RuntimeFeed<{ adapterHealth: 'ok' | 'degraded' | 'offline'; lastSyncAt: string }> {
  const feed = getRuntimeCollection<{ adapterHealth: 'ok' | 'degraded' | 'offline'; lastSyncAt: string }>('diagnostics', STORAGE_KEYS.diagnostics, {
    adapterHealth: 'degraded',
    lastSyncAt: new Date().toISOString(),
  });

  const ledgerStatus = readLedgerStatus();
  if (feed.source === 'fallback') {
    return {
      ...feed,
      data: {
        adapterHealth: ledgerStatus.adapterHealth,
        lastSyncAt: ledgerStatus.lastSyncAt ?? feed.data.lastSyncAt,
      },
      note: ledgerStatus.note ?? feed.note,
      health: toHealth(feed.source, feed.stale, ledgerStatus.adapterHealth),
    };
  }

  return feed;
}

function readLocalDecisionLog(): DecisionLogEntry[] {
  if (typeof window === 'undefined') return [];
  return safeJsonParse<DecisionLogEntry[]>(localStorage.getItem(STORAGE_KEYS.decisions)) ?? [];
}

function writeLocalDecisionLog(entries: DecisionLogEntry[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.decisions, JSON.stringify(entries.slice(0, 100)));
}

function readLocalOperatorAudit(): OperatorAuditEntry[] {
  if (typeof window === 'undefined') return [];
  return safeJsonParse<OperatorAuditEntry[]>(localStorage.getItem(STORAGE_KEYS.audit)) ?? [];
}

function writeLocalOperatorAudit(entries: OperatorAuditEntry[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.audit, JSON.stringify(entries.slice(0, 200)));
}

function ledgerEndpoint(): string | undefined {
  return (import.meta.env.VITE_RUNTIME_LEDGER_ENDPOINT as string | undefined)?.trim();
}

export async function reconcileOperatorLedgers(): Promise<{ decisions: DecisionLogEntry[]; audit: OperatorAuditEntry[]; degraded: boolean; note?: string }> {
  const endpoint = ledgerEndpoint();
  if (!endpoint || typeof window === 'undefined') {
    writeLedgerStatus({
      adapterHealth: endpoint ? 'degraded' : 'offline',
      note: endpoint ? 'Ledger endpoint unavailable in this runtime.' : 'Ledger endpoint not configured. Running in local ledger mode.',
      lastSyncAt: new Date().toISOString(),
    });
    return {
      decisions: readLocalDecisionLog(),
      audit: readLocalOperatorAudit(),
      degraded: true,
      note: 'Using local-only ledger storage.',
    };
  }

  try {
    const response = await fetch(endpoint, { method: 'GET', headers: { Accept: 'application/json' } });
    if (!response.ok) {
      throw new Error(`Ledger endpoint failed with status ${response.status}`);
    }

    const snapshot = (await response.json()) as LedgerSnapshot;
    const decisions = Array.isArray(snapshot.decisions) ? snapshot.decisions : [];
    const audit = Array.isArray(snapshot.audit) ? snapshot.audit : [];
    writeLocalDecisionLog(decisions);
    writeLocalOperatorAudit(audit);

    writeLedgerStatus({
      adapterHealth: snapshot.adapterHealth ?? 'ok',
      note: snapshot.adapterHealth === 'degraded' ? 'Ledger endpoint responded in degraded mode.' : undefined,
      lastSyncAt: snapshot.lastSyncAt ?? new Date().toISOString(),
    });

    return {
      decisions,
      audit,
      degraded: snapshot.adapterHealth === 'degraded',
      note: snapshot.adapterHealth === 'degraded' ? 'Ledger endpoint responded in degraded mode.' : undefined,
    };
  } catch (error) {
    writeLedgerStatus({
      adapterHealth: 'degraded',
      note: `Ledger sync failed: ${error instanceof Error ? error.message : 'unknown error'}`,
      lastSyncAt: new Date().toISOString(),
    });

    return {
      decisions: readLocalDecisionLog(),
      audit: readLocalOperatorAudit(),
      degraded: true,
      note: 'Ledger sync failed, using local cache.',
    };
  }
}

export function sanitizePayloadPreview(payload: unknown): string {
  let raw: string | undefined;
  if (typeof payload === 'string') {
    raw = payload;
  } else {
    try {
      raw = JSON.stringify(payload);
    } catch {
      raw = '[unserializable-payload]';
    }
  }

  if (!raw) return 'none';
  return redactValue(raw, defaultEnvironmentProfile.redaction).slice(0, 240);
}

async function persistLedgerEntry(kind: 'audit' | 'decision', entry: OperatorAuditEntry | DecisionLogEntry): Promise<void> {
  const endpoint = ledgerEndpoint();
  if (!endpoint || typeof window === 'undefined') return;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind, entry }),
  });

  if (!response.ok) {
    throw new Error(`Ledger write failed with status ${response.status}`);
  }

  writeLedgerStatus({ adapterHealth: 'ok', lastSyncAt: new Date().toISOString() });
}

export async function appendDecisionLog(entry: Omit<DecisionLogEntry, 'id' | 'timestamp'>): Promise<DecisionLogEntry> {
  const fullEntry: DecisionLogEntry = {
    ...entry,
    id: `decision-${Date.now()}`,
    timestamp: new Date().toISOString(),
  };

  const next = [fullEntry, ...readLocalDecisionLog()].slice(0, 100);
  writeLocalDecisionLog(next);

  try {
    await persistLedgerEntry('decision', fullEntry);
  } catch (error) {
    writeLedgerStatus({
      adapterHealth: 'degraded',
      note: `Decision persistence degraded: ${error instanceof Error ? error.message : 'unknown error'}`,
      lastSyncAt: new Date().toISOString(),
    });
  }

  return fullEntry;
}

export function readDecisionLog(): DecisionLogEntry[] {
  return readLocalDecisionLog();
}

export async function appendOperatorAudit(entry: Omit<OperatorAuditEntry, 'id' | 'timestamp' | 'commandId'>): Promise<OperatorAuditEntry> {
  const fullEntry: OperatorAuditEntry = {
    ...entry,
    id: `audit-${Date.now()}`,
    commandId: `cmd-${Date.now()}`,
    timestamp: new Date().toISOString(),
  };

  const next = [fullEntry, ...readLocalOperatorAudit()].slice(0, 200);
  writeLocalOperatorAudit(next);

  try {
    await persistLedgerEntry('audit', fullEntry);
  } catch (error) {
    writeLedgerStatus({
      adapterHealth: 'degraded',
      note: `Audit persistence degraded: ${error instanceof Error ? error.message : 'unknown error'}`,
      lastSyncAt: new Date().toISOString(),
    });
  }

  return fullEntry;
}

export function readOperatorAudit(): OperatorAuditEntry[] {
  return readLocalOperatorAudit();
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

    await appendDecisionLog({
      decision: `${input.action} ${input.targetType}:${input.targetId}`,
      reason: 'Operator invoked action from mission control UI',
      targetId: input.targetId,
      targetType: input.targetType,
    });

    return await appendOperatorAudit({
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
