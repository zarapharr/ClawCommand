import { useState } from "react";
import { useWebSocket } from "./useWebSocket";

/**
 * useRealtimeData Hook
 * Subscribes to real-time agent/workflow status updates
 * @example
 * const { agents, workflowStatus } = useRealtimeData("ws://localhost:8000");
 */
export interface AgentStatus {
  id: string;
  name: string;
  status: "running" | "idle" | "error" | "offline";
  currentTask?: string;
  lastUpdate: string;
  metrics?: {
    tasksCompleted: number;
    errorCount: number;
    uptime: number;
  };
}

export interface WorkflowStatus {
  id: string;
  name: string;
  status: "pending" | "running" | "complete" | "failed";
  progress: number;
  startTime?: string;
  endTime?: string;
}

interface RealtimeDataState {
  agents: Map<string, AgentStatus>;
  workflows: Map<string, WorkflowStatus>;
  isConnected: boolean;
}

export const useRealtimeData = (wsUrl: string) => {
  const [data, setData] = useState<RealtimeDataState>({
    agents: new Map(),
    workflows: new Map(),
    isConnected: false,
  });

  const { isConnected, lastMessage } = useWebSocket(wsUrl, {
    onMessage: (message) => {
      if (message.type === "agent-status") {
        setData((prev) => {
          const newAgents = new Map(prev.agents);
          newAgents.set(message.data.id, message.data);
          return { ...prev, agents: newAgents };
        });
      } else if (message.type === "workflow-status") {
        setData((prev) => {
          const newWorkflows = new Map(prev.workflows);
          newWorkflows.set(message.data.id, message.data);
          return { ...prev, workflows: newWorkflows };
        });
      } else if (message.type === "bulk-update") {
        const { agents = [], workflows = [] } = message.data;
        setData((prev) => {
          const newAgents = new Map(prev.agents);
          const newWorkflows = new Map(prev.workflows);

          agents.forEach((agent: AgentStatus) => {
            newAgents.set(agent.id, agent);
          });

          workflows.forEach((workflow: WorkflowStatus) => {
            newWorkflows.set(workflow.id, workflow);
          });

          return { ...prev, agents: newAgents, workflows: newWorkflows };
        });
      }
    },
    onConnect: () => {
      setData((prev) => ({ ...prev, isConnected: true }));
      // Request initial sync
      console.log("WebSocket connected, requesting sync");
    },
    onDisconnect: () => {
      setData((prev) => ({ ...prev, isConnected: false }));
    },
  });

  return {
    agents: Array.from(data.agents.values()),
    workflows: Array.from(data.workflows.values()),
    isConnected,
    lastMessage,
  };
};
