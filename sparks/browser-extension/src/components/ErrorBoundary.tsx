import React, { Component, ErrorInfo, ReactNode } from 'react';
import { handleExtensionError } from '../lib/utils';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Update state with error info
    this.setState({ error, errorInfo });
    
    // Report error to extension error handling
    handleExtensionError(error, 'ErrorBoundary', {
      componentStack: errorInfo.componentStack,
      errorBoundary: true
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <div className="error-boundary-icon">⚠️</div>
            <h2 className="error-boundary-title">Something went wrong</h2>
            <p className="error-boundary-message">
              The extension encountered an unexpected error. This has been logged for investigation.
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="error-boundary-details">
                <summary className="error-boundary-details-summary">
                  Error Details (Development)
                </summary>
                <div className="error-boundary-details-content">
                  <pre className="error-boundary-error-text">
                    {this.state.error.toString()}
                  </pre>
                  {this.state.errorInfo && (
                    <pre className="error-boundary-stack-trace">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </details>
            )}
            
            <div className="error-boundary-actions">
              <button
                className="extension-button extension-button-primary"
                onClick={this.handleRetry}
              >
                Try Again
              </button>
              <button
                className="extension-button extension-button-secondary"
                onClick={this.handleReload}
              >
                Reload Extension
              </button>
            </div>
            
            <div className="error-boundary-help">
              <p className="error-boundary-help-text">
                If this problem persists, try:
              </p>
              <ul className="error-boundary-help-list">
                <li>Refreshing the page and reopening the extension</li>
                <li>Restarting your browser</li>
                <li>Checking for extension updates</li>
                <li>Reporting the issue to our support team</li>
              </ul>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;