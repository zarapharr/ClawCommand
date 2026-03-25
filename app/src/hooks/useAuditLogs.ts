import { useEffect, useState, useCallback } from 'react';

/**
 * useAuditLogs Hook
 * Fetches audit logs with pagination and filtering
 */
interface AuditLogEntry {
  timestamp: string;
  agent: string;
  topic_id: string;
  action_type: string;
  description: string;
  files_touched?: string[];
  result?: string;
}

interface AuditLogsResponse {
  total: number;
  limit: number;
  offset: number;
  entries: AuditLogEntry[];
}

export const useAuditLogs = () => {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const baseUrl = 'http://127.0.0.1:8000/api/audit/logs';

  const fetchLogs = useCallback(
    async (limit = 100, offset = 0, agent?: string, action?: string) => {
      try {
        setIsLoading(true);
        const params = new URLSearchParams({
          limit: String(limit),
          offset: String(offset),
        });
        if (agent) params.append('agent', agent);
        if (action) params.append('action', action);

        const response = await fetch(`${baseUrl}?${params}`);
        if (!response.ok) throw new Error(`Failed to fetch audit logs: ${response.statusText}`);
        const data: AuditLogsResponse = await response.json();
        setEntries(data.entries);
        setTotal(data.total);
        setError(null);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        console.error('Audit logs error:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [baseUrl]
  );

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return {
    entries,
    total,
    isLoading,
    error,
    fetchLogs,
  };
};
