import React from 'react';
import { CircleAlert } from 'lucide-react';
import './ErrorAlert.css';

/**
 * ErrorAlert - Inline error component for displaying errors within pages
 * Shows error message with optional retry and dismiss actions
 * 
 * Usage:
 *   <ErrorAlert 
 *     error={{ message: "Failed to load data" }}
 *     onRetry={() => fetchData()}
 *     onDismiss={() => setError(null)}
 *   />
 */
export const ErrorAlert = ({ error, onRetry, onDismiss }) => {
  if (!error) return null;

  return (
    <div className="error-alert">
      <div className="error-alert-content">
        <span className="error-icon"><CircleAlert size={20} strokeWidth={2} aria-hidden="true" /></span>
        <div className="error-text">
          <strong>Error</strong>
          <p>{error.message || error}</p>
        </div>
        <div className="error-actions">
          {onRetry && (
            <button onClick={onRetry} className="btn-small">
              Retry
            </button>
          )}
          {onDismiss && (
            <button onClick={onDismiss} className="btn-small-secondary">
              Dismiss
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorAlert;
