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
  MessageSquare, Cpu, Wrench, FolderOpen, FileText, ShieldCheck,
} from 'lucide-react';
import { StatusIndicator } from '@/components/factory-floor/StatusIndicator';
import { getAgentsFeed, getDiagnostics, getInteractionStats, readDecisionLog, readOperatorAudit, runOperatorAction } from '@/lib/runtime-adapters';
import { useRuntimeFeed } from '@/hooks/use-runtime-feed';
import { RuntimeStatusBar } from '@/components/runtime/RuntimeStatusBar';
import { HealthConnectionPanel } from '@/components/runtime/HealthConnectionPanel';
import { ActionReceiptLedger } from '@/components/runtime/ActionReceiptLedger';
import { DecisionLogPanel } from '@/components/runtime/DecisionLogPanel';

export function AgentsPage() {
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
  const [pendingAction, setPendingAction] = useState<{ id: string; action: 'start' | 'stop' | 'retry' | 'kill' | 'escalate' } | null>(null);
  const [auditLog, setAuditLog] = useState(readOperatorAudit());
  const [decisions, setDecisions] = useState(readDecisionLog());

  useEffect(() => {
    setAgents(agentsFeed.data);
    setSelectedAgent((prev) => agentsFeed.data.find((agent) => agent.id === prev?.id) ?? agentsFeed.data[0] ?? null);
  }, [agentsFeed.data]);

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
    await runOperatorAction({
      action: pendingAction.action,
      source: agentsFeed.source,
      targetId: pendingAction.id,
      targetType: 'agent',
      payload: { reason: 'operator console action' },
    });

    setAgents((prev) => prev.map((agent) => {
      if (agent.id !== pendingAction.id) return agent;
      const statusMap = {
        start: 'working',
        stop: 'idle',
        retry: 'thinking',
        kill: 'offline',
        escalate: 'working',
      } as const;
      return { ...agent, status: statusMap[pendingAction.action], updatedAt: new Date().toISOString() };
    }));

    setAuditLog(readOperatorAudit());
    setDecisions(readDecisionLog());
    setPendingAction(null);
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

      <div className="px-6 pt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/30"><p className="text-xs text-slate-400">Interactions</p><p className="text-lg text-cyan-300 font-semibold">{interactionFeed.data.totalMessages}</p></div>
        <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/30"><p className="text-xs text-slate-400">Active sessions</p><p className="text-lg text-cyan-300 font-semibold">{interactionFeed.data.activeSessions}</p></div>
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
                  <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800" onClick={() => setIsEditing(!isEditing)}><Edit2 className="w-4 h-4 mr-2" />Edit</Button>
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
                  <TabsTrigger value="workspace" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400"><FolderOpen className="w-4 h-4 mr-2" />Workspace</TabsTrigger>
                  <TabsTrigger value="stats" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400"><MessageSquare className="w-4 h-4 mr-2" />Stats</TabsTrigger>
                </TabsList>
                <TabsContent value="identity" className="mt-6"><div className="holo-card p-6"><h3 className="text-lg font-semibold text-white mb-4">Agent Identity</h3><div className="grid grid-cols-2 gap-6"><div><label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">Name</label><Input value={selectedAgent.name} className="bg-slate-900/50 border-slate-700 text-white" readOnly={!isEditing} /></div><div><label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">Emoji</label><Input value={selectedAgent.emoji} className="bg-slate-900/50 border-slate-700 text-white w-20 text-center" readOnly={!isEditing} /></div><div><label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">Role</label><Input value={selectedAgent.role} className="bg-slate-900/50 border-slate-700 text-white" readOnly={!isEditing} /></div><div className="col-span-2"><label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">Description</label><textarea value={selectedAgent.description} className="w-full h-24 bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-white text-sm resize-none" readOnly={!isEditing} /></div></div></div></TabsContent>
                <TabsContent value="model" className="mt-6"><div className="holo-card p-6"><h3 className="text-lg font-semibold text-white mb-4">Model Configuration</h3><div className="grid grid-cols-2 gap-6"><div><label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">Provider</label><Input value={selectedAgent.model.provider} className="bg-slate-900/50 border-slate-700 text-white" readOnly /></div><div><label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">Model</label><Input value={selectedAgent.model.model} className="bg-slate-900/50 border-slate-700 text-white" readOnly /></div><div><label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">Temperature</label><Input value={selectedAgent.model.temperature} className="bg-slate-900/50 border-slate-700 text-white" readOnly={!isEditing} /></div><div><label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">Max Tokens</label><Input value={selectedAgent.model.maxTokens} className="bg-slate-900/50 border-slate-700 text-white" readOnly={!isEditing} /></div></div></div></TabsContent>
                <TabsContent value="tools" className="mt-6"><div className="holo-card p-6"><h3 className="text-lg font-semibold text-white mb-4">Tool Configuration</h3><div className="space-y-4"><div><label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">Allowed Tools</label><div className="flex flex-wrap gap-2">{selectedAgent.tools.allow.map((tool) => (<Badge key={tool} variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10">{tool}</Badge>))}</div></div></div></div></TabsContent>
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
