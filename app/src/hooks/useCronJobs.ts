import { useEffect, useState, useCallback } from 'react';

/**
 * useCronJobs Hook
 * Fetches cron jobs with pagination from backend
 */
interface CronJob {
  id: string;
  schedule: string;
  command: string;
  lastRun?: string;
  nextRun?: string;
  status?: string;
}

interface CronJobsResponse {
  total: number;
  limit: number;
  offset: number;
  jobs: CronJob[];
}

export const useCronJobs = () => {
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const baseUrl = 'http://127.0.0.1:8000/api/cron/jobs';

  const fetchJobs = useCallback(async (limit = 50, offset = 0) => {
    try {
      setIsLoading(true);
      const response = await fetch(`${baseUrl}?limit=${limit}&offset=${offset}`);
      if (!response.ok) throw new Error(`Failed to fetch cron jobs: ${response.statusText}`);
      const data: CronJobsResponse = await response.json();
      setJobs(data.jobs);
      setTotal(data.total);
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      console.error('Cron jobs error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [baseUrl]);

  const getJobById = useCallback(async (jobId: string) => {
    try {
      const response = await fetch(`${baseUrl}/${jobId}`);
      if (!response.ok) throw new Error(`Failed to fetch job ${jobId}`);
      return await response.json();
    } catch (err) {
      console.error(`Cron job ${jobId} error:`, err);
      return null;
    }
  }, [baseUrl]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return {
    jobs,
    total,
    isLoading,
    error,
    fetchJobs,
    getJobById,
  };
};
