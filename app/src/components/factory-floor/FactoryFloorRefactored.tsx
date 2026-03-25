import { useEffect, useState, useCallback } from 'react';
import { Download, RefreshCw, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBand } from './StatusBand';
import { ProjectCard } from './ProjectCard';
import { DetailPanel } from './DetailPanel';
import { AlertSidebar, type Alert } from './AlertSidebar';
import { fetchRuntimeStatus, subscribeRuntimeUpdates } from '@/lib/openclaw-api';

interface Project {
  id: string;
  name: string;
  agentCount: number;
  running: number;
  paused: number;
  idle: number;
  failed: number;
  costMTD: number;
  costTrend?: { direction: 'up' | 'down'; percent: number };
  lastActivity?: string;
  status: 'healthy' | 'warning' | 'critical' | 'idle';
}

interface FactoryFloorRefactoredProps {
  onProjectClick?: (projectId: string) => void;
}

export function FactoryFloorRefactored({ onProjectClick }: FactoryFloorRefactoredProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [detailPanelOpen, setDetailPanelOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusCounts, setStatusCounts] = useState({ running: 0, paused: 0, idle: 0, failed: 0 });
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Load initial data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchRuntimeStatus();
      
      if (!result.ok) {
        setError(result.error);
        return;
      }

      // Transform agents into projects
      const projectMap = new Map<string, Project>();
      result.data.agents.forEach((agent) => {
        const projectId = agent.id.split('-').slice(0, -1).join('-') || agent.id;
        if (!projectMap.has(projectId)) {
          projectMap.set(projectId, {
            id: projectId,
            name: agent.name || projectId,
            agentCount: 0,
            running: 0,
            paused: 0,
            idle: 0,
            failed: 0,
            costMTD: Math.random() * 500, // Mock cost
            costTrend: { direction: Math.random() > 0.5 ? 'up' : 'down', percent: Math.floor(Math.random() * 20) },
            lastActivity: new Date(Date.now() - Math.random() * 3600000).toLocaleTimeString(),
            status: 'healthy',
          });
        }

        const project = projectMap.get(projectId)!;
        project.agentCount += 1;

        // Simulate agent status based on last activity
        const isActive = Math.random() > 0.3;
        if (isActive) {
          project.running += 1;
          project.status = 'healthy';
        } else if (Math.random() > 0.7) {
          project.failed += 1;
          project.status = 'critical';
        } else {
          project.idle += 1;
        }
      });

      const projectsArray = Array.from(projectMap.values());
      setProjects(projectsArray);

      // Calculate status counts
      const counts = { running: 0, paused: 0, idle: 0, failed: 0 };
      projectsArray.forEach(p => {
        counts.running += p.running;
        counts.paused += p.paused;
        counts.idle += p.idle;
        counts.failed += p.failed;
      });
      setStatusCounts(counts);
      setLastUpdate(new Date());

      // Generate mock alerts
      const mockAlerts: Alert[] = [];
      if (counts.failed > 0) {
        mockAlerts.push({
          id: `alert-${Date.now()}`,
          severity: 'critical',
          title: `${counts.failed} agent${counts.failed > 1 ? 's' : ''} failed`,
          description: 'One or more agents have failed. Check logs for details.',
          timestamp: new Date(),
          cost: Math.random() * 50,
        });
      }
      if (counts.running < 5) {
        mockAlerts.push({
          id: `alert-${Date.now()}-2`,
          severity: 'warning',
          title: 'Low activity detected',
          description: `Only ${counts.running} agents running. Expected 8+.`,
          timestamp: new Date(Date.now() - 300000),
        });
      }
      mockAlerts.push({
        id: `alert-${Date.now()}-3`,
        severity: 'info',
        title: 'Factory Floor healthy',
        description: `${projectsArray.length} projects monitored, ${counts.running} agents active.`,
        timestamp: new Date(Date.now() - 600000),
      });
      setAlerts(mockAlerts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Load failed');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load initial data and setup WebSocket
  useEffect(() => {
    loadData();

    // Setup WebSocket for real-time updates
    const unsubscribe = subscribeRuntimeUpdates((update) => {
      if (update.kind === 'agent_status') {
        loadData(); // Reload on status change
      }
    });

    return () => {
      unsubscribe();
    };
  }, [loadData]);

  // Filter projects based on search
  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle project card click
  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
    setDetailPanelOpen(true);
    onProjectClick?.(project.id);
  };

  // Export workspace health
  const handleExport = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      statusCounts,
      projects: projects.map(p => ({
        ...p,
        costMTD: p.costMTD.toFixed(2),
      })),
      alerts: alerts.map(a => ({
        ...a,
        timestamp: a.timestamp.toISOString(),
      })),
    };

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `factory-floor-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-full">
      {/* Main content */}
      <div className="lg:col-span-3 flex flex-col gap-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-3xl font-bold text-slate-100">Factory Floor</h1>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              onClick={loadData}
              disabled={loading}
              size="sm"
              variant="outline"
              className="flex-1 sm:flex-none"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={handleExport}
              disabled={projects.length === 0}
              size="sm"
              variant="outline"
              className="flex-1 sm:flex-none"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Status band */}
        <StatusBand
          running={statusCounts.running}
          paused={statusCounts.paused}
          idle={statusCounts.idle}
          failed={statusCounts.failed}
          updatedAt={lastUpdate || undefined}
        />

        {/* Search and filters */}
        <div className="flex gap-2">
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Button size="sm" variant="outline">
            <Filter className="w-4 h-4" />
          </Button>
        </div>

        {/* Error state */}
        {error && (
          <div className="bg-red-950/50 border border-red-700 rounded-lg p-4">
            <p className="text-sm text-red-200">{error}</p>
          </div>
        )}

        {/* Loading state */}
        {loading && !projects.length && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div
                key={i}
                className="bg-slate-800/50 rounded-lg h-48 animate-pulse"
              />
            ))}
          </div>
        )}

        {/* Projects grid */}
        {!loading && filteredProjects.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map(project => (
              <ProjectCard
                key={project.id}
                {...project}
                onClick={() => handleProjectClick(project)}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && filteredProjects.length === 0 && projects.length > 0 && (
          <div className="text-center py-8">
            <p className="text-slate-400">No projects match your search</p>
          </div>
        )}

        {!loading && projects.length === 0 && (
          <div className="text-center py-8">
            <p className="text-slate-400">No projects found</p>
          </div>
        )}
      </div>

      {/* Alert sidebar */}
      <div className="lg:col-span-1 h-full bg-slate-800/30 rounded-lg border border-slate-700 overflow-hidden">
        <AlertSidebar
          alerts={alerts}
          onDismiss={(id) => setAlerts(alerts.filter(a => a.id !== id))}
          onSnooze={(id) => {
            setAlerts(alerts.map(a => a.id === id ? { ...a, snoozed: true } : a));
          }}
        />
      </div>

      {/* Detail panel */}
      {selectedProject && (
        <DetailPanel
          title={selectedProject.name}
          open={detailPanelOpen}
          onClose={() => setDetailPanelOpen(false)}
          cost={selectedProject.costMTD}
          logs={[
            `Project: ${selectedProject.name}`,
            `Total Agents: ${selectedProject.agentCount}`,
            `Running: ${selectedProject.running}`,
            `Failed: ${selectedProject.failed}`,
            `Last Activity: ${selectedProject.lastActivity}`,
          ]}
          onExport={() => {
            const data = {
              ...selectedProject,
              exportedAt: new Date().toISOString(),
            };
            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${selectedProject.id}-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
          }}
        />
      )}
    </div>
  );
}
