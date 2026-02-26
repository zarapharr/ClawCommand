export type AgentStatus = 'online' | 'working' | 'idle' | 'thinking' | 'error' | 'offline';

export interface Agent {
  id: string;
  name: string;
  emoji: string;
  role: string;
  description: string;
  status: AgentStatus;
  currentTask?: string;
  model: {
    provider: string;
    model: string;
    temperature: number;
    maxTokens: number;
  };
  tools: {
    allow: string[];
    deny: string[];
  };
  skills: string[];
  workspace: string;
  bootstrapFiles: {
    agents: string;
    soul: string;
    tools: string;
    memory: string;
  };
  position: { x: number; y: number };
  connections: string[];
  metrics: {
    messagesToday: number;
    tokensUsed: number;
    lastActive: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AgentConnection {
  from: string;
  to: string;
  activity: 'high' | 'medium' | 'low' | 'none';
  messageCount: number;
  lastMessage?: string;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  icon: string;
  trigger: {
    type: 'mention' | 'command' | 'pattern';
    value: string;
  };
  parameters: {
    name: string;
    type: 'string' | 'number' | 'boolean';
    required: boolean;
    description: string;
  }[];
  handler: string;
  examples: string[];
  version: string;
  author: string;
  isLocal: boolean;
  isEnabled: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignee: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  subtasks: {
    id: string;
    title: string;
    completed: boolean;
  }[];
  comments: {
    id: string;
    author: string;
    message: string;
    timestamp: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  agentId: string;
  agentName: string;
  agentEmoji: string;
  key: string;
  status: 'active' | 'archived';
  messageCount: number;
  createdAt: string;
  lastActivity: string;
  messages: Message[];
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  tokens?: {
    input: number;
    output: number;
  };
}

export interface CronJob {
  id: string;
  jobId: string;
  name: string;
  schedule: {
    kind: 'at' | 'every' | 'cron';
    at?: string;
    every?: number;
    cron?: string;
    tz?: string;
  };
  sessionTarget: 'main' | 'isolated';
  wakeMode: 'now' | 'next-heartbeat';
  payload: {
    kind: 'systemEvent' | 'agentTurn';
    message?: string;
    systemEvent?: string;
  };
  status: 'pending' | 'running' | 'completed' | 'failed' | 'disabled';
  createdAt: string;
  lastRun?: string;
  nextRun?: string;
  runCount: number;
  errorCount: number;
}

export interface ActivityEvent {
  id: string;
  agentId: string;
  agentName: string;
  agentEmoji: string;
  type: 'message' | 'task_start' | 'task_complete' | 'error' | 'connection' | 'status_change';
  message: string;
  timestamp: string;
}

export interface SystemMetrics {
  cpu: {
    usage: number;
    temperature?: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
  };
  gateway: {
    status: 'online' | 'offline';
    uptime: number;
    connectedChannels: string[];
  };
}

export interface FileItem {
  name: string;
  type: 'file' | 'directory';
  size?: number;
  modifiedAt: string;
  content?: string;
}

export interface ModelProvider {
  id: string;
  name: string;
  icon: string;
  isConfigured: boolean;
  apiKey?: string;
  models: string[];
}

export interface Channel {
  id: string;
  name: string;
  icon: string;
  status: 'connected' | 'disconnected' | 'error';
  isEnabled: boolean;
  config: Record<string, string>;
}

export type ViewType = 
  | 'factory-floor' 
  | 'agents' 
  | 'skills' 
  | 'tasks' 
  | 'sessions' 
  | 'workflows'
  | 'routing'
  | 'budget'
  | 'analytics'
  | 'workspace' 
  | 'cron' 
  | 'models' 
  | 'channels' 
  | 'tools' 
  | 'memory' 
  | 'logs' 
  | 'settings'
  | 'agent-chat'
  | 'agent-swarm'
  | 'voice'
  | 'qmd'
  | 'mission-control-demo';
