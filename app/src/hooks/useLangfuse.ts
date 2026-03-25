import { useEffect, useState, useCallback } from 'react';

/**
 * useLangfuse Hook
 * Fetches traces, observations, and scores from Langfuse via backend proxy
 */
interface LangfuseTrace {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  duration: number;
  cost?: number;
}

interface LangfuseObservation {
  id: string;
  type: string;
  traceId: string;
  name: string;
  startTime: string;
  endTime: string;
  duration: number;
}

export const useLangfuse = () => {
  const [traces, setTraces] = useState<LangfuseTrace[]>([]);
  const [observations, setObservations] = useState<LangfuseObservation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const baseUrl = 'http://127.0.0.1:8000/api/proxy/langfuse';

  const fetchTraces = useCallback(async (page = 1, limit = 100) => {
    try {
      setIsLoading(true);
      const response = await fetch(`${baseUrl}/traces?page=${page}&limit=${limit}`);
      if (!response.ok) throw new Error(`Failed to fetch traces: ${response.statusText}`);
      const data = await response.json();
      setTraces(data.data || []);
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      console.error('Langfuse traces error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [baseUrl]);

  const fetchObservations = useCallback(async (page = 1, limit = 100) => {
    try {
      setIsLoading(true);
      const response = await fetch(`${baseUrl}/observations?page=${page}&limit=${limit}`);
      if (!response.ok) throw new Error(`Failed to fetch observations: ${response.statusText}`);
      const data = await response.json();
      setObservations(data.data || []);
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      console.error('Langfuse observations error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [baseUrl]);

  const fetchScores = useCallback(async (page = 1, limit = 100) => {
    try {
      setIsLoading(true);
      const response = await fetch(`${baseUrl}/scores?page=${page}&limit=${limit}`);
      if (!response.ok) throw new Error(`Failed to fetch scores: ${response.statusText}`);
      const data = await response.json();
      setError(null);
      return data.data || [];
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      console.error('Langfuse scores error:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [baseUrl]);

  useEffect(() => {
    fetchTraces();
  }, [fetchTraces]);

  return {
    traces,
    observations,
    isLoading,
    error,
    fetchTraces,
    fetchObservations,
    fetchScores,
  };
};
