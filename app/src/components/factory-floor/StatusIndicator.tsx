import type { AgentStatus } from '@/types';
import { cn } from '@/lib/utils';

interface StatusIndicatorProps {
  status: AgentStatus;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const statusConfig: Record<AgentStatus, { color: string; label: string; className: string }> = {
  online: {
    color: 'bg-emerald-500',
    label: 'Online',
    className: 'animate-pulse',
  },
  working: {
    color: 'bg-cyan-400',
    label: 'Working',
    className: '',
  },
  idle: {
    color: 'bg-blue-500',
    label: 'Idle',
    className: 'opacity-60',
  },
  thinking: {
    color: 'bg-purple-500',
    label: 'Thinking',
    className: 'animate-ping',
  },
  error: {
    color: 'bg-red-500',
    label: 'Error',
    className: 'animate-pulse',
  },
  offline: {
    color: 'bg-gray-600',
    label: 'Offline',
    className: '',
  },
};

const sizeConfig = {
  sm: 'w-2 h-2',
  md: 'w-3 h-3',
  lg: 'w-4 h-4',
};

export function StatusIndicator({ status, size = 'md', showLabel = false }: StatusIndicatorProps) {
  const config = statusConfig[status];
  
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        {/* Glow effect */}
        <div 
          className={cn(
            'absolute inset-0 rounded-full blur-sm',
            config.color,
            status === 'working' && 'opacity-60',
            status === 'thinking' && 'opacity-80'
          )}
        />
        
        {/* Main indicator */}
        {status === 'working' ? (
          <div 
            className={cn(
              'relative rounded-full border-2 border-cyan-400',
              sizeConfig[size]
            )}
            style={{
              background: 'conic-gradient(hsl(186 100% 50%) 0deg, transparent 180deg)',
              animation: 'spin 1s linear infinite',
            }}
          />
        ) : (
          <div 
            className={cn(
              'relative rounded-full',
              sizeConfig[size],
              config.color,
              config.className
            )}
          />
        )}
        
        {/* Ripple effect for thinking */}
        {status === 'thinking' && (
          <div 
            className={cn(
              'absolute inset-0 rounded-full bg-purple-500',
              sizeConfig[size]
            )} 
            style={{ animation: 'ripple 1.5s ease-out infinite' }} 
          />
        )}
      </div>
      
      {showLabel && (
        <span className={cn(
          'text-xs font-medium',
          status === 'online' && 'text-emerald-400',
          status === 'working' && 'text-cyan-400',
          status === 'idle' && 'text-blue-400',
          status === 'thinking' && 'text-purple-400',
          status === 'error' && 'text-red-400',
          status === 'offline' && 'text-gray-500',
        )}>
          {config.label}
        </span>
      )}
    </div>
  );
}
