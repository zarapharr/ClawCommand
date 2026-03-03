/**
 * use-openclaw-query.ts
 * Generic hook for async OpenClaw API calls with loading/error/data states.
 * Automatically aborts in-flight requests on unmount or key change.
 */

import { useEffect, useRef, useState } from 'react';
import type { ApiResult } from '@/lib/openclaw-api';

interface UseOpenClawQueryOptions<T> {
  /** Async function that takes an AbortSignal and returns ApiResult<T> */
  fetcher: (signal: AbortSignal) => Promise<ApiResult<T>>;
  /** Auto-refresh interval in ms. 0 = no polling. */
  refreshMs?: number;
  /** Whether to run the query at all. Useful for conditional fetching. */
  enabled?: boolean;
}

interface UseOpenClawQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  /** Manually re-trigger the fetch */
  refetch: () => void;
}

export function useOpenClawQuery<T>({
  fetcher,
  refreshMs = 0,
  enabled = true,
}: UseOpenClawQueryOptions<T>): UseOpenClawQueryResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    // Abort any previous in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    fetcher(controller.signal).then((result) => {
      if (controller.signal.aborted) return;
      if (result.ok) {
        setData(result.data);
        setError(null);
      } else {
        setError(result.error);
      }
      setLoading(false);
    });

    return () => {
      controller.abort();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, tick]);

  useEffect(() => {
    if (!enabled || refreshMs <= 0) return;
    const id = window.setInterval(() => setTick((n) => n + 1), refreshMs);
    return () => clearInterval(id);
  }, [enabled, refreshMs]);

  const refetch = () => setTick((n) => n + 1);

  return { data, loading, error, refetch };
}
