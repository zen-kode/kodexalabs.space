'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { DatabaseFactory } from '@/lib/database-abstraction';
import { searchEngine } from '@/lib/search-engine';
import { autoSaveEngine } from '@/lib/autosave-engine';
import { versionControl } from '@/lib/version-control';
import type { 
  Prompt, 
  SearchQuery, 
  SearchResponse, 
  AutoSaveState,
  PromptVersion,
  AutoSave
} from '@/lib/types';
import { useAuth } from './use-auth';

interface UseEnhancedPromptsOptions {
  enableAutoSave?: boolean;
  enableVersioning?: boolean;
  autoSaveInterval?: number;
}

interface UseEnhancedPromptsReturn {
  // Basic prompt operations
  prompts: Prompt[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  
  // Search functionality
  search: (query: SearchQuery) => SearchResponse;
  searchResults: SearchResponse | null;
  searchSuggestions: string[];
  getSearchSuggestions: (query: string) => string[];
  
  // Auto-save functionality
  autoSaveState: Map<string, AutoSaveState>;
  startAutoSave: (promptId: string, data: {
    title: string;
    content: string;
    category?: string;
    tags?: string[];
  }) => void;
  stopAutoSave: (promptId: string) => void;
  markDirty: (promptId: string, data: {
    title: string;
    content: string;
    category?: string;
    tags?: string[];
  }) => void;
  forceSave: (promptId: string) => Promise<boolean>;
  getAutoSaves: () => Promise<AutoSave[]>;
  restoreAutoSave: (autoSaveId: string) => Promise<AutoSave | null>;
  
  // Version control functionality
  createVersion: (promptId: string, data: {
    title: string;
    content: string;
    category?: string;
    tags?: string[];
  }, versionNotes?: string) => Promise<PromptVersion | null>;
  getVersionHistory: (promptId: string) => Promise<PromptVersion[]>;
  revertToVersion: (promptId: string, versionId: string) => Promise<boolean>;
  compareVersions: (versionId1: string, versionId2: string) => Promise<any>;
  branchFromVersion: (versionId: string, newTitle?: string) => Promise<Prompt | null>;
  
  // Enhanced prompt operations
  createPrompt: (data: {
    title: string;
    content: string;
    category?: string;
    tags?: string[];
  }) => Promise<Prompt | null>;
  updatePrompt: (id: string, data: Partial<Prompt>) => Promise<Prompt | null>;
  deletePrompt: (id: string) => Promise<boolean>;
  duplicatePrompt: (id: string, newTitle?: string) => Promise<Prompt | null>;
  
  // Analytics and insights
  getPromptStats: () => {
    total: number;
    categories: { name: string; count: number }[];
    tags: { name: string; count: number }[];
    recentActivity: { date: string; count: number }[];
  };
}

export function useEnhancedPrompts(
  options: UseEnhancedPromptsOptions = {}
): UseEnhancedPromptsReturn {
  const {
    enableAutoSave = true,
    enableVersioning = true,
    autoSaveInterval = 5000
  } = options;

  // Basic state
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [autoSaveState, setAutoSaveState] = useState<Map<string, AutoSaveState>>(new Map());
  
  const { user } = useAuth();
  const [db] = useState(() => DatabaseFactory.getDatabase());

  // Configure engines
  useEffect(() => {
    if (enableAutoSave) {
      autoSaveEngine.configure({
        enabled: true,
        interval: autoSaveInterval,
        maxDrafts: 10,
        retentionDays: 7
      });
    }

    if (enableVersioning) {
      versionControl.configure({
        maxVersions: 50,
        autoCreateVersions: true,
        versionOnMajorChanges: true,
        majorChangeThreshold: 30
      });
    }
  }, [enableAutoSave, enableVersioning, autoSaveInterval]);

  // Fetch prompts
  const fetchPrompts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user) {
        setPrompts([]);
        return;
      }

      const { data, error: fetchError } = await db.getPrompts(user.id);

      if (fetchError) {
        throw fetchError;
      }

      // Enhance prompts with computed metadata
      const enhancedPrompts = (data || []).map(prompt => ({
        ...prompt,
        wordCount: prompt.content.split(/\s+/).length,
        readingTime: searchEngine.calculateReadingTime(prompt.content),
        complexity: searchEngine.determineComplexity(prompt.content),
        searchKeywords: searchEngine.extractKeywords(`${prompt.title} ${prompt.content}`)
      }));

      setPrompts(enhancedPrompts);
    } catch (err) {
      console.error('Error fetching prompts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch prompts');
    } finally {
      setLoading(false);
    }
  }, [user, db]);

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  // Search functionality
  const search = useCallback((query: SearchQuery): SearchResponse => {
    const results = searchEngine.search(prompts, query);
    setSearchResults(results);
    return results;
  }, [prompts]);

  const getSearchSuggestions = useCallback((query: string): string[] => {
    return searchEngine.getSuggestions(prompts, query);
  }, [prompts]);

  const searchSuggestions = useMemo(() => {
    return searchResults ? [] : [];
  }, [searchResults]);

  // Auto-save functionality
  const startAutoSave = useCallback((promptId: string, data: {
    title: string;
    content: string;
    category?: string;
    tags?: string[];
  }) => {
    if (!enableAutoSave || !user) return;
    
    autoSaveEngine.startAutoSave(promptId, user.id, data);
    
    // Subscribe to state changes
    const unsubscribe = autoSaveEngine.subscribe(promptId, (state) => {
      setAutoSaveState(prev => new Map(prev.set(promptId, state)));
    });

    // Store unsubscribe function for cleanup
    return unsubscribe;
  }, [enableAutoSave, user]);

  const stopAutoSave = useCallback((promptId: string) => {
    autoSaveEngine.stopAutoSave(promptId);
    setAutoSaveState(prev => {
      const newMap = new Map(prev);
      newMap.delete(promptId);
      return newMap;
    });
  }, []);

  const markDirty = useCallback((promptId: string, data: {
    title: string;
    content: string;
    category?: string;
    tags?: string[];
  }) => {
    if (!enableAutoSave) return;
    autoSaveEngine.markDirty(promptId, data);
  }, [enableAutoSave]);

  const forceSave = useCallback(async (promptId: string): Promise<boolean> => {
    if (!enableAutoSave || !user) return false;
    return await autoSaveEngine.forceSave(promptId, user.id);
  }, [enableAutoSave, user]);

  const getAutoSaves = useCallback(async (): Promise<AutoSave[]> => {
    if (!user) return [];
    return await autoSaveEngine.getAutoSaves(user.id);
  }, [user]);

  const restoreAutoSave = useCallback(async (autoSaveId: string): Promise<AutoSave | null> => {
    return await autoSaveEngine.restoreAutoSave(autoSaveId);
  }, []);

  // Version control functionality
  const createVersion = useCallback(async (
    promptId: string,
    data: {
      title: string;
      content: string;
      category?: string;
      tags?: string[];
    },
    versionNotes?: string
  ): Promise<PromptVersion | null> => {
    if (!enableVersioning || !user) return null;
    
    const { version } = await versionControl.createVersion(
      promptId,
      data,
      user.id,
      versionNotes
    );
    
    // Refresh prompts to get updated version info
    await fetchPrompts();
    
    return version;
  }, [enableVersioning, user, fetchPrompts]);

  const getVersionHistory = useCallback(async (promptId: string): Promise<PromptVersion[]> => {
    return await versionControl.getVersionHistory(promptId);
  }, []);

  const revertToVersion = useCallback(async (
    promptId: string,
    versionId: string
  ): Promise<boolean> => {
    if (!user) return false;
    
    const success = await versionControl.revertToVersion(promptId, versionId, user.id);
    
    if (success) {
      await fetchPrompts();
    }
    
    return success;
  }, [user, fetchPrompts]);

  const compareVersions = useCallback(async (versionId1: string, versionId2: string) => {
    return await versionControl.compareVersions(versionId1, versionId2);
  }, []);

  const branchFromVersion = useCallback(async (
    versionId: string,
    newTitle?: string
  ): Promise<Prompt | null> => {
    if (!user) return null;
    
    const newPrompt = await versionControl.branchFromVersion(versionId, user.id, newTitle);
    
    if (newPrompt) {
      await fetchPrompts();
    }
    
    return newPrompt;
  }, [user, fetchPrompts]);

  // Enhanced prompt operations
  const createPrompt = useCallback(async (data: {
    title: string;
    content: string;
    category?: string;
    tags?: string[];
  }): Promise<Prompt | null> => {
    if (!user) return null;

    try {
      const enhancedData = {
        ...data,
        user_id: user.id,
        wordCount: data.content.split(/\s+/).length,
        readingTime: searchEngine.calculateReadingTime(data.content),
        complexity: searchEngine.determineComplexity(data.content),
        searchKeywords: searchEngine.extractKeywords(`${data.title} ${data.content}`),
        version: 1,
        isLatest: true
      };

      const { data: newPrompt, error } = await db.createPrompt(enhancedData);
      
      if (error) {
        throw error;
      }

      await fetchPrompts();
      return newPrompt;
    } catch (err) {
      console.error('Error creating prompt:', err);
      setError(err instanceof Error ? err.message : 'Failed to create prompt');
      return null;
    }
  }, [user, db, fetchPrompts]);

  const updatePrompt = useCallback(async (
    id: string,
    data: Partial<Prompt>
  ): Promise<Prompt | null> => {
    try {
      // Create version if versioning is enabled
      if (enableVersioning && data.content) {
        await createVersion(id, {
          title: data.title || '',
          content: data.content,
          category: data.category,
          tags: data.tags
        });
      }

      const enhancedData = {
        ...data,
        updatedAt: new Date().toISOString()
      };

      if (data.content) {
        enhancedData.wordCount = data.content.split(/\s+/).length;
        enhancedData.readingTime = searchEngine.calculateReadingTime(data.content);
        enhancedData.complexity = searchEngine.determineComplexity(data.content);
        enhancedData.searchKeywords = searchEngine.extractKeywords(
          `${data.title || ''} ${data.content}`
        );
      }

      const { data: updatedPrompt, error } = await db.updatePrompt(id, enhancedData);
      
      if (error) {
        throw error;
      }

      await fetchPrompts();
      return updatedPrompt;
    } catch (err) {
      console.error('Error updating prompt:', err);
      setError(err instanceof Error ? err.message : 'Failed to update prompt');
      return null;
    }
  }, [db, fetchPrompts, enableVersioning, createVersion]);

  const deletePrompt = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await db.deletePrompt(id);
      
      if (error) {
        throw error;
      }

      // Stop auto-save for this prompt
      stopAutoSave(id);
      
      await fetchPrompts();
      return true;
    } catch (err) {
      console.error('Error deleting prompt:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete prompt');
      return false;
    }
  }, [db, fetchPrompts, stopAutoSave]);

  const duplicatePrompt = useCallback(async (
    id: string,
    newTitle?: string
  ): Promise<Prompt | null> => {
    const originalPrompt = prompts.find(p => p.id === id);
    if (!originalPrompt) return null;

    return await createPrompt({
      title: newTitle || `${originalPrompt.title} (Copy)`,
      content: originalPrompt.content,
      category: originalPrompt.category,
      tags: [...(originalPrompt.tags || []), 'duplicate']
    });
  }, [prompts, createPrompt]);

  // Analytics and insights
  const getPromptStats = useCallback(() => {
    const categories = new Map<string, number>();
    const tags = new Map<string, number>();
    const recentActivity = new Map<string, number>();

    prompts.forEach(prompt => {
      // Count categories
      if (prompt.category) {
        categories.set(prompt.category, (categories.get(prompt.category) || 0) + 1);
      }

      // Count tags
      (prompt.tags || []).forEach(tag => {
        tags.set(tag, (tags.get(tag) || 0) + 1);
      });

      // Count recent activity (last 30 days)
      const date = new Date(prompt.createdAt).toISOString().split('T')[0];
      const now = new Date();
      const promptDate = new Date(prompt.createdAt);
      const daysDiff = Math.floor((now.getTime() - promptDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff <= 30) {
        recentActivity.set(date, (recentActivity.get(date) || 0) + 1);
      }
    });

    return {
      total: prompts.length,
      categories: Array.from(categories.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
      tags: Array.from(tags.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20),
      recentActivity: Array.from(recentActivity.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date))
    };
  }, [prompts]);

  return {
    // Basic operations
    prompts,
    loading,
    error,
    refetch: fetchPrompts,
    
    // Search
    search,
    searchResults,
    searchSuggestions,
    getSearchSuggestions,
    
    // Auto-save
    autoSaveState,
    startAutoSave,
    stopAutoSave,
    markDirty,
    forceSave,
    getAutoSaves,
    restoreAutoSave,
    
    // Version control
    createVersion,
    getVersionHistory,
    revertToVersion,
    compareVersions,
    branchFromVersion,
    
    // Enhanced operations
    createPrompt,
    updatePrompt,
    deletePrompt,
    duplicatePrompt,
    
    // Analytics
    getPromptStats
  };
}

export default useEnhancedPrompts;