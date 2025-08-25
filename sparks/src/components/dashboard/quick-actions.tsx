'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { 
  Wand2, 
  BarChart3, 
  BookOpen, 
  ArrowRight,
  Target
} from 'lucide-react';
import { useAnalytics } from '@/hooks/use-analytics';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  href: string;
  color: string;
}

const quickActions: QuickAction[] = [
  {
    id: 'enhance',
    label: 'Enhance Prompt',
    description: 'Improve your prompts with AI',
    icon: Wand2,
    href: '/playground?tool=enhance',
    color: 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20'
  },
  {
    id: 'analyze',
    label: 'Analyze Performance',
    description: 'Get insights on your prompts',
    icon: BarChart3,
    href: '/playground?tool=analyze',
    color: 'bg-green-500/10 text-green-600 hover:bg-green-500/20'
  },
  {
    id: 'library',
    label: 'Browse Library',
    description: 'Explore saved prompts',
    icon: BookOpen,
    href: '/library',
    color: 'bg-purple-500/10 text-purple-600 hover:bg-purple-500/20'
  }
];

interface QuickActionsProps {
  className?: string;
}

export default function QuickActions({ className }: QuickActionsProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { trackComponentView } = useAnalytics();

  const handleQuickAction = (action: QuickAction) => {
    trackComponentView('quick-action', {
      actionId: action.id,
      actionLabel: action.label,
      userType: user ? 'authenticated' : 'guest'
    });
    router.push(action.href);
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center gap-2">
        <Target className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Quick Actions</h3>
        <Badge variant="secondary" className="text-xs">
          Popular
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.id}
              variant="ghost"
              onClick={() => handleQuickAction(action)}
              className={cn(
                'h-auto p-4 flex flex-col items-start gap-2 text-left transition-all duration-200',
                'hover:scale-105 hover:shadow-md border border-border/50 hover:border-primary/20',
                action.color
              )}
            >
              <div className="flex items-center gap-2 w-full">
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span className="font-medium">{action.label}</span>
                <ArrowRight className="h-4 w-4 ml-auto opacity-50" />
              </div>
              <p className="text-xs opacity-75 text-left">
                {action.description}
              </p>
            </Button>
          );
        })}
      </div>
    </div>
  );
}