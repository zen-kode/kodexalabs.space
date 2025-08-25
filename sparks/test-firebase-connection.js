// Firebase Connection Test Script
// Run this with: node test-firebase-connection.js

require('dotenv').config();

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, getDoc } = require('firebase/firestore');
const { getAuth } = require('firebase/auth');
const { getStorage } = require('firebase/storage');

// Your Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

async function testFirebaseConnection() {
  console.log('🔥 Testing Firebase Connection...');
  console.log('================================');
  
  try {
    // Test 1: Initialize Firebase App
    console.log('1. Initializing Firebase App...');
    const app = initializeApp(firebaseConfig);
    console.log('✅ Firebase App initialized successfully!');
    console.log(`   Project ID: ${firebaseConfig.projectId}`);
    
    // Test 2: Initialize Firestore
    console.log('\n2. Connecting to Firestore...');
    const db = getFirestore(app);
    console.log('✅ Firestore connected successfully!');
    
    // Test 3: Test Firestore Write/Read
    console.log('\n3. Testing Firestore operations...');
    const testDoc = doc(db, 'test', 'connection-test');
    
    await setDoc(testDoc, {
      message: 'Firebase connection test successful!',
      timestamp: new Date().toISOString(),
      status: 'working'
    });
    console.log('✅ Firestore write operation successful!');
    
    const docSnap = await getDoc(testDoc);
    if (docSnap.exists()) {
      console.log('✅ Firestore read operation successful!');
      console.log('   Data:', docSnap.data());
    } else {
      console.log('❌ Document not found after write');
    }
    
    // Test 4: Initialize Authentication
    console.log('\n4. Initializing Authentication...');
    const auth = getAuth(app);
    console.log('✅ Firebase Auth initialized successfully!');
    
    // Test 5: Initialize Storage
    console.log('\n5. Initializing Storage...');
    const storage = getStorage(app);
    console.log('✅ Firebase Storage initialized successfully!');
    
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('================================');
    console.log('Your Firebase setup is working correctly!');
    console.log('You can now start building your application.');
    
  } catch (error) {
    console.error('\n❌ Firebase connection failed!');
    console.error('================================');
    console.error('Error details:', error.message);
    
    // Provide specific troubleshooting based on error
    if (error.message.includes('API key')) {
      console.error('\n🔧 SOLUTION: Check your NEXT_PUBLIC_FIREBASE_API_KEY in .env file');
    } else if (error.message.includes('project')) {
      console.error('\n🔧 SOLUTION: Check your NEXT_PUBLIC_FIREBASE_PROJECT_ID in .env file');
    } else if (error.message.includes('permission')) {
      console.error('\n🔧 SOLUTION: Check your Firestore security rules');
    } else {
      console.error('\n🔧 SOLUTION: Double-check all environment variables in .env file');
    }
    
    console.error('\nCurrent config:');
    console.error('- Project ID:', firebaseConfig.projectId || 'MISSING');
    console.error('- API Key:', firebaseConfig.apiKey ? 'SET' : 'MISSING');
    console.error('- Auth Domain:', firebaseConfig.authDomain || 'MISSING');
    
    process.exit(1);
  }
}

// Check if environment variables are loaded
if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
  console.error('❌ Environment variables not found!');
  console.error('Make sure you have a .env file with Firebase configuration.');
  console.error('\nRequired variables:');
  console.error('- NEXT_PUBLIC_FIREBASE_PROJECT_ID');
  console.error('- NEXT_PUBLIC_FIREBASE_API_KEY');
  console.error('- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN');
  console.error('- NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET');
  console.error('- NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID');
  console.error('- NEXT_PUBLIC_FIREBASE_APP_ID');
  process.exit(1);
}

// Run the test
testFirebaseConnection();