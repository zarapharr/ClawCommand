import { gatewayMethodMatrix, verifiedGatewayMethods } from '@/lib/openclaw-contract';

export const CLAWCOMMAND_CONTRACT_VERSION = '2026.03.11';
export const CLAWCOMMAND_PROTOCOL = 3;

export interface RuntimeContractSnapshot {
  protocol?: number;
  contractVersion?: string;
  supportedMethods?: string[];
}

export interface RuntimeContractReport {
  status: 'ok' | 'warn';
  issues: string[];
}

export function parseRuntimeContractSnapshot(raw: string | null): RuntimeContractSnapshot | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      protocol: typeof parsed.protocol === 'number' ? parsed.protocol : undefined,
      contractVersion: typeof parsed.contractVersion === 'string' ? parsed.contractVersion : undefined,
      supportedMethods: Array.isArray(parsed.supportedMethods)
        ? parsed.supportedMethods.filter((value): value is string => typeof value === 'string')
        : undefined,
    };
  } catch {
    return null;
  }
}

function requiredMethods(): string[] {
  return [
    gatewayMethodMatrix.agents.list.method,
    gatewayMethodMatrix.sessions.list.method,
    gatewayMethodMatrix.chat.history.method,
    gatewayMethodMatrix.chat.send.method,
    gatewayMethodMatrix.health.check.method,
  ];
}

export function evaluateRuntimeContract(snapshot: RuntimeContractSnapshot | null): RuntimeContractReport {
  if (!snapshot) {
    return { status: 'warn', issues: ['Runtime contract metadata missing (using optimistic fallback).'] };
  }

  const issues: string[] = [];
  if (snapshot.protocol !== undefined && snapshot.protocol !== CLAWCOMMAND_PROTOCOL) {
    issues.push(`Protocol drift: runtime=${snapshot.protocol}, ui=${CLAWCOMMAND_PROTOCOL}`);
  }
  if (snapshot.contractVersion && snapshot.contractVersion !== CLAWCOMMAND_CONTRACT_VERSION) {
    issues.push(`Contract version drift: runtime=${snapshot.contractVersion}, ui=${CLAWCOMMAND_CONTRACT_VERSION}`);
  }
  if (snapshot.supportedMethods) {
    const required = requiredMethods();
    const missing = required.filter((method) => !snapshot.supportedMethods?.includes(method));
    if (missing.length) {
      issues.push(`Required runtime methods missing: ${missing.join(', ')}`);
    }
  } else if (verifiedGatewayMethods.supported.size < requiredMethods().length) {
    issues.push('Local verified gateway method set appears incomplete.');
  }

  return { status: issues.length ? 'warn' : 'ok', issues };
}

