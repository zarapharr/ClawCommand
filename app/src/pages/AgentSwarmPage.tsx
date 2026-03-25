import { useEffect, useState } from 'react';
import { Network, Play, Pause, RefreshCw, Siren, Skull } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { fetchRuntimeStatus, postRuntimeAction, subscribeRuntimeUpdates, type ActionReceipt } from '@/lib/openclaw-api';

export function AgentSwarmPage() {
  const [sessions, setSessions] = useState<Array<{ id: string; key: string; status: string; agentName: string }>>([]);
  const [receipts, setReceipts] = useState<ActionReceipt[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [liveState, setLiveState] = useState<'connected' | 'polling-fallback' | 'closed'>('closed');

  const load = async () => {
    const result = await fetchRuntimeStatus();
    if (!result.ok) {
      setError(result.error);
      return;
    }

    setSessions(result.data.sessions.map((session) => ({ id: session.id, key: session.key, status: session.status, agentName: session.agentName })));
    setError(null);
  };

  useEffect(() => {
    void load();
    const unsubscribe = subscribeRuntimeUpdates((update) => {
      if (update.kind === 'tick' || update.kind === 'subagents') {
        void load();
      }
    }, setLiveState);
    return unsubscribe;
  }, []);

  const runAction = async (sessionId: string, action: 'start' | 'stop' | 'retry' | 'kill' | 'escalate') => {
    const result = await postRuntimeAction({ targetType: 'session', targetId: sessionId, action });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setReceipts((prev) => [result.data, ...prev].slice(0, 25));
    setError(null);
    await load();
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/30 flex items-center justify-center">
            <Network className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white"><span className="text-purple-400">Agent</span> Swarm</h1>
            <p className="text-xs text-slate-400">Action matrix wired to runtime operations ({liveState})</p>
          </div>
        </div>
        <Button variant="outline" className="border-slate-700 text-slate-300" onClick={() => void load()}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>
      </div>

      {error && <p className="px-6 pt-3 text-sm text-red-400">{error}</p>}

      <div className="flex-1 grid grid-cols-2 gap-4 p-6 overflow-auto">
        <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4">
          <h3 className="text-white font-semibold mb-3">Sessions</h3>
          <div className="space-y-2">
            {sessions.map((session) => (
              <div key={session.id} className="p-3 rounded-lg border border-slate-800 bg-slate-950/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm">{session.agentName}</p>
                    <p className="text-xs text-slate-500">{session.key || session.id}</p>
                  </div>
                  <Badge variant="outline" className="border-slate-700 text-slate-300">{session.status}</Badge>
                </div>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <Button size="sm" variant="outline" className="border-emerald-500/30 text-emerald-400" onClick={() => void runAction(session.key || session.id, 'start')}><Play className="w-3 h-3 mr-1" />Start</Button>
                  <Button size="sm" variant="outline" className="border-orange-500/30 text-orange-400" onClick={() => void runAction(session.key || session.id, 'stop')}><Pause className="w-3 h-3 mr-1" />Stop</Button>
                  <Button size="sm" variant="outline" className="border-cyan-500/30 text-cyan-400" onClick={() => void runAction(session.key || session.id, 'retry')}>Retry</Button>
                  <Button size="sm" variant="outline" className="border-red-600/30 text-red-400" onClick={() => void runAction(session.key || session.id, 'kill')}><Skull className="w-3 h-3 mr-1" />Kill</Button>
                  <Button size="sm" variant="outline" className="border-amber-500/30 text-amber-300" onClick={() => void runAction(session.key || session.id, 'escalate')}><Siren className="w-3 h-3 mr-1" />Escalate</Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4">
          <h3 className="text-white font-semibold mb-3">Action Receipts</h3>
          <div className="space-y-2">
            {receipts.map((receipt) => (
              <div key={receipt.id} className="p-3 rounded-lg border border-slate-800 bg-slate-950/30 text-xs">
                <p className="text-slate-200">{receipt.commandId}</p>
                <p className={receipt.status === 'success' ? 'text-emerald-400' : 'text-red-400'}>{receipt.status}</p>
                <p className="text-slate-500">{receipt.result || receipt.error || 'no message'}</p>
              </div>
            ))}
            {!receipts.length && <p className="text-sm text-slate-500">No receipts yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AgentSwarmPage;
