#!/usr/bin/env node

/**
 * Environment Variable Validation Script
 * 
 * This script validates that all required environment variables are set
 * for the SPARKS application to run properly in production.
 */

const fs = require('fs');
const path = require('path');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Helper function to colorize console output
function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

// Load environment variables from .env files
function loadEnvFile(filePath) {
  if (fs.existsSync(filePath)) {
    const envContent = fs.readFileSync(filePath, 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          envVars[key.trim()] = valueParts.join('=').trim();
        }
      }
    });
    
    return envVars;
  }
  return {};
}

// Define required environment variables by category
const requiredVars = {
  'Database Configuration': {
    required: [
      'NEXT_PUBLIC_DATABASE_PROVIDER'
    ],
    conditional: {
      supabase: [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY'
      ],
      firebase: [
        'NEXT_PUBLIC_FIREBASE_API_KEY',
        'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
        'NEXT_PUBLIC_FIREBASE_PROJECT_ID'
      ]
    }
  },
  'AI Service Configuration': {
    required: [
      'GEMINI_API_KEY'
    ]
  },
  'Authentication Configuration': {
    required: [
      'NEXTAUTH_SECRET',
      'NEXTAUTH_URL'
    ]
  },
  'OAuth Providers': {
    recommended: [
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET',
      'GITHUB_CLIENT_ID',
      'GITHUB_CLIENT_SECRET',
      'DISCORD_CLIENT_ID',
      'DISCORD_CLIENT_SECRET'
    ]
  },
  'Application Configuration': {
    required: [
      'NODE_ENV',
      'NEXT_PUBLIC_APP_URL'
    ]
  }
};

// Placeholder patterns to detect
const placeholderPatterns = [
  /your_.*_here/i,
  /your-.*-id/i,
  /your-project-id/i,
  /replace_with_/i,
  /change_this/i,
  /placeholder/i,
  /example\.com/i,
  /localhost(?!:3000)/i // Allow localhost:3000 for development
];

// Function to check if a value is a placeholder
function isPlaceholder(value) {
  if (!value || value.trim() === '') return true;
  return placeholderPatterns.some(pattern => pattern.test(value));
}

// Function to validate environment variables
function validateEnvironment() {
  console.log(colorize('🔍 SPARKS Environment Variable Validation', 'cyan'));
  console.log(colorize('=' .repeat(50), 'cyan'));
  console.log();

  // Load environment variables from various sources
  const envFiles = ['.env.local', '.env', '.env.production'];
  let allEnvVars = { ...process.env };
  
  // Load from .env files
  envFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      const fileVars = loadEnvFile(filePath);
      allEnvVars = { ...allEnvVars, ...fileVars };
      console.log(colorize(`📄 Loaded variables from ${file}`, 'blue'));
    }
  });
  
  console.log();

  let hasErrors = false;
  let hasWarnings = false;
  const results = {};

  // Validate each category
  Object.entries(requiredVars).forEach(([category, config]) => {
    console.log(colorize(`📋 ${category}`, 'magenta'));
    console.log(colorize('-'.repeat(category.length + 4), 'magenta'));
    
    results[category] = {
      required: { passed: [], failed: [] },
      recommended: { passed: [], failed: [] },
      conditional: { passed: [], failed: [] }
    };

    // Check required variables
    if (config.required) {
      config.required.forEach(varName => {
        const value = allEnvVars[varName];
        if (!value || isPlaceholder(value)) {
          console.log(colorize(`  ❌ ${varName}: Missing or placeholder value`, 'red'));
          results[category].required.failed.push(varName);
          hasErrors = true;
        } else {
          console.log(colorize(`  ✅ ${varName}: Configured`, 'green'));
          results[category].required.passed.push(varName);
        }
      });
    }

    // Check conditional variables based on database provider
    if (config.conditional) {
      const provider = allEnvVars.NEXT_PUBLIC_DATABASE_PROVIDER;
      if (provider && config.conditional[provider]) {
        console.log(colorize(`  📌 Checking ${provider} specific variables:`, 'blue'));
        config.conditional[provider].forEach(varName => {
          const value = allEnvVars[varName];
          if (!value || isPlaceholder(value)) {
            console.log(colorize(`    ❌ ${varName}: Missing or placeholder value`, 'red'));
            results[category].conditional.failed.push(varName);
            hasErrors = true;
          } else {
            console.log(colorize(`    ✅ ${varName}: Configured`, 'green'));
            results[category].conditional.passed.push(varName);
          }
        });
      }
    }

    // Check recommended variables
    if (config.recommended) {
      config.recommended.forEach(varName => {
        const value = allEnvVars[varName];
        if (!value || isPlaceholder(value)) {
          console.log(colorize(`  ⚠️  ${varName}: Not configured (recommended)`, 'yellow'));
          results[category].recommended.failed.push(varName);
          hasWarnings = true;
        } else {
          console.log(colorize(`  ✅ ${varName}: Configured`, 'green'));
          results[category].recommended.passed.push(varName);
        }
      });
    }

    console.log();
  });

  // Summary
  console.log(colorize('📊 Validation Summary', 'cyan'));
  console.log(colorize('=' .repeat(20), 'cyan'));
  
  const totalRequired = Object.values(results).reduce((sum, category) => {
    return sum + category.required.failed.length + category.conditional.failed.length;
  }, 0);
  
  const totalRecommended = Object.values(results).reduce((sum, category) => {
    return sum + category.recommended.failed.length;
  }, 0);

  if (hasErrors) {
    console.log(colorize(`❌ ${totalRequired} required variables are missing or have placeholder values`, 'red'));
  } else {
    console.log(colorize('✅ All required variables are properly configured', 'green'));
  }

  if (hasWarnings) {
    console.log(colorize(`⚠️  ${totalRecommended} recommended variables are not configured`, 'yellow'));
  }

  console.log();

  // Provide specific guidance
  if (hasErrors || hasWarnings) {
    console.log(colorize('🔧 Next Steps:', 'cyan'));
    
    if (hasErrors) {
      console.log(colorize('1. Configure all required environment variables', 'red'));
      console.log(colorize('2. Replace all placeholder values with real credentials', 'red'));
      console.log(colorize('3. Refer to docs/production-environment-setup.md for guidance', 'red'));
    }
    
    if (hasWarnings) {
      console.log(colorize('4. Consider configuring recommended variables for full functionality', 'yellow'));
      console.log(colorize('5. OAuth providers are needed for social authentication', 'yellow'));
    }
    
    console.log();
  }

  // Environment-specific recommendations
  const nodeEnv = allEnvVars.NODE_ENV;
  if (nodeEnv === 'production') {
    console.log(colorize('🚀 Production Environment Detected', 'green'));
    console.log(colorize('Additional recommendations:', 'green'));
    console.log(colorize('- Ensure all secrets are rotated regularly', 'green'));
    console.log(colorize('- Enable error tracking (Sentry)', 'green'));
    console.log(colorize('- Configure analytics (Google Analytics, PostHog)', 'green'));
    console.log(colorize('- Set up monitoring and alerts', 'green'));
  } else if (nodeEnv === 'development') {
    console.log(colorize('🛠️  Development Environment Detected', 'blue'));
    console.log(colorize('You can use placeholder values for development', 'blue'));
  }

  console.log();
  
  // Exit with appropriate code
  if (hasErrors) {
    console.log(colorize('❌ Validation failed. Please fix the issues above.', 'red'));
    process.exit(1);
  } else {
    console.log(colorize('✅ Environment validation passed!', 'green'));
    process.exit(0);
  }
}

// Additional utility functions
function checkDatabaseConnection() {
  console.log(colorize('🔌 Testing Database Connection...', 'cyan'));
  // This would be implemented to actually test the database connection
  // For now, just check if the required variables are present
  
  const provider = process.env.NEXT_PUBLIC_DATABASE_PROVIDER;
  
  if (provider === 'supabase') {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (url && key && !isPlaceholder(url) && !isPlaceholder(key)) {
      console.log(colorize('✅ Supabase configuration appears valid', 'green'));
    } else {
      console.log(colorize('❌ Supabase configuration is incomplete', 'red'));
    }
  } else if (provider === 'firebase') {
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    
    if (apiKey && projectId && !isPlaceholder(apiKey) && !isPlaceholder(projectId)) {
      console.log(colorize('✅ Firebase configuration appears valid', 'green'));
    } else {
      console.log(colorize('❌ Firebase configuration is incomplete', 'red'));
    }
  }
}

// Command line interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(colorize('SPARKS Environment Validation Tool', 'cyan'));
    console.log();
    console.log('Usage: node scripts/validate-env.js [options]');
    console.log();
    console.log('Options:');
    console.log('  --help, -h     Show this help message');
    console.log('  --db-test      Test database connection');
    console.log('  --quiet        Suppress detailed output');
    console.log();
    console.log('Examples:');
    console.log('  node scripts/validate-env.js');
    console.log('  npm run validate:env');
    process.exit(0);
  }
  
  if (args.includes('--db-test')) {
    checkDatabaseConnection();
  } else {
    validateEnvironment();
  }
}

module.exports = {
  validateEnvironment,
  checkDatabaseConnection,
  isPlaceholder
};