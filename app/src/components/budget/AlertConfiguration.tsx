import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Bell, Mail, Slack, Webhook, Plus, X } from 'lucide-react';

export interface AlertConfig {
  thresholds: {
    warning: number;    // 70%
    critical: number;   // 90%
    exceeded: number;   // 100%
  };
  spikeDetection: {
    enabled: boolean;
    stdDevThreshold: number; // 1.5
  };
  channels: AlertChannel[];
}

export interface AlertChannel {
  id: string;
  type: 'email' | 'slack' | 'webhook' | 'in-app';
  enabled: boolean;
  config: Record<string, string>;
}

interface AlertConfigurationProps {
  config: AlertConfig;
  onConfigChange: (config: AlertConfig) => void;
  onTest?: (channel: AlertChannel) => Promise<void>;
}

export function AlertConfiguration({
  config,
  onConfigChange,
  onTest,
}: AlertConfigurationProps) {
  const [editingChannelId, setEditingChannelId] = useState<string | null>(null);
  const [newChannelType, setNewChannelType] = useState<AlertChannel['type']>('email');
  const [testingChannelId, setTestingChannelId] = useState<string | null>(null);

  const updateThreshold = (type: keyof AlertConfig['thresholds'], value: number) => {
    onConfigChange({
      ...config,
      thresholds: {
        ...config.thresholds,
        [type]: value,
      },
    });
  };

  const toggleSpikeDetection = () => {
    onConfigChange({
      ...config,
      spikeDetection: {
        ...config.spikeDetection,
        enabled: !config.spikeDetection.enabled,
      },
    });
  };

  const updateSpikeThreshold = (value: number) => {
    onConfigChange({
      ...config,
      spikeDetection: {
        ...config.spikeDetection,
        stdDevThreshold: value,
      },
    });
  };

  const addChannel = () => {
    const newChannel: AlertChannel = {
      id: `channel-${Date.now()}`,
      type: newChannelType,
      enabled: true,
      config: {
        email: { recipient: '' },
        slack: { webhookUrl: '' },
        webhook: { url: '' },
        'in-app': {},
      }[newChannelType] || {},
    };
    onConfigChange({
      ...config,
      channels: [...config.channels, newChannel],
    });
    setNewChannelType('email');
  };

  const removeChannel = (id: string) => {
    onConfigChange({
      ...config,
      channels: config.channels.filter(c => c.id !== id),
    });
  };

  const toggleChannel = (id: string) => {
    onConfigChange({
      ...config,
      channels: config.channels.map(c =>
        c.id === id ? { ...c, enabled: !c.enabled } : c
      ),
    });
  };

  const updateChannelConfig = (id: string, configKey: string, value: string) => {
    onConfigChange({
      ...config,
      channels: config.channels.map(c =>
        c.id === id
          ? { ...c, config: { ...c.config, [configKey]: value } }
          : c
      ),
    });
  };

  const getChannelIcon = (type: AlertChannel['type']) => {
    switch (type) {
      case 'email':
        return <Mail className="w-4 h-4" />;
      case 'slack':
        return <Slack className="w-4 h-4" />;
      case 'webhook':
        return <Webhook className="w-4 h-4" />;
      case 'in-app':
        return <Bell className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Budget Thresholds */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-white">Budget Alert Thresholds</h3>

        {/* Warning Threshold (70%) */}
        <div className="space-y-2 p-4 rounded-lg bg-slate-900/50 border border-slate-800">
          <div className="flex items-center justify-between">
            <label className="text-sm text-slate-300">Warning Threshold</label>
            <span className="text-sm font-medium text-yellow-400">
              {config.thresholds.warning}%
            </span>
          </div>
          <Slider
            value={[config.thresholds.warning]}
            onValueChange={([val]) => updateThreshold('warning', val)}
            min={30}
            max={config.thresholds.critical - 5}
            step={5}
          />
          <p className="text-xs text-slate-500">
            Alert when budget reaches {config.thresholds.warning}%
          </p>
        </div>

        {/* Critical Threshold (90%) */}
        <div className="space-y-2 p-4 rounded-lg bg-slate-900/50 border border-slate-800">
          <div className="flex items-center justify-between">
            <label className="text-sm text-slate-300">Critical Threshold</label>
            <span className="text-sm font-medium text-orange-400">
              {config.thresholds.critical}%
            </span>
          </div>
          <Slider
            value={[config.thresholds.critical]}
            onValueChange={([val]) => updateThreshold('critical', val)}
            min={config.thresholds.warning + 5}
            max={100}
            step={5}
          />
          <p className="text-xs text-slate-500">
            Escalate to critical when budget reaches {config.thresholds.critical}%
          </p>
        </div>

        {/* Exceeded Threshold (100%) */}
        <div className="space-y-2 p-4 rounded-lg bg-slate-900/50 border border-slate-800">
          <div className="flex items-center justify-between">
            <label className="text-sm text-slate-300">Budget Exceeded</label>
            <span className="text-sm font-medium text-red-400">
              {config.thresholds.exceeded}%
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Auto-pause agents when budget is exceeded (immutable)
          </p>
        </div>
      </div>

      {/* Spike Detection */}
      <div className="space-y-3 p-4 rounded-lg bg-slate-900/50 border border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-white">Cost Spike Detection</h4>
            <p className="text-xs text-slate-500 mt-1">
              Detect unusual spending patterns
            </p>
          </div>
          <Switch
            checked={config.spikeDetection.enabled}
            onCheckedChange={toggleSpikeDetection}
          />
        </div>

        {config.spikeDetection.enabled && (
          <div className="space-y-2 mt-4 pt-4 border-t border-slate-700">
            <div className="flex items-center justify-between">
              <label className="text-sm text-slate-300">Sensitivity (σ std-dev)</label>
              <span className="text-sm font-medium text-purple-400">
                {config.spikeDetection.stdDevThreshold}σ
              </span>
            </div>
            <Slider
              value={[config.spikeDetection.stdDevThreshold]}
              onValueChange={([val]) => updateSpikeThreshold(val)}
              min={1}
              max={3}
              step={0.1}
            />
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <div>
                <p className="font-medium">1.0σ</p>
                <p>Very sensitive</p>
              </div>
              <div>
                <p className="font-medium">1.5σ</p>
                <p>Recommended</p>
              </div>
              <div>
                <p className="font-medium">3.0σ</p>
                <p>Only extreme</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Notification Channels */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-white">Notification Channels</h3>

        {/* Channel List */}
        <div className="space-y-2">
          {config.channels.map(channel => (
            <div
              key={channel.id}
              className={cn(
                'p-4 rounded-lg border flex items-start gap-4',
                channel.enabled
                  ? 'bg-slate-900/50 border-slate-700'
                  : 'bg-slate-900/30 border-slate-800 opacity-50'
              )}
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400">
                  {getChannelIcon(channel.type)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white capitalize">
                    {channel.type === 'in-app' ? 'In-App Alerts' : channel.type}
                  </p>
                  {channel.type === 'email' && (
                    <p className="text-xs text-slate-400">
                      {channel.config.recipient || 'Not configured'}
                    </p>
                  )}
                  {channel.type === 'slack' && (
                    <p className="text-xs text-slate-400">
                      Webhook configured
                    </p>
                  )}
                  {channel.type === 'webhook' && (
                    <p className="text-xs text-slate-400">
                      {channel.config.url?.substring(0, 40) || 'Not configured'}...
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {editingChannelId === channel.id ? (
                  <>
                    {channel.type === 'email' && (
                      <Input
                        type="email"
                        placeholder="email@example.com"
                        value={channel.config.recipient || ''}
                        onChange={(e) =>
                          updateChannelConfig(channel.id, 'recipient', e.target.value)
                        }
                        className="w-48 h-8 bg-slate-800 border-slate-700"
                      />
                    )}
                    {channel.type === 'slack' && (
                      <Input
                        type="text"
                        placeholder="https://hooks.slack.com/..."
                        value={channel.config.webhookUrl || ''}
                        onChange={(e) =>
                          updateChannelConfig(channel.id, 'webhookUrl', e.target.value)
                        }
                        className="w-64 h-8 bg-slate-800 border-slate-700 text-xs"
                      />
                    )}
                    {channel.type === 'webhook' && (
                      <Input
                        type="text"
                        placeholder="https://your-endpoint.com"
                        value={channel.config.url || ''}
                        onChange={(e) =>
                          updateChannelConfig(channel.id, 'url', e.target.value)
                        }
                        className="w-64 h-8 bg-slate-800 border-slate-700 text-xs"
                      />
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingChannelId(null)}
                      className="h-8"
                    >
                      Done
                    </Button>
                  </>
                ) : (
                  <>
                    <Switch
                      checked={channel.enabled}
                      onCheckedChange={() => toggleChannel(channel.id)}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingChannelId(channel.id)}
                      className="text-slate-400 h-8"
                    >
                      Edit
                    </Button>
                    {onTest && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={async () => {
                          setTestingChannelId(channel.id);
                          await onTest(channel);
                          setTestingChannelId(null);
                        }}
                        disabled={testingChannelId === channel.id}
                        className="text-slate-400 h-8"
                      >
                        {testingChannelId === channel.id ? '...' : 'Test'}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeChannel(channel.id)}
                      className="text-red-400 hover:text-red-300 h-8 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add Channel */}
        <div className="flex items-center gap-2 p-4 rounded-lg border border-dashed border-slate-700">
          <Select value={newChannelType} onValueChange={(v: any) => setNewChannelType(v)}>
            <SelectTrigger className="w-40 h-8 bg-slate-900 border-slate-700 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700">
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="slack">Slack</SelectItem>
              <SelectItem value="webhook">Webhook</SelectItem>
              <SelectItem value="in-app">In-App</SelectItem>
            </SelectContent>
          </Select>
          <Button
            size="sm"
            variant="outline"
            onClick={addChannel}
            className="border-slate-700 h-8"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Channel
          </Button>
        </div>
      </div>
    </div>
  );
}
