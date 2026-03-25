import { useEffect, useState, useRef, useCallback } from 'react';

/**
 * useGateway Hook
 * Connects to ClawCommand backend WebSocket proxy (127.0.0.1:8000)
 * which forwards authenticated requests to OpenClaw Gateway
 */
interface UseGatewayOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  onMessage?: (data: any) => void;
  onError?: (error: Error) => void;
}

export const useGateway = (options: UseGatewayOptions = {}) => {
  const {
    maxRetries = 5,
    initialDelay = 1000,
    maxDelay = 30000,
    onMessage,
    onError,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [data, setData] = useState<any>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const url = 'ws://127.0.0.1:8000/ws';

  const calculateDelay = useCallback(() => {
    const delay = Math.min(
      initialDelay * Math.pow(2, retryCountRef.current),
      maxDelay
    );
    return delay + Math.random() * 1000;
  }, [initialDelay, maxDelay]);

  const connect = useCallback(() => {
    if (wsRef.current) return;

    try {
      const ws = new WebSocket(url);

      ws.onopen = () => {
        console.log('✓ Gateway WebSocket connected');
        setIsConnected(true);
        retryCountRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          setData(payload);
          onMessage?.(payload);
        } catch (err) {
          console.warn('Failed to parse gateway message:', err);
        }
      };

      ws.onerror = () => {
        const error = new Error('Gateway WebSocket error');
        console.error(error);
        onError?.(error);
      };

      ws.onclose = () => {
        console.log('! Gateway WebSocket disconnected');
        wsRef.current = null;
        setIsConnected(false);

        if (retryCountRef.current < maxRetries) {
          const delay = calculateDelay();
          console.log(`→ Reconnecting gateway in ${Math.round(delay)}ms`);
          retryCountRef.current++;
          retryTimeoutRef.current = setTimeout(connect, delay);
        } else {
          console.error('✗ Max gateway reconnection attempts reached');
        }
      };

      wsRef.current = ws;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create gateway WebSocket');
      console.error(error);
      onError?.(error);
    }
  }, [url, maxRetries, calculateDelay, onMessage, onError]);

  const send = useCallback((msg: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    } else {
      console.warn('Gateway WebSocket not connected');
    }
  }, []);

  const disconnect = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, []);

  return {
    isConnected,
    data,
    send,
    disconnect,
  };
};
