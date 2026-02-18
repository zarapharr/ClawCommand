import { useState } from 'react';
import { 
  Radio, MessageCircle, Send, Mail, Smartphone, Bot, 
  CheckCircle2, AlertCircle, RefreshCw, QrCode,
  Copy, ChevronDown, ChevronUp, Play, Square,
  Settings, Plus, Wifi, WifiOff, ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
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

// Types
interface ChannelConfig {
  id: string;
  type: 'whatsapp' | 'telegram' | 'discord' | 'email' | 'slack' | 'webhook';
  name: string;
  status: 'connected' | 'disconnected' | 'error' | 'connecting';
  isEnabled: boolean;
  config: Record<string, string>;
  lastActivity?: string;
  messageCount: number;
  errorMessage?: string;
}

// Mock data
const mockChannels: ChannelConfig[] = [
  {
    id: 'whatsapp-1',
    type: 'whatsapp',
    name: 'WhatsApp Business',
    status: 'connected',
    isEnabled: true,
    config: { phoneNumber: '+1234567890', sessionName: 'OpenClaw Bot' },
    lastActivity: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    messageCount: 1247,
  },
  {
    id: 'telegram-1',
    type: 'telegram',
    name: 'Telegram Bot',
    status: 'connected',
    isEnabled: true,
    config: { botToken: '***hidden***', botUsername: '@OpenClawBot' },
    lastActivity: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    messageCount: 892,
  },
  {
    id: 'discord-1',
    type: 'discord',
    name: 'Discord Server Bot',
    status: 'error',
    isEnabled: true,
    config: { botToken: '***hidden***', serverId: '123456789' },
    lastActivity: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    messageCount: 456,
    errorMessage: 'Invalid bot token - please reconfigure',
  },
  {
    id: 'email-1',
    type: 'email',
    name: 'SMTP Email',
    status: 'disconnected',
    isEnabled: false,
    config: { smtpHost: '', smtpPort: '587', username: '' },
    messageCount: 0,
  },
  {
    id: 'slack-1',
    type: 'slack',
    name: 'Slack Workspace',
    status: 'disconnected',
    isEnabled: false,
    config: { webhookUrl: '', channel: '#general' },
    messageCount: 0,
  },
];

const channelTypes = [
  { type: 'whatsapp', name: 'WhatsApp', icon: Smartphone, color: 'text-green-400', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/30' },
  { type: 'telegram', name: 'Telegram', icon: Send, color: 'text-blue-400', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/30' },
  { type: 'discord', name: 'Discord', icon: MessageCircle, color: 'text-indigo-400', bgColor: 'bg-indigo-500/10', borderColor: 'border-indigo-500/30' },
  { type: 'email', name: 'Email SMTP', icon: Mail, color: 'text-orange-400', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500/30' },
  { type: 'slack', name: 'Slack', icon: Bot, color: 'text-purple-400', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/30' },
  { type: 'webhook', name: 'Webhook', icon: ExternalLink, color: 'text-cyan-400', bgColor: 'bg-cyan-500/10', borderColor: 'border-cyan-500/30' },
];

const statusConfig = {
  connected: { icon: CheckCircle2, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', label: 'Connected' },
  disconnected: { icon: WifiOff, color: 'text-slate-400', bgColor: 'bg-slate-500/10', label: 'Disconnected' },
  error: { icon: AlertCircle, color: 'text-red-400', bgColor: 'bg-red-500/10', label: 'Error' },
  connecting: { icon: RefreshCw, color: 'text-amber-400', bgColor: 'bg-amber-500/10', label: 'Connecting' },
};

export function ChannelsPage() {
  const [channels, setChannels] = useState<ChannelConfig[]>(mockChannels);
  const [selectedChannel, setSelectedChannel] = useState<ChannelConfig | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isQRDialogOpen, setIsQRDialogOpen] = useState(false);
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [testMessage, setTestMessage] = useState('');
  const [testRecipient, setTestRecipient] = useState('');
  const [expandedChannel, setExpandedChannel] = useState<string | null>(null);
  const [qrCode, setQRCode] = useState<string>('');
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);

  // Simulate QR code generation for WhatsApp
  const generateQRCode = (_channelId: string) => {
    setIsGeneratingQR(true);
    setTimeout(() => {
      setQRCode(`https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=whatsapp://pair?token=${Date.now()}`);
      setIsGeneratingQR(false);
    }, 1500);
  };

  const handleToggleChannel = (channelId: string) => {
    setChannels(prev => prev.map(ch => {
      if (ch.id === channelId) {
        const newEnabled = !ch.isEnabled;
        return {
          ...ch,
          isEnabled: newEnabled,
          status: newEnabled ? 'connecting' : 'disconnected',
        };
      }
      return ch;
    }));

    // Simulate connection
    setTimeout(() => {
      setChannels(prev => prev.map(ch => {
        if (ch.id === channelId && ch.isEnabled) {
          return { ...ch, status: 'connected', lastActivity: new Date().toISOString() };
        }
        return ch;
      }));
    }, 2000);
  };

  const handleConnect = (channel: ChannelConfig) => {
    if (channel.type === 'whatsapp' && channel.status === 'disconnected') {
      setSelectedChannel(channel);
      generateQRCode(channel.id);
      setIsQRDialogOpen(true);
    } else {
      setChannels(prev => prev.map(ch => 
        ch.id === channel.id ? { ...ch, status: 'connecting' } : ch
      ));
      setTimeout(() => {
        setChannels(prev => prev.map(ch => 
          ch.id === channel.id ? { ...ch, status: 'connected', lastActivity: new Date().toISOString() } : ch
        ));
      }, 2000);
    }
  };

  const handleDisconnect = (channelId: string) => {
    setChannels(prev => prev.map(ch => 
      ch.id === channelId ? { ...ch, status: 'disconnected', lastActivity: undefined } : ch
    ));
  };

  const handleConfigure = (channel: ChannelConfig) => {
    setSelectedChannel(channel);
    setIsConfigOpen(true);
  };

  const handleSaveConfig = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const config: Record<string, string> = {};
    formData.forEach((value, key) => {
      config[key] = value as string;
    });

    if (selectedChannel) {
      setChannels(prev => prev.map(ch => 
        ch.id === selectedChannel.id 
          ? { ...ch, config, status: 'disconnected', errorMessage: undefined }
          : ch
      ));
    }
    setIsConfigOpen(false);
  };

  const handleTestMessage = (channel: ChannelConfig) => {
    setSelectedChannel(channel);
    setTestMessage(`Hello from OpenClaw! This is a test message from ${channel.name}.`);
    setIsTestDialogOpen(true);
  };

  const sendTestMessage = () => {
    // Simulate sending test message
    setTimeout(() => {
      setChannels(prev => prev.map(ch => 
        ch.id === selectedChannel?.id 
          ? { ...ch, messageCount: ch.messageCount + 1, lastActivity: new Date().toISOString() }
          : ch
      ));
      setIsTestDialogOpen(false);
      setTestMessage('');
      setTestRecipient('');
    }, 1000);
  };

  const formatLastActivity = (timestamp?: string) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const totalMessages = channels.reduce((sum, ch) => sum + ch.messageCount, 0);
  const connectedCount = channels.filter(ch => ch.status === 'connected').length;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center">
              <Radio className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">
                <span className="text-cyan-400">Channel</span> Hub
              </h1>
              <p className="text-xs text-slate-400">Manage messaging integrations</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-800/50">
            <Wifi className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-slate-400">Active:</span>
            <span className="text-sm font-semibold text-white">{connectedCount}/{channels.length}</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-800/50">
            <MessageCircle className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-slate-400">Messages:</span>
            <span className="text-sm font-semibold text-white">{totalMessages.toLocaleString()}</span>
          </div>
          <Button 
            className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30"
            onClick={() => {/* Add new channel */}}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Channel
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {channels.map((channel) => {
            const typeConfig = channelTypes.find(t => t.type === channel.type)!;
            const status = statusConfig[channel.status];
            const StatusIcon = status.icon;
            const TypeIcon = typeConfig.icon;
            const isExpanded = expandedChannel === channel.id;

            return (
              <div 
                key={channel.id}
                className={cn(
                  'rounded-xl border backdrop-blur-sm overflow-hidden transition-all duration-300',
                  typeConfig.bgColor,
                  typeConfig.borderColor,
                  channel.isEnabled ? 'opacity-100' : 'opacity-60'
                )}
              >
                {/* Card Header */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center',
                        'bg-slate-950/50 border border-slate-800/50'
                      )}>
                        <TypeIcon className={cn('w-5 h-5', typeConfig.color)} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{channel.name}</h3>
                        <p className="text-xs text-slate-400">{typeConfig.name}</p>
                      </div>
                    </div>
                    <Switch 
                      checked={channel.isEnabled}
                      onCheckedChange={() => handleToggleChannel(channel.id)}
                    />
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2 mb-3">
                    <Badge 
                      variant="outline" 
                      className={cn(
                        status.bgColor,
                        status.color,
                        'border-0'
                      )}
                    >
                      <StatusIcon className={cn(
                        'w-3 h-3 mr-1',
                        channel.status === 'connecting' && 'animate-spin'
                      )} />
                      {status.label}
                    </Badge>
                    {channel.errorMessage && (
                      <span className="text-xs text-red-400 truncate">{channel.errorMessage}</span>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-slate-950/30">
                      <p className="text-xs text-slate-400">Messages</p>
                      <p className="text-lg font-semibold text-white">{channel.messageCount.toLocaleString()}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-950/30">
                      <p className="text-xs text-slate-400">Last Activity</p>
                      <p className="text-sm font-medium text-white">{formatLastActivity(channel.lastActivity)}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {channel.status === 'disconnected' || channel.status === 'error' ? (
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="flex-1 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                        onClick={() => handleConnect(channel)}
                        disabled={!channel.isEnabled}
                      >
                        <Wifi className="w-4 h-4 mr-1" />
                        Connect
                      </Button>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10"
                        onClick={() => handleDisconnect(channel.id)}
                      >
                        <Square className="w-4 h-4 mr-1" />
                        Disconnect
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="border-slate-600 text-slate-300 hover:bg-slate-800"
                      onClick={() => handleConfigure(channel)}
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                      onClick={() => handleTestMessage(channel)}
                      disabled={channel.status !== 'connected'}
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Expand Details */}
                  <button
                    onClick={() => setExpandedChannel(isExpanded ? null : channel.id)}
                    className="w-full flex items-center justify-center gap-1 mt-3 pt-3 border-t border-slate-800/50 text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    {isExpanded ? (
                      <><ChevronUp className="w-4 h-4" /> Less details</>
                    ) : (
                      <><ChevronDown className="w-4 h-4" /> More details</>
                    )}
                  </button>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-800/50 space-y-2">
                      {Object.entries(channel.config).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between text-sm">
                          <span className="text-slate-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                          <span className="text-white font-mono text-xs">{value}</span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Channel ID:</span>
                        <div className="flex items-center gap-1">
                          <span className="text-white font-mono text-xs">{channel.id}</span>
                          <button 
                            onClick={() => navigator.clipboard.writeText(channel.id)}
                            className="text-slate-400 hover:text-cyan-400"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Channel Card */}
        <div 
          className={cn(
            'mt-4 rounded-xl border border-dashed border-slate-700 bg-slate-900/30',
            'flex flex-col items-center justify-center p-8 cursor-pointer',
            'hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all'
          )}
        >
          <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center mb-3">
            <Plus className="w-6 h-6 text-slate-400" />
          </div>
          <h3 className="font-semibold text-white mb-1">Add New Channel</h3>
          <p className="text-sm text-slate-400 text-center">Connect WhatsApp, Telegram, Discord, or other integrations</p>
        </div>
      </div>

      {/* QR Code Dialog for WhatsApp */}
      <Dialog open={isQRDialogOpen} onOpenChange={setIsQRDialogOpen}>
        <DialogContent className="bg-slate-950 border-slate-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <QrCode className="w-5 h-5 text-green-400" />
              Connect WhatsApp
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Scan this QR code with your WhatsApp mobile app to pair
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center py-6">
            {isGeneratingQR ? (
              <div className="w-64 h-64 rounded-xl bg-slate-900 flex items-center justify-center">
                <RefreshCw className="w-8 h-8 text-green-400 animate-spin" />
              </div>
            ) : qrCode ? (
              <div className="relative">
                <img 
                  src={qrCode} 
                  alt="WhatsApp QR Code" 
                  className="w-64 h-64 rounded-xl"
                />
                <div className="absolute inset-0 rounded-xl border-2 border-green-500/50 animate-pulse" />
              </div>
            ) : null}
            
            <div className="mt-6 text-center">
              <p className="text-sm text-slate-400 mb-2">Open WhatsApp → Settings → Linked Devices</p>
              <p className="text-xs text-slate-500">QR code expires in 60 seconds</p>
            </div>

            <Button 
              variant="outline" 
              className="mt-4 border-slate-700 text-slate-300"
              onClick={() => generateQRCode(selectedChannel?.id || '')}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Regenerate QR
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Configuration Dialog */}
      <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <DialogContent className="bg-slate-950 border-slate-800 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-cyan-400" />
              Configure {selectedChannel?.name}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Update connection settings for this channel
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSaveConfig} className="space-y-4">
            {selectedChannel?.type === 'whatsapp' && (
              <>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Phone Number</label>
                  <Input 
                    name="phoneNumber"
                    defaultValue={selectedChannel.config.phoneNumber}
                    placeholder="+1234567890"
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Session Name</label>
                  <Input 
                    name="sessionName"
                    defaultValue={selectedChannel.config.sessionName}
                    placeholder="My WhatsApp Bot"
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </div>
              </>
            )}

            {selectedChannel?.type === 'telegram' && (
              <>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Bot Token</label>
                  <Input 
                    name="botToken"
                    type="password"
                    defaultValue={selectedChannel.config.botToken}
                    placeholder="123456789:ABCdefGHIjklMNOpqrSTUvwxyz"
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                  <p className="text-xs text-slate-500 mt-1">Get this from @BotFather</p>
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Bot Username</label>
                  <Input 
                    name="botUsername"
                    defaultValue={selectedChannel.config.botUsername}
                    placeholder="@MyOpenClawBot"
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </div>
              </>
            )}

            {selectedChannel?.type === 'discord' && (
              <>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Bot Token</label>
                  <Input 
                    name="botToken"
                    type="password"
                    defaultValue={selectedChannel.config.botToken}
                    placeholder="Discord bot token"
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Server ID</label>
                  <Input 
                    name="serverId"
                    defaultValue={selectedChannel.config.serverId}
                    placeholder="1234567890123456789"
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </div>
              </>
            )}

            {selectedChannel?.type === 'email' && (
              <>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">SMTP Host</label>
                  <Input 
                    name="smtpHost"
                    defaultValue={selectedChannel.config.smtpHost}
                    placeholder="smtp.gmail.com"
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-slate-400 mb-1 block">Port</label>
                    <Select name="smtpPort" defaultValue={selectedChannel.config.smtpPort || '587'}>
                      <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-700">
                        <SelectItem value="587">587 (TLS)</SelectItem>
                        <SelectItem value="465">465 (SSL)</SelectItem>
                        <SelectItem value="25">25 (Plain)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 mb-1 block">Username</label>
                    <Input 
                      name="username"
                      defaultValue={selectedChannel.config.username}
                      placeholder="user@example.com"
                      className="bg-slate-900 border-slate-700 text-white"
                    />
                  </div>
                </div>
              </>
            )}

            {selectedChannel?.type === 'slack' && (
              <>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Webhook URL</label>
                  <Input 
                    name="webhookUrl"
                    defaultValue={selectedChannel.config.webhookUrl}
                    placeholder="https://hooks.slack.com/services/..."
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Default Channel</label>
                  <Input 
                    name="channel"
                    defaultValue={selectedChannel.config.channel}
                    placeholder="#general"
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </div>
              </>
            )}

            <DialogFooter className="pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsConfigOpen(false)}
                className="border-slate-700 text-slate-300"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="bg-cyan-500 hover:bg-cyan-600 text-white"
              >
                Save Configuration
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Test Message Dialog */}
      <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
        <DialogContent className="bg-slate-950 border-slate-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Play className="w-5 h-5 text-cyan-400" />
              Send Test Message
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Send a test message through {selectedChannel?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Recipient</label>
              <Input 
                value={testRecipient}
                onChange={(e) => setTestRecipient(e.target.value)}
                placeholder={selectedChannel?.type === 'whatsapp' ? '+1234567890' : selectedChannel?.type === 'email' ? 'user@example.com' : '@username'}
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Message</label>
              <textarea 
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 rounded-md bg-slate-900 border border-slate-700 text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsTestDialogOpen(false)}
              className="border-slate-700 text-slate-300"
            >
              Cancel
            </Button>
            <Button 
              onClick={sendTestMessage}
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
              disabled={!testRecipient || !testMessage}
            >
              <Send className="w-4 h-4 mr-2" />
              Send Test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ChannelsPage;
