import React, { useState, useEffect } from 'react';
import { CONNECTION_STATES, CONNECTION_MODES } from '../services/connectionManager';

const ConnectionStatusIndicator = ({ connectionManager, showDetails = false, position = 'bottom-right' }) => {
  const [connectionState, setConnectionState] = useState({
    state: CONNECTION_STATES.DISCONNECTED,
    mode: CONNECTION_MODES.WEBSOCKET,
    reconnectAttempt: 0,
    maxReconnectAttempts: 5,
    isConnected: false,
    isHealthy: false
  });
  const [showDropdown, setShowDropdown] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    if (!connectionManager) return;

    // Initial state
    setConnectionState(connectionManager.getState());

    // Listen for state changes
    const unsubscribeStateChange = connectionManager.on('stateChange', (data) => {
      setConnectionState(connectionManager.getState());
    });

    const unsubscribeMessage = connectionManager.on('message', () => {
      setLastUpdate(new Date());
    });

    const unsubscribeConnected = connectionManager.on('connected', (data) => {
      setConnectionState(connectionManager.getState());
    });

    const unsubscribeDisconnected = connectionManager.on('disconnected', () => {
      setConnectionState(connectionManager.getState());
    });

    // Periodic health check
    const healthCheckInterval = setInterval(() => {
      if (connectionManager) {
        setConnectionState(connectionManager.getConnectionHealth());
      }
    }, 2000);

    return () => {
      unsubscribeStateChange();
      unsubscribeMessage();
      unsubscribeConnected();
      unsubscribeDisconnected();
      clearInterval(healthCheckInterval);
    };
  }, [connectionManager]);

  const getStatusConfig = () => {
    const { state, mode, isConnected, isHealthy } = connectionState;

    switch (state) {
      case CONNECTION_STATES.CONNECTED:
        return {
          color: '#10b981',
          icon: '🟢',
          text: mode === CONNECTION_MODES.WEBSOCKET ? 'Real-time' : 'Polling',
          description: mode === CONNECTION_MODES.WEBSOCKET ? 
            'WebSocket connected - Real-time updates' : 
            'Polling mode - Updates every 5s',
          pulse: true
        };
      case CONNECTION_STATES.POLLING:
        return {
          color: '#3b82f6',
          icon: '🔄',
          text: 'Polling',
          description: 'Polling for updates every 5 seconds',
          pulse: true
        };
      case CONNECTION_STATES.CONNECTING:
        return {
          color: '#f59e0b',
          icon: '🟡',
          text: 'Connecting',
          description: 'Establishing connection...',
          pulse: true
        };
      case CONNECTION_STATES.RECONNECTING:
        return {
          color: '#f59e0b',
          icon: '⚡',
          text: `Reconnecting (${connectionState.reconnectAttempt}/${connectionState.maxReconnectAttempts})`,
          description: 'Attempting to reconnect...',
          pulse: true
        };
      case CONNECTION_STATES.DISCONNECTED:
        return {
          color: '#6b7280',
          icon: '⚫',
          text: 'Disconnected',
          description: 'No connection to server',
          pulse: false
        };
      case CONNECTION_STATES.FAILED:
        return {
          color: '#ef4444',
          icon: '🔴',
          text: 'Failed',
          description: 'Connection failed - Manual retry required',
          pulse: false
        };
      default:
        return {
          color: '#6b7280',
          icon: '❔',
          text: 'Unknown',
          description: 'Unknown connection state',
          pulse: false
        };
    }
  };

  const handleRetryConnection = () => {
    if (connectionManager && !connectionState.isConnected) {
      connectionManager.connect();
    }
  };

  const handleSwitchMode = (newMode) => {
    if (connectionManager) {
      connectionManager.switchMode(newMode);
      setShowDropdown(false);
    }
  };

  const formatLastUpdate = () => {
    if (!lastUpdate) return 'No updates yet';
    const seconds = Math.floor((Date.now() - lastUpdate.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    return lastUpdate.toLocaleTimeString();
  };

  const statusConfig = getStatusConfig();

  return (
    <div className={`connection-status-indicator ${position}`}>
      {/* Main Status Indicator */}
      <div 
        className={`status-badge ${connectionState.isConnected ? 'connected' : 'disconnected'}`}
        onClick={() => setShowDropdown(!showDropdown)}
        title={statusConfig.description}
      >
        <div className={`status-icon ${statusConfig.pulse ? 'pulse' : ''}`}>
          {statusConfig.icon}
        </div>
        {showDetails && (
          <span className="status-text">{statusConfig.text}</span>
        )}
      </div>

      {/* Detailed Dropdown */}
      {showDropdown && (
        <div className="status-dropdown">
          <div className="dropdown-header">
            <h4>Connection Status</h4>
            <button 
              className="close-btn"
              onClick={() => setShowDropdown(false)}
            >
              ×
            </button>
          </div>

          <div className="status-details">
            <div className="detail-row">
              <span className="label">Status:</span>
              <span className="value" style={{ color: statusConfig.color }}>
                {statusConfig.icon} {statusConfig.text}
              </span>
            </div>
            
            <div className="detail-row">
              <span className="label">Mode:</span>
              <span className="value">
                {connectionState.mode === CONNECTION_MODES.WEBSOCKET ? '⚡ WebSocket' : '🔄 Polling'}
              </span>
            </div>

            <div className="detail-row">
              <span className="label">Last Update:</span>
              <span className="value">{formatLastUpdate()}</span>
            </div>

            {connectionState.state === CONNECTION_STATES.RECONNECTING && (
              <div className="detail-row">
                <span className="label">Attempt:</span>
                <span className="value">
                  {connectionState.reconnectAttempt}/{connectionState.maxReconnectAttempts}
                </span>
              </div>
            )}
          </div>

          <div className="connection-actions">
            {!connectionState.isConnected && (
              <button 
                className="action-btn retry"
                onClick={handleRetryConnection}
              >
                🔄 Retry Connection
              </button>
            )}

            <div className="mode-switch">
              <span className="switch-label">Connection Mode:</span>
              <div className="switch-buttons">
                <button
                  className={`mode-btn ${connectionState.mode === CONNECTION_MODES.WEBSOCKET ? 'active' : ''}`}
                  onClick={() => handleSwitchMode(CONNECTION_MODES.WEBSOCKET)}
                  disabled={connectionState.state === CONNECTION_STATES.CONNECTING}
                >
                  ⚡ WebSocket
                </button>
                <button
                  className={`mode-btn ${connectionState.mode === CONNECTION_MODES.POLLING ? 'active' : ''}`}
                  onClick={() => handleSwitchMode(CONNECTION_MODES.POLLING)}
                  disabled={connectionState.state === CONNECTION_STATES.CONNECTING}
                >
                  🔄 Polling
                </button>
              </div>
            </div>
          </div>

          <div className="connection-info">
            <small>
              {statusConfig.description}
            </small>
          </div>
        </div>
      )}

      <style jsx>{`
        .connection-status-indicator {
          position: fixed;
          z-index: 1000;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .connection-status-indicator.bottom-right {
          bottom: 20px;
          right: 20px;
        }

        .connection-status-indicator.top-right {
          top: 20px;
          right: 20px;
        }

        .connection-status-indicator.bottom-left {
          bottom: 20px;
          left: 20px;
        }

        .status-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          cursor: pointer;
          transition: all 0.3s ease;
          user-select: none;
        }

        .status-badge:hover {
          background: rgba(0, 0, 0, 0.9);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
        }

        .status-badge.connected {
          border-color: rgba(16, 185, 129, 0.3);
        }

        .status-badge.disconnected {
          border-color: rgba(239, 68, 68, 0.3);
        }

        .status-icon {
          font-size: 14px;
          line-height: 1;
        }

        .status-icon.pulse {
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .status-text {
          color: white;
          font-size: 12px;
          font-weight: 500;
          white-space: nowrap;
        }

        .status-dropdown {
          position: absolute;
          bottom: 100%;
          right: 0;
          margin-bottom: 10px;
          min-width: 300px;
          background: rgba(0, 0, 0, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 16px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          color: white;
        }

        .dropdown-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .dropdown-header h4 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: white;
        }

        .close-btn {
          background: none;
          border: none;
          color: #999;
          font-size: 18px;
          cursor: pointer;
          padding: 0;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .close-btn:hover {
          color: white;
        }

        .status-details {
          margin-bottom: 16px;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .detail-row:last-child {
          margin-bottom: 0;
        }

        .label {
          font-size: 12px;
          color: #999;
          font-weight: 500;
        }

        .value {
          font-size: 12px;
          color: white;
          font-weight: 600;
        }

        .connection-actions {
          margin-bottom: 12px;
        }

        .action-btn {
          width: 100%;
          padding: 8px 12px;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          border: none;
          border-radius: 6px;
          color: white;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-bottom: 12px;
        }

        .action-btn:hover {
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          transform: translateY(-1px);
        }

        .action-btn.retry {
          background: linear-gradient(135deg, #10b981, #059669);
        }

        .action-btn.retry:hover {
          background: linear-gradient(135deg, #059669, #047857);
        }

        .mode-switch {
          margin-top: 12px;
        }

        .switch-label {
          display: block;
          font-size: 11px;
          color: #999;
          margin-bottom: 6px;
          font-weight: 500;
        }

        .switch-buttons {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4px;
        }

        .mode-btn {
          padding: 6px 8px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          color: #999;
          font-size: 11px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .mode-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .mode-btn.active {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          border-color: #3b82f6;
          color: white;
        }

        .mode-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .connection-info {
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .connection-info small {
          color: #999;
          font-size: 11px;
          line-height: 1.4;
        }

        @media (max-width: 768px) {
          .status-dropdown {
            position: fixed;
            bottom: 80px;
            left: 20px;
            right: 20px;
            min-width: unset;
          }
        }
      `}</style>
    </div>
  );
};

export default ConnectionStatusIndicator;