// Enterprise Mock Data for ClawCommand
import type {
  AgentBudget, SessionCost, BudgetAlert, ModelRouting, RoutingRule,
  AgentVersion, AgentGroup, Workflow, CostAnalytics, PerformanceAnalytics,
  CollaborationMetrics, ModelTier, AuditLog
} from '@/types/enterprise';

// ============================================
// MODEL TIERS & PRICING
// ============================================

export const modelTiers: ModelTier[] = [
  {
    id: 'claude-opus-4-6',
    name: 'Claude Opus 4.6',
    costPer1kTokens: 0.015,
    category: 'premium',
    provider: 'anthropic',
    capabilities: ['coding', 'analysis', 'creative-writing', 'complex-reasoning'],
  },
  {
    id: 'claude-sonnet-4-6',
    name: 'Claude Sonnet 4.6',
    costPer1kTokens: 0.003,
    category: 'standard',
    provider: 'anthropic',
    capabilities: ['general-tasks', 'summarization', 'qa'],
  },
  {
    id: 'claude-haiku-4-6',
    name: 'Claude Haiku 4.6',
    costPer1kTokens: 0.00025,
    category: 'economy',
    provider: 'anthropic',
    capabilities: ['quick-tasks', 'simple-qa'],
  },
  {
    id: 'gpt-4',
    name: 'GPT-4',
    costPer1kTokens: 0.03,
    category: 'premium',
    provider: 'openai',
    capabilities: ['coding', 'analysis', 'creative-writing'],
  },
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    costPer1kTokens: 0.01,
    category: 'standard',
    provider: 'openai',
    capabilities: ['general-tasks', 'summarization'],
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    costPer1kTokens: 0.0005,
    category: 'economy',
    provider: 'openai',
    capabilities: ['simple-tasks'],
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    costPer1kTokens: 0.002,
    category: 'standard',
    provider: 'perplexity',
    capabilities: ['research', 'web-search'],
  },
];

// ============================================
// AGENT BUDGETS
// ============================================

export const mockAgentBudgets: AgentBudget[] = [
  {
    agentId: 'chief-of-staff',
    monthlyBudget: 500,
    spentThisMonth: 324.56,
    alertThreshold: 80,
    hardLimit: false,
    modelTiers: {
      premium: { limit: 300, spent: 250 },
      standard: { limit: 150, spent: 60 },
      economy: { limit: 50, spent: 14.56 },
    },
    onBudgetExceeded: 'notify',
    rolloverEnabled: true,
  },
  {
    agentId: 'researcher',
    monthlyBudget: 300,
    spentThisMonth: 189.23,
    alertThreshold: 75,
    hardLimit: true,
    modelTiers: {
      premium: { limit: 100, spent: 45 },
      standard: { limit: 150, spent: 120 },
      economy: { limit: 50, spent: 24.23 },
    },
    onBudgetExceeded: 'downgrade',
    rolloverEnabled: false,
  },
  {
    agentId: 'writer',
    monthlyBudget: 200,
    spentThisMonth: 87.45,
    alertThreshold: 80,
    hardLimit: false,
    modelTiers: {
      premium: { limit: 50, spent: 20 },
      standard: { limit: 100, spent: 55 },
      economy: { limit: 50, spent: 12.45 },
    },
    onBudgetExceeded: 'notify',
    rolloverEnabled: true,
  },
  {
    agentId: 'coder',
    monthlyBudget: 400,
    spentThisMonth: 356.78,
    alertThreshold: 85,
    hardLimit: true,
    modelTiers: {
      premium: { limit: 300, spent: 280 },
      standard: { limit: 80, spent: 65 },
      economy: { limit: 20, spent: 11.78 },
    },
    onBudgetExceeded: 'escalate',
    rolloverEnabled: false,
  },
  {
    agentId: 'analyst',
    monthlyBudget: 150,
    spentThisMonth: 45.67,
    alertThreshold: 80,
    hardLimit: false,
    modelTiers: {
      premium: { limit: 50, spent: 15 },
      standard: { limit: 80, spent: 25 },
      economy: { limit: 20, spent: 5.67 },
    },
    onBudgetExceeded: 'notify',
    rolloverEnabled: true,
  },
  {
    agentId: 'editor',
    monthlyBudget: 100,
    spentThisMonth: 23.45,
    alertThreshold: 80,
    hardLimit: false,
    modelTiers: {
      premium: { limit: 20, spent: 5 },
      standard: { limit: 60, spent: 15 },
      economy: { limit: 20, spent: 3.45 },
    },
    onBudgetExceeded: 'downgrade',
    rolloverEnabled: true,
  },
  {
    agentId: 'tester',
    monthlyBudget: 100,
    spentThisMonth: 67.89,
    alertThreshold: 80,
    hardLimit: false,
    modelTiers: {
      premium: { limit: 30, spent: 20 },
      standard: { limit: 50, spent: 35 },
      economy: { limit: 20, spent: 12.89 },
    },
    onBudgetExceeded: 'notify',
    rolloverEnabled: true,
  },
  {
    agentId: 'designer',
    monthlyBudget: 150,
    spentThisMonth: 0,
    alertThreshold: 80,
    hardLimit: false,
    modelTiers: {
      premium: { limit: 50, spent: 0 },
      standard: { limit: 80, spent: 0 },
      economy: { limit: 20, spent: 0 },
    },
    onBudgetExceeded: 'notify',
    rolloverEnabled: true,
  },
];

// ============================================
// SESSION COSTS
// ============================================

export const mockSessionCosts: SessionCost[] = [
  { sessionId: 'session-1', agentId: 'chief-of-staff', inputTokens: 1523, outputTokens: 2847, costUSD: 0.065, modelUsed: 'claude-opus-4-6', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
  { sessionId: 'session-1', agentId: 'chief-of-staff', inputTokens: 892, outputTokens: 1456, costUSD: 0.035, modelUsed: 'claude-sonnet-4-6', timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() },
  { sessionId: 'session-2', agentId: 'researcher', inputTokens: 2341, outputTokens: 4523, costUSD: 0.103, modelUsed: 'perplexity', timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() },
  { sessionId: 'session-2', agentId: 'researcher', inputTokens: 567, outputTokens: 892, costUSD: 0.004, modelUsed: 'claude-haiku-4-6', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
  { sessionId: 'session-3', agentId: 'writer', inputTokens: 1234, outputTokens: 2156, costUSD: 0.010, modelUsed: 'gpt-4-turbo', timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() },
  { sessionId: 'session-4', agentId: 'coder', inputTokens: 4521, outputTokens: 8234, costUSD: 0.191, modelUsed: 'claude-opus-4-6', timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() },
  { sessionId: 'session-5', agentId: 'analyst', inputTokens: 678, outputTokens: 1234, costUSD: 0.006, modelUsed: 'gpt-3.5-turbo', timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() },
];

// ============================================
// BUDGET ALERTS
// ============================================

export const mockBudgetAlerts: BudgetAlert[] = [
  {
    id: 'alert-1',
    agentId: 'coder',
    type: 'warning',
    message: 'Budget at 89% - Consider optimizing model usage',
    currentSpend: 356.78,
    budgetLimit: 400,
    percentage: 89,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    acknowledged: false,
  },
  {
    id: 'alert-2',
    agentId: 'chief-of-staff',
    type: 'warning',
    message: 'Budget at 65% - On track for monthly limit',
    currentSpend: 324.56,
    budgetLimit: 500,
    percentage: 65,
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    acknowledged: true,
  },
];

// ============================================
// MODEL ROUTING
// ============================================

export const mockRoutingRules: RoutingRule[] = [
  {
    id: 'rule-1',
    ifTaskContains: ['code', 'programming', 'debug', 'refactor'],
    useModel: 'claude-opus-4-6',
    overrideReason: 'Complex coding tasks require premium model',
    priority: 1,
    enabled: true,
  },
  {
    id: 'rule-2',
    ifTaskContains: ['summarize', 'summary', 'brief'],
    useModel: 'claude-haiku-4-6',
    overrideReason: 'Summarization is efficient with economy model',
    priority: 2,
    enabled: true,
  },
  {
    id: 'rule-3',
    ifTaskContains: ['research', 'search', 'find'],
    useModel: 'perplexity',
    overrideReason: 'Research tasks benefit from web search',
    priority: 3,
    enabled: true,
  },
];

export const mockModelRoutings: ModelRouting[] = [
  {
    agentId: 'chief-of-staff',
    allowedModels: {
      primary: 'claude-opus-4-6',
      fallback: 'claude-sonnet-4-6',
      escalation: 'claude-opus-4-6',
    },
    routingRules: mockRoutingRules,
    costOptimization: {
      maxCostPerRequest: 0.5,
      preferCheaperWhenConfidenceHigh: true,
      downgradeAfterBudgetPercent: 85,
    },
  },
  {
    agentId: 'coder',
    allowedModels: {
      primary: 'claude-opus-4-6',
      fallback: 'gpt-4',
      escalation: 'claude-opus-4-6',
    },
    routingRules: [mockRoutingRules[0]],
    costOptimization: {
      maxCostPerRequest: 1.0,
      preferCheaperWhenConfidenceHigh: false,
      downgradeAfterBudgetPercent: 90,
    },
  },
  {
    agentId: 'writer',
    allowedModels: {
      primary: 'claude-sonnet-4-6',
      fallback: 'gpt-4-turbo',
      escalation: 'claude-opus-4-6',
    },
    routingRules: [mockRoutingRules[1]],
    costOptimization: {
      maxCostPerRequest: 0.3,
      preferCheaperWhenConfidenceHigh: true,
      downgradeAfterBudgetPercent: 80,
    },
  },
];

// ============================================
// AGENT VERSIONS
// ============================================

export const mockAgentVersions: AgentVersion[] = [
  {
    id: 'ver-1',
    agentId: 'chief-of-staff',
    timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    changes: 'Initial configuration',
    author: 'admin',
    config: {
      name: 'Chief of Staff',
      emoji: '🦞',
      role: 'Orchestrator',
      description: 'Coordinates all agents',
      model: { provider: 'anthropic', model: 'claude-sonnet-4-6', temperature: 0.7, maxTokens: 4096 },
      tools: { allow: ['message', 'cron'], deny: [] },
      skills: ['task_management'],
      bootstrapFiles: {},
    },
    isActive: false,
  },
  {
    id: 'ver-2',
    agentId: 'chief-of-staff',
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    changes: 'Upgraded to Claude Opus for better coordination',
    author: 'admin',
    config: {
      name: 'Chief of Staff',
      emoji: '🦞',
      role: 'Orchestrator',
      description: 'Coordinates all agents and manages daily operations',
      model: { provider: 'anthropic', model: 'claude-opus-4-6', temperature: 0.7, maxTokens: 4096 },
      tools: { allow: ['message', 'cron', 'agents_list', 'sessions_send'], deny: [] },
      skills: ['task_management', 'coordination', 'planning'],
      bootstrapFiles: {},
    },
    isActive: true,
  },
];

// ============================================
// AGENT GROUPS
// ============================================

export const mockAgentGroups: AgentGroup[] = [
  {
    id: 'group-1',
    name: 'Core Team',
    agentIds: ['chief-of-staff', 'researcher', 'writer'],
    collapsed: false,
    color: '#00f0ff',
  },
  {
    id: 'group-2',
    name: 'Development',
    agentIds: ['coder', 'tester'],
    collapsed: false,
    color: '#a855f7',
  },
  {
    id: 'group-3',
    name: 'Support',
    agentIds: ['analyst', 'editor'],
    collapsed: true,
    color: '#10b981',
  },
];

// ============================================
// WORKFLOWS
// ============================================

export const mockWorkflows: Workflow[] = [
  {
    id: 'workflow-1',
    name: 'Content Pipeline',
    description: 'Research → Write → Edit → Publish',
    pattern: 'sequential',
    nodes: [
      { id: 'node-1', type: 'input', position: { x: 50, y: 100 }, config: {} },
      { id: 'node-2', type: 'agent', agentId: 'researcher', position: { x: 200, y: 100 }, config: {} },
      { id: 'node-3', type: 'agent', agentId: 'writer', position: { x: 400, y: 100 }, config: {} },
      { id: 'node-4', type: 'agent', agentId: 'editor', position: { x: 600, y: 100 }, config: {} },
      { id: 'node-5', type: 'output', position: { x: 750, y: 100 }, config: {} },
    ],
    edges: [
      { id: 'edge-1', source: 'node-1', target: 'node-2' },
      { id: 'edge-2', source: 'node-2', target: 'node-3', label: 'research complete' },
      { id: 'edge-3', source: 'node-3', target: 'node-4', label: 'draft ready' },
      { id: 'edge-4', source: 'node-4', target: 'node-5', label: 'approved' },
    ],
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: true,
  },
  {
    id: 'workflow-2',
    name: 'Code Review',
    description: 'Coder submits → Tester reviews → Chief approves',
    pattern: 'supervisor',
    nodes: [
      { id: 'node-1', type: 'agent', agentId: 'coder', position: { x: 100, y: 150 }, config: {} },
      { id: 'node-2', type: 'supervisor', agentId: 'chief-of-staff', position: { x: 300, y: 100 }, config: {} },
      { id: 'node-3', type: 'agent', agentId: 'tester', position: { x: 500, y: 100 }, config: {} },
      { id: 'node-4', type: 'agent', agentId: 'tester', position: { x: 500, y: 200 }, config: {} },
    ],
    edges: [
      { id: 'edge-1', source: 'node-1', target: 'node-2', label: 'PR submitted' },
      { id: 'edge-2', source: 'node-2', target: 'node-3', label: 'review security' },
      { id: 'edge-3', source: 'node-2', target: 'node-4', label: 'review performance' },
    ],
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: true,
  },
];

// ============================================
// ANALYTICS DATA
// ============================================

export const mockCostAnalytics: CostAnalytics = {
  agentCosts: [
    { agentId: 'chief-of-staff', agentName: 'Chief of Staff', dailyCost: 10.82, monthlyCost: 324.56, budgetUtilization: 65, trend: 'stable' },
    { agentId: 'coder', agentName: 'Coder', dailyCost: 11.89, monthlyCost: 356.78, budgetUtilization: 89, trend: 'up' },
    { agentId: 'researcher', agentName: 'Researcher', dailyCost: 6.31, monthlyCost: 189.23, budgetUtilization: 63, trend: 'stable' },
    { agentId: 'writer', agentName: 'Writer', dailyCost: 2.92, monthlyCost: 87.45, budgetUtilization: 44, trend: 'down' },
    { agentId: 'analyst', agentName: 'Analyst', dailyCost: 1.52, monthlyCost: 45.67, budgetUtilization: 30, trend: 'stable' },
    { agentId: 'editor', agentName: 'Editor', dailyCost: 0.78, monthlyCost: 23.45, budgetUtilization: 23, trend: 'stable' },
    { agentId: 'tester', agentName: 'Tester', dailyCost: 2.26, monthlyCost: 67.89, budgetUtilization: 68, trend: 'up' },
  ],
  modelDistribution: [
    { modelId: 'claude-opus-4-6', modelName: 'Claude Opus', requestCount: 245, tokenCount: 892345, costUSD: 13.39, percentage: 45 },
    { modelId: 'claude-sonnet-4-6', modelName: 'Claude Sonnet', requestCount: 412, tokenCount: 1234567, costUSD: 3.70, percentage: 28 },
    { modelId: 'perplexity', modelName: 'Perplexity', requestCount: 156, tokenCount: 567890, costUSD: 1.14, percentage: 15 },
    { modelId: 'gpt-4-turbo', modelName: 'GPT-4 Turbo', requestCount: 89, tokenCount: 234567, costUSD: 2.35, percentage: 8 },
    { modelId: 'claude-haiku-4-6', modelName: 'Claude Haiku', requestCount: 234, tokenCount: 456789, costUSD: 0.11, percentage: 4 },
  ],
  tokenEfficiency: {
    averageInputTokens: 1245,
    averageOutputTokens: 2134,
    inputOutputRatio: 0.58,
    costPerRequest: 0.045,
    optimizationScore: 78,
  },
  burnRate: {
    currentMonthlySpend: 1095.93,
    projectedMonthlySpend: 1424.71,
    daysUntilBudgetExhausted: 8,
    recommendedActions: [
      'Coder agent approaching budget limit - consider downgrading model',
      'Researcher has unused budget - can absorb overflow',
      'Consider enabling cost optimization for Chief of Staff',
    ],
  },
};

export const mockPerformanceAnalytics: PerformanceAnalytics = {
  responseTimeHeatmap: [
    { agentId: 'chief-of-staff', averageMs: 2340, p50Ms: 2100, p95Ms: 4500, p99Ms: 8900 },
    { agentId: 'coder', averageMs: 4567, p50Ms: 4200, p95Ms: 7800, p99Ms: 12000 },
    { agentId: 'researcher', averageMs: 3456, p50Ms: 3100, p95Ms: 5600, p99Ms: 9800 },
    { agentId: 'writer', averageMs: 1890, p50Ms: 1700, p95Ms: 3400, p99Ms: 5600 },
    { agentId: 'analyst', averageMs: 1234, p50Ms: 1100, p95Ms: 2300, p99Ms: 4100 },
  ],
  successRate: {
    overall: 94.5,
    byAgent: {
      'chief-of-staff': 97.2,
      'coder': 91.3,
      'researcher': 95.8,
      'writer': 96.1,
      'analyst': 98.2,
    },
    byTaskType: {
      'code-review': 89.5,
      'research': 96.2,
      'writing': 97.8,
      'analysis': 98.5,
    },
    trend: 'improving',
  },
  toolUsage: [
    { toolId: 'web_search', toolName: 'Web Search', usageCount: 456, successRate: 98.2, averageExecutionTime: 2340 },
    { toolId: 'apply_patch', toolName: 'Apply Patch', usageCount: 234, successRate: 87.6, averageExecutionTime: 1234 },
    { toolId: 'exec', toolName: 'Execute Command', usageCount: 189, successRate: 92.1, averageExecutionTime: 5678 },
    { toolId: 'browser', toolName: 'Browser', usageCount: 123, successRate: 95.4, averageExecutionTime: 8901 },
  ],
  sessionDuration: {
    averageSeconds: 456,
    medianSeconds: 345,
    byAgent: {
      'chief-of-staff': 678,
      'coder': 1234,
      'researcher': 890,
      'writer': 456,
      'analyst': 234,
    },
  },
};

export const mockCollaborationMetrics: CollaborationMetrics = {
  interAgentMessages: [
    { id: 'msg-1', fromAgentId: 'chief-of-staff', toAgentId: 'researcher', messageType: 'delegation', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), content: 'Research Q4 market trends' },
    { id: 'msg-2', fromAgentId: 'researcher', toAgentId: 'writer', messageType: 'notification', timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), content: 'Research complete - ready for writing' },
    { id: 'msg-3', fromAgentId: 'writer', toAgentId: 'editor', messageType: 'delegation', timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), content: 'Please review this draft' },
  ],
  handoffSuccessRate: 87.5,
  totalHandoffs: 48,
  successfulHandoffs: 42,
  conflictsResolved: 5,
  conflictsEscalated: 2,
  averageResolutionTime: 12.5,
};

// ============================================
// AUDIT LOGS
// ============================================

export const mockAuditLogs: AuditLog[] = [
  {
    id: 'audit-1',
    userId: 'admin',
    userName: 'Admin User',
    action: 'UPDATE',
    resourceType: 'agent',
    resourceId: 'coder',
    changes: { model: { old: 'claude-sonnet-4-6', new: 'claude-opus-4-6' } },
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    ipAddress: '192.168.1.100',
  },
  {
    id: 'audit-2',
    userId: 'admin',
    userName: 'Admin User',
    action: 'CREATE',
    resourceType: 'skill',
    resourceId: 'web_search',
    changes: {},
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    ipAddress: '192.168.1.100',
  },
  {
    id: 'audit-3',
    userId: 'manager',
    userName: 'Manager User',
    action: 'UPDATE',
    resourceType: 'agent',
    resourceId: 'chief-of-staff',
    changes: { budget: { old: 400, new: 500 } },
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    ipAddress: '192.168.1.101',
  },
];
