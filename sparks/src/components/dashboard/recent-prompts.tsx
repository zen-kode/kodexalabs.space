'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '../ui/button';
import { useRouter } from 'next/navigation';
import { PlusCircle, AlertCircle, Loader2 } from 'lucide-react';
import { usePrompts } from '@/hooks/use-prompts';
import { useAnalytics } from '@/hooks/use-analytics';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RecentPromptsProps } from './types';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

export default function RecentPrompts({
  className,
  limit = 5,
  onPromptClick,
  showCreateButton = true
}: RecentPromptsProps = {}) {
  const router = useRouter();
  const { prompts, loading, error, refetch } = usePrompts(limit);
  const { trackComponentView, trackComponentClick, trackNavigation } = useAnalytics();

  // Track component view
  useEffect(() => {
    trackComponentView('recent-prompts', {
      promptCount: prompts.length,
      hasError: !!error,
      isLoading: loading
    });
  }, [prompts.length, error, loading, trackComponentView]);

  const handlePromptClick = (promptId: string) => {
    // Track prompt click
    const prompt = prompts.find(p => p.id === promptId);
    trackComponentClick('recent-prompts', 'prompt-click', {
      promptId,
      promptTitle: prompt?.title,
      promptCategory: prompt?.category,
      promptTags: prompt?.tags
    });
    
    if (onPromptClick) {
      onPromptClick(promptId);
    } else {
      trackNavigation('recent-prompts', '/playground', { promptId });
      router.push(`/playground?promptId=${promptId}`);
    }
  };

  const handleCreateClick = () => {
    trackComponentClick('recent-prompts', 'create-new-prompt');
    trackNavigation('recent-prompts', '/playground');
    router.push('/playground');
  };

  return (
    <Card className={cn(className)}>
      <CardHeader className="p-4 sm:p-6">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg sm:text-xl font-semibold">My Library</CardTitle>
          {showCreateButton && (
            <Button variant="outline" size="sm" onClick={handleCreateClick} className="shrink-0">
              <PlusCircle className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4"/>
              <span className="hidden sm:inline">New Prompt</span>
              <span className="sm:hidden">New</span>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        {loading ? (
          <div className="flex items-center justify-center py-6 sm:py-8">
            <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin mr-2" />
            <span className="text-sm sm:text-base text-muted-foreground">Loading your prompts...</span>
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-sm">{error}</span>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-fit" 
                onClick={refetch}
              >
                Try Again
              </Button>
            </AlertDescription>
          </Alert>
        ) : prompts.length === 0 ? (
          <div className="text-center py-6 sm:py-8">
            <p className="text-sm sm:text-base text-muted-foreground mb-4">No prompts yet. Create your first one!</p>
            <Button onClick={handleCreateClick} size="sm" className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4"/>
              Create First Prompt
            </Button>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {prompts.map((prompt) => (
              <div
                key={prompt.id}
                className="group cursor-pointer rounded-lg border p-3 sm:p-4 transition-all hover:border-primary/80 hover:bg-muted/50 active:bg-muted/70"
                onClick={() => handlePromptClick(prompt.id)}
              >
                <h3 className="font-semibold text-sm sm:text-base line-clamp-1">{prompt.title}</h3>
                <p className="mt-1 line-clamp-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {prompt.content}
                </p>
                <div className="mt-2 flex flex-wrap gap-1 sm:gap-2">
                  {prompt.category && (
                    <Badge variant="outline" className="text-xs px-2 py-0.5">{prompt.category}</Badge>
                  )}
                  {prompt.tags?.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs px-2 py-0.5">
                      {tag}
                    </Badge>
                  ))}
                  {prompt.tags && prompt.tags.length > 3 && (
                    <Badge variant="secondary" className="text-xs px-2 py-0.5">
                      +{prompt.tags.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
