import type { Agent } from '@/types';
import { StatusIndicator } from './StatusIndicator';
import { MessageSquare, Zap, Clock, Link2, X } from 'lucide-react';

interface InfoPanelProps {
  agent: Agent | null;
  onClose: () => void;
}

export function InfoPanel({ agent, onClose }: InfoPanelProps) {
  if (!agent) return null;

  const formatTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    return `${Math.floor(hours / 24)} days ago`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  return (
    <div className="fixed right-4 top-20 w-80 z-50 animate-in slide-in-from-right duration-300">
      <div className="relative rounded-xl overflow-hidden">
        <div className="absolute inset-0 rounded-xl p-[1px] bg-gradient-to-br from-cyan-500/50 via-purple-500/50 to-cyan-500/50" />
        
        <div className="relative m-[1px] rounded-xl bg-slate-950/95 backdrop-blur-xl">
          <div className="flex items-center justify-between p-4 border-b border-slate-800/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center text-xl">
                {agent.emoji}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">{agent.name}</h3>
                <p className="text-xs text-slate-400">{agent.role}</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 border-b border-slate-800/50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-slate-400 uppercase tracking-wider">Status</span>
              <StatusIndicator status={agent.status} showLabel />
            </div>
            {agent.currentTask && (
              <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800/50">
                <span className="text-xs text-slate-400">Current Task</span>
                <p className="text-sm text-cyan-300 mt-1">{agent.currentTask}</p>
              </div>
            )}
          </div>

          <div className="p-4 border-b border-slate-800/50">
            <span className="text-xs text-slate-400 uppercase tracking-wider block mb-3">Metrics</span>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800/50 text-center">
                <MessageSquare className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
                <p className="text-lg font-semibold text-white">{agent.metrics.messagesToday}</p>
                <p className="text-[10px] text-slate-400">Messages</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800/50 text-center">
                <Zap className="w-4 h-4 text-purple-400 mx-auto mb-1" />
                <p className="text-lg font-semibold text-white">{formatNumber(agent.metrics.tokensUsed)}</p>
                <p className="text-[10px] text-slate-400">Tokens</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800/50 text-center">
                <Clock className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                <p className="text-lg font-semibold text-white">{formatTimeAgo(agent.metrics.lastActive).split(' ')[0]}</p>
                <p className="text-[10px] text-slate-400">Last Active</p>
              </div>
            </div>
          </div>

          <div className="p-4">
            <span className="text-xs text-slate-400 uppercase tracking-wider block mb-3">Connections</span>
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-slate-500" />
              <span className="text-sm text-slate-300">{agent.connections.length} connected agents</span>
            </div>
            {agent.connections.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {agent.connections.map((connId) => (
                  <span 
                    key={connId}
                    className="px-2 py-1 rounded-full text-[10px] bg-slate-800/50 border border-slate-700/50 text-slate-300"
                  >
                    {connId}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="absolute top-0 left-0 w-20 h-20 border-l-2 border-t-2 border-cyan-500/30 rounded-tl-xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-20 h-20 border-r-2 border-b-2 border-purple-500/30 rounded-br-xl pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
