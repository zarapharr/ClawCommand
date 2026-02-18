import { useState, useRef, useEffect } from 'react';
import type { Session, Message } from '@/types';
import { mockSessions } from '@/data/mock-data';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageSquare, Search, Send, MoreHorizontal, 
  Archive, Download, Trash2
} from 'lucide-react';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

export function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>(mockSessions);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(mockSessions[0]?.id || null);
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedSession = sessions.find(s => s.id === selectedSessionId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedSession?.messages]);

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedSessionId) return;

    const newMessage: Message = {
      id: `m-${Date.now()}`,
      role: 'user',
      content: messageInput,
      timestamp: new Date().toISOString(),
    };

    setSessions(prev => prev.map(s => 
      s.id === selectedSessionId 
        ? { ...s, messages: [...s.messages, newMessage], messageCount: s.messageCount + 1 }
        : s
    ));

    setMessageInput('');

    // Simulate agent response
    setTimeout(() => {
      const responseMessage: Message = {
        id: `m-${Date.now() + 1}`,
        role: 'assistant',
        content: 'I received your message. Let me process that for you.',
        timestamp: new Date().toISOString(),
        tokens: { input: messageInput.length, output: 45 },
      };
      
      setSessions(prev => prev.map(s => 
        s.id === selectedSessionId 
          ? { ...s, messages: [...s.messages, responseMessage], messageCount: s.messageCount + 2 }
          : s
      ));
    }, 1500);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">
              <span className="text-cyan-400">Session</span> Center
            </h1>
            <p className="text-xs text-slate-400">View and interact with agent sessions</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              placeholder="Search sessions..."
              className="pl-10 w-64 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Session List */}
        <div className="w-80 border-r border-slate-800/50 flex flex-col">
          <div className="p-4 border-b border-slate-800/50">
            <p className="text-xs text-slate-400 uppercase tracking-wider">
              {sessions.length} Sessions
            </p>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => setSelectedSessionId(session.id)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left',
                    'hover:bg-slate-800/50',
                    selectedSessionId === session.id && 'bg-cyan-500/10 border border-cyan-500/30'
                  )}
                >
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-xl">
                    {session.agentEmoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-white truncate">{session.agentName}</p>
                      <span className="text-xs text-slate-500">{formatTime(session.lastActivity)}</span>
                    </div>
                    <p className="text-xs text-slate-400 truncate">
                      {session.messages[session.messages.length - 1]?.content.slice(0, 50)}...
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-400">
                        {session.messageCount} msgs
                      </Badge>
                      <Badge variant="outline" className={cn(
                        'text-[10px]',
                        session.status === 'active' 
                          ? 'border-emerald-500/30 text-emerald-400' 
                          : 'border-slate-700 text-slate-400'
                      )}>
                        {session.status}
                      </Badge>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedSession ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center justify-between px-6 py-3 border-b border-slate-800/50 bg-slate-900/30">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{selectedSession.agentEmoji}</span>
                  <div>
                    <p className="text-sm font-medium text-white">{selectedSession.agentName}</p>
                    <p className="text-xs text-slate-400">Session: {selectedSession.key}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                    <Archive className="w-4 h-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800">
                      <DropdownMenuItem className="text-slate-300 hover:text-white hover:bg-slate-800">
                        Clear History
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-400 hover:text-red-300 hover:bg-red-900/20">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Session
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-4 max-w-3xl mx-auto">
                  {selectedSession.messages.map((message, index) => {
                    const showDate = index === 0 || 
                      formatDate(message.timestamp) !== formatDate(selectedSession.messages[index - 1].timestamp);
                    
                    return (
                      <div key={message.id}>
                        {showDate && (
                          <div className="flex items-center justify-center my-4">
                            <span className="text-xs text-slate-500 bg-slate-900/50 px-3 py-1 rounded-full">
                              {formatDate(message.timestamp)}
                            </span>
                          </div>
                        )}
                        
                        <div className={cn(
                          'flex gap-3',
                          message.role === 'user' && 'flex-row-reverse'
                        )}>
                          <div className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                            message.role === 'user' 
                              ? 'bg-cyan-500/20 text-cyan-400' 
                              : 'bg-slate-800 text-slate-300'
                          )}>
                            {message.role === 'user' ? '👤' : selectedSession.agentEmoji}
                          </div>
                          
                          <div className={cn(
                            'max-w-[70%]',
                            message.role === 'user' && 'text-right'
                          )}>
                            <div className={cn(
                              'inline-block px-4 py-2 rounded-2xl text-sm',
                              message.role === 'user'
                                ? 'bg-cyan-500/20 text-cyan-100 rounded-br-md'
                                : 'bg-slate-800 text-slate-200 rounded-bl-md'
                            )}>
                              {message.content}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-slate-500">{formatTime(message.timestamp)}</span>
                              {message.tokens && (
                                <span className="text-xs text-slate-600">
                                  {message.tokens.input + message.tokens.output} tokens
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input Area */}
              <div className="p-4 border-t border-slate-800/50 bg-slate-900/30">
                <div className="max-w-3xl mx-auto flex gap-3">
                  <Input
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder={`Message ${selectedSession.agentName}...`}
                    className="flex-1 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
                  />
                  <Button 
                    onClick={handleSendMessage}
                    className="bg-cyan-500 hover:bg-cyan-600 text-black"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                <p className="text-slate-400">Select a session to view messages</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
