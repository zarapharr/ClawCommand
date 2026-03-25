import { useMemo } from 'react';

interface Change {
  field: string;
  old: unknown;
  new: unknown;
}

interface ChangeViewerProps {
  changes: Change[];
  compact?: boolean;
  expanded?: boolean;
  onExpandChange?: (expanded: boolean) => void;
}

export function ChangeViewer({
  changes,
  compact = false,
}: ChangeViewerProps) {
  const formatValue = (value: unknown): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    if (typeof value === 'boolean') {
      return value ? '✓ true' : '✗ false';
    }
    return String(value);
  };

  const displayChanges = useMemo(() => {
    return changes.filter(c => c.old !== c.new);
  }, [changes]);

  if (displayChanges.length === 0) {
    return (
      <div className="text-sm text-slate-500">
        No changes detected
      </div>
    );
  }

  if (compact) {
    return (
      <div className="space-y-2">
        {displayChanges.slice(0, 3).map((change, idx) => (
          <div key={`${change.field}-${idx}`} className="text-xs">
            <span className="text-slate-400">{change.field}:</span>
            <span className="text-red-400 ml-2">
              {String(change.old).substring(0, 20)}
            </span>
            <span className="text-slate-600 mx-1">→</span>
            <span className="text-emerald-400">
              {String(change.new).substring(0, 20)}
            </span>
          </div>
        ))}
        {displayChanges.length > 3 && (
          <div className="text-xs text-slate-500">
            +{displayChanges.length - 3} more changes
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {displayChanges.map((change, idx) => (
        <div
          key={`${change.field}-${idx}`}
          className="rounded-lg border border-slate-800 overflow-hidden"
        >
          <div className="bg-slate-900/30 px-4 py-2 border-b border-slate-800 flex items-center justify-between">
            <h4 className="font-mono text-sm font-medium text-slate-300">
              {change.field}
            </h4>
            <span className="text-xs text-slate-500">modified</span>
          </div>

          <div className="grid grid-cols-2 divide-x divide-slate-800">
            {/* Before */}
            <div className="p-4 space-y-1">
              <p className="text-xs font-semibold text-red-400 mb-2">Before</p>
              <pre className="text-xs bg-slate-950 border border-slate-800 rounded p-3 overflow-x-auto text-slate-300 font-mono whitespace-pre-wrap break-words">
                {formatValue(change.old)}
              </pre>
            </div>

            {/* After */}
            <div className="p-4 space-y-1">
              <p className="text-xs font-semibold text-emerald-400 mb-2">After</p>
              <pre className="text-xs bg-slate-950 border border-slate-800 rounded p-3 overflow-x-auto text-slate-300 font-mono whitespace-pre-wrap break-words">
                {formatValue(change.new)}
              </pre>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Unified diff view for changes (simpler)
 */
interface DiffViewerProps {
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  compactMode?: boolean;
}

export function DiffViewer({ before, after, compactMode = false }: DiffViewerProps) {
  const allKeys = new Set([
    ...Object.keys(before || {}),
    ...Object.keys(after || {}),
  ]);

  const changes = Array.from(allKeys)
    .map(key => ({
      field: key,
      old: before?.[key],
      new: after?.[key],
    }))
    .filter(c => c.old !== c.new);

  return <ChangeViewer changes={changes} compact={compactMode} />;
}
