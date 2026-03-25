import { useState, useRef, useCallback } from 'react';
import { 
  GitBranch, Play, Plus, 
  Users, Cpu, CheckCircle, Zap, Settings, Trash2,
  MousePointer2, Download, Upload
} from 'lucide-react';
import { 
  XAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { useWorkflowStore } from '../stores/enterprise-store';
import type { WorkflowNode, WorkflowEdge } from '../types/enterprise';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { createStarterWorkflowGraph, getDefaultNodeConfig, getDefaultNodePosition } from '@/lib/workflow-utils';
import { connectionAlreadyExists, resolveWorkflowConnection } from '@/lib/workflow-connections';

// Node types with their configurations
const nodeTypes = [
  { type: 'input', label: 'Trigger', icon: Zap, color: '#f59e0b', description: 'Start of workflow' },
  { type: 'agent', label: 'Agent', icon: Cpu, color: '#00f0ff', description: 'AI agent task' },
  { type: 'supervisor', label: 'Supervisor', icon: Users, color: '#a855f7', description: 'Coordinate agents' },
  { type: 'decision', label: 'Decision', icon: GitBranch, color: '#f97316', description: 'Conditional branch' },
  { type: 'output', label: 'End', icon: CheckCircle, color: '#10b981', description: 'Workflow end' },
] as const;

type NodeType = typeof nodeTypes[number]['type'];

// Workflow Node Component
const WorkflowNodeComponent: React.FC<{
  node: WorkflowNode;
  isSelected: boolean;
  onSelect: () => void;
  onDragStart: (e: React.MouseEvent, nodeId: string) => void;
  onPortMouseDown: (e: React.MouseEvent, nodeId: string, port: 'input' | 'output') => void;
  onPortMouseUp: (e: React.MouseEvent, nodeId: string, port: 'input' | 'output') => void;
}> = ({ node, isSelected, onSelect, onDragStart, onPortMouseDown, onPortMouseUp }) => {
  const nodeType = nodeTypes.find(nt => nt.type === node.type) || nodeTypes[1];
  const Icon = nodeType.icon;

  return (
    <div
      className={cn(
        'absolute cursor-move transition-all duration-200',
        isSelected && 'z-20'
      )}
      style={{
        left: node.position.x,
        top: node.position.y,
        transform: 'translate(-50%, -50%)',
      }}
      onMouseDown={(e) => onDragStart(e, node.id)}
      onClick={onSelect}
    >
      {/* Selection ring */}
      {isSelected && (
        <div 
          className="absolute inset-0 -m-3 rounded-xl border-2 animate-pulse"
          style={{ borderColor: nodeType.color as string }}
        />
      )}
      
      {/* Glow effect */}
      {isSelected && (
        <div 
          className="absolute inset-0 -m-6 rounded-full blur-xl opacity-30"
          style={{ backgroundColor: nodeType.color as string }}
        />
      )}
      
      {/* Main node card */}
      <div 
        className="relative w-32 p-3 rounded-lg border backdrop-blur-sm bg-slate-900/95"
        style={{
          borderColor: nodeType.color as string,
          boxShadow: isSelected 
            ? `0 0 20px ${nodeType.color as string}50` 
            : `0 0 10px ${nodeType.color as string}20`,
        }}
      >
        {/* Input port */}
        {node.type !== 'input' && (
          <div
            className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 bg-slate-900 cursor-crosshair hover:scale-125 transition-transform"
            style={{ borderColor: nodeType.color as string }}
            onMouseDown={(e) => {
              e.stopPropagation();
              onPortMouseDown(e, node.id, 'input');
            }}
            onMouseUp={(e) => {
              e.stopPropagation();
              onPortMouseUp(e, node.id, 'input');
            }}
          />
        )}

        {/* Output port */}
        {node.type !== 'output' && (
          <div
            className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 bg-slate-900 cursor-crosshair hover:scale-125 transition-transform"
            style={{ borderColor: nodeType.color as string }}
            onMouseDown={(e) => {
              e.stopPropagation();
              onPortMouseDown(e, node.id, 'output');
            }}
            onMouseUp={(e) => {
              e.stopPropagation();
              onPortMouseUp(e, node.id, 'output');
            }}
          />
        )}

        <div className="flex flex-col items-center gap-2">
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: `${nodeType.color as string}20` }}
          >
            <Icon className="w-4 h-4" style={{ color: nodeType.color as string }} />
          </div>
          <p className="text-xs font-medium text-slate-200 text-center">{nodeType.label}</p>
          {(node.config?.agentId as string) && (
            <p className="text-[10px] text-slate-500 truncate max-w-full">
              {(node.config?.agentName as string) || (node.config?.agentId as string)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// Connection Line Component
const ConnectionLine: React.FC<{
  edge: WorkflowEdge;
  nodes: WorkflowNode[];
  isSelected: boolean;
  onClick: () => void;
}> = ({ edge, nodes, isSelected, onClick }) => {
  const source = nodes.find(n => n.id === edge.source);
  const target = nodes.find(n => n.id === edge.target);
  if (!source || !target) return null;

  const startX = source.position.x + 64;
  const startY = source.position.y;
  const endX = target.position.x - 64;
  const endY = target.position.y;

  const controlPoint1X = startX + (endX - startX) * 0.5;
  const controlPoint1Y = startY;
  const controlPoint2X = endX - (endX - startX) * 0.5;
  const controlPoint2Y = endY;

  const path = `M ${startX} ${startY} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${endX} ${endY}`;

  return (
    <g className="cursor-pointer" onClick={onClick}>
      {/* Hit area */}
      <path d={path} fill="none" stroke="transparent" strokeWidth="15" />
      {/* Background line */}
      <path d={path} fill="none" stroke="#1e293b" strokeWidth="4" />
      {/* Main line */}
      <path 
        d={path} 
        fill="none" 
        stroke={isSelected ? '#00f0ff' : '#475569'} 
        strokeWidth={isSelected ? 3 : 2}
        opacity={isSelected ? 1 : 0.6}
        className="transition-all"
      />
      {/* Arrow head */}
      <polygon 
        points={`${endX},${endY} ${endX-8},${endY-4} ${endX-8},${endY+4}`}
        fill={isSelected ? '#00f0ff' : '#475569'}
      />
    </g>
  );
};

// Temporary connection line while dragging
const TempConnectionLine: React.FC<{
  start: { x: number; y: number };
  end: { x: number; y: number };
}> = ({ start, end }) => {
  const controlPoint1X = start.x + (end.x - start.x) * 0.5;
  const controlPoint1Y = start.y;
  const controlPoint2X = end.x - (end.x - start.x) * 0.5;
  const controlPoint2Y = end.y;

  const path = `M ${start.x} ${start.y} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${end.x} ${end.y}`;

  return (
    <g>
      <path d={path} fill="none" stroke="#00f0ff" strokeWidth="2" strokeDasharray="5 5" opacity={0.8} />
    </g>
  );
};

export default function WorkflowPage() {
  const { 
    workflows, 
    createWorkflow, 
    deleteWorkflow,
    updateWorkflow,
    addNode,
    addEdge,
    deleteEdge,
    executeWorkflow,
    executions,
  } = useWorkflowStore();

  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showNodeConfig, setShowNodeConfig] = useState(false);
  const [newWorkflowName, setNewWorkflowName] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStart, setConnectionStart] = useState<{ nodeId: string; port: 'input' | 'output' } | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const canvasScrollRef = useRef<HTMLDivElement>(null);

  const selectedWorkflow = workflows.find(w => w.id === selectedWorkflowId);
  const selectedNode = selectedWorkflow?.nodes.find(n => n.id === selectedNodeId);
  const canEditWorkflow = Boolean(selectedWorkflow);

  // Create new workflow
  const handleCreateWorkflow = () => {
    if (!newWorkflowName.trim()) return;
    const starterGraph = createStarterWorkflowGraph();
    const newWorkflow = createWorkflow({
      name: newWorkflowName,
      description: 'New workflow',
      pattern: 'sequential',
      nodes: starterGraph.nodes,
      edges: starterGraph.edges,
      isActive: false,
    });
    setSelectedWorkflowId(newWorkflow.id);
    setShowNewModal(false);
    setNewWorkflowName('');
  };

  // Add node from palette
  const handleAddNode = (type: NodeType) => {
    if (!selectedWorkflow) return;

    const viewport = canvasScrollRef.current
      ? {
          scrollLeft: canvasScrollRef.current.scrollLeft,
          scrollTop: canvasScrollRef.current.scrollTop,
          clientWidth: canvasScrollRef.current.clientWidth,
          clientHeight: canvasScrollRef.current.clientHeight,
        }
      : undefined;
    const position = getDefaultNodePosition(selectedWorkflow.nodes, viewport);

    const newNode = addNode(selectedWorkflow.id, {
      type,
      position,
      config: getDefaultNodeConfig(type),
    });

    setSelectedNodeId(newNode.id);
    if (type === 'agent' || type === 'supervisor') {
      setShowNodeConfig(true);
    }
  };

  // Start connection drag from a port
  const handlePortMouseDown = (e: React.MouseEvent, nodeId: string, port: 'input' | 'output') => {
    e.stopPropagation();
    setIsConnecting(true);
    setConnectionStart({ nodeId, port });
  };

  // Complete connection when drag lands on a port
  const handlePortMouseUp = (e: React.MouseEvent, nodeId: string, port: 'input' | 'output') => {
    e.stopPropagation();

    if (!isConnecting || !connectionStart || !selectedWorkflow) return;

    const connection = resolveWorkflowConnection(connectionStart, { nodeId, port });
    if (connection && !connectionAlreadyExists(selectedWorkflow.edges, connection)) {
      addEdge(selectedWorkflow.id, connection);
    }

    setIsConnecting(false);
    setConnectionStart(null);
  };

  // Handle mouse move for connection dragging
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
    
    if (isDragging && draggedNode && selectedWorkflow) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        updateWorkflow(selectedWorkflow.id, {
          nodes: selectedWorkflow.nodes.map(n =>
            n.id === draggedNode ? { ...n, position: { x, y } } : n
          ),
        });
      }
    }
  }, [isDragging, draggedNode, selectedWorkflow, updateWorkflow]);

  // Handle drag start
  const handleDragStart = (_e: React.MouseEvent, nodeId: string) => {
    if (isConnecting) return;
    setIsDragging(true);
    setDraggedNode(nodeId);
    setSelectedNodeId(nodeId);
    setSelectedEdgeId(null);
  };

  // Handle drag end
  const handleDragEnd = () => {
    setIsDragging(false);
    setDraggedNode(null);
  };

  // Handle canvas click (deselect)
  const handleCanvasClick = () => {
    if (isConnecting) {
      setIsConnecting(false);
      setConnectionStart(null);
    } else {
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
    }
  };

  // Delete selected node
  const handleDeleteNode = () => {
    if (!selectedWorkflow || !selectedNodeId) return;
    
    updateWorkflow(selectedWorkflow.id, {
      nodes: selectedWorkflow.nodes.filter(n => n.id !== selectedNodeId),
      edges: selectedWorkflow.edges.filter(
        e => e.source !== selectedNodeId && e.target !== selectedNodeId
      ),
    });
    setSelectedNodeId(null);
    setShowNodeConfig(false);
  };

  // Delete selected edge
  const handleDeleteEdge = () => {
    if (!selectedWorkflow || !selectedEdgeId) return;
    
    deleteEdge(selectedWorkflow.id, selectedEdgeId);
    setSelectedEdgeId(null);
  };

  // Export workflow
  const handleExport = () => {
    if (!selectedWorkflow) return;
    const dataStr = JSON.stringify(selectedWorkflow, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedWorkflow.name}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import workflow
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const workflow = JSON.parse(event.target?.result as string);
        const newWorkflow = createWorkflow({
          name: workflow.name + ' (Imported)',
          description: workflow.description,
          pattern: workflow.pattern,
          nodes: workflow.nodes,
          edges: workflow.edges,
          isActive: false,
        });
        setSelectedWorkflowId(newWorkflow.id);
      } catch (err) {
        alert('Invalid workflow file');
      }
    };
    reader.readAsText(file);
  };

  // Get connection start position
  const getConnectionStartPos = () => {
    if (!connectionStart || !selectedWorkflow) return null;
    const node = selectedWorkflow.nodes.find(n => n.id === connectionStart.nodeId);
    if (!node) return null;
    return {
      x: connectionStart.port === 'output' ? node.position.x + 64 : node.position.x - 64,
      y: node.position.y,
    };
  };

  const startPos = getConnectionStartPos();

  // Execution history data
  const executionHistory = [
    { time: '00:00', executions: 12 },
    { time: '04:00', executions: 8 },
    { time: '08:00', executions: 25 },
    { time: '12:00', executions: 32 },
    { time: '16:00', executions: 28 },
    { time: '20:00', executions: 18 },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center">
            <GitBranch className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-100">Workflow Builder</h1>
            <p className="text-sm text-slate-400">Design multi-agent orchestration patterns</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            className="px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-slate-200"
            value={selectedWorkflowId || ''}
            onChange={(e) => setSelectedWorkflowId(e.target.value || null)}
          >
            <option value="">Select Workflow</option>
            {workflows.map(wf => (
              <option key={wf.id} value={wf.id}>{wf.name}</option>
            ))}
          </select>

          <Button
            onClick={() => setShowNewModal(true)}
            variant="outline"
            className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
          >
            <Plus className="w-4 h-4 mr-2" />
            New
          </Button>

          {selectedWorkflow && (
            <>
              <Button
                onClick={handleExport}
                variant="outline"
                className="border-slate-600 text-slate-300"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              
              <Button
                variant="outline"
                className="border-slate-600 text-slate-300"
                onClick={() => document.getElementById('workflow-import')?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
              <input
                id="workflow-import"
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />

              <Button
                onClick={() => selectedWorkflowId && executeWorkflow(selectedWorkflowId)}
                variant="outline"
                className="border-green-500/30 text-green-400 hover:bg-green-500/10"
              >
                <Play className="w-4 h-4 mr-2" />
                Run
              </Button>
              
              <Button
                onClick={() => selectedWorkflowId && deleteWorkflow(selectedWorkflowId)}
                variant="outline"
                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar - Node palette */}
        <div className="w-64 border-r border-slate-800/50 bg-slate-900/30 flex flex-col">
          <div className="p-4 border-b border-slate-800/50">
            <h3 className="text-sm font-medium text-slate-300">Node Palette</h3>
            <p className="text-xs text-slate-500 mt-1">Click to add nodes</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {nodeTypes.map((nodeType) => {
              const Icon = nodeType.icon;
              return (
                <button
                  key={nodeType.type}
                  onClick={() => handleAddNode(nodeType.type)}
                  disabled={!canEditWorkflow}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg border transition-all",
                    canEditWorkflow
                      ? "border-slate-700/50 bg-slate-800/30 hover:bg-slate-700/50 cursor-pointer"
                      : "border-slate-800/30 bg-slate-800/10 opacity-50 cursor-not-allowed"
                  )}
                >
                  <div 
                    className="w-8 h-8 rounded flex items-center justify-center"
                    style={{ background: `${nodeType.color}20` }}
                  >
                    <Icon className="w-4 h-4" style={{ color: nodeType.color }} />
                  </div>
                  <div className="text-left">
                    <span className="text-sm text-slate-200 block">{nodeType.label}</span>
                    <span className="text-[10px] text-slate-500">{nodeType.description}</span>
                  </div>
                </button>
              );
            })}
          </div>
          
          {/* Connection mode indicator */}
          {isConnecting && (
            <div className="p-4 border-t border-slate-800/50 bg-cyan-500/10">
              <div className="flex items-center gap-2 text-cyan-400">
                <MousePointer2 className="w-4 h-4" />
                <span className="text-sm">Click target port to connect</span>
              </div>
              <button
                onClick={() => {
                  setIsConnecting(false);
                  setConnectionStart(null);
                }}
                className="mt-2 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Center - Canvas */}
        <div 
          ref={canvasRef}
          className="flex-1 relative bg-slate-950 overflow-hidden cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseUp={handleDragEnd}
          onClick={handleCanvasClick}
        >
          <div className="absolute inset-0 tron-grid opacity-30" />
          
          <div ref={canvasScrollRef} className="absolute inset-0 overflow-auto">
            {selectedWorkflow ? (
              <div className="relative min-w-[1000px] min-h-[800px]">
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  {/* Render edges */}
                  {selectedWorkflow.edges.map(edge => (
                    <ConnectionLine
                      key={edge.id}
                      edge={edge}
                      nodes={selectedWorkflow.nodes}
                      isSelected={selectedEdgeId === edge.id}
                      onClick={() => {
                        setSelectedEdgeId(edge.id);
                        setSelectedNodeId(null);
                      }}
                    />
                  ))}
                  
                  {/* Render temporary connection line */}
                  {isConnecting && startPos && (
                    <TempConnectionLine start={startPos} end={mousePos} />
                  )}
                </svg>

                {/* Render nodes */}
                {selectedWorkflow.nodes.map(node => (
                  <WorkflowNodeComponent
                    key={node.id}
                    node={node}
                    isSelected={selectedNodeId === node.id}
                    onSelect={() => {
                      setSelectedNodeId(node.id);
                      setSelectedEdgeId(null);
                    }}
                    onDragStart={handleDragStart}
                    onPortMouseDown={handlePortMouseDown}
                    onPortMouseUp={handlePortMouseUp}
                  />
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <GitBranch className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                  <p className="text-slate-500">Select or create a workflow to begin</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Canvas controls */}
          {selectedWorkflow && (
            <div className="absolute bottom-4 left-4 flex items-center gap-2">
              <div className="px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-700 text-xs text-slate-400">
                {selectedWorkflow.nodes.length} nodes • {selectedWorkflow.edges.length} connections
              </div>
              {selectedNodeId && (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-500/30 text-red-400"
                  onClick={handleDeleteNode}
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Delete Node
                </Button>
              )}
              {selectedEdgeId && (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-500/30 text-red-400"
                  onClick={handleDeleteEdge}
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Delete Connection
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Right sidebar - Properties */}
        {selectedWorkflow && (
          <div className="w-80 border-l border-slate-800/50 bg-slate-900/30 flex flex-col">
            {/* Workflow info */}
            <div className="p-4 border-b border-slate-800/50">
              <h3 className="text-sm font-medium text-slate-300">{selectedWorkflow.name}</h3>
              <p className="text-xs text-slate-500 mt-1 capitalize">{selectedWorkflow.pattern} pattern</p>
            </div>

            {/* Selected node properties */}
            {selectedNode && (
              <div className="p-4 border-b border-slate-800/50">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-medium text-slate-400">Node Properties</h4>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={() => setShowNodeConfig(true)}
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Type:</span>
                    <span className="text-slate-300 capitalize">{selectedNode.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Position:</span>
                    <span className="text-slate-300">{Math.round(selectedNode.position.x)}, {Math.round(selectedNode.position.y)}</span>
                  </div>
                  {(selectedNode.config?.agentId as string) && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Agent:</span>
                      <span className="text-slate-300">{(selectedNode.config?.agentName as string) || (selectedNode.config?.agentId as string)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Execution History */}
            <div className="p-4 border-b border-slate-800/50">
              <h4 className="text-xs font-medium text-slate-400 mb-3">Execution History</h4>
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={executionHistory}>
                    <defs>
                      <linearGradient id="execGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#00f0ff" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="#475569" />
                    <RechartsTooltip 
                      contentStyle={{ background: '#0f172a', border: '1px solid #1e293b' }}
                    />
                    <Area type="monotone" dataKey="executions" stroke="#00f0ff" fill="url(#execGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent executions */}
            <div className="flex-1 overflow-auto p-4">
              <h4 className="text-xs font-medium text-slate-400 mb-3">Recent Runs</h4>
              <div className="space-y-2">
                {executions.filter(e => e.workflowId === selectedWorkflowId).slice(0, 5).map(execution => (
                  <div key={execution.id} className="p-2 rounded bg-slate-800/50 text-xs">
                    <div className="flex items-center justify-between">
                      <span className={cn(
                        "capitalize",
                        execution.status === 'completed' ? 'text-green-400' :
                        execution.status === 'running' ? 'text-cyan-400' :
                        execution.status === 'failed' ? 'text-red-400' :
                        'text-slate-400'
                      )}>
                        {execution.status}
                      </span>
                      <span className="text-slate-500">
                        {new Date(execution.startedAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
                {executions.filter(e => e.workflowId === selectedWorkflowId).length === 0 && (
                  <p className="text-xs text-slate-500">No executions yet</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* New Workflow Modal */}
      <Dialog open={showNewModal} onOpenChange={setShowNewModal}>
        <DialogContent className="bg-slate-950 border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-white">Create New Workflow</DialogTitle>
            <DialogDescription className="text-slate-400">
              Design a multi-agent orchestration pattern
            </DialogDescription>
          </DialogHeader>
          <Input
            value={newWorkflowName}
            onChange={(e) => setNewWorkflowName(e.target.value)}
            placeholder="Workflow name..."
            className="bg-slate-900 border-slate-700 text-white"
            onKeyDown={(e) => e.key === 'Enter' && handleCreateWorkflow()}
          />
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowNewModal(false)}
              className="border-slate-700 text-slate-300"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateWorkflow}
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
              disabled={!newWorkflowName.trim()}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Node Configuration Modal */}
      <Dialog open={showNodeConfig} onOpenChange={setShowNodeConfig}>
        <DialogContent className="bg-slate-950 border-slate-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Configure Node</DialogTitle>
            <DialogDescription className="text-slate-400">
              Set agent and behavior for this node
            </DialogDescription>
          </DialogHeader>
          
          {selectedNode && (selectedNode.type === 'agent' || selectedNode.type === 'supervisor') && (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Assign Agent</label>
                <Select
                  value={(selectedNode.config?.agentId as string) || ''}
                  onValueChange={(value) => {
                    if (selectedWorkflow) {
                      updateWorkflow(selectedWorkflow.id, {
                        nodes: selectedWorkflow.nodes.map(n =>
                          n.id === selectedNodeId 
                            ? { ...n, config: { ...n.config, agentId: value, agentName: value } }
                            : n
                        ),
                      });
                    }
                  }}
                >
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                    <SelectValue placeholder="Select an agent" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    <SelectItem value="agent-1">🦞 Claw Commander</SelectItem>
                    <SelectItem value="agent-2">📊 Data Analyst</SelectItem>
                    <SelectItem value="agent-3">💻 Code Assistant</SelectItem>
                    <SelectItem value="agent-4">🎨 Creative Bot</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Timeout (seconds)</label>
                <Input
                  type="number"
                  defaultValue={300}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-sm text-slate-400">Retry on failure</label>
                <Switch defaultChecked />
              </div>
            </div>
          )}
          
          {selectedNode && selectedNode.type === 'decision' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Condition</label>
                <Input
                  placeholder="e.g., result.success === true"
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowNodeConfig(false)}
              className="border-slate-700 text-slate-300"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
