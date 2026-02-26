import type { EnvironmentProfile } from '@/lib/environment-session';

export const defaultEnvironmentProfile: EnvironmentProfile = {
  environmentName: 'openclaw-web',
  workspaceCandidates: [
    'env:VITE_WORKSPACE_PATH',
    'local:openclaw.workspace.path',
    'env:VITE_WORKSPACE_FALLBACK',
  ],
  channelSources: [
    'query:channel',
    'local:openclaw.channel',
    'env:VITE_DEFAULT_CHANNEL',
  ],
  sessionMetadataKeys: [
    'query:session',
    'query:agent',
    'local:openclaw.session.id',
    'env:VITE_RUNTIME_NAME',
  ],
  integrations: [
    { id: 'openai', envVar: 'VITE_OPENAI_API_KEY', label: 'OpenAI', authType: 'apiKey' },
    { id: 'anthropic', envVar: 'VITE_ANTHROPIC_API_KEY', label: 'Anthropic', authType: 'apiKey' },
    { id: 'github', envVar: 'VITE_GITHUB_TOKEN', label: 'GitHub', authType: 'token' },
    { id: 'slack', envVar: 'VITE_SLACK_BOT_TOKEN', label: 'Slack', authType: 'token' },
    { id: 'telegram', envVar: 'VITE_TELEGRAM_BOT_TOKEN', label: 'Telegram', authType: 'token' },
    { id: 'elevenlabs', envVar: 'VITE_ELEVENLABS_API_KEY', label: 'ElevenLabs', authType: 'apiKey' },
  ],
  redaction: [
    { pattern: 'sk-[A-Za-z0-9_-]{8,}', replacement: 'sk-[REDACTED]' },
    { pattern: 'gh[pousr]_[A-Za-z0-9]{10,}', replacement: 'gh_[REDACTED]' },
    { pattern: 'xox[baprs]-[A-Za-z0-9-]{10,}', replacement: 'xox-[REDACTED]' },
    { pattern: '[0-9]{8,}:[A-Za-z0-9_-]{16,}', replacement: 'telegram-[REDACTED]' },
    { pattern: 'Bearer [A-Za-z0-9._-]+', replacement: 'Bearer [REDACTED]' },
  ],
};
