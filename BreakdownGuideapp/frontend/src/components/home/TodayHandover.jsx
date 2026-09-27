/**
 * TodayHandover - today's shift/handover notes, if any exist. Renders
 * nothing (the caller skips the whole card) when there's no real data -
 * see HomePage.jsx, which only mounts this when handoverNotes is non-null.
 *
 * Copyright © 2025 Anthony Gair. All Rights Reserved.
 */

import React from 'react';
import { NotebookPen, Star } from 'lucide-react';

const formatTime = (iso) => {
  try {
    return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
};

const TodayHandover = ({ notes }) => {
  if (!notes || notes.length === 0) return null;

  return (
    <div className="hp-card ts-card">
      <div className="hp-card-header">
        <NotebookPen size={14} />
        <h3 className="hp-card-title">Handover &amp; notes</h3>
        <span className="hp-card-count">{notes.length}</span>
      </div>

      <div className="ts-card-body ts-handover-body">
        {notes.map((n) => (
          <div className={`ts-handover-note ${n.priority ? 'ts-handover-note--priority' : ''}`} key={n.id}>
            {n.priority && <Star size={12} className="ts-handover-star" />}
            <p className="ts-handover-text">{n.note}</p>
            <span className="ts-handover-meta">
              {n.supervisorName || 'Supervisor'}{n.dutyCode ? ` · Duty ${n.dutyCode}` : ''} · {formatTime(n.createdAt)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TodayHandover;
