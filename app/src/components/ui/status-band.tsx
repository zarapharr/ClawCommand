import React from "react";

/**
 * StatusBand Component
 * Shows counts grouped by status (e.g., 5 running, 2 failed, 8 pending)
 * @example
 * <StatusBand
 *   statuses={[
 *     { label: "Running", count: 5, status: "success" },
 *     { label: "Failed", count: 2, status: "error" }
 *   ]}
 * />
 */
interface StatusItem {
  label: string;
  count: number;
  status: "success" | "warning" | "error" | "info" | "neutral";
}

interface StatusBandProps {
  statuses: StatusItem[];
  size?: "sm" | "md" | "lg";
  layout?: "inline" | "stacked";
  showTotal?: boolean;
  className?: string;
}

const statusColors: Record<string, { bg: string; text: string }> = {
  success: { bg: "bg-success-500/10", text: "text-success-300" },
  warning: { bg: "bg-warning-500/10", text: "text-warning-300" },
  error: { bg: "bg-error-500/10", text: "text-error-300" },
  info: { bg: "bg-info-500/10", text: "text-info-300" },
  neutral: { bg: "bg-neutral-500/10", text: "text-neutral-300" },
};

const sizeClasses: Record<string, string> = {
  sm: "px-2.5 py-1 text-xs gap-1",
  md: "px-3 py-1.5 text-sm gap-2",
  lg: "px-4 py-2 text-base gap-3",
};

export const StatusBand: React.FC<StatusBandProps> = ({
  statuses,
  size = "md",
  layout = "inline",
  showTotal = true,
  className = "",
}) => {
  const total = statuses.reduce((sum, s) => sum + s.count, 0);

  if (layout === "stacked") {
    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        {statuses.map((item, idx) => (
          <div key={idx} className={`flex items-center justify-between ${sizeClasses[size]} rounded-lg border border-neutral-700 bg-neutral-800/30`}>
            <span className={`${statusColors[item.status].text} font-medium`}>
              {item.label}
            </span>
            <span className={`font-bold ${statusColors[item.status].text}`}>
              {item.count}
            </span>
          </div>
        ))}
        {showTotal && (
          <div className={`flex items-center justify-between ${sizeClasses[size]} rounded-lg border border-neutral-600 bg-neutral-800/50`}>
            <span className="text-neutral-300 font-medium">Total</span>
            <span className="text-neutral-100 font-bold">{total}</span>
          </div>
        )}
      </div>
    );
  }

  // Inline layout
  return (
    <div className={`flex items-center flex-wrap gap-2 ${className}`}>
      {statuses.map((item, idx) => (
        <div
          key={idx}
          className={`inline-flex items-center gap-1 rounded-full border ${sizeClasses[size]} ${statusColors[item.status].bg} border-neutral-600`}
          role="status"
          aria-label={`${item.label}: ${item.count}`}
        >
          <span className={statusColors[item.status].text}>{item.label}</span>
          <span className={`font-bold ${statusColors[item.status].text}`}>{item.count}</span>
        </div>
      ))}
      {showTotal && (
        <div className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs border-neutral-600 bg-neutral-800/30`}>
          <span className="text-neutral-400">Total</span>
          <span className="font-bold text-neutral-200">{total}</span>
        </div>
      )}
    </div>
  );
};
