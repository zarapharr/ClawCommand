import { useState } from 'react';
import { 
  BarChart3, TrendingUp, Users, Clock, DollarSign, 
  Activity, Cpu, Target
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { useAnalyticsStore } from '../stores/enterprise-store';

const COLORS = ['#00f0ff', '#a855f7', '#22c55e', '#f59e0b', '#ef4444'];

export default function AnalyticsPage() {
  const { costAnalytics, performanceAnalytics, collaborationMetrics } = useAnalyticsStore();
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('7d');
  const [activeTab, setActiveTab] = useState<'overview' | 'cost' | 'performance' | 'collaboration'>('overview');

  const agentPerformanceData = performanceAnalytics?.responseTimeHeatmap.map(agent => ({
    name: agent.agentId,
    responseTime: agent.averageMs / 1000,
  })) || [];

  const modelUsageData = costAnalytics?.modelDistribution.map(model => ({
    name: model.modelName,
    value: model.percentage,
  })) || [];

  const costTrendData = [
    { date: 'Mon', cost: 45 },
    { date: 'Tue', cost: 52 },
    { date: 'Wed', cost: 38 },
    { date: 'Thu', cost: 65 },
    { date: 'Fri', cost: 48 },
    { date: 'Sat', cost: 32 },
    { date: 'Sun', cost: 28 },
  ];

  const performanceTrendData = [
    { date: 'Mon', responseTime: 1.2, throughput: 45 },
    { date: 'Tue', responseTime: 1.1, throughput: 52 },
    { date: 'Wed', responseTime: 1.3, throughput: 38 },
    { date: 'Thu', responseTime: 1.0, throughput: 65 },
    { date: 'Fri', responseTime: 1.2, throughput: 48 },
    { date: 'Sat', responseTime: 0.9, throughput: 32 },
    { date: 'Sun', responseTime: 0.8, throughput: 28 },
  ];

  const skillEffectivenessData = [
    { skill: 'Coding', effectiveness: 92, efficiency: 88 },
    { skill: 'Research', effectiveness: 85, efficiency: 90 },
    { skill: 'Writing', effectiveness: 88, efficiency: 85 },
    { skill: 'Analysis', effectiveness: 90, efficiency: 87 },
    { skill: 'Design', effectiveness: 78, efficiency: 82 },
    { skill: 'Testing', effectiveness: 95, efficiency: 92 },
  ];

  const totalCost = costAnalytics?.burnRate?.currentMonthlySpend || 0;
  const avgResponseTime = performanceAnalytics?.responseTimeHeatmap[0]?.averageMs ? performanceAnalytics.responseTimeHeatmap[0].averageMs / 1000 : 0;
  const totalMessages = performanceAnalytics?.toolUsage?.reduce((acc, t) => acc + t.usageCount, 0) || 0;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-100">Analytics Dashboard</h1>
            <p className="text-sm text-slate-400">Comprehensive insights into your OpenClaw instance</p>
          </div>
        </div>
        <div className="flex items-center gap-1 p-1 bg-slate-800/50 rounded-lg">
          {(['24h', '7d', '30d', '90d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 rounded text-sm transition-colors ${
                timeRange === range ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex items-center gap-1 px-4 border-b border-slate-800/50">
        {[
          { id: 'overview', label: 'Overview', icon: Activity },
          { id: 'cost', label: 'Cost Analysis', icon: DollarSign },
          { id: 'performance', label: 'Performance', icon: TrendingUp },
          { id: 'collaboration', label: 'Collaboration', icon: Users },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === tab.id ? 'text-cyan-400 border-cyan-400' : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              <div className="holo-card p-5 rounded-xl">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Monthly Cost</p>
                    <p className="text-2xl font-bold text-slate-100">${totalCost.toFixed(2)}</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-cyan-400" />
                  </div>
                </div>
              </div>
              <div className="holo-card p-5 rounded-xl">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Avg Response Time</p>
                    <p className="text-2xl font-bold text-slate-100">{avgResponseTime.toFixed(2)}s</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-purple-400" />
                  </div>
                </div>
              </div>
              <div className="holo-card p-5 rounded-xl">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Tool Usage</p>
                    <p className="text-2xl font-bold text-slate-100">{totalMessages.toLocaleString()}</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <Target className="w-6 h-6 text-green-400" />
                  </div>
                </div>
              </div>
              <div className="holo-card p-5 rounded-xl">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Active Agents</p>
                    <p className="text-2xl font-bold text-slate-100">{performanceAnalytics?.responseTimeHeatmap.length || 0}</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <Cpu className="w-6 h-6 text-amber-400" />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="holo-card p-6 rounded-xl">
                <h3 className="text-lg font-medium text-slate-200 mb-4">Cost Trend</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={costTrendData}>
                      <defs>
                        <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#00f0ff" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#475569" />
                      <YAxis tick={{ fontSize: 12 }} stroke="#475569" />
                      <RechartsTooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b' }} />
                      <Area type="monotone" dataKey="cost" stroke="#00f0ff" fill="url(#costGradient)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="holo-card p-6 rounded-xl">
                <h3 className="text-lg font-medium text-slate-200 mb-4">Performance Trend</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={performanceTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#475569" />
                      <YAxis tick={{ fontSize: 12 }} stroke="#475569" />
                      <RechartsTooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b' }} />
                      <Line type="monotone" dataKey="responseTime" stroke="#a855f7" strokeWidth={2} name="Response Time" />
                      <Line type="monotone" dataKey="throughput" stroke="#22c55e" strokeWidth={2} name="Throughput" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="holo-card p-6 rounded-xl">
                <h3 className="text-lg font-medium text-slate-200 mb-4">Response Time by Agent</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={agentPerformanceData.slice(0, 5)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 12 }} stroke="#475569" />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} stroke="#475569" width={80} />
                      <RechartsTooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b' }} />
                      <Bar dataKey="responseTime" fill="#00f0ff" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="holo-card p-6 rounded-xl">
                <h3 className="text-lg font-medium text-slate-200 mb-4">Model Usage Distribution</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={modelUsageData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                        {modelUsageData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap justify-center gap-3 mt-2">
                  {modelUsageData.map((item, index) => (
                    <div key={item.name} className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full" style={{ background: COLORS[index % COLORS.length] }} />
                      <span className="text-xs text-slate-400">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'cost' && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="holo-card p-5 rounded-xl">
                <p className="text-sm text-slate-500">Current Monthly</p>
                <p className="text-2xl font-bold text-slate-100">${costAnalytics?.burnRate?.currentMonthlySpend.toFixed(2) || '0.00'}</p>
              </div>
              <div className="holo-card p-5 rounded-xl">
                <p className="text-sm text-slate-500">Projected Monthly</p>
                <p className="text-2xl font-bold text-slate-100">${costAnalytics?.burnRate?.projectedMonthlySpend.toFixed(2) || '0.00'}</p>
              </div>
              <div className="holo-card p-5 rounded-xl">
                <p className="text-sm text-slate-500">Days Until Exhausted</p>
                <p className="text-2xl font-bold text-slate-100">{costAnalytics?.burnRate?.daysUntilBudgetExhausted || 0}</p>
              </div>
            </div>
            <div className="holo-card p-6 rounded-xl">
              <h3 className="text-lg font-medium text-slate-200 mb-4">Cost by Agent</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={costAnalytics?.agentCosts || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="agentName" tick={{ fontSize: 12 }} stroke="#475569" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#475569" />
                    <RechartsTooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b' }} />
                    <Bar dataKey="monthlyCost" fill="#00f0ff" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              <div className="holo-card p-5 rounded-xl text-center">
                <p className="text-3xl font-bold text-cyan-400">{(performanceAnalytics?.successRate?.overall || 0).toFixed(1)}%</p>
                <p className="text-sm text-slate-500 mt-1">Success Rate</p>
              </div>
              <div className="holo-card p-5 rounded-xl text-center">
                <p className="text-3xl font-bold text-purple-400">{performanceAnalytics?.sessionDuration?.averageSeconds || 0}s</p>
                <p className="text-sm text-slate-500 mt-1">Avg Session</p>
              </div>
              <div className="holo-card p-5 rounded-xl text-center">
                <p className="text-3xl font-bold text-green-400">{performanceAnalytics?.toolUsage?.length || 0}</p>
                <p className="text-sm text-slate-500 mt-1">Tools Used</p>
              </div>
              <div className="holo-card p-5 rounded-xl text-center">
                <p className="text-3xl font-bold text-amber-400">{performanceAnalytics?.responseTimeHeatmap?.length || 0}</p>
                <p className="text-sm text-slate-500 mt-1">Active Agents</p>
              </div>
            </div>
            <div className="holo-card p-6 rounded-xl">
              <h3 className="text-lg font-medium text-slate-200 mb-4">Skill Effectiveness</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={skillEffectivenessData}>
                    <PolarGrid stroke="#1e293b" />
                    <PolarAngleAxis dataKey="skill" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                    <Radar name="Effectiveness" dataKey="effectiveness" stroke="#00f0ff" fill="#00f0ff" fillOpacity={0.3} />
                    <Radar name="Efficiency" dataKey="efficiency" stroke="#a855f7" fill="#a855f7" fillOpacity={0.3} />
                    <RechartsTooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'collaboration' && (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              <div className="holo-card p-5 rounded-xl text-center">
                <p className="text-3xl font-bold text-cyan-400">{collaborationMetrics?.interAgentMessages?.length || 0}</p>
                <p className="text-sm text-slate-500 mt-1">Inter-Agent Messages</p>
              </div>
              <div className="holo-card p-5 rounded-xl text-center">
                <p className="text-3xl font-bold text-purple-400">{(collaborationMetrics?.handoffSuccessRate || 0).toFixed(1)}%</p>
                <p className="text-sm text-slate-500 mt-1">Handoff Success</p>
              </div>
              <div className="holo-card p-5 rounded-xl text-center">
                <p className="text-3xl font-bold text-green-400">{collaborationMetrics?.conflictsResolved || 0}</p>
                <p className="text-sm text-slate-500 mt-1">Conflicts Resolved</p>
              </div>
              <div className="holo-card p-5 rounded-xl text-center">
                <p className="text-3xl font-bold text-amber-400">{collaborationMetrics?.totalHandoffs || 0}</p>
                <p className="text-sm text-slate-500 mt-1">Total Handoffs</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
