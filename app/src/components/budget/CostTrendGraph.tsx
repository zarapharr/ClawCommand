import { useMemo } from 'react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ComposedChart, Area, Line
} from 'recharts';
import { Loader2 } from 'lucide-react';

interface TrendDataPoint {
  date: string;
  cost: number;
  forecast?: number;
  isAnomaly?: boolean;
  anomalySeverity?: 'none' | 'mild' | 'moderate' | 'severe';
}

interface CostTrendGraphProps {
  data: TrendDataPoint[];
  height?: number;
  showForecast?: boolean;
  showAnomalies?: boolean;
  loading?: boolean;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: TrendDataPoint }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const showForecast = true;
    const showAnomalies = true;
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-lg">
        <p className="text-sm text-slate-300">{data.date}</p>
        <p className="text-sm text-cyan-400">
          Cost: <span className="font-medium">${data.cost.toFixed(2)}</span>
        </p>
        {showForecast && data.forecast && (
          <p className="text-sm text-purple-400">
            Forecast: <span className="font-medium">${data.forecast.toFixed(2)}</span>
          </p>
        )}
        {showAnomalies && data.isAnomaly && (
          <p className="text-sm text-orange-400">
            ⚠️ Anomaly ({data.anomalySeverity})
          </p>
        )}
      </div>
    );
  }
  return null;
}

export function CostTrendGraph({
  data,
  height = 300,
  showForecast = true,
  showAnomalies = true,
  loading = false,
}: CostTrendGraphProps) {
  const processedData = useMemo(() => {
    return data.map(d => ({
      ...d,
      date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    }));
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
          <span className="text-sm text-slate-400">Loading trend data...</span>
        </div>
      </div>
    );
  }

  if (processedData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="text-sm text-slate-500">No cost data available</span>
      </div>
    );
  }

  const maxCost = Math.max(...processedData.map(d => Math.max(d.cost, d.forecast || 0)));
  const yAxisDomain = [0, Math.ceil(maxCost * 1.2)];

  return (
    <div className="w-full h-full flex flex-col">
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={processedData}>
          <defs>
            <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#00f0ff" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
          <XAxis
            dataKey="date"
            stroke="#64748b"
            fontSize={12}
            tick={{ fontSize: 11 }}
          />
          <YAxis
            stroke="#64748b"
            fontSize={12}
            domain={yAxisDomain}
            label={{ value: 'Cost ($)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="cost"
            fill="url(#costGradient)"
            stroke="#00f0ff"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          {showForecast && (
            <Line
              type="monotone"
              dataKey="forecast"
              stroke="#a855f7"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              isAnimationActive={false}
              name="Forecast"
            />
          )}
          
          {/* Anomaly markers */}
          {showAnomalies && processedData.map((entry, index) => {
            if (!entry.isAnomaly) return null;
            const xScale = (index / (processedData.length - 1)) * 100;
            return (
              <line
                key={`anomaly-${index}`}
                x1={`${xScale}%`}
                y1="0%"
                x2={`${xScale}%`}
                y2="100%"
                stroke="#ff6b35"
                strokeWidth={1}
                strokeDasharray="3 3"
                opacity={0.3}
              />
            );
          })}
        </ComposedChart>
      </ResponsiveContainer>

      {/* Legend and stats */}
      <div className="mt-4 flex items-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-cyan-500" />
          <span className="text-slate-400">Actual Cost</span>
        </div>
        {showForecast && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-purple-500" />
            <span className="text-slate-400">Forecast</span>
          </div>
        )}
        {showAnomalies && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-orange-500" />
            <span className="text-slate-400">Anomaly</span>
          </div>
        )}
        <div className="ml-auto text-slate-400">
          <span className="font-medium text-white">
            ${Math.max(...processedData.map(d => d.cost)).toFixed(2)}
          </span>
          {' '}peak
        </div>
      </div>
    </div>
  );
}
