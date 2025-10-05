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
import ProfileSettings from './settings/ProfileSettings.jsx';
import AppearanceSettings from './settings/AppearanceSettings.jsx';
import DashboardSettings from './settings/DashboardSettings.jsx';
import DataManagement from './settings/DataManagement.jsx';
import './SettingsPage.css';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { currentUser, isAuthenticated } = useAuth();

  // Active tab state
  const [activeTab, setActiveTab] = useState('profile');

  // Settings state (loaded from localStorage for Phase 1)
  const [settings, setSettings] = useState({
    // Appearance
    theme: localStorage.getItem('theme') || 'dark',
    fontSize: localStorage.getItem('fontSize') || 'medium',
    viewDensity: localStorage.getItem('viewDensity') || 'comfortable',

    // Dashboard
    defaultDashboard: localStorage.getItem('defaultDashboard') || 'breakdown-guide',
    autoRefreshInterval: parseInt(localStorage.getItem('autoRefreshInterval')) || 60,
    showActivityFeed: localStorage.getItem('showActivityFeed') !== 'false',
    mapView: localStorage.getItem('mapView') || 'roadmap',

    // Advanced
    keyboardShortcuts: localStorage.getItem('keyboardShortcuts') !== 'false',
    betaFeatures: localStorage.getItem('betaFeatures') === 'true',
    developerMode: localStorage.getItem('developerMode') === 'true',
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Update setting and persist to localStorage
  const updateSetting = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));

    // Persist to localStorage
    localStorage.setItem(key, value.toString());

    // Apply theme immediately if changed
    if (key === 'theme') {
      document.documentElement.setAttribute('data-theme', value);
    }

    // Apply font size immediately if changed
    if (key === 'fontSize') {
      document.documentElement.setAttribute('data-font-size', value);
    }

    console.log(`⚙️ Setting updated: ${key} = ${value}`);
  };

  // Reset all settings to default
  const resetAllSettings = () => {
    if (window.confirm('Are you sure you want to reset all settings to default? This cannot be undone.')) {
      const defaults = {
        theme: 'dark',
        fontSize: 'medium',
        viewDensity: 'comfortable',
        defaultDashboard: 'breakdown-guide',
        autoRefreshInterval: 60,
        showActivityFeed: true,
        mapView: 'roadmap',
        keyboardShortcuts: true,
        betaFeatures: false,
        developerMode: false,
      };

      // Update state
      setSettings(defaults);

      // Clear localStorage and set defaults
      Object.keys(defaults).forEach(key => {
        localStorage.setItem(key, defaults[key].toString());
      });

      // Apply theme
      document.documentElement.setAttribute('data-theme', defaults.theme);
      document.documentElement.setAttribute('data-font-size', defaults.fontSize);

      alert('✅ All settings have been reset to default');
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile & Account', icon: '👤' },
    { id: 'appearance', label: 'Appearance', icon: '🎨' },
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'data', label: 'Data & Storage', icon: '💾' },
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
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
