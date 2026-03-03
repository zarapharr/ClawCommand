import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchAgents, fetchMemoryFile, fetchMemoryIndex, fetchModelConfig, fetchRuntimeStatus, fetchSessionMessages, fetchSessions, postRuntimeAction, sendMessage, startRuntimePolling } from '@/lib/openclaw-api';

class FakeWebSocket {
  static responses: Record<string, unknown> = {};
  static sentMethods: string[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  onclose: (() => void) | null = null;
  readyState = 1;
  private challengeIssued = false;

  constructor(_url: string) {
    setTimeout(() => this.onopen?.(), 0);
  }

  send(payload: string) {
    const req = JSON.parse(payload);
    FakeWebSocket.sentMethods.push(req.method);
    if (req.method === 'connect') {
      if (!this.challengeIssued) {
        this.challengeIssued = true;
        this.onmessage?.({ data: JSON.stringify({ type: 'event', event: 'connect.challenge', payload: { nonce: 'n-1' } }) });
      }
      this.onmessage?.({ data: JSON.stringify({ type: 'res', id: req.id, ok: true, payload: { protocol: 3 } }) });
      return;
    }
    const response = FakeWebSocket.responses[req.method] ?? {};
    this.onmessage?.({ data: JSON.stringify({ type: 'res', id: req.id, ok: true, payload: response }) });
  }

  close() {}
}

describe('openclaw api client gateway contracts', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubEnv('VITE_OPENCLAW_GATEWAY_URL', 'ws://127.0.0.1:18789');
    FakeWebSocket.responses = {
      'agents.list': { agents: [{ id: 'main', name: 'Main', identity: { emoji: '⚡', theme: 'Ops' } }] },
      'sessions.list': { sessions: [{ key: 'agent:main:telegram:group:1', sessionId: 's1', updatedAt: Date.now() }] },
      'models.list': { models: [{ id: 'gpt-5.3-codex', provider: 'openai-codex' }] },
      'agents.files.list': { workspace: '/tmp', files: [{ path: '/tmp/MEMORY.md', name: 'MEMORY.md', size: 4, updatedAtMs: Date.now() }] },
      'agents.files.get': { file: { path: '/tmp/MEMORY.md', content: 'memo', size: 4, updatedAtMs: Date.now() } },
      health: { ok: true },
      'subagents.list': { entries: [{ id: 'sa-1', status: 'active', task: 'test' }] },
      'chat.history': { messages: [{ id: 'm1', role: 'assistant', content: [{ type: 'text', text: 'hi' }] }] },
      'chat.send': { accepted: true },
      'sessions.reset': { ok: true },
      'chat.abort': { ok: true },
    };
    FakeWebSocket.sentMethods = [];
    vi.stubGlobal('WebSocket', FakeWebSocket as any);
    localStorage.clear();
  });

  it('maps gateway RPC contracts for agents/sessions/models/memory/chat', async () => {
    const agents = await fetchAgents();
    const sessions = await fetchSessions();
    const models = await fetchModelConfig();
    const memory = await fetchMemoryIndex();
    const file = await fetchMemoryFile('/tmp/MEMORY.md');
    const history = await fetchSessionMessages('agent:main:telegram:group:1');

    expect(agents.ok && agents.data[0].id).toBe('main');
    expect(sessions.ok && sessions.data[0].id).toBe('s1');
    expect(models.ok && models.data.providers[0].id).toBe('openai-codex');
    expect(memory.ok && memory.data.files[0].name).toBe('MEMORY.md');
    expect(file.ok && file.data.content).toBe('memo');
    expect(history.ok && history.data[0].content).toBe('hi');
  });

  it('supports runtime status, send message, action dispatch, and polling', async () => {
    const runtime = await fetchRuntimeStatus();
    const send = await sendMessage('agent:main:telegram:group:1', { content: 'hello' });
    const action = await postRuntimeAction({ targetType: 'session', targetId: 's1', action: 'retry' });
    const killAction = await postRuntimeAction({ targetType: 'session', targetId: 's1', action: 'kill' });
    const agentAction = await postRuntimeAction({ targetType: 'agent', targetId: 'main', action: 'start' });

    expect(runtime.ok).toBe(true);
    expect(send.ok).toBe(true);
    expect(action.ok).toBe(true);
    expect(killAction.ok).toBe(true);
    expect(agentAction.ok && agentAction.data.status).toBe('failed');

    vi.useFakeTimers();
    const stop = startRuntimePolling(1000);
    await vi.advanceTimersByTimeAsync(1200);
    stop();
    expect(localStorage.getItem('clawcommand.runtime.agents')).toContain('main');
    vi.useRealTimers();

    expect(FakeWebSocket.sentMethods).toContain('agents.list');
    expect(FakeWebSocket.sentMethods).toContain('sessions.list');
    expect(FakeWebSocket.sentMethods).toContain('chat.send');
    expect(FakeWebSocket.sentMethods).not.toContain('agents.start');
  });

  it('fails fast on schema mismatches', async () => {
    FakeWebSocket.responses['agents.list'] = { agents: [{ id: 123 }] };
    const agents = await fetchAgents();
    expect(agents.ok).toBe(false);
    if (!agents.ok) {
      expect(agents.error).toContain('schema mismatch');
    }
  });
});
