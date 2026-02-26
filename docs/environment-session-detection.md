# Environment + Session Detection

ClawCommand now includes config-driven environment and session detection for per-user runtime tuning.

## What it captures

The detector builds a `RuntimeSessionSnapshot` with:

- Workspace path and where it came from
- Integration status (configured or not configured)
- Redacted integration previews to avoid secret leakage
- Runtime metadata (browser/user-agent/timezone/viewport)
- Model metadata (`provider`, `model`, temperature, max tokens)
- Channel context and selected channel candidates
- Session metadata from query params, env, and local storage

## Files

- `app/src/lib/environment-session.ts`
  - Detection + redaction engine
- `app/src/config/environment-profile.ts`
  - Default environment profile and redaction rules
- `app/src/pages/SettingsPage.tsx`
  - New **Environment** tab that renders the snapshot

## Configuration model

`EnvironmentProfile` is the extension point:

```ts
interface EnvironmentProfile {
  environmentName: string;
  workspaceCandidates: string[]; // env:<key> | local:<key>
  channelSources: string[]; // query:<key> | local:<key> | env:<key>
  sessionMetadataKeys: string[]; // query:<key> | local:<key> | env:<key>
  integrations: IntegrationProbe[];
  redaction: RedactionRule[];
}
```

This means the detector can adapt across environments without code changes by editing profile config.

## Adding a new environment

1. Create a new profile in `app/src/config/`.
2. Define source order for workspace/channel/session keys.
3. Add integration probes for your auth providers.
4. Add or tighten redaction rules for provider-specific token formats.
5. Pass that profile to `createRuntimeSessionSnapshot(profile)`.

## Security notes

- Raw secrets are never surfaced in the UI.
- Values are scrubbed through regex-based redaction rules first.
- Non-matching long values still get partially masked (`ab***yz`) as a fallback.

## Lightweight validation

Run:

```bash
npm run validate:environment
```

This executes `scripts/validate-environment-session.mjs`, which checks:

- high-signal token redaction behavior
- fallback masking for unknown secret patterns
