/**
 * TodayTopIssues - issue categories ranked by count for today.
 *
 * Copyright © 2025 Anthony Gair. All Rights Reserved.
 */

import React from 'react';
import { ListOrdered } from 'lucide-react';

const TodayTopIssues = ({ topIssues }) => {
  const issues = topIssues || [];
  const maxCount = issues.reduce((max, i) => Math.max(max, i.count), 0);

  return (
    <div className="hp-card ts-card">
      <div className="hp-card-header">
        <ListOrdered size={14} />
        <h3 className="hp-card-title">Top issues today</h3>
        <span className="hp-card-count">{issues.length}</span>
      </div>

      <div className="ts-card-body">
        {issues.length === 0 ? (
          <div className="ts-mini-empty">
            <p>No issues logged yet</p>
            <span>Categories will rank here as breakdowns come in.</span>
          </div>
        ) : (
          <div className="ts-rank-list">
            {issues.map((issue, i) => (
              <div className="ts-rank-row" key={issue.category}>
                <span className="ts-rank-index">{i + 1}</span>
                <span className="ts-rank-label">{issue.category}</span>
                <div className="ts-rank-track">
                  <div
                    className="ts-rank-fill"
                    style={{ width: `${maxCount > 0 ? (issue.count / maxCount) * 100 : 0}%` }}
                  />
                </div>
                <span className="ts-rank-value">{issue.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TodayTopIssues;
