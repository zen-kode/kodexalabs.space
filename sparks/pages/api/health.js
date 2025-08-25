// Health Check API Endpoint
// Tests connectivity to all services in the hybrid architecture

import { createClient } from '@supabase/supabase-js';
import { initializeApp, getApps } from 'firebase/app';
import { getStorage, ref, listAll } from 'firebase/storage';

// Initialize Firebase (avoid multiple initialization)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const healthCheck = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    services: {
      vercel: { status: 'healthy', message: 'API endpoint responding' },
      supabase: { status: 'unknown', message: 'Not tested' },
      firebase: { status: 'unknown', message: 'Not tested' }
    },
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      environment: process.env.NODE_ENV || 'development'
    },
    configuration: {
      supabaseConfigured: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      firebaseConfigured: !!(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID && process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
      vercelConfigured: !!process.env.VERCEL
    }
  };

  // Test Supabase connection
  try {
    const { data, error } = await supabase
      .from('_supabase_health_check')
      .select('*')
      .limit(1);
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = table not found, which is OK
      throw error;
    }
    
    healthCheck.services.supabase = {
      status: 'healthy',
      message: 'Connection successful',
      url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...'
    };
  } catch (error) {
    healthCheck.services.supabase = {
      status: 'error',
      message: error.message || 'Connection failed',
      error: error.code || 'UNKNOWN_ERROR'
    };
    healthCheck.status = 'degraded';
  }

  // Test Firebase Storage connection
  try {
    const storage = getStorage(app);
    const storageRef = ref(storage, '/');
    
    // Try to list files in root (this tests connectivity)
    await listAll(storageRef);
    
    healthCheck.services.firebase = {
      status: 'healthy',
      message: 'Storage connection successful',
      bucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    };
  } catch (error) {
    healthCheck.services.firebase = {
      status: 'error',
      message: error.message || 'Storage connection failed',
      error: error.code || 'UNKNOWN_ERROR'
    };
    healthCheck.status = 'degraded';
  }

  // Overall health status
  const hasErrors = Object.values(healthCheck.services).some(service => service.status === 'error');
  if (hasErrors) {
    healthCheck.status = 'unhealthy';
  }

  // Set appropriate HTTP status code
  const statusCode = healthCheck.status === 'healthy' ? 200 : 
                    healthCheck.status === 'degraded' ? 207 : 503;

  // Add response headers
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Content-Type', 'application/json');

  return res.status(statusCode).json({
    ...healthCheck,
    message: getHealthMessage(healthCheck.status),
    documentation: {
      architecture: '/docs/HYBRID_ARCHITECTURE.md',
      supabase: '/docs/SUPABASE_SETUP_GUIDE.md',
      firebase: '/docs/FIREBASE_STEP_BY_STEP_SETUP.md',
      vercel: '/docs/VERCEL_DEPLOYMENT_GUIDE.md'
    }
  });
}

function getHealthMessage(status) {
  switch (status) {
    case 'healthy':
      return '🎉 All services are operational! Hybrid architecture is running smoothly.';
    case 'degraded':
      return '⚠️ Some services are experiencing issues, but core functionality is available.';
    case 'unhealthy':
      return '🚨 Critical services are down. Please check service configurations.';
    default:
      return '❓ Unknown health status.';
  }
}

// Export for testing
export { getHealthMessage };