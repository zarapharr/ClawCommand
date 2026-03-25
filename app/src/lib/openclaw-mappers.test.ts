import { describe, expect, it } from 'vitest';
import { flattenModelConfig, runtimeMetrics, sortSessions, toModelUsage, toSessionSummaries } from '@/lib/openclaw-mappers';
import type { Session } from '@/types';

const makeSession = (overrides: Partial<Session> = {}): Session => ({
  id: 's1', agentId: 'a1', agentName: 'A', agentEmoji: '🤖', key: 'k', groupLabel: '#General',
  status: 'active', messageCount: 2, createdAt: '2026-01-01T00:00:00Z',
  lastActivity: '2026-01-02T00:00:00Z',
  messages: [
    { id: 'm1', role: 'user', content: 'hi', timestamp: '2026-01-01T10:00:00Z' },
    { id: 'm2', role: 'assistant', content: 'hey', timestamp: '2026-01-02T00:00:00Z', tokens: { input: 5, output: 10 } },
  ],
  ...overrides,
});

describe('openclaw mappers', () => {
  it('flattens model config and computes usage', () => {
    const providers = flattenModelConfig({
      providers: [{ id: 'openai', name: 'OpenAI', enabled: true, defaultModel: 'gpt-4o', models: ['gpt-4o'] }],
    });
    expect(providers[0].defaultModel).toBe('gpt-4o');

    const usage = toModelUsage([
      { id: 'a1', name: 'A', emoji: '🤖', role: 'R', description: '', status: 'online', model: { provider: 'openai', model: 'gpt-4o', temperature: 0, maxTokens: 0 }, tools: { allow: [], deny: [] }, skills: [], workspace: '', bootstrapFiles: { agents: '', soul: '', tools: '', memory: '' }, position: { x: 0, y: 0 }, connections: [], metrics: { messagesToday: 0, tokensUsed: 0, lastActive: '2026-01-01' }, createdAt: '', updatedAt: '' },
    ], [
      { id: 's1', agentId: 'a1', agentName: 'A', agentEmoji: '🤖', key: 'k', groupLabel: '#General', status: 'active', messageCount: 1, createdAt: '', lastActivity: '', messages: [{ id: 'm', role: 'assistant', content: '', timestamp: '', tokens: { input: 2, output: 3 } }] },
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

  it('toSessionSummaries maps sessions to summaries with token totals', () => {
    const session = makeSession();
    const summaries = toSessionSummaries([session]);
    expect(summaries).toHaveLength(1);
    expect(summaries[0].title).toBe('k');
    expect(summaries[0].lastMessageAt).toBe('2026-01-02T00:00:00Z');
    expect(summaries[0].totalTokens).toBe(15); // 5 input + 10 output
  });

  it('sortSessions orders by latest activity', () => {
    const older = makeSession({ id: 'old', lastActivity: '2026-01-01T00:00:00Z', key: 'beta' });
    const newer = makeSession({ id: 'new', lastActivity: '2026-02-01T00:00:00Z', key: 'alpha' });
    const result = sortSessions([older, newer], 'latest');
    expect(result[0].id).toBe('new');
    expect(result[1].id).toBe('old');
  });

  it('sortSessions orders by oldest activity', () => {
    const older = makeSession({ id: 'old', lastActivity: '2026-01-01T00:00:00Z', key: 'beta' });
    const newer = makeSession({ id: 'new', lastActivity: '2026-02-01T00:00:00Z', key: 'alpha' });
    const result = sortSessions([newer, older], 'oldest');
    expect(result[0].id).toBe('old');
  });

  it('sortSessions orders by name', () => {
    const a = makeSession({ id: 'a', key: 'alpha', lastActivity: '2026-02-01T00:00:00Z' });
    const b = makeSession({ id: 'b', key: 'beta', lastActivity: '2026-01-01T00:00:00Z' });
    const result = sortSessions([b, a], 'name');
    expect(result[0].key).toBe('alpha');
  });

  it('sortSessions does not mutate the original array', () => {
    const original = [
      makeSession({ id: 's2', lastActivity: '2026-02-01T00:00:00Z' }),
      makeSession({ id: 's1', lastActivity: '2026-01-01T00:00:00Z' }),
    ];
    const copy = [...original];
    sortSessions(original, 'oldest');
    expect(original[0].id).toBe(copy[0].id);
  });
});
