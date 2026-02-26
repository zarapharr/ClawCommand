import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
  Settings, Save, Globe, Shield, Cpu, Radio, Bell,
  Key, Terminal, Compass,
} from 'lucide-react';
import { createRuntimeSessionSnapshot } from '@/lib/environment-session';
import { defaultEnvironmentProfile } from '@/config/environment-profile';

export function SettingsPage() {
  const [settings, setSettings] = useState({
    theme: 'dark',
    language: 'en',
    timezone: 'UTC',
    gatewayPort: 18789,
    canvasPort: 18793,
    corsOrigins: 'http://localhost:28471',
    reloadMode: 'hybrid',
    logLevel: 'info',
    metricsEnabled: true,
    tracingEnabled: false,
    notificationsEnabled: true,
    emailNotifications: false,
    autoBackup: true,
  });

  const runtimeSnapshot = useMemo(() => createRuntimeSessionSnapshot(defaultEnvironmentProfile), []);

  const handleSave = () => {
    alert('Settings saved!');
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-500/20 to-slate-600/20 border border-slate-500/30 flex items-center justify-center">
            <Settings className="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">
              <span className="text-slate-400">Settings</span> Matrix
            </h1>
            <p className="text-xs text-slate-400">Configure your OpenClaw instance</p>
          </div>
        </div>

        <Button onClick={handleSave} className="bg-cyan-500 hover:bg-cyan-600 text-black font-medium">
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>

      <div className="flex-1 overflow-hidden p-6">
        <Tabs defaultValue="general" className="h-full flex flex-col">
          <TabsList className="bg-slate-900/50 border border-slate-800 w-fit flex-wrap h-auto">
            <TabsTrigger value="general" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
              <Globe className="w-4 h-4 mr-2" />
              General
            </TabsTrigger>
            <TabsTrigger value="environment" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
              <Compass className="w-4 h-4 mr-2" />
              Environment
            </TabsTrigger>
            <TabsTrigger value="gateway" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
              <Cpu className="w-4 h-4 mr-2" />
              Gateway
            </TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
              <Shield className="w-4 h-4 mr-2" />
              Security
            </TabsTrigger>
            <TabsTrigger value="channels" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
              <Radio className="w-4 h-4 mr-2" />
              Channels
            </TabsTrigger>
            <TabsTrigger value="notifications" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="advanced" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
              <Terminal className="w-4 h-4 mr-2" />
              Advanced
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-auto mt-6">
            <TabsContent value="general" className="mt-0 h-full">
              <div className="max-w-2xl space-y-6">
                <div className="holo-card p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Appearance</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">Theme</p>
                        <p className="text-xs text-slate-400">Choose your preferred theme</p>
                      </div>
                      <select
                        value={settings.theme}
                        onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                      >
                        <option value="dark">Dark</option>
                        <option value="light">Light</option>
                        <option value="system">System</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">Language</p>
                        <p className="text-xs text-slate-400">Interface language</p>
                      </div>
                      <select
                        value={settings.language}
                        onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                      >
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">Timezone</p>
                        <p className="text-xs text-slate-400">Default timezone for scheduling</p>
                      </div>
                      <select
                        value={settings.timezone}
                        onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                      >
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">Eastern Time</option>
                        <option value="America/Los_Angeles">Pacific Time</option>
                        <option value="Europe/London">London</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="environment" className="mt-0 h-full">
              <div className="max-w-4xl space-y-6">
                <div className="holo-card p-6">
                  <h3 className="text-lg font-semibold text-white mb-2">Environment and Session Detection</h3>
                  <p className="text-xs text-slate-400 mb-4">
                    Config-driven runtime detection with built-in secret redaction.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3">
                      <p className="text-slate-400 text-xs">Detected Environment</p>
                      <p className="text-white font-medium">{runtimeSnapshot.detectedEnvironment}</p>
                    </div>
                    <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3">
                      <p className="text-slate-400 text-xs">Active Channel</p>
                      <p className="text-white font-medium">{runtimeSnapshot.channels.activeChannel}</p>
                    </div>
                    <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3 md:col-span-2">
                      <p className="text-slate-400 text-xs">Workspace Path</p>
                      <p className="text-white font-medium break-all">{runtimeSnapshot.workspacePath}</p>
                      <p className="text-cyan-400 text-xs mt-1">Source: {runtimeSnapshot.workspaceSource}</p>
                    </div>
                  </div>
                </div>

                <div className="holo-card p-6">
                  <h4 className="text-white font-semibold mb-3">Integration Status</h4>
                  <div className="space-y-2">
                    {runtimeSnapshot.integrations.map((integration) => (
                      <div key={integration.id} className="flex items-center justify-between text-sm border border-slate-800 rounded-lg p-3 bg-slate-900/40">
                        <div>
                          <p className="text-white">{integration.label}</p>
                          <p className="text-xs text-slate-400">{integration.source} • {integration.authType}</p>
                        </div>
                        <div className="text-right">
                          <p className={integration.configured ? 'text-emerald-400' : 'text-slate-500'}>
                            {integration.configured ? 'Configured' : 'Not configured'}
                          </p>
                          {integration.redactedPreview && (
                            <p className="text-xs text-slate-400">{integration.redactedPreview}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="holo-card p-6">
                  <h4 className="text-white font-semibold mb-3">Snapshot JSON</h4>
                  <pre className="text-xs bg-slate-950/80 border border-slate-800 rounded-lg p-4 overflow-auto text-slate-300 max-h-96">
                    {JSON.stringify(runtimeSnapshot, null, 2)}
                  </pre>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="gateway" className="mt-0 h-full">
              <div className="max-w-2xl space-y-6">
                <div className="holo-card p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Gateway Configuration</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">Gateway Port</label>
                      <Input
                        type="number"
                        value={settings.gatewayPort}
                        onChange={(e) => setSettings({ ...settings, gatewayPort: parseInt(e.target.value) })}
                        className="bg-slate-900/50 border-slate-700 text-white"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">Canvas Port</label>
                      <Input
                        type="number"
                        value={settings.canvasPort}
                        onChange={(e) => setSettings({ ...settings, canvasPort: parseInt(e.target.value) })}
                        className="bg-slate-900/50 border-slate-700 text-white"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">CORS Origins</label>
                      <Input
                        value={settings.corsOrigins}
                        onChange={(e) => setSettings({ ...settings, corsOrigins: e.target.value })}
                        className="bg-slate-900/50 border-slate-700 text-white"
                        placeholder="http://localhost:28471, http://localhost:5173"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">Reload Mode</label>
                      <select
                        value={settings.reloadMode}
                        onChange={(e) => setSettings({ ...settings, reloadMode: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                      >
                        <option value="auto">Auto</option>
                        <option value="manual">Manual</option>
                        <option value="hybrid">Hybrid</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="security" className="mt-0 h-full">
              <div className="max-w-2xl space-y-6">
                <div className="holo-card p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Authentication</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">Require Authentication</p>
                        <p className="text-xs text-slate-400">Require login to access dashboard</p>
                      </div>
                      <Switch checked={true} className="data-[state=checked]:bg-cyan-500" />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">Two-Factor Authentication</p>
                        <p className="text-xs text-slate-400">Enable 2FA for additional security</p>
                      </div>
                      <Switch className="data-[state=checked]:bg-cyan-500" />
                    </div>
                  </div>
                </div>

                <div className="holo-card p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">API Keys</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">Anthropic API Key</label>
                      <div className="flex gap-2">
                        <Input
                          type="password"
                          value="sk-ant-..."
                          className="bg-slate-900/50 border-slate-700 text-white flex-1"
                          readOnly
                        />
                        <Button variant="outline" className="border-slate-700">
                          <Key className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">OpenAI API Key</label>
                      <div className="flex gap-2">
                        <Input
                          type="password"
                          value="sk-..."
                          className="bg-slate-900/50 border-slate-700 text-white flex-1"
                          readOnly
                        />
                        <Button variant="outline" className="border-slate-700">
                          <Key className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="mt-0 h-full">
              <div className="max-w-2xl space-y-6">
                <div className="holo-card p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Advanced Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">Log Level</label>
                      <select
                        value={settings.logLevel}
                        onChange={(e) => setSettings({ ...settings, logLevel: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                      >
                        <option value="debug">Debug</option>
                        <option value="info">Info</option>
                        <option value="warn">Warn</option>
                        <option value="error">Error</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">Enable Metrics</p>
                        <p className="text-xs text-slate-400">Collect performance metrics</p>
                      </div>
                      <Switch
                        checked={settings.metricsEnabled}
                        onCheckedChange={(v) => setSettings({ ...settings, metricsEnabled: v })}
                        className="data-[state=checked]:bg-cyan-500"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">Enable Tracing</p>
                        <p className="text-xs text-slate-400">Enable distributed tracing</p>
                      </div>
                      <Switch
                        checked={settings.tracingEnabled}
                        onCheckedChange={(v) => setSettings({ ...settings, tracingEnabled: v })}
                        className="data-[state=checked]:bg-cyan-500"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">Auto Backup</p>
                        <p className="text-xs text-slate-400">Automatically backup configuration</p>
                      </div>
                      <Switch
                        checked={settings.autoBackup}
                        onCheckedChange={(v) => setSettings({ ...settings, autoBackup: v })}
                        className="data-[state=checked]:bg-cyan-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
