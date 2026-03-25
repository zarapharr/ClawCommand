import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { MessageSquare, Send, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { fetchSessionMessages, fetchSessions, sendMessage, subscribeRuntimeUpdates } from '@/lib/openclaw-api';
import { sortSessions, type ChatSortOrder } from '@/lib/openclaw-mappers';
import {
  filterSessionsBySubagentVisibility,
  loadChatAliases,
  loadShowSubagents,
  mergeSessionLists,
  resolveNextActiveSessionId,
  resolveSessionDisplayName,
  saveChatAliases,
  saveShowSubagents,
  stabilizeVisibleSessions,
  type ChatAliases,
} from '@/lib/agent-chat-utils';
import type { Session } from '@/types';

const SORT_KEY = 'clawcommand.chat.sort';
const NEAR_BOTTOM_THRESHOLD_PX = 100;

function formatTimestamp(iso: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (isNaN(date.getTime())) return '';
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const time = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 0) return time;
  if (diffDays === 1) return `Yesterday ${time}`;
  if (diffDays < 7) return `${date.toLocaleDateString(undefined, { weekday: 'short' })} ${time}`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const SORT_OPTIONS: { label: string; value: ChatSortOrder }[] = [
  { label: 'Latest', value: 'latest' },
  { label: 'Oldest', value: 'oldest' },
  { label: 'Name', value: 'name' },
];

const COMMAND_HINTS = [
  { cmd: '/help', desc: 'Show available chat commands' },
  { cmd: '/new', desc: 'Create a new local draft chat' },
  { cmd: '/refresh', desc: 'Reload sessions from gateway' },
  { cmd: '/clear', desc: 'Clear composer input' },
];

export function AgentChatPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [messages, setMessages] = useState<Record<string, Session['messages']>>({});
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [showCommands, setShowCommands] = useState(false);
  const [liveState, setLiveState] = useState<'connected' | 'polling-fallback' | 'closed'>('closed');
  const [sortOrder, setSortOrder] = useState<ChatSortOrder>(() => {
    return (localStorage.getItem(SORT_KEY) as ChatSortOrder) || 'latest';
  });
  const [aliases, setAliases] = useState<ChatAliases>(() => loadChatAliases());
  const [showSubagents, setShowSubagents] = useState<boolean>(() => loadShowSubagents());
  const [hasLoadedSessions, setHasLoadedSessions] = useState(false);
  const [stableVisibleSessionList, setStableVisibleSessionList] = useState<Session[]>([]);
  const [editingAliasSessionId, setEditingAliasSessionId] = useState<string | null>(null);
  const [aliasDraft, setAliasDraft] = useState('');

  const sessionsRef = useRef<Session[]>([]);
  const activeSessionRef = useRef<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const prevActiveSessionIdRef = useRef<string>('');

  const loadMessages = async (session: Session) => {
    if (!session.key) return;
    const result = await fetchSessionMessages(session.key);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessages((prev) => ({ ...prev, [session.id]: result.data }));
  };

  const loadSessions = async () => {
    const result = await fetchSessions();
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSessions((prev) => {
      const merged = mergeSessionLists(prev, result.data);
      sessionsRef.current = merged;
      return merged;
    });
    setHasLoadedSessions(true);
    setError(null);
  };

  useEffect(() => {
    void loadSessions();
    const unsubscribe = subscribeRuntimeUpdates((update) => {
      if (update.kind === 'tick') {
        void loadSessions();
        return;
      }
      if (update.kind === 'chat') {
        const payload = (update.payload || {}) as { sessionKey?: string };
        const target = sessionsRef.current.find((session) => session.key === payload.sessionKey) || sessionsRef.current.find((session) => session.id === activeSessionRef.current);
        if (target) {
          void loadMessages(target);
        } else {
          void loadSessions();
        }
      }
    }, setLiveState);
    return unsubscribe;
  }, []);

  useEffect(() => {
    sessionsRef.current = sessions;
  }, [sessions]);

  useEffect(() => {
    activeSessionRef.current = activeSessionId;
  }, [activeSessionId]);

  const visibleSessions = useMemo(
    () => filterSessionsBySubagentVisibility(sessions, showSubagents),
    [sessions, showSubagents],
  );

  useEffect(() => {
    setStableVisibleSessionList((prev) => stabilizeVisibleSessions(prev, visibleSessions, sessions, hasLoadedSessions));
  }, [visibleSessions, sessions, hasLoadedSessions]);

  useEffect(() => {
    const nextId = resolveNextActiveSessionId(activeSessionId, stableVisibleSessionList);
    if (nextId !== activeSessionId) {
      if (activeSessionId) {
        const stillExists = sessions.some((session) => session.id === activeSessionId);
        setInfoMessage(stillExists
          ? 'Selected chat is hidden by filter, switched to next visible chat.'
          : 'Selected chat no longer exists, switched to next available chat.');
      }
      setActiveSessionId(nextId);
    }
  }, [activeSessionId, sessions, stableVisibleSessionList]);

  const activeSession = useMemo(() => sessions.find((session) => session.id === activeSessionId), [sessions, activeSessionId]);

  const groupedSessions = useMemo(() => {
    const sorted = sortSessions(stableVisibleSessionList, sortOrder);
    const groups = new Map<string, Session[]>();
    for (const session of sorted) {
      const label = session.groupLabel || '#General';
      const list = groups.get(label) || [];
      list.push(session);
      groups.set(label, list);
    }
    const entries = Array.from(groups.entries());
    if (sortOrder === 'latest') {
      entries.sort(([, a], [, b]) => {
        const aTime = Math.max(...a.map((s) => new Date(s.lastActivity).getTime() || 0));
        const bTime = Math.max(...b.map((s) => new Date(s.lastActivity).getTime() || 0));
        return bTime - aTime;
      });
    } else if (sortOrder === 'oldest') {
      entries.sort(([, a], [, b]) => {
        const aTime = Math.min(...a.map((s) => new Date(s.lastActivity).getTime() || Infinity));
        const bTime = Math.min(...b.map((s) => new Date(s.lastActivity).getTime() || Infinity));
        return aTime - bTime;
      });
    } else {
      entries.sort(([a], [b]) => a.localeCompare(b));
    }
    return entries;
  }, [stableVisibleSessionList, sortOrder]);

  const groupedSessionsMap = useMemo(() => {
    const map = new Map<string, Session>();
    for (const [, group] of groupedSessions) {
      for (const session of group) {
        map.set(session.id, session);
      }
    }
    return map;
  }, [groupedSessions]);

  const activeSessionInGroups = groupedSessionsMap.get(activeSessionId) || activeSession || null;
  const activeSessionTitle = activeSessionInGroups ? resolveSessionDisplayName(activeSessionInGroups, aliases) : 'Select a session';

  useEffect(() => {
    const session = sessions.find((item) => item.id === activeSessionId);
    if (!session?.key) return;
    void loadMessages(session);
  }, [sessions, activeSessionId]);

  const handleSortChange = (order: ChatSortOrder) => {
    setSortOrder(order);
    localStorage.setItem(SORT_KEY, order);
  };

  const handleStartAliasEdit = (session: Session) => {
    const current = aliases[session.id] || aliases[session.key] || '';
    setEditingAliasSessionId(session.id);
    setAliasDraft(current);
  };

  const handleSaveAlias = (session: Session) => {
    const next = aliasDraft.trim();
    const updated = { ...aliases };
    if (!next) {
      delete updated[session.id];
      if (session.key) delete updated[session.key];
      setInfoMessage('Alias removed.');
    } else {
      updated[session.id] = next;
      if (session.key) updated[session.key] = next;
      setInfoMessage('Alias saved.');
    }
    setAliases(updated);
    saveChatAliases(updated);
    setEditingAliasSessionId(null);
    setAliasDraft('');
  };

  const handleClearAlias = (session: Session) => {
    const updated = { ...aliases };
    delete updated[session.id];
    if (session.key) delete updated[session.key];
    setAliases(updated);
    saveChatAliases(updated);
    if (editingAliasSessionId === session.id) {
      setEditingAliasSessionId(null);
      setAliasDraft('');
    }
    setInfoMessage('Alias removed.');
  };

  const handleToggleSubagents = (next: boolean) => {
    setShowSubagents(next);
    saveShowSubagents(next);
  };

  const handleNewChat = () => {
    const now = new Date().toISOString();
    const draftId = `draft-${Date.now()}`;
    const draft: Session = {
      id: draftId,
      agentId: 'draft',
      agentName: 'New Chat',
      agentEmoji: '💬',
      key: '',
      groupLabel: '#Drafts',
      status: 'active',
      messageCount: 0,
      createdAt: now,
      lastActivity: now,
      messages: [],
    };
    setSessions((prev) => [draft, ...prev]);
    setActiveSessionId(draftId);
    setMessages((prev) => ({ ...prev, [draftId]: [] }));
    setInfoMessage('New draft chat created. Gateway session creation is not available here yet.');
    setError(null);
  };

  const handleSend = async () => {
    if (!activeSessionId || !inputValue.trim()) return;
    const outgoing = inputValue.trim();

    if (outgoing === '/help') {
      setShowCommands(true);
      setInputValue('');
      return;
    }
    if (outgoing === '/refresh') {
      setInputValue('');
      await loadSessions();
      return;
    }
    if (outgoing === '/new') {
      setInputValue('');
      handleNewChat();
      return;
    }
    if (outgoing === '/clear') {
      setInputValue('');
      return;
    }

    if (activeSessionId.startsWith('draft-') || !activeSession?.key) {
      setError('This is a local draft chat. New gateway session creation is not supported yet in this view.');
      return;
    }

    setSending(true);
    const sessionKey = activeSession.key;

    isNearBottomRef.current = true;
    setMessages((prev) => ({
      ...prev,
      [activeSessionId]: [
        ...(prev[activeSessionId] || []),
        { id: `local-${Date.now()}`, role: 'user', content: outgoing, timestamp: new Date().toISOString() },
      ],
    }));

    setInputValue('');
    const result = await sendMessage(sessionKey, { content: outgoing });
    setSending(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setError(null);
    setInfoMessage(null);
    await loadSessions();
  };

  const activeMessages = useMemo(
    () => messages[activeSessionId] || activeSession?.messages || [],
    [messages, activeSessionId, activeSession],
  );

  // Reset near-bottom flag and scroll to bottom when switching sessions
  useLayoutEffect(() => {
    if (activeSessionId !== prevActiveSessionIdRef.current) {
      prevActiveSessionIdRef.current = activeSessionId;
      isNearBottomRef.current = true;
      messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
    }
  }, [activeSessionId]);

  // Scroll to bottom when messages change if user was near bottom
  useEffect(() => {
    if (isNearBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeMessages]);

  const handleScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    isNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_THRESHOLD_PX;
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
            <p className="text-xs text-slate-400">History/send/update flow ({liveState})</p>
          </div>
        </div>
        <Button variant="outline" className="border-cyan-500/30 text-cyan-400" onClick={() => void loadSessions()}><Plus className="w-4 h-4 mr-2" />Refresh</Button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-80 border-r border-slate-800/50 flex flex-col overflow-hidden">
          {/* Sort control */}
          <div className="flex flex-col gap-2 px-3 py-2 border-b border-slate-800/50">
            <div className="flex items-center gap-1">
              <Button size="sm" variant="outline" className="h-7 border-slate-700 text-slate-300" onClick={handleNewChat}>
                <Plus className="w-3 h-3 mr-1" />New Chat
              </Button>
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleSortChange(opt.value)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${sortOrder === opt.value ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-400">
              <input type="checkbox" checked={showSubagents} onChange={(e) => handleToggleSubagents(e.target.checked)} />
              Show sub-agent chats
            </label>
          </div>

          {/* Session list */}
          <div className="flex-1 overflow-auto p-2">
            {groupedSessions.map(([label, group]) => (
              <div key={label} className="mb-3">
                <p className="px-2 py-1 text-[11px] uppercase tracking-wider text-slate-500">{label}</p>
                {group.map((session) => (
                  <button key={session.id} onClick={() => setActiveSessionId(session.id)} className={`w-full text-left p-3 rounded-lg mb-1 ${activeSessionId === session.id ? 'bg-cyan-500/10 border border-cyan-500/30' : 'hover:bg-slate-900/40'}`}>
                    <div className="flex items-center justify-between gap-2">
                      {editingAliasSessionId === session.id ? (
                        <div className="flex items-center gap-1 min-w-0 flex-1" onClick={(e) => e.stopPropagation()}>
                          <Input
                            value={aliasDraft}
                            onChange={(e) => setAliasDraft(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSaveAlias(session);
                              }
                              if (e.key === 'Escape') {
                                e.preventDefault();
                                setEditingAliasSessionId(null);
                                setAliasDraft('');
                              }
                            }}
                            placeholder="Set alias"
                            className="h-7 text-xs bg-slate-900 border-slate-700 text-white"
                            autoFocus
                          />
                          <button className="text-[10px] text-cyan-400 hover:text-cyan-300" onClick={() => handleSaveAlias(session)}>Save</button>
                          <button className="text-[10px] text-slate-500 hover:text-slate-300" onClick={() => { setEditingAliasSessionId(null); setAliasDraft(''); }}>Cancel</button>
                        </div>
                      ) : (
                        <p className="text-white text-sm truncate">{resolveSessionDisplayName(session, aliases)}</p>
                      )}
                      {session.lastActivity && (
                        <p className="text-[10px] text-slate-500 shrink-0">{formatTimestamp(session.lastActivity)}</p>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-slate-500 truncate">{session.agentName} • {session.messageCount} messages</p>
                      <div className="flex items-center gap-1 shrink-0">
                        {editingAliasSessionId !== session.id && (
                          <button className="text-[10px] text-cyan-400 hover:text-cyan-300" onClick={(e) => { e.stopPropagation(); handleStartAliasEdit(session); }}>Alias</button>
                        )}
                        {(aliases[session.id] || aliases[session.key]) && (
                          <button className="text-[10px] text-slate-500 hover:text-slate-300" onClick={(e) => { e.stopPropagation(); handleClearAlias(session); }}>Clear</button>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="border-b border-slate-800/50 px-6 py-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-white truncate">{activeSessionTitle}</p>
              {activeSessionInGroups && (
                <button className="text-[11px] text-cyan-400 hover:text-cyan-300" onClick={() => handleStartAliasEdit(activeSessionInGroups)}>Edit alias in list</button>
              )}
            </div>
            <p className="text-xs text-slate-500 truncate">
              {activeSessionInGroups?.agentName || 'No active session'}
              {activeSessionInGroups ? ` • ${activeSessionInGroups.messageCount} messages` : ''}
            </p>
          </div>
          <div
            ref={messagesContainerRef}
            onScroll={handleScroll}
            className="flex-1 p-6 overflow-auto space-y-3"
          >
            {activeMessages.map((message) => (
              <div key={message.id} className={`rounded-lg border p-3 ${message.role === 'user' ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-slate-900/30 border-slate-800'}`}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-slate-400">{message.role}</p>
                  {message.timestamp && (
                    <p className="text-[10px] text-slate-600">{formatTimestamp(message.timestamp)}</p>
                  )}
                </div>
                <p className="text-sm text-slate-200 whitespace-pre-wrap">{message.content}</p>
              </div>
            ))}
            {!activeMessages.length && <p className="text-slate-500">No messages in this session yet.</p>}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-slate-800/50">
            <div className="mb-2 flex items-center justify-between">
              <button className="text-xs text-cyan-400 hover:text-cyan-300" onClick={() => setShowCommands((v) => !v)}>/ Commands</button>
              <p className="text-[11px] text-slate-500">Type /help for shortcuts</p>
            </div>
            {showCommands && (
              <div className="mb-2 rounded-md border border-slate-700 bg-slate-900/80 p-2 space-y-1">
                {COMMAND_HINTS.map((item) => (
                  <p key={item.cmd} className="text-xs text-slate-300"><span className="text-cyan-400 mr-2">{item.cmd}</span>{item.desc}</p>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleSend(); } }}
                placeholder="Send message to this session"
                className="bg-slate-900 border-slate-700 text-white"
              />
              <Button onClick={() => void handleSend()} disabled={sending || !inputValue.trim()} className="bg-cyan-500 hover:bg-cyan-600 text-white"><Send className="w-4 h-4" /></Button>
            </div>
          </div>
          {infoMessage && <p className="px-4 pb-2 text-xs text-cyan-400">{infoMessage}</p>}
          {error && <p className="px-4 pb-3 text-xs text-red-400">{error}</p>}
        </div>
      </div>
    </div>
  );
}

export default AgentChatPage;
