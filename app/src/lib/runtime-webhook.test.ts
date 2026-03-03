import { describe, expect, it } from 'vitest';
import { toOperatorAction, verifyRuntimeWebhook } from '@/lib/runtime-webhook';

class MemoryIdempotencyStore {
  private readonly seen = new Set<string>();

  has(key: string): boolean {
    return this.seen.has(key);
  }

  set(key: string): void {
    this.seen.add(key);
  }
}

async function signedRequest(rawBody: string, opts?: { token?: string; secret?: string; attempt?: number }) {
  const secret = opts?.secret ?? 'runtime-secret';
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${secret}.${rawBody}`));
  const signature = Array.from(new Uint8Array(hash)).map((byte) => byte.toString(16).padStart(2, '0')).join('');

  return {
    headers: {
      authorization: `Bearer ${opts?.token ?? 'runtime-token'}`,
      'x-claw-signature': `sha256=${signature}`,
      'x-claw-attempt': String(opts?.attempt ?? 1),
    },
    rawBody,
  };
}

describe('runtime webhook verification', () => {
  it('accepts valid auth/signature and maps payload to operator action', async () => {
    const body = JSON.stringify({
      id: 'evt-1',
      action: 'retry',
      targetType: 'cron',
      targetId: 'cron-7',
      payload: { reason: 'manual-retry' },
    });

    const result = await verifyRuntimeWebhook(
      await signedRequest(body),
      {
        bearerToken: 'runtime-token',
        sharedSecret: 'runtime-secret',
        idempotencyStore: new MemoryIdempotencyStore(),
      },
    );

    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
    expect(result.attempt).toBe(1);

    const action = toOperatorAction(result.payload!);
    expect(action).toMatchObject({
      action: 'retry',
      targetType: 'cron',
      targetId: 'cron-7',
      source: 'live',
    });
  });

  it('rejects bad bearer token or signature', async () => {
    const body = JSON.stringify({
      id: 'evt-auth',
      action: 'start',
      targetType: 'agent',
      targetId: 'agent-1',
    });

    const badToken = await verifyRuntimeWebhook(
      await signedRequest(body, { token: 'wrong' }),
      {
        bearerToken: 'runtime-token',
        sharedSecret: 'runtime-secret',
        idempotencyStore: new MemoryIdempotencyStore(),
      },
    );
    expect(badToken.ok).toBe(false);
    expect(badToken.status).toBe(401);

    const badSignature = await verifyRuntimeWebhook(
      await signedRequest(body, { secret: 'wrong-secret' }),
      {
        bearerToken: 'runtime-token',
        sharedSecret: 'runtime-secret',
        idempotencyStore: new MemoryIdempotencyStore(),
      },
    );
    expect(badSignature.ok).toBe(false);
    expect(badSignature.status).toBe(401);
  });

  it('rejects malformed payloads', async () => {
    const malformed = await verifyRuntimeWebhook(
      await signedRequest('{"id": "evt-malformed", "action":'),
      {
        bearerToken: 'runtime-token',
        sharedSecret: 'runtime-secret',
        idempotencyStore: new MemoryIdempotencyStore(),
      },
    );

    expect(malformed.ok).toBe(false);
    expect(malformed.status).toBe(400);
    expect(malformed.reason).toContain('Malformed');
  });

  it('handles retries with idempotency by returning duplicate on repeated event id', async () => {
    const body = JSON.stringify({
      id: 'evt-dup-1',
      action: 'retry',
      targetType: 'session',
      targetId: 'session-4',
    });

    const store = new MemoryIdempotencyStore();

    const first = await verifyRuntimeWebhook(
      await signedRequest(body, { attempt: 1 }),
      {
        bearerToken: 'runtime-token',
        sharedSecret: 'runtime-secret',
        idempotencyStore: store,
      },
    );

    const retry = await verifyRuntimeWebhook(
      await signedRequest(body, { attempt: 2 }),
      {
        bearerToken: 'runtime-token',
        sharedSecret: 'runtime-secret',
        idempotencyStore: store,
      },
    );

    expect(first.ok).toBe(true);
    expect(first.status).toBe(200);
    expect(retry.ok).toBe(true);
    expect(retry.status).toBe(202);
    expect(retry.duplicate).toBe(true);
    expect(retry.attempt).toBe(2);
  });
});
