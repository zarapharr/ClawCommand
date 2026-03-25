import { useEffect, useState, useCallback } from 'react';

/**
 * useDocker Hook
 * Fetches Docker container info and stats via backend API
 */
interface DockerContainer {
  id: string;
  name: string;
  image: string;
  status: string;
  state: string;
  ports?: any[];
}

interface DockerStats {
  container_id: string;
  name: string;
  cpu_percent: string;
  memory_usage: number;
  memory_limit: number;
  memory_percent: string;
}

export const useDocker = () => {
  const [containers, setContainers] = useState<DockerContainer[]>([]);
  const [stats, setStats] = useState<DockerStats[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const baseUrl = 'http://127.0.0.1:8000/api/docker';

  const fetchContainers = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${baseUrl}/containers`);
      if (!response.ok) throw new Error(`Failed to fetch containers: ${response.statusText}`);
      const data = await response.json();
      setContainers(data);
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      console.error('Docker containers error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [baseUrl]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(`${baseUrl}/stats`);
      if (!response.ok) throw new Error(`Failed to fetch stats: ${response.statusText}`);
      const data = await response.json();
      setStats(data.containers || []);
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      console.error('Docker stats error:', error);
    }
  }, [baseUrl]);

  const getContainerStats = useCallback(async (containerId: string) => {
    try {
      const response = await fetch(`${baseUrl}/stats/${containerId}`);
      if (!response.ok) throw new Error(`Failed to fetch stats for ${containerId}`);
      return await response.json();
    } catch (err) {
      console.error(`Docker stats for ${containerId} error:`, err);
      return null;
    }
  }, [baseUrl]);

  useEffect(() => {
    fetchContainers();
    fetchStats();

    // Refresh stats every 10 seconds
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, [fetchContainers, fetchStats]);

  return {
    containers,
    stats,
    isLoading,
    error,
    fetchContainers,
    fetchStats,
    getContainerStats,
  };
};
