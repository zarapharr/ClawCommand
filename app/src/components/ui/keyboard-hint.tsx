import React from "react";

/**
 * KeyboardHint Component
 * Displays keyboard shortcuts (Cmd+K, Esc, etc.)
 * @example
 * <KeyboardHint keys={["Cmd", "K"]} label="Search" />
 */
interface KeyboardHintProps {
  keys: string[];
  label?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "inverse";
  className?: string;
}

const sizeClasses: Record<string, string> = {
  sm: "px-1.5 py-0.5 text-xs gap-1",
  md: "px-2 py-1 text-sm gap-1.5",
  lg: "px-2.5 py-1.5 text-base gap-2",
};

const keySizeClasses: Record<string, string> = {
  sm: "min-w-6 h-6 text-xs",
  md: "min-w-7 h-7 text-sm",
  lg: "min-w-8 h-8 text-base",
};

export const KeyboardHint: React.FC<KeyboardHintProps> = ({
  keys,
  label,
  size = "md",
  variant = "default",
  className = "",
}) => {
  const keyClasses =
    variant === "inverse"
      ? "bg-neutral-100 text-neutral-900"
      : "bg-neutral-700 text-neutral-100";

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`flex items-center ${sizeClasses[size]} rounded bg-neutral-800/50 border border-neutral-700`}>
        {keys.map((key, idx) => (
          <React.Fragment key={idx}>
            <kbd
              className={`${keySizeClasses[size]} rounded font-mono font-bold flex items-center justify-center border border-neutral-600 ${keyClasses}`}
            >
              {key}
            </kbd>
            {idx < keys.length - 1 && (
              <span className="text-neutral-500 font-light">+</span>
            )}
          </React.Fragment>
        ))}
      </div>
      {label && <span className="text-sm text-neutral-400">{label}</span>}
    </div>
  );
};
