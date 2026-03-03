/**
 * openclaw-api.ts
 * Typed HTTP client for the OpenClaw runtime API.
 *
 * Configuration (all optional — client degrades gracefully when absent):
 *   VITE_OPENCLAW_API_BASE  – base URL, e.g. http://localhost:3001
 *   VITE_OPENCLAW_API_TOKEN – bearer token for Authorization header
 *
 * All endpoint functions return a discriminated-union result so callers can
 * inspect `ok` without try/catch.
 */

import type { Agent, Session, Message } from '@/types';

// ─── Config ────────────────────────────────────────────────────────────────

function apiBase(): string | undefined {
  return (import.meta.env.VITE_OPENCLAW_API_BASE as string | undefined)?.replace(/\/$/, '');
}

function apiToken(): string | undefined {
  return (import.meta.env.VITE_OPENCLAW_API_TOKEN as string | undefined)?.trim() || undefined;
}

export function isApiConfigured(): boolean {
  return !!apiBase();
}

// ─── Shared types ──────────────────────────────────────────────────────────

export type ApiOk<T> = { ok: true; data: T; status: number };
export type ApiErr = { ok: false; error: string; status: number | null; retryable: boolean };
export type ApiResult<T> = ApiOk<T> | ApiErr;

// ─── Model config types ────────────────────────────────────────────────────

export interface ModelProviderConfig {
  id: string;
  name: string;
  enabled: boolean;
  apiKey?: string;
  baseUrl?: string;
  defaultModel: string;
  models: string[];
}

export interface ModelConfig {
  providers: ModelProviderConfig[];
  globalDefault?: string;
  routingEnabled?: boolean;
}

// ─── Memory types ──────────────────────────────────────────────────────────

export interface MemoryFileEntry {
  path: string;
  name: string;
  size: number;
  modifiedAt: string;
  isDirectory: boolean;
}

export interface MemoryIndex {
  files: MemoryFileEntry[];
  root: string;
}

export interface MemoryFileContent {
  path: string;
  content: string;
  size: number;
  modifiedAt: string;
}

// ─── Runtime status types ──────────────────────────────────────────────────

export interface SubagentStatus {
  id: string;
  parentSessionId: string;
  status: 'active' | 'idle' | 'completed' | 'error';
  task?: string;
  startedAt: string;
  lastActivity?: string;
}

export interface RuntimeStatus {
  agents: Agent[];
  sessions: Session[];
  subagents: SubagentStatus[];
  health: 'healthy' | 'degraded' | 'offline';
  adapterHealth: 'ok' | 'degraded' | 'offline';
  lastSyncAt: string;
}

// ─── Chat send/receive types ───────────────────────────────────────────────

export interface SendMessageRequest {
  content: string;
  attachments?: string[];
}

export interface SendMessageResponse {
  userMessage: Message;
  assistantMessage?: Message;
  sessionId: string;
  streaming?: boolean;
}

// ─── HTTP helpers ──────────────────────────────────────────────────────────

function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', Accept: 'application/json' };
  const token = apiToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function apiFetch<T>(path: string, init?: RequestInit, signal?: AbortSignal): Promise<ApiResult<T>> {
  const base = apiBase();
  if (!base) {
    return { ok: false, error: 'VITE_OPENCLAW_API_BASE not configured', status: null, retryable: false };
  }

  const url = `${base}${path}`;
  try {
    const response = await fetch(url, {
      ...init,
      headers: { ...buildHeaders(), ...(init?.headers ?? {}) },
      signal,
    });

    if (!response.ok) {
      const retryable = response.status >= 500 || response.status === 429;
      return { ok: false, error: `HTTP ${response.status} from ${path}`, status: response.status, retryable };
    }

    const data = (await response.json()) as T;
    return { ok: true, data, status: response.status };
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return { ok: false, error: 'Request aborted', status: null, retryable: false };
    }
    const message = err instanceof Error ? err.message : 'Network error';
    return { ok: false, error: message, status: null, retryable: true };
  }
}

// ─── Agents API ────────────────────────────────────────────────────────────

export async function fetchAgents(signal?: AbortSignal): Promise<ApiResult<Agent[]>> {
  return apiFetch<Agent[]>('/api/agents', { method: 'GET' }, signal);
}

// ─── Sessions API ──────────────────────────────────────────────────────────

export async function fetchSessions(signal?: AbortSignal): Promise<ApiResult<Session[]>> {
  return apiFetch<Session[]>('/api/sessions', { method: 'GET' }, signal);
}

export async function sendMessage(
  sessionId: string,
  request: SendMessageRequest,
  signal?: AbortSignal,
): Promise<ApiResult<SendMessageResponse>> {
  return apiFetch<SendMessageResponse>(
    `/api/sessions/${encodeURIComponent(sessionId)}/messages`,
    { method: 'POST', body: JSON.stringify(request) },
    signal,
  );
}

// ─── Models API ────────────────────────────────────────────────────────────

export async function fetchModelConfig(signal?: AbortSignal): Promise<ApiResult<ModelConfig>> {
  return apiFetch<ModelConfig>('/api/models', { method: 'GET' }, signal);
}

// ─── Memory API ────────────────────────────────────────────────────────────

export async function fetchMemoryIndex(signal?: AbortSignal): Promise<ApiResult<MemoryIndex>> {
  return apiFetch<MemoryIndex>('/api/memory', { method: 'GET' }, signal);
}

export async function fetchMemoryFile(filePath: string, signal?: AbortSignal): Promise<ApiResult<MemoryFileContent>> {
  return apiFetch<MemoryFileContent>(
    `/api/memory/${encodeURIComponent(filePath)}`,
    { method: 'GET' },
    signal,
  );
}

// ─── Runtime status API ────────────────────────────────────────────────────

export async function fetchRuntimeStatus(signal?: AbortSignal): Promise<ApiResult<RuntimeStatus>> {
  return apiFetch<RuntimeStatus>('/api/runtime/status', { method: 'GET' }, signal);
}

// ─── Action API ────────────────────────────────────────────────────────────

export interface ActionRequest {
  targetType: 'agent' | 'session' | 'cron';
  targetId: string;
  action: 'start' | 'stop' | 'retry' | 'kill' | 'escalate';
  payload?: unknown;
}

export interface ActionReceipt {
  id: string;
  commandId: string;
  status: 'success' | 'failed';
  result?: string;
  error?: string;
  timestamp: string;
}

export async function postRuntimeAction(
  request: ActionRequest,
  signal?: AbortSignal,
): Promise<ApiResult<ActionReceipt>> {
  return apiFetch<ActionReceipt>('/api/runtime/actions', { method: 'POST', body: JSON.stringify(request) }, signal);
}

// ─── Polling helpers ────────────────────────────────────────────────────────

const STORAGE_WRITE_KEYS = {
  agents: 'clawcommand.runtime.agents',
  sessions: 'clawcommand.runtime.sessions',
  diagnostics: 'clawcommand.runtime.diagnostics',
};

/**
 * Polls the runtime status endpoint and writes to localStorage so that the
 * existing `getRuntimeCollection` / `useRuntimeFeed` pipeline picks up live data.
 * Returns a cleanup function to cancel the interval.
 */
export function startRuntimePolling(intervalMs = 15_000): () => void {
  let active = true;

  const poll = async () => {
    if (!active || typeof window === 'undefined') return;
    const result = await fetchRuntimeStatus();
    if (result.ok) {
      const { agents, sessions, health, lastSyncAt } = result.data;
      localStorage.setItem(STORAGE_WRITE_KEYS.agents, JSON.stringify(agents));
      localStorage.setItem(STORAGE_WRITE_KEYS.sessions, JSON.stringify(sessions));
      localStorage.setItem(
        STORAGE_WRITE_KEYS.diagnostics,
        JSON.stringify({ adapterHealth: health === 'healthy' ? 'ok' : health, lastSyncAt }),
      );
    }
  };

  void poll();
  const id = window.setInterval(poll, intervalMs);

  return () => {
    active = false;
    clearInterval(id);
  };
}
