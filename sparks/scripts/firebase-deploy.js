#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function execCommand(command, description) {
  log(`\n${description}...`, 'blue');
  try {
    execSync(command, { stdio: 'inherit' });
    log(`✅ ${description} completed successfully`, 'green');
  } catch (error) {
    log(`❌ ${description} failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

function checkFirebaseConfig() {
  log('\n🔍 Checking Firebase configuration...', 'cyan');
  
  const requiredFiles = [
    'firebase.json',
    'firestore.rules',
    'storage.rules',
    'firestore.indexes.json'
  ];
  
  const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
  
  if (missingFiles.length > 0) {
    log(`❌ Missing Firebase configuration files: ${missingFiles.join(', ')}`, 'red');
    process.exit(1);
  }
  
  log('✅ All Firebase configuration files found', 'green');
}

function checkEnvironmentVariables() {
  log('\n🔍 Checking environment variables...', 'cyan');
  
  const requiredEnvVars = [
    'FIREBASE_API_KEY',
    'FIREBASE_AUTH_DOMAIN',
    'FIREBASE_PROJECT_ID',
    'FIREBASE_STORAGE_BUCKET',
    'FIREBASE_MESSAGING_SENDER_ID',
    'FIREBASE_APP_ID'
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    log(`❌ Missing environment variables: ${missingVars.join(', ')}`, 'red');
    log('Please set these variables in your .env.local file', 'yellow');
    process.exit(1);
  }
  
  log('✅ All required environment variables found', 'green');
}

function buildProject() {
  log('\n🏗️ Building Next.js project...', 'cyan');
  execCommand('npm run build', 'Project build');
}

function deployFirestore() {
  log('\n🔥 Deploying Firestore rules and indexes...', 'cyan');
  execCommand('firebase deploy --only firestore', 'Firestore deployment');
}

function deployStorage() {
  log('\n📦 Deploying Storage rules...', 'cyan');
  execCommand('firebase deploy --only storage', 'Storage deployment');
}

function deployHosting() {
  log('\n🌐 Deploying to Firebase Hosting...', 'cyan');
  execCommand('firebase deploy --only hosting', 'Hosting deployment');
}

function deployAll() {
  log('\n🚀 Deploying all Firebase services...', 'cyan');
  execCommand('firebase deploy', 'Full deployment');
}

function startEmulators() {
  log('\n🧪 Starting Firebase emulators...', 'cyan');
  execCommand('firebase emulators:start', 'Firebase emulators');
}

function showUsage() {
  log('\n📖 Firebase Deployment Script Usage:', 'magenta');
  log('\nAvailable commands:', 'cyan');
  log('  npm run firebase:deploy          - Full deployment (build + deploy all)', 'yellow');
  log('  npm run firebase:deploy:firestore - Deploy Firestore rules and indexes only', 'yellow');
  log('  npm run firebase:deploy:storage   - Deploy Storage rules only', 'yellow');
  log('  npm run firebase:deploy:hosting   - Deploy to Hosting only', 'yellow');
  log('  npm run firebase:emulators        - Start Firebase emulators', 'yellow');
  log('  npm run firebase:init            - Initialize Firebase project', 'yellow');
}

function initializeFirebase() {
  log('\n🔧 Initializing Firebase project...', 'cyan');
  
  // Check if Firebase CLI is installed
  try {
    execSync('firebase --version', { stdio: 'pipe' });
  } catch (error) {
    log('❌ Firebase CLI not found. Installing...', 'red');
    execCommand('npm install -g firebase-tools', 'Firebase CLI installation');
  }
  
  // Login to Firebase (if not already logged in)
  try {
    execSync('firebase projects:list', { stdio: 'pipe' });
    log('✅ Already logged in to Firebase', 'green');
  } catch (error) {
    log('🔐 Please log in to Firebase...', 'yellow');
    execCommand('firebase login', 'Firebase login');
  }
  
  // Initialize project
  execCommand('firebase init', 'Firebase project initialization');
}

function main() {
  const command = process.argv[2];
  
  log('🔥 Firebase Deployment Script', 'magenta');
  log('==============================', 'magenta');
  
  switch (command) {
    case 'init':
      initializeFirebase();
      break;
      
    case 'deploy':
      checkFirebaseConfig();
      checkEnvironmentVariables();
      buildProject();
      deployAll();
      break;
      
    case 'deploy:firestore':
      checkFirebaseConfig();
      deployFirestore();
      break;
      
    case 'deploy:storage':
      checkFirebaseConfig();
      deployStorage();
      break;
      
    case 'deploy:hosting':
      checkFirebaseConfig();
      checkEnvironmentVariables();
      buildProject();
      deployHosting();
      break;
      
    case 'emulators':
      checkFirebaseConfig();
      startEmulators();
      break;
      
    default:
      showUsage();
      break;
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  checkFirebaseConfig,
  checkEnvironmentVariables,
  buildProject,
  deployFirestore,
  deployStorage,
  deployHosting,
  deployAll,
  startEmulators,
  initializeFirebase
};