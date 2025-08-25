'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
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
  RotateCcw,
  Download,
  Eye,
  GitBranch,
  Code,
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  RefreshCw,
  Terminal,
  FolderOpen,
  Diff,
  History
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BackupVersion {
  id: string;
  version: string;
  timestamp: string;
  description: string;
  size: string;
  fileCount: number;
  changes: number;
  type: 'full' | 'incremental' | 'differential';
  status: 'completed' | 'partial' | 'corrupted';
  branch?: string;
  commit?: string;
  tags: string[];
  canRestore: boolean;
}

interface RestoreOperation {
  id: string;
  backupId: string;
  backupVersion: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  startTime: string;
  endTime?: string;
  restoredFiles: number;
  totalFiles: number;
  currentFile?: string;
  errors: string[];
  warnings: string[];
  restoreType: 'full' | 'selective' | 'preview';
  targetPath: string;
}

const MOCK_VERSIONS: BackupVersion[] = [
  {
    id: '1',
    version: 'v1.0.0',
    timestamp: new Date().toISOString().replace('T', ' ').split('.')[0],
    description: 'Initial backup',
    size: '0 MB',
    fileCount: 0,
    changes: 0,
    type: 'full',
    status: 'completed',
    branch: 'main',
    commit: 'abc123',
    tags: ['initial'],
    canRestore: true
  }
];

const MOCK_OPERATION: RestoreOperation = {
  id: 'restore-001',
  backupId: '1',
  backupVersion: 'v1.0.0',
  status: 'pending',
  progress: 0,
  startTime: new Date().toISOString().replace('T', ' ').split('.')[0],
  restoredFiles: 0,
  totalFiles: 0,
  errors: [],
  warnings: [],
  restoreType: 'full',
  targetPath: '/workspace/project'
};

function getTypeColor(type: BackupVersion['type']) {
  switch (type) {
    case 'full': return 'bg-blue-500';
    case 'incremental': return 'bg-green-500';
    case 'differential': return 'bg-orange-500';
    default: return 'bg-gray-500';
  }
}

function getStatusColor(status: BackupVersion['status']) {
  switch (status) {
    case 'completed': return 'text-green-600';
    case 'partial': return 'text-yellow-600';
    case 'corrupted': return 'text-red-600';
    default: return 'text-gray-600';
  }
}

function getStatusIcon(status: BackupVersion['status']) {
  switch (status) {
    case 'completed': return CheckCircle;
    case 'partial': return AlertTriangle;
    case 'corrupted': return XCircle;
    default: return Clock;
  }
}

interface VersionCardProps {
  version: BackupVersion;
  onRestore: (version: BackupVersion) => void;
  onPreview: (version: BackupVersion) => void;
  onCompare: (version: BackupVersion) => void;
}

function VersionCard({ version, onRestore, onPreview, onCompare }: VersionCardProps) {
  const StatusIcon = getStatusIcon(version.status);
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={cn('p-2 rounded-lg text-white', getTypeColor(version.type))}>
              <Code className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center space-x-2">
                <span>{version.version}</span>
                {version.branch && (
                  <Badge variant="outline" className="text-xs">
                    <GitBranch className="h-3 w-3 mr-1" />
                    {version.branch}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="flex items-center space-x-2">
                <StatusIcon className={cn('h-3 w-3', getStatusColor(version.status))} />
                <span>{version.timestamp}</span>
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-col items-end space-y-1">
            <Badge variant={version.canRestore ? 'default' : 'secondary'}>
              {version.canRestore ? 'Restorable' : 'Unavailable'}
            </Badge>
            <span className="text-xs text-muted-foreground">{version.size}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <p className="text-sm">{version.description}</p>
          
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span>{version.fileCount} files</span>
            <span>{version.changes} changes</span>
            {version.commit && <span>#{version.commit}</span>}
          </div>
          
          {version.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {version.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          
          <div className="flex space-x-2">
            <Button
              variant="default"
              size="sm"
              onClick={() => onRestore(version)}
              disabled={!version.canRestore}
              className="flex items-center space-x-1"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Restore</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPreview(version)}
              className="flex items-center space-x-1"
            >
              <Eye className="h-3 w-3" />
              <span>Preview</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCompare(version)}
              className="flex items-center space-x-1"
            >
              <Diff className="h-3 w-3" />
              <span>Compare</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface RestoreProgressProps {
  operation: RestoreOperation;
  onCancel: () => void;
  onPause: () => void;
  onResume: () => void;
}

function RestoreProgress({ operation, onCancel, onPause, onResume }: RestoreProgressProps) {
  const isRunning = operation.status === 'running';
  const isPaused = operation.status === 'pending';
  const isCompleted = operation.status === 'completed';
  const isFailed = operation.status === 'failed';
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Restoring {operation.backupVersion}</CardTitle>
            <CardDescription>
              {operation.restoreType} restore to {operation.targetPath}
            </CardDescription>
          </div>
          <Badge variant={isCompleted ? 'default' : isFailed ? 'destructive' : 'secondary'}>
            {operation.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{operation.progress}%</span>
            </div>
            <Progress value={operation.progress} className="w-full" />
          </div>
          
          {/* File Progress */}
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Files: {operation.restoredFiles} / {operation.totalFiles}</span>
            <span>Started: {operation.startTime}</span>
          </div>
          
          {/* Current File */}
          {operation.currentFile && isRunning && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center space-x-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="text-sm font-medium">Currently restoring:</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1 font-mono">
                {operation.currentFile}
              </p>
            </div>
          )}
          
          {/* Warnings */}
          {operation.warnings.length > 0 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">Warnings</span>
              </div>
              {operation.warnings.map((warning, index) => (
                <p key={index} className="text-sm text-yellow-700">{warning}</p>
              ))}
            </div>
          )}
          
          {/* Errors */}
          {operation.errors.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-800">Errors</span>
              </div>
              {operation.errors.map((error, index) => (
                <p key={index} className="text-sm text-red-700">{error}</p>
              ))}
            </div>
          )}
          
          {/* Controls */}
          <div className="flex space-x-2">
            {isRunning && (
              <Button
                variant="outline"
                size="sm"
                onClick={onPause}
                className="flex items-center space-x-1"
              >
                <Pause className="h-3 w-3" />
                <span>Pause</span>
              </Button>
            )}
            {isPaused && (
              <Button
                variant="outline"
                size="sm"
                onClick={onResume}
                className="flex items-center space-x-1"
              >
                <Play className="h-3 w-3" />
                <span>Resume</span>
              </Button>
            )}
            {(isRunning || isPaused) && (
              <Button
                variant="destructive"
                size="sm"
                onClick={onCancel}
                className="flex items-center space-x-1"
              >
                <XCircle className="h-3 w-3" />
                <span>Cancel</span>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function BackupRestore() {
  const [versions, setVersions] = useState<BackupVersion[]>(MOCK_VERSIONS);
  const [currentOperation, setCurrentOperation] = useState<RestoreOperation | null>(MOCK_OPERATION);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<BackupVersion | null>(null);
  const [restoreType, setRestoreType] = useState<'full' | 'selective' | 'preview'>('full');
  const [targetPath, setTargetPath] = useState('/workspace/project');
  const { toast } = useToast();

  const handleRestore = (version: BackupVersion) => {
    setSelectedVersion(version);
    setShowRestoreDialog(true);
  };

  const handlePreview = (version: BackupVersion) => {
    toast({
      title: "Preview Mode",
      description: `Opening preview for ${version.version}. This will show changes without applying them.`,
    });
    // In a real implementation, this would open a diff viewer
  };

  const handleCompare = (version: BackupVersion) => {
    toast({
      title: "Compare Mode",
      description: `Opening comparison view for ${version.version} against current state.`,
    });
    // In a real implementation, this would open a comparison tool
  };

  const confirmRestore = () => {
    if (!selectedVersion) return;
    
    setShowRestoreDialog(false);
    setShowConfirmDialog(true);
  };

  const executeRestore = () => {
    if (!selectedVersion) return;
    
    const newOperation: RestoreOperation = {
      id: `restore-${Date.now()}`,
      backupId: selectedVersion.id,
      backupVersion: selectedVersion.version,
      status: 'running',
      progress: 0,
      startTime: new Date().toLocaleString(),
      restoredFiles: 0,
      totalFiles: selectedVersion.fileCount,
      errors: [],
      warnings: [],
      restoreType,
      targetPath
    };
    
    setCurrentOperation(newOperation);
    setShowConfirmDialog(false);
    
    toast({
      title: "Restore Started",
      description: `Restoring ${selectedVersion.version} to ${targetPath}`,
    });
    
    // Simulate progress
    const interval = setInterval(() => {
      setCurrentOperation(prev => {
        if (!prev || prev.progress >= 100) {
          clearInterval(interval);
          return prev ? { ...prev, status: 'completed', progress: 100 } : null;
        }
        return {
          ...prev,
          progress: Math.min(prev.progress + Math.random() * 10, 100),
          restoredFiles: Math.floor((prev.progress / 100) * prev.totalFiles),
          currentFile: `src/components/file-${Math.floor(Math.random() * 100)}.tsx`
        };
      });
    }, 1000);
  };

  const handleCancelOperation = () => {
    if (currentOperation) {
      setCurrentOperation({ ...currentOperation, status: 'cancelled' });
      toast({
        title: "Restore Cancelled",
        description: "The restore operation has been cancelled.",
      });
    }
  };

  const handlePauseOperation = () => {
    if (currentOperation) {
      setCurrentOperation({ ...currentOperation, status: 'pending' });
      toast({
        title: "Restore Paused",
        description: "The restore operation has been paused.",
      });
    }
  };

  const handleResumeOperation = () => {
    if (currentOperation) {
      setCurrentOperation({ ...currentOperation, status: 'running' });
      toast({
        title: "Restore Resumed",
        description: "The restore operation has been resumed.",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Development Restore</h2>
          <p className="text-muted-foreground">
            Restore your project to previous states with version control integration
          </p>
        </div>
      </div>

      {/* Development Notice */}
      <div className="p-4 bg-muted rounded-lg">
        <div className="flex items-start gap-2">
          <History className="h-4 w-4 mt-0.5 text-blue-500" />
          <div className="text-sm">
            <p className="font-medium">Development Restore</p>
            <p className="text-muted-foreground mt-1">
              Restore functionality designed for development workflows. Supports full project restoration, selective file recovery, and preview mode for safe rollbacks.
            </p>
          </div>
        </div>
      </div>

      {/* Current Operation */}
      {currentOperation && currentOperation.status !== 'completed' && (
        <RestoreProgress
          operation={currentOperation}
          onCancel={handleCancelOperation}
          onPause={handlePauseOperation}
          onResume={handleResumeOperation}
        />
      )}

      {/* Available Versions */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Available Backup Versions</h3>
        <div className="space-y-4">
          {versions.map((version) => (
            <VersionCard
              key={version.id}
              version={version}
              onRestore={handleRestore}
              onPreview={handlePreview}
              onCompare={handleCompare}
            />
          ))}
        </div>
      </div>

      {/* Restore Configuration Dialog */}
      <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configure Restore</DialogTitle>
            <DialogDescription>
              Configure restore settings for {selectedVersion?.version}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="restoreType">Restore Type</Label>
              <Select value={restoreType} onValueChange={(value: any) => setRestoreType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full Restore</SelectItem>
                  <SelectItem value="selective">Selective Files</SelectItem>
                  <SelectItem value="preview">Preview Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="targetPath">Target Path</Label>
              <Input
                id="targetPath"
                value={targetPath}
                onChange={(e) => setTargetPath(e.target.value)}
                placeholder="/workspace/project"
              />
            </div>
            
            {selectedVersion && (
              <div className="p-3 bg-muted rounded-lg">
                <h4 className="font-medium text-sm mb-2">Restore Summary</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Version: {selectedVersion.version}</p>
                  <p>Files: {selectedVersion.fileCount}</p>
                  <p>Size: {selectedVersion.size}</p>
                  <p>Type: {selectedVersion.type}</p>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRestoreDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmRestore}>
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Restore Operation</AlertDialogTitle>
            <AlertDialogDescription>
              This will restore your project to version {selectedVersion?.version}. 
              {restoreType === 'full' && 'All current changes will be overwritten.'}
              {restoreType === 'selective' && 'Selected files will be overwritten.'}
              {restoreType === 'preview' && 'No changes will be made - preview only.'}
              <br /><br />
              Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeRestore}>
              {restoreType === 'preview' ? 'Preview' : 'Restore'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}