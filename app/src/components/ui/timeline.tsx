import React from "react";

/**
 * Timeline Component
 * Displays workflow steps or process flow (e.g., deployment stages)
 * @example
 * <Timeline steps={[
 *   { label: "Init", status: "complete" },
 *   { label: "Build", status: "current" },
 *   { label: "Deploy", status: "pending" }
 * ]} />
 */
interface TimelineStep {
  label: string;
  status: "pending" | "current" | "complete" | "error";
  timestamp?: string;
  description?: string;
}

interface TimelineProps {
  steps: TimelineStep[];
  orientation?: "vertical" | "horizontal";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const statusClasses: Record<string, string> = {
  pending: "bg-neutral-600 border-neutral-500",
  current: "bg-primary-500 border-primary-400 animate-pulse",
  complete: "bg-success-500 border-success-400",
  error: "bg-error-500 border-error-400",
};

const sizeClasses: Record<string, string> = {
  sm: "w-3 h-3",
  md: "w-4 h-4",
  lg: "w-6 h-6",
};

export const Timeline: React.FC<TimelineProps> = ({
  steps,
  orientation = "vertical",
  size = "md",
  className = "",
}) => {
  if (orientation === "vertical") {
    return (
      <div className={`flex flex-col gap-4 ${className}`}>
        {steps.map((step, idx) => (
          <div key={idx} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div
                className={`rounded-full border-2 ${statusClasses[step.status]} ${sizeClasses[size]} flex items-center justify-center`}
              >
                {step.status === "complete" && (
                  <span className="text-white text-xs font-bold">✓</span>
                )}
                {step.status === "error" && (
                  <span className="text-white text-xs font-bold">!</span>
                )}
              </div>
              {idx < steps.length - 1 && (
                <div className="w-1 h-8 bg-neutral-600 mt-2" />
              )}
            </div>
            <div className="flex-1 pt-1">
              <p className="text-sm font-medium text-neutral-200">{step.label}</p>
              {step.timestamp && (
                <p className="text-xs text-neutral-400">{step.timestamp}</p>
              )}
              {step.description && (
                <p className="text-sm text-neutral-400 mt-1">{step.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Horizontal layout
  return (
    <div className={`flex items-center justify-between ${className}`}>
      {steps.map((step, idx) => (
        <div key={idx} className="flex flex-col items-center flex-1">
          <div
            className={`rounded-full border-2 ${statusClasses[step.status]} ${sizeClasses[size]} flex items-center justify-center mb-2`}
          >
            {step.status === "complete" && (
              <span className="text-white text-xs font-bold">✓</span>
            )}
            {step.status === "error" && (
              <span className="text-white text-xs font-bold">!</span>
            )}
          </div>
          <p className="text-xs font-medium text-neutral-300 text-center">{step.label}</p>
          {idx < steps.length - 1 && (
            <div className="absolute w-full h-1 bg-neutral-600 mt-3 ml-4" />
          )}
        </div>
      ))}
    </div>
  );
};
