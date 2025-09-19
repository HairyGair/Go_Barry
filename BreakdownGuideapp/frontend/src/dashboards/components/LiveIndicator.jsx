import React, { useState, useEffect } from 'react';
import { theme } from '@styles/theme';

const LiveIndicator = ({ 
  status = 'online',
  size = 'normal',
  showText = true,
  updateInterval = null,
  lastUpdate = null 
}) => {
  const [isConnected, setIsConnected] = useState(status === 'online');
  const [pulseAnimation, setPulseAnimation] = useState(true);

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
      className={`live-indicator ${isConnected ? 'online' : 'offline'}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: theme.spacing.sm,
        padding: `${theme.spacing.xs} ${theme.spacing.md}`,
        backgroundColor: isConnected 
          ? `${theme.colors.success}15`  // 15% opacity
          : `${theme.colors.danger}15`,   // 15% opacity
        border: `1px solid ${isConnected ? theme.colors.success : theme.colors.danger}`,
        borderRadius: theme.radius.full,
        fontSize: theme.fontSizes.sm,
      }}
    >
      <div 
        className={`status-dot ${pulseAnimation ? 'pulse' : ''}`}
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: isConnected ? theme.colors.success : theme.colors.danger,
        }}
      />
      {showText && (
        <span style={{
          color: isConnected ? theme.colors.success : theme.colors.danger,
          fontWeight: '600',
        }}>
          {isConnected ? 'Live' : 'Offline'}
          {updateInterval && isConnected && (
            <span style={{ color: theme.colors.textSecondary, fontWeight: '400' }}> • {updateInterval}s</span>
          )}
          {lastUpdate && (
            <span style={{ color: theme.colors.textSecondary, fontWeight: '400' }}> • {formatLastUpdate()}</span>
          )}
        </span>
      )}

      <style jsx>{`
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
      `}</style>
    </div>
  );
};

export default LiveIndicator;
