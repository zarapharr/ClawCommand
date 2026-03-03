import { lazy, Suspense, useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import type { ViewType, SystemMetrics } from '@/types';
import { mockSystemMetrics, mockAgents } from '@/data/mock-data';
import { cn } from '@/lib/utils';

const FactoryFloorPage = lazy(() => import('@/pages/FactoryFloorPage').then((m) => ({ default: m.FactoryFloorPage })));
const AgentsPage = lazy(() => import('@/pages/AgentsPage').then((m) => ({ default: m.AgentsPage })));
const SkillsPage = lazy(() => import('@/pages/SkillsPage').then((m) => ({ default: m.SkillsPage })));
const TasksPage = lazy(() => import('@/pages/TasksPage').then((m) => ({ default: m.TasksPage })));
const SessionsPage = lazy(() => import('@/pages/SessionsPage').then((m) => ({ default: m.SessionsPage })));
const CronPage = lazy(() => import('@/pages/CronPage').then((m) => ({ default: m.CronPage })));
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const LogsPage = lazy(() => import('@/pages/LogsPage').then((m) => ({ default: m.LogsPage })));
const BudgetPage = lazy(() => import('@/pages/BudgetPage').then((m) => ({ default: m.BudgetPage })));
const ChannelsPage = lazy(() => import('@/pages/ChannelsPage').then((m) => ({ default: m.ChannelsPage })));
const ToolsPage = lazy(() => import('@/pages/ToolsPage').then((m) => ({ default: m.ToolsPage })));
const ModelsPage = lazy(() => import('@/pages/ModelsPage').then((m) => ({ default: m.ModelsPage })));
const AgentChatPage = lazy(() => import('@/pages/AgentChatPage').then((m) => ({ default: m.AgentChatPage })));
const AgentSwarmPage = lazy(() => import('@/pages/AgentSwarmPage').then((m) => ({ default: m.AgentSwarmPage })));
const VoicePage = lazy(() => import('@/pages/VoicePage').then((m) => ({ default: m.VoicePage })));
const QMDPage = lazy(() => import('@/pages/QMDPage').then((m) => ({ default: m.QMDPage })));
const MemoryPage = lazy(() => import('@/pages/MemoryPage').then((m) => ({ default: m.MemoryPage })));
const MissionControlDemoPage = lazy(() => import('@/pages/MissionControlDemoPage').then((m) => ({ default: m.MissionControlDemoPage })));
const WorkflowPage = lazy(() => import('@/pages/WorkflowPage'));
const RoutingPage = lazy(() => import('@/pages/RoutingPage'));
const AnalyticsPage = lazy(() => import('@/pages/AnalyticsPage'));

function PlaceholderPage({ title, description }: { title: string; icon: unknown; description: string }) {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <div className="w-20 h-20 rounded-2xl bg-slate-800/50 border border-slate-700 flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">🔧</span>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
        <p className="text-slate-400 max-w-md mx-auto">{description}</p>
        <p className="text-sm text-slate-500 mt-4">Coming in v1.2</p>
      </div>
    </div>
  );
}

function WorkspacePage() {
  return (
    <PlaceholderPage
      title="Workspace"
      icon={null}
      description="File browser and editor for AGENTS.md, SOUL.md, TOOLS.md, and other configuration files."
    />
  );
}

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('factory-floor');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [metrics, setMetrics] = useState<SystemMetrics>(mockSystemMetrics);

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        cpu: {
          usage: Math.max(10, Math.min(90, prev.cpu.usage + (Math.random() - 0.5) * 10)),
          temperature: prev.cpu.temperature ? Math.max(40, Math.min(80, prev.cpu.temperature + (Math.random() - 0.5) * 2)) : undefined,
        },
        gateway: {
          ...prev.gateway,
          uptime: prev.gateway.uptime + 1,
        },
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const renderPage = () => {
    switch (currentView) {
      case 'factory-floor':
        return <FactoryFloorPage />;
      case 'agents':
        return <AgentsPage />;
      case 'skills':
        return <SkillsPage />;
      case 'tasks':
        return <TasksPage />;
      case 'sessions':
        return <SessionsPage />;
      case 'cron':
        return <CronPage />;
      case 'settings':
        return <SettingsPage />;
      case 'logs':
        return <LogsPage />;
      case 'workspace':
        return <WorkspacePage />;
      case 'models':
        return <ModelsPage />;
      case 'channels':
        return <ChannelsPage />;
      case 'tools':
        return <ToolsPage />;
      case 'memory':
        return <MemoryPage />;
      case 'budget':
        return <BudgetPage />;
      case 'workflows':
        return <WorkflowPage />;
      case 'routing':
        return <RoutingPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'agent-chat':
        return <AgentChatPage />;
      case 'agent-swarm':
        return <AgentSwarmPage />;
      case 'voice':
        return <VoicePage />;
      case 'qmd':
        return <QMDPage />;
      case 'mission-control-demo':
        return <MissionControlDemoPage />;
      default:
        return <FactoryFloorPage />;
    }
  };

  const onlineAgents = mockAgents.filter(a => a.status !== 'offline').length;

  return (
    <div className="h-screen bg-slate-950 text-white overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute inset-0 tron-grid opacity-30" />
      </div>

      <Sidebar
        currentView={currentView}
        onNavigate={setCurrentView}
        isOpen={isSidebarOpen}
      />

      <div
        className={cn(
          'h-full flex flex-col transition-all duration-300',
          isSidebarOpen ? 'ml-64' : 'ml-16'
        )}
      >
        <Header
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
          metrics={metrics}
          agentCount={{ online: onlineAgents, total: mockAgents.length }}
        />

        <main className="flex-1 overflow-hidden relative">
          <Suspense fallback={<div className="h-full flex items-center justify-center text-slate-400">Loading view...</div>}>
            {renderPage()}
          </Suspense>
        </main>
      </div>
    </div>
  );
}

export default App;
