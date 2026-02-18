import type { Agent, AgentConnection } from '@/types';
import { useMemo } from 'react';

interface ConnectionLinesProps {
  agents: Agent[];
  connections: AgentConnection[];
  selectedAgentId?: string | null;
}

export function ConnectionLines({ agents, connections, selectedAgentId }: ConnectionLinesProps) {
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
          <g key={`${connection.from}-${connection.to}`}>
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
    </svg>
  );
}
