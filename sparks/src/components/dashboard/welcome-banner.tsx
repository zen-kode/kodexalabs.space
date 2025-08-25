'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, 
  X, 
  Loader2, 
  Clock
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useAnalytics } from '@/hooks/use-analytics';
import { useState, useEffect } from 'react';
import { WelcomeBannerProps } from './types';
import { cn } from '@/lib/utils';
import QuickActions from './quick-actions';



export default function WelcomeBanner({ 
  className,
  onClose,
  showCloseButton = true 
}: WelcomeBannerProps = {}) {
  const { user, loading } = useAuth();
  const { trackComponentView, trackComponentClose } = useAnalytics();
  const [isVisible, setIsVisible] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  const getUserDisplayName = () => {
    if (loading) return 'Loading...';
    if (!user) return 'Guest';
    return user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const handleClose = () => {
    trackComponentClose('welcome-banner', {
      userType: user ? 'authenticated' : 'guest',
      displayName: getUserDisplayName()
    });
    
    setIsVisible(false);
    localStorage.setItem('welcomeBannerDismissed', 'true');
    onClose?.();
  };



  useEffect(() => {
    const dismissed = localStorage.getItem('welcomeBannerDismissed');
    if (dismissed === 'true') {
      setIsVisible(false);
    } else {
      trackComponentView('welcome-banner', {
        userType: user ? 'authenticated' : 'guest',
        displayName: getUserDisplayName()
      });
    }

    // Update time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, [user, loading]);

  if (!isVisible) return null;

  return (
    <Card className={cn(
      'relative overflow-hidden border-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5',
      'shadow-lg shadow-primary/5 backdrop-blur-sm',
      className
    )}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--primary))_0%,transparent_50%)]" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/20 to-transparent rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-secondary/20 to-transparent rounded-full blur-xl" />
      </div>

      <CardContent className="relative p-6 sm:p-8">
        {/* Close Button */}
        {showCloseButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="absolute top-4 right-4 h-8 w-8 p-0 hover:bg-muted/50"
          >
            <X className="h-4 w-4" />
          </Button>
        )}

        <div className="space-y-6">
          {/* Header Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  {getGreeting()}, {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Loading...
                    </span>
                  ) : (
                    getUserDisplayName()
                  )}!
                </h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <Clock className="h-4 w-4" />
                  <span>{currentTime.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</span>
                </div>
              </div>
            </div>
            
            <p className="text-muted-foreground text-lg">
              Ready to create amazing prompts? Let's get started with your AI journey.
            </p>
          </div>

          {/* Stats Preview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-border/50">
            <div className="text-center space-y-1">
              <div className="text-2xl font-bold text-primary">12</div>
              <div className="text-xs text-muted-foreground">Prompts Created</div>
            </div>
            <div className="text-center space-y-1">
              <div className="text-2xl font-bold text-green-600">8</div>
              <div className="text-xs text-muted-foreground">Enhanced</div>
            </div>
            <div className="text-center space-y-1">
              <div className="text-2xl font-bold text-blue-600">5</div>
              <div className="text-xs text-muted-foreground">Analyzed</div>
            </div>
            <div className="text-center space-y-1">
              <div className="text-2xl font-bold text-purple-600">3</div>
              <div className="text-xs text-muted-foreground">Saved</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
