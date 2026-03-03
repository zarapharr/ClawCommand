import { useEffect, useMemo, useState } from 'react';
import { MessageSquare, Send, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { fetchSessionMessages, fetchSessions, sendMessage } from '@/lib/openclaw-api';
import type { Session } from '@/types';

export function AgentChatPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [messages, setMessages] = useState<Record<string, Session['messages']>>({});
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const loadSessions = async () => {
    const result = await fetchSessions();
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSessions(result.data);
    setActiveSessionId((prev) => prev || result.data[0]?.id || '');
    setError(null);
  };

  useEffect(() => {
    void loadSessions();
  }, []);

  const activeSession = useMemo(() => sessions.find((session) => session.id === activeSessionId), [sessions, activeSessionId]);

  useEffect(() => {
    const session = sessions.find((item) => item.id === activeSessionId);
    if (!session?.key) return;
    void (async () => {
      const result = await fetchSessionMessages(session.key);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMessages((prev) => ({ ...prev, [session.id]: result.data }));
    })();
  }, [sessions, activeSessionId]);

  const handleSend = async () => {
    if (!activeSessionId || !inputValue.trim()) return;
    setSending(true);
    const sessionKey = activeSession?.key || activeSessionId;
    const result = await sendMessage(sessionKey, { content: inputValue });
    setSending(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setInputValue('');
    await loadSessions();
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white"><span className="text-cyan-400">Agent</span> Chat</h1>
            <p className="text-xs text-slate-400">Live session send and receive flow</p>
          </div>
        </div>
        <Button variant="outline" className="border-cyan-500/30 text-cyan-400" onClick={() => void loadSessions()}><Plus className="w-4 h-4 mr-2" />Refresh</Button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-80 border-r border-slate-800/50 p-2 overflow-auto">
          {sessions.map((session) => (
            <button key={session.id} onClick={() => setActiveSessionId(session.id)} className={`w-full text-left p-3 rounded-lg mb-1 ${activeSessionId === session.id ? 'bg-cyan-500/10 border border-cyan-500/30' : 'hover:bg-slate-900/40'}`}>
              <p className="text-white text-sm">{session.key || session.id}</p>
              <p className="text-xs text-slate-500">{session.agentName} • {session.messageCount} messages</p>
            </button>
          ))}
        </div>

        <div className="flex-1 flex flex-col">
          <div className="flex-1 p-6 overflow-auto space-y-3">
            {(messages[activeSessionId] || activeSession?.messages || []).map((message) => (
              <div key={message.id} className={`rounded-lg border p-3 ${message.role === 'user' ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-slate-900/30 border-slate-800'}`}>
                <p className="text-xs text-slate-400 mb-1">{message.role}</p>
                <p className="text-sm text-slate-200 whitespace-pre-wrap">{message.content}</p>
              </div>
            ))}
            {!(messages[activeSessionId] || activeSession?.messages || []).length && <p className="text-slate-500">No messages in this session yet.</p>}
          </div>

          <div className="p-4 border-t border-slate-800/50 flex gap-2">
            <Input value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Send message to this session" className="bg-slate-900 border-slate-700 text-white" />
            <Button onClick={() => void handleSend()} disabled={sending || !inputValue.trim()} className="bg-cyan-500 hover:bg-cyan-600 text-white"><Send className="w-4 h-4" /></Button>
          </div>
          {error && <p className="px-4 pb-3 text-xs text-red-400">{error}</p>}
        </div>
      </div>
    </div>
  );
}

export default AgentChatPage;
