import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AuditLog } from '@/components/audit/AuditLog';
import { mockAuditLogs } from '@/data/enterprise-mock';
import {
  FileText, Shield, Clock, CheckCircle, AlertTriangle, Download,
  BarChart3, TrendingUp
} from 'lucide-react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';

export function AuditPage() {
  const [exportFormat] = useState<'csv' | 'json'>('csv');

  // Transform mock audit logs to AuditEvent format
  const auditEvents = useMemo(() => {
    return mockAuditLogs.map((log) => {
      const changeEntries = Object.entries(log.changes || {}).map(([field, change]) => ({
        field,
        old: change.old,
        new: change.new,
      }));

      const before: Record<string, unknown> = {};
      const after: Record<string, unknown> = {};

      changeEntries.forEach(({ field, old, new: newVal }) => {
        before[field] = old;
        after[field] = newVal;
      });

      return {
        id: log.id,
        timestamp: log.timestamp,
        actor: log.userName,
        actorId: log.userId,
        action: log.action,
        resourceType: log.resourceType as any,
        resourceId: log.resourceId,
        resourceName: log.resourceId,
        before: Object.keys(before).length > 0 ? before : undefined,
        after: Object.keys(after).length > 0 ? after : undefined,
        status: 'approved' as const,
        ipAddress: log.ipAddress,
      };
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, []);

  // Statistics
  const stats = useMemo(() => {
    const total = auditEvents.length;
    const byAction = auditEvents.reduce((acc, e) => {
      acc[e.action] = (acc[e.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byResourceType = auditEvents.reduce((acc, e) => {
      acc[e.resourceType] = (acc[e.resourceType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byActor = auditEvents.reduce((acc, e) => {
      acc[e.actor] = (acc[e.actor] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { total, byAction, byResourceType, byActor };
  }, [auditEvents]);

  // Timeline data (last 30 days)
  const timelineData = useMemo(() => {
    const days: Record<string, number> = {};
    auditEvents.forEach(event => {
      const date = new Date(event.timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      days[date] = (days[date] || 0) + 1;
    });

    return Object.entries(days)
      .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
      .slice(-30)
      .map(([date, count]) => ({ date, events: count }));
  }, [auditEvents]);

  // Export functionality
  const exportAuditLog = (format: 'csv' | 'json') => {
    let content: string;
    let filename: string;
    let mimeType: string;

    if (format === 'csv') {
      const headers = ['Timestamp', 'Actor', 'Action', 'Resource Type', 'Resource ID', 'IP Address'];
      const rows = auditEvents.map(e => [
        new Date(e.timestamp).toLocaleString(),
        e.actor,
        e.action,
        e.resourceType,
        e.resourceId,
        e.ipAddress || 'N/A',
      ]);

      content = [
        headers.join(','),
        ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
      ].join('\n');

      filename = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
      mimeType = 'text/csv';
    } else {
      content = JSON.stringify(auditEvents, null, 2);
      filename = `audit-log-${new Date().toISOString().split('T')[0]}.json`;
      mimeType = 'application/json';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 flex items-center justify-center">
            <Shield className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">
              <span className="text-blue-400">Audit</span> Trail
            </h1>
            <p className="text-xs text-slate-400">Immutable activity log & compliance</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-800">
            <FileText className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-medium text-white">{auditEvents.length}</span>
            <span className="text-xs text-slate-400">events</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportAuditLog(exportFormat)}
            className="border-slate-700 text-slate-300"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden p-6">
        <Tabs defaultValue="timeline" className="h-full flex flex-col">
          <TabsList className="bg-slate-900/50 border border-slate-800 w-fit">
            <TabsTrigger value="timeline" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">
              <Clock className="w-4 h-4 mr-2" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="log" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">
              <FileText className="w-4 h-4 mr-2" />
              Full Log
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-auto mt-6">
            {/* Timeline Tab */}
            <TabsContent value="timeline" className="mt-0 space-y-6">
              {/* Activity Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="holo-card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400">Total Events</span>
                    <FileText className="w-4 h-4 text-blue-400" />
                  </div>
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                  <p className="text-xs text-slate-500 mt-1">Last 90 days</p>
                </div>

                <div className="holo-card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400">Actions</span>
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {Object.keys(stats.byAction).length}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Action types</p>
                </div>

                <div className="holo-card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400">Actors</span>
                    <CheckCircle className="w-4 h-4 text-cyan-400" />
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {Object.keys(stats.byActor).length}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Users</p>
                </div>

                <div className="holo-card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400">Resource Types</span>
                    <AlertTriangle className="w-4 h-4 text-orange-400" />
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {Object.keys(stats.byResourceType).length}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Types modified</p>
                </div>
              </div>

              {/* Event Timeline Chart */}
              <div className="holo-card p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Event Timeline</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={timelineData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
                      <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} />
                      <Tooltip
                        contentStyle={{ background: '#0d1117', border: '1px solid #30363d', borderRadius: '8px' }}
                        itemStyle={{ color: '#fff' }}
                        formatter={(value) => `${value} events`}
                      />
                      <Bar dataKey="events" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Recent Events */}
              <div className="holo-card p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {auditEvents.slice(0, 5).map(event => (
                    <div key={event.id} className="flex items-start gap-4 p-3 rounded-lg bg-slate-900/50">
                      <div className="w-2 h-2 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-sm font-medium text-white">{event.actor}</span>
                          <span className="text-sm text-blue-400">{event.action}</span>
                          <span className="text-xs text-slate-500">
                            {new Date(event.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">
                          {event.resourceType}: {event.resourceName}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Full Log Tab */}
            <TabsContent value="log" className="mt-0">
              <AuditLog
                events={auditEvents}
                onExport={(events) => {
                  const content = exportFormat === 'csv'
                    ? [
                      ['Timestamp', 'Actor', 'Action', 'Resource Type', 'Resource ID'].join(','),
                      ...events.map(e =>
                        [
                          new Date(e.timestamp).toLocaleString(),
                          e.actor,
                          e.action,
                          e.resourceType,
                          e.resourceId,
                        ].map(c => `"${c}"`).join(',')
                      ),
                    ].join('\n')
                    : JSON.stringify(events, null, 2);

                  const blob = new Blob([content], {
                    type: exportFormat === 'csv' ? 'text/csv' : 'application/json',
                  });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `audit-export-${new Date().toISOString().split('T')[0]}.${exportFormat}`;
                  link.click();
                  URL.revokeObjectURL(url);
                }}
              />
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="mt-0 space-y-6">
              {/* Action Breakdown */}
              <div className="grid grid-cols-2 gap-6">
                <div className="holo-card p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">By Action Type</h3>
                  <div className="space-y-2">
                    {Object.entries(stats.byAction).map(([action, count]) => (
                      <div key={action} className="flex items-center justify-between">
                        <span className="text-sm text-slate-400">{action}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500"
                              style={{
                                width: `${(count / stats.total) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium text-white w-8 text-right">
                            {count}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Resource Type Breakdown */}
                <div className="holo-card p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">By Resource Type</h3>
                  <div className="space-y-2">
                    {Object.entries(stats.byResourceType).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <span className="text-sm text-slate-400 capitalize">{type}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-cyan-500"
                              style={{
                                width: `${(count / stats.total) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium text-white w-8 text-right">
                            {count}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actor Activity */}
              <div className="holo-card p-6">
                <h3 className="text-lg font-semibold text-white mb-4">By Actor</h3>
                <div className="space-y-2">
                  {Object.entries(stats.byActor).map(([actor, count]) => (
                    <div key={actor} className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">{actor}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500"
                            style={{
                              width: `${(count / stats.total) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium text-white w-8 text-right">
                          {count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}

export default AuditPage;
