import { CheckCircle2, Pause, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusBandProps {
  running: number;
  paused: number;
  idle: number;
  failed: number;
  updatedAt?: Date;
  className?: string;
}

export function StatusBand({
  running,
  paused,
  idle,
  failed,
  updatedAt,
  className,
}: StatusBandProps) {
  const total = running + paused + idle + failed;
  const lastUpdateText = updatedAt
    ? `Updated ${Math.round((Date.now() - updatedAt.getTime()) / 1000)}s ago`
    : 'Never updated';

  return (
    <div className={cn('w-full', className)}>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 mb-2">
        {/* Running */}
        <div className="bg-gradient-to-br from-emerald-950 to-emerald-900 border border-emerald-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="text-sm text-emerald-300">Running</span>
          </div>
          <div className="text-2xl font-bold text-emerald-100">{running}</div>
          <div className="text-xs text-emerald-400 mt-1">
            {total > 0 ? `${Math.round((running / total) * 100)}%` : '0%'}
          </div>
        </div>

        {/* Paused */}
        <div className="bg-gradient-to-br from-amber-950 to-amber-900 border border-amber-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <Pause className="w-5 h-5 text-amber-400" />
            <span className="text-sm text-amber-300">Paused</span>
          </div>
          <div className="text-2xl font-bold text-amber-100">{paused}</div>
          <div className="text-xs text-amber-400 mt-1">
            {total > 0 ? `${Math.round((paused / total) * 100)}%` : '0%'}
          </div>
        </div>

        {/* Idle */}
        <div className="bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-5 h-5 text-slate-400" />
            <span className="text-sm text-slate-300">Idle</span>
          </div>
          <div className="text-2xl font-bold text-slate-100">{idle}</div>
          <div className="text-xs text-slate-400 mt-1">
            {total > 0 ? `${Math.round((idle / total) * 100)}%` : '0%'}
          </div>
        </div>

        {/* Failed */}
        <div className="bg-gradient-to-br from-red-950 to-red-900 border border-red-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-sm text-red-300">Failed</span>
          </div>
          <div className="text-2xl font-bold text-red-100">{failed}</div>
          <div className="text-xs text-red-400 mt-1">
            {total > 0 ? `${Math.round((failed / total) * 100)}%` : '0%'}
          </div>
        </div>
      </div>

      {/* Metadata footer */}
      <div className="text-xs text-slate-500 px-1">
        {lastUpdateText} • Total: {total} agents
      </div>
    </div>
  );
}
