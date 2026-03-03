import type { Agent, Message, Session } from '@/types';

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
}
export interface MemoryIndex { files: MemoryFileEntry[]; root: string; }
export interface MemoryFileContent { path: string; content: string; size: number; modifiedAt: string; }

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

type RpcReq = { type: 'req'; id: string; method: string; params?: Record<string, unknown> };
type RpcRes = { type: 'res'; id: string; ok: boolean; payload?: unknown; error?: { message?: string; code?: string } };

function randomId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
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
  if (!url) return { ok: false, error: 'Missing VITE_OPENCLAW_GATEWAY_URL.', status: null, retryable: false };

  return new Promise((resolve) => {
    const ws = new WebSocket(url);
    const reqId = randomId();
    let settled = false;

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

    const timer = window.setTimeout(() => fail(`Gateway timeout calling ${method}.`), 10_000);

    ws.onopen = () => {
      const auth = gatewayToken() || gatewayPassword() ? { token: gatewayToken(), password: gatewayPassword() } : undefined;
      const connectReq: RpcReq = {
        type: 'req',
        id: randomId(),
        method: 'connect',
        params: {
          minProtocol: 3,
          maxProtocol: 3,
          client: { id: 'clawcommand', version: 'dev', platform: 'web', mode: 'ui', instanceId: randomId() },
          role: 'operator',
          scopes: ['operator.read', 'operator.write', 'operator.admin'],
          caps: [],
          ...(auth ? { auth } : {}),
        },
      };
      ws.send(JSON.stringify(connectReq));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(String(event.data)) as RpcRes;
        if (msg.type !== 'res') return;

        if (!settled && msg.id !== reqId) {
          // connect response or unrelated response, ignore
          if (msg.ok === false && method !== 'connect' && msg.error?.message?.toLowerCase().includes('auth')) {
            clearTimeout(timer);
            fail(`Gateway auth failed. Set VITE_OPENCLAW_GATEWAY_TOKEN or VITE_OPENCLAW_GATEWAY_PASSWORD.`, false);
          }
          if (msg.id !== reqId && msg.ok && (msg.payload as { protocol?: number } | undefined)?.protocol !== undefined) {
            const req: RpcReq = { type: 'req', id: reqId, method, params };
            ws.send(JSON.stringify(req));
          }
          return;
        }

        clearTimeout(timer);
        if (!msg.ok) {
          fail(msg.error?.message ? `Gateway ${method} failed: ${msg.error.message}` : `Gateway ${method} failed.`);
          return;
        }
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

function toAgentStatus(input: string | undefined): Agent['status'] {
  const v = (input || '').toLowerCase();
  if (v.includes('error')) return 'error';
  if (v.includes('offline')) return 'offline';
  if (v.includes('working') || v.includes('running')) return 'working';
  if (v.includes('think')) return 'thinking';
  if (v.includes('idle')) return 'idle';
  return 'online';
}

function mapAgent(raw: any, index: number): Agent {
  const id = raw?.id || `agent-${index}`;
  const name = raw?.name || raw?.identity?.name || id;
  return {
    id,
    name,
    emoji: raw?.identity?.emoji || '🤖',
    role: raw?.identity?.theme || 'Agent',
    description: raw?.identity?.theme || 'OpenClaw agent',
    status: toAgentStatus(raw?.status),
    model: { provider: 'openai-codex', model: 'gpt-5.3-codex', temperature: 0.2, maxTokens: 4096 },
    tools: { allow: [], deny: [] },
    skills: raw?.skills || [],
    workspace: raw?.workspace || '',
    bootstrapFiles: { agents: '', soul: '', tools: '', memory: '' },
    position: { x: 120 + (index % 4) * 220, y: 140 + Math.floor(index / 4) * 180 },
    connections: [],
    metrics: { messagesToday: 0, tokensUsed: 0, lastActive: new Date().toISOString() },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function mapSession(raw: any): Session {
  return {
    id: raw?.sessionId || raw?.key || randomId(),
    key: raw?.key || '',
    agentId: raw?.key?.split(':')[1] || 'main',
    agentName: raw?.agentName || raw?.displayName || raw?.key?.split(':')[1] || 'main',
    agentEmoji: '💬',
    status: 'active',
    messageCount: raw?.totalTurns || raw?.messageCount || 0,
    createdAt: new Date(raw?.createdAt || Date.now()).toISOString(),
    lastActivity: new Date(raw?.updatedAt || Date.now()).toISOString(),
    messages: [],
  };
}

export async function fetchAgents(): Promise<ApiResult<Agent[]>> {
  const res = await callGateway<{ agents?: any[] }>('agents.list');
  if (!res.ok) return res;
  return { ok: true, data: (res.data.agents || []).map(mapAgent), status: 200 };
}

export async function fetchSessions(): Promise<ApiResult<Session[]>> {
  const res = await callGateway<{ sessions?: any[] }>('sessions.list', { includeUnknown: true, limit: 120 });
  if (!res.ok) return res;
  return { ok: true, data: (res.data.sessions || []).map(mapSession), status: 200 };
}

export async function sendMessage(sessionId: string, request: SendMessageRequest): Promise<ApiResult<SendMessageResponse>> {
  const idempotencyKey = randomId();
  const sendRes = await callGateway<any>('chat.send', { sessionKey: sessionId, message: request.content, deliver: false, idempotencyKey });
  if (!sendRes.ok) return sendRes;

  const userMessage: Message = { id: idempotencyKey, role: 'user', content: request.content, timestamp: new Date().toISOString() };
  return { ok: true, status: 200, data: { userMessage, sessionId, streaming: true } };
}

export async function fetchSessionMessages(sessionKey: string): Promise<ApiResult<Message[]>> {
  const history = await callGateway<{ messages?: any[] }>('chat.history', { sessionKey, limit: 200 });
  if (!history.ok) return history;
  const messages: Message[] = (history.data.messages || []).map((m: any, idx: number) => {
    const text = Array.isArray(m?.content)
      ? m.content.filter((c: any) => c?.type === 'text' && typeof c.text === 'string').map((c: any) => c.text).join('\n')
      : (m?.text || '');
    return { id: m?.id || `${idx}`, role: m?.role === 'assistant' ? 'assistant' : m?.role === 'system' ? 'system' : 'user', content: text, timestamp: new Date(m?.timestamp || Date.now()).toISOString() };
  });
  return { ok: true, status: 200, data: messages };
}

export async function fetchModelConfig(): Promise<ApiResult<ModelConfig>> {
  const res = await callGateway<{ models?: Array<{ id: string; provider?: string }> }>('models.list');
  if (!res.ok) return res;
  const grouped = new Map<string, string[]>();
  for (const model of res.data.models || []) {
    const provider = model.provider || 'default';
    grouped.set(provider, [...(grouped.get(provider) || []), model.id]);
  }
  const providers: ModelProviderConfig[] = [...grouped.entries()].map(([id, models]) => ({ id, name: id, enabled: true, defaultModel: models[0] || '', models }));
  return { ok: true, status: 200, data: { providers } };
}

export async function fetchMemoryIndex(): Promise<ApiResult<MemoryIndex>> {
  const res = await callGateway<{ workspace?: string; files?: any[] }>('agents.files.list', { agentId: 'main' });
  if (!res.ok) return res;
  const files: MemoryFileEntry[] = (res.data.files || []).map((f: any) => ({
    path: f.path,
    name: f.name,
    size: f.size || 0,
    modifiedAt: new Date(f.updatedAtMs || Date.now()).toISOString(),
    isDirectory: Boolean(f.isDirectory),
  }));
  return { ok: true, status: 200, data: { files, root: res.data.workspace || '' } };
}

export async function fetchMemoryFile(filePath: string): Promise<ApiResult<MemoryFileContent>> {
  const name = filePath.split('/').pop() || filePath;
  const res = await callGateway<{ file?: any }>('agents.files.get', { agentId: 'main', name });
  if (!res.ok) return res;
  return {
    ok: true,
    status: 200,
    data: {
      path: res.data.file?.path || filePath,
      content: res.data.file?.content || '',
      size: res.data.file?.size || 0,
      modifiedAt: new Date(res.data.file?.updatedAtMs || Date.now()).toISOString(),
    },
  };
}

export async function fetchRuntimeStatus(): Promise<ApiResult<RuntimeStatus>> {
  const [agents, sessions, health] = await Promise.all([fetchAgents(), fetchSessions(), callGateway<any>('health')]);
  if (!agents.ok) return agents;
  if (!sessions.ok) return sessions;
  const healthState: RuntimeStatus['health'] = health.ok && health.data?.ok ? 'healthy' : 'degraded';
  return {
    ok: true,
    status: 200,
    data: {
      agents: agents.data,
      sessions: sessions.data,
      subagents: [],
      health: healthState,
      adapterHealth: healthState === 'healthy' ? 'ok' : 'degraded',
      lastSyncAt: new Date().toISOString(),
    },
  };
}

export async function postRuntimeAction(request: ActionRequest): Promise<ApiResult<ActionReceipt>> {
  const key = request.targetId;
  let rpcMethod = 'sessions.reset';
  let rpcParams: Record<string, unknown> = { key };
  if (request.action === 'stop' || request.action === 'kill') {
    rpcMethod = 'chat.abort';
    rpcParams = { sessionKey: key };
  }
  const result = await callGateway<any>(rpcMethod, rpcParams);
  if (!result.ok) {
    return { ok: true, status: 200, data: { id: randomId(), commandId: randomId(), status: 'failed', error: result.error, timestamp: new Date().toISOString() } };
  }
  return { ok: true, status: 200, data: { id: randomId(), commandId: randomId(), status: 'success', result: `${rpcMethod} dispatched`, timestamp: new Date().toISOString() } };
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
