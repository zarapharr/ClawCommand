export interface RedactionRule {
  pattern: string;
  replacement?: string;
}

export interface IntegrationProbe {
  id: string;
  envVar: string;
  label: string;
  authType: 'apiKey' | 'token' | 'oauth' | 'session' | 'unknown';
}

export interface EnvironmentProfile {
  environmentName: string;
  workspaceCandidates: string[];
  channelSources: string[];
  sessionMetadataKeys: string[];
  integrations: IntegrationProbe[];
  redaction: RedactionRule[];
}

export interface IntegrationStatus {
  id: string;
  label: string;
  authType: IntegrationProbe['authType'];
  configured: boolean;
  source: string;
  redactedPreview?: string;
}

export interface RuntimeSessionSnapshot {
  detectedEnvironment: string;
  workspacePath: string;
  workspaceSource: string;
  runtime: {
    userAgent: string;
    platform: string;
    language: string;
    timezone: string;
    viewport: string;
  };
  model: {
    provider: string;
    model: string;
    temperature: number;
    maxTokens: number;
  };
  sessionMetadata: Record<string, string | null>;
  channels: {
    activeChannel: string;
    candidateChannels: string[];
  };
  integrations: IntegrationStatus[];
  generatedAt: string;
}

const DEFAULT_REPLACEMENT = '[REDACTED]';

function lookupEnv(name: string): string | undefined {
  const value = (import.meta.env as Record<string, string | undefined>)[name];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export function redactValue(value: string, rules: RedactionRule[]): string {
  let redacted = value;

  for (const rule of rules) {
    try {
      const regex = new RegExp(rule.pattern, 'gi');
      redacted = redacted.replace(regex, rule.replacement ?? DEFAULT_REPLACEMENT);
    } catch {
      // Invalid regex should not break visibility features.
      continue;
    }
  }

  if (redacted === value && value.length > 8) {
    return `${value.slice(0, 2)}***${value.slice(-2)}`;
  }

  return redacted;
}

function readLocalStorageKey(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function fromQueryParam(key: string): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get(key);
}

function detectWorkspace(profile: EnvironmentProfile): { value: string; source: string } {
  for (const candidate of profile.workspaceCandidates) {
    const [type, key] = candidate.split(':', 2);
    if (!key) continue;

    if (type === 'env') {
      const value = lookupEnv(key);
      if (value) return { value, source: `env:${key}` };
    }

    if (type === 'local') {
      const value = readLocalStorageKey(key);
      if (value) return { value, source: `local:${key}` };
    }
  }

  return { value: 'unknown', source: 'fallback' };
}

function detectChannelContext(profile: EnvironmentProfile): { active: string; candidates: string[] } {
  const candidates: string[] = [];

  for (const source of profile.channelSources) {
    const [type, key] = source.split(':', 2);
    if (!key) continue;

    let value: string | null | undefined;

    if (type === 'query') value = fromQueryParam(key);
    if (type === 'local') value = readLocalStorageKey(key);
    if (type === 'env') value = lookupEnv(key) ?? null;

    if (value && !candidates.includes(value)) {
      candidates.push(value);
    }
  }

  return {
    active: candidates[0] ?? 'webchat',
    candidates,
  };
}

function detectSessionMetadata(profile: EnvironmentProfile, redaction: RedactionRule[]): Record<string, string | null> {
  const result: Record<string, string | null> = {};

  for (const keySpec of profile.sessionMetadataKeys) {
    const [type, key] = keySpec.split(':', 2);
    if (!key) continue;

    let value: string | null | undefined = null;

    if (type === 'query') value = fromQueryParam(key);
    if (type === 'local') value = readLocalStorageKey(key);
    if (type === 'env') value = lookupEnv(key) ?? null;

    result[key] = value ? redactValue(value, redaction) : null;
  }

  return result;
}

function detectIntegrations(probes: IntegrationProbe[], redaction: RedactionRule[]): IntegrationStatus[] {
  return probes.map((probe) => {
    const raw = lookupEnv(probe.envVar);

    if (!raw) {
      return {
        id: probe.id,
        label: probe.label,
        authType: probe.authType,
        configured: false,
        source: `env:${probe.envVar}`,
      };
    }

    return {
      id: probe.id,
      label: probe.label,
      authType: probe.authType,
      configured: true,
      source: `env:${probe.envVar}`,
      redactedPreview: redactValue(raw, redaction),
    };
  });
}

export function createRuntimeSessionSnapshot(profile: EnvironmentProfile): RuntimeSessionSnapshot {
  const workspace = detectWorkspace(profile);
  const channels = detectChannelContext(profile);

  return {
    detectedEnvironment: profile.environmentName,
    workspacePath: workspace.value,
    workspaceSource: workspace.source,
    runtime: {
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
      platform: typeof navigator !== 'undefined' ? navigator.platform : 'server',
      language: typeof navigator !== 'undefined' ? navigator.language : 'unknown',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      viewport: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'server',
    },
    model: {
      provider: lookupEnv('VITE_DEFAULT_MODEL_PROVIDER') ?? 'openai-codex',
      model: lookupEnv('VITE_DEFAULT_MODEL') ?? 'gpt-5.3-codex',
      temperature: Number(lookupEnv('VITE_DEFAULT_TEMPERATURE') ?? '0.2'),
      maxTokens: Number(lookupEnv('VITE_DEFAULT_MAX_TOKENS') ?? '4000'),
    },
    sessionMetadata: detectSessionMetadata(profile, profile.redaction),
    channels: {
      activeChannel: channels.active,
      candidateChannels: channels.candidates,
    },
    integrations: detectIntegrations(profile.integrations, profile.redaction),
    generatedAt: new Date().toISOString(),
  };
}
