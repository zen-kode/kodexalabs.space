'use client';

import { useEffect, useState } from 'react';
import { 
  Save, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Wifi, 
  WifiOff,
  History
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { AutoSaveState, AutoSave } from '@/lib/types';

interface AutoSaveIndicatorProps {
  state: AutoSaveState | null;
  onForceSave?: () => Promise<boolean>;
  onViewAutoSaves?: () => void;
  autoSaves?: AutoSave[];
  className?: string;
  compact?: boolean;
}

interface AutoSaveHistoryProps {
  autoSaves: AutoSave[];
  onRestore: (autoSave: AutoSave) => void;
  onDelete: (autoSaveId: string) => void;
}

function AutoSaveHistory({ autoSaves, onRestore, onDelete }: AutoSaveHistoryProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (autoSaves.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No auto-saves available</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      <div className="text-sm font-medium px-2 py-1 border-b">
        Auto-Save History ({autoSaves.length})
      </div>
      {autoSaves.map((autoSave) => (
        <div key={autoSave.id} className="p-2 hover:bg-muted rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">
                {autoSave.title || 'Untitled'}
              </div>
              <div className="text-xs text-muted-foreground">
                {formatDate(autoSave.createdAt)}
              </div>
              {autoSave.content && (
                <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {autoSave.content.substring(0, 100)}...
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 ml-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRestore(autoSave)}
                className="h-6 px-2 text-xs"
              >
                Restore
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(autoSave.id)}
                className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
              >
                ×
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function AutoSaveIndicator({
  state,
  onForceSave,
  onViewAutoSaves,
  autoSaves = [],
  className,
  compact = false
}: AutoSaveIndicatorProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [lastSaveTime, setLastSaveTime] = useState<string | null>(null);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update last save time
  useEffect(() => {
    if (state?.lastSaved) {
      setLastSaveTime(state.lastSaved);
    }
  }, [state?.lastSaved]);

  const getStatusInfo = () => {
    if (!state) {
      return {
        icon: Save,
        text: 'Auto-save disabled',
        variant: 'secondary' as const,
        color: 'text-muted-foreground'
      };
    }

    if (!isOnline) {
      return {
        icon: WifiOff,
        text: 'Offline - changes saved locally',
        variant: 'outline' as const,
        color: 'text-orange-600'
      };
    }

    if (state.saveInProgress) {
      return {
        icon: Loader2,
        text: 'Saving...',
        variant: 'secondary' as const,
        color: 'text-blue-600',
        animate: true
      };
    }

    if (state.error) {
      return {
        icon: AlertCircle,
        text: `Save failed: ${state.error}`,
        variant: 'destructive' as const,
        color: 'text-destructive'
      };
    }

    if (state.isDirty) {
      return {
        icon: Clock,
        text: 'Unsaved changes',
        variant: 'outline' as const,
        color: 'text-orange-600'
      };
    }

    return {
      icon: CheckCircle,
      text: 'All changes saved',
      variant: 'secondary' as const,
      color: 'text-green-600'
    };
  };

  const statusInfo = getStatusInfo();
  const Icon = statusInfo.icon;

  const formatLastSaveTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffSecs = Math.floor(diffMs / 1000);

    if (diffSecs < 30) return 'Just now';
    if (diffMins < 1) return `${diffSecs}s ago`;
    if (diffMins < 60) return `${diffMins}m ago`;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn('flex items-center gap-1', className)}>
              <Icon 
                className={cn(
                  'h-4 w-4', 
                  statusInfo.color,
                  statusInfo.animate && 'animate-spin'
                )} 
              />
              {!isOnline && <WifiOff className="h-3 w-3 text-orange-600" />}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-center">
              <p>{statusInfo.text}</p>
              {lastSaveTime && (
                <p className="text-xs text-muted-foreground mt-1">
                  Last saved: {formatLastSaveTime(lastSaveTime)}
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Badge variant={statusInfo.variant} className="gap-1">
        <Icon 
          className={cn(
            'h-3 w-3', 
            statusInfo.animate && 'animate-spin'
          )} 
        />
        {statusInfo.text}
        {!isOnline && <WifiOff className="h-3 w-3" />}
      </Badge>

      {lastSaveTime && (
        <span className="text-xs text-muted-foreground">
          Last saved: {formatLastSaveTime(lastSaveTime)}
        </span>
      )}

      <div className="flex items-center gap-1">
        {state?.error && onForceSave && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onForceSave}
                  className="h-6 px-2 text-xs"
                >
                  <Save className="h-3 w-3 mr-1" />
                  Retry
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Force save changes</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {state?.isDirty && onForceSave && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onForceSave}
                  className="h-6 px-2 text-xs"
                >
                  <Save className="h-3 w-3 mr-1" />
                  Save Now
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Save changes immediately</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {autoSaves.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs gap-1"
              >
                <History className="h-3 w-3" />
                {autoSaves.length}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <AutoSaveHistory
                autoSaves={autoSaves}
                onRestore={(autoSave) => {
                  // Restore auto-save implementation
                }}
                onDelete={(autoSaveId) => {
                  // Delete auto-save implementation
                }}
              />
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  );
}

export default AutoSaveIndicator;