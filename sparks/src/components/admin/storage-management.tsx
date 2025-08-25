'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  HardDrive,
  PieChart,
  BarChart3,
  Trash2,
  Archive,
  Settings,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Calendar,
  Database,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StorageStats {
  totalCapacity: string;
  usedSpace: string;
  availableSpace: string;
  usagePercentage: number;
  backupCount: number;
  averageBackupSize: string;
  compressionRatio: number;
  growthRate: string; // per month
}

interface StorageBreakdown {
  category: string;
  size: string;
  percentage: number;
  count: number;
  color: string;
}

interface RetentionPolicy {
  id: string;
  name: string;
  type: 'full' | 'incremental' | 'differential' | 'all';
  retentionDays: number;
  maxVersions?: number;
  compressionEnabled: boolean;
  autoCleanup: boolean;
  lastCleanup?: string;
  spaceSaved: string;
}

const MOCK_STORAGE_STATS: StorageStats = {
  totalCapacity: '0 GB',
  usedSpace: '0 GB',
  availableSpace: '0 GB',
  usagePercentage: 0,
  backupCount: 0,
  averageBackupSize: '0 GB',
  compressionRatio: 1.0,
  growthRate: '0 GB'
};

const MOCK_STORAGE_BREAKDOWN: StorageBreakdown[] = [
  {
    category: 'No Data',
    size: '0 GB',
    percentage: 0,
    count: 0,
    color: 'bg-gray-500'
  }
];

const MOCK_RETENTION_POLICIES: RetentionPolicy[] = [
  {
    id: '1',
    name: 'Default Policy',
    type: 'all',
    retentionDays: 30,
    compressionEnabled: false,
    autoCleanup: false,
    spaceSaved: '0 GB'
  }
];

export default function StorageManagement() {
  const { toast } = useToast();
  const [storageStats] = useState<StorageStats>(MOCK_STORAGE_STATS);
  const [storageBreakdown] = useState<StorageBreakdown[]>(MOCK_STORAGE_BREAKDOWN);
  const [retentionPolicies] = useState<RetentionPolicy[]>(MOCK_RETENTION_POLICIES);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Storage Management</h2>
          <p className="text-muted-foreground">
            Monitor and manage your backup storage usage
          </p>
        </div>
      </div>

      {/* Storage Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Capacity</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{storageStats.totalCapacity}</div>
            <p className="text-xs text-muted-foreground">
              Available: {storageStats.availableSpace}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Used Space</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{storageStats.usedSpace}</div>
            <Progress value={storageStats.usagePercentage} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Backup Count</CardTitle>
            <Archive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{storageStats.backupCount}</div>
            <p className="text-xs text-muted-foreground">
              Avg size: {storageStats.averageBackupSize}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{storageStats.growthRate}</div>
            <p className="text-xs text-muted-foreground">per month</p>
          </CardContent>
        </Card>
      </div>

      {/* Storage Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Storage Breakdown</CardTitle>
          <CardDescription>
            Detailed breakdown of storage usage by category
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {storageBreakdown.map((item, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className={cn("w-4 h-4 rounded", item.color)} />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{item.category}</span>
                    <span className="text-sm text-muted-foreground">{item.size}</span>
                  </div>
                  <Progress value={item.percentage} className="mt-1" />
                </div>
                <Badge variant="outline">{item.count} files</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Retention Policies */}
      <Card>
        <CardHeader>
          <CardTitle>Retention Policies</CardTitle>
          <CardDescription>
            Manage backup retention and cleanup policies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {retentionPolicies.map((policy) => (
              <div key={policy.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{policy.name}</span>
                    <Badge variant={policy.type === 'all' ? 'default' : 'secondary'}>
                      {policy.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Retention: {policy.retentionDays} days
                    {policy.maxVersions && ` • Max versions: ${policy.maxVersions}`}
                  </p>
                  <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                    <span>Compression: {policy.compressionEnabled ? 'Enabled' : 'Disabled'}</span>
                    <span>Auto cleanup: {policy.autoCleanup ? 'Enabled' : 'Disabled'}</span>
                    <span>Space saved: {policy.spaceSaved}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}