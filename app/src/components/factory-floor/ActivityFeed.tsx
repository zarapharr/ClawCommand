import type { ActivityEvent } from '@/types';
import { cn } from '@/lib/utils';
import { MessageSquare, Play, CheckCircle, AlertCircle, Link2, Activity, RefreshCw } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ActivityFeedProps {
  activities: ActivityEvent[];
}

const activityConfig: Record<ActivityEvent['type'], { icon: typeof MessageSquare; color: string; label: string }> = {
  message: { icon: MessageSquare, color: 'text-cyan-400', label: 'Message' },
  task_start: { icon: Play, color: 'text-blue-400', label: 'Started' },
  task_complete: { icon: CheckCircle, color: 'text-emerald-400', label: 'Completed' },
  error: { icon: AlertCircle, color: 'text-red-400', label: 'Error' },
  connection: { icon: Link2, color: 'text-purple-400', label: 'Connected' },
  status_change: { icon: RefreshCw, color: 'text-yellow-400', label: 'Status' },
};

export function ActivityFeed({ activities }: ActivityFeedProps) {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  return (
    <div className="holo-card p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white">Activity Feed</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs text-emerald-400">Live</span>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-3 pr-3">
          {activities.map((activity, index) => {
            const config = activityConfig[activity.type];
            const Icon = config.icon;
            
            return (
              <div 
                key={activity.id}
                className={cn(
                  'group relative p-3 rounded-lg',
                  'bg-slate-900/50 border border-slate-800/50',
                  'hover:border-slate-700/50 hover:bg-slate-800/50',
                  'transition-all duration-200',
                  index === 0 && 'animate-in fade-in slide-in-from-left-2 duration-500'
                )}
              >
                <div className="absolute inset-0 rounded-lg bg-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="relative flex items-start gap-3">
                  <div className={cn('flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-slate-800/50 border border-slate-700/50', config.color)}>
                    <Icon className="w-4 h-4" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-white truncate">{activity.agentName}</span>
                      <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800', config.color)}>{config.label}</span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2">{activity.message}</p>
                  </div>
                  
                  <span className="flex-shrink-0 text-[10px] text-slate-500">{formatTime(activity.timestamp)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
