import { useEffect, useState, useRef, useCallback } from "react";

/**
 * useWebSocket Hook
 * Manages WebSocket connection with exponential backoff retry logic
 * @example
 * const { data, isConnected, send } = useWebSocket("ws://localhost:8000");
 */
interface UseWebSocketOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  onMessage?: (data: any) => void;
  onError?: (error: Error) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export const useWebSocket = (url: string, options: UseWebSocketOptions = {}) => {
  const {
    maxRetries = 5,
    initialDelay = 1000,
    maxDelay = 30000,
    onMessage,
    onError,
    onConnect,
    onDisconnect,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const connectRef = useRef<() => void>(null);

  const calculateDelay = useCallback(() => {
    const delay = Math.min(
      initialDelay * Math.pow(2, retryCountRef.current),
      maxDelay
    );
    // Add jitter
    return delay + Math.random() * 1000;
  }, [initialDelay, maxDelay]);

  const connect = useCallback(() => {
    if (wsRef.current) return;

    try {
      const ws = new WebSocket(url);

      ws.onopen = () => {
        console.log("WebSocket connected");
        setIsConnected(true);
        retryCountRef.current = 0;
        onConnect?.();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastMessage(data);
          onMessage?.(data);
        } catch (err) {
          console.warn("Failed to parse WebSocket message", err);
        }
      };

      ws.onerror = (_e: Event) => {
        const error = new Error("WebSocket error");
        console.error(error);
        onError?.(error);
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected");
        wsRef.current = null;
        setIsConnected(false);
        onDisconnect?.();

        // Retry with exponential backoff
        if (retryCountRef.current < maxRetries) {
          const delay = calculateDelay();
          console.log(`Retrying WebSocket connection in ${Math.round(delay)}ms`);
          retryCountRef.current++;
          retryTimeoutRef.current = setTimeout(() => connectRef.current?.(), delay);
        }
      };

      wsRef.current = ws;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to create WebSocket");
      console.error(error);
      onError?.(error);
    }
  }, [url, maxRetries, calculateDelay, onMessage, onError, onConnect, onDisconnect]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  const send = useCallback((data: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    } else {
      console.warn("WebSocket not connected");
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
  }, [connect, disconnect]);

  return {
    isConnected,
    lastMessage,
    send,
    disconnect,
  };
};
