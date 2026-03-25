import { useEffect, useState, useCallback } from 'react';

/**
 * useQdrant Hook
 * Fetches vector collection metadata directly from Qdrant (CORS-enabled)
 * No proxy needed - direct browser connection to localhost:6333
 */
interface QdrantCollection {
  name: string;
  vectors_count?: number;
  points_count?: number;
  status?: string;
}

export const useQdrant = () => {
  const [collections, setCollections] = useState<QdrantCollection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const baseUrl = 'http://localhost:6333';

  const fetchCollections = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${baseUrl}/collections`);
      if (!response.ok) throw new Error(`Failed to fetch collections: ${response.statusText}`);
      const data = await response.json();
      setCollections(data.result?.collections || []);
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      console.error('Qdrant collections error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [baseUrl]);

  const getCollectionStats = useCallback(async (name: string) => {
    try {
      const response = await fetch(`${baseUrl}/collections/${name}`);
      if (!response.ok) throw new Error(`Failed to fetch collection ${name}`);
      const data = await response.json();
      return data.result || null;
    } catch (err) {
      console.error(`Qdrant collection ${name} error:`, err);
      return null;
    }
  }, [baseUrl]);

  const getHealth = useCallback(async () => {
    try {
      const response = await fetch(`${baseUrl}/health`);
      if (!response.ok) throw new Error('Health check failed');
      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Qdrant health check error:', err);
      return null;
    }
  }, [baseUrl]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  return {
    collections,
    isLoading,
    error,
    fetchCollections,
    getCollectionStats,
    getHealth,
  };
};
