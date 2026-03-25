/**
 * TypeScript Type Definitions for ClawCommand Enterprise
 * Covers Factory Floor, Workflow, Budget, and Audit domains
 */

// Factory Floor Types
export interface FactoryFloor {
  id: string;
  name: string;
  agents: Agent[];
  workflows: Workflow[];
  metrics: FactoryMetrics;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  status: "running" | "idle" | "error" | "offline";
  currentTask?: string;
  taskQueue: Task[];
  metrics: AgentMetrics;
  lastHeartbeat: string;
}

export interface AgentMetrics {
  tasksCompleted: number;
  tasksFailed: number;
  averageExecutionTime: number;
  errorRate: number;
  uptime: number;
  cpuUsage?: number;
  memoryUsage?: number;
}

export interface FactoryMetrics {
  totalAgents: number;
  activeAgents: number;
  totalWorkflows: number;
  completedWorkflows: number;
  failedWorkflows: number;
  averageTaskTime: number;
  systemUptime: number;
}

// Workflow Types
export interface Workflow {
  id: string;
  name: string;
  status: "pending" | "running" | "complete" | "failed" | "cancelled";
  progress: number;
  steps: WorkflowStep[];
  assignedAgent?: string;
  startTime?: string;
  endTime?: string;
  estimatedCompletion?: string;
  error?: string;
}

export interface WorkflowStep {
  id: string;
  name: string;
  status: "pending" | "running" | "complete" | "failed" | "skipped";
  duration?: number;
  output?: any;
  error?: string;
}

// Budget Types
export interface Budget {
  id: string;
  period: string; // YYYY-MM format
  total: number;
  allocated: number;
  spent: number;
  remaining: number;
  runRate: number;
  categories: BudgetCategory[];
  forecast: BudgetForecast;
}

export interface BudgetCategory {
  id: string;
  name: string;
  allocated: number;
  spent: number;
  items: BudgetItem[];
}

export interface BudgetItem {
  id: string;
  description: string;
  amount: number;
  status: "pending" | "approved" | "spent";
  date: string;
}

export interface BudgetForecast {
  projectedSpend: number;
  projectedRemaining: number;
  runoutDate?: string;
  burnRate: number;
}

// Audit Types
export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  resource: string;
  resourceId: string;
  changes: AuditChange[];
  status: "success" | "failure";
  error?: string;
}

export interface AuditChange {
  field: string;
  oldValue?: any;
  newValue?: any;
}

export interface AuditFilter {
  startDate?: string;
  endDate?: string;
  actor?: string;
  action?: string;
  resource?: string;
  status?: "success" | "failure";
}

// Task Types
export interface Task {
  id: string;
  workflowId: string;
  name: string;
  status: "pending" | "running" | "complete" | "failed";
  priority: "low" | "medium" | "high" | "critical";
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  estimatedDuration?: number;
  actualDuration?: number;
  assignedAgent?: string;
  dependencies?: string[];
  metadata?: Record<string, any>;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
