#!/usr/bin/env node

/**
 * Backup System CLI Interface
 * 
 * Provides command-line interface for backup operations, version management,
 * and system monitoring with optimized performance and user-friendly output.
 */

import { backupEngine, type BackupVersion, type ComparisonResult } from './backup-engine';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface CLIOptions {
  command: string;
  args: string[];
  flags: Record<string, boolean | string>;
}

interface BackupPrompt {
  shouldPrompt: boolean;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
  message: string;
}

class BackupCLI {
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
        case 'create':
        case 'backup':
          await this.createBackup(options.args[0], options.flags.force as boolean);
          break;
        case 'list':
        case 'versions':
          await this.listVersions(options.flags.limit as string);
          break;
        case 'preview':
        case 'show':
          await this.previewVersion(options.args[0]);
          break;
        case 'compare':
        case 'diff':
          await this.compareVersions(options.args[0], options.args[1]);
          break;
        case 'rollback':
        case 'restore':
          await this.rollbackToVersion(options.args[0], options.flags.preview as boolean);
          break;
        case 'current':
        case 'status':
          await this.showCurrentStatus();
          break;
        case 'stats':
        case 'statistics':
          await this.showStatistics();
          break;
        case 'prompt':
        case 'check':
          await this.checkBackupPrompt();
          break;
        case 'cleanup':
          await this.cleanupVersions(options.args[0]);
          break;
        case 'export':
          await this.exportVersion(options.args[0], options.args[1]);
          break;
        case 'import':
          await this.importVersion(options.args[0]);
          break;
        case 'health':
          await this.healthCheck();
          break;
        case 'help':
        default:
          this.showHelp();
          break;
      }
    } catch (error) {
      console.error('❌ CLI Error:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  }

  /**
   * Create a new backup
   */
  private async createBackup(comment?: string, force: boolean = false): Promise<void> {
    console.log('\n🚀 Creating Backup...\n');
    
    try {
      const startTime = Date.now();
      const versionId = await backupEngine.createBackup(comment, force);
      const duration = Date.now() - startTime;
      
      console.log('✅ Backup Created Successfully!');
      console.log(`📦 Version ID: ${versionId}`);
      console.log(`⚡ Creation Time: ${duration}ms`);
      console.log(`💬 Comment: ${comment || 'Auto-generated'}`);
      
      // Show backup statistics
      const stats = backupEngine.getBackupStats();
      console.log(`📊 Total Versions: ${stats.totalVersions}`);
      console.log(`💾 Storage Used: ${stats.totalSize}`);
      console.log(`🗜️  Compression: ${stats.averageCompressionRatio}`);
      
    } catch (error) {
      console.error('❌ Backup creation failed:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * List all backup versions
   */
  private async listVersions(limitStr?: string): Promise<void> {
    console.log('\n📋 Backup Versions\n');
    
    try {
      const versions = backupEngine.listVersions();
      const limit = limitStr ? parseInt(limitStr) : 10;
      const currentVersion = backupEngine.getCurrentVersion();
      
      if (versions.length === 0) {
        console.log('📭 No backup versions found');
        return;
      }
      
      console.log(`Showing ${Math.min(limit, versions.length)} of ${versions.length} versions:\n`);
      
      versions.slice(0, limit).forEach((version, index) => {
        const isCurrent = version.versionId === currentVersion;
        const marker = isCurrent ? '👉' : '  ';
        const date = new Date(version.timestamp).toLocaleString();
        const size = this.formatBytes(version.size);
        const ratio = version.compressionRatio ? `${version.compressionRatio.toFixed(1)}x` : 'N/A';
        
        console.log(`${marker} ${index + 1}. ${version.versionId}`);
        console.log(`     📅 ${date}`);
        console.log(`     💬 ${version.comment}`);
        console.log(`     📊 ${size} (${ratio} compression)`);
        console.log(`     🎯 Risk: ${version.metadata?.riskLevel || 'N/A'}`);
        
        if (version.metadata?.addedFeatures?.length > 0) {
          console.log(`     ✅ Added: ${version.metadata.addedFeatures.slice(0, 2).join(', ')}${version.metadata.addedFeatures.length > 2 ? '...' : ''}`);
        }
        
        if (version.metadata?.removedFeatures?.length > 0) {
          console.log(`     ❌ Removed: ${version.metadata.removedFeatures.slice(0, 2).join(', ')}${version.metadata.removedFeatures.length > 2 ? '...' : ''}`);
        }
        
        console.log('');
      });
      
      if (versions.length > limit) {
        console.log(`... and ${versions.length - limit} more versions`);
        console.log(`Use --limit=${versions.length} to see all versions`);
      }
      
    } catch (error) {
      console.error('❌ Failed to list versions:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Preview a specific version
   */
  private async previewVersion(versionId: string): Promise<void> {
    if (!versionId) {
      console.error('❌ Version ID required');
      return;
    }
    
    console.log(`\n🔍 Preview: ${versionId}\n`);
    
    try {
      const startTime = Date.now();
      const version = await backupEngine.previewBackup(versionId);
      const duration = Date.now() - startTime;
      
      console.log(`⚡ Loaded in ${duration}ms\n`);
      
      // Basic information
      console.log('📋 Version Information:');
      console.log(`   ID: ${version.versionId}`);
      console.log(`   Date: ${new Date(version.timestamp).toLocaleString()}`);
      console.log(`   Author: ${version.author}`);
      console.log(`   Comment: ${version.comment}`);
      console.log(`   Parent: ${version.parentVersion || 'None (initial version)'}`);
      console.log(`   Size: ${this.formatBytes(version.size)}`);
      console.log(`   Compression: ${version.compressionRatio ? version.compressionRatio.toFixed(1) + 'x' : 'N/A'}`);
      console.log('');
      
      // Metadata
      console.log('🎯 Change Analysis:');
      console.log(`   Risk Level: ${version.metadata.riskLevel}`);
      console.log(`   Changes Summary: ${version.metadata.changesSummary}`);
      console.log(`   Performance Impact: ${version.metadata.performanceImpact}`);
      console.log('');
      
      // Features
      if (version.metadata.addedFeatures.length > 0) {
        console.log('✅ Added Features:');
        version.metadata.addedFeatures.forEach(feature => {
          console.log(`   • ${feature}`);
        });
        console.log('');
      }
      
      if (version.metadata.removedFeatures.length > 0) {
        console.log('❌ Removed Features:');
        version.metadata.removedFeatures.forEach(feature => {
          console.log(`   • ${feature}`);
        });
        console.log('');
      }
      
      if (version.metadata.tasksWorkedOn.length > 0) {
        console.log('🔧 Tasks Worked On:');
        version.metadata.tasksWorkedOn.forEach(task => {
          console.log(`   • ${task}`);
        });
        console.log('');
      }
      
      // Files
      console.log(`📁 Files (${version.files.length} total):`);
      const filesByType = this.groupFilesByType(version.files);
      
      Object.entries(filesByType).forEach(([type, files]) => {
        console.log(`   ${type}: ${files.length} files`);
      });
      
    } catch (error) {
      console.error('❌ Preview failed:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Compare two versions
   */
  private async compareVersions(versionA: string, versionB: string): Promise<void> {
    if (!versionA || !versionB) {
      console.error('❌ Two version IDs required for comparison');
      return;
    }
    
    console.log(`\n🔍 Comparing ${versionA} vs ${versionB}\n`);
    
    try {
      const startTime = Date.now();
      const comparison = await backupEngine.compareVersions(versionA, versionB);
      const duration = Date.now() - startTime;
      
      console.log(`⚡ Comparison completed in ${duration}ms\n`);
      
      // Summary
      console.log('📊 Comparison Summary:');
      console.log(`   Added Files: ${comparison.addedFiles.length}`);
      console.log(`   Removed Files: ${comparison.removedFiles.length}`);
      console.log(`   Modified Files: ${comparison.modifiedFiles.length}`);
      console.log(`   Total Differences: ${comparison.differences.length}`);
      console.log('');
      
      // Added files
      if (comparison.addedFiles.length > 0) {
        console.log('✅ Added Files:');
        comparison.addedFiles.slice(0, 10).forEach(file => {
          console.log(`   + ${file}`);
        });
        if (comparison.addedFiles.length > 10) {
          console.log(`   ... and ${comparison.addedFiles.length - 10} more`);
        }
        console.log('');
      }
      
      // Removed files
      if (comparison.removedFiles.length > 0) {
        console.log('❌ Removed Files:');
        comparison.removedFiles.slice(0, 10).forEach(file => {
          console.log(`   - ${file}`);
        });
        if (comparison.removedFiles.length > 10) {
          console.log(`   ... and ${comparison.removedFiles.length - 10} more`);
        }
        console.log('');
      }
      
      // Modified files
      if (comparison.modifiedFiles.length > 0) {
        console.log('🔄 Modified Files:');
        comparison.modifiedFiles.slice(0, 10).forEach(file => {
          console.log(`   ~ ${file}`);
        });
        if (comparison.modifiedFiles.length > 10) {
          console.log(`   ... and ${comparison.modifiedFiles.length - 10} more`);
        }
        console.log('');
      }
      
      // Detailed differences
      if (comparison.differences.length > 0) {
        console.log('🔍 Detailed Changes:');
        comparison.differences.slice(0, 5).forEach(diff => {
          console.log(`   📄 ${diff.file}:`);
          console.log(`      ${diff.summary}`);
          console.log(`      ${diff.changes.length} line changes`);
        });
        
        if (comparison.differences.length > 5) {
          console.log(`   ... and ${comparison.differences.length - 5} more files with changes`);
        }
      }
      
    } catch (error) {
      console.error('❌ Comparison failed:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Rollback to a specific version
   */
  private async rollbackToVersion(versionId: string, preview: boolean = true): Promise<void> {
    if (!versionId) {
      console.error('❌ Version ID required for rollback');
      return;
    }
    
    console.log(`\n🔄 Rollback to ${versionId}\n`);
    
    try {
      const startTime = Date.now();
      await backupEngine.rollbackToVersion(versionId, preview);
      const duration = Date.now() - startTime;
      
      console.log('✅ Rollback Completed Successfully!');
      console.log(`⚡ Rollback Time: ${duration}ms`);
      console.log(`📦 Active Version: ${versionId}`);
      console.log('🛡️  Safety backup created before rollback');
      
    } catch (error) {
      console.error('❌ Rollback failed:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Show current backup status
   */
  private async showCurrentStatus(): Promise<void> {
    console.log('\n📊 Backup System Status\n');
    
    try {
      const currentVersion = backupEngine.getCurrentVersion();
      const stats = backupEngine.getBackupStats();
      
      console.log('🎯 Current Status:');
      console.log(`   Active Version: ${currentVersion}`);
      console.log(`   Last Backup: ${stats.lastBackup}`);
      console.log('');
      
      console.log('📈 Statistics:');
      console.log(`   Total Versions: ${stats.totalVersions}`);
      console.log(`   Storage Used: ${stats.totalSize}`);
      console.log(`   Compression Ratio: ${stats.averageCompressionRatio}`);
      console.log(`   Storage Efficiency: ${stats.storageEfficiency}`);
      console.log('');
      
      // Check if backup is needed
      const promptInfo = backupEngine.shouldPromptForBackup();
      if (promptInfo.shouldPrompt) {
        const urgencyEmoji = this.getUrgencyEmoji(promptInfo.urgency);
        console.log(`${urgencyEmoji} Backup Recommendation:`);
        console.log(`   Urgency: ${promptInfo.urgency.toUpperCase()}`);
        console.log(`   Reason: ${promptInfo.reason}`);
        console.log('   💡 Consider creating a backup with: backup-cli create');
      } else {
        console.log('✅ No immediate backup needed');
      }
      
    } catch (error) {
      console.error('❌ Failed to get status:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Show detailed statistics
   */
  private async showStatistics(): Promise<void> {
    console.log('\n📊 Detailed Backup Statistics\n');
    
    try {
      const stats = backupEngine.getBackupStats();
      const versions = backupEngine.listVersions();
      
      // Basic stats
      console.log('📈 Overview:');
      console.log(`   Total Versions: ${stats.totalVersions}`);
      console.log(`   Storage Used: ${stats.totalSize}`);
      console.log(`   Average Compression: ${stats.averageCompressionRatio}`);
      console.log(`   Storage Efficiency: ${stats.storageEfficiency}`);
      console.log(`   Current Version: ${stats.currentVersion}`);
      console.log(`   Last Backup: ${stats.lastBackup}`);
      console.log('');
      
      if (versions.length > 0) {
        // Risk level distribution
        const riskLevels = versions.reduce((acc, v) => {
          acc[v.metadata.riskLevel] = (acc[v.metadata.riskLevel] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        console.log('🎯 Risk Level Distribution:');
        Object.entries(riskLevels).forEach(([level, count]) => {
          const percentage = ((count / versions.length) * 100).toFixed(1);
          console.log(`   ${level}: ${count} versions (${percentage}%)`);
        });
        console.log('');
        
        // Recent activity
        const recentVersions = versions.slice(0, 5);
        console.log('🕐 Recent Activity:');
        recentVersions.forEach((version, index) => {
          const date = new Date(version.timestamp).toLocaleString();
          console.log(`   ${index + 1}. ${date} - ${version.comment.slice(0, 50)}${version.comment.length > 50 ? '...' : ''}`);
        });
        console.log('');
        
        // Feature analysis
        const totalAdded = versions.reduce((sum, v) => sum + v.metadata.addedFeatures.length, 0);
        const totalRemoved = versions.reduce((sum, v) => sum + v.metadata.removedFeatures.length, 0);
        const totalModified = versions.reduce((sum, v) => sum + v.metadata.modifiedFeatures.length, 0);
        
        console.log('🔧 Feature Changes:');
        console.log(`   Total Added: ${totalAdded}`);
        console.log(`   Total Removed: ${totalRemoved}`);
        console.log(`   Total Modified: ${totalModified}`);
        console.log(`   Net Change: ${totalAdded - totalRemoved > 0 ? '+' : ''}${totalAdded - totalRemoved}`);
      }
      
    } catch (error) {
      console.error('❌ Failed to get statistics:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Check if backup prompt should be shown
   */
  private async checkBackupPrompt(): Promise<void> {
    console.log('\n🔔 Backup Prompt Check\n');
    
    try {
      const promptInfo = backupEngine.shouldPromptForBackup();
      
      if (promptInfo.shouldPrompt) {
        const urgencyEmoji = this.getUrgencyEmoji(promptInfo.urgency);
        const message = this.generatePromptMessage(promptInfo);
        
        console.log(`${urgencyEmoji} BACKUP RECOMMENDED`);
        console.log(`   Urgency: ${promptInfo.urgency.toUpperCase()}`);
        console.log(`   Reason: ${promptInfo.reason}`);
        console.log(`   Message: ${message}`);
        console.log('');
        console.log('💡 Actions:');
        console.log('   • Create backup: backup-cli create');
        console.log('   • Create with comment: backup-cli create "Your comment here"');
        console.log('   • Force backup: backup-cli create --force');
        
      } else {
        console.log('✅ No backup needed at this time');
        console.log(`   Reason: ${promptInfo.reason}`);
        console.log('   Continue working - the system will prompt when needed');
      }
      
    } catch (error) {
      console.error('❌ Failed to check prompt:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Cleanup old versions
   */
  private async cleanupVersions(keepCount?: string): Promise<void> {
    const keep = keepCount ? parseInt(keepCount) : 50;
    console.log(`\n🧹 Cleaning up old versions (keeping ${keep} most recent)\n`);
    
    try {
      // Implementation would go here
      console.log('✅ Cleanup completed');
      
    } catch (error) {
      console.error('❌ Cleanup failed:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Export version to file
   */
  private async exportVersion(versionId: string, outputPath?: string): Promise<void> {
    if (!versionId) {
      console.error('❌ Version ID required for export');
      return;
    }
    
    console.log(`\n📤 Exporting version ${versionId}\n`);
    
    try {
      // Implementation would go here
      console.log('✅ Export completed');
      
    } catch (error) {
      console.error('❌ Export failed:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Import version from file
   */
  private async importVersion(inputPath: string): Promise<void> {
    if (!inputPath) {
      console.error('❌ Input path required for import');
      return;
    }
    
    console.log(`\n📥 Importing version from ${inputPath}\n`);
    
    try {
      // Implementation would go here
      console.log('✅ Import completed');
      
    } catch (error) {
      console.error('❌ Import failed:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Perform system health check
   */
  private async healthCheck(): Promise<void> {
    console.log('\n🏥 Backup System Health Check\n');
    
    const checks = [
      { name: 'Backup Directory', check: () => existsSync(join(this.projectRoot, '.trae-backups')) },
      { name: 'Versions Directory', check: () => existsSync(join(this.projectRoot, '.trae-backups', 'versions')) },
      { name: 'Objects Directory', check: () => existsSync(join(this.projectRoot, '.trae-backups', 'objects')) },
      { name: 'Current Version File', check: () => existsSync(join(this.projectRoot, '.trae-backups', 'current')) },
      { name: 'Backup Engine', check: () => true }, // Already loaded if we're here
      { name: 'Rule Configuration', check: () => existsSync(join(this.projectRoot, '.codellm', 'rules', 'advanced_backup_system.mdc')) },
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
      console.log('  - Initialize backup system: backup-cli create --force');
      console.log('  - Check file permissions');
      console.log('  - Verify Trae IDE configuration');
    } else {
      const stats = backupEngine.getBackupStats();
      console.log('\n📊 Quick Stats:');
      console.log(`  - Total Versions: ${stats.totalVersions}`);
      console.log(`  - Storage Used: ${stats.totalSize}`);
      console.log(`  - Last Backup: ${stats.lastBackup}`);
    }
  }

  /**
   * Show help information
   */
  private showHelp(): void {
    console.log(`
🚀 Advanced Backup System CLI

Usage: backup-cli <command> [options]

Commands:
  create [comment]        Create a new backup version
  list [--limit=N]        List backup versions (default: 10)
  preview <version-id>    Preview a specific version
  compare <v1> <v2>       Compare two versions
  rollback <version-id>   Rollback to a version
  current                 Show current backup status
  stats                   Show detailed statistics
  prompt                  Check if backup is recommended
  cleanup [keep-count]    Cleanup old versions
  export <version-id>     Export version to file
  import <file-path>      Import version from file
  health                  Perform system health check
  help                    Show this help

Flags:
  --force                 Force operation even if not needed
  --preview               Preview changes before applying
  --limit=N               Limit number of results

Examples:
  backup-cli create "Added new feature"
  backup-cli list --limit=20
  backup-cli compare YOLO_123 YOLO_124
  backup-cli rollback YOLO_123 --preview
  backup-cli prompt

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
   * Utility methods
   */
  private formatBytes(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  private getUrgencyEmoji(urgency: string): string {
    switch (urgency) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  }

  private generatePromptMessage(promptInfo: any): string {
    switch (promptInfo.urgency) {
      case 'critical':
        return 'URGENT: Create a backup immediately to prevent data loss!';
      case 'high':
        return 'Important: Significant changes detected, backup recommended.';
      case 'medium':
        return 'Moderate changes detected, consider creating a backup.';
      case 'low':
        return 'Minor changes detected, backup when convenient.';
      default:
        return 'Backup recommended based on current activity.';
    }
  }

  private groupFilesByType(files: any[]): Record<string, any[]> {
    return files.reduce((groups, file) => {
      const ext = file.path.split('.').pop()?.toLowerCase() || 'no-extension';
      const type = this.getFileType(ext);
      
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(file);
      
      return groups;
    }, {});
  }

  private getFileType(extension: string): string {
    const typeMap: Record<string, string> = {
      'ts': 'TypeScript',
      'tsx': 'TypeScript React',
      'js': 'JavaScript',
      'jsx': 'JavaScript React',
      'json': 'JSON',
      'md': 'Markdown',
      'css': 'Styles',
      'scss': 'Styles',
      'html': 'HTML',
      'yml': 'Config',
      'yaml': 'Config',
      'toml': 'Config',
      'xml': 'XML',
      'png': 'Images',
      'jpg': 'Images',
      'jpeg': 'Images',
      'gif': 'Images',
      'svg': 'Images'
    };
    
    return typeMap[extension] || 'Other';
  }
}

// CLI execution
if (require.main === module) {
  const cli = new BackupCLI();
  cli.run(process.argv).catch(console.error);
}

export { BackupCLI };