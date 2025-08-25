'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Bell,
  Terminal,
  Code,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  Settings,
  Plus,
  Edit,
  Trash2,
  Monitor,
  Webhook
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotificationChannel {
  id: string;
  name: string;
  type: 'ide_popup' | 'system_tray' | 'console_log' | 'webhook';
  enabled: boolean;
  config: {
    endpoint?: string;
    apiKey?: string;
    logLevel?: 'info' | 'warn' | 'error';
    popupDuration?: number;
  };
  events: string[];
  lastUsed?: string;
  status: 'active' | 'error' | 'disabled';
}

interface NotificationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  events: string[];
  channels: string[];
  conditions: {
    backupType?: string[];
    status?: string[];
    minSize?: number;
    maxDuration?: number;
  };
  template: {
    title: string;
    message: string;
  };
  priority: 'low' | 'medium' | 'high' | 'critical';
}

const MOCK_CHANNELS: NotificationChannel[] = [
  {
    id: '1',
    name: 'Default Channel',
    type: 'console_log',
    enabled: false,
    config: {},
    events: [],
    status: 'disabled'
  }
];

const MOCK_RULES: NotificationRule[] = [
  {
    id: '1',
    name: 'Default Rule',
    description: 'Default notification rule',
    enabled: false,
    events: [],
    channels: [],
    conditions: {},
    template: {
      title: 'Notification',
      message: 'Default message'
    },
    priority: 'low'
  }
];

const EVENT_TYPES = [
  'backup_started',
  'backup_complete', 
  'backup_failed',
  'backup_progress',
  'restore_started',
  'restore_complete',
  'restore_failed',
  'storage_warning',
  'trigger_activated'
];

function getChannelIcon(type: NotificationChannel['type']) {
  switch (type) {
    case 'ide_popup': return Monitor;
    case 'system_tray': return Bell;
    case 'console_log': return Terminal;
    case 'webhook': return Webhook;
    default: return Bell;
  }
}

function getChannelColor(type: NotificationChannel['type']) {
  switch (type) {
    case 'ide_popup': return 'bg-blue-500';
    case 'system_tray': return 'bg-green-500';
    case 'console_log': return 'bg-gray-500';
    case 'webhook': return 'bg-purple-500';
    default: return 'bg-gray-500';
  }
}

function getPriorityColor(priority: NotificationRule['priority']) {
  switch (priority) {
    case 'critical': return 'bg-red-500';
    case 'high': return 'bg-orange-500';
    case 'medium': return 'bg-yellow-500';
    case 'low': return 'bg-green-500';
    default: return 'bg-gray-500';
  }
}

interface ChannelCardProps {
  channel: NotificationChannel;
  onEdit: (channel: NotificationChannel) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

function ChannelCard({ channel, onEdit, onToggle, onDelete }: ChannelCardProps) {
  const Icon = getChannelIcon(channel.type);
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={cn('p-2 rounded-lg text-white', getChannelColor(channel.type))}>
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base">{channel.name}</CardTitle>
              <CardDescription className="capitalize">
                {channel.type.replace('_', ' ')} • {channel.events.length} events
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={channel.status === 'active' ? 'default' : 'secondary'}>
              {channel.status}
            </Badge>
            <Switch
              checked={channel.enabled}
              onCheckedChange={() => onToggle(channel.id)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1">
            {channel.events.map((event) => (
              <Badge key={event} variant="outline" className="text-xs">
                {event.replace('_', ' ')}
              </Badge>
            ))}
          </div>
          
          {channel.lastUsed && (
            <p className="text-sm text-muted-foreground">
              Last used: {channel.lastUsed}
            </p>
          )}
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(channel)}
              className="flex items-center space-x-1"
            >
              <Edit className="h-3 w-3" />
              <span>Edit</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(channel.id)}
              className="flex items-center space-x-1 text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-3 w-3" />
              <span>Delete</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface RuleCardProps {
  rule: NotificationRule;
  channels: NotificationChannel[];
  onEdit: (rule: NotificationRule) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

function RuleCard({ rule, channels, onEdit, onToggle, onDelete }: RuleCardProps) {
  const activeChannels = channels.filter(c => rule.channels.includes(c.id));
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={cn('w-3 h-3 rounded-full', getPriorityColor(rule.priority))} />
            <div>
              <CardTitle className="text-base">{rule.name}</CardTitle>
              <CardDescription>{rule.description}</CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={rule.priority === 'critical' ? 'destructive' : 'default'}>
              {rule.priority}
            </Badge>
            <Switch
              checked={rule.enabled}
              onCheckedChange={() => onToggle(rule.id)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium mb-1">Events:</p>
            <div className="flex flex-wrap gap-1">
              {rule.events.map((event) => (
                <Badge key={event} variant="outline" className="text-xs">
                  {event.replace('_', ' ')}
                </Badge>
              ))}
            </div>
          </div>
          
          <div>
            <p className="text-sm font-medium mb-1">Channels:</p>
            <div className="flex flex-wrap gap-1">
              {activeChannels.map((channel) => {
                const Icon = getChannelIcon(channel.type);
                return (
                  <div key={channel.id} className="flex items-center space-x-1 text-xs bg-muted px-2 py-1 rounded">
                    <Icon className="h-3 w-3" />
                    <span>{channel.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(rule)}
              className="flex items-center space-x-1"
            >
              <Edit className="h-3 w-3" />
              <span>Edit</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(rule.id)}
              className="flex items-center space-x-1 text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-3 w-3" />
              <span>Delete</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function BackupNotifications() {
  const [channels, setChannels] = useState<NotificationChannel[]>(MOCK_CHANNELS);
  const [rules, setRules] = useState<NotificationRule[]>(MOCK_RULES);
  const [activeTab, setActiveTab] = useState<'channels' | 'rules'>('channels');
  const [showChannelDialog, setShowChannelDialog] = useState(false);
  const [showRuleDialog, setShowRuleDialog] = useState(false);
  const [editingChannel, setEditingChannel] = useState<NotificationChannel | null>(null);
  const [editingRule, setEditingRule] = useState<NotificationRule | null>(null);
  const { toast } = useToast();

  const handleToggleChannel = (id: string) => {
    setChannels(prev => prev.map(channel => 
      channel.id === id 
        ? { ...channel, enabled: !channel.enabled, status: channel.enabled ? 'disabled' : 'active' }
        : channel
    ));
    
    const channel = channels.find(c => c.id === id);
    toast({
      title: channel?.enabled ? "Channel Disabled" : "Channel Enabled",
      description: `${channel?.name} has been ${channel?.enabled ? 'disabled' : 'enabled'}.`,
    });
  };

  const handleToggleRule = (id: string) => {
    setRules(prev => prev.map(rule => 
      rule.id === id 
        ? { ...rule, enabled: !rule.enabled }
        : rule
    ));
    
    const rule = rules.find(r => r.id === id);
    toast({
      title: rule?.enabled ? "Rule Disabled" : "Rule Enabled",
      description: `${rule?.name} has been ${rule?.enabled ? 'disabled' : 'enabled'}.`,
    });
  };

  const handleEditChannel = (channel: NotificationChannel) => {
    setEditingChannel(channel);
    setShowChannelDialog(true);
  };

  const handleEditRule = (rule: NotificationRule) => {
    setEditingRule(rule);
    setShowRuleDialog(true);
  };

  const handleDeleteChannel = (id: string) => {
    const channel = channels.find(c => c.id === id);
    setChannels(prev => prev.filter(c => c.id !== id));
    toast({
      title: "Channel Deleted",
      description: `${channel?.name} has been removed.`,
    });
  };

  const handleDeleteRule = (id: string) => {
    const rule = rules.find(r => r.id === id);
    setRules(prev => prev.filter(r => r.id !== id));
    toast({
      title: "Rule Deleted",
      description: `${rule?.name} has been removed.`,
    });
  };

  const handleCreateChannel = () => {
    setEditingChannel(null);
    setShowChannelDialog(true);
  };

  const handleCreateRule = () => {
    setEditingRule(null);
    setShowRuleDialog(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Development Notifications</h2>
          <p className="text-muted-foreground">
            Configure IDE and development workflow notifications for backup events
          </p>
        </div>
      </div>

      {/* Development Notice */}
      <div className="p-4 bg-muted rounded-lg">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5 text-amber-500" />
          <div className="text-sm">
            <p className="font-medium">Development Mode</p>
            <p className="text-muted-foreground mt-1">
              These notifications are designed for development environments and IDE integration. They help you stay informed about backup operations during your coding workflow.
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
        <Button
          variant={activeTab === 'channels' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('channels')}
          className="flex items-center space-x-2"
        >
          <Settings className="h-4 w-4" />
          <span>Channels</span>
        </Button>
        <Button
          variant={activeTab === 'rules' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('rules')}
          className="flex items-center space-x-2"
        >
          <Bell className="h-4 w-4" />
          <span>Rules</span>
        </Button>
      </div>

      {/* Channels Tab */}
      {activeTab === 'channels' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Notification Channels</h3>
            <Button onClick={handleCreateChannel} className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Add Channel</span>
            </Button>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            {channels.map((channel) => (
              <ChannelCard
                key={channel.id}
                channel={channel}
                onEdit={handleEditChannel}
                onToggle={handleToggleChannel}
                onDelete={handleDeleteChannel}
              />
            ))}
          </div>
        </div>
      )}

      {/* Rules Tab */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Notification Rules</h3>
            <Button onClick={handleCreateRule} className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Add Rule</span>
            </Button>
          </div>
          
          <div className="space-y-4">
            {rules.map((rule) => (
              <RuleCard
                key={rule.id}
                rule={rule}
                channels={channels}
                onEdit={handleEditRule}
                onToggle={handleToggleRule}
                onDelete={handleDeleteRule}
              />
            ))}
          </div>
        </div>
      )}

      {/* Channel Dialog */}
      <Dialog open={showChannelDialog} onOpenChange={setShowChannelDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingChannel ? 'Edit Channel' : 'Create New Channel'}
            </DialogTitle>
            <DialogDescription>
              Configure notification channel settings and events.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="channelName">Channel Name</Label>
              <Input
                id="channelName"
                placeholder="e.g., IDE Status Notifications"
                defaultValue={editingChannel?.name}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="channelType">Channel Type</Label>
              <Select defaultValue={editingChannel?.type || 'ide_popup'}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ide_popup">IDE Popup</SelectItem>
                  <SelectItem value="system_tray">System Tray</SelectItem>
                  <SelectItem value="console_log">Console Log</SelectItem>
                  <SelectItem value="webhook">Webhook</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="events">Events (comma-separated)</Label>
              <Input
                id="events"
                placeholder="backup_complete, backup_failed"
                defaultValue={editingChannel?.events.join(', ')}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowChannelDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              toast({
                title: editingChannel ? "Channel Updated" : "Channel Created",
                description: "Notification channel has been saved successfully.",
              });
              setShowChannelDialog(false);
            }}>
              {editingChannel ? 'Update' : 'Create'} Channel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rule Dialog */}
      <Dialog open={showRuleDialog} onOpenChange={setShowRuleDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingRule ? 'Edit Rule' : 'Create New Rule'}
            </DialogTitle>
            <DialogDescription>
              Configure notification rule conditions and templates.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ruleName">Rule Name</Label>
                <Input
                  id="ruleName"
                  placeholder="e.g., Critical Failures"
                  defaultValue={editingRule?.name}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select defaultValue={editingRule?.priority || 'medium'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Brief description of this rule"
                defaultValue={editingRule?.description}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="ruleEvents">Events (comma-separated)</Label>
              <Input
                id="ruleEvents"
                placeholder="backup_failed, restore_failed"
                defaultValue={editingRule?.events.join(', ')}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="messageTemplate">Message Template</Label>
              <Textarea
                id="messageTemplate"
                placeholder="Backup {{backup_type}} failed: {{error_message}}"
                defaultValue={editingRule?.template.message}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRuleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              toast({
                title: editingRule ? "Rule Updated" : "Rule Created",
                description: "Notification rule has been saved successfully.",
              });
              setShowRuleDialog(false);
            }}>
              {editingRule ? 'Update' : 'Create'} Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}