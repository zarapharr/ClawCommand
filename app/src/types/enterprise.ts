// ClawCommand Enterprise Types
// Token Economics, Budget Management, Model Routing, Analytics

// ============================================
// 1. TOKEN ECONOMICS & BUDGET MANAGEMENT
// ============================================

export interface AgentBudget {
  agentId: string;
  monthlyBudget: number;        // USD
  spentThisMonth: number;
  alertThreshold: number;       // 80% warning
  hardLimit: boolean;           // Hard stop vs warning

  // Model-specific budgets
  modelTiers: {
    premium: { limit: number; spent: number };    // GPT-4, Claude Opus
    standard: { limit: number; spent: number };   // GPT-3.5, Claude Sonnet
    economy: { limit: number; spent: number };    // Local models
  };

  // Auto-actions
  onBudgetExceeded: 'pause' | 'downgrade' | 'notify' | 'escalate';
  rolloverEnabled: boolean;
}

export interface SessionCost {
  sessionId: string;
  agentId: string;
  inputTokens: number;
  outputTokens: number;
  costUSD: number;
  modelUsed: string;
  timestamp: string;
}

export interface BudgetAlert {
  id: string;
  agentId: string;
  type: 'warning' | 'critical' | 'exceeded';
  message: string;
  currentSpend: number;
  budgetLimit: number;
  percentage: number;
  timestamp: string;
  acknowledged: boolean;
}

// ============================================
// 2. MODEL ROUTING & ACCESS CONTROL
// ============================================

export interface ModelRouting {
  agentId: string;

  // Tiered access (like employee clearance levels)
  allowedModels: {
    primary: string;        // Default model
    fallback: string;       // On primary failure
    escalation: string;     // For complex tasks
  };

  // Auto-routing rules based on task complexity
  routingRules: RoutingRule[];

  // Cost-aware routing
  costOptimization: {
    maxCostPerRequest: number;
    preferCheaperWhenConfidenceHigh: boolean;
    downgradeAfterBudgetPercent: number;
  };
}

export interface RoutingRule {
  id: string;
  ifTaskContains: string[];      // Keywords
  useModel: string;
  overrideReason: string;
  priority: number;
  enabled: boolean;
}

export interface ModelTier {
  id: string;
  name: string;
  costPer1kTokens: number;
  category: 'premium' | 'standard' | 'economy';
  provider: string;
  capabilities: string[];
}

// Default routing presets
export const defaultRoutings: Record<string, { primary: string; fallback: string; escalation: string }> = {
  coder: { primary: 'claude-opus-4-6', fallback: 'gpt-4', escalation: 'claude-opus-4-6' },
  researcher: { primary: 'perplexity', fallback: 'claude-sonnet-4-6', escalation: 'claude-opus-4-6' },
  summarizer: { primary: 'claude-haiku-4-6', fallback: 'gpt-3.5-turbo', escalation: 'claude-sonnet-4-6' },
  writer: { primary: 'claude-sonnet-4-6', fallback: 'gpt-4', escalation: 'claude-opus-4-6' },
};

// ============================================
// 3. AGENT VERSION CONTROL
// ============================================

export interface AgentVersion {
  id: string;
  agentId: string;
  timestamp: string;
  changes: string;
  author: string;
  config: AgentConfigSnapshot;
  isActive: boolean;
}

export interface AgentConfigSnapshot {
  name: string;
  emoji: string;
  role: string;
  description: string;
  model: {
    provider: string;
    model: string;
    temperature: number;
    maxTokens: number;
  };
  tools: {
    allow: string[];
    deny: string[];
  };
  skills: string[];
  bootstrapFiles: Record<string, string>;
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface AgentEditorState {
  mode: 'view' | 'edit' | 'deploy';
  activeTab: 'identity' | 'model' | 'tools' | 'skills' | 'budget' | 'routing';
  previewMode: boolean;
  versions: AgentVersion[];
  validationErrors: ValidationError[];
  hasUnsavedChanges: boolean;
}

// ============================================
// 4. VIRTUAL SCROLLING & NAVIGATION
// ============================================

export interface ViewportConfig {
  totalAgents: number;
  visibleRange: { start: number; end: number };
  itemHeight: number;           // 120px per agent station
  overscan: number;             // Render 5 extra items

  // Grouping
  groups: AgentGroup[];
}

export interface AgentGroup {
  id: string;
  name: string;
  agentIds: string[];
  collapsed: boolean;
  color: string;
}

export interface NavigationState {
  breadcrumbs: { label: string; path: string }[];
  activeContext: 'factory' | 'agent' | 'session' | 'task' | 'workflow';
  sidebarCollapsed: boolean;
  recentAgents: string[];
  pinnedAgents: string[];
}

// ============================================
// 5. ENTERPRISE ORCHESTRATION PATTERNS
// ============================================

export type OrchestrationPattern = 'supervisor' | 'concurrent' | 'sequential' | 'groupchat';

export interface Workflow {
  id: string;
  name: string;
  description: string;
  pattern: OrchestrationPattern;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface WorkflowNode {
  id: string;
  type: 'agent' | 'supervisor' | 'input' | 'output' | 'decision';
  agentId?: string;
  position: { x: number; y: number };
  config: Record<string, unknown>;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  condition?: string;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  nodeExecutions: NodeExecution[];
}

export interface NodeExecution {
  nodeId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: string;
  completedAt?: string;
  output?: unknown;
  error?: string;
}

// ============================================
// 6. ADVANCED ANALYTICS
// ============================================

export interface CostAnalytics {
  // Cost per Agent
  agentCosts: AgentCostBreakdown[];

  // Model Usage Distribution
  modelDistribution: ModelUsage[];

  // Token Efficiency
  tokenEfficiency: TokenEfficiencyMetrics;

  // Budget Burn Rate
  burnRate: BurnRateProjection;
}

export interface AgentCostBreakdown {
  agentId: string;
  agentName: string;
  dailyCost: number;
  monthlyCost: number;
  budgetUtilization: number; // percentage
  trend: 'up' | 'down' | 'stable';
}

export interface ModelUsage {
  modelId: string;
  modelName: string;
  requestCount: number;
  tokenCount: number;
  costUSD: number;
  percentage: number;
}

export interface TokenEfficiencyMetrics {
  averageInputTokens: number;
  averageOutputTokens: number;
  inputOutputRatio: number;
  costPerRequest: number;
  optimizationScore: number; // 0-100
}

export interface BurnRateProjection {
  currentMonthlySpend: number;
  projectedMonthlySpend: number;
  daysUntilBudgetExhausted: number;
  recommendedActions: string[];
}

export interface PerformanceAnalytics {
  // Response Time by Agent
  responseTimeHeatmap: ResponseTimeData[];

  // Success Rate
  successRate: SuccessRateMetrics;

  // Tool Usage Frequency
  toolUsage: ToolUsageMetrics[];

  // Session Duration
  sessionDuration: SessionDurationMetrics;
}

export interface ResponseTimeData {
  agentId: string;
  averageMs: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
}

export interface SuccessRateMetrics {
  overall: number;
  byAgent: Record<string, number>;
  byTaskType: Record<string, number>;
  trend: 'improving' | 'stable' | 'declining';
}

export interface ToolUsageMetrics {
  toolId: string;
  toolName: string;
  usageCount: number;
  successRate: number;
  averageExecutionTime: number;
}

export interface SessionDurationMetrics {
  averageSeconds: number;
  medianSeconds: number;
  byAgent: Record<string, number>;
}

export interface CollaborationMetrics {
  // Inter-Agent Messages
  interAgentMessages: InterAgentMessage[];

  // Handoff Success Rate
  handoffSuccessRate: number;
  totalHandoffs: number;
  successfulHandoffs: number;

  // Conflict Resolution
  conflictsResolved: number;
  conflictsEscalated: number;
  averageResolutionTime: number;
}

export interface InterAgentMessage {
  id: string;
  fromAgentId: string;
  toAgentId: string;
  messageType: 'delegation' | 'query' | 'response' | 'notification';
  timestamp: string;
  content: string;
}

// ============================================
// 7. RBAC & SECURITY
// ============================================

export type UserRole = 'admin' | 'manager' | 'viewer' | 'agent-specific';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  allowedAgentIds?: string[]; // For agent-specific role
  createdAt: string;
  lastLoginAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resourceType: 'agent' | 'skill' | 'task' | 'workflow' | 'setting';
  resourceId: string;
  changes: Record<string, { old: unknown; new: unknown }>;
  timestamp: string;
  ipAddress: string;
}

// ============================================
// 8. COMMAND PALETTE & SHORTCUTS
// ============================================

export interface CommandPaletteItem {
  id: string;
  label: string;
  shortcut?: string;
  category: 'navigation' | 'agent' | 'action' | 'view';
  action: () => void;
  icon?: string;
}

export const keyboardShortcuts: Record<string, string> = {
  'cmd+k': 'commandPalette',
  'e': 'editAgent',
  'n': 'newAgent',
  'd': 'deleteAgent',
  'f': 'focusSearch',
  'esc': 'closeModal',
  'cmd+s': 'saveChanges',
  'cmd+1': 'goToFactoryFloor',
  'cmd+2': 'goToAgents',
  'cmd+3': 'goToTasks',
  'cmd+4': 'goToSessions',
};
