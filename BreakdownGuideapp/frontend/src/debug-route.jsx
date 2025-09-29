/**
 * Debug Route - Quick test page to isolate blank screen issues
 * Use this to test basic React functionality
 */

import React from 'react';
import { createRoot } from 'react-dom/client';

// Minimal test component
const DebugApp = () => {
  return (
    <div style={{
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      background: '#f8fafc',
      minHeight: '100vh'
    }}>
      <div style={{
        background: 'white',
        padding: '24px',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        maxWidth: '600px',
        margin: '0 auto'
      }}>
        <h1 style={{
          color: '#10b981',
          marginTop: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          ✅ React is Working!
        </h1>
        
        <p style={{ color: '#374151', lineHeight: '1.6' }}>
          If you can see this page, React is rendering correctly. The blank screen issue 
          is likely caused by one of the following:
        </p>

        <div style={{
          background: '#fef3c7',
          border: '1px solid #f59e0b',
          borderRadius: '8px',
          padding: '16px',
          margin: '16px 0'
        }}>
          <h3 style={{ margin: '0 0 12px 0', color: '#92400e' }}>
            🔍 Common Causes:
          </h3>
          <ul style={{ margin: 0, color: '#92400e', paddingLeft: '20px' }}>
            <li>Import path errors (check file locations)</li>
            <li>Missing dependencies or components</li>
            <li>JavaScript errors (check browser console)</li>
            <li>CSS/styling issues causing invisible content</li>
            <li>Environment variable problems</li>
          </ul>
        </div>

        <div style={{
          display: 'grid',
          gap: '12px',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          margin: '20px 0'
        }}>
          <button
            onClick={() => {
              console.log('🔍 Debug Test Button Clicked');
              console.log('Window location:', window.location.href);
              console.log('React version:', React.version);
              alert('Check browser console for debug info');
            }}
            style={{
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '12px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            🧪 Test Console
          </button>

          <button
            onClick={() => window.location.href = '/breakdown-guide'}
            style={{
              background: '#10b981',
              color: 'white',
              border: 'none',
              padding: '12px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            🏠 Breakdown Guide
          </button>

          <button
            onClick={() => window.location.href = '/dashboards/sdc'}
            style={{
              background: '#f59e0b',
              color: 'white',
              border: 'none',
              padding: '12px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            📊 SDC Dashboard
          </button>
        </div>

        <div style={{
          background: '#f3f4f6',
          padding: '16px',
          borderRadius: '8px',
          margin: '20px 0'
        }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#374151' }}>
            📝 Next Steps:
          </h4>
          <ol style={{ margin: 0, color: '#4b5563', paddingLeft: '20px', lineHeight: '1.6' }}>
            <li>Open browser console (F12) and look for red error messages</li>
            <li>Check the Network tab for failed requests</li>
            <li>Try the "SDC Dashboard" button to test the full component</li>
            <li>If SDC Dashboard is blank, check import paths and dependencies</li>
          </ol>
        </div>

        <div style={{
          fontSize: '12px',
          color: '#6b7280',
          marginTop: '20px',
          fontFamily: 'monospace',
          background: '#f8fafc',
          padding: '12px',
          borderRadius: '6px'
        }}>
          Debug Info: {new Date().toISOString()} | {window.location.href}
        </div>
      </div>
    </div>
  );
};

// Check if we're in the browser and mount the component
if (typeof window !== 'undefined' && document.getElementById('root')) {
  const container = document.getElementById('root');
  const root = createRoot(container);
  root.render(<DebugApp />);
}

export default DebugApp;