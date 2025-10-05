/**
 * Appearance Settings Component
 * Theme, font size, and visual customization options
 */

import React from 'react';

const AppearanceSettings = ({ settings, updateSetting }) => {
  return (
    <div className="settings-section">
      <h2>🎨 Appearance</h2>
      <p className="section-description">
        Customize how the Breakdown Guide looks and feels to match your preferences
      </p>

      {/* Theme Selection */}
      <div className="setting-item">
        <div className="setting-label">
          <h3>Theme</h3>
          <p>Choose between dark and light mode</p>
        </div>
        <div className="setting-control">
          <select
            className="settings-select"
            value={settings.theme}
            onChange={(e) => updateSetting('theme', e.target.value)}
          >
            <option value="dark">🌙 Dark Mode</option>
            <option value="light">☀️ Light Mode</option>
          </select>
        </div>
      </div>

      {/* Font Size */}
      <div className="setting-item">
        <div className="setting-label">
          <h3>Font Size</h3>
          <p>Adjust text size for better readability</p>
        </div>
        <div className="setting-control">
          <select
            className="settings-select"
            value={settings.font_size}
            onChange={(e) => updateSetting('font_size', e.target.value)}
          >
            <option value="small">Small</option>
            <option value="medium">Medium (Default)</option>
            <option value="large">Large</option>
          </select>
        </div>
      </div>

      {/* View Density */}
      <div className="setting-item">
        <div className="setting-label">
          <h3>View Density</h3>
          <p>Control spacing and padding in the interface</p>
        </div>
        <div className="setting-control">
          <select
            className="settings-select"
            value={settings.view_density}
            onChange={(e) => updateSetting('view_density', e.target.value)}
          >
            <option value="compact">Compact (More content)</option>
            <option value="comfortable">Comfortable (Default)</option>
            <option value="spacious">Spacious (Extra padding)</option>
          </select>
        </div>
      </div>

      {/* Theme Preview */}
      <div className="settings-section" style={{ marginTop: '40px' }}>
        <h2>👁️ Preview</h2>
        <p className="section-description">
          See how your settings look
        </p>

        <div className="info-box success">
          <p>✓ Changes are applied immediately. No need to save or refresh!</p>
        </div>

        <div style={{
          padding: '24px',
          background: 'var(--bg-tertiary)',
          borderRadius: '12px',
          marginTop: '20px',
          border: '2px solid var(--border-color)'
        }}>
          <h3 style={{
            fontSize: settings.font_size === 'small' ? '16px' : settings.font_size === 'large' ? '20px' : '18px',
            marginBottom: '12px'
          }}>
            Sample Text
          </h3>
          <p style={{
            fontSize: settings.font_size === 'small' ? '13px' : settings.font_size === 'large' ? '17px' : '15px',
            color: 'var(--text-secondary)',
            lineHeight: '1.6'
          }}>
            This is how your text will appear throughout the application with your current settings.
            The quick brown fox jumps over the lazy dog. 0123456789.
          </p>

          <div style={{
            marginTop: '20px',
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            <button
              style={{
                padding: settings.view_density === 'compact' ? '8px 14px' : settings.view_density === 'spacious' ? '14px 24px' : '10px 18px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Primary Button
            </button>
            <button
              style={{
                padding: settings.view_density === 'compact' ? '8px 14px' : settings.view_density === 'spacious' ? '14px 24px' : '10px 18px',
                background: 'var(--bg-tertiary)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Secondary Button
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Appearance Options */}
      <div className="settings-section" style={{ marginTop: '40px' }}>
        <h2>⚡ Advanced</h2>
        <p className="section-description">
          Additional visual customization options
        </p>

        <div className="setting-item">
          <div className="setting-label">
            <h3>Animations</h3>
            <p>Enable smooth transitions and animations</p>
          </div>
          <div className="setting-control">
            <div
              className={`toggle-switch ${settings.animations_enabled !== false ? 'active' : ''}`}
              onClick={() => updateSetting('animations_enabled', !settings.animations_enabled)}
            />
          </div>
        </div>

        <div className="setting-item">
          <div className="setting-label">
            <h3>High Contrast</h3>
            <p>Increase contrast for better visibility</p>
          </div>
          <div className="setting-control">
            <div
              className={`toggle-switch ${settings.high_contrast === true ? 'active' : ''}`}
              onClick={() => updateSetting('high_contrast', !settings.high_contrast)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppearanceSettings;
