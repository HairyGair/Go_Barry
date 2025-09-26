import React, { useState } from 'react';
import './ModernAppHeader.css';

const NotificationBadgeExamples = () => {
  const [activeBreakdowns] = useState(3);

  return (
    <div style={{ 
      padding: '40px', 
      background: 'var(--bg-primary)', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '40px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <h2 style={{ color: 'var(--text-primary)', marginBottom: '20px' }}>
        Notification Badge Options - Choose Your Preferred Style
      </h2>
      
      <div style={{ display: 'flex', gap: '60px', flexWrap: 'wrap', alignItems: 'center' }}>
        
        {/* Option 1: Enhanced Corner Badge (Current) */}
        <div style={{ textAlign: 'center' }}>
          <button 
            className="action-btn-modern icon-only"
            style={{ position: 'relative', marginBottom: '12px' }}
          >
            🔔
            {activeBreakdowns > 0 && (
              <span className="notification-badge">{activeBreakdowns}</span>
            )}
          </button>
          <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
            Option 1: Enhanced Corner Badge<br/>
            <span style={{ color: '#22c55e', fontSize: '11px' }}>✓ Most visible, clear count</span>
          </p>
        </div>

        {/* Option 2: Side-by-Side Count */}
        <div style={{ textAlign: 'center' }}>
          <button 
            className="action-btn-modern"
            style={{ marginBottom: '12px' }}
          >
            🔔
            {activeBreakdowns > 0 && (
              <span style={{
                marginLeft: '4px',
                background: '#ff0030',
                color: 'white',
                fontSize: '11px',
                fontWeight: '700',
                padding: '2px 6px',
                borderRadius: '10px',
                minWidth: '20px',
                display: 'inline-block',
                textAlign: 'center'
              }}>{activeBreakdowns}</span>
            )}
          </button>
          <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
            Option 2: Side-by-Side<br/>
            <span style={{ color: '#3b82f6', fontSize: '11px' }}>Clean, integrated look</span>
          </p>
        </div>

        {/* Option 3: Bottom Right Integrated */}
        <div style={{ textAlign: 'center' }}>
          <button 
            className="action-btn-modern icon-only"
            style={{ position: 'relative', marginBottom: '12px' }}
          >
            🔔
            {activeBreakdowns > 0 && (
              <span style={{
                position: 'absolute',
                bottom: '-2px',
                right: '-2px',
                background: '#ff0030',
                color: 'white',
                fontSize: '10px',
                fontWeight: '700',
                padding: '1px 4px',
                borderRadius: '8px',
                minWidth: '16px',
                textAlign: 'center',
                border: '2px solid var(--bg-primary)',
                lineHeight: '1.2'
              }}>{activeBreakdowns}</span>
            )}
          </button>
          <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
            Option 3: Bottom Corner<br/>
            <span style={{ color: '#f59e0b', fontSize: '11px' }}>Subtle, doesn't overflow</span>
          </p>
        </div>

        {/* Option 4: Glow Effect */}
        <div style={{ textAlign: 'center' }}>
          <button 
            className="action-btn-modern icon-only"
            style={{ position: 'relative', marginBottom: '12px' }}
          >
            🔔
            {activeBreakdowns > 0 && (
              <span style={{
                position: 'absolute',
                top: '-6px',
                right: '-6px',
                background: '#ff0030',
                color: 'white',
                fontSize: '11px',
                fontWeight: '700',
                padding: '3px 6px',
                borderRadius: '12px',
                minWidth: '20px',
                textAlign: 'center',
                boxShadow: '0 0 0 2px var(--bg-primary), 0 0 10px rgba(255, 0, 48, 0.8), 0 0 20px rgba(255, 0, 48, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '20px'
              }}>{activeBreakdowns}</span>
            )}
          </button>
          <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
            Option 4: Glow Effect<br/>
            <span style={{ color: '#ef4444', fontSize: '11px' }}>Eye-catching, urgent feel</span>
          </p>
        </div>

        {/* Option 5: Dot Only (no count) */}
        <div style={{ textAlign: 'center' }}>
          <button 
            className="action-btn-modern icon-only"
            style={{ position: 'relative', marginBottom: '12px' }}
          >
            🔔
            {activeBreakdowns > 0 && (
              <span style={{
                position: 'absolute',
                top: '2px',
                right: '2px',
                width: '10px',
                height: '10px',
                background: '#ff0030',
                borderRadius: '50%',
                border: '2px solid var(--bg-primary)',
                animation: 'notificationPulse 2s ease-in-out infinite'
              }}></span>
            )}
          </button>
          <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
            Option 5: Simple Dot<br/>
            <span style={{ color: '#9ca3af', fontSize: '11px' }}>Minimal, just indicates presence</span>
          </p>
        </div>

        {/* Option 6: Superscript Style */}
        <div style={{ textAlign: 'center' }}>
          <button 
            className="action-btn-modern icon-only"
            style={{ position: 'relative', marginBottom: '12px' }}
          >
            <span style={{ fontSize: '16px', position: 'relative' }}>
              🔔
              {activeBreakdowns > 0 && (
                <sup style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-10px',
                  background: '#ff0030',
                  color: 'white',
                  fontSize: '10px',
                  fontWeight: '700',
                  padding: '2px 5px',
                  borderRadius: '10px',
                  minWidth: '18px',
                  display: 'inline-block',
                  textAlign: 'center',
                  lineHeight: '1'
                }}>{activeBreakdowns}</sup>
              )}
            </span>
          </button>
          <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
            Option 6: Superscript<br/>
            <span style={{ color: '#8b5cf6', fontSize: '11px' }}>Classic web style</span>
          </p>
        </div>

      </div>

      {/* Comparison in different themes */}
      <div style={{ marginTop: '40px' }}>
        <h3 style={{ color: 'var(--text-primary)', marginBottom: '20px' }}>
          Recommended: Option 1 with these improvements
        </h3>
        
        <div style={{ display: 'flex', gap: '40px', alignItems: 'center' }}>
          {/* Original */}
          <div>
            <button 
              className="action-btn-modern icon-only"
              style={{ position: 'relative', marginBottom: '8px' }}
            >
              🔔
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: 'var(--danger-color)',
                color: 'white',
                fontSize: '10px',
                fontWeight: '700',
                padding: '2px 6px',
                borderRadius: '10px',
                minWidth: '18px',
                textAlign: 'center'
              }}>{activeBreakdowns}</span>
            </button>
            <p style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>
              Before: Too small
            </p>
          </div>

          <span style={{ color: 'var(--text-secondary)' }}>→</span>

          {/* Improved */}
          <div>
            <button 
              className="action-btn-modern icon-only"
              style={{ position: 'relative', marginBottom: '8px' }}
            >
              🔔
              <span className="notification-badge">{activeBreakdowns}</span>
            </button>
            <p style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>
              After: Clear & visible
            </p>
          </div>
        </div>

        <div style={{ 
          marginTop: '20px', 
          padding: '16px', 
          background: 'var(--glass-bg)', 
          borderRadius: '8px',
          border: '1px solid var(--glass-border)'
        }}>
          <h4 style={{ color: 'var(--text-primary)', marginBottom: '8px', fontSize: '14px' }}>
            Why Option 1 Works Best:
          </h4>
          <ul style={{ color: 'var(--text-secondary)', fontSize: '12px', lineHeight: '1.6' }}>
            <li>✓ Larger size (20x20px) makes the number clearly readable</li>
            <li>✓ White border creates contrast against any background</li>
            <li>✓ Subtle animation draws attention without being distracting</li>
            <li>✓ Position doesn't interfere with the icon</li>
            <li>✓ Works well in both light and dark themes</li>
          </ul>
        </div>
      </div>

      {/* Live Implementation Example */}
      <div style={{ 
        marginTop: '40px',
        padding: '20px',
        background: 'var(--glass-bg)',
        borderRadius: '12px',
        border: '1px solid var(--glass-border)'
      }}>
        <h3 style={{ color: 'var(--text-primary)', marginBottom: '16px', fontSize: '14px' }}>
          Live Implementation in Header:
        </h3>
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          alignItems: 'center',
          padding: '12px',
          background: 'var(--bg-secondary)',
          borderRadius: '8px'
        }}>
          <button className="action-btn-modern icon-only" title="Search">
            🔍
          </button>
          <button 
            className="action-btn-modern icon-only"
            style={{ position: 'relative' }}
            title={`${activeBreakdowns} notifications`}
          >
            🔔
            {activeBreakdowns > 0 && (
              <span className="notification-badge">{activeBreakdowns}</span>
            )}
          </button>
          <button className="report-breakdown-btn">
            <span className="breakdown-icon">🚨</span>
            <span className="breakdown-label">Report Breakdown</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationBadgeExamples;