'use server';

import { ai, isAIAvailable } from '@/ai/genkit';
import { DatabaseFactory } from '@/lib/database-abstraction';
import { z } from 'genkit';
import { Prompt } from '@/lib/types';

// Enhanced AI service that integrates with Firebase/database
export class FirebaseAIService {
  private db = DatabaseFactory.getDatabase();

  // Enhanced prompt flow that saves results to database
  async enhanceAndSavePrompt(input: {
    prompt: string;
    userId: string;
    title?: string;
    category?: string;
    tags?: string[];
  }) {
    try {
      // Check if AI is available
      if (!isAIAvailable()) {
        console.warn('AI service not available for enhancement');
        return {
          enhanced: { enhancedPrompt: input.prompt },
          saved: false,
          error: 'AI service not configured. Please set GEMINI_API_KEY.'
        };
      }

      // Use existing enhance prompt flow
      const { enhancePrompt } = await import('@/ai/flows/enhance-prompt');
      const enhanced = await enhancePrompt({ prompt: input.prompt });

      // Save both original and enhanced prompts to database
      const promptData = {
        title: input.title || 'Enhanced Prompt',
        content: enhanced.enhancedPrompt,
        category: input.category || 'Enhanced',
        tags: input.tags || ['enhanced', 'ai-generated'],
        user_id: input.userId,
        metadata: {
          originalPrompt: input.prompt,
          enhancedAt: new Date().toISOString(),
          aiModel: 'gemini-2.0-flash',
          enhancementType: 'genkit-enhancement'
        }
      };

      const { data: savedPrompt, error } = await this.db.createPrompt(promptData);
      
      if (error) {
        console.error('Error saving enhanced prompt:', error);
        return { enhanced, saved: false, error };
      }

      return { 
        enhanced, 
        saved: true, 
        promptId: savedPrompt?.id,
        savedPrompt 
      };
    } catch (error) {
      console.error('Error in enhanceAndSavePrompt:', error);
      return { enhanced: null, saved: false, error };
    }
  }

  // Analyze prompt and save analysis results
  async analyzeAndSavePrompt(input: {
    prompt: string;
    userId: string;
    promptId?: string;
  }) {
    try {
      // Check if AI is available
      if (!isAIAvailable()) {
        console.warn('AI service not available for analysis');
        return {
          analysis: null,
          saved: false,
          error: 'AI service not configured. Please set GEMINI_API_KEY.'
        };
      }

      const { analyzePrompt } = await import('@/ai/flows/analyze-prompt');
      const analysis = await analyzePrompt({ promptText: input.prompt });

      // If promptId is provided, update existing prompt with analysis
      if (input.promptId) {
        const { error } = await this.db.updatePrompt(input.promptId, {
          metadata: {
            analysis,
            analyzedAt: new Date().toISOString(),
            aiModel: 'gemini-2.0-flash'
          }
        });

        if (error) {
          console.error('Error updating prompt with analysis:', error);
        }
      } else {
        // Create new prompt with analysis
        const promptData = {
          title: 'Analyzed Prompt',
          content: input.prompt,
          category: 'Analysis',
          tags: ['analyzed', 'ai-generated'],
          user_id: input.userId,
          metadata: {
            analysis,
            analyzedAt: new Date().toISOString(),
            aiModel: 'gemini-2.0-flash'
          }
        };

        await this.db.createPrompt(promptData);
      }

      return { analysis, saved: true };
    } catch (error) {
      console.error('Error in analyzeAndSavePrompt:', error);
      return { analysis: null, saved: false, error };
    }
  }

  // Clean prompt and save cleaned version
  async cleanAndSavePrompt(input: {
    prompt: string;
    userId: string;
    title?: string;
  }) {
    try {
      const { cleanPrompt } = await import('@/ai/flows/clean-prompt');
      const cleaned = await cleanPrompt({ prompt: input.prompt });

      const promptData = {
        title: input.title || 'Cleaned Prompt',
        content: cleaned.cleanedPrompt,
        category: 'Cleaned',
        tags: ['cleaned', 'ai-generated'],
        user_id: input.userId,
        metadata: {
          originalPrompt: input.prompt,
          cleanedAt: new Date().toISOString(),
          aiModel: 'gemini-2.0-flash'
        }
      };

      const { data: savedPrompt, error } = await this.db.createPrompt(promptData);
      
      return { 
        cleaned, 
        saved: !error, 
        promptId: savedPrompt?.id,
        error 
      };
    } catch (error) {
      console.error('Error in cleanAndSavePrompt:', error);
      return { cleaned: null, saved: false, error };
    }
  }

  // Organize prompt and save organized version
  async organizeAndSavePrompt(input: {
    prompt: string;
    userId: string;
    title?: string;
  }) {
    try {
      const { organizePrompt } = await import('@/ai/flows/organize-prompt');
      const organized = await organizePrompt({ promptText: input.prompt });

      const promptData = {
        title: input.title || 'Organized Prompt',
        content: input.prompt, // Keep original prompt as content
        category: organized.category || 'Organized',
        tags: organized.tags || ['organized', 'ai-generated'],
        user_id: input.userId,
        metadata: {
          originalPrompt: input.prompt,
          organizedAt: new Date().toISOString(),
          aiModel: 'gemini-2.0-flash',
          organizationType: 'genkit-organization',
          organizationResult: organized
        }
      };

      const { data: savedPrompt, error } = await this.db.createPrompt(promptData);
      
      return { 
        organized, 
        saved: !error, 
        promptId: savedPrompt?.id,
        error 
      };
    } catch (error) {
      console.error('Error in organizeAndSavePrompt:', error);
      return { organized: null, saved: false, error };
    }
  }

  // Get AI suggestions based on user's prompt history
  async getPersonalizedSuggestions(userId: string, limit = 5) {
    try {
      const { data: recentPrompts, error } = await this.db.getPrompts(userId, 10);
      
      if (error || !recentPrompts?.length) {
        return { suggestions: [], error };
      }

      // Analyze user's prompt patterns
      const categories = recentPrompts.map(p => p.category).filter(Boolean) as string[];
      const tags = recentPrompts.flatMap(p => p.tags || []);
      const commonTopics = this.extractCommonTopics(categories, tags);

      const { suggestActions } = await import('@/ai/flows/suggest-actions');
      const suggestions = await suggestActions({ 
        prompt: `Based on user's interests in: ${commonTopics.join(', ')}, suggest ${limit} relevant prompt ideas.` 
      });

      return { suggestions: suggestions.actions, commonTopics };
    } catch (error) {
      console.error('Error getting personalized suggestions:', error);
      return { suggestions: [], error };
    }
  }

  // Batch process multiple prompts
  async batchProcessPrompts(input: {
    prompts: Array<{
      content: string;
      title?: string;
      operation: 'enhance' | 'clean' | 'organize' | 'analyze';
    }>;
    userId: string;
  }) {
    const results = [];

    for (const promptItem of input.prompts) {
      try {
        let result;
        
        switch (promptItem.operation) {
          case 'enhance':
            result = await this.enhanceAndSavePrompt({
              prompt: promptItem.content,
              userId: input.userId,
              title: promptItem.title
            });
            break;
          case 'clean':
            result = await this.cleanAndSavePrompt({
              prompt: promptItem.content,
              userId: input.userId,
              title: promptItem.title
            });
            break;
          case 'organize':
            result = await this.organizeAndSavePrompt({
              prompt: promptItem.content,
              userId: input.userId,
              title: promptItem.title
            });
            break;
          case 'analyze':
            result = await this.analyzeAndSavePrompt({
              prompt: promptItem.content,
              userId: input.userId
            });
            break;
          default:
            result = { error: 'Unknown operation' };
        }

        results.push({ 
          original: promptItem, 
          result, 
          success: !result.error 
        });
      } catch (error) {
        results.push({ 
          original: promptItem, 
          result: { error }, 
          success: false 
        });
      }
    }

    return { results, totalProcessed: results.length };
  }

  // Helper method to extract common topics
  private extractCommonTopics(categories: string[], tags: string[]): string[] {
    const allTopics = [...categories, ...tags];
    const topicCounts = allTopics.reduce((acc, topic) => {
      acc[topic] = (acc[topic] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(topicCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([topic]) => topic);
  }

  // Get AI processing statistics for a user
  async getUserAIStats(userId: string) {
    try {
      const { data: prompts, error } = await this.db.getPrompts(userId, 100);
      
      if (error || !prompts) {
        return { stats: null, error };
      }

      const stats = {
        totalPrompts: prompts.length,
        enhancedPrompts: prompts.filter(p => p.tags?.includes('enhanced')).length,
        cleanedPrompts: prompts.filter(p => p.tags?.includes('cleaned')).length,
        organizedPrompts: prompts.filter(p => p.tags?.includes('organized')).length,
        analyzedPrompts: prompts.filter(p => p.metadata && p.metadata.analysis).length,
        categories: [...new Set(prompts.map(p => p.category).filter(Boolean))],
        mostUsedTags: this.extractCommonTopics([], prompts.flatMap(p => p.tags || [])),
        recentActivity: prompts.slice(0, 10).map(p => ({
          id: p.id,
          title: p.title,
          createdAt: p.createdAt,
          category: p.category
        }))
      };

      return { stats, error: null };
    } catch (error) {
      console.error('Error getting user AI stats:', error);
      return { stats: null, error };
    }
  }
}

// Export singleton instance
export const firebaseAIService = new FirebaseAIService();
export default firebaseAIService;