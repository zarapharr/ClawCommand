import { useEffect, useMemo, useState } from 'react';
import { formatFreshnessLabel, type RuntimeFeed } from '@/lib/runtime-adapters';

interface UseRuntimeFeedOptions<T> {
  loader: () => RuntimeFeed<T>;
  refreshMs?: number;
}

export function useRuntimeFeed<T>({ loader, refreshMs = 10_000 }: UseRuntimeFeedOptions<T>) {
  const [feed, setFeed] = useState<RuntimeFeed<T>>(() => loader());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => {
      try {
        const next = loader();
        setFeed(next);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown runtime load failure');
      } finally {
        setLoading(false);
      }
    };

    refresh();
    const interval = window.setInterval(refresh, refreshMs);
    return () => window.clearInterval(interval);
  }, [loader, refreshMs]);

  const freshnessLabel = useMemo(() => formatFreshnessLabel(feed.lastSyncAt, feed.freshnessMs), [feed.lastSyncAt, feed.freshnessMs]);

  return {
    feed,
    loading,
    error,
    freshnessLabel,
  };
}
