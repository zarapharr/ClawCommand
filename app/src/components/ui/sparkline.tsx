import React from "react";

/**
 * Sparkline Component
 * Mini line chart for trend visualization (e.g., agent activity over time)
 * Uses Recharts for rendering
 * @example
 * <Sparkline data={[10, 20, 15, 25, 30]} color="success" height={60} />
 */
interface SparklineProps {
  data: number[];
  color?: "primary" | "success" | "warning" | "error" | "info";
  height?: number;
  width?: string;
  showDots?: boolean;
  animate?: boolean;
  className?: string;
}

// Placeholder implementation - full Recharts integration in Phase 3B
export const Sparkline: React.FC<SparklineProps> = ({
  data,
  color = "primary",
  height = 60,
  width = "w-full",
  showDots = false,
  animate = true,
  className = "",
}) => {
  // Calculate min/max for scaling
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  // Generate SVG path
  const points = data
    .map((value, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 100 - ((value - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  const colorMap: Record<string, string> = {
    primary: "#6366f1",
    success: "#22c55e",
    warning: "#eab308",
    error: "#ef4444",
    info: "#0ea5e9",
  };

  return (
    <div className={`${width} ${className}`}>
      <svg
        viewBox="0 0 100 100"
        height={height}
        className="w-full"
        style={{ opacity: animate ? 1 : 0.8 }}
        role="img"
        aria-label="Trend sparkline"
      >
        <polyline
          points={points}
          fill="none"
          stroke={colorMap[color]}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {showDots &&
          data.map((_, i) => {
            const x = (i / (data.length - 1)) * 100;
            const y = 100 - ((_ - min) / range) * 100;
            return (
              <circle key={i} cx={x} cy={y} r="1.5" fill={colorMap[color]} opacity="0.6" />
            );
          })}
      </svg>
    </div>
  );
};
