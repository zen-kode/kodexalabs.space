#!/usr/bin/env node

/**
 * Sync Engine CLI Interface
 * 
 * Provides command-line interface for manual sync operations,
 * status checking, and troubleshooting the bidirectional sync system.
 */

import { syncEngine, type SyncOperation, type FeatureStatus } from './sync-engine';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface CLIOptions {
  command: string;
  args: string[];
  flags: Record<string, boolean | string>;
}

class SyncCLI {
  private projectRoot: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
  }

  /**
   * Main CLI entry point
   */
  async run(argv: string[]): Promise<void> {
    const options = this.parseArgs(argv);
    
    try {
      switch (options.command) {
        case 'status':
          await this.showStatus();
          break;
        case 'sync':
          await this.manualSync(options.args[0] || 'both');
          break;
        case 'analyze':
          await this.runAnalysis();
          break;
        case 'conflicts':
          await this.showConflicts();
          break;
        case 'health':
          await this.healthCheck();
          break;
        case 'reset':
          await this.resetSync();
          break;
        case 'help':
        default:
          this.showHelp();
          break;
      }
    } catch (error) {
      console.error('❌ CLI Error:', error);
      process.exit(1);
    }
  }

  /**
   * Show current sync status
   */
  private async showStatus(): Promise<void> {
    console.log('\n🔄 Sync Engine Status\n');
    
    const syncStatePath = join(this.projectRoot, '.sync-state.json');
    
    if (!existsSync(syncStatePath)) {
      console.log('⚠️  No sync state found. Run initialization first.');
      return;
    }
    
    try {
      const syncState = JSON.parse(readFileSync(syncStatePath, 'utf8'));
      
      console.log(`📊 Health: ${this.getHealthEmoji(syncState.health)} ${syncState.health}`);
      console.log(`🕐 Last Sync: ${new Date(syncState.lastSync).toLocaleString()}`);
      console.log(`📝 Operations: ${syncState.operations.length} recorded`);
      console.log(`⚠️  Conflicts: ${syncState.conflicts.length} unresolved`);
      
      if (syncState.operations.length > 0) {
        console.log('\n📋 Recent Operations:');
        syncState.operations.slice(-5).forEach((op: SyncOperation) => {
          const time = new Date(op.timestamp).toLocaleTimeString();
          console.log(`  ${time} [${op.source.toUpperCase()}] ${op.action} on ${op.target}`);
        });
      }
      
      if (syncState.conflicts.length > 0) {
        console.log('\n⚠️  Active Conflicts:');
        syncState.conflicts.forEach((conflict: any, index: number) => {
          console.log(`  ${index + 1}. ${conflict.operation.target} - ${conflict.error}`);
        });
      }
      
    } catch (error) {
      console.error('❌ Failed to read sync state:', error);
    }
  }

  /**
   * Perform manual sync operation
   */
  private async manualSync(direction: string): Promise<void> {
    console.log(`\n🔄 Manual Sync: ${direction}\n`);
    
    try {
      switch (direction) {
        case 'task-to-feature':
          console.log('📤 Syncing task list to feature analysis...');
          await syncEngine.processTaskListUpdate({
            action: 'update',
            target: 'manual-sync',
            data: { trigger: 'manual', timestamp: new Date().toISOString() }
          });
          break;
          
        case 'feature-to-task':
          console.log('📥 Syncing feature analysis to task list...');
          await syncEngine.processFeatureAnalysisUpdate('manual-sync', {
            status: 'working',
            lastUpdated: new Date().toISOString()
          });
          break;
          
        case 'both':
        default:
          console.log('🔄 Performing bidirectional sync...');
          await syncEngine.runAutomatedAnalysis();
          break;
      }
      
      console.log('✅ Manual sync completed successfully');
      
    } catch (error) {
      console.error('❌ Manual sync failed:', error);
    }
  }

  /**
   * Run feature analysis
   */
  private async runAnalysis(): Promise<void> {
    console.log('\n🔍 Running Feature Analysis...\n');
    
    try {
      await syncEngine.runAutomatedAnalysis();
      console.log('✅ Feature analysis completed');
      
      // Show summary
      const featureAnalysisPath = join(this.projectRoot, 'feature-analysis.md');
      if (existsSync(featureAnalysisPath)) {
        const content = readFileSync(featureAnalysisPath, 'utf8');
        const lines = content.split('\n');
        
        // Extract summary statistics
        const healthyMatch = content.match(/🟢 Healthy Features \((\d+) features\)/);
        const attentionMatch = content.match(/🟡 Attention Required \((\d+) features\)/);
        const criticalMatch = content.match(/🔴 Critical Issues \((\d+) features\)/);
        
        if (healthyMatch || attentionMatch || criticalMatch) {
          console.log('\n📊 Analysis Summary:');
          if (healthyMatch) console.log(`  🟢 Healthy: ${healthyMatch[1]} features`);
          if (attentionMatch) console.log(`  🟡 Attention: ${attentionMatch[1]} features`);
          if (criticalMatch) console.log(`  🔴 Critical: ${criticalMatch[1]} features`);
        }
      }
      
    } catch (error) {
      console.error('❌ Feature analysis failed:', error);
    }
  }

  /**
   * Show sync conflicts
   */
  private async showConflicts(): Promise<void> {
    console.log('\n⚠️  Sync Conflicts\n');
    
    const syncStatePath = join(this.projectRoot, '.sync-state.json');
    
    if (!existsSync(syncStatePath)) {
      console.log('No sync state found.');
      return;
    }
    
    try {
      const syncState = JSON.parse(readFileSync(syncStatePath, 'utf8'));
      
      if (syncState.conflicts.length === 0) {
        console.log('✅ No conflicts found');
        return;
      }
      
      syncState.conflicts.forEach((conflict: any, index: number) => {
        console.log(`${index + 1}. Conflict in ${conflict.operation.target}`);
        console.log(`   Source: ${conflict.operation.source}`);
        console.log(`   Action: ${conflict.operation.action}`);
        console.log(`   Error: ${conflict.error}`);
        console.log(`   Time: ${new Date(conflict.timestamp).toLocaleString()}`);
        console.log('');
      });
      
    } catch (error) {
      console.error('❌ Failed to read conflicts:', error);
    }
  }

  /**
   * Perform health check
   */
  private async healthCheck(): Promise<void> {
    console.log('\n🏥 Sync Engine Health Check\n');
    
    const checks = [
      { name: 'Task List File', check: () => existsSync(join(this.projectRoot, 'task-list.md')) },
      { name: 'Feature Analysis File', check: () => existsSync(join(this.projectRoot, 'feature-analysis.md')) },
      { name: 'Sync State File', check: () => existsSync(join(this.projectRoot, '.sync-state.json')) },
      { name: 'Sync Engine Module', check: () => true }, // Already loaded if we're here
      { name: 'Rule Configuration', check: () => existsSync(join(this.projectRoot, '.codellm', 'rules', 'feature_analysis_sync.mdc')) },
    ];
    
    let allHealthy = true;
    
    for (const check of checks) {
      const result = check.check();
      const status = result ? '✅' : '❌';
      console.log(`${status} ${check.name}`);
      
      if (!result) {
        allHealthy = false;
      }
    }
    
    console.log(`\n🏥 Overall Health: ${allHealthy ? '✅ Healthy' : '❌ Issues Detected'}`);
    
    if (!allHealthy) {
      console.log('\n💡 Recommendations:');
      console.log('  - Run sync initialization: npm run sync:init');
      console.log('  - Check file permissions');
      console.log('  - Verify Trae IDE configuration');
    }
  }

  /**
   * Reset sync state
   */
  private async resetSync(): Promise<void> {
    console.log('\n🔄 Resetting Sync State...\n');
    
    try {
      // Re-initialize sync engine
      await syncEngine.initialize();
      console.log('✅ Sync state reset successfully');
      
    } catch (error) {
      console.error('❌ Failed to reset sync state:', error);
    }
  }

  /**
   * Show help information
   */
  private showHelp(): void {
    console.log(`
🔄 Sync Engine CLI

Usage: sync-cli <command> [options]

Commands:
  status              Show current sync status
  sync [direction]    Perform manual sync (both|task-to-feature|feature-to-task)
  analyze             Run feature analysis
  conflicts           Show sync conflicts
  health              Perform health check
  reset               Reset sync state
  help                Show this help

Examples:
  sync-cli status
  sync-cli sync both
  sync-cli analyze
  sync-cli health

For more information, see the documentation.
`);
  }

  /**
   * Parse command line arguments
   */
  private parseArgs(argv: string[]): CLIOptions {
    const args = argv.slice(2);
    const command = args[0] || 'help';
    const remainingArgs = args.slice(1);
    const flags: Record<string, boolean | string> = {};
    
    // Parse flags (--flag or --flag=value)
    const nonFlagArgs: string[] = [];
    
    for (const arg of remainingArgs) {
      if (arg.startsWith('--')) {
        const [key, value] = arg.slice(2).split('=');
        flags[key] = value || true;
      } else {
        nonFlagArgs.push(arg);
      }
    }
    
    return {
      command,
      args: nonFlagArgs,
      flags
    };
  }

  /**
   * Get health status emoji
   */
  private getHealthEmoji(health: string): string {
    switch (health) {
      case 'excellent': return '🟢';
      case 'good': return '🟡';
      case 'degraded': return '🟠';
      case 'critical': return '🔴';
      default: return '⚪';
    }
  }
}

// CLI execution
if (require.main === module) {
  const cli = new SyncCLI();
  cli.run(process.argv).catch(console.error);
}

export { SyncCLI };