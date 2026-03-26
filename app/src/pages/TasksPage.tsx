import { useState, useEffect } from 'react';
import type { Task, Agent } from '@/types';
import { fetchAgents } from '@/lib/openclaw-api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ClipboardList, Plus, Calendar, Filter, MoreHorizontal,
  CheckCircle2, Circle, Clock, MessageSquare,
  ChevronDown, ChevronUp 
} from 'lucide-react';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

const columns = [
  { id: 'todo', label: 'To Do', color: 'border-slate-500' },
  { id: 'in_progress', label: 'In Progress', color: 'border-cyan-500' },
  { id: 'review', label: 'Review', color: 'border-purple-500' },
  { id: 'done', label: 'Done', color: 'border-emerald-500' },
] as const;

const priorityColors = {
  low: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  medium: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  urgent: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchAgents().then(result => {
      if (!cancelled && result.ok) setAgents(result.data);
    });
    return () => { cancelled = true; };
  }, []);

  const handleMoveTask = (taskId: string, newStatus: Task['status']) => {
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, status: newStatus, updatedAt: new Date().toISOString() } : t
    ));
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks(prev => prev.map(t => 
      t.id === taskId ? {
        ...t,
        subtasks: t.subtasks.map(st => 
          st.id === subtaskId ? { ...st, completed: !st.completed } : st
        ),
      } : t
    ));
  };

  const getAgentEmoji = (agentId: string) => {
    return agents.find(a => a.id === agentId)?.emoji || '👤';
  };

  const getAgentName = (agentId: string) => {
    return agents.find(a => a.id === agentId)?.name || 'Unknown';
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">
              <span className="text-emerald-400">Task</span> Command
            </h1>
            <p className="text-xs text-slate-400">Manage agent tasks and workflows</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Input
              placeholder="Search tasks..."
              className="w-64 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>
          <Button variant="outline" size="sm" className="border-slate-700 text-slate-300">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm" className="border-slate-700 text-slate-300">
            <Calendar className="w-4 h-4 mr-2" />
            Calendar
          </Button>
          <Button className="bg-emerald-500 hover:bg-emerald-600 text-black font-medium">
            <Plus className="w-4 h-4 mr-2" />
            New Task
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-hidden p-6">
        <div className="h-full flex gap-4">
          {columns.map((column) => {
            const columnTasks = tasks.filter(t => t.status === column.id);
            
            return (
              <div key={column.id} className="flex-1 min-w-[280px] flex flex-col">
                {/* Column Header */}
                <div className={cn(
                  'flex items-center justify-between p-3 rounded-t-lg border-t-2 bg-slate-900/50',
                  column.color
                )}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{column.label}</span>
                    <Badge variant="outline" className="text-xs border-slate-700 text-slate-400">
                      {columnTasks.length}
                    </Badge>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-white">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {/* Column Content */}
                <ScrollArea className="flex-1 bg-slate-900/30 rounded-b-lg border border-slate-800/50 border-t-0">
                  <div className="p-3 space-y-3">
                    {columnTasks.map((task) => (
                      <div 
                        key={task.id}
                        className={cn(
                          'p-4 rounded-lg bg-slate-800/50 border border-slate-700/50',
                          'hover:border-slate-600/50 transition-all cursor-pointer'
                        )}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <Badge 
                            variant="outline" 
                            className={cn('text-xs', priorityColors[task.priority])}
                          >
                            {task.priority}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800">
                              <DropdownMenuItem className="text-slate-300 hover:text-white hover:bg-slate-800">
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-slate-300 hover:text-white hover:bg-slate-800">
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-400 hover:text-red-300 hover:bg-red-900/20">
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <h4 className="text-sm font-medium text-white mb-1">{task.title}</h4>
                        <p className="text-xs text-slate-400 line-clamp-2 mb-3">{task.description}</p>

                        {/* Subtasks */}
                        {task.subtasks.length > 0 && (
                          <div className="mb-3">
                            <button 
                              onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300"
                            >
                              {expandedTask === task.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length} subtasks
                            </button>
                            
                            {expandedTask === task.id && (
                              <div className="mt-2 space-y-1">
                                {task.subtasks.map((subtask) => (
                                  <div 
                                    key={subtask.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleSubtask(task.id, subtask.id);
                                    }}
                                    className="flex items-center gap-2 text-xs"
                                  >
                                    {subtask.completed ? (
                                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    ) : (
                                      <Circle className="w-4 h-4 text-slate-500" />
                                    )}
                                    <span className={cn(
                                      subtask.completed && 'line-through text-slate-500'
                                    )}>
                                      {subtask.title}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
                          <div className="flex items-center gap-2">
                            <span className="text-lg" title={getAgentName(task.assignee)}>
                              {getAgentEmoji(task.assignee)}
                            </span>
                            {task.dueDate && (
                              <span className={cn(
                                'flex items-center gap-1 text-xs',
                                new Date(task.dueDate) < new Date() ? 'text-red-400' : 'text-slate-400'
                              )}>
                                <Clock className="w-3 h-3" />
                                {new Date(task.dueDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          
                          {task.comments.length > 0 && (
                            <span className="flex items-center gap-1 text-xs text-slate-400">
                              <MessageSquare className="w-3 h-3" />
                              {task.comments.length}
                            </span>
                          )}
                        </div>

                        {/* Move buttons */}
                        <div className="flex gap-1 mt-3">
                          {column.id !== 'todo' && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 text-xs text-slate-400 hover:text-white"
                              onClick={(e) => {
                                e.stopPropagation();
                                const prevColumn = columns[columns.findIndex(c => c.id === column.id) - 1];
                                handleMoveTask(task.id, prevColumn.id as Task['status']);
                              }}
                            >
                              ←
                            </Button>
                          )}
                          {column.id !== 'done' && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 text-xs text-slate-400 hover:text-white ml-auto"
                              onClick={(e) => {
                                e.stopPropagation();
                                const nextColumn = columns[columns.findIndex(c => c.id === column.id) + 1];
                                handleMoveTask(task.id, nextColumn.id as Task['status']);
                              }}
                            >
                              →
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
