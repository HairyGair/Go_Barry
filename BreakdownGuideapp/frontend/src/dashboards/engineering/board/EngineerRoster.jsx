/**
 * Dispatch Board — Engineer Roster (left column)
 *
 * Today's on-shift engineers with a live status derived from the current
 * jobs list, current job (fleet + ETA countdown / elapsed on site), depot
 * and skill chips. Available engineers sort first; clicking an engineer with
 * a current job selects it on the board.
 *
 * @author Anthony Gair
 * @license Proprietary
 */

import React from 'react';
import { X } from 'lucide-react';
import { displayDepotName } from '../../../config/demoDepots';
import EngineerEtaCountdown from '../../../components/EngineerEtaCountdown';
import { deriveEngineerLiveStatus, REAL_DEPOT_CODE_TO_NAME } from './dispatchBoardHelpers';

const STATUS_ORDER = { available: 0, en_route: 1, on_site: 2, off_shift: 3 };
const STATUS_LABEL = { available: 'Available', en_route: 'En route', on_site: 'On site', off_shift: 'Off shift' };

function depotLabel(code) {
  if (!code) return null;
  return displayDepotName(REAL_DEPOT_CODE_TO_NAME[String(code).toUpperCase()] || code);
}

function elapsedSince(iso) {
  if (!iso) return null;
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

const EngineerRoster = ({ engineers, jobs, selectedEngineerBadge, onSelectEngineer, collapsed, onClose }) => {
  const enriched = engineers.map(e => ({ engineer: e, ...deriveEngineerLiveStatus(e, jobs) }));
  const sorted = [...enriched].sort((a, b) => {
    const rank = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    if (rank !== 0) return rank;
    return (a.engineer.name || '').localeCompare(b.engineer.name || '');
  });

  return (
    <aside className={`erb-roster ${collapsed ? 'erb-roster-collapsed' : ''}`} aria-label="Engineer roster">
      <div className="erb-roster-head">
        <h3 className="erb-roster-title">Engineers</h3>
        <span className="erb-roster-count">{engineers.length} on shift</span>
        {onClose && (
          <button type="button" className="erb-roster-close" onClick={onClose} aria-label="Close engineer roster">
            <X size={16} />
          </button>
        )}
      </div>

      <div className="erb-roster-scroll">
        {sorted.length === 0 ? (
          <div className="erb-roster-empty">
            <p>No engineers checked in today.</p>
          </div>
        ) : (
          sorted.map(({ engineer, status, job }) => {
            const isSelected = selectedEngineerBadge && engineer.badge_number === selectedEngineerBadge;
            const skills = Array.isArray(engineer.skills) ? engineer.skills : [];
            return (
              <button
                type="button"
                key={engineer.id}
                className={`erb-eng ${isSelected ? 'erb-eng-selected' : ''} erb-eng-${status}`}
                onClick={() => onSelectEngineer(engineer, job)}
                title={job ? `Fleet ${job.fleet_number || job.fleet_no} · ${STATUS_LABEL[status]}` : STATUS_LABEL[status]}
              >
                <div className="erb-eng-top">
                  <span className={`erb-dot erb-dot-${status}`} aria-hidden="true" />
                  <span className="erb-eng-name">{engineer.name}</span>
                  <span className="erb-eng-status">{STATUS_LABEL[status]}</span>
                </div>

                {job ? (
                  <div className="erb-eng-job">
                    <span className="erb-eng-fleet">{job.fleet_number || job.fleet_no}</span>
                    {status === 'en_route' && job.engineer_dispatched_at && job.engineer_eta_minutes ? (
                      <EngineerEtaCountdown
                        dispatchedAt={job.engineer_dispatched_at}
                        etaMinutes={job.engineer_eta_minutes}
                        onSite={false}
                        compact
                      />
                    ) : status === 'on_site' && job.engineer_on_site_at ? (
                      <span className="erb-eng-elapsed">{elapsedSince(job.engineer_on_site_at)} on site</span>
                    ) : null}
                  </div>
                ) : (
                  <div className="erb-eng-meta">
                    <span className="erb-eng-depot">{depotLabel(engineer.shift_depot || engineer.home_depot_code) || 'No depot'}</span>
                  </div>
                )}

                {skills.length > 0 && (
                  <div className="erb-eng-skills">
                    {skills.slice(0, 4).map((s, i) => (
                      <span key={i} className="erb-skill">{s}</span>
                    ))}
                  </div>
                )}
              </button>
            );
          })
        )}
      </div>

      <style>{`
        .erb-roster {
          display: flex;
          flex-direction: column;
          min-height: 0;
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          overflow: hidden;
        }

        .erb-roster-head {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 8px;
          padding: 14px 16px 10px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }

        .erb-roster-title {
          margin: 0;
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #94a3b8;
          font-family: var(--font-body, 'Inter'), sans-serif;
        }

        .erb-roster-count {
          font-size: 11px;
          color: #64748b;
          font-family: var(--font-mono, 'JetBrains Mono'), monospace;
          white-space: nowrap;
        }

        /* Only relevant when this panel becomes a full-screen mobile
           overlay (<=1024px, see EngineeringDashboard.jsx) - hidden in the
           normal side-by-side column layout. */
        .erb-roster-close {
          display: none;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.05);
          color: #94a3b8;
          cursor: pointer;
        }

        @media (max-width: 1024px) {
          .erb-roster-close { display: flex; }
        }

        .erb-roster-scroll {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          padding: 8px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .erb-roster-empty {
          padding: 24px 12px;
          text-align: center;
          color: #64748b;
          font-size: 13px;
        }

        .erb-eng {
          display: flex;
          flex-direction: column;
          gap: 6px;
          width: 100%;
          text-align: left;
          padding: 10px 12px;
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 10px;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s;
          font-family: var(--font-body, 'Inter'), sans-serif;
        }

        .erb-eng:hover {
          background: rgba(255,255,255,0.05);
          border-color: rgba(255,255,255,0.12);
        }

        .erb-eng-selected {
          background: rgba(0,151,167,0.1) !important;
          border-color: rgba(34,211,238,0.4) !important;
        }

        .erb-eng-off_shift { opacity: 0.55; }

        .erb-eng-top {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .erb-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .erb-dot-available { background: #10b981; box-shadow: 0 0 6px rgba(16,185,129,0.6); }
        .erb-dot-en_route { background: #3b82f6; }
        .erb-dot-on_site { background: #f59e0b; }
        .erb-dot-off_shift { background: #475569; }

        .erb-eng-name {
          flex: 1;
          min-width: 0;
          font-size: 13px;
          font-weight: 600;
          color: #e2e8f0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .erb-eng-status {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          color: #64748b;
          flex-shrink: 0;
        }

        .erb-eng-en_route .erb-eng-status { color: #60a5fa; }
        .erb-eng-on_site .erb-eng-status { color: #fbbf24; }
        .erb-eng-available .erb-eng-status { color: #34d399; }

        .erb-eng-job {
          display: flex;
          align-items: center;
          gap: 8px;
          padding-left: 16px;
        }

        .erb-eng-fleet {
          font-family: var(--font-mono, 'JetBrains Mono'), monospace;
          font-size: 13px;
          font-weight: 700;
          color: #cbd5e1;
        }

        .erb-eng-elapsed {
          font-size: 11px;
          color: #fbbf24;
          font-family: var(--font-mono, 'JetBrains Mono'), monospace;
        }

        .erb-eng-meta {
          padding-left: 16px;
        }

        .erb-eng-depot {
          font-size: 11px;
          color: #64748b;
        }

        .erb-eng-skills {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
          padding-left: 16px;
        }

        .erb-skill {
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          padding: 2px 6px;
          border-radius: 3px;
          background: rgba(99,102,241,0.1);
          color: #a5b4fc;
          border: 1px solid rgba(99,102,241,0.2);
        }

        /* Collapsed rail toggle used at <=1024px */
        .erb-roster-collapsed {
          display: none;
        }
      `}</style>
    </aside>
  );
};

export default EngineerRoster;
