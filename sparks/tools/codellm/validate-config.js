#!/usr/bin/env node

/**
 * Trae IDE Configuration Validator
 * Validates .codellm rules and configuration for the Sparks project
 */

const fs = require('fs');
const path = require('path');

class TraeConfigValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.configPath = path.join(__dirname, 'trae-config.json');
    this.rulesDir = path.join(__dirname, 'rules');
  }

  log(type, message) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${type.toUpperCase()}: ${message}`);
  }

  error(message) {
    this.errors.push(message);
    this.log('error', message);
  }

  warning(message) {
    this.warnings.push(message);
    this.log('warning', message);
  }

  info(message) {
    this.log('info', message);
  }

  validateConfigFile() {
    this.info('Validating trae-config.json...');
    
    if (!fs.existsSync(this.configPath)) {
      this.error('trae-config.json not found');
      return false;
    }

    try {
      const config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
      
      // Validate required fields
      const requiredFields = ['version', 'name', 'rules', 'file_patterns'];
      for (const field of requiredFields) {
        if (!config[field]) {
          this.error(`Missing required field: ${field}`);
        }
      }

      // Validate rules configuration
      if (config.rules) {
        if (!config.rules.directory) {
          this.error('Missing rules.directory in configuration');
        }
        if (!config.rules.format) {
          this.warning('Missing rules.format, defaulting to mdc');
        }
      }

      // Validate file patterns
      if (config.file_patterns) {
        const patternTypes = ['source_code', 'configuration', 'documentation'];
        for (const type of patternTypes) {
          if (!config.file_patterns[type]) {
            this.warning(`Missing file pattern type: ${type}`);
          }
        }
      }

      this.info('trae-config.json validation completed');
      return true;
    } catch (error) {
      this.error(`Invalid JSON in trae-config.json: ${error.message}`);
      return false;
    }
  }

  validateRuleFiles() {
    this.info('Validating rule files...');
    
    if (!fs.existsSync(this.rulesDir)) {
      this.error('Rules directory not found');
      return false;
    }

    const ruleFiles = fs.readdirSync(this.rulesDir)
      .filter(file => file.endsWith('.mdc'));

    if (ruleFiles.length === 0) {
      this.warning('No .mdc rule files found');
      return true;
    }

    let validRules = 0;
    for (const ruleFile of ruleFiles) {
      const rulePath = path.join(this.rulesDir, ruleFile);
      if (this.validateSingleRule(rulePath, ruleFile)) {
        validRules++;
      }
    }

    this.info(`Validated ${validRules}/${ruleFiles.length} rule files`);
    return validRules === ruleFiles.length;
  }

  validateSingleRule(rulePath, fileName) {
    try {
      const content = fs.readFileSync(rulePath, 'utf8');
      
      // Check for frontmatter
      if (!content.startsWith('---')) {
        this.error(`${fileName}: Missing frontmatter`);
        return false;
      }

      const frontmatterEnd = content.indexOf('---', 3);
      if (frontmatterEnd === -1) {
        this.error(`${fileName}: Incomplete frontmatter`);
        return false;
      }

      const frontmatter = content.substring(3, frontmatterEnd).trim();
      const ruleContent = content.substring(frontmatterEnd + 3).trim();

      // Validate frontmatter fields
      if (!frontmatter.includes('description:')) {
        this.error(`${fileName}: Missing description in frontmatter`);
      }
      if (!frontmatter.includes('globs:')) {
        this.warning(`${fileName}: Missing globs pattern`);
      }
      if (!frontmatter.includes('alwaysApply:')) {
        this.warning(`${fileName}: Missing alwaysApply setting`);
      }

      // Check for rule content
      if (!ruleContent || ruleContent.length < 10) {
        this.warning(`${fileName}: Rule content seems too short`);
      }

      this.info(`${fileName}: Valid`);
      return true;
    } catch (error) {
      this.error(`${fileName}: Error reading file - ${error.message}`);
      return false;
    }
  }

  validateProjectStructure() {
    this.info('Validating project structure...');
    
    const projectRoot = path.dirname(__dirname);
    const expectedDirs = [
      'src',
      'src/ai',
      'src/ai/flows',
      'src/app',
      'src/components',
      'src/lib'
    ];

    for (const dir of expectedDirs) {
      const dirPath = path.join(projectRoot, dir);
      if (!fs.existsSync(dirPath)) {
        this.warning(`Expected directory not found: ${dir}`);
      }
    }

    // Check for key files
    const expectedFiles = [
      'package.json',
      'next.config.ts',
      'tsconfig.json',
      'tailwind.config.ts'
    ];

    for (const file of expectedFiles) {
      const filePath = path.join(projectRoot, file);
      if (!fs.existsSync(filePath)) {
        this.warning(`Expected file not found: ${file}`);
      }
    }

    this.info('Project structure validation completed');
  }

  validateTriggers() {
    this.info('Validating trigger configurations...');
    
    try {
      const config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
      
      if (config.triggers) {
        // Validate task orchestrator trigger
        if (config.triggers.task_orchestrator) {
          const trigger = config.triggers.task_orchestrator;
          if (trigger.pattern !== '@666') {
            this.warning('Task orchestrator trigger pattern may not match rule expectation');
          }
        }

        // Validate guidance triggers
        if (config.triggers.guidance) {
          const guidance = config.triggers.guidance;
          if (!guidance.keywords || !Array.isArray(guidance.keywords)) {
            this.warning('Guidance trigger keywords should be an array');
          }
        }
      }

      this.info('Trigger validation completed');
    } catch (error) {
      this.error(`Error validating triggers: ${error.message}`);
    }
  }

  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('TRAE IDE CONFIGURATION VALIDATION REPORT');
    console.log('='.repeat(60));
    
    console.log(`\n📊 SUMMARY:`);
    console.log(`   Errors: ${this.errors.length}`);
    console.log(`   Warnings: ${this.warnings.length}`);
    
    if (this.errors.length > 0) {
      console.log(`\n❌ ERRORS:`);
      this.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }

    if (this.warnings.length > 0) {
      console.log(`\n⚠️  WARNINGS:`);
      this.warnings.forEach((warning, index) => {
        console.log(`   ${index + 1}. ${warning}`);
      });
    }

    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log(`\n✅ All validations passed! Configuration is ready for Trae IDE.`);
    } else if (this.errors.length === 0) {
      console.log(`\n✅ No critical errors found. Configuration should work with Trae IDE.`);
    } else {
      console.log(`\n❌ Critical errors found. Please fix before using with Trae IDE.`);
    }

    console.log('\n' + '='.repeat(60));
    return this.errors.length === 0;
  }

  run() {
    console.log('🚀 Starting Trae IDE Configuration Validation...\n');
    
    this.validateConfigFile();
    this.validateRuleFiles();
    this.validateProjectStructure();
    this.validateTriggers();
    
    return this.generateReport();
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new TraeConfigValidator();
  const isValid = validator.run();
  process.exit(isValid ? 0 : 1);
}

module.exports = TraeConfigValidator;