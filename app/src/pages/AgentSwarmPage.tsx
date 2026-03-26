import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Network,
  Plus,
  Play,
  Square,
  Skull,
  RefreshCw,
  Crown,
  Wrench,
  Star,
  Trash2,
  Activity,
  MessageSquare,
  ChevronRight,
  Users,
  Zap,
  CircleDot,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  fetchAgents,
  fetchRuntimeStatus,
  postRuntimeAction,
  subscribeRuntimeUpdates,
  type ActionReceipt,
  type RuntimeLiveUpdate,
} from '@/lib/openclaw-api';
import type { Agent } from '@/types';

// ---------------------------------------------------------------------------
// Swarm types (local UI concept persisted in localStorage)
// ---------------------------------------------------------------------------

type SwarmRole = 'supervisor' | 'worker' | 'specialist';

interface SwarmMember {
  agentId: string;
  role: SwarmRole;
}

interface Swarm {
  id: string;
  name: string;
  members: SwarmMember[];
  supervisorId: string;
  createdAt: string;
}

interface SwarmMessageEvent {
  id: string;
  agentId: string;
  agentName: string;
  agentEmoji: string;
  kind: RuntimeLiveUpdate['kind'];
  message: string;
  timestamp: string;
}

interface TaskAssignment {
  agentId: string;
  agentName: string;
  agentEmoji: string;
  task: string;
  status: Agent['status'];
}

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------

const SWARMS_KEY = 'clawcommand.swarms';

function loadSwarms(): Swarm[] {
  try {
    const raw = localStorage.getItem(SWARMS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Swarm[];
  } catch {
    return [];
  }
}

function saveSwarms(swarms: Swarm[]) {
  localStorage.setItem(SWARMS_KEY, JSON.stringify(swarms));
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// ---------------------------------------------------------------------------
// Status badge colors
// ---------------------------------------------------------------------------

function statusColor(status: Agent['status']): string {
  switch (status) {
    case 'online':
      return 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10';
    case 'working':
      return 'border-cyan-500/40 text-cyan-400 bg-cyan-500/10';
    case 'idle':
      return 'border-slate-500/40 text-slate-400 bg-slate-500/10';
    case 'thinking':
      return 'border-purple-500/40 text-purple-400 bg-purple-500/10';
    case 'error':
      return 'border-red-500/40 text-red-400 bg-red-500/10';
    case 'offline':
      return 'border-slate-700/40 text-slate-600 bg-slate-700/10';
  }
}

function roleIcon(role: SwarmRole) {
  switch (role) {
    case 'supervisor':
      return <Crown className="w-3.5 h-3.5" />;
    case 'worker':
      return <Wrench className="w-3.5 h-3.5" />;
    case 'specialist':
      return <Star className="w-3.5 h-3.5" />;
  }
}

function roleBadgeColor(role: SwarmRole): string {
  switch (role) {
    case 'supervisor':
      return 'border-amber-500/40 text-amber-400 bg-amber-500/10';
    case 'worker':
      return 'border-cyan-500/40 text-cyan-400 bg-cyan-500/10';
    case 'specialist':
      return 'border-purple-500/40 text-purple-400 bg-purple-500/10';
  }
}

// ---------------------------------------------------------------------------
// Loading skeleton components
// ---------------------------------------------------------------------------

function SwarmListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-3 rounded-lg border border-slate-800 bg-slate-950/30">
          <Skeleton className="h-4 w-32 mb-2 bg-slate-800" />
          <Skeleton className="h-3 w-20 bg-slate-800" />
        </div>
      ))}
    </div>
  );
}

function SwarmDetailSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-48 bg-slate-800" />
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-4 rounded-lg border border-slate-800 bg-slate-950/30">
            <Skeleton className="h-10 w-10 rounded-full mb-3 bg-slate-800" />
            <Skeleton className="h-4 w-24 mb-2 bg-slate-800" />
            <Skeleton className="h-3 w-16 bg-slate-800" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function AgentSwarmPage() {
  // Data state
  const [agents, setAgents] = useState<Agent[]>([]);
  const [swarms, setSwarms] = useState<Swarm[]>(loadSwarms);
  const [selectedSwarmId, setSelectedSwarmId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liveState, setLiveState] = useState<'connected' | 'polling-fallback' | 'closed'>('closed');

  // Create dialog state
  const [showCreate, setShowCreate] = useState(false);
  const [newSwarmName, setNewSwarmName] = useState('');
  const [selectedAgentIds, setSelectedAgentIds] = useState<Set<string>>(new Set());
  const [supervisorId, setSupervisorId] = useState('');

  // Action receipts
  const [receipts, setReceipts] = useState<ActionReceipt[]>([]);

  // Message flow log
  const [messageLog, setMessageLog] = useState<SwarmMessageEvent[]>([]);
  const messageLogRef = useRef<HTMLDivElement>(null);

  const selectedSwarm = swarms.find((s) => s.id === selectedSwarmId) ?? null;

  // -----------------------------------------------------------------------
  // Data loading
  // -----------------------------------------------------------------------

  const loadData = useCallback(async () => {
    const [agentsResult, runtimeResult] = await Promise.all([
      fetchAgents(),
      fetchRuntimeStatus(),
    ]);

    if (agentsResult.ok) {
      setAgents(agentsResult.data);
    }

    if (runtimeResult.ok) {
      // Merge runtime agent statuses into the agent list
      const runtimeAgents = runtimeResult.data.agents;
      setAgents((prev) => {
        const merged = [...prev];
        for (const ra of runtimeAgents) {
          const idx = merged.findIndex((a) => a.id === ra.id);
          if (idx >= 0) {
            merged[idx] = { ...merged[idx], status: ra.status, currentTask: ra.currentTask };
          } else {
            merged.push(ra);
          }
        }
        return merged;
      });
    }

    if (!agentsResult.ok && !runtimeResult.ok) {
      setError(agentsResult.ok ? '' : agentsResult.error);
    } else {
      setError(null);
    }

    setLoading(false);
  }, []);

  // -----------------------------------------------------------------------
  // Live updates
  // -----------------------------------------------------------------------

  useEffect(() => {
    void loadData();

    const unsubscribe = subscribeRuntimeUpdates(
      (update: RuntimeLiveUpdate) => {
        // Refresh agent data on relevant events
        if (update.kind === 'tick' || update.kind === 'agent_status' || update.kind === 'subagents') {
          void loadData();
        }

        // Log chat and agent_status events for the message flow
        if (update.kind === 'chat' || update.kind === 'agent_status') {
          const payload = update.payload as Record<string, unknown> | null;
          const agentId = (payload?.agentId ?? payload?.agent_id ?? '') as string;
          const agentName = (payload?.agentName ?? payload?.agent_name ?? agentId) as string;
          const agentEmoji = (payload?.agentEmoji ?? payload?.emoji ?? '') as string;
          const content = (payload?.content ?? payload?.message ?? payload?.status ?? update.kind) as string;

          setMessageLog((prev) =>
            [
              {
                id: generateId(),
                agentId,
                agentName,
                agentEmoji,
                kind: update.kind,
                message: typeof content === 'string' ? content.slice(0, 200) : String(content),
                timestamp: update.timestamp,
              },
              ...prev,
            ].slice(0, 200),
          );
        }
      },
      setLiveState,
    );

    return unsubscribe;
  }, [loadData]);

  // -----------------------------------------------------------------------
  // Swarm CRUD
  // -----------------------------------------------------------------------

  const persistSwarms = useCallback((next: Swarm[]) => {
    setSwarms(next);
    saveSwarms(next);
  }, []);

  const handleCreateSwarm = () => {
    if (!newSwarmName.trim() || selectedAgentIds.size === 0 || !supervisorId) return;

    const members: SwarmMember[] = [...selectedAgentIds].map((agentId) => ({
      agentId,
      role: agentId === supervisorId ? 'supervisor' as const : 'worker' as const,
    }));

    const swarm: Swarm = {
      id: generateId(),
      name: newSwarmName.trim(),
      members,
      supervisorId,
      createdAt: new Date().toISOString(),
    };

    const next = [...swarms, swarm];
    persistSwarms(next);
    setSelectedSwarmId(swarm.id);
    resetCreateForm();
  };

  const handleDeleteSwarm = (swarmId: string) => {
    const next = swarms.filter((s) => s.id !== swarmId);
    persistSwarms(next);
    if (selectedSwarmId === swarmId) {
      setSelectedSwarmId(next.length > 0 ? next[0].id : null);
    }
  };

  const handleToggleRole = (swarmId: string, agentId: string) => {
    const next = swarms.map((s) => {
      if (s.id !== swarmId) return s;
      return {
        ...s,
        members: s.members.map((m) => {
          if (m.agentId !== agentId) return m;
          const roles: SwarmRole[] = ['worker', 'specialist', 'supervisor'];
          const currentIdx = roles.indexOf(m.role);
          const nextRole = roles[(currentIdx + 1) % roles.length];
          return { ...m, role: nextRole };
        }),
      };
    });
    persistSwarms(next);
  };

  const resetCreateForm = () => {
    setShowCreate(false);
    setNewSwarmName('');
    setSelectedAgentIds(new Set());
    setSupervisorId('');
  };

  // -----------------------------------------------------------------------
  // Agent actions
  // -----------------------------------------------------------------------

  const runAction = async (agentId: string, action: 'start' | 'stop' | 'kill') => {
    const result = await postRuntimeAction({
      targetType: 'agent',
      targetId: agentId,
      action,
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setReceipts((prev) => [result.data, ...prev].slice(0, 50));
    setError(null);
    await loadData();
  };

  const runSwarmAction = async (swarm: Swarm, action: 'start' | 'stop' | 'kill') => {
    for (const member of swarm.members) {
      await runAction(member.agentId, action);
    }
  };

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  const getAgent = (agentId: string): Agent | undefined => agents.find((a) => a.id === agentId);

  const getSwarmAgents = (swarm: Swarm): Array<Agent & { swarmRole: SwarmRole }> => {
    return swarm.members
      .map((m) => {
        const agent = getAgent(m.agentId);
        if (!agent) return null;
        return { ...agent, swarmRole: m.role };
      })
      .filter((a): a is Agent & { swarmRole: SwarmRole } => a !== null);
  };

  const getSwarmMessageLog = (swarm: Swarm): SwarmMessageEvent[] => {
    const memberIds = new Set(swarm.members.map((m) => m.agentId));
    return messageLog.filter((e) => memberIds.has(e.agentId));
  };

  const getTaskAssignments = (swarm: Swarm): TaskAssignment[] => {
    return getSwarmAgents(swarm)
      .filter((a) => a.currentTask)
      .map((a) => ({
        agentId: a.id,
        agentName: a.name,
        agentEmoji: a.emoji,
        task: a.currentTask ?? '',
        status: a.status,
      }));
  };

  const toggleAgentSelection = (agentId: string) => {
    setSelectedAgentIds((prev) => {
      const next = new Set(prev);
      if (next.has(agentId)) {
        next.delete(agentId);
        if (supervisorId === agentId) setSupervisorId('');
      } else {
        next.add(agentId);
      }
      return next;
    });
  };

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div className="h-full flex flex-col bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/30 flex items-center justify-center">
            <Network className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">
              <span className="text-purple-400">Agent</span> Swarm
            </h1>
            <p className="text-xs text-slate-400">
              Multi-agent orchestration &middot;{' '}
              <span
                className={
                  liveState === 'connected'
                    ? 'text-emerald-400'
                    : liveState === 'polling-fallback'
                      ? 'text-amber-400'
                      : 'text-slate-500'
                }
              >
                {liveState}
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
            onClick={() => void loadData()}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="px-6 pt-3">
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            {error}
          </p>
        </div>
      )}

      {/* Main layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel: swarm list */}
        <div className="w-80 border-r border-slate-800/50 flex flex-col">
          <div className="p-4 border-b border-slate-800/50 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
              Swarms
            </h2>
            <Button
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={() => setShowCreate(true)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Create
            </Button>
          </div>

          <div className="flex-1 overflow-auto p-4 space-y-2">
            {loading ? (
              <SwarmListSkeleton />
            ) : swarms.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">No swarms created yet</p>
                <p className="text-slate-600 text-xs mt-1">
                  Create a swarm to group agents together
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-4 border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                  onClick={() => setShowCreate(true)}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Create Swarm
                </Button>
              </div>
            ) : (
              swarms.map((swarm) => {
                const isSelected = selectedSwarmId === swarm.id;
                const swarmAgents = getSwarmAgents(swarm);
                const activeCount = swarmAgents.filter(
                  (a) => a.status === 'online' || a.status === 'working' || a.status === 'thinking',
                ).length;

                return (
                  <button
                    key={swarm.id}
                    onClick={() => setSelectedSwarmId(swarm.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      isSelected
                        ? 'border-purple-500/50 bg-purple-500/10'
                        : 'border-slate-800 bg-slate-950/30 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-white text-sm font-medium truncate">
                        {swarm.name}
                      </span>
                      <ChevronRight
                        className={`w-4 h-4 transition-transform ${
                          isSelected ? 'text-purple-400 rotate-90' : 'text-slate-600'
                        }`}
                      />
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-xs text-slate-500">
                        {swarm.members.length} agent{swarm.members.length !== 1 ? 's' : ''}
                      </span>
                      <span className="text-xs text-slate-700">&middot;</span>
                      <span className="text-xs text-emerald-500">
                        {activeCount} active
                      </span>
                    </div>
                    <div className="flex gap-1 mt-2">
                      {swarmAgents.slice(0, 5).map((a) => (
                        <span
                          key={a.id}
                          className="text-sm"
                          title={`${a.name} (${a.swarmRole})`}
                        >
                          {a.emoji || '🤖'}
                        </span>
                      ))}
                      {swarm.members.length > 5 && (
                        <span className="text-xs text-slate-500 ml-1">
                          +{swarm.members.length - 5}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right panel: selected swarm details */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="p-6">
              <SwarmDetailSkeleton />
            </div>
          ) : !selectedSwarm ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Network className="w-16 h-16 text-slate-800 mx-auto mb-4" />
                <p className="text-slate-500 text-lg">Select a swarm to view details</p>
                <p className="text-slate-600 text-sm mt-1">
                  Or create a new swarm to get started
                </p>
              </div>
            </div>
          ) : (
            <SwarmDetail
              swarm={selectedSwarm}
              agents={getSwarmAgents(selectedSwarm)}
              taskAssignments={getTaskAssignments(selectedSwarm)}
              messageLog={getSwarmMessageLog(selectedSwarm)}
              receipts={receipts}
              messageLogRef={messageLogRef}
              onRunAction={runAction}
              onRunSwarmAction={runSwarmAction}
              onDeleteSwarm={handleDeleteSwarm}
              onToggleRole={handleToggleRole}
            />
          )}
        </div>
      </div>

      {/* Create swarm dialog */}
      <Dialog open={showCreate} onOpenChange={(open) => { if (!open) resetCreateForm(); else setShowCreate(true); }}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Create New Swarm</DialogTitle>
            <DialogDescription className="text-slate-400">
              Group agents together and assign roles for coordinated work.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div>
              <Label htmlFor="swarm-name" className="text-slate-300">
                Swarm Name
              </Label>
              <Input
                id="swarm-name"
                placeholder="e.g. Code Review Team"
                value={newSwarmName}
                onChange={(e) => setNewSwarmName(e.target.value)}
                className="mt-1 bg-slate-950 border-slate-700 text-white placeholder:text-slate-600"
              />
            </div>

            <div>
              <Label className="text-slate-300 mb-2 block">Select Agents</Label>
              {agents.length === 0 ? (
                <p className="text-sm text-slate-500 py-4 text-center">
                  No agents available. Start the gateway to load agents.
                </p>
              ) : (
                <div className="max-h-48 overflow-auto space-y-1 border border-slate-800 rounded-lg p-2 bg-slate-950/50">
                  {agents.map((agent) => (
                    <label
                      key={agent.id}
                      className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                        selectedAgentIds.has(agent.id)
                          ? 'bg-purple-500/10 border border-purple-500/30'
                          : 'hover:bg-slate-800/50 border border-transparent'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedAgentIds.has(agent.id)}
                        onChange={() => toggleAgentSelection(agent.id)}
                        className="rounded border-slate-600 bg-slate-800 text-purple-500 focus:ring-purple-500/50"
                      />
                      <span className="text-lg">{agent.emoji || '🤖'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{agent.name}</p>
                        <p className="text-xs text-slate-500 truncate">{agent.role}</p>
                      </div>
                      <Badge variant="outline" className={`text-xs ${statusColor(agent.status)}`}>
                        {agent.status}
                      </Badge>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {selectedAgentIds.size > 0 && (
              <div>
                <Label className="text-slate-300 mb-1 block">Supervisor</Label>
                <Select value={supervisorId} onValueChange={setSupervisorId}>
                  <SelectTrigger className="bg-slate-950 border-slate-700 text-white">
                    <SelectValue placeholder="Select a supervisor..." />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    {[...selectedAgentIds].map((agentId) => {
                      const agent = getAgent(agentId);
                      if (!agent) return null;
                      return (
                        <SelectItem
                          key={agent.id}
                          value={agent.id}
                          className="text-white hover:bg-slate-800"
                        >
                          {agent.emoji || '🤖'} {agent.name}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                className="border-slate-700 text-slate-300"
                onClick={resetCreateForm}
              >
                Cancel
              </Button>
              <Button
                className="bg-purple-600 hover:bg-purple-700 text-white"
                disabled={!newSwarmName.trim() || selectedAgentIds.size === 0 || !supervisorId}
                onClick={handleCreateSwarm}
              >
                <Plus className="w-4 h-4 mr-1" />
                Create Swarm
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Swarm detail panel
// ---------------------------------------------------------------------------

interface SwarmDetailProps {
  swarm: Swarm;
  agents: Array<Agent & { swarmRole: SwarmRole }>;
  taskAssignments: TaskAssignment[];
  messageLog: SwarmMessageEvent[];
  receipts: ActionReceipt[];
  messageLogRef: React.RefObject<HTMLDivElement | null>;
  onRunAction: (agentId: string, action: 'start' | 'stop' | 'kill') => Promise<void>;
  onRunSwarmAction: (swarm: Swarm, action: 'start' | 'stop' | 'kill') => Promise<void>;
  onDeleteSwarm: (swarmId: string) => void;
  onToggleRole: (swarmId: string, agentId: string) => void;
}

function SwarmDetail({
  swarm,
  agents,
  taskAssignments,
  messageLog,
  receipts,
  messageLogRef,
  onRunAction,
  onRunSwarmAction,
  onDeleteSwarm,
  onToggleRole,
}: SwarmDetailProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleAction = async (agentId: string, action: 'start' | 'stop' | 'kill') => {
    setActionLoading(`${agentId}-${action}`);
    await onRunAction(agentId, action);
    setActionLoading(null);
  };

  const handleSwarmAction = async (action: 'start' | 'stop' | 'kill') => {
    setActionLoading(`swarm-${action}`);
    await onRunSwarmAction(swarm, action);
    setActionLoading(null);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Swarm header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">{swarm.name}</h2>
          <p className="text-xs text-slate-500">
            Created {new Date(swarm.createdAt).toLocaleDateString()} &middot;{' '}
            {swarm.members.length} member{swarm.members.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
            disabled={actionLoading === 'swarm-start'}
            onClick={() => void handleSwarmAction('start')}
          >
            <Play className="w-3.5 h-3.5 mr-1" />
            Start All
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
            disabled={actionLoading === 'swarm-stop'}
            onClick={() => void handleSwarmAction('stop')}
          >
            <Square className="w-3.5 h-3.5 mr-1" />
            Stop All
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
            disabled={actionLoading === 'swarm-kill'}
            onClick={() => void handleSwarmAction('kill')}
          >
            <Skull className="w-3.5 h-3.5 mr-1" />
            Kill All
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-red-800/30 text-red-600 hover:bg-red-500/10"
            onClick={() => onDeleteSwarm(swarm.id)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="agents" className="w-full">
        <TabsList className="bg-slate-800/50 border border-slate-700/50">
          <TabsTrigger value="agents" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300">
            <Users className="w-4 h-4 mr-1.5" />
            Agents
          </TabsTrigger>
          <TabsTrigger value="tasks" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300">
            <Zap className="w-4 h-4 mr-1.5" />
            Tasks
          </TabsTrigger>
          <TabsTrigger value="messages" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-300">
            <MessageSquare className="w-4 h-4 mr-1.5" />
            Message Flow
          </TabsTrigger>
          <TabsTrigger value="receipts" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300">
            <Activity className="w-4 h-4 mr-1.5" />
            Receipts
          </TabsTrigger>
        </TabsList>

        {/* Agents tab */}
        <TabsContent value="agents" className="mt-4">
          {agents.length === 0 ? (
            <div className="text-center py-12 border border-slate-800 rounded-lg bg-slate-950/20">
              <Users className="w-10 h-10 text-slate-700 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">
                No agents found for this swarm. They may be unavailable from the gateway.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {agents.map((agent) => (
                <Card
                  key={agent.id}
                  className={`bg-slate-950/50 border-slate-800 hover:border-slate-700 transition-colors ${
                    agent.swarmRole === 'supervisor' ? 'ring-1 ring-amber-500/20' : ''
                  }`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{agent.emoji || '🤖'}</span>
                        <div>
                          <CardTitle className="text-white text-sm">{agent.name}</CardTitle>
                          <p className="text-xs text-slate-500 mt-0.5">{agent.role}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className={`text-xs ${statusColor(agent.status)}`}>
                        {agent.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onToggleRole(swarm.id, agent.id)}
                        className="cursor-pointer"
                        title="Click to cycle role"
                      >
                        <Badge
                          variant="outline"
                          className={`${roleBadgeColor(agent.swarmRole)} flex items-center gap-1`}
                        >
                          {roleIcon(agent.swarmRole)}
                          {agent.swarmRole}
                        </Badge>
                      </button>
                    </div>

                    {agent.currentTask && (
                      <div className="text-xs text-slate-400 bg-slate-800/50 rounded px-2 py-1.5 border border-slate-700/30">
                        <span className="text-cyan-500 font-medium">Task:</span>{' '}
                        {agent.currentTask}
                      </div>
                    )}

                    <div className="text-xs text-slate-500 space-y-1">
                      <div className="flex justify-between">
                        <span>Model</span>
                        <span className="text-slate-400">{agent.model.model}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Messages today</span>
                        <span className="text-slate-400">{agent.metrics.messagesToday}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tokens used</span>
                        <span className="text-slate-400">
                          {agent.metrics.tokensUsed.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-1.5 pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 text-xs h-7"
                        disabled={actionLoading === `${agent.id}-start`}
                        onClick={() => void handleAction(agent.id, 'start')}
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Start
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-orange-500/30 text-orange-400 hover:bg-orange-500/10 text-xs h-7"
                        disabled={actionLoading === `${agent.id}-stop`}
                        onClick={() => void handleAction(agent.id, 'stop')}
                      >
                        <Square className="w-3 h-3 mr-1" />
                        Stop
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs h-7"
                        disabled={actionLoading === `${agent.id}-kill`}
                        onClick={() => void handleAction(agent.id, 'kill')}
                      >
                        <Skull className="w-3 h-3 mr-1" />
                        Kill
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tasks tab */}
        <TabsContent value="tasks" className="mt-4">
          {taskAssignments.length === 0 ? (
            <div className="text-center py-12 border border-slate-800 rounded-lg bg-slate-950/20">
              <Zap className="w-10 h-10 text-slate-700 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">No active task assignments</p>
              <p className="text-slate-600 text-xs mt-1">
                Tasks appear here when agents in this swarm are working
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {taskAssignments.map((assignment) => (
                <div
                  key={assignment.agentId}
                  className="flex items-center gap-3 p-3 rounded-lg border border-slate-800 bg-slate-950/30"
                >
                  <span className="text-xl">{assignment.agentEmoji || '🤖'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium">{assignment.agentName}</p>
                    <p className="text-xs text-slate-400 truncate">{assignment.task}</p>
                  </div>
                  <Badge variant="outline" className={`text-xs ${statusColor(assignment.status)}`}>
                    {assignment.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Message flow tab */}
        <TabsContent value="messages" className="mt-4">
          <div
            ref={messageLogRef}
            className="border border-slate-800 rounded-lg bg-slate-950/30 max-h-[500px] overflow-auto"
          >
            {messageLog.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-10 h-10 text-slate-700 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">No messages yet</p>
                <p className="text-slate-600 text-xs mt-1">
                  Live events from swarm agents will appear here
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/50">
                {messageLog.map((event) => (
                  <div key={event.id} className="flex items-start gap-3 p-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <span className="text-lg">{event.agentEmoji || '🤖'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-white font-medium">
                          {event.agentName || event.agentId || 'Unknown'}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 ${
                            event.kind === 'chat'
                              ? 'border-cyan-500/30 text-cyan-400'
                              : 'border-purple-500/30 text-purple-400'
                          }`}
                        >
                          {event.kind}
                        </Badge>
                        <span className="text-[10px] text-slate-600">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 break-words">
                        {event.message}
                      </p>
                    </div>
                    <CircleDot className="w-3 h-3 text-cyan-500/50 flex-shrink-0 mt-1.5 animate-pulse" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Receipts tab */}
        <TabsContent value="receipts" className="mt-4">
          {receipts.length === 0 ? (
            <div className="text-center py-12 border border-slate-800 rounded-lg bg-slate-950/20">
              <Activity className="w-10 h-10 text-slate-700 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">No action receipts yet</p>
              <p className="text-slate-600 text-xs mt-1">
                Receipts appear when you start, stop, or kill agents
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {receipts.map((receipt) => (
                <div
                  key={receipt.id}
                  className="p-3 rounded-lg border border-slate-800 bg-slate-950/30 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-slate-200 font-mono">{receipt.commandId}</span>
                    <Badge
                      variant="outline"
                      className={
                        receipt.status === 'success'
                          ? 'border-emerald-500/30 text-emerald-400'
                          : 'border-red-500/30 text-red-400'
                      }
                    >
                      {receipt.status}
                    </Badge>
                  </div>
                  <p className="text-slate-500 mt-1">
                    {receipt.result || receipt.error || 'No details'}
                  </p>
                  <p className="text-slate-600 mt-0.5">
                    {new Date(receipt.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AgentSwarmPage;
