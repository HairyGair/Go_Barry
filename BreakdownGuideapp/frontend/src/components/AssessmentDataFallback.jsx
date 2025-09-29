import React from 'react';

/**
 * Fallback UI component when assessment data is unavailable
 * Provides user-friendly messaging and manual refresh options
 */
const AssessmentDataFallback = ({ 
  error, 
  isConnected = false, 
  isLoading = false,
  onRetry,
  onManualRefresh,
  variant = 'card' // 'card', 'inline', 'banner'
}) => {
  const getErrorMessage = () => {
    if (!error) return 'Assessment data temporarily unavailable';
    
    if (typeof error === 'string') return error;
    
    // Categorize common errors
    const message = error.message?.toLowerCase() || '';
    
    if (message.includes('network') || message.includes('fetch')) {
      return 'Network connection issue. Check your internet connection.';
    } else if (message.includes('timeout')) {
      return 'Request timed out. The service may be temporarily slow.';
    } else if (message.includes('auth') || message.includes('unauthorized')) {
      return 'Authentication required. Please log in again.';
    } else if (message.includes('server') || error.code >= 500) {
      return 'Server temporarily unavailable. Please try again shortly.';
    }
    
    return 'Unable to load assessment data. Please try again.';
  };

  const getStatusIcon = () => {
    if (isLoading) return '🔄';
    if (!isConnected) return '📡';
    return '⚠️';
  };

  const getRetryText = () => {
    if (isLoading) return 'Retrying...';
    return 'Retry';
  };

  if (variant === 'inline') {
    return (
      <div className="assessment-fallback-inline">
        <span className="fallback-icon">{getStatusIcon()}</span>
        <span className="fallback-message">{getErrorMessage()}</span>
        {onRetry && !isLoading && (
          <button 
            className="fallback-retry-btn"
            onClick={onRetry}
            disabled={isLoading}
          >
            {getRetryText()}
          </button>
        )}
        
        <style jsx>{`
          .assessment-fallback-inline {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            background: rgba(251, 191, 36, 0.1);
            border: 1px solid rgba(251, 191, 36, 0.3);
            border-radius: 6px;
            font-size: 13px;
            color: #92400e;
          }
          
          .fallback-icon {
            font-size: 14px;
          }
          
          .fallback-message {
            flex: 1;
            font-weight: 500;
          }
          
          .fallback-retry-btn {
            background: #f59e0b;
            color: white;
            border: none;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            cursor: pointer;
            transition: background 0.2s;
          }
          
          .fallback-retry-btn:hover:not(:disabled) {
            background: #d97706;
          }
          
          .fallback-retry-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
        `}</style>
      </div>
    );
  }

  if (variant === 'banner') {
    return (
      <div className="assessment-fallback-banner">
        <div className="banner-content">
          <div className="banner-icon">{getStatusIcon()}</div>
          <div className="banner-text">
            <div className="banner-title">Assessment Data Unavailable</div>
            <div className="banner-message">{getErrorMessage()}</div>
          </div>
          <div className="banner-actions">
            {onRetry && (
              <button 
                className="banner-retry-btn"
                onClick={onRetry}
                disabled={isLoading}
              >
                {getRetryText()}
              </button>
            )}
            {onManualRefresh && (
              <button 
                className="banner-refresh-btn"
                onClick={onManualRefresh}
                disabled={isLoading}
              >
                Manual Refresh
              </button>
            )}
          </div>
        </div>
        
        <style jsx>{`
          .assessment-fallback-banner {
            background: linear-gradient(135deg, 
              rgba(239, 68, 68, 0.1) 0%, 
              rgba(220, 38, 38, 0.05) 100%
            );
            border: 1px solid rgba(239, 68, 68, 0.2);
            border-radius: 8px;
            margin: 16px 0;
          }
          
          .banner-content {
            display: flex;
            align-items: center;
            padding: 16px;
            gap: 12px;
          }
          
          .banner-icon {
            font-size: 24px;
            min-width: 32px;
          }
          
          .banner-text {
            flex: 1;
          }
          
          .banner-title {
            font-weight: 600;
            color: #dc2626;
            margin-bottom: 4px;
          }
          
          .banner-message {
            font-size: 14px;
            color: #7f1d1d;
          }
          
          .banner-actions {
            display: flex;
            gap: 8px;
          }
          
          .banner-retry-btn, .banner-refresh-btn {
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
            border: none;
          }
          
          .banner-retry-btn {
            background: #dc2626;
            color: white;
          }
          
          .banner-retry-btn:hover:not(:disabled) {
            background: #b91c1c;
          }
          
          .banner-refresh-btn {
            background: white;
            color: #dc2626;
            border: 1px solid #dc2626;
          }
          
          .banner-refresh-btn:hover:not(:disabled) {
            background: #fef2f2;
          }
          
          .banner-retry-btn:disabled, 
          .banner-refresh-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
        `}</style>
      </div>
    );
  }

  // Default card variant
  return (
    <div className="assessment-fallback-card">
      <div className="card-icon">{getStatusIcon()}</div>
      <div className="card-title">Assessment Data Unavailable</div>
      <div className="card-message">{getErrorMessage()}</div>
      
      {!isConnected && (
        <div className="connection-status">
          <span className="status-indicator offline"></span>
          Connection lost - using cached data when available
        </div>
      )}
      
      <div className="card-actions">
        {onRetry && (
          <button 
            className="card-retry-btn"
            onClick={onRetry}
            disabled={isLoading}
          >
            {getRetryText()}
          </button>
        )}
        {onManualRefresh && (
          <button 
            className="card-refresh-btn"
            onClick={onManualRefresh}
            disabled={isLoading}
          >
            Manual Refresh
          </button>
        )}
      </div>
      
      <style jsx>{`
        .assessment-fallback-card {
          background: linear-gradient(135deg, 
            rgba(255, 255, 255, 0.9) 0%, 
            rgba(248, 250, 252, 0.95) 100%
          );
          border: 1px solid rgba(226, 232, 240, 0.6);
          border-radius: 12px;
          padding: 24px;
          text-align: center;
          backdrop-filter: blur(10px);
          box-shadow: 
            0 4px 16px rgba(0, 0, 0, 0.04),
            0 2px 8px rgba(0, 0, 0, 0.06);
        }
        
        .card-icon {
          font-size: 32px;
          margin-bottom: 12px;
        }
        
        .card-title {
          font-size: 18px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
        }
        
        .card-message {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 16px;
          line-height: 1.5;
        }
        
        .connection-status {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 12px;
          color: #9ca3af;
          margin-bottom: 16px;
        }
        
        .status-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #ef4444;
        }
        
        .status-indicator.offline {
          background: #ef4444;
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        .card-actions {
          display: flex;
          justify-content: center;
          gap: 12px;
        }
        
        .card-retry-btn, .card-refresh-btn {
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }
        
        .card-retry-btn {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
        }
        
        .card-retry-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          transform: translateY(-1px);
        }
        
        .card-refresh-btn {
          background: white;
          color: #3b82f6;
          border: 1px solid #3b82f6;
        }
        
        .card-refresh-btn:hover:not(:disabled) {
          background: #eff6ff;
          transform: translateY(-1px);
        }
        
        .card-retry-btn:disabled, 
        .card-refresh-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
      `}</style>
    </div>
  );
};

export default AssessmentDataFallback;