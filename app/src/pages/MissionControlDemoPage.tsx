import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Clock3, ShieldCheck, Activity, Eye, AlertTriangle } from 'lucide-react';

type ActionKey = 'pause' | 'resume' | 'handoff';

const runtimeSources = [
  { label: 'Gateway Runtime', value: 'edge-gateway-01', status: 'healthy' },
  { label: 'Session Resolver', value: 'adaptive-profile-v2', status: 'healthy' },
  { label: 'Workspace Source', value: '/workspace/ClawCommand', status: 'verified' },
  { label: 'Channel Context', value: 'telegram.dm.eric', status: 'active' },
] as const;

const auditEvents = [
  { time: '16:01:19', actor: 'operator', event: 'Approved action: Pause background swarm', level: 'info' },
  { time: '16:02:11', actor: 'system', event: 'Runtime source switched to adaptive session metadata', level: 'info' },
  { time: '16:03:42', actor: 'agent', event: 'Confirmation required for model provider re-route', level: 'warn' },
  { time: '16:04:07', actor: 'operator', event: 'Confirmed re-route to fallback profile', level: 'info' },
] as const;

const observabilityCards = [
  { title: 'Operator Confirmations', value: '12', note: 'All confirmations acknowledged', icon: ShieldCheck },
  { title: 'Source Integrity', value: '99.7%', note: 'Runtime source badge checks', icon: Eye },
  { title: 'Audit Latency', value: '240ms', note: 'Median event persistence', icon: Clock3 },
  { title: 'Active Signals', value: '8', note: 'Hybrid environment telemetry streams', icon: Activity },
] as const;

export function MissionControlDemoPage() {
  const [lastConfirmedAction, setLastConfirmedAction] = useState<ActionKey | null>(null);

  const handleAction = (action: ActionKey, promptText: string) => {
    const confirmed = window.confirm(promptText);
    if (confirmed) {
      setLastConfirmedAction(action);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Mission Control Hybrid Demo</h1>
            <p className="text-slate-400 mt-1">
              Demo surface for runtime source badges, operator confirmations, audit visibility, and observability cards.
            </p>
          </div>
          <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/40">Demo</Badge>
        </div>

        <Card className="bg-slate-900/60 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Runtime Source Badges</CardTitle>
            <CardDescription>Active source resolution for the hybrid mission-control flow.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {runtimeSources.map((source) => (
              <div key={source.label} className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-slate-300">{source.label}</span>
                  <Badge variant="outline" className="text-xs border-emerald-500/40 text-emerald-300">
                    {source.status}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-2">{source.value}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-slate-900/60 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Operator Actions</CardTitle>
            <CardDescription>Each control uses explicit confirmation before applying sensitive changes.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => handleAction('pause', 'Pause the current swarm and freeze new task dispatches?')}>
                Pause swarm
              </Button>
              <Button variant="secondary" onClick={() => handleAction('resume', 'Resume mission-control execution with current runtime source?')}>
                Resume execution
              </Button>
              <Button variant="outline" onClick={() => handleAction('handoff', 'Hand off command role to fallback operator profile?')}>
                Initiate handoff
              </Button>
            </div>

            <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-sm text-slate-300">
              {lastConfirmedAction ? (
                <div className="inline-flex items-center gap-2 text-emerald-300">
                  <CheckCircle2 className="h-4 w-4" />
                  Last confirmed action: <span className="font-medium capitalize">{lastConfirmedAction}</span>
                </div>
              ) : (
                <span>No action has been confirmed yet.</span>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="bg-slate-900/60 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Audit Trail Visibility</CardTitle>
              <CardDescription>Recent mission-control events with actor context.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {auditEvents.map((event) => (
                <div key={`${event.time}-${event.event}`} className="rounded-md border border-slate-800 bg-slate-950/60 p-3">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{event.time}</span>
                    <span className="uppercase">{event.actor}</span>
                  </div>
                  <div className="mt-1 flex items-start gap-2 text-sm text-slate-200">
                    {event.level === 'warn' ? (
                      <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-300" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 mt-0.5 text-cyan-300" />
                    )}
                    <span>{event.event}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-slate-900/60 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Observability Cards</CardTitle>
              <CardDescription>Hybrid runtime telemetry at a glance.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {observabilityCards.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Icon className="h-4 w-4 text-cyan-300" />
                      <span className="text-xs uppercase tracking-wide">{item.title}</span>
                    </div>
                    <div className="text-2xl font-semibold text-white mt-2">{item.value}</div>
                    <p className="text-xs text-slate-500 mt-1">{item.note}</p>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
