import type { Agent } from '@/types';

export type AgentConfigDraft = {
  skills: string;
  toolsAllow: string;
  toolsDeny: string;
  bootstrapFiles: Agent['bootstrapFiles'];
  budgetMonthlyLimit: number;
  budgetAlertThreshold: number;
  budgetHardLimit: boolean;
  budgetOnExceeded: 'pause' | 'downgrade' | 'notify' | 'escalate';
  routingPrimary: string;
  routingFallback: string;
  routingEscalation: string;
  routingRules: string;
};

const toList = (value: string) => value.split(/\n|,/).map((item) => item.trim()).filter(Boolean);

const parseRules = (raw: string) => raw
  .split('\n')
  .map((line, index) => ({ line: line.trim(), index }))
  .filter((item) => item.line)
  .map(({ line, index }) => {
    const disabled = line.toLowerCase().includes('[disabled]');
    const clean = line.replace(/\[disabled\]/ig, '').trim();
    const [conditionsRaw, modelRaw] = clean.split('=>').map((part) => part?.trim());
    return {
      id: `rule-${Date.now()}-${index}`,
      ifTaskContains: (conditionsRaw || '').split('|').map((t) => t.trim()).filter(Boolean),
      useModel: modelRaw || 'claude-sonnet-4-6',
      enabled: !disabled,
    };
  })
  .filter((rule) => rule.ifTaskContains.length > 0 && rule.useModel);

export const applyAgentConfigDraft = (agent: Agent, draft: AgentConfigDraft): Agent => ({
  ...agent,
  skills: toList(draft.skills),
  tools: {
    allow: toList(draft.toolsAllow),
    deny: toList(draft.toolsDeny),
  },
  bootstrapFiles: { ...draft.bootstrapFiles },
  budget: {
    monthlyLimit: Math.max(0, Number(draft.budgetMonthlyLimit) || 0),
    alertThreshold: Math.min(100, Math.max(0, Number(draft.budgetAlertThreshold) || 0)),
    hardLimit: draft.budgetHardLimit,
    onExceeded: draft.budgetOnExceeded,
  },
  routing: {
    primary: draft.routingPrimary.trim() || agent.model.model,
    fallback: draft.routingFallback.trim() || agent.model.model,
    escalation: draft.routingEscalation.trim() || agent.model.model,
    rules: parseRules(draft.routingRules),
  },
  updatedAt: new Date().toISOString(),
});
