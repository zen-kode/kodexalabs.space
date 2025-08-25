'use client';

import type { AutoSave, AutoSaveConfig, AutoSaveState, Prompt } from './types';
import { DatabaseFactory } from './database-abstraction';

/**
 * Auto-save engine for prompt editing
 * Handles background saving, conflict resolution, and draft management
 */
export class AutoSaveEngine {
  private config: AutoSaveConfig = {
    enabled: true,
    interval: 5000, // 5 seconds
    maxDrafts: 10,
    retentionDays: 7
  };

  private timers = new Map<string, NodeJS.Timeout>();
  private states = new Map<string, AutoSaveState>();
  private db = DatabaseFactory.getDatabase();
  private listeners = new Map<string, ((state: AutoSaveState) => void)[]>();

  /**
   * Configure auto-save settings
   */
  configure(config: Partial<AutoSaveConfig>) {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): AutoSaveConfig {
    return { ...this.config };
  }

  /**
   * Start auto-save for a prompt
   */
  startAutoSave(promptId: string, userId: string, initialData: {
    title: string;
    content: string;
    category?: string;
    tags?: string[];
  }) {
    if (!this.config.enabled) return;

    // Initialize state
    this.states.set(promptId, {
      isDirty: false,
      lastSaved: new Date().toISOString(),
      saveInProgress: false
    });

    // Clear existing timer if any
    this.clearTimer(promptId);

    // Set up auto-save timer
    const timer = setInterval(() => {
      this.performAutoSave(promptId, userId, initialData);
    }, this.config.interval);

    this.timers.set(promptId, timer);
  }

  /**
   * Stop auto-save for a prompt
   */
  stopAutoSave(promptId: string) {
    this.clearTimer(promptId);
    this.states.delete(promptId);
    this.listeners.delete(promptId);
  }

  /**
   * Mark content as dirty (needs saving)
   */
  markDirty(promptId: string, data: {
    title: string;
    content: string;
    category?: string;
    tags?: string[];
  }) {
    const state = this.states.get(promptId);
    if (!state) return;

    const newState: AutoSaveState = {
      ...state,
      isDirty: true
    };

    this.states.set(promptId, newState);
    this.notifyListeners(promptId, newState);

    // Store the latest data for saving
    (this as any)[`data_${promptId}`] = data;
  }

  /**
   * Force immediate save
   */
  async forceSave(promptId: string, userId: string): Promise<boolean> {
    const data = (this as any)[`data_${promptId}`];
    if (!data) return false;

    return await this.performAutoSave(promptId, userId, data, true);
  }

  /**
   * Get auto-save state for a prompt
   */
  getState(promptId: string): AutoSaveState | null {
    return this.states.get(promptId) || null;
  }

  /**
   * Subscribe to state changes
   */
  subscribe(promptId: string, callback: (state: AutoSaveState) => void) {
    if (!this.listeners.has(promptId)) {
      this.listeners.set(promptId, []);
    }
    this.listeners.get(promptId)!.push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(promptId);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  /**
   * Get all auto-saves for a user
   */
  async getAutoSaves(userId: string): Promise<AutoSave[]> {
    try {
      // This would be implemented in the database abstraction layer
      // For now, return empty array as placeholder
      return [];
    } catch (error) {
      console.error('Error fetching auto-saves:', error);
      return [];
    }
  }

  /**
   * Restore from auto-save
   */
  async restoreAutoSave(autoSaveId: string): Promise<AutoSave | null> {
    try {
      // This would be implemented in the database abstraction layer
      // For now, return null as placeholder
      return null;
    } catch (error) {
      console.error('Error restoring auto-save:', error);
      return null;
    }
  }

  /**
   * Delete auto-save
   */
  async deleteAutoSave(autoSaveId: string): Promise<boolean> {
    try {
      // This would be implemented in the database abstraction layer
      return true;
    } catch (error) {
      console.error('Error deleting auto-save:', error);
      return false;
    }
  }

  /**
   * Clean up expired auto-saves
   */
  async cleanupExpiredAutoSaves(): Promise<number> {
    try {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() - this.config.retentionDays);
      
      // This would be implemented in the database abstraction layer
      return 0;
    } catch (error) {
      console.error('Error cleaning up auto-saves:', error);
      return 0;
    }
  }

  /**
   * Check for conflicts when saving
   */
  async checkForConflicts(promptId: string, lastKnownUpdate: string): Promise<{
    hasConflict: boolean;
    serverVersion?: Prompt;
  }> {
    try {
      // Get current version from server
      const { data: serverPrompt } = await this.db.getPromptById(promptId);
      
      if (!serverPrompt) {
        return { hasConflict: false };
      }

      const serverUpdateTime = new Date(serverPrompt.updatedAt || serverPrompt.createdAt);
      const lastKnownTime = new Date(lastKnownUpdate);

      const hasConflict = serverUpdateTime > lastKnownTime;

      return {
        hasConflict,
        serverVersion: hasConflict ? serverPrompt : undefined
      };
    } catch (error) {
      console.error('Error checking for conflicts:', error);
      return { hasConflict: false };
    }
  }

  /**
   * Resolve conflicts by merging changes
   */
  resolveConflict(localData: {
    title: string;
    content: string;
    category?: string;
    tags?: string[];
  }, serverVersion: Prompt): {
    title: string;
    content: string;
    category?: string;
    tags?: string[];
    conflictResolution: 'local' | 'server' | 'merged';
  } {
    // Simple conflict resolution strategy:
    // - Use local title if different
    // - Merge content if both have changes
    // - Use local category and tags
    
    const merged = {
      title: localData.title !== serverVersion.title ? localData.title : serverVersion.title,
      content: this.mergeContent(localData.content, serverVersion.content),
      category: localData.category || serverVersion.category,
      tags: this.mergeTags(localData.tags || [], serverVersion.tags || []),
      conflictResolution: 'merged' as const
    };

    return merged;
  }

  /**
   * Private methods
   */
  private clearTimer(promptId: string) {
    const timer = this.timers.get(promptId);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(promptId);
    }
  }

  private async performAutoSave(
    promptId: string, 
    userId: string, 
    data: {
      title: string;
      content: string;
      category?: string;
      tags?: string[];
    },
    force: boolean = false
  ): Promise<boolean> {
    const state = this.states.get(promptId);
    if (!state || (!state.isDirty && !force) || state.saveInProgress) {
      return false;
    }

    // Update state to indicate save in progress
    const savingState: AutoSaveState = {
      ...state,
      saveInProgress: true,
      error: undefined
    };
    this.states.set(promptId, savingState);
    this.notifyListeners(promptId, savingState);

    try {
      // Create auto-save record
      const autoSave: Omit<AutoSave, 'id' | 'createdAt'> = {
        promptId: promptId === 'new' ? undefined : promptId,
        userId,
        title: data.title,
        content: data.content,
        category: data.category,
        tags: data.tags,
        expiresAt: new Date(Date.now() + (this.config.retentionDays * 24 * 60 * 60 * 1000)).toISOString(),
        metadata: {
          autoSaved: true,
          version: Date.now()
        }
      };

      // Save to database (placeholder - would be implemented in database layer)
      // const { data: savedAutoSave, error } = await this.db.createAutoSave(autoSave);

      // Update state to indicate successful save
      const savedState: AutoSaveState = {
        isDirty: false,
        lastSaved: new Date().toISOString(),
        saveInProgress: false
      };
      this.states.set(promptId, savedState);
      this.notifyListeners(promptId, savedState);

      return true;
    } catch (error) {
      console.error('Auto-save failed:', error);
      
      // Update state to indicate error
      const errorState: AutoSaveState = {
        ...state,
        saveInProgress: false,
        error: error instanceof Error ? error.message : 'Auto-save failed'
      };
      this.states.set(promptId, errorState);
      this.notifyListeners(promptId, errorState);

      return false;
    }
  }

  private notifyListeners(promptId: string, state: AutoSaveState) {
    const callbacks = this.listeners.get(promptId);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(state);
        } catch (error) {
          console.error('Error in auto-save listener:', error);
        }
      });
    }
  }

  private mergeContent(localContent: string, serverContent: string): string {
    // Simple merge strategy - if contents are very different, prefer local
    // In a real implementation, you might use a more sophisticated diff algorithm
    if (localContent === serverContent) {
      return localContent;
    }

    // If local content is significantly longer, assume user added content
    if (localContent.length > serverContent.length * 1.2) {
      return localContent;
    }

    // If server content is significantly longer, there might be a conflict
    if (serverContent.length > localContent.length * 1.2) {
      // Return a merged version with conflict markers
      return `${localContent}\n\n--- CONFLICT: Server version below ---\n${serverContent}`;
    }

    // Similar lengths, prefer local
    return localContent;
  }

  private mergeTags(localTags: string[], serverTags: string[]): string[] {
    // Merge tags by combining unique values
    const merged = new Set([...localTags, ...serverTags]);
    return Array.from(merged);
  }
}

// Export singleton instance
export const autoSaveEngine = new AutoSaveEngine();

// Auto-cleanup on app start
if (typeof window !== 'undefined') {
  // Clean up expired auto-saves every hour
  setInterval(() => {
    autoSaveEngine.cleanupExpiredAutoSaves();
  }, 60 * 60 * 1000);
}