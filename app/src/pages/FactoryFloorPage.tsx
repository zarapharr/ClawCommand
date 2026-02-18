import { useState, useEffect } from 'react';
import type { Agent, ActivityEvent } from '@/types';
import { AgentStation } from '@/components/factory-floor/AgentStation';
import { ConnectionLines } from '@/components/factory-floor/ConnectionLines';
import { InfoPanel } from '@/components/factory-floor/InfoPanel';
import { ActivityFeed } from '@/components/factory-floor/ActivityFeed';
import { SystemGauges } from '@/components/factory-floor/SystemGauges';
import { mockAgents, mockConnections, mockActivityFeed, mockSystemMetrics } from '@/data/mock-data';
import { cn } from '@/lib/utils';
import { 
  Factory, Users, Zap, ChevronDown, Settings,
  Briefcase, Wheat, Stethoscope, ChefHat, Store, Plus, Save
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

// Environment profiles
interface EnvironmentProfile {
  id: string;
  name: string;
  icon: typeof Factory;
  description: string;
  theme: {
    bgColor: string;
    borderColor: string;
    accentColor: string;
  };
}

const environmentProfiles: EnvironmentProfile[] = [
  { 
    id: 'office', 
    name: 'Tech Office', 
    icon: Briefcase, 
    description: 'Modern tech workspace with desks and collaboration areas',
    theme: { bgColor: 'bg-slate-900/30', borderColor: 'border-slate-800/50', accentColor: 'text-cyan-400' }
  },
  { 
    id: 'factory', 
    name: 'Factory Floor', 
    icon: Factory, 
    description: 'Industrial manufacturing floor with workstations',
    theme: { bgColor: 'bg-amber-950/30', borderColor: 'border-amber-800/50', accentColor: 'text-amber-400' }
  },
  { 
    id: 'farm', 
    name: 'Smart Farm', 
    icon: Wheat, 
    description: 'Agricultural monitoring and automation center',
    theme: { bgColor: 'bg-emerald-950/30', borderColor: 'border-emerald-800/50', accentColor: 'text-emerald-400' }
  },
  { 
    id: 'medical', 
    name: 'Medical Center', 
    icon: Stethoscope, 
    description: 'Healthcare facility with patient monitoring stations',
    theme: { bgColor: 'bg-rose-950/30', borderColor: 'border-rose-800/50', accentColor: 'text-rose-400' }
  },
  { 
    id: 'bakery', 
    name: 'Bakery Shop', 
    icon: ChefHat, 
    description: 'Culinary production and order management',
    theme: { bgColor: 'bg-orange-950/30', borderColor: 'border-orange-800/50', accentColor: 'text-orange-400' }
  },
  { 
    id: 'retail', 
    name: 'Retail Store', 
    icon: Store, 
    description: 'Customer service and inventory management',
    theme: { bgColor: 'bg-purple-950/30', borderColor: 'border-purple-800/50', accentColor: 'text-purple-400' }
  },
];

// Company/Multi-tenant support
interface Company {
  id: string;
  name: string;
  emoji: string;
  color: string;
  agentCount: number;
}

const mockCompanies: Company[] = [
  { id: 'comp-1', name: 'Acme Corp', emoji: '🏢', color: 'bg-cyan-500', agentCount: 4 },
  { id: 'comp-2', name: 'TechStart Inc', emoji: '🚀', color: 'bg-purple-500', agentCount: 3 },
  { id: 'comp-3', name: 'GreenFields Ag', emoji: '🌾', color: 'bg-emerald-500', agentCount: 2 },
];

export function FactoryFloorPage() {
  const [agents, setAgents] = useState<Agent[]>(mockAgents);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [activities, setActivities] = useState<ActivityEvent[]>(mockActivityFeed);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentProfile, setCurrentProfile] = useState<EnvironmentProfile>(environmentProfiles[0]);
  const [currentCompany, setCurrentCompany] = useState<Company>(mockCompanies[0]);
  const [isAgentConfigOpen, setIsAgentConfigOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const randomAgent = agents[Math.floor(Math.random() * agents.length)];
      if (randomAgent.status !== 'offline') {
        const newActivity: ActivityEvent = {
          id: `a-${Date.now()}`,
          agentId: randomAgent.id,
          agentName: randomAgent.name,
          agentEmoji: randomAgent.emoji,
          type: Math.random() > 0.7 ? 'message' : 'task_start',
          message: `Processing task ${Math.floor(Math.random() * 100)}`,
          timestamp: new Date().toISOString(),
        };
        setActivities(prev => [newActivity, ...prev].slice(0, 20));
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [agents]);

  const handleAgentClick = (agent: Agent) => {
    setSelectedAgent(selectedAgent?.id === agent.id ? null : agent);
  };

  const handleAgentDoubleClick = (agent: Agent) => {
    setEditingAgent(agent);
    setIsAgentConfigOpen(true);
  };

  const handleSaveAgentConfig = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    if (editingAgent) {
      setAgents(prev => prev.map(a => {
        if (a.id === editingAgent.id) {
          return {
            ...a,
            name: formData.get('name') as string,
            emoji: formData.get('emoji') as string,
            role: formData.get('role') as string,
            description: formData.get('description') as string,
            model: {
              ...a.model,
              provider: formData.get('modelProvider') as string,
              model: formData.get('modelName') as string,
            },
          };
        }
        return a;
      }));
    }
    setIsAgentConfigOpen(false);
    setEditingAgent(null);
  };

  const onlineAgents = agents.filter(a => a.status !== 'offline').length;
  const workingAgents = agents.filter(a => a.status === 'working').length;
  const totalTokens = agents.reduce((sum, a) => sum + (a.metrics?.tokensUsed || 0), 0);

  const ProfileIcon = currentProfile.icon;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center border',
              currentProfile.theme.bgColor,
              currentProfile.theme.borderColor
            )}>
              <ProfileIcon className={cn('w-5 h-5', currentProfile.theme.accentColor)} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white">
                  <span className={currentProfile.theme.accentColor}>{currentProfile.name}</span>
                </h1>
                <Select value={currentProfile.id} onValueChange={(id) => {
                  const profile = environmentProfiles.find(p => p.id === id);
                  if (profile) setCurrentProfile(profile);
                }}>
                  <SelectTrigger className="w-8 h-8 p-0 border-0 bg-transparent hover:bg-slate-800/50 rounded">
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    {environmentProfiles.map(profile => {
                      const Icon = profile.icon;
                      return (
                        <SelectItem key={profile.id} value={profile.id} className="text-white">
                          <div className="flex items-center gap-2">
                            <Icon className={cn('w-4 h-4', profile.theme.accentColor)} />
                            {profile.name}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-slate-400">Real-time Agent Mission Control</p>
            </div>
          </div>

          {/* Company Selector */}
          <div className="h-8 w-px bg-slate-800 mx-2" />
          <div className="flex items-center gap-2">
            <span className="text-lg">{currentCompany.emoji}</span>
            <Select value={currentCompany.id} onValueChange={(id) => {
              const company = mockCompanies.find(c => c.id === id);
              if (company) setCurrentCompany(company);
            }}>
              <SelectTrigger className="w-40 bg-slate-900 border-slate-700 text-white text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                {mockCompanies.map(company => (
                  <SelectItem key={company.id} value={company.id} className="text-white">
                    <div className="flex items-center gap-2">
                      <span>{company.emoji}</span>
                      {company.name}
                    </div>
                  </SelectItem>
                ))}
                <SelectItem value="new" className="text-cyan-400">
                  <div className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Add Company
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-800/50">
            <Users className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-slate-400">Agents:</span>
            <span className="text-sm font-semibold text-white">{onlineAgents}/{agents.length}</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-800/50">
            <Zap className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-slate-400">Working:</span>
            <span className="text-sm font-semibold text-white">{workingAgents}</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-800/50">
            <span className="text-sm text-slate-400">Tokens:</span>
            <span className="text-sm font-semibold text-white">{(totalTokens / 1000).toFixed(1)}K</span>
          </div>
          <div className="text-right">
            <p className="text-sm font-mono text-cyan-400">
              {currentTime.toLocaleTimeString('en-US', { hour12: false })}
            </p>
            <p className="text-[10px] text-slate-500">
              {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Factory floor visualization */}
        <div className="flex-1 relative p-6">
          <div className={cn(
            'relative w-full h-full rounded-2xl border overflow-hidden tron-grid',
            currentProfile.theme.bgColor,
            currentProfile.theme.borderColor
          )}>
            <ConnectionLines 
              agents={agents} 
              connections={mockConnections}
              selectedAgentId={selectedAgent?.id}
            />
            
            {agents.map((agent) => (
              <AgentStation
                key={agent.id}
                agent={agent}
                isSelected={selectedAgent?.id === agent.id}
                onClick={() => handleAgentClick(agent)}
                onDoubleClick={() => handleAgentDoubleClick(agent)}
              />
            ))}

            {/* Legend */}
            <div className="absolute bottom-4 left-4 p-3 rounded-lg bg-slate-950/90 backdrop-blur-sm border border-slate-800/50">
              <p className="text-xs text-slate-400 mb-2">Status Legend</p>
              <div className="space-y-1.5">
                {[
                  { status: 'online', label: 'Online', color: 'bg-emerald-500' },
                  { status: 'working', label: 'Working', color: 'bg-cyan-400' },
                  { status: 'thinking', label: 'Thinking', color: 'bg-purple-500' },
                  { status: 'idle', label: 'Idle', color: 'bg-blue-500 opacity-60' },
                  { status: 'error', label: 'Error', color: 'bg-red-500' },
                ].map(({ status, label, color }) => (
                  <div key={status} className="flex items-center gap-2">
                    <div className={cn('w-2 h-2 rounded-full', color)} />
                    <span className="text-[10px] text-slate-300">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Connection activity legend */}
            <div className="absolute bottom-4 right-4 p-3 rounded-lg bg-slate-950/90 backdrop-blur-sm border border-slate-800/50">
              <p className="text-xs text-slate-400 mb-2">Connection Activity</p>
              <div className="space-y-1.5">
                {[
                  { activity: 'High', color: 'bg-cyan-400' },
                  { activity: 'Medium', color: 'bg-purple-500' },
                  { activity: 'Low', color: 'bg-slate-500' },
                ].map(({ activity, color }) => (
                  <div key={activity} className="flex items-center gap-2">
                    <div className={cn('w-4 h-0.5', color)} />
                    <span className="text-[10px] text-slate-300">{activity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Double-click hint */}
            <div className="absolute top-4 left-4 px-3 py-1.5 rounded-lg bg-slate-950/80 backdrop-blur-sm border border-slate-800/50">
              <p className="text-[10px] text-slate-400">
                <span className="text-cyan-400">Click</span> to select • 
                <span className="text-cyan-400"> Double-click</span> to configure
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 p-6 pr-4 flex flex-col gap-4 border-l border-slate-800/50 bg-slate-950/50 backdrop-blur-sm">
          <SystemGauges metrics={mockSystemMetrics} />
          <div className="flex-1 min-h-0">
            <ActivityFeed activities={activities} />
          </div>
        </div>
      </div>

      {/* Info panel */}
      <InfoPanel agent={selectedAgent} onClose={() => setSelectedAgent(null)} />

      {/* Agent Configuration Dialog */}
      <Dialog open={isAgentConfigOpen} onOpenChange={setIsAgentConfigOpen}>
        <DialogContent className="bg-slate-950 border-slate-800 max-w-3xl max-h-[85vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-cyan-400" />
              Configure Agent: {editingAgent?.name}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Edit agent identity, model, tools, skills, budget, and routing
            </DialogDescription>
          </DialogHeader>
          
          {editingAgent && (
            <form onSubmit={handleSaveAgentConfig}>
              <Tabs defaultValue="identity" className="w-full">
                <TabsList className="grid grid-cols-6 bg-slate-900/50 border border-slate-800 mb-4">
                  <TabsTrigger value="identity" className="text-xs data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">Identity</TabsTrigger>
                  <TabsTrigger value="model" className="text-xs data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">Model</TabsTrigger>
                  <TabsTrigger value="tools" className="text-xs data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">Tools</TabsTrigger>
                  <TabsTrigger value="skills" className="text-xs data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">Skills</TabsTrigger>
                  <TabsTrigger value="budget" className="text-xs data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">Budget</TabsTrigger>
                  <TabsTrigger value="routing" className="text-xs data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">Routing</TabsTrigger>
                </TabsList>

                {/* Identity Tab */}
                <TabsContent value="identity" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-slate-400 mb-1 block">Name</label>
                      <Input 
                        name="name"
                        defaultValue={editingAgent.name}
                        className="bg-slate-900 border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-400 mb-1 block">Emoji</label>
                      <Input 
                        name="emoji"
                        defaultValue={editingAgent.emoji}
                        className="bg-slate-900 border-slate-700 text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 mb-1 block">Role</label>
                    <Select name="role" defaultValue={editingAgent.role}>
                      <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-700">
                        <SelectItem value="Coordinator">Coordinator</SelectItem>
                        <SelectItem value="Developer">Developer</SelectItem>
                        <SelectItem value="Researcher">Researcher</SelectItem>
                        <SelectItem value="Writer">Writer</SelectItem>
                        <SelectItem value="Analyst">Analyst</SelectItem>
                        <SelectItem value="Support">Support</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 mb-1 block">Description</label>
                    <textarea 
                      name="description"
                      defaultValue={editingAgent.description}
                      rows={3}
                      className="w-full px-3 py-2 rounded-md bg-slate-900 border border-slate-700 text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 mb-1 block">Working Directory</label>
                    <Input 
                      name="workspace"
                      defaultValue="/workspace"
                      placeholder="/path/to/workspace"
                      className="bg-slate-900 border-slate-700 text-white"
                    />
                  </div>
                </TabsContent>

                {/* Model Tab */}
                <TabsContent value="model" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-slate-400 mb-1 block">Provider</label>
                      <Select name="modelProvider" defaultValue={editingAgent.model.provider}>
                        <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-700">
                          <SelectItem value="openai">OpenAI</SelectItem>
                          <SelectItem value="anthropic">Anthropic</SelectItem>
                          <SelectItem value="groq">Groq</SelectItem>
                          <SelectItem value="google">Google AI</SelectItem>
                          <SelectItem value="ollama">Ollama (Local)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm text-slate-400 mb-1 block">Model</label>
                      <Select name="modelName" defaultValue={editingAgent.model.model}>
                        <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-700">
                          <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                          <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                          <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                          <SelectItem value="claude-3-5-sonnet">Claude 3.5 Sonnet</SelectItem>
                          <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                          <SelectItem value="claude-3-haiku">Claude 3 Haiku</SelectItem>
                          <SelectItem value="llama-3.1-70b">Llama 3.1 70B</SelectItem>
                          <SelectItem value="llama-3.1-8b">Llama 3.1 8B</SelectItem>
                          <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm text-slate-400 mb-1 block">Temperature</label>
                      <Input 
                        type="number"
                        step="0.1"
                        min="0"
                        max="2"
                        defaultValue={editingAgent.model.temperature}
                        className="bg-slate-900 border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-400 mb-1 block">Max Tokens</label>
                      <Input 
                        type="number"
                        defaultValue={editingAgent.model.maxTokens}
                        className="bg-slate-900 border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-400 mb-1 block">Top P</label>
                      <Input 
                        type="number"
                        step="0.1"
                        min="0"
                        max="1"
                        defaultValue={1}
                        className="bg-slate-900 border-slate-700 text-white"
                      />
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-800">
                    <h4 className="text-sm font-medium text-slate-400 mb-3">Model Capabilities</h4>
                    <div className="flex flex-wrap gap-2">
                      {['Function Calling', 'Vision', 'JSON Mode', 'Code', 'Reasoning'].map(cap => (
                        <Badge key={cap} variant="outline" className="border-slate-600 text-slate-400">
                          {cap}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* Tools Tab */}
                <TabsContent value="tools" className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50">
                    <div>
                      <p className="text-sm text-slate-300">Tool Profile</p>
                      <p className="text-xs text-slate-500">Base set of allowed tools</p>
                    </div>
                    <Select defaultValue="coding">
                      <SelectTrigger className="w-40 bg-slate-900 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-700">
                        <SelectItem value="minimal">Minimal</SelectItem>
                        <SelectItem value="coding">Coding</SelectItem>
                        <SelectItem value="messaging">Messaging</SelectItem>
                        <SelectItem value="full">Full Access</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-slate-400">Individual Tools</h4>
                    {[
                      { id: 'web_search', name: 'Web Search', desc: 'Search the internet' },
                      { id: 'web_fetch', name: 'Web Fetch', desc: 'Fetch webpage content' },
                      { id: 'browser', name: 'Browser', desc: 'Control browser automation' },
                      { id: 'file_read', name: 'File Read', desc: 'Read files from workspace' },
                      { id: 'file_write', name: 'File Write', desc: 'Write files to workspace' },
                      { id: 'apply_patch', name: 'Apply Patch', desc: 'Apply code patches' },
                      { id: 'exec', name: 'Execute Command', desc: 'Run shell commands' },
                      { id: 'process', name: 'Process Manager', desc: 'Manage background processes' },
                      { id: 'database', name: 'Database Query', desc: 'Execute SQL queries' },
                      { id: 'email', name: 'Email Sender', desc: 'Send emails via SMTP' },
                      { id: 'image', name: 'Image Generation', desc: 'Generate images' },
                      { id: 'cron', name: 'Cron Jobs', desc: 'Schedule recurring tasks' },
                    ].map(tool => (
                      <div key={tool.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50">
                        <div>
                          <p className="text-sm text-slate-300">{tool.name}</p>
                          <p className="text-xs text-slate-500">{tool.desc}</p>
                        </div>
                        <Switch defaultChecked={editingAgent.tools.allow.includes(tool.id)} />
                      </div>
                    ))}
                  </div>
                </TabsContent>

                {/* Skills Tab */}
                <TabsContent value="skills" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-slate-400">Assigned Skills</h4>
                    <Button size="sm" variant="outline" className="border-cyan-500/30 text-cyan-400">
                      <Plus className="w-4 h-4 mr-1" />
                      Add Skill
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    {[
                      { id: 'web-search', name: 'Web Search', version: '1.2.0', enabled: true },
                      { id: 'file-ops', name: 'File Operations', version: '1.0.0', enabled: true },
                      { id: 'code-review', name: 'Code Review', version: '0.9.0', enabled: false },
                      { id: 'telegram-bot', name: 'Telegram Bot', version: '2.0.1', enabled: true },
                    ].map(skill => (
                      <div key={skill.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-800">
                        <div className="flex items-center gap-3">
                          <Switch defaultChecked={skill.enabled} />
                          <div>
                            <p className="text-sm text-slate-300">{skill.name}</p>
                            <p className="text-xs text-slate-500">v{skill.version}</p>
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                          <Settings className="w-4 h-4 text-slate-400" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-800">
                    <h4 className="text-sm font-medium text-slate-400 mb-3">Bootstrap Files</h4>
                    <div className="space-y-2">
                      <div>
                        <label className="text-xs text-slate-500">AGENTS.md</label>
                        <Input 
                          defaultValue="/workspace/AGENTS.md"
                          className="bg-slate-800 border-slate-700 text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500">SOUL.md</label>
                        <Input 
                          defaultValue="/workspace/SOUL.md"
                          className="bg-slate-800 border-slate-700 text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500">TOOLS.md</label>
                        <Input 
                          defaultValue="/workspace/TOOLS.md"
                          className="bg-slate-800 border-slate-700 text-white text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Budget Tab */}
                <TabsContent value="budget" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-slate-400 mb-1 block">Monthly Budget (USD)</label>
                      <Input 
                        type="number"
                        defaultValue={100}
                        className="bg-slate-900 border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-400 mb-1 block">Alert Threshold (%)</label>
                      <Input 
                        type="number"
                        defaultValue={80}
                        min={50}
                        max={100}
                        className="bg-slate-900 border-slate-700 text-white"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50">
                    <div>
                      <p className="text-sm text-slate-300">Hard Limit</p>
                      <p className="text-xs text-slate-500">Stop agent when budget exceeded</p>
                    </div>
                    <Switch />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50">
                    <div>
                      <p className="text-sm text-slate-300">Enable Rollover</p>
                      <p className="text-xs text-slate-500">Unused budget carries to next month</p>
                    </div>
                    <Switch />
                  </div>
                  
                  <div>
                    <label className="text-sm text-slate-400 mb-1 block">Action on Budget Exceeded</label>
                    <Select defaultValue="notify">
                      <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-700">
                        <SelectItem value="pause">⏸️ Pause Agent</SelectItem>
                        <SelectItem value="downgrade">⬇️ Downgrade Model</SelectItem>
                        <SelectItem value="notify">🔔 Send Notification</SelectItem>
                        <SelectItem value="escalate">⬆️ Escalate to Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-800">
                    <h4 className="text-sm font-medium text-slate-400 mb-3">Current Usage</h4>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-white">{(editingAgent.metrics.tokensUsed / 1000).toFixed(1)}K</p>
                        <p className="text-xs text-slate-500">Total Tokens</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white">{editingAgent.metrics.messagesToday}</p>
                        <p className="text-xs text-slate-500">Messages Today</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-emerald-400">${(editingAgent.metrics.tokensUsed * 0.00001).toFixed(2)}</p>
                        <p className="text-xs text-slate-500">Est. Cost</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Routing Tab */}
                <TabsContent value="routing" className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm text-slate-400 mb-1 block">Primary Model</label>
                      <Select defaultValue={editingAgent.model.model}>
                        <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-700">
                          <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                          <SelectItem value="claude-3-5-sonnet">Claude 3.5 Sonnet</SelectItem>
                          <SelectItem value="llama-3.1-70b">Llama 3.1 70B</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm text-slate-400 mb-1 block">Fallback Model</label>
                      <Select defaultValue="gpt-4o-mini">
                        <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-700">
                          <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                          <SelectItem value="claude-3-haiku">Claude 3 Haiku</SelectItem>
                          <SelectItem value="llama-3.1-8b">Llama 3.1 8B</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm text-slate-400 mb-1 block">Escalation Model</label>
                      <Select defaultValue="claude-3-opus">
                        <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-700">
                          <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                          <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                          <SelectItem value="llama-3.1-70b">Llama 3.1 70B</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50">
                    <div>
                      <p className="text-sm text-slate-300">Cost Optimization</p>
                      <p className="text-xs text-slate-500">Prefer cheaper models when confidence is high</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div>
                    <label className="text-sm text-slate-400 mb-1 block">Max Cost Per Request (USD)</label>
                    <Input 
                      type="number"
                      step="0.01"
                      defaultValue={0.5}
                      className="bg-slate-900 border-slate-700 text-white"
                    />
                  </div>
                  
                  <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-800">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-slate-400">Routing Rules</h4>
                      <Button size="sm" variant="outline" className="border-cyan-500/30 text-cyan-400">
                        <Plus className="w-4 h-4 mr-1" />
                        Add Rule
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <div className="p-3 rounded bg-slate-800/50 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-300">If task contains &quot;code&quot; or &quot;programming&quot;</span>
                          <Badge variant="outline" className="border-cyan-500/30 text-cyan-400">Use GPT-4o</Badge>
                        </div>
                      </div>
                      <div className="p-3 rounded bg-slate-800/50 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-300">If task contains &quot;research&quot; or &quot;analyze&quot;</span>
                          <Badge variant="outline" className="border-purple-500/30 text-purple-400">Use Claude 3.5</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <DialogFooter className="mt-6 pt-4 border-t border-slate-800">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAgentConfigOpen(false)}
                  className="border-slate-700 text-slate-300"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="bg-cyan-500 hover:bg-cyan-600 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default FactoryFloorPage;
