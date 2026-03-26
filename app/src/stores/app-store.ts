import { useState, useCallback } from 'react';
import type { ViewType, Agent, Skill, Task, Session, CronJob, ActivityEvent, SystemMetrics } from '@/types';

// Navigation Store
export function useNavigationStore() {
  const [currentView, setCurrentView] = useState<ViewType>('factory-floor');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const navigate = useCallback((view: ViewType) => {
    setCurrentView(view);
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  return { currentView, navigate, isSidebarOpen, toggleSidebar };
}

// Agents Store
export function useAgentsStore() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [connections] = useState<{ from: string; to: string }[]>([]);

  const selectedAgent = agents.find(a => a.id === selectedAgentId) || null;

  const createAgent = useCallback((agent: Omit<Agent, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newAgent: Agent = {
      ...agent,
      id: `agent-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setAgents(prev => [...prev, newAgent]);
    return newAgent;
  }, []);

  const updateAgent = useCallback((id: string, updates: Partial<Agent>) => {
    setAgents(prev => prev.map(a => 
      a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a
    ));
  }, []);

  const deleteAgent = useCallback((id: string) => {
    setAgents(prev => prev.filter(a => a.id !== id));
    if (selectedAgentId === id) setSelectedAgentId(null);
  }, [selectedAgentId]);

  const selectAgent = useCallback((id: string | null) => {
    setSelectedAgentId(id);
  }, []);

  return { 
    agents, 
    selectedAgent, 
    selectedAgentId,
    connections,
    createAgent, 
    updateAgent, 
    deleteAgent, 
    selectAgent 
  };
}

// Skills Store
export function useSkillsStore() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);

  const selectedSkill = skills.find(s => s.id === selectedSkillId) || null;

  const createSkill = useCallback((skill: Omit<Skill, 'id' | 'version'>) => {
    const newSkill: Skill = {
      ...skill,
      id: `skill-${Date.now()}`,
      version: '1.0.0',
    };
    setSkills(prev => [...prev, newSkill]);
    return newSkill;
  }, []);

  const updateSkill = useCallback((id: string, updates: Partial<Skill>) => {
    setSkills(prev => prev.map(s => 
      s.id === id ? { ...s, ...updates } : s
    ));
  }, []);

  const deleteSkill = useCallback((id: string) => {
    setSkills(prev => prev.filter(s => s.id !== id));
    if (selectedSkillId === id) setSelectedSkillId(null);
  }, [selectedSkillId]);

  const toggleSkill = useCallback((id: string) => {
    setSkills(prev => prev.map(s => 
      s.id === id ? { ...s, isEnabled: !s.isEnabled } : s
    ));
  }, []);

  const selectSkill = useCallback((id: string | null) => {
    setSelectedSkillId(id);
  }, []);

  return { 
    skills, 
    selectedSkill, 
    selectedSkillId,
    createSkill, 
    updateSkill, 
    deleteSkill, 
    toggleSkill,
    selectSkill 
  };
}

// Tasks Store
export function useTasksStore() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const selectedTask = tasks.find(t => t.id === selectedTaskId) || null;

  const createTask = useCallback((task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTask: Task = {
      ...task,
      id: `task-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setTasks(prev => [...prev, newTask]);
    return newTask;
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => 
      t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
    ));
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    if (selectedTaskId === id) setSelectedTaskId(null);
  }, [selectedTaskId]);

  const moveTask = useCallback((id: string, status: Task['status']) => {
    setTasks(prev => prev.map(t => 
      t.id === id ? { ...t, status, updatedAt: new Date().toISOString() } : t
    ));
  }, []);

  const toggleSubtask = useCallback((taskId: string, subtaskId: string) => {
    setTasks(prev => prev.map(t => 
      t.id === taskId ? {
        ...t,
        subtasks: t.subtasks.map(st => 
          st.id === subtaskId ? { ...st, completed: !st.completed } : st
        ),
        updatedAt: new Date().toISOString(),
      } : t
    ));
  }, []);

  const addComment = useCallback((taskId: string, message: string, author: string) => {
    setTasks(prev => prev.map(t => 
      t.id === taskId ? {
        ...t,
        comments: [...t.comments, {
          id: `c-${Date.now()}`,
          author,
          message,
          timestamp: new Date().toISOString(),
        }],
        updatedAt: new Date().toISOString(),
      } : t
    ));
  }, []);

  const selectTask = useCallback((id: string | null) => {
    setSelectedTaskId(id);
  }, []);

  return { 
    tasks, 
    selectedTask, 
    selectedTaskId,
    createTask, 
    updateTask, 
    deleteTask, 
    moveTask,
    toggleSubtask,
    addComment,
    selectTask 
  };
}

// Sessions Store
export function useSessionsStore() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const selectedSession = sessions.find(s => s.id === selectedSessionId) || null;

  const sendMessage = useCallback((sessionId: string, content: string) => {
    const newMessage = {
      id: `m-${Date.now()}`,
      role: 'user' as const,
      content,
      timestamp: new Date().toISOString(),
    };
    
    setSessions(prev => prev.map(s => 
      s.id === sessionId ? {
        ...s,
        messages: [...s.messages, newMessage],
        messageCount: s.messageCount + 1,
        lastActivity: new Date().toISOString(),
      } : s
    ));

    // Simulate agent response
    setTimeout(() => {
      const responseMessage = {
        id: `m-${Date.now() + 1}`,
        role: 'assistant' as const,
        content: 'I received your message. Let me process that for you.',
        timestamp: new Date().toISOString(),
        tokens: { input: content.length, output: 45 },
      };
      
      setSessions(prev => prev.map(s => 
        s.id === sessionId ? {
          ...s,
          messages: [...s.messages, responseMessage],
          messageCount: s.messageCount + 2,
          lastActivity: new Date().toISOString(),
        } : s
      ));
    }, 1500);
  }, []);

  const selectSession = useCallback((id: string | null) => {
    setSelectedSessionId(id);
  }, []);

  return { 
    sessions, 
    selectedSession, 
    selectedSessionId,
    sendMessage, 
    selectSession 
  };
}

// Cron Store
export function useCronStore() {
  const [jobs, setJobs] = useState<CronJob[]>([]);

  const createJob = useCallback((job: Omit<CronJob, 'id' | 'runCount' | 'errorCount' | 'createdAt'>) => {
    const newJob: CronJob = {
      ...job,
      id: `cron-${Date.now()}`,
      runCount: 0,
      errorCount: 0,
      createdAt: new Date().toISOString(),
    };
    setJobs(prev => [...prev, newJob]);
    return newJob;
  }, []);

  const updateJob = useCallback((id: string, updates: Partial<CronJob>) => {
    setJobs(prev => prev.map(j => 
      j.id === id ? { ...j, ...updates } : j
    ));
  }, []);

  const deleteJob = useCallback((id: string) => {
    setJobs(prev => prev.filter(j => j.id !== id));
  }, []);

  const runJob = useCallback((id: string) => {
    setJobs(prev => prev.map(j => 
      j.id === id ? { 
        ...j, 
        status: 'running' as const,
        lastRun: new Date().toISOString(),
      } : j
    ));
    
    // Simulate job completion
    setTimeout(() => {
      setJobs(prev => prev.map(j => 
        j.id === id ? { 
          ...j, 
          status: 'completed' as const,
          runCount: j.runCount + 1,
        } : j
      ));
    }, 2000);
  }, []);

  const toggleJob = useCallback((id: string) => {
    setJobs(prev => prev.map(j => 
      j.id === id ? { 
        ...j, 
        status: j.status === 'disabled' ? 'pending' : 'disabled' 
      } : j
    ));
  }, []);

  return { jobs, createJob, updateJob, deleteJob, runJob, toggleJob };
}

// Activity Store
export function useActivityStore() {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);

  const addActivity = useCallback((activity: Omit<ActivityEvent, 'id' | 'timestamp'>) => {
    const newActivity: ActivityEvent = {
      ...activity,
      id: `a-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    setActivities(prev => [newActivity, ...prev].slice(0, 50));
  }, []);

  return { activities, addActivity };
}

// System Store
export function useSystemStore() {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    cpu: { usage: 0 },
    memory: { used: 0, total: 0, free: 0 },
    disk: { used: 0, total: 0, free: 0 },
    gateway: { status: 'offline', uptime: 0, connectedChannels: [] },
  });

  const updateMetrics = useCallback((updates: Partial<SystemMetrics>) => {
    setMetrics(prev => ({ ...prev, ...updates }));
  }, []);

  return { metrics, updateMetrics };
}
