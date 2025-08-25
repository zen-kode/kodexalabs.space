import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './use-auth';
import { sendMessageToBackground, handleExtensionError } from '../lib/utils';
import type { Prompt, PromptInsert, SavePromptRequest, CapturedContent } from '../lib/types';
import { useCapturedContent } from '../store/extension-store';

interface UsePromptsReturn {
  prompts: Prompt[];
  loading: boolean;
  error: string | null;
  savePrompt: (promptData: SavePromptRequest) => Promise<Prompt | null>;
  deletePrompt: (promptId: string) => Promise<boolean>;
  refreshPrompts: () => Promise<void>;
  searchPrompts: (query: string) => Promise<Prompt[]>;
  getPromptById: (promptId: string) => Promise<Prompt | null>;
}

export function usePrompts(limit = 20): UsePromptsReturn {
  const { user, isAuthenticated } = useAuth();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch prompts when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      refreshPrompts();
    } else {
      setPrompts([]);
    }
  }, [isAuthenticated, user, limit]);

  // Refresh prompts from database
  const refreshPrompts = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setPrompts([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Try to get prompts via background script first
      const response = await sendMessageToBackground({
        type: 'GET_USER_PROMPTS',
        payload: { limit }
      });

      if (response.success && response.data) {
        setPrompts(response.data);
        return;
      }

      // Fallback: direct database query
      const { data, error: fetchError } = await supabase
        .from('prompts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (fetchError) {
        throw fetchError;
      }

      setPrompts(data || []);

    } catch (err) {
      console.error('Error fetching prompts:', err);
      handleExtensionError(err, 'refreshPrompts');
      setError('Failed to load prompts');
      setPrompts([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, limit]);

  // Save a new prompt
  const savePrompt = useCallback(async (promptData: SavePromptRequest): Promise<Prompt | null> => {
    if (!isAuthenticated || !user) {
      setError('User not authenticated');
      return null;
    }

    try {
      setError(null);

      // Try to save via background script first
      const response = await sendMessageToBackground({
        type: 'SAVE_PROMPT',
        payload: promptData
      });

      if (response.success && response.data) {
        const newPrompt = response.data as Prompt;
        setPrompts(prev => [newPrompt, ...prev]);
        return newPrompt;
      }

      // Fallback: direct database insert
      const insertData: PromptInsert = {
        user_id: user.id,
        title: promptData.title,
        content: promptData.content,
        description: promptData.description || null,
        category: promptData.category || 'web-capture',
        tags: promptData.tags || [],
        is_public: false,
        is_favorite: false,
        metadata: {
          source: 'extension',
          sourceUrl: promptData.sourceUrl,
          capturedAt: promptData.timestamp,
          ...promptData.metadata
        }
      };

      const { data, error: insertError } = await supabase
        .from('prompts')
        .insert(insertData)
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      const newPrompt = data as Prompt;
      setPrompts(prev => [newPrompt, ...prev]);
      return newPrompt;

    } catch (err) {
      console.error('Error saving prompt:', err);
      handleExtensionError(err, 'savePrompt');
      setError('Failed to save prompt');
      return null;
    }
  }, [isAuthenticated, user]);

  // Delete a prompt
  const deletePrompt = useCallback(async (promptId: string): Promise<boolean> => {
    if (!isAuthenticated || !user) {
      setError('User not authenticated');
      return false;
    }

    try {
      setError(null);

      const { error: deleteError } = await supabase
        .from('prompts')
        .delete()
        .eq('id', promptId)
        .eq('user_id', user.id); // Ensure user can only delete their own prompts

      if (deleteError) {
        throw deleteError;
      }

      // Remove from local state
      setPrompts(prev => prev.filter(p => p.id !== promptId));
      return true;

    } catch (err) {
      console.error('Error deleting prompt:', err);
      handleExtensionError(err, 'deletePrompt');
      setError('Failed to delete prompt');
      return false;
    }
  }, [isAuthenticated, user]);

  // Search prompts
  const searchPrompts = useCallback(async (query: string): Promise<Prompt[]> => {
    if (!isAuthenticated || !user || !query.trim()) {
      return [];
    }

    try {
      const { data, error: searchError } = await supabase
        .from('prompts')
        .select('*')
        .eq('user_id', user.id)
        .or(`title.ilike.%${query}%,content.ilike.%${query}%,description.ilike.%${query}%`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (searchError) {
        throw searchError;
      }

      return data || [];

    } catch (err) {
      console.error('Error searching prompts:', err);
      handleExtensionError(err, 'searchPrompts');
      return [];
    }
  }, [isAuthenticated, user]);

  // Get prompt by ID
  const getPromptById = useCallback(async (promptId: string): Promise<Prompt | null> => {
    if (!isAuthenticated || !user) {
      return null;
    }

    try {
      // Check local state first
      const localPrompt = prompts.find(p => p.id === promptId);
      if (localPrompt) {
        return localPrompt;
      }

      // Fetch from database
      const { data, error: fetchError } = await supabase
        .from('prompts')
        .select('*')
        .eq('id', promptId)
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          return null; // Not found
        }
        throw fetchError;
      }

      return data as Prompt;

    } catch (err) {
      console.error('Error fetching prompt by ID:', err);
      handleExtensionError(err, 'getPromptById');
      return null;
    }
  }, [isAuthenticated, user, prompts]);

  return {
    prompts,
    loading,
    error,
    savePrompt,
    deletePrompt,
    refreshPrompts,
    searchPrompts,
    getPromptById
  };
}

// Hook for quick saving captured content
export function useQuickSave() {
  const { savePrompt } = usePrompts();
  const { addCapturedContent } = useCapturedContent();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const quickSave = useCallback(async (
    content: string,
    options: {
      title?: string;
      category?: string;
      tags?: string[];
      sourceUrl?: string;
      context?: string;
    } = {}
  ): Promise<boolean> => {
    try {
      setSaving(true);
      setError(null);

      // Generate title if not provided
      const title = options.title || generateTitleFromContent(content);

      // Create captured content entry
      const capturedContent: CapturedContent = {
        id: Date.now().toString(),
        type: 'text',
        content,
        title,
        url: options.sourceUrl || window.location?.href || '',
        timestamp: new Date().toISOString(),
        context: options.context
      };

      // Add to captured content store
      addCapturedContent(capturedContent);

      // Save as prompt
      const promptData: SavePromptRequest = {
        title,
        content,
        category: options.category || 'web-capture',
        tags: options.tags || [],
        sourceUrl: options.sourceUrl || window.location?.href || '',
        timestamp: new Date().toISOString(),
        metadata: {
          quickSave: true,
          context: options.context
        }
      };

      const savedPrompt = await savePrompt(promptData);
      return !!savedPrompt;

    } catch (err) {
      console.error('Error in quick save:', err);
      handleExtensionError(err, 'quickSave');
      setError('Failed to save content');
      return false;
    } finally {
      setSaving(false);
    }
  }, [savePrompt, addCapturedContent]);

  return {
    quickSave,
    saving,
    error,
    clearError: () => setError(null)
  };
}

// Hook for managing prompt categories
export function usePromptCategories() {
  const { prompts } = usePrompts();
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    // Extract unique categories from prompts
    const uniqueCategories = Array.from(
      new Set(
        prompts
          .map(p => p.category)
          .filter(Boolean)
          .filter(cat => cat !== null)
      )
    ) as string[];

    // Add default categories
    const defaultCategories = ['web-capture', 'general', 'research', 'notes'];
    const allCategories = Array.from(
      new Set([...defaultCategories, ...uniqueCategories])
    ).sort();

    setCategories(allCategories);
  }, [prompts]);

  return categories;
}

// Utility function to generate title from content
function generateTitleFromContent(content: string): string {
  // Take first 50 characters and clean up
  const title = content
    .trim()
    .substring(0, 50)
    .replace(/\s+/g, ' ')
    .replace(/[\r\n]+/g, ' ');

  // Add ellipsis if truncated
  return title.length < content.trim().length ? `${title}...` : title;
}

// Hook for prompt statistics
export function usePromptStats() {
  const { prompts } = usePrompts();
  const [stats, setStats] = useState({
    total: 0,
    byCategory: {} as Record<string, number>,
    recentCount: 0,
    favoriteCount: 0
  });

  useEffect(() => {
    const byCategory: Record<string, number> = {};
    let favoriteCount = 0;
    let recentCount = 0;

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    prompts.forEach(prompt => {
      // Count by category
      const category = prompt.category || 'uncategorized';
      byCategory[category] = (byCategory[category] || 0) + 1;

      // Count favorites
      if (prompt.is_favorite) {
        favoriteCount++;
      }

      // Count recent (last 7 days)
      if (new Date(prompt.created_at) > oneWeekAgo) {
        recentCount++;
      }
    });

    setStats({
      total: prompts.length,
      byCategory,
      recentCount,
      favoriteCount
    });
  }, [prompts]);

  return stats;
}