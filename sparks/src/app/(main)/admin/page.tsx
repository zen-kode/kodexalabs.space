'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  LayoutDashboard, 
  Users, 
  Activity, 
  BarChart3, 
  Settings, 
  FileText, 
  Download,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  HardDrive,
  RefreshCw,
  Bell,
  Archive,
  Terminal
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { 
  ExtendedUser, 
  createExtendedUser, 
  canAccessAdminPanel, 
  getAvailableNavItems,
  AdminNavItem,
  createAuditLog
} from '@/lib/auth-roles';
import { cn } from '@/lib/utils';
import BackupHistory from '@/components/admin/backup-history';
import BackupDashboard from '@/components/admin/backup-dashboard';
import BackupScheduler from '@/components/admin/backup-scheduler';
import BackupNotifications from '@/components/admin/backup-notifications';
import BackupRestore from '@/components/admin/backup-restore';
import BackupStorage from '@/components/admin/backup-storage';
import BackupLogs from '@/components/admin/backup-logs';
import TaskNotepad from '@/components/admin/task-notepad';

// Mock system metrics (in real app, these would come from APIs)
const SYSTEM_METRICS = {
  totalUsers: 0,
  activeUsers: 0,
  totalPrompts: 0,
  aiProcessingJobs: 0,
  systemUptime: '0%',
  avgResponseTime: '0ms',
  errorRate: '0%',
  storageUsed: '0GB'
};

const RECENT_ACTIVITIES = [
  {
    id: '1',
    user: 'user@kodexalabs.space',
    action: 'No recent activity',
    timestamp: 'Never',
    type: 'info'
  }
];

interface QuickActionProps {
  item: AdminNavItem;
  onClick: () => void;
}

function QuickAction({ item, onClick }: QuickActionProps) {
  const iconMap = {
    LayoutDashboard,
    Users,
    Activity,
    BarChart3,
    Settings,
    FileText,
    Download
  };
  
  const Icon = iconMap[item.icon as keyof typeof iconMap] || Settings;

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-sm">{item.label}</h3>
            <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  description: string;
  trend?: 'up' | 'down' | 'stable';
  icon: React.ComponentType<{ className?: string }>;
}

function MetricCard({ title, value, description, trend, icon: Icon }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          </div>
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
        {trend && (
          <div className="mt-2">
            <Badge 
              variant={trend === 'up' ? 'default' : trend === 'down' ? 'destructive' : 'secondary'}
              className="text-xs"
            >
              {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'} {trend}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [extendedUser, setExtendedUser] = useState<ExtendedUser | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [availableNavItems, setAvailableNavItems] = useState<AdminNavItem[]>([]);
  const [activeBackupTab, setActiveBackupTab] = useState<'dashboard' | 'scheduler' | 'restore' | 'storage' | 'notifications' | 'logs'>('dashboard');

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    // Create extended user with role and permissions
    const extended = createExtendedUser(user);
    setExtendedUser(extended);

    // Check if user can access admin panel
    const authorized = canAccessAdminPanel(extended);
    setIsAuthorized(authorized);

    if (!authorized) {
      router.push('/dashboard');
      return;
    }

    // Get available navigation items
    const navItems = getAvailableNavItems(extended);
    setAvailableNavItems(navItems);

    // Log admin panel access
    const auditLog = createAuditLog(
      extended,
      'ACCESS_ADMIN_PANEL',
      'admin_dashboard',
      true,
      { timestamp: new Date().toISOString() }
    );
    // Admin access logging implementation
  }, [user, loading, router]);

  const handleNavigation = (href: string) => {
    router.push(href);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Access Denied. You don't have permission to access the admin panel.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-4xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Admin Dashboard
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Welcome back, {extendedUser?.name || extendedUser?.email}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="capitalize">
              {extendedUser?.role}
            </Badge>
            <Badge variant="secondary">
              {availableNavItems.length} modules available
            </Badge>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Last login</p>
          <p className="text-sm font-medium">
            {extendedUser?.lastLogin 
              ? new Date(extendedUser.lastLogin).toLocaleString()
              : 'First time'
            }
          </p>
        </div>
      </div>

      <Separator />

      {/* System Status Alert */}
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          All systems operational. Uptime: {SYSTEM_METRICS.systemUptime} | 
          Response time: {SYSTEM_METRICS.avgResponseTime} | 
          Error rate: {SYSTEM_METRICS.errorRate}
        </AlertDescription>
      </Alert>

      {/* Key Metrics */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-4">System Overview</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Users"
            value={SYSTEM_METRICS.totalUsers.toLocaleString()}
            description="Registered accounts"
            trend="up"
            icon={Users}
          />
          <MetricCard
            title="Active Users"
            value={SYSTEM_METRICS.activeUsers.toLocaleString()}
            description="Last 30 days"
            trend="up"
            icon={Activity}
          />
          <MetricCard
            title="Total Prompts"
            value={SYSTEM_METRICS.totalPrompts.toLocaleString()}
            description="Created by users"
            trend="up"
            icon={FileText}
          />
          <MetricCard
            title="AI Jobs"
            value={SYSTEM_METRICS.aiProcessingJobs.toLocaleString()}
            description="Currently processing"
            trend="stable"
            icon={BarChart3}
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {availableNavItems.slice(1).map((item) => (
            <QuickAction
              key={item.id}
              item={item}
              onClick={() => handleNavigation(item.href)}
            />
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest system events and user actions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {RECENT_ACTIVITIES.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-3">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  activity.type === 'success' && "bg-green-500",
                  activity.type === 'warning' && "bg-yellow-500",
                  activity.type === 'info' && "bg-blue-500"
                )} />
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.action}</p>
                  <p className="text-xs text-muted-foreground">{activity.user}</p>
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {activity.timestamp}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>Current system performance metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">System Uptime</span>
                <Badge variant="outline">{SYSTEM_METRICS.systemUptime}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Average Response Time</span>
                <Badge variant="outline">{SYSTEM_METRICS.avgResponseTime}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Error Rate</span>
                <Badge variant="outline">{SYSTEM_METRICS.errorRate}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Storage Used</span>
                <Badge variant="outline">{SYSTEM_METRICS.storageUsed}</Badge>
              </div>
            </div>
            <Separator />
            <div className="pt-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => handleNavigation('/admin/system')}
              >
                View Detailed Status
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Development Backup Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Development Backup Management
          </CardTitle>
          <CardDescription>
            Comprehensive backup system for development workflows and IDE integration
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Backup Tab Navigation */}
          <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit mb-6">
            <Button
              variant={activeBackupTab === 'dashboard' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveBackupTab('dashboard')}
              className="flex items-center space-x-2"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard</span>
            </Button>
            <Button
              variant={activeBackupTab === 'scheduler' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveBackupTab('scheduler')}
              className="flex items-center space-x-2"
            >
              <Clock className="h-4 w-4" />
              <span>Triggers</span>
            </Button>
            <Button
              variant={activeBackupTab === 'restore' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveBackupTab('restore')}
              className="flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Restore</span>
            </Button>
            <Button
              variant={activeBackupTab === 'storage' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveBackupTab('storage')}
              className="flex items-center space-x-2"
            >
              <HardDrive className="h-4 w-4" />
              <span>Storage</span>
            </Button>
            <Button
              variant={activeBackupTab === 'notifications' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveBackupTab('notifications')}
              className="flex items-center space-x-2"
            >
              <Bell className="h-4 w-4" />
              <span>Notifications</span>
            </Button>
            <Button
              variant={activeBackupTab === 'logs' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveBackupTab('logs')}
              className="flex items-center space-x-2"
            >
              <Terminal className="h-4 w-4" />
              <span>Logs</span>
            </Button>
          </div>
          
          {/* Backup Tab Content */}
          <div className="mt-4">
            {activeBackupTab === 'dashboard' && <BackupDashboard />}
            {activeBackupTab === 'scheduler' && <BackupScheduler />}
            {activeBackupTab === 'restore' && <BackupRestore />}
            {activeBackupTab === 'storage' && <BackupStorage />}
            {activeBackupTab === 'notifications' && <BackupNotifications />}
            {activeBackupTab === 'logs' && <BackupLogs />}
          </div>
        </CardContent>
      </Card>
      
      {/* Task & Notes Manager */}
      <TaskNotepad />
      
      {/* Developer Tools (only for developers) */}
      {extendedUser?.role === 'developer' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Developer Tools
            </CardTitle>
            <CardDescription>
              Advanced tools and configurations for developers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              <Button variant="outline" size="sm">
                Database Console
              </Button>
              <Button variant="outline" size="sm">
                API Documentation
              </Button>
              <Button variant="outline" size="sm">
                Feature Flags
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}