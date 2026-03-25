import type { Agent, AgentConnection } from '@/types';
import { useMemo } from 'react';
import type { ManualFactoryEdge } from '@/lib/factory-floor-storage';

interface ConnectionLinesProps {
  agents: Agent[];
  connections: AgentConnection[];
  manualEdges?: ManualFactoryEdge[];
  selectedAgentId?: string | null;
}

export function ConnectionLines({ agents, connections, manualEdges = [], selectedAgentId }: ConnectionLinesProps) {
  const agentMap = useMemo(() => {
    const map = new Map<string, Agent>();
    agents.forEach(agent => map.set(agent.id, agent));
    return map;
  }, [agents]);

  const getActivityColor = (activity: string) => {
    switch (activity) {
      case 'high': return '#00f0ff';
      case 'medium': return '#a855f7';
      case 'low': return '#64748b';
      default: return '#334155';
    }
  };

  const getActivityOpacity = (activity: string) => {
    switch (activity) {
      case 'high': return 0.8;
      case 'medium': return 0.6;
      case 'low': return 0.4;
      default: return 0.2;
    }
  };

  const getStrokeWidth = (activity: string) => {
    switch (activity) {
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1.5;
      default: return 1;
    }
  };

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 1 }}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="gradient-cyan" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00f0ff" stopOpacity="0" />
          <stop offset="50%" stopColor="#00f0ff" stopOpacity="1" />
          <stop offset="100%" stopColor="#00f0ff" stopOpacity="0" />
        </linearGradient>

        <linearGradient id="gradient-purple" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#a855f7" stopOpacity="0" />
          <stop offset="50%" stopColor="#a855f7" stopOpacity="1" />
          <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
        </linearGradient>

        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <marker id="manual-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#f472b6" />
        </marker>
      </defs>

      {connections.map((connection) => {
        const fromAgent = agentMap.get(connection.from);
        const toAgent = agentMap.get(connection.to);

        if (!fromAgent || !toAgent) return null;

        const isHighlighted = selectedAgentId &&
          (connection.from === selectedAgentId || connection.to === selectedAgentId);

        const color = getActivityColor(connection.activity);
        const opacity = isHighlighted ? 1 : getActivityOpacity(connection.activity);
        const strokeWidth = isHighlighted ? getStrokeWidth(connection.activity) + 1 : getStrokeWidth(connection.activity);

        const x1 = fromAgent.position.x;
        const y1 = fromAgent.position.y;
        const x2 = toAgent.position.x;
        const y2 = toAgent.position.y;

        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        const controlX = midX + (y2 - y1) * 0.2;
        const controlY = midY - (x2 - x1) * 0.2;

        const pathD = `M ${x1} ${y1} Q ${controlX} ${controlY} ${x2} ${y2}`;

        return (
          <g key={`runtime-${connection.from}-${connection.to}`}>
            <path
              d={pathD}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeOpacity={opacity * 0.3}
              filter={isHighlighted ? 'url(#glow)' : undefined}
              style={{ transition: 'all 0.3s ease' }}
            />

            {connection.activity !== 'none' && (
              <path
                d={pathD}
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeOpacity={opacity}
                strokeDasharray="10 20"
                filter="url(#glow)"
                className="animate-data-flow"
                style={{
                  animationDuration: connection.activity === 'high' ? '1s' : connection.activity === 'medium' ? '2s' : '3s',
                }}
              />
            )}

            {connection.activity === 'high' && (
              <>
                <circle r="3" fill={color} filter="url(#glow)">
                  <animateMotion dur="1.5s" repeatCount="indefinite" path={pathD} />
                </circle>
                <circle r="2" fill={color} opacity="0.5">
                  <animateMotion dur="1.5s" begin="0.5s" repeatCount="indefinite" path={pathD} />
                </circle>
              </>
            )}

            <foreignObject x={midX - 15} y={midY - 10} width="30" height="20">
              {connection.messageCount > 0 && (
                <div
                  className="flex items-center justify-center w-full h-full rounded-full text-[8px] font-bold text-white"
                  style={{
                    backgroundColor: color,
                    opacity: isHighlighted ? 1 : 0.7,
                  }}
                >
                  {connection.messageCount}
                </div>
              )}
            </foreignObject>
          </g>
        );
      })}

      {manualEdges.map((edge, index) => {
        const fromAgent = agentMap.get(edge.from);
        const toAgent = agentMap.get(edge.to);
        if (!fromAgent || !toAgent) return null;

        const isHighlighted = selectedAgentId && (edge.from === selectedAgentId || edge.to === selectedAgentId);
        const x1 = fromAgent.position.x;
        const y1 = fromAgent.position.y;
        const x2 = toAgent.position.x;
        const y2 = toAgent.position.y;
        const controlX = (x1 + x2) / 2;
        const controlY = (y1 + y2) / 2 - 4;
        const pathD = `M ${x1} ${y1} Q ${controlX} ${controlY} ${x2} ${y2}`;

        return (
          <path
            key={`manual-${edge.from}-${edge.to}-${index}`}
            d={pathD}
            fill="none"
            stroke="#f472b6"
            strokeOpacity={isHighlighted ? 1 : 0.85}
            strokeWidth={isHighlighted ? 2.8 : 2}
            strokeDasharray="6 6"
            markerEnd="url(#manual-arrow)"
            filter="url(#glow)"
          />
        );
      })}
    </svg>
  );
}
