/**
 * TodayDepots - breakdowns per depot today, busiest highlighted.
 *
 * Copyright © 2025 Anthony Gair. All Rights Reserved.
 */

import React from 'react';
import { Building2 } from 'lucide-react';

const TodayDepots = ({ depots }) => {
  const list = depots || [];
  const maxCount = list.reduce((max, d) => Math.max(max, d.count), 0);

  return (
    <div className="hp-card ts-card">
      <div className="hp-card-header">
        <Building2 size={14} />
        <h3 className="hp-card-title">Depots today</h3>
        <span className="hp-card-count">{list.length}</span>
      </div>

      <div className="ts-card-body">
        {list.length === 0 ? (
          <div className="ts-mini-empty">
            <p>No depot activity yet</p>
            <span>Breakdowns will be grouped by depot here.</span>
          </div>
        ) : (
          <div className="ts-rank-list">
            {list.map((depot, i) => (
              <div className={`ts-rank-row ${i === 0 ? 'ts-rank-row--top' : ''}`} key={depot.depot}>
                <span className="ts-rank-label ts-rank-label--wide">{depot.depot}</span>
                <div className="ts-rank-track">
                  <div
                    className={`ts-rank-fill ${i === 0 ? 'ts-rank-fill--top' : ''}`}
                    style={{ width: `${maxCount > 0 ? (depot.count / maxCount) * 100 : 0}%` }}
                  />
                </div>
                <span className="ts-rank-value">{depot.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TodayDepots;
