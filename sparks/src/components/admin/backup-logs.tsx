'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import {
  FileText,
  Download,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Database,
  Terminal,
  Bug,
  Info,
  AlertTriangle,
  Activity,
  BarChart3,
  TrendingUp,
  Calendar,
  Timer,
  HardDrive,
  Cpu,
  MemoryStick,
  Network
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'debug' | 'info' | 'warning' | 'error' | 'success';
  category: 'backup' | 'restore' | 'cleanup' | 'system' | 'trigger' | 'storage';
  operation: string;
  message: string;
  details?: {
    duration?: number; // milliseconds
    filesProcessed?: number;
    bytesProcessed?: number;
    compressionRatio?: number;
    errorCode?: string;
    stackTrace?: string;
    metadata?: Record<string, any>;
  };
  source: 'cli' | 'ide' | 'trigger' | 'manual' | 'scheduler';
  projectPath?: string;
  backupId?: string;
}

interface PerformanceMetric {
  id: string;
  timestamp: string;
  operation: string;
  duration: number; // milliseconds
  cpuUsage: number; // percentage
  memoryUsage: number; // MB
  diskIO: number; // MB/s
  networkIO?: number; // MB/s
  filesProcessed: number;
  bytesProcessed: number;
  compressionRatio?: number;
  success: boolean;
}

interface LogStats {
  totalEntries: number;
  errorCount: number;
  warningCount: number;
  successCount: number;
  averageDuration: number;
  totalBytesProcessed: number;
  averageCompressionRatio: number;
  mostActiveCategory: string;
  peakPerformanceTime: string;
}

const MOCK_LOGS: LogEntry[] = [
  {
    id: '1',
    timestamp: new Date().toISOString(),
    level: 'info',
    category: 'system',
    operation: 'System Start',
    message: 'Backup system initialized',
    source: 'scheduler'
  }
];

const MOCK_PERFORMANCE: PerformanceMetric[] = [
  {
    id: '1',
    timestamp: new Date().toISOString(),
    operation: 'System Check',
    duration: 0,
    cpuUsage: 0,
    memoryUsage: 0,
    diskIO: 0,
    filesProcessed: 0,
    bytesProcessed: 0,
    success: true
  }
];

const MOCK_STATS: LogStats = {
  totalEntries: 0,
  errorCount: 0,
  warningCount: 0,
  successCount: 0,
  averageDuration: 0,
  totalBytesProcessed: 0,
  averageCompressionRatio: 0,
  mostActiveCategory: 'system',
  peakPerformanceTime: new Date().toTimeString().split(' ')[0]
};

function getLevelIcon(level: LogEntry['level']) {
  switch (level) {
    case 'success': return CheckCircle;
    case 'error': return XCircle;
    case 'warning': return AlertTriangle;
    case 'info': return Info;
    case 'debug': return Bug;
    default: return Info;
  }
}

function getLevelColor(level: LogEntry['level']) {
  switch (level) {
    case 'success': return 'text-green-600';
    case 'error': return 'text-red-600';
    case 'warning': return 'text-yellow-600';
    case 'info': return 'text-blue-600';
    case 'debug': return 'text-gray-600';
    default: return 'text-gray-600';
  }
}

function getCategoryIcon(category: LogEntry['category']) {
  switch (category) {
    case 'backup': return Database;
    case 'restore': return RefreshCw;
    case 'cleanup': return FileText;
    case 'system': return Cpu;
    case 'trigger': return Zap;
    case 'storage': return HardDrive;
    default: return Activity;
  }
}

function getSourceIcon(source: LogEntry['source']) {
  switch (source) {
    case 'cli': return Terminal;
    case 'ide': return Activity;
    case 'trigger': return Zap;
    case 'manual': return Info;
    case 'scheduler': return Clock;
    default: return Activity;
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

interface LogEntryCardProps {
  log: LogEntry;
  onViewDetails: (log: LogEntry) => void;
}

function LogEntryCard({ log, onViewDetails }: LogEntryCardProps) {
  const LevelIcon = getLevelIcon(log.level);
  const CategoryIcon = getCategoryIcon(log.category);
  const SourceIcon = getSourceIcon(log.source);
  
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onViewDetails(log)}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className={cn('p-1 rounded-full', getLevelColor(log.level))}>
            <LevelIcon className="h-4 w-4" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-2">
                <CategoryIcon className="h-3 w-3 text-muted-foreground" />
                <span className="text-sm font-medium">{log.operation}</span>
                <Badge variant="outline" className="text-xs">
                  {log.category}
                </Badge>
              </div>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <SourceIcon className="h-3 w-3" />
                <span>{log.source}</span>
                <span>•</span>
                <span>{log.timestamp}</span>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
              {log.message}
            </p>
            
            {log.details && (
              <div className="flex flex-wrap gap-2 text-xs">
                {log.details.duration && (
                  <Badge variant="outline" className="text-xs">
                    <Timer className="h-3 w-3 mr-1" />
                    {formatDuration(log.details.duration)}
                  </Badge>
                )}
                {log.details.filesProcessed && (
                  <Badge variant="outline" className="text-xs">
                    <FileText className="h-3 w-3 mr-1" />
                    {log.details.filesProcessed} files
                  </Badge>
                )}
                {log.details.bytesProcessed && (
                  <Badge variant="outline" className="text-xs">
                    <HardDrive className="h-3 w-3 mr-1" />
                    {formatBytes(log.details.bytesProcessed)}
                  </Badge>
                )}
                {log.details.compressionRatio && (
                  <Badge variant="outline" className="text-xs">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {(log.details.compressionRatio * 100).toFixed(0)}% compressed
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface PerformanceCardProps {
  metric: PerformanceMetric;
}

function PerformanceCard({ metric }: PerformanceCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className={cn(
              'p-1 rounded-full',
              metric.success ? 'text-green-600' : 'text-red-600'
            )}>
              {metric.success ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            </div>
            <span className="font-medium">{metric.operation}</span>
          </div>
          <span className="text-xs text-muted-foreground">{metric.timestamp}</span>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center space-x-1">
            <Timer className="h-3 w-3 text-muted-foreground" />
            <span>{formatDuration(metric.duration)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Cpu className="h-3 w-3 text-muted-foreground" />
            <span>{metric.cpuUsage.toFixed(1)}% CPU</span>
          </div>
          <div className="flex items-center space-x-1">
            <MemoryStick className="h-3 w-3 text-muted-foreground" />
            <span>{metric.memoryUsage} MB</span>
          </div>
          <div className="flex items-center space-x-1">
            <HardDrive className="h-3 w-3 text-muted-foreground" />
            <span>{metric.diskIO.toFixed(1)} MB/s</span>
          </div>
        </div>
        
        <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
          {metric.filesProcessed} files • {formatBytes(metric.bytesProcessed)}
          {metric.compressionRatio && (
            <span> • {(metric.compressionRatio * 100).toFixed(0)}% compressed</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function BackupLogs() {
  const [logs, setLogs] = useState<LogEntry[]>(MOCK_LOGS);
  const [performance] = useState<PerformanceMetric[]>(MOCK_PERFORMANCE);
  const [stats] = useState<LogStats>(MOCK_STATS);
  const [activeTab, setActiveTab] = useState<'logs' | 'performance' | 'analytics'>('logs');
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [showLogDetails, setShowLogDetails] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const { toast } = useToast();

  const handleViewLogDetails = (log: LogEntry) => {
    setSelectedLog(log);
    setShowLogDetails(true);
  };

  const handleRefreshLogs = () => {
    toast({
      title: "Logs Refreshed",
      description: "Latest log entries have been loaded.",
    });
    // In a real implementation, this would fetch fresh logs
  };

  const handleExportLogs = () => {
    toast({
      title: "Export Started",
      description: "Preparing log export file...",
    });
    // In a real implementation, this would generate and download a log file
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = searchQuery === '' || 
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.operation.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesLevel = levelFilter === 'all' || log.level === levelFilter;
    const matchesCategory = categoryFilter === 'all' || log.category === categoryFilter;
    const matchesSource = sourceFilter === 'all' || log.source === sourceFilter;
    
    return matchesSearch && matchesLevel && matchesCategory && matchesSource;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Development Logs & Analytics</h2>
          <p className="text-muted-foreground">
            Monitor backup operations, performance metrics, and system health for development workflows
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleRefreshLogs} className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </Button>
          <Button variant="outline" onClick={handleExportLogs} className="flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
        <Button
          variant={activeTab === 'logs' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('logs')}
          className="flex items-center space-x-2"
        >
          <FileText className="h-4 w-4" />
          <span>Activity Logs</span>
        </Button>
        <Button
          variant={activeTab === 'performance' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('performance')}
          className="flex items-center space-x-2"
        >
          <BarChart3 className="h-4 w-4" />
          <span>Performance</span>
        </Button>
        <Button
          variant={activeTab === 'analytics' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('analytics')}
          className="flex items-center space-x-2"
        >
          <TrendingUp className="h-4 w-4" />
          <span>Analytics</span>
        </Button>
      </div>

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <div className="space-y-2">
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search logs..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="level">Level</Label>
                  <Select value={levelFilter} onValueChange={setLevelFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="debug">Debug</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="backup">Backup</SelectItem>
                      <SelectItem value="restore">Restore</SelectItem>
                      <SelectItem value="cleanup">Cleanup</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                      <SelectItem value="trigger">Trigger</SelectItem>
                      <SelectItem value="storage">Storage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="source">Source</Label>
                  <Select value={sourceFilter} onValueChange={setSourceFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sources</SelectItem>
                      <SelectItem value="cli">CLI</SelectItem>
                      <SelectItem value="ide">IDE</SelectItem>
                      <SelectItem value="trigger">Trigger</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="scheduler">Scheduler</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery('');
                      setLevelFilter('all');
                      setCategoryFilter('all');
                      setSourceFilter('all');
                    }}
                    className="flex items-center space-x-2"
                  >
                    <Filter className="h-4 w-4" />
                    <span>Clear</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Log Entries */}
          <div className="space-y-2">
            {filteredLogs.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No log entries match your filters.</p>
                </CardContent>
              </Card>
            ) : (
              filteredLogs.map((log) => (
                <LogEntryCard
                  key={log.id}
                  log={log}
                  onViewDetails={handleViewLogDetails}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {performance.map((metric) => (
              <PerformanceCard key={metric.id} metric={metric} />
            ))}
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalEntries.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.successCount} successful operations
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {((stats.errorCount / stats.totalEntries) * 100).toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.errorCount} errors, {stats.warningCount} warnings
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
                <Timer className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatDuration(stats.averageDuration)}</div>
                <p className="text-xs text-muted-foreground">
                  Peak at {stats.peakPerformanceTime}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Data Processed</CardTitle>
                <HardDrive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatBytes(stats.totalBytesProcessed)}</div>
                <p className="text-xs text-muted-foreground">
                  {(stats.averageCompressionRatio * 100).toFixed(0)}% avg compression
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Activity Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Breakdown</CardTitle>
              <CardDescription>
                Distribution of backup operations by category and success rate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm">
                  <span className="font-medium">Most Active Category:</span>
                  <Badge className="ml-2">{stats.mostActiveCategory}</Badge>
                </div>
                
                <div className="grid gap-2">
                  {['backup', 'restore', 'cleanup', 'system', 'trigger', 'storage'].map((category) => {
                    const categoryLogs = logs.filter(log => log.category === category);
                    const successRate = categoryLogs.length > 0 
                      ? (categoryLogs.filter(log => log.level === 'success').length / categoryLogs.length) * 100
                      : 0;
                    
                    return (
                      <div key={category} className="flex items-center justify-between p-2 bg-muted rounded">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-blue-500 rounded-full" />
                          <span className="capitalize text-sm">{category}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <span>{categoryLogs.length} entries</span>
                          <span>•</span>
                          <span>{successRate.toFixed(0)}% success</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Log Details Dialog */}
      <Dialog open={showLogDetails} onOpenChange={setShowLogDetails}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              {selectedLog && (
                <>
                  <div className={cn('p-1 rounded-full', getLevelColor(selectedLog.level))}>
                    {(() => {
                      const Icon = getLevelIcon(selectedLog.level);
                      return <Icon className="h-4 w-4" />;
                    })()}
                  </div>
                  <span>{selectedLog.operation}</span>
                  <Badge variant="outline">{selectedLog.level}</Badge>
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedLog?.timestamp} • {selectedLog?.source} • {selectedLog?.category}
            </DialogDescription>
          </DialogHeader>
          
          {selectedLog && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Message</h4>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                    {selectedLog.message}
                  </p>
                </div>
                
                {selectedLog.projectPath && (
                  <div>
                    <h4 className="font-medium mb-2">Project Path</h4>
                    <p className="text-sm font-mono bg-muted p-2 rounded break-all">
                      {selectedLog.projectPath}
                    </p>
                  </div>
                )}
                
                {selectedLog.backupId && (
                  <div>
                    <h4 className="font-medium mb-2">Backup ID</h4>
                    <p className="text-sm font-mono bg-muted p-2 rounded">
                      {selectedLog.backupId}
                    </p>
                  </div>
                )}
                
                {selectedLog.details && (
                  <div>
                    <h4 className="font-medium mb-2">Details</h4>
                    <div className="space-y-2">
                      {selectedLog.details.duration && (
                        <div className="flex justify-between text-sm">
                          <span>Duration:</span>
                          <span>{formatDuration(selectedLog.details.duration)}</span>
                        </div>
                      )}
                      {selectedLog.details.filesProcessed !== undefined && (
                        <div className="flex justify-between text-sm">
                          <span>Files Processed:</span>
                          <span>{selectedLog.details.filesProcessed.toLocaleString()}</span>
                        </div>
                      )}
                      {selectedLog.details.bytesProcessed && (
                        <div className="flex justify-between text-sm">
                          <span>Bytes Processed:</span>
                          <span>{formatBytes(selectedLog.details.bytesProcessed)}</span>
                        </div>
                      )}
                      {selectedLog.details.compressionRatio && (
                        <div className="flex justify-between text-sm">
                          <span>Compression Ratio:</span>
                          <span>{(selectedLog.details.compressionRatio * 100).toFixed(0)}%</span>
                        </div>
                      )}
                      {selectedLog.details.errorCode && (
                        <div className="flex justify-between text-sm">
                          <span>Error Code:</span>
                          <span className="font-mono">{selectedLog.details.errorCode}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {selectedLog.details?.stackTrace && (
                  <div>
                    <h4 className="font-medium mb-2">Stack Trace</h4>
                    <pre className="text-xs bg-muted p-3 rounded overflow-x-auto whitespace-pre-wrap">
                      {selectedLog.details.stackTrace}
                    </pre>
                  </div>
                )}
                
                {selectedLog.details?.metadata && (
                  <div>
                    <h4 className="font-medium mb-2">Metadata</h4>
                    <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                      {JSON.stringify(selectedLog.details.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}