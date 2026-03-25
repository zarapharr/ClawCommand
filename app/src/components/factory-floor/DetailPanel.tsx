import { X, Download, Clock, DollarSign, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import React from 'react';

interface DetailPanelProps {
  title: string;
  open: boolean;
  onClose: () => void;
  children?: React.ReactNode;
  executionTime?: number; // milliseconds
  tokensUsed?: number;
  cost?: number;
  logs?: string[];
  canExport?: boolean;
  onExport?: () => void;
  className?: string;
}

export function DetailPanel({
  title,
  open,
  onClose,
  children,
  executionTime,
  tokensUsed,
  cost,
  logs,
  canExport = true,
  onExport,
  className,
}: DetailPanelProps) {
  if (!open) return null;

  const handleExport = () => {
    if (onExport) {
      onExport();
    } else if (logs) {
      const data = {
        title,
        exportedAt: new Date().toISOString(),
        stats: { executionTime, tokensUsed, cost },
        logs,
      };
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title}-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity z-40"
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <div
        className={cn(
          'fixed inset-y-0 right-0 w-full sm:w-96 bg-slate-900 border-l border-slate-700',
          'shadow-2xl transition-transform duration-300 z-50',
          'flex flex-col overflow-hidden',
          className,
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors p-1 hover:bg-slate-800 rounded"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats bar */}
        {(executionTime !== undefined || tokensUsed !== undefined || cost !== undefined) && (
          <div className="grid grid-cols-3 gap-3 p-4 bg-slate-800/50 border-b border-slate-700">
            {executionTime !== undefined && (
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span className="text-xs text-slate-400">Time</span>
                </div>
                <p className="font-mono text-sm font-semibold text-slate-100">
                  {(executionTime / 1000).toFixed(2)}s
                </p>
              </div>
            )}
            {tokensUsed !== undefined && (
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <Zap className="w-4 h-4 text-slate-400" />
                  <span className="text-xs text-slate-400">Tokens</span>
                </div>
                <p className="font-mono text-sm font-semibold text-slate-100">
                  {tokensUsed.toLocaleString()}
                </p>
              </div>
            )}
            {cost !== undefined && (
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <DollarSign className="w-4 h-4 text-slate-400" />
                  <span className="text-xs text-slate-400">Cost</span>
                </div>
                <p className="font-mono text-sm font-semibold text-slate-100">
                  ${cost.toFixed(4)}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <ScrollArea className="flex-1 overflow-hidden">
          <div className="p-4">
            {children}

            {/* Logs fallback */}
            {!children && logs && logs.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-slate-300 mb-3">Execution Logs</h3>
                <div className="bg-slate-950 rounded border border-slate-700 p-3 font-mono text-xs text-slate-300">
                  {logs.map((line, i) => (
                    <div key={i} className="py-0.5">
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!children && (!logs || logs.length === 0) && (
              <div className="text-slate-400 text-sm">No details available</div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        {canExport && (
          <div className="border-t border-slate-700 p-4 bg-slate-800/50">
            <Button
              onClick={handleExport}
              size="sm"
              className="w-full bg-slate-700 hover:bg-slate-600 text-slate-100"
            >
              <Download className="w-4 h-4 mr-2" />
              Export as JSON
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
