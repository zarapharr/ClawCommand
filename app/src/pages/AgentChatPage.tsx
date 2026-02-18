import { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, Send, Paperclip, Mic, User, 
  MoreVertical, Search, Phone, Video,
  Copy, Check, Plus,
  TrendingUp, DollarSign, Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { mockAgents } from '@/data/mock-data';

// Types
interface ChatMessage {
  id: string;
  sessionId: string;
  agentId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  tokens?: number;
  cost?: number;
  attachments?: Attachment[];
  isStreaming?: boolean;
  toolCalls?: ToolCall[];
}

interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
}

interface ToolCall {
  id: string;
  tool: string;
  input: Record<string, unknown>;
  output?: string;
  status: 'pending' | 'running' | 'completed' | 'error';
}

interface ChatSession {
  id: string;
  agentId: string;
  title: string;
  lastMessageAt: string;
  messageCount: number;
  totalTokens: number;
  totalCost: number;
}

// Mock data
const mockSessions: ChatSession[] = [
  { id: 'session-1', agentId: 'agent-1', title: 'Project Planning', lastMessageAt: new Date(Date.now() - 5 * 60000).toISOString(), messageCount: 24, totalTokens: 4520, totalCost: 0.12 },
  { id: 'session-2', agentId: 'agent-2', title: 'Data Analysis', lastMessageAt: new Date(Date.now() - 2 * 3600000).toISOString(), messageCount: 18, totalTokens: 3210, totalCost: 0.08 },
  { id: 'session-3', agentId: 'agent-3', title: 'Code Review', lastMessageAt: new Date(Date.now() - 24 * 3600000).toISOString(), messageCount: 45, totalTokens: 8920, totalCost: 0.24 },
];

const mockMessages: ChatMessage[] = [
  {
    id: 'msg-1',
    sessionId: 'session-1',
    agentId: 'agent-1',
    role: 'user',
    content: 'Can you help me plan the architecture for our new API?',
    timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
  },
  {
    id: 'msg-2',
    sessionId: 'session-1',
    agentId: 'agent-1',
    role: 'assistant',
    content: 'I\'d be happy to help you plan the API architecture! Let me start by understanding your requirements.\n\n**Key Questions:**\n1. What type of API are you building? (REST, GraphQL, gRPC)\n2. What\'s the expected scale? (requests per second)\n3. What authentication mechanism will you use?\n4. Do you need real-time capabilities?\n\nOnce I understand these, I can provide specific recommendations for your tech stack and architecture patterns.',
    timestamp: new Date(Date.now() - 29 * 60000).toISOString(),
    tokens: 420,
    cost: 0.012,
  },
  {
    id: 'msg-3',
    sessionId: 'session-1',
    agentId: 'agent-1',
    role: 'user',
    content: 'It\'s a REST API for an e-commerce platform. We expect about 1000 req/s at peak.',
    timestamp: new Date(Date.now() - 26 * 60000).toISOString(),
  },
  {
    id: 'msg-4',
    sessionId: 'session-1',
    agentId: 'agent-1',
    role: 'assistant',
    content: 'Great! For an e-commerce REST API at that scale, here\'s my recommended architecture:\n\n```typescript\n// API Gateway Layer\n- Kong or AWS API Gateway\n- Rate limiting: 1000 req/s per client\n- Caching: Redis for product catalog\n\n// Service Layer (Microservices)\n- Product Service: Node.js/Express or Go\n- Order Service: Handles transactions\n- User Service: Authentication & profiles\n- Payment Service: PCI-compliant isolated\n\n// Data Layer\n- PostgreSQL: Orders, users (ACID needed)\n- MongoDB: Product catalog (flexible schema)\n- Redis: Sessions, caching, rate limits\n\n// Infrastructure\n- Docker + Kubernetes\n- Horizontal pod autoscaling\n- CDN for static assets\n```\n\nWould you like me to elaborate on any specific component?',
    timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
    tokens: 680,
    cost: 0.018,
  },
];

// Code block renderer
const CodeBlock: React.FC<{ code: string; language?: string }> = ({ code, language = 'typescript' }) => {
  const [copied, setCopied] = useState(false);
  
  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-lg overflow-hidden bg-slate-950 border border-slate-800">
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-slate-800">
        <span className="text-xs text-slate-400">{language}</span>
        <button
          onClick={copyCode}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="p-3 overflow-x-auto text-sm text-slate-300 font-mono">
        <code>{code}</code>
      </pre>
    </div>
  );
};

// Message content renderer with markdown-like support
const MessageContent: React.FC<{ content: string }> = ({ content }) => {
  // Simple markdown-like parsing
  const parts = content.split(/(```[\s\S]*?```|\*\*.*?\*\|__.*?__)/g);
  
  return (
    <div className="space-y-2">
      {parts.map((part, i) => {
        // Code block
        if (part.startsWith('```')) {
          const match = part.match(/```(\w+)?\n([\s\S]*?)```/);
          if (match) {
            return <CodeBlock key={i} code={match[2].trim()} language={match[1] || 'typescript'} />;
          }
        }
        
        // Bold text
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="text-white">{part.slice(2, -2)}</strong>;
        }
        
        // Regular text with line breaks
        return (
          <p key={i} className="whitespace-pre-wrap text-slate-300">
            {part}
          </p>
        );
      })}
    </div>
  );
};

// Tool call display
const ToolCallDisplay: React.FC<{ toolCall: ToolCall }> = ({ toolCall }) => {
  const [expanded, setExpanded] = useState(false);
  
  const statusColors = {
    pending: 'text-yellow-400',
    running: 'text-cyan-400',
    completed: 'text-emerald-400',
    error: 'text-red-400',
  };

  return (
    <div className="my-2 rounded-lg border border-slate-800 bg-slate-900/50 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-slate-800/50"
      >
        <div className="flex items-center gap-2">
          <Sparkles className={cn('w-4 h-4', statusColors[toolCall.status])} />
          <span className="text-sm text-slate-300">{toolCall.tool}</span>
          <span className={cn('text-xs', statusColors[toolCall.status])}>
            {toolCall.status}
          </span>
        </div>
        <span className="text-xs text-slate-500">
          {expanded ? 'Hide' : 'Show'} details
        </span>
      </button>
      
      {expanded && (
        <div className="px-3 pb-3 border-t border-slate-800">
          <div className="mt-2">
            <p className="text-xs text-slate-500 mb-1">Input:</p>
            <pre className="text-xs text-slate-400 bg-slate-950 p-2 rounded overflow-x-auto">
              {JSON.stringify(toolCall.input, null, 2)}
            </pre>
          </div>
          {toolCall.output && (
            <div className="mt-2">
              <p className="text-xs text-slate-500 mb-1">Output:</p>
              <pre className="text-xs text-slate-400 bg-slate-950 p-2 rounded overflow-x-auto">
                {toolCall.output}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Message bubble component
const MessageBubble: React.FC<{ message: ChatMessage; agent: typeof mockAgents[0] }> = ({ message, agent }) => {
  const isUser = message.role === 'user';
  
  return (
    <div className={cn(
      'flex gap-3 mb-4',
      isUser ? 'flex-row-reverse' : 'flex-row'
    )}>
      {/* Avatar */}
      <div className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
        isUser ? 'bg-cyan-500/20' : 'bg-purple-500/20'
      )}>
        {isUser ? (
          <User className="w-4 h-4 text-cyan-400" />
        ) : (
          <span className="text-sm">{agent.emoji}</span>
        )}
      </div>
      
      {/* Message content */}
      <div className={cn(
        'max-w-[80%]',
        isUser ? 'items-end' : 'items-start'
      )}>
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-slate-400">
            {isUser ? 'You' : agent.name}
          </span>
          <span className="text-xs text-slate-600">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {message.tokens && (
            <span className="text-xs text-slate-600">
              {message.tokens} tokens
            </span>
          )}
          {message.cost && (
            <span className="text-xs text-emerald-500">
              ${message.cost.toFixed(4)}
            </span>
          )}
        </div>
        
        {/* Message body */}
        <div className={cn(
          'rounded-2xl px-4 py-3',
          isUser 
            ? 'bg-cyan-500/10 border border-cyan-500/20 rounded-br-sm' 
            : 'bg-slate-800/50 border border-slate-700/50 rounded-bl-sm'
        )}>
          <MessageContent content={message.content} />
          
          {/* Tool calls */}
          {message.toolCalls?.map(tc => (
            <ToolCallDisplay key={tc.id} toolCall={tc} />
          ))}
          
          {/* Streaming indicator */}
          {message.isStreaming && (
            <div className="flex items-center gap-1 mt-2">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse delay-75" />
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse delay-150" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export function AgentChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>(mockSessions);
  const [activeSessionId, setActiveSessionId] = useState<string>('session-1');
  const [messages, setMessages] = useState<ChatMessage[]>(mockMessages);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewSessionDialog, setShowNewSessionDialog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const activeSession = sessions.find(s => s.id === activeSessionId);
  const activeAgent = activeSession ? mockAgents.find(a => a.id === activeSession.agentId) : null;

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message handler
  const handleSendMessage = () => {
    if (!inputValue.trim() || !activeSession) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      sessionId: activeSession.id,
      agentId: activeSession.agentId,
      role: 'user',
      content: inputValue,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate agent response
    setTimeout(() => {
      const agentMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sessionId: activeSession.id,
        agentId: activeSession.agentId,
        role: 'assistant',
        content: 'I understand your request. Let me process that for you...\n\n**Analysis:**\nBased on what you\'ve shared, here are my recommendations:\n\n1. **First approach**: Consider the trade-offs\n2. **Alternative**: Explore other options\n3. **Implementation**: Start with a prototype\n\nWould you like me to elaborate on any of these points?',
        timestamp: new Date().toISOString(),
        tokens: 245,
        cost: 0.008,
      };
      setMessages(prev => [...prev, agentMessage]);
      setIsTyping(false);
    }, 2000);
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Create new session
  const handleNewSession = (agentId: string) => {
    const agent = mockAgents.find(a => a.id === agentId);
    if (!agent) return;

    const newSession: ChatSession = {
      id: `session-${Date.now()}`,
      agentId,
      title: `Chat with ${agent.name}`,
      lastMessageAt: new Date().toISOString(),
      messageCount: 0,
      totalTokens: 0,
      totalCost: 0,
    };

    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setMessages([]);
    setShowNewSessionDialog(false);
  };

  // Filter sessions by search
  const filteredSessions = sessions.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate total stats
  const totalTokens = messages.reduce((sum, m) => sum + (m.tokens || 0), 0);
  const totalCost = messages.reduce((sum, m) => sum + (m.cost || 0), 0);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">
                <span className="text-cyan-400">Agent</span> Chat
              </h1>
              <p className="text-xs text-slate-400">Direct communication with AI agents</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Stats */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-800/50">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-slate-400">Tokens:</span>
            <span className="text-sm font-semibold text-white">{totalTokens.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-800/50">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-slate-400">Cost:</span>
            <span className="text-sm font-semibold text-white">${totalCost.toFixed(4)}</span>
          </div>
          
          <Button 
            variant="outline" 
            className="border-cyan-500/30 text-cyan-400"
            onClick={() => setShowNewSessionDialog(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Session list */}
        <div className="w-72 border-r border-slate-800/50 bg-slate-950/30 flex flex-col">
          {/* Search */}
          <div className="p-4 border-b border-slate-800/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="pl-10 bg-slate-900 border-slate-700 text-white"
              />
            </div>
          </div>

          {/* Session list */}
          <div className="flex-1 overflow-y-auto">
            {filteredSessions.map(session => {
              const agent = mockAgents.find(a => a.id === session.agentId);
              const isActive = session.id === activeSessionId;
              
              return (
                <button
                  key={session.id}
                  onClick={() => setActiveSessionId(session.id)}
                  className={cn(
                    'w-full p-4 text-left border-b border-slate-800/30 transition-colors',
                    isActive 
                      ? 'bg-cyan-500/10 border-l-2 border-l-cyan-500' 
                      : 'hover:bg-slate-900/50 border-l-2 border-l-transparent'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl">{agent?.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'font-medium truncate',
                        isActive ? 'text-cyan-400' : 'text-white'
                      )}>
                        {session.title}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {session.messageCount} messages • {new Date(session.lastMessageAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col bg-slate-950/20">
          {activeSession && activeAgent ? (
            <>
              {/* Chat header */}
              <div className="flex items-center justify-between px-6 py-3 border-b border-slate-800/50 bg-slate-900/30">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{activeAgent.emoji}</span>
                  <div>
                    <p className="font-medium text-white">{activeAgent.name}</p>
                    <p className="text-xs text-slate-400">{activeAgent.role}</p>
                  </div>
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-xs">
                    Online
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <Phone className="w-4 h-4 text-slate-400" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <Video className="w-4 h-4 text-slate-400" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <MoreVertical className="w-4 h-4 text-slate-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-slate-900 border-slate-700">
                      <DropdownMenuItem className="text-slate-300">Clear conversation</DropdownMenuItem>
                      <DropdownMenuItem className="text-slate-300">Export chat</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-400">Delete session</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6">
                {messages
                  .filter(m => m.sessionId === activeSessionId)
                  .map(message => (
                    <MessageBubble 
                      key={message.id} 
                      message={message} 
                      agent={activeAgent}
                    />
                  ))}
                
                {/* Typing indicator */}
                {isTyping && (
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <span className="text-sm">{activeAgent.emoji}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-75" />
                      <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-150" />
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input area */}
              <div className="p-4 border-t border-slate-800/50 bg-slate-900/30">
                <div className="flex items-end gap-2">
                  <div className="flex-1 relative">
                    <textarea
                      ref={inputRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder={`Message ${activeAgent.name}...`}
                      rows={1}
                      className="w-full px-4 py-3 pr-24 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                      style={{ minHeight: '52px', maxHeight: '200px' }}
                    />
                    <div className="absolute right-2 bottom-2 flex items-center gap-1">
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <Paperclip className="w-4 h-4 text-slate-400" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <Mic className="w-4 h-4 text-slate-400" />
                      </Button>
                    </div>
                  </div>
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim()}
                    className="h-[52px] px-4 bg-cyan-500 hover:bg-cyan-600 text-white disabled:opacity-50"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
                <p className="text-xs text-slate-500 mt-2 text-center">
                  Press Enter to send, Shift+Enter for new line
                </p>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                <p className="text-slate-500">Select a conversation or start a new chat</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Session Dialog */}
      <Dialog open={showNewSessionDialog} onOpenChange={setShowNewSessionDialog}>
        <DialogContent className="bg-slate-950 border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-white">Start New Conversation</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {mockAgents.map(agent => (
              <button
                key={agent.id}
                onClick={() => handleNewSession(agent.id)}
                className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-900/50 hover:bg-slate-800/50 transition-colors text-left"
              >
                <span className="text-2xl">{agent.emoji}</span>
                <div>
                  <p className="font-medium text-white">{agent.name}</p>
                  <p className="text-xs text-slate-400">{agent.role}</p>
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AgentChatPage;
