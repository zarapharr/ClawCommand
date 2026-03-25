import React from "react";

/**
 * MetricCard Component
 * KPI display card for dashboard metrics
 * @example
 * <MetricCard
 *   title="Active Agents"
 *   value="12"
 *   unit="agents"
 *   trend={15}
 *   trendLabel="vs last hour"
 * />
 */
interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: number;
  trendLabel?: string;
  icon?: React.ReactNode;
  color?: "primary" | "success" | "warning" | "error" | "info";
  layout?: "vertical" | "horizontal";
  className?: string;
}

const colorAccents: Record<string, string> = {
  primary: "border-primary-500/30 bg-primary-500/5",
  success: "border-success-500/30 bg-success-500/5",
  warning: "border-warning-500/30 bg-warning-500/5",
  error: "border-error-500/30 bg-error-500/5",
  info: "border-info-500/30 bg-info-500/5",
};

const trendColors = {
  positive: "text-success-400",
  negative: "text-error-400",
  neutral: "text-neutral-400",
};

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  trend,
  trendLabel,
  icon,
  color = "primary",
  layout = "vertical",
  className = "",
}) => {
  const trendDirection = trend ? (trend > 0 ? "positive" : trend < 0 ? "negative" : "neutral") : null;

  if (layout === "horizontal") {
    return (
      <div
        className={`flex items-center justify-between gap-4 p-4 rounded-lg border bg-neutral-800/50 ${colorAccents[color]} ${className}`}
      >
        <div className="flex-1">
          <p className="text-sm text-neutral-400 mb-1">{title}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-neutral-100">{value}</span>
            {unit && <span className="text-sm text-neutral-500">{unit}</span>}
          </div>
          {trend !== undefined && trendLabel && (
            <p className={`text-xs mt-2 ${trendColors[trendDirection || "neutral"]}`}>
              {trend > 0 ? "+" : ""}
              {trend}% {trendLabel}
            </p>
          )}
        </div>
        {icon && <div className="text-3xl opacity-50">{icon}</div>}
      </div>
    );
  }

  return (
    <div
      className={`p-4 rounded-lg border bg-neutral-800/50 ${colorAccents[color]} ${className}`}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm text-neutral-400">{title}</p>
        {icon && <div className="text-xl opacity-50">{icon}</div>}
      </div>
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-3xl font-bold text-neutral-100">{value}</span>
        {unit && <span className="text-sm text-neutral-500">{unit}</span>}
      </div>
      {trend !== undefined && trendLabel && (
        <p className={`text-xs ${trendColors[trendDirection || "neutral"]}`}>
          {trend > 0 ? "↑" : trend < 0 ? "↓" : "→"} {Math.abs(trend)}% {trendLabel}
        </p>
      )}
    </div>
  );
};
