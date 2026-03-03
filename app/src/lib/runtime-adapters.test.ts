import { describe, expect, it, beforeEach, vi } from 'vitest';
import {
  appendDecisionLog,
  appendOperatorAudit,
  formatFreshnessLabel,
  getDiagnostics,
  readDecisionLog,
  readOperatorAudit,
  reconcileOperatorLedgers,
  runOperatorAction,
  sanitizePayloadPreview,
} from '@/lib/runtime-adapters';

describe('runtime adapters', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('sanitizes payload previews and caps length', () => {
    const preview = sanitizePayloadPreview({ token: 'sk-test-1234567890', message: 'hello' });
    expect(preview.length).toBeLessThanOrEqual(240);
    expect(preview).toContain('message');
  });

  it('stores operator audit receipts with command ids', async () => {
    const receipt = await appendOperatorAudit({
      action: 'retry',
      actor: 'test',
      payloadPreview: 'safe',
      source: 'live',
      status: 'success',
      targetId: 'session-1',
      targetType: 'session',
      result: 'ok',
    });

    expect(receipt.commandId.startsWith('cmd-')).toBe(true);
    expect(readOperatorAudit()[0].targetId).toBe('session-1');
  });

  it('stores decision log entries', async () => {
    await appendDecisionLog({
      decision: 'retry cron:job-1',
      reason: 'unit-test',
      targetId: 'job-1',
      targetType: 'cron',
    });

    expect(readDecisionLog()).toHaveLength(1);
    expect(readDecisionLog()[0].reason).toBe('unit-test');
  });

  it('reconciles canonical ledgers from runtime endpoint', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        audit: [{
          id: 'audit-1',
          commandId: 'cmd-1',
          timestamp: new Date().toISOString(),
          targetType: 'agent',
          targetId: 'agent-1',
          action: 'start',
          actor: 'runtime',
          source: 'live',
          payloadPreview: 'none',
          status: 'success',
        }],
        decisions: [{
          id: 'decision-1',
          timestamp: new Date().toISOString(),
          decision: 'start agent:agent-1',
          reason: 'operator request',
          targetType: 'agent',
          targetId: 'agent-1',
        }],
        adapterHealth: 'ok',
        lastSyncAt: new Date().toISOString(),
      }),
    }));

    vi.stubEnv('VITE_RUNTIME_LEDGER_ENDPOINT', 'https://runtime.example/ledger');

    const snapshot = await reconcileOperatorLedgers();
    expect(snapshot.degraded).toBe(false);
    expect(readOperatorAudit()).toHaveLength(1);
    expect(readDecisionLog()).toHaveLength(1);
  });

  it('marks diagnostics degraded when ledger endpoint is unavailable', async () => {
    vi.stubEnv('VITE_RUNTIME_LEDGER_ENDPOINT', '');

    await reconcileOperatorLedgers();
    const diagnostics = getDiagnostics();
    expect(diagnostics.data.adapterHealth).toBe('offline');
    expect(diagnostics.health).toBe('offline');
  });

  it('runs operator actions through endpoint and records success receipt', async () => {
    vi.stubEnv('VITE_RUNTIME_ACTION_ENDPOINT', 'https://runtime.example/actions');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));

    const receipt = await runOperatorAction({
      action: 'retry',
      source: 'live',
      targetId: 'session-2',
      targetType: 'session',
      payload: { retry: true },
    });

    expect(receipt.status).toBe('success');
    expect(receipt.result).toContain('Dispatched');
    expect(readDecisionLog()[0].targetId).toBe('session-2');
    expect(readOperatorAudit()[0].targetId).toBe('session-2');
    expect(fetch).toHaveBeenCalledWith(
      'https://runtime.example/actions',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('records failed audit receipt when action endpoint fails', async () => {
    vi.stubEnv('VITE_RUNTIME_ACTION_ENDPOINT', 'https://runtime.example/actions');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }));

    const receipt = await runOperatorAction({
      action: 'kill',
      source: 'live',
      targetId: 'session-9',
      targetType: 'session',
      payload: { reason: 'hung process' },
    });

    expect(receipt.status).toBe('failed');
    expect(receipt.error).toContain('Action endpoint failed with status 503');
    expect(readDecisionLog()).toHaveLength(0);
    expect(readOperatorAudit()[0].action).toBe('kill');
  });

  it('sanitizes malformed and unserializable payloads safely', () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;

    expect(() => sanitizePayloadPreview(circular)).not.toThrow();
    expect(sanitizePayloadPreview(circular)).not.toBe('none');
  });

  it('formats freshness labels consistently', () => {
    expect(formatFreshnessLabel(undefined, undefined)).toBe('unknown');
    expect(formatFreshnessLabel(new Date(Date.now() - 4_000).toISOString())).toBe('4s ago');
    expect(formatFreshnessLabel(undefined, 120_000)).toBe('2m ago');
  });
});
