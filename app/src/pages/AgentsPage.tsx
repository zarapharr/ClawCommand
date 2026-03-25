import { useCallback, useEffect, useState } from 'react';
import type { Agent } from '@/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Users, Search, Plus, Edit2, Trash2, Copy, Play,
  MessageSquare, Cpu, Wrench, FolderOpen, FileText, ShieldCheck, Route, DollarSign,
} from 'lucide-react';
import { StatusIndicator } from '@/components/factory-floor/StatusIndicator';
import { getAgentsFeed, getDiagnostics, getInteractionStats, readDecisionLog, readOperatorAudit, reconcileOperatorLedgers, runOperatorAction } from '@/lib/runtime-adapters';
import { fetchAgents, fetchSessions, postRuntimeAction, startRuntimePolling, subscribeRuntimeUpdates } from '@/lib/openclaw-api';
import { useRuntimeFeed } from '@/hooks/use-runtime-feed';
import { RuntimeStatusBar } from '@/components/runtime/RuntimeStatusBar';
import { HealthConnectionPanel } from '@/components/runtime/HealthConnectionPanel';
import { ActionReceiptLedger } from '@/components/runtime/ActionReceiptLedger';
import { DecisionLogPanel } from '@/components/runtime/DecisionLogPanel';

interface AgentsPageProps {
  initialSelectedAgentId?: string | null;
}

const RUNTIME_AGENTS_STORAGE_KEY = 'clawcommand.runtime.agents';

type AgentConfigDraft = {
  skills: string;
  toolsAllow: string;
  toolsDeny: string;
  budgetMonthlyLimit: number;
  budgetAlertThreshold: number;
  budgetHardLimit: boolean;
  budgetOnExceeded: 'pause' | 'downgrade' | 'notify' | 'escalate';
  routingPrimary: string;
  routingFallback: string;
  routingEscalation: string;
  routingRules: string;
};

export function AgentsPage({ initialSelectedAgentId = null }: AgentsPageProps) {
  const agentsLoader = useCallback(() => getAgentsFeed(), []);
  const diagnosticsLoader = useCallback(() => getDiagnostics(), []);
  const interactionLoader = useCallback(() => getInteractionStats(), []);

  const { feed: agentsFeed, loading: agentsLoading, error: agentsError, freshnessLabel } = useRuntimeFeed({ loader: agentsLoader });
  const { feed: diagnosticsFeed } = useRuntimeFeed({ loader: diagnosticsLoader });
  const { feed: interactionFeed } = useRuntimeFeed({ loader: interactionLoader });

  const [agents, setAgents] = useState<Agent[]>(agentsFeed.data);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(agentsFeed.data[0] ?? null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [lastActivity, setLastActivity] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<{ id: string; action: 'start' | 'stop' | 'retry' | 'kill' | 'escalate' } | null>(null);
  const [auditLog, setAuditLog] = useState(readOperatorAudit());
  const [decisions, setDecisions] = useState(readDecisionLog());
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [configDraft, setConfigDraft] = useState<AgentConfigDraft | null>(null);

  const toList = (value: string) => value.split(/\n|,/).map((item) => item.trim()).filter(Boolean);

  const serializeRules = (agent: Agent) => (agent.routing?.rules || [])
    .map((rule) => `${rule.ifTaskContains.join('|')} => ${rule.useModel}${rule.enabled ? '' : ' [disabled]'}`)
    .join('\n');

  const hydrateDraft = useCallback((agent: Agent): AgentConfigDraft => ({
    skills: agent.skills.join('\n'),
    toolsAllow: agent.tools.allow.join('\n'),
    toolsDeny: agent.tools.deny.join('\n'),
    budgetMonthlyLimit: agent.budget?.monthlyLimit ?? 400,
    budgetAlertThreshold: agent.budget?.alertThreshold ?? 80,
    budgetHardLimit: agent.budget?.hardLimit ?? false,
    budgetOnExceeded: agent.budget?.onExceeded ?? 'notify',
    routingPrimary: agent.routing?.primary ?? agent.model.model,
    routingFallback: agent.routing?.fallback ?? agent.model.model,
    routingEscalation: agent.routing?.escalation ?? agent.model.model,
    routingRules: serializeRules(agent),
  }), []);

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

  useEffect(() => {
    setAgents(agentsFeed.data);
    setSelectedAgent((prev) => {
      if (initialSelectedAgentId) {
        const preselected = agentsFeed.data.find((agent) => agent.id === initialSelectedAgentId);
        if (preselected) return preselected;
      }
      return agentsFeed.data.find((agent) => agent.id === prev?.id) ?? agentsFeed.data[0] ?? null;
    });
  }, [agentsFeed.data, initialSelectedAgentId]);

  useEffect(() => {
    if (!selectedAgent) {
      setConfigDraft(null);
      return;
    }
    setConfigDraft(hydrateDraft(selectedAgent));
  }, [hydrateDraft, selectedAgent?.id]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    void reconcileOperatorLedgers().then(({ audit, decisions: syncedDecisions }) => {
      setAuditLog(audit);
      setDecisions(syncedDecisions);
    });

    const stopPolling = startRuntimePolling(10_000);
    const tick = window.setInterval(async () => {
      const [agentsResult, sessionsResult] = await Promise.all([fetchAgents(), fetchSessions()]);
      if (agentsResult.ok) {
        setAgents(agentsResult.data);
      }
      if (sessionsResult.ok) {
        setSessionCount(sessionsResult.data.length);
        const latest = sessionsResult.data
          .map((session) => session.lastActivity)
          .sort()
          .at(-1);
        setLastActivity(latest ?? null);
      }
    }, 10_000);
    const unsubscribe = subscribeRuntimeUpdates((update) => {
      if (update.kind === 'tick' || update.kind === 'agent_status') {
        void reconcileOperatorLedgers().then(({ audit, decisions: syncedDecisions }) => {
          setAuditLog(audit);
          setDecisions(syncedDecisions);
        });
      }
    });

    return () => {
      stopPolling();
      clearInterval(tick);
      unsubscribe();
    };
  }, []);

  const filteredAgents = agents.filter((agent) =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.role.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleDelete = (id: string) => {
    setAgents((prev) => prev.filter((a) => a.id !== id));
    if (selectedAgent?.id === id) setSelectedAgent(null);
  };

  const handleDuplicate = (agent: Agent) => {
    const newAgent: Agent = {
      ...agent,
      id: `agent-${Date.now()}`,
      name: `${agent.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setAgents((prev) => [...prev, newAgent]);
  };

  const executeAction = async () => {
    if (!pendingAction) return;

    const runtimeReceipt = await postRuntimeAction({
      action: pendingAction.action,
      targetType: 'agent',
      targetId: pendingAction.id,
    });

    await runOperatorAction({
      action: pendingAction.action,
      source: agentsFeed.source,
      targetId: pendingAction.id,
      targetType: 'agent',
      payload: {
        reason: 'operator console action',
        receipt: runtimeReceipt.ok ? runtimeReceipt.data : { error: runtimeReceipt.error },
      },
    });

    if (runtimeReceipt.ok && runtimeReceipt.data.status === 'failed') {
      setActionNotice(runtimeReceipt.data.error || 'Operator action failed.');
    } else {
      setActionNotice(runtimeReceipt.ok ? runtimeReceipt.data.result || 'Operator action dispatched.' : runtimeReceipt.error);
    }

    const latestAgents = await fetchAgents();
    if (latestAgents.ok) {
      setAgents(latestAgents.data);
    }

    setAuditLog(readOperatorAudit());
    setDecisions(readDecisionLog());
    setPendingAction(null);
  };

  const saveAgentConfig = () => {
    if (!selectedAgent || !configDraft) return;

    const nextAgent: Agent = {
      ...selectedAgent,
      skills: toList(configDraft.skills),
      tools: {
        allow: toList(configDraft.toolsAllow),
        deny: toList(configDraft.toolsDeny),
      },
      budget: {
        monthlyLimit: Math.max(0, Number(configDraft.budgetMonthlyLimit) || 0),
        alertThreshold: Math.min(100, Math.max(0, Number(configDraft.budgetAlertThreshold) || 0)),
        hardLimit: configDraft.budgetHardLimit,
        onExceeded: configDraft.budgetOnExceeded,
      },
      routing: {
        primary: configDraft.routingPrimary.trim() || selectedAgent.model.model,
        fallback: configDraft.routingFallback.trim() || selectedAgent.model.model,
        escalation: configDraft.routingEscalation.trim() || selectedAgent.model.model,
        rules: parseRules(configDraft.routingRules),
      },
      updatedAt: new Date().toISOString(),
    };

    setAgents((prev) => {
      const next = prev.map((agent) => (agent.id === nextAgent.id ? nextAgent : agent));
      if (typeof window !== 'undefined') {
        localStorage.setItem(RUNTIME_AGENTS_STORAGE_KEY, JSON.stringify(next));
      }
      return next;
    });

    setSelectedAgent(nextAgent);
    setConfigDraft(hydrateDraft(nextAgent));
    setIsEditing(false);
    setActionNotice(`Saved configuration for ${nextAgent.name}.`);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center">
            <Users className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white"><span className="text-cyan-400">Agent</span> Command</h1>
            <p className="text-xs text-slate-400">Manage your AI workforce</p>
          </div>
          <RuntimeStatusBar feed={agentsFeed} loading={agentsLoading} error={agentsError} freshnessLabel={freshnessLabel} />
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input placeholder="Search agents..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 w-64 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500" />
          </div>
          <Button className="bg-cyan-500 hover:bg-cyan-600 text-black font-medium"><Plus className="w-4 h-4 mr-2" />Create Agent</Button>
        </div>
      </div>

      {actionNotice && <p className="px-6 pt-3 text-xs text-amber-300">{actionNotice}</p>}

      <div className="px-6 pt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/30"><p className="text-xs text-slate-400">Interactions</p><p className="text-lg text-cyan-300 font-semibold">{interactionFeed.data.totalMessages}</p></div>
        <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/30"><p className="text-xs text-slate-400">Active sessions</p><p className="text-lg text-cyan-300 font-semibold">{sessionCount || interactionFeed.data.activeSessions}</p><p className="text-[10px] text-slate-500">Last activity: {lastActivity ? new Date(lastActivity).toLocaleTimeString() : 'n/a'}</p></div>
        <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/30"><p className="text-xs text-slate-400">Errors (1h)</p><p className="text-lg text-red-300 font-semibold">{interactionFeed.data.errorsLastHour}</p></div>
        <HealthConnectionPanel feed={agentsFeed} diagnosticsFeed={diagnosticsFeed} title="Health + Connection" />
      </div>

      <div className="flex-1 flex overflow-hidden mt-3">
        <div className="w-80 border-r border-slate-800/50 flex flex-col">
          <div className="p-4 border-b border-slate-800/50"><p className="text-xs text-slate-400 uppercase tracking-wider">{filteredAgents.length} Agents</p></div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {filteredAgents.map((agent) => (
                <button key={agent.id} onClick={() => setSelectedAgent(agent)} className={cn('w-full flex items-center gap-3 p-3 rounded-lg transition-all hover:bg-slate-800/50', selectedAgent?.id === agent.id && 'bg-cyan-500/10 border border-cyan-500/30')}>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center text-lg">{agent.emoji}</div>
                  <div className="flex-1 text-left"><p className="text-sm font-medium text-white">{agent.name}</p><p className="text-xs text-slate-400">{agent.role}</p></div>
                  <StatusIndicator status={agent.status} size="sm" />
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {selectedAgent ? (
            <div className="max-w-4xl mx-auto">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center text-3xl">{selectedAgent.emoji}</div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedAgent.name}</h2>
                    <p className="text-slate-400">{selectedAgent.role}</p>
                    <div className="flex items-center gap-2 mt-2"><StatusIndicator status={selectedAgent.status} showLabel /><span className="text-xs text-slate-500">|</span><span className="text-xs text-slate-400">{selectedAgent.model.provider}/{selectedAgent.model.model}</span></div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-end max-w-[560px]">
                  <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800" onClick={() => setPendingAction({ id: selectedAgent.id, action: 'start' })}>Start</Button>
                  <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800" onClick={() => setPendingAction({ id: selectedAgent.id, action: 'stop' })}>Stop</Button>
                  <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800" onClick={() => setPendingAction({ id: selectedAgent.id, action: 'retry' })}>Retry</Button>
                  <Button variant="outline" size="sm" className="border-red-900/50 text-red-400 hover:text-red-300 hover:bg-red-900/20" onClick={() => setPendingAction({ id: selectedAgent.id, action: 'kill' })}>Kill</Button>
                  <Button variant="outline" size="sm" className="border-amber-900/50 text-amber-300 hover:text-amber-200 hover:bg-amber-900/20" onClick={() => setPendingAction({ id: selectedAgent.id, action: 'escalate' })}>Escalate</Button>
                  <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"><Play className="w-4 h-4 mr-2" />Test</Button>
                  <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800" onClick={() => handleDuplicate(selectedAgent)}><Copy className="w-4 h-4 mr-2" />Duplicate</Button>
                  {isEditing ? (
                    <>
                      <Button variant="outline" size="sm" className="border-emerald-700 text-emerald-300 hover:text-emerald-200 hover:bg-emerald-900/20" onClick={saveAgentConfig}>Save</Button>
                      <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800" onClick={() => {
                        if (selectedAgent) setConfigDraft(hydrateDraft(selectedAgent));
                        setIsEditing(false);
                      }}>Cancel</Button>
                    </>
                  ) : (
                    <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800" onClick={() => setIsEditing(true)}><Edit2 className="w-4 h-4 mr-2" />Edit</Button>
                  )}
                  <Button variant="outline" size="sm" className="border-red-900/50 text-red-400 hover:text-red-300 hover:bg-red-900/20" onClick={() => handleDelete(selectedAgent.id)}><Trash2 className="w-4 h-4 mr-2" />Delete</Button>
                </div>
              </div>

              <div className="mb-4 grid grid-cols-1 lg:grid-cols-3 gap-3">
                <div className="lg:col-span-3 flex items-center gap-2 text-slate-300"><ShieldCheck className="w-4 h-4 text-cyan-400" /> Governance audit trail</div>
                <ActionReceiptLedger entries={auditLog} />
                <DecisionLogPanel decisions={decisions} />
                <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/30">
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Data Quality</p>
                  <p className="text-xs text-slate-500">State: {agentsFeed.health}</p>
                  <p className="text-xs text-slate-500">Freshness: {freshnessLabel}</p>
                  <p className="text-xs text-slate-500">Path: {agentsFeed.path}</p>
                </div>
              </div>

              <Tabs defaultValue="identity" className="w-full">
                <TabsList className="bg-slate-900/50 border border-slate-800">
                  <TabsTrigger value="identity" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400"><FileText className="w-4 h-4 mr-2" />Identity</TabsTrigger>
                  <TabsTrigger value="model" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400"><Cpu className="w-4 h-4 mr-2" />Model</TabsTrigger>
                  <TabsTrigger value="tools" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400"><Wrench className="w-4 h-4 mr-2" />Tools</TabsTrigger>
                  <TabsTrigger value="skills" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400"><ShieldCheck className="w-4 h-4 mr-2" />Skills</TabsTrigger>
                  <TabsTrigger value="budget" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400"><DollarSign className="w-4 h-4 mr-2" />Budget</TabsTrigger>
                  <TabsTrigger value="routing" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400"><Route className="w-4 h-4 mr-2" />Routing</TabsTrigger>
                  <TabsTrigger value="workspace" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400"><FolderOpen className="w-4 h-4 mr-2" />Workspace</TabsTrigger>
                  <TabsTrigger value="stats" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400"><MessageSquare className="w-4 h-4 mr-2" />Stats</TabsTrigger>
                </TabsList>
                <TabsContent value="identity" className="mt-6"><div className="holo-card p-6"><h3 className="text-lg font-semibold text-white mb-4">Agent Identity</h3><div className="grid grid-cols-2 gap-6"><div><label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">Name</label><Input value={selectedAgent.name} className="bg-slate-900/50 border-slate-700 text-white" readOnly={!isEditing} /></div><div><label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">Emoji</label><Input value={selectedAgent.emoji} className="bg-slate-900/50 border-slate-700 text-white w-20 text-center" readOnly={!isEditing} /></div><div><label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">Role</label><Input value={selectedAgent.role} className="bg-slate-900/50 border-slate-700 text-white" readOnly={!isEditing} /></div><div className="col-span-2"><label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">Description</label><textarea value={selectedAgent.description} className="w-full h-24 bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-white text-sm resize-none" readOnly={!isEditing} /></div></div></div></TabsContent>
                <TabsContent value="model" className="mt-6"><div className="holo-card p-6"><h3 className="text-lg font-semibold text-white mb-4">Model Configuration</h3><div className="grid grid-cols-2 gap-6"><div><label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">Provider</label><Input value={selectedAgent.model.provider} className="bg-slate-900/50 border-slate-700 text-white" readOnly /></div><div><label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">Model</label><Input value={selectedAgent.model.model} className="bg-slate-900/50 border-slate-700 text-white" readOnly /></div><div><label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">Temperature</label><Input value={selectedAgent.model.temperature} className="bg-slate-900/50 border-slate-700 text-white" readOnly={!isEditing} /></div><div><label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">Max Tokens</label><Input value={selectedAgent.model.maxTokens} className="bg-slate-900/50 border-slate-700 text-white" readOnly={!isEditing} /></div></div></div></TabsContent>
                <TabsContent value="tools" className="mt-6"><div className="holo-card p-6"><h3 className="text-lg font-semibold text-white mb-4">Tool Configuration</h3><div className="grid grid-cols-1 lg:grid-cols-2 gap-4"><div><label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">Allowed Tools</label>{isEditing ? <textarea value={configDraft?.toolsAllow || ''} onChange={(e) => setConfigDraft((prev) => (prev ? { ...prev, toolsAllow: e.target.value } : prev))} className="w-full h-32 bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-white text-sm resize-none" /> : <div className="flex flex-wrap gap-2">{selectedAgent.tools.allow.map((tool) => (<Badge key={tool} variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10">{tool}</Badge>))}</div>}</div><div><label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">Denied Tools</label>{isEditing ? <textarea value={configDraft?.toolsDeny || ''} onChange={(e) => setConfigDraft((prev) => (prev ? { ...prev, toolsDeny: e.target.value } : prev))} className="w-full h-32 bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-white text-sm resize-none" /> : <div className="flex flex-wrap gap-2">{selectedAgent.tools.deny.length ? selectedAgent.tools.deny.map((tool) => (<Badge key={tool} variant="outline" className="border-red-500/30 text-red-300 bg-red-500/10">{tool}</Badge>)) : <span className="text-sm text-slate-500">No denied tools</span>}</div>}</div></div><p className="text-xs text-slate-500 mt-3">Enter one tool per line or comma-separated.</p></div></TabsContent>
                <TabsContent value="skills" className="mt-6"><div className="holo-card p-6"><h3 className="text-lg font-semibold text-white mb-4">Skills Assignment</h3>{isEditing ? <textarea value={configDraft?.skills || ''} onChange={(e) => setConfigDraft((prev) => (prev ? { ...prev, skills: e.target.value } : prev))} className="w-full h-40 bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-white text-sm resize-none" /> : <div className="flex flex-wrap gap-2">{selectedAgent.skills.map((skill) => (<Badge key={skill} variant="outline" className="border-cyan-500/30 text-cyan-300 bg-cyan-500/10">{skill}</Badge>))}</div>}<p className="text-xs text-slate-500 mt-3">Assign one skill per line.</p></div></TabsContent>
                <TabsContent value="budget" className="mt-6"><div className="holo-card p-6"><h3 className="text-lg font-semibold text-white mb-4">Budget Settings</h3><div className="grid grid-cols-1 lg:grid-cols-2 gap-4"><div><label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">Monthly Limit (USD)</label><Input type="number" value={configDraft?.budgetMonthlyLimit ?? selectedAgent.budget?.monthlyLimit ?? 400} className="bg-slate-900/50 border-slate-700 text-white" readOnly={!isEditing} onChange={(e) => setConfigDraft((prev) => (prev ? { ...prev, budgetMonthlyLimit: Number(e.target.value) } : prev))} /></div><div><label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">Alert Threshold (%)</label><Input type="number" min={0} max={100} value={configDraft?.budgetAlertThreshold ?? selectedAgent.budget?.alertThreshold ?? 80} className="bg-slate-900/50 border-slate-700 text-white" readOnly={!isEditing} onChange={(e) => setConfigDraft((prev) => (prev ? { ...prev, budgetAlertThreshold: Number(e.target.value) } : prev))} /></div><div><label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">Action On Exceeded</label><select disabled={!isEditing} value={configDraft?.budgetOnExceeded ?? selectedAgent.budget?.onExceeded ?? 'notify'} onChange={(e) => setConfigDraft((prev) => (prev ? { ...prev, budgetOnExceeded: e.target.value as AgentConfigDraft['budgetOnExceeded'] } : prev))} className="w-full h-10 rounded-md bg-slate-900/50 border border-slate-700 text-white px-3"><option value="pause">Pause</option><option value="downgrade">Downgrade</option><option value="notify">Notify</option><option value="escalate">Escalate</option></select></div><div className="flex items-center gap-2 mt-6"><input id="budget-hard-limit" type="checkbox" checked={configDraft?.budgetHardLimit ?? selectedAgent.budget?.hardLimit ?? false} disabled={!isEditing} onChange={(e) => setConfigDraft((prev) => (prev ? { ...prev, budgetHardLimit: e.target.checked } : prev))} /><label htmlFor="budget-hard-limit" className="text-sm text-slate-300">Hard limit (stop requests once exceeded)</label></div></div></div></TabsContent>
                <TabsContent value="routing" className="mt-6"><div className="holo-card p-6"><h3 className="text-lg font-semibold text-white mb-4">Routing Rules</h3><div className="grid grid-cols-1 lg:grid-cols-3 gap-4"><div><label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">Primary Model</label><Input value={configDraft?.routingPrimary ?? selectedAgent.routing?.primary ?? selectedAgent.model.model} className="bg-slate-900/50 border-slate-700 text-white" readOnly={!isEditing} onChange={(e) => setConfigDraft((prev) => (prev ? { ...prev, routingPrimary: e.target.value } : prev))} /></div><div><label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">Fallback Model</label><Input value={configDraft?.routingFallback ?? selectedAgent.routing?.fallback ?? selectedAgent.model.model} className="bg-slate-900/50 border-slate-700 text-white" readOnly={!isEditing} onChange={(e) => setConfigDraft((prev) => (prev ? { ...prev, routingFallback: e.target.value } : prev))} /></div><div><label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">Escalation Model</label><Input value={configDraft?.routingEscalation ?? selectedAgent.routing?.escalation ?? selectedAgent.model.model} className="bg-slate-900/50 border-slate-700 text-white" readOnly={!isEditing} onChange={(e) => setConfigDraft((prev) => (prev ? { ...prev, routingEscalation: e.target.value } : prev))} /></div></div><div className="mt-4"><label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">Rules (one per line)</label><textarea value={configDraft?.routingRules || ''} onChange={(e) => setConfigDraft((prev) => (prev ? { ...prev, routingRules: e.target.value } : prev))} className="w-full h-40 bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-white text-sm resize-none" readOnly={!isEditing} /><p className="text-xs text-slate-500 mt-2">Format: keyword1|keyword2 =&gt; model-name, add [disabled] to turn off a rule.</p></div></div></TabsContent>
                <TabsContent value="workspace" className="mt-6"><div className="holo-card p-6"><h3 className="text-lg font-semibold text-white mb-4">Workspace Files</h3><div className="space-y-3">{Object.entries(selectedAgent.bootstrapFiles).map(([key, content]) => (<div key={key} className="p-3 rounded-lg bg-slate-900/50 border border-slate-800"><div className="flex items-center justify-between mb-2"><span className="text-sm font-medium text-cyan-400 uppercase">{key}.md</span><Button variant="ghost" size="sm" className="h-6 text-xs text-slate-400 hover:text-white"><Edit2 className="w-3 h-3 mr-1" />Edit</Button></div><p className="text-xs text-slate-500 line-clamp-2">{content || 'No content'}</p></div>))}</div></div></TabsContent>
                <TabsContent value="stats" className="mt-6"><div className="holo-card p-6"><h3 className="text-lg font-semibold text-white mb-4">Usage Statistics</h3><div className="grid grid-cols-3 gap-4"><div className="p-4 rounded-lg bg-slate-900/50 border border-slate-800 text-center"><p className="text-3xl font-bold text-cyan-400">{selectedAgent.metrics.messagesToday}</p><p className="text-xs text-slate-400 mt-1">Messages Today</p></div><div className="p-4 rounded-lg bg-slate-900/50 border border-slate-800 text-center"><p className="text-3xl font-bold text-purple-400">{(selectedAgent.metrics.tokensUsed / 1000).toFixed(1)}k</p><p className="text-xs text-slate-400 mt-1">Tokens Used</p></div><div className="p-4 rounded-lg bg-slate-900/50 border border-slate-800 text-center"><p className="text-3xl font-bold text-emerald-400">{selectedAgent.skills.length}</p><p className="text-xs text-slate-400 mt-1">Skills</p></div></div></div></TabsContent>
              </Tabs>
            </div>
          ) : <div className="h-full flex items-center justify-center"><div className="text-center"><Users className="w-16 h-16 text-slate-700 mx-auto mb-4" /><p className="text-slate-400">Select an agent to view details</p></div></div>}
        </div>
      </div>

      <AlertDialog open={!!pendingAction} onOpenChange={(open) => !open && setPendingAction(null)}>
        <AlertDialogContent className="bg-slate-900 border-slate-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm operator action</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">This action writes to the audit trail and can impact live runtime state.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-700 text-slate-300">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeAction}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
