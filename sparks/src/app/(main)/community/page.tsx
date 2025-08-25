'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { 
  Heart, 
  MessageSquare, 
  Copy, 
  Star, 
  Shuffle, 
  Wand2, 
  Edit, 
  Sparkles, 
  RefreshCw,
  Calendar,
  TrendingUp,
  Clock
} from 'lucide-react';

const mockCommunityPrompts = [
  {
    id: 'c1',
    user: 'DefaultUser',
    avatar: '',
    title: 'Default Prompt',
    content: 'Default prompt content',
    tags: ['default'],
    likes: 0,
    comments: 0,
    createdAt: new Date().toISOString().split('T')[0],
    trending: false,
    featured: false,
  },
];

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState('all');
  const { toast } = useToast();

  const filterPrompts = (filter: string) => {
    switch (filter) {
      case 'trending':
        return mockCommunityPrompts.filter(prompt => prompt.trending);
      case 'recent':
        return mockCommunityPrompts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 3);
      case 'featured':
        return mockCommunityPrompts.filter(prompt => prompt.featured);
      default:
        return mockCommunityPrompts;
    }
  };

  const handleCopyPrompt = async (prompt: any) => {
    try {
      await navigator.clipboard.writeText(prompt.content);
      toast({
        title: 'Prompt Copied!',
        description: `"${prompt.title}" has been copied to your clipboard.`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Copy Failed',
        description: 'Unable to copy prompt to clipboard. Please try again.',
      });
    }
  };

  const handleRemixOption = (prompt: any, option: string) => {
    const remixActions = {
      'enhance': `Enhanced version of "${prompt.title}"`,
      'simplify': `Simplified version of "${prompt.title}"`,
      'expand': `Expanded version of "${prompt.title}"`,
      'restyle': `Restyled version of "${prompt.title}"`,
      'random': `Random remix of "${prompt.title}"`
    };

    toast({
      title: 'Remix Created!',
      description: remixActions[option as keyof typeof remixActions] || `Remixed "${prompt.title}"`,
    });

    // Here you would typically navigate to the playground with the remixed prompt
    // or open a modal with the remix options
  };

  const currentPrompts = filterPrompts(activeTab);

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Hero Section - Updated with consistent design system colors */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-background to-muted/30 p-8 border border-border/50 shadow-sm">
        <div className="relative z-10">
          <h1 className="font-bold text-4xl tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Community Prompts
          </h1>
          <p className="mt-3 text-lg text-muted-foreground max-w-2xl">
            Discover, share, and remix amazing prompts created by our community.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Star className="h-4 w-4 text-primary" />
              <span>1,247 prompts shared</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Heart className="h-4 w-4 text-destructive" />
              <span>15,892 likes given</span>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Tabs with consistent styling */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
        <TabsList className="grid w-full grid-cols-4 bg-muted/50 p-1 rounded-lg border border-border/50">
          <TabsTrigger 
            value="all" 
            className="data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50"
          >
            All Prompts
          </TabsTrigger>
          <TabsTrigger 
            value="trending" 
            className="data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 gap-1"
          >
            <TrendingUp className="h-4 w-4" />
            Trending
          </TabsTrigger>
          <TabsTrigger 
            value="recent" 
            className="data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 gap-1"
          >
            <Clock className="h-4 w-4" />
            Recent
          </TabsTrigger>
          <TabsTrigger 
            value="featured" 
            className="data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 gap-1"
          >
            <Star className="h-4 w-4" />
            Featured
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {currentPrompts.map((prompt) => (
              <Card
                key={prompt.id}
                className="group relative flex flex-col overflow-hidden border bg-card shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1"
              >
                {/* Featured Badge */}
                {prompt.featured && (
                  <div className="absolute top-3 right-3 z-10">
                    <Badge variant="default" className="bg-primary text-primary-foreground shadow-sm">
                      <Star className="h-3 w-3 mr-1" />
                      Featured
                    </Badge>
                  </div>
                )}
                
                {/* Trending Indicator */}
                {prompt.trending && (
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-primary/80 to-primary/60" />
                )}

                <CardHeader className="pb-3 relative">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={prompt.avatar}
                        alt={prompt.user}
                        className="h-10 w-10 rounded-full border-2 border-border shadow-sm"
                      />
                      <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-green-500 border-2 border-background" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-lg font-bold leading-tight truncate group-hover:text-primary transition-colors">
                        {prompt.title}
                      </CardTitle>
                      <CardDescription className="text-sm text-muted-foreground">
                        <span>by @{prompt.user}</span>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 pt-0">
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-4">
                    {prompt.content}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {prompt.tags.map((tag) => (
                      <Badge 
                        key={tag} 
                        variant="secondary" 
                        className="text-xs px-2 py-1 bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>

                <CardFooter className="pt-0 pb-4 flex-col gap-3">
                  {/* Creation Date - Prominent Display */}
                  <div className="w-full flex justify-between items-center border-t border-border pt-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Created {new Date(prompt.createdAt).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}</span>
                    </div>
                    
                    {/* Unified Engagement Metrics */}
                    <div className="flex items-center gap-4 px-3 py-1.5 rounded-full bg-muted">
                      <div className="flex items-center gap-1 text-muted-foreground hover:text-destructive transition-colors cursor-pointer">
                        <Heart className="h-4 w-4" />
                        <span className="text-sm font-medium">{prompt.likes}</span>
                      </div>
                      <div className="w-px h-4 bg-border" />
                      <div className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                        <MessageSquare className="h-4 w-4" />
                        <span className="text-sm font-medium">{prompt.comments}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="w-full flex justify-end">
                    <div className="flex items-center gap-2">
                      {/* Remix Dropdown */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 hover:bg-accent hover:text-accent-foreground transition-all duration-200 hover:scale-110"
                          >
                            <Shuffle className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => handleRemixOption(prompt, 'enhance')}>
                            <Wand2 className="h-4 w-4 mr-2" />
                            Enhance Prompt
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleRemixOption(prompt, 'simplify')}>
                            <Edit className="h-4 w-4 mr-2" />
                            Simplify
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleRemixOption(prompt, 'expand')}>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Expand Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleRemixOption(prompt, 'restyle')}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Change Style
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleRemixOption(prompt, 'random')}>
                            <Shuffle className="h-4 w-4 mr-2" />
                            Random Remix
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      
                      {/* Copy Button */}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 hover:bg-accent hover:text-accent-foreground transition-all duration-200 hover:scale-110"
                        onClick={() => handleCopyPrompt(prompt)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
          
          {/* Empty State */}
          {currentPrompts.length === 0 && (
            <div className="text-center py-12">
              <div className="mx-auto h-24 w-24 rounded-full bg-muted flex items-center justify-center mb-4">
                <Star className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No prompts found</h3>
              <p className="text-muted-foreground">Try switching to a different tab to see more prompts.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
