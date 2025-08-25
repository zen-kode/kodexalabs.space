import { initializeApp, getApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, Firestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, FirebaseStorage, connectStorageEmulator } from "firebase/storage";
import { getAnalytics, Analytics } from "firebase/analytics";
import { logger } from './logger';

// Firebase configuration loaded from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Validate required Firebase configuration
const validateFirebaseConfig = () => {
  const required = ['apiKey', 'projectId', 'authDomain'];
  const missing = required.filter(key => !firebaseConfig[key as keyof typeof firebaseConfig]);
  
  if (missing.length > 0) {
    const error = `Firebase configuration is incomplete. Missing: ${missing.join(', ')}`;
    logger.error('Firebase Config Error', { missing, config: firebaseConfig });
    throw new Error(error);
  }
  
  logger.info('Firebase configuration validated successfully', {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain
  });
};

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let analytics: Analytics | null = null;

try {
  validateFirebaseConfig();
  
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    logger.info('Firebase app initialized', { projectId: firebaseConfig.projectId });
  } else {
    app = getApp();
    logger.info('Firebase app already initialized');
  }
  
  // Initialize Firebase services
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  
  // Initialize Analytics only in browser environment
  if (typeof window !== 'undefined' && firebaseConfig.measurementId) {
    try {
      analytics = getAnalytics(app);
      logger.info('Firebase Analytics initialized');
    } catch (error) {
      logger.warn('Firebase Analytics initialization failed', { error });
    }
  }
  
  // Connect to emulators in development
  if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
    try {
      // Auth emulator
      if (!auth.config.emulator) {
        connectAuthEmulator(auth, 'http://localhost:9099');
        logger.info('Connected to Firebase Auth emulator');
      }
      
      // Firestore emulator
      if (!db._delegate._databaseId.projectId.includes('demo-')) {
        connectFirestoreEmulator(db, 'localhost', 8080);
        logger.info('Connected to Firestore emulator');
      }
      
      // Storage emulator
      connectStorageEmulator(storage, 'localhost', 9199);
      logger.info('Connected to Firebase Storage emulator');
    } catch (error) {
      logger.warn('Firebase emulator connection failed', { error });
    }
  }
  
} catch (error) {
  logger.error('Firebase initialization failed', { error });
  throw error;
}

// Firebase service status
export const getFirebaseStatus = () => {
  return {
    initialized: !!app,
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
    services: {
      auth: !!auth,
      firestore: !!db,
      storage: !!storage,
      analytics: !!analytics
    },
    emulatorMode: process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true'
  };
};

// Export Firebase services
export { app, auth, db, storage, analytics };
export default app;
