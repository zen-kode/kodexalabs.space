// Simple backup creation script
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { promisify } = require('util');
const { gzip } = require('zlib');

const gzipAsync = promisify(gzip);

class SimpleBackupEngine {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
    this.backupDir = path.join(projectRoot, '.trae-backups');
    this.ensureBackupDirectory();
  }

  ensureBackupDirectory() {
    const dirs = [
      this.backupDir,
      path.join(this.backupDir, 'versions'),
      path.join(this.backupDir, 'objects')
    ];
    
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  generateVersionId() {
    const counter = this.getNextCounter();
    return `YOLO_${counter.toString().padStart(3, '0')}`;
  }

  getNextCounter() {
    const counterFile = path.join(this.backupDir, 'counter');
    let counter = 1;
    
    if (fs.existsSync(counterFile)) {
      counter = parseInt(fs.readFileSync(counterFile, 'utf8')) + 1;
    }
    
    fs.writeFileSync(counterFile, counter.toString());
    return counter;
  }

  async createBackup(comment = 'Auto-generated backup') {
    console.log('🚀 Creating backup...');
    
    const versionId = this.generateVersionId();
    const timestamp = new Date().toISOString();
    
    // Get all project files
    const files = this.getAllProjectFiles();
    console.log(`📁 Found ${files.length} files to backup`);
    
    // Create backup version
    const version = {
      versionId,
      timestamp,
      comment,
      author: 'Trae AI Assistant',
      files: files.map(file => ({
        path: file,
        hash: this.hashFile(file),
        size: fs.statSync(file).size,
        lastModified: fs.statSync(file).mtime.toISOString()
      })),
      metadata: {
        totalFiles: files.length,
        totalSize: files.reduce((sum, file) => sum + fs.statSync(file).size, 0)
      }
    };
    
    // Store version
    const versionFile = path.join(this.backupDir, 'versions', `${versionId}.json`);
    fs.writeFileSync(versionFile, JSON.stringify(version, null, 2));
    
    // Store file contents
    for (const file of files) {
      const hash = this.hashFile(file);
      const objectPath = path.join(this.backupDir, 'objects', hash);
      
      if (!fs.existsSync(objectPath)) {
        const content = fs.readFileSync(file);
        const compressed = await gzipAsync(content);
        fs.writeFileSync(objectPath, compressed);
      }
    }
    
    console.log(`✅ Backup created successfully!`);
    console.log(`📦 Version ID: ${versionId}`);
    console.log(`💬 Comment: ${comment}`);
    console.log(`📊 Files: ${version.files.length}`);
    console.log(`💾 Size: ${this.formatBytes(version.metadata.totalSize)}`);
    
    return versionId;
  }

  getAllProjectFiles() {
    const files = [];
    const excludePatterns = [
      'node_modules',
      '.next',
      '.git',
      '.trae-backups',
      'dist',
      'build',
      '.env.local',
      '.DS_Store',
      'Thumbs.db'
    ];
    
    const scanDirectory = (dir) => {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const relativePath = path.relative(this.projectRoot, fullPath);
        
        // Skip excluded patterns
        if (excludePatterns.some(pattern => relativePath.includes(pattern))) {
          continue;
        }
        
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          scanDirectory(fullPath);
        } else if (stat.isFile()) {
          files.push(fullPath);
        }
      }
    };
    
    scanDirectory(this.projectRoot);
    return files;
  }

  hashFile(filePath) {
    const content = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  formatBytes(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }
}

// Execute backup
const engine = new SimpleBackupEngine();
engine.createBackup('Manual backup triggered by @backup! command')
  .then(versionId => {
    console.log('\n🎉 Backup completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Backup failed:', error.message);
    process.exit(1);
  });