/**
 * Go BARRY Breakdown Management System
 * Homepage - Mini Command Centre
 *
 * A condensed version of the Operations command centre (map + urgent
 * breakdowns + activity feed) plus the supervisor's shift status, fleet
 * lookup and quick access to reporting a breakdown.
 *
 * Copyright © 2025 Anthony Gair. All Rights Reserved.
 */

import { isDemoSession } from '../config/demoDepots';
import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle, OctagonAlert, Gauge, Timer, ShieldCheck, ShieldAlert, ShieldQuestion,
  MapPin, ArrowRight, ChevronDown, X, Radio
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import LiveActivityFeed from './LiveActivityFeed.jsx';
import WeatherWidget from './WeatherWidget.jsx';
import QuickFleetSearch from './QuickFleetSearch.jsx';
import DutyCard from './DutyCard.jsx';
import DutyHandoverModal from './DutyHandoverModal.jsx';
import DutyExtensionModal from './DutyExtensionModal.jsx';
import { DutyBadge as DutyBadgeIcon } from './icons/DutyBadgeIcons';
import BreakdownMap from '../dashboards/sdc/BreakdownMap.jsx';
import BreakdownRow from '../dashboards/sdc/components/BreakdownRow.jsx';
import { getSeverityRank, getDecisionInfo, getFleetNumber } from '../dashboards/sdc/utils/breakdownRowHelpers.js';
import { fetchDashboardData, fetchFleetAvailability, fetchCoverageSummary } from '../utils/fetchDashboardData.js';
import './HomePage.css';

// Same "currently open" statuses fetchDashboardData() uses to compute the
// Active stat, so the KPI tile and the map/urgent list always agree.
const ACTIVE_STATUSES = ['active', 'pending', 'in_progress', 'received', 'acknowledged', 'dispatched', 'on_site'];

const COVERAGE_LABELS = {
  normal: { label: 'Covered', className: 'hp-kpi--good' },
  warning: { label: 'Partial cover', className: 'hp-kpi--warn' },
  critical: { label: 'Coverage gap', className: 'hp-kpi--bad' }
};

const HomePage = ({ onStatsChange, currentDuty: propDuty }) => {
  const navigate = useNavigate();
  const { isAuthenticated, currentUser, isSessionChecking } = useAuth();
  const isLoading = false;
  const [localDuty, setLocalDuty] = useState(null);
  const currentDuty = propDuty || localDuty;
  const [showHandoverModal, setShowHandoverModal] = useState(false);
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [showDutyPanel, setShowDutyPanel] = useState(false);
  const dutyPanelRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dashboardData, setDashboardData] = useState({
    stats: { activeBreakdowns: 0, todayTotal: 0, avgResponseTime: 0, fleetHealth: 100 },
    activityFeed: [],
    breakdowns: [],
    metadata: null
  });
  const [shiftStats, setShiftStats] = useState({
    breakdownsHandled: 0,
    assessments: 0,
    avgResponse: null,
    resolutionRate: 100,
    performance: 'good'
  });
  const [fleetAvailability, setFleetAvailability] = useState(null);
  const [coverage, setCoverage] = useState(null);

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

  // Close the duty popover on outside click / Escape
  useEffect(() => {
    if (!showDutyPanel) return;
    const handleClick = (e) => {
      if (dutyPanelRef.current && !dutyPanelRef.current.contains(e.target)) {
        setShowDutyPanel(false);
      }
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') setShowDutyPanel(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [showDutyPanel]);

  const loadDashboardData = useCallback(async () => {
    try {
      const data = await fetchDashboardData();
      const safeData = {
        stats: data.stats || { activeBreakdowns: 0, todayTotal: 0, avgResponseTime: 0, fleetHealth: 100 },
        activityFeed: data.activityFeed || [],
        breakdowns: data.breakdowns || [],
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
        breakdowns: [],
        metadata: { error: error.message }
      });
    }
  }, [onStatsChange]);

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData();
      const interval = setInterval(loadDashboardData, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, loadDashboardData]);

  // Real fleet availability + coverage status (replaces the old fake
  // "100 - activeBreakdowns * 2" fleet heuristic).
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    const loadKpis = async () => {
      const [avail, cov] = await Promise.all([fetchFleetAvailability(), fetchCoverageSummary()]);
      if (!cancelled) {
        setFleetAvailability(avail);
        setCoverage(cov);
      }
    };
    loadKpis();
    const interval = setInterval(loadKpis, 60000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isAuthenticated]);

  const handleStartHandover = () => setShowHandoverModal(true);
  const handleExtendShift = () => setShowExtensionModal(true);
  const handleExtensionRequested = (result) => console.log('Extension requested:', result);

  const handleHandoverComplete = () => {
    setLocalDuty(null);
    sessionStorage.removeItem('currentDuty');
    setShowDutyPanel(false);
    loadDashboardData();
  };

  const fetchShiftStats = useCallback(async (duty) => {
    if (!duty || !duty.startTime || !duty.endTime) return;
    try {
      // DutySelectionModal only ever persists `shiftEnd` on currentDuty -
      // `shiftStart` is never set, so this request used to require a field
      // that doesn't exist and silently no-op forever (the duty card always
      // showed 0 handled, even when Operations' "My Breakdowns" showed
      // plenty). Derive both ends of the window from startTime/endTime the
      // same way DutyCard derives its progress bar, so the numbers here
      // describe exactly the shift window shown next to them.
      const now = new Date();
      const [startHour, startMin] = duty.startTime.split(':').map(Number);
      const [endHour, endMin] = duty.endTime.split(':').map(Number);
      const shiftStartDate = new Date();
      shiftStartDate.setHours(startHour, startMin, 0, 0);
      const shiftEndDate = new Date();
      shiftEndDate.setHours(endHour, endMin, 0, 0);
      if (shiftEndDate < shiftStartDate) {
        if (now < shiftEndDate) {
          shiftStartDate.setDate(shiftStartDate.getDate() - 1);
        } else {
          shiftEndDate.setDate(shiftEndDate.getDate() + 1);
        }
      }

      const params = new URLSearchParams({
        shift_start: shiftStartDate.toISOString(),
        shift_end: shiftEndDate.toISOString()
      });
      if (duty.code) params.append('duty_code', duty.code);
      if (currentUser?.badge_number) params.append('supervisor_badge', currentUser.badge_number);

      const API_URL = import.meta.env.VITE_API_URL || 'https://api.breakdowns.gobarry.co.uk';
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
          resolutionRate: data.stats.resolutionRate ?? 100,
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

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Short "Duty 200 - 4h35m left" label for the header chip.
  const dutyChipLabel = useMemo(() => {
    if (!currentDuty || currentDuty.viewOnly) return null;
    if (!currentDuty.startTime || !currentDuty.endTime) return `Duty ${currentDuty.code || ''}`;
    const [startHour, startMin] = currentDuty.startTime.split(':').map(Number);
    const [endHour, endMin] = currentDuty.endTime.split(':').map(Number);
    const start = new Date(currentTime);
    start.setHours(startHour, startMin, 0, 0);
    const end = new Date(currentTime);
    end.setHours(endHour, endMin, 0, 0);
    if (end < start) {
      if (currentTime < end) start.setDate(start.getDate() - 1);
      else end.setDate(end.getDate() + 1);
    }
    const remainingMs = end - currentTime;
    const remainingMin = Math.abs(Math.floor(remainingMs / 60000));
    const h = Math.floor(remainingMin / 60);
    const m = remainingMin % 60;
    const duration = h > 0 ? `${h}h${m}m` : `${m}m`;
    return remainingMs <= 0
      ? `Duty ${currentDuty.code} · ${duration} overtime`
      : `Duty ${currentDuty.code} · ${duration} left`;
  }, [currentDuty, currentTime]);

  // ---- Active breakdowns (shared by the map + urgent list + STOP KPI) ----
  // Kept above the loading/auth early-returns below so hook order stays
  // stable across renders (rules of hooks).
  const activeBreakdowns = useMemo(() => {
    const now = Date.now();
    return (dashboardData.breakdowns || [])
      .filter(b => ACTIVE_STATUSES.includes(b.status))
      .map(b => ({
        ...b,
        elapsed: b.created_at ? Math.floor((now - new Date(b.created_at).getTime()) / 60000) : 0
      }));
  }, [dashboardData.breakdowns]);

  const urgentBreakdowns = useMemo(() => {
    return [...activeBreakdowns]
      .sort((a, b) => {
        const rankDiff = getSeverityRank(b) - getSeverityRank(a);
        if (rankDiff !== 0) return rankDiff;
        return (b.elapsed || 0) - (a.elapsed || 0);
      })
      .slice(0, 6);
  }, [activeBreakdowns]);

  const stopCount = useMemo(
    () => activeBreakdowns.filter(b => getDecisionInfo(b).key === 'stop').length,
    [activeBreakdowns]
  );

  if (isSessionChecking || isLoading) {
    return (
      <div className="hp-loading">
        <div className="hp-spinner"></div>
        <p>Loading Dashboard...</p>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  // Real engineering accounts don't report breakdowns; the public demo always
  // shows it (reporting is the core workflow a prospect needs to see)
  const canReportBreakdown = isDemoSession() ||
    (currentUser?.role !== 'engineering' && currentUser?.role !== 'engineering_manager');

  const goToOperations = (fleetNo) => {
    if (fleetNo && fleetNo !== 'Unknown') {
      navigate(`/dashboards/sdc?fleet=${encodeURIComponent(fleetNo)}`);
    } else {
      navigate('/dashboards/sdc');
    }
  };

  const goToBreakdownById = (breakdownId) => {
    const target = activeBreakdowns.find(b => b.breakdown_id === breakdownId);
    goToOperations(target ? getFleetNumber(target) : null);
  };

  const coverageInfo = coverage ? (COVERAGE_LABELS[coverage.alertLevel] || COVERAGE_LABELS.normal) : null;

  return (
    <div className="hp-container">
      {/* Header */}
      <header className="hp-header">
        <div className="hp-header-greeting">
          <span className="hp-greeting-text">{getGreeting()}, {currentUser?.name?.split(' ')[0] || 'Supervisor'}</span>
          <span className="hp-header-clock">{formatTime(currentTime)}</span>
        </div>

        <div className="hp-header-duty" ref={dutyPanelRef}>
          <button
            type="button"
            className={`hp-duty-chip ${!currentDuty || currentDuty.viewOnly ? 'hp-duty-chip--empty' : ''}`}
            onClick={() => setShowDutyPanel(v => !v)}
            aria-expanded={showDutyPanel}
          >
            {currentDuty && !currentDuty.viewOnly ? (
              <DutyBadgeIcon dutyCode={currentDuty.code} size={22} />
            ) : (
              <ShieldQuestion size={18} />
            )}
            <span className="hp-duty-chip-label">{dutyChipLabel || 'No active duty'}</span>
            <ChevronDown size={14} className={`hp-duty-chip-caret ${showDutyPanel ? 'hp-duty-chip-caret--open' : ''}`} />
          </button>

          {showDutyPanel && (
            <div className="hp-duty-popover" role="dialog" aria-label="Your shift">
              <div className="hp-duty-popover-header">
                <span>Your shift</span>
                <button type="button" className="hp-duty-popover-close" onClick={() => setShowDutyPanel(false)} aria-label="Close">
                  <X size={16} />
                </button>
              </div>
              <div className="hp-duty-popover-body">
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
            </div>
          )}
        </div>

        <div className="hp-header-weather">
          <WeatherWidget compact />
        </div>

        <div className="hp-header-search">
          <QuickFleetSearch />
        </div>

        {canReportBreakdown && (
          <button
            className={`hp-report-btn ${dashboardData.stats.activeBreakdowns > 0 ? 'hp-report-btn--alert' : ''}`}
            onClick={() => navigate('/breakdown-guide')}
          >
            <AlertTriangle size={17} />
            <span>Report Breakdown</span>
          </button>
        )}
      </header>

      {/* KPI strip */}
      <section className="hp-kpis">
        <button type="button" className={`hp-kpi ${dashboardData.stats.activeBreakdowns > 0 ? 'hp-kpi--alert' : ''}`} onClick={() => navigate('/dashboards/sdc')}>
          <Gauge size={18} className="hp-kpi-icon" />
          <span className="hp-kpi-value">{dashboardData.stats.activeBreakdowns}</span>
          <span className="hp-kpi-label">Active</span>
        </button>

        <button type="button" className={`hp-kpi ${stopCount > 0 ? 'hp-kpi--bad' : ''}`} onClick={() => navigate('/dashboards/sdc')}>
          <OctagonAlert size={18} className="hp-kpi-icon" />
          <span className="hp-kpi-value">{stopCount}</span>
          <span className="hp-kpi-label">STOP</span>
        </button>

        <div className="hp-kpi hp-kpi--static">
          <Timer size={18} className="hp-kpi-icon" />
          <span className="hp-kpi-value">{dashboardData.stats.avgResponseTime}<small>m</small></span>
          <span className="hp-kpi-label">Avg response</span>
        </div>

        <button type="button" className="hp-kpi" onClick={() => navigate('/fleet-intelligence')}>
          <ShieldCheck size={18} className="hp-kpi-icon" />
          <span className="hp-kpi-value">
            {fleetAvailability != null ? <>{fleetAvailability}<small>%</small></> : <span className="hp-kpi-value--empty">&mdash;</span>}
          </span>
          <span className="hp-kpi-label">Fleet availability</span>
        </button>

        <button type="button" className={`hp-kpi ${coverageInfo ? coverageInfo.className : ''}`} onClick={() => navigate('/dashboards/sdc')}>
          <ShieldAlert size={18} className="hp-kpi-icon" />
          <span className="hp-kpi-value hp-kpi-value--text">{coverageInfo ? coverageInfo.label : '—'}</span>
          <span className="hp-kpi-label">Coverage</span>
        </button>
      </section>

      {/* Main grid */}
      <main className="hp-grid">
        <div className="hp-col-left">
          <div className="hp-card hp-map-card">
            <div className="hp-card-header">
              <MapPin size={14} />
              <h3 className="hp-card-title">Live map</h3>
              <span className="hp-card-count">{activeBreakdowns.length}</span>
            </div>
            <div className="hp-map-canvas">
              <BreakdownMap
                breakdowns={activeBreakdowns}
                highlightedId={null}
                onMarkerClick={goToBreakdownById}
                hideToggles
              />
            </div>
          </div>

          <div className="hp-card hp-activity-card">
            <div className="hp-card-header">
              <span className="hp-live-dot"></span>
              <h3 className="hp-card-title">Activity</h3>
              <span className="hp-badge hp-badge--live"><Radio size={10} /> LIVE</span>
            </div>
            <div className="hp-activity-body">
              {dashboardData.metadata?.error ? (
                <div className="hp-feed-error">
                  <p>Unable to load feed</p>
                  <button onClick={loadDashboardData} className="hp-retry-btn">Retry</button>
                </div>
              ) : (
                <LiveActivityFeed activities={dashboardData.activityFeed || []} embedded={true} />
              )}
            </div>
          </div>
        </div>

        <aside className="hp-col-right">
          <div className="hp-card hp-urgent-card">
            <div className="hp-card-header">
              <AlertTriangle size={14} />
              <h3 className="hp-card-title">Most urgent</h3>
              <span className="hp-card-count">
                {urgentBreakdowns.length}{activeBreakdowns.length > urgentBreakdowns.length ? ` of ${activeBreakdowns.length}` : ''}
              </span>
            </div>

            <div className="hp-urgent-list">
              {urgentBreakdowns.length === 0 ? (
                <div className="hp-urgent-empty">
                  <ShieldCheck size={28} strokeWidth={1.5} />
                  <p>No active breakdowns</p>
                  <span>Everything is running normally.</span>
                </div>
              ) : (
                urgentBreakdowns.map(breakdown => (
                  <BreakdownRow
                    key={breakdown.breakdown_id}
                    breakdown={breakdown}
                    isSelected={false}
                    onSelect={goToBreakdownById}
                  />
                ))
              )}
            </div>

            <button type="button" className="hp-urgent-viewall" onClick={() => navigate('/dashboards/sdc')}>
              View all in Operations <ArrowRight size={14} />
            </button>
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
