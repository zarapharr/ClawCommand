// ClawCommand Enterprise Stores
// Budget Management, Model Routing, Analytics, Workflow

import { useState, useCallback, useMemo } from 'react';
import type {
  AgentBudget, SessionCost, BudgetAlert, ModelRouting, RoutingRule,
  AgentVersion, AgentGroup, Workflow, WorkflowExecution,
  CostAnalytics, PerformanceAnalytics, CollaborationMetrics,
  ModelTier, AuditLog, WorkflowNode, WorkflowEdge
} from '@/types/enterprise';
import {
  mockAgentBudgets, mockSessionCosts, mockBudgetAlerts, mockModelRoutings,
  mockRoutingRules, mockAgentVersions, mockAgentGroups, mockWorkflows,
  mockCostAnalytics, mockPerformanceAnalytics, mockCollaborationMetrics,
  modelTiers, mockAuditLogs
} from '@/data/enterprise-mock';

// ============================================
// BUDGET STORE
// ============================================

export function useBudgetStore() {
  const [budgets, setBudgets] = useState<AgentBudget[]>(mockAgentBudgets);
  const [sessionCosts, setSessionCosts] = useState<SessionCost[]>(mockSessionCosts);
  const [alerts, setAlerts] = useState<BudgetAlert[]>(mockBudgetAlerts);

  // Get budget for an agent
  const getAgentBudget = useCallback((agentId: string) => {
    return budgets.find(b => b.agentId === agentId) || null;
  }, [budgets]);

  // Calculate budget utilization percentage
  const getBudgetUtilization = useCallback((agentId: string) => {
    const budget = budgets.find(b => b.agentId === agentId);
    if (!budget) return 0;
    return (budget.spentThisMonth / budget.monthlyBudget) * 100;
  }, [budgets]);

  // Get total team budget
  const getTotalTeamBudget = useMemo(() => {
    return budgets.reduce((acc, b) => ({
      total: acc.total + b.monthlyBudget,
      spent: acc.spent + b.spentThisMonth,
    }), { total: 0, spent: 0 });
  }, [budgets]);

  // Update agent budget
  const updateBudget = useCallback((agentId: string, updates: Partial<AgentBudget>) => {
    setBudgets(prev => prev.map(b =>
      b.agentId === agentId ? { ...b, ...updates } : b
    ));
  }, []);

  // Add session cost
  const addSessionCost = useCallback((cost: Omit<SessionCost, 'timestamp'>) => {
    const newCost: SessionCost = { ...cost, timestamp: new Date().toISOString() };
    setSessionCosts(prev => [newCost, ...prev]);

    // Update agent budget
    setBudgets(prev => prev.map(b => {
      if (b.agentId === cost.agentId) {
        const newSpent = b.spentThisMonth + cost.costUSD;
        const percentage = (newSpent / b.monthlyBudget) * 100;

        // Check for alerts
        if (percentage >= b.alertThreshold && percentage < 100) {
          const newAlert: BudgetAlert = {
            id: `alert-${Date.now()}`,
            agentId: cost.agentId,
            type: percentage >= 95 ? 'critical' : 'warning',
            message: `Budget at ${percentage.toFixed(1)}% - ${percentage >= 95 ? 'Critical threshold reached' : 'Consider optimizing usage'}`,
            currentSpend: newSpent,
            budgetLimit: b.monthlyBudget,
            percentage,
            timestamp: new Date().toISOString(),
            acknowledged: false,
          };
          setAlerts(prevAlerts => [newAlert, ...prevAlerts]);
        }

        return { ...b, spentThisMonth: newSpent };
      }
      return b;
    }));
  }, []);

  // Acknowledge alert
  const acknowledgeAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(a =>
      a.id === alertId ? { ...a, acknowledged: true } : a
    ));
  }, []);

  // Get unacknowledged alerts
  const unacknowledgedAlerts = useMemo(() => {
    return alerts.filter(a => !a.acknowledged);
  }, [alerts]);

  return {
    budgets,
    sessionCosts,
    alerts,
    unacknowledgedAlerts,
    getAgentBudget,
    getBudgetUtilization,
    getTotalTeamBudget,
    updateBudget,
    addSessionCost,
    acknowledgeAlert,
  };
}

// ============================================
// MODEL ROUTING STORE
// ============================================

export function useRoutingStore() {
  const [routings, setRoutings] = useState<ModelRouting[]>(mockModelRoutings);
  const [rules, setRules] = useState<RoutingRule[]>(mockRoutingRules);
  const [availableModels] = useState<ModelTier[]>(modelTiers);

  // Get routing for an agent
  const getAgentRouting = useCallback((agentId: string) => {
    return routings.find(r => r.agentId === agentId) || null;
  }, [routings]);

  // Determine which model to use based on task and routing rules
  const determineModel = useCallback((agentId: string, taskContent: string): string => {
    const routing = routings.find(r => r.agentId === agentId);
    if (!routing) return 'claude-sonnet-4-6';

    // Check routing rules first
    for (const rule of routing.routingRules.filter(r => r.enabled)) {
      if (rule.ifTaskContains.some(keyword =>
        taskContent.toLowerCase().includes(keyword.toLowerCase())
      )) {
        return rule.useModel;
      }
    }

    // Check budget utilization for cost-aware routing
    // This would integrate with budget store in real implementation

    return routing.allowedModels.primary;
  }, [routings]);

  // Update agent routing
  const updateRouting = useCallback((agentId: string, updates: Partial<ModelRouting>) => {
    setRoutings(prev => prev.map(r =>
      r.agentId === agentId ? { ...r, ...updates } : r
    ));
  }, []);

  // Add routing rule
  const addRule = useCallback((rule: Omit<RoutingRule, 'id'>) => {
    const newRule: RoutingRule = { ...rule, id: `rule-${Date.now()}` };
    setRules(prev => [...prev, newRule]);
  }, []);

  // Update routing rule
  const updateRule = useCallback((ruleId: string, updates: Partial<RoutingRule>) => {
    setRules(prev => prev.map(r =>
      r.id === ruleId ? { ...r, ...updates } : r
    ));
  }, []);

  // Delete routing rule
  const deleteRule = useCallback((ruleId: string) => {
    setRules(prev => prev.filter(r => r.id !== ruleId));
  }, []);

  return {
    routings,
    rules,
    availableModels,
    getAgentRouting,
    determineModel,
    updateRouting,
    addRule,
    updateRule,
    deleteRule,
  };
}

// ============================================
// VERSION CONTROL STORE
// ============================================

export function useVersionStore() {
  const [versions, setVersions] = useState<AgentVersion[]>(mockAgentVersions);

  // Get versions for an agent
  const getAgentVersions = useCallback((agentId: string) => {
    return versions.filter(v => v.agentId === agentId).sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [versions]);

  // Get active version for an agent
  const getActiveVersion = useCallback((agentId: string) => {
    return versions.find(v => v.agentId === agentId && v.isActive) || null;
  }, [versions]);

  // Create new version
  const createVersion = useCallback((agentId: string, config: AgentVersion['config'], changes: string, author: string) => {
    // Deactivate current version
    setVersions(prev => prev.map(v =>
      v.agentId === agentId ? { ...v, isActive: false } : v
    ));

    // Create new version
    const newVersion: AgentVersion = {
      id: `ver-${Date.now()}`,
      agentId,
      timestamp: new Date().toISOString(),
      changes,
      author,
      config,
      isActive: true,
    };

    setVersions(prev => [...prev, newVersion]);
    return newVersion;
  }, []);

  // Rollback to a version
  const rollbackToVersion = useCallback((versionId: string) => {
    const version = versions.find(v => v.id === versionId);
    if (!version) return null;

    // Deactivate all versions for this agent
    setVersions(prev => prev.map(v =>
      v.agentId === version.agentId ? { ...v, isActive: v.id === versionId } : v
    ));

    return version;
  }, [versions]);

  return {
    versions,
    getAgentVersions,
    getActiveVersion,
    createVersion,
    rollbackToVersion,
  };
}

// ============================================
// GROUPS STORE
// ============================================

export function useGroupsStore() {
  const [groups, setGroups] = useState<AgentGroup[]>(mockAgentGroups);

  // Get agents in a group
  const getGroupAgents = useCallback((groupId: string) => {
    return groups.find(g => g.id === groupId)?.agentIds || [];
  }, [groups]);

  // Toggle group collapse
  const toggleGroup = useCallback((groupId: string) => {
    setGroups(prev => prev.map(g =>
      g.id === groupId ? { ...g, collapsed: !g.collapsed } : g
    ));
  }, []);

  // Add agent to group
  const addAgentToGroup = useCallback((groupId: string, agentId: string) => {
    setGroups(prev => prev.map(g =>
      g.id === groupId ? { ...g, agentIds: [...g.agentIds, agentId] } : g
    ));
  }, []);

  // Remove agent from group
  const removeAgentFromGroup = useCallback((groupId: string, agentId: string) => {
    setGroups(prev => prev.map(g =>
      g.id === groupId ? { ...g, agentIds: g.agentIds.filter(id => id !== agentId) } : g
    ));
  }, []);

  // Create new group
  const createGroup = useCallback((name: string, color: string) => {
    const newGroup: AgentGroup = {
      id: `group-${Date.now()}`,
      name,
      agentIds: [],
      collapsed: false,
      color,
    };
    setGroups(prev => [...prev, newGroup]);
    return newGroup;
  }, []);

  return {
    groups,
    getGroupAgents,
    toggleGroup,
    addAgentToGroup,
    removeAgentFromGroup,
    createGroup,
  };
}

// ============================================
// WORKFLOW STORE
// ============================================

export function useWorkflowStore() {
  const [workflows, setWorkflows] = useState<Workflow[]>(mockWorkflows);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);

  // Get workflow by ID
  const getWorkflow = useCallback((id: string) => {
    return workflows.find(w => w.id === id) || null;
  }, [workflows]);

  // Create workflow
  const createWorkflow = useCallback((workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newWorkflow: Workflow = {
      ...workflow,
      id: `workflow-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setWorkflows(prev => [...prev, newWorkflow]);
    return newWorkflow;
  }, []);

  // Update workflow
  const updateWorkflow = useCallback((id: string, updates: Partial<Workflow>) => {
    setWorkflows(prev => prev.map(w =>
      w.id === id ? { ...w, ...updates, updatedAt: new Date().toISOString() } : w
    ));
  }, []);

  // Delete workflow
  const deleteWorkflow = useCallback((id: string) => {
    setWorkflows(prev => prev.filter(w => w.id !== id));
  }, []);

  // Add node to workflow
  const addNode = useCallback((workflowId: string, node: Omit<WorkflowNode, 'id'>) => {
    const newNode: WorkflowNode = { ...node, id: `node-${Date.now()}` };
    setWorkflows(prev => prev.map(w =>
      w.id === workflowId
        ? { ...w, nodes: [...w.nodes, newNode], updatedAt: new Date().toISOString() }
        : w
    ));
    return newNode;
  }, []);

  // Add edge to workflow
  const addEdge = useCallback((workflowId: string, edge: Omit<WorkflowEdge, 'id'>) => {
    const newEdge: WorkflowEdge = { ...edge, id: `edge-${Date.now()}` };
    setWorkflows(prev => prev.map(w =>
      w.id === workflowId
        ? { ...w, edges: [...w.edges, newEdge], updatedAt: new Date().toISOString() }
        : w
    ));
    return newEdge;
  }, []);

  // Delete edge from workflow
  const deleteEdge = useCallback((workflowId: string, edgeId: string) => {
    setWorkflows(prev => prev.map(w =>
      w.id === workflowId
        ? { ...w, edges: w.edges.filter(e => e.id !== edgeId), updatedAt: new Date().toISOString() }
        : w
    ));
  }, []);

  // Execute workflow
  const executeWorkflow = useCallback((workflowId: string) => {
    const workflow = workflows.find(w => w.id === workflowId);
    if (!workflow) return null;

    const execution: WorkflowExecution = {
      id: `exec-${Date.now()}`,
      workflowId,
      status: 'running',
      startedAt: new Date().toISOString(),
      nodeExecutions: workflow.nodes.map(n => ({
        nodeId: n.id,
        status: 'pending',
      })),
    };

    setExecutions(prev => [...prev, execution]);

    // Simulate execution
    setTimeout(() => {
      setExecutions(prev => prev.map(e =>
        e.id === execution.id
          ? { ...e, status: 'completed', completedAt: new Date().toISOString() }
          : e
      ));
    }, 3000);

    return execution;
  }, [workflows]);

  return {
    workflows,
    executions,
    getWorkflow,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    addNode,
    addEdge,
    deleteEdge,
    executeWorkflow,
  };
}

// ============================================
// ANALYTICS STORE
// ============================================

export function useAnalyticsStore() {
  const [costAnalytics] = useState<CostAnalytics>(mockCostAnalytics);
  const [performanceAnalytics] = useState<PerformanceAnalytics>(mockPerformanceAnalytics);
  const [collaborationMetrics] = useState<CollaborationMetrics>(mockCollaborationMetrics);

  // Get cost breakdown for an agent
  const getAgentCostBreakdown = useCallback((agentId: string) => {
    return costAnalytics.agentCosts.find(c => c.agentId === agentId) || null;
  }, [costAnalytics]);

  // Get model usage for an agent
  const getAgentModelUsage = useCallback((_agentId: string) => {
    // This would filter session costs by agent in real implementation
    return costAnalytics.modelDistribution;
  }, [costAnalytics]);

  // Get performance metrics for an agent
  const getAgentPerformance = useCallback((agentId: string) => {
    return performanceAnalytics.responseTimeHeatmap.find(p => p.agentId === agentId) || null;
  }, [performanceAnalytics]);

  // Get collaboration stats for an agent
  const getAgentCollaboration = useCallback((agentId: string) => {
    const messages = collaborationMetrics.interAgentMessages.filter(
      m => m.fromAgentId === agentId || m.toAgentId === agentId
    );
    return {
      messagesSent: messages.filter(m => m.fromAgentId === agentId).length,
      messagesReceived: messages.filter(m => m.toAgentId === agentId).length,
    };
  }, [collaborationMetrics]);

  return {
    costAnalytics,
    performanceAnalytics,
    collaborationMetrics,
    getAgentCostBreakdown,
    getAgentModelUsage,
    getAgentPerformance,
    getAgentCollaboration,
  };
}

// ============================================
// AUDIT STORE
// ============================================

export function useAuditStore() {
  const [logs, setLogs] = useState<AuditLog[]>(mockAuditLogs);

  // Get logs for a resource
  const getResourceLogs = useCallback((resourceType: AuditLog['resourceType'], resourceId: string) => {
    return logs.filter(l => l.resourceType === resourceType && l.resourceId === resourceId);
  }, [logs]);

  // Get logs by user
  const getUserLogs = useCallback((userId: string) => {
    return logs.filter(l => l.userId === userId);
  }, [logs]);

  // Add audit log
  const addLog = useCallback((log: Omit<AuditLog, 'id' | 'timestamp' | 'ipAddress'>) => {
    const newLog: AuditLog = {
      ...log,
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      ipAddress: '127.0.0.1', // Would be actual IP in production
    };
    setLogs(prev => [newLog, ...prev]);
  }, []);

  return {
    logs,
    getResourceLogs,
    getUserLogs,
    addLog,
  };
}
