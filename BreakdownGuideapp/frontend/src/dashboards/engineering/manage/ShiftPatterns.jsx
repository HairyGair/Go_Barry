/**
 * Engineer Management — Shift patterns
 *
 * Reusable shift times (Early, Late, Night...) used at check-in. Each card shows
 * where the pattern sits in the day, its length, depot scope and how many
 * engineers are on it today.
 *
 * @author Anthony Gair
 * @license Proprietary
 */

import React, { useState } from 'react';
import { Pencil, Trash2, Clock, Plus } from 'lucide-react';
import { depotLabel, hhmm, shiftHours, shiftSegments } from './manageHelpers';

const ShiftPatterns = ({ templates, roster, onAdd, onEdit, onDelete }) => {
  const [confirmId, setConfirmId] = useState(null);

  if (templates.length === 0) {
    return (
      <div className="emg-empty">
        <h3>No shift patterns yet</h3>
        <p>Save the shifts your engineers usually work, such as Early 06:00–14:00 or Late 14:00–22:00, so check-in takes one click.</p>
        <button type="button" className="emg-btn emg-btn-primary" onClick={onAdd}>
          <Plus size={15} aria-hidden="true" /> Add shift pattern
        </button>
      </div>
    );
  }

  return (
    <div className="emg-patterns">
      {templates.map(t => {
        const onIt = roster.filter(r => String(r.shift_template_id) === String(t.id)).length;
        const hours = shiftHours(t.start_time, t.end_time);
        return (
          <div key={t.id} className="emg-pattern">
            <div className="emg-pattern-top">
              <div>
                <div className="emg-pattern-name">{t.name}</div>
                <div className="emg-pattern-time">
                  <Clock size={12} aria-hidden="true" />
                  {hhmm(t.start_time)}–{hhmm(t.end_time)}
                  {hours !== null && <span className="emg-muted"> · {hours}h</span>}
                </div>
              </div>
              <div className="emg-pattern-actions">
                {confirmId === t.id ? (
                  <span className="emg-inline-confirm">
                    <span className="emg-muted emg-small">Delete?</span>
                    <button type="button" className="emg-link emg-link-danger" onClick={() => { setConfirmId(null); onDelete(t); }}>Yes</button>
                    <button type="button" className="emg-link" onClick={() => setConfirmId(null)}>No</button>
                  </span>
                ) : (
                  <>
                    <button type="button" className="emg-icon-btn" onClick={() => onEdit(t)} aria-label={`Edit ${t.name}`} title="Edit">
                      <Pencil size={14} />
                    </button>
                    <button type="button" className="emg-icon-btn emg-icon-danger" onClick={() => setConfirmId(t.id)} aria-label={`Delete ${t.name}`} title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="emg-daybar" aria-hidden="true">
              {shiftSegments(t.start_time, t.end_time).map(([a, b], i) => (
                <span key={i} className="emg-daybar-fill" style={{ left: `${(a / 1440) * 100}%`, width: `${((b - a) / 1440) * 100}%` }} />
              ))}
            </div>
            <div className="emg-daybar-axis" aria-hidden="true"><span>00</span><span>06</span><span>12</span><span>18</span><span>24</span></div>

            <div className="emg-pattern-foot">
              <span>{t.depot_code ? depotLabel(t.depot_code) : 'All depots'}</span>
              <span>{onIt} engineer{onIt === 1 ? '' : 's'} on it today</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ShiftPatterns;
