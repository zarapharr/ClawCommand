import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { FactoryFloorPage } from '@/pages/FactoryFloorPage';
import { AgentsPage } from '@/pages/AgentsPage';
import { SkillsPage } from '@/pages/SkillsPage';
import { TasksPage } from '@/pages/TasksPage';
import { SessionsPage } from '@/pages/SessionsPage';
import { CronPage } from '@/pages/CronPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { LogsPage } from '@/pages/LogsPage';
import { BudgetPage } from '@/pages/BudgetPage';
import { ChannelsPage } from '@/pages/ChannelsPage';
import { ToolsPage } from '@/pages/ToolsPage';
import { ModelsPage } from '@/pages/ModelsPage';
import { AgentChatPage } from '@/pages/AgentChatPage';
import { AgentSwarmPage } from '@/pages/AgentSwarmPage';
import { VoicePage } from '@/pages/VoicePage';
import { QMDPage } from '@/pages/QMDPage';
import WorkflowPage from '@/pages/WorkflowPage';
import RoutingPage from '@/pages/RoutingPage';
import AnalyticsPage from '@/pages/AnalyticsPage';
import type { ViewType, SystemMetrics } from '@/types';
import { mockSystemMetrics, mockAgents } from '@/data/mock-data';
import { cn } from '@/lib/utils';

// Placeholder pages for features not yet implemented
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

function MemoryPage() {
  return (
    <PlaceholderPage 
      title="Memory Explorer" 
      icon={null}
      description="Search and manage agent memories and context."
    />
  );
}

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('factory-floor');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [metrics, setMetrics] = useState<SystemMetrics>(mockSystemMetrics);

  // Simulate real-time metrics updates
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
      default:
        return <FactoryFloorPage />;
    }
  };

  const onlineAgents = mockAgents.filter(a => a.status !== 'offline').length;

  return (
    <div className="h-screen bg-slate-950 text-white overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute inset-0 tron-grid opacity-30" />
      </div>

      {/* Sidebar */}
      <Sidebar 
        currentView={currentView} 
        onNavigate={setCurrentView}
        isOpen={isSidebarOpen}
      />

      {/* Main Content */}
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
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

export default App;
