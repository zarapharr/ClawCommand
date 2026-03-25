import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { WorkflowTimeline } from '@/components/workflow/WorkflowTimeline';

export function WorkflowPageRefactored() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [isPaused, setIsPaused] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto h-screen max-h-screen flex flex-col">
        <WorkflowTimeline
          sessionId={sessionId || 'unknown'}
          isPaused={isPaused}
          onPause={() => setIsPaused(true)}
          onResume={() => setIsPaused(false)}
          onRollback={(stepId) => {
            console.log('Rollback to step:', stepId);
          }}
        />
      </div>
    </div>
  );
}
