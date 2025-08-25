"use client";

import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cleanPrompt } from '@/ai/flows/clean-prompt';
import { enhancePrompt } from '@/ai/flows/enhance-prompt';
import { suggestActions } from '@/ai/flows/suggest-actions';
import { analyzePrompt, type AnalyzePromptOutput } from '@/ai/flows/analyze-prompt';
import { organizePrompt, type OrganizePromptOutput } from '@/ai/flows/organize-prompt';
import { Mic, Sparkles, FileText, BarChart3, Lightbulb, BookOpen } from 'lucide-react';

import EnhancedToolsDock from './enhanced-tools-dock';
import { Card, CardContent } from '../ui/card';
import AnalysisDisplay from './analysis-display';
import { Badge } from '../ui/badge';

export default function PlaygroundClient() {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalyzePromptOutput | null>(null);
  const [organization, setOrganization] = useState<OrganizePromptOutput | null>(null);
  const [suggestedActions, setSuggestedActions] = useState<string[]>([]);

  const { toast } = useToast();

  const handleRunTool = async (tool: string) => {
    if (!prompt) {
      toast({
        variant: 'destructive',
        title: 'Prompt is empty',
        description: 'Please enter a prompt before using a tool.',
      });
      return;
    }

    setIsLoading(tool);
    try {
      if (tool === 'enhance') {
        const result = await enhancePrompt({ prompt });
        setPrompt(result.enhancedPrompt);
        toast({ title: 'Prompt Enhanced', description: 'The prompt has been optimized.' });
      } else if (tool === 'clean') {
        const result = await cleanPrompt({ prompt });
        setPrompt(result.cleanedPrompt);
        toast({ title: 'Prompt Cleaned', description: 'Unnecessary elements have been removed.' });
      } else if (tool === 'analyze') {
        const result = await analyzePrompt({ promptText: prompt });
        setAnalysis(result);
        toast({ title: 'Analysis Complete' });
      } else if (tool === 'organize') {
        const result = await organizePrompt({ promptText: prompt });
        setOrganization(result);
        toast({ title: 'Prompt Organized' });
      } else if (tool === 'suggest') {
        const result = await suggestActions({ prompt });
        setSuggestedActions(result.actions);
        toast({ title: 'Actions Suggested' });
      } else if (tool === 'tts') {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(prompt);
            window.speechSynthesis.speak(utterance);
            toast({ title: 'Speaking Prompt' });
        } else {
            toast({ variant: 'destructive', title: 'TTS not supported', description: 'Your browser does not support text-to-speech.' });
        }
      }
    } catch (error) {
      console.error(`Error running ${tool}:`, error);
      toast({
        variant: 'destructive',
        title: `Error running ${tool}`,
        description: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="h-full bg-background text-foreground flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border">
        <h1 className="text-xl font-medium text-foreground">Playground</h1>
        <Button 
          variant="outline" 
          className="bg-transparent border-border text-foreground hover:bg-muted"
          onClick={() => {
            // Save to library functionality
            toast({ title: 'Save to Library', description: 'Feature coming soon!' });
          }}
        >
          Save to Library
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col p-6">
        {/* Textarea */}
        <div className="flex-1 mb-6">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Let's create something amazing..."
            className="h-full bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base resize-none text-muted-foreground placeholder:text-muted-foreground/60"
          />
        </div>

        {/* Bottom Toolbar */}
        <div className="flex items-center justify-center gap-4 py-4">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground hover:bg-muted"
            onClick={() => handleRunTool('tts')}
            disabled={isLoading === 'tts'}
          >
            <Mic className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="text-primary hover:text-primary/80 hover:bg-muted"
            onClick={() => handleRunTool('enhance')}
            disabled={isLoading === 'enhance'}
          >
            <Sparkles className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="text-primary hover:text-primary/80 hover:bg-muted"
            onClick={() => handleRunTool('clean')}
            disabled={isLoading === 'clean'}
          >
            <FileText className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="text-primary hover:text-primary/80 hover:bg-muted"
            onClick={() => handleRunTool('analyze')}
            disabled={isLoading === 'analyze'}
          >
            <BarChart3 className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="text-primary hover:text-primary/80 hover:bg-muted"
            onClick={() => handleRunTool('suggest')}
            disabled={isLoading === 'suggest'}
          >
            <Lightbulb className="h-4 w-4" />
          </Button>
          
          <div className="text-muted-foreground text-sm ml-4">
            Soon
          </div>
        </div>
      </div>

      {/* Hidden Results Panel - Only show when there are results */}
       {(analysis || organization || suggestedActions.length > 0) && (
         <div className="border-t border-border p-6 max-h-96 overflow-y-auto">
           <div className="grid gap-4">
            
            {analysis && (
              <Card className="bg-card border-border">
                  <CardContent className="p-6">
                      <AnalysisDisplay analysis={analysis} />
                  </CardContent>
              </Card>
            )}

            {organization && (
              <Card className="bg-card border-border">
                <CardContent className="p-6 space-y-4">
                  <h3 className="font-semibold text-foreground mb-3">Organization</h3>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-sm mb-2 text-muted-foreground">Category</h4>
                      <Badge variant="secondary" className="bg-muted text-foreground border-border px-3 py-1">{organization.category}</Badge>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm mb-2 text-muted-foreground">Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {organization.tags.map(tag => (
                          <Badge key={tag} className="bg-muted text-foreground border-border px-3 py-1">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {suggestedActions.length > 0 && (
                <Card className="bg-card border-border">
                    <CardContent className="p-6 space-y-4">
                        <h3 className="font-semibold text-foreground mb-3">Suggested Actions</h3>
                        <div className="flex flex-col gap-3">
                            {suggestedActions.map((action, index) => (
                                <Button key={index} variant="outline" size="sm" className="justify-start bg-transparent border-border text-muted-foreground hover:bg-muted hover:text-foreground px-4 py-2">
                                    {action}
                                </Button>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

           </div>
         </div>
       )}
    </div>
  );
}
