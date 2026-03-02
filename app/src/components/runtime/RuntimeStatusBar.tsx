import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { RuntimeFeed } from '@/lib/runtime-adapters';

export function RuntimeStatusBar({ feed, loading, error, freshnessLabel }: {
  feed: RuntimeFeed<unknown>;
  loading: boolean;
  error: string | null;
  freshnessLabel: string;
}) {
  const healthStyles = {
    healthy: 'border-emerald-500/30 text-emerald-400',
    degraded: 'border-amber-500/30 text-amber-300',
    offline: 'border-red-500/30 text-red-300',
  } as const;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Badge variant="outline" className={cn('text-xs', feed.source === 'live' ? 'border-cyan-500/30 text-cyan-300' : 'border-amber-500/30 text-amber-300')}>
        {feed.source === 'live' ? `Live: ${feed.path}` : `Fallback: ${feed.path}`}
      </Badge>
      <Badge variant="outline" className={cn('text-xs', healthStyles[feed.health])}>Health: {feed.health}</Badge>
      <Badge variant="outline" className={cn('text-xs', feed.stale ? 'border-amber-500/30 text-amber-300' : 'border-emerald-500/30 text-emerald-400')}>
        {feed.stale ? `Stale (${freshnessLabel})` : `Fresh (${freshnessLabel})`}
      </Badge>
      {loading && <Badge variant="outline" className="text-xs border-blue-500/30 text-blue-300">Loading</Badge>}
      {error && <Badge variant="outline" className="text-xs border-red-500/30 text-red-300">Error: {error}</Badge>}
    </div>
  );
}
