import { describe, expect, it, beforeEach, vi } from 'vitest';
import { appendDecisionLog, appendOperatorAudit, readDecisionLog, readOperatorAudit, sanitizePayloadPreview } from '@/lib/runtime-adapters';

describe('runtime adapters', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('sanitizes payload previews and caps length', () => {
    const preview = sanitizePayloadPreview({ token: 'sk-test-1234567890', message: 'hello' });
    expect(preview.length).toBeLessThanOrEqual(240);
    expect(preview).toContain('message');
  });

  it('stores operator audit receipts with command ids', () => {
    const receipt = appendOperatorAudit({
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

  it('stores decision log entries', () => {
    appendDecisionLog({
      decision: 'retry cron:job-1',
      reason: 'unit-test',
      targetId: 'job-1',
      targetType: 'cron',
    });

    expect(readDecisionLog()).toHaveLength(1);
    expect(readDecisionLog()[0].reason).toBe('unit-test');
  });
});
