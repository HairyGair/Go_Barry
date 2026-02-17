import React, { useState, useEffect, useRef } from 'react';
import JobDetailsModal from './JobDetailsModal';
import StatusUpdatePanel from './StatusUpdatePanel';
import ResolutionDialog from './ResolutionDialog';
import AssessmentDetail from './AssessmentDetail';
import ContactActions from './ContactActions';
import VehicleHistory from './VehicleHistory';
import NavigationButton from './NavigationButton';
import DepotContactBadge from '../../components/DepotContactBadge';
import DispatchEngineerModal from './DispatchEngineerModal';
import EngineerEtaCountdown from '../../components/EngineerEtaCountdown';
import { apiClient } from '../../services/api-client';
import { createAssessmentSummary, getServiceImpact } from './utils/assessmentParser';
import L from 'leaflet';

// ── Reverse geocode cache (shared across all cards, survives re-renders) ──
const geocodeCache = new Map();

async function reverseGeocode(lat, lng) {
  const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  if (geocodeCache.has(key)) return geocodeCache.get(key);

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=17&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    const a = data.address || {};
    const road = a.road || a.pedestrian || a.footway || '';
    const town = a.town || a.city || a.village || a.suburb || a.hamlet || '';
    const result = road && town ? `${road}, ${town}` : road || town || data.display_name?.split(',').slice(0, 2).join(',') || null;
    geocodeCache.set(key, result);
    return result;
  } catch {
    return null;
  }
}

const EngineeringCardEnhanced = ({
  breakdown,
  onJobAccepted,
  onStatusUpdated,
  onJobCompleted,
  onRefresh
}) => {
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStatusPanel, setShowStatusPanel] = useState(false);
  const [showResolutionDialog, setShowResolutionDialog] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [geocodedAddress, setGeocodedAddress] = useState(null);

  // Check if engineer has been dispatched
  const isDispatched = breakdown.status === 'dispatched' ||
                       breakdown.status === 'on_site' ||
                       breakdown.status === 'in_progress' ||
                       breakdown.engineer_dispatched_at !== null;

  // Calculate elapsed time
  const created = new Date(breakdown.created_at);
  const now = new Date();
  const elapsedMinutes = Math.floor((now - created) / 60000);

  // Timer urgency tier
  const timerTier = elapsedMinutes >= 60 ? 'urgent'
    : elapsedMinutes >= 30 ? 'critical'
    : elapsedMinutes >= 15 ? 'warning'
    : 'ok';

  // Format elapsed for display
  const formatElapsed = (mins) => {
    if (mins < 60) return { val: String(mins), unit: 'min' };
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h < 24) return { val: `${h}h ${m}m`, unit: '' };
    const d = Math.floor(h / 24);
    return { val: `${d}d ${h % 24}h`, unit: '' };
  };
  const elapsed = formatElapsed(elapsedMinutes);

  // Determine SLA status
  const slaStatus = elapsedMinutes > 90 ? 'critical' : elapsedMinutes > 60 ? 'warning' : 'normal';

  // Get assessment summary and service impact
  const assessmentSummary = createAssessmentSummary(breakdown);
  const serviceImpact = getServiceImpact(breakdown);

  // Check if priority route
  const isPriority = serviceImpact.level === 'CRITICAL' || serviceImpact.level === 'HIGH';

  // Severity key for styling
  const sevKey = (breakdown.severity || breakdown.wizard_decision || 'unknown').toLowerCase();
  const sevLabel = (breakdown.severity || breakdown.wizard_decision || '?').toUpperCase();

  // Location text (raw — used as fallback)
  const locationTextRaw = breakdown.location_description
    || breakdown.location
    || breakdown.wizard_assessment_data?.location
    || breakdown.wizard_assessment_data?.location_description
    || (breakdown.latitude ? `${Number(breakdown.latitude).toFixed(4)}, ${Number(breakdown.longitude).toFixed(4)}` : null)
    || 'Location unknown';

  // Extract coordinates for geocoding
  const cardCoords = (() => {
    const wCoords = breakdown.wizard_assessment_data?.location_coords;
    if (wCoords?.latitude && wCoords?.longitude) return [parseFloat(wCoords.latitude), parseFloat(wCoords.longitude)];
    if (breakdown.latitude && breakdown.longitude) return [parseFloat(breakdown.latitude), parseFloat(breakdown.longitude)];
    if (breakdown.location_lat && breakdown.location_lng) return [parseFloat(breakdown.location_lat), parseFloat(breakdown.location_lng)];
    const text = locationTextRaw || '';
    const m = text.match(/\(?\s*(-?\d{1,3}\.\d{3,})\s*,\s*(-?\d{1,3}\.\d{3,})\s*\)?/);
    if (m) { const lat = parseFloat(m[1]), lng = parseFloat(m[2]); if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) return [lat, lng]; }
    return null;
  })();

  // Reverse geocode into street + town
  useEffect(() => {
    if (!cardCoords) return;
    let cancelled = false;
    reverseGeocode(cardCoords[0], cardCoords[1]).then(addr => {
      if (!cancelled && addr) setGeocodedAddress(addr);
    });
    return () => { cancelled = true; };
  }, [cardCoords?.[0], cardCoords?.[1]]);

  // Display address: geocoded street/town, or cleaned-up raw text
  const locationText = geocodedAddress || locationTextRaw.replace(/\(?\s*-?\d{1,3}\.\d{3,}\s*,\s*-?\d{1,3}\.\d{3,}\s*\)?/, '').replace(/ticketer\s+location/i, '').trim() || locationTextRaw;

  const [showDispatchModal, setShowDispatchModal] = useState(false);

  // Handle dispatch engineer - opens the dispatch modal
  const handleDispatchEngineer = () => {
    setShowDispatchModal(true);
  };

  const handleDispatchComplete = (dispatch) => {
    setShowDispatchModal(false);
    if (onJobAccepted) onJobAccepted(dispatch);
    if (onRefresh) onRefresh();
  };

  const handleQuickStatusUpdate = () => {
    setShowStatusPanel(true);
  };

  const handleStatusUpdated = (updatedBreakdown) => {
    if (onStatusUpdated) onStatusUpdated(updatedBreakdown);
    if (onRefresh) onRefresh();
    setShowStatusPanel(false);
  };

  const handleJobResolved = (completion) => {
    if (onJobCompleted) onJobCompleted(completion);
    if (onRefresh) onRefresh();
    setShowResolutionDialog(false);
  };

  // Navigate handler — opens Google Maps
  const handleNavigate = () => {
    let url;
    const coords = breakdown.wizard_assessment_data?.location_coords;
    if (coords?.latitude && coords?.longitude) {
      url = `https://www.google.com/maps/dir/?api=1&destination=${coords.latitude},${coords.longitude}&travelmode=driving`;
    } else if (breakdown.latitude && breakdown.longitude) {
      url = `https://www.google.com/maps/dir/?api=1&destination=${breakdown.latitude},${breakdown.longitude}&travelmode=driving`;
    } else if (breakdown.location_description || breakdown.location) {
      const addr = encodeURIComponent(breakdown.location_description || breakdown.location);
      url = `https://www.google.com/maps/dir/?api=1&destination=${addr}&travelmode=driving`;
    }
    if (url) window.open(url, '_blank');
  };

  const hasLocation = !!(
    breakdown.wizard_assessment_data?.location_coords?.latitude ||
    breakdown.latitude ||
    breakdown.location_description ||
    breakdown.location
  );

  // Current workflow step index for progress
  const stepIndex = breakdown.engineer_completed_at ? 3
    : breakdown.engineer_fixing_at ? 2
    : breakdown.engineer_on_site_at ? 1
    : (breakdown.engineer_dispatched_at || isDispatched) ? 0
    : -1;

  return (
    <>
      <div className={`dt dt-sev-${sevKey} ${slaStatus === 'critical' ? 'dt-sla-crit' : ''} ${isPriority ? 'dt-priority' : ''}`}>

        {/* ── ROW 1: Identity ── Fleet + Severity + Timer */}
        <div className="dt-head">
          <div className="dt-id">
            <span className="dt-fleet">{breakdown.fleet_number || breakdown.fleet_no || '--'}</span>
            <span className={`dt-sev dt-sev-${sevKey}`}>{sevLabel}</span>
          </div>
          <div className={`dt-clock dt-clock-${timerTier}`}>
            <span className="dt-clock-val">{elapsed.val}</span>
            {elapsed.unit && <span className="dt-clock-unit">{elapsed.unit}</span>}
          </div>
        </div>

        {/* ── ROW 2: Location + Navigate ── */}
        <div className="dt-loc">
          <div className="dt-loc-text" title={locationText}>
            <svg className="dt-loc-pin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            <span className="dt-loc-addr">{locationText}</span>
          </div>
          {hasLocation && (
            <button className="dt-nav" onClick={() => setShowLocationModal(true)} title="View location on map">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              Location
            </button>
          )}
        </div>

        {/* ── ROW 3: Tags ── Issue, Depot, Status, Impact */}
        <div className="dt-tags">
          <span className="dt-tag dt-tag-issue">{formatIssue(breakdown.issue_category)}</span>
          <span className="dt-tag dt-tag-depot">{breakdown.depot || '?'}</span>
          <span className={`dt-tag dt-tag-status dt-tag-st-${breakdown.status}`}>
            {formatStatus(breakdown.status)}
          </span>
          {isPriority && (
            <span className="dt-tag dt-tag-impact">
              {serviceImpact.level}
            </span>
          )}
          {assessmentSummary.safety.hasConcerns && (
            <span className="dt-tag dt-tag-safety">SAFETY</span>
          )}
        </div>

        {/* ── ROW 4: Engineer + Progress (only when dispatched) ── */}
        {isDispatched && (
          <div className="dt-eng-row">
            <div className="dt-eng-info">
              <svg className="dt-eng-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
              </svg>
              <span className="dt-eng-label">{breakdown.engineer_name || 'Engineer'}</span>
              {breakdown.engineer_eta_minutes && breakdown.engineer_dispatched_at ? (
                <EngineerEtaCountdown
                  dispatchedAt={breakdown.engineer_dispatched_at}
                  etaMinutes={breakdown.engineer_eta_minutes}
                  onSite={!!breakdown.engineer_on_site_at}
                  compact
                />
              ) : breakdown.engineer_dispatched_at && !breakdown.engineer_name ? (
                <span className="dt-eng-eta">{formatTime(breakdown.engineer_dispatched_at)}</span>
              ) : null}
            </div>
            <div className="dt-steps">
              {['Sent', 'On Site', 'Fixing', 'Done'].map((label, i) => (
                <div key={label} className={`dt-step ${i <= stepIndex ? 'dt-step-on' : ''} ${i === stepIndex ? 'dt-step-cur' : ''}`}>
                  <div className="dt-step-dot" />
                  <span className="dt-step-lbl">{label}</span>
                </div>
              ))}
              <div className="dt-step-line">
                <div className="dt-step-fill" style={{ width: stepIndex >= 0 ? `${(stepIndex / 3) * 100}%` : '0%' }} />
              </div>
            </div>
          </div>
        )}

        {/* ── ROW 5: Actions ── */}
        <div className="dt-actions">
          {!isDispatched ? (
            <>
              <button className="dt-btn dt-btn-dispatch" onClick={handleDispatchEngineer} disabled={accepting}>
                {accepting ? 'Sending...' : 'Dispatch'}
              </button>
              <button className="dt-btn dt-btn-details" onClick={() => setShowDetailsModal(true)}>
                Details
              </button>
              <button className="dt-btn dt-btn-expand" onClick={() => setExpanded(!expanded)} title={expanded ? 'Collapse' : 'More info'}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
            </>
          ) : (
            <>
              <button className="dt-btn dt-btn-details" onClick={() => setShowDetailsModal(true)}>
                Details
              </button>
              {breakdown.status !== 'resolved' && breakdown.status !== 'cleared' && (
                <button className="dt-btn dt-btn-complete" onClick={() => setShowResolutionDialog(true)}>
                  Complete
                </button>
              )}
              <button className="dt-btn dt-btn-expand" onClick={() => setExpanded(!expanded)} title={expanded ? 'Collapse' : 'More info'}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
            </>
          )}
        </div>

        {/* ── EXPANDABLE: Hidden detail sections ── */}
        {expanded && (
          <div className="dt-drawer">
            <div className="dt-drawer-section">
              <div className="dt-drawer-label">Supervisor</div>
              <div className="dt-drawer-val">{breakdown.supervisor_name || 'Unknown'}</div>
            </div>
            <div className="dt-drawer-section">
              <div className="dt-drawer-label">Reference</div>
              <div className="dt-drawer-val dt-drawer-mono">{breakdown.breakdown_id}</div>
            </div>
            <VehicleHistory fleetNo={breakdown.fleet_no} compact={true} />
            <ContactActions breakdown={breakdown} />
            <AssessmentDetail breakdown={breakdown} compact={true} />
          </div>
        )}

        <style>{`
          /* ══════════════════════════════════════
             DISPATCH TILE — Compact Engineering Card
             ══════════════════════════════════════ */

          .dt {
            background: #0d1420;
            border-radius: 10px;
            border: 1px solid rgba(255,255,255,0.06);
            border-left: 5px solid rgba(255,255,255,0.08);
            transition: border-color 0.25s, box-shadow 0.25s;
            font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
            overflow: hidden;
          }

          .dt:hover {
            box-shadow: 0 8px 32px rgba(0,0,0,0.35);
            border-color: rgba(255,255,255,0.12);
          }

          /* ── Severity accent ── */
          .dt.dt-sev-stop    { border-left-color: #ef4444; }
          .dt.dt-sev-amber   { border-left-color: #f59e0b; }
          .dt.dt-sev-continue { border-left-color: #10b981; }

          .dt.dt-sla-crit {
            animation: dt-pulse 2.5s ease-in-out infinite;
          }

          .dt.dt-priority {
            box-shadow: inset 0 1px 0 0 rgba(245,158,11,0.25);
          }

          @keyframes dt-pulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.15); }
            50% { box-shadow: 0 0 16px 2px rgba(239,68,68,0.12); }
          }

          /* ── HEAD: Fleet + Severity + Clock ── */
          .dt-head {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 14px 16px 8px;
          }

          .dt-id {
            display: flex;
            align-items: baseline;
            gap: 10px;
          }

          .dt-fleet {
            font-family: 'JetBrains Mono', 'SF Mono', monospace;
            font-size: 42px;
            font-weight: 800;
            color: #f1f5f9;
            line-height: 1;
            letter-spacing: -2px;
          }

          .dt-sev {
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 1.5px;
            padding: 4px 10px;
            border-radius: 4px;
            line-height: 1;
            text-transform: uppercase;
          }

          .dt-sev.dt-sev-stop {
            background: rgba(239,68,68,0.2);
            color: #f87171;
            border: 1px solid rgba(239,68,68,0.35);
          }
          .dt-sev.dt-sev-amber {
            background: rgba(245,158,11,0.18);
            color: #fbbf24;
            border: 1px solid rgba(245,158,11,0.3);
          }
          .dt-sev.dt-sev-continue {
            background: rgba(16,185,129,0.18);
            color: #34d399;
            border: 1px solid rgba(16,185,129,0.3);
          }
          .dt-sev.dt-sev-unknown {
            background: rgba(100,116,139,0.2);
            color: #94a3b8;
            border: 1px solid rgba(100,116,139,0.3);
          }

          /* ── CLOCK ── */
          .dt-clock {
            display: flex;
            align-items: baseline;
            gap: 4px;
            padding: 6px 12px;
            border-radius: 6px;
            flex-shrink: 0;
          }

          .dt-clock-val {
            font-family: 'JetBrains Mono', monospace;
            font-size: 22px;
            font-weight: 700;
            line-height: 1;
            font-variant-numeric: tabular-nums;
          }

          .dt-clock-unit {
            font-family: 'JetBrains Mono', monospace;
            font-size: 11px;
            font-weight: 600;
            opacity: 0.7;
          }

          .dt-clock-ok {
            background: rgba(16,185,129,0.1);
          }
          .dt-clock-ok .dt-clock-val { color: #34d399; }

          .dt-clock-warning {
            background: rgba(245,158,11,0.1);
          }
          .dt-clock-warning .dt-clock-val { color: #fbbf24; }

          .dt-clock-critical {
            background: rgba(239,68,68,0.12);
          }
          .dt-clock-critical .dt-clock-val { color: #f87171; }

          .dt-clock-urgent {
            background: rgba(239,68,68,0.18);
            animation: dt-throb 1.5s ease-in-out infinite;
          }
          .dt-clock-urgent .dt-clock-val {
            color: #ef4444;
            animation: dt-glow 1.2s ease-in-out infinite;
          }

          @keyframes dt-throb {
            0%, 100% { background: rgba(239,68,68,0.15); }
            50% { background: rgba(239,68,68,0.25); }
          }

          @keyframes dt-glow {
            0%, 100% { text-shadow: none; }
            50% { text-shadow: 0 0 14px rgba(239,68,68,0.6); }
          }

          /* ── LOCATION ROW ── */
          .dt-loc {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 6px 16px 8px;
          }

          .dt-loc-text {
            flex: 1;
            display: flex;
            align-items: center;
            gap: 6px;
            min-width: 0;
          }

          .dt-loc-pin {
            color: #64748b;
            flex-shrink: 0;
          }

          .dt-loc-addr {
            font-size: 13px;
            color: #cbd5e1;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          /* Navigate button — PRIMARY */
          .dt-nav {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 7px 16px;
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            color: white;
            border: none;
            border-radius: 6px;
            font-family: 'Outfit', sans-serif;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            flex-shrink: 0;
            transition: all 0.15s;
            letter-spacing: 0.3px;
          }

          .dt-nav:hover {
            background: linear-gradient(135deg, #3b82f6, #2563eb);
            box-shadow: 0 4px 16px rgba(37,99,235,0.35);
            transform: translateY(-1px);
          }

          .dt-nav:active {
            transform: translateY(0);
          }

          /* ── TAGS ROW ── */
          .dt-tags {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
            padding: 4px 16px 10px;
          }

          .dt-tag {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            padding: 3px 8px;
            border-radius: 3px;
            line-height: 1;
            white-space: nowrap;
          }

          .dt-tag-issue {
            background: rgba(0,151,167,0.15);
            color: #22d3ee;
            border: 1px solid rgba(0,151,167,0.25);
          }

          .dt-tag-depot {
            background: rgba(99,102,241,0.12);
            color: #a5b4fc;
            border: 1px solid rgba(99,102,241,0.2);
          }

          .dt-tag-status {
            font-weight: 800;
          }

          .dt-tag-st-active, .dt-tag-st-pending {
            background: rgba(16,185,129,0.12);
            color: #34d399;
            border: 1px solid rgba(16,185,129,0.25);
          }
          .dt-tag-st-dispatched {
            background: rgba(59,130,246,0.12);
            color: #60a5fa;
            border: 1px solid rgba(59,130,246,0.25);
          }
          .dt-tag-st-on_site {
            background: rgba(245,158,11,0.12);
            color: #fbbf24;
            border: 1px solid rgba(245,158,11,0.25);
          }
          .dt-tag-st-in_progress {
            background: rgba(139,92,246,0.12);
            color: #a78bfa;
            border: 1px solid rgba(139,92,246,0.25);
          }
          .dt-tag-st-resolved, .dt-tag-st-cleared {
            background: rgba(100,116,139,0.12);
            color: #94a3b8;
            border: 1px solid rgba(100,116,139,0.2);
          }

          .dt-tag-impact {
            background: rgba(245,158,11,0.18);
            color: #fbbf24;
            border: 1px solid rgba(245,158,11,0.3);
            animation: dt-tag-blink 2.5s infinite;
          }

          .dt-tag-safety {
            background: rgba(239,68,68,0.2);
            color: #fca5a5;
            border: 1px solid rgba(239,68,68,0.4);
          }

          @keyframes dt-tag-blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.65; }
          }

          /* ── ENGINEER + PROGRESS ── */
          .dt-eng-row {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 8px 16px;
            background: rgba(59,130,246,0.04);
            border-top: 1px solid rgba(255,255,255,0.04);
          }

          .dt-eng-info {
            display: flex;
            align-items: center;
            gap: 6px;
            flex-shrink: 0;
          }

          .dt-eng-icon { color: #60a5fa; }

          .dt-eng-label {
            font-size: 11px;
            font-weight: 700;
            color: #60a5fa;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .dt-eng-eta {
            font-family: 'JetBrains Mono', monospace;
            font-size: 11px;
            color: #94a3b8;
            background: rgba(255,255,255,0.04);
            padding: 2px 6px;
            border-radius: 3px;
          }

          /* Progress Steps */
          .dt-steps {
            flex: 1;
            display: flex;
            align-items: center;
            position: relative;
            gap: 0;
          }

          .dt-step {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            z-index: 1;
          }

          .dt-step-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #1e293b;
            border: 2px solid rgba(255,255,255,0.12);
            transition: all 0.3s;
          }

          .dt-step-on .dt-step-dot {
            background: #0097A7;
            border-color: #00BCD4;
          }

          .dt-step-cur .dt-step-dot {
            box-shadow: 0 0 8px rgba(0,151,167,0.5);
          }

          .dt-step-lbl {
            font-size: 8px;
            font-weight: 600;
            color: #475569;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            margin-top: 3px;
          }

          .dt-step-on .dt-step-lbl { color: #0097A7; }

          .dt-step-line {
            position: absolute;
            top: 5px;
            left: 12%;
            right: 12%;
            height: 2px;
            background: rgba(255,255,255,0.06);
            z-index: 0;
            border-radius: 1px;
          }

          .dt-step-fill {
            height: 100%;
            background: #0097A7;
            border-radius: 1px;
            transition: width 0.4s ease;
          }

          /* ── ACTIONS ── */
          .dt-actions {
            display: flex;
            gap: 6px;
            padding: 10px 16px;
            border-top: 1px solid rgba(255,255,255,0.04);
          }

          .dt-btn {
            padding: 8px 16px;
            border: none;
            border-radius: 6px;
            font-family: 'Outfit', sans-serif;
            font-size: 12px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.15s;
            letter-spacing: 0.3px;
          }

          .dt-btn:disabled {
            opacity: 0.45;
            cursor: not-allowed;
          }

          .dt-btn-dispatch {
            flex: 1;
            background: linear-gradient(135deg, #0097A7, #00838F);
            color: white;
          }
          .dt-btn-dispatch:hover:not(:disabled) {
            background: linear-gradient(135deg, #00ACC1, #0097A7);
            box-shadow: 0 4px 14px rgba(0,151,167,0.3);
          }

          .dt-btn-details {
            flex: 1;
            background: rgba(255,255,255,0.06);
            color: #94a3b8;
            border: 1px solid rgba(255,255,255,0.08);
          }
          .dt-btn-details:hover {
            background: rgba(255,255,255,0.1);
            color: #e2e8f0;
          }

          .dt-btn-complete {
            flex: 1;
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
          }
          .dt-btn-complete:hover {
            background: linear-gradient(135deg, #34d399, #10b981);
            box-shadow: 0 4px 14px rgba(16,185,129,0.3);
          }

          .dt-btn-expand {
            width: 36px;
            flex-shrink: 0;
            flex-grow: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(255,255,255,0.04);
            color: #64748b;
            border: 1px solid rgba(255,255,255,0.06);
            padding: 8px;
          }
          .dt-btn-expand:hover {
            background: rgba(255,255,255,0.08);
            color: #cbd5e1;
          }

          /* ── EXPANDABLE DRAWER ── */
          .dt-drawer {
            border-top: 1px solid rgba(255,255,255,0.06);
            background: rgba(0,0,0,0.15);
          }

          .dt-drawer-section {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 16px;
            border-bottom: 1px solid rgba(255,255,255,0.03);
          }

          .dt-drawer-label {
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #64748b;
          }

          .dt-drawer-val {
            font-size: 13px;
            color: #cbd5e1;
            font-weight: 500;
          }

          .dt-drawer-mono {
            font-family: 'JetBrains Mono', monospace;
            font-size: 12px;
            color: #94a3b8;
          }
        `}</style>
      </div>

      {/* Modals */}
      {showDetailsModal && (
        <JobDetailsModal
          show={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          breakdownId={breakdown.breakdown_id}
        />
      )}

      {showStatusPanel && (
        <div className="dt-modal-overlay" onClick={() => setShowStatusPanel(false)}>
          <div className="dt-modal" onClick={e => e.stopPropagation()}>
            <StatusUpdatePanel
              breakdown={breakdown}
              onStatusUpdated={handleStatusUpdated}
              onClose={() => setShowStatusPanel(false)}
            />
          </div>
        </div>
      )}

      {showResolutionDialog && (
        <div className="dt-modal-overlay" onClick={() => setShowResolutionDialog(false)}>
          <div className="dt-modal dt-modal-lg" onClick={e => e.stopPropagation()}>
            <ResolutionDialog
              breakdown={breakdown}
              onResolved={handleJobResolved}
              onClose={() => setShowResolutionDialog(false)}
            />
          </div>
        </div>
      )}

      {showLocationModal && (
        <LocationMapModal
          breakdown={breakdown}
          locationText={locationText}
          sevKey={sevKey}
          sevLabel={sevLabel}
          onNavigate={handleNavigate}
          onClose={() => setShowLocationModal(false)}
        />
      )}

      {showDispatchModal && (
        <DispatchEngineerModal
          breakdownId={breakdown.breakdown_id}
          breakdownDepot={breakdown.depot}
          breakdownLat={cardCoords?.[0] ?? null}
          breakdownLng={cardCoords?.[1] ?? null}
          onDispatch={handleDispatchComplete}
          onClose={() => setShowDispatchModal(false)}
        />
      )}

      <style>{`
        .dt-modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
          backdrop-filter: blur(4px);
        }

        .dt-modal {
          background: #141d2b;
          border-radius: 14px;
          max-width: 600px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0,0,0,0.6);
          border: 1px solid rgba(255,255,255,0.08);
        }

        .dt-modal-lg { max-width: 900px; }
      `}</style>
    </>
  );
};

// Helper function to format issue category from slugs to readable English
function formatIssue(raw) {
  if (!raw) return 'General';
  // Known mappings for common categories
  const known = {
    'ev-low-charge': 'EV Low Charge',
    'ev-not-charging': 'EV Not Charging',
    'ev-battery': 'EV Battery',
    'ev-range': 'EV Range Issue',
    'abs-light': 'ABS Warning Light',
    'brakes': 'Brake Issue',
    'steering': 'Steering Issue',
    'engine': 'Engine Issue',
    'electrical': 'Electrical Issue',
    'hvac': 'HVAC Issue',
    'doors': 'Door Issue',
    'wheelchair-ramp': 'Wheelchair Ramp',
    'windscreen': 'Windscreen Issue',
    'tyres': 'Tyre Issue',
    'lights': 'Lighting Issue',
    'suspension': 'Suspension Issue',
    'transmission': 'Transmission Issue',
    'fuel-system': 'Fuel System',
    'cooling-system': 'Cooling System',
    'exhaust': 'Exhaust Issue',
    'body-damage': 'Body Damage',
    'power-loss': 'Power Loss',
    'overheating': 'Overheating',
    'fluid-leak': 'Fluid Leak',
    'smoke-steam': 'Smoke / Steam',
    'warning-light': 'Warning Light',
    'dda': 'DDA Compliance',
    'destination-blind': 'Destination Blind',
    'ticketer': 'Ticketer Issue',
    'cctv': 'CCTV Issue',
    'general': 'General',
  };
  const lower = raw.toLowerCase().trim();
  if (known[lower]) return known[lower];
  // Generic transform: replace hyphens/underscores, title-case each word,
  // keep known acronyms uppercase
  const acronyms = new Set(['ev', 'abs', 'hvac', 'dda', 'cctv', 'adl', 'dvsa']);
  return lower
    .replace(/[-_]+/g, ' ')
    .split(' ')
    .map(w => acronyms.has(w) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// Helper function to format status
function formatStatus(status) {
  const statusMap = {
    'active': 'Active',
    'pending': 'Pending',
    'dispatched': 'Dispatched',
    'on_site': 'On Site',
    'in_progress': 'Fixing',
    'resolved': 'Resolved',
    'cleared': 'Cleared'
  };
  return statusMap[status] || status || 'Unknown';
}

// Helper function to format time
function formatTime(timestamp) {
  if (!timestamp) return 'Unknown';
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  return `${hours}h ${mins}m ago`;
}

// ── Depot coordinates (verified from OpenStreetMap Dec 2025) ──
const DEPOT_COORDS = {
  'Washington': [54.9068, -1.5140],
  'Riverside':  [54.9586, -1.6579],
  'Consett':    [54.8403, -1.8380],
  'Deptford':   [54.9142, -1.3976],
  'Percy Main': [54.9962, -1.4692],
  'Hexham':     [54.9689, -2.0953],
  'SDC':        [54.9586, -1.6579],
};

// ── Location Map Modal ──
const LocationMapModal = ({ breakdown, locationText, sevKey, sevLabel, onNavigate, onClose }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const [copied, setCopied] = useState(false);
  const [satellite, setSatellite] = useState(false);
  const tileLayerRef = useRef(null);

  // Clean location text — strip embedded coordinates for display
  const cleanLocation = (text) => {
    if (!text) return 'Unknown location';
    return text.replace(/\s*\(?\s*-?\d{1,3}\.\d{3,}\s*,\s*-?\d{1,3}\.\d{3,}\s*\)?\s*$/, '').trim() || text;
  };

  const displayLocation = cleanLocation(locationText);

  // Elapsed time
  const created = new Date(breakdown.created_at);
  const now = new Date();
  const elapsedMins = Math.floor((now - created) / 60000);
  const elapsedStr = elapsedMins < 60 ? `${elapsedMins}m`
    : elapsedMins < 1440 ? `${Math.floor(elapsedMins / 60)}h ${elapsedMins % 60}m`
    : `${Math.floor(elapsedMins / 1440)}d ${Math.floor((elapsedMins % 1440) / 60)}h`;

  // Resolve coordinates from any available source
  const getCoords = () => {
    const wCoords = breakdown.wizard_assessment_data?.location_coords;
    if (wCoords?.latitude && wCoords?.longitude) {
      return [parseFloat(wCoords.latitude), parseFloat(wCoords.longitude)];
    }
    if (breakdown.latitude && breakdown.longitude) {
      return [parseFloat(breakdown.latitude), parseFloat(breakdown.longitude)];
    }
    if (breakdown.location_lat && breakdown.location_lng) {
      return [parseFloat(breakdown.location_lat), parseFloat(breakdown.location_lng)];
    }
    const text = breakdown.location_description || breakdown.location
      || breakdown.wizard_assessment_data?.location || breakdown.wizard_assessment_data?.location_description || '';
    const match = text.match(/\(?\s*(-?\d{1,3}\.\d{3,})\s*,\s*(-?\d{1,3}\.\d{3,})\s*\)?/);
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) return [lat, lng];
    }
    return null;
  };

  const coords = getCoords();
  const depotName = breakdown.depot;
  const depotCoords = depotName ? DEPOT_COORDS[depotName] : null;

  // Copy coordinates
  const handleCopy = () => {
    if (!coords) return;
    navigator.clipboard.writeText(`${coords[0].toFixed(6)}, ${coords[1].toFixed(6)}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Toggle satellite
  const handleToggleSatellite = () => {
    setSatellite(prev => !prev);
  };

  // Swap tile layer when satellite state changes
  useEffect(() => {
    if (!mapInstance.current || !tileLayerRef.current) return;
    mapInstance.current.removeLayer(tileLayerRef.current);
    const url = satellite
      ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
    tileLayerRef.current = L.tileLayer(url, { maxZoom: 19 }).addTo(mapInstance.current);
  }, [satellite]);

  // Stable coord key to prevent re-creating map on parent re-renders
  const coordKey = coords ? `${coords[0]},${coords[1]}` : null;

  useEffect(() => {
    if (!mapRef.current || !coordKey || mapInstance.current) return;

    const [lat, lng] = coordKey.split(',').map(Number);
    const sevColors = { stop: '#dc2626', amber: '#d97706', continue: '#059669' };
    const markerColor = sevColors[sevKey] || '#2563eb';
    const fleetNum = breakdown.fleet_number || breakdown.fleet_no || '?';

    const map = L.map(mapRef.current, {
      center: [lat, lng],
      zoom: 17,
      zoomControl: false,
      attributionControl: false
    });

    // Add zoom control to top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Light tile layer (CartoDB Positron)
    tileLayerRef.current = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19
    }).addTo(map);

    // Bus marker — rectangular badge style with full fleet number
    const busIconHtml = `
      <div style="
        display: flex; align-items: center; gap: 0;
        filter: drop-shadow(0 3px 6px rgba(0,0,0,0.5));
      ">
        <div style="
          background: ${markerColor};
          color: white;
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
          font-weight: 800;
          padding: 5px 10px;
          border-radius: 6px;
          border: 2px solid rgba(255,255,255,0.9);
          line-height: 1;
          white-space: nowrap;
          position: relative;
        ">
          <span style="font-size: 9px; font-weight: 600; opacity: 0.8; display: block; margin-bottom: 1px;">BUS</span>
          ${fleetNum}
          <div style="
            position: absolute; bottom: -7px; left: 50%; transform: translateX(-50%);
            width: 0; height: 0;
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            border-top: 7px solid ${markerColor};
          "></div>
        </div>
      </div>
    `;

    const busIcon = L.divIcon({
      html: busIconHtml,
      className: '',
      iconSize: [80, 44],
      iconAnchor: [40, 44],
      popupAnchor: [0, -44]
    });

    L.marker(coords, { icon: busIcon }).addTo(map);

    // Accuracy circle
    L.circle(coords, {
      radius: 80,
      color: markerColor,
      fillColor: markerColor,
      fillOpacity: 0.06,
      weight: 1,
      opacity: 0.25,
      dashArray: '4 6'
    }).addTo(map);

    // Depot marker
    if (depotCoords) {
      const depotIconHtml = `
        <div style="
          display: flex; align-items: center; gap: 0;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));
        ">
          <div style="
            background: #1e293b;
            color: #94a3b8;
            font-family: 'Outfit', sans-serif;
            font-size: 10px;
            font-weight: 700;
            padding: 4px 8px;
            border-radius: 5px;
            border: 2px solid #475569;
            line-height: 1;
            white-space: nowrap;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            position: relative;
          ">
            ${depotName}
            <div style="
              position: absolute; bottom: -6px; left: 50%; transform: translateX(-50%);
              width: 0; height: 0;
              border-left: 5px solid transparent;
              border-right: 5px solid transparent;
              border-top: 6px solid #1e293b;
            "></div>
          </div>
        </div>
      `;

      const depotIcon = L.divIcon({
        html: depotIconHtml,
        className: '',
        iconSize: [80, 30],
        iconAnchor: [40, 30]
      });

      L.marker(depotCoords, { icon: depotIcon }).addTo(map);

      // Dashed line from depot to breakdown
      L.polyline([depotCoords, coords], {
        color: '#475569',
        weight: 2,
        dashArray: '8 8',
        opacity: 0.5
      }).addTo(map);

    }

    mapInstance.current = map;
    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, [coordKey]);

  return (
    <div className="dt-modal-overlay" onClick={onClose}>
      <div className="dt-loc-modal" onClick={e => e.stopPropagation()}>

        {/* Header — fleet, severity, issue, elapsed */}
        <div className="dt-loc-modal-head">
          <div>
            <div className="dt-loc-modal-title">
              <span className="dt-loc-modal-fleet">{breakdown.fleet_number || breakdown.fleet_no || '--'}</span>
              <span className={`dt-loc-modal-sev dt-loc-modal-sev-${sevKey}`}>{sevLabel}</span>
            </div>
            <div className="dt-loc-modal-meta">
              <span className="dt-loc-modal-issue">{formatIssue(breakdown.issue_category)}</span>
              <span className="dt-loc-modal-elapsed">{elapsedStr} elapsed</span>
              {depotName && <span className="dt-loc-modal-depot">{depotName} depot</span>}
            </div>
          </div>
          <button className="dt-loc-modal-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Location bar — clean text + coords + copy */}
        <div className="dt-loc-modal-addr">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
          </svg>
          <span className="dt-loc-modal-addr-text">{displayLocation}</span>
          {coords && (
            <span className="dt-loc-modal-coords">
              {coords[0].toFixed(5)}, {coords[1].toFixed(5)}
            </span>
          )}
          {coords && (
            <button className="dt-loc-modal-copy" onClick={handleCopy} title="Copy coordinates">
              {copied ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
              )}
            </button>
          )}
        </div>

        {/* Map */}
        <div className="dt-loc-modal-map-wrap">
          {coords ? (
            <>
              <div ref={mapRef} className="dt-loc-modal-map" />
              {/* Satellite toggle */}
              <button className={`dt-loc-modal-sat ${satellite ? 'dt-loc-modal-sat-on' : ''}`} onClick={handleToggleSatellite} title={satellite ? 'Street view' : 'Satellite view'}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {satellite ? (
                    <><path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></>
                  ) : (
                    <><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></>
                  )}
                </svg>
              </button>
            </>
          ) : (
            <div className="dt-loc-modal-nomap">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              <p>No GPS coordinates available</p>
              <p className="dt-loc-modal-nomap-sub">Location: {locationText}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="dt-loc-modal-foot">
          <button className="dt-loc-modal-navbtn" onClick={() => { onNavigate(); onClose(); }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="3 11 22 2 13 21 11 13 3 11"/>
            </svg>
            Open in Google Maps
          </button>
          <button className="dt-loc-modal-closebtn" onClick={onClose}>Close</button>
        </div>

        <style>{`
          .dt-loc-modal {
            background: #0d1420;
            border-radius: 14px;
            max-width: 640px;
            width: 100%;
            overflow: hidden;
            box-shadow: 0 24px 64px rgba(0,0,0,0.6);
            border: 1px solid rgba(255,255,255,0.08);
            display: flex;
            flex-direction: column;
          }

          .dt-loc-modal-head {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding: 16px 20px 12px;
            border-bottom: 1px solid rgba(255,255,255,0.06);
          }

          .dt-loc-modal-title {
            display: flex;
            align-items: baseline;
            gap: 10px;
          }

          .dt-loc-modal-fleet {
            font-family: 'JetBrains Mono', monospace;
            font-size: 28px;
            font-weight: 800;
            color: #f1f5f9;
            letter-spacing: -1px;
          }

          .dt-loc-modal-sev {
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 1.5px;
            padding: 3px 8px;
            border-radius: 3px;
            text-transform: uppercase;
          }
          .dt-loc-modal-sev-stop { background: rgba(239,68,68,0.2); color: #f87171; border: 1px solid rgba(239,68,68,0.35); }
          .dt-loc-modal-sev-amber { background: rgba(245,158,11,0.18); color: #fbbf24; border: 1px solid rgba(245,158,11,0.3); }
          .dt-loc-modal-sev-continue { background: rgba(16,185,129,0.18); color: #34d399; border: 1px solid rgba(16,185,129,0.3); }
          .dt-loc-modal-sev-unknown { background: rgba(100,116,139,0.2); color: #94a3b8; }

          .dt-loc-modal-meta {
            display: flex;
            gap: 12px;
            margin-top: 6px;
            font-size: 12px;
          }

          .dt-loc-modal-issue {
            color: #22d3ee;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.3px;
          }

          .dt-loc-modal-elapsed {
            color: #94a3b8;
          }

          .dt-loc-modal-depot {
            color: #a5b4fc;
          }

          .dt-loc-modal-close {
            background: none;
            border: none;
            color: #64748b;
            cursor: pointer;
            padding: 6px;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.15s;
            flex-shrink: 0;
          }
          .dt-loc-modal-close:hover {
            background: rgba(255,255,255,0.08);
            color: #e2e8f0;
          }

          .dt-loc-modal-addr {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 20px;
            color: #94a3b8;
            font-size: 13px;
            border-bottom: 1px solid rgba(255,255,255,0.04);
          }
          .dt-loc-modal-addr svg { flex-shrink: 0; color: #64748b; }

          .dt-loc-modal-addr-text {
            flex: 1;
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .dt-loc-modal-coords {
            font-family: 'JetBrains Mono', monospace;
            font-size: 11px;
            color: #475569;
            flex-shrink: 0;
          }

          .dt-loc-modal-copy {
            background: none;
            border: 1px solid rgba(255,255,255,0.08);
            color: #64748b;
            cursor: pointer;
            padding: 4px;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.15s;
            flex-shrink: 0;
          }
          .dt-loc-modal-copy:hover {
            background: rgba(255,255,255,0.06);
            color: #cbd5e1;
            border-color: rgba(255,255,255,0.15);
          }

          .dt-loc-modal-map-wrap {
            position: relative;
          }

          .dt-loc-modal-map {
            height: 350px;
            width: 100%;
            background: #0a0f1a;
          }

          /* Dark Leaflet controls */
          .dt-loc-modal-map .leaflet-control-zoom a {
            background: #1e293b !important;
            color: #cbd5e1 !important;
            border-color: rgba(255,255,255,0.1) !important;
          }
          .dt-loc-modal-map .leaflet-control-zoom a:hover {
            background: #334155 !important;
          }

          /* Satellite toggle */
          .dt-loc-modal-sat {
            position: absolute;
            top: 10px;
            left: 10px;
            z-index: 1000;
            background: #1e293b;
            border: 1px solid rgba(255,255,255,0.1);
            color: #94a3b8;
            width: 34px;
            height: 34px;
            border-radius: 6px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.15s;
          }
          .dt-loc-modal-sat:hover {
            background: #334155;
            color: #e2e8f0;
          }
          .dt-loc-modal-sat-on {
            background: #2563eb;
            border-color: #3b82f6;
            color: white;
          }
          .dt-loc-modal-sat-on:hover {
            background: #1d4ed8;
          }

          .dt-loc-modal-nomap {
            height: 200px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 8px;
            color: #64748b;
            font-size: 14px;
          }
          .dt-loc-modal-nomap p { margin: 0; }
          .dt-loc-modal-nomap-sub { font-size: 12px; color: #475569; }

          .dt-loc-modal-foot {
            display: flex;
            gap: 8px;
            padding: 14px 20px;
            border-top: 1px solid rgba(255,255,255,0.06);
          }

          .dt-loc-modal-navbtn {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 10px 20px;
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            color: white;
            border: none;
            border-radius: 8px;
            font-family: 'Outfit', sans-serif;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.15s;
          }
          .dt-loc-modal-navbtn:hover {
            background: linear-gradient(135deg, #3b82f6, #2563eb);
            box-shadow: 0 6px 20px rgba(37,99,235,0.35);
            transform: translateY(-1px);
          }

          .dt-loc-modal-closebtn {
            padding: 10px 20px;
            background: rgba(255,255,255,0.06);
            color: #94a3b8;
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 8px;
            font-family: 'Outfit', sans-serif;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.15s;
          }
          .dt-loc-modal-closebtn:hover {
            background: rgba(255,255,255,0.1);
            color: #e2e8f0;
          }
        `}</style>
      </div>
    </div>
  );
};

export default EngineeringCardEnhanced;
