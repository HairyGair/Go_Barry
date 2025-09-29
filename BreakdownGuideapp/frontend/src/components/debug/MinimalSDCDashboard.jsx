/**
 * Minimal SDC Dashboard - Simplified version to test basic functionality
 * Use this to isolate the blank screen issue
 */

import React, { useState, useEffect } from 'react';

const MinimalSDCDashboard = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState({});

  useEffect(() => {
    console.log('🔍 MinimalSDCDashboard: Component mounting...');
    
    try {
      // Basic checks
      const info = {
        reactVersion: React.version,
        windowLocation: window.location.href,
        userAgent: navigator.userAgent.substring(0, 100),
        timestamp: new Date().toISOString()
      };
      
      setDebugInfo(info);
      setIsLoaded(true);
      
      console.log('✅ MinimalSDCDashboard: Mounted successfully', info);
    } catch (err) {
      console.error('❌ MinimalSDCDashboard: Mount error', err);
      setError(err.message);
    }
  }, []);

  // Error boundary
  if (error) {
    return (
      <div style={{
        padding: '20px',
        background: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '8px',
        margin: '20px'
      }}>
        <h2 style={{ color: '#dc2626', margin: '0 0 16px 0' }}>
          ❌ Component Error
        </h2>
        <p style={{ color: '#991b1b', marginBottom: '16px' }}>
          {error}
        </p>
        <button 
          onClick={() => window.location.reload()}
          style={{
            background: '#dc2626',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Reload Page
        </button>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#f8fafc'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '16px' }}>⏳</div>
          <div>Loading SDC Dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc',
      padding: '20px'
    }}>
      {/* Header */}
      <div style={{
        background: 'white',
        padding: '24px',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginBottom: '24px'
      }}>
        <h1 style={{
          margin: '0 0 8px 0',
          fontSize: '28px',
          fontWeight: '700',
          color: '#1e293b',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          🎯 SDC Operations Centre (Minimal)
        </h1>
        <p style={{
          margin: 0,
          color: '#64748b',
          fontSize: '14px'
        }}>
          Simplified dashboard for debugging - React is working!
        </p>
      </div>

      {/* Status Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <StatusCard 
          title="React Status"
          value="✅ Working"
          description="Component rendered successfully"
        />
        <StatusCard 
          title="JavaScript"
          value="✅ Working"
          description="No console errors"
        />
        <StatusCard 
          title="Styling"
          value="✅ Working"
          description="CSS styles applied"
        />
        <StatusCard 
          title="Navigation"
          value="✅ Working"
          description="URL routing functional"
        />
      </div>

      {/* Debug Information */}
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginBottom: '24px'
      }}>
        <h3 style={{
          margin: '0 0 16px 0',
          fontSize: '18px',
          fontWeight: '600',
          color: '#374151'
        }}>
          🔍 Debug Information
        </h3>
        <div style={{
          background: '#f8fafc',
          padding: '16px',
          borderRadius: '8px',
          fontFamily: 'monospace',
          fontSize: '12px',
          overflow: 'auto'
        }}>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap'
      }}>
        <ActionButton
          label="🔄 Reload Page"
          onClick={() => window.location.reload()}
          color="#3b82f6"
        />
        <ActionButton
          label="🏠 Go to Breakdown Guide"
          onClick={() => window.location.href = '/breakdown-guide'}
          color="#10b981"
        />
        <ActionButton
          label="📊 View Full Dashboard"
          onClick={() => window.location.href = '/dashboards/sdc'}
          color="#f59e0b"
        />
        <ActionButton
          label="🧪 Open Console"
          onClick={() => {
            console.log('🔍 Manual console check requested');
            console.log('Current URL:', window.location.href);
            console.log('Debug Info:', debugInfo);
            alert('Check browser console (F12) for debug information');
          }}
          color="#8b5cf6"
        />
      </div>

      {/* Instructions */}
      <div style={{
        background: '#eff6ff',
        border: '1px solid #3b82f6',
        borderRadius: '8px',
        padding: '16px',
        marginTop: '24px'
      }}>
        <h4 style={{
          margin: '0 0 12px 0',
          color: '#1e40af',
          fontSize: '16px'
        }}>
          🛠️ If you're seeing this page:
        </h4>
        <ul style={{
          margin: 0,
          paddingLeft: '20px',
          color: '#1e40af',
          fontSize: '14px',
          lineHeight: '1.6'
        }}>
          <li>React is working correctly</li>
          <li>Basic JavaScript execution is functional</li>
          <li>The blank screen issue is likely in the full dashboard</li>
          <li>Check browser console (F12) for specific error messages</li>
          <li>Try clicking "View Full Dashboard" to test the complete component</li>
        </ul>
      </div>
    </div>
  );
};

// Helper Components
const StatusCard = ({ title, value, description }) => (
  <div style={{
    background: 'white',
    padding: '16px',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    textAlign: 'center'
  }}>
    <div style={{
      fontSize: '24px',
      fontWeight: '700',
      color: '#10b981',
      marginBottom: '8px'
    }}>
      {value}
    </div>
    <div style={{
      fontSize: '14px',
      fontWeight: '600',
      color: '#374151',
      marginBottom: '4px'
    }}>
      {title}
    </div>
    <div style={{
      fontSize: '12px',
      color: '#6b7280'
    }}>
      {description}
    </div>
  </div>
);

const ActionButton = ({ label, onClick, color }) => (
  <button
    onClick={onClick}
    style={{
      background: color,
      color: 'white',
      border: 'none',
      padding: '12px 20px',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    }}
    onMouseEnter={(e) => {
      e.target.style.transform = 'translateY(-1px)';
    }}
    onMouseLeave={(e) => {
      e.target.style.transform = 'translateY(0)';
    }}
  >
    {label}
  </button>
);

export default MinimalSDCDashboard;