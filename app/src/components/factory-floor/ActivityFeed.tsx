import { AlertCircle, CheckCircle2, Clock, Zap, User } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export interface ActivityItem {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'task';
  title: string;
  description?: string;
  timestamp: Date;
  actorName?: string;
  duration?: number; // milliseconds
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  maxItems?: number;
  className?: string;
}

const typeConfig = {
  success: {
    icon: CheckCircle2,
    color: 'text-emerald-400',
    bg: 'bg-emerald-950/20',
    border: 'border-emerald-700/30',
  },
  error: {
    icon: AlertCircle,
    color: 'text-red-400',
    bg: 'bg-red-950/20',
    border: 'border-red-700/30',
  },
  warning: {
    icon: AlertCircle,
    color: 'text-amber-400',
    bg: 'bg-amber-950/20',
    border: 'border-amber-700/30',
  },
  info: {
    icon: Zap,
    color: 'text-blue-400',
    bg: 'bg-blue-950/20',
    border: 'border-blue-700/30',
  },
  task: {
    icon: Clock,
    color: 'text-slate-400',
    bg: 'bg-slate-800/20',
    border: 'border-slate-700/30',
  },
};

function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function ActivityFeed({
  activities,
  maxItems = 10,
  className,
}: ActivityFeedProps) {
  const displayActivities = activities.slice(0, maxItems);

  return (
    <div className={cn('w-full flex flex-col', className)}>
      <h2 className="text-sm font-semibold text-slate-200 mb-3 px-1">
        Recent Activity
      </h2>

      {displayActivities.length > 0 ? (
        <ScrollArea className="flex-1">
          <div className="space-y-2 pr-4">
            {displayActivities.map((activity) => {
              const config = typeConfig[activity.type];
              const Icon = config.icon;

              return (
                <div
                  key={activity.id}
                  className={cn(
                    'rounded-lg border p-3 transition-colors hover:bg-opacity-75',
                    config.bg,
                    config.border,
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <Icon className={cn('w-4 h-4 mt-0.5 flex-shrink-0', config.color)} />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-100 line-clamp-1">
                        {activity.title}
                      </p>
                      {activity.description && (
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                          {activity.description}
                        </p>
                      )}

                      {/* Meta */}
                      <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                        <time>{formatTime(activity.timestamp)}</time>
                        {activity.actorName && (
                          <>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {activity.actorName}
                            </div>
                          </>
                        )}
                        {activity.duration && (
                          <>
                            <span>•</span>
                            <span>{(activity.duration / 1000).toFixed(2)}s</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      ) : (
        <div className="flex items-center justify-center py-6 text-slate-500">
          <p className="text-sm">No recent activity</p>
        </div>
      )}
    </div>
  );
}
