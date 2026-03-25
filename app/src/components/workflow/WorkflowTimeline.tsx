import { useState } from 'react';
import { Download, Play, Pause, RotateCcw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TimelineNode, type NodeStatus, type NodeType } from './TimelineNode';
import { DetailPanel } from '@/components/factory-floor/DetailPanel';

export interface WorkflowStep {
  id: string;
  title: string;
  type: NodeType;
  status: NodeStatus;
  inputs?: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  logs?: string[];
  duration?: number;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

interface WorkflowTimelineProps {
  sessionId: string;
  steps?: WorkflowStep[];
  onPause?: () => void;
  onResume?: () => void;
  onRollback?: (stepId: string) => void;
  loading?: boolean;
  isPaused?: boolean;
}

export function WorkflowTimeline({
  sessionId,
  steps = [],
  onPause,
  onResume,
  onRollback,
  isPaused = false,
}: WorkflowTimelineProps) {
  const [selectedStep, setSelectedStep] = useState<WorkflowStep | null>(null);
  const [detailPanelOpen, setDetailPanelOpen] = useState(false);
  const [showRollbackConfirm, setShowRollbackConfirm] = useState(false);
  const [rollbackTarget, setRollbackTarget] = useState<string | null>(null);

  // Sample data if none provided
  const sampleSteps: WorkflowStep[] = [
    {
      id: 'step-1',
      title: 'Trigger',
      type: 'agent',
      status: 'complete',
      duration: 1000,
      logs: ['Workflow triggered at 2026-03-23 15:30:00'],
    },
    {
      id: 'step-2',
      title: 'Data Fetch',
      type: 'tool',
      status: 'complete',
      duration: 2500,
      logs: ['Fetched 1,250 records from API', 'Processing complete'],
    },
    {
      id: 'step-3',
      title: 'Analyze',
      type: 'agent',
      status: 'running',
      duration: undefined,
      logs: ['Starting analysis...', 'Processing batch 1 of 10'],
    },
    {
      id: 'step-4',
      title: 'Decision',
      type: 'decision',
      status: 'pending',
      logs: [],
    },
    {
      id: 'step-5',
      title: 'Generate Report',
      type: 'agent',
      status: 'pending',
      logs: [],
    },
  ];

  const workflowSteps = steps.length > 0 ? steps : sampleSteps;

  const handleStepClick = (step: WorkflowStep) => {
    setSelectedStep(step);
    setDetailPanelOpen(true);
  };

  const handleRollback = (stepId: string) => {
    setRollbackTarget(stepId);
    setShowRollbackConfirm(true);
  };

  const confirmRollback = () => {
    if (rollbackTarget) {
      onRollback?.(rollbackTarget);
      setShowRollbackConfirm(false);
      setRollbackTarget(null);
    }
  };

  const handleExport = () => {
    const data = {
      sessionId,
      exportedAt: new Date().toISOString(),
      steps: workflowSteps.map(s => ({
        ...s,
        startedAt: s.startedAt?.toISOString(),
        completedAt: s.completedAt?.toISOString(),
      })),
    };

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workflow-${sessionId}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Calculate progress
  const completedCount = workflowSteps.filter(s => s.status === 'complete').length;
  const totalCount = workflowSteps.length;
  const progressPercent = (completedCount / totalCount) * 100;

  return (
    <div className="flex flex-col gap-6 w-full h-full">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Workflow Timeline</h1>
            <p className="text-sm text-slate-400 mt-1">Session ID: {sessionId}</p>
          </div>

          {/* Controls */}
          <div className="flex gap-2">
            {isPaused ? (
              <Button onClick={onResume} size="sm" variant="default">
                <Play className="w-4 h-4 mr-2" />
                Resume
              </Button>
            ) : (
              <Button onClick={onPause} size="sm" variant="outline">
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </Button>
            )}
            <Button onClick={handleExport} size="sm" variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-800/50 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-sm text-slate-400">
          Progress: {completedCount} of {totalCount} steps complete
        </p>
      </div>

      {/* Timeline container */}
      <div className="flex-1 bg-gradient-to-b from-slate-900/50 to-slate-800/30 rounded-lg border border-slate-700 p-6 overflow-x-auto">
        <div className="flex gap-2 min-w-max pb-4 relative">
          {/* Connection line */}
          <div className="absolute top-8 left-0 right-0 h-1 bg-slate-700/50 pointer-events-none" />

          {/* Nodes */}
          {workflowSteps.map((step, index) => (
            <div key={step.id} className="relative">
              <TimelineNode
                {...step}
                position={index}
                isSelected={selectedStep?.id === step.id}
                onClick={() => handleStepClick(step)}
              />

              {/* Step number label */}
              <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-slate-500 font-medium">
                {index + 1}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Status and controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Status breakdown */}
        <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-4">
          <h3 className="text-sm font-semibold text-slate-200 mb-3">Status</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-slate-400">
              <span>Complete:</span>
              <span className="text-emerald-400 font-semibold">
                {workflowSteps.filter(s => s.status === 'complete').length}
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Running:</span>
              <span className="text-blue-400 font-semibold">
                {workflowSteps.filter(s => s.status === 'running').length}
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Pending:</span>
              <span className="text-slate-400 font-semibold">
                {workflowSteps.filter(s => s.status === 'pending').length}
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Failed:</span>
              <span className="text-red-400 font-semibold">
                {workflowSteps.filter(s => s.status === 'failed').length}
              </span>
            </div>
          </div>
        </div>

        {/* Total execution time */}
        <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-4">
          <h3 className="text-sm font-semibold text-slate-200 mb-3">Execution Time</h3>
          <div className="text-2xl font-mono font-bold text-cyan-400">
            {(
              workflowSteps.reduce((sum, s) => sum + (s.duration || 0), 0) / 1000
            ).toFixed(2)}
            s
          </div>
          <p className="text-xs text-slate-500 mt-1">Total duration</p>
        </div>

        {/* Data flow info */}
        <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-4">
          <h3 className="text-sm font-semibold text-slate-200 mb-3">Data Flow</h3>
          <div className="space-y-1 text-xs text-slate-400">
            <div>Inputs available: {selectedStep?.inputs ? Object.keys(selectedStep.inputs).length : 0}</div>
            <div>Outputs available: {selectedStep?.outputs ? Object.keys(selectedStep.outputs).length : 0}</div>
          </div>
        </div>
      </div>

      {/* Rollback confirmation */}
      {showRollbackConfirm && rollbackTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-amber-500" />
              <h2 className="text-lg font-semibold text-slate-100">Rollback to Step?</h2>
            </div>
            <p className="text-sm text-slate-400 mb-6">
              This will reset the workflow to the selected step and clear any subsequent steps.
              This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                onClick={() => setShowRollbackConfirm(false)}
                variant="outline"
                size="sm"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmRollback}
                variant="default"
                size="sm"
                className="bg-red-600 hover:bg-red-700"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Rollback
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Detail panel */}
      {selectedStep && (
        <DetailPanel
          title={selectedStep.title}
          open={detailPanelOpen}
          onClose={() => setDetailPanelOpen(false)}
          executionTime={selectedStep.duration}
          logs={selectedStep.logs}
        >
          <div className="space-y-4">
            {/* Step info */}
            <div>
              <h3 className="text-sm font-semibold text-slate-200 mb-2">Step Info</h3>
              <div className="space-y-1 text-xs text-slate-400">
                <div><span className="text-slate-500">ID:</span> {selectedStep.id}</div>
                <div><span className="text-slate-500">Type:</span> {selectedStep.type}</div>
                <div><span className="text-slate-500">Status:</span> {selectedStep.status}</div>
                {selectedStep.error && (
                  <div className="text-red-400"><span className="text-slate-500">Error:</span> {selectedStep.error}</div>
                )}
              </div>
            </div>

            {/* Inputs */}
            {selectedStep.inputs && Object.keys(selectedStep.inputs).length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-200 mb-2">Inputs</h3>
                <pre className="bg-slate-950 rounded p-2 text-xs text-slate-300 overflow-auto max-h-40">
                  {JSON.stringify(selectedStep.inputs, null, 2)}
                </pre>
              </div>
            )}

            {/* Outputs */}
            {selectedStep.outputs && Object.keys(selectedStep.outputs).length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-200 mb-2">Outputs</h3>
                <pre className="bg-slate-950 rounded p-2 text-xs text-slate-300 overflow-auto max-h-40">
                  {JSON.stringify(selectedStep.outputs, null, 2)}
                </pre>
              </div>
            )}

            {/* Rollback button */}
            {selectedStep.status === 'complete' && (
              <Button
                onClick={() => handleRollback(selectedStep.id)}
                variant="outline"
                size="sm"
                className="w-full text-red-400 border-red-700/50 hover:bg-red-950/20"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Rollback to This Step
              </Button>
            )}
          </div>
        </DetailPanel>
      )}
    </div>
  );
}
