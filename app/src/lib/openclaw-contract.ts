import { z } from 'zod';
import type { Agent, Message, Session } from '@/types';

const stringOrNumberTs = z.union([z.string(), z.number()]).optional();

const rawAgentSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  status: z.string().optional(),
  identity: z.object({
    name: z.string().optional(),
    emoji: z.string().optional(),
    theme: z.string().optional(),
  }).optional(),
  skills: z.array(z.string()).optional(),
  workspace: z.string().optional(),
}).passthrough();

const rawSessionSchema = z.object({
  key: z.string().optional(),
  sessionId: z.string().optional(),
  agentName: z.string().optional(),
  displayName: z.string().optional(),
  status: z.string().optional(),
  totalTurns: z.number().optional(),
  messageCount: z.number().optional(),
  createdAt: stringOrNumberTs,
  updatedAt: stringOrNumberTs,
}).passthrough();

const rawMessageSchema = z.object({
  id: z.string().optional(),
  role: z.string().optional(),
  timestamp: stringOrNumberTs,
  text: z.string().optional(),
  content: z.array(z.object({ type: z.string().optional(), text: z.string().optional() }).passthrough()).optional(),
  tool: z.any().optional(),
  result: z.any().optional(),
  streaming: z.boolean().optional(),
}).passthrough();

export const contracts = {
  agentsList: z.object({ agents: z.array(rawAgentSchema).default([]) }),
  sessionsList: z.object({ sessions: z.array(rawSessionSchema).default([]) }),
  modelsList: z.object({ models: z.array(z.object({ id: z.string(), provider: z.string().optional() }).passthrough()).default([]) }),
  memoryList: z.object({ workspace: z.string().optional(), files: z.array(z.object({
    path: z.string(),
    name: z.string().optional(),
    size: z.number().optional(),
    updatedAtMs: z.number().optional(),
    isDirectory: z.boolean().optional(),
  }).passthrough()).default([]) }),
  memoryGet: z.object({ file: z.object({
    path: z.string().optional(),
    content: z.string().optional(),
    size: z.number().optional(),
    updatedAtMs: z.number().optional(),
  }).optional() }),
  chatHistory: z.object({ messages: z.array(rawMessageSchema).default([]) }),
  chatSend: z.object({ accepted: z.boolean().optional(), queued: z.boolean().optional() }).passthrough(),
  health: z.object({ ok: z.boolean().optional() }).passthrough(),
};

function iso(input?: string | number): string {
  if (!input) return new Date().toISOString();
  return new Date(input).toISOString();
}

function randomId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function toAgentStatus(input?: string): Agent['status'] {
  const v = (input || '').toLowerCase();
  if (v.includes('error')) return 'error';
  if (v.includes('offline')) return 'offline';
  if (v.includes('working') || v.includes('running') || v.includes('busy')) return 'working';
  if (v.includes('think')) return 'thinking';
  if (v.includes('idle')) return 'idle';
  return 'online';
}

function readStringField(raw: Record<string, unknown>, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = raw[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

function readNestedStringField(source: Record<string, unknown>, path: string[]): string | null {
  let value: unknown = source;
  for (const segment of path) {
    if (!value || typeof value !== 'object') return null;
    value = (value as Record<string, unknown>)[segment];
  }
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function readNestedNumberField(source: Record<string, unknown>, path: string[]): string | null {
  let value: unknown = source;
  for (const segment of path) {
    if (!value || typeof value !== 'object') return null;
    value = (value as Record<string, unknown>)[segment];
  }
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value === 'string' && value.trim()) return value.trim();
  return null;
}

const TELEGRAM_TOPIC_NAME_CACHE_STORAGE_KEY = 'clawcommand.telegram.topicNameCache';

type TopicNameCache = Record<string, string>;

let topicNameCacheMemo: TopicNameCache | null = null;

function loadTopicNameCache(): TopicNameCache {
  if (topicNameCacheMemo) return topicNameCacheMemo;
  if (typeof window === 'undefined') {
    topicNameCacheMemo = {};
    return topicNameCacheMemo;
  }

  try {
    const raw = window.localStorage.getItem(TELEGRAM_TOPIC_NAME_CACHE_STORAGE_KEY);
    if (!raw) {
      topicNameCacheMemo = {};
      return topicNameCacheMemo;
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') {
      topicNameCacheMemo = {};
      return topicNameCacheMemo;
    }

    topicNameCacheMemo = Object.entries(parsed as Record<string, unknown>).reduce<TopicNameCache>((acc, [key, value]) => {
      if (typeof value === 'string' && value.trim()) acc[key] = value.trim();
      return acc;
    }, {});
    return topicNameCacheMemo;
  } catch {
    topicNameCacheMemo = {};
    return topicNameCacheMemo;
  }
}

function saveTopicNameCache(cache: TopicNameCache): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(TELEGRAM_TOPIC_NAME_CACHE_STORAGE_KEY, JSON.stringify(cache));
}

export function resetTelegramTopicNameCacheForTests(): void {
  topicNameCacheMemo = null;
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(TELEGRAM_TOPIC_NAME_CACHE_STORAGE_KEY);
  }
}

function resolveTelegramTopicName(source: Record<string, unknown>): string | null {
  return readStringField(
    source,
    'topicName',
    'threadName',
    'topicTitle',
    'threadTitle',
    'groupLabel',
  )
    || readNestedStringField(source, ['origin', 'topicName'])
    || readNestedStringField(source, ['origin', 'threadName'])
    || readNestedStringField(source, ['origin', 'topic', 'name'])
    || readNestedStringField(source, ['origin', 'topic', 'title'])
    || readNestedStringField(source, ['origin', 'thread', 'name'])
    || readNestedStringField(source, ['origin', 'thread', 'title'])
    || readNestedStringField(source, ['origin', 'chat', 'topic', 'name'])
    || readNestedStringField(source, ['origin', 'chat', 'thread', 'name'])
    || readNestedStringField(source, ['origin', 'message', 'topic', 'name'])
    || readNestedStringField(source, ['origin', 'message', 'thread', 'name'])
    || readNestedStringField(source, ['origin', 'metadata', 'topicName'])
    || readNestedStringField(source, ['origin', 'metadata', 'threadName'])
    || readNestedStringField(source, ['origin', 'metadata', 'topicTitle'])
    || readNestedStringField(source, ['origin', 'metadata', 'threadTitle'])
    || readNestedStringField(source, ['metadata', 'topicName'])
    || readNestedStringField(source, ['metadata', 'threadName'])
    || readNestedStringField(source, ['metadata', 'topicTitle'])
    || readNestedStringField(source, ['metadata', 'threadTitle'])
    || readNestedStringField(source, ['metadata', 'topic', 'name'])
    || readNestedStringField(source, ['metadata', 'thread', 'name'])
    || readNestedStringField(source, ['topic', 'name'])
    || readNestedStringField(source, ['topic', 'title'])
    || readNestedStringField(source, ['thread', 'name'])
    || readNestedStringField(source, ['thread', 'title'])
    || null;
}

function resolveTelegramTopicId(source: Record<string, unknown>, key: string): string | null {
  const parts = key.split(':');
  const topicIndex = parts.findIndex((part) => part === 'topic' || part === 'thread');
  const topicIdFromKey = topicIndex >= 0 ? parts[topicIndex + 1] : '';

  return topicIdFromKey
    || readStringField(source, 'topicId', 'threadId')
    || readNestedNumberField(source, ['origin', 'topicId'])
    || readNestedNumberField(source, ['origin', 'threadId'])
    || readNestedNumberField(source, ['origin', 'topic', 'id'])
    || readNestedNumberField(source, ['origin', 'thread', 'id'])
    || readNestedNumberField(source, ['origin', 'chat', 'topic', 'id'])
    || readNestedNumberField(source, ['origin', 'chat', 'thread', 'id'])
    || readNestedNumberField(source, ['origin', 'message', 'topic', 'id'])
    || readNestedNumberField(source, ['origin', 'message', 'thread', 'id'])
    || readNestedNumberField(source, ['origin', 'metadata', 'topicId'])
    || readNestedNumberField(source, ['origin', 'metadata', 'threadId'])
    || readNestedNumberField(source, ['metadata', 'topicId'])
    || readNestedNumberField(source, ['metadata', 'threadId'])
    || readNestedNumberField(source, ['metadata', 'topic', 'id'])
    || readNestedNumberField(source, ['metadata', 'thread', 'id'])
    || readNestedNumberField(source, ['topic', 'id'])
    || readNestedNumberField(source, ['thread', 'id'])
    || null;
}

function resolveSessionScopeKey(key: string): string | null {
  const parts = key.split(':');
  if (parts[2] !== 'telegram' || parts[3] !== 'group') return null;
  const chatId = parts[4];
  if (!chatId) return null;
  return `telegram:group:${chatId}`;
}

function resolveCachedTopicName(scopeKey: string, topicId: string): string | null {
  const cache = loadTopicNameCache();
  return cache[`${scopeKey}:${topicId}`] || null;
}

function cacheTopicName(scopeKey: string, topicId: string, topicName: string): void {
  const trimmed = topicName.trim();
  if (!trimmed) return;
  const key = `${scopeKey}:${topicId}`;
  const cache = loadTopicNameCache();
  if (cache[key] === trimmed) return;
  const next = { ...cache, [key]: trimmed };
  topicNameCacheMemo = next;
  saveTopicNameCache(next);
}

export function resolveSessionGroupLabel(raw: unknown): string {
  const source = (raw && typeof raw === 'object') ? raw as Record<string, unknown> : {};
  const key = typeof source.key === 'string' ? source.key : '';
  const parts = key.split(':');
  const provider = parts[2];
  const scope = parts[3];
  const topicId = resolveTelegramTopicId(source, key);
  const topicName = resolveTelegramTopicName(source);
  const scopeKey = resolveSessionScopeKey(key);

  if (provider === 'telegram' && scope === 'group' && topicId && scopeKey && topicName) {
    cacheTopicName(scopeKey, topicId, topicName);
    return topicName;
  }

  if (provider === 'telegram' && scope === 'group' && topicId && scopeKey) {
    const cached = resolveCachedTopicName(scopeKey, topicId);
    if (cached) return cached;
    return `#Topic-${topicId}`;
  }

  if (provider === 'telegram' && scope === 'group' && topicName) {
    return topicName;
  }

  return '#General';
}

export function mapAgent(raw: unknown, index: number): Agent {
  const parsed = rawAgentSchema.parse(raw);
  const id = parsed.id || `agent-${index}`;
  const name = parsed.name || parsed.identity?.name || id;
  return {
    id,
    name,
    emoji: parsed.identity?.emoji || '🤖',
    role: parsed.identity?.theme || 'Agent',
    description: parsed.identity?.theme || 'OpenClaw agent',
    status: toAgentStatus(parsed.status),
    model: { provider: 'openai-codex', model: 'gpt-5.3-codex', temperature: 0.2, maxTokens: 4096 },
    tools: { allow: [], deny: [] },
    skills: parsed.skills || [],
    budget: {
      monthlyLimit: 400,
      alertThreshold: 80,
      hardLimit: false,
      onExceeded: 'notify',
    },
    routing: {
      primary: 'claude-sonnet-4-6',
      fallback: 'gpt-4o-mini',
      escalation: 'claude-opus-4-6',
      rules: [],
    },
    workspace: parsed.workspace || '',
    bootstrapFiles: { agents: '', soul: '', tools: '', memory: '' },
    position: {
      x: 20 + (index % 4) * 20,
      y: 22 + Math.floor(index / 4) * 22,
    },
    connections: [],
    metrics: { messagesToday: 0, tokensUsed: 0, lastActive: new Date().toISOString() },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function mapSession(raw: unknown): Session {
  const parsed = rawSessionSchema.parse(raw);
  return {
    id: parsed.key || parsed.sessionId || randomId(),
    key: parsed.key || parsed.sessionId || '',
    groupLabel: resolveSessionGroupLabel(raw),
    agentId: (parsed.key || '').split(':')[1] || 'main',
    agentName: parsed.agentName || parsed.displayName || (parsed.key || '').split(':')[1] || 'main',
    agentEmoji: '💬',
    status: (parsed.status || '').includes('arch') ? 'archived' : 'active',
    messageCount: parsed.totalTurns || parsed.messageCount || 0,
    createdAt: iso(parsed.createdAt),
    lastActivity: iso(parsed.updatedAt),
    messages: [],
  };
}

export function mapHistoryMessage(raw: unknown, idx: number): Message {
  const parsed = rawMessageSchema.parse(raw);
  const textParts = (parsed.content || [])
    .filter((item) => item.type === 'text' && typeof item.text === 'string')
    .map((item) => item.text as string);

  const toolResult = parsed.result ? `\n\n[tool-result]\n${JSON.stringify(parsed.result)}` : '';
  const toolCall = parsed.tool ? `\n\n[tool-call]\n${JSON.stringify(parsed.tool)}` : '';
  const body = textParts.length ? textParts.join('\n') : (parsed.text || '');

  return {
    id: parsed.id || `${idx}`,
    role: parsed.role === 'assistant' ? 'assistant' : parsed.role === 'system' ? 'system' : 'user',
    content: `${body}${toolCall}${toolResult}`.trim(),
    timestamp: iso(parsed.timestamp),
  };
}

export const gatewayMethodMatrix = {
  agents: {
    list: { method: 'agents.list', params: {} },
  },
  sessions: {
    list: { method: 'sessions.list', params: { includeUnknown: true, limit: 120 } },
    reset: { method: 'sessions.reset', params: (key: string) => ({ key }) },
  },
  chat: {
    history: { method: 'chat.history', params: (sessionKey: string) => ({ sessionKey, limit: 200 }) },
    send: { method: 'chat.send', params: (sessionKey: string, message: string, idempotencyKey: string) => ({ sessionKey, message, deliver: true, idempotencyKey }) },
    abort: { method: 'chat.abort', params: (sessionKey: string) => ({ sessionKey }) },
  },
  files: {
    list: { method: 'agents.files.list', params: (agentId: string) => ({ agentId }) },
    get: { method: 'agents.files.get', params: (agentId: string, name: string) => ({ agentId, name }) },
  },
  models: {
    list: { method: 'models.list', params: {} },
  },
  health: {
    check: { method: 'health', params: {} },
  },
  subagents: {
    list: { method: 'subagents.list', params: {} },
    kill: { method: 'subagents.kill', params: (target: string) => ({ target }) },
    steer: { method: 'subagents.steer', params: (target: string, message: string) => ({ target, message }) },
  },
} as const;

export type ActionMatrixKey = 'start' | 'stop' | 'retry' | 'kill' | 'escalate';

export const sessionActionMatrix: Record<ActionMatrixKey, { method: string; buildParams: (target: string) => Record<string, unknown> }> = {
  start: { method: 'sessions.reset', buildParams: (target) => ({ key: target }) },
  stop: { method: 'chat.abort', buildParams: (target) => ({ sessionKey: target }) },
  retry: { method: 'sessions.reset', buildParams: (target) => ({ key: target }) },
  kill: { method: 'chat.abort', buildParams: (target) => ({ sessionKey: target }) },
  escalate: { method: 'sessions.reset', buildParams: (target) => ({ key: target, escalate: true }) },
};

export const agentActionMatrix: Record<ActionMatrixKey, { method: string; buildParams: (target: string) => Record<string, unknown> }> = {
  start: { method: 'agents.start', buildParams: (target) => ({ agentId: target }) },
  stop: { method: 'agents.stop', buildParams: (target) => ({ agentId: target }) },
  retry: { method: 'agents.retry', buildParams: (target) => ({ agentId: target }) },
  kill: { method: 'subagents.kill', buildParams: (target) => ({ target }) },
  escalate: { method: 'subagents.steer', buildParams: (target) => ({ target, message: 'escalate' }) },
};

export const verifiedGatewayMethods = {
  supported: new Set([
    'agents.list',
    'sessions.list',
    'models.list',
    'health',
    'chat.history',
    'chat.send',
    'chat.abort',
    'sessions.reset',
    'agents.files.list',
    'agents.files.get',
  ]),
  unsupported: new Set([
    'subagents.list',
    'agents.start',
    'agents.stop',
    'agents.retry',
    'subagents.kill',
    'subagents.steer',
  ]),
} as const;
