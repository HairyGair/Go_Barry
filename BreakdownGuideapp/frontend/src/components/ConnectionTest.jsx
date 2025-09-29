import React, { useState, useEffect } from 'react';
import useConnectionManager from '../hooks/useConnectionManager';
import ConnectionStatusIndicator from './ConnectionStatusIndicator';

/**
 * Connection Testing Component
 * Used to test WebSocket + Polling hybrid system functionality
 */
const ConnectionTest = () => {
  const [testResults, setTestResults] = useState([]);
  const [isTestingMode, setIsTestingMode] = useState(false);
  
  const connectionManager = useConnectionManager({
    endpoint: '/ws/sdc-dashboard',
    autoConnect: true,
    enableLogging: true
  });

  // Add test result
  const addTestResult = (test, result, details = '') => {
    const testResult = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      test,
      result,
      details,
      mode: connectionManager.currentMode,
      connected: connectionManager.isConnected
    };
    
    setTestResults(prev => [testResult, ...prev.slice(0, 19)]); // Keep last 20 results
    console.log('🧪 Test Result:', testResult);
  };

  // Test scenarios
  const runConnectionTests = async () => {
    setIsTestingMode(true);
    addTestResult('Test Suite Started', 'info', 'Running connection reliability tests');

    try {
      // Test 1: Basic connectivity
      addTestResult('Basic Connectivity', 
        connectionManager.isConnected ? 'pass' : 'fail',
        `Connection state: ${connectionManager.connectionState.state}, Mode: ${connectionManager.currentMode}`
      );

      // Test 2: Send test message
      if (connectionManager.isConnected) {
        connectionManager.send({
          type: 'test_message',
          payload: { test: true, timestamp: Date.now() }
        });
        addTestResult('Send Message', 'pass', 'Test message sent successfully');
      } else {
        addTestResult('Send Message', 'skip', 'Not connected - cannot test messaging');
      }

      // Test 3: Force mode switch (WebSocket to Polling)
      if (connectionManager.currentMode === 'websocket') {
        addTestResult('Mode Switch Test', 'info', 'Switching from WebSocket to Polling');
        connectionManager.switchMode('polling');
        
        // Wait and check
        setTimeout(() => {
          addTestResult('Mode Switch Result',
            connectionManager.currentMode === 'polling' ? 'pass' : 'fail',
            `Current mode: ${connectionManager.currentMode}`
          );
        }, 2000);
      }

      // Test 4: Failover simulation (disconnect and reconnect)
      setTimeout(() => {
        addTestResult('Failover Test', 'info', 'Testing automatic failover');
        connectionManager.disconnect();
        
        setTimeout(() => {
          connectionManager.connect();
          
          setTimeout(() => {
            addTestResult('Failover Result',
              connectionManager.isConnected ? 'pass' : 'fail',
              `Reconnected: ${connectionManager.isConnected}, Mode: ${connectionManager.currentMode}`
            );
          }, 3000);
        }, 1000);
      }, 5000);

    } catch (error) {
      addTestResult('Test Suite Error', 'fail', error.message);
    }

    setTimeout(() => {
      setIsTestingMode(false);
      addTestResult('Test Suite Complete', 'info', 'All tests finished');
    }, 12000);
  };

  // Listen for connection messages
  useEffect(() => {
    const unsubscribe = connectionManager.onMessage((message) => {
      addTestResult('Message Received', 'info', 
        `Type: ${message.type}, Mode: ${connectionManager.currentMode}`
      );
    });

    return unsubscribe;
  }, [connectionManager]);

  // Monitor connection state changes
  useEffect(() => {
    addTestResult('Connection State Change', 'info',
      `State: ${connectionManager.connectionState.state}, Mode: ${connectionManager.currentMode}, Connected: ${connectionManager.isConnected}`
    );
  }, [connectionManager.connectionState.state, connectionManager.currentMode, connectionManager.isConnected]);

  const clearResults = () => {
    setTestResults([]);
  };

  const forceReconnect = () => {
    addTestResult('Manual Reconnect', 'info', 'User triggered reconnection');
    connectionManager.retry();
  };

  const getResultIcon = (result) => {
    switch (result) {
      case 'pass': return '✅';
      case 'fail': return '❌';
      case 'info': return 'ℹ️';
      case 'skip': return '⏭️';
      default: return '❓';
    }
  };

  const getResultColor = (result) => {
    switch (result) {
      case 'pass': return '#10b981';
      case 'fail': return '#ef4444';
      case 'info': return '#3b82f6';
      case 'skip': return '#6b7280';
      default: return '#9ca3af';
    }
  };

  return (
    <div className="connection-test">
      <div className="test-header">
        <h3>🧪 Connection Manager Test Suite</h3>
        <div className="test-controls">
          <button 
            onClick={runConnectionTests}
            disabled={isTestingMode}
            className="test-btn primary"
          >
            {isTestingMode ? '⏳ Testing...' : '🚀 Run Tests'}
          </button>
          <button 
            onClick={forceReconnect}
            className="test-btn secondary"
          >
            🔄 Reconnect
          </button>
          <button 
            onClick={clearResults}
            className="test-btn danger"
          >
            🗑️ Clear
          </button>
        </div>
      </div>

      <div className="connection-status">
        <div className="status-grid">
          <div className="status-item">
            <span className="label">State:</span>
            <span className={`value ${connectionManager.isConnected ? 'connected' : 'disconnected'}`}>
              {connectionManager.connectionState.state}
            </span>
          </div>
          <div className="status-item">
            <span className="label">Mode:</span>
            <span className="value">
              {connectionManager.currentMode === 'websocket' ? '⚡ WebSocket' : '🔄 Polling'}
            </span>
          </div>
          <div className="status-item">
            <span className="label">Health:</span>
            <span className={`value ${connectionManager.isHealthy ? 'healthy' : 'unhealthy'}`}>
              {connectionManager.isHealthy ? 'Healthy' : 'Unhealthy'}
            </span>
          </div>
          <div className="status-item">
            <span className="label">Messages:</span>
            <span className="value">{connectionManager.messages.length}</span>
          </div>
        </div>
      </div>

      <div className="test-results">
        <h4>📊 Test Results ({testResults.length})</h4>
        <div className="results-list">
          {testResults.length === 0 ? (
            <div className="no-results">
              No test results yet. Click "Run Tests" to start.
            </div>
          ) : (
            testResults.map(result => (
              <div 
                key={result.id}
                className="result-item"
                style={{ borderLeftColor: getResultColor(result.result) }}
              >
                <div className="result-header">
                  <span className="result-icon">{getResultIcon(result.result)}</span>
                  <span className="result-test">{result.test}</span>
                  <span className="result-timestamp">
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                {result.details && (
                  <div className="result-details">{result.details}</div>
                )}
                <div className="result-context">
                  Mode: {result.mode} | Connected: {result.connected ? 'Yes' : 'No'}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Connection Status Indicator */}
      <ConnectionStatusIndicator 
        connectionManager={connectionManager.manager}
        showDetails={true}
        position="bottom-left"
      />

      <style jsx>{`
        .connection-test {
          max-width: 800px;
          margin: 20px auto;
          padding: 20px;
          background: rgba(0, 0, 0, 0.05);
          border-radius: 12px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .test-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
        }

        .test-header h3 {
          margin: 0;
          color: #1f2937;
          font-size: 18px;
        }

        .test-controls {
          display: flex;
          gap: 8px;
        }

        .test-btn {
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .test-btn.primary {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
        }

        .test-btn.secondary {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
        }

        .test-btn.danger {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: white;
        }

        .test-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .test-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .connection-status {
          background: white;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 20px;
          border: 1px solid rgba(0, 0, 0, 0.1);
        }

        .status-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 16px;
        }

        .status-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .label {
          font-size: 12px;
          color: #6b7280;
          font-weight: 500;
        }

        .value {
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
        }

        .value.connected {
          color: #10b981;
        }

        .value.disconnected {
          color: #ef4444;
        }

        .value.healthy {
          color: #10b981;
        }

        .value.unhealthy {
          color: #f59e0b;
        }

        .test-results {
          background: white;
          border-radius: 8px;
          padding: 16px;
          border: 1px solid rgba(0, 0, 0, 0.1);
        }

        .test-results h4 {
          margin: 0 0 16px 0;
          color: #1f2937;
          font-size: 16px;
        }

        .results-list {
          max-height: 400px;
          overflow-y: auto;
        }

        .no-results {
          text-align: center;
          padding: 40px 20px;
          color: #6b7280;
          font-style: italic;
        }

        .result-item {
          border-left: 4px solid #e5e7eb;
          background: #f9fafb;
          padding: 12px;
          margin-bottom: 8px;
          border-radius: 0 6px 6px 0;
        }

        .result-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }

        .result-icon {
          font-size: 14px;
        }

        .result-test {
          font-weight: 600;
          color: #1f2937;
          flex: 1;
        }

        .result-timestamp {
          font-size: 11px;
          color: #6b7280;
        }

        .result-details {
          font-size: 12px;
          color: #4b5563;
          margin-left: 22px;
          margin-bottom: 4px;
        }

        .result-context {
          font-size: 10px;
          color: #9ca3af;
          margin-left: 22px;
        }

        @media (max-width: 768px) {
          .test-header {
            flex-direction: column;
            gap: 12px;
            align-items: stretch;
          }

          .test-controls {
            justify-content: center;
          }

          .status-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
};

export default ConnectionTest;