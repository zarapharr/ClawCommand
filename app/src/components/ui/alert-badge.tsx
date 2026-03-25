import React from "react";

/**
 * AlertBadge Component
 * Status indicator badge for surfacing alerts (agent status, build health)
 * @example
 * <AlertBadge status="warning" label="Budget Alert" count={3} />
 */
interface AlertBadgeProps {
  status: "success" | "warning" | "error" | "info" | "neutral";
  label: string;
  count?: number;
  icon?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  animated?: boolean;
  onClick?: () => void;
  className?: string;
}

const statusClasses: Record<string, { bg: string; text: string; border: string }> = {
  success: {
    bg: "bg-success-500/10",
    text: "text-success-300",
    border: "border-success-500/30",
  },
  warning: {
    bg: "bg-warning-500/10",
    text: "text-warning-300",
    border: "border-warning-500/30",
  },
  error: {
    bg: "bg-error-500/10",
    text: "text-error-300",
    border: "border-error-500/30",
  },
  info: {
    bg: "bg-info-500/10",
    text: "text-info-300",
    border: "border-info-500/30",
  },
  neutral: {
    bg: "bg-neutral-500/10",
    text: "text-neutral-300",
    border: "border-neutral-500/30",
  },
};

const sizeClasses: Record<string, string> = {
  sm: "px-2 py-1 text-xs",
  md: "px-3 py-1.5 text-sm",
  lg: "px-4 py-2 text-base",
};

const statusDots: Record<string, string> = {
  success: "bg-success-500",
  warning: "bg-warning-500",
  error: "bg-error-500",
  info: "bg-info-500",
  neutral: "bg-neutral-500",
};

export const AlertBadge: React.FC<AlertBadgeProps> = ({
  status,
  label,
  count,
  icon,
  size = "md",
  animated = false,
  onClick,
  className = "",
}) => {
  const style = statusClasses[status];

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full border ${style.bg} ${style.border} ${sizeClasses[size]} cursor-pointer hover:opacity-80 transition-opacity ${className}`}
      role="status"
      aria-label={`${status} alert: ${label}${count ? ` (${count})` : ""}`}
    >
      <div
        className={`w-2 h-2 rounded-full ${statusDots[status]} ${animated ? "animate-pulse" : ""}`}
      />
      <span className={`font-medium ${style.text}`}>{label}</span>
      {count && <span className={`font-semibold ${style.text}`}>({count})</span>}
      {icon && <span className={style.text}>{icon}</span>}
    </div>
  );
};
