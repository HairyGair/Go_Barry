/**
 * Dispatch Board — Suggested engineer block for an "Awaiting dispatch" job.
 *
 * Ranks available on-shift engineers by skill match to the job's issue
 * category, then by straight-line distance from their shift/home depot, and
 * offers a one-click dispatch that opens the existing DispatchEngineerModal
 * pre-filled with that engineer (never submits without supervisor review).
 *
 * @author Anthony Gair
 * @license Proprietary
 */

import React, { useState } from 'react';
import { Sparkles, MapPin } from 'lucide-react';
import DispatchEngineerModal from '../DispatchEngineerModal';
import { rankEngineersForJob, getBreakdownCoords } from './dispatchBoardHelpers';

const SuggestedEngineerCard = ({ job, engineers, jobs, onDispatch }) => {
  const [dispatchTarget, setDispatchTarget] = useState(null); // engineer being dispatched, or null

  const ranked = rankEngineersForJob(engineers, job, jobs).slice(0, 3);
  const breakdownCoords = getBreakdownCoords(job);

  if (ranked.length === 0) {
    return (
      <div className="sge">
        <div className="sge-head">
          <Sparkles size={14} aria-hidden="true" />
          <span>Suggested Engineer</span>
        </div>
        <p className="sge-empty">No available on-shift engineers right now.</p>
        <style>{sgeStyles}</style>
      </div>
    );
  }

  return (
    <div className="sge">
      <div className="sge-head">
        <Sparkles size={14} aria-hidden="true" />
        <span>Suggested Engineer{ranked.length > 1 ? 's' : ''}</span>
      </div>

      <div className="sge-list">
        {ranked.map(({ engineer, distanceMiles, matchedSkills }) => (
          <div key={engineer.id} className="sge-card">
            <div className="sge-card-top">
              <span className="sge-name">{engineer.name}</span>
              {distanceMiles !== null && (
                <span className="sge-distance" title="Straight-line distance from their depot. Dispatch calculates the road ETA.">
                  <MapPin size={11} aria-hidden="true" /> {distanceMiles.toFixed(1)} mi away
                </span>
              )}
            </div>
            {matchedSkills.length > 0 && (
              <div className="sge-skills">
                {matchedSkills.map((s, i) => <span key={i} className="sge-skill sge-skill-match">{s}</span>)}
                {(engineer.skills || []).filter(s => !matchedSkills.includes(s)).slice(0, 2).map((s, i) => (
                  <span key={`o${i}`} className="sge-skill">{s}</span>
                ))}
              </div>
            )}
            <button type="button" className="sge-dispatch-btn" onClick={() => setDispatchTarget(engineer)}>
              Dispatch {engineer.name.split(' ')[0]}
            </button>
          </div>
        ))}
      </div>

      {dispatchTarget && (
        <DispatchEngineerModal
          breakdownId={job.breakdown_id}
          breakdownDepot={job.depot}
          breakdownLat={breakdownCoords?.[0] ?? null}
          breakdownLng={breakdownCoords?.[1] ?? null}
          preselectEngineerId={dispatchTarget.id}
          onDispatch={(dispatch) => { setDispatchTarget(null); if (onDispatch) onDispatch(dispatch); }}
          onClose={() => setDispatchTarget(null)}
        />
      )}

      <style>{sgeStyles}</style>
    </div>
  );
};

const sgeStyles = `
  .sge {
    background: rgba(0,151,167,0.05);
    border: 1px solid rgba(0,188,212,0.2);
    border-radius: 12px;
    padding: 12px 14px;
    margin-bottom: 12px;
  }

  .sge-head {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #22d3ee;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-bottom: 10px;
  }

  .sge-empty {
    margin: 0;
    font-size: 12px;
    color: #64748b;
  }

  .sge-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .sge-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 8px;
    padding: 8px 10px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .sge-card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .sge-name {
    font-size: 13px;
    font-weight: 700;
    color: #e2e8f0;
    font-family: var(--font-display, 'Outfit'), sans-serif;
  }

  .sge-distance {
    display: flex;
    align-items: center;
    gap: 3px;
    font-size: 11px;
    color: #94a3b8;
    font-family: var(--font-mono, 'JetBrains Mono'), monospace;
  }

  .sge-skills {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
  }

  .sge-skill {
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    padding: 2px 6px;
    border-radius: 3px;
    background: rgba(100,116,139,0.15);
    color: #94a3b8;
    border: 1px solid rgba(100,116,139,0.25);
  }

  .sge-skill-match {
    background: rgba(16,185,129,0.15);
    color: #34d399;
    border-color: rgba(16,185,129,0.3);
  }

  .sge-dispatch-btn {
    align-self: flex-start;
    margin-top: 2px;
    padding: 6px 14px;
    background: linear-gradient(135deg, #0097A7, #00838F);
    color: white;
    border: none;
    border-radius: 6px;
    font-family: var(--font-display, 'Outfit'), sans-serif;
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s;
  }

  .sge-dispatch-btn:hover {
    background: linear-gradient(135deg, #00ACC1, #0097A7);
    box-shadow: 0 4px 14px rgba(0,151,167,0.3);
  }
`;

export default SuggestedEngineerCard;
