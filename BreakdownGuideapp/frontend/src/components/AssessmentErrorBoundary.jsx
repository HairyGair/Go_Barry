import React from 'react';

/**
 * Error Boundary for Assessment Components
 * Catches JavaScript errors in assessment-related components and displays fallback UI
 */
class AssessmentErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('🚨 Assessment Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
      hasError: true
    });

    // Log to external service if available
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));

    // Call retry callback if provided
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      const { fallback: FallbackComponent, showDetails = false } = this.props;
      
      if (FallbackComponent) {
        return (
          <FallbackComponent 
            error={this.state.error}
            retry={this.handleRetry}
            retryCount={this.state.retryCount}
          />
        );
      }

      return (
        <div className="assessment-error-boundary">
          <div className="error-content">
            <div className="error-icon">⚠️</div>
            <div className="error-title">Assessment Component Error</div>
            <div className="error-message">
              Something went wrong while loading assessment data. This may be due to a temporary issue.
            </div>
            
            {showDetails && this.state.error && (
              <details className="error-details">
                <summary>Technical Details</summary>
                <div className="error-stack">
                  <strong>Error:</strong> {this.state.error.toString()}
                  {this.state.errorInfo && (
                    <>
                      <br />
                      <strong>Component Stack:</strong>
                      <pre>{this.state.errorInfo.componentStack}</pre>
                    </>
                  )}
                </div>
              </details>
            )}
            
            <div className="error-actions">
              <button 
                className="retry-button"
                onClick={this.handleRetry}
              >
                {this.state.retryCount > 0 ? `Retry (${this.state.retryCount + 1})` : 'Retry'}
              </button>
              
              {this.props.onRefresh && (
                <button 
                  className="refresh-button"
                  onClick={this.props.onRefresh}
                >
                  Refresh Page
                </button>
              )}
            </div>

            {this.state.retryCount >= 3 && (
              <div className="persistent-error-note">
                If this error persists, please contact support or try refreshing the page.
              </div>
            )}
          </div>

          <style jsx>{`
            .assessment-error-boundary {
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 200px;
              padding: 20px;
              background: linear-gradient(135deg, 
                rgba(254, 242, 242, 0.9) 0%, 
                rgba(251, 231, 231, 0.95) 100%
              );
              border: 1px solid rgba(239, 68, 68, 0.2);
              border-radius: 12px;
              margin: 16px 0;
            }

            .error-content {
              text-align: center;
              max-width: 500px;
            }

            .error-icon {
              font-size: 48px;
              margin-bottom: 16px;
            }

            .error-title {
              font-size: 20px;
              font-weight: 600;
              color: #dc2626;
              margin-bottom: 8px;
            }

            .error-message {
              font-size: 14px;
              color: #7f1d1d;
              margin-bottom: 20px;
              line-height: 1.5;
            }

            .error-details {
              text-align: left;
              background: rgba(255, 255, 255, 0.8);
              border: 1px solid rgba(239, 68, 68, 0.2);
              border-radius: 8px;
              padding: 12px;
              margin-bottom: 20px;
            }

            .error-details summary {
              cursor: pointer;
              font-weight: 500;
              color: #dc2626;
              margin-bottom: 8px;
            }

            .error-stack {
              font-size: 12px;
              color: #374151;
              font-family: 'Monaco', 'Consolas', monospace;
            }

            .error-stack pre {
              background: #f9fafb;
              padding: 8px;
              border-radius: 4px;
              margin-top: 8px;
              white-space: pre-wrap;
              word-break: break-word;
            }

            .error-actions {
              display: flex;
              justify-content: center;
              gap: 12px;
              margin-bottom: 16px;
            }

            .retry-button, .refresh-button {
              padding: 10px 20px;
              border-radius: 8px;
              font-size: 14px;
              font-weight: 500;
              cursor: pointer;
              transition: all 0.2s;
              border: none;
            }

            .retry-button {
              background: linear-gradient(135deg, #dc2626, #b91c1c);
              color: white;
            }

            .retry-button:hover {
              background: linear-gradient(135deg, #b91c1c, #991b1b);
              transform: translateY(-1px);
            }

            .refresh-button {
              background: white;
              color: #dc2626;
              border: 1px solid #dc2626;
            }

            .refresh-button:hover {
              background: #fef2f2;
              transform: translateY(-1px);
            }

            .persistent-error-note {
              font-size: 12px;
              color: #6b7280;
              font-style: italic;
              padding: 12px;
              background: rgba(255, 255, 255, 0.6);
              border-radius: 6px;
              border: 1px solid rgba(209, 213, 219, 0.5);
            }
          `}</style>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AssessmentErrorBoundary;