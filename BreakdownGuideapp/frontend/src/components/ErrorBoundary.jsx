/**
 * Error Boundary - Catches React errors and automatically reports them
 * Wraps the entire app to catch any unhandled errors
 */

import React from 'react';
import './ErrorBoundary.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorReported: false
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);

    this.setState({
      error,
      errorInfo
    });

    // Automatically report the error to the backend
    this.reportError(error, errorInfo);
  }

  async reportError(error, errorInfo) {
    if (this.state.errorReported) return;

    try {
      const browserInfo = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        viewport: `${window.innerWidth}x${window.innerHeight}`
      };

      const bugReport = {
        title: `React Error: ${error.message}`,
        description: `An unhandled error occurred in the application.\n\nError: ${error.toString()}\n\nComponent Stack: ${errorInfo.componentStack}`,
        type: 'error',
        severity: 'high',
        pageUrl: window.location.href,
        userAgent: navigator.userAgent,
        browserInfo,
        errorMessage: error.message,
        errorStack: error.stack,
        additionalData: {
          componentStack: errorInfo.componentStack,
          errorName: error.name
        },
        appVersion: '3.0.0',
        environment: import.meta.env.VITE_ENV || 'production'
      };

      await fetch(`${import.meta.env.VITE_API_URL}/api/bug-reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bugReport)
      });

      this.setState({ errorReported: true });
    } catch (err) {
      console.error('Failed to report error:', err);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-container">
          <div className="error-boundary-content">
            <div className="error-icon">⚠️</div>
            <h1>Oops! Something went wrong</h1>
            <p className="error-message">
              We're sorry, but something unexpected happened. The error has been
              automatically reported to our team.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="error-details">
                <summary>Error Details (Development Only)</summary>
                <div className="error-details-content">
                  <h3>{this.state.error.toString()}</h3>
                  <pre>{this.state.errorInfo.componentStack}</pre>
                  <pre>{this.state.error.stack}</pre>
                </div>
              </details>
            )}

            <div className="error-actions">
              <button onClick={this.handleReload} className="btn-primary">
                Reload Page
              </button>
              <button onClick={this.handleGoHome} className="btn-secondary">
                Go to Home
              </button>
            </div>

            {this.state.errorReported && (
              <p className="error-reported-notice">
                ✓ Error report submitted successfully
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
