import { describe, expect, it, vi } from 'vitest';
import type { Agent } from '@/types';
import { applyAgentConfigDraft } from '@/lib/agent-config';

const baseAgent: Agent = {
  id: 'agent-1',
  name: 'Operator',
  emoji: '🧭',
  role: 'Ops',
  description: 'Keeps the system steady.',
  status: 'online',
  model: { provider: 'openai', model: 'gpt-4o', temperature: 0.3, maxTokens: 2048 },
  tools: { allow: ['read'], deny: [] },
  skills: ['ops'],
  workspace: '~/.openclaw/workspace',
  bootstrapFiles: { agents: 'agents v1', soul: 'soul v1', tools: 'tools v1', memory: 'memory v1' },
  position: { x: 0, y: 0 },
  connections: [],
  metrics: { messagesToday: 0, tokensUsed: 0, lastActive: '2026-01-01' },
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('applyAgentConfigDraft', () => {
  it('persists bootstrap file edits when saving config', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-12T08:00:00.000Z'));

    const result = applyAgentConfigDraft(baseAgent, {
      skills: 'ops\nqa',
      toolsAllow: 'read\nwrite',
      toolsDeny: '',
      bootstrapFiles: {
        ...baseAgent.bootstrapFiles,
        soul: 'soul v2\nline 2',
      },
      budgetMonthlyLimit: 400,
      budgetAlertThreshold: 80,
      budgetHardLimit: false,
      budgetOnExceeded: 'notify',
      routingPrimary: 'gpt-4o',
      routingFallback: 'gpt-4o',
      routingEscalation: 'gpt-4o',
      routingRules: 'budget|invoice => gpt-4o',
    });

    expect(result.bootstrapFiles.soul).toBe('soul v2\nline 2');
    expect(result.bootstrapFiles.tools).toBe('tools v1');
    expect(result.updatedAt).toBe('2026-03-12T08:00:00.000Z');

    vi.useRealTimers();
  });
});
