import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Activity, Terminal, Search, Download, Trash2, 
  Pause, Play, AlertCircle, Info
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  source: string;
  message: string;
}

const generateMockLogs = (): LogEntry[] => {
  const sources = ['gateway', 'agent', 'session', 'cron', 'system'];
  const levels: LogEntry['level'][] = ['debug', 'info', 'warn', 'error'];
  const messages = [
    'Gateway started successfully',
    'Agent connected',
    'Session created',
    'Cron job executed',
    'Message received',
    'Tool executed',
    'Connection established',
    'File updated',
    'Memory flushed',
    'Health check passed',
  ];
  
  return Array.from({ length: 50 }, (_, i) => ({
    id: `log-${Date.now() - i * 1000}`,
    timestamp: new Date(Date.now() - i * 1000).toISOString(),
    level: levels[Math.floor(Math.random() * levels.length)],
    source: sources[Math.floor(Math.random() * sources.length)],
    message: messages[Math.floor(Math.random() * messages.length)],
  }));
};

const levelConfig = {
  debug: { color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/30', icon: Terminal },
  info: { color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', icon: Info },
  warn: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', icon: AlertCircle },
  error: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', icon: AlertCircle },
};

export function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>(generateMockLogs());
  const [isPaused, setIsPaused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState<LogEntry['level'] | 'all'>('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isPaused) return;
    
    const interval = setInterval(() => {
      const sources = ['gateway', 'agent', 'session', 'cron', 'system'];
      const levels: LogEntry['level'][] = ['debug', 'info', 'warn', 'error'];
      const messages = [
        'Gateway heartbeat',
        'Agent status update',
        'Session activity',
        'Cron job check',
        'System metric collected',
      ];
      
      const newLog: LogEntry = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        level: levels[Math.floor(Math.random() * levels.length)],
        source: sources[Math.floor(Math.random() * sources.length)],
        message: messages[Math.floor(Math.random() * messages.length)],
      };
      
      setLogs(prev => [newLog, ...prev].slice(0, 100));
    }, 2000);
    
    return () => clearInterval(interval);
  }, [isPaused]);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         log.source.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = filterLevel === 'all' || log.level === filterLevel;
    return matchesSearch && matchesLevel;
  });

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const downloadLogs = () => {
    const blob = new Blob([logs.map(l => `[${formatTime(l.timestamp)}] [${l.level.toUpperCase()}] [${l.source}] ${l.message}`).join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clawcommand-logs-${new Date().toISOString()}.txt`;
    a.click();
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 flex items-center justify-center">
            <Activity className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">
              <span className="text-emerald-400">System</span> Monitor
            </h1>
            <p className="text-xs text-slate-400">Real-time logs and system health</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>
          
          <div className="flex items-center gap-2">
            {(['all', 'debug', 'info', 'warn', 'error'] as const).map((level) => (
              <Button
                key={level}
                variant={filterLevel === level ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterLevel(level)}
                className={cn(
                  'text-xs capitalize',
                  filterLevel === level 
                    ? 'bg-slate-700 text-white' 
                    : 'border-slate-700 text-slate-400 hover:text-white'
                )}
              >
                {level}
              </Button>
            ))}
          </div>
          
          <Button 
            variant="outline" 
            size="icon" 
            className="border-slate-700 text-slate-400 hover:text-white"
            onClick={() => setIsPaused(!isPaused)}
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </Button>
          
          <Button 
            variant="outline" 
            size="icon" 
            className="border-slate-700 text-slate-400 hover:text-white"
            onClick={downloadLogs}
          >
            <Download className="w-4 h-4" />
          </Button>
          
          <Button 
            variant="outline" 
            size="icon" 
            className="border-slate-700 text-slate-400 hover:text-red-400"
            onClick={clearLogs}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 px-6 py-3 border-b border-slate-800/50 bg-slate-900/30">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Total:</span>
          <span className="text-sm font-medium text-white">{logs.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span className="text-xs text-slate-400">Info:</span>
          <span className="text-sm font-medium text-cyan-400">{logs.filter(l => l.level === 'info').length}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-yellow-400" />
          <span className="text-xs text-slate-400">Warn:</span>
          <span className="text-sm font-medium text-yellow-400">{logs.filter(l => l.level === 'warn').length}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-400" />
          <span className="text-xs text-slate-400">Error:</span>
          <span className="text-sm font-medium text-red-400">{logs.filter(l => l.level === 'error').length}</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-slate-400">Auto-scroll</span>
          <Switch checked={autoScroll} onCheckedChange={setAutoScroll} className="data-[state=checked]:bg-cyan-500" />
        </div>
      </div>

      {/* Logs */}
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="p-4 space-y-1 font-mono text-sm">
          {filteredLogs.map((log) => {
            const config = levelConfig[log.level];
            const Icon = config.icon;
            
            return (
              <div 
                key={log.id}
                className={cn(
                  'flex items-start gap-3 p-2 rounded hover:bg-slate-800/30 transition-colors'
                )}
              >
                <span className="text-slate-500 text-xs whitespace-nowrap">{formatTime(log.timestamp)}</span>
                
                <Badge 
                  variant="outline" 
                  className={cn('text-xs capitalize flex-shrink-0', config.border, config.color, config.bg)}
                >
                  <Icon className="w-3 h-3 mr-1" />
                  {log.level}
                </Badge>
                
                <Badge variant="outline" className="text-xs border-slate-700 text-slate-400 flex-shrink-0">
                  {log.source}
                </Badge>
                
                <span className={cn('text-slate-300', log.level === 'error' && 'text-red-300')}>
                  {log.message}
                </span>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
