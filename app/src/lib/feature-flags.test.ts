import { describe, expect, it, vi } from 'vitest';
import { getRuntimeFeatureFlags } from '@/lib/feature-flags';

describe('feature flags', () => {
  it('disables voice when env flag is false', () => {
    vi.stubEnv('VITE_ENABLE_VOICE_HUB', 'false');
    const flags = getRuntimeFeatureFlags();
    expect(flags.voice.enabled).toBe(false);
  });

  it('honors runtime capability overrides', () => {
    window.localStorage.setItem('clawcommand.runtime.capabilities', JSON.stringify({ qmd: { enabled: false, reason: 'backend unavailable' } }));
    const flags = getRuntimeFeatureFlags();
    expect(flags.qmd.enabled).toBe(false);
    expect(flags.qmd.reason).toContain('backend unavailable');
  });
});

