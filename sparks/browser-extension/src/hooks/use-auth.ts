import { useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, getExtensionSession, signInWithMainApp } from '../lib/supabase';
import { useExtensionStore } from '../store/extension-store';
import { sendMessageToBackground, handleExtensionError } from '../lib/utils';

interface AuthState {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  signIn: () => Promise<boolean>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  clearError: () => void;
}

export function useAuth(): AuthState & AuthActions {
  const {
    user,
    session,
    isAuthenticated,
    isLoading,
    lastError,
    setUser,
    setSession,
    setLoading,
    setError
  } = useExtensionStore();

  const [initialized, setInitialized] = useState(false);

  // Initialize authentication state
  useEffect(() => {
    if (!initialized) {
      initializeAuth();
      setInitialized(true);
    }
  }, [initialized]);

  // Set up auth state change listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        setSession(session);
        setUser(session?.user || null);
        setLoading(false);
        
        if (event === 'SIGNED_OUT') {
          // Clear any cached data
          await clearAuthData();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [setSession, setUser, setLoading]);

  // Initialize authentication
  const initializeAuth = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to get existing session
      const existingSession = await getExtensionSession();
      
      if (existingSession) {
        setSession(existingSession);
        setUser(existingSession.user);
        console.log('Existing session found:', existingSession.user.id);
      } else {
        // Try to authenticate with main app
        console.log('No existing session, attempting auto-authentication...');
        const success = await signInWithMainApp();
        
        if (!success) {
          console.log('Auto-authentication failed');
          setUser(null);
          setSession(null);
        }
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      handleExtensionError(error, 'initializeAuth');
      setError('Failed to initialize authentication');
      setUser(null);
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  // Sign in with main application
  const signIn = async (): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      // First, try to get auth status from background script
      const authResponse = await sendMessageToBackground({
        type: 'AUTHENTICATE'
      });
      
      if (authResponse.success && authResponse.data?.isAuthenticated) {
        const { user: authUser, session: authSession } = authResponse.data;
        setUser(authUser);
        setSession(authSession);
        return true;
      }
      
      // Fallback: try direct authentication
      const success = await signInWithMainApp();
      
      if (success) {
        const session = await getExtensionSession();
        if (session) {
          setUser(session.user);
          setSession(session);
          return true;
        }
      }
      
      // If all methods fail, redirect to main app for authentication
      await redirectToMainAppAuth();
      return false;
      
    } catch (error) {
      console.error('Error signing in:', error);
      handleExtensionError(error, 'signIn');
      setError('Failed to sign in. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const signOut = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Notify background script
      await sendMessageToBackground({
        type: 'SIGN_OUT'
      });
      
      // Clear local state
      setUser(null);
      setSession(null);
      
      // Clear cached data
      await clearAuthData();
      
    } catch (error) {
      console.error('Error signing out:', error);
      handleExtensionError(error, 'signOut');
      setError('Failed to sign out');
    } finally {
      setLoading(false);
    }
  };

  // Refresh session
  const refreshSession = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        throw error;
      }
      
      if (session) {
        setSession(session);
        setUser(session.user);
      } else {
        // Session refresh failed, try to re-authenticate
        await signIn();
      }
      
    } catch (error) {
      console.error('Error refreshing session:', error);
      handleExtensionError(error, 'refreshSession');
      setError('Failed to refresh session');
      
      // Clear invalid session
      setUser(null);
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  // Clear authentication data
  const clearAuthData = async () => {
    try {
      // Clear extension storage
      await chrome.storage.local.remove([
        'sparks-extension-auth',
        'supabase.auth.token',
        'captured-content'
      ]);
      
      console.log('Auth data cleared');
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  };

  // Redirect to main app for authentication
  const redirectToMainAppAuth = async () => {
    try {
      // Get the main app URL from environment or default
      const mainAppUrl = process.env.PLASMO_PUBLIC_MAIN_APP_URL || 'http://localhost:3000';
      const authUrl = `${mainAppUrl}/login?source=extension&redirect=${encodeURIComponent(window.location.href)}`;
      
      // Open main app in new tab for authentication
      await chrome.tabs.create({ url: authUrl });
      
      // Show instruction to user
      setError('Please sign in to the main application and then refresh this extension.');
      
    } catch (error) {
      console.error('Error redirecting to main app:', error);
      setError('Unable to redirect to main application for authentication');
    }
  };

  return {
    // State
    user,
    session,
    isAuthenticated,
    isLoading,
    error: lastError,
    
    // Actions
    signIn,
    signOut,
    refreshSession,
    clearError
  };
}

// Hook for checking if user is authenticated
export function useRequireAuth() {
  const { isAuthenticated, isLoading, signIn } = useAuth();
  const [hasAttemptedAuth, setHasAttemptedAuth] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !hasAttemptedAuth) {
      setHasAttemptedAuth(true);
      signIn();
    }
  }, [isLoading, isAuthenticated, hasAttemptedAuth, signIn]);

  return {
    isAuthenticated,
    isLoading: isLoading || (!isAuthenticated && !hasAttemptedAuth),
    requiresAuth: !isAuthenticated && !isLoading
  };
}

// Hook for getting current user profile
export function useUserProfile() {
  const { user, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUserProfile();
    } else {
      setProfile(null);
    }
  }, [isAuthenticated, user]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user!.id)
        .single();
      
      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }
      
      setProfile(data || {
        user_id: user!.id,
        display_name: user!.email?.split('@')[0] || 'User',
        avatar_url: null,
        bio: null,
        preferences: {}
      });
      
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError('Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  return {
    profile,
    loading,
    error,
    refetch: fetchUserProfile
  };
}