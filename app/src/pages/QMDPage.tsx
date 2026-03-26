import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Database, Search, Filter, TrendingUp, AlertTriangle,
  CheckCircle, BarChart3, Download, RefreshCw,
  User, MessageSquare, Brain, Star,
  ChevronDown, ChevronUp, Eye, Clock, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { fetchSessions, fetchSessionMessages, fetchAgents } from '@/lib/openclaw-api';
import type { Agent, Session, Message } from '@/types';

// ---------------------------------------------------------------------------
// Local types derived from real gateway data
// ---------------------------------------------------------------------------

interface QMDSession {
  id: string;
  agentId: string;
  agentName: string;
  agentEmoji: string;
  sessionKey: string;
  timestamp: string;
  messageCount: number;
  avgResponseTimeMs: number;
  status: 'excellent' | 'good' | 'average' | 'needs-review';
  rating: number | null;
  flags: string[];
}

interface AgentProfile {
  agentId: string;
  agentName: string;
  agentEmoji: string;
  avgResponseTimeMs: number;
  sessionCount: number;
  totalMessages: number;
  trend: 'up' | 'down' | 'stable';
}

interface TrendDay {
  date: string;
  sessionCount: number;
  avgResponseTimeMs: number;
}

// ---------------------------------------------------------------------------
// localStorage helpers for ratings
// ---------------------------------------------------------------------------

const RATINGS_KEY = 'clawcommand.qmd.ratings';

function loadRatings(): Record<string, number> {
  try {
    const raw = localStorage.getItem(RATINGS_KEY);
    if (raw) return JSON.parse(raw) as Record<string, number>;
  } catch {
    // ignore corrupt data
  }
  return {};
}

function saveRatings(ratings: Record<string, number>) {
  localStorage.setItem(RATINGS_KEY, JSON.stringify(ratings));
}

// ---------------------------------------------------------------------------
// Metric derivation helpers
// ---------------------------------------------------------------------------

function computeAvgResponseTimeMs(messages: Message[]): number {
  let totalMs = 0;
  let pairs = 0;
  for (let i = 0; i < messages.length - 1; i++) {
    if (messages[i].role === 'user' && messages[i + 1].role === 'assistant') {
      const userTs = new Date(messages[i].timestamp).getTime();
      const assistantTs = new Date(messages[i + 1].timestamp).getTime();
      const diff = assistantTs - userTs;
      if (diff > 0 && diff < 600_000) {
        totalMs += diff;
        pairs++;
      }
    }
  }
  return pairs > 0 ? Math.round(totalMs / pairs) : 0;
}

function deriveStatus(avgMs: number, messageCount: number): QMDSession['status'] {
  if (avgMs > 0 && avgMs < 5000 && messageCount > 10) return 'excellent';
  if (avgMs > 0 && avgMs < 15000) return 'good';
  if (avgMs > 0 && avgMs < 30000 && messageCount >= 3) return 'average';
  return 'needs-review';
}

function deriveFlags(avgMs: number, messageCount: number): string[] {
  const flags: string[] = [];
  if (avgMs > 30000) flags.push('slow_response');
  if (messageCount < 3) flags.push('low_messages');
  if (avgMs === 0 && messageCount > 0) flags.push('no_timing_data');
  return flags;
}

function formatMs(ms: number): string {
  if (ms === 0) return '--';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

// ---------------------------------------------------------------------------
// Skeleton loader
// ---------------------------------------------------------------------------

function SkeletonRow() {
  return (
    <TableRow className="border-slate-800 animate-pulse">
      {Array.from({ length: 8 }).map((_, i) => (
        <TableCell key={i}>
          <div className="h-4 bg-slate-700/50 rounded w-20" />
        </TableCell>
      ))}
    </TableRow>
  );
}

function SkeletonCard() {
  return (
    <Card className="bg-slate-900/50 border-slate-800 animate-pulse">
      <CardContent className="p-4">
        <div className="h-4 bg-slate-700/50 rounded w-24 mb-2" />
        <div className="h-8 bg-slate-700/50 rounded w-16" />
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Star rating component
// ---------------------------------------------------------------------------

function StarRating({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (rating: number) => void;
}) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className="p-0 border-0 bg-transparent cursor-pointer"
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          onClick={(e) => {
            e.stopPropagation();
            onChange(star);
          }}
        >
          <Star
            className={`w-4 h-4 transition-colors ${
              star <= (hover || value || 0)
                ? 'fill-amber-400 text-amber-400'
                : 'text-slate-600'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function QMDPage() {
  // Data state
  const [sessions, setSessions] = useState<Session[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [sessionMessages, setSessionMessages] = useState<Record<string, Message[]>>({});
  const [ratings, setRatings] = useState<Record<string, number>>(loadRatings);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [selectedSession, setSelectedSession] = useState<QMDSession | null>(null);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);

  // -------------------------------------------------------------------------
  // Data fetching
  // -------------------------------------------------------------------------

  const loadData = useCallback(async (showToast = false) => {
    const [sessionsRes, agentsRes] = await Promise.all([
      fetchSessions(),
      fetchAgents(),
    ]);

    if (!sessionsRes.ok) {
      toast.error(`Failed to load sessions: ${sessionsRes.error}`);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (!agentsRes.ok) {
      toast.error(`Failed to load agents: ${agentsRes.error}`);
    }

    setSessions(sessionsRes.data);
    if (agentsRes.ok) setAgents(agentsRes.data);

    // Fetch messages for first 20 sessions
    const toFetch = sessionsRes.data.slice(0, 20);
    const msgResults = await Promise.allSettled(
      toFetch.map((s) => fetchSessionMessages(s.key))
    );

    const msgMap: Record<string, Message[]> = {};
    msgResults.forEach((result, idx) => {
      if (result.status === 'fulfilled' && result.value.ok) {
        msgMap[toFetch[idx].key] = result.value.data;
      }
    });
    setSessionMessages(msgMap);
    setLoading(false);
    setRefreshing(false);
    if (showToast) toast.success('QMD data refreshed');
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // -------------------------------------------------------------------------
  // Derive QMD sessions
  // -------------------------------------------------------------------------

  const qmdSessions = useMemo<QMDSession[]>(() => {
    return sessions.map((s) => {
      const msgs = sessionMessages[s.key] || [];
      const avgResponseTimeMs = computeAvgResponseTimeMs(msgs);
      const messageCount = s.messageCount || msgs.length;
      const status = deriveStatus(avgResponseTimeMs, messageCount);
      const flags = deriveFlags(avgResponseTimeMs, messageCount);
      return {
        id: s.id,
        agentId: s.agentId,
        agentName: s.agentName,
        agentEmoji: s.agentEmoji,
        sessionKey: s.key,
        timestamp: s.lastActivity,
        messageCount,
        avgResponseTimeMs,
        status,
        rating: ratings[s.id] ?? null,
        flags,
      };
    });
  }, [sessions, sessionMessages, ratings]);

  // -------------------------------------------------------------------------
  // Filtered sessions
  // -------------------------------------------------------------------------

  const filteredSessions = useMemo(() => {
    return qmdSessions.filter((session) => {
      const matchesSearch =
        session.agentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.sessionKey.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || session.status === statusFilter;
      const matchesAgent = agentFilter === 'all' || session.agentId === agentFilter;
      return matchesSearch && matchesStatus && matchesAgent;
    });
  }, [qmdSessions, searchQuery, statusFilter, agentFilter]);

  // -------------------------------------------------------------------------
  // Agent profiles
  // -------------------------------------------------------------------------

  const agentProfiles = useMemo<AgentProfile[]>(() => {
    const byAgent = new Map<string, QMDSession[]>();
    for (const s of qmdSessions) {
      const existing = byAgent.get(s.agentId) || [];
      existing.push(s);
      byAgent.set(s.agentId, existing);
    }

    return Array.from(byAgent.entries()).map(([agentId, agentSessions]) => {
      const sorted = [...agentSessions].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      const half = Math.max(1, Math.floor(sorted.length / 2));
      const recent = sorted.slice(0, half);
      const older = sorted.slice(half);

      const avgRecent =
        recent.reduce((sum, s) => sum + s.avgResponseTimeMs, 0) / recent.length || 0;
      const avgOlder =
        older.length > 0
          ? older.reduce((sum, s) => sum + s.avgResponseTimeMs, 0) / older.length
          : avgRecent;

      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (avgRecent > 0 && avgOlder > 0) {
        const diff = avgOlder - avgRecent;
        if (diff > 2000) trend = 'up'; // improving (faster)
        else if (diff < -2000) trend = 'down'; // degrading (slower)
      }

      const first = agentSessions[0];
      const agent = agents.find((a) => a.id === agentId);

      return {
        agentId,
        agentName: agent?.name || first?.agentName || agentId,
        agentEmoji: agent?.emoji || first?.agentEmoji || '',
        avgResponseTimeMs: Math.round(
          agentSessions.reduce((sum, s) => sum + s.avgResponseTimeMs, 0) /
            agentSessions.length
        ),
        sessionCount: agentSessions.length,
        totalMessages: agentSessions.reduce((sum, s) => sum + s.messageCount, 0),
        trend,
      };
    });
  }, [qmdSessions, agents]);

  // -------------------------------------------------------------------------
  // Trend data (group by date)
  // -------------------------------------------------------------------------

  const trendDays = useMemo<TrendDay[]>(() => {
    const byDate = new Map<string, QMDSession[]>();
    for (const s of qmdSessions) {
      const date = s.timestamp ? s.timestamp.slice(0, 10) : 'unknown';
      if (date === 'unknown') continue;
      const existing = byDate.get(date) || [];
      existing.push(s);
      byDate.set(date, existing);
    }

    return Array.from(byDate.entries())
      .map(([date, daySessions]) => ({
        date,
        sessionCount: daySessions.length,
        avgResponseTimeMs: Math.round(
          daySessions.reduce((sum, s) => sum + s.avgResponseTimeMs, 0) /
            daySessions.length
        ),
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14); // last 14 days
  }, [qmdSessions]);

  // -------------------------------------------------------------------------
  // Overview metrics
  // -------------------------------------------------------------------------

  const overviewMetrics = useMemo(() => {
    const total = qmdSessions.length;
    const avgResponseTimeMs =
      total > 0
        ? Math.round(
            qmdSessions.reduce((sum, s) => sum + s.avgResponseTimeMs, 0) / total
          )
        : 0;
    const needsReview = qmdSessions.filter(
      (s) => s.status === 'needs-review' || s.rating === null
    ).length;
    const rated = qmdSessions.filter((s) => s.rating !== null).length;
    return { avgResponseTimeMs, total, needsReview, rated };
  }, [qmdSessions]);

  // -------------------------------------------------------------------------
  // Unique agents for filter dropdown
  // -------------------------------------------------------------------------

  const uniqueAgents = useMemo(() => {
    const seen = new Map<string, { id: string; name: string }>();
    for (const s of qmdSessions) {
      if (!seen.has(s.agentId)) {
        seen.set(s.agentId, { id: s.agentId, name: s.agentName });
      }
    }
    return Array.from(seen.values());
  }, [qmdSessions]);

  // -------------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------------

  const handleRate = useCallback(
    (sessionId: string, rating: number) => {
      const next = { ...ratings, [sessionId]: rating };
      setRatings(next);
      saveRatings(next);
      toast.success(`Rated session ${rating}/5`);
    },
    [ratings]
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    void loadData(true);
  }, [loadData]);

  const handleExport = useCallback(() => {
    const rows = [
      ['Session ID', 'Agent', 'Messages', 'Avg Response Time', 'Status', 'Rating', 'Flags', 'Last Activity'].join(','),
      ...qmdSessions.map((s) =>
        [
          s.sessionKey,
          s.agentName,
          s.messageCount,
          formatMs(s.avgResponseTimeMs),
          s.status,
          s.rating ?? '',
          s.flags.join('; '),
          s.timestamp,
        ].join(',')
      ),
    ].join('\n');
    const blob = new Blob([rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qmd-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('QMD data exported to CSV');
  }, [qmdSessions]);

  // -------------------------------------------------------------------------
  // UI helpers
  // -------------------------------------------------------------------------

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'good':
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      case 'average':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'needs-review':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400';
    }
  };

  const getResponseTimeColor = (ms: number) => {
    if (ms === 0) return 'text-slate-500';
    if (ms < 5000) return 'text-green-400';
    if (ms < 15000) return 'text-cyan-400';
    if (ms < 30000) return 'text-amber-400';
    return 'text-red-400';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'down':
        return <TrendingUp className="w-4 h-4 text-red-400 rotate-180" />;
      default:
        return <div className="w-4 h-4 rounded-full bg-amber-400/60" />;
    }
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="h-full overflow-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                Quality Management Database
              </h1>
              <p className="text-slate-400">
                Monitor and analyze agent conversation quality
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Refresh
            </Button>
            <Button variant="outline" onClick={handleExport} disabled={loading}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Avg Response Time</p>
                    <p className={`text-2xl font-bold ${getResponseTimeColor(overviewMetrics.avgResponseTimeMs)}`}>
                      {formatMs(overviewMetrics.avgResponseTimeMs)}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-cyan-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Total Sessions</p>
                    <p className="text-2xl font-bold text-white">
                      {overviewMetrics.total}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Needs Review</p>
                    <p className="text-2xl font-bold text-white">
                      {overviewMetrics.needsReview}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                  </div>
                </div>
                {overviewMetrics.total > 0 && (
                  <div className="flex items-center gap-1 mt-2">
                    <span className="text-sm text-slate-500">
                      {Math.round(
                        (overviewMetrics.needsReview / overviewMetrics.total) * 100
                      )}
                      % of total
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Rated Sessions</p>
                    <p className="text-2xl font-bold text-white">
                      {overviewMetrics.rated}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  </div>
                </div>
                {overviewMetrics.total > 0 && (
                  <div className="flex items-center gap-1 mt-2">
                    <span className="text-sm text-slate-500">
                      {Math.round(
                        (overviewMetrics.rated / overviewMetrics.total) * 100
                      )}
                      % rated
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Tabs defaultValue="sessions" className="space-y-6">
        <TabsList className="bg-slate-900/50 border border-slate-800">
          <TabsTrigger
            value="sessions"
            className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Sessions
          </TabsTrigger>
          <TabsTrigger
            value="agents"
            className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400"
          >
            <Brain className="w-4 h-4 mr-2" />
            Agent Profiles
          </TabsTrigger>
          <TabsTrigger
            value="trends"
            className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Trends
          </TabsTrigger>
        </TabsList>

        {/* Sessions Tab */}
        <TabsContent value="sessions" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search sessions..."
                className="pl-10 bg-slate-800 border-slate-700"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="excellent">Excellent</SelectItem>
                <SelectItem value="good">Good</SelectItem>
                <SelectItem value="average">Average</SelectItem>
                <SelectItem value="needs-review">Needs Review</SelectItem>
              </SelectContent>
            </Select>
            <Select value={agentFilter} onValueChange={setAgentFilter}>
              <SelectTrigger className="w-[200px] bg-slate-800 border-slate-700">
                <User className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Agent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agents</SelectItem>
                {uniqueAgents.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sessions Table */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800 hover:bg-transparent">
                    <TableHead className="text-slate-400">Agent</TableHead>
                    <TableHead className="text-slate-400">Session</TableHead>
                    <TableHead className="text-slate-400">Messages</TableHead>
                    <TableHead className="text-slate-400">Avg Response</TableHead>
                    <TableHead className="text-slate-400">Status</TableHead>
                    <TableHead className="text-slate-400">Rating</TableHead>
                    <TableHead className="text-slate-400">Flags</TableHead>
                    <TableHead className="text-slate-400">Last Activity</TableHead>
                    <TableHead className="text-slate-400">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <>
                      <SkeletonRow />
                      <SkeletonRow />
                      <SkeletonRow />
                      <SkeletonRow />
                      <SkeletonRow />
                    </>
                  ) : filteredSessions.length === 0 ? (
                    <TableRow className="border-slate-800">
                      <TableCell colSpan={9} className="text-center py-12">
                        <div className="flex flex-col items-center gap-3">
                          <MessageSquare className="w-10 h-10 text-slate-600" />
                          <p className="text-slate-400 text-lg">No sessions found</p>
                          <p className="text-slate-500 text-sm">
                            {searchQuery || statusFilter !== 'all' || agentFilter !== 'all'
                              ? 'Try adjusting your filters'
                              : 'Sessions will appear here once agents start processing conversations'}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSessions.map((session) => (
                      <TableRow key={session.id} className="border-slate-800">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">
                              {session.agentEmoji || '🤖'}
                            </span>
                            <span className="text-white">{session.agentName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm text-slate-400">
                          {session.sessionKey.length > 16
                            ? `${session.sessionKey.slice(0, 16)}...`
                            : session.sessionKey}
                        </TableCell>
                        <TableCell className="text-slate-400">
                          {session.messageCount}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`font-medium ${getResponseTimeColor(session.avgResponseTimeMs)}`}
                          >
                            {formatMs(session.avgResponseTimeMs)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(session.status)}>
                            {session.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <StarRating
                            value={session.rating}
                            onChange={(r) => handleRate(session.id, r)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {session.flags.map((flag, i) => (
                              <Badge
                                key={i}
                                variant="outline"
                                className="text-xs border-red-500/30 text-red-400"
                              >
                                {flag}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-400">
                          {session.timestamp
                            ? new Date(session.timestamp).toLocaleString()
                            : '--'}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedSession(session)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Agent Profiles Tab */}
        <TabsContent value="agents" className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : agentProfiles.length === 0 ? (
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-12 text-center">
                <Brain className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-lg">No agent profiles yet</p>
                <p className="text-slate-500 text-sm mt-1">
                  Agent quality profiles will appear once sessions are available
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {agentProfiles.map((profile) => (
                <Card
                  key={profile.agentId}
                  className="bg-slate-900/50 border-slate-800"
                >
                  <CardContent className="p-4">
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() =>
                        setExpandedAgent(
                          expandedAgent === profile.agentId
                            ? null
                            : profile.agentId
                        )
                      }
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-3xl">
                          {profile.agentEmoji || '🤖'}
                        </span>
                        <div>
                          <h3 className="text-lg font-semibold text-white">
                            {profile.agentName}
                          </h3>
                          <p className="text-sm text-slate-400">
                            {profile.sessionCount} sessions evaluated
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-sm text-slate-400">
                            Avg Response Time
                          </p>
                          <p
                            className={`text-2xl font-bold ${getResponseTimeColor(profile.avgResponseTimeMs)}`}
                          >
                            {formatMs(profile.avgResponseTimeMs)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getTrendIcon(profile.trend)}
                          <span className="text-sm text-slate-400 capitalize">
                            {profile.trend}
                          </span>
                        </div>
                        {expandedAgent === profile.agentId ? (
                          <ChevronUp className="w-5 h-5 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {expandedAgent === profile.agentId && (
                      <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-3 gap-6">
                        <div className="p-3 bg-slate-800/50 rounded-lg">
                          <p className="text-sm text-slate-400">Total Messages</p>
                          <p className="text-white font-medium text-lg">
                            {profile.totalMessages}
                          </p>
                        </div>
                        <div className="p-3 bg-slate-800/50 rounded-lg">
                          <p className="text-sm text-slate-400">Sessions</p>
                          <p className="text-white font-medium text-lg">
                            {profile.sessionCount}
                          </p>
                        </div>
                        <div className="p-3 bg-slate-800/50 rounded-lg">
                          <p className="text-sm text-slate-400">
                            Avg Messages / Session
                          </p>
                          <p className="text-white font-medium text-lg">
                            {profile.sessionCount > 0
                              ? Math.round(
                                  profile.totalMessages / profile.sessionCount
                                )
                              : 0}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              <SkeletonCard />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SkeletonCard />
                <SkeletonCard />
              </div>
            </div>
          ) : trendDays.length === 0 ? (
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-12 text-center">
                <BarChart3 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-lg">No trend data yet</p>
                <p className="text-slate-500 text-sm mt-1">
                  Trends will populate as sessions accumulate over time
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Avg Response Time bar chart */}
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">
                    Avg Response Time by Day
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-end gap-2">
                    {trendDays.map((day, i) => {
                      const maxMs = Math.max(
                        ...trendDays.map((d) => d.avgResponseTimeMs),
                        1
                      );
                      const heightPct =
                        maxMs > 0
                          ? (day.avgResponseTimeMs / maxMs) * 100
                          : 0;
                      return (
                        <div
                          key={i}
                          className="flex-1 flex flex-col items-center gap-2"
                        >
                          <div className="w-full relative flex-1 flex items-end">
                            <div
                              className="w-full bg-gradient-to-t from-cyan-500 to-cyan-400 rounded-t-lg transition-all duration-500"
                              style={{
                                height: `${Math.max(heightPct, 5)}%`,
                              }}
                            />
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-medium text-cyan-400 whitespace-nowrap">
                              {formatMs(day.avgResponseTimeMs)}
                            </div>
                          </div>
                          <span className="text-xs text-slate-500">
                            {new Date(day.date + 'T00:00:00').toLocaleDateString(
                              'en-US',
                              { weekday: 'short', month: 'short', day: 'numeric' }
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Session Volume */}
                <Card className="bg-slate-900/50 border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-white">Session Volume</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {trendDays.map((day, i) => {
                        const maxCount = Math.max(
                          ...trendDays.map((d) => d.sessionCount),
                          1
                        );
                        return (
                          <div
                            key={i}
                            className="flex items-center justify-between"
                          >
                            <span className="text-sm text-slate-400">
                              {new Date(
                                day.date + 'T00:00:00'
                              ).toLocaleDateString()}
                            </span>
                            <div className="flex items-center gap-4">
                              <div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-500 rounded-full"
                                  style={{
                                    width: `${(day.sessionCount / maxCount) * 100}%`,
                                  }}
                                />
                              </div>
                              <span className="text-sm text-white w-12 text-right">
                                {day.sessionCount}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Response Time by Day */}
                <Card className="bg-slate-900/50 border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-white">
                      Response Time by Day
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {trendDays.map((day, i) => {
                        const maxMs = Math.max(
                          ...trendDays.map((d) => d.avgResponseTimeMs),
                          1
                        );
                        return (
                          <div
                            key={i}
                            className="flex items-center justify-between"
                          >
                            <span className="text-sm text-slate-400">
                              {new Date(
                                day.date + 'T00:00:00'
                              ).toLocaleDateString()}
                            </span>
                            <div className="flex items-center gap-4">
                              <div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-purple-500 rounded-full"
                                  style={{
                                    width: `${maxMs > 0 ? (day.avgResponseTimeMs / maxMs) * 100 : 0}%`,
                                  }}
                                />
                              </div>
                              <span className="text-sm text-white w-16 text-right">
                                {formatMs(day.avgResponseTimeMs)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Session Detail Dialog */}
      <Dialog
        open={!!selectedSession}
        onOpenChange={() => setSelectedSession(null)}
      >
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">
                {selectedSession?.agentEmoji || '🤖'}
              </span>
              Session Quality Report
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {selectedSession?.sessionKey}
            </DialogDescription>
          </DialogHeader>
          {selectedSession && (
            <div className="space-y-6 pt-4">
              {/* Status & Rating */}
              <div className="flex items-center justify-center gap-8">
                <div className="text-center">
                  <Badge
                    className={`text-lg px-4 py-1 ${getStatusColor(selectedSession.status)}`}
                  >
                    {selectedSession.status.toUpperCase()}
                  </Badge>
                </div>
                <div className="text-center">
                  <p className="text-sm text-slate-400 mb-1">Your Rating</p>
                  <StarRating
                    value={selectedSession.rating}
                    onChange={(r) => handleRate(selectedSession.id, r)}
                  />
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-800/50 rounded-lg">
                  <p className="text-sm text-slate-400">Messages</p>
                  <p className="text-white font-medium text-lg">
                    {selectedSession.messageCount}
                  </p>
                </div>
                <div className="p-3 bg-slate-800/50 rounded-lg">
                  <p className="text-sm text-slate-400">Avg Response Time</p>
                  <p
                    className={`font-medium text-lg ${getResponseTimeColor(selectedSession.avgResponseTimeMs)}`}
                  >
                    {formatMs(selectedSession.avgResponseTimeMs)}
                  </p>
                </div>
                <div className="p-3 bg-slate-800/50 rounded-lg">
                  <p className="text-sm text-slate-400">Agent</p>
                  <p className="text-white font-medium">
                    {selectedSession.agentEmoji} {selectedSession.agentName}
                  </p>
                </div>
                <div className="p-3 bg-slate-800/50 rounded-lg">
                  <p className="text-sm text-slate-400">Last Activity</p>
                  <p className="text-white font-medium">
                    {selectedSession.timestamp
                      ? new Date(selectedSession.timestamp).toLocaleString()
                      : '--'}
                  </p>
                </div>
              </div>

              {/* Flags */}
              <div className="p-3 bg-slate-800/50 rounded-lg">
                <p className="text-sm text-slate-400 mb-2">Flags</p>
                <div className="flex gap-1 flex-wrap">
                  {selectedSession.flags.length > 0 ? (
                    selectedSession.flags.map((flag, i) => (
                      <Badge
                        key={i}
                        variant="outline"
                        className="text-xs border-red-500/30 text-red-400"
                      >
                        {flag}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-green-400">No flags</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default QMDPage;
