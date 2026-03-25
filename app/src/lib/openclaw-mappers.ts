import type { Agent, Session } from '@/types';
import type { ModelConfig, RuntimeStatus } from '@/lib/openclaw-api';

export type ChatSortOrder = 'latest' | 'oldest' | 'name';

export function sortSessions(sessions: Session[], order: ChatSortOrder): Session[] {
  return [...sessions].sort((a, b) => {
    if (order === 'latest') return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime();
    if (order === 'oldest') return new Date(a.lastActivity).getTime() - new Date(b.lastActivity).getTime();
    return (a.key || a.id).localeCompare(b.key || b.id);
  });
}

export function toSessionSummaries(sessions: Session[]) {
  return sessions.map((session) => ({
    id: session.id,
    agentId: session.agentId,
    title: session.key || `${session.agentName} chat`,
    lastMessageAt: session.lastActivity,
    messageCount: session.messageCount,
    totalTokens: session.messages.reduce((sum, msg) => sum + (msg.tokens?.input ?? 0) + (msg.tokens?.output ?? 0), 0),
    totalCost: 0,
  }));
}

export function toModelUsage(agents: Agent[], sessions: Session[]) {
  return agents.map((agent) => {
    const matched = sessions.filter((session) => session.agentId === agent.id);
    const tokens = matched.reduce((sum, session) => (
      sum + session.messages.reduce((inner, msg) => inner + (msg.tokens?.input ?? 0) + (msg.tokens?.output ?? 0), 0)
    ), 0);

    return {
      agentId: agent.id,
      agentName: agent.name,
      agentEmoji: agent.emoji,
      modelId: agent.model.model,
      modelName: agent.model.model,
      tokensUsed: tokens,
      cost: 0,
      requests: matched.reduce((sum, session) => sum + session.messageCount, 0),
      lastUsed: agent.metrics.lastActive,
    };
  });
}

export function flattenModelConfig(config: ModelConfig) {
  return config.providers.map((provider) => ({
    id: provider.id,
    name: provider.name,
    icon: provider.id,
    isConfigured: Boolean(provider.apiKey) || provider.enabled,
    isEnabled: provider.enabled,
    apiKey: provider.apiKey,
    baseUrl: provider.baseUrl,
    defaultModel: provider.defaultModel,
    models: provider.models,
  }));
}

export function runtimeMetrics(status: RuntimeStatus) {
  return {
    onlineAgents: status.agents.filter((agent) => agent.status !== 'offline').length,
    workingAgents: status.agents.filter((agent) => agent.status === 'working').length,
    totalTokens: status.agents.reduce((sum, agent) => sum + agent.metrics.tokensUsed, 0),
  };
}
