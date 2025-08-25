'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease' | 'neutral';
  };
  icon: LucideIcon;
  description?: string;
  className?: string;
  trend?: number[];
}

export default function MetricsCard({
  title,
  value,
  change,
  icon: Icon,
  description,
  className,
  trend
}: MetricsCardProps) {
  const getChangeColor = () => {
    if (!change) return '';
    switch (change.type) {
      case 'increase':
        return 'text-green-600 dark:text-green-400';
      case 'decrease':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-muted-foreground';
    }
  };

  const getChangeIcon = () => {
    if (!change) return null;
    return change.type === 'increase' ? '↗' : change.type === 'decrease' ? '↘' : '→';
  };

  return (
    <Card className={cn(
      'relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 border-border/50',
      'bg-gradient-to-br from-card to-card/80 backdrop-blur-sm',
      className
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-2xl font-bold tracking-tight">{value}</div>
          
          {change && (
            <div className={cn('flex items-center text-xs', getChangeColor())}>
              <span className="mr-1">{getChangeIcon()}</span>
              <span>{Math.abs(change.value)}%</span>
              <span className="ml-1 text-muted-foreground">from last period</span>
            </div>
          )}
          
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
          
          {trend && trend.length > 0 && (
            <div className="mt-3">
              <div className="flex items-end space-x-1 h-8">
                {trend.map((value, index) => (
                  <div
                    key={index}
                    className="bg-primary/20 rounded-sm flex-1 transition-all duration-300 hover:bg-primary/30"
                    style={{
                      height: `${Math.max(4, (value / Math.max(...trend)) * 100)}%`
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}