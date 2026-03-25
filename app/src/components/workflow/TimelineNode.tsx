import { CheckCircle2, Circle, AlertCircle, Loader, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export type NodeStatus = 'pending' | 'running' | 'complete' | 'failed';
export type NodeType = 'agent' | 'decision' | 'tool' | 'parallel' | 'sequential';

interface TimelineNodeProps {
  id: string;
  title: string;
  type: NodeType;
  status: NodeStatus;
  position: number; // 0-1 for positioning in timeline
  onClick?: () => void;
  isSelected?: boolean;
  showDetails?: boolean;
  duration?: number; // milliseconds
}

const typeColors = {
  agent: 'bg-cyan-500',
  decision: 'bg-purple-500',
  tool: 'bg-amber-500',
  parallel: 'bg-pink-500',
  sequential: 'bg-blue-500',
};

const statusConfig = {
  pending: {
    icon: Circle,
    iconClass: 'text-slate-400',
    pulseClass: 'animate-pulse',
    ringColor: 'ring-slate-500',
    label: 'Pending',
  },
  running: {
    icon: Loader,
    iconClass: 'text-blue-400 animate-spin',
    pulseClass: 'animate-pulse',
    ringColor: 'ring-blue-500',
    label: 'Running',
  },
  complete: {
    icon: CheckCircle2,
    iconClass: 'text-emerald-400',
    pulseClass: '',
    ringColor: 'ring-emerald-500',
    label: 'Complete',
  },
  failed: {
    icon: AlertCircle,
    iconClass: 'text-red-400',
    pulseClass: 'animate-pulse',
    ringColor: 'ring-red-500',
    label: 'Failed',
  },
};

export function TimelineNode({
  title,
  type,
  status,
  onClick,
  isSelected = false,
  duration,
}: TimelineNodeProps) {
  const statusInfo = statusConfig[status];
  const StatusIcon = statusInfo.icon;

  return (
    <div
      className="flex flex-col items-center cursor-pointer group"
      style={{ flex: `0 0 calc(100% / 6)` }}
    >
      {/* Node bubble */}
      <button
        onClick={onClick}
        className={cn(
          'relative w-16 h-16 rounded-full border-2 flex items-center justify-center',
          'transition-all duration-300 hover:scale-110',
          isSelected && 'ring-2 ring-offset-2 ring-offset-slate-900',
          typeColors[type],
          statusInfo.ringColor,
          isSelected ? 'ring-2' : 'ring-0',
        )}
      >
        {/* Status icon */}
        <StatusIcon className={cn('w-8 h-8 text-white', statusInfo.iconClass)} />

        {/* Pulse ring for active states */}
        {status === 'running' && (
          <div className={cn(
            'absolute inset-0 rounded-full border-2',
            statusInfo.ringColor,
            'animate-pulse opacity-50'
          )} />
        )}
      </button>

      {/* Title and metadata */}
      <div className="mt-3 text-center w-full px-1">
        <p className={cn(
          'text-xs font-medium line-clamp-2 transition-colors',
          isSelected ? 'text-slate-100' : 'text-slate-300 group-hover:text-slate-200'
        )}>
          {title}
        </p>
        <p className="text-xs text-slate-500 mt-0.5">
          {statusInfo.label}
        </p>
        {duration && (
          <p className="text-xs text-slate-600 mt-0.5 flex items-center justify-center gap-1">
            <Clock className="w-3 h-3" />
            {(duration / 1000).toFixed(2)}s
          </p>
        )}
      </div>

      {/* Connector line (skip last node) */}
      <div className={cn(
        'absolute w-12 h-1 top-8 left-full',
        status === 'complete' && 'bg-emerald-500',
        status !== 'complete' && 'bg-slate-700',
      )} />
    </div>
  );
}
