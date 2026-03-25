import { useEffect, useState, useCallback } from 'react';

/**
 * useSystemMetrics Hook
 * Polls system metrics (CPU, memory, disk, network) from backend
 */
interface SystemMetrics {
  timestamp: string;
  cpu: {
    user: number;
    system: number;
    idle: number;
    total: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    percent: number;
  };
  disk: {
    readRate: number;
    writeRate: number;
  };
  network: {
    rx_sec: number;
    tx_sec: number;
  };
  uptime: number;
}

export const useSystemMetrics = (pollInterval: number = 5000) => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const baseUrl = 'http://127.0.0.1:8000/api/system/metrics';

  const fetchMetrics = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(baseUrl);
      if (!response.ok) throw new Error(`Failed to fetch metrics: ${response.statusText}`);
      const data = await response.json();
      setMetrics(data);
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      console.error('System metrics error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [baseUrl]);

  useEffect(() => {
    // Fetch immediately
    fetchMetrics();

    // Then poll at interval
    const interval = setInterval(fetchMetrics, pollInterval);
    return () => clearInterval(interval);
  }, [fetchMetrics, pollInterval]);

  return {
    metrics,
    isLoading,
    error,
    refetch: fetchMetrics,
  };
};
