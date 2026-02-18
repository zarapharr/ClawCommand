import type { SystemMetrics } from '@/types';
import { cn } from '@/lib/utils';
import { Cpu, HardDrive, Wifi, Thermometer } from 'lucide-react';

interface SystemGaugesProps {
  metrics: SystemMetrics;
}

interface GaugeProps {
  value: number;
  max: number;
  label: string;
  sublabel?: string;
  icon: typeof Cpu;
  color: string;
}

function CircularGauge({ value, max, label, sublabel, icon: Icon, color }: GaugeProps) {
  const percentage = Math.min((value / max) * 100, 100);
  const circumference = 2 * Math.PI * 28;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-16 h-16">
        <svg className="w-full h-full -rotate-90">
          <circle cx="50%" cy="50%" r="28" fill="none" stroke="currentColor" strokeWidth="4" className="text-slate-800" />
          <circle
            cx="50%" cy="50%" r="28"
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-500 ease-out"
            style={{ filter: `drop-shadow(0 0 4px ${color})` }}
          />
        </svg>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Icon className="w-4 h-4 mb-0.5" style={{ color }} />
          <span className="text-xs font-semibold text-white">{Math.round(percentage)}%</span>
        </div>
      </div>
      
      <span className="mt-2 text-xs font-medium text-slate-300">{label}</span>
      {sublabel && <span className="text-[10px] text-slate-500">{sublabel}</span>}
    </div>
  );
}

function LinearGauge({ value, max, label, icon: Icon, color }: GaugeProps) {
  const percentage = Math.min((value / max) * 100, 100);
  
  const formatBytes = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(1)} GB`;
  };

  return (
    <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800/50">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" style={{ color }} />
        <span className="text-xs font-medium text-slate-300">{label}</span>
      </div>
      
      <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%`, backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
        />
      </div>
      
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-slate-500">{formatBytes(value)} used</span>
        <span className="text-[10px] text-slate-500">{formatBytes(max)} total</span>
      </div>
    </div>
  );
}

export function SystemGauges({ metrics }: SystemGaugesProps) {
  const getCpuColor = (usage: number) => usage > 80 ? '#ef4444' : usage > 60 ? '#f97316' : '#00f0ff';
  const getTempColor = (temp: number) => temp > 70 ? '#ef4444' : temp > 55 ? '#f97316' : '#10b981';

  return (
    <div className="holo-card p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Wifi className={cn('w-4 h-4', metrics.gateway.status === 'online' ? 'text-emerald-400' : 'text-red-400')} />
          <h3 className="text-sm font-semibold text-white">System Status</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={cn('w-2 h-2 rounded-full', metrics.gateway.status === 'online' ? 'bg-emerald-500' : 'bg-red-500')} />
          <span className={cn('text-xs', metrics.gateway.status === 'online' ? 'text-emerald-400' : 'text-red-400')}>
            {metrics.gateway.status === 'online' ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <CircularGauge value={metrics.cpu.usage} max={100} label="CPU" icon={Cpu} color={getCpuColor(metrics.cpu.usage)} />
        <CircularGauge 
          value={metrics.cpu.temperature || 0} 
          max={100} 
          label="Temp" 
          sublabel={metrics.cpu.temperature ? `${metrics.cpu.temperature.toFixed(1)}°C` : 'N/A'}
          icon={Thermometer}
          color={getTempColor(metrics.cpu.temperature || 0)}
        />
      </div>

      <LinearGauge value={metrics.memory.used} max={metrics.memory.total} label="Memory" icon={HardDrive} color="#a855f7" />

      <div className="mt-4 pt-4 border-t border-slate-800/50">
        <span className="text-xs text-slate-400 block mb-2">Connected Channels</span>
        <div className="flex flex-wrap gap-2">
          {metrics.gateway.connectedChannels.map((channel) => (
            <span key={channel} className="px-2 py-1 rounded-full text-[10px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              {channel}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
