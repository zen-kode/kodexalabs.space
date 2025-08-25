'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Activity,
  Database,
  Cloud,
  Zap,
  Users,
  Settings,
  Shield,
  BarChart3,
  Smartphone,
  Globe,
  RefreshCw
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useState, useEffect } from 'react';

// Core system services
const coreServices = [
  { name: 'Website', status: 'Operational', icon: Globe, color: 'text-green-500', uptime: '99.9%' },
  { name: 'API Services', status: 'Operational', icon: Cloud, color: 'text-green-500', uptime: '99.8%' },
  { name: 'AI Generation', status: 'Operational', icon: Zap, color: 'text-green-500', uptime: '99.7%' },
  { name: 'Database', status: 'Operational', icon: Database, color: 'text-green-500', uptime: '99.9%' },
  { name: 'Authentication', status: 'Operational', icon: Shield, color: 'text-green-500', uptime: '99.9%' },
  { name: 'File Storage', status: 'Operational', icon: Database, color: 'text-green-500', uptime: '99.8%' },
];

// Feature categories with their status
const featureCategories = {
  'Core Application': {
    icon: Activity,
    features: [
      { id: 'F001-F005', name: 'Authentication & User Management', status: 'Operational', health: 100 },
      { id: 'F006-F010', name: 'Interactive Playground', status: 'Operational', health: 100 },
      { id: 'F011-F018', name: 'AI Tools Dock System', status: 'Operational', health: 100 },
      { id: 'F019-F026', name: 'AI Processing Flows', status: 'Operational', health: 98 },
      { id: 'F027-F035', name: 'Prompt Management System', status: 'Operational', health: 100 },
    ]
  },
  'Dashboard & UI': {
    icon: BarChart3,
    features: [
      { id: 'F036-F047', name: 'Dashboard Components', status: 'Operational', health: 100 },
      { id: 'F048-F061', name: 'Navigation & Layout', status: 'Operational', health: 100 },
      { id: 'F109-F128', name: 'UI/UX Components', status: 'Operational', health: 100 },
      { id: 'F129-F134', name: 'Mobile & Responsive Features', status: 'Operational', health: 95 },
    ]
  },
  'Settings & Customization': {
    icon: Settings,
    features: [
      { id: 'F062-F066', name: 'General Settings', status: 'Operational', health: 100 },
      { id: 'F067-F076', name: 'AI Dock Tools Settings', status: 'Operational', health: 100 },
      { id: 'F121', name: 'Color Picker Component', status: 'Operational', health: 100 },
      { id: 'F122', name: 'File Upload/Download', status: 'Operational', health: 100 },
    ]
  },
  'Community & Data': {
    icon: Users,
    features: [
      { id: 'F077-F083', name: 'Community Features', status: 'Operational', health: 100 },
      { id: 'F084-F089', name: 'Library Management', status: 'Operational', health: 100 },
      { id: 'F090-F095', name: 'Database Integration', status: 'Operational', health: 99 },
      { id: 'F135-F140', name: 'Security & Privacy', status: 'Operational', health: 100 },
    ]
  },
  'Analytics & Monitoring': {
    icon: BarChart3,
    features: [
      { id: 'F096-F100', name: 'Performance & Monitoring', status: 'Operational', health: 98 },
      { id: 'F141-F145', name: 'User Analytics', status: 'Operational', health: 97 },
      { id: 'F044-F047', name: 'Dashboard Analytics', status: 'Operational', health: 100 },
    ]
  },
  'Advanced Features': {
    icon: Zap,
    features: [
      { id: 'F146-F155', name: 'Workflow Management', status: 'Operational', health: 95 },
      { id: 'F101-F108', name: 'Technical Infrastructure', status: 'Operational', health: 100 },
      { id: 'F123-F128', name: 'Advanced UI Features', status: 'Operational', health: 98 },
    ]
  }
};

// Performance metrics
const performanceMetrics = {
  totalFeatures: 155,
  operationalFeatures: 152,
  degradedFeatures: 3,
  downFeatures: 0,
  overallHealth: 98.1,
  avgResponseTime: '245ms',
  uptime: '99.9%',
  lastUpdated: new Date().toLocaleString()
};

const incidents = [
    {
        date: 'July 27, 2024',
        updates: [
            { time: '10:30 PST', description: 'The issue has been resolved. All systems are now operational.' },
            { time: '10:00 PST', description: 'We are currently investigating an issue with API latency. Some users may experience slower responses.' },
            { time: '09:45 PST', description: 'A fix has been implemented and we are monitoring the results.' },
        ]
    }
]

export default function StatusPage() {
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLastRefresh(new Date());
    setIsRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Operational': return 'text-green-500';
      case 'Degraded': return 'text-yellow-500';
      case 'Down': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Operational': return CheckCircle2;
      case 'Degraded': return AlertTriangle;
      case 'Down': return XCircle;
      default: return Clock;
    }
  };

  const getHealthColor = (health: number) => {
    if (health >= 99) return 'bg-green-500';
    if (health >= 95) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-4xl font-bold tracking-tight">
            System Status
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Real-time monitoring of all {performanceMetrics.totalFeatures} application features and services.
          </p>
        </div>
        <div className="text-right">
          <Button 
            variant="outline" 
            onClick={handleRefresh} 
            disabled={isRefreshing}
            className="mb-2"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <p className="text-sm text-muted-foreground">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
      </div>

      {/* Overall Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Overall System Health
          </CardTitle>
          <CardDescription>
            {performanceMetrics.operationalFeatures} of {performanceMetrics.totalFeatures} features operational
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-500">
                {performanceMetrics.overallHealth}%
              </div>
              <div className="text-sm text-muted-foreground">System Health</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">
                {performanceMetrics.uptime}
              </div>
              <div className="text-sm text-muted-foreground">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">
                {performanceMetrics.avgResponseTime}
              </div>
              <div className="text-sm text-muted-foreground">Avg Response</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-500">
                {performanceMetrics.operationalFeatures}
              </div>
              <div className="text-sm text-muted-foreground">Features Online</div>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Overall Health</span>
              <span>{performanceMetrics.overallHealth}%</span>
            </div>
            <Progress value={performanceMetrics.overallHealth} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Status Tabs */}
      <Tabs defaultValue="services" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="services">Core Services</TabsTrigger>
          <TabsTrigger value="features">Feature Status</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* Core Services Tab */}
        <TabsContent value="services">
          <Card>
            <CardHeader>
              <CardTitle>Core System Services</CardTitle>
              <CardDescription>Essential infrastructure components</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {coreServices.map((service) => {
                const StatusIcon = service.icon;
                return (
                  <div key={service.name} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <StatusIcon className={`h-6 w-6 ${service.color}`} />
                      <div>
                        <span className="font-medium">{service.name}</span>
                        <div className="text-sm text-muted-foreground">Uptime: {service.uptime}</div>
                      </div>
                    </div>
                    <Badge variant="outline" className={service.color}>
                      {service.status}
                    </Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features">
          <div className="grid gap-6 md:grid-cols-2">
            {Object.entries(featureCategories).map(([categoryName, category]) => {
              const CategoryIcon = category.icon;
              return (
                <Card key={categoryName}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CategoryIcon className="h-5 w-5" />
                      {categoryName}
                    </CardTitle>
                    <CardDescription>
                      {category.features.length} feature groups
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {category.features.map((feature) => {
                      const StatusIcon = getStatusIcon(feature.status);
                      return (
                        <div key={feature.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <StatusIcon className={`h-4 w-4 ${getStatusColor(feature.status)}`} />
                              <span className="text-sm font-medium">{feature.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">{feature.id}</span>
                              <Badge variant="outline" className={getStatusColor(feature.status)}>
                                {feature.health}%
                              </Badge>
                            </div>
                          </div>
                          <Progress 
                            value={feature.health} 
                            className="h-1" 
                          />
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Feature Distribution</CardTitle>
                <CardDescription>Status breakdown of all features</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-sm">Operational</span>
                  </div>
                  <span className="font-medium">{performanceMetrics.operationalFeatures}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <span className="text-sm">Degraded Performance</span>
                  </div>
                  <span className="font-medium">{performanceMetrics.degradedFeatures}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-sm">Down</span>
                  </div>
                  <span className="font-medium">{performanceMetrics.downFeatures}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between font-medium">
                  <span>Total Features</span>
                  <span>{performanceMetrics.totalFeatures}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Metrics</CardTitle>
                <CardDescription>Real-time performance indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>System Uptime</span>
                    <span className="font-medium">{performanceMetrics.uptime}</span>
                  </div>
                  <Progress value={99.9} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Feature Health</span>
                    <span className="font-medium">{performanceMetrics.overallHealth}%</span>
                  </div>
                  <Progress value={performanceMetrics.overallHealth} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Response Time</span>
                    <span className="font-medium">{performanceMetrics.avgResponseTime}</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>
                <Separator />
                <div className="text-xs text-muted-foreground">
                  Last updated: {performanceMetrics.lastUpdated}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
            <CardTitle>Past Incidents</CardTitle>
            <CardDescription>A log of recent system events and their resolutions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            {incidents.map((incident, index) => (
                <div key={index} className="relative">
                     <div className="absolute left-3 top-3 bottom-3 w-0.5 bg-border -z-10" />
                    <h3 className="font-semibold text-lg mb-4 pl-9">{incident.date}</h3>
                    <div className="space-y-4 pl-9">
                    {incident.updates.map((update, idx) => (
                         <div key={idx} className="flex items-start gap-4">
                           <div className="bg-background border rounded-full h-6 w-6 flex items-center justify-center z-10 mt-1">
                                <Clock className="h-3 w-3 text-muted-foreground"/>
                           </div>
                           <div className='flex-1'>
                             <p className="font-mono text-xs text-muted-foreground">{update.time}</p>
                             <p>{update.description}</p>
                           </div>
                         </div>
                    ))}
                    </div>
                </div>
            ))}
        </CardContent>
      </Card>
    </div>
  );
}
