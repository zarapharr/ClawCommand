import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { Factory, Users, Zap, RefreshCw, Save, RotateCcw, Link2, Building2, Layers3 } from 'lucide-react';
import type { Agent } from '@/types';
import { AgentStation } from '@/components/factory-floor/AgentStation';
import { ConnectionLines } from '@/components/factory-floor/ConnectionLines';
import { ActivityFeed } from '@/components/factory-floor/ActivityFeed';
import { SystemGauges } from '@/components/factory-floor/SystemGauges';
import { Button } from '@/components/ui/button';
import { fetchRuntimeStatus, subscribeRuntimeUpdates } from '@/lib/openclaw-api';
import { runtimeMetrics } from '@/lib/openclaw-mappers';
import { clearFactoryFloorStorage, loadFactoryEdges, loadFactoryLayout, normalizeFactoryEdges, saveFactoryEdges, saveFactoryLayout, type ManualFactoryEdge } from '@/lib/factory-floor-storage';
import { evaluateRuntimeContract, parseRuntimeContractSnapshot } from '@/lib/runtime-contract';
import type { AgentConnection, SystemMetrics } from '@/types';

interface FactoryFloorPageProps {
  onOpenAgentCommand?: (agentId: string) => void;
}

export function FactoryFloorPage({ onOpenAgentCommand }: FactoryFloorPageProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [sessions, setSessions] = useState<Array<{ agentId: string; key: string; messageCount: number }>>([]);
  const [subagentActivities, setSubagentActivities] = useState<Array<{ id: string; task?: string; status: string; lastActivity?: string }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [runtimeHealth, setRuntimeHealth] = useState<'healthy' | 'degraded' | 'offline'>('offline');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [manualEdges, setManualEdges] = useState<ManualFactoryEdge[]>(() => loadFactoryEdges());
  const [connectMode, setConnectMode] = useState(false);
  const [connectSourceId, setConnectSourceId] = useState<string | null>(null);
  const [dirtyLayout, setDirtyLayout] = useState(false);
  const [dirtyEdges, setDirtyEdges] = useState(false);
  const [activeView, setActiveView] = useState<'floor' | 'team' | 'boardroom'>('floor');
  const [floorHeight, setFloorHeight] = useState(560);
  const [nodeSizePreset, setNodeSizePreset] = useState<'small' | 'medium' | 'large'>('medium');
  const [nodeScale, setNodeScale] = useState(1);

  const requestRef = useRef(0);
  const loadInFlightRef = useRef(false);
  const queuedRef = useRef(false);
  const floorRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ id: string; pointerId: number; moved: boolean } | null>(null);
  const lastDraggedRef = useRef<{ id: string; at: number } | null>(null);

  const applySavedLayout = useCallback((items: Agent[]): Agent[] => {
    const savedLayout = loadFactoryLayout();
    return items.map((agent) => ({
      ...agent,
      position: savedLayout[agent.id] ?? agent.position,
    }));
  }, []);

  const load = useCallback(async ({ initial = false }: { initial?: boolean } = {}) => {
    if (loadInFlightRef.current) {
      queuedRef.current = true;
      return;
    }

    const requestId = ++requestRef.current;
    loadInFlightRef.current = true;
    if (initial || (!agents.length && !sessions.length)) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const result = await fetchRuntimeStatus();
      if (requestId !== requestRef.current) return;
      if (!result.ok) {
        setError(result.error);
        return;
      }
      const withLayout = applySavedLayout(result.data.agents);
      setAgents(withLayout);
      setSessions(result.data.sessions.map((item) => ({ agentId: item.agentId, key: item.key, messageCount: item.messageCount })));
      setSubagentActivities(result.data.subagents.map((item) => ({
        id: item.id,
        task: item.task,
        status: item.status,
        lastActivity: item.lastActivity,
      })));
      setRuntimeHealth(result.data.health);
      setSelectedAgent((current) => withLayout.find((agent) => agent.id === current?.id) ?? withLayout[0] ?? null);
      setError(null);
    } catch (err) {
      if (requestId !== requestRef.current) return;
      setError(err instanceof Error ? err.message : 'Runtime load failed');
    } finally {
      if (requestId === requestRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
      loadInFlightRef.current = false;
      if (queuedRef.current) {
        queuedRef.current = false;
        window.setTimeout(() => {
          void load();
        }, 120);
      }
    }
  }, [agents.length, applySavedLayout, sessions.length]);

  useEffect(() => {
    void load({ initial: true });
    const unsubscribe = subscribeRuntimeUpdates((update) => {
      if (update.kind === 'tick' || update.kind === 'agent_status' || update.kind === 'subagents') {
        void load();
      }
    });
    return () => {
      requestRef.current += 1;
      unsubscribe();
    };
  }, [load]);

  const metrics = useMemo(() => runtimeMetrics({ agents, sessions: sessions.map((session) => ({
    id: session.key,
    key: session.key,
    groupLabel: '#General',
    agentId: session.agentId,
    agentName: session.agentId,
    agentEmoji: '💬',
    status: 'active',
    messageCount: session.messageCount,
    createdAt: new Date().toISOString(),
    lastActivity: new Date().toISOString(),
    messages: [],
  })), subagents: subagentActivities.map((subagent) => ({
    id: subagent.id,
    parentSessionId: '',
    status: subagent.status as 'active' | 'idle' | 'completed' | 'error',
    task: subagent.task,
    startedAt: new Date().toISOString(),
    lastActivity: subagent.lastActivity,
  })), adapterHealth: runtimeHealth === 'healthy' ? 'ok' : runtimeHealth === 'degraded' ? 'degraded' : 'offline', health: runtimeHealth, lastSyncAt: new Date().toISOString() }), [agents, runtimeHealth, sessions, subagentActivities]);

  const runtimeConnections: AgentConnection[] = useMemo(() => {
    const byAgent = new Map<string, number>();
    for (const session of sessions) {
      byAgent.set(session.agentId, (byAgent.get(session.agentId) || 0) + session.messageCount);
    }
    const main = agents[0]?.id;
    return agents
      .filter((agent) => agent.id !== main)
      .map((agent) => {
        const count = byAgent.get(agent.id) || 0;
        return {
          from: main || agent.id,
          to: agent.id,
          activity: count > 40 ? 'high' : count > 10 ? 'medium' : count > 0 ? 'low' : 'none',
          messageCount: count,
        };
      });
  }, [agents, sessions]);

  const systemMetrics: SystemMetrics = useMemo(() => ({ cpu: { usage: Math.min(95, 15 + metrics.workingAgents * 10) }, memory: { total: 100, used: Math.min(95, 20 + metrics.onlineAgents * 8), free: 100 - Math.min(95, 20 + metrics.onlineAgents * 8) }, disk: { total: 100, used: 48, free: 52 }, gateway: { status: runtimeHealth === 'offline' ? 'offline' : 'online', uptime: 0, connectedChannels: [] } }), [metrics, runtimeHealth]);
  const activities = useMemo(() => subagentActivities.map((item) => ({ id: item.id, type: item.status === 'error' ? 'error' as const : 'info' as const, title: item.task || item.status, description: `Agent: ${item.id}`, timestamp: new Date(item.lastActivity || Date.now()) })), [subagentActivities]);

  const beginDrag = (agentId: string, event: ReactPointerEvent<HTMLDivElement>) => {
    if (connectMode) return;
    dragRef.current = { id: agentId, pointerId: event.pointerId, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const dragAgent = useCallback((event: PointerEvent) => {
    const active = dragRef.current;
    if (!active || active.pointerId !== event.pointerId) return;
    const floor = floorRef.current;
    if (!floor) return;

    const bounds = floor.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * 100;
    const y = ((event.clientY - bounds.top) / bounds.height) * 100;

    active.moved = true;
    setDirtyLayout(true);
    setAgents((prev) => prev.map((agent) => (
      agent.id === active.id
        ? { ...agent, position: { x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) } }
        : agent
    )));
  }, []);

  const endDrag = useCallback((event: PointerEvent) => {
    const active = dragRef.current;
    if (!active || active.pointerId !== event.pointerId) return;
    if (active.moved) {
      lastDraggedRef.current = { id: active.id, at: Date.now() };
    }
    dragRef.current = null;
  }, []);

  useEffect(() => {
    window.addEventListener('pointermove', dragAgent);
    window.addEventListener('pointerup', endDrag);
    return () => {
      window.removeEventListener('pointermove', dragAgent);
      window.removeEventListener('pointerup', endDrag);
    };
  }, [dragAgent, endDrag]);

  const handleStationClick = (agent: Agent) => {
    if (lastDraggedRef.current?.id === agent.id && Date.now() - lastDraggedRef.current.at < 250) {
      return;
    }
    setSelectedAgent(agent);

    if (connectMode && connectSourceId) {
      if (connectSourceId !== agent.id) {
        const next = normalizeFactoryEdges([...manualEdges, { from: connectSourceId, to: agent.id }]);
        setManualEdges(next);
        setDirtyEdges(true);
      }
      setConnectSourceId(null);
    }
  };

  const handleConnectionPointClick = (agentId: string) => {
    if (!connectMode) return;
    if (!connectSourceId) {
      setConnectSourceId(agentId);
      return;
    }
    if (connectSourceId === agentId) {
      setConnectSourceId(null);
      return;
    }
    const next = normalizeFactoryEdges([...manualEdges, { from: connectSourceId, to: agentId }]);
    setManualEdges(next);
    setDirtyEdges(true);
    setConnectSourceId(null);
  };

  const saveCustomizations = () => {
    const layout = Object.fromEntries(agents.map((agent) => [agent.id, { x: agent.position.x, y: agent.position.y }]));
    saveFactoryLayout(layout);
    saveFactoryEdges(manualEdges);
    setDirtyLayout(false);
    setDirtyEdges(false);
  };

  const resetCustomizations = () => {
    clearFactoryFloorStorage();
    setManualEdges([]);
    setConnectSourceId(null);
    setDirtyLayout(false);
    setDirtyEdges(false);
    void load();
  };

  const teamStructure = useMemo(() => {
    const lead = agents[0];
    const workers = agents.slice(1);
    return { lead, workers };
  }, [agents]);

  const boardroomProjects = useMemo(() => {
    const statusCounts = agents.reduce((acc, agent) => {
      acc[agent.status] = (acc[agent.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return [
      {
        id: 'ops-runtime',
        name: 'Runtime Operations',
        summary: `${metrics.onlineAgents}/${agents.length} agents online, ${metrics.workingAgents} actively working.`,
        participants: teamStructure.workers.slice(0, 4).map((agent) => `${agent.emoji} ${agent.name}`),
      },
      {
        id: 'execution-health',
        name: 'Execution Health',
        summary: `Sessions: ${sessions.length}. Subagents: ${subagentActivities.length}. Health: ${runtimeHealth}.`,
        participants: [teamStructure.lead ? `${teamStructure.lead.emoji} ${teamStructure.lead.name}` : 'No lead assigned'],
      },
      {
        id: 'risk-watch',
        name: 'Risk Watch',
        summary: `Errors: ${statusCounts.error || 0}. Offline: ${statusCounts.offline || 0}.`,
        participants: ['⚠️ Risk monitor'],
      },
    ];
  }, [agents, metrics.onlineAgents, metrics.workingAgents, runtimeHealth, sessions.length, subagentActivities.length, teamStructure.lead, teamStructure.workers]);

  const contractReport = useMemo(() => {
    if (typeof window === 'undefined') return evaluateRuntimeContract(null);
    return evaluateRuntimeContract(parseRuntimeContractSnapshot(window.localStorage.getItem('clawcommand.runtime.contract')));
  }, []); // Empty deps: contract evaluation is stable

  const applyNodePreset = (preset: 'small' | 'medium' | 'large') => {
    setNodeSizePreset(preset);
    setNodeScale(preset === 'small' ? 0.85 : preset === 'large' ? 1.2 : 1);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center">
            <Factory className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white"><span className="text-cyan-400">Factory</span> Floor</h1>
            <p className="text-xs text-slate-400">Runtime-native topology and relationship graph</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden lg:flex items-center gap-2 border border-slate-700 rounded-lg px-2 py-1">
            <span className="text-xs text-slate-400">Canvas</span>
            <input type="range" min={420} max={900} value={floorHeight} onChange={(e) => setFloorHeight(Number(e.target.value))} />
          </div>
          <div className="hidden lg:flex items-center gap-2 border border-slate-700 rounded-lg px-2 py-1">
            <span className="text-xs text-slate-400">Nodes</span>
            <button className={`text-xs px-2 py-1 rounded ${nodeSizePreset === 'small' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'}`} onClick={() => applyNodePreset('small')}>S</button>
            <button className={`text-xs px-2 py-1 rounded ${nodeSizePreset === 'medium' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'}`} onClick={() => applyNodePreset('medium')}>M</button>
            <button className={`text-xs px-2 py-1 rounded ${nodeSizePreset === 'large' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'}`} onClick={() => applyNodePreset('large')}>L</button>
            <input type="range" min={70} max={140} value={Math.round(nodeScale * 100)} onChange={(e) => {
              setNodeSizePreset('medium');
              setNodeScale(Number(e.target.value) / 100);
            }} />
          </div>
          <Button
            variant="outline"
            className={connectMode ? 'border-fuchsia-500/60 text-fuchsia-300 bg-fuchsia-500/10' : 'border-slate-700 text-slate-300'}
            onClick={() => {
              setConnectMode((prev) => !prev);
              setConnectSourceId(null);
            }}
          >
            <Link2 className="w-4 h-4 mr-2" />Connect
          </Button>
          <Button variant="outline" className="border-slate-700 text-slate-300" onClick={saveCustomizations} disabled={!dirtyLayout && !dirtyEdges}>
            <Save className="w-4 h-4 mr-2" />Save
          </Button>
          <Button variant="outline" className="border-slate-700 text-slate-300" onClick={resetCustomizations}>
            <RotateCcw className="w-4 h-4 mr-2" />Reset
          </Button>
          <Button variant="outline" className="border-slate-700 text-slate-300" onClick={() => void load()} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />Refresh
          </Button>
        </div>
      </div>

      <div className="px-6 py-4 grid grid-cols-3 gap-3">
        <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/30"><Users className="w-4 h-4 inline mr-2 text-cyan-400" />Agents: {metrics.onlineAgents}/{agents.length}</div>
        <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/30"><Zap className="w-4 h-4 inline mr-2 text-emerald-400" />Working: {metrics.workingAgents}</div>
        <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/30">Tokens: {(metrics.totalTokens / 1000).toFixed(1)}K</div>
      </div>
      {contractReport.status === 'warn' && <p className="px-6 pb-2 text-xs text-amber-300">Contract check: {contractReport.issues[0]}</p>}
      {error && <p className="px-6 text-sm text-red-400">{error}</p>}

      <div className="px-6 py-3 border-b border-slate-800/40 flex gap-2">
        <Button variant="outline" className={activeView === 'floor' ? 'border-cyan-500/50 text-cyan-300' : 'border-slate-700 text-slate-300'} onClick={() => setActiveView('floor')}>
          <Factory className="w-4 h-4 mr-2" />Floor
        </Button>
        <Button variant="outline" className={activeView === 'team' ? 'border-cyan-500/50 text-cyan-300' : 'border-slate-700 text-slate-300'} onClick={() => setActiveView('team')}>
          <Layers3 className="w-4 h-4 mr-2" />Team Structure
        </Button>
        <Button variant="outline" className={activeView === 'boardroom' ? 'border-cyan-500/50 text-cyan-300' : 'border-slate-700 text-slate-300'} onClick={() => setActiveView('boardroom')}>
          <Building2 className="w-4 h-4 mr-2" />Boardroom
        </Button>
      </div>

      {activeView === 'floor' && <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 relative p-6">
          <div ref={floorRef} className="relative w-full rounded-2xl border overflow-hidden tron-grid bg-slate-900/30 border-slate-800/50" style={{ height: `${floorHeight}px`, maxHeight: '100%' }}>
            {loading && !agents.length && <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">Loading factory floor...</div>}
            {!loading && !agents.length && (
              <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-sm">No agents detected. Start an agent or refresh runtime status.</div>
            )}
            {!!agents.length && (
              <>
                <ConnectionLines agents={agents} connections={runtimeConnections} manualEdges={manualEdges} selectedAgentId={selectedAgent?.id} />
                {agents.map((agent) => (
                  <AgentStation
                    key={agent.id}
                    agent={agent}
                    isSelected={selectedAgent?.id === agent.id}
                    connectMode={connectMode}
                    isConnectSource={connectSourceId === agent.id}
                    onClick={() => handleStationClick(agent)}
                    onDoubleClick={() => onOpenAgentCommand?.(agent.id)}
                    onPointerDown={(event) => beginDrag(agent.id, event)}
                    onConnectionPointClick={() => handleConnectionPointClick(agent.id)}
                    nodeScale={nodeScale}
                  />
                ))}
              </>
            )}
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
      </div>}

      {activeView === 'team' && (
        <div className="flex-1 overflow-auto p-6">
          <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-5 mb-4">
            <p className="text-xs uppercase tracking-wider text-slate-400 mb-2">Team Lead</p>
            {teamStructure.lead ? <p className="text-white font-semibold">{teamStructure.lead.emoji} {teamStructure.lead.name} <span className="text-slate-400 font-normal">({teamStructure.lead.role})</span></p> : <p className="text-slate-500">No lead assigned.</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {teamStructure.workers.map((agent) => (
              <div key={agent.id} className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
                <p className="text-white font-medium">{agent.emoji} {agent.name}</p>
                <p className="text-xs text-slate-400">{agent.role}</p>
                <p className="text-xs text-slate-500 mt-2">Connections: {agent.connections.length}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeView === 'boardroom' && (
        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {boardroomProjects.map((project) => (
              <div key={project.id} className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
                <p className="text-cyan-300 text-sm font-semibold">{project.name}</p>
                <p className="text-sm text-slate-300 mt-2">{project.summary}</p>
                <div className="mt-3 space-y-1">
                  {project.participants.map((participant) => (
                    <p key={`${project.id}-${participant}`} className="text-xs text-slate-400">• {participant}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default FactoryFloorPage;
