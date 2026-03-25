export interface FeatureAvailability {
  enabled: boolean;
  reason?: string;
}

export interface RuntimeFeatureFlags {
  voice: FeatureAvailability;
  qmd: FeatureAvailability;
}

const STORAGE_KEY = 'clawcommand.runtime.capabilities';

function parseBooleanEnv(input: string | undefined, fallback = true): boolean {
  if (input === undefined) return fallback;
  const normalized = input.trim().toLowerCase();
  if (normalized === 'false' || normalized === '0' || normalized === 'off' || normalized === 'no') return false;
  if (normalized === 'true' || normalized === '1' || normalized === 'on' || normalized === 'yes') return true;
  return fallback;
}

function localCapability(feature: 'voice' | 'qmd'): FeatureAvailability | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const value = parsed[feature];
    if (typeof value === 'boolean') {
      return { enabled: value, reason: value ? undefined : 'Runtime capability was disabled by gateway profile.' };
    }
    if (value && typeof value === 'object') {
      const record = value as Record<string, unknown>;
      if (typeof record.enabled === 'boolean') {
        return {
          enabled: record.enabled,
          reason: !record.enabled && typeof record.reason === 'string' ? record.reason : undefined,
        };
      }
    }
  } catch {
    return null;
  }
  return null;
}

export function getRuntimeFeatureFlags(): RuntimeFeatureFlags {
  const envVoice = parseBooleanEnv(import.meta.env.VITE_ENABLE_VOICE_HUB as string | undefined, true);
  const envQmd = parseBooleanEnv(import.meta.env.VITE_ENABLE_QMD as string | undefined, true);
  const runtimeVoice = localCapability('voice');
  const runtimeQmd = localCapability('qmd');

  const voice = !envVoice
    ? { enabled: false, reason: 'Voice Hub is disabled in this environment.' }
    : runtimeVoice ?? { enabled: true };

  const qmd = !envQmd
    ? { enabled: false, reason: 'QMD Analytics is disabled in this environment.' }
    : runtimeQmd ?? { enabled: true };

  return { voice, qmd };
}

