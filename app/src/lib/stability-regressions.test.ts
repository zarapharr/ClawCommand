import { describe, expect, it, beforeEach } from 'vitest';
import { mapAgent } from '@/lib/openclaw-contract';
import { resolveHealthStateWithHysteresis, resetRuntimeHealthStabilityState } from '@/lib/openclaw-api';

describe('factory floor regression coverage', () => {
  it('maps agent positions into percentage viewport bounds', () => {
    const mapped = Array.from({ length: 8 }, (_, index) => mapAgent({ id: `a-${index}` }, index));

    for (const agent of mapped) {
      expect(agent.position.x).toBeGreaterThanOrEqual(0);
      expect(agent.position.x).toBeLessThanOrEqual(100);
      expect(agent.position.y).toBeGreaterThanOrEqual(0);
      expect(agent.position.y).toBeLessThanOrEqual(100);
    }
  });
});

describe('health hysteresis', () => {
  beforeEach(() => {
    resetRuntimeHealthStabilityState();
  });

  it('debounces transient failures and only marks offline after sustained failures', () => {
    expect(resolveHealthStateWithHysteresis(true)).toBe('degraded');
    expect(resolveHealthStateWithHysteresis(true)).toBe('healthy');

    expect(resolveHealthStateWithHysteresis(false)).toBe('healthy');
    expect(resolveHealthStateWithHysteresis(false)).toBe('degraded');
    expect(resolveHealthStateWithHysteresis(false)).toBe('degraded');
    expect(resolveHealthStateWithHysteresis(false)).toBe('offline');
  });

  it('requires consecutive healthy checks to recover from degraded/offline', () => {
    resolveHealthStateWithHysteresis(false);
    resolveHealthStateWithHysteresis(false);
    resolveHealthStateWithHysteresis(false);
    expect(resolveHealthStateWithHysteresis(false)).toBe('offline');

    expect(resolveHealthStateWithHysteresis(true)).toBe('offline');
    expect(resolveHealthStateWithHysteresis(true)).toBe('healthy');
  });
});
