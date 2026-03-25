import { AlertCircle, AlertTriangle, Info, X, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export interface Alert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  timestamp: Date;
  actionUrl?: string;
  projectId?: string;
  cost?: number;
  snoozed?: boolean;
}

interface AlertSidebarProps {
  alerts: Alert[];
  onDismiss?: (alertId: string) => void;
  onSnooze?: (alertId: string) => void;
  onNavigate?: (url: string) => void;
  className?: string;
}

const severityConfig = {
  critical: {
    icon: AlertCircle,
    bg: 'bg-red-950/50',
    border: 'border-red-700',
    badge: 'bg-red-500/20 text-red-300',
    title: 'text-red-200',
    label: 'CRITICAL',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-amber-950/50',
    border: 'border-amber-700',
    badge: 'bg-amber-500/20 text-amber-300',
    title: 'text-amber-200',
    label: 'WARNING',
  },
  info: {
    icon: Info,
    bg: 'bg-blue-950/50',
    border: 'border-blue-700',
    badge: 'bg-blue-500/20 text-blue-300',
    title: 'text-blue-200',
    label: 'INFO',
  },
};

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function AlertSidebar({
  alerts,
  onDismiss,
  onSnooze,
  onNavigate,
  className,
}: AlertSidebarProps) {
  // Sort by severity: critical -> warning -> info, then by timestamp (newest first)
  const severityOrder = { critical: 0, warning: 1, info: 2 };
  const sortedAlerts = [...alerts].sort((a, b) => {
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (severityDiff !== 0) return severityDiff;
    return b.timestamp.getTime() - a.timestamp.getTime();
  });

  return (
    <div className={cn('w-full h-full flex flex-col bg-slate-900/50', className)}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-700">
        <h2 className="text-sm font-semibold text-slate-200">
          Alerts & Incidents
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          {alerts.length} {alerts.length === 1 ? 'alert' : 'alerts'}
        </p>
      </div>

      {/* Alerts list */}
      {sortedAlerts.length > 0 ? (
        <ScrollArea className="flex-1">
          <div className="space-y-2 p-3">
            {sortedAlerts.map((alert) => {
              const config = severityConfig[alert.severity];
              const Icon = config.icon;

              return (
                <div
                  key={alert.id}
                  className={cn(
                    'rounded-lg border p-3 transition-all',
                    config.bg,
                    config.border,
                    alert.snoozed && 'opacity-50'
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: config.title }} />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'text-xs font-bold px-2 py-0.5 rounded',
                              config.badge,
                            )}
                          >
                            {config.label}
                          </span>
                          {alert.snoozed && (
                            <span className="text-xs px-2 py-0.5 rounded bg-slate-700/50 text-slate-300">
                              Snoozed
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => onDismiss?.(alert.id)}
                          className="text-slate-400 hover:text-slate-200 transition-colors p-0.5 hover:bg-slate-700/50 rounded"
                          aria-label="Dismiss"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <h3 className={cn('text-sm font-semibold', config.title)}>
                        {alert.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {alert.description}
                      </p>

                      {/* Meta info */}
                      <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatTimeAgo(alert.timestamp)}</span>
                        </div>
                        {alert.cost && (
                          <span className="font-mono">${alert.cost.toFixed(2)}</span>
                        )}
                      </div>

                      {/* Actions */}
                      {(alert.actionUrl || onSnooze) && (
                        <div className="flex gap-2 mt-2">
                          {alert.actionUrl && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-7"
                              onClick={() => onNavigate?.(alert.actionUrl!)}
                            >
                              View
                            </Button>
                          )}
                          {onSnooze && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-xs h-7"
                              onClick={() => onSnooze(alert.id)}
                            >
                              Snooze
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      ) : (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <Info className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No active alerts</p>
            <p className="text-xs text-slate-500 mt-1">All systems healthy</p>
          </div>
        </div>
      )}
    </div>
  );
}
