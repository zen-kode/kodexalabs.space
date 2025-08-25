'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Bell,
  Mail,
  Smartphone,
  Monitor,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  Settings,
  TestTube,
  Save
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotificationChannel {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'inApp' | 'webhook';
  icon: any;
  enabled: boolean;
  config: Record<string, any>;
  status: 'active' | 'error' | 'testing';
}

interface NotificationEvent {
  id: string;
  name: string;
  description: string;
  category: 'success' | 'warning' | 'error' | 'info';
  channels: string[];
  enabled: boolean;
}

const NOTIFICATION_CHANNELS: NotificationChannel[] = [
  {
    id: 'email',
    name: 'Email Notifications',
    type: 'email',
    icon: Mail,
    enabled: true,
    config: {
      address: 'admin@sparks.ai',
      smtpServer: 'smtp.gmail.com',
      port: 587
    },
    status: 'active'
  },
  {
    id: 'sms',
    name: 'SMS Alerts',
    type: 'sms',
    icon: Smartphone,
    enabled: false,
    config: {
      number: '+1234567890',
      provider: 'twilio'
    },
    status: 'error'
  },
  {
    id: 'inApp',
    name: 'In-App Notifications',
    type: 'inApp',
    icon: Monitor,
    enabled: true,
    config: {
      showToasts: true,
      persistentNotifications: true
    },
    status: 'active'
  }
];

const NOTIFICATION_EVENTS: NotificationEvent[] = [
  {
    id: 'backup_success',
    name: 'Backup Completed Successfully',
    description: 'Notify when a backup completes without errors',
    category: 'success',
    channels: ['email', 'inApp'],
    enabled: true
  },
  {
    id: 'backup_failed',
    name: 'Backup Failed',
    description: 'Alert when a backup fails or encounters errors',
    category: 'error',
    channels: ['email', 'sms', 'inApp'],
    enabled: true
  },
  {
    id: 'backup_warning',
    name: 'Backup Warnings',
    description: 'Notify about backup warnings or partial failures',
    category: 'warning',
    channels: ['email', 'inApp'],
    enabled: true
  },
  {
    id: 'storage_threshold',
    name: 'Storage Threshold Exceeded',
    description: 'Alert when backup storage usage exceeds threshold',
    category: 'warning',
    channels: ['email', 'inApp'],
    enabled: true
  },
  {
    id: 'schedule_missed',
    name: 'Scheduled Backup Missed',
    description: 'Notify when a scheduled backup fails to run',
    category: 'error',
    channels: ['email', 'sms', 'inApp'],
    enabled: true
  },
  {
    id: 'retention_cleanup',
    name: 'Retention Policy Cleanup',
    description: 'Notify when old backups are automatically deleted',
    category: 'info',
    channels: ['inApp'],
    enabled: false
  }
];

function ChannelCard({ channel, onToggle, onTest, onConfigure }: {
  channel: NotificationChannel;
  onToggle: (id: string) => void;
  onTest: (id: string) => void;
  onConfigure: (channel: NotificationChannel) => void;
}) {
  const Icon = channel.icon;
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'error': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'testing': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <Card className={cn('transition-all hover:shadow-md', !channel.enabled && 'opacity-60')}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-muted rounded-lg">
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold">{channel.name}</h3>
              <div className="flex items-center space-x-2 mt-1">
                <Badge className={cn('text-xs', getStatusColor(channel.status))}>
                  {channel.status}
                </Badge>
                {channel.type === 'email' && (
                  <span className="text-sm text-muted-foreground">
                    {channel.config.address}
                  </span>
                )}
                {channel.type === 'sms' && (
                  <span className="text-sm text-muted-foreground">
                    {channel.config.number}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onTest(channel.id)}
              disabled={!channel.enabled || channel.status === 'testing'}
            >
              <TestTube className="h-4 w-4 mr-2" />
              Test
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onConfigure(channel)}
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Switch
              checked={channel.enabled}
              onCheckedChange={() => onToggle(channel.id)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EventCard({ event, channels, onToggle, onUpdateChannels }: {
  event: NotificationEvent;
  channels: NotificationChannel[];
  onToggle: (id: string) => void;
  onUpdateChannels: (eventId: string, channelIds: string[]) => void;
}) {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <Bell className="h-4 w-4 text-blue-600" />;
    }
  };

  return (
    <Card className={cn('transition-all hover:shadow-md', !event.enabled && 'opacity-60')}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex items-center space-x-2">
              {getCategoryIcon(event.category)}
              <h3 className="font-semibold">{event.name}</h3>
            </div>
            <p className="text-sm text-muted-foreground">{event.description}</p>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-muted-foreground">Channels:</span>
              {event.channels.map(channelId => {
                const channel = channels.find(c => c.id === channelId);
                return channel ? (
                  <Badge key={channelId} variant="outline" className="text-xs">
                    {channel.name}
                  </Badge>
                ) : null;
              })}
            </div>
          </div>
          
          <Switch
            checked={event.enabled}
            onCheckedChange={() => onToggle(event.id)}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export default function NotificationSettings() {
  const [channels, setChannels] = useState<NotificationChannel[]>(NOTIFICATION_CHANNELS);
  const [events, setEvents] = useState<NotificationEvent[]>(NOTIFICATION_EVENTS);
  const { toast } = useToast();

  const handleToggleChannel = (id: string) => {
    setChannels(prev => prev.map(channel => 
      channel.id === id 
        ? { ...channel, enabled: !channel.enabled }
        : channel
    ));
    
    const channel = channels.find(c => c.id === id);
    toast({
      title: channel?.enabled ? "Channel Disabled" : "Channel Enabled",
      description: `${channel?.name} has been ${channel?.enabled ? 'disabled' : 'enabled'}.`,
    });
  };

  const handleTestChannel = (id: string) => {
    setChannels(prev => prev.map(channel => 
      channel.id === id 
        ? { ...channel, status: 'testing' }
        : channel
    ));
    
    const channel = channels.find(c => c.id === id);
    toast({
      title: "Test Notification Sent",
      description: `Test notification sent via ${channel?.name}.`,
    });
    
    // Simulate test completion
    setTimeout(() => {
      setChannels(prev => prev.map(channel => 
        channel.id === id 
          ? { ...channel, status: 'active' }
          : channel
      ));
    }, 2000);
  };

  const handleConfigureChannel = (channel: NotificationChannel) => {
    toast({
      title: "Configuration",
      description: `Opening configuration for ${channel.name}...`,
    });
  };

  const handleToggleEvent = (id: string) => {
    setEvents(prev => prev.map(event => 
      event.id === id 
        ? { ...event, enabled: !event.enabled }
        : event
    ));
    
    const event = events.find(e => e.id === id);
    toast({
      title: event?.enabled ? "Event Disabled" : "Event Enabled",
      description: `${event?.name} notifications have been ${event?.enabled ? 'disabled' : 'enabled'}.`,
    });
  };

  const handleUpdateEventChannels = (eventId: string, channelIds: string[]) => {
    setEvents(prev => prev.map(event => 
      event.id === eventId 
        ? { ...event, channels: channelIds }
        : event
    ));
  };

  const handleSaveSettings = () => {
    toast({
      title: "Settings Saved",
      description: "Notification settings have been saved successfully.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Notification Settings</h2>
          <p className="text-muted-foreground">
            Configure alerts for backup events across multiple channels
          </p>
        </div>
        <Button onClick={handleSaveSettings} className="flex items-center space-x-2">
          <Save className="h-4 w-4" />
          <span>Save Settings</span>
        </Button>
      </div>

      {/* Notification Channels */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Notification Channels</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Configure and test different notification delivery methods
          </p>
        </div>
        
        <div className="space-y-3">
          {channels.map((channel) => (
            <ChannelCard
              key={channel.id}
              channel={channel}
              onToggle={handleToggleChannel}
              onTest={handleTestChannel}
              onConfigure={handleConfigureChannel}
            />
          ))}
        </div>
      </div>

      <Separator />

      {/* Notification Events */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Notification Events</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Choose which backup events should trigger notifications
          </p>
        </div>
        
        <div className="space-y-3">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              channels={channels}
              onToggle={handleToggleEvent}
              onUpdateChannels={handleUpdateEventChannels}
            />
          ))}
        </div>
      </div>
    </div>
  );
}