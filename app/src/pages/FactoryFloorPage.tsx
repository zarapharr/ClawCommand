import { useEffect, useMemo, useState } from 'react';
import { Factory, Users, Zap, RefreshCw } from 'lucide-react';
import type { Agent } from '@/types';
import { AgentStation } from '@/components/factory-floor/AgentStation';
import { ConnectionLines } from '@/components/factory-floor/ConnectionLines';
import { ActivityFeed } from '@/components/factory-floor/ActivityFeed';
import { SystemGauges } from '@/components/factory-floor/SystemGauges';
import { Button } from '@/components/ui/button';
import { fetchRuntimeStatus, startRuntimePolling } from '@/lib/openclaw-api';
import { runtimeMetrics } from '@/lib/openclaw-mappers';
import type { AgentConnection, ActivityEvent, SystemMetrics } from '@/types';

export function FactoryFloorPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [subagentActivities, setSubagentActivities] = useState<Array<{ id: string; task?: string; status: string; lastActivity?: string }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  const load = async () => {
    const result = await fetchRuntimeStatus();
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setAgents(result.data.agents);
    setSubagentActivities(result.data.subagents.map((item) => ({
      id: item.id,
      task: item.task,
      status: item.status,
      lastActivity: item.lastActivity,
    })));
    setError(null);
  };

  useEffect(() => {
    void load();
    const cleanup = startRuntimePolling(10_000);
    const id = window.setInterval(() => void load(), 10_000);
    return () => {
      cleanup();
      clearInterval(id);
    };
  }, []);

  const metrics = useMemo(() => runtimeMetrics({ agents, sessions: [], subagents: [], adapterHealth: 'ok', health: 'healthy', lastSyncAt: new Date().toISOString() }), [agents]);
  const connections: AgentConnection[] = useMemo(() => agents.slice(1).map((agent, idx) => ({ from: agents[0]?.id || agent.id, to: agent.id, activity: idx % 2 ? 'low' : 'medium', messageCount: 0 })), [agents]);
  const systemMetrics: SystemMetrics = useMemo(() => ({ cpu: { usage: Math.min(95, 15 + metrics.workingAgents * 10) }, memory: { total: 100, used: Math.min(95, 20 + metrics.onlineAgents * 8), free: 100 - Math.min(95, 20 + metrics.onlineAgents * 8) }, disk: { total: 100, used: 48, free: 52 }, gateway: { status: error ? 'offline' : 'online', uptime: 0, connectedChannels: [] } }), [metrics, error]);
  const activities: ActivityEvent[] = useMemo(() => subagentActivities.map((item) => ({ id: item.id, agentId: item.id, agentName: item.id, agentEmoji: '⚙️', type: item.status === 'error' ? 'error' : 'status_change', message: item.task || item.status, timestamp: item.lastActivity || new Date().toISOString() })), [subagentActivities]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center">
            <Factory className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white"><span className="text-cyan-400">Factory</span> Floor</h1>
            <p className="text-xs text-slate-400">Live runtime, sessions, and subagent status</p>
          </div>
        </div>
        <Button variant="outline" className="border-slate-700 text-slate-300" onClick={() => void load()}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>
      </div>

      <div className="px-6 py-4 grid grid-cols-3 gap-3">
        <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/30"><Users className="w-4 h-4 inline mr-2 text-cyan-400" />Agents: {metrics.onlineAgents}/{agents.length}</div>
        <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/30"><Zap className="w-4 h-4 inline mr-2 text-emerald-400" />Working: {metrics.workingAgents}</div>
        <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/30">Tokens: {(metrics.totalTokens / 1000).toFixed(1)}K</div>
      </div>
      {error && <p className="px-6 text-sm text-red-400">{error}</p>}

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 relative p-6">
          <div className="relative w-full h-full rounded-2xl border overflow-hidden tron-grid bg-slate-900/30 border-slate-800/50">
            <ConnectionLines agents={agents} connections={connections} selectedAgentId={selectedAgent?.id} />
            {agents.map((agent) => (
              <AgentStation key={agent.id} agent={agent} isSelected={selectedAgent?.id === agent.id} onClick={() => setSelectedAgent(agent)} onDoubleClick={() => setSelectedAgent(agent)} />
            ))}
          </div>
        </div>

        <div className="w-96 p-6 pr-4 flex flex-col gap-4 border-l border-slate-800/50 bg-slate-950/50">
          <SystemGauges metrics={systemMetrics} />
          <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-3">Subagent Feed</p>
            <div className="space-y-2 max-h-72 overflow-auto">
              {subagentActivities.map((item) => (
                <div key={item.id} className="text-xs border border-slate-800 rounded p-2 bg-slate-950/30">
                  <p className="text-slate-200">{item.id}</p>
                  <p className="text-slate-500">{item.task || 'no task'}</p>
                  <p className="text-cyan-400">{item.status}</p>
                </div>
              ))}
              {!subagentActivities.length && <p className="text-sm text-slate-500">No active subagents.</p>}
            </div>
          </div>
          <ActivityFeed activities={activities} />
        </div>
      </div>
    </div>
  );
}

export default FactoryFloorPage;
