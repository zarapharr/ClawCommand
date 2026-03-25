import { cn } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';

type AnomalySeverity = 'none' | 'mild' | 'moderate' | 'severe';

interface AnomalyMarkerProps {
  severity: AnomalySeverity;
  value: number;
  baseline: number;
  zScore: number;
  explanation?: string;
  compact?: boolean;
}

export function AnomalyMarker({
  severity,
  value,
  baseline,
  zScore,
  explanation,
  compact = false,
}: AnomalyMarkerProps) {
  if (severity === 'none') {
    return null;
  }

  const getColor = () => {
    switch (severity) {
      case 'severe':
        return 'bg-red-500/20 border-red-500/50 text-red-400';
      case 'moderate':
        return 'bg-orange-500/20 border-orange-500/50 text-orange-400';
      case 'mild':
        return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400';
      default:
        return 'bg-slate-500/20 border-slate-500/50 text-slate-400';
    }
  };

  const getIcon = () => {
    switch (severity) {
      case 'severe':
        return '🔴';
      case 'moderate':
        return '🟠';
      case 'mild':
        return '🟡';
      default:
        return '⚪';
    }
  };

  const percentageIncrease = Math.round(((value - baseline) / baseline) * 100);

  if (compact) {
    return (
      <span className={cn(
        'inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium',
        getColor()
      )}>
        {getIcon()}
        {severity}
      </span>
    );
  }

  return (
    <div className={cn(
      'flex items-start gap-3 p-3 rounded-lg border',
      getColor()
    )}>
      <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1 space-y-1">
        <p className="font-medium text-sm">
          Cost Spike Detected ({severity})
        </p>
        <p className="text-xs opacity-90">
          {zScore.toFixed(2)}σ above baseline
          {percentageIncrease > 0 && ` (+${percentageIncrease}%)`}
        </p>
        {explanation && (
          <p className="text-xs opacity-75">{explanation}</p>
        )}
        <div className="text-xs opacity-80 mt-2 space-y-0.5">
          <div>Current: <span className="font-mono">${value.toFixed(4)}</span></div>
          <div>Baseline: <span className="font-mono">${baseline.toFixed(4)}</span></div>
        </div>
      </div>
    </div>
  );
}
