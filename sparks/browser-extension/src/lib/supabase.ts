import { createClient } from '@supabase/supabase-js';
import type { Database } from './database-types';

// These should match the main application's environment variables
// In a real deployment, these would be injected during build
const supabaseUrl = process.env.PLASMO_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.PLASMO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

// Create Supabase client with the same configuration as main app
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: 'sparks-extension-auth',
    storage: {
      getItem: (key: string) => {
        return new Promise((resolve) => {
          chrome.storage.local.get([key], (result) => {
            resolve(result[key] || null);
          });
        });
      },
      setItem: (key: string, value: string) => {
        return new Promise((resolve) => {
          chrome.storage.local.set({ [key]: value }, () => {
            resolve();
          });
        });
      },
      removeItem: (key: string) => {
        return new Promise((resolve) => {
          chrome.storage.local.remove([key], () => {
            resolve();
          });
        });
      }
    }
  }
});

// Auth helpers
export const auth = supabase.auth;

// Database helpers
export const db = supabase;

// Extension-specific auth functions
export async function getExtensionSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  } catch (error) {
    console.error('Error getting extension session:', error);
    return null;
  }
}

export async function signInWithMainApp() {
  try {
    // Try to get session from main app's cookies or storage
    // This would need to be implemented based on your main app's auth flow
    const mainAppSession = await getMainAppSession();
    
    if (mainAppSession) {
      // Set the session in the extension
      const { error } = await supabase.auth.setSession({
        access_token: mainAppSession.access_token,
        refresh_token: mainAppSession.refresh_token
      });
      
      if (error) throw error;
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error signing in with main app:', error);
    return false;
  }
}

// Helper to get session from main app (implementation depends on your setup)
async function getMainAppSession() {
  try {
    // Option 1: Try to get from cookies if same domain
    const cookies = await new Promise<chrome.cookies.Cookie[]>((resolve) => {
      chrome.cookies.getAll({ domain: '.kodexalabs.space' }, resolve);
    });
    
    const authCookie = cookies.find(cookie => 
      cookie.name.includes('supabase') || cookie.name.includes('auth')
    );
    
    if (authCookie) {
      // Parse and return session data
      try {
        return JSON.parse(decodeURIComponent(authCookie.value));
      } catch {
        return null;
      }
    }
    
    // Option 2: Message main app for session
    return await requestSessionFromMainApp();
  } catch (error) {
    console.error('Error getting main app session:', error);
    return null;
  }
}

// Request session from main app via messaging
async function requestSessionFromMainApp() {
  try {
    // This would send a message to the main app's content script
    // to request the current session
    const tabs = await chrome.tabs.query({ 
      url: ['https://kodexalabs.space/*', 'http://localhost:*'] 
    });
    
    if (tabs.length > 0) {
      const response = await chrome.tabs.sendMessage(tabs[0].id!, {
        type: 'GET_SESSION',
        source: 'sparks-extension'
      });
      
      return response?.session || null;
    }
    
    return null;
  } catch (error) {
    console.error('Error requesting session from main app:', error);
    return null;
  }
}

// Database operations specific to extension
export async function savePromptFromExtension(promptData: any) {
  try {
    const { data, error } = await supabase
      .from('prompts')
      .insert({
        ...promptData,
        metadata: {
          ...promptData.metadata,
          source: 'extension',
          createdVia: 'browser-extension'
        }
      })
      .select()
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error saving prompt from extension:', error);
    return { data: null, error };
  }
}

export async function getUserPrompts(userId: string, limit = 10) {
  try {
    const { data, error } = await supabase
      .from('prompts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error getting user prompts:', error);
    return { data: null, error };
  }
}

export default supabase;