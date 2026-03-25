import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FeatureUnavailableProps {
  title: string;
  reason?: string;
  onBackToFactoryFloor?: () => void;
}

export function FeatureUnavailable({ title, reason, onBackToFactoryFloor }: FeatureUnavailableProps) {
  return (
    <div className="h-full flex items-center justify-center p-6">
      <div className="max-w-xl w-full rounded-xl border border-amber-500/30 bg-amber-500/5 p-6">
        <div className="flex items-center gap-3 mb-3">
          <AlertTriangle className="w-5 h-5 text-amber-300" />
          <h2 className="text-lg font-semibold text-white">{title} currently unavailable</h2>
        </div>
        <p className="text-sm text-slate-300">
          {reason || 'This feature is not enabled for the current runtime profile. The rest of ClawCommand is still available.'}
        </p>
        {onBackToFactoryFloor && (
          <Button variant="outline" className="mt-4 border-slate-700 text-slate-200" onClick={onBackToFactoryFloor}>
            Return to Factory Floor
          </Button>
        )}
      </div>
    </div>
  );
}

