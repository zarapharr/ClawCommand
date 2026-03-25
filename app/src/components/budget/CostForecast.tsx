import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  Area, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ComposedChart
} from 'recharts';

interface ForecastDataPoint {
  date: string;
  actual: number;
  forecast: number;
  upper95: number;
  lower95: number;
}

interface CostForecastProps {
  data: ForecastDataPoint[];
  projectedMonthlySpend: number;
  budget: number;
  daysRemaining: number;
  confidence: number;
  height?: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ForecastDataPoint }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-lg text-xs">
        <p className="text-slate-300 font-medium mb-2">{dataPoint.date}</p>
        <p className="text-cyan-400">Actual: ${dataPoint.actual.toFixed(2)}</p>
        <p className="text-purple-400">Forecast: ${dataPoint.forecast.toFixed(2)}</p>
        <p className="text-slate-500 text-xs">
          Range: ${dataPoint.lower95.toFixed(2)} - ${dataPoint.upper95.toFixed(2)}
        </p>
      </div>
    );
  }
  return null;
}

export function CostForecast({
  data,
  projectedMonthlySpend,
  budget,
  daysRemaining,
  confidence,
  height = 280,
}: CostForecastProps) {
  const forecastStatus = useMemo(() => {
    if (projectedMonthlySpend > budget) {
      return {
        status: 'critical',
        message: `Projected to exceed budget by $${(projectedMonthlySpend - budget).toFixed(2)}`,
        icon: '🔴',
      };
    }
    if (projectedMonthlySpend > budget * 0.9) {
      return {
        status: 'warning',
        message: `Projected to reach ${((projectedMonthlySpend / budget) * 100).toFixed(0)}% of budget`,
        icon: '🟠',
      };
    }
    return {
      status: 'healthy',
      message: 'On track to stay within budget',
      icon: '✅',
    };
  }, [projectedMonthlySpend, budget]);

  const processedData = useMemo(() => {
    return data.map(d => ({
      ...d,
      date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    }));
  }, [data]);

  const maxValue = Math.max(
    ...processedData.map(d => Math.max(d.actual, d.forecast, d.upper95, budget))
  );

  return (
    <div className="space-y-4">
      {/* Status Card */}
      <div className={cn(
        'p-4 rounded-lg border flex items-start gap-3',
        forecastStatus.status === 'critical' && 'bg-red-500/10 border-red-500/30',
        forecastStatus.status === 'warning' && 'bg-orange-500/10 border-orange-500/30',
        forecastStatus.status === 'healthy' && 'bg-emerald-500/10 border-emerald-500/30'
      )}>
        <span className="text-2xl">{forecastStatus.icon}</span>
        <div className="flex-1">
          <h4 className="font-semibold text-white">Cost Forecast</h4>
          <p className={cn(
            'text-sm mt-1',
            forecastStatus.status === 'critical' && 'text-red-400',
            forecastStatus.status === 'warning' && 'text-orange-400',
            forecastStatus.status === 'healthy' && 'text-emerald-400'
          )}>
            {forecastStatus.message}
          </p>
          <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-slate-500 text-xs">Projected</p>
              <p className="text-white font-semibold">
                ${projectedMonthlySpend.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">Budget</p>
              <p className="text-white font-semibold">
                ${budget.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">Confidence</p>
              <p className="text-white font-semibold">
                {(confidence * 100).toFixed(0)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Forecast Chart */}
      <div className="p-4 rounded-lg bg-slate-900/30 border border-slate-800">
        <h4 className="text-sm font-semibold text-white mb-3">30-Day Projection</h4>
        <ResponsiveContainer width="100%" height={height}>
          <ComposedChart data={processedData}>
            <defs>
              <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#a855f7" stopOpacity={0.05}/>
              </linearGradient>
              <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#64748b" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#64748b" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#30363d" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#64748b"
              fontSize={11}
              tick={{ fontSize: 11 }}
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              domain={[0, maxValue * 1.1]}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Confidence interval band */}
            <Area
              type="monotone"
              dataKey="upper95"
              fill="url(#confidenceGradient)"
              stroke="transparent"
              isAnimationActive={false}
            />

            {/* Actual costs */}
            <Area
              type="monotone"
              dataKey="actual"
              fill="#00f0ff"
              stroke="#00f0ff"
              strokeWidth={2}
              dot={false}
              fillOpacity={0.1}
              isAnimationActive={false}
            />

            {/* Forecast line */}
            <Line
              type="monotone"
              dataKey="forecast"
              stroke="#a855f7"
              strokeWidth={2.5}
              strokeDasharray="5 5"
              dot={false}
              isAnimationActive={false}
            />

            {/* Budget line */}
            <Line
              type="monotone"
              dataKey={() => budget}
              stroke="#ef4444"
              strokeWidth={2}
              strokeDasharray="3 3"
              dot={false}
              isAnimationActive={false}
              name="Budget Limit"
            />
          </ComposedChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-cyan-500" />
            <span className="text-slate-400">Actual Spend</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-purple-500" style={{ borderTop: '2px dashed' }} />
            <span className="text-slate-400">Forecast</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-red-500" style={{ borderTop: '2px dashed' }} />
            <span className="text-slate-400">Budget Limit</span>
          </div>
        </div>
      </div>

      {/* Daily Remaining Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
          <p className="text-xs text-slate-500">Days Remaining</p>
          <p className="text-lg font-semibold text-white">{daysRemaining}</p>
          <p className="text-xs text-slate-600 mt-1">
            ~${(budget / 30).toFixed(2)} per day budget
          </p>
        </div>
        <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
          <p className="text-xs text-slate-500">Daily Pace</p>
          <p className="text-lg font-semibold text-white">
            ${(projectedMonthlySpend / 30).toFixed(2)}
          </p>
          <p className={cn(
            'text-xs mt-1 font-medium',
            projectedMonthlySpend / 30 > budget / 30 ? 'text-red-400' : 'text-emerald-400'
          )}>
            {projectedMonthlySpend / 30 > budget / 30 ? '⬆️ Over pace' : '✅ On pace'}
          </p>
        </div>
      </div>
    </div>
  );
}
