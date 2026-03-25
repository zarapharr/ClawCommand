import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CostBadgeProps {
  amount: number;
  trend?: {
    direction: 'up' | 'down';
    percent: number;
  };
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showCurrency?: boolean;
}

export function CostBadge({
  amount,
  trend,
  size = 'md',
  className,
  showCurrency = true,
}: CostBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base',
  };

  const trendColor = trend?.direction === 'up' ? 'text-red-400' : 'text-emerald-400';
  const TrendIcon = trend?.direction === 'up' ? TrendingUp : TrendingDown;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-lg',
        'bg-slate-800/50 border border-slate-700',
        sizeClasses[size],
        className,
      )}
    >
      <DollarSign className={cn(
        'flex-shrink-0',
        size === 'sm' && 'w-3 h-3',
        size === 'md' && 'w-4 h-4',
        size === 'lg' && 'w-5 h-5',
        'text-slate-400'
      )} />

      <span className="font-mono font-semibold text-slate-100">
        {showCurrency ? '$' : ''}{amount.toFixed(2)}
      </span>

      {trend && (
        <TrendIcon className={cn(
          'flex-shrink-0',
          size === 'sm' && 'w-3 h-3',
          size === 'md' && 'w-4 h-4',
          size === 'lg' && 'w-5 h-5',
          trendColor,
        )} />
      )}

      {trend && (
        <span className={cn('font-semibold', trendColor)}>
          {trend.direction === 'up' ? '+' : '-'}{trend.percent}%
        </span>
      )}
    </div>
  );
}
