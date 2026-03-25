import type { DecisionLogEntry } from '@/lib/runtime-adapters';

export function DecisionLogPanel({ decisions }: { decisions: DecisionLogEntry[] }) {
  return (
    <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/30">
      <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Decision Log</p>
      <div className="space-y-1 max-h-28 overflow-auto">
        {decisions.length === 0 && <p className="text-xs text-slate-500">No decisions logged yet.</p>}
        {decisions.slice(0, 5).map((item) => (
          <p key={item.id} className="text-xs text-slate-500">{new Date(item.timestamp).toLocaleTimeString()} {item.decision}</p>
        ))}
      </div>
    </div>
  );
}
