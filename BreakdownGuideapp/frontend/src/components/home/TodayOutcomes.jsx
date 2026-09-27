/**
 * TodayOutcomes - severity split (STOP/AMBER/CONTINUE) and resolved-vs-open
 * for today's breakdowns, as a compact stacked bar + numbers.
 *
 * Copyright © 2025 Anthony Gair. All Rights Reserved.
 */

import React from 'react';
import { PieChart } from 'lucide-react';

const SEVERITY_ROWS = [
  { key: 'STOP', label: 'STOP', className: 'ts-dot--stop' },
  { key: 'AMBER', label: 'AMBER', className: 'ts-dot--amber' },
  { key: 'CONTINUE', label: 'CONTINUE', className: 'ts-dot--cont' }
];

const TodayOutcomes = ({ outcomes }) => {
  const bySeverity = outcomes?.bySeverity;
  const resolved = outcomes?.resolved ?? 0;
  const open = outcomes?.open ?? 0;
  const total = resolved + open;
  const severityTotal = bySeverity
    ? bySeverity.STOP + bySeverity.AMBER + bySeverity.CONTINUE + bySeverity.other
    : 0;

  return (
    <div className="hp-card ts-card">
      <div className="hp-card-header">
        <PieChart size={14} />
        <h3 className="hp-card-title">Outcomes today</h3>
        <span className="hp-card-count">{total}</span>
      </div>

      <div className="ts-card-body">
        {total === 0 ? (
          <div className="ts-mini-empty">
            <p>No outcomes yet</p>
            <span>Nothing has been assessed today.</span>
          </div>
        ) : (
          <>
            <div className="ts-stackbar">
              {severityTotal > 0 && SEVERITY_ROWS.map((row) => {
                const count = bySeverity[row.key] || 0;
                if (count === 0) return null;
                return (
                  <div
                    key={row.key}
                    className={`ts-stackbar-seg ${row.className.replace('ts-dot', 'ts-fill')}`}
                    style={{ flexGrow: count }}
                    title={`${row.label}: ${count}`}
                  />
                );
              })}
              {bySeverity?.other > 0 && (
                <div className="ts-stackbar-seg ts-fill--other" style={{ flexGrow: bySeverity.other }} title={`Other: ${bySeverity.other}`} />
              )}
            </div>

            <div className="ts-legend-rows">
              {SEVERITY_ROWS.map((row) => (
                <div className="ts-legend-row" key={row.key}>
                  <i className={`ts-dot ${row.className}`} />
                  <span className="ts-legend-label">{row.label}</span>
                  <span className="ts-legend-value">{bySeverity?.[row.key] ?? 0}</span>
                </div>
              ))}
            </div>

            <div className="ts-divider" />

            <div className="ts-resolved-row">
              <div className="ts-resolved-bar">
                <div className="ts-resolved-fill" style={{ width: `${total > 0 ? (resolved / total) * 100 : 0}%` }} />
              </div>
              <div className="ts-resolved-numbers">
                <span><strong>{resolved}</strong> resolved</span>
                <span><strong>{open}</strong> open</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TodayOutcomes;
