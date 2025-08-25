'use client';

import { Suspense } from 'react';
import WelcomeBanner from '@/components/dashboard/welcome-banner';
import QuickActions from '@/components/dashboard/quick-actions';
import MetricsCard from '@/components/dashboard/metrics-card';
import ActivityFeed from '@/components/dashboard/activity-feed';
import PrinciplesCard from '@/components/dashboard/principles-card';
import QuickTourCard from '@/components/dashboard/quick-tour-card';
import { 
  Users, 
  Zap, 
  Target, 
  TrendingUp, 

  BookOpen,
  BarChart3,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

// Mock data - in a real app, this would come from your API/database
const mockMetrics = [
  {
    title: 'Total Prompts',
    value: 0,
    change: { value: 0, type: 'increase' as const },
    icon: Sparkles,
    description: 'No prompts yet',
    trend: [0]
  }
];

const mockActivities = [
  {
    id: '1',
    type: 'system_update' as const,
    title: 'No Recent Activity',
    description: 'No recent activity to display',
    timestamp: new Date(),
    metadata: { category: 'System', status: 'info' as const }
  }
];



function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-48 w-full" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="h-96 lg:col-span-2" />
        <Skeleton className="h-96" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <Suspense fallback={<DashboardSkeleton />}>
          {/* Welcome Section */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">
                  Monitor your AI prompt performance and activity
                </p>
              </div>
              <Badge variant="outline" className="hidden sm:flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                All systems operational
              </Badge>
            </div>
            <WelcomeBanner className="" />
          </section>

          {/* Quick Actions Section */}
          <section className="space-y-4">
            <QuickActions />
          </section>

          {/* Metrics Grid */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Key Metrics</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {mockMetrics.map((metric, index) => (
                <MetricsCard
                  key={index}
                  title={metric.title}
                  value={metric.value}
                  change={metric.change}
                  icon={metric.icon}
                  description={metric.description}
                  trend={metric.trend}
                  className="hover:shadow-lg transition-all duration-300"
                />
              ))}
            </div>
          </section>

          {/* Main Content Grid */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Activity */}
            <div className="lg:col-span-2 space-y-6">
              <ActivityFeed 
                activities={mockActivities}
                className=""
                maxHeight="500px"
              />
            </div>

            {/* Right Column - Quick Actions & Principles */}
            <div className="space-y-6">
              <QuickTourCard className="" />
              <PrinciplesCard className="" />
            </div>
          </section>
        </Suspense>
      </div>
    </div>
  );
}
