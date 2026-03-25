import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { DollarSign } from 'lucide-react';

interface BudgetMeterProps {
  spent: number;
  budget: number;
  label?: string;
  compact?: boolean;
  showRemaining?: boolean;
  threshold?: number; // Alert threshold (%)
}

export function BudgetMeter({
  spent,
  budget,
  label = 'Budget',
  compact = false,
  showRemaining = true,
  threshold = 70,
}: BudgetMeterProps) {
  const percentage = Math.round((spent / budget) * 100);
  const remaining = Math.max(0, budget - spent);

  const getColor = () => {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= threshold) return 'bg-orange-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-emerald-500';
  };

  const getTextColor = () => {
    if (percentage >= 100) return 'text-red-400';
    if (percentage >= 90) return 'text-red-400';
    if (percentage >= threshold) return 'text-orange-400';
    if (percentage >= 50) return 'text-yellow-400';
    return 'text-emerald-400';
  };

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-300">{label}</span>
          </div>
          <span className={cn('text-sm font-medium', getTextColor())}>
            {percentage}%
          </span>
        </div>
        <Progress value={percentage} className="h-2 bg-slate-700">
          <div
            className={cn('h-full transition-all', getColor())}
            style={{ width: `${Math.min(100, percentage)}%` }}
          />
        </Progress>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">{label}</h3>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-slate-400">
            Spent: <span className="font-medium text-white">${spent.toFixed(2)}</span>
          </span>
          <span className={cn('font-medium', getTextColor())}>
            {percentage}%
          </span>
        </div>
      </div>

      <Progress value={percentage} className="h-3 bg-slate-700">
        <div
          className={cn('h-full transition-all', getColor())}
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </Progress>

      {showRemaining && (
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>${spent.toFixed(2)} of ${budget.toFixed(2)}</span>
          <span className="text-emerald-400 font-medium">
            ${remaining.toFixed(2)} remaining
          </span>
        </div>
      )}
    </div>
  );
}
