/**
 * Go BARRY Breakdown Management System
 * Homepage - Command Dashboard
 *
 * Copyright © 2025 Anthony Gair. All Rights Reserved.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import LiveActivityFeed from './LiveActivityFeed.jsx';
import WeatherWidget from './WeatherWidget.jsx';
import QuickFleetSearch from './QuickFleetSearch.jsx';
import DutyCard from './DutyCard.jsx';
import DutyHandoverModal from './DutyHandoverModal.jsx';
import DutyExtensionModal from './DutyExtensionModal.jsx';
import { fetchDashboardData } from '../utils/fetchDashboardData.js';
import './HomePage.css';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.breakdowns.gobarry.co.uk';

const HomePage = ({ onStatsChange, currentDuty: propDuty }) => {
  const navigate = useNavigate();
  const { isAuthenticated, currentUser, isSessionChecking } = useAuth();
  const isLoading = false;
  const [localDuty, setLocalDuty] = useState(null);
  const currentDuty = propDuty || localDuty;
  const [showHandoverModal, setShowHandoverModal] = useState(false);
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dashboardData, setDashboardData] = useState({
    stats: {
      activeBreakdowns: 0,
      todayTotal: 0,
      avgResponseTime: 0,
      fleetHealth: 100
    },
    activityFeed: [],
    metadata: null
  });
  const [shiftStats, setShiftStats] = useState({
    breakdownsHandled: 0,
    assessments: 0,
    avgResponse: null,
    resolutionRate: 100,
    performance: 'good'
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isSessionChecking && !isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, isSessionChecking, navigate]);

  useEffect(() => {
    const loadDuty = () => {
      const savedDuty = sessionStorage.getItem('currentDuty');
      if (savedDuty) {
        try {
          const dutyData = JSON.parse(savedDuty);
          if (dutyData.shiftEnd) {
            const shiftEndTime = new Date(dutyData.shiftEnd);
            if (new Date() < shiftEndTime) {
              setLocalDuty(dutyData);
            } else {
              setLocalDuty(null);
              sessionStorage.removeItem('currentDuty');
            }
          } else {
            setLocalDuty(dutyData);
          }
        } catch (error) {
          console.error('Error parsing duty data:', error);
        }
      } else {
        setLocalDuty(null);
      }
    };

    loadDuty();
    window.addEventListener('storage', loadDuty);
    const dutyTimer = setInterval(loadDuty, 60000);
    return () => {
      window.removeEventListener('storage', loadDuty);
      clearInterval(dutyTimer);
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData();
      const interval = setInterval(loadDashboardData, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const loadDashboardData = async () => {
    try {
      const data = await fetchDashboardData();
      const safeData = {
        stats: data.stats || {
          activeBreakdowns: 0,
          todayTotal: 0,
          avgResponseTime: 0,
          fleetHealth: 100
        },
        activityFeed: data.activityFeed || [],
        metadata: data.metadata || null
      };
      setDashboardData(safeData);
      if (onStatsChange && safeData.stats) {
        onStatsChange(safeData.stats.activeBreakdowns);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setDashboardData({
        stats: { activeBreakdowns: 0, todayTotal: 0, avgResponseTime: 0, fleetHealth: 100 },
        activityFeed: [],
        metadata: { error: error.message }
      });
    }
  };

  const handleStartHandover = () => setShowHandoverModal(true);
  const handleExtendShift = () => setShowExtensionModal(true);
  const handleExtensionRequested = (result) => console.log('Extension requested:', result);

  const handleHandoverComplete = (result) => {
    setLocalDuty(null);
    sessionStorage.removeItem('currentDuty');
    loadDashboardData();
  };

  const fetchShiftStats = useCallback(async (duty) => {
    if (!duty || !duty.shiftStart || !duty.shiftEnd) return;
    try {
      const params = new URLSearchParams({
        shift_start: duty.shiftStart,
        shift_end: duty.shiftEnd
      });
      if (duty.code) params.append('duty_code', duty.code);
      if (currentUser?.badge_number) params.append('supervisor_badge', currentUser.badge_number);

      const response = await fetch(`${API_URL}/api/analytics/shift-stats?${params}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (data.success && data.stats) {
        setShiftStats({
          breakdownsHandled: data.stats.breakdownsHandled || 0,
          assessments: data.stats.assessments || 0,
          avgResponse: data.stats.avgResponse,
          resolutionRate: data.stats.resolutionRate || 100,
          performance: data.stats.performance || 'good',
          bySeverity: data.stats.bySeverity,
          comparison: data.comparison
        });
      }
    } catch (error) {
      console.warn('Could not fetch shift stats:', error.message);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentDuty && isAuthenticated) {
      fetchShiftStats(currentDuty);
      const statsInterval = setInterval(() => fetchShiftStats(currentDuty), 60000);
      return () => clearInterval(statsInterval);
    }
  }, [currentDuty, isAuthenticated, fetchShiftStats]);

  const formatTime = (date) => date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const formatDate = (date) => date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (isSessionChecking || isLoading) {
    return (
      <div className="hp-loading">
        <div className="hp-spinner"></div>
        <p>Loading Dashboard...</p>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const hasActiveBreakdowns = dashboardData.stats.activeBreakdowns > 0;

  return (
    <div className="hp-container">
      {/* Top Bar */}
      <header className="hp-topbar">
        <div className="hp-welcome">
          <p className="hp-greeting">{getGreeting()}</p>
          <h1 className="hp-username">{currentUser?.name || 'Supervisor'}</h1>
        </div>

        <div className="hp-clock">
          <span className="hp-time">{formatTime(currentTime)}</span>
          <span className="hp-date">{formatDate(currentTime)}</span>
        </div>

        {currentUser?.role !== 'engineering' && currentUser?.role !== 'engineering_manager' && (
          <button
            className={`hp-emergency-btn ${hasActiveBreakdowns ? 'hp-emergency-btn--active' : ''}`}
            onClick={() => navigate('/breakdown-guide')}
          >
            <span className="hp-emergency-icon">⚠</span>
            <span>Report Breakdown</span>
          </button>
        )}
      </header>

      {/* Stats Row */}
      <section className="hp-stats">
        <div className={`hp-stat hp-stat--critical ${hasActiveBreakdowns ? 'hp-stat--alert' : ''}`}>
          <span className="hp-stat-value">{dashboardData.stats.activeBreakdowns}</span>
          <span className="hp-stat-label">Active</span>
        </div>
        <div className="hp-stat">
          <span className="hp-stat-value">{dashboardData.stats.todayTotal}</span>
          <span className="hp-stat-label">Today</span>
        </div>
        <div className="hp-stat">
          <span className="hp-stat-value">{dashboardData.stats.avgResponseTime}<small>m</small></span>
          <span className="hp-stat-label">Response</span>
        </div>
        <div className="hp-stat hp-stat--positive">
          <span className="hp-stat-value">{dashboardData.stats.fleetHealth}<small>%</small></span>
          <span className="hp-stat-label">Fleet OK</span>
        </div>
      </section>

      {/* Main Grid */}
      <main className="hp-grid">
        {/* Left Column */}
        <aside className="hp-sidebar">
          <div className="hp-card">
            <DutyCard
              currentDuty={currentDuty}
              onStartHandover={handleStartHandover}
              onExtendShift={handleExtendShift}
              shiftStats={shiftStats}
              supervisorInfo={{
                id: currentUser?.id,
                badge_number: currentUser?.badge_number,
                name: currentUser?.name
              }}
            />
          </div>

          <div className="hp-card">
            <WeatherWidget />
          </div>
        </aside>

        {/* Center - Actions */}
        <section className="hp-main">
          {/* Fleet Lookup - prominent position */}
          <div className="hp-card hp-search-card">
            <div className="hp-card-header">
              <span className="hp-card-icon">●</span>
              <h3 className="hp-card-title">Fleet Lookup</h3>
            </div>
            <div className="hp-card-body">
              <QuickFleetSearch />
            </div>
          </div>

          <div className="hp-card hp-actions-card">
            <div className="hp-card-header">
              <div className="hp-header-bar"></div>
              <h2 className="hp-card-title">Command Console</h2>
              <span className="hp-badge">OPS</span>
            </div>

            <nav className="hp-actions">
              <button className="hp-action hp-action--primary" onClick={() => navigate('/dashboards/sdc')}>
                <div className="hp-action-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="9"/>
                    <path d="M12 6v6l4 2"/>
                  </svg>
                </div>
                <span className="hp-action-title">Operations</span>
                <span className="hp-action-desc">Service Delivery</span>
              </button>

              <button className="hp-action" onClick={() => navigate('/dashboards/engineering')}>
                <div className="hp-action-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                  </svg>
                </div>
                <span className="hp-action-title">Engineering</span>
                <span className="hp-action-desc">Dispatch</span>
              </button>

              <button className="hp-action" onClick={() => navigate('/dashboards/control-room')}>
                <div className="hp-action-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="3" width="20" height="14" rx="2"/>
                    <path d="M8 21h8M12 17v4"/>
                  </svg>
                </div>
                <span className="hp-action-title">Display</span>
                <span className="hp-action-desc">Display</span>
              </button>

              <button className="hp-action" onClick={() => navigate('/fleet-intelligence')}>
                <div className="hp-action-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 3v18h18"/>
                    <path d="M18 9l-5 5-4-4-3 3"/>
                  </svg>
                </div>
                <span className="hp-action-title">Fleet Intel</span>
                <span className="hp-action-desc">Analytics</span>
              </button>

              <button className="hp-action" onClick={() => navigate('/dashboards/gtfs/routes')}>
                <div className="hp-action-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                    <circle cx="12" cy="9" r="2.5"/>
                  </svg>
                </div>
                <span className="hp-action-title">Route Status</span>
                <span className="hp-action-desc">Live impact</span>
              </button>

              <button className="hp-action" onClick={() => navigate('/dashboards/fleet-defects')}>
                <div className="hp-action-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                </div>
                <span className="hp-action-title">Fleet Defects</span>
                <span className="hp-action-desc">Patterns</span>
              </button>

              <button className="hp-action" onClick={() => navigate('/dashboards/management')}>
                <div className="hp-action-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 20V10"/>
                    <path d="M12 20V4"/>
                    <path d="M6 20v-6"/>
                  </svg>
                </div>
                <span className="hp-action-title">Management</span>
                <span className="hp-action-desc">KPIs & Trends</span>
              </button>

              <button className="hp-action hp-action--muted" onClick={() => navigate('/settings')}>
                <div className="hp-action-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                  </svg>
                </div>
                <span className="hp-action-title">Settings</span>
                <span className="hp-action-desc">Preferences</span>
              </button>
            </nav>
          </div>
        </section>

        {/* Right - Activity */}
        <aside className="hp-feed">
          <div className="hp-card hp-feed-card">
            <div className="hp-card-header">
              <span className="hp-live-dot"></span>
              <h3 className="hp-card-title">Activity</h3>
              <span className="hp-badge hp-badge--live">LIVE</span>
            </div>
            <div className="hp-feed-content">
              {dashboardData.metadata?.error ? (
                <div className="hp-feed-error">
                  <p>Unable to load feed</p>
                  <button onClick={loadDashboardData} className="hp-retry-btn">Retry</button>
                </div>
              ) : (
                <LiveActivityFeed
                  activities={dashboardData.activityFeed || []}
                  embedded={true}
                />
              )}
            </div>
          </div>
        </aside>
      </main>

      {/* Modals */}
      <DutyHandoverModal
        isOpen={showHandoverModal}
        onClose={() => setShowHandoverModal(false)}
        currentDuty={currentDuty}
        onHandoverComplete={handleHandoverComplete}
      />

      <DutyExtensionModal
        isOpen={showExtensionModal}
        onClose={() => setShowExtensionModal(false)}
        currentDuty={currentDuty}
        supervisorInfo={{
          id: currentUser?.id,
          badge_number: currentUser?.badge_number,
          name: currentUser?.name
        }}
        onExtensionRequested={handleExtensionRequested}
      />
    </div>
  );
};

export default HomePage;
