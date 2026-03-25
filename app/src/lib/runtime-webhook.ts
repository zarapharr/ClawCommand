import type { OperatorAuditEntry } from '@/lib/runtime-adapters';

export interface RuntimeWebhookRequest {
  headers: Record<string, string | undefined>;
  rawBody: string;
}

export interface RuntimeWebhookPayload {
  id: string;
  action: OperatorAuditEntry['action'];
  targetType: OperatorAuditEntry['targetType'];
  targetId: string;
  source?: 'live' | 'fallback';
  payload?: unknown;
}

export interface IdempotencyStore {
  has(key: string): boolean;
  set(key: string): void;
}

export interface RuntimeWebhookVerification {
  ok: boolean;
  status: 200 | 202 | 400 | 401;
  reason?: string;
  retryable: boolean;
  duplicate?: boolean;
  attempt: number;
  payload?: RuntimeWebhookPayload;
}

function normalizeHeaders(headers: Record<string, string | undefined>): Record<string, string> {
  return Object.entries(headers).reduce<Record<string, string>>((acc, [key, value]) => {
    if (typeof value === 'string') acc[key.toLowerCase()] = value;
    return acc;
  }, {});
}

function parseAttempt(headers: Record<string, string>): number {
  const raw = headers['x-claw-attempt'];
  const attempt = raw ? Number(raw) : 1;
  return Number.isFinite(attempt) && attempt > 0 ? Math.floor(attempt) : 1;
}

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function matchesSignature(rawBody: string, signatureHeader: string | undefined, sharedSecret: string): Promise<boolean> {
  if (!signatureHeader?.startsWith('sha256=')) return false;
  const provided = signatureHeader.slice('sha256='.length);
  const expected = await sha256Hex(`${sharedSecret}.${rawBody}`);
  return provided === expected;
}

function parsePayload(rawBody: string): RuntimeWebhookPayload | undefined {
  try {
    const candidate = JSON.parse(rawBody) as Partial<RuntimeWebhookPayload>;
    if (!candidate || typeof candidate !== 'object') return undefined;
    if (!candidate.id || !candidate.action || !candidate.targetType || !candidate.targetId) return undefined;
    return {
      id: String(candidate.id),
      action: candidate.action,
      targetType: candidate.targetType,
      targetId: String(candidate.targetId),
      source: candidate.source ?? 'live',
      payload: candidate.payload,
    };
  } catch {
    return undefined;
  }
}

export async function verifyRuntimeWebhook(
  request: RuntimeWebhookRequest,
  config: {
    bearerToken: string;
    sharedSecret: string;
    idempotencyStore: IdempotencyStore;
  },
): Promise<RuntimeWebhookVerification> {
  const headers = normalizeHeaders(request.headers);
  const attempt = parseAttempt(headers);

  if (headers.authorization !== `Bearer ${config.bearerToken}`) {
    return { ok: false, status: 401, reason: 'Invalid bearer token.', retryable: false, attempt };
  }

  const signatureValid = await matchesSignature(request.rawBody, headers['x-claw-signature'], config.sharedSecret);
  if (!signatureValid) {
    return { ok: false, status: 401, reason: 'Invalid request signature.', retryable: false, attempt };
  }

  const payload = parsePayload(request.rawBody);
  if (!payload) {
    return { ok: false, status: 400, reason: 'Malformed payload.', retryable: false, attempt };
  }

  if (config.idempotencyStore.has(payload.id)) {
    return { ok: true, status: 202, duplicate: true, retryable: false, attempt, payload };
  }

  config.idempotencyStore.set(payload.id);
  return { ok: true, status: 200, retryable: false, attempt, payload };
}

export function toOperatorAction(payload: RuntimeWebhookPayload): {
  action: OperatorAuditEntry['action'];
  targetType: OperatorAuditEntry['targetType'];
  targetId: string;
  source: 'live' | 'fallback';
  payload?: unknown;
} {
  return {
    action: payload.action,
    targetType: payload.targetType,
    targetId: payload.targetId,
    source: payload.source ?? 'live',
    payload: payload.payload,
  };
}
