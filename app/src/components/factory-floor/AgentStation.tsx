import { useState } from 'react';
import type { PointerEvent } from 'react';
import type { Agent } from '@/types';
import { StatusIndicator } from './StatusIndicator';
import { cn } from '@/lib/utils';
import { MessageSquare, Zap, Clock, Link2 } from 'lucide-react';

interface AgentStationProps {
  agent: Agent;
  isSelected: boolean;
  connectMode?: boolean;
  isConnectSource?: boolean;
  onClick: () => void;
  onDoubleClick?: () => void;
  onPointerDown?: (event: PointerEvent<HTMLDivElement>) => void;
  onConnectionPointClick?: () => void;
  nodeScale?: number;
}

export function AgentStation({
  agent,
  isSelected,
  connectMode = false,
  isConnectSource = false,
  onClick,
  onDoubleClick,
  onPointerDown,
  onConnectionPointClick,
  nodeScale = 1,
}: AgentStationProps) {
  const [isHovered, setIsHovered] = useState(false);

  const formatTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div
      className={cn(
        'absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer select-none',
        'transition-all duration-300 ease-out',
        isHovered && 'z-20',
        isSelected && 'z-30',
        connectMode && 'ring-1 ring-cyan-500/30 rounded-xl'
      )}
      style={{
        left: `${agent.position.x}%`,
        top: `${agent.position.y}%`,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onPointerDown={onPointerDown}
    >
      {isSelected && (
        <div className="absolute inset-0 -m-4 rounded-full border-2 border-cyan-400 animate-pulse">
          <div className="absolute inset-0 rounded-full border border-cyan-400/50 animate-ping" />
        </div>
      )}

      {(isHovered || isSelected) && (
        <div className="absolute inset-0 -m-6 rounded-full bg-cyan-500/10 blur-xl" />
      )}

      <div
        className={cn(
          'relative flex flex-col items-center p-3 rounded-xl',
          'bg-slate-900/90 backdrop-blur-sm border border-slate-700/50',
          'transition-all duration-300',
          isHovered && 'border-cyan-500/50 shadow-lg shadow-cyan-500/20',
          isSelected && 'border-cyan-400 shadow-xl shadow-cyan-500/30',
          isConnectSource && 'border-fuchsia-400 shadow-lg shadow-fuchsia-500/30',
          agent.status === 'error' && 'border-red-500/50 shadow-red-500/20',
          agent.status === 'offline' && 'opacity-50'
        )}
        style={{
          transform: `scale(${nodeScale * (isHovered ? 1.05 : 1)})`,
          transformOrigin: 'center',
        }}
      >
        <div className="relative mb-2">
          <div
            className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center text-2xl',
              'bg-gradient-to-br from-slate-800 to-slate-900',
              'border-2 border-slate-600',
              isHovered && 'border-cyan-500/50',
              agent.status === 'working' && 'border-cyan-400',
              agent.status === 'error' && 'border-red-500',
            )}
          >
            {agent.emoji}
          </div>

          <div className="absolute -bottom-1 -right-1">
            <StatusIndicator status={agent.status} size="sm" />
          </div>
        </div>

        <div className="text-center">
          <p className={cn('text-xs font-semibold text-white whitespace-nowrap', isHovered && 'text-cyan-400')}>
            {agent.name}
          </p>
          <p className="text-[10px] text-slate-400 whitespace-nowrap">
            {agent.role}
          </p>
        </div>

        {isHovered && agent.currentTask && (
          <div className="mt-2 px-2 py-1 rounded bg-slate-800/80 border border-slate-700/50 max-w-[140px]">
            <p className="text-[10px] text-cyan-300 truncate">
              {agent.currentTask}
            </p>
          </div>
        )}

        {isHovered && (
          <div className="mt-2 flex items-center gap-3 text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              {agent.metrics.messagesToday}
            </span>
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3" />
              {(agent.metrics.tokensUsed / 1000).toFixed(1)}k
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTimeAgo(agent.metrics.lastActive)}
            </span>
          </div>
        )}
      </div>

      <button
        type="button"
        className={cn(
          'absolute top-1/2 -right-2 w-4 h-4 -translate-y-1/2 rounded-full border transition-colors flex items-center justify-center',
          connectMode ? 'bg-fuchsia-500/30 border-fuchsia-300/80 text-fuchsia-200' : 'bg-cyan-500/30 border-cyan-300/70 text-cyan-200'
        )}
        onClick={(event) => {
          event.stopPropagation();
          onConnectionPointClick?.();
        }}
        title="Connection point"
      >
        <Link2 className="w-2.5 h-2.5" />
      </button>
      <div className="absolute top-1/2 -left-1 w-2 h-2 -translate-y-1/2 rounded-full bg-cyan-500/50" />
      <div className="absolute left-1/2 -top-1 w-2 h-2 -translate-x-1/2 rounded-full bg-cyan-500/50" />
      <div className="absolute left-1/2 -bottom-1 w-2 h-2 -translate-x-1/2 rounded-full bg-cyan-500/50" />
    </div>
  );
}
