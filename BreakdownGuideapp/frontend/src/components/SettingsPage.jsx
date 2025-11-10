/**
 * Settings Page Component
 * Comprehensive user settings management for the Breakdown Guide
 *
 * Features:
 * - Profile & Account settings
 * - Appearance customization (theme, font size)
 * - Dashboard preferences
 * - Data management
 * - Security settings (Phase 2)
 * - Notification settings (Phase 2)
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import preferencesAPI from '../services/preferencesAPI.js';
import ProfileSettings from './settings/ProfileSettings.jsx';
import AppearanceSettings from './settings/AppearanceSettings.jsx';
import DashboardSettings from './settings/DashboardSettings.jsx';
import DataManagement from './settings/DataManagement.jsx';
import AdminSettings from './settings/AdminSettings.jsx';
import LoginAnalyticsDashboard from './settings/LoginAnalyticsDashboard.jsx';
import './SettingsPage.css';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { currentUser, isAuthenticated } = useAuth();

  // Active tab state
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Settings state (loaded from database)
  const [settings, setSettings] = useState({
    // Appearance
    theme: 'dark',
    font_size: 'medium',
    view_density: 'comfortable',
    animations_enabled: true,

    // Dashboard
    default_dashboard: 'breakdown-guide',
    auto_refresh_interval: 60,
    show_activity_feed: true,
    map_view: 'roadmap',
    show_traffic_layer: true,
    filter_my_depot: false,
    hide_resolved: true,
    highlight_priority: true,

    // Notifications
    notifications_enabled: true,
    sound_alerts: false,
    desktop_notifications: false,
  });

  // Load preferences from database on mount
  useEffect(() => {
    if (isAuthenticated) {
      loadPreferences();
    } else {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Load preferences from API
  const loadPreferences = async () => {
    try {
      setLoading(true);
      console.log('📋 Loading preferences from API...');
      const prefs = await preferencesAPI.getPreferences();
      console.log('✅ Preferences loaded:', prefs);

      // Map database column names to frontend state
      const mappedPrefs = {
        theme: prefs.theme,
        font_size: prefs.font_size,
        view_density: prefs.view_density,
        animations_enabled: prefs.animations_enabled,
        default_dashboard: prefs.default_dashboard,
        auto_refresh_interval: prefs.auto_refresh_interval,
        show_activity_feed: prefs.show_activity_feed,
        map_view: prefs.map_view,
        show_traffic_layer: prefs.show_traffic_layer,
        filter_my_depot: prefs.filter_my_depot,
        hide_resolved: prefs.hide_resolved,
        highlight_priority: prefs.highlight_priority,
        notifications_enabled: prefs.notifications_enabled,
        sound_alerts: prefs.sound_alerts,
        desktop_notifications: prefs.desktop_notifications,
      };

      setSettings(mappedPrefs);

      // Apply theme and font size
      document.documentElement.setAttribute('data-theme', mappedPrefs.theme);
      document.documentElement.setAttribute('data-font-size', mappedPrefs.font_size);

    } catch (error) {
      console.error('❌ Failed to load preferences:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        response: error.response
      });
      // Fallback to localStorage if API fails
      console.log('📱 Falling back to localStorage...');
      loadFromLocalStorage();
    } finally {
      setLoading(false);
    }
  };

  // Fallback to localStorage
  const loadFromLocalStorage = () => {
    setSettings({
      theme: localStorage.getItem('theme') || 'dark',
      font_size: localStorage.getItem('fontSize') || 'medium',
      view_density: localStorage.getItem('viewDensity') || 'comfortable',
      animations_enabled: localStorage.getItem('animationsEnabled') !== 'false',
      default_dashboard: localStorage.getItem('defaultDashboard') || 'breakdown-guide',
      auto_refresh_interval: parseInt(localStorage.getItem('autoRefreshInterval')) || 60,
      show_activity_feed: localStorage.getItem('showActivityFeed') !== 'false',
      map_view: localStorage.getItem('mapView') || 'roadmap',
      show_traffic_layer: localStorage.getItem('showTrafficLayer') !== 'false',
      filter_my_depot: localStorage.getItem('filterMyDepot') === 'true',
      hide_resolved: localStorage.getItem('hideResolved') !== 'false',
      highlight_priority: localStorage.getItem('highlightPriority') !== 'false',
      notifications_enabled: localStorage.getItem('notificationsEnabled') !== 'false',
      sound_alerts: localStorage.getItem('soundAlerts') === 'true',
      desktop_notifications: localStorage.getItem('desktopNotifications') === 'true',
    });
  };

  // Update setting and persist to database
  const updateSetting = async (key, value) => {
    // Update local state immediately for responsiveness
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));

    // Apply theme/font changes immediately
    if (key === 'theme') {
      document.documentElement.setAttribute('data-theme', value);
    }
    if (key === 'font_size') {
      document.documentElement.setAttribute('data-font-size', value);
    }

    // Save to database
    try {
      setSaving(true);
      await preferencesAPI.updatePreference(key, value);
      console.log(`✅ Setting saved: ${key} = ${value}`);
    } catch (error) {
      console.error(`❌ Failed to save setting ${key}:`, error);
      // Fallback to localStorage
      localStorage.setItem(key, value.toString());
    } finally {
      setSaving(false);
    }
  };

  // Reset all settings to default
  const resetAllSettings = async () => {
    if (window.confirm('Are you sure you want to reset all settings to default? This cannot be undone.')) {
      try {
        setSaving(true);

        // Reset in database
        const defaultPrefs = await preferencesAPI.resetPreferences();

        // Update local state
        const mappedPrefs = {
          theme: defaultPrefs.theme,
          font_size: defaultPrefs.font_size,
          view_density: defaultPrefs.view_density,
          animations_enabled: defaultPrefs.animations_enabled,
          default_dashboard: defaultPrefs.default_dashboard,
          auto_refresh_interval: defaultPrefs.auto_refresh_interval,
          show_activity_feed: defaultPrefs.show_activity_feed,
          map_view: defaultPrefs.map_view,
          show_traffic_layer: defaultPrefs.show_traffic_layer,
          filter_my_depot: defaultPrefs.filter_my_depot,
          hide_resolved: defaultPrefs.hide_resolved,
          highlight_priority: defaultPrefs.highlight_priority,
          notifications_enabled: defaultPrefs.notifications_enabled,
          sound_alerts: defaultPrefs.sound_alerts,
          desktop_notifications: defaultPrefs.desktop_notifications,
        };

        setSettings(mappedPrefs);

        // Apply theme and font size
        document.documentElement.setAttribute('data-theme', mappedPrefs.theme);
        document.documentElement.setAttribute('data-font-size', mappedPrefs.font_size);

        alert('✅ All settings have been reset to default');
      } catch (error) {
        console.error('Failed to reset settings:', error);
        alert('❌ Failed to reset settings. Please try again.');
      } finally {
        setSaving(false);
      }
    }
  };

  // Build tabs array - conditionally include Admin tab for admin users
  const tabs = [
    { id: 'profile', label: 'Profile & Account', icon: '👤' },
    { id: 'appearance', label: 'Appearance', icon: '🎨' },
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'data', label: 'Data & Storage', icon: '💾' },
    // Admin tabs - only show for admin users
    ...(currentUser?.role === 'admin' ? [
      { id: 'admin', label: 'Admin', icon: '🔐' },
      { id: 'analytics', label: 'Login Analytics', icon: '📈' }
    ] : []),
    // Phase 2:
    // { id: 'notifications', label: 'Notifications', icon: '🔔' },
    // { id: 'security', label: 'Security', icon: '🔒' },
  ];

  if (!currentUser) {
    return (
      <div className="settings-loading">
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="settings-page">
      {/* Header */}
      <div className="settings-header">
        <button
          className="back-button"
          onClick={() => navigate(-1)}
          title="Go back"
        >
          ← Back
        </button>
        <h1>Settings</h1>
        <button
          className="reset-button"
          onClick={resetAllSettings}
          title="Reset all settings to default"
        >
          Reset All
        </button>
      </div>

      <div className="settings-container">
        {/* Sidebar Tabs */}
        <div className="settings-sidebar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="settings-content">
          {activeTab === 'profile' && (
            <ProfileSettings
              user={currentUser}
              updateSetting={updateSetting}
            />
          )}

          {activeTab === 'appearance' && (
            <AppearanceSettings
              settings={settings}
              updateSetting={updateSetting}
            />
          )}

          {activeTab === 'dashboard' && (
            <DashboardSettings
              settings={settings}
              updateSetting={updateSetting}
            />
          )}

          {activeTab === 'data' && (
            <DataManagement
              user={currentUser}
              settings={settings}
            />
          )}

          {activeTab === 'admin' && (
            <AdminSettings />
          )}

          {activeTab === 'analytics' && (
            <LoginAnalyticsDashboard />
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
