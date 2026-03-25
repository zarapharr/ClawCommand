import { describe, expect, it } from 'vitest';
import { CLAWCOMMAND_CONTRACT_VERSION, CLAWCOMMAND_PROTOCOL, evaluateRuntimeContract, parseRuntimeContractSnapshot } from '@/lib/runtime-contract';

describe('runtime contract checks', () => {
  it('flags missing metadata', () => {
    const report = evaluateRuntimeContract(null);
    expect(report.status).toBe('warn');
  });

  it('accepts matching snapshot', () => {
    const report = evaluateRuntimeContract({
      protocol: CLAWCOMMAND_PROTOCOL,
      contractVersion: CLAWCOMMAND_CONTRACT_VERSION,
      supportedMethods: ['agents.list', 'sessions.list', 'chat.history', 'chat.send', 'health'],
    });
    expect(report.status).toBe('ok');
  });

  it('parses snapshot from storage json', () => {
    const parsed = parseRuntimeContractSnapshot(JSON.stringify({ protocol: 3, contractVersion: '2026.03.11' }));
    expect(parsed?.protocol).toBe(3);
  });
});

