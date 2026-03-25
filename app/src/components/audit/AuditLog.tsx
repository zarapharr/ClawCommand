import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DiffViewer } from './ChangeViewer';
import { ApprovalWidget, type ApprovalStatus } from './ApprovalWidget';
import { ChevronDown, Search } from 'lucide-react';

export interface AuditEvent {
  id: string;
  timestamp: string;
  actor: string;
  actorId: string;
  action: string;
  resourceType: 'agent' | 'skill' | 'workflow' | 'budget' | 'setting';
  resourceId: string;
  resourceName: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  status: ApprovalStatus;
  reason?: string;
  ipAddress?: string;
}

interface AuditLogProps {
  events: AuditEvent[];
  loading?: boolean;
  onExport?: (events: AuditEvent[]) => void;
}

export function AuditLog({
  events,
  onExport,
}: AuditLogProps) {
  const [searchText, setSearchText] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterActor, setFilterActor] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      // Text search
      if (searchText) {
        const searchLower = searchText.toLowerCase();
        const matches =
          event.actor.toLowerCase().includes(searchLower) ||
          event.action.toLowerCase().includes(searchLower) ||
          event.resourceName.toLowerCase().includes(searchLower) ||
          event.resourceId.toLowerCase().includes(searchLower);
        if (!matches) return false;
      }

      // Action filter
      if (filterAction !== 'all' && event.action !== filterAction) {
        return false;
      }

      // Actor filter
      if (filterActor !== 'all' && event.actor !== filterActor) {
        return false;
      }

      // Status filter
      if (filterStatus !== 'all' && event.status !== filterStatus) {
        return false;
      }

      // Date range filter
      if (startDate) {
        const eventDate = new Date(event.timestamp);
        const start = new Date(startDate);
        if (eventDate < start) return false;
      }

      if (endDate) {
        const eventDate = new Date(event.timestamp);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (eventDate > end) return false;
      }

      return true;
    });
  }, [events, searchText, filterAction, filterActor, filterStatus, startDate, endDate]);

  // Get unique values for filters
  const uniqueActions = useMemo(
    () => [...new Set(events.map(e => e.action))],
    [events]
  );

  const uniqueActors = useMemo(
    () => [...new Set(events.map(e => e.actor))],
    [events]
  );

  const getActionColor = (action: string) => {
    const lower = action.toLowerCase();
    if (lower.includes('create') || lower.includes('add')) return 'text-emerald-400';
    if (lower.includes('delete') || lower.includes('remove')) return 'text-red-400';
    if (lower.includes('update') || lower.includes('modify')) return 'text-blue-400';
    if (lower.includes('pause') || lower.includes('pause')) return 'text-orange-400';
    return 'text-cyan-400';
  };

  const getResourceColor = (type: string) => {
    switch (type) {
      case 'agent':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'skill':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'workflow':
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      case 'budget':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'setting':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with Export */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Audit Trail</h3>
        {onExport && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onExport(filteredEvents)}
            className="border-slate-700 text-slate-300 h-8"
            disabled={filteredEvents.length === 0}
          >
            Export ({filteredEvents.length})
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="space-y-3 p-4 rounded-lg bg-slate-900/30 border border-slate-800">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <Input
            placeholder="Search by actor, action, resource..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="pl-10 h-9 bg-slate-900 border-slate-700 text-white"
          />
        </div>

        {/* Filters Row */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Action Filter */}
          <Select value={filterAction} onValueChange={setFilterAction}>
            <SelectTrigger className="h-9 bg-slate-900 border-slate-700 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700">
              <SelectItem value="all">All Actions</SelectItem>
              {uniqueActions.map(action => (
                <SelectItem key={action} value={action}>
                  {action}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Actor Filter */}
          <Select value={filterActor} onValueChange={setFilterActor}>
            <SelectTrigger className="h-9 bg-slate-900 border-slate-700 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700">
              <SelectItem value="all">All Actors</SelectItem>
              {uniqueActors.map(actor => (
                <SelectItem key={actor} value={actor}>
                  {actor}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-9 bg-slate-900 border-slate-700 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          {/* Date Filters */}
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-9 bg-slate-900 border-slate-700 text-white text-sm"
            placeholder="From"
          />

          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="h-9 bg-slate-900 border-slate-700 text-white text-sm"
            placeholder="To"
          />
        </div>

        {/* Clear Filters */}
        {(searchText || filterAction !== 'all' || filterActor !== 'all' || startDate || endDate) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchText('');
              setFilterAction('all');
              setFilterActor('all');
              setFilterStatus('all');
              setStartDate('');
              setEndDate('');
            }}
            className="text-slate-400 h-8"
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Events List */}
      <div className="space-y-2">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <p>No audit events found</p>
          </div>
        ) : (
          filteredEvents.map((event) => (
            <div
              key={event.id}
              className="border border-slate-800 rounded-lg overflow-hidden hover:border-slate-700 transition-colors"
            >
              {/* Event Row */}
              <button
                onClick={() =>
                  setExpandedEventId(
                    expandedEventId === event.id ? null : event.id
                  )
                }
                className="w-full p-4 flex items-center gap-4 hover:bg-slate-900/50 text-left transition-colors"
              >
                <ChevronDown
                  className={cn(
                    'w-4 h-4 text-slate-400 transition-transform flex-shrink-0',
                    expandedEventId === event.id && 'rotate-180'
                  )}
                />

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-white">
                      {event.actor}
                    </span>
                    <span className={cn('text-sm font-medium', getActionColor(event.action))}>
                      {event.action}
                    </span>
                    <span
                      className={cn(
                        'text-xs px-2 py-0.5 rounded-full border',
                        getResourceColor(event.resourceType)
                      )}
                    >
                      {event.resourceType}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {event.resourceName} • {new Date(event.timestamp).toLocaleString()}
                  </p>
                </div>

                <ApprovalWidget status={event.status} compact />
              </button>

              {/* Expanded Details */}
              {expandedEventId === event.id && (
                <div className="border-t border-slate-800 p-4 bg-slate-900/20 space-y-4">
                  {/* Meta Info */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div>
                      <p className="text-slate-500">Event ID</p>
                      <p className="font-mono text-slate-300">{event.id.substring(0, 12)}...</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Actor ID</p>
                      <p className="font-mono text-slate-300">{event.actorId}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Resource ID</p>
                      <p className="font-mono text-slate-300">{event.resourceId}</p>
                    </div>
                    {event.ipAddress && (
                      <div>
                        <p className="text-slate-500">IP Address</p>
                        <p className="font-mono text-slate-300">{event.ipAddress}</p>
                      </div>
                    )}
                  </div>

                  {/* Changes */}
                  {event.before && event.after && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-white">Changes</h4>
                      <DiffViewer before={event.before} after={event.after} />
                    </div>
                  )}

                  {/* Approval Status */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-white">Approval</h4>
                    <ApprovalWidget
                      status={event.status}
                      reason={event.reason}
                    />
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Stats */}
      <div className="text-sm text-slate-500 text-center py-2">
        Showing {filteredEvents.length} of {events.length} events
        {startDate || endDate
          ? ` (filtered by date range)`
          : ''}
      </div>
    </div>
  );
}
