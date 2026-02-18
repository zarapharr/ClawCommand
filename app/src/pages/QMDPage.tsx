import { useState } from 'react';
import { 
  Database, Search, Filter, TrendingUp, AlertTriangle, 
  CheckCircle, XCircle, BarChart3, Download, RefreshCw,
  User, MessageSquare, Brain, Target, Zap,
  ChevronDown, ChevronUp, Eye
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

interface QMDSession {
  id: string;
  agentId: string;
  agentName: string;
  agentEmoji: string;
  sessionKey: string;
  timestamp: string;
  metrics: {
    responseQuality: number;
    relevance: number;
    accuracy: number;
    helpfulness: number;
    tone: number;
  };
  overallScore: number;
  status: 'excellent' | 'good' | 'average' | 'poor';
  messageCount: number;
  userFeedback?: 'positive' | 'negative' | 'neutral';
  flags: string[];
}

interface QualityTrend {
  date: string;
  avgScore: number;
  totalSessions: number;
  flaggedSessions: number;
}

interface AgentQualityProfile {
  agentId: string;
  agentName: string;
  agentEmoji: string;
  avgScore: number;
  totalSessions: number;
  trend: 'up' | 'down' | 'stable';
  strengths: string[];
  improvements: string[];
}

const mockQMDSessions: QMDSession[] = [
  {
    id: 'qmd-001',
    agentId: 'agent-1',
    agentName: 'Claude Assistant',
    agentEmoji: '🎯',
    sessionKey: 'session-abc123',
    timestamp: '2026-02-17T10:30:00Z',
    metrics: {
      responseQuality: 92,
      relevance: 95,
      accuracy: 88,
      helpfulness: 90,
      tone: 94,
    },
    overallScore: 91.8,
    status: 'excellent',
    messageCount: 24,
    userFeedback: 'positive',
    flags: [],
  },
  {
    id: 'qmd-002',
    agentId: 'agent-2',
    agentName: 'Code Reviewer',
    agentEmoji: '🔍',
    sessionKey: 'session-def456',
    timestamp: '2026-02-17T09:15:00Z',
    metrics: {
      responseQuality: 78,
      relevance: 82,
      accuracy: 85,
      helpfulness: 75,
      tone: 80,
    },
    overallScore: 80,
    status: 'good',
    messageCount: 18,
    userFeedback: 'neutral',
    flags: ['slow_response'],
  },
  {
    id: 'qmd-003',
    agentId: 'agent-3',
    agentName: 'Data Analyzer',
    agentEmoji: '📊',
    sessionKey: 'session-ghi789',
    timestamp: '2026-02-17T08:45:00Z',
    metrics: {
      responseQuality: 65,
      relevance: 70,
      accuracy: 72,
      helpfulness: 60,
      tone: 75,
    },
    overallScore: 68.4,
    status: 'average',
    messageCount: 12,
    userFeedback: 'negative',
    flags: ['incomplete_answer', 'off_topic'],
  },
  {
    id: 'qmd-004',
    agentId: 'agent-1',
    agentName: 'Claude Assistant',
    agentEmoji: '🎯',
    sessionKey: 'session-jkl012',
    timestamp: '2026-02-16T16:20:00Z',
    metrics: {
      responseQuality: 45,
      relevance: 50,
      accuracy: 55,
      helpfulness: 40,
      tone: 60,
    },
    overallScore: 50,
    status: 'poor',
    messageCount: 8,
    userFeedback: 'negative',
    flags: ['hallucination', 'incorrect_info', 'poor_tone'],
  },
  {
    id: 'qmd-005',
    agentId: 'agent-4',
    agentName: 'Support Bot',
    agentEmoji: '🎧',
    sessionKey: 'session-mno345',
    timestamp: '2026-02-16T14:00:00Z',
    metrics: {
      responseQuality: 88,
      relevance: 90,
      accuracy: 92,
      helpfulness: 85,
      tone: 89,
    },
    overallScore: 88.8,
    status: 'good',
    messageCount: 32,
    userFeedback: 'positive',
    flags: [],
  },
];

const mockQualityTrends: QualityTrend[] = [
  { date: '2026-02-11', avgScore: 82, totalSessions: 145, flaggedSessions: 12 },
  { date: '2026-02-12', avgScore: 84, totalSessions: 152, flaggedSessions: 10 },
  { date: '2026-02-13', avgScore: 81, totalSessions: 138, flaggedSessions: 15 },
  { date: '2026-02-14', avgScore: 85, totalSessions: 160, flaggedSessions: 8 },
  { date: '2026-02-15', avgScore: 87, totalSessions: 175, flaggedSessions: 7 },
  { date: '2026-02-16', avgScore: 86, totalSessions: 168, flaggedSessions: 9 },
  { date: '2026-02-17', avgScore: 88, totalSessions: 120, flaggedSessions: 5 },
];

const mockAgentProfiles: AgentQualityProfile[] = [
  {
    agentId: 'agent-1',
    agentName: 'Claude Assistant',
    agentEmoji: '🎯',
    avgScore: 87.5,
    totalSessions: 450,
    trend: 'up',
    strengths: ['Context understanding', 'Helpful responses', 'Professional tone'],
    improvements: ['Response speed', 'Technical depth'],
  },
  {
    agentId: 'agent-2',
    agentName: 'Code Reviewer',
    agentEmoji: '🔍',
    avgScore: 82.3,
    totalSessions: 320,
    trend: 'stable',
    strengths: ['Code accuracy', 'Best practices', 'Detailed feedback'],
    improvements: ['Explanation clarity', 'Beginner-friendly language'],
  },
  {
    agentId: 'agent-3',
    agentName: 'Data Analyzer',
    agentEmoji: '📊',
    avgScore: 75.8,
    totalSessions: 280,
    trend: 'down',
    strengths: ['Data processing', 'Visualization suggestions'],
    improvements: ['User guidance', 'Result explanation', 'Edge case handling'],
  },
  {
    agentId: 'agent-4',
    agentName: 'Support Bot',
    agentEmoji: '🎧',
    avgScore: 89.2,
    totalSessions: 520,
    trend: 'up',
    strengths: ['Quick responses', 'Friendly tone', 'Problem resolution'],
    improvements: ['Complex issue handling'],
  },
];

export function QMDPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [selectedSession, setSelectedSession] = useState<QMDSession | null>(null);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);

  const filteredSessions = mockQMDSessions.filter(session => {
    const matchesSearch = 
      session.agentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.sessionKey.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || session.status === statusFilter;
    const matchesAgent = agentFilter === 'all' || session.agentId === agentFilter;
    return matchesSearch && matchesStatus && matchesAgent;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'good': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      case 'average': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'poor': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 80) return 'text-cyan-400';
    if (score >= 70) return 'text-amber-400';
    return 'text-red-400';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'down': return <TrendingUp className="w-4 h-4 text-red-400 rotate-180" />;
      default: return <div className="w-4 h-4 rounded-full bg-amber-400" />;
    }
  };

  const exportData = () => {
    toast.success('QMD data exported to CSV');
  };

  const refreshData = () => {
    toast.success('QMD data refreshed');
  };

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
              <h1 className="text-2xl font-bold text-white">Quality Management Database</h1>
              <p className="text-slate-400">Monitor and analyze agent conversation quality</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={refreshData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" onClick={exportData}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Avg Quality Score</p>
                <p className="text-2xl font-bold text-white">84.2</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <Target className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-sm text-green-400">+2.4%</span>
              <span className="text-sm text-slate-500">vs last week</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Sessions</p>
                <p className="text-2xl font-bold text-white">1,570</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-blue-400" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-sm text-slate-500">+145 today</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Flagged Sessions</p>
                <p className="text-2xl font-bold text-white">66</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-sm text-green-400">4.2%</span>
              <span className="text-sm text-slate-500">of total</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Positive Feedback</p>
                <p className="text-2xl font-bold text-white">78%</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-sm text-green-400">+5%</span>
              <span className="text-sm text-slate-500">vs last week</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sessions" className="space-y-6">
        <TabsList className="bg-slate-900/50 border border-slate-800">
          <TabsTrigger value="sessions" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            <MessageSquare className="w-4 h-4 mr-2" />
            Sessions
          </TabsTrigger>
          <TabsTrigger value="agents" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            <Brain className="w-4 h-4 mr-2" />
            Agent Profiles
          </TabsTrigger>
          <TabsTrigger value="trends" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
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
              <SelectTrigger className="w-[150px] bg-slate-800 border-slate-700">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="excellent">Excellent</SelectItem>
                <SelectItem value="good">Good</SelectItem>
                <SelectItem value="average">Average</SelectItem>
                <SelectItem value="poor">Poor</SelectItem>
              </SelectContent>
            </Select>
            <Select value={agentFilter} onValueChange={setAgentFilter}>
              <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700">
                <User className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Agent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agents</SelectItem>
                <SelectItem value="agent-1">Claude Assistant</SelectItem>
                <SelectItem value="agent-2">Code Reviewer</SelectItem>
                <SelectItem value="agent-3">Data Analyzer</SelectItem>
                <SelectItem value="agent-4">Support Bot</SelectItem>
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
                    <TableHead className="text-slate-400">Score</TableHead>
                    <TableHead className="text-slate-400">Status</TableHead>
                    <TableHead className="text-slate-400">Messages</TableHead>
                    <TableHead className="text-slate-400">Feedback</TableHead>
                    <TableHead className="text-slate-400">Flags</TableHead>
                    <TableHead className="text-slate-400">Time</TableHead>
                    <TableHead className="text-slate-400">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSessions.map((session) => (
                    <TableRow key={session.id} className="border-slate-800">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{session.agentEmoji}</span>
                          <span className="text-white">{session.agentName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm text-slate-400">
                        {session.sessionKey.slice(0, 12)}...
                      </TableCell>
                      <TableCell>
                        <span className={`text-lg font-bold ${getScoreColor(session.overallScore)}`}>
                          {session.overallScore.toFixed(1)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(session.status)}>
                          {session.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-400">{session.messageCount}</TableCell>
                      <TableCell>
                        {session.userFeedback === 'positive' && <CheckCircle className="w-5 h-5 text-green-400" />}
                        {session.userFeedback === 'negative' && <XCircle className="w-5 h-5 text-red-400" />}
                        {session.userFeedback === 'neutral' && <div className="w-5 h-5 rounded-full bg-slate-500" />}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {session.flags.map((flag, i) => (
                            <Badge key={i} variant="outline" className="text-xs border-red-500/30 text-red-400">
                              {flag}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-400">
                        {new Date(session.timestamp).toLocaleString()}
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
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Agent Profiles Tab */}
        <TabsContent value="agents" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {mockAgentProfiles.map((profile) => (
              <Card key={profile.agentId} className="bg-slate-900/50 border-slate-800">
                <CardContent className="p-4">
                  <div 
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setExpandedAgent(expandedAgent === profile.agentId ? null : profile.agentId)}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-3xl">{profile.agentEmoji}</span>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{profile.agentName}</h3>
                        <p className="text-sm text-slate-400">{profile.totalSessions} sessions evaluated</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm text-slate-400">Average Score</p>
                        <p className={`text-2xl font-bold ${getScoreColor(profile.avgScore)}`}>
                          {profile.avgScore.toFixed(1)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getTrendIcon(profile.trend)}
                        <span className="text-sm text-slate-400 capitalize">{profile.trend}</span>
                      </div>
                      {expandedAgent === profile.agentId ? (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {expandedAgent === profile.agentId && (
                    <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-sm font-medium text-green-400 mb-2 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Strengths
                        </h4>
                        <ul className="space-y-1">
                          {profile.strengths.map((strength, i) => (
                            <li key={i} className="text-sm text-slate-300 flex items-center gap-2">
                              <Zap className="w-3 h-3 text-cyan-400" />
                              {strength}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-amber-400 mb-2 flex items-center gap-2">
                          <Target className="w-4 h-4" />
                          Areas for Improvement
                        </h4>
                        <ul className="space-y-1">
                          {profile.improvements.map((improvement, i) => (
                            <li key={i} className="text-sm text-slate-300 flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-amber-400" />
                              {improvement}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Quality Score Trend (7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end gap-2">
                {mockQualityTrends.map((trend, i) => {
                  const height = (trend.avgScore / 100) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full relative">
                        <div
                          className="w-full bg-gradient-to-t from-cyan-500 to-cyan-400 rounded-t-lg transition-all duration-500"
                          style={{ height: `${height}%`, minHeight: '20px' }}
                        />
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-sm font-medium text-cyan-400">
                          {trend.avgScore}
                        </div>
                      </div>
                      <span className="text-xs text-slate-500">
                        {new Date(trend.date).toLocaleDateString('en-US', { weekday: 'short' })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Session Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockQualityTrends.map((trend, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">
                        {new Date(trend.date).toLocaleDateString()}
                      </span>
                      <div className="flex items-center gap-4">
                        <div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${(trend.totalSessions / 200) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-white w-12 text-right">{trend.totalSessions}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Flagged Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockQualityTrends.map((trend, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">
                        {new Date(trend.date).toLocaleDateString()}
                      </span>
                      <div className="flex items-center gap-4">
                        <div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full"
                            style={{ width: `${(trend.flaggedSessions / 20) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-white w-12 text-right">{trend.flaggedSessions}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Session Detail Dialog */}
      <Dialog open={!!selectedSession} onOpenChange={() => setSelectedSession(null)}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">{selectedSession?.agentEmoji}</span>
              Session Quality Report
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {selectedSession?.sessionKey}
            </DialogDescription>
          </DialogHeader>
          {selectedSession && (
            <div className="space-y-6 pt-4">
              {/* Overall Score */}
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <div className={`text-5xl font-bold ${getScoreColor(selectedSession.overallScore)}`}>
                    {selectedSession.overallScore.toFixed(1)}
                  </div>
                  <p className="text-slate-400 mt-1">Overall Score</p>
                  <Badge className={`mt-2 ${getStatusColor(selectedSession.status)}`}>
                    {selectedSession.status.toUpperCase()}
                  </Badge>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-5 gap-4">
                {Object.entries(selectedSession.metrics).map(([key, value]) => (
                  <div key={key} className="text-center p-3 bg-slate-800/50 rounded-lg">
                    <div className={`text-xl font-bold ${getScoreColor(value)}`}>{value}</div>
                    <p className="text-xs text-slate-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                  </div>
                ))}
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-800/50 rounded-lg">
                  <p className="text-sm text-slate-400">Messages</p>
                  <p className="text-white font-medium">{selectedSession.messageCount}</p>
                </div>
                <div className="p-3 bg-slate-800/50 rounded-lg">
                  <p className="text-sm text-slate-400">User Feedback</p>
                  <p className="text-white font-medium capitalize">{selectedSession.userFeedback || 'None'}</p>
                </div>
                <div className="p-3 bg-slate-800/50 rounded-lg">
                  <p className="text-sm text-slate-400">Timestamp</p>
                  <p className="text-white font-medium">{new Date(selectedSession.timestamp).toLocaleString()}</p>
                </div>
                <div className="p-3 bg-slate-800/50 rounded-lg">
                  <p className="text-sm text-slate-400">Flags</p>
                  <div className="flex gap-1 flex-wrap">
                    {selectedSession.flags.length > 0 ? selectedSession.flags.map((flag, i) => (
                      <Badge key={i} variant="outline" className="text-xs border-red-500/30 text-red-400">
                        {flag}
                      </Badge>
                    )) : (
                      <span className="text-green-400">No flags</span>
                    )}
                  </div>
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
