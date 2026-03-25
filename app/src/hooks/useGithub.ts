import { useEffect, useState, useCallback } from 'react';

/**
 * useGithub Hook
 * Fetches GitHub repositories, issues, and workflows via backend proxy
 */
interface GithubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string;
  url: string;
  stars: number;
  forks: number;
  language?: string;
}

interface GithubIssue {
  id: number;
  number: number;
  title: string;
  state: string;
  created_at: string;
  updated_at: string;
  url: string;
}

interface GithubWorkflow {
  id: number;
  name: string;
  path: string;
  state: string;
  created_at: string;
  updated_at: string;
}

export const useGithub = () => {
  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [issues, setIssues] = useState<GithubIssue[]>([]);
  const [workflows, setWorkflows] = useState<GithubWorkflow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const baseUrl = 'http://127.0.0.1:8000/api/github';

  const fetchRepos = useCallback(async (owner = 'zarapharr') => {
    try {
      setIsLoading(true);
      const response = await fetch(`${baseUrl}/repos?owner=${owner}`);
      if (!response.ok) throw new Error(`Failed to fetch repos: ${response.statusText}`);
      const data = await response.json();
      setRepos(data);
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      console.error('GitHub repos error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [baseUrl]);

  const fetchIssues = useCallback(
    async (owner = 'zarapharr', repo = 'ClawCommand') => {
      try {
        setIsLoading(true);
        const response = await fetch(`${baseUrl}/issues?owner=${owner}&repo=${repo}`);
        if (!response.ok) throw new Error(`Failed to fetch issues: ${response.statusText}`);
        const data = await response.json();
        setIssues(data);
        setError(null);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        console.error('GitHub issues error:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [baseUrl]
  );

  const fetchWorkflows = useCallback(
    async (owner = 'zarapharr', repo = 'ClawCommand') => {
      try {
        setIsLoading(true);
        const response = await fetch(`${baseUrl}/workflows?owner=${owner}&repo=${repo}`);
        if (!response.ok) throw new Error(`Failed to fetch workflows: ${response.statusText}`);
        const data = await response.json();
        setWorkflows(data.workflows || []);
        setError(null);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        console.error('GitHub workflows error:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [baseUrl]
  );

  useEffect(() => {
    fetchRepos();
  }, [fetchRepos]);

  return {
    repos,
    issues,
    workflows,
    isLoading,
    error,
    fetchRepos,
    fetchIssues,
    fetchWorkflows,
  };
};
