import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useAuth, useRequireAuth } from '../hooks/use-auth';
import { usePrompts } from '../hooks/use-prompts';
import { useExtensionStore, useUI, useSettings } from '../store/extension-store';
import { getStorageItem, removeStorageItem, applyTheme } from '../lib/utils';
import type { CapturedContent } from '../lib/types';

// Import components (we'll create these next)
import AuthScreen from '../components/AuthScreen';
import CaptureTab from '../components/CaptureTab';
import LibraryTab from '../components/LibraryTab';
import SettingsTab from '../components/SettingsTab';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorBoundary from '../components/ErrorBoundary';

// Import styles
import '../style.css';

function PopupApp() {
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();
  const { activeTab, setActiveTab, theme } = useUI();
  const { settings } = useSettings();
  const [prefillData, setPrefillData] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize popup
  useEffect(() => {
    initializePopup();
  }, []);

  // Apply theme
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const initializePopup = async () => {
    try {
      // Check for prefill data from context menu or content script
      const prefillData = await getStorageItem('popup-prefill-data');
      if (prefillData) {
        setPrefillData(prefillData);
        setActiveTab('capture');
        // Clear prefill data after using it
        await removeStorageItem('popup-prefill-data');
      }

      setIsInitialized(true);
    } catch (error) {
      console.error('Error initializing popup:', error);
      setIsInitialized(true);
    }
  };

  // Show loading screen while initializing
  if (!isInitialized || authLoading) {
    return (
      <div className="extension-popup">
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  // Show auth screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="extension-popup">
        <AuthScreen />
      </div>
    );
  }

  return (
    <div className="extension-popup">
      <PopupHeader activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="popup-content">
        <ErrorBoundary>
          {activeTab === 'capture' && <CaptureTab prefillData={prefillData} />}
          {activeTab === 'library' && <LibraryTab />}
          {activeTab === 'settings' && <SettingsTab />}
        </ErrorBoundary>
      </div>
    </div>
  );
}

// Popup header with navigation tabs
function PopupHeader({ 
  activeTab, 
  onTabChange 
}: { 
  activeTab: string; 
  onTabChange: (tab: 'capture' | 'library' | 'settings') => void; 
}) {
  const { user } = useAuth();

  const tabs = [
    { id: 'capture', label: 'Capture', icon: '📝' },
    { id: 'library', label: 'Library', icon: '📚' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ];

  return (
    <div className="popup-header">
      <div className="popup-header-top">
        <div className="popup-logo">
          <span className="popup-logo-icon">✨</span>
          <span className="popup-logo-text">Sparks</span>
        </div>
        <div className="popup-user-info">
          <span className="popup-user-email">
            {user?.email?.split('@')[0] || 'User'}
          </span>
        </div>
      </div>
      
      <nav className="popup-nav">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`popup-nav-tab ${
              activeTab === tab.id ? 'popup-nav-tab-active' : ''
            }`}
            onClick={() => onTabChange(tab.id as any)}
          >
            <span className="popup-nav-tab-icon">{tab.icon}</span>
            <span className="popup-nav-tab-label">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

// Error boundary for the entire popup
function PopupErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="extension-popup">
          <div className="flex flex-col items-center justify-center h-96 p-6 text-center">
            <div className="text-4xl mb-4">😵</div>
            <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
            <p className="text-sm text-gray-600 mb-4">
              The extension encountered an error. Please try refreshing or restarting the extension.
            </p>
            <button
              className="extension-button extension-button-primary"
              onClick={() => window.location.reload()}
            >
              Refresh Extension
            </button>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}

// Main popup component with error boundary
function Popup() {
  return (
    <PopupErrorBoundary>
      <PopupApp />
    </PopupErrorBoundary>
  );
}

// Initialize and render the popup
function initializePopup() {
  const container = document.getElementById('__plasmo');
  if (!container) {
    console.error('Popup container not found');
    return;
  }

  const root = createRoot(container);
  root.render(<Popup />);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializePopup);
} else {
  initializePopup();
}

export default Popup;