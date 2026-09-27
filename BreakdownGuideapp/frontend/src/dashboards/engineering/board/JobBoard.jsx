/**
 * Dispatch Board — centre column: job board by stage.
 *
 * Awaiting dispatch -> En route -> On site -> Done today, each a scrollable
 * column of compact job cards with a live count. Supports basic keyboard
 * navigation (arrow keys) once a card has focus/selection.
 *
 * @author Anthony Gair
 * @license Proprietary
 */

import React, { useMemo, useRef } from 'react';
import { ClipboardList, Truck, Wrench, CheckCircle2 } from 'lucide-react';
import JobCard from './JobCard';
import { deriveStage, isCompletedToday } from './dispatchBoardHelpers';

const COLUMNS = [
  { stage: 'awaiting', label: 'Awaiting Dispatch', Icon: ClipboardList },
  { stage: 'en_route', label: 'En Route', Icon: Truck },
  { stage: 'on_site', label: 'On Site', Icon: Wrench },
  { stage: 'done', label: 'Done Today', Icon: CheckCircle2 }
];

const JobBoard = ({ jobs, selectedJobId, onSelectJob }) => {
  const byStage = useMemo(() => {
    const groups = { awaiting: [], en_route: [], on_site: [], done: [] };
    jobs.forEach(job => {
      const stage = deriveStage(job);
      if (stage === 'done') {
        if (isCompletedToday(job)) groups.done.push(job);
        return;
      }
      groups[stage].push(job);
    });
    // Most urgent first within each active column (STOP > AMBER > CONTINUE, then longest elapsed)
    const rank = (j) => {
      const key = (j.severity || j.wizard_decision || '').toUpperCase();
      return key === 'STOP' ? 2 : key === 'AMBER' ? 1 : 0;
    };
    ['awaiting', 'en_route', 'on_site'].forEach(stage => {
      groups[stage].sort((a, b) => rank(b) - rank(a) || (b.elapsed_minutes || 0) - (a.elapsed_minutes || 0));
    });
    groups.done.sort((a, b) => new Date(b.cleared_at || b.engineer_completed_at || b.created_at) - new Date(a.cleared_at || a.engineer_completed_at || a.created_at));
    return groups;
  }, [jobs]);

  const colRefs = useRef({});

  const handleKeyDown = (e, stage) => {
    if (!['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    e.preventDefault();
    const stages = COLUMNS.map(c => c.stage);
    const stageIndex = stages.indexOf(stage);

    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      const dir = e.key === 'ArrowLeft' ? -1 : 1;
      const nextStage = stages[Math.min(stages.length - 1, Math.max(0, stageIndex + dir))];
      const first = byStage[nextStage][0];
      if (first) onSelectJob(first);
      return;
    }

    const list = byStage[stage];
    const currentIndex = list.findIndex(j => j.breakdown_id === selectedJobId);
    const dir = e.key === 'ArrowDown' ? 1 : -1;
    const nextIndex = currentIndex === -1 ? 0 : Math.min(list.length - 1, Math.max(0, currentIndex + dir));
    if (list[nextIndex]) onSelectJob(list[nextIndex]);
  };

  return (
    <section className="jbd-board" aria-label="Job board">
      {COLUMNS.map(({ stage, label, Icon }) => (
        <div
          key={stage}
          className="jbd-col"
          ref={el => { colRefs.current[stage] = el; }}
          onKeyDown={(e) => handleKeyDown(e, stage)}
          tabIndex={0}
          role="listbox"
          aria-label={label}
        >
          <div className="jbd-col-head">
            <Icon size={14} aria-hidden="true" />
            <span className="jbd-col-label">{label}</span>
            <span className="jbd-col-count">{byStage[stage].length}</span>
          </div>
          <div className="jbd-col-scroll">
            {byStage[stage].length === 0 ? (
              <div className="jbd-col-empty">Nothing here</div>
            ) : (
              byStage[stage].map(job => (
                <JobCard
                  key={job.breakdown_id}
                  job={job}
                  stage={stage}
                  isSelected={selectedJobId === job.breakdown_id}
                  onSelect={onSelectJob}
                />
              ))
            )}
          </div>
        </div>
      ))}

      <style>{`
        .jbd-board {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
          min-height: 0;
          height: 100%;
        }

        .jbd-col {
          display: flex;
          flex-direction: column;
          min-height: 0;
          background: rgba(15, 23, 42, 0.5);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px;
          overflow: hidden;
        }

        .jbd-col:focus-visible {
          outline: 2px solid #22d3ee;
          outline-offset: -2px;
        }

        .jbd-col-head {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 12px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          color: #94a3b8;
        }

        .jbd-col-label {
          flex: 1;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .jbd-col-count {
          font-family: var(--font-mono, 'JetBrains Mono'), monospace;
          font-size: 12px;
          font-weight: 700;
          color: #cbd5e1;
          background: rgba(255,255,255,0.06);
          padding: 1px 7px;
          border-radius: 10px;
        }

        .jbd-col-scroll {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          padding: 8px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .jbd-col-empty {
          text-align: center;
          padding: 20px 8px;
          font-size: 12px;
          color: #475569;
        }

        @media (max-width: 1439px) {
          .jbd-board { grid-template-columns: repeat(2, minmax(0, 1fr)); grid-template-rows: repeat(2, minmax(0, 1fr)); }
        }
      `}</style>
    </section>
  );
};

export default JobBoard;
