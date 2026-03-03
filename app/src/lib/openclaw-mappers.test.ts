import { describe, expect, it } from 'vitest';
import { flattenModelConfig, runtimeMetrics, toModelUsage } from '@/lib/openclaw-mappers';

describe('openclaw mappers', () => {
  it('flattens model config and computes usage', () => {
    const providers = flattenModelConfig({
      providers: [{ id: 'openai', name: 'OpenAI', enabled: true, defaultModel: 'gpt-4o', models: ['gpt-4o'] }],
    });
    expect(providers[0].defaultModel).toBe('gpt-4o');

    const usage = toModelUsage([
      { id: 'a1', name: 'A', emoji: '🤖', role: 'R', description: '', status: 'online', model: { provider: 'openai', model: 'gpt-4o', temperature: 0, maxTokens: 0 }, tools: { allow: [], deny: [] }, skills: [], workspace: '', bootstrapFiles: { agents: '', soul: '', tools: '', memory: '' }, position: { x: 0, y: 0 }, connections: [], metrics: { messagesToday: 0, tokensUsed: 0, lastActive: '2026-01-01' }, createdAt: '', updatedAt: '' },
    ], [
      { id: 's1', agentId: 'a1', agentName: 'A', agentEmoji: '🤖', key: 'k', status: 'active', messageCount: 1, createdAt: '', lastActivity: '', messages: [{ id: 'm', role: 'assistant', content: '', timestamp: '', tokens: { input: 2, output: 3 } }] },
    ]);
    expect(usage[0].tokensUsed).toBe(5);

    const metrics = runtimeMetrics({
      agents: [{ id: 'a1', name: 'A', emoji: '🤖', role: 'R', description: '', status: 'working', model: { provider: 'openai', model: 'gpt-4o', temperature: 0, maxTokens: 0 }, tools: { allow: [], deny: [] }, skills: [], workspace: '', bootstrapFiles: { agents: '', soul: '', tools: '', memory: '' }, position: { x: 0, y: 0 }, connections: [], metrics: { messagesToday: 0, tokensUsed: 10, lastActive: '2026-01-01' }, createdAt: '', updatedAt: '' }],
      sessions: [],
      subagents: [],
      health: 'healthy',
      adapterHealth: 'ok',
      lastSyncAt: '',
    });
    expect(metrics.workingAgents).toBe(1);
  });
});
