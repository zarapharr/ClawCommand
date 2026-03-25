import { describe, expect, it } from 'vitest';
import {
  filterSessionsBySubagentVisibility,
  loadChatAliases,
  loadShowSubagents,
  mergeSessionLists,
  resolveNextActiveSessionId,
  resolveSessionDisplayName,
  saveChatAliases,
  saveShowSubagents,
  stabilizeVisibleSessions,
} from '@/lib/agent-chat-utils';
import type { Session } from '@/types';

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: 'agent:main:telegram:group:1:topic:2',
    key: 'agent:main:telegram:group:1:topic:2',
    agentId: 'main',
    agentName: 'Main',
    agentEmoji: '💬',
    groupLabel: 'Ops',
    status: 'active',
    messageCount: 0,
    createdAt: new Date().toISOString(),
    lastActivity: new Date().toISOString(),
    messages: [],
    ...overrides,
  };
}

describe('agent chat utils', () => {
  it('keeps previous non-draft list when incoming refresh is empty', () => {
    const prev = [makeSession({ id: 'draft-1', key: '', groupLabel: '#Drafts' }), makeSession({ id: 'live-1', key: 'live-1' })];
    const merged = mergeSessionLists(prev, []);
    expect(merged.map((s) => s.id)).toEqual(['draft-1', 'live-1']);
  });

  it('keeps previous remote sessions when incoming refresh is partial', () => {
    const prev = [
      makeSession({ id: 'live-1', key: 'live-1', messageCount: 2 }),
      makeSession({ id: 'live-2', key: 'live-2', messageCount: 4 }),
    ];
    const incoming = [makeSession({ id: 'live-2', key: 'live-2', messageCount: 5 })];

    const merged = mergeSessionLists(prev, incoming);

    expect(merged.map((s) => s.id)).toEqual(['live-1', 'live-2']);
    expect(merged.find((s) => s.id === 'live-2')?.messageCount).toBe(5);
  });

  it('filters sub-agent sessions by default and preserves normal sessions', () => {
    const sessions = [
      makeSession({ id: 's1', key: 'agent:main:telegram:group:1' }),
      makeSession({ id: 's2', key: 'agent:subagent-worker:telegram:group:1', agentName: 'subagent-worker' }),
    ];

    expect(filterSessionsBySubagentVisibility(sessions, false).map((s) => s.id)).toEqual(['s1']);
    expect(filterSessionsBySubagentVisibility(sessions, true).map((s) => s.id)).toEqual(['s1', 's2']);
  });

  it('resolves alias before group label and key', () => {
    const session = makeSession({ id: 's1', key: 'k1', groupLabel: 'Topic Name' });
    expect(resolveSessionDisplayName(session, { s1: 'Alias Name' })).toBe('Alias Name');
  });

  it('persists aliases and show-subagents preference', () => {
    localStorage.clear();
    saveChatAliases({ a: 'One' });
    saveShowSubagents(true);

    expect(loadChatAliases()).toEqual({ a: 'One' });
    expect(loadShowSubagents()).toBe(true);
  });

  it('falls back to next visible session when current is hidden or missing', () => {
    const visible = [makeSession({ id: 'one' }), makeSession({ id: 'two' })];
    expect(resolveNextActiveSessionId('missing', visible)).toBe('one');
    expect(resolveNextActiveSessionId('two', visible)).toBe('two');
  });

  it('stabilizes visible sessions to prevent transient empty flicker after initial load', () => {
    const stable = [makeSession({ id: 'one' })];
    expect(stabilizeVisibleSessions(stable, [], [makeSession({ id: 'one' })], true).map((s) => s.id)).toEqual(['one']);
    expect(stabilizeVisibleSessions(stable, [], [], true)).toEqual([]);
    expect(stabilizeVisibleSessions([], [], [makeSession({ id: 'one' })], false)).toEqual([]);
  });
});
