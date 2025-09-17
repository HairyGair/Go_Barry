import React, { useState, useEffect } from 'react';

const LiveIndicator = ({ 
  status = 'online',
  size = 'normal',
  showText = true,
  updateInterval = null,
  lastUpdate = null 
}) => {
  const [isConnected, setIsConnected] = useState(status === 'online');
  const [pulseAnimation, setPulseAnimation] = useState(true);

  // Size variants
  const sizeClasses = {
    small: {
      dot: 'w-2 h-2',
      text: 'text-xs',
      padding: 'px-2 py-1'
    },
    normal: {
      dot: 'w-2 h-2',
      text: 'text-sm',
      padding: 'px-3 py-1'
    },
    large: {
      dot: 'w-3 h-3',
      text: 'text-base',
      padding: 'px-4 py-2'
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
    <div className={`live-indicator ${isConnected ? 'online' : 'offline'} ${currentSize.padding}`}>
      <div className={`status-dot ${currentSize.dot} ${isConnected ? 'online' : 'offline'} ${pulseAnimation ? 'pulse' : ''}`}></div>
      {showText && (
        <span className={`status-text ${currentSize.text}`}>
          {isConnected ? 'Live' : 'Offline'}
          {updateInterval && isConnected && (
            <span className="update-interval"> • {updateInterval}s</span>
          )}
          {lastUpdate && (
            <span className="last-update"> • {formatLastUpdate()}</span>
          )}
        </span>
      )}

      <style jsx>{`
        .live-indicator {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .live-indicator.online {
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
        }

        .live-indicator.offline {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        .status-dot {
          border-radius: 50%;
          transition: all 0.3s ease;
        }

        .status-dot.online {
          background: #10b981;
        }

        .status-dot.offline {
          background: #ef4444;
        }

        .status-dot.pulse {
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.5);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(16, 185, 129, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
          }
        }

        .status-dot.offline.pulse {
          animation: pulse-offline 2s infinite;
        }

        @keyframes pulse-offline {
          0% {
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.5);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
          }
        }

        .status-text {
          font-weight: 600;
          white-space: nowrap;
        }

        .update-interval,
        .last-update {
          opacity: 0.8;
          font-weight: 400;
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .live-indicator {
            background: rgba(0, 0, 0, 0.2);
          }
        }
      `}</style>
    </div>
  );
};

export default LiveIndicator;
