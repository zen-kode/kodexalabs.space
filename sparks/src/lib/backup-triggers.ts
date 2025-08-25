/**
 * Automated Backup Trigger System
 * 
 * Monitors project activity and automatically triggers backups based on
 * intelligent conditions like task milestones, feature completion, and risk factors.
 */

import { backupEngine } from './backup-engine';
import { syncEngine } from './sync-engine';
import { readFileSync, writeFileSync, existsSync, watchFile } from 'fs';
import { join } from 'path';

interface TriggerCondition {
  id: string;
  name: string;
  description: string;
  condition: () => Promise<boolean>;
  priority: 'low' | 'medium' | 'high' | 'critical';
  cooldown: number; // minutes
  lastTriggered?: string;
}

interface TriggerState {
  lastCheck: string;
  triggerHistory: TriggerEvent[];
  activeConditions: string[];
  suppressedUntil?: string;
}

interface TriggerEvent {
  id: string;
  triggerId: string;
  timestamp: string;
  condition: string;
  backupId?: string;
  success: boolean;
  reason: string;
}

interface TaskAnalysis {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  recentlyCompleted: string[];
  featuresInProgress: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

class BackupTriggerSystem {
  private projectRoot: string;
  private triggerStatePath: string;
  private conditions: TriggerCondition[];
  private isMonitoring: boolean = false;
  private monitoringInterval?: NodeJS.Timeout;
  private fileWatchers: Map<string, any> = new Map();

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
    this.triggerStatePath = join(projectRoot, '.trae-backups', 'trigger-state.json');
    this.conditions = this.initializeTriggerConditions();
  }

  /**
   * Start the automated trigger system
   */
  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      console.log('[BACKUP-TRIGGERS] ⚠️  Already monitoring');
      return;
    }

    console.log('[BACKUP-TRIGGERS] 🚀 Starting automated backup monitoring...');
    
    try {
      // Initialize trigger state
      await this.initializeTriggerState();
      
      // Start file watchers
      this.startFileWatchers();
      
      // Start periodic checks
      this.startPeriodicChecks();
      
      this.isMonitoring = true;
      console.log('[BACKUP-TRIGGERS] ✅ Monitoring started successfully');
      
    } catch (error) {
      console.error('[BACKUP-TRIGGERS] ❌ Failed to start monitoring:', error);
      throw error;
    }
  }

  /**
   * Stop the automated trigger system
   */
  async stopMonitoring(): Promise<void> {
    if (!this.isMonitoring) {
      return;
    }

    console.log('[BACKUP-TRIGGERS] 🛑 Stopping automated backup monitoring...');
    
    // Stop periodic checks
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    
    // Stop file watchers
    this.fileWatchers.forEach((watcher, path) => {
      watcher.close();
    });
    this.fileWatchers.clear();
    
    this.isMonitoring = false;
    console.log('[BACKUP-TRIGGERS] ✅ Monitoring stopped');
  }

  /**
   * Manually check all trigger conditions
   */
  async checkTriggers(): Promise<TriggerEvent[]> {
    console.log('[BACKUP-TRIGGERS] 🔍 Checking trigger conditions...');
    
    const events: TriggerEvent[] = [];
    const state = this.loadTriggerState();
    
    // Check if triggers are suppressed
    if (state.suppressedUntil && new Date(state.suppressedUntil) > new Date()) {
      console.log('[BACKUP-TRIGGERS] 🔇 Triggers suppressed until', state.suppressedUntil);
      return events;
    }
    
    for (const condition of this.conditions) {
      try {
        // Check cooldown
        if (condition.lastTriggered) {
          const lastTrigger = new Date(condition.lastTriggered);
          const cooldownEnd = new Date(lastTrigger.getTime() + condition.cooldown * 60 * 1000);
          
          if (new Date() < cooldownEnd) {
            continue; // Still in cooldown
          }
        }
        
        // Check condition
        const shouldTrigger = await condition.condition();
        
        if (shouldTrigger) {
          console.log(`[BACKUP-TRIGGERS] 🎯 Condition triggered: ${condition.name}`);
          
          const event = await this.executeTrigger(condition);
          events.push(event);
          
          // Update last triggered time
          condition.lastTriggered = new Date().toISOString();
        }
        
      } catch (error) {
        console.error(`[BACKUP-TRIGGERS] ❌ Error checking condition ${condition.id}:`, error);
        
        events.push({
          id: this.generateEventId(),
          triggerId: condition.id,
          timestamp: new Date().toISOString(),
          condition: condition.name,
          success: false,
          reason: `Error: ${error instanceof Error ? error.message : String(error)}`
        });
      }
    }
    
    // Update trigger state
    state.lastCheck = new Date().toISOString();
    state.triggerHistory.push(...events);
    
    // Keep only last 100 events
    if (state.triggerHistory.length > 100) {
      state.triggerHistory = state.triggerHistory.slice(-100);
    }
    
    this.saveTriggerState(state);
    
    if (events.length > 0) {
      console.log(`[BACKUP-TRIGGERS] ✅ Processed ${events.length} trigger events`);
    }
    
    return events;
  }

  /**
   * Suppress triggers for a specified duration
   */
  suppressTriggers(minutes: number): void {
    const state = this.loadTriggerState();
    state.suppressedUntil = new Date(Date.now() + minutes * 60 * 1000).toISOString();
    this.saveTriggerState(state);
    
    console.log(`[BACKUP-TRIGGERS] 🔇 Triggers suppressed for ${minutes} minutes`);
  }

  /**
   * Get trigger system status
   */
  getStatus(): any {
    const state = this.loadTriggerState();
    const recentEvents = state.triggerHistory.slice(-10);
    const successfulTriggers = state.triggerHistory.filter(e => e.success).length;
    const failedTriggers = state.triggerHistory.filter(e => !e.success).length;
    
    return {
      isMonitoring: this.isMonitoring,
      lastCheck: state.lastCheck,
      totalConditions: this.conditions.length,
      activeConditions: state.activeConditions.length,
      recentEvents: recentEvents.length,
      successfulTriggers,
      failedTriggers,
      suppressedUntil: state.suppressedUntil,
      conditions: this.conditions.map(c => ({
        id: c.id,
        name: c.name,
        priority: c.priority,
        lastTriggered: c.lastTriggered,
        cooldown: c.cooldown
      }))
    };
  }

  /**
   * Initialize trigger conditions
   */
  private initializeTriggerConditions(): TriggerCondition[] {
    return [
      {
        id: 'task-milestone',
        name: 'Task Milestone (6+ Features)',
        description: 'Triggers when 6 or more features are being implemented',
        condition: () => this.checkTaskMilestone(),
        priority: 'high',
        cooldown: 30 // 30 minutes
      },
      {
        id: 'feature-completion',
        name: 'Feature Completion',
        description: 'Triggers when significant features are completed',
        condition: () => this.checkFeatureCompletion(),
        priority: 'medium',
        cooldown: 15 // 15 minutes
      },
      {
        id: 'critical-file-changes',
        name: 'Critical File Changes',
        description: 'Triggers when critical configuration files are modified',
        condition: () => this.checkCriticalFileChanges(),
        priority: 'critical',
        cooldown: 5 // 5 minutes
      },
      {
        id: 'time-based',
        name: 'Time-Based Backup',
        description: 'Triggers backup after extended work sessions',
        condition: () => this.checkTimeBased(),
        priority: 'low',
        cooldown: 60 // 1 hour
      },
      {
        id: 'error-detection',
        name: 'Error Detection',
        description: 'Triggers backup before risky operations or after errors',
        condition: () => this.checkErrorDetection(),
        priority: 'critical',
        cooldown: 10 // 10 minutes
      },
      {
        id: 'dependency-changes',
        name: 'Dependency Changes',
        description: 'Triggers when package.json or other dependencies change',
        condition: () => this.checkDependencyChanges(),
        priority: 'high',
        cooldown: 20 // 20 minutes
      },
      {
        id: 'large-refactor',
        name: 'Large Refactoring',
        description: 'Triggers when many files are modified simultaneously',
        condition: () => this.checkLargeRefactor(),
        priority: 'high',
        cooldown: 15 // 15 minutes
      },
      {
        id: 'pre-deployment',
        name: 'Pre-Deployment',
        description: 'Triggers before build or deployment operations',
        condition: () => this.checkPreDeployment(),
        priority: 'critical',
        cooldown: 30 // 30 minutes
      }
    ];
  }

  /**
   * Check if 6 or more features are being implemented
   */
  private async checkTaskMilestone(): Promise<boolean> {
    try {
      const taskAnalysis = await this.analyzeTaskList();
      
      // Check if 6 or more features are in progress or recently completed
      const activeFeatures = taskAnalysis.inProgressTasks + taskAnalysis.recentlyCompleted.length;
      
      if (activeFeatures >= 6) {
        console.log(`[BACKUP-TRIGGERS] 🎯 Task milestone: ${activeFeatures} features active`);
        return true;
      }
      
      return false;
      
    } catch (error) {
      console.error('[BACKUP-TRIGGERS] Error checking task milestone:', error);
      return false;
    }
  }

  /**
   * Check for significant feature completion
   */
  private async checkFeatureCompletion(): Promise<boolean> {
    try {
      const taskAnalysis = await this.analyzeTaskList();
      
      // Check if significant features were recently completed
      const recentCompletions = taskAnalysis.recentlyCompleted.length;
      
      if (recentCompletions >= 3) {
        console.log(`[BACKUP-TRIGGERS] ✅ Feature completion: ${recentCompletions} features completed`);
        return true;
      }
      
      return false;
      
    } catch (error) {
      console.error('[BACKUP-TRIGGERS] Error checking feature completion:', error);
      return false;
    }
  }

  /**
   * Check for critical file changes
   */
  private async checkCriticalFileChanges(): Promise<boolean> {
    const criticalFiles = [
      'package.json',
      'package-lock.json',
      'tsconfig.json',
      'next.config.ts',
      'tailwind.config.ts',
      '.env',
      'vercel.json'
    ];
    
    // This would check if any critical files have been modified recently
    // Implementation would track file modification times
    return false; // Placeholder
  }

  /**
   * Check time-based conditions
   */
  private async checkTimeBased(): Promise<boolean> {
    const lastBackup = this.getLastBackupTime();
    const timeSinceBackup = Date.now() - lastBackup;
    const oneHour = 60 * 60 * 1000;
    
    // Trigger if more than 1 hour since last backup and there are changes
    if (timeSinceBackup > oneHour) {
      const hasChanges = await this.hasRecentChanges();
      if (hasChanges) {
        console.log('[BACKUP-TRIGGERS] ⏰ Time-based trigger: 1+ hour with changes');
        return true;
      }
    }
    
    return false;
  }

  /**
   * Check for error conditions
   */
  private async checkErrorDetection(): Promise<boolean> {
    // This would check for:
    // - Build errors
    // - Runtime errors
    // - Test failures
    // - Deployment issues
    return false; // Placeholder
  }

  /**
   * Check for dependency changes
   */
  private async checkDependencyChanges(): Promise<boolean> {
    // Check if package.json has been modified recently
    const packageJsonPath = join(this.projectRoot, 'package.json');
    
    if (existsSync(packageJsonPath)) {
      // Implementation would check modification time
      return false; // Placeholder
    }
    
    return false;
  }

  /**
   * Check for large refactoring operations
   */
  private async checkLargeRefactor(): Promise<boolean> {
    // Check if many files have been modified in a short time
    const recentChanges = await this.getRecentFileChanges();
    
    if (recentChanges.length > 20) {
      console.log(`[BACKUP-TRIGGERS] 🔄 Large refactor: ${recentChanges.length} files changed`);
      return true;
    }
    
    return false;
  }

  /**
   * Check for pre-deployment conditions
   */
  private async checkPreDeployment(): Promise<boolean> {
    // This would check for:
    // - Build commands being run
    // - Deployment scripts
    // - CI/CD pipeline triggers
    return false; // Placeholder
  }

  /**
   * Execute a trigger and create backup
   */
  private async executeTrigger(condition: TriggerCondition): Promise<TriggerEvent> {
    const eventId = this.generateEventId();
    const timestamp = new Date().toISOString();
    
    try {
      // Generate automated comment based on trigger
      const comment = this.generateTriggerComment(condition);
      
      // Create backup
      const backupId = await backupEngine.createBackup(comment, false);
      
      console.log(`[BACKUP-TRIGGERS] ✅ Backup created: ${backupId}`);
      
      return {
        id: eventId,
        triggerId: condition.id,
        timestamp,
        condition: condition.name,
        backupId,
        success: true,
        reason: `Triggered by: ${condition.description}`
      };
      
    } catch (error) {
      console.error(`[BACKUP-TRIGGERS] ❌ Failed to create backup for ${condition.name}:`, error);
      
      return {
        id: eventId,
        triggerId: condition.id,
        timestamp,
        condition: condition.name,
        success: false,
        reason: `Failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Generate automated comment for trigger-based backup
   */
  private generateTriggerComment(condition: TriggerCondition): string {
    const timestamp = new Date().toLocaleTimeString();
    const priority = condition.priority.toUpperCase();
    
    return `🤖 AUTO-BACKUP [${priority}] ${condition.name} - ${timestamp}`;
  }

  /**
   * Analyze task list for milestone detection
   */
  private async analyzeTaskList(): Promise<TaskAnalysis> {
    const taskListPath = join(this.projectRoot, 'task-list.md');
    
    if (!existsSync(taskListPath)) {
      return {
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        pendingTasks: 0,
        recentlyCompleted: [],
        featuresInProgress: [],
        riskLevel: 'low'
      };
    }
    
    try {
      const content = readFileSync(taskListPath, 'utf8');
      
      // Parse task list content
      const completedMatches = content.match(/✅.*$/gm) || [];
      const inProgressMatches = content.match(/🔄.*$/gm) || [];
      const pendingMatches = content.match(/⏳.*$/gm) || [];
      
      // Extract feature names
      const featuresInProgress = inProgressMatches.map(match => 
        match.replace(/🔄\s*/, '').split('-')[0].trim()
      );
      
      const recentlyCompleted = completedMatches.slice(-5).map(match => 
        match.replace(/✅\s*/, '').split('-')[0].trim()
      );
      
      const totalTasks = completedMatches.length + inProgressMatches.length + pendingMatches.length;
      
      // Assess risk level based on activity
      let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
      
      if (inProgressMatches.length > 10) {
        riskLevel = 'critical';
      } else if (inProgressMatches.length > 6) {
        riskLevel = 'high';
      } else if (inProgressMatches.length > 3) {
        riskLevel = 'medium';
      }
      
      return {
        totalTasks,
        completedTasks: completedMatches.length,
        inProgressTasks: inProgressMatches.length,
        pendingTasks: pendingMatches.length,
        recentlyCompleted,
        featuresInProgress,
        riskLevel
      };
      
    } catch (error) {
      console.error('[BACKUP-TRIGGERS] Error analyzing task list:', error);
      return {
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        pendingTasks: 0,
        recentlyCompleted: [],
        featuresInProgress: [],
        riskLevel: 'low'
      };
    }
  }

  /**
   * Start file watchers for critical files
   */
  private startFileWatchers(): void {
    const watchFiles = [
      'task-list.md',
      'package.json',
      'tsconfig.json',
      'next.config.ts'
    ];
    
    watchFiles.forEach(file => {
      const filePath = join(this.projectRoot, file);
      
      if (existsSync(filePath)) {
        const watcher = watchFile(filePath, { interval: 5000 }, () => {
          console.log(`[BACKUP-TRIGGERS] 📁 File changed: ${file}`);
          // Trigger immediate check
          this.checkTriggers().catch(console.error);
        });
        
        this.fileWatchers.set(filePath, watcher);
      }
    });
    
    console.log(`[BACKUP-TRIGGERS] 👀 Watching ${this.fileWatchers.size} files`);
  }

  /**
   * Start periodic trigger checks
   */
  private startPeriodicChecks(): void {
    // Check triggers every 5 minutes
    this.monitoringInterval = setInterval(() => {
      this.checkTriggers().catch(console.error);
    }, 5 * 60 * 1000);
    
    console.log('[BACKUP-TRIGGERS] ⏰ Periodic checks started (5 minute interval)');
  }

  /**
   * Utility methods
   */
  private initializeTriggerState(): void {
    if (!existsSync(this.triggerStatePath)) {
      const initialState: TriggerState = {
        lastCheck: new Date().toISOString(),
        triggerHistory: [],
        activeConditions: []
      };
      
      this.saveTriggerState(initialState);
    }
  }

  private loadTriggerState(): TriggerState {
    if (existsSync(this.triggerStatePath)) {
      try {
        return JSON.parse(readFileSync(this.triggerStatePath, 'utf8'));
      } catch (error) {
        console.warn('[BACKUP-TRIGGERS] Failed to load trigger state, using defaults');
      }
    }
    
    return {
      lastCheck: new Date().toISOString(),
      triggerHistory: [],
      activeConditions: []
    };
  }

  private saveTriggerState(state: TriggerState): void {
    try {
      writeFileSync(this.triggerStatePath, JSON.stringify(state, null, 2));
    } catch (error) {
      console.error('[BACKUP-TRIGGERS] Failed to save trigger state:', error);
    }
  }

  private generateEventId(): string {
    return `trigger_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getLastBackupTime(): number {
    try {
      const currentVersion = backupEngine.getCurrentVersion();
      if (currentVersion === 'none') {
        return 0;
      }
      
      // Extract timestamp from version ID
      const timestampMatch = currentVersion.match(/YOLO_(\d+)_/);
      if (timestampMatch) {
        return parseInt(timestampMatch[1]);
      }
      
      return 0;
    } catch (error) {
      return 0;
    }
  }

  private async hasRecentChanges(): Promise<boolean> {
    // This would check for recent file modifications
    // Implementation would track file system changes
    return true; // Placeholder - assume there are always some changes
  }

  private async getRecentFileChanges(): Promise<string[]> {
    // This would return list of recently changed files
    // Implementation would track file system changes
    return []; // Placeholder
  }
}

// Export singleton instance
export const backupTriggers = new BackupTriggerSystem();

// Export types for external use
export type { TriggerCondition, TriggerState, TriggerEvent, TaskAnalysis };

// Auto-initialize if running in Node.js environment
if (typeof window === 'undefined') {
  // Start monitoring automatically
  backupTriggers.startMonitoring().catch(console.error);
  console.log('[BACKUP-TRIGGERS] 🚀 Automated trigger system initialized');
}