'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  History, 
  Eye, 
  Info, 
  Download, 
  Clock, 
  FileText,
  GitBranch,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BackupVersion {
  id: string;
  version: string;
  timestamp: string;
  description: string;
  size: string;
  changes: number;
  type: 'auto' | 'manual' | 'scheduled';
  status: 'completed' | 'in_progress' | 'failed';
}

// Mock backup data - in real app, this would come from the backup system
const MOCK_BACKUPS: BackupVersion[] = [
  {
    id: '1',
    version: 'BACKUP_001',
    timestamp: new Date().toISOString().replace('T', ' ').split('.')[0],
    description: 'Initial backup',
    size: '0 MB',
    changes: 0,
    type: 'manual',
    status: 'completed'
  }
];

interface BackupItemProps {
  backup: BackupVersion;
  onViewChanges: (backup: BackupVersion) => void;
  onViewInfo: (backup: BackupVersion) => void;
  onDownload: (backup: BackupVersion) => void;
}

function BackupItem({ backup, onViewChanges, onViewInfo, onDownload }: BackupItemProps) {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'auto': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'manual': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'scheduled': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <GitBranch className="h-4 w-4 text-muted-foreground" />
          <span className="font-mono font-medium">{backup.version}</span>
        </div>
        
        <div className="flex flex-col space-y-1">
          <p className="text-sm font-medium">{backup.description}</p>
          <div className="flex items-center space-x-3 text-xs text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span>{backup.timestamp}</span>
            </div>
            <div className="flex items-center space-x-1">
              <FileText className="h-3 w-3" />
              <span>{backup.size}</span>
            </div>
            <div className="flex items-center space-x-1">
              <span>{backup.changes} changes</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-3">
        <Badge className={cn('text-xs', getTypeColor(backup.type))}>
          {backup.type}
        </Badge>
        <Badge className={cn('text-xs', getStatusColor(backup.status))}>
          {backup.status}
        </Badge>
        
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewChanges(backup)}
            className="h-8 w-8 p-0"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewInfo(backup)}
            className="h-8 w-8 p-0"
          >
            <Info className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDownload(backup)}
            className="h-8 w-8 p-0"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function BackupHistory() {
  const [backups, setBackups] = useState<BackupVersion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading backup data
    const timer = setTimeout(() => {
      setBackups(MOCK_BACKUPS);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleViewChanges = (backup: BackupVersion) => {
    // Changes visualization implementation
  };

  const handleViewInfo = (backup: BackupVersion) => {
    // Detailed info modal implementation
  };

  const handleDownload = (backup: BackupVersion) => {
    // Backup download implementation
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Backup History
          </CardTitle>
          <CardDescription>
            Version history and backup management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Backup History
        </CardTitle>
        <CardDescription>
          Version history and backup management ({backups.length} versions)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {backups.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No backup versions found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {backups.map((backup) => (
              <BackupItem
                key={backup.id}
                backup={backup}
                onViewChanges={handleViewChanges}
                onViewInfo={handleViewInfo}
                onDownload={handleDownload}
              />
            ))}
          </div>
        )}
        
        <Separator />
        
        <div className="flex justify-between items-center pt-2">
          <div className="text-sm text-muted-foreground">
            Total storage: {backups.reduce((acc, backup) => {
              const size = parseFloat(backup.size.replace(' MB', ''));
              return acc + size;
            }, 0).toFixed(1)} MB
          </div>
          <Button variant="outline" size="sm">
            Create Manual Backup
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}