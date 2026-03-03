import type { Agent, Message, Session } from '@/types';
import { agentActionMatrix, contracts, gatewayMethodMatrix, mapAgent, mapHistoryMessage, mapSession, sessionActionMatrix, type ActionMatrixKey } from '@/lib/openclaw-contract';

const DEFAULT_GATEWAY_URL = 'ws://127.0.0.1:18789';

function gatewayUrl(): string {
  return ((import.meta.env.VITE_OPENCLAW_GATEWAY_URL as string | undefined)?.trim()) || DEFAULT_GATEWAY_URL;
}

function gatewayToken(): string | undefined {
  return (import.meta.env.VITE_OPENCLAW_GATEWAY_TOKEN as string | undefined)?.trim() || undefined;
}

function gatewayPassword(): string | undefined {
  return (import.meta.env.VITE_OPENCLAW_GATEWAY_PASSWORD as string | undefined)?.trim() || undefined;
}

export function isApiConfigured(): boolean {
  return Boolean(gatewayUrl());
}

export type ApiOk<T> = { ok: true; data: T; status: number };
export type ApiErr = { ok: false; error: string; status: number | null; retryable: boolean };
export type ApiResult<T> = ApiOk<T> | ApiErr;

export interface ModelProviderConfig {
  id: string;
  name: string;
  enabled: boolean;
  apiKey?: string;
  baseUrl?: string;
  defaultModel: string;
  models: string[];
}
export interface ModelConfig { providers: ModelProviderConfig[]; }

export interface MemoryFileEntry {
  path: string;
  name: string;
  size: number;
  modifiedAt: string;
  isDirectory: boolean;
  agentId: string;
}
export interface MemoryIndex { files: MemoryFileEntry[]; root: string; agentId: string; }
export interface MemoryFileContent { path: string; content: string; size: number; modifiedAt: string; agentId: string; }

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

export interface SendMessageRequest { content: string; attachments?: string[] }
export interface SendMessageResponse { userMessage: Message; assistantMessage?: Message; sessionId: string; streaming?: boolean }

export interface ActionRequest {
  targetType: 'agent' | 'session' | 'cron';
  targetId: string;
  action: ActionMatrixKey;
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

type RpcReq = { type: 'req'; id: string; method: string; params?: Record<string, unknown> };
type RpcRes = { type: 'res'; id: string; ok: boolean; payload?: unknown; error?: { message?: string; code?: string } };
type RpcEvent = { type: 'event'; event: string; payload?: unknown };

export interface RuntimeLiveUpdate {
  kind: 'tick' | 'chat' | 'agent_status' | 'subagents' | 'unknown';
  payload: unknown;
  timestamp: string;
}

function randomId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getError(message: string, retryable = true): ApiErr {
  return { ok: false, error: message, status: null, retryable };
}

async function callGateway<T>(method: string, params: Record<string, unknown> = {}): Promise<ApiResult<T>> {
  try {
    const bridge = await fetch('/ocapi/call', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method, params }),
    });

    if (bridge.ok) {
      const payload = await bridge.json() as { ok: boolean; data?: T; error?: string };
      if (payload.ok) return { ok: true, data: payload.data as T, status: 200 };
      return { ok: false, error: payload.error || `Bridge ${method} failed.`, status: bridge.status, retryable: false };
    }
  } catch {
    // fallback to direct websocket mode below
  }

  const url = gatewayUrl();
  if (!url) return getError('Missing VITE_OPENCLAW_GATEWAY_URL.', false);

  return new Promise((resolve) => {
    const ws = new WebSocket(url);
    const reqId = randomId();
    let settled = false;
    let handshakeReady = false;

    const fail = (error: string, retryable = true) => {
      if (settled) return;
      settled = true;
      try { ws.close(); } catch {}
      resolve({ ok: false, error, status: null, retryable });
    };

    const done = (payload: unknown) => {
      if (settled) return;
      settled = true;
      try { ws.close(); } catch {}
      resolve({ ok: true, data: payload as T, status: 200 });
    };

    const sendConnect = () => {
      const auth = gatewayToken() || gatewayPassword() ? { token: gatewayToken(), password: gatewayPassword() } : undefined;
      const connectReq: RpcReq = {
        type: 'req',
        id: randomId(),
        method: 'connect',
        params: {
          minProtocol: 3,
          maxProtocol: 3,
          client: {
            id: 'gateway-client',
            displayName: 'ClawCommand',
            version: '1.0.0',
            platform: 'web',
            mode: 'ui',
            instanceId: `cc-${randomId()}`,
          },
          role: 'operator',
          scopes: ['operator.admin'],
          ...(auth ? { auth } : {}),
        },
      };
      ws.send(JSON.stringify(connectReq));
    };

    const timer = window.setTimeout(() => fail(`Gateway timeout calling ${method}.`), 10_000);

    ws.onopen = () => sendConnect();

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(String(event.data)) as RpcRes | RpcEvent;

        if (msg.type === 'event' && msg.event === 'connect.challenge') {
          sendConnect();
          return;
        }

        if (msg.type !== 'res') return;

        if (!msg.ok) {
          if (!handshakeReady) {
            clearTimeout(timer);
            fail(`Gateway connect failed: ${msg.error?.message || 'unknown error'}`, false);
            return;
          }
          if (msg.id === reqId) {
            clearTimeout(timer);
            fail(msg.error?.message ? `Gateway ${method} failed: ${msg.error.message}` : `Gateway ${method} failed.`);
          }
          return;
        }

        if (!handshakeReady) {
          handshakeReady = true;
          const req: RpcReq = { type: 'req', id: reqId, method, params };
          ws.send(JSON.stringify(req));
          return;
        }

        if (msg.id !== reqId) return;
        clearTimeout(timer);
        done(msg.payload);
      } catch (error) {
        clearTimeout(timer);
        fail(`Invalid gateway response for ${method}: ${error instanceof Error ? error.message : 'unknown parse error'}`);
      }
    };

    ws.onerror = () => {
      clearTimeout(timer);
      fail(`Cannot connect to OpenClaw gateway at ${url}. Start it with: openclaw gateway start`, false);
    };

    ws.onclose = () => {
      clearTimeout(timer);
      if (!settled) fail(`Gateway closed before ${method} response.`);
    };
  });
}

export async function fetchAgents(): Promise<ApiResult<Agent[]>> {
  const spec = gatewayMethodMatrix.agents.list;
  const res = await callGateway<unknown>(spec.method, spec.params);
  if (!res.ok) return res;
  const parsed = contracts.agentsList.safeParse(res.data);
  if (!parsed.success) return getError(`agents.list schema mismatch: ${parsed.error.issues[0]?.message || 'invalid payload'}`, false);
  return { ok: true, data: parsed.data.agents.map(mapAgent), status: 200 };
}

export async function fetchSessions(): Promise<ApiResult<Session[]>> {
  const spec = gatewayMethodMatrix.sessions.list;
  const res = await callGateway<unknown>(spec.method, spec.params);
  if (!res.ok) return res;
  const parsed = contracts.sessionsList.safeParse(res.data);
  if (!parsed.success) return getError(`sessions.list schema mismatch: ${parsed.error.issues[0]?.message || 'invalid payload'}`, false);
  return { ok: true, data: parsed.data.sessions.map(mapSession), status: 200 };
}

export async function sendMessage(sessionId: string, request: SendMessageRequest): Promise<ApiResult<SendMessageResponse>> {
  const idempotencyKey = randomId();
  const spec = gatewayMethodMatrix.chat.send;
  const sendRes = await callGateway<unknown>(spec.method, spec.params(sessionId, request.content, idempotencyKey));
  if (!sendRes.ok) return sendRes;
  const parsed = contracts.chatSend.safeParse(sendRes.data);
  if (!parsed.success) return getError(`chat.send schema mismatch: ${parsed.error.issues[0]?.message || 'invalid payload'}`, false);

  const userMessage: Message = { id: idempotencyKey, role: 'user', content: request.content, timestamp: new Date().toISOString() };
  return { ok: true, status: 200, data: { userMessage, sessionId, streaming: true } };
}

export async function fetchSessionMessages(sessionKey: string): Promise<ApiResult<Message[]>> {
  const spec = gatewayMethodMatrix.chat.history;
  const history = await callGateway<unknown>(spec.method, spec.params(sessionKey));
  if (!history.ok) return history;
  const parsed = contracts.chatHistory.safeParse(history.data);
  if (!parsed.success) return getError(`chat.history schema mismatch: ${parsed.error.issues[0]?.message || 'invalid payload'}`, false);
  return { ok: true, status: 200, data: parsed.data.messages.map((m, idx) => mapHistoryMessage(m, idx)) };
}

export async function fetchModelConfig(): Promise<ApiResult<ModelConfig>> {
  const spec = gatewayMethodMatrix.models.list;
  const res = await callGateway<unknown>(spec.method, spec.params);
  if (!res.ok) return res;
  const parsed = contracts.modelsList.safeParse(res.data);
  if (!parsed.success) return getError(`models.list schema mismatch: ${parsed.error.issues[0]?.message || 'invalid payload'}`, false);

  const grouped = new Map<string, string[]>();
  for (const model of parsed.data.models) {
    const provider = model.provider || 'default';
    grouped.set(provider, [...(grouped.get(provider) || []), model.id]);
  }
  const providers: ModelProviderConfig[] = [...grouped.entries()].map(([id, models]) => ({ id, name: id, enabled: true, defaultModel: models[0] || '', models }));
  return { ok: true, status: 200, data: { providers } };
}

export async function fetchMemoryIndex(agentId = 'main'): Promise<ApiResult<MemoryIndex>> {
  const spec = gatewayMethodMatrix.files.list;
  const res = await callGateway<unknown>(spec.method, spec.params(agentId));
  if (!res.ok) return res;
  const parsed = contracts.memoryList.safeParse(res.data);
  if (!parsed.success) return getError(`agents.files.list schema mismatch: ${parsed.error.issues[0]?.message || 'invalid payload'}`, false);

  const files: MemoryFileEntry[] = parsed.data.files.map((f) => ({
    path: f.path,
    name: f.name || f.path.split('/').pop() || f.path,
    size: f.size || 0,
    modifiedAt: new Date(f.updatedAtMs || Date.now()).toISOString(),
    isDirectory: Boolean(f.isDirectory),
    agentId,
  }));

  return { ok: true, status: 200, data: { files, root: parsed.data.workspace || '', agentId } };
}

export async function fetchMemoryFile(filePath: string, agentId = 'main'): Promise<ApiResult<MemoryFileContent>> {
  const spec = gatewayMethodMatrix.files.get;
  const name = filePath.split('/').pop() || filePath;
  const res = await callGateway<unknown>(spec.method, spec.params(agentId, name));
  if (!res.ok) return res;
  const parsed = contracts.memoryGet.safeParse(res.data);
  if (!parsed.success) return getError(`agents.files.get schema mismatch: ${parsed.error.issues[0]?.message || 'invalid payload'}`, false);
  return {
    ok: true,
    status: 200,
    data: {
      path: parsed.data.file?.path || filePath,
      content: parsed.data.file?.content || '',
      size: parsed.data.file?.size || 0,
      modifiedAt: new Date(parsed.data.file?.updatedAtMs || Date.now()).toISOString(),
      agentId,
    },
  };
}

export async function fetchRuntimeStatus(): Promise<ApiResult<RuntimeStatus>> {
  const [agents, sessions, health, subagents] = await Promise.all([
    fetchAgents(),
    fetchSessions(),
    callGateway<unknown>(gatewayMethodMatrix.health.check.method),
    callGateway<unknown>(gatewayMethodMatrix.subagents.list.method).catch(() => getError('subagents.list unavailable')),
  ]);
  if (!agents.ok) return agents;
  if (!sessions.ok) return sessions;

  const healthParsed = health.ok ? contracts.health.safeParse(health.data) : null;
  const subagentRows = subagents.ok && subagents.data && Array.isArray((subagents.data as { entries?: unknown[] }).entries)
    ? ((subagents.data as { entries: Array<{ id?: string; status?: string; task?: string; startedAt?: string; updatedAt?: string; parentSessionId?: string }> }).entries)
    : [];

  const healthState: RuntimeStatus['health'] = health.ok && healthParsed?.success && healthParsed.data.ok !== false ? 'healthy' : 'degraded';
  return {
    ok: true,
    status: 200,
    data: {
      agents: agents.data,
      sessions: sessions.data,
      subagents: subagentRows.map((s, idx) => ({
        id: s.id || `subagent-${idx}`,
        parentSessionId: s.parentSessionId || '',
        status: (s.status as SubagentStatus['status']) || 'active',
        task: s.task,
        startedAt: new Date(s.startedAt || Date.now()).toISOString(),
        lastActivity: s.updatedAt ? new Date(s.updatedAt).toISOString() : undefined,
      })),
      health: healthState,
      adapterHealth: healthState === 'healthy' ? 'ok' : 'degraded',
      lastSyncAt: new Date().toISOString(),
    },
  };
}

export async function postRuntimeAction(request: ActionRequest): Promise<ApiResult<ActionReceipt>> {
  const matrix = request.targetType === 'agent' ? agentActionMatrix : sessionActionMatrix;
  const spec = matrix[request.action];
  const result = await callGateway<unknown>(spec.method, spec.buildParams(request.targetId));
  if (!result.ok) {
    return { ok: true, status: 200, data: { id: randomId(), commandId: randomId(), status: 'failed', error: result.error, timestamp: new Date().toISOString() } };
  }
  return { ok: true, status: 200, data: { id: randomId(), commandId: randomId(), status: 'success', result: `${spec.method} dispatched`, timestamp: new Date().toISOString() } };
}

const STORAGE_WRITE_KEYS = {
  agents: 'clawcommand.runtime.agents',
  sessions: 'clawcommand.runtime.sessions',
  diagnostics: 'clawcommand.runtime.diagnostics',
};

export function startRuntimePolling(intervalMs = 15_000): () => void {
  let active = true;
  const poll = async () => {
    if (!active || typeof window === 'undefined') return;
    const result = await fetchRuntimeStatus();
    if (result.ok) {
      const { agents, sessions, health, lastSyncAt } = result.data;
      localStorage.setItem(STORAGE_WRITE_KEYS.agents, JSON.stringify(agents));
      localStorage.setItem(STORAGE_WRITE_KEYS.sessions, JSON.stringify(sessions));
      localStorage.setItem(STORAGE_WRITE_KEYS.diagnostics, JSON.stringify({ adapterHealth: health === 'healthy' ? 'ok' : 'degraded', lastSyncAt }));
    }
  };
  void poll();
  const id = window.setInterval(poll, intervalMs);
  return () => { active = false; clearInterval(id); };
}

export function subscribeRuntimeUpdates(onUpdate: (update: RuntimeLiveUpdate) => void, onState?: (state: 'connected' | 'polling-fallback' | 'closed') => void): () => void {
  const url = gatewayUrl();
  const ws = new WebSocket(url);
  let fallbackStop: (() => void) | null = null;

  const startFallback = () => {
    if (fallbackStop) return;
    onState?.('polling-fallback');
    fallbackStop = startRuntimePolling(8_000);
  };

  const sendConnect = () => {
    ws.send(JSON.stringify({
      type: 'req',
      id: randomId(),
      method: 'connect',
      params: {
        minProtocol: 3,
        maxProtocol: 3,
        client: { id: 'gateway-client', displayName: 'ClawCommand', version: '1.0.0', platform: 'web', mode: 'ui', instanceId: `cc-${randomId()}` },
        role: 'operator',
        scopes: ['operator.admin'],
        auth: gatewayToken() ? { token: gatewayToken() } : undefined,
      },
    }));
  };

  ws.onopen = () => sendConnect();

  ws.onmessage = (event) => {
    const msg = JSON.parse(String(event.data)) as RpcRes | RpcEvent;

    if (msg.type === 'event' && msg.event === 'connect.challenge') {
      sendConnect();
      return;
    }

    if (msg.type === 'res' && msg.ok) {
      onState?.('connected');
      return;
    }

    if (msg.type !== 'event') return;

    const map: Record<string, RuntimeLiveUpdate['kind']> = {
      tick: 'tick',
      'chat.message': 'chat',
      'agent.status': 'agent_status',
      'subagents.update': 'subagents',
    };

    onUpdate({
      kind: map[msg.event] || 'unknown',
      payload: msg.payload,
      timestamp: new Date().toISOString(),
    });
  };

  ws.onerror = () => startFallback();
  ws.onclose = () => {
    startFallback();
    onState?.('closed');
  };

  return () => {
    fallbackStop?.();
    try { ws.close(); } catch {}
  };
}
