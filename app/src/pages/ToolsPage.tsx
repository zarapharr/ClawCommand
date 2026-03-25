import { useState } from 'react';
import { 
  Terminal, Wrench, CheckCircle2, Settings, 
  Search, Filter, Plus,
  Globe, Database, FileText, Mail, MessageSquare, Calendar,
  Code, Image, Music, Video, Lock, Shield, Zap, Cpu,
  ChevronDown, ChevronUp, Save
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
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


// Types
interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  isEnabled: boolean;
  isBuiltIn: boolean;
  version: string;
  author: string;
  config: Record<string, ToolConfigField>;
  permissions: string[];
  rateLimit?: {
    requestsPerMinute: number;
    requestsPerHour: number;
  };
  agents: string[]; // Agent IDs that have access
}

interface ToolConfigField {
  type: 'string' | 'number' | 'boolean' | 'select' | 'password' | 'textarea';
  label: string;
  value: string | number | boolean;
  options?: string[];
  required: boolean;
  description?: string;
  placeholder?: string;
}

// Tool categories with icons
const categoryIcons: Record<string, typeof Globe> = {
  web: Globe,
  database: Database,
  document: FileText,
  communication: Mail,
  messaging: MessageSquare,
  calendar: Calendar,
  development: Code,
  media: Image,
  audio: Music,
  video: Video,
  security: Lock,
  authentication: Shield,
  automation: Zap,
  system: Cpu,
};

const categoryColors: Record<string, { bg: string; border: string; text: string }> = {
  web: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400' },
  database: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400' },
  document: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400' },
  communication: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400' },
  messaging: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-400' },
  calendar: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400' },
  development: { bg: 'bg-pink-500/10', border: 'border-pink-500/30', text: 'text-pink-400' },
  media: { bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', text: 'text-indigo-400' },
  audio: { bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-400' },
  video: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400' },
  security: { bg: 'bg-slate-500/10', border: 'border-slate-500/30', text: 'text-slate-400' },
  authentication: { bg: 'bg-teal-500/10', border: 'border-teal-500/30', text: 'text-teal-400' },
  automation: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400' },
  system: { bg: 'bg-gray-500/10', border: 'border-gray-500/30', text: 'text-gray-400' },
};

// Mock tools data
const mockTools: Tool[] = [
  {
    id: 'web-search',
    name: 'Web Search',
    description: 'Search the web for information using various search engines',
    category: 'web',
    icon: 'web',
    isEnabled: true,
    isBuiltIn: true,
    version: '1.2.0',
    author: 'OpenClaw',
    config: {
      engine: { type: 'select', label: 'Search Engine', value: 'google', options: ['google', 'bing', 'duckduckgo'], required: true, description: 'Default search engine' },
      safeSearch: { type: 'boolean', label: 'Safe Search', value: true, required: false, description: 'Filter adult content' },
      maxResults: { type: 'number', label: 'Max Results', value: 10, required: true, description: 'Maximum results per search' },
    },
    permissions: ['web_access'],
    rateLimit: { requestsPerMinute: 30, requestsPerHour: 500 },
    agents: ['agent-1', 'agent-2', 'agent-3'],
  },
  {
    id: 'telegram-bot',
    name: 'Telegram Bot',
    description: 'Send and receive messages via Telegram Bot API',
    category: 'messaging',
    icon: 'messaging',
    isEnabled: true,
    isBuiltIn: true,
    version: '2.0.1',
    author: 'OpenClaw',
    config: {
      botToken: { type: 'password', label: 'Bot Token', value: '***hidden***', required: true, description: 'Telegram Bot Token from @BotFather' },
      webhookUrl: { type: 'string', label: 'Webhook URL', value: '', required: false, description: 'Optional webhook URL' },
      parseMode: { type: 'select', label: 'Parse Mode', value: 'Markdown', options: ['Markdown', 'HTML', 'None'], required: true },
    },
    permissions: ['messaging', 'web_access'],
    agents: ['agent-1'],
  },
  {
    id: 'qmd-research',
    name: 'QMD Research',
    description: 'Advanced research capabilities with QMD integration',
    category: 'web',
    icon: 'web',
    isEnabled: false,
    isBuiltIn: false,
    version: '1.0.0',
    author: 'Community',
    config: {
      apiKey: { type: 'password', label: 'QMD API Key', value: '', required: true },
      endpoint: { type: 'string', label: 'API Endpoint', value: 'https://api.qmd.io/v1', required: true },
      timeout: { type: 'number', label: 'Timeout (seconds)', value: 30, required: true },
    },
    permissions: ['web_access', 'external_api'],
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 100 },
    agents: [],
  },
  {
    id: 'database-query',
    name: 'Database Query',
    description: 'Execute SQL queries against connected databases',
    category: 'database',
    icon: 'database',
    isEnabled: true,
    isBuiltIn: true,
    version: '1.5.0',
    author: 'OpenClaw',
    config: {
      defaultConnection: { type: 'select', label: 'Default Connection', value: 'postgresql', options: ['postgresql', 'mysql', 'sqlite'], required: true },
      readOnly: { type: 'boolean', label: 'Read Only Mode', value: true, required: true, description: 'Prevent write operations' },
      maxRows: { type: 'number', label: 'Max Rows', value: 1000, required: true },
    },
    permissions: ['database_access'],
    agents: ['agent-2', 'agent-4'],
  },
  {
    id: 'file-operations',
    name: 'File Operations',
    description: 'Read, write, and manage files in the workspace',
    category: 'document',
    icon: 'document',
    isEnabled: true,
    isBuiltIn: true,
    version: '1.0.0',
    author: 'OpenClaw',
    config: {
      allowedPaths: { type: 'textarea', label: 'Allowed Paths', value: '/workspace\n/tmp', required: true, description: 'One path per line' },
      maxFileSize: { type: 'number', label: 'Max File Size (MB)', value: 10, required: true },
      allowDelete: { type: 'boolean', label: 'Allow Delete', value: false, required: true },
    },
    permissions: ['file_system'],
    agents: ['agent-1', 'agent-2', 'agent-3', 'agent-4'],
  },
  {
    id: 'email-sender',
    name: 'Email Sender',
    description: 'Send emails via SMTP',
    category: 'communication',
    icon: 'communication',
    isEnabled: false,
    isBuiltIn: true,
    version: '1.1.0',
    author: 'OpenClaw',
    config: {
      smtpHost: { type: 'string', label: 'SMTP Host', value: '', required: true, placeholder: 'smtp.gmail.com' },
      smtpPort: { type: 'number', label: 'SMTP Port', value: 587, required: true },
      username: { type: 'string', label: 'Username', value: '', required: true },
      password: { type: 'password', label: 'Password', value: '', required: true },
      useTLS: { type: 'boolean', label: 'Use TLS', value: true, required: true },
    },
    permissions: ['email_access'],
    agents: [],
  },
  {
    id: 'calendar-api',
    name: 'Calendar API',
    description: 'Manage calendar events and schedules',
    category: 'calendar',
    icon: 'calendar',
    isEnabled: true,
    isBuiltIn: false,
    version: '0.9.0',
    author: 'Community',
    config: {
      provider: { type: 'select', label: 'Provider', value: 'google', options: ['google', 'outlook', 'apple'], required: true },
      clientId: { type: 'string', label: 'Client ID', value: '', required: true },
      clientSecret: { type: 'password', label: 'Client Secret', value: '', required: true },
      syncInterval: { type: 'number', label: 'Sync Interval (minutes)', value: 15, required: true },
    },
    permissions: ['calendar_access', 'external_api'],
    agents: ['agent-3'],
  },
  {
    id: 'code-executor',
    name: 'Code Executor',
    description: 'Execute code in sandboxed environment',
    category: 'development',
    icon: 'development',
    isEnabled: true,
    isBuiltIn: true,
    version: '2.0.0',
    author: 'OpenClaw',
    config: {
      allowedLanguages: { type: 'textarea', label: 'Allowed Languages', value: 'python\njavascript\nbash', required: true },
      timeout: { type: 'number', label: 'Execution Timeout (seconds)', value: 30, required: true },
      memoryLimit: { type: 'number', label: 'Memory Limit (MB)', value: 256, required: true },
      networkAccess: { type: 'boolean', label: 'Network Access', value: false, required: true },
    },
    permissions: ['code_execution'],
    rateLimit: { requestsPerMinute: 5, requestsPerHour: 50 },
    agents: ['agent-2'],
  },
  {
    id: 'image-generator',
    name: 'Image Generator',
    description: 'Generate images using AI models',
    category: 'media',
    icon: 'media',
    isEnabled: false,
    isBuiltIn: false,
    version: '1.0.0',
    author: 'Community',
    config: {
      provider: { type: 'select', label: 'Provider', value: 'dalle', options: ['dalle', 'midjourney', 'stable-diffusion'], required: true },
      apiKey: { type: 'password', label: 'API Key', value: '', required: true },
      defaultSize: { type: 'select', label: 'Default Size', value: '1024x1024', options: ['256x256', '512x512', '1024x1024'], required: true },
    },
    permissions: ['external_api', 'media_generation'],
    agents: ['agent-4'],
  },
];

const mockAgents = [
  { id: 'agent-1', name: 'Claw Commander', emoji: '🦞' },
  { id: 'agent-2', name: 'Data Analyst', emoji: '📊' },
  { id: 'agent-3', name: 'Code Assistant', emoji: '💻' },
  { id: 'agent-4', name: 'Creative Bot', emoji: '🎨' },
];

export function ToolsPage() {
  const [tools, setTools] = useState<Tool[]>(mockTools);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isAgentAssignOpen, setIsAgentAssignOpen] = useState(false);
  const [expandedTool, setExpandedTool] = useState<string | null>(null);
  const [configValues, setConfigValues] = useState<Record<string, any>>({});

  const categories = ['all', ...Array.from(new Set(tools.map(t => t.category)))];

  const filteredTools = tools.filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const enabledCount = tools.filter(t => t.isEnabled).length;
  const builtInCount = tools.filter(t => t.isBuiltIn).length;

  const handleToggleTool = (toolId: string) => {
    setTools(prev => prev.map(t => 
      t.id === toolId ? { ...t, isEnabled: !t.isEnabled } : t
    ));
  };

  const handleConfigure = (tool: Tool) => {
    setSelectedTool(tool);
    setConfigValues(Object.entries(tool.config).reduce((acc, [key, field]) => ({
      ...acc,
      [key]: field.value
    }), {}));
    setIsConfigOpen(true);
  };

  const handleSaveConfig = () => {
    if (selectedTool) {
      setTools(prev => prev.map(t => {
        if (t.id === selectedTool.id) {
          return {
            ...t,
            config: Object.entries(t.config).reduce((acc, [key, field]) => ({
              ...acc,
              [key]: { ...field, value: configValues[key] ?? field.value }
            }), {})
          };
        }
        return t;
      }));
    }
    setIsConfigOpen(false);
  };

  const handleAgentAssignment = (tool: Tool) => {
    setSelectedTool(tool);
    setIsAgentAssignOpen(true);
  };

  const toggleAgentAccess = (agentId: string) => {
    if (selectedTool) {
      setTools(prev => prev.map(t => {
        if (t.id === selectedTool.id) {
          const hasAccess = t.agents.includes(agentId);
          return {
            ...t,
            agents: hasAccess 
              ? t.agents.filter(id => id !== agentId)
              : [...t.agents, agentId]
          };
        }
        return t;
      }));
      setSelectedTool(prev => {
        if (!prev) return null;
        const hasAccess = prev.agents.includes(agentId);
        return {
          ...prev,
          agents: hasAccess
            ? prev.agents.filter(id => id !== agentId)
            : [...prev.agents, agentId]
        };
      });
    }
  };

  const renderConfigField = (key: string, field: ToolConfigField) => {
    const value = configValues[key] ?? field.value;

    switch (field.type) {
      case 'string':
        return (
          <Input
            value={value as string}
            onChange={(e) => setConfigValues(prev => ({ ...prev, [key]: e.target.value }))}
            placeholder={field.placeholder}
            className="bg-slate-900 border-slate-700 text-white"
          />
        );
      case 'password':
        return (
          <Input
            type="password"
            value={value as string}
            onChange={(e) => setConfigValues(prev => ({ ...prev, [key]: e.target.value }))}
            placeholder={field.placeholder}
            className="bg-slate-900 border-slate-700 text-white"
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            value={value as number}
            onChange={(e) => setConfigValues(prev => ({ ...prev, [key]: parseInt(e.target.value) || 0 }))}
            className="bg-slate-900 border-slate-700 text-white"
          />
        );
      case 'boolean':
        return (
          <Switch
            checked={value as boolean}
            onCheckedChange={(checked) => setConfigValues(prev => ({ ...prev, [key]: checked }))}
          />
        );
      case 'select':
        return (
          <Select value={value as string} onValueChange={(v) => setConfigValues(prev => ({ ...prev, [key]: v }))}>
            <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700">
              {field.options?.map(opt => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'textarea':
        return (
          <textarea
            value={value as string}
            onChange={(e) => setConfigValues(prev => ({ ...prev, [key]: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 rounded-md bg-slate-900 border border-slate-700 text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center">
              <Terminal className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">
                <span className="text-cyan-400">Tool</span> Configurator
              </h1>
              <p className="text-xs text-slate-400">Manage agent tools and capabilities</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-800/50">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-slate-400">Enabled:</span>
            <span className="text-sm font-semibold text-white">{enabledCount}/{tools.length}</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-800/50">
            <Wrench className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-slate-400">Built-in:</span>
            <span className="text-sm font-semibold text-white">{builtInCount}</span>
          </div>
          <Button className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30">
            <Plus className="w-4 h-4 mr-2" />
            Add Tool
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-3 border-b border-slate-800/50 flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tools..."
            className="pl-10 bg-slate-900 border-slate-700 text-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-40 bg-slate-900 border-slate-700 text-white">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700">
              <SelectItem value="all">All Categories</SelectItem>
              {categories.filter(c => c !== 'all').map(cat => (
                <SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredTools.map((tool) => {
            const colors = categoryColors[tool.category];
            const CategoryIcon = categoryIcons[tool.category] || Wrench;
            const isExpanded = expandedTool === tool.id;

            return (
              <div 
                key={tool.id}
                className={cn(
                  'rounded-xl border backdrop-blur-sm overflow-hidden transition-all duration-300',
                  colors.bg,
                  colors.border,
                  tool.isEnabled ? 'opacity-100' : 'opacity-50'
                )}
              >
                <div className="p-4">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center',
                        'bg-slate-950/50 border border-slate-800/50'
                      )}>
                        <CategoryIcon className={cn('w-5 h-5', colors.text)} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-white">{tool.name}</h3>
                          {tool.isBuiltIn ? (
                            <Badge variant="outline" className="text-[10px] border-cyan-500/30 text-cyan-400">
                              Built-in
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] border-purple-500/30 text-purple-400">
                              Custom
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 capitalize">{tool.category} • v{tool.version}</p>
                      </div>
                    </div>
                    <Switch 
                      checked={tool.isEnabled}
                      onCheckedChange={() => handleToggleTool(tool.id)}
                    />
                  </div>

                  {/* Description */}
                  <p className="text-sm text-slate-300 mb-3 line-clamp-2">{tool.description}</p>

                  {/* Stats */}
                  <div className="flex items-center gap-4 mb-3 text-xs">
                    <span className="text-slate-400">
                      <span className="text-white">{tool.agents.length}</span> agents
                    </span>
                    {tool.rateLimit && (
                      <span className="text-slate-400">
                        <span className="text-white">{tool.rateLimit.requestsPerMinute}</span>/min
                      </span>
                    )}
                    <span className="text-slate-400">by {tool.author}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
                      onClick={() => handleConfigure(tool)}
                    >
                      <Settings className="w-4 h-4 mr-1" />
                      Configure
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
                      onClick={() => handleAgentAssignment(tool)}
                    >
                      <Users className="w-4 h-4 mr-1" />
                      Agents
                    </Button>
                  </div>

                  {/* Expand */}
                  <button
                    onClick={() => setExpandedTool(isExpanded ? null : tool.id)}
                    className="w-full flex items-center justify-center gap-1 mt-3 pt-3 border-t border-slate-800/50 text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    {isExpanded ? (
                      <><ChevronUp className="w-4 h-4" /> Less details</>
                    ) : (
                      <><ChevronDown className="w-4 h-4" /> More details</>
                    )}
                  </button>

                  {/* Expanded */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-800/50 space-y-2">
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Permissions</p>
                        <div className="flex flex-wrap gap-1">
                          {tool.permissions.map(perm => (
                            <Badge key={perm} variant="outline" className="text-[10px] border-slate-600 text-slate-400">
                              {perm}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Configuration</p>
                        <div className="space-y-1">
                          {Object.entries(tool.config).map(([key, field]) => (
                            <div key={key} className="flex items-center justify-between text-sm">
                              <span className="text-slate-500">{field.label}:</span>
                              <span className="text-slate-300 font-mono text-xs">
                                {field.type === 'password' ? '••••••' : String(field.value).substring(0, 20)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Configuration Dialog */}
      <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <DialogContent className="bg-slate-950 border-slate-800 max-w-lg max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-cyan-400" />
              Configure {selectedTool?.name}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {selectedTool?.description}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {selectedTool && Object.entries(selectedTool.config).map(([key, field]) => (
              <div key={key}>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm text-slate-300">
                    {field.label}
                    {field.required && <span className="text-red-400 ml-1">*</span>}
                  </label>
                </div>
                {field.description && (
                  <p className="text-xs text-slate-500 mb-1">{field.description}</p>
                )}
                {renderConfigField(key, field)}
              </div>
            ))}

            {selectedTool?.rateLimit && (
              <div className="pt-4 border-t border-slate-800">
                <p className="text-sm text-slate-400 mb-2">Rate Limits</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-slate-900/50">
                    <p className="text-xs text-slate-500">Per Minute</p>
                    <p className="text-lg font-semibold text-white">{selectedTool.rateLimit.requestsPerMinute}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900/50">
                    <p className="text-xs text-slate-500">Per Hour</p>
                    <p className="text-lg font-semibold text-white">{selectedTool.rateLimit.requestsPerHour}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsConfigOpen(false)}
              className="border-slate-700 text-slate-300"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveConfig}
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Agent Assignment Dialog */}
      <Dialog open={isAgentAssignOpen} onOpenChange={setIsAgentAssignOpen}>
        <DialogContent className="bg-slate-950 border-slate-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-400" />
              Agent Access
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Select which agents can use {selectedTool?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-2 py-4">
            {mockAgents.map(agent => {
              const hasAccess = selectedTool?.agents.includes(agent.id);
              return (
                <div 
                  key={agent.id}
                  onClick={() => toggleAgentAccess(agent.id)}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors',
                    hasAccess ? 'bg-cyan-500/10 border border-cyan-500/30' : 'bg-slate-900/50 border border-slate-800 hover:border-slate-700'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{agent.emoji}</span>
                    <span className="text-white">{agent.name}</span>
                  </div>
                  {hasAccess && <CheckCircle2 className="w-5 h-5 text-cyan-400" />}
                </div>
              );
            })}
          </div>

          <DialogFooter>
            <Button 
              onClick={() => setIsAgentAssignOpen(false)}
              className="bg-cyan-500 hover:bg-cyan-600 text-white w-full"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Missing import
import { Users } from 'lucide-react';

export default ToolsPage;
