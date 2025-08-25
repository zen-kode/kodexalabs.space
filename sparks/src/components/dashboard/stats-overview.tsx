'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatItem {
  label: string;
  value: number;
  maxValue?: number;
  change?: {
    value: number;
    type: 'increase' | 'decrease' | 'neutral';
  };
  color?: string;
}

interface StatsOverviewProps {
  title: string;
  stats: StatItem[];
  className?: string;
  showProgress?: boolean;
}

const getTrendIcon = (type: 'increase' | 'decrease' | 'neutral') => {
  switch (type) {
    case 'increase':
      return <TrendingUp className="w-3 h-3" />;
    case 'decrease':
      return <TrendingDown className="w-3 h-3" />;
    default:
      return <Minus className="w-3 h-3" />;
  }
};

const getTrendColor = (type: 'increase' | 'decrease' | 'neutral') => {
  switch (type) {
    case 'increase':
      return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
    case 'decrease':
      return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
    default:
      return 'text-muted-foreground bg-muted';
  }
};

export default function StatsOverview({ 
  title, 
  stats, 
  className, 
  showProgress = true 
}: StatsOverviewProps) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-lg">📊</span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {stats.map((stat, index) => {
          const progressValue = stat.maxValue ? (stat.value / stat.maxValue) * 100 : 0;
          
          return (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{stat.label}</span>
                  {stat.change && (
                    <Badge 
                      variant="secondary" 
                      className={cn(
                        'text-xs px-1.5 py-0.5 flex items-center gap-1',
                        getTrendColor(stat.change.type)
                      )}
                    >
                      {getTrendIcon(stat.change.type)}
                      {Math.abs(stat.change.value)}%
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{stat.value}</span>
                  {stat.maxValue && (
                    <span className="text-xs text-muted-foreground">/ {stat.maxValue}</span>
                  )}
                </div>
              </div>
              
              {showProgress && stat.maxValue && (
                <div className="space-y-1">
                  <Progress 
                    value={progressValue} 
                    className="h-2"
                    style={{
                      '--progress-background': stat.color || 'hsl(var(--primary))'
                    } as React.CSSProperties}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0</span>
                    <span>{stat.maxValue}</span>
                  </div>
                </div>
              )}
              
              {!showProgress && (
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full transition-all duration-500 ease-out rounded-full"
                    style={{
                      width: `${progressValue}%`,
                      backgroundColor: stat.color || 'hsl(var(--primary))'
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
        
        {stats.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <div className="text-4xl mb-2">📈</div>
            <p>No statistics available</p>
            <p className="text-sm">Data will appear here as you use the platform</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}