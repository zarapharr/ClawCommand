import { cn } from '@/lib/utils';
import type { ViewType } from '@/types';
import { 
  Factory, Users, Wrench, ClipboardList, MessageSquare, 
  FolderOpen, Clock, Brain, Radio, Settings, Activity, Terminal,
  DollarSign, GitBranch, Route, BarChart3, Network, Volume2, Database
} from 'lucide-react';

interface SidebarProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  isOpen: boolean;
}

interface NavItem {
  id: ViewType;
  label: string;
  icon: typeof Factory;
  badge?: number;
}

const navItems: NavItem[] = [
  { id: 'factory-floor', label: 'Factory Floor', icon: Factory },
  { id: 'agents', label: 'Agent Command', icon: Users },
  { id: 'agent-chat', label: 'Agent Chat', icon: MessageSquare },
  { id: 'agent-swarm', label: 'Agent Swarm', icon: Network },
  { id: 'voice', label: 'Voice Hub', icon: Volume2 },
  { id: 'qmd', label: 'QMD Analytics', icon: Database },
  { id: 'skills', label: 'Skills Forge', icon: Wrench },
  { id: 'tasks', label: 'Task Command', icon: ClipboardList },
  { id: 'sessions', label: 'Session Center', icon: MessageSquare },
  { id: 'workflows', label: 'Workflow Builder', icon: GitBranch },
  { id: 'routing', label: 'Model Routing', icon: Route },
  { id: 'budget', label: 'Budget Control', icon: DollarSign },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'workspace', label: 'Workspace', icon: FolderOpen },
  { id: 'cron', label: 'Cron Scheduler', icon: Clock },
  { id: 'models', label: 'Model Manager', icon: Brain },
  { id: 'channels', label: 'Channel Hub', icon: Radio },
  { id: 'tools', label: 'Tool Config', icon: Terminal },
  { id: 'logs', label: 'System Monitor', icon: Activity },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ currentView, onNavigate, isOpen }: SidebarProps) {
  return (
    <aside 
      className={cn(
        'fixed left-0 top-0 h-full bg-slate-950/95 backdrop-blur-xl border-r border-slate-800/50 z-40',
        'transition-all duration-300 ease-in-out',
        isOpen ? 'w-64' : 'w-16'
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
            <span className="text-lg">🦞</span>
          </div>
          {isOpen && (
            <div>
              <h1 className="text-sm font-bold text-white">
                <span className="text-cyan-400">Claw</span>Command
              </h1>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav 
        className="p-2 space-y-1 overflow-y-auto custom-scrollbar" 
        style={{ height: 'calc(100% - 64px)' }}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                'hover:bg-slate-800/50 group relative',
                isActive && 'bg-cyan-500/10 border border-cyan-500/30',
                !isOpen && 'justify-center px-2'
              )}
            >
              <Icon 
                className={cn(
                  'w-5 h-5 flex-shrink-0 transition-colors',
                  isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-cyan-400'
                )} 
              />
              
              {isOpen && (
                <span 
                  className={cn(
                    'text-sm transition-colors',
                    isActive ? 'text-cyan-400 font-medium' : 'text-slate-300 group-hover:text-white'
                  )}
                >
                  {item.label}
                </span>
              )}

              {/* Active indicator */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-cyan-400 rounded-r-full" />
              )}

              {/* Tooltip for collapsed state */}
              {!isOpen && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 rounded text-xs text-white opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
