'use client';

import type { Prompt, PromptVersion, VersionChange, VersionControlConfig } from './types';
import { DatabaseFactory } from './database-abstraction';

/**
 * Version control system for prompts
 * Handles versioning, diff generation, and history management
 */
export class VersionControl {
  private config: VersionControlConfig = {
    maxVersions: 50,
    autoCreateVersions: true,
    versionOnMajorChanges: true,
    majorChangeThreshold: 30 // 30% content change
  };

  private db = DatabaseFactory.getDatabase();

  /**
   * Configure version control settings
   */
  configure(config: Partial<VersionControlConfig>) {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): VersionControlConfig {
    return { ...this.config };
  }

  /**
   * Create a new version of a prompt
   */
  async createVersion(
    promptId: string,
    newData: {
      title: string;
      content: string;
      category?: string;
      tags?: string[];
    },
    userId: string,
    versionNotes?: string,
    force: boolean = false
  ): Promise<{ version: PromptVersion | null; shouldCreateVersion: boolean }> {
    try {
      // Get current prompt
      const { data: currentPrompt } = await this.db.getPromptById(promptId);
      if (!currentPrompt) {
        return { version: null, shouldCreateVersion: false };
      }

      // Check if we should create a version
      const shouldCreateVersion = force || this.shouldCreateVersion(currentPrompt, newData);
      
      if (!shouldCreateVersion) {
        return { version: null, shouldCreateVersion: false };
      }

      // Get current version number
      const currentVersion = currentPrompt.version || 1;
      const newVersion = currentVersion + 1;

      // Calculate changes
      const changes = this.calculateChanges(currentPrompt, newData);

      // Create version record
      const versionData: Omit<PromptVersion, 'id' | 'createdAt'> = {
        promptId,
        version: newVersion,
        title: newData.title,
        content: newData.content,
        changes,
        createdBy: userId,
        versionNotes,
        parentVersionId: currentPrompt.id
      };

      // Save version (placeholder - would be implemented in database layer)
      // const { data: savedVersion, error } = await this.db.createPromptVersion(versionData);
      
      // For now, create a mock version
      const savedVersion: PromptVersion = {
        id: `version_${Date.now()}`,
        createdAt: new Date().toISOString(),
        ...versionData
      };

      // Update the main prompt with new version number
      await this.db.updatePrompt(promptId, {
        ...newData,
        version: newVersion,
        updatedAt: new Date().toISOString()
      });

      // Clean up old versions if needed
      await this.cleanupOldVersions(promptId);

      return { version: savedVersion, shouldCreateVersion: true };
    } catch (error) {
      console.error('Error creating version:', error);
      return { version: null, shouldCreateVersion: false };
    }
  }

  /**
   * Get version history for a prompt
   */
  async getVersionHistory(promptId: string): Promise<PromptVersion[]> {
    try {
      // This would be implemented in the database abstraction layer
      // For now, return empty array as placeholder
      return [];
    } catch (error) {
      console.error('Error fetching version history:', error);
      return [];
    }
  }

  /**
   * Get a specific version
   */
  async getVersion(versionId: string): Promise<PromptVersion | null> {
    try {
      // This would be implemented in the database abstraction layer
      return null;
    } catch (error) {
      console.error('Error fetching version:', error);
      return null;
    }
  }

  /**
   * Revert to a previous version
   */
  async revertToVersion(
    promptId: string,
    versionId: string,
    userId: string,
    createNewVersion: boolean = true
  ): Promise<boolean> {
    try {
      // Get the target version
      const targetVersion = await this.getVersion(versionId);
      if (!targetVersion) {
        return false;
      }

      // Get current prompt
      const { data: currentPrompt } = await this.db.getPromptById(promptId);
      if (!currentPrompt) {
        return false;
      }

      // Create a new version if requested (to preserve history)
      if (createNewVersion) {
        await this.createVersion(
          promptId,
          {
            title: targetVersion.title,
            content: targetVersion.content,
            category: currentPrompt.category,
            tags: currentPrompt.tags
          },
          userId,
          `Reverted to version ${targetVersion.version}`,
          true
        );
      } else {
        // Direct update
        await this.db.updatePrompt(promptId, {
          title: targetVersion.title,
          content: targetVersion.content,
          updatedAt: new Date().toISOString()
        });
      }

      return true;
    } catch (error) {
      console.error('Error reverting to version:', error);
      return false;
    }
  }

  /**
   * Compare two versions
   */
  async compareVersions(
    versionId1: string,
    versionId2: string
  ): Promise<{
    changes: VersionChange[];
    diff: {
      title: { old: string; new: string; changed: boolean };
      content: { old: string; new: string; changed: boolean; diff: string };
    };
  } | null> {
    try {
      const [version1, version2] = await Promise.all([
        this.getVersion(versionId1),
        this.getVersion(versionId2)
      ]);

      if (!version1 || !version2) {
        return null;
      }

      const changes = this.calculateChanges(
        { title: version1.title, content: version1.content },
        { title: version2.title, content: version2.content }
      );

      const diff = {
        title: {
          old: version1.title,
          new: version2.title,
          changed: version1.title !== version2.title
        },
        content: {
          old: version1.content,
          new: version2.content,
          changed: version1.content !== version2.content,
          diff: this.generateTextDiff(version1.content, version2.content)
        }
      };

      return { changes, diff };
    } catch (error) {
      console.error('Error comparing versions:', error);
      return null;
    }
  }

  /**
   * Branch from a version (create a new prompt based on a version)
   */
  async branchFromVersion(
    versionId: string,
    userId: string,
    newTitle?: string
  ): Promise<Prompt | null> {
    try {
      const version = await this.getVersion(versionId);
      if (!version) {
        return null;
      }

      // Create new prompt based on the version
      const newPromptData = {
        title: newTitle || `${version.title} (Branch)`,
        content: version.content,
        category: 'Branched',
        tags: ['branched', 'version-control'],
        user_id: userId,
        metadata: {
          branchedFrom: versionId,
          originalPromptId: version.promptId,
          branchedAt: new Date().toISOString()
        }
      };

      const { data: newPrompt } = await this.db.createPrompt(newPromptData);
      return newPrompt;
    } catch (error) {
      console.error('Error branching from version:', error);
      return null;
    }
  }

  /**
   * Get version statistics
   */
  async getVersionStats(promptId: string): Promise<{
    totalVersions: number;
    oldestVersion: string;
    newestVersion: string;
    averageChangeSize: number;
  } | null> {
    try {
      const versions = await this.getVersionHistory(promptId);
      if (versions.length === 0) {
        return null;
      }

      const totalChanges = versions.reduce((sum, version) => sum + version.changes.length, 0);
      
      return {
        totalVersions: versions.length,
        oldestVersion: versions[versions.length - 1]?.createdAt || '',
        newestVersion: versions[0]?.createdAt || '',
        averageChangeSize: totalChanges / versions.length
      };
    } catch (error) {
      console.error('Error getting version stats:', error);
      return null;
    }
  }

  /**
   * Private methods
   */
  private shouldCreateVersion(
    currentPrompt: Prompt,
    newData: { title: string; content: string; category?: string; tags?: string[] }
  ): boolean {
    if (!this.config.autoCreateVersions) {
      return false;
    }

    // Always create version if title changed
    if (currentPrompt.title !== newData.title) {
      return true;
    }

    // Check if content change is significant
    if (this.config.versionOnMajorChanges) {
      const changePercentage = this.calculateChangePercentage(
        currentPrompt.content,
        newData.content
      );
      return changePercentage >= this.config.majorChangeThreshold;
    }

    // Create version for any content change
    return currentPrompt.content !== newData.content;
  }

  private calculateChangePercentage(oldContent: string, newContent: string): number {
    const oldWords = oldContent.split(/\s+/);
    const newWords = newContent.split(/\s+/);
    
    const maxLength = Math.max(oldWords.length, newWords.length);
    if (maxLength === 0) return 0;

    // Simple word-based diff
    let changes = 0;
    const minLength = Math.min(oldWords.length, newWords.length);
    
    for (let i = 0; i < minLength; i++) {
      if (oldWords[i] !== newWords[i]) {
        changes++;
      }
    }
    
    // Add changes for length differences
    changes += Math.abs(oldWords.length - newWords.length);
    
    return (changes / maxLength) * 100;
  }

  private calculateChanges(
    oldData: { title: string; content: string },
    newData: { title: string; content: string }
  ): VersionChange[] {
    const changes: VersionChange[] = [];

    // Title changes
    if (oldData.title !== newData.title) {
      changes.push({
        type: 'modify',
        field: 'title',
        oldValue: oldData.title,
        newValue: newData.title
      });
    }

    // Content changes
    if (oldData.content !== newData.content) {
      changes.push({
        type: 'modify',
        field: 'content',
        oldValue: oldData.content,
        newValue: newData.content
      });
    }

    return changes;
  }

  private generateTextDiff(oldText: string, newText: string): string {
    // Simple line-based diff
    const oldLines = oldText.split('\n');
    const newLines = newText.split('\n');
    
    const diff: string[] = [];
    const maxLines = Math.max(oldLines.length, newLines.length);
    
    for (let i = 0; i < maxLines; i++) {
      const oldLine = oldLines[i] || '';
      const newLine = newLines[i] || '';
      
      if (oldLine !== newLine) {
        if (oldLine && !newLine) {
          diff.push(`- ${oldLine}`);
        } else if (!oldLine && newLine) {
          diff.push(`+ ${newLine}`);
        } else {
          diff.push(`- ${oldLine}`);
          diff.push(`+ ${newLine}`);
        }
      } else if (oldLine) {
        diff.push(`  ${oldLine}`);
      }
    }
    
    return diff.join('\n');
  }

  private async cleanupOldVersions(promptId: string): Promise<void> {
    try {
      const versions = await this.getVersionHistory(promptId);
      
      if (versions.length > this.config.maxVersions) {
        const versionsToDelete = versions.slice(this.config.maxVersions);
        
        // Delete old versions (placeholder - would be implemented in database layer)
        for (const version of versionsToDelete) {
          // await this.db.deletePromptVersion(version.id);
        }
      }
    } catch (error) {
      console.error('Error cleaning up old versions:', error);
    }
  }
}

// Export singleton instance
export const versionControl = new VersionControl();