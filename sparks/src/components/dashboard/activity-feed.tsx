'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'prompt_created' | 'prompt_enhanced' | 'library_saved' | 'analysis_completed' | 'system_update';
  title: string;
  description: string;
  timestamp: Date;
  user?: {
    name: string;
    avatar?: string;
  };
  metadata?: {
    category?: string;
    status?: 'success' | 'warning' | 'error' | 'info';
  };
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  className?: string;
  maxHeight?: string;
}

const getActivityIcon = (type: ActivityItem['type']): string => {
  switch (type) {
    case 'prompt_created':
      return '✨';
    case 'prompt_enhanced':
      return '🚀';
    case 'library_saved':
      return '📚';
    case 'analysis_completed':
      return '📊';
    case 'system_update':
      return '⚙️';
    default:
      return '📝';
  }
};

const getStatusColor = (status?: string) => {
  switch (status) {
    case 'success':
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    case 'warning':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    case 'error':
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
    case 'info':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export default function ActivityFeed({ 
  activities, 
  className, 
  maxHeight = '400px' 
}: ActivityFeedProps) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-lg">📈</span>
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="px-6 pb-6" style={{ maxHeight }}>
          <div className="space-y-4">
            {activities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="text-4xl mb-2">🌟</div>
                <p>No recent activity</p>
                <p className="text-sm">Start creating prompts to see your activity here</p>
              </div>
            ) : (
              activities.map((activity, index) => (
                <div key={activity.id} className="flex items-start gap-3 group">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm transition-all duration-200 group-hover:scale-110">
                      {getActivityIcon(activity.type)}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium truncate">
                        {activity.title}
                      </h4>
                      <time className="text-xs text-muted-foreground flex-shrink-0">
                        {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                      </time>
                    </div>
                    
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {activity.description}
                    </p>
                    
                    <div className="flex items-center gap-2">
                      {activity.user && (
                        <div className="flex items-center gap-1">
                          <Avatar className="w-4 h-4">
                            <AvatarImage src={activity.user.avatar} />
                            <AvatarFallback className="text-xs">
                              {activity.user.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground">
                            {activity.user.name}
                          </span>
                        </div>
                      )}
                      
                      {activity.metadata?.category && (
                        <Badge variant="outline" className="text-xs px-1 py-0">
                          {activity.metadata.category}
                        </Badge>
                      )}
                      
                      {activity.metadata?.status && (
                        <Badge 
                          className={cn(
                            'text-xs px-1 py-0 border-0',
                            getStatusColor(activity.metadata.status)
                          )}
                        >
                          {activity.metadata.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}