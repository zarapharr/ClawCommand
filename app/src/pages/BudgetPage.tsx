import { useState, useMemo } from 'react';
import { useBudgetStore } from '@/stores/enterprise-store';
import { mockAgents } from '@/data/mock-data';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
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
import { Slider } from '@/components/ui/slider';
import {
  DollarSign, TrendingUp, AlertTriangle, Bell, CheckCircle,
  Wallet, PieChart, BarChart3, ArrowUpRight, ArrowDownRight,
  Download, Edit3, Save, X, Plus, Minus, Settings, LineChart as LineChartIcon
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { CostTrendGraph } from '@/components/budget/CostTrendGraph';
import { CostForecast } from '@/components/budget/CostForecast';
import { type AlertConfig } from '@/components/budget/AlertConfiguration';
import { AnomalyMarker } from '@/components/budget/AnomalyMarker';
import {
  calculateEMAForecast,
  analyzeCostTrend,
  detectAnomaly,
} from '@/utils/costCalculator';
// Unused in current version, available for future features:
// BudgetMeter, AlertConfiguration, calculateBudgetStats, formatBudgetCSV

export function BudgetPage() {
  const {
    budgets,
    alerts,
    unacknowledgedAlerts,
    getTotalTeamBudget,
    acknowledgeAlert,
    updateBudget,
  } = useBudgetStore();

  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<any>(null);
  // Alert configuration for future use
  const [_alertConfig] = useState<AlertConfig>({
    thresholds: { warning: 70, critical: 90, exceeded: 100 },
    spikeDetection: { enabled: true, stdDevThreshold: 1.5 },
    channels: [
      { id: 'in-app', type: 'in-app', enabled: true, config: {} },
    ],
  });

  // Get agent name
  const getAgentName = (agentId: string) => {
    return mockAgents.find(a => a.id === agentId)?.name || agentId;
  };

  const getAgentEmoji = (agentId: string) => {
    return mockAgents.find(a => a.id === agentId)?.emoji || '👤';
  };

  // Calculate team totals
  const teamBudget = getTotalTeamBudget;
  const teamUtilization = (teamBudget.spent / teamBudget.total) * 100;

  // Budget data for charts
  const budgetData = useMemo(() => {
    return budgets.map(b => ({
      name: getAgentName(b.agentId),
      budget: b.monthlyBudget,
      spent: b.spentThisMonth,
      remaining: b.monthlyBudget - b.spentThisMonth,
      utilization: (b.spentThisMonth / b.monthlyBudget) * 100,
    }));
  }, [budgets]);

  // Model tier distribution
  const tierData = useMemo(() => {
    const tiers = { premium: 0, standard: 0, economy: 0 };
    budgets.forEach(b => {
      tiers.premium += b.modelTiers.premium.spent;
      tiers.standard += b.modelTiers.standard.spent;
      tiers.economy += b.modelTiers.economy.spent;
    });
    return [
      { name: 'Premium', value: tiers.premium, color: '#a855f7' },
      { name: 'Standard', value: tiers.standard, color: '#00f0ff' },
      { name: 'Economy', value: tiers.economy, color: '#10b981' },
    ];
  }, [budgets]);

  // Get budget status color
  const getBudgetStatus = (percentage: number) => {
    if (percentage >= 90) return 'text-red-400';
    if (percentage >= 75) return 'text-orange-400';
    if (percentage >= 50) return 'text-yellow-400';
    return 'text-emerald-400';
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-orange-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-emerald-500';
  };

  // Open edit dialog for agent budget
  const handleEditBudget = (agentId: string) => {
    const budget = budgets.find(b => b.agentId === agentId);
    if (budget) {
      setEditingBudget({ ...budget });
      setSelectedAgent(agentId);
      setIsEditDialogOpen(true);
    }
  };

  // Save budget changes
  const handleSaveBudget = () => {
    if (editingBudget && selectedAgent) {
      updateBudget(selectedAgent, {
        monthlyBudget: editingBudget.monthlyBudget,
        alertThreshold: editingBudget.alertThreshold,
        hardLimit: editingBudget.hardLimit,
        onBudgetExceeded: editingBudget.onBudgetExceeded,
        rolloverEnabled: editingBudget.rolloverEnabled,
        modelTiers: editingBudget.modelTiers,
      });
      setIsEditDialogOpen(false);
      setEditingBudget(null);
      setSelectedAgent(null);
    }
  };

  // Update editing budget field
  const updateEditingField = (field: string, value: any) => {
    setEditingBudget((prev: any) => ({ ...prev, [field]: value }));
  };

  // Update model tier budget
  const updateModelTier = (tier: 'premium' | 'standard' | 'economy', field: 'limit' | 'spent', value: number) => {
    setEditingBudget((prev: any) => ({
      ...prev,
      modelTiers: {
        ...prev.modelTiers,
        [tier]: {
          ...prev.modelTiers[tier],
          [field]: value,
        },
      },
    }));
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">
              <span className="text-emerald-400">Budget</span> Control
            </h1>
            <p className="text-xs text-slate-400">Token economics & cost management</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Team Budget Summary */}
          <div className="flex items-center gap-6 px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-800">
            <div>
              <p className="text-xs text-slate-400">Team Budget</p>
              <p className="text-lg font-bold text-white">${teamBudget.total.toFixed(0)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Spent</p>
              <p className={cn("text-lg font-bold", getBudgetStatus(teamUtilization))}>
                ${teamBudget.spent.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Remaining</p>
              <p className="text-lg font-bold text-emerald-400">
                ${(teamBudget.total - teamBudget.spent).toFixed(2)}
              </p>
            </div>
            <div className="w-32">
              <p className="text-xs text-slate-400 mb-1">{teamUtilization.toFixed(1)}% used</p>
              <Progress value={teamUtilization} className="h-2 bg-slate-700">
                <div className={cn("h-full transition-all", getProgressColor(teamUtilization))} style={{ width: `${teamUtilization}%` }} />
              </Progress>
            </div>
          </div>

          {/* Alerts */}
          {unacknowledgedAlerts.length > 0 && (
            <Button variant="outline" className="border-orange-500/50 text-orange-400 relative">
              <Bell className="w-4 h-4 mr-2" />
              Alerts
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">
                {unacknowledgedAlerts.length}
              </span>
            </Button>
          )}

          <Button variant="outline" className="border-slate-700 text-slate-300">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden p-6">
        <Tabs defaultValue="overview" className="h-full flex flex-col">
          <TabsList className="bg-slate-900/50 border border-slate-800 w-fit">
            <TabsTrigger value="overview" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
              <PieChart className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="trends" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
              <LineChartIcon className="w-4 h-4 mr-2" />
              Trends & Forecast
            </TabsTrigger>
            <TabsTrigger value="agents" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
              <BarChart3 className="w-4 h-4 mr-2" />
              By Agent
            </TabsTrigger>
            <TabsTrigger value="alerts" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Alerts
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-auto mt-6">
            <TabsContent value="overview" className="mt-0 h-full">
              <div className="grid grid-cols-3 gap-6 h-full">
                {/* Cost Distribution */}
                <div className="holo-card p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Cost by Model Tier</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RePieChart>
                        <Pie
                          data={tierData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {tierData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ background: '#0d1117', border: '1px solid #30363d', borderRadius: '8px' }}
                          itemStyle={{ color: '#fff' }}
                        />
                      </RePieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 space-y-2">
                    {tierData.map((tier) => (
                      <div key={tier.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tier.color }} />
                          <span className="text-sm text-slate-300">{tier.name}</span>
                        </div>
                        <span className="text-sm font-medium text-white">${tier.value.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Daily Spend Trend */}
                <div className="holo-card p-6 col-span-2">
                  <h3 className="text-lg font-semibold text-white mb-4">Daily Spend Trend</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={budgetData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                        <YAxis stroke="#64748b" fontSize={12} />
                        <Tooltip
                          contentStyle={{ background: '#0d1117', border: '1px solid #30363d', borderRadius: '8px' }}
                          itemStyle={{ color: '#fff' }}
                        />
                        <Line type="monotone" dataKey="spent" stroke="#00f0ff" strokeWidth={2} dot={{ fill: '#00f0ff' }} />
                        <Line type="monotone" dataKey="budget" stroke="#64748b" strokeWidth={2} strokeDasharray="5 5" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="holo-card p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Quick Stats</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50">
                      <div className="flex items-center gap-3">
                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                        <span className="text-sm text-slate-300">Avg Daily Spend</span>
                      </div>
                      <span className="text-lg font-bold text-white">$36.53</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50">
                      <div className="flex items-center gap-3">
                        <ArrowUpRight className="w-5 h-5 text-orange-400" />
                        <span className="text-sm text-slate-300">Highest Spender</span>
                      </div>
                      <span className="text-lg font-bold text-white">Coder</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50">
                      <div className="flex items-center gap-3">
                        <ArrowDownRight className="w-5 h-5 text-emerald-400" />
                        <span className="text-sm text-slate-300">Most Efficient</span>
                      </div>
                      <span className="text-lg font-bold text-white">Editor</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50">
                      <div className="flex items-center gap-3">
                        <DollarSign className="w-5 h-5 text-cyan-400" />
                        <span className="text-sm text-slate-300">Cost per Request</span>
                      </div>
                      <span className="text-lg font-bold text-white">$0.045</span>
                    </div>
                  </div>
                </div>

                {/* Budget Utilization */}
                <div className="holo-card p-6 col-span-2">
                  <h3 className="text-lg font-semibold text-white mb-4">Budget Utilization by Agent</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={budgetData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#30363d" horizontal={false} />
                        <XAxis type="number" stroke="#64748b" fontSize={12} />
                        <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={12} width={100} />
                        <Tooltip
                          contentStyle={{ background: '#0d1117', border: '1px solid #30363d', borderRadius: '8px' }}
                          itemStyle={{ color: '#fff' }}
                        />
                        <Bar dataKey="spent" fill="#00f0ff" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="remaining" fill="#30363d" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="agents" className="mt-0">
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {budgets.map((budget) => {
                  const utilization = (budget.spentThisMonth / budget.monthlyBudget) * 100;
                  const agent = mockAgents.find(a => a.id === budget.agentId);

                  return (
                    <div
                      key={budget.agentId}
                      className={cn(
                        "holo-card p-4 cursor-pointer transition-all hover:scale-[1.02]",
                        selectedAgent === budget.agentId && "ring-2 ring-cyan-500/50"
                      )}
                      onClick={() => setSelectedAgent(budget.agentId)}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{getAgentEmoji(budget.agentId)}</span>
                          <div>
                            <p className="font-medium text-white">{getAgentName(budget.agentId)}</p>
                            <p className="text-xs text-slate-400">{agent?.role}</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditBudget(budget.agentId);
                          }}
                        >
                          <Edit3 className="w-4 h-4 text-slate-400" />
                        </Button>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-slate-400">Budget</span>
                            <span className={cn("font-medium", getBudgetStatus(utilization))}>
                              {utilization.toFixed(1)}%
                            </span>
                          </div>
                          <Progress value={utilization} className="h-2 bg-slate-700">
                            <div className={cn("h-full transition-all", getProgressColor(utilization))} style={{ width: `${utilization}%` }} />
                          </Progress>
                          <div className="flex items-center justify-between text-xs mt-1">
                            <span className="text-slate-500">${budget.spentThisMonth.toFixed(2)}</span>
                            <span className="text-slate-500">${budget.monthlyBudget}</span>
                          </div>
                        </div>

                        {/* Model Tiers */}
                        <div className="pt-3 border-t border-slate-800 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-purple-400">Premium</span>
                            <span className="text-slate-300">${budget.modelTiers.premium.spent}/${budget.modelTiers.premium.limit}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-cyan-400">Standard</span>
                            <span className="text-slate-300">${budget.modelTiers.standard.spent}/${budget.modelTiers.standard.limit}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-emerald-400">Economy</span>
                            <span className="text-slate-300">${budget.modelTiers.economy.spent}/${budget.modelTiers.economy.limit}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-3 border-t border-slate-800 flex items-center gap-2">
                          <Badge variant="outline" className="text-xs border-slate-700 text-slate-400">
                            {budget.onBudgetExceeded === 'pause' ? '⏸️ Pause' :
                             budget.onBudgetExceeded === 'downgrade' ? '⬇️ Downgrade' :
                             budget.onBudgetExceeded === 'notify' ? '🔔 Notify' : '⬆️ Escalate'}
                          </Badge>
                          {budget.hardLimit && (
                            <Badge variant="outline" className="text-xs border-red-500/30 text-red-400">
                              Hard Limit
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="trends" className="mt-0 space-y-6">
              {/* Mock cost trend data for demonstration */}
              {(() => {
                const mockTrendData = Array.from({ length: 30 }, (_, i) => {
                  const date = new Date();
                  date.setDate(date.getDate() - (30 - i));
                  const baseCost = 50 + Math.random() * 40;
                  const variation = Math.random() > 0.9 ? 30 : 0; // 10% chance of spike
                  return {
                    date: date.toISOString().split('T')[0],
                    cost: Math.round((baseCost + variation) * 100) / 100,
                  };
                });

                const costs = mockTrendData.map(d => d.cost);
                const forecast = calculateEMAForecast(costs, 7, 0.3);
                const trendAnalysis = analyzeCostTrend(mockTrendData);

                return (
                  <>
                    {/* Forecast Card */}
                    <div className="holo-card p-6">
                      <CostForecast
                        data={trendAnalysis.map(t => ({
                          date: t.date,
                          actual: t.cost,
                          forecast: forecast.forecastedValue,
                          upper95: forecast.upper95,
                          lower95: forecast.lower95,
                        }))}
                        projectedMonthlySpend={forecast.forecastedValue * 30}
                        budget={getTotalTeamBudget.total}
                        daysRemaining={30 - new Date().getDate()}
                        confidence={forecast.confidence}
                      />
                    </div>

                    {/* Cost Trend with Anomalies */}
                    <div className="holo-card p-6">
                      <h3 className="text-lg font-semibold text-white mb-4">30-Day Cost Trend</h3>
                      <CostTrendGraph
                        data={trendAnalysis}
                        height={300}
                        showForecast
                        showAnomalies
                      />
                    </div>

                    {/* Anomaly Alerts */}
                    {trendAnalysis.some(t => t.isAnomaly) && (
                      <div className="space-y-3">
                        <h3 className="text-lg font-semibold text-white">Cost Anomalies Detected</h3>
                        {trendAnalysis.filter(t => t.isAnomaly).map((trend, idx) => {
                          const avgCost = costs.reduce((a, b) => a + b) / costs.length;
                          const anomaly = detectAnomaly(trend.cost, costs.slice(0, -1));
                          return (
                            <div key={idx}>
                              <AnomalyMarker
                                severity={anomaly.severity}
                                value={trend.cost}
                                baseline={avgCost}
                                zScore={anomaly.zScore}
                                explanation={anomaly.explanation}
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                );
              })()}
            </TabsContent>

            <TabsContent value="alerts" className="mt-0">
              <div className="max-w-4xl mx-auto space-y-4">
                {alerts.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                    <p className="text-lg text-white">No budget alerts</p>
                    <p className="text-slate-400">All agents are within budget limits</p>
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={cn(
                        "holo-card p-4 flex items-start gap-4",
                        alert.acknowledged && "opacity-50"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                        alert.type === 'critical' ? "bg-red-500/20 text-red-400" :
                        alert.type === 'warning' ? "bg-orange-500/20 text-orange-400" :
                        "bg-yellow-500/20 text-yellow-400"
                      )}>
                        <AlertTriangle className="w-5 h-5" />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-white">{getAgentName(alert.agentId)}</span>
                          <Badge variant="outline" className={cn(
                            "text-xs capitalize",
                            alert.type === 'critical' ? "border-red-500/30 text-red-400" :
                            alert.type === 'warning' ? "border-orange-500/30 text-orange-400" :
                            "border-yellow-500/30 text-yellow-400"
                          )}>
                            {alert.type}
                          </Badge>
                          <span className="text-xs text-slate-500">
                            {new Date(alert.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-slate-300">{alert.message}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span className="text-slate-400">
                            Spent: <span className="text-white">${alert.currentSpend.toFixed(2)}</span>
                          </span>
                          <span className="text-slate-400">
                            Limit: <span className="text-white">${alert.budgetLimit}</span>
                          </span>
                          <span className={getBudgetStatus(alert.percentage)}>
                            {alert.percentage.toFixed(1)}% used
                          </span>
                        </div>
                      </div>

                      {!alert.acknowledged && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-slate-700 text-slate-300"
                          onClick={() => acknowledgeAlert(alert.id)}
                        >
                          Acknowledge
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Budget Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-slate-950 border-slate-800 max-w-lg max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-emerald-400" />
              Edit Budget: {editingBudget && getAgentName(editingBudget.agentId)}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Configure budget limits, alerts, and auto-actions
            </DialogDescription>
          </DialogHeader>

          {editingBudget && (
            <div className="space-y-6">
              {/* Monthly Budget */}
              <div className="space-y-2">
                <label className="text-sm text-slate-300">Monthly Budget (USD)</label>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-700"
                    onClick={() => updateEditingField('monthlyBudget', Math.max(0, editingBudget.monthlyBudget - 10))}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <Input
                    type="number"
                    value={editingBudget.monthlyBudget}
                    onChange={(e) => updateEditingField('monthlyBudget', parseFloat(e.target.value) || 0)}
                    className="bg-slate-900 border-slate-700 text-white text-center"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-700"
                    onClick={() => updateEditingField('monthlyBudget', editingBudget.monthlyBudget + 10)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Alert Threshold */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-slate-300">Alert Threshold</label>
                  <span className="text-sm text-emerald-400">{editingBudget.alertThreshold}%</span>
                </div>
                <Slider
                  value={[editingBudget.alertThreshold]}
                  onValueChange={([value]) => updateEditingField('alertThreshold', value)}
                  min={50}
                  max={100}
                  step={5}
                  className="w-full"
                />
                <p className="text-xs text-slate-500">
                  Alert when budget reaches {editingBudget.alertThreshold}% of limit
                </p>
              </div>

              {/* Hard Limit Toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50">
                <div>
                  <p className="text-sm text-slate-300">Hard Limit</p>
                  <p className="text-xs text-slate-500">Stop agent when budget exceeded</p>
                </div>
                <Switch
                  checked={editingBudget.hardLimit}
                  onCheckedChange={(checked) => updateEditingField('hardLimit', checked)}
                />
              </div>

              {/* Rollover Toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50">
                <div>
                  <p className="text-sm text-slate-300">Enable Rollover</p>
                  <p className="text-xs text-slate-500">Unused budget carries to next month</p>
                </div>
                <Switch
                  checked={editingBudget.rolloverEnabled}
                  onCheckedChange={(checked) => updateEditingField('rolloverEnabled', checked)}
                />
              </div>

              {/* Auto-Action */}
              <div className="space-y-2">
                <label className="text-sm text-slate-300">Action on Budget Exceeded</label>
                <Select
                  value={editingBudget.onBudgetExceeded}
                  onValueChange={(value) => updateEditingField('onBudgetExceeded', value)}
                >
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

              {/* Model Tier Budgets */}
              <div className="space-y-3">
                <label className="text-sm text-slate-300">Model Tier Budgets</label>
                
                <div className="p-3 rounded-lg bg-slate-900/50 space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-purple-400">Premium (GPT-4, Claude Opus)</span>
                      <span className="text-xs text-slate-400">${editingBudget.modelTiers.premium.limit}</span>
                    </div>
                    <Input
                      type="number"
                      value={editingBudget.modelTiers.premium.limit}
                      onChange={(e) => updateModelTier('premium', 'limit', parseFloat(e.target.value) || 0)}
                      className="bg-slate-800 border-slate-700 text-white h-8"
                    />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-cyan-400">Standard (GPT-3.5, Claude Sonnet)</span>
                      <span className="text-xs text-slate-400">${editingBudget.modelTiers.standard.limit}</span>
                    </div>
                    <Input
                      type="number"
                      value={editingBudget.modelTiers.standard.limit}
                      onChange={(e) => updateModelTier('standard', 'limit', parseFloat(e.target.value) || 0)}
                      className="bg-slate-800 border-slate-700 text-white h-8"
                    />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-emerald-400">Economy (Local models)</span>
                      <span className="text-xs text-slate-400">${editingBudget.modelTiers.economy.limit}</span>
                    </div>
                    <Input
                      type="number"
                      value={editingBudget.modelTiers.economy.limit}
                      onChange={(e) => updateModelTier('economy', 'limit', parseFloat(e.target.value) || 0)}
                      className="bg-slate-800 border-slate-700 text-white h-8"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              className="border-slate-700 text-slate-300"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSaveBudget}
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
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

export default BudgetPage;
