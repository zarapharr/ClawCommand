import type { OperatorAuditEntry } from '@/lib/runtime-adapters';

export function ActionReceiptLedger({ entries }: { entries: OperatorAuditEntry[] }) {
  return (
    <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/30">
      <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Action Receipts</p>
      <div className="space-y-1 max-h-36 overflow-auto">
        {entries.length === 0 && <p className="text-xs text-slate-500">No receipts yet.</p>}
        {entries.slice(0, 8).map((entry) => (
          <div key={entry.id} className="text-xs text-slate-400 border-b border-slate-800/50 pb-1">
            <span className={entry.status === 'success' ? 'text-emerald-300' : 'text-red-300'}>{entry.status.toUpperCase()}</span>
            {' '}{entry.commandId} {entry.action} {entry.targetType}:{entry.targetId}
          </div>
        ))}
      </div>
    </div>
  );
}
