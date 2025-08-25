'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AnalyticsDashboard } from '@/components/analytics/analytics-dashboard';
import { useAnalytics } from '@/hooks/use-analytics';
import { analyticsIntegrationManager } from '@/lib/analytics-integrations';
import { DataExporter, EventProcessor, PerformanceAnalyzer } from '@/lib/analytics-utils';
import { logger } from '@/lib/logger';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Activity, 
  Download, 
  RefreshCw, 
  Settings, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Database,
  Zap
} from 'lucide-react';

interface IntegrationStatus {
  name: string;
  enabled: boolean;
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: Date;
  eventCount?: number;
  error?: string;
}

interface AnalyticsStats {
  totalEvents: number;
  totalUsers: number;
  totalSessions: number;
  avgSessionDuration: number;
  bounceRate: number;
  conversionRate: number;
  topEvents: Array<{ name: string; count: number }>;
  recentActivity: Array<{ timestamp: Date; event: string; user?: string }>;
}

export default function AnalyticsAdminPage() {
  const { trackEvent } = useAnalytics();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalyticsData();
    loadIntegrationStatus();
  }, [selectedTimeRange]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/analytics?range=${selectedTimeRange}`);
      if (!response.ok) {
        throw new Error(`Failed to load analytics: ${response.statusText}`);
      }

      const data = await response.json();
      setStats(data.stats);
    } catch (error) {
      logger.error('Failed to load analytics data', { error });
      setError(error instanceof Error ? error.message : 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const loadIntegrationStatus = async () => {
    try {
      const enabledIntegrations = analyticsIntegrationManager.getEnabledIntegrations();
      const integrationStatuses: IntegrationStatus[] = [];

      // Check each integration status
      for (const integrationName of enabledIntegrations) {
        const integration = analyticsIntegrationManager.getIntegration(integrationName);
        if (integration) {
          integrationStatuses.push({
            name: integration.getName(),
            enabled: integration.isEnabled(),
            status: integration.isEnabled() ? 'connected' : 'disconnected',
            lastSync: new Date(), // Would be actual last sync time in real implementation
            eventCount: Math.floor(Math.random() * 10000) // Mock data
          });
        }
      }

      // Add some mock integrations for demonstration
      if (integrationStatuses.length === 0) {
        integrationStatuses.push(
          {
            name: 'Google Analytics',
            enabled: true,
            status: 'connected',
            lastSync: new Date(Date.now() - 5 * 60 * 1000),
            eventCount: 1234
          },
          {
            name: 'Mixpanel',
            enabled: false,
            status: 'disconnected',
            eventCount: 0
          },
          {
            name: 'Custom Analytics',
            enabled: true,
            status: 'connected',
            lastSync: new Date(Date.now() - 2 * 60 * 1000),
            eventCount: 5678
          }
        );
      }

      setIntegrations(integrationStatuses);
    } catch (error) {
      logger.error('Failed to load integration status', { error });
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadAnalyticsData(),
      loadIntegrationStatus()
    ]);
    setRefreshing(false);
    
    trackEvent({
      type: 'admin_action',
      category: 'analytics',
      label: 'refresh_dashboard',
      properties: { timeRange: selectedTimeRange }
    });
  };

  const handleExport = async () => {
    try {
      const response = await fetch(`/api/analytics?range=${selectedTimeRange}&format=${exportFormat}`);
      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      if (exportFormat === 'csv') {
        const csvData = await response.text();
        const blob = new Blob([csvData], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `analytics-${selectedTimeRange}-${Date.now()}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        const jsonData = await response.json();
        DataExporter.exportToJSON(jsonData, `analytics-${selectedTimeRange}-${Date.now()}.json`);
      }

      trackEvent({
        type: 'admin_action',
        category: 'analytics',
        label: 'export_data',
        properties: { format: exportFormat, timeRange: selectedTimeRange }
      });
    } catch (error) {
      logger.error('Failed to export analytics data', { error });
      setError('Failed to export data');
    }
  };

  const handleClearData = async () => {
    if (!confirm('Are you sure you want to clear analytics data? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('/api/analytics', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ confirm: true })
      });

      if (!response.ok) {
        throw new Error('Failed to clear data');
      }

      await loadAnalyticsData();
      
      trackEvent({
        type: 'admin_action',
        category: 'analytics',
        label: 'clear_data',
        properties: { timeRange: selectedTimeRange }
      });
    } catch (error) {
      logger.error('Failed to clear analytics data', { error });
      setError('Failed to clear data');
    }
  };

  const getStatusIcon = (status: IntegrationStatus['status']) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <XCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: IntegrationStatus['status']) => {
    switch (status) {
      case 'connected':
        return <Badge variant="default" className="bg-green-100 text-green-800">Connected</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">Disconnected</Badge>;
    }
  };

  if (loading && !stats) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading analytics data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Monitor and analyze application usage and performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Quick Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEvents.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Session</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(stats.avgSessionDuration / 60)}m
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(stats.conversionRate * 100).toFixed(1)}%
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="export">Export & Tools</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <AnalyticsDashboard />
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Integration Status
              </CardTitle>
              <CardDescription>
                Monitor the status of your analytics integrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {integrations.map((integration, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(integration.status)}
                      <div>
                        <h3 className="font-medium">{integration.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {integration.eventCount?.toLocaleString() || 0} events tracked
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {integration.lastSync && (
                        <span className="text-sm text-muted-foreground">
                          Last sync: {integration.lastSync.toLocaleTimeString()}
                        </span>
                      )}
                      {getStatusBadge(integration.status)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Export Data
                </CardTitle>
                <CardDescription>
                  Export analytics data for external analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="export-format">Export Format</Label>
                  <Select value={exportFormat} onValueChange={(value: 'csv' | 'json') => setExportFormat(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleExport} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Data Management
                </CardTitle>
                <CardDescription>
                  Manage your analytics data storage
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Clearing data will permanently remove all analytics records. This action cannot be undone.
                  </AlertDescription>
                </Alert>
                <Button 
                  variant="destructive" 
                  onClick={handleClearData}
                  className="w-full"
                >
                  <Database className="h-4 w-4 mr-2" />
                  Clear All Data
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}