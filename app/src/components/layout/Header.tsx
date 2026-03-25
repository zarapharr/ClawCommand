import { cn } from '@/lib/utils';
import { Menu, Bell, User, Zap, Cpu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { SystemMetrics } from '@/types';

interface HeaderProps {
  onToggleSidebar: () => void;
  isSidebarOpen?: boolean;
  metrics: SystemMetrics;
  agentCount: { online: number; total: number };
}

export function Header({ onToggleSidebar, metrics, agentCount }: HeaderProps) {
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <header className="h-16 bg-slate-950/80 backdrop-blur-sm border-b border-slate-800/50 flex items-center justify-between px-4 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="text-slate-400 hover:text-white hover:bg-slate-800/50"
        >
          <Menu className="w-5 h-5" />
        </Button>

        {/* Stats */}
        <div className="hidden md:flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/50 border border-slate-800/50">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span className="text-xs text-slate-400">CPU</span>
            <span className="text-sm font-medium text-white">{metrics.cpu.usage.toFixed(1)}%</span>
          </div>
          
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/50 border border-slate-800/50">
            <Zap className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-slate-400">Agents</span>
            <span className="text-sm font-medium text-white">{agentCount.online}/{agentCount.total}</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/50 border border-slate-800/50">
            <span className="text-xs text-slate-400">Uptime</span>
            <span className="text-sm font-medium text-white">{formatUptime(metrics.gateway.uptime)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Gateway Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/50 border border-slate-800/50">
          <span className={cn(
            'w-2 h-2 rounded-full',
            metrics.gateway.status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
          )} />
          <span className={cn(
            'text-xs',
            metrics.gateway.status === 'online' ? 'text-emerald-400' : 'text-red-400'
          )}>
            Gateway {metrics.gateway.status}
          </span>
        </div>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative text-slate-400 hover:text-white hover:bg-slate-800/50">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-cyan-400 rounded-full" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 bg-slate-900 border-slate-800">
            <DropdownMenuLabel className="text-white">Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-800" />
            <div className="p-4 text-center text-slate-400 text-sm">
              No new notifications
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-800/50">
              <User className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-slate-900 border-slate-800">
            <DropdownMenuLabel className="text-white">My Account</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-800" />
            <DropdownMenuItem className="text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer">
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer">
              Preferences
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-800" />
            <DropdownMenuItem className="text-red-400 hover:text-red-300 hover:bg-slate-800 cursor-pointer">
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
