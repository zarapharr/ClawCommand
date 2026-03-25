import React from "react";

/**
 * ProgressBar Component
 * Displays budget/usage as a visual progress bar with label
 * @example
 * <ProgressBar label="Budget Used" value={65} max={100} color="primary" showPercent />
 */
interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  color?: "primary" | "success" | "warning" | "error" | "info";
  size?: "sm" | "md" | "lg";
  showPercent?: boolean;
  showLabel?: boolean;
  animated?: boolean;
  className?: string;
}

const colorClasses: Record<string, string> = {
  primary: "bg-primary-500",
  success: "bg-success-500",
  warning: "bg-warning-500",
  error: "bg-error-500",
  info: "bg-info-500",
};

const sizeClasses: Record<string, string> = {
  sm: "h-1",
  md: "h-2",
  lg: "h-3",
};

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  color = "primary",
  size = "md",
  showPercent = false,
  showLabel = true,
  animated = true,
  className = "",
}) => {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className={`w-full ${className}`}>
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-2">
          {label && <span className="text-sm font-medium text-neutral-300">{label}</span>}
          {showPercent && <span className="text-xs text-neutral-400">{Math.round(percentage)}%</span>}
        </div>
      )}
      <div className={`w-full bg-neutral-700 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div
          className={`${colorClasses[color]} ${sizeClasses[size]} rounded-full transition-all duration-300 ${
            animated ? "animate-pulse" : ""
          }`}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={label}
        />
      </div>
    </div>
  );
};
