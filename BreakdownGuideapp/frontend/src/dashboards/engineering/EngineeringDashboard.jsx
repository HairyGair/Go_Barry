import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Wrench, ClipboardList, Truck, CheckCircle2, Users, Gauge,
  UserPlus, Settings, Phone, Monitor, X
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import DepotContactsPanel from './DepotContactsPanel';
import ShiftCheckInModal from './ShiftCheckInModal';
import EngineerRoster from './board/EngineerRoster';
import JobBoard from './board/JobBoard';
import JobDetailPanel from './board/JobDetailPanel';
import { isActiveJob, deriveStage, deriveEngineerLiveStatus } from './board/dispatchBoardHelpers';
import { apiClient } from '../../services/api-client';
import { useWebSocket } from '../../services/websocket.js';

const REFRESH_INTERVAL = 10000; // 10 seconds
const SHIFT_CHECKIN_SEEN_KEY = 'eng_shift_checkin_seen'; // once per browser session

const EngineeringDashboard = () => {
  const [allJobs, setAllJobs] = useState([]);
  const [engineeringMetrics, setEngineeringMetrics] = useState({});
  const [onShiftEngineers, setOnShiftEngineers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const [selectedJobId, setSelectedJobId] = useState(null);
  const [selectedEngineerBadge, setSelectedEngineerBadge] = useState(null);
  const autoSelectedRef = useRef(false);

  const [showShiftCheckIn, setShowShiftCheckIn] = useState(false);
  const autoCheckInEvaluatedRef = useRef(false);
  const [showDepotContacts, setShowDepotContacts] = useState(false);
  const [rosterOpenMobile, setRosterOpenMobile] = useState(false);

  // WebSocket — shared hook handles connection, reconnection, and cleanup.
  const { lastMessage, isConnected: wsConnected, sendMessage } = useWebSocket('/ws?channel=engineering');

  useEffect(() => {
    if (wsConnected) {
      sendMessage({ type: 'subscribe', channel: 'engineering' });
    }
  }, [wsConnected, sendMessage]);

  useEffect(() => {
    if (!lastMessage) return;
    // Any engineering event is a signal to refresh - the board recomputes
    // stages/columns from the refreshed jobs list rather than patching state
    // in place, so a single refresh handles every message type.
    showNotification(describeWsMessage(lastMessage));
    fetchAllData();
  }, [lastMessage]); // eslint-disable-line react-hooks/exhaustive-deps

  const showNotification = (message) => {
    if (!message) return;
    setNotification(message);
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchJobs = async () => {
    try {
      const data = await apiClient.get('/api/engineering/jobs?filter=all');
      if (data.success && Array.isArray(data.jobs)) {
        setAllJobs(data.jobs);
        setError(null);
      } else {
        setAllJobs([]);
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError('Failed to fetch jobs data');
    }
  };

  const fetchMetrics = async () => {
    try {
      const data = await apiClient.get('/api/engineering/metrics');
      if (data.success) setEngineeringMetrics(data.metrics || {});
    } catch (err) {
      console.error('Error fetching metrics:', err);
    }
  };

  const fetchOnShift = async () => {
    try {
      const res = await apiClient.get('/api/engineer-management/on-shift');
      if (res.success) setOnShiftEngineers(res.engineers || []);
    } catch (err) {
      // Silently fail - on-shift data is supplementary
    }
  };

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchJobs(), fetchMetrics(), fetchOnShift()]);
    setLastUpdate(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchAllData]);

  // ── Bug fix: only auto-open "Who's on shift today?" when nobody is
  // checked in, and never more than once per browser session (previously it
  // popped up on every visit regardless of the demo seed already having
  // checked engineers in). The manual "Shift check-in" header button always
  // remains available. ──
  useEffect(() => {
    if (loading || autoCheckInEvaluatedRef.current) return;
    autoCheckInEvaluatedRef.current = true;
    const alreadySeen = sessionStorage.getItem(SHIFT_CHECKIN_SEEN_KEY);
    if (!alreadySeen && onShiftEngineers.length === 0) {
      setShowShiftCheckIn(true);
    }
    sessionStorage.setItem(SHIFT_CHECKIN_SEEN_KEY, '1');
  }, [loading, onShiftEngineers]);

  // ── "Total active" uses the same definition Operations uses (status not
  // resolved/cleared) - see dispatchBoardHelpers.isActiveJob for why this
  // has to be re-applied client-side rather than trusting the jobs count. ──
  const activeJobs = useMemo(() => allJobs.filter(isActiveJob), [allJobs]);

  const stats = useMemo(() => {
    const awaiting = activeJobs.filter(j => deriveStage(j) === 'awaiting').length;
    const enRoute = activeJobs.filter(j => deriveStage(j) === 'en_route').length;
    const onSite = activeJobs.filter(j => deriveStage(j) === 'on_site').length;
    const doneToday = allJobs.filter(j => deriveStage(j) === 'done').length;
    // Derived client-side from the jobs list (not the server's per-engineer
    // is_available flag, which relies on an engineer_badge match that the
    // demo seed doesn't populate - see dispatchBoardHelpers for the same
    // badge+name matching used everywhere else on this board).
    const liveStatuses = onShiftEngineers.map(e => deriveEngineerLiveStatus(e, allJobs).status);
    const available = liveStatuses.filter(st => st === 'available').length;
    // Rostered today but not started yet / already finished don't count as on shift
    const workingNow = liveStatuses.filter(st => st !== 'upcoming' && st !== 'off_shift').length;
    return {
      total: activeJobs.length,
      awaiting,
      enRoute,
      onSite,
      doneToday,
      engineersAvailable: available,
      engineersOnShift: workingNow,
      slaCompliance: engineeringMetrics.slaCompliance ?? null,
      avgResponseTime: engineeringMetrics.avgResponseTime ?? null
    };
  }, [activeJobs, allJobs, onShiftEngineers, engineeringMetrics]);

  // Auto-select the most urgent awaiting job once data first loads.
  useEffect(() => {
    if (loading || autoSelectedRef.current || activeJobs.length === 0) return;
    const awaiting = activeJobs.filter(j => deriveStage(j) === 'awaiting');
    const pick = awaiting[0] || activeJobs[0];
    setSelectedJobId(pick.breakdown_id);
    autoSelectedRef.current = true;
  }, [loading, activeJobs]);

  const selectedJob = useMemo(() => {
    if (!selectedJobId) return null;
    return allJobs.find(j => j.breakdown_id === selectedJobId) || null;
  }, [allJobs, selectedJobId]);

  const handleSelectJob = useCallback((job) => {
    setSelectedJobId(job.breakdown_id);
    setSelectedEngineerBadge(job.engineer_badge || null);
    setRosterOpenMobile(false);
  }, []);

  const handleSelectEngineer = useCallback((engineer, job) => {
    setSelectedEngineerBadge(engineer.badge_number);
    if (job) setSelectedJobId(job.breakdown_id);
    setRosterOpenMobile(false);
  }, []);

  return (
    <DashboardLayout title="Engineering Dispatch" icon="🔧">
      <div className="edb-dashboard">

        {/* ── Header strip ── */}
        <div className="edb-header">
          <div className="edb-header-left">
            <div className="edb-header-icon"><Wrench size={20} /></div>
            <div className="edb-header-text">
              <h2>Engineering Dispatch</h2>
              <p>Awaiting, en route, on site and today's completions - at a glance</p>
            </div>
          </div>

          <div className="edb-kpis" role="list" aria-label="Engineering summary">
            <div className="edb-kpi" role="listitem">
              <ClipboardList size={13} aria-hidden="true" />
              <span className="edb-kpi-val">{stats.awaiting}</span>
              <span className="edb-kpi-lbl">Awaiting</span>
            </div>
            <div className="edb-kpi" role="listitem">
              <Truck size={13} aria-hidden="true" />
              <span className="edb-kpi-val">{stats.enRoute}</span>
              <span className="edb-kpi-lbl">En Route</span>
            </div>
            <div className="edb-kpi" role="listitem">
              <Wrench size={13} aria-hidden="true" />
              <span className="edb-kpi-val">{stats.onSite}</span>
              <span className="edb-kpi-lbl">On Site</span>
            </div>
            <div className="edb-kpi" role="listitem">
              <CheckCircle2 size={13} aria-hidden="true" />
              <span className="edb-kpi-val">{stats.doneToday}</span>
              <span className="edb-kpi-lbl">Done Today</span>
            </div>
            <div className="edb-kpi" role="listitem">
              <Users size={13} aria-hidden="true" />
              <span className="edb-kpi-val">{stats.engineersAvailable}/{stats.engineersOnShift}</span>
              <span className="edb-kpi-lbl">Engineers</span>
            </div>
            {stats.slaCompliance !== null && (
              <div className="edb-kpi" role="listitem">
                <Gauge size={13} aria-hidden="true" />
                <span className="edb-kpi-val">{stats.slaCompliance}%</span>
                <span className="edb-kpi-lbl">SLA</span>
              </div>
            )}
          </div>

          <div className="edb-header-right">
            <span className={`edb-ws-badge ${wsConnected ? 'connected' : 'disconnected'}`}>
              <span className="edb-ws-dot" />
              {wsConnected ? 'Live' : 'Offline'}
            </span>
            <button type="button" className="edb-roster-toggle" onClick={() => setRosterOpenMobile(v => !v)}>
              <Users size={14} /> Engineers
            </button>
          </div>
        </div>

        {/* ── Link row ── */}
        <div className="edb-links">
          <button type="button" className="edb-link-btn" onClick={() => setShowShiftCheckIn(true)}>
            <UserPlus size={14} /> Shift Check-In
          </button>
          <a href="/dashboards/engineering/manage" className="edb-link-btn">
            <Settings size={14} /> Manage Engineers
          </a>
          <button type="button" className={`edb-link-btn ${showDepotContacts ? 'edb-link-btn-active' : ''}`} onClick={() => setShowDepotContacts(v => !v)}>
            <Phone size={14} /> Depot Contacts
          </button>
          <a href="/dashboards/engineering/display" target="_blank" rel="noopener noreferrer" className="edb-link-btn">
            <Monitor size={14} /> Wall Display
          </a>
        </div>

        {/* ── Command board: roster | job board | detail ── */}
        <div className={`edb-shell ${rosterOpenMobile ? 'edb-shell-roster-open' : ''}`}>
          <EngineerRoster
            engineers={onShiftEngineers}
            jobs={allJobs}
            selectedEngineerBadge={selectedEngineerBadge}
            onSelectEngineer={handleSelectEngineer}
            onClose={() => setRosterOpenMobile(false)}
          />

          {loading && allJobs.length === 0 ? (
            <div className="edb-board-loading">
              <div className="edb-spinner" />
              <p>Fetching live job data...</p>
            </div>
          ) : error ? (
            <div className="edb-board-error">
              <span>{error}</span>
              <button onClick={fetchAllData} className="edb-retry-btn">Retry</button>
            </div>
          ) : (
            <JobBoard jobs={activeJobs} selectedJobId={selectedJobId} onSelectJob={handleSelectJob} />
          )}

          <JobDetailPanel job={selectedJob} engineers={onShiftEngineers} jobs={allJobs} onRefresh={fetchAllData} />
        </div>

        {/* ── Depot contacts drawer ── */}
        {showDepotContacts && (
          <div className="edb-drawer-overlay" onClick={() => setShowDepotContacts(false)}>
            <div className="edb-drawer" onClick={e => e.stopPropagation()}>
              <div className="edb-drawer-head">
                <span>Depot Contacts</span>
                <button type="button" onClick={() => setShowDepotContacts(false)} aria-label="Close depot contacts">
                  <X size={16} />
                </button>
              </div>
              <div className="edb-drawer-body">
                <DepotContactsPanel />
              </div>
            </div>
          </div>
        )}

        {/* ── Shift Check-In Modal ── */}
        {showShiftCheckIn && (
          <ShiftCheckInModal
            onComplete={() => { setShowShiftCheckIn(false); fetchAllData(); }}
            onSkip={() => setShowShiftCheckIn(false)}
          />
        )}

        {/* ── Notification Toast ── */}
        {notification && (
          <div className="edb-notification-toast">{notification}</div>
        )}

        <style>{`
          /* Fixed-viewport command centre: the columns scroll internally
             rather than the page itself (same pattern as Operations). */
          .dashboard-content:has(> .edb-dashboard) {
            min-height: 0 !important;
            padding-bottom: 0 !important;
            display: flex;
            flex-direction: column;
          }

          .edb-dashboard {
            height: calc(100vh - var(--app-top-offset, 84px));
            display: flex;
            flex-direction: column;
            overflow: hidden;
            font-family: var(--font-body, 'Inter'), -apple-system, BlinkMacSystemFont, sans-serif;
            padding: 14px 20px 16px;
            gap: 12px;
          }

          /* ── Header ── */
          .edb-header {
            display: flex;
            align-items: center;
            gap: 20px;
            flex-wrap: wrap;
            background: rgba(15, 23, 42, 0.6);
            padding: 14px 20px;
            border-radius: 16px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
            flex-shrink: 0;
          }

          .edb-header-left {
            display: flex;
            align-items: center;
            gap: 14px;
          }

          .edb-header-icon {
            width: 40px;
            height: 40px;
            background: rgba(0, 188, 212, 0.12);
            border: 1px solid rgba(0, 188, 212, 0.25);
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #22d3ee;
            flex-shrink: 0;
          }

          .edb-header-text h2 {
            margin: 0 0 2px 0;
            color: #f1f5f9;
            font-size: 20px;
            font-weight: 700;
            font-family: var(--font-display, 'Outfit'), sans-serif;
            letter-spacing: -0.01em;
          }

          .edb-header-text p {
            margin: 0;
            color: #94a3b8;
            font-size: 12px;
          }

          .edb-kpis {
            display: flex;
            align-items: center;
            gap: 18px;
            margin-left: auto;
            flex-wrap: wrap;
          }

          .edb-kpi {
            display: flex;
            align-items: center;
            gap: 6px;
            color: #94a3b8;
          }

          .edb-kpi-val {
            font-family: var(--font-mono, 'JetBrains Mono'), monospace;
            font-size: 16px;
            font-weight: 700;
            color: #f1f5f9;
            font-variant-numeric: tabular-nums;
          }

          .edb-kpi-lbl {
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #64748b;
          }

          .edb-header-right {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .edb-ws-badge {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .edb-ws-badge.connected {
            background: rgba(16, 185, 129, 0.15);
            color: #10B981;
            border: 1px solid rgba(16, 185, 129, 0.3);
          }

          .edb-ws-badge.disconnected {
            background: rgba(239, 68, 68, 0.15);
            color: #EF4444;
            border: 1px solid rgba(239, 68, 68, 0.3);
          }

          .edb-ws-dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: currentColor;
          }

          .edb-ws-badge.connected .edb-ws-dot {
            animation: edb-pulse-dot 2s infinite;
          }

          @keyframes edb-pulse-dot {
            0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.5); }
            50% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
          }

          .edb-roster-toggle {
            display: none;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            background: rgba(255,255,255,0.06);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 8px;
            color: #cbd5e1;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
          }

          /* ── Link row ── */
          .edb-links {
            display: flex;
            gap: 8px;
            flex-shrink: 0;
            flex-wrap: wrap;
          }

          .edb-link-btn {
            display: flex;
            align-items: center;
            gap: 7px;
            padding: 7px 14px;
            background: rgba(255,255,255,0.04);
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 8px;
            color: #94a3b8;
            font-family: var(--font-display, 'Outfit'), sans-serif;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.15s;
            text-decoration: none;
          }

          .edb-link-btn:hover {
            background: rgba(0,151,167,0.1);
            border-color: rgba(0,151,167,0.3);
            color: #22d3ee;
          }

          .edb-link-btn-active {
            background: rgba(0,151,167,0.12);
            border-color: rgba(34,211,238,0.4);
            color: #22d3ee;
          }

          /* ── Command board shell ── */
          .edb-shell {
            flex: 1;
            min-height: 0;
            display: grid;
            grid-template-columns: 240px minmax(0, 1fr) 360px;
            gap: 14px;
          }

          .edb-board-loading, .edb-board-error {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 12px;
            background: rgba(15, 23, 42, 0.5);
            border: 1px solid rgba(255,255,255,0.07);
            border-radius: 16px;
            color: #94a3b8;
            padding: 20px;
          }

          .edb-board-error { color: #f87171; }

          .edb-spinner {
            width: 32px;
            height: 32px;
            border: 3px solid #1E293B;
            border-top-color: #0097A7;
            border-radius: 50%;
            animation: edb-spin 0.8s linear infinite;
          }

          @keyframes edb-spin { to { transform: rotate(360deg); } }

          .edb-retry-btn {
            padding: 6px 16px;
            background: rgba(220, 38, 38, 0.15);
            border: 1px solid rgba(220, 38, 38, 0.3);
            border-radius: 6px;
            color: #F87171;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
          }

          /* ── Depot contacts drawer ── */
          .edb-drawer-overlay {
            position: fixed;
            /* Stay clear of the floating logo/user-menu pills, which are
               position:fixed above the app content and would otherwise sit
               on top of (and intercept clicks on) this drawer's own header. */
            top: var(--app-top-offset, 84px);
            left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.6);
            display: flex;
            justify-content: flex-end;
            z-index: 900;
            backdrop-filter: blur(2px);
          }

          .edb-drawer {
            width: min(420px, 100%);
            height: 100%;
            background: #0d1420;
            border-left: 1px solid rgba(255,255,255,0.08);
            display: flex;
            flex-direction: column;
            box-shadow: -12px 0 40px rgba(0,0,0,0.5);
          }

          .edb-drawer-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px 20px;
            border-bottom: 1px solid rgba(255,255,255,0.08);
            color: #f1f5f9;
            font-family: var(--font-display, 'Outfit'), sans-serif;
            font-weight: 700;
          }

          .edb-drawer-head button {
            background: rgba(255,255,255,0.06);
            border: 1px solid rgba(255,255,255,0.08);
            color: #94a3b8;
            width: 30px;
            height: 30px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
          }

          .edb-drawer-body {
            flex: 1;
            overflow-y: auto;
            padding: 16px;
          }

          /* ── Notification toast ── */
          .edb-notification-toast {
            position: fixed;
            bottom: 24px;
            right: 24px;
            background: #141D2B;
            color: #10B981;
            padding: 14px 22px;
            border-radius: 10px;
            border: 1px solid rgba(16, 185, 129, 0.3);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
            z-index: 1000;
            font-size: 14px;
            font-weight: 500;
          }

          /* ── Responsive ── */
          @media (max-width: 1439px) {
            .edb-shell { grid-template-columns: 210px minmax(0, 1fr) 320px; }
          }

          @media (max-width: 1279px) {
            .edb-shell { grid-template-columns: 190px minmax(0, 1fr) 280px; gap: 10px; }
            .edb-kpis { gap: 12px; }
          }

          @media (max-width: 1024px) {
            .edb-roster-toggle { display: flex; }

            .edb-shell {
              grid-template-columns: minmax(0, 1fr) 300px;
            }

            .edb-shell > .erb-roster {
              position: fixed;
              inset: var(--app-top-offset, 84px) 0 0 0;
              z-index: 1300;
              border-radius: 0;
              /* Opaque - this becomes a full-screen panel over the rest of
                 the dashboard, so the default glass/translucent background
                 (meant for a panel sitting alongside others) would otherwise
                 let the board bleed through and make both illegible. */
              background: #0a0f1a;
              box-shadow: 8px 0 32px rgba(0,0,0,0.5);
              transform: translateX(-100%);
              transition: transform 0.2s ease;
            }

            .edb-shell.edb-shell-roster-open > .erb-roster {
              transform: translateX(0);
            }
          }

          @media (max-width: 900px) {
            .edb-dashboard {
              height: auto;
              min-height: calc(100vh - var(--app-top-offset, 84px));
              overflow: visible;
            }

            .dashboard-content:has(> .edb-dashboard) {
              min-height: 100vh !important;
            }

            .edb-shell {
              display: flex;
              flex-direction: column;
              height: auto;
            }

            .jbd-board {
              grid-template-columns: 1fr !important;
              grid-template-rows: none !important;
              height: auto !important;
            }

            .jbd-col { min-height: 240px; }

            .jdp-panel { min-height: 400px; }
          }
        `}</style>
      </div>
    </DashboardLayout>
  );
};

function describeWsMessage(data) {
  switch (data.type) {
    case 'job_assigned': return `New job assigned: Fleet ${data.breakdown?.fleet_number || ''}`;
    case 'job_accepted': return `Job ${data.breakdown_id || ''} accepted`;
    case 'status_updated': return `Job ${data.breakdown_id || ''} status: ${data.status || ''}`;
    case 'job_completed': return `Job ${data.breakdown_id || ''} completed${data.engineer_name ? ` by ${data.engineer_name}` : ''}`;
    case 'new_breakdown': return `New breakdown: Fleet ${data.breakdown?.fleet_number || ''}`;
    default: return null;
  }
}

export default EngineeringDashboard;
