/**
 * Data Management Component
 * Storage, cache, and data export options
 */

import React, { useState, useEffect } from 'react';

const DataManagement = ({ user, settings }) => {
  const [storageInfo, setStorageInfo] = useState({
    used: 0,
    total: 0,
    percentage: 0
  });

  // Calculate localStorage usage
  useEffect(() => {
    const calculateStorage = () => {
      let totalSize = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          totalSize += localStorage[key].length + key.length;
        }
      }

      // Convert to KB
      const usedKB = (totalSize / 1024).toFixed(2);
      const estimatedTotalKB = 5120; // 5MB typical limit
      const percentage = ((totalSize / (estimatedTotalKB * 1024)) * 100).toFixed(1);

      setStorageInfo({
        used: usedKB,
        total: estimatedTotalKB,
        percentage: Math.min(percentage, 100)
      });
    };

    calculateStorage();
  }, []);

  // Clear breakdown cache
  const clearBreakdownCache = () => {
    if (window.confirm('Clear all cached breakdown data?\n\nThis will remove locally stored breakdowns but won\'t affect the database.')) {
      const keysToRemove = [];
      for (let key in localStorage) {
        if (key.includes('breakdown') || key.includes('assessment') || key.includes('wizard')) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key));
      alert(`✅ Cleared ${keysToRemove.length} cached items`);
      window.location.reload();
    }
  };

  // Clear all browser data
  const clearAllData = () => {
    if (window.confirm('⚠️ WARNING: Clear ALL browser data?\n\nThis will:\n- Log you out\n- Clear all settings\n- Reset to defaults\n- Clear all cached data\n\nThis cannot be undone!')) {
      if (window.confirm('Are you ABSOLUTELY sure? This action cannot be undone!')) {
        localStorage.clear();
        sessionStorage.clear();
        alert('✅ All data cleared. You will be logged out.');
        window.location.href = '/';
      }
    }
  };

  // Export breakdown history
  const exportBreakdownHistory = async () => {
    try {
      // This would call an API endpoint in Phase 2
      alert('📊 Data Export Feature\n\nThis will be available in Phase 2 and will include:\n\n• All your breakdown assessments\n• Export formats: CSV, JSON, PDF\n• Date range filtering\n• Depot filtering\n\nFor now, you can view your breakdown history in the Management Dashboard.');
    } catch (error) {
      alert('❌ Export failed: ' + error.message);
    }
  };

  // Download settings backup
  const downloadSettingsBackup = () => {
    const settingsBackup = {
      exportDate: new Date().toISOString(),
      user: {
        email: user?.email,
        name: user?.name,
        depot: user?.depot
      },
      settings: settings,
      localStorage: {}
    };

    // Include relevant localStorage items
    for (let key in localStorage) {
      if (key.startsWith('theme') || key.startsWith('fontSize') || key.startsWith('default')) {
        settingsBackup.localStorage[key] = localStorage[key];
      }
    }

    const dataStr = JSON.stringify(settingsBackup, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `breakdown-guide-settings-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);

    alert('✅ Settings backup downloaded');
  };

  return (
    <div className="settings-section">
      <h2>💾 Data & Storage</h2>
      <p className="section-description">
        Manage your local data, cache, and storage usage
      </p>

      {/* Storage Usage */}
      <div className="setting-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
        <div className="setting-label" style={{ width: '100%' }}>
          <h3>Storage Usage</h3>
          <p>Local browser storage used by the application</p>
        </div>
        <div style={{
          width: '100%',
          marginTop: '16px',
          background: 'var(--bg-tertiary)',
          borderRadius: '8px',
          padding: '16px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '8px',
            fontSize: '14px'
          }}>
            <span>{storageInfo.used} KB used</span>
            <span>{storageInfo.percentage}%</span>
          </div>
          <div style={{
            width: '100%',
            height: '8px',
            background: 'var(--bg-input)',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${storageInfo.percentage}%`,
              height: '100%',
              background: storageInfo.percentage > 80
                ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                : storageInfo.percentage > 50
                ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                : 'linear-gradient(90deg, #10b981, #059669)',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>
      </div>

      {/* Clear Cache Options */}
      <div className="settings-section" style={{ marginTop: '40px' }}>
        <h2>🗑️ Clear Data</h2>
        <p className="section-description">
          Remove cached data to free up space or troubleshoot issues
        </p>

        <div className="setting-item">
          <div className="setting-label">
            <h3>Clear Breakdown Cache</h3>
            <p>Remove locally cached breakdown data (doesn't affect database)</p>
          </div>
          <div className="setting-control">
            <button
              className="settings-button secondary"
              onClick={clearBreakdownCache}
            >
              Clear Cache
            </button>
          </div>
        </div>

        <div className="setting-item">
          <div className="setting-label">
            <h3>Clear All Browser Data</h3>
            <p>⚠️ Removes ALL data including settings (you will be logged out)</p>
          </div>
          <div className="setting-control">
            <button
              className="settings-button danger"
              onClick={clearAllData}
            >
              Clear All Data
            </button>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="settings-section" style={{ marginTop: '40px' }}>
        <h2>📤 Export Data</h2>
        <p className="section-description">
          Download your data for backup or analysis
        </p>

        <div className="setting-item">
          <div className="setting-label">
            <h3>Export Breakdown History</h3>
            <p>Download all your breakdown assessments (CSV, JSON, or PDF)</p>
          </div>
          <div className="setting-control">
            <button
              className="settings-button"
              onClick={exportBreakdownHistory}
            >
              Export History
            </button>
          </div>
        </div>

        <div className="setting-item">
          <div className="setting-label">
            <h3>Backup Settings</h3>
            <p>Download a backup of your current settings (JSON)</p>
          </div>
          <div className="setting-control">
            <button
              className="settings-button"
              onClick={downloadSettingsBackup}
            >
              Download Backup
            </button>
          </div>
        </div>
      </div>

      {/* Offline Mode */}
      <div className="settings-section" style={{ marginTop: '40px' }}>
        <h2>📴 Offline Mode</h2>
        <p className="section-description">
          Configure how the app works without internet connection
        </p>

        <div className="info-box warning">
          <p>⚠️ Offline mode is currently in beta. Some features may not work properly without an internet connection.</p>
        </div>

        <div className="setting-item">
          <div className="setting-label">
            <h3>Enable Offline Mode</h3>
            <p>Cache data for offline use (experimental)</p>
          </div>
          <div className="setting-control">
            <div
              className={`toggle-switch ${settings.offlineMode === true ? 'active' : ''}`}
              onClick={() => {
                alert('Offline mode is coming in a future update!\n\nThis will allow you to:\n• Use the app without internet\n• Cache breakdown data locally\n• Queue assessments for later sync\n• Access vehicle data offline');
              }}
            />
          </div>
        </div>
      </div>

      {/* Data Statistics */}
      <div className="settings-section" style={{ marginTop: '40px' }}>
        <h2>📊 Data Statistics</h2>
        <p className="section-description">
          Information about your data usage
        </p>

        <div style={{
          padding: '20px',
          background: 'var(--bg-tertiary)',
          borderRadius: '12px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>
          <div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#3b82f6' }}>
              {Object.keys(localStorage).length}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Cached Items
            </div>
          </div>

          <div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#10b981' }}>
              {storageInfo.used} KB
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Storage Used
            </div>
          </div>

          <div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#f59e0b' }}>
              {user?.email ? '1' : '0'}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Active Sessions
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataManagement;
