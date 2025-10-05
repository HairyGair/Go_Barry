/**
 * Dashboard Settings Component
 * Configure dashboard behavior and default views
 */

import React from 'react';

const DashboardSettings = ({ settings, updateSetting }) => {
  return (
    <div className="settings-section">
      <h2>📊 Dashboard Preferences</h2>
      <p className="section-description">
        Customize your dashboard experience and default views
      </p>

      {/* Default Dashboard */}
      <div className="setting-item">
        <div className="setting-label">
          <h3>Default Dashboard on Login</h3>
          <p>Which dashboard to show when you first log in</p>
        </div>
        <div className="setting-control">
          <select
            className="settings-select"
            value={settings.defaultDashboard}
            onChange={(e) => updateSetting('defaultDashboard', e.target.value)}
          >
            <option value="breakdown-guide">🔧 Breakdown Guide</option>
            <option value="sdc">📡 SDC Operations</option>
            <option value="engineering">⚙️ Engineering</option>
            <option value="management">📊 Management</option>
          </select>
        </div>
      </div>

      {/* Auto Refresh */}
      <div className="setting-item">
        <div className="setting-label">
          <h3>Auto Refresh Interval</h3>
          <p>How often dashboards automatically refresh data</p>
        </div>
        <div className="setting-control">
          <select
            className="settings-select"
            value={settings.autoRefreshInterval}
            onChange={(e) => updateSetting('autoRefreshInterval', parseInt(e.target.value))}
          >
            <option value="15">Every 15 seconds</option>
            <option value="30">Every 30 seconds</option>
            <option value="60">Every minute (Default)</option>
            <option value="120">Every 2 minutes</option>
            <option value="300">Every 5 minutes</option>
            <option value="0">Manual only</option>
          </select>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="setting-item">
        <div className="setting-label">
          <h3>Show Activity Feed</h3>
          <p>Display the live activity feed on dashboards</p>
        </div>
        <div className="setting-control">
          <div
            className={`toggle-switch ${settings.showActivityFeed ? 'active' : ''}`}
            onClick={() => updateSetting('showActivityFeed', !settings.showActivityFeed)}
          />
        </div>
      </div>

      {/* Map Settings */}
      <div className="settings-section" style={{ marginTop: '40px' }}>
        <h2>🗺️ Map Preferences</h2>
        <p className="section-description">
          Configure how maps display breakdown locations
        </p>

        <div className="setting-item">
          <div className="setting-label">
            <h3>Default Map View</h3>
            <p>Map style when viewing breakdown locations</p>
          </div>
          <div className="setting-control">
            <select
              className="settings-select"
              value={settings.mapView}
              onChange={(e) => updateSetting('mapView', e.target.value)}
            >
              <option value="roadmap">🗺️ Roadmap (Default)</option>
              <option value="satellite">🛰️ Satellite</option>
              <option value="hybrid">🔀 Hybrid</option>
              <option value="terrain">⛰️ Terrain</option>
            </select>
          </div>
        </div>

        <div className="setting-item">
          <div className="setting-label">
            <h3>Show Traffic Layer</h3>
            <p>Display real-time traffic conditions on maps</p>
          </div>
          <div className="setting-control">
            <div
              className={`toggle-switch ${settings.showTrafficLayer !== false ? 'active' : ''}`}
              onClick={() => updateSetting('showTrafficLayer', !settings.showTrafficLayer)}
            />
          </div>
        </div>
      </div>

      {/* Filter Preferences */}
      <div className="settings-section" style={{ marginTop: '40px' }}>
        <h2>🔍 Filter Preferences</h2>
        <p className="section-description">
          Set default filters for breakdown dashboards
        </p>

        <div className="setting-item">
          <div className="setting-label">
            <h3>Show Only My Depot</h3>
            <p>Filter breakdowns to show only your assigned depot by default</p>
          </div>
          <div className="setting-control">
            <div
              className={`toggle-switch ${settings.filterMyDepot === true ? 'active' : ''}`}
              onClick={() => updateSetting('filterMyDepot', !settings.filterMyDepot)}
            />
          </div>
        </div>

        <div className="setting-item">
          <div className="setting-label">
            <h3>Hide Resolved Breakdowns</h3>
            <p>Don't show resolved breakdowns by default</p>
          </div>
          <div className="setting-control">
            <div
              className={`toggle-switch ${settings.hideResolved !== false ? 'active' : ''}`}
              onClick={() => updateSetting('hideResolved', !settings.hideResolved)}
            />
          </div>
        </div>

        <div className="setting-item">
          <div className="setting-label">
            <h3>Highlight Priority Services</h3>
            <p>Emphasize breakdowns on priority routes</p>
          </div>
          <div className="setting-control">
            <div
              className={`toggle-switch ${settings.highlightPriority !== false ? 'active' : ''}`}
              onClick={() => updateSetting('highlightPriority', !settings.highlightPriority)}
            />
          </div>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="settings-section" style={{ marginTop: '40px' }}>
        <h2>🔔 Dashboard Notifications</h2>
        <p className="section-description">
          Control how you're notified of new breakdowns
        </p>

        <div className="setting-item">
          <div className="setting-label">
            <h3>Sound Alerts</h3>
            <p>Play sound when new breakdown is created</p>
          </div>
          <div className="setting-control">
            <div
              className={`toggle-switch ${settings.soundAlerts === true ? 'active' : ''}`}
              onClick={() => updateSetting('soundAlerts', !settings.soundAlerts)}
            />
          </div>
        </div>

        <div className="setting-item">
          <div className="setting-label">
            <h3>Desktop Notifications</h3>
            <p>Show browser notifications for critical breakdowns</p>
          </div>
          <div className="setting-control">
            <div
              className={`toggle-switch ${settings.desktopNotifications === true ? 'active' : ''}`}
              onClick={() => {
                if (!settings.desktopNotifications && 'Notification' in window) {
                  Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                      updateSetting('desktopNotifications', true);
                      new Notification('🔔 Notifications Enabled', {
                        body: 'You will now receive desktop notifications for new breakdowns',
                        icon: '/logo.svg'
                      });
                    }
                  });
                } else {
                  updateSetting('desktopNotifications', !settings.desktopNotifications);
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSettings;
