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
            value={settings.default_dashboard}
            onChange={(e) => updateSetting('default_dashboard', e.target.value)}
          >
            <option value="breakdown-guide">🔧 Breakdown Guide</option>
            <option value="sdc">📡 Operations</option>
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
            value={settings.auto_refresh_interval}
            onChange={(e) => updateSetting('auto_refresh_interval', parseInt(e.target.value))}
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
            className={`toggle-switch ${settings.show_activity_feed ? 'active' : ''}`}
            onClick={() => updateSetting('show_activity_feed', !settings.show_activity_feed)}
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
              value={settings.map_view}
              onChange={(e) => updateSetting('map_view', e.target.value)}
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
              className={`toggle-switch ${settings.show_traffic_layer !== false ? 'active' : ''}`}
              onClick={() => updateSetting('show_traffic_layer', !settings.show_traffic_layer)}
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
              className={`toggle-switch ${settings.filter_my_depot === true ? 'active' : ''}`}
              onClick={() => updateSetting('filter_my_depot', !settings.filter_my_depot)}
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
              className={`toggle-switch ${settings.hide_resolved !== false ? 'active' : ''}`}
              onClick={() => updateSetting('hide_resolved', !settings.hide_resolved)}
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
              className={`toggle-switch ${settings.highlight_priority !== false ? 'active' : ''}`}
              onClick={() => updateSetting('highlight_priority', !settings.highlight_priority)}
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
              className={`toggle-switch ${settings.sound_alerts === true ? 'active' : ''}`}
              onClick={() => updateSetting('sound_alerts', !settings.sound_alerts)}
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
              className={`toggle-switch ${settings.desktop_notifications === true ? 'active' : ''}`}
              onClick={() => {
                if (!settings.desktop_notifications && 'Notification' in window) {
                  Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                      updateSetting('desktop_notifications', true);
                      new Notification('🔔 Notifications Enabled', {
                        body: 'You will now receive desktop notifications for new breakdowns',
                        icon: '/logo.svg'
                      });
                    }
                  });
                } else {
                  updateSetting('desktop_notifications', !settings.desktop_notifications);
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
