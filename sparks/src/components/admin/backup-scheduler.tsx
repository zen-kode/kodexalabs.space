'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Terminal,
  Code,
  GitBranch,
  Clock,
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  Settings,
  Database,
  HardDrive,
  Zap,
  FileText,
  AlertCircle,
  Save
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BackupTrigger {
  id: string;
  name: string;
  type: 'file_change' | 'git_commit' | 'time_interval' | 'manual' | 'ide_event';
  enabled: boolean;
  config: {
    patterns?: string[];
    debounce?: number;
    branches?: string[];
    includeStaged?: boolean;
    interval?: number;
    workingHoursOnly?: boolean;
    events?: string[];
  };
  lastTriggered?: string;
  status: 'active' | 'paused' | 'error';
  backupType: 'full' | 'incremental' | 'differential';
}

const MOCK_TRIGGERS: BackupTrigger[] = [
  {
    id: '1',
    name: 'Default Trigger',
    type: 'manual',
    enabled: false,
    config: {},
    status: 'paused',
    backupType: 'full'
  }
];

function TriggerCard({ trigger, onEdit, onToggle, onDelete }: {
  trigger: BackupTrigger;
  onEdit: (trigger: BackupTrigger) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const getTypeIcon = (type: BackupTrigger['type']) => {
    switch (type) {
      case 'file_change': return <FileText className="h-4 w-4" />;
      case 'git_commit': return <GitBranch className="h-4 w-4" />;
      case 'time_interval': return <Clock className="h-4 w-4" />;
      case 'ide_event': return <Code className="h-4 w-4" />;
      default: return <Terminal className="h-4 w-4" />;
    }
  };

  const getBackupTypeColor = (type: string) => {
    switch (type) {
      case 'full': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'incremental': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'differential': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'paused': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'error': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const formatTriggerConfig = () => {
    switch (trigger.type) {
      case 'file_change': 
        return `Patterns: ${trigger.config.patterns?.join(', ') || 'All files'} | Debounce: ${trigger.config.debounce || 0}ms`;
      case 'git_commit': 
        return `Branches: ${trigger.config.branches?.join(', ') || 'All'} | Include staged: ${trigger.config.includeStaged ? 'Yes' : 'No'}`;
      case 'time_interval': 
        return `Every ${Math.floor((trigger.config.interval || 0) / 60000)} minutes | Working hours only: ${trigger.config.workingHoursOnly ? 'Yes' : 'No'}`;
      case 'ide_event': 
        return `Events: ${trigger.config.events?.join(', ') || 'All events'}`;
      default: 
        return 'Manual trigger';
    }
  };

  return (
    <Card className={cn('transition-all hover:shadow-md', !trigger.enabled && 'opacity-60')}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-3 flex-1">
            <div className="flex items-center space-x-3">
              <div className="flex items-center gap-2">
                {getTypeIcon(trigger.type)}
                <h3 className="font-semibold text-lg">{trigger.name}</h3>
              </div>
              <Badge className={cn('text-xs', getBackupTypeColor(trigger.backupType))}>
                {trigger.backupType}
              </Badge>
              <Badge className={cn('text-xs', getStatusColor(trigger.status))}>
                {trigger.status}
              </Badge>
            </div>
            
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span>{formatTriggerConfig()}</span>
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground">
              {trigger.lastTriggered && <p>Last triggered: {trigger.lastTriggered}</p>}
              {!trigger.lastTriggered && <p>Never triggered</p>}
            </div>
          </div>
          
          <div className="flex items-center space-x-2 ml-4">
            <Switch
              checked={trigger.enabled}
              onCheckedChange={() => onToggle(trigger.id)}
            />
            <Button variant="ghost" size="sm" onClick={() => onEdit(trigger)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onDelete(trigger.id)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function BackupScheduler() {
  const [triggers, setTriggers] = useState<BackupTrigger[]>(MOCK_TRIGGERS);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTrigger, setEditingTrigger] = useState<BackupTrigger | null>(null);
  const { toast } = useToast();

  const handleToggleTrigger = (id: string) => {
    setTriggers(prev => prev.map(trigger => 
      trigger.id === id 
        ? { ...trigger, enabled: !trigger.enabled, status: trigger.enabled ? 'paused' : 'active' }
        : trigger
    ));
    
    const trigger = triggers.find(t => t.id === id);
    toast({
      title: trigger?.enabled ? "Trigger Paused" : "Trigger Activated",
      description: `${trigger?.name} has been ${trigger?.enabled ? 'paused' : 'activated'}.`,
    });
  };

  const handleEditTrigger = (trigger: BackupTrigger) => {
    setEditingTrigger(trigger);
    setShowCreateDialog(true);
  };

  const handleDeleteTrigger = (id: string) => {
    const trigger = triggers.find(t => t.id === id);
    setTriggers(prev => prev.filter(t => t.id !== id));
    toast({
      title: "Trigger Deleted",
      description: `${trigger?.name} has been removed.`,
    });
  };

  const handleCreateTrigger = () => {
    setEditingTrigger(null);
    setShowCreateDialog(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Development Backup Triggers</h2>
          <p className="text-muted-foreground">
            Configure automated backup triggers for your development workflow
          </p>
        </div>
        <Button onClick={handleCreateTrigger} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>New Trigger</span>
        </Button>
      </div>

      {/* Development Notice */}
      <div className="p-4 bg-muted rounded-lg">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5 text-amber-500" />
          <div className="text-sm">
            <p className="font-medium">Development Mode</p>
            <p className="text-muted-foreground mt-1">
              These triggers are designed for IDE integration and development workflow automation. They will create backups based on your coding activities.
            </p>
          </div>
        </div>
      </div>

      {/* Trigger List */}
      <div className="space-y-4">
        {triggers.map((trigger) => (
          <TriggerCard
            key={trigger.id}
            trigger={trigger}
            onEdit={handleEditTrigger}
            onToggle={handleToggleTrigger}
            onDelete={handleDeleteTrigger}
          />
        ))}
      </div>

      {/* Create/Edit Schedule Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingTrigger ? 'Edit Trigger' : 'Create New Trigger'}
            </DialogTitle>
            <DialogDescription>
              Configure development backup trigger settings and behavior.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Trigger Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., File Save Auto-backup"
                  defaultValue={editingTrigger?.name}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Trigger Type</Label>
                <Select defaultValue={editingTrigger?.type || 'file_change'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="file_change">File Changes</SelectItem>
                    <SelectItem value="git_commit">Git Commits</SelectItem>
                    <SelectItem value="time_interval">Time Interval</SelectItem>
                    <SelectItem value="ide_event">IDE Events</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="backupType">Backup Type</Label>
                <Select defaultValue={editingTrigger?.backupType || 'incremental'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Full Backup</SelectItem>
                    <SelectItem value="incremental">Incremental</SelectItem>
                    <SelectItem value="differential">Differential</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="debounce">Debounce (ms)</Label>
                <Input
                  id="debounce"
                  type="number"
                  placeholder="5000"
                  defaultValue={editingTrigger?.config.debounce || 5000}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="patterns">File Patterns (comma-separated)</Label>
              <Input
                id="patterns"
                placeholder="*.tsx, *.ts, *.js, *.json"
                defaultValue={editingTrigger?.config.patterns?.join(', ')}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              toast({
                title: editingTrigger ? "Trigger Updated" : "Trigger Created",
                description: "Backup trigger has been saved successfully.",
              });
              setShowCreateDialog(false);
            }}>
              {editingTrigger ? 'Update' : 'Create'} Trigger
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}