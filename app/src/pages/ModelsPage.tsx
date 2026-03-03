import { useEffect, useMemo, useState } from 'react';
import { Brain, Server, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { fetchAgents, fetchModelConfig, fetchSessions } from '@/lib/openclaw-api';
import { flattenModelConfig, toModelUsage } from '@/lib/openclaw-mappers';

export function ModelsPage() {
  const [providers, setProviders] = useState<ReturnType<typeof flattenModelConfig>>([]);
  const [usage, setUsage] = useState<ReturnType<typeof toModelUsage>>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const [configRes, agentsRes, sessionsRes] = await Promise.all([
        fetchModelConfig(),
        fetchAgents(),
        fetchSessions(),
      ]);

      if (!configRes.ok) {
        setError(configRes.error);
        setProviders([]);
        return;
      }

      setProviders(flattenModelConfig(configRes.data));
      setError(null);

      if (agentsRes.ok && sessionsRes.ok) {
        setUsage(toModelUsage(agentsRes.data, sessionsRes.data));
      } else {
        setUsage([]);
      }
    })();
  }, []);

  const configuredProviders = providers.filter((p) => p.isConfigured).length;
  const totalRequests = useMemo(() => usage.reduce((sum, item) => sum + item.requests, 0), [usage]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center">
            <Brain className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white"><span className="text-cyan-400">Model</span> Manager</h1>
            <p className="text-xs text-slate-400">Live provider defaults and agent usage</p>
          </div>
        </div>
        <Button variant="outline" className="border-slate-700 text-slate-300" onClick={() => window.location.reload()}>Refresh</Button>
      </div>

      <div className="grid grid-cols-3 gap-3 p-6">
        <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/30">Providers: <span className="text-cyan-300">{configuredProviders}/{providers.length}</span></div>
        <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/30">Active models: <span className="text-cyan-300">{providers.reduce((sum, p) => sum + p.models.length, 0)}</span></div>
        <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/30">Requests: <span className="text-cyan-300">{totalRequests}</span></div>
      </div>

      {error && <p className="px-6 text-sm text-red-400">{error}</p>}

      <div className="px-6 pb-6 grid grid-cols-1 xl:grid-cols-2 gap-4 overflow-auto">
        <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2"><Server className="w-4 h-4 text-cyan-400" /> Providers</h3>
          <div className="space-y-3">
            {providers.map((provider) => (
              <div key={provider.id} className="p-3 rounded-lg border border-slate-800 bg-slate-950/30">
                <div className="flex justify-between">
                  <p className="text-white">{provider.name}</p>
                  <Badge variant="outline" className={provider.isEnabled ? 'border-emerald-500/30 text-emerald-400' : 'border-slate-700 text-slate-400'}>{provider.isEnabled ? 'enabled' : 'disabled'}</Badge>
                </div>
                <p className="text-xs text-slate-500 mt-1">Default: {provider.defaultModel || 'n/a'}</p>
                <p className="text-xs text-slate-500">Models: {provider.models.join(', ') || 'none'}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-cyan-400" /> Agent model usage</h3>
          <div className="space-y-3">
            {usage.map((item) => (
              <div key={item.agentId} className="p-3 rounded-lg border border-slate-800 bg-slate-950/30 flex justify-between items-center">
                <div>
                  <p className="text-white">{item.agentEmoji} {item.agentName}</p>
                  <p className="text-xs text-slate-500">{item.modelName}</p>
                </div>
                <div className="text-right text-xs text-slate-400">
                  <p>{item.tokensUsed.toLocaleString()} tokens</p>
                  <p>{item.requests} requests</p>
                </div>
              </div>
            ))}
            {!usage.length && <p className="text-slate-500 text-sm">No live usage data available.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModelsPage;
