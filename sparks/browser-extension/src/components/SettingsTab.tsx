import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/use-auth';
import { useExtensionStore } from '../store/extension-store';
import { formatTimeAgo } from '../lib/utils';
import LoadingSpinner from './LoadingSpinner';

const SettingsTab: React.FC = () => {
  const { user, signOut, isLoading: authLoading } = useAuth();
  const { 
    settings, 
    updateSettings, 
    clearExtensionData 
  } = useExtensionStore();
  
  const [localSettings, setLocalSettings] = useState(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Sync local settings with store
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      await updateSettings(localSettings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearData = async () => {
    try {
      setIsClearing(true);
      await clearExtensionData();
      setShowClearConfirm(false);
    } catch (error) {
      console.error('Failed to clear extension data:', error);
    } finally {
      setIsClearing(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  const openMainApp = (path = '') => {
    const mainAppUrl = process.env.PLASMO_PUBLIC_MAIN_APP_URL || 'http://localhost:3000';
    chrome.tabs.create({ url: `${mainAppUrl}${path}` });
  };

  const hasUnsavedChanges = JSON.stringify(localSettings) !== JSON.stringify(settings);

  return (
    <div className="settings-tab">
      {saveSuccess && (
        <div className="settings-success">
          <div className="settings-success-icon">✅</div>
          <span className="settings-success-text">Settings saved successfully!</span>
        </div>
      )}

      {/* User Account Section */}
      <div className="settings-section">
        <h3 className="settings-section-title">Account</h3>
        
        {user ? (
          <div className="settings-account">
            <div className="settings-account-info">
              <div className="settings-account-avatar">
                {user.user_metadata?.avatar_url ? (
                  <img 
                    src={user.user_metadata.avatar_url} 
                    alt="Avatar" 
                    className="settings-account-avatar-img"
                  />
                ) : (
                  <div className="settings-account-avatar-placeholder">
                    {user.email?.charAt(0).toUpperCase() || '👤'}
                  </div>
                )}
              </div>
              
              <div className="settings-account-details">
                <div className="settings-account-email">{user.email}</div>
                <div className="settings-account-meta">
                  Signed in {formatTimeAgo(user.created_at)}
                </div>
              </div>
            </div>
            
            <div className="settings-account-actions">
              <button
                className="extension-button extension-button-secondary"
                onClick={() => openMainApp('/dashboard')}
              >
                <span>🌐</span>
                <span>Open Dashboard</span>
              </button>
              
              <button
                className="extension-button extension-button-secondary"
                onClick={handleSignOut}
                disabled={authLoading}
              >
                {authLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <span>🚪</span>
                )}
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="settings-account-signed-out">
            <p className="settings-account-signed-out-text">
              You are not signed in.
            </p>
          </div>
        )}
      </div>

      {/* Extension Settings */}
      <div className="settings-section">
        <h3 className="settings-section-title">Extension Settings</h3>
        
        <div className="settings-form">
          <div className="settings-form-group">
            <label className="settings-form-label">
              <input
                type="checkbox"
                className="settings-form-checkbox"
                checked={localSettings.autoSave}
                onChange={(e) => setLocalSettings(prev => ({
                  ...prev,
                  autoSave: e.target.checked
                }))}
              />
              <span className="settings-form-checkbox-label">
                Auto-save captured content
              </span>
            </label>
            <p className="settings-form-help">
              Automatically save captured text without showing the popup
            </p>
          </div>

          <div className="settings-form-group">
            <label className="settings-form-label">
              <input
                type="checkbox"
                className="settings-form-checkbox"
                checked={localSettings.showTooltips}
                onChange={(e) => setLocalSettings(prev => ({
                  ...prev,
                  showTooltips: e.target.checked
                }))}
              />
              <span className="settings-form-checkbox-label">
                Show capture tooltips
              </span>
            </label>
            <p className="settings-form-help">
              Display tooltips when hovering over selected text
            </p>
          </div>

          <div className="settings-form-group">
            <label className="settings-form-label">
              <input
                type="checkbox"
                className="settings-form-checkbox"
                checked={localSettings.enableKeyboardShortcuts}
                onChange={(e) => setLocalSettings(prev => ({
                  ...prev,
                  enableKeyboardShortcuts: e.target.checked
                }))}
              />
              <span className="settings-form-checkbox-label">
                Enable keyboard shortcuts
              </span>
            </label>
            <p className="settings-form-help">
              Use Ctrl+Shift+S to quick capture, Ctrl+Shift+H for highlight mode
            </p>
          </div>

          <div className="settings-form-group">
            <label className="settings-form-label" htmlFor="defaultCategory">
              Default Category
            </label>
            <select
              id="defaultCategory"
              className="settings-form-select"
              value={localSettings.defaultCategory}
              onChange={(e) => setLocalSettings(prev => ({
                ...prev,
                defaultCategory: e.target.value
              }))}
            >
              <option value="general">General</option>
              <option value="work">Work</option>
              <option value="personal">Personal</option>
              <option value="research">Research</option>
              <option value="creative">Creative</option>
              <option value="technical">Technical</option>
              <option value="learning">Learning</option>
            </select>
            <p className="settings-form-help">
              Default category for new prompts
            </p>
          </div>

          <div className="settings-form-group">
            <label className="settings-form-label" htmlFor="theme">
              Theme
            </label>
            <select
              id="theme"
              className="settings-form-select"
              value={localSettings.theme}
              onChange={(e) => setLocalSettings(prev => ({
                ...prev,
                theme: e.target.value as 'light' | 'dark' | 'system'
              }))}
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
            <p className="settings-form-help">
              Choose your preferred theme
            </p>
          </div>
        </div>

        {hasUnsavedChanges && (
          <div className="settings-form-actions">
            <button
              className="extension-button extension-button-secondary"
              onClick={() => setLocalSettings(settings)}
            >
              Reset
            </button>
            
            <button
              className="extension-button extension-button-primary"
              onClick={handleSaveSettings}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <LoadingSpinner size="sm" color="white" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span>💾</span>
                  <span>Save Settings</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Data Management */}
      <div className="settings-section">
        <h3 className="settings-section-title">Data Management</h3>
        
        <div className="settings-data">
          <div className="settings-data-item">
            <div className="settings-data-info">
              <h4 className="settings-data-title">Clear Extension Data</h4>
              <p className="settings-data-description">
                Remove all locally stored extension data including settings and cached content.
                Your prompts in the main application will not be affected.
              </p>
            </div>
            
            <button
              className="extension-button extension-button-danger"
              onClick={() => setShowClearConfirm(true)}
              disabled={isClearing}
            >
              {isClearing ? (
                <LoadingSpinner size="sm" color="white" />
              ) : (
                <span>🗑️</span>
              )}
              <span>Clear Data</span>
            </button>
          </div>

          <div className="settings-data-item">
            <div className="settings-data-info">
              <h4 className="settings-data-title">Export Data</h4>
              <p className="settings-data-description">
                Export your extension settings and preferences as a backup file.
              </p>
            </div>
            
            <button
              className="extension-button extension-button-secondary"
              onClick={() => {
                const dataStr = JSON.stringify(settings, null, 2);
                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(dataBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `sparks-extension-settings-${new Date().toISOString().split('T')[0]}.json`;
                link.click();
                URL.revokeObjectURL(url);
              }}
            >
              <span>📥</span>
              <span>Export Settings</span>
            </button>
          </div>
        </div>
      </div>

      {/* About Section */}
      <div className="settings-section">
        <h3 className="settings-section-title">About</h3>
        
        <div className="settings-about">
          <div className="settings-about-item">
            <span className="settings-about-label">Version:</span>
            <span className="settings-about-value">
              {chrome.runtime.getManifest().version}
            </span>
          </div>
          
          <div className="settings-about-links">
            <button
              className="settings-about-link"
              onClick={() => openMainApp('/help')}
            >
              Help & Support
            </button>
            
            <button
              className="settings-about-link"
              onClick={() => {
                chrome.tabs.create({ url: 'https://github.com/kodexalabs/sparks-dev' });
              }}
            >
              GitHub Repository
            </button>
            
            <button
              className="settings-about-link"
              onClick={() => {
                chrome.tabs.create({ url: 'https://kodexalabs.space/privacy' });
              }}
            >
              Privacy Policy
            </button>
          </div>
        </div>
      </div>

      {/* Clear data confirmation modal */}
      {showClearConfirm && (
        <div className="settings-modal-overlay">
          <div className="settings-modal">
            <div className="settings-modal-header">
              <h3 className="settings-modal-title">Clear Extension Data</h3>
            </div>
            
            <div className="settings-modal-body">
              <p className="settings-modal-text">
                Are you sure you want to clear all extension data? This will:
              </p>
              <ul className="settings-modal-list">
                <li>Reset all extension settings to defaults</li>
                <li>Clear cached authentication data</li>
                <li>Remove locally stored content</li>
                <li>Sign you out of the extension</li>
              </ul>
              <p className="settings-modal-note">
                <strong>Note:</strong> Your prompts in the main application will not be affected.
              </p>
            </div>
            
            <div className="settings-modal-actions">
              <button
                className="extension-button extension-button-secondary"
                onClick={() => setShowClearConfirm(false)}
                disabled={isClearing}
              >
                Cancel
              </button>
              
              <button
                className="extension-button extension-button-danger"
                onClick={handleClearData}
                disabled={isClearing}
              >
                {isClearing ? (
                  <>
                    <LoadingSpinner size="sm" color="white" />
                    <span>Clearing...</span>
                  </>
                ) : (
                  <>
                    <span>🗑️</span>
                    <span>Clear Data</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsTab;