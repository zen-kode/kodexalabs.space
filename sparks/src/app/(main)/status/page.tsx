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
  RefreshCw,
  Server,
  TrendingUp
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useState, useEffect } from 'react';

// Core system services
const coreServices = [
  { name: 'Website', status: 'Operational', icon: Globe, color: 'text-primary', uptime: '99.9%' },
  { name: 'API Services', status: 'Operational', icon: Cloud, color: 'text-primary', uptime: '99.8%' },
  { name: 'AI Generation', status: 'Operational', icon: Zap, color: 'text-primary', uptime: '99.7%' },
  { name: 'Database', status: 'Operational', icon: Database, color: 'text-primary', uptime: '99.9%' },
  { name: 'Authentication', status: 'Operational', icon: Shield, color: 'text-primary', uptime: '99.9%' },
  { name: 'File Storage', status: 'Operational', icon: Database, color: 'text-primary', uptime: '99.8%' },
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
  const [selectedTab, setSelectedTab] = useState('services');

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLastRefresh(new Date());
    setIsRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Operational': return 'text-primary';
      case 'Degraded': return 'text-muted-foreground';
      case 'Down': return 'text-destructive';
      default: return 'text-muted-foreground';
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
    if (health >= 99) return 'bg-primary';
    if (health >= 95) return 'bg-muted';
    return 'bg-destructive';
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary shadow-lg">
            <Activity className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-headline text-3xl font-bold tracking-tight text-foreground">
              System Status
            </h1>
            <p className="mt-2 text-base text-muted-foreground max-w-2xl mx-auto">
              Real-time monitoring of all services and features
            </p>
          </div>
        </div>
        
        <div className="flex justify-center mb-8">
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline"
            className="shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Status
          </Button>
        </div>

        {/* System Health Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="relative overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-primary rounded-xl shadow-lg">
                  <TrendingUp className="h-5 w-5 text-primary-foreground" />
                </div>
                <Badge variant={performanceMetrics.overallHealth >= 90 ? 'default' : performanceMetrics.overallHealth >= 70 ? 'secondary' : 'destructive'} className="text-xs">
                  {performanceMetrics.overallHealth >= 90 ? 'Excellent' : performanceMetrics.overallHealth >= 70 ? 'Good' : 'Needs Attention'}
                </Badge>
              </div>
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-foreground">System Health</h3>
                  <p className="text-xs text-muted-foreground mt-1">Overall system performance</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-foreground">{performanceMetrics.overallHealth}%</span>
                  </div>
                  <Progress value={performanceMetrics.overallHealth} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="relative overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-primary rounded-xl shadow-lg">
                  <Clock className="h-5 w-5 text-primary-foreground" />
                </div>
                <Badge variant="default" className="text-xs">Excellent</Badge>
              </div>
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-foreground">Uptime</h3>
                  <p className="text-xs text-muted-foreground mt-1">System availability</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-foreground">{performanceMetrics.uptime}</span>
                  </div>
                  <Progress value={99.9} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="relative overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-primary rounded-xl shadow-lg">
                  <Zap className="h-5 w-5 text-primary-foreground" />
                </div>
                <Badge variant="default" className="text-xs">Good</Badge>
              </div>
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-foreground">Response Time</h3>
                  <p className="text-xs text-muted-foreground mt-1">Average API response</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-foreground">{performanceMetrics.avgResponseTime}</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="relative overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-primary rounded-xl shadow-lg">
                  <Activity className="h-5 w-5 text-primary-foreground" />
                </div>
                <Badge variant="default" className="text-xs">Excellent</Badge>
              </div>
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-foreground">Features Online</h3>
                  <p className="text-xs text-muted-foreground mt-1">Active features</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-foreground">{performanceMetrics.operationalFeatures}</span>
                  </div>
                  <Progress value={98} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Services and Features */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="services">
              <Server className="h-4 w-4 mr-2" />
              Services
            </TabsTrigger>
            <TabsTrigger value="features">
              <Globe className="h-4 w-4 mr-2" />
              Features
            </TabsTrigger>
            <TabsTrigger value="performance">
              <Shield className="h-4 w-4 mr-2" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="incidents">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Incidents
            </TabsTrigger>
          </TabsList>

          <TabsContent value="services" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {coreServices.map((service) => {
                const StatusIcon = service.icon;
                return (
                  <Card key={service.name} className="group shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                    <div className={`h-1 ${
                      service.status === 'Operational' ? 'bg-primary' :
                      service.status === 'Degraded' ? 'bg-muted' :
                      'bg-destructive'
                    }`} />
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                            {service.name}
                          </CardTitle>
                        </div>
                        <Badge 
                          variant={service.status === 'Operational' ? 'default' : service.status === 'Degraded' ? 'secondary' : 'destructive'}
                          className="flex items-center space-x-1 px-3 py-1 rounded-full"
                        >
                          <StatusIcon className="h-3 w-3" />
                          <span className="capitalize text-xs font-medium">{service.status}</span>
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Uptime</p>
                          <p className="text-sm font-semibold text-foreground">{service.uptime}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {Object.entries(featureCategories).map(([categoryName, category]) => {
              const CategoryIcon = category.icon;
              return (
                <Card key={categoryName} className="shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                          <CategoryIcon className="h-5 w-5" />
                          {categoryName}
                        </CardTitle>
                        <CardDescription className="text-muted-foreground mt-1">
                          {category.features.length} feature groups
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {category.features.map((feature) => {
                      const StatusIcon = getStatusIcon(feature.status);
                      return (
                        <div key={feature.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <StatusIcon className={`h-4 w-4 ${getStatusColor(feature.status)}`} />
                              <span className="text-sm font-medium text-foreground">{feature.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">{feature.id}</span>
                              <Badge variant="outline" className={`text-xs ${getStatusColor(feature.status)}`}>
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
        <TabsContent value="performance" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Feature Distribution
                </CardTitle>
                <CardDescription className="text-muted-foreground">Status breakdown of all features</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary"></div>
                    <span className="text-sm text-foreground">Operational</span>
                  </div>
                  <span className="font-medium text-foreground">{performanceMetrics.operationalFeatures}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-muted"></div>
                    <span className="text-sm text-foreground">Degraded Performance</span>
                  </div>
                  <span className="font-medium text-foreground">{performanceMetrics.degradedFeatures}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-destructive"></div>
                    <span className="text-sm text-foreground">Down</span>
                  </div>
                  <span className="font-medium text-foreground">{performanceMetrics.downFeatures}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between font-medium">
                  <span className="text-foreground">Total Features</span>
                  <span className="text-foreground">{performanceMetrics.totalFeatures}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  System Metrics
                </CardTitle>
                <CardDescription className="text-muted-foreground">Real-time performance indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground">System Uptime</span>
                    <span className="font-medium text-muted-foreground">{performanceMetrics.uptime}</span>
                  </div>
                  <Progress value={99.9} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground">Feature Health</span>
                    <span className="font-medium text-muted-foreground">{performanceMetrics.overallHealth}%</span>
                  </div>
                  <Progress value={performanceMetrics.overallHealth} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground">Response Time</span>
                    <span className="font-medium text-muted-foreground">{performanceMetrics.avgResponseTime}</span>
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

        {/* Incidents Tab */}
        <TabsContent value="incidents" className="space-y-6">
          <div className="space-y-6">
            {incidents.length === 0 ? (
              <Card className="shadow-lg">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="p-4 bg-primary/10 rounded-full mb-6">
                    <CheckCircle2 className="h-12 w-12 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-foreground">All Systems Operational</h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    No incidents reported in the last 30 days. All systems are running smoothly and performing optimally.
                  </p>
                </CardContent>
              </Card>
            ) : (
              incidents.map((incident, index) => (
                <Card key={index} className="shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-3 mb-2">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Clock className="h-5 w-5 text-primary" />
                          </div>
                          System Maintenance - {incident.date}
                        </CardTitle>
                        <CardDescription className="text-muted-foreground ml-14">
                          Routine maintenance and system updates
                        </CardDescription>
                      </div>
                      <Badge 
                        variant="default"
                        className="capitalize ml-4 flex-shrink-0"
                      >
                        Resolved
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted/50 rounded-xl p-4 space-y-4">
                      {incident.updates.map((update, idx) => (
                        <div key={idx} className="flex items-start gap-4 pb-3 last:pb-0 border-b border-border last:border-0">
                          <div className="bg-background border rounded-full h-6 w-6 flex items-center justify-center flex-shrink-0 mt-1">
                            <Clock className="h-3 w-3 text-muted-foreground"/>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-mono text-xs text-muted-foreground mb-1">{update.time}</p>
                            <p className="text-sm text-foreground leading-relaxed">{update.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Card className="shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader>
            <CardTitle>Past Incidents</CardTitle>
            <CardDescription>Historical incident reports and resolutions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-full h-px bg-border mb-4"></div>
            <p className="text-muted-foreground">No major incidents in the past 90 days</p>
          </div>
        </CardContent>
        </Card>
      </div>
    </div>
  );
}
