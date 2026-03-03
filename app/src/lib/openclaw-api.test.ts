import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchAgents, fetchMemoryFile, fetchMemoryIndex, fetchModelConfig, fetchRuntimeStatus, fetchSessions, postRuntimeAction, sendMessage, startRuntimePolling } from '@/lib/openclaw-api';

describe('openclaw api client', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubEnv('VITE_OPENCLAW_API_BASE', 'https://runtime.example');
    vi.stubEnv('VITE_OPENCLAW_API_TOKEN', 'token');
    localStorage.clear();
  });

  it('calls all P0 endpoints', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({}) }));

    await fetchAgents();
    await fetchSessions();
    await fetchModelConfig();
    await fetchMemoryIndex();
    await fetchMemoryFile('memory/2026-03-03.md');
    await fetchRuntimeStatus();
    await sendMessage('session-1', { content: 'hello' });
    await postRuntimeAction({ targetType: 'session', targetId: 'session-1', action: 'retry' });

    expect(fetch).toHaveBeenCalledWith('https://runtime.example/api/agents', expect.any(Object));
    expect(fetch).toHaveBeenCalledWith('https://runtime.example/api/sessions', expect.any(Object));
    expect(fetch).toHaveBeenCalledWith('https://runtime.example/api/models', expect.any(Object));
    expect(fetch).toHaveBeenCalledWith('https://runtime.example/api/memory', expect.any(Object));
    expect(fetch).toHaveBeenCalledWith('https://runtime.example/api/memory/memory%2F2026-03-03.md', expect.any(Object));
    expect(fetch).toHaveBeenCalledWith('https://runtime.example/api/runtime/status', expect.any(Object));
    expect(fetch).toHaveBeenCalledWith('https://runtime.example/api/sessions/session-1/messages', expect.any(Object));
    expect(fetch).toHaveBeenCalledWith('https://runtime.example/api/runtime/actions', expect.any(Object));
  });

  it('writes runtime polling snapshot to localStorage', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ agents: [{ id: 'a' }], sessions: [{ id: 's' }], health: 'healthy', lastSyncAt: new Date().toISOString(), subagents: [], adapterHealth: 'ok' }),
    }));

    const stop = startRuntimePolling(1000);
    await vi.advanceTimersByTimeAsync(5);
    stop();

    expect(localStorage.getItem('clawcommand.runtime.agents')).toContain('"id":"a"');
    expect(localStorage.getItem('clawcommand.runtime.sessions')).toContain('"id":"s"');
    vi.useRealTimers();
  });

  it('uses default local API base when env base is missing', async () => {
    vi.stubEnv('VITE_OPENCLAW_API_BASE', '');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({}) }));

    const result = await fetchAgents();
    expect(result.ok).toBe(true);
    expect(fetch).toHaveBeenCalledWith('http://127.0.0.1:3001/api/agents', expect.any(Object));
  });
});
