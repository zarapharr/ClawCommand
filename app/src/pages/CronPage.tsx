import { useState } from 'react';
import type { CronJob } from '@/types';
import { mockCronJobs } from '@/data/mock-data';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Clock, Plus, Play, Pause, Trash2, Edit2, Calendar,
  CheckCircle2, XCircle, RotateCw
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';

const statusConfig = {
  pending: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', icon: Clock },
  running: { color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', icon: RotateCw },
  completed: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', icon: CheckCircle2 },
  failed: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', icon: XCircle },
  disabled: { color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/30', icon: Pause },
};

export function CronPage() {
  const [jobs, setJobs] = useState<CronJob[]>(mockCronJobs);

  const handleToggle = (id: string) => {
    setJobs(prev => prev.map(j => 
      j.id === id ? { ...j, status: j.status === 'disabled' ? 'pending' : 'disabled' } : j
    ));
  };

  const handleRun = (id: string) => {
    setJobs(prev => prev.map(j => 
      j.id === id ? { ...j, status: 'running', lastRun: new Date().toISOString() } : j
    ));
    
    setTimeout(() => {
      setJobs(prev => prev.map(j => 
        j.id === id ? { ...j, status: 'completed', runCount: j.runCount + 1 } : j
      ));
    }, 2000);
  };

  const handleDelete = (id: string) => {
    setJobs(prev => prev.filter(j => j.id !== id));
  };

  const formatSchedule = (job: CronJob) => {
    if (job.schedule.kind === 'cron') {
      return job.schedule.cron;
    } else if (job.schedule.kind === 'every') {
      return `Every ${job.schedule.every}s`;
    } else if (job.schedule.kind === 'at') {
      return `At ${job.schedule.at}`;
    }
    return 'Unknown';
  };

  const formatNextRun = (nextRun?: string) => {
    if (!nextRun) return 'N/A';
    const date = new Date(nextRun);
    return date.toLocaleString();
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-yellow-500/20 border border-orange-500/30 flex items-center justify-center">
            <Clock className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">
              <span className="text-orange-400">Cron</span> Scheduler
            </h1>
            <p className="text-xs text-slate-400">Schedule and manage recurring jobs</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button className="bg-orange-500 hover:bg-orange-600 text-black font-medium">
            <Plus className="w-4 h-4 mr-2" />
            New Job
          </Button>
        </div>
      </div>

      {/* Jobs List */}
      <div className="flex-1 overflow-hidden p-6">
        <div className="holo-card h-full flex flex-col">
          <div className="p-4 border-b border-slate-800/50 flex items-center justify-between">
            <p className="text-xs text-slate-400 uppercase tracking-wider">
              {jobs.length} Scheduled Jobs
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xs text-slate-400">{jobs.filter(j => j.status === 'pending').length} Active</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-500" />
                <span className="text-xs text-slate-400">{jobs.filter(j => j.status === 'running').length} Running</span>
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-3">
              {jobs.map((job) => {
                const config = statusConfig[job.status];
                const StatusIcon = config.icon;
                
                return (
                  <div 
                    key={job.id}
                    className="p-4 rounded-lg bg-slate-900/50 border border-slate-800/50 hover:border-slate-700/50 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          'w-10 h-10 rounded-lg flex items-center justify-center',
                          config.bg, config.border, 'border'
                        )}>
                          <StatusIcon className={cn('w-5 h-5', config.color, job.status === 'running' && 'animate-spin')} />
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-medium text-white">{job.name}</h4>
                            <Badge variant="outline" className={cn('text-xs', config.border, config.color, config.bg)}>
                              {job.status}
                            </Badge>
                            <span className="text-xs text-slate-500">ID: {job.jobId}</span>
                          </div>
                          
                          <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatSchedule(job)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {job.schedule.tz || 'UTC'}
                            </span>
                            <span>Target: {job.sessionTarget}</span>
                            <span>Wake: {job.wakeMode}</span>
                          </div>
                          
                          <div className="flex items-center gap-4 mt-2 text-xs">
                            <span className="text-slate-500">
                              Runs: <span className="text-emerald-400">{job.runCount}</span>
                            </span>
                            {job.errorCount > 0 && (
                              <span className="text-slate-500">
                                Errors: <span className="text-red-400">{job.errorCount}</span>
                              </span>
                            )}
                            {job.lastRun && (
                              <span className="text-slate-500">
                                Last: {new Date(job.lastRun).toLocaleString()}
                              </span>
                            )}
                            {job.nextRun && job.status !== 'disabled' && (
                              <span className="text-slate-500">
                                Next: {formatNextRun(job.nextRun)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={job.status !== 'disabled'}
                          onCheckedChange={() => handleToggle(job.id)}
                          className="data-[state=checked]:bg-orange-500"
                        />
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-slate-400 hover:text-cyan-400"
                          onClick={() => handleRun(job.id)}
                          disabled={job.status === 'running' || job.status === 'disabled'}
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-slate-400 hover:text-red-400"
                          onClick={() => handleDelete(job.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {job.payload.message && (
                      <div className="mt-3 p-2 rounded bg-slate-950/50 border border-slate-800/50">
                        <span className="text-xs text-slate-500">Payload: </span>
                        <span className="text-xs text-cyan-400">{job.payload.message}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
