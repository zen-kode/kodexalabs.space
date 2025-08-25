import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Session } from '@supabase/supabase-js';
import type { ExtensionSettings, ExtensionState, CapturedContent } from '../lib/types';
import { getStorageItem, setStorageItem } from '../lib/utils';

interface ExtensionStore {
  // Auth state
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Extension state
  settings: ExtensionSettings;
  capturedContent: CapturedContent[];
  isCapturing: boolean;
  lastError: string | null;
  
  // UI state
  isPopupOpen: boolean;
  activeTab: 'capture' | 'library' | 'settings';
  theme: 'light' | 'dark' | 'system';
  
  // Actions
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Settings actions
  updateSettings: (settings: Partial<ExtensionSettings>) => void;
  resetSettings: () => void;
  
  // Content actions
  addCapturedContent: (content: CapturedContent) => void;
  removeCapturedContent: (id: string) => void;
  clearCapturedContent: () => void;
  setCapturing: (capturing: boolean) => void;
  
  // UI actions
  setPopupOpen: (open: boolean) => void;
  setActiveTab: (tab: 'capture' | 'library' | 'settings') => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  
  // Initialization
  initialize: () => Promise<void>;
}

const defaultSettings: ExtensionSettings = {
  autoCapture: true,
  showContextMenu: true,
  saveToCategory: 'web-capture',
  enableNotifications: true,
  theme: 'system',
  shortcuts: {
    captureSelection: 'Ctrl+Shift+S',
    openPopup: 'Ctrl+Shift+P',
    quickSave: 'Ctrl+Shift+Q'
  },
  privacy: {
    allowAnalytics: false,
    shareUsageData: false
  }
};

// Custom storage for Chrome extension
const chromeStorage = {
  getItem: async (name: string) => {
    const result = await getStorageItem(name);
    return result ? JSON.stringify(result) : null;
  },
  setItem: async (name: string, value: string) => {
    await setStorageItem(name, JSON.parse(value));
  },
  removeItem: async (name: string) => {
    await chrome.storage.local.remove([name]);
  }
};

export const useExtensionStore = create<ExtensionStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: true,
      
      settings: defaultSettings,
      capturedContent: [],
      isCapturing: false,
      lastError: null,
      
      isPopupOpen: false,
      activeTab: 'capture',
      theme: 'system',
      
      // Auth actions
      setUser: (user) => set({ 
        user, 
        isAuthenticated: !!user 
      }),
      
      setSession: (session) => set({ 
        session,
        isAuthenticated: !!session?.user 
      }),
      
      setLoading: (isLoading) => set({ isLoading }),
      
      setError: (lastError) => set({ lastError }),
      
      // Settings actions
      updateSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings }
      })),
      
      resetSettings: () => set({ settings: defaultSettings }),
      
      // Content actions
      addCapturedContent: (content) => set((state) => ({
        capturedContent: [content, ...state.capturedContent].slice(0, 50) // Keep last 50
      })),
      
      removeCapturedContent: (id) => set((state) => ({
        capturedContent: state.capturedContent.filter(c => c.id !== id)
      })),
      
      clearCapturedContent: () => set({ capturedContent: [] }),
      
      setCapturing: (isCapturing) => set({ isCapturing }),
      
      // UI actions
      setPopupOpen: (isPopupOpen) => set({ isPopupOpen }),
      
      setActiveTab: (activeTab) => set({ activeTab }),
      
      setTheme: (theme) => set({ theme }),
      
      // Initialization
      initialize: async () => {
        try {
          set({ isLoading: true });
          
          // Load settings from storage
          const savedSettings = await getStorageItem<ExtensionSettings>('extension-settings');
          if (savedSettings) {
            set({ settings: { ...defaultSettings, ...savedSettings } });
          }
          
          // Load captured content from storage
          const savedContent = await getStorageItem<CapturedContent[]>('captured-content');
          if (savedContent) {
            set({ capturedContent: savedContent });
          }
          
          // Apply theme
          const { theme } = get().settings;
          get().setTheme(theme);
          
        } catch (error) {
          console.error('Error initializing extension store:', error);
          set({ lastError: 'Failed to initialize extension' });
        } finally {
          set({ isLoading: false });
        }
      }
    }),
    {
      name: 'sparks-extension-store',
      storage: chromeStorage,
      partialize: (state) => ({
        settings: state.settings,
        capturedContent: state.capturedContent,
        theme: state.theme,
        activeTab: state.activeTab
      })
    }
  )
);

// Selectors for common state combinations
export const useAuth = () => {
  const { user, session, isAuthenticated, isLoading } = useExtensionStore();
  return { user, session, isAuthenticated, isLoading };
};

export const useSettings = () => {
  const { settings, updateSettings, resetSettings } = useExtensionStore();
  return { settings, updateSettings, resetSettings };
};

export const useCapturedContent = () => {
  const { 
    capturedContent, 
    addCapturedContent, 
    removeCapturedContent, 
    clearCapturedContent,
    isCapturing,
    setCapturing
  } = useExtensionStore();
  
  return {
    capturedContent,
    addCapturedContent,
    removeCapturedContent,
    clearCapturedContent,
    isCapturing,
    setCapturing
  };
};

export const useUI = () => {
  const {
    isPopupOpen,
    activeTab,
    theme,
    setPopupOpen,
    setActiveTab,
    setTheme
  } = useExtensionStore();
  
  return {
    isPopupOpen,
    activeTab,
    theme,
    setPopupOpen,
    setActiveTab,
    setTheme
  };
};

// Initialize store when imported
if (typeof window !== 'undefined') {
  useExtensionStore.getState().initialize();
}