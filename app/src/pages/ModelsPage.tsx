import { useState, useEffect } from 'react';
import { 
  Brain, CheckCircle2, AlertCircle, 
  Plus, Save, Eye, EyeOff,
  Server, Sparkles, Bot, Settings,
  Globe, Zap, DollarSign, BarChart3
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

// Types
interface ModelProvider {
  id: string;
  name: string;
  icon: string;
  isConfigured: boolean;
  isEnabled: boolean;
  apiKey?: string;
  baseUrl?: string;
  models: AIModel[];
  usage: {
    totalTokens: number;
    totalCost: number;
    requestsToday: number;
  };
}

interface AIModel {
  id: string;
  name: string;
  provider: string;
  contextWindow?: number;
  maxTokens?: number;
  pricing?: {
    input: number;
    output: number;
  };
  features?: string[];
  isEnabled: boolean;
  isDefault: boolean;
}

interface AgentModelUsage {
  agentId: string;
  agentName: string;
  agentEmoji: string;
  modelId: string;
  modelName: string;
  tokensUsed: number;
  cost: number;
  requests: number;
  lastUsed: string;
}

// Mock openclaw.json data structure
const mockOpenClawConfig = {
  models: {
    openai: {
      enabled: true,
      apiKey: 'sk-***',
      baseUrl: 'https://api.openai.com/v1',
      defaultModel: 'gpt-4o',
      models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    },
    anthropic: {
      enabled: true,
      apiKey: 'sk-ant-***',
      baseUrl: 'https://api.anthropic.com',
      defaultModel: 'claude-3-5-sonnet-20241022',
      models: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-haiku-20240307'],
    },
    google: {
      enabled: false,
      apiKey: '',
      baseUrl: 'https://generativelanguage.googleapis.com',
      defaultModel: 'gemini-pro',
      models: ['gemini-pro', 'gemini-pro-vision'],
    },
    groq: {
      enabled: true,
      apiKey: 'gsk_***',
      baseUrl: 'https://api.groq.com/openai/v1',
      defaultModel: 'llama-3.1-70b-versatile',
      models: ['llama-3.1-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
    },
    ollama: {
      enabled: true,
      apiKey: '',
      baseUrl: 'http://localhost:11434',
      defaultModel: 'llama3.1',
      models: ['llama3.1', 'mistral', 'codellama', 'phi3'],
    },
    custom: {
      enabled: false,
      apiKey: '',
      baseUrl: '',
      defaultModel: '',
      models: [],
    },
  },
};

// Model details
const modelDetails: Record<string, Partial<AIModel>> = {
  'gpt-4o': { contextWindow: 128000, maxTokens: 4096, pricing: { input: 0.005, output: 0.015 }, features: ['vision', 'function-calling', 'json-mode'] },
  'gpt-4o-mini': { contextWindow: 128000, maxTokens: 4096, pricing: { input: 0.00015, output: 0.0006 }, features: ['vision', 'function-calling', 'json-mode'] },
  'gpt-4-turbo': { contextWindow: 128000, maxTokens: 4096, pricing: { input: 0.01, output: 0.03 }, features: ['vision', 'function-calling', 'json-mode'] },
  'gpt-3.5-turbo': { contextWindow: 16385, maxTokens: 4096, pricing: { input: 0.0005, output: 0.0015 }, features: ['function-calling', 'json-mode'] },
  'claude-3-5-sonnet-20241022': { contextWindow: 200000, maxTokens: 8192, pricing: { input: 0.003, output: 0.015 }, features: ['vision', 'function-calling', 'code'] },
  'claude-3-opus-20240229': { contextWindow: 200000, maxTokens: 4096, pricing: { input: 0.015, output: 0.075 }, features: ['vision', 'function-calling', 'code'] },
  'claude-3-haiku-20240307': { contextWindow: 200000, maxTokens: 4096, pricing: { input: 0.00025, output: 0.00125 }, features: ['vision', 'function-calling'] },
  'gemini-pro': { contextWindow: 1000000, maxTokens: 8192, pricing: { input: 0.0005, output: 0.0015 }, features: ['vision', 'function-calling'] },
  'gemini-pro-vision': { contextWindow: 1000000, maxTokens: 8192, pricing: { input: 0.0005, output: 0.0015 }, features: ['vision'] },
  'llama-3.1-70b-versatile': { contextWindow: 131072, maxTokens: 8192, pricing: { input: 0.00059, output: 0.00079 }, features: ['function-calling', 'json-mode'] },
  'llama-3.1-8b-instant': { contextWindow: 131072, maxTokens: 8192, pricing: { input: 0.00005, output: 0.00008 }, features: ['function-calling', 'json-mode'] },
  'mixtral-8x7b-32768': { contextWindow: 32768, maxTokens: 8192, pricing: { input: 0.00024, output: 0.00024 }, features: ['function-calling'] },
  'llama3.1': { contextWindow: 128000, maxTokens: 8192, pricing: { input: 0, output: 0 }, features: ['local', 'privacy'] },
  'mistral': { contextWindow: 32000, maxTokens: 8192, pricing: { input: 0, output: 0 }, features: ['local', 'privacy'] },
  'codellama': { contextWindow: 16000, maxTokens: 4096, pricing: { input: 0, output: 0 }, features: ['local', 'code'] },
  'phi3': { contextWindow: 128000, maxTokens: 4096, pricing: { input: 0, output: 0 }, features: ['local', 'privacy'] },
};

// Provider configurations
const providerConfig: Record<string, { name: string; color: string; icon: typeof Brain }> = {
  openai: { name: 'OpenAI', color: 'text-emerald-400', icon: Sparkles },
  anthropic: { name: 'Anthropic', color: 'text-orange-400', icon: Bot },
  google: { name: 'Google AI', color: 'text-blue-400', icon: Globe },
  groq: { name: 'Groq', color: 'text-purple-400', icon: Zap },
  ollama: { name: 'Ollama', color: 'text-cyan-400', icon: Server },
  custom: { name: 'Custom', color: 'text-slate-400', icon: Settings },
};

// Mock agent usage data
const mockAgentUsage: AgentModelUsage[] = [
  { agentId: 'agent-1', agentName: 'Claw Commander', agentEmoji: '🦞', modelId: 'gpt-4o', modelName: 'GPT-4o', tokensUsed: 154320, cost: 2.31, requests: 234, lastUsed: new Date(Date.now() - 5 * 60000).toISOString() },
  { agentId: 'agent-2', agentName: 'Data Analyst', agentEmoji: '📊', modelId: 'claude-3-5-sonnet-20241022', modelName: 'Claude 3.5 Sonnet', tokensUsed: 89200, cost: 1.34, requests: 156, lastUsed: new Date(Date.now() - 15 * 60000).toISOString() },
  { agentId: 'agent-3', agentName: 'Code Assistant', agentEmoji: '💻', modelId: 'llama-3.1-70b-versatile', modelName: 'Llama 3.1 70B', tokensUsed: 45600, cost: 0.05, requests: 89, lastUsed: new Date(Date.now() - 30 * 60000).toISOString() },
  { agentId: 'agent-4', agentName: 'Creative Bot', agentEmoji: '🎨', modelId: 'gpt-4o-mini', modelName: 'GPT-4o Mini', tokensUsed: 67800, cost: 0.05, requests: 312, lastUsed: new Date(Date.now() - 2 * 60000).toISOString() },
  { agentId: 'agent-1', agentName: 'Claw Commander', agentEmoji: '🦞', modelId: 'claude-3-haiku-20240307', modelName: 'Claude 3 Haiku', tokensUsed: 23400, cost: 0.04, requests: 78, lastUsed: new Date(Date.now() - 45 * 60000).toISOString() },
];

export function ModelsPage() {
  const [providers, setProviders] = useState<ModelProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<ModelProvider | null>(null);
  const [isProviderDialogOpen, setIsProviderDialogOpen] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [activeTab, setActiveTab] = useState('providers');

  // Load from openclaw.json mock
  useEffect(() => {
    const loadedProviders: ModelProvider[] = Object.entries(mockOpenClawConfig.models)
      .filter(([_, config]) => config.enabled || config.apiKey) // Only show configured providers
      .map(([providerId, config]) => ({
        id: providerId,
        name: providerConfig[providerId]?.name || providerId,
        icon: providerId,
        isConfigured: !!config.apiKey,
        isEnabled: config.enabled,
        apiKey: config.apiKey,
        baseUrl: config.baseUrl,
        models: config.models.map(modelId => ({
          id: modelId,
          name: modelId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          provider: providerId,
          ...modelDetails[modelId],
          isEnabled: true,
          isDefault: modelId === config.defaultModel,
        })),
        usage: {
          totalTokens: Math.floor(Math.random() * 500000),
          totalCost: Math.random() * 50,
          requestsToday: Math.floor(Math.random() * 1000),
        },
      }));
    setProviders(loadedProviders);
  }, []);

  const handleConfigureProvider = (provider: ModelProvider) => {
    setSelectedProvider(provider);
    setShowApiKey(false);
    setIsProviderDialogOpen(true);
  };

  const handleToggleProvider = (providerId: string) => {
    setProviders(prev => prev.map(p => 
      p.id === providerId ? { ...p, isEnabled: !p.isEnabled } : p
    ));
  };

  const handleToggleModel = (providerId: string, modelId: string) => {
    setProviders(prev => prev.map(p => {
      if (p.id === providerId) {
        return {
          ...p,
          models: p.models.map(m => 
            m.id === modelId ? { ...m, isEnabled: !m.isEnabled } : m
          )
        };
      }
      return p;
    }));
  };

  const handleSetDefaultModel = (providerId: string, modelId: string) => {
    setProviders(prev => prev.map(p => {
      if (p.id === providerId) {
        return {
          ...p,
          models: p.models.map(m => ({ ...m, isDefault: m.id === modelId }))
        };
      }
      return p;
    }));
  };

  const totalTokens = providers.reduce((sum, p) => sum + p.usage.totalTokens, 0);
  const totalCost = providers.reduce((sum, p) => sum + p.usage.totalCost, 0);
  const configuredProviders = providers.filter(p => p.isConfigured).length;

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatCurrency = (num: number) => {
    return '$' + num.toFixed(2);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center">
              <Brain className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">
                <span className="text-cyan-400">Model</span> Manager
              </h1>
              <p className="text-xs text-slate-400">Configure AI providers and track usage</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-800/50">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-slate-400">Providers:</span>
            <span className="text-sm font-semibold text-white">{configuredProviders}/{providers.length}</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-800/50">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-slate-400">Tokens:</span>
            <span className="text-sm font-semibold text-white">{formatNumber(totalTokens)}</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-800/50">
            <DollarSign className="w-4 h-4 text-amber-400" />
            <span className="text-sm text-slate-400">Cost:</span>
            <span className="text-sm font-semibold text-white">{formatCurrency(totalCost)}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="px-6 border-b border-slate-800/50">
          <TabsList className="bg-transparent border-b-0">
            <TabsTrigger 
              value="providers" 
              className="data-[state=active]:bg-cyan-500/10 data-[state=active]:text-cyan-400 data-[state=active]:border-cyan-500/30 border border-transparent"
            >
              <Server className="w-4 h-4 mr-2" />
              Providers
            </TabsTrigger>
            <TabsTrigger 
              value="usage"
              className="data-[state=active]:bg-cyan-500/10 data-[state=active]:text-cyan-400 data-[state=active]:border-cyan-500/30 border border-transparent"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Usage by Agent
            </TabsTrigger>
            <TabsTrigger 
              value="routing"
              className="data-[state=active]:bg-cyan-500/10 data-[state=active]:text-cyan-400 data-[state=active]:border-cyan-500/30 border border-transparent"
            >
              <Zap className="w-4 h-4 mr-2" />
              Model Routing
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Providers Tab */}
        <TabsContent value="providers" className="flex-1 overflow-auto p-6 m-0">
          <div className="space-y-6">
            {providers.map((provider) => {
              const ProviderIcon = providerConfig[provider.id]?.icon || Brain;
              const providerColor = providerConfig[provider.id]?.color || 'text-slate-400';

              return (
                <div 
                  key={provider.id}
                  className={cn(
                    'rounded-xl border backdrop-blur-sm overflow-hidden',
                    'bg-slate-900/30 border-slate-800/50',
                    !provider.isEnabled && 'opacity-60'
                  )}
                >
                  {/* Provider Header */}
                  <div className="p-4 border-b border-slate-800/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          'w-12 h-12 rounded-xl flex items-center justify-center',
                          'bg-slate-950/50 border border-slate-800/50'
                        )}>
                          <ProviderIcon className={cn('w-6 h-6', providerColor)} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-white text-lg">{provider.name}</h3>
                            {provider.isConfigured ? (
                              <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Configured
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="border-amber-500/30 text-amber-400">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                No API Key
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-slate-400">
                            <span>{provider.models.length} models</span>
                            <span>{formatNumber(provider.usage.totalTokens)} tokens</span>
                            <span>{formatCurrency(provider.usage.totalCost)} cost</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch 
                          checked={provider.isEnabled}
                          onCheckedChange={() => handleToggleProvider(provider.id)}
                        />
                        <Button 
                          variant="outline"
                          size="sm"
                          className="border-slate-600 text-slate-300"
                          onClick={() => handleConfigureProvider(provider)}
                        >
                          <Settings className="w-4 h-4 mr-1" />
                          Configure
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Models List */}
                  <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {provider.models.map((model) => (
                        <div 
                          key={model.id}
                          className={cn(
                            'p-3 rounded-lg border transition-all',
                            model.isDefault 
                              ? 'bg-cyan-500/10 border-cyan-500/30' 
                              : 'bg-slate-950/30 border-slate-800/50',
                            !model.isEnabled && 'opacity-50'
                          )}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-white text-sm">{model.name}</span>
                                {model.isDefault && (
                                  <Badge className="text-[10px] bg-cyan-500/20 text-cyan-400 border-0">
                                    Default
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-slate-500">
                                {model.contextWindow ? `${formatNumber(model.contextWindow)} ctx` : ''}
                                {model.maxTokens ? ` • ${formatNumber(model.maxTokens)} max` : ''}
                              </p>
                            </div>
                            <Switch 
                              checked={model.isEnabled}
                              onCheckedChange={() => handleToggleModel(provider.id, model.id)}
                              className="scale-75"
                            />
                          </div>

                          {model.pricing && (
                            <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                              <span>${model.pricing.input}/1K in</span>
                              <span>•</span>
                              <span>${model.pricing.output}/1K out</span>
                            </div>
                          )}

                          {model.features && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {model.features.slice(0, 3).map(feature => (
                                <span 
                                  key={feature} 
                                  className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400"
                                >
                                  {feature}
                                </span>
                              ))}
                            </div>
                          )}

                          {!model.isDefault && model.isEnabled && (
                            <button
                              onClick={() => handleSetDefaultModel(provider.id, model.id)}
                              className="text-xs text-cyan-400 hover:text-cyan-300"
                            >
                              Set as default
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Add Provider */}
            <div 
              className={cn(
                'rounded-xl border border-dashed border-slate-700 bg-slate-900/30',
                'flex flex-col items-center justify-center p-8 cursor-pointer',
                'hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all'
              )}
            >
              <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center mb-3">
                <Plus className="w-6 h-6 text-slate-400" />
              </div>
              <h3 className="font-semibold text-white mb-1">Add Custom Provider</h3>
              <p className="text-sm text-slate-400 text-center">Connect to custom OpenAI-compatible API endpoints</p>
            </div>
          </div>
        </TabsContent>

        {/* Usage Tab */}
        <TabsContent value="usage" className="flex-1 overflow-auto p-6 m-0">
          <div className="space-y-4">
            {mockAgentUsage.map((usage, index) => (
              <div 
                key={`${usage.agentId}-${index}`}
                className="p-4 rounded-xl bg-slate-900/30 border border-slate-800/50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">{usage.agentEmoji}</span>
                    <div>
                      <h4 className="font-medium text-white">{usage.agentName}</h4>
                      <p className="text-sm text-slate-400">{usage.modelName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-right">
                    <div>
                      <p className="text-lg font-semibold text-white">{formatNumber(usage.tokensUsed)}</p>
                      <p className="text-xs text-slate-500">tokens</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-emerald-400">{formatCurrency(usage.cost)}</p>
                      <p className="text-xs text-slate-500">cost</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-white">{usage.requests}</p>
                      <p className="text-xs text-slate-500">requests</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Routing Tab */}
        <TabsContent value="routing" className="flex-1 overflow-auto p-6 m-0">
          <div className="max-w-2xl mx-auto">
            <div className="p-6 rounded-xl bg-slate-900/30 border border-slate-800/50">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-cyan-400" />
                Model Routing Rules
              </h3>
              <p className="text-sm text-slate-400 mb-6">
                Configure automatic model selection based on task type, cost limits, and availability.
              </p>

              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-slate-950/50 border border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">Cost-Based Routing</span>
                    <Switch defaultChecked />
                  </div>
                  <p className="text-sm text-slate-400">Automatically switch to cheaper models when budget is low</p>
                </div>

                <div className="p-4 rounded-lg bg-slate-950/50 border border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">Fallback Chain</span>
                    <Switch defaultChecked />
                  </div>
                  <p className="text-sm text-slate-400">Try alternative providers if primary fails</p>
                </div>

                <div className="p-4 rounded-lg bg-slate-950/50 border border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">Task-Based Selection</span>
                    <Switch />
                  </div>
                  <p className="text-sm text-slate-400">Use specialized models for coding, analysis, etc.</p>
                </div>

                <div className="p-4 rounded-lg bg-slate-950/50 border border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">Local-First Mode</span>
                    <Switch />
                  </div>
                  <p className="text-sm text-slate-400">Prefer Ollama/local models when available</p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Provider Configuration Dialog */}
      <Dialog open={isProviderDialogOpen} onOpenChange={setIsProviderDialogOpen}>
        <DialogContent className="bg-slate-950 border-slate-800 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-cyan-400" />
              Configure {selectedProvider?.name}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Update API credentials and endpoint settings
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm text-slate-400 mb-1 block">API Key</label>
              <div className="relative">
                <Input 
                  type={showApiKey ? 'text' : 'password'}
                  defaultValue={selectedProvider?.apiKey}
                  placeholder="Enter API key"
                  className="bg-slate-900 border-slate-700 text-white pr-10"
                />
                <button
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm text-slate-400 mb-1 block">Base URL (Optional)</label>
              <Input 
                defaultValue={selectedProvider?.baseUrl}
                placeholder="https://api.example.com/v1"
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>

            <div>
              <label className="text-sm text-slate-400 mb-1 block">Default Model</label>
              <Select defaultValue={selectedProvider?.models.find(m => m.isDefault)?.id}>
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  {selectedProvider?.models.map(model => (
                    <SelectItem key={model.id} value={model.id}>{model.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsProviderDialogOpen(false)}
              className="border-slate-700 text-slate-300"
            >
              Cancel
            </Button>
            <Button 
              onClick={() => setIsProviderDialogOpen(false)}
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ModelsPage;
