import { useCallback, useEffect, useState } from 'react';
import type { CronJob } from '@/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Clock, Plus, Play, Pause, Trash2, Edit2, Calendar,
  CheckCircle2, XCircle, RotateCw,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { getCronFeed, getDiagnostics, readOperatorAudit, reconcileOperatorLedgers, runOperatorAction, sanitizePayloadPreview } from '@/lib/runtime-adapters';
import { useRuntimeFeed } from '@/hooks/use-runtime-feed';
import { RuntimeStatusBar } from '@/components/runtime/RuntimeStatusBar';
import { HealthConnectionPanel } from '@/components/runtime/HealthConnectionPanel';
import { ActionReceiptLedger } from '@/components/runtime/ActionReceiptLedger';

const statusConfig = {
  pending: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', icon: Clock },
  running: { color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', icon: RotateCw },
  completed: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', icon: CheckCircle2 },
  failed: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', icon: XCircle },
  disabled: { color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/30', icon: Pause },
};

export function CronPage() {
  const cronLoader = useCallback(() => getCronFeed(), []);
  const diagnosticsLoader = useCallback(() => getDiagnostics(), []);
  const { feed: cronFeed, loading, error, freshnessLabel } = useRuntimeFeed({ loader: cronLoader });
  const { feed: diagnosticsFeed } = useRuntimeFeed({ loader: diagnosticsLoader });

  const [jobs, setJobs] = useState<CronJob[]>(cronFeed.data);
  const [pendingAction, setPendingAction] = useState<{ id: string; action: 'start' | 'stop' | 'retry' | 'kill' | 'escalate' } | null>(null);
  const [audit, setAudit] = useState(readOperatorAudit());

  useEffect(() => {
    setJobs(cronFeed.data);
  }, [cronFeed.data]);

  useEffect(() => {
    void reconcileOperatorLedgers().then(({ audit: syncedAudit }) => {
      setAudit(syncedAudit);
    });
  }, []);

  const executeAction = async () => {
    if (!pendingAction) return;
    await runOperatorAction({
      action: pendingAction.action,
      source: cronFeed.source,
      targetId: pendingAction.id,
      targetType: 'cron',
      payload: { reason: 'cron panel action' },
    });

    setJobs((prev) => prev.map((j) => {
      if (j.id !== pendingAction.id) return j;
      if (pendingAction.action === 'start' || pendingAction.action === 'retry' || pendingAction.action === 'escalate') {
        return { ...j, status: 'running', lastRun: new Date().toISOString() };
      }
      if (pendingAction.action === 'stop') return { ...j, status: 'disabled' };
      return { ...j, status: 'failed', errorCount: j.errorCount + 1 };
    }));

    setAudit(readOperatorAudit());
    setPendingAction(null);
  };

  const handleToggle = (id: string) => {
    setJobs((prev) => prev.map((j) =>
      j.id === id ? { ...j, status: j.status === 'disabled' ? 'pending' : 'disabled' } : j,
    ));
  };

  const formatSchedule = (job: CronJob) => {
    if (job.schedule.kind === 'cron') return job.schedule.cron;
    if (job.schedule.kind === 'every') return `Every ${job.schedule.every}s`;
    if (job.schedule.kind === 'at') return `At ${job.schedule.at}`;
    return 'Unknown';
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-yellow-500/20 border border-orange-500/30 flex items-center justify-center"><Clock className="w-5 h-5 text-orange-400" /></div>
          <div><h1 className="text-xl font-bold text-white"><span className="text-orange-400">Cron</span> Scheduler</h1><p className="text-xs text-slate-400">Schedule and manage recurring jobs</p></div>
          <RuntimeStatusBar feed={cronFeed} loading={loading} error={error} freshnessLabel={freshnessLabel} />
        </div>
        <Button className="bg-orange-500 hover:bg-orange-600 text-black font-medium"><Plus className="w-4 h-4 mr-2" />New Job</Button>
      </div>

      <div className="px-6 py-2 text-xs text-slate-500">Observability source: cron log adapter with fallback-safe payload redaction. Recent audited actions: {audit.length}</div>
      <div className="px-6 pb-2 grid grid-cols-1 lg:grid-cols-2 gap-3">
        <HealthConnectionPanel feed={cronFeed} diagnosticsFeed={diagnosticsFeed} title="Cron Health + Connection" />
        <ActionReceiptLedger entries={audit} />
      </div>

      <div className="flex-1 overflow-hidden p-6">
        <div className="holo-card h-full flex flex-col">
          <div className="p-4 border-b border-slate-800/50 flex items-center justify-between">
            <p className="text-xs text-slate-400 uppercase tracking-wider">{jobs.length} Scheduled Jobs</p>
          </div>

          <ScrollArea className="flex-1"><div className="p-4 space-y-3">{jobs.map((job) => {
            const config = statusConfig[job.status];
            const StatusIcon = config.icon;
            return (
              <div key={job.id} className="p-4 rounded-lg bg-slate-900/50 border border-slate-800/50">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', config.bg, config.border, 'border')}><StatusIcon className={cn('w-5 h-5', config.color, job.status === 'running' && 'animate-spin')} /></div>
                    <div>
                      <div className="flex items-center gap-2"><h4 className="text-sm font-medium text-white">{job.name}</h4><Badge variant="outline" className={cn('text-xs', config.border, config.color, config.bg)}>{job.status}</Badge><span className="text-xs text-slate-500">ID: {job.jobId}</span></div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-400"><span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatSchedule(job)}</span><span>Target: {job.sessionTarget}</span><span>Wake: {job.wakeMode}</span></div>
                      {job.payload.message && <div className="mt-3 p-2 rounded bg-slate-950/50 border border-slate-800/50"><span className="text-xs text-slate-500">Payload: </span><span className="text-xs text-cyan-400">{sanitizePayloadPreview(job.payload.message)}</span></div>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch checked={job.status !== 'disabled'} onCheckedChange={() => handleToggle(job.id)} className="data-[state=checked]:bg-orange-500" />
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-cyan-400" onClick={() => setPendingAction({ id: job.id, action: 'start' })}><Play className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white" onClick={() => setPendingAction({ id: job.id, action: 'retry' })}><RotateCw className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-amber-400" onClick={() => setPendingAction({ id: job.id, action: 'escalate' })}><Edit2 className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-orange-400" onClick={() => setPendingAction({ id: job.id, action: 'stop' })}><Pause className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-400" onClick={() => setPendingAction({ id: job.id, action: 'kill' })}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              </div>
            );
          })}</div></ScrollArea>
        </div>
      </div>

      <AlertDialog open={!!pendingAction} onOpenChange={(open) => !open && setPendingAction(null)}>
        <AlertDialogContent className="bg-slate-900 border-slate-700 text-white">
          <AlertDialogHeader><AlertDialogTitle>Confirm cron action</AlertDialogTitle><AlertDialogDescription className="text-slate-400">This command is written to the action audit trail with redacted payload preview.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel className="border-slate-700 text-slate-300">Cancel</AlertDialogCancel><AlertDialogAction onClick={executeAction}>Confirm</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
