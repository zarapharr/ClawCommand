import { useState } from 'react';
import { 
  Route, Cpu, Zap, Layers, Settings, 
  Plus, Trash2, Edit2, X,
  TrendingUp, DollarSign, Clock
} from 'lucide-react';
import { 
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line,
  CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip
} from 'recharts';
import { useRoutingStore } from '../stores/enterprise-store';
import type { RoutingRule } from '../types/enterprise';

type TierType = 'premium' | 'standard' | 'economy';

const modelTierConfig: Record<TierType, { 
  label: string; 
  color: string; 
  icon: React.ElementType;
  description: string;
}> = {
  premium: { 
    label: 'Premium', 
    color: '#a855f7', 
    icon: Zap,
    description: 'GPT-4, Claude Opus - Best quality'
  },
  standard: { 
    label: 'Standard', 
    color: '#00f0ff', 
    icon: Cpu,
    description: 'GPT-4o, Claude Sonnet - Balanced'
  },
  economy: { 
    label: 'Economy', 
    color: '#22c55e', 
    icon: Layers,
    description: 'GPT-3.5, Local models - Cost effective'
  },
};

// Model definitions with pricing
const availableModels = [
  { id: 'gpt-4', name: 'GPT-4', tier: 'premium' as TierType, costPer1k: 0.03, contextWindow: 8192 },
  { id: 'gpt-4o', name: 'GPT-4o', tier: 'standard' as TierType, costPer1k: 0.005, contextWindow: 128000 },
  { id: 'claude-opus', name: 'Claude 3 Opus', tier: 'premium' as TierType, costPer1k: 0.015, contextWindow: 200000 },
  { id: 'claude-sonnet', name: 'Claude 3 Sonnet', tier: 'standard' as TierType, costPer1k: 0.003, contextWindow: 200000 },
  { id: 'gpt-3.5', name: 'GPT-3.5 Turbo', tier: 'economy' as TierType, costPer1k: 0.0005, contextWindow: 16385 },
  { id: 'local-llama', name: 'Local Llama 3', tier: 'economy' as TierType, costPer1k: 0, contextWindow: 8192 },
];

export default function RoutingPage() {
  const { 
    rules, 
    addRule, 
    updateRule, 
    deleteRule,
    determineModel,
  } = useRoutingStore();

  const [showRuleModal, setShowRuleModal] = useState(false);
  const [editingRule, setEditingRule] = useState<RoutingRule | null>(null);
  const [testTask, setTestTask] = useState('');
  const [testResult, setTestResult] = useState<{ tier: TierType; model: string; reason: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'rules' | 'models'>('overview');

  // Calculate tier usage
  const tierUsage = {
    premium: 35,
    standard: 45,
    economy: 20,
  };

  const tierUsageData = [
    { name: 'Premium', value: tierUsage.premium, color: '#a855f7' },
    { name: 'Standard', value: tierUsage.standard, color: '#00f0ff' },
    { name: 'Economy', value: tierUsage.economy, color: '#22c55e' },
  ];

  // Savings over time
  const savingsData = [
    { month: 'Jan', withoutRouting: 1200, withRouting: 850 },
    { month: 'Feb', withoutRouting: 1350, withRouting: 920 },
    { month: 'Mar', withoutRouting: 1100, withRouting: 780 },
    { month: 'Apr', withoutRouting: 1450, withRouting: 980 },
    { month: 'May', withoutRouting: 1300, withRouting: 890 },
    { month: 'Jun', withoutRouting: 1250, withRouting: 775 },
  ];

  const handleSaveRule = () => {
    if (!editingRule) return;
    
    if (editingRule.id && rules.find(r => r.id === editingRule.id)) {
      updateRule(editingRule.id, editingRule);
    } else {
      addRule({
        ifTaskContains: editingRule.ifTaskContains || [],
        useModel: editingRule.useModel || 'claude-sonnet-4-6',
        overrideReason: editingRule.overrideReason || '',
        priority: editingRule.priority || 1,
        enabled: editingRule.enabled ?? true,
      });
    }
    setShowRuleModal(false);
    setEditingRule(null);
  };

  const handleTestRouting = () => {
    if (!testTask.trim()) return;
    const modelId = determineModel('agent-1', testTask);
    const model = availableModels.find(m => m.id === modelId) || availableModels[3];
    setTestResult({
      tier: model.tier,
      model: model.name,
      reason: `Matched to ${model.tier} tier based on task complexity`,
    });
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center">
            <Route className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-100">Model Routing</h1>
            <p className="text-sm text-slate-400">Intelligent model selection & access control</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              activeTab === 'overview' 
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              activeTab === 'rules' 
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Routing Rules
          </button>
          <button
            onClick={() => setActiveTab('models')}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              activeTab === 'models' 
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Models
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats cards */}
            <div className="grid grid-cols-4 gap-4">
              <div className="holo-card p-4 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Total Savings</p>
                    <p className="text-2xl font-bold text-green-400">$2,847</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-400" />
                  </div>
                </div>
              </div>

              <div className="holo-card p-4 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Avg Response Time</p>
                    <p className="text-2xl font-bold text-cyan-400">1.2s</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-cyan-400" />
                  </div>
                </div>
              </div>

              <div className="holo-card p-4 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Routing Accuracy</p>
                    <p className="text-2xl font-bold text-purple-400">94%</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-purple-400" />
                  </div>
                </div>
              </div>

              <div className="holo-card p-4 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Active Rules</p>
                    <p className="text-2xl font-bold text-amber-400">{rules.filter(r => r.enabled).length}</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <Settings className="w-6 h-6 text-amber-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-2 gap-6">
              {/* Tier usage distribution */}
              <div className="holo-card p-6 rounded-xl">
                <h3 className="text-lg font-medium text-slate-200 mb-4">Tier Usage Distribution</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={tierUsageData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {tierUsageData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ background: '#0f172a', border: '1px solid #1e293b' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Cost savings over time */}
              <div className="holo-card p-6 rounded-xl">
                <h3 className="text-lg font-medium text-slate-200 mb-4">Cost Savings Over Time</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={savingsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#475569" />
                      <YAxis tick={{ fontSize: 12 }} stroke="#475569" />
                      <RechartsTooltip 
                        contentStyle={{ background: '#0f172a', border: '1px solid #1e293b' }}
                      />
                      <Line type="monotone" dataKey="withoutRouting" stroke="#ef4444" strokeWidth={2} name="Without Routing" />
                      <Line type="monotone" dataKey="withRouting" stroke="#22c55e" strokeWidth={2} name="With Routing" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Test routing */}
            <div className="holo-card p-6 rounded-xl">
              <h3 className="text-lg font-medium text-slate-200 mb-4">Test Routing</h3>
              <div className="flex gap-4">
                <input
                  type="text"
                  value={testTask}
                  onChange={(e) => setTestTask(e.target.value)}
                  placeholder="Enter a task description to test routing..."
                  className="flex-1 px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200"
                  onKeyDown={(e) => e.key === 'Enter' && handleTestRouting()}
                />
                <button
                  onClick={handleTestRouting}
                  className="px-6 py-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400 hover:bg-cyan-500/20"
                >
                  Test
                </button>
              </div>
              {testResult && (
                <div className="mt-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{ background: `${modelTierConfig[testResult.tier].color}20` }}
                    >
                      {(() => {
                        const Icon = modelTierConfig[testResult.tier].icon;
                        return <Icon className="w-6 h-6" style={{ color: modelTierConfig[testResult.tier].color }} />;
                      })()}
                    </div>
                    <div>
                      <p className="text-lg font-medium text-slate-200">
                        {testResult.model}
                        <span 
                          className="ml-2 text-sm px-2 py-0.5 rounded"
                          style={{ 
                            background: `${modelTierConfig[testResult.tier].color}20`,
                            color: modelTierConfig[testResult.tier].color 
                          }}
                        >
                          {modelTierConfig[testResult.tier].label}
                        </span>
                      </p>
                      <p className="text-sm text-slate-400">{testResult.reason}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'rules' && (
          <div className="space-y-6">
            {/* Rules list */}
            <div className="holo-card rounded-xl overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-slate-800">
                <h3 className="text-lg font-medium text-slate-200">Routing Rules</h3>
                <button
                  onClick={() => {
                    setEditingRule({
                      id: '',
                      ifTaskContains: [],
                      useModel: 'claude-sonnet-4-6',
                      overrideReason: '',
                      priority: 1,
                      enabled: true,
                    });
                    setShowRuleModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400 hover:bg-cyan-500/20"
                >
                  <Plus className="w-4 h-4" />
                  Add Rule
                </button>
              </div>
              <div className="divide-y divide-slate-800">
                {rules.map((rule, index) => (
                  <div key={rule.id} className="p-4 flex items-center justify-between hover:bg-slate-800/30">
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-slate-500 w-8">{index + 1}</span>
                      <div className={`w-2 h-2 rounded-full ${rule.enabled ? 'bg-green-400' : 'bg-slate-600'}`} />
                      <div>
                        <p className="text-sm font-medium text-slate-200">{rule.overrideReason || 'Rule ' + (index + 1)}</p>
                        <p className="text-xs text-slate-500">If contains: {rule.ifTaskContains.join(', ')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-slate-400">→ {rule.useModel}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingRule(rule);
                            setShowRuleModal(true);
                          }}
                          className="p-2 hover:bg-slate-700 rounded-lg text-slate-400"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteRule(rule.id)}
                          className="p-2 hover:bg-red-500/10 rounded-lg text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {rules.length === 0 && (
                  <div className="p-8 text-center text-slate-500">
                    <Settings className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No routing rules configured</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'models' && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              {availableModels.map((model) => {
                const tier = modelTierConfig[model.tier];
                const Icon = tier.icon;
                return (
                  <div key={model.id} className="holo-card p-4 rounded-xl">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ background: `${tier.color}20` }}
                        >
                          <Icon className="w-5 h-5" style={{ color: tier.color }} />
                        </div>
                        <div>
                          <p className="font-medium text-slate-200">{model.name}</p>
                          <p className="text-xs text-slate-500">{tier.label} Tier</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-9 h-5 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
                      </label>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-xs text-slate-500">Cost per 1K tokens</p>
                        <p className="text-slate-300">${model.costPer1k.toFixed(4)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Context window</p>
                        <p className="text-slate-300">{model.contextWindow.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Rule Modal */}
      {showRuleModal && editingRule && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="w-[500px] bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <h2 className="text-lg font-semibold text-slate-100">
                {editingRule.id ? 'Edit Rule' : 'New Routing Rule'}
              </h2>
              <button 
                onClick={() => {
                  setShowRuleModal(false);
                  setEditingRule(null);
                }}
                className="p-2 hover:bg-slate-800 rounded-lg text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm text-slate-500">Description</label>
                <input
                  type="text"
                  value={editingRule.overrideReason || ''}
                  onChange={(e) => setEditingRule({ ...editingRule, overrideReason: e.target.value })}
                  placeholder="e.g., Code Tasks"
                  className="w-full mt-2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200"
                />
              </div>
              <div>
                <label className="text-sm text-slate-500">Keywords (comma-separated)</label>
                <input
                  type="text"
                  value={editingRule.ifTaskContains?.join(', ') || ''}
                  onChange={(e) => setEditingRule({ 
                    ...editingRule, 
                    ifTaskContains: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  })}
                  placeholder="e.g., code, programming, debug"
                  className="w-full mt-2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200"
                />
              </div>
              <div>
                <label className="text-sm text-slate-500">Use Model</label>
                <select
                  value={editingRule.useModel}
                  onChange={(e) => setEditingRule({ ...editingRule, useModel: e.target.value })}
                  className="w-full mt-2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200"
                >
                  {availableModels.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.tier})</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editingRule.enabled ?? true}
                  onChange={(e) => setEditingRule({ ...editingRule, enabled: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-cyan-500"
                />
                <span className="text-sm text-slate-300">Enable this rule</span>
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-slate-800">
              <button
                onClick={() => {
                  setShowRuleModal(false);
                  setEditingRule(null);
                }}
                className="px-4 py-2 text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRule}
                className="px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400 hover:bg-cyan-500/20"
              >
                Save Rule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
