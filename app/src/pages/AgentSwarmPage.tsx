import { useState } from 'react';
import { 
  Users, Plus, Settings, Play, Pause, Trash2,
  Zap, UserCog, Eye, Brain, ArrowRight, Network, Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockAgents } from '@/data/mock-data';

// Types
interface SwarmMember {
  agentId: string;
  role: 'supervisor' | 'worker' | 'specialist' | 'reviewer';
  canDelegate: boolean;
  canEscalate: boolean;
  priority: number;
}

interface Swarm {
  id: string;
  name: string;
  description: string;
  members: SwarmMember[];
  communicationPattern: 'direct' | 'broadcast' | 'hierarchical';
  taskDistribution: 'round_robin' | 'load_balanced' | 'skill_based';
  isActive: boolean;
  createdAt: string;
  metrics: {
    tasksCompleted: number;
    messagesExchanged: number;
    avgResponseTime: number;
  };
}

interface SwarmMessage {
  id: string;
  swarmId: string;
  fromAgentId: string;
  toAgentId?: string;
  type: 'direct' | 'broadcast' | 'task' | 'result' | 'escalation';
  content: string;
  timestamp: string;
}

// Mock data
const mockSwarms: Swarm[] = [
  {
    id: 'swarm-1',
    name: 'Development Team',
    description: 'Full-stack development swarm with code review',
    members: [
      { agentId: 'agent-1', role: 'supervisor', canDelegate: true, canEscalate: true, priority: 1 },
      { agentId: 'agent-2', role: 'worker', canDelegate: false, canEscalate: true, priority: 2 },
      { agentId: 'agent-3', role: 'specialist', canDelegate: false, canEscalate: false, priority: 3 },
    ],
    communicationPattern: 'hierarchical',
    taskDistribution: 'skill_based',
    isActive: true,
    createdAt: new Date(Date.now() - 7 * 24 * 3600000).toISOString(),
    metrics: { tasksCompleted: 47, messagesExchanged: 892, avgResponseTime: 2.3 },
  },
  {
    id: 'swarm-2',
    name: 'Research Squad',
    description: 'Multi-agent research and analysis team',
    members: [
      { agentId: 'agent-2', role: 'supervisor', canDelegate: true, canEscalate: true, priority: 1 },
      { agentId: 'agent-4', role: 'worker', canDelegate: false, canEscalate: true, priority: 2 },
    ],
    communicationPattern: 'direct',
    taskDistribution: 'round_robin',
    isActive: false,
    createdAt: new Date(Date.now() - 3 * 24 * 3600000).toISOString(),
    metrics: { tasksCompleted: 23, messagesExchanged: 456, avgResponseTime: 3.1 },
  },
];

const mockMessages: SwarmMessage[] = [
  {
    id: 'msg-1',
    swarmId: 'swarm-1',
    fromAgentId: 'agent-1',
    type: 'broadcast',
    content: 'New task: Implement user authentication system',
    timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
  },
  {
    id: 'msg-2',
    swarmId: 'swarm-1',
    fromAgentId: 'agent-2',
    toAgentId: 'agent-1',
    type: 'direct',
    content: 'I can handle the backend auth logic',
    timestamp: new Date(Date.now() - 28 * 60000).toISOString(),
  },
  {
    id: 'msg-3',
    swarmId: 'swarm-1',
    fromAgentId: 'agent-3',
    toAgentId: 'agent-1',
    type: 'direct',
    content: 'I will work on the frontend integration',
    timestamp: new Date(Date.now() - 25 * 60000).toISOString(),
  },
  {
    id: 'msg-4',
    swarmId: 'swarm-1',
    fromAgentId: 'agent-1',
    toAgentId: 'agent-2',
    type: 'task',
    content: 'Assigned: Create JWT token generation endpoint',
    timestamp: new Date(Date.now() - 20 * 60000).toISOString(),
  },
];

const roleConfig = {
  supervisor: { label: 'Supervisor', icon: UserCog, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  worker: { label: 'Worker', icon: Zap, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  specialist: { label: 'Specialist', icon: Brain, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  reviewer: { label: 'Reviewer', icon: Eye, color: 'text-amber-400', bg: 'bg-amber-500/10' },
};

export function AgentSwarmPage() {
  const [swarms, setSwarms] = useState<Swarm[]>(mockSwarms);
  const [selectedSwarmId, setSelectedSwarmId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [newSwarmName, setNewSwarmName] = useState('');
  const [newSwarmDescription, setNewSwarmDescription] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  const selectedSwarm = swarms.find(s => s.id === selectedSwarmId);

  // Create new swarm
  const handleCreateSwarm = () => {
    if (!newSwarmName.trim()) return;
    
    const newSwarm: Swarm = {
      id: `swarm-${Date.now()}`,
      name: newSwarmName,
      description: newSwarmDescription,
      members: [],
      communicationPattern: 'direct',
      taskDistribution: 'round_robin',
      isActive: false,
      createdAt: new Date().toISOString(),
      metrics: { tasksCompleted: 0, messagesExchanged: 0, avgResponseTime: 0 },
    };
    
    setSwarms(prev => [...prev, newSwarm]);
    setSelectedSwarmId(newSwarm.id);
    setNewSwarmName('');
    setNewSwarmDescription('');
    setIsCreateDialogOpen(false);
  };

  // Add member to swarm
  const handleAddMember = (agentId: string, role: SwarmMember['role']) => {
    if (!selectedSwarm) return;
    
    const newMember: SwarmMember = {
      agentId,
      role,
      canDelegate: role === 'supervisor',
      canEscalate: true,
      priority: selectedSwarm.members.length + 1,
    };
    
    setSwarms(prev => prev.map(s => 
      s.id === selectedSwarm.id 
        ? { ...s, members: [...s.members, newMember] }
        : s
    ));
    setIsAddMemberDialogOpen(false);
  };

  // Remove member from swarm
  const handleRemoveMember = (agentId: string) => {
    if (!selectedSwarm) return;
    
    setSwarms(prev => prev.map(s => 
      s.id === selectedSwarm.id 
        ? { ...s, members: s.members.filter(m => m.agentId !== agentId) }
        : s
    ));
  };

  // Toggle swarm active state
  const handleToggleSwarm = (swarmId: string) => {
    setSwarms(prev => prev.map(s => 
      s.id === swarmId ? { ...s, isActive: !s.isActive } : s
    ));
  };

  // Delete swarm
  const handleDeleteSwarm = (swarmId: string) => {
    setSwarms(prev => prev.filter(s => s.id !== swarmId));
    if (selectedSwarmId === swarmId) {
      setSelectedSwarmId(null);
    }
  };

  // Get agent info
  const getAgent = (agentId: string) => mockAgents.find(a => a.id === agentId);

  // Get swarm messages
  const swarmMessages = mockMessages.filter(m => m.swarmId === selectedSwarmId);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/30 flex items-center justify-center">
              <Network className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">
                <span className="text-purple-400">Agent</span> Swarm
              </h1>
              <p className="text-xs text-slate-400">Multi-agent orchestration & coordination</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-800/50">
            <Users className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-slate-400">Swarms:</span>
            <span className="text-sm font-semibold text-white">{swarms.length}</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-800/50">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-slate-400">Active:</span>
            <span className="text-sm font-semibold text-white">{swarms.filter(s => s.isActive).length}</span>
          </div>
          <Button 
            onClick={() => setIsCreateDialogOpen(true)}
            className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Swarm
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Swarm list */}
        <div className="w-72 border-r border-slate-800/50 bg-slate-950/30 flex flex-col">
          <div className="p-4 border-b border-slate-800/50">
            <Input
              placeholder="Search swarms..."
              className="bg-slate-900 border-slate-700 text-white"
            />
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {swarms.map(swarm => (
              <button
                key={swarm.id}
                onClick={() => setSelectedSwarmId(swarm.id)}
                className={cn(
                  'w-full p-3 rounded-lg text-left transition-all border',
                  selectedSwarmId === swarm.id
                    ? 'bg-purple-500/10 border-purple-500/30'
                    : 'bg-slate-900/30 border-slate-800/50 hover:border-slate-700'
                )}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className={cn(
                      'font-medium',
                      selectedSwarmId === swarm.id ? 'text-purple-400' : 'text-white'
                    )}>
                      {swarm.name}
                    </p>
                    <p className="text-xs text-slate-500 line-clamp-1">{swarm.description}</p>
                  </div>
                  <div className={cn(
                    'w-2 h-2 rounded-full',
                    swarm.isActive ? 'bg-emerald-500' : 'bg-slate-600'
                  )} />
                </div>
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                  <span>{swarm.members.length} members</span>
                  <span>•</span>
                  <span>{swarm.metrics.tasksCompleted} tasks</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Swarm details */}
        <div className="flex-1 overflow-auto p-6">
          {selectedSwarm ? (
            <div className="space-y-6">
              {/* Swarm header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-white">{selectedSwarm.name}</h2>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        selectedSwarm.isActive 
                          ? 'border-emerald-500/30 text-emerald-400' 
                          : 'border-slate-600 text-slate-400'
                      )}
                    >
                      {selectedSwarm.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <p className="text-slate-400 mt-1">{selectedSwarm.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      selectedSwarm.isActive 
                        ? 'border-orange-500/30 text-orange-400' 
                        : 'border-emerald-500/30 text-emerald-400'
                    )}
                    onClick={() => handleToggleSwarm(selectedSwarm.id)}
                  >
                    {selectedSwarm.isActive ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
                    {selectedSwarm.isActive ? 'Pause' : 'Activate'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-500/30 text-red-400"
                    onClick={() => handleDeleteSwarm(selectedSwarm.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="bg-slate-900/50 border border-slate-800">
                  <TabsTrigger value="overview" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="members" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">
                    Members
                  </TabsTrigger>
                  <TabsTrigger value="messages" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">
                    Messages
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">
                    Settings
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-6">
                  <div className="grid grid-cols-3 gap-6">
                    {/* Metrics */}
                    <div className="holo-card p-6">
                      <h3 className="text-lg font-semibold text-white mb-4">Performance</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Tasks Completed</span>
                          <span className="text-2xl font-bold text-emerald-400">{selectedSwarm.metrics.tasksCompleted}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Messages</span>
                          <span className="text-2xl font-bold text-cyan-400">{selectedSwarm.metrics.messagesExchanged}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Avg Response</span>
                          <span className="text-2xl font-bold text-purple-400">{selectedSwarm.metrics.avgResponseTime}s</span>
                        </div>
                      </div>
                    </div>

                    {/* Configuration */}
                    <div className="holo-card p-6">
                      <h3 className="text-lg font-semibold text-white mb-4">Configuration</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Communication</span>
                          <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 capitalize">
                            {selectedSwarm.communicationPattern}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Distribution</span>
                          <Badge variant="outline" className="border-purple-500/30 text-purple-400 capitalize">
                            {selectedSwarm.taskDistribution}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Created</span>
                          <span className="text-slate-300">{new Date(selectedSwarm.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Member roles */}
                    <div className="holo-card p-6">
                      <h3 className="text-lg font-semibold text-white mb-4">Role Distribution</h3>
                      <div className="space-y-3">
                        {['supervisor', 'worker', 'specialist', 'reviewer'].map(role => {
                          const count = selectedSwarm.members.filter(m => m.role === role).length;
                          if (count === 0) return null;
                          const config = roleConfig[role as keyof typeof roleConfig];
                          const Icon = config.icon;
                          return (
                            <div key={role} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Icon className={cn('w-4 h-4', config.color)} />
                                <span className="text-slate-300 capitalize">{config.label}</span>
                              </div>
                              <span className="font-bold text-white">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Message flow visualization placeholder */}
                  <div className="holo-card p-6 mt-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Message Flow</h3>
                    <div className="h-48 flex items-center justify-center bg-slate-900/50 rounded-lg border border-slate-800 border-dashed">
                      <p className="text-slate-500">Message flow visualization coming soon</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="members" className="mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Swarm Members</h3>
                    <Button
                      onClick={() => setIsAddMemberDialogOpen(true)}
                      className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Member
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {selectedSwarm.members.map(member => {
                      const agent = getAgent(member.agentId);
                      const config = roleConfig[member.role];
                      const Icon = config.icon;
                      
                      return (
                        <div key={member.agentId} className="holo-card p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-3xl">{agent?.emoji}</span>
                              <div>
                                <p className="font-medium text-white">{agent?.name}</p>
                                <p className="text-xs text-slate-500">{agent?.role}</p>
                              </div>
                            </div>
                            <div className={cn('px-2 py-1 rounded flex items-center gap-1', config.bg)}>
                              <Icon className={cn('w-3 h-3', config.color)} />
                              <span className={cn('text-xs capitalize', config.color)}>{config.label}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 mt-4 text-xs">
                            <div className="flex items-center gap-1">
                              <span className="text-slate-500">Priority:</span>
                              <span className="text-white">{member.priority}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-slate-500">Delegate:</span>
                              <span className={member.canDelegate ? 'text-emerald-400' : 'text-slate-600'}>
                                {member.canDelegate ? 'Yes' : 'No'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-slate-500">Escalate:</span>
                              <span className={member.canEscalate ? 'text-emerald-400' : 'text-slate-600'}>
                                {member.canEscalate ? 'Yes' : 'No'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 mt-4">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 border-slate-700 text-slate-300"
                            >
                              <Settings className="w-3 h-3 mr-1" />
                              Configure
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-red-500/30 text-red-400"
                              onClick={() => handleRemoveMember(member.agentId)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </TabsContent>

                <TabsContent value="messages" className="mt-6">
                  <div className="holo-card p-4">
                    <div className="space-y-3 max-h-[500px] overflow-y-auto">
                      {swarmMessages.map(message => {
                        const fromAgent = getAgent(message.fromAgentId);
                        const toAgent = message.toAgentId ? getAgent(message.toAgentId) : null;
                        
                        return (
                          <div key={message.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/50">
                            <span className="text-xl">{fromAgent?.emoji}</span>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-white">{fromAgent?.name}</span>
                                {toAgent && (
                                  <>
                                    <ArrowRight className="w-3 h-3 text-slate-500" />
                                    <span className="text-slate-400">{toAgent.name}</span>
                                  </>
                                )}
                                <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-400 capitalize">
                                  {message.type}
                                </Badge>
                              </div>
                              <p className="text-slate-300 text-sm">{message.content}</p>
                              <p className="text-xs text-slate-600 mt-1">
                                {new Date(message.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      {swarmMessages.length === 0 && (
                        <p className="text-center text-slate-500 py-8">No messages yet</p>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="settings" className="mt-6">
                  <div className="holo-card p-6 max-w-2xl">
                    <h3 className="text-lg font-semibold text-white mb-4">Swarm Settings</h3>
                    
                    <div className="space-y-6">
                      <div>
                        <label className="text-sm text-slate-400 mb-2 block">Communication Pattern</label>
                        <Select value={selectedSwarm.communicationPattern}>
                          <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-slate-700">
                            <SelectItem value="direct">Direct (Agent to Agent)</SelectItem>
                            <SelectItem value="broadcast">Broadcast (Supervisor to All)</SelectItem>
                            <SelectItem value="hierarchical">Hierarchical (Top-down)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm text-slate-400 mb-2 block">Task Distribution</label>
                        <Select value={selectedSwarm.taskDistribution}>
                          <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-slate-700">
                            <SelectItem value="round_robin">Round Robin</SelectItem>
                            <SelectItem value="load_balanced">Load Balanced</SelectItem>
                            <SelectItem value="skill_based">Skill Based</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50">
                        <div>
                          <p className="text-sm text-slate-300">Auto-escalation</p>
                          <p className="text-xs text-slate-500">Escalate failed tasks to supervisor</p>
                        </div>
                        <Switch defaultChecked />
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50">
                        <div>
                          <p className="text-sm text-slate-300">Conflict Detection</p>
                          <p className="text-xs text-slate-500">Detect and resolve agent conflicts</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Network className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                <p className="text-slate-500">Select a swarm or create a new one</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Swarm Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="bg-slate-950 border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-white">Create New Swarm</DialogTitle>
            <DialogDescription className="text-slate-400">
              Create a coordinated group of agents
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Swarm Name</label>
              <Input
                value={newSwarmName}
                onChange={(e) => setNewSwarmName(e.target.value)}
                placeholder="e.g., Development Team"
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Description</label>
              <Input
                value={newSwarmDescription}
                onChange={(e) => setNewSwarmDescription(e.target.value)}
                placeholder="What does this swarm do?"
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="border-slate-700 text-slate-300">
              Cancel
            </Button>
            <Button 
              onClick={handleCreateSwarm}
              className="bg-purple-500 hover:bg-purple-600 text-white"
              disabled={!newSwarmName.trim()}
            >
              Create Swarm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={isAddMemberDialogOpen} onOpenChange={setIsAddMemberDialogOpen}>
        <DialogContent className="bg-slate-950 border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-white">Add Member to Swarm</DialogTitle>
            <DialogDescription className="text-slate-400">
              Select an agent and assign a role
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Select Agent</label>
              <div className="space-y-2">
                {mockAgents.filter(a => !selectedSwarm?.members.some(m => m.agentId === a.id)).map(agent => (
                  <button
                    key={agent.id}
                    onClick={() => handleAddMember(agent.id, 'worker')}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-900/50 hover:bg-slate-800/50 transition-colors text-left"
                  >
                    <span className="text-2xl">{agent.emoji}</span>
                    <div>
                      <p className="font-medium text-white">{agent.name}</p>
                      <p className="text-xs text-slate-400">{agent.role}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AgentSwarmPage;
