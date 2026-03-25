import { ChevronRight, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProjectCardProps {
  id: string;
  name: string;
  agentCount: number;
  running: number;
  paused: number;
  idle: number;
  failed: number;
  costMTD: number;
  costTrend?: { direction: 'up' | 'down'; percent: number };
  lastActivity?: string;
  status: 'healthy' | 'warning' | 'critical' | 'idle';
  onClick?: () => void;
  onHover?: (hovered: boolean) => void;
}

const statusConfig = {
  healthy: {
    bg: 'from-emerald-950 to-emerald-900',
    border: 'border-emerald-700',
    badge: 'bg-emerald-500/20 text-emerald-300',
    label: 'Healthy',
  },
  warning: {
    bg: 'from-amber-950 to-amber-900',
    border: 'border-amber-700',
    badge: 'bg-amber-500/20 text-amber-300',
    label: 'Warning',
  },
  critical: {
    bg: 'from-red-950 to-red-900',
    border: 'border-red-700',
    badge: 'bg-red-500/20 text-red-300',
    label: 'Critical',
  },
  idle: {
    bg: 'from-slate-950 to-slate-900',
    border: 'border-slate-700',
    badge: 'bg-slate-500/20 text-slate-300',
    label: 'Idle',
  },
};

export function ProjectCard({
  name,
  agentCount,
  running,
  paused,
  idle,
  failed,
  costMTD,
  costTrend,
  lastActivity,
  status,
  onClick,
  onHover,
}: ProjectCardProps) {
  const config = statusConfig[status];
  const failureRate = agentCount > 0 ? (failed / agentCount) * 100 : 0;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
      className={cn(
        'group relative overflow-hidden rounded-lg border p-4 text-left',
        'transition-all duration-300 hover:shadow-lg hover:-translate-y-1',
        'bg-gradient-to-br',
        config.bg,
        config.border,
      )}
    >
      {/* Background glow effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity bg-gradient-to-br from-current to-transparent pointer-events-none" />

      {/* Content */}
      <div className="relative z-10">
        {/* Header with name and status badge */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-100">{name}</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {agentCount} {agentCount === 1 ? 'agent' : 'agents'}
            </p>
          </div>
          <span
            className={cn(
              'px-2 py-1 rounded text-xs font-medium whitespace-nowrap',
              config.badge,
            )}
          >
            {config.label}
          </span>
        </div>

        {/* Agent status breakdown */}
        <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
          <div>
            <span className="text-slate-400">Running:</span>
            <span className="ml-2 font-semibold text-emerald-300">{running}</span>
          </div>
          <div>
            <span className="text-slate-400">Idle:</span>
            <span className="ml-2 font-semibold text-slate-300">{idle}</span>
          </div>
          <div>
            <span className="text-slate-400">Paused:</span>
            <span className="ml-2 font-semibold text-amber-300">{paused}</span>
          </div>
          <div>
            <span className="text-slate-400">Failed:</span>
            <span className={cn('ml-2 font-semibold', failureRate > 0 ? 'text-red-300' : 'text-slate-300')}>
              {failed}
            </span>
          </div>
        </div>

        {/* Cost section */}
        <div className="bg-slate-900/50 rounded px-2 py-2 mb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <DollarSign className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-400">MTD Cost:</span>
            </div>
            <span className="font-mono font-semibold text-slate-100">${costMTD.toFixed(2)}</span>
          </div>

          {costTrend && (
            <div className="flex items-center gap-1 mt-1 text-xs">
              {costTrend.direction === 'up' ? (
                <TrendingUp className="w-3 h-3 text-red-400" />
              ) : (
                <TrendingDown className="w-3 h-3 text-emerald-400" />
              )}
              <span className={costTrend.direction === 'up' ? 'text-red-300' : 'text-emerald-300'}>
                {costTrend.direction === 'up' ? '+' : '-'}
                {costTrend.percent}% trend
              </span>
            </div>
          )}
        </div>

        {/* Footer with activity and drill-down */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">
            {lastActivity ? `Last activity: ${lastActivity}` : 'No recent activity'}
          </span>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-300 group-hover:translate-x-1 transition-all" />
        </div>
      </div>
    </button>
  );
}
