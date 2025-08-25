'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import {
  HardDrive,
  Database,
  FolderOpen,
  Trash2,
  Settings,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Archive,
  Download,
  Upload,
  Server,
  Cloud,
  Folder,
  File,
  Clock,
  Zap,
  Shield,
  TrendingUp,
  PieChart
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StorageLocation {
  id: string;
  name: string;
  type: 'local' | 'network' | 'cloud' | 'cache';
  path: string;
  totalSpace: number; // in GB
  usedSpace: number; // in GB
  availableSpace: number; // in GB
  backupCount: number;
  lastCleanup?: string;
  status: 'healthy' | 'warning' | 'critical' | 'offline';
  autoCleanup: boolean;
  retentionDays: number;
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
}

interface StoragePolicy {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  conditions: {
    maxAge?: number; // days
    maxSize?: number; // GB
    minFreeSpace?: number; // GB
    backupTypes?: string[];
  };
  actions: {
    compress?: boolean;
    archive?: boolean;
    delete?: boolean;
    moveToLocation?: string;
  };
  priority: number;
  lastRun?: string;
  itemsProcessed?: number;
}

interface StorageStats {
  totalBackups: number;
  totalSize: number; // GB
  averageBackupSize: number; // MB
  oldestBackup: string;
  newestBackup: string;
  compressionRatio: number;
  duplicateFiles: number;
  orphanedFiles: number;
}

const MOCK_LOCATIONS: StorageLocation[] = [
  {
    id: '1',
    name: 'Default Storage',
    type: 'local',
    path: 'C:\\Dev\\Backups',
    totalSpace: 50,
    usedSpace: 0,
    availableSpace: 50,
    backupCount: 0,
    status: 'healthy',
    autoCleanup: true,
    retentionDays: 7,
    compressionEnabled: true,
    encryptionEnabled: false
  }
];

const MOCK_POLICIES: StoragePolicy[] = [
  {
    id: '1',
    name: 'Default Cleanup Policy',
    description: 'Basic cleanup policy for old backups',
    enabled: true,
    conditions: {
      maxAge: 7
    },
    actions: {
      delete: true
    },
    priority: 1,
    itemsProcessed: 0
  }
];

const MOCK_STATS: StorageStats = {
  totalBackups: 0,
  totalSize: 0,
  averageBackupSize: 0,
  oldestBackup: new Date().toISOString(),
  newestBackup: new Date().toISOString(),
  compressionRatio: 0,
  duplicateFiles: 0,
  orphanedFiles: 0
};

function getLocationIcon(type: StorageLocation['type']) {
  switch (type) {
    case 'local': return HardDrive;
    case 'network': return Server;
    case 'cloud': return Cloud;
    case 'cache': return Database;
    default: return Folder;
  }
}

function getLocationColor(type: StorageLocation['type']) {
  switch (type) {
    case 'local': return 'bg-blue-500';
    case 'network': return 'bg-green-500';
    case 'cloud': return 'bg-purple-500';
    case 'cache': return 'bg-orange-500';
    default: return 'bg-gray-500';
  }
}

function getStatusColor(status: StorageLocation['status']) {
  switch (status) {
    case 'healthy': return 'text-green-600';
    case 'warning': return 'text-yellow-600';
    case 'critical': return 'text-red-600';
    case 'offline': return 'text-gray-600';
    default: return 'text-gray-600';
  }
}

function getStatusIcon(status: StorageLocation['status']) {
  switch (status) {
    case 'healthy': return CheckCircle;
    case 'warning': return AlertTriangle;
    case 'critical': return AlertTriangle;
    case 'offline': return RefreshCw;
    default: return CheckCircle;
  }
}

interface LocationCardProps {
  location: StorageLocation;
  onEdit: (location: StorageLocation) => void;
  onCleanup: (location: StorageLocation) => void;
  onDelete: (id: string) => void;
}

function LocationCard({ location, onEdit, onCleanup, onDelete }: LocationCardProps) {
  const Icon = getLocationIcon(location.type);
  const StatusIcon = getStatusIcon(location.status);
  const usagePercentage = (location.usedSpace / location.totalSpace) * 100;
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={cn('p-2 rounded-lg text-white', getLocationColor(location.type))}>
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base">{location.name}</CardTitle>
              <CardDescription className="flex items-center space-x-2">
                <StatusIcon className={cn('h-3 w-3', getStatusColor(location.status))} />
                <span className="capitalize">{location.type}</span>
                <span>•</span>
                <span>{location.backupCount} backups</span>
              </CardDescription>
            </div>
          </div>
          <Badge variant={location.status === 'healthy' ? 'default' : location.status === 'critical' ? 'destructive' : 'secondary'}>
            {location.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Storage Usage */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Storage Usage</span>
              <span>{location.usedSpace.toFixed(1)} / {location.totalSpace} GB</span>
            </div>
            <Progress 
              value={usagePercentage} 
              className={cn(
                "w-full",
                usagePercentage > 90 && "[&>div]:bg-red-500",
                usagePercentage > 75 && usagePercentage <= 90 && "[&>div]:bg-yellow-500"
              )} 
            />
            <div className="text-xs text-muted-foreground">
              {location.availableSpace.toFixed(1)} GB available
            </div>
          </div>
          
          {/* Path */}
          <div className="p-2 bg-muted rounded text-xs font-mono break-all">
            {location.path}
          </div>
          
          {/* Features */}
          <div className="flex flex-wrap gap-2">
            {location.autoCleanup && (
              <Badge variant="outline" className="text-xs">
                <RefreshCw className="h-3 w-3 mr-1" />
                Auto-cleanup
              </Badge>
            )}
            {location.compressionEnabled && (
              <Badge variant="outline" className="text-xs">
                <Archive className="h-3 w-3 mr-1" />
                Compressed
              </Badge>
            )}
            {location.encryptionEnabled && (
              <Badge variant="outline" className="text-xs">
                <Shield className="h-3 w-3 mr-1" />
                Encrypted
              </Badge>
            )}
          </div>
          
          {/* Last Cleanup */}
          {location.lastCleanup && (
            <div className="text-xs text-muted-foreground">
              Last cleanup: {location.lastCleanup}
            </div>
          )}
          
          {/* Actions */}
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(location)}
              className="flex items-center space-x-1"
            >
              <Settings className="h-3 w-3" />
              <span>Configure</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCleanup(location)}
              className="flex items-center space-x-1"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Cleanup</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(location.id)}
              className="flex items-center space-x-1 text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-3 w-3" />
              <span>Remove</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface PolicyCardProps {
  policy: StoragePolicy;
  onEdit: (policy: StoragePolicy) => void;
  onToggle: (id: string) => void;
  onRun: (policy: StoragePolicy) => void;
  onDelete: (id: string) => void;
}

function PolicyCard({ policy, onEdit, onToggle, onRun, onDelete }: PolicyCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">{policy.name}</CardTitle>
            <CardDescription>{policy.description}</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={policy.enabled ? 'default' : 'secondary'}>
              {policy.enabled ? 'Active' : 'Disabled'}
            </Badge>
            <Switch
              checked={policy.enabled}
              onCheckedChange={() => onToggle(policy.id)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Conditions */}
          <div>
            <p className="text-sm font-medium mb-1">Conditions:</p>
            <div className="flex flex-wrap gap-1">
              {policy.conditions.maxAge && (
                <Badge variant="outline" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  {policy.conditions.maxAge} days
                </Badge>
              )}
              {policy.conditions.maxSize && (
                <Badge variant="outline" className="text-xs">
                  <HardDrive className="h-3 w-3 mr-1" />
                  {policy.conditions.maxSize} GB
                </Badge>
              )}
              {policy.conditions.backupTypes?.map((type) => (
                <Badge key={type} variant="outline" className="text-xs">
                  {type}
                </Badge>
              ))}
            </div>
          </div>
          
          {/* Actions */}
          <div>
            <p className="text-sm font-medium mb-1">Actions:</p>
            <div className="flex flex-wrap gap-1">
              {policy.actions.compress && (
                <Badge variant="outline" className="text-xs">
                  <Archive className="h-3 w-3 mr-1" />
                  Compress
                </Badge>
              )}
              {policy.actions.archive && (
                <Badge variant="outline" className="text-xs">
                  <Download className="h-3 w-3 mr-1" />
                  Archive
                </Badge>
              )}
              {policy.actions.delete && (
                <Badge variant="outline" className="text-xs">
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Badge>
              )}
            </div>
          </div>
          
          {/* Last Run */}
          {policy.lastRun && (
            <div className="text-xs text-muted-foreground">
              Last run: {policy.lastRun} ({policy.itemsProcessed} items processed)
            </div>
          )}
          
          {/* Actions */}
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(policy)}
              className="flex items-center space-x-1"
            >
              <Settings className="h-3 w-3" />
              <span>Edit</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRun(policy)}
              disabled={!policy.enabled}
              className="flex items-center space-x-1"
            >
              <Zap className="h-3 w-3" />
              <span>Run Now</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(policy.id)}
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

export default function BackupStorage() {
  const [locations, setLocations] = useState<StorageLocation[]>(MOCK_LOCATIONS);
  const [policies, setPolicies] = useState<StoragePolicy[]>(MOCK_POLICIES);
  const [stats] = useState<StorageStats>(MOCK_STATS);
  const [activeTab, setActiveTab] = useState<'overview' | 'locations' | 'policies'>('overview');
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [showPolicyDialog, setShowPolicyDialog] = useState(false);
  const [showCleanupDialog, setShowCleanupDialog] = useState(false);
  const [editingLocation, setEditingLocation] = useState<StorageLocation | null>(null);
  const [editingPolicy, setEditingPolicy] = useState<StoragePolicy | null>(null);
  const [cleanupLocation, setCleanupLocation] = useState<StorageLocation | null>(null);
  const { toast } = useToast();

  const handleEditLocation = (location: StorageLocation) => {
    setEditingLocation(location);
    setShowLocationDialog(true);
  };

  const handleEditPolicy = (policy: StoragePolicy) => {
    setEditingPolicy(policy);
    setShowPolicyDialog(true);
  };

  const handleCleanupLocation = (location: StorageLocation) => {
    setCleanupLocation(location);
    setShowCleanupDialog(true);
  };

  const handleTogglePolicy = (id: string) => {
    setPolicies(prev => prev.map(policy => 
      policy.id === id 
        ? { ...policy, enabled: !policy.enabled }
        : policy
    ));
    
    const policy = policies.find(p => p.id === id);
    toast({
      title: policy?.enabled ? "Policy Disabled" : "Policy Enabled",
      description: `${policy?.name} has been ${policy?.enabled ? 'disabled' : 'enabled'}.`,
    });
  };

  const handleRunPolicy = (policy: StoragePolicy) => {
    toast({
      title: "Policy Executed",
      description: `Running ${policy.name}...`,
    });
    // In a real implementation, this would trigger the policy execution
  };

  const handleDeleteLocation = (id: string) => {
    const location = locations.find(l => l.id === id);
    setLocations(prev => prev.filter(l => l.id !== id));
    toast({
      title: "Location Removed",
      description: `${location?.name} has been removed.`,
    });
  };

  const handleDeletePolicy = (id: string) => {
    const policy = policies.find(p => p.id === id);
    setPolicies(prev => prev.filter(p => p.id !== id));
    toast({
      title: "Policy Deleted",
      description: `${policy?.name} has been deleted.`,
    });
  };

  const executeCleanup = () => {
    if (!cleanupLocation) return;
    
    toast({
      title: "Cleanup Started",
      description: `Cleaning up ${cleanupLocation.name}...`,
    });
    
    setShowCleanupDialog(false);
    // Cleanup process implementation
  };

  const totalUsedSpace = locations.reduce((sum, loc) => sum + loc.usedSpace, 0);
  const totalAvailableSpace = locations.reduce((sum, loc) => sum + loc.availableSpace, 0);
  const totalSpace = totalUsedSpace + totalAvailableSpace;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Development Storage</h2>
          <p className="text-muted-foreground">
            Manage backup storage locations, policies, and optimization for development workflows
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
        <Button
          variant={activeTab === 'overview' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('overview')}
          className="flex items-center space-x-2"
        >
          <PieChart className="h-4 w-4" />
          <span>Overview</span>
        </Button>
        <Button
          variant={activeTab === 'locations' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('locations')}
          className="flex items-center space-x-2"
        >
          <HardDrive className="h-4 w-4" />
          <span>Locations</span>
        </Button>
        <Button
          variant={activeTab === 'policies' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('policies')}
          className="flex items-center space-x-2"
        >
          <Settings className="h-4 w-4" />
          <span>Policies</span>
        </Button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Storage Summary */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Storage</CardTitle>
                <HardDrive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalSpace.toFixed(1)} GB</div>
                <p className="text-xs text-muted-foreground">
                  {((totalUsedSpace / totalSpace) * 100).toFixed(1)}% used
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Backups</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalBackups}</div>
                <p className="text-xs text-muted-foreground">
                  Avg {stats.averageBackupSize} MB each
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Compression</CardTitle>
                <Archive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(stats.compressionRatio * 100).toFixed(0)}%</div>
                <p className="text-xs text-muted-foreground">
                  Space saved
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Issues</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.duplicateFiles + stats.orphanedFiles}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.duplicateFiles} duplicates, {stats.orphanedFiles} orphaned
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Storage Usage Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Storage Usage by Location</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {locations.map((location) => {
                  const usagePercentage = (location.usedSpace / location.totalSpace) * 100;
                  return (
                    <div key={location.id} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center space-x-2">
                          <div className={cn('w-3 h-3 rounded-full', getLocationColor(location.type))} />
                          <span>{location.name}</span>
                        </span>
                        <span>{location.usedSpace.toFixed(1)} / {location.totalSpace} GB</span>
                      </div>
                      <Progress 
                        value={usagePercentage} 
                        className={cn(
                          "w-full",
                          usagePercentage > 90 && "[&>div]:bg-red-500",
                          usagePercentage > 75 && usagePercentage <= 90 && "[&>div]:bg-yellow-500"
                        )} 
                      />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Locations Tab */}
      {activeTab === 'locations' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Storage Locations</h3>
            <Button onClick={() => {
              setEditingLocation(null);
              setShowLocationDialog(true);
            }} className="flex items-center space-x-2">
              <FolderOpen className="h-4 w-4" />
              <span>Add Location</span>
            </Button>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            {locations.map((location) => (
              <LocationCard
                key={location.id}
                location={location}
                onEdit={handleEditLocation}
                onCleanup={handleCleanupLocation}
                onDelete={handleDeleteLocation}
              />
            ))}
          </div>
        </div>
      )}

      {/* Policies Tab */}
      {activeTab === 'policies' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Storage Policies</h3>
            <Button onClick={() => {
              setEditingPolicy(null);
              setShowPolicyDialog(true);
            }} className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Add Policy</span>
            </Button>
          </div>
          
          <div className="space-y-4">
            {policies.map((policy) => (
              <PolicyCard
                key={policy.id}
                policy={policy}
                onEdit={handleEditPolicy}
                onToggle={handleTogglePolicy}
                onRun={handleRunPolicy}
                onDelete={handleDeletePolicy}
              />
            ))}
          </div>
        </div>
      )}

      {/* Location Dialog */}
      <Dialog open={showLocationDialog} onOpenChange={setShowLocationDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingLocation ? 'Edit Location' : 'Add Storage Location'}
            </DialogTitle>
            <DialogDescription>
              Configure storage location settings and policies.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="locationName">Location Name</Label>
              <Input
                id="locationName"
                placeholder="e.g., Local Development Cache"
                defaultValue={editingLocation?.name}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="locationType">Type</Label>
                <Select defaultValue={editingLocation?.type || 'local'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="local">Local Storage</SelectItem>
                    <SelectItem value="network">Network Drive</SelectItem>
                    <SelectItem value="cloud">Cloud Storage</SelectItem>
                    <SelectItem value="cache">Cache Directory</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="retention">Retention (days)</Label>
                <Input
                  id="retention"
                  type="number"
                  placeholder="30"
                  defaultValue={editingLocation?.retentionDays}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="locationPath">Path</Label>
              <Input
                id="locationPath"
                placeholder="C:\\Dev\\Backups"
                defaultValue={editingLocation?.path}
              />
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch defaultChecked={editingLocation?.autoCleanup} />
                <Label>Enable auto-cleanup</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch defaultChecked={editingLocation?.compressionEnabled} />
                <Label>Enable compression</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch defaultChecked={editingLocation?.encryptionEnabled} />
                <Label>Enable encryption</Label>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLocationDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              toast({
                title: editingLocation ? "Location Updated" : "Location Added",
                description: "Storage location has been saved successfully.",
              });
              setShowLocationDialog(false);
            }}>
              {editingLocation ? 'Update' : 'Add'} Location
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Policy Dialog */}
      <Dialog open={showPolicyDialog} onOpenChange={setShowPolicyDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingPolicy ? 'Edit Policy' : 'Create Storage Policy'}
            </DialogTitle>
            <DialogDescription>
              Configure automated storage management rules.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="policyName">Policy Name</Label>
              <Input
                id="policyName"
                placeholder="e.g., Auto-cleanup Old Backups"
                defaultValue={editingPolicy?.name}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="policyDescription">Description</Label>
              <Input
                id="policyDescription"
                placeholder="Brief description of this policy"
                defaultValue={editingPolicy?.description}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxAge">Max Age (days)</Label>
                <Input
                  id="maxAge"
                  type="number"
                  placeholder="30"
                  defaultValue={editingPolicy?.conditions.maxAge}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxSize">Max Size (GB)</Label>
                <Input
                  id="maxSize"
                  type="number"
                  step="0.1"
                  placeholder="1.0"
                  defaultValue={editingPolicy?.conditions.maxSize}
                />
              </div>
            </div>
            
            <div className="space-y-3">
              <Label>Actions</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch defaultChecked={editingPolicy?.actions.compress} />
                  <Label>Compress files</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch defaultChecked={editingPolicy?.actions.archive} />
                  <Label>Archive to secondary storage</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch defaultChecked={editingPolicy?.actions.delete} />
                  <Label>Delete files</Label>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPolicyDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              toast({
                title: editingPolicy ? "Policy Updated" : "Policy Created",
                description: "Storage policy has been saved successfully.",
              });
              setShowPolicyDialog(false);
            }}>
              {editingPolicy ? 'Update' : 'Create'} Policy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cleanup Confirmation Dialog */}
      <AlertDialog open={showCleanupDialog} onOpenChange={setShowCleanupDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Cleanup</AlertDialogTitle>
            <AlertDialogDescription>
              This will clean up old and unnecessary files from {cleanupLocation?.name}.
              This action cannot be undone. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeCleanup}>
              Start Cleanup
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}