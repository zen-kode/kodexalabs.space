import React, { useState } from 'react';
import { useAuth } from '../hooks/use-auth';
import LoadingSpinner from './LoadingSpinner';

const AuthScreen: React.FC = () => {
  const { signIn, isLoading, error, clearError } = useAuth();
  const [isAttempting, setIsAttempting] = useState(false);

  const handleSignIn = async () => {
    try {
      setIsAttempting(true);
      clearError();
      
      const success = await signIn();
      
      if (!success) {
        // signIn function will handle showing appropriate error or redirect
      }
    } catch (err) {
      console.error('Sign in error:', err);
    } finally {
      setIsAttempting(false);
    }
  };

  const openMainApp = () => {
    const mainAppUrl = process.env.PLASMO_PUBLIC_MAIN_APP_URL || 'http://localhost:3000';
    chrome.tabs.create({ url: `${mainAppUrl}/login?source=extension` });
  };

  return (
    <div className="auth-screen">
      <div className="auth-content">
        {/* Logo and branding */}
        <div className="auth-header">
          <div className="auth-logo">
            <span className="auth-logo-icon">✨</span>
            <h1 className="auth-logo-text">Sparks Extension</h1>
          </div>
          <p className="auth-subtitle">
            Capture and save web content as prompts
          </p>
        </div>

        {/* Authentication status */}
        <div className="auth-body">
          {isLoading || isAttempting ? (
            <div className="auth-loading">
              <LoadingSpinner size="md" />
              <p className="auth-loading-text">
                {isAttempting ? 'Signing in...' : 'Checking authentication...'}
              </p>
            </div>
          ) : (
            <div className="auth-actions">
              <div className="auth-message">
                <div className="auth-message-icon">🔐</div>
                <h2 className="auth-message-title">Sign in required</h2>
                <p className="auth-message-text">
                  Please sign in to your Sparks account to start capturing and saving web content.
                </p>
              </div>

              {error && (
                <div className="auth-error">
                  <div className="auth-error-icon">⚠️</div>
                  <p className="auth-error-text">{error}</p>
                  {error.includes('main application') && (
                    <button
                      className="auth-error-action"
                      onClick={openMainApp}
                    >
                      Open Main App
                    </button>
                  )}
                </div>
              )}

              <div className="auth-buttons">
                <button
                  className="extension-button extension-button-primary auth-button"
                  onClick={handleSignIn}
                  disabled={isLoading || isAttempting}
                >
                  {isAttempting ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>🔑</span>
                      <span>Sign In</span>
                    </>
                  )}
                </button>

                <button
                  className="extension-button extension-button-secondary auth-button"
                  onClick={openMainApp}
                >
                  <span>🌐</span>
                  <span>Open Main App</span>
                </button>
              </div>

              <div className="auth-help">
                <details className="auth-help-details">
                  <summary className="auth-help-summary">
                    Need help signing in?
                  </summary>
                  <div className="auth-help-content">
                    <p className="auth-help-text">
                      If you're having trouble signing in:
                    </p>
                    <ul className="auth-help-list">
                      <li>Make sure you're signed in to the main Sparks application</li>
                      <li>Try refreshing the extension</li>
                      <li>Check that you have an active internet connection</li>
                      <li>Clear your browser cache and cookies</li>
                    </ul>
                    <div className="auth-help-actions">
                      <button
                        className="auth-help-button"
                        onClick={() => window.location.reload()}
                      >
                        Refresh Extension
                      </button>
                      <button
                        className="auth-help-button"
                        onClick={() => {
                          chrome.tabs.create({ 
                            url: 'https://github.com/kodexalabs/sparks-dev/issues' 
                          });
                        }}
                      >
                        Report Issue
                      </button>
                    </div>
                  </div>
                </details>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="auth-footer">
          <p className="auth-footer-text">
            By using this extension, you agree to our{' '}
            <button
              className="auth-footer-link"
              onClick={() => {
                chrome.tabs.create({ url: 'https://kodexalabs.space/privacy' });
              }}
            >
              Privacy Policy
            </button>
            {' '}and{' '}
            <button
              className="auth-footer-link"
              onClick={() => {
                chrome.tabs.create({ url: 'https://kodexalabs.space/terms' });
              }}
            >
              Terms of Service
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;