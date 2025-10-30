/**
 * SDC Debugger - Diagnose blank screen and component loading issues
 */

import React, { useState, useEffect } from 'react';

const SDCDebugger = () => {
  const [diagnostics, setDiagnostics] = useState({});
  const [errors, setErrors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    const results = {};
    const errorsList = [];

    try {
      // 1. Check React rendering
      results.reactRendering = 'Working';
      
      // 2. Check environment variables
      results.environment = {
        mode: import.meta?.env?.MODE || 'unknown',
        apiUrl: import.meta?.env?.VITE_API_URL || 'not set',
        wsUrl: import.meta?.env?.VITE_WS_URL || 'not set'
      };

      // 3. Check API connectivity
      try {
        const apiUrl = import.meta?.env?.VITE_API_URL || 'https://breakdowns.gobarry.co.uk/api';
        const response = await fetch(`${apiUrl}/api/health`, { 
          method: 'GET',
          timeout: 5000 
        });
        results.apiConnectivity = response.ok ? 'Connected' : `Error: ${response.status}`;
      } catch (apiError) {
        results.apiConnectivity = `Failed: ${apiError.message}`;
        errorsList.push(`API connectivity: ${apiError.message}`);
      }

      // 4. Check required imports
      try {
        // Test if constants are accessible
        const constants = await import('../../breakdown-guide/components/common/constants');
        results.constantsImport = constants ? 'Loaded' : 'Failed';
      } catch (constError) {
        results.constantsImport = `Error: ${constError.message}`;
        errorsList.push(`Constants import: ${constError.message}`);
      }

      // 5. Check WebSocket service
      try {
        const wsService = await import('../../services/websocket');
        results.websocketService = wsService.default ? 'Loaded' : 'Failed';
      } catch (wsError) {
        results.websocketService = `Error: ${wsError.message}`;
        errorsList.push(`WebSocket service: ${wsError.message}`);
      }

      // 6. Check localStorage
      try {
        const testKey = 'sdc-debug-test';
        localStorage.setItem(testKey, 'test');
        const testValue = localStorage.getItem(testKey);
        localStorage.removeItem(testKey);
        results.localStorage = testValue === 'test' ? 'Working' : 'Failed';
      } catch (storageError) {
        results.localStorage = `Error: ${storageError.message}`;
        errorsList.push(`localStorage: ${storageError.message}`);
      }

      // 7. Check current URL and routing
      results.routing = {
        currentUrl: window.location.href,
        pathname: window.location.pathname,
        search: window.location.search,
        hash: window.location.hash
      };

      // 8. Check for JavaScript errors
      results.consoleErrors = 'Check browser console for errors';

      // 9. Check supervisor context
      try {
        const supervisor = localStorage.getItem('currentSupervisor');
        results.supervisorContext = supervisor ? JSON.parse(supervisor) : 'Not logged in';
      } catch (supervisorError) {
        results.supervisorContext = `Error: ${supervisorError.message}`;
        errorsList.push(`Supervisor context: ${supervisorError.message}`);
      }

      // 10. Check theme imports
      try {
        const theme = await import('../../styles/theme');
        results.themeImport = theme ? 'Loaded' : 'Failed';
      } catch (themeError) {
        results.themeImport = `Error: ${themeError.message}`;
        errorsList.push(`Theme import: ${themeError.message}`);
      }

    } catch (globalError) {
      errorsList.push(`Global diagnostic error: ${globalError.message}`);
    }

    setDiagnostics(results);
    setErrors(errorsList);
    setIsLoading(false);
  };

  const getStatusColor = (status) => {
    if (typeof status === 'string') {
      if (status.includes('Error') || status.includes('Failed')) return '#ef4444';
      if (status.includes('Working') || status.includes('Loaded') || status.includes('Connected')) return '#10b981';
    }
    return '#6b7280';
  };

  const getStatusIcon = (status) => {
    if (typeof status === 'string') {
      if (status.includes('Error') || status.includes('Failed')) return '❌';
      if (status.includes('Working') || status.includes('Loaded') || status.includes('Connected')) return '✅';
    }
    return '⚠️';
  };

  if (isLoading) {
    return (
      <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        background: 'white', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        zIndex: 99999
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '16px' }}>🔍</div>
          <div>Running SDC Dashboard Diagnostics...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'white',
      zIndex: 99999,
      overflow: 'auto',
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{
          background: 'linear-gradient(135deg, #ef4444, #dc2626)',
          color: 'white',
          padding: '24px',
          borderRadius: '12px',
          marginBottom: '24px'
        }}>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '24px' }}>
            🚨 SDC Dashboard Debug Screen
          </h1>
          <p style={{ margin: 0, opacity: 0.9 }}>
            Diagnosing blank screen issue - {errors.length} errors found
          </p>
        </div>

        {errors.length > 0 && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px'
          }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#dc2626' }}>
              ❌ Critical Errors Found
            </h3>
            {errors.map((error, index) => (
              <div key={index} style={{
                background: 'white',
                padding: '8px 12px',
                borderRadius: '4px',
                marginBottom: '8px',
                fontSize: '14px',
                color: '#991b1b'
              }}>
                {error}
              </div>
            ))}
          </div>
        )}

        <div style={{
          display: 'grid',
          gap: '16px',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))'
        }}>
          {Object.entries(diagnostics).map(([key, value]) => (
            <div key={key} style={{
              background: '#f8fafc',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '16px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px'
              }}>
                <span style={{ fontSize: '16px' }}>
                  {getStatusIcon(value)}
                </span>
                <h4 style={{
                  margin: 0,
                  fontSize: '14px',
                  fontWeight: '600',
                  textTransform: 'capitalize',
                  color: '#374151'
                }}>
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </h4>
              </div>
              
              <div style={{
                fontSize: '13px',
                color: getStatusColor(value),
                fontWeight: '500'
              }}>
                {typeof value === 'object' ? (
                  <pre style={{
                    background: 'white',
                    padding: '8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    overflow: 'auto',
                    margin: 0
                  }}>
                    {JSON.stringify(value, null, 2)}
                  </pre>
                ) : (
                  value
                )}
              </div>
            </div>
          ))}
        </div>

        <div style={{
          background: '#f0f9ff',
          border: '1px solid #0ea5e9',
          borderRadius: '8px',
          padding: '16px',
          marginTop: '24px'
        }}>
          <h3 style={{ margin: '0 0 12px 0', color: '#0369a1' }}>
            🔧 Troubleshooting Steps
          </h3>
          
          <div style={{ fontSize: '14px', color: '#374151', lineHeight: '1.5' }}>
            <p><strong>1. Check Browser Console:</strong></p>
            <p style={{ marginLeft: '16px', fontFamily: 'monospace', background: '#f3f4f6', padding: '4px 8px', borderRadius: '4px' }}>
              Press F12 → Console tab → Look for red error messages
            </p>

            <p><strong>2. Check Network Tab:</strong></p>
            <p style={{ marginLeft: '16px', fontFamily: 'monospace', background: '#f3f4f6', padding: '4px 8px', borderRadius: '4px' }}>
              F12 → Network tab → Refresh page → Look for failed requests (red)
            </p>

            <p><strong>3. Check Import Paths:</strong></p>
            <p style={{ marginLeft: '16px' }}>
              Verify all import statements are correct and files exist
            </p>

            <p><strong>4. Check Environment Variables:</strong></p>
            <p style={{ marginLeft: '16px' }}>
              Ensure .env files are configured correctly
            </p>

            <p><strong>5. Clear Browser Cache:</strong></p>
            <p style={{ marginLeft: '16px' }}>
              Hard refresh with Ctrl+F5 or Cmd+Shift+R
            </p>
          </div>
        </div>

        <div style={{
          display: 'flex',
          gap: '12px',
          marginTop: '24px',
          justifyContent: 'center'
        }}>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            🔄 Reload Page
          </button>
          
          <button
            onClick={runDiagnostics}
            style={{
              background: '#10b981',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            🔍 Re-run Diagnostics
          </button>

          <button
            onClick={() => {
              // Try to navigate to a working route
              window.location.href = '/breakdown-guide';
            }}
            style={{
              background: '#f59e0b',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            🏠 Go to Breakdown Guide
          </button>
        </div>

        <div style={{
          background: '#f3f4f6',
          padding: '16px',
          borderRadius: '8px',
          marginTop: '24px',
          fontSize: '12px',
          color: '#6b7280'
        }}>
          <p style={{ margin: '0 0 8px 0' }}>
            <strong>Debug Information:</strong>
          </p>
          <p style={{ margin: 0, fontFamily: 'monospace' }}>
            URL: {window.location.href}<br/>
            User Agent: {navigator.userAgent}<br/>
            Timestamp: {new Date().toISOString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SDCDebugger;