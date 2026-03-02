import type { RuntimeFeed } from '@/lib/runtime-adapters';

export function HealthConnectionPanel({
  feed,
  diagnosticsFeed,
  title,
}: {
  feed: RuntimeFeed<unknown>;
  diagnosticsFeed: RuntimeFeed<{ adapterHealth: 'ok' | 'degraded' | 'offline'; lastSyncAt: string }>;
  title: string;
}) {
  return (
    <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/30">
      <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">{title}</p>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="text-slate-400">Adapter</div>
        <div className="text-white">{diagnosticsFeed.data.adapterHealth}</div>
        <div className="text-slate-400">Connection</div>
        <div className="text-white">{feed.source === 'live' ? 'connected' : 'degraded'}</div>
        <div className="text-slate-400">Last Sync</div>
        <div className="text-white">{feed.lastSyncAt ? new Date(feed.lastSyncAt).toLocaleTimeString() : 'unknown'}</div>
        <div className="text-slate-400">Freshness</div>
        <div className="text-white">{feed.freshnessMs ? `${Math.round(feed.freshnessMs / 1000)}s` : 'unknown'}</div>
      </div>
      {feed.note && <p className="text-xs text-amber-300 mt-2">{feed.note}</p>}
    </div>
  );
}
