/**
 * Dispatch Board — compact job card used in the board columns.
 *
 * @author Anthony Gair
 * @license Proprietary
 */

import React from 'react';
import EngineerEtaCountdown from '../../../components/EngineerEtaCountdown';
import { formatIssue } from '../EngineeringCardEnhanced';

function formatElapsed(mins) {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h < 24) return `${h}h ${m}m`;
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h`;
}

const JobCard = ({ job, stage, isSelected, onSelect }) => {
  const sevKey = (job.severity || job.wizard_decision || 'unknown').toLowerCase();
  const sevLabel = (job.severity || job.wizard_decision || '?').toUpperCase();
  const elapsedMinutes = job.elapsed_minutes ?? Math.floor((Date.now() - new Date(job.created_at).getTime()) / 60000);
  const locationText = job.location_description || job.location || 'Location unknown';
  const isOverdue = job.is_overdue;

  return (
    <button
      type="button"
      className={`jbc ${isSelected ? 'jbc-selected' : ''} jbc-sev-${sevKey} ${isOverdue ? 'jbc-overdue' : ''}`}
      onClick={() => onSelect(job)}
    >
      <div className="jbc-top">
        <span className="jbc-fleet">{job.fleet_number || job.fleet_no || '--'}</span>
        <span className={`jbc-sev jbc-sev-badge-${sevKey}`}>{sevLabel}</span>
      </div>

      <div className="jbc-issue">{formatIssue(job.issue_category)}</div>
      <div className="jbc-loc" title={locationText}>{locationText}</div>

      <div className="jbc-foot">
        <span className="jbc-depot">{job.depot || '?'}</span>
        {stage === 'en_route' && job.engineer_dispatched_at && job.engineer_eta_minutes ? (
          <EngineerEtaCountdown
            dispatchedAt={job.engineer_dispatched_at}
            etaMinutes={job.engineer_eta_minutes}
            onSite={false}
            compact
          />
        ) : stage === 'on_site' ? (
          <span className="jbc-time">{job.engineer_name || 'On site'}</span>
        ) : (
          <span className={`jbc-time ${isOverdue ? 'jbc-time-overdue' : ''}`}>{formatElapsed(elapsedMinutes)}</span>
        )}
      </div>

      <style>{`
        .jbc {
          display: flex;
          flex-direction: column;
          gap: 4px;
          width: 100%;
          text-align: left;
          background: #0d1420;
          border: 1px solid rgba(255,255,255,0.07);
          border-left: 3px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          padding: 10px 12px;
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s;
          font-family: var(--font-display, 'Outfit'), sans-serif;
        }

        .jbc:hover {
          background: #101a2b;
          border-color: rgba(255,255,255,0.15);
        }

        .jbc-selected {
          background: rgba(0,151,167,0.1) !important;
          border-color: rgba(34,211,238,0.5) !important;
          border-left-color: #22d3ee !important;
        }

        .jbc-sev-stop { border-left-color: #ef4444; }
        .jbc-sev-amber { border-left-color: #f59e0b; }
        .jbc-sev-continue { border-left-color: #10b981; }

        .jbc-overdue {
          box-shadow: inset 0 0 0 1px rgba(239,68,68,0.25);
          animation: jbc-pulse 2.5s ease-in-out infinite;
        }

        @keyframes jbc-pulse {
          0%, 100% { box-shadow: inset 0 0 0 1px rgba(239,68,68,0.2); }
          50% { box-shadow: inset 0 0 0 1px rgba(239,68,68,0.45); }
        }

        .jbc-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
        }

        .jbc-fleet {
          font-family: var(--font-mono, 'JetBrains Mono'), monospace;
          font-size: 18px;
          font-weight: 800;
          color: #f1f5f9;
          letter-spacing: -0.5px;
        }

        .jbc-sev {
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1px;
          padding: 2px 6px;
          border-radius: 3px;
        }
        .jbc-sev-badge-stop { background: rgba(239,68,68,0.2); color: #f87171; }
        .jbc-sev-badge-amber { background: rgba(245,158,11,0.18); color: #fbbf24; }
        .jbc-sev-badge-continue { background: rgba(16,185,129,0.18); color: #34d399; }
        .jbc-sev-badge-unknown { background: rgba(100,116,139,0.2); color: #94a3b8; }

        .jbc-issue {
          font-size: 11px;
          font-weight: 600;
          color: #22d3ee;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .jbc-loc {
          font-size: 12px;
          color: #94a3b8;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .jbc-foot {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-top: 2px;
          min-width: 0;
        }

        .jbc-depot {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          color: #a5b4fc;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          min-width: 0;
          flex-shrink: 1;
        }

        .jbc-time {
          font-family: var(--font-mono, 'JetBrains Mono'), monospace;
          font-size: 11px;
          color: #64748b;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          flex-shrink: 0;
          max-width: 55%;
        }

        .jbc-time-overdue { color: #f87171; font-weight: 700; }
      `}</style>
    </button>
  );
};

export default JobCard;
