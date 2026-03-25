import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, XCircle, MessageSquare } from 'lucide-react';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

interface ApprovalWidgetProps {
  status: ApprovalStatus;
  approverName?: string;
  approverEmail?: string;
  approvalDate?: string;
  reason?: string;
  onApprove?: () => void;
  onReject?: () => void;
  compact?: boolean;
  disabled?: boolean;
}

export function ApprovalWidget({
  status,
  approverName,
  approverEmail,
  approvalDate,
  reason,
  onApprove,
  onReject,
  compact = false,
  disabled = false,
}: ApprovalWidgetProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'approved':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'rejected':
        return 'text-red-400 bg-red-500/10 border-red-500/30';
      case 'pending':
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5" />;
      case 'rejected':
        return <XCircle className="w-5 h-5" />;
      case 'pending':
        return <Clock className="w-5 h-5" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'pending':
        return 'Pending Review';
    }
  };

  if (compact) {
    return (
      <div className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium',
        getStatusColor()
      )}>
        {getStatusIcon()}
        {getStatusText()}
      </div>
    );
  }

  return (
    <div className={cn(
      'p-4 rounded-lg border',
      getStatusColor()
    )}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div>
            <h4 className="font-semibold text-sm">{getStatusText()}</h4>
            {approverName && (
              <p className="text-xs opacity-80">
                {approverName}
                {approverEmail && <span> ({approverEmail})</span>}
              </p>
            )}
          </div>
        </div>
      </div>

      {approvalDate && (
        <p className="text-xs opacity-70 mb-3">
          {new Date(approvalDate).toLocaleString()}
        </p>
      )}

      {reason && (
        <div className="flex items-start gap-2 mb-3 p-3 rounded bg-black/20">
          <MessageSquare className="w-4 h-4 flex-shrink-0 mt-0.5 opacity-70" />
          <p className="text-sm opacity-80">{reason}</p>
        </div>
      )}

      {status === 'pending' && (onApprove || onReject) && (
        <div className="flex items-center gap-2 pt-3 border-t border-current opacity-30">
          {onApprove && (
            <Button
              size="sm"
              disabled={disabled}
              onClick={onApprove}
              className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 h-8"
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Approve
            </Button>
          )}
          {onReject && (
            <Button
              size="sm"
              disabled={disabled}
              onClick={onReject}
              variant="outline"
              className="border-red-500/30 text-red-400 hover:bg-red-500/10 h-8"
            >
              <XCircle className="w-4 h-4 mr-1" />
              Reject
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
