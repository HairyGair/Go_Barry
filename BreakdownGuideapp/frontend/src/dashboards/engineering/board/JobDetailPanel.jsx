/**
 * Dispatch Board — right column: job detail + dispatch panel.
 *
 * Wraps the existing EngineeringCardEnhanced (dispatch, status update,
 * resolve, details modal, navigation, contact/vehicle/assessment drawer -
 * every action that used to live on the old list card) so no action is
 * dropped, and adds a "Suggested engineer" block above it for jobs that are
 * still awaiting dispatch.
 *
 * @author Anthony Gair
 * @license Proprietary
 */

import React from 'react';
import { ClipboardList } from 'lucide-react';
import EngineeringCardEnhanced from '../EngineeringCardEnhanced';
import SuggestedEngineerCard from './SuggestedEngineerCard';
import { deriveStage } from './dispatchBoardHelpers';

const JobDetailPanel = ({ job, engineers, jobs, onRefresh }) => {
  if (!job) {
    return (
      <section className="jdp-panel jdp-empty" aria-label="Job detail">
        <ClipboardList size={28} aria-hidden="true" />
        <p>Select a job to see details and dispatch actions</p>
        <style>{jdpStyles}</style>
      </section>
    );
  }

  const stage = deriveStage(job);

  return (
    <section className="jdp-panel" aria-label="Job detail">
      <div className="jdp-head">
        <span className="jdp-head-label">Job</span>
        <span className="jdp-head-fleet">{job.fleet_number || job.fleet_no || '--'}</span>
      </div>

      <div className="jdp-scroll">
        {stage === 'awaiting' && (
          <SuggestedEngineerCard job={job} engineers={engineers} jobs={jobs} onDispatch={onRefresh} />
        )}

        <EngineeringCardEnhanced
          breakdown={job}
          onJobAccepted={onRefresh}
          onStatusUpdated={onRefresh}
          onJobCompleted={onRefresh}
          onRefresh={onRefresh}
        />
      </div>

      <style>{jdpStyles}</style>
    </section>
  );
};

const jdpStyles = `
  .jdp-panel {
    display: flex;
    flex-direction: column;
    min-height: 0;
    background: rgba(15, 23, 42, 0.5);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 16px;
    overflow: hidden;
  }

  .jdp-empty {
    align-items: center;
    justify-content: center;
    gap: 10px;
    color: #64748b;
    text-align: center;
    padding: 24px;
  }

  .jdp-empty p { margin: 0; font-size: 13px; }

  .jdp-head {
    display: flex;
    align-items: baseline;
    gap: 8px;
    padding: 14px 16px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    flex-shrink: 0;
  }

  .jdp-head-label {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #64748b;
  }

  .jdp-head-fleet {
    font-family: var(--font-mono, 'JetBrains Mono'), monospace;
    font-size: 18px;
    font-weight: 800;
    color: #f1f5f9;
  }

  .jdp-scroll {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 12px;
  }
`;

export default JobDetailPanel;
