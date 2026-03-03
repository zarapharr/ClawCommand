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
    workspace: parsed.workspace || '',
    bootstrapFiles: { agents: '', soul: '', tools: '', memory: '' },
    position: { x: 120 + (index % 4) * 220, y: 140 + Math.floor(index / 4) * 180 },
    connections: [],
    metrics: { messagesToday: 0, tokensUsed: 0, lastActive: new Date().toISOString() },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function mapSession(raw: unknown): Session {
  const parsed = rawSessionSchema.parse(raw);
  return {
    id: parsed.sessionId || parsed.key || randomId(),
    key: parsed.key || parsed.sessionId || '',
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
