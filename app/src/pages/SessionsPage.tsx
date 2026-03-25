import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import type { Session, Message } from '@/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  MessageSquare, Search, Send, MoreHorizontal,
  Archive, Download, Trash2, Shield,
} from 'lucide-react';
import { useRuntimeFeed } from '@/hooks/use-runtime-feed';
import { RuntimeStatusBar } from '@/components/runtime/RuntimeStatusBar';
import { HealthConnectionPanel } from '@/components/runtime/HealthConnectionPanel';
import { ActionReceiptLedger } from '@/components/runtime/ActionReceiptLedger';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getDiagnostics, getSessionsFeed, readOperatorAudit, reconcileOperatorLedgers, runOperatorAction, sanitizePayloadPreview } from '@/lib/runtime-adapters';

export function SessionsPage() {
  const sessionsLoader = useCallback(() => getSessionsFeed(), []);
  const diagnosticsLoader = useCallback(() => getDiagnostics(), []);
  const { feed: sessionsFeed, loading, error, freshnessLabel } = useRuntimeFeed({ loader: sessionsLoader });
  const { feed: diagnosticsFeed } = useRuntimeFeed({ loader: diagnosticsLoader });

  const [sessions, setSessions] = useState<Session[]>(sessionsFeed.data);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(sessionsFeed.data[0]?.id || null);
  const [auditLog, setAuditLog] = useState(readOperatorAudit());
  const [messageInput, setMessageInput] = useState('');
  const [pendingAction, setPendingAction] = useState<{ id: string; action: 'stop' | 'retry' | 'escalate' | 'kill' } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedSession = sessions.find((s) => s.id === selectedSessionId);
  const groupedSessions = useMemo(() => {
    const groups = new Map<string, Session[]>();
    for (const session of sessions) {
      const label = session.groupLabel || '#General';
      const list = groups.get(label) || [];
      list.push(session);
      groups.set(label, list);
    }
    return Array.from(groups.entries());
  }, [sessions]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedSession?.messages]);

  useEffect(() => {
    setSessions(sessionsFeed.data);
    setSelectedSessionId((prev) => (sessionsFeed.data.find((s) => s.id === prev)?.id ?? sessionsFeed.data[0]?.id ?? null));
  }, [sessionsFeed.data]);

  useEffect(() => {
    void reconcileOperatorLedgers().then(({ audit }) => {
      setAuditLog(audit);
    });
  }, []);

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedSessionId) return;
    const safeContent = sanitizePayloadPreview(messageInput);

    const newMessage: Message = {
      id: `m-${Date.now()}`,
      role: 'user',
      content: safeContent,
      timestamp: new Date().toISOString(),
    };

    setSessions((prev) => prev.map((s) =>
      s.id === selectedSessionId
        ? { ...s, messages: [...s.messages, newMessage], messageCount: s.messageCount + 1 }
        : s,
    ));

    setMessageInput('');

    setTimeout(() => {
      const responseMessage: Message = {
        id: `m-${Date.now() + 1}`,
        role: 'assistant',
        content: 'Action received. Runtime adapter dispatch in progress.',
        timestamp: new Date().toISOString(),
        tokens: { input: safeContent.length, output: 35 },
      };

      setSessions((prev) => prev.map((s) =>
        s.id === selectedSessionId
          ? { ...s, messages: [...s.messages, responseMessage], messageCount: s.messageCount + 2 }
          : s,
      ));
    }, 600);
  };

  const executeSessionAction = async () => {
    if (!pendingAction) return;
    await runOperatorAction({
      action: pendingAction.action,
      source: sessionsFeed.source,
      targetId: pendingAction.id,
      targetType: 'session',
      payload: { panel: 'session-center' },
    });

    setSessions((prev) => prev.map((session) => {
      if (session.id !== pendingAction.id) return session;
      if (pendingAction.action === 'kill' || pendingAction.action === 'stop') return { ...session, status: 'archived' };
      return { ...session, status: 'active', lastActivity: new Date().toISOString() };
    }));
    setAuditLog(readOperatorAudit());
    setPendingAction(null);
  };

  const formatTime = (timestamp: string) => new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  const formatDate = (timestamp: string) => new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center"><MessageSquare className="w-5 h-5 text-cyan-400" /></div>
          <div>
            <h1 className="text-xl font-bold text-white"><span className="text-cyan-400">Session</span> Center</h1>
            <p className="text-xs text-slate-400">View and interact with agent sessions</p>
          </div>
          <RuntimeStatusBar feed={sessionsFeed} loading={loading} error={error} freshnessLabel={freshnessLabel} />
        </div>

        <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" /><Input placeholder="Search sessions..." className="pl-10 w-64 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500" /></div>
      </div>

      <div className="px-6 py-2 text-xs text-slate-500 flex items-center gap-2"><Shield className="w-3 h-3" /> Message content is redacted before send and before payload display.</div>
      <div className="px-6 pb-2 grid grid-cols-1 lg:grid-cols-2 gap-3">
        <HealthConnectionPanel feed={sessionsFeed} diagnosticsFeed={diagnosticsFeed} title="Session Stream Health" />
        <ActionReceiptLedger entries={auditLog} />
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-80 border-r border-slate-800/50 flex flex-col">
          <div className="p-4 border-b border-slate-800/50"><p className="text-xs text-slate-400 uppercase tracking-wider">{sessions.length} Sessions</p></div>
          <ScrollArea className="flex-1"><div className="p-2 space-y-1">{groupedSessions.map(([label, group]) => (
            <div key={label} className="mb-3">
              <p className="px-2 py-1 text-[11px] uppercase tracking-wider text-slate-500">{label}</p>
              {group.map((session) => (
                <button key={session.id} onClick={() => setSelectedSessionId(session.id)} className={cn('w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left hover:bg-slate-800/50', selectedSessionId === session.id && 'bg-cyan-500/10 border border-cyan-500/30')}>
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-xl">{session.agentEmoji}</div>
                  <div className="flex-1 min-w-0"><div className="flex items-center justify-between"><p className="text-sm font-medium text-white truncate">{session.agentName}</p><span className="text-xs text-slate-500">{formatTime(session.lastActivity)}</span></div><p className="text-xs text-slate-400 truncate">{session.messages[session.messages.length - 1]?.content.slice(0, 50)}...</p></div>
                </button>
              ))}
            </div>
          ))}</div></ScrollArea>
        </div>

        <div className="flex-1 flex flex-col">
          {selectedSession ? (
            <>
              <div className="flex items-center justify-between px-6 py-3 border-b border-slate-800/50 bg-slate-900/30">
                <div className="flex items-center gap-3"><span className="text-2xl">{selectedSession.agentEmoji}</span><div><p className="text-sm font-medium text-white">{selectedSession.agentName}</p><p className="text-xs text-slate-400">Session: {selectedSession.key}</p></div></div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white"><Download className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white"><Archive className="w-4 h-4" /></Button>
                  <Button variant="outline" size="sm" className="border-slate-700 text-slate-300" onClick={() => setPendingAction({ id: selectedSession.id, action: 'retry' })}>Retry</Button>
                  <Button variant="outline" size="sm" className="border-amber-900/50 text-amber-300" onClick={() => setPendingAction({ id: selectedSession.id, action: 'escalate' })}>Escalate</Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="text-slate-400 hover:text-white"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800">
                      <DropdownMenuItem className="text-slate-300 hover:text-white hover:bg-slate-800" onClick={() => setPendingAction({ id: selectedSession.id, action: 'stop' })}>Stop Session</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-400 hover:text-red-300 hover:bg-red-900/20" onClick={() => setPendingAction({ id: selectedSession.id, action: 'kill' })}><Trash2 className="w-4 h-4 mr-2" />Kill Session</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <ScrollArea className="flex-1 p-6"><div className="space-y-4 max-w-3xl mx-auto">{selectedSession.messages.map((message, index) => {
                const showDate = index === 0 || formatDate(message.timestamp) !== formatDate(selectedSession.messages[index - 1].timestamp);
                return <div key={message.id}>{showDate && <div className="flex items-center justify-center my-4"><span className="text-xs text-slate-500 bg-slate-900/50 px-3 py-1 rounded-full">{formatDate(message.timestamp)}</span></div>}<div className={cn('flex gap-3', message.role === 'user' && 'flex-row-reverse')}><div className={cn('w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0', message.role === 'user' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-300')}>{message.role === 'user' ? '👤' : selectedSession.agentEmoji}</div><div className={cn('max-w-[70%]', message.role === 'user' && 'text-right')}><div className={cn('inline-block px-4 py-2 rounded-2xl text-sm', message.role === 'user' ? 'bg-cyan-500/20 text-cyan-100 rounded-br-md' : 'bg-slate-800 text-slate-200 rounded-bl-md')}>{message.content}</div></div></div></div>;
              })}<div ref={messagesEndRef} /></div></ScrollArea>

              <div className="p-4 border-t border-slate-800/50 bg-slate-900/30"><div className="max-w-3xl mx-auto flex gap-3"><Input value={messageInput} onChange={(e) => setMessageInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder={`Message ${selectedSession.agentName}...`} className="flex-1 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500" /><Button onClick={handleSendMessage} className="bg-cyan-500 hover:bg-cyan-600 text-black"><Send className="w-4 h-4" /></Button></div></div>
            </>
          ) : <div className="h-full flex items-center justify-center"><p className="text-slate-400">Select a session to view messages</p></div>}
        </div>
      </div>

      <AlertDialog open={!!pendingAction} onOpenChange={(open) => !open && setPendingAction(null)}>
        <AlertDialogContent className="bg-slate-900 border-slate-700 text-white">
          <AlertDialogHeader><AlertDialogTitle>Confirm session action</AlertDialogTitle><AlertDialogDescription className="text-slate-400">This operation is logged to the governance audit trail.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel className="border-slate-700 text-slate-300">Cancel</AlertDialogCancel><AlertDialogAction onClick={executeSessionAction}>Confirm</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
