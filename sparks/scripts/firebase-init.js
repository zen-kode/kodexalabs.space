#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

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

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function generateFirebaseConfig(projectId, apiKey, authDomain, storageBucket, messagingSenderId, appId, measurementId) {
  return `# Firebase Configuration
FIREBASE_PROJECT_ID=${projectId}
FIREBASE_API_KEY=${apiKey}
FIREBASE_AUTH_DOMAIN=${authDomain || `${projectId}.firebaseapp.com`}
FIREBASE_STORAGE_BUCKET=${storageBucket || `${projectId}.appspot.com`}
FIREBASE_MESSAGING_SENDER_ID=${messagingSenderId}
FIREBASE_APP_ID=${appId}
FIREBASE_MEASUREMENT_ID=${measurementId || ''}

# Firebase Admin SDK (for server-side operations)
# FIREBASE_ADMIN_PROJECT_ID=${projectId}
# FIREBASE_ADMIN_CLIENT_EMAIL=your-service-account@${projectId}.iam.gserviceaccount.com
# FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nYOUR_PRIVATE_KEY_HERE\\n-----END PRIVATE KEY-----\\n"
`;
}

function updateEnvFile(config) {
  const envPath = '.env.local';
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
    log(`\n📝 Updating existing ${envPath}...`, 'blue');
  } else {
    log(`\n📝 Creating new ${envPath}...`, 'blue');
  }
  
  // Remove existing Firebase config if present
  const firebaseConfigRegex = /# Firebase Configuration[\s\S]*?(?=\n# |\n[A-Z]|$)/g;
  envContent = envContent.replace(firebaseConfigRegex, '');
  
  // Add new Firebase config
  envContent += '\n' + config;
  
  fs.writeFileSync(envPath, envContent.trim() + '\n');
  log(`✅ Firebase configuration added to ${envPath}`, 'green');
}

function createFirebaseRC(projectId) {
  const firebaseRC = {
    projects: {
      default: projectId
    }
  };
  
  fs.writeFileSync('.firebaserc', JSON.stringify(firebaseRC, null, 2));
  log('✅ Created .firebaserc file', 'green');
}

function showNextSteps(projectId) {
  log('\n🎉 Firebase setup completed!', 'green');
  log('\n📋 Next steps:', 'cyan');
  log('\n1. Install Firebase CLI (if not already installed):', 'yellow');
  log('   npm install -g firebase-tools', 'white');
  
  log('\n2. Login to Firebase:', 'yellow');
  log('   firebase login', 'white');
  
  log('\n3. Initialize Firebase project:', 'yellow');
  log('   npm run firebase:init', 'white');
  
  log('\n4. Start Firebase emulators for development:', 'yellow');
  log('   npm run firebase:emulators', 'white');
  
  log('\n5. Deploy to Firebase:', 'yellow');
  log('   npm run firebase:deploy', 'white');
  
  log('\n📚 Useful commands:', 'cyan');
  log('   npm run dev:firebase          - Start development with Firebase', 'white');
  log('   npm run build:firebase        - Build for Firebase deployment', 'white');
  log('   npm run firebase:deploy:firestore - Deploy Firestore rules only', 'white');
  log('   npm run firebase:deploy:storage   - Deploy Storage rules only', 'white');
  
  log(`\n🔗 Firebase Console: https://console.firebase.google.com/project/${projectId}`, 'blue');
}

async function main() {
  log('🔥 Firebase Project Setup', 'magenta');
  log('========================', 'magenta');
  
  log('\nThis script will help you configure Firebase for your Next.js project.', 'cyan');
  log('You can find these values in your Firebase project settings.', 'yellow');
  
  try {
    const projectId = await question('\n📝 Enter your Firebase Project ID: ');
    if (!projectId.trim()) {
      log('❌ Project ID is required', 'red');
      process.exit(1);
    }
    
    const apiKey = await question('🔑 Enter your Firebase API Key: ');
    if (!apiKey.trim()) {
      log('❌ API Key is required', 'red');
      process.exit(1);
    }
    
    const authDomain = await question(`🌐 Enter Auth Domain (default: ${projectId}.firebaseapp.com): `);
    const storageBucket = await question(`📦 Enter Storage Bucket (default: ${projectId}.appspot.com): `);
    const messagingSenderId = await question('📱 Enter Messaging Sender ID: ');
    const appId = await question('📱 Enter App ID: ');
    const measurementId = await question('📊 Enter Measurement ID (optional, for Analytics): ');
    
    log('\n🔧 Generating configuration...', 'blue');
    
    const config = generateFirebaseConfig(
      projectId,
      apiKey,
      authDomain,
      storageBucket,
      messagingSenderId,
      appId,
      measurementId
    );
    
    updateEnvFile(config);
    createFirebaseRC(projectId);
    
    showNextSteps(projectId);
    
  } catch (error) {
    log(`\n❌ Setup failed: ${error.message}`, 'red');
    process.exit(1);
  } finally {
    rl.close();
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  generateFirebaseConfig,
  updateEnvFile,
  createFirebaseRC
};