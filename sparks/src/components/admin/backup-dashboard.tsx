'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  HardDrive, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Activity,
  Download,
  Upload,
  Settings,
  Calendar,
  BarChart3,
  Shield,
  RefreshCw,
  Play,
  Pause,
  Archive,
  Terminal,
  Code,
  GitBranch
} from 'lucide-react';
import { cn } from '@/lib/utils';
import BackupHistory from './backup-history';

interface BackupStatus {
  isRunning: boolean;
  lastBackup: string;
  nextScheduled: string;
  totalBackups: number;
  successRate: number;
  storageUsed: string;
  storageLimit: string;
  storagePercentage: number;
}

interface BackupStats {
  today: number;
  thisWeek: number;
  thisMonth: number;
  failed: number;
  avgSize: string;
  avgDuration: string;
}

// Placeholder data - replace with actual backup engine integration
const MOCK_STATUS: BackupStatus = {
  isRunning: false,
  lastBackup: new Date().toISOString(),
  nextScheduled: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  totalBackups: 0,
  successRate: 100,
  storageUsed: '0 MB',
  storageLimit: '1 GB',
  storagePercentage: 0
};

const MOCK_STATS: BackupStats = {
  today: 0,
  thisWeek: 0,
  thisMonth: 0,
  failed: 0,
  avgSize: '0 MB',
  avgDuration: '0s'
};

interface StatusCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  status?: 'success' | 'warning' | 'error' | 'info';
}

function StatusCard({ title, value, description, icon: Icon, status = 'info' }: StatusCardProps) {
  const statusColors = {
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    error: 'text-red-600 dark:text-red-400',
    info: 'text-blue-600 dark:text-blue-400'
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={cn('h-4 w-4', statusColors[status])} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

interface StorageVisualizationProps {
  used: number;
  total: number;
  usedLabel: string;
  totalLabel: string;
}

function StorageVisualization({ used, total, usedLabel, totalLabel }: StorageVisualizationProps) {
  const percentage = (used / total) * 100;
  const getStorageStatus = () => {
    if (percentage < 50) return { color: 'bg-green-500', status: 'Healthy' };
    if (percentage < 80) return { color: 'bg-yellow-500', status: 'Warning' };
    return { color: 'bg-red-500', status: 'Critical' };
  };

  const { color, status } = getStorageStatus();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HardDrive className="h-5 w-5" />
          Storage Usage
        </CardTitle>
        <CardDescription>Current backup storage utilization</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Used: {usedLabel}</span>
            <span>Total: {totalLabel}</span>
          </div>
          <Progress value={percentage} className="h-3" />
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              {percentage.toFixed(1)}% used
            </span>
            <Badge variant={status === 'Healthy' ? 'default' : status === 'Warning' ? 'secondary' : 'destructive'}>
              {status}
            </Badge>
          </div>
        </div>
        
        <Separator />
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-medium">Available</div>
            <div className="text-muted-foreground">{(total - used).toFixed(1)} GB</div>
          </div>
          <div>
            <div className="font-medium">Retention</div>
            <div className="text-muted-foreground">30 days</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface QuickActionsProps {
  onCreateBackup: () => void;
  onScheduleBackup: () => void;
  onManageStorage: () => void;
  onViewSettings: () => void;
  isBackupRunning: boolean;
}

function QuickActions({ 
  onCreateBackup, 
  onScheduleBackup, 
  onManageStorage, 
  onViewSettings,
  isBackupRunning 
}: QuickActionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Quick Actions
        </CardTitle>
        <CardDescription>Common backup operations</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button 
          onClick={onCreateBackup} 
          className="w-full justify-start" 
          disabled={isBackupRunning}
        >
          {isBackupRunning ? (
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Play className="mr-2 h-4 w-4" />
          )}
          {isBackupRunning ? 'Creating Backup...' : 'Create Manual Backup'}
        </Button>
        
        <Button onClick={onScheduleBackup} variant="outline" className="w-full justify-start">
          <Terminal className="mr-2 h-4 w-4" />
          CLI Auto-trigger
        </Button>
        
        <Button onClick={onManageStorage} variant="outline" className="w-full justify-start">
          <GitBranch className="mr-2 h-4 w-4" />
          Branch Backup
        </Button>
        
        <Button onClick={onViewSettings} variant="outline" className="w-full justify-start">
          <Code className="mr-2 h-4 w-4" />
          IDE Integration
        </Button>
      </CardContent>
    </Card>
  );
}

export default function BackupDashboard() {
  const [status, setStatus] = useState<BackupStatus>(MOCK_STATUS);
  const [stats, setStats] = useState<BackupStats>(MOCK_STATS);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'history'>('overview');

  useEffect(() => {
    // Simulate loading backup status
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleCreateBackup = async () => {
    setStatus(prev => ({ ...prev, isRunning: true }));
    
    // Simulate backup creation
    setTimeout(() => {
      setStatus(prev => ({
        ...prev,
        isRunning: false,
        lastBackup: new Date().toLocaleString(),
        totalBackups: prev.totalBackups + 1
      }));
      setStats(prev => ({
        ...prev,
        today: prev.today + 1,
        thisWeek: prev.thisWeek + 1,
        thisMonth: prev.thisMonth + 1
      }));
    }, 3000);
  };

  const handleScheduleBackup = () => {
    // Backup scheduler implementation
  };

  const handleManageStorage = () => {
    // Storage management implementation
  };

  const handleViewSettings = () => {
    // Backup settings implementation
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Backup Dashboard</h2>
            <p className="text-muted-foreground">Monitor and manage your backup system</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent className="animate-pulse">
                <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-muted rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Backup Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor and manage your backup system
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={activeTab === 'overview' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('overview')}
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            Overview
          </Button>
          <Button
            variant={activeTab === 'history' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('history')}
          >
            <Clock className="mr-2 h-4 w-4" />
            History
          </Button>
        </div>
      </div>

      {/* Status Alert */}
      {status.successRate < 95 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Backup success rate is below 95%. Consider reviewing failed backups and system health.
          </AlertDescription>
        </Alert>
      )}

      {activeTab === 'overview' ? (
        <>
          {/* Status Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatusCard
              title="Last Backup"
              value={status.lastBackup}
              description="Most recent backup completion"
              icon={Clock}
              status="success"
            />
            <StatusCard
              title="Success Rate"
              value={`${status.successRate}%`}
              description="Backup reliability over 30 days"
              icon={CheckCircle}
              status={status.successRate >= 95 ? 'success' : 'warning'}
            />
            <StatusCard
              title="Total Backups"
              value={status.totalBackups}
              description="All-time backup count"
              icon={Archive}
              status="info"
            />
            <StatusCard
              title="Storage Used"
              value={status.storageUsed}
              description={`${status.storagePercentage}% of ${status.storageLimit}`}
              icon={HardDrive}
              status={status.storagePercentage > 80 ? 'warning' : 'success'}
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Storage Visualization */}
            <div className="lg:col-span-2">
              <StorageVisualization
                used={parseFloat(status.storageUsed)}
                total={parseFloat(status.storageLimit)}
                usedLabel={status.storageUsed}
                totalLabel={status.storageLimit}
              />
            </div>

            {/* Quick Actions */}
            <QuickActions
              onCreateBackup={handleCreateBackup}
              onScheduleBackup={handleScheduleBackup}
              onManageStorage={handleManageStorage}
              onViewSettings={handleViewSettings}
              isBackupRunning={status.isRunning}
            />
          </div>

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Backup Statistics
              </CardTitle>
              <CardDescription>Recent backup activity and performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.today}</div>
                  <div className="text-sm text-muted-foreground">Today</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.thisWeek}</div>
                  <div className="text-sm text-muted-foreground">This Week</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{stats.thisMonth}</div>
                  <div className="text-sm text-muted-foreground">This Month</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
                  <div className="text-sm text-muted-foreground">Failed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{stats.avgSize}</div>
                  <div className="text-sm text-muted-foreground">Avg Size</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-teal-600">{stats.avgDuration}</div>
                  <div className="text-sm text-muted-foreground">Avg Duration</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        /* Backup History Tab */
        <BackupHistory />
      )}
    </div>
  );
}