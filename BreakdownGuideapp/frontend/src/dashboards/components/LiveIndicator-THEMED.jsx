import React, { useState, useEffect } from 'react';
import { theme } from '@styles/theme';

// Example: LiveIndicator component updated to use the operator theme system

const LiveIndicator = ({ 
  status = 'online',
  size = 'normal',
  showText = true,
  updateInterval = null,
  lastUpdate = null 
}) => {
  const [isConnected, setIsConnected] = useState(status === 'online');
  const [pulseAnimation, setPulseAnimation] = useState(true);

  // Size variants using theme spacing
  const sizeClasses = {
    small: {
      dot: 'w-2 h-2',
      text: 'text-xs',
      padding: `px-2 py-1`
    },
    normal: {
      dot: 'w-2 h-2',
      text: 'text-sm',
      padding: `px-3 py-1`
    },
    large: {
      dot: 'w-3 h-3',
      text: 'text-base',
      padding: `px-4 py-2`
    }
  };

  const currentSize = sizeClasses[size] || sizeClasses.normal;

  // Update connection status
  useEffect(() => {
    setIsConnected(status === 'online');
  }, [status]);

  // Handle auto-refresh display
  const formatLastUpdate = () => {
    if (!lastUpdate) return null;
    
    const now = new Date();
    const updated = new Date(lastUpdate);
    const diff = Math.floor((now - updated) / 1000);
    
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  return (
    <div 
      className={`live-indicator ${isConnected ? 'online' : 'offline'} ${currentSize.padding}`}
      style={{
        // Using theme colors instead of CSS classes
        backgroundColor: isConnected 
          ? `rgba(40, 167, 69, 0.1)`  // theme.colors.success with opacity
          : `rgba(220, 53, 69, 0.1)`,  // theme.colors.danger with opacity
        border: `1px solid ${isConnected ? theme.colors.success : theme.colors.danger}`,
        borderRadius: theme.radius.sm,
        display: 'inline-flex',
        alignItems: 'center',
        gap: theme.spacing.sm,
      }}
    >
      <div 
        className={`status-dot ${currentSize.dot} ${isConnected ? 'online' : 'offline'} ${pulseAnimation ? 'pulse' : ''}`}
        style={{
          backgroundColor: isConnected ? theme.colors.success : theme.colors.danger,
          borderRadius: '50%',
        }}
      ></div>
      {showText && (
        <span 
          className={`status-text ${currentSize.text}`}
          style={{
            color: isConnected ? theme.colors.success : theme.colors.danger,
            fontWeight: '500',
          }}
        >
          {isConnected ? 'Live' : 'Offline'}
          {updateInterval && isConnected && (
            <span style={{ color: theme.colors.textSecondary }}> • {updateInterval}s</span>
          )}
          {lastUpdate && (
            <span style={{ color: theme.colors.textSecondary }}> • {formatLastUpdate()}</span>
          )}
        </span>
      )}

      {/* Updated styles using CSS variables */}
      <style jsx>{`
        .live-indicator {
          transition: all var(--transition-normal);
        }
        
        .status-dot.pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: .5;
          }
        }
        
        /* Alternative: Using CSS variables */
        .live-indicator.online {
          background-color: rgba(40, 167, 69, 0.1);
          border-color: var(--color-success);
        }
        
        .live-indicator.offline {
          background-color: rgba(220, 53, 69, 0.1);
          border-color: var(--color-danger);
        }
        
        .status-dot.online {
          background-color: var(--color-success);
        }
        
        .status-dot.offline {
          background-color: var(--color-danger);
        }
      `}</style>
    </div>
  );
};

export default LiveIndicator;

// Example of using pre-built theme classes
export const LiveIndicatorThemed = ({ 
  status = 'online',
  showText = true,
  updateInterval = null,
  lastUpdate = null 
}) => {
  const isConnected = status === 'online';
  
  return (
    <div className={`theme-badge ${isConnected ? 'theme-badge-success' : 'theme-badge-danger'}`}>
      <span 
        className="theme-status-indicator"
        style={{
          backgroundColor: isConnected ? theme.colors.success : theme.colors.danger,
          animation: 'pulse 2s infinite',
        }}
      />
      {showText && (
        <>
          {isConnected ? 'Live' : 'Offline'}
          {updateInterval && isConnected && (
            <span style={{ opacity: 0.7 }}> • {updateInterval}s</span>
          )}
        </>
      )}
    </div>
  );
};
