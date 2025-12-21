/**
 * DutyHandoverModal Component
 * Enables supervisors to hand over active breakdowns at shift end
 *
 * Features:
 * - Shows list of active breakdowns
 * - Select individual breakdowns to hand over
 * - Add handover notes for each breakdown
 * - Select incoming supervisor or leave for next shift
 * - Generate handover summary
 * - Activity log entries for handovers
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import './DutyHandoverModal.css';

const DutyHandoverModal = ({
  isOpen,
  onClose,
  currentDuty,
  onHandoverComplete
}) => {
  const { currentUser } = useAuth();
  const [activeBreakdowns, setActiveBreakdowns] = useState([]);
  const [selectedBreakdowns, setSelectedBreakdowns] = useState([]);
  const [handoverNotes, setHandoverNotes] = useState({});
  const [generalNotes, setGeneralNotes] = useState('');
  const [incomingSupervisor, setIncomingSupervisor] = useState('next_shift');
  const [supervisors, setSupervisors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(1); // 1: Select breakdowns, 2: Add notes, 3: Confirm

  const API_URL = import.meta.env.VITE_API_URL || 'https://api.breakdowns.gobarry.co.uk';

  // Fetch active breakdowns on mount
  useEffect(() => {
    if (isOpen) {
      fetchActiveBreakdowns();
      fetchSupervisors();
    }
  }, [isOpen]);

  const fetchActiveBreakdowns = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/breakdowns?status=active`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch breakdowns');
      }

      const data = await response.json();
      const breakdowns = data.data || data.breakdowns || [];

      // Filter to only breakdowns created/handled during current duty
      const dutyBreakdowns = breakdowns.filter(b => {
        // Include breakdowns where this supervisor was involved
        return b.supervisor_badge === currentUser?.badge_number ||
               b.supervisor_name === currentUser?.name ||
               !b.supervisor_badge; // Also include unassigned
      });

      setActiveBreakdowns(dutyBreakdowns);
      // Auto-select all by default
      setSelectedBreakdowns(dutyBreakdowns.map(b => b.id || b.breakdown_id));
    } catch (err) {
      console.error('Error fetching breakdowns:', err);
      setError('Unable to load active breakdowns');
      setActiveBreakdowns([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSupervisors = async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/supervisors`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        // Filter out current user
        const otherSupervisors = (data.supervisors || []).filter(
          s => s.badge_number !== currentUser?.badge_number
        );
        setSupervisors(otherSupervisors);
      }
    } catch (err) {
      console.error('Error fetching supervisors:', err);
      setSupervisors([]);
    }
  };

  const toggleBreakdownSelection = (breakdownId) => {
    setSelectedBreakdowns(prev => {
      if (prev.includes(breakdownId)) {
        return prev.filter(id => id !== breakdownId);
      } else {
        return [...prev, breakdownId];
      }
    });
  };

  const selectAll = () => {
    setSelectedBreakdowns(activeBreakdowns.map(b => b.id || b.breakdown_id));
  };

  const selectNone = () => {
    setSelectedBreakdowns([]);
  };

  const updateBreakdownNote = (breakdownId, note) => {
    setHandoverNotes(prev => ({
      ...prev,
      [breakdownId]: note
    }));
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toUpperCase()) {
      case 'STOP':
      case 'CRITICAL':
        return '#EF4444';
      case 'AMBER':
      case 'WARNING':
        return '#F59E0B';
      default:
        return '#10B981';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity?.toUpperCase()) {
      case 'STOP':
      case 'CRITICAL':
        return '🚨';
      case 'AMBER':
      case 'WARNING':
        return '⚠️';
      default:
        return '✅';
    }
  };

  const formatTimeAgo = (date) => {
    if (!date) return 'Unknown';
    const now = new Date();
    const created = new Date(date);
    const diffMs = now - created;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffHours > 0) {
      return `${diffHours}h ${diffMins % 60}m ago`;
    }
    return `${diffMins}m ago`;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const handoverData = {
        outgoing_supervisor: {
          id: currentUser?.id,
          badge: currentUser?.badge_number,
          name: currentUser?.name,
          duty: currentDuty?.code
        },
        incoming_supervisor: incomingSupervisor === 'next_shift' ? null : {
          badge: incomingSupervisor
        },
        breakdowns: selectedBreakdowns.map(id => {
          const breakdown = activeBreakdowns.find(b => (b.id || b.breakdown_id) === id);
          return {
            id: id,
            breakdown_id: breakdown?.breakdown_id,
            fleet_no: breakdown?.fleet_no,
            issue_category: breakdown?.issue_category,
            severity: breakdown?.severity || breakdown?.wizard_decision,
            note: handoverNotes[id] || ''
          };
        }),
        general_notes: generalNotes,
        handover_time: new Date().toISOString(),
        duty_code: currentDuty?.code,
        duty_end_time: currentDuty?.endTime
      };

      const response = await fetch(`${API_URL}/api/duty/handover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(handoverData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit handover');
      }

      const result = await response.json();

      // Success - notify parent and close
      if (onHandoverComplete) {
        onHandoverComplete(result);
      }

      onClose();

    } catch (err) {
      console.error('Error submitting handover:', err);
      setError(err.message || 'Failed to submit handover');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <div className="handover-step handover-step--selection">
      <h3>Select Breakdowns to Hand Over</h3>
      <p className="handover-description">
        Choose which active breakdowns to include in your handover.
      </p>

      {activeBreakdowns.length === 0 ? (
        <div className="handover-empty">
          <span className="handover-empty__icon">✨</span>
          <p>No active breakdowns to hand over!</p>
          <p className="handover-empty__sub">You can close this and end your shift.</p>
        </div>
      ) : (
        <>
          <div className="handover-actions">
            <button className="handover-action-btn" onClick={selectAll}>
              Select All ({activeBreakdowns.length})
            </button>
            <button className="handover-action-btn" onClick={selectNone}>
              Deselect All
            </button>
          </div>

          <div className="handover-breakdown-list">
            {activeBreakdowns.map(breakdown => {
              const id = breakdown.id || breakdown.breakdown_id;
              const isSelected = selectedBreakdowns.includes(id);

              return (
                <div
                  key={id}
                  className={`handover-breakdown-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => toggleBreakdownSelection(id)}
                >
                  <div className="handover-breakdown-checkbox">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleBreakdownSelection(id)}
                    />
                  </div>
                  <div className="handover-breakdown-info">
                    <div className="handover-breakdown-header">
                      <span className="handover-breakdown-fleet">
                        {breakdown.fleet_no || 'Unknown'}
                      </span>
                      <span
                        className="handover-breakdown-severity"
                        style={{ backgroundColor: getSeverityColor(breakdown.severity || breakdown.wizard_decision) }}
                      >
                        {getSeverityIcon(breakdown.severity || breakdown.wizard_decision)}
                        {breakdown.severity || breakdown.wizard_decision || 'PENDING'}
                      </span>
                    </div>
                    <p className="handover-breakdown-issue">
                      {breakdown.issue_category || breakdown.wizard_type || 'General Issue'}
                    </p>
                    <p className="handover-breakdown-location">
                      📍 {breakdown.location || breakdown.location_description || 'Location not specified'}
                    </p>
                    <p className="handover-breakdown-time">
                      ⏱️ {formatTimeAgo(breakdown.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="handover-step handover-step--notes">
      <h3>Add Handover Notes</h3>
      <p className="handover-description">
        Add specific notes for each breakdown and any general shift notes.
      </p>

      <div className="handover-general-notes">
        <label htmlFor="general-notes">General Shift Notes</label>
        <textarea
          id="general-notes"
          value={generalNotes}
          onChange={(e) => setGeneralNotes(e.target.value)}
          placeholder="Any important information for the incoming supervisor..."
          rows={3}
        />
      </div>

      <div className="handover-breakdown-notes">
        <h4>Breakdown-Specific Notes ({selectedBreakdowns.length})</h4>
        {selectedBreakdowns.map(id => {
          const breakdown = activeBreakdowns.find(b => (b.id || b.breakdown_id) === id);
          if (!breakdown) return null;

          return (
            <div key={id} className="handover-note-item">
              <div className="handover-note-header">
                <span className="handover-note-fleet">{breakdown.fleet_no || 'Unknown'}</span>
                <span className="handover-note-issue">
                  {breakdown.issue_category || 'General'}
                </span>
              </div>
              <textarea
                value={handoverNotes[id] || ''}
                onChange={(e) => updateBreakdownNote(id, e.target.value)}
                placeholder={`Notes for ${breakdown.fleet_no}...`}
                rows={2}
              />
            </div>
          );
        })}
      </div>

      <div className="handover-supervisor-select">
        <label htmlFor="incoming-supervisor">Hand Over To</label>
        <select
          id="incoming-supervisor"
          value={incomingSupervisor}
          onChange={(e) => setIncomingSupervisor(e.target.value)}
        >
          <option value="next_shift">Next Shift Supervisor</option>
          {supervisors.map(sup => (
            <option key={sup.badge_number} value={sup.badge_number}>
              {sup.name} ({sup.badge_number})
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  const renderStep3 = () => {
    const incomingSup = supervisors.find(s => s.badge_number === incomingSupervisor);

    return (
      <div className="handover-step handover-step--confirm">
        <h3>Confirm Handover</h3>
        <p className="handover-description">
          Review your handover details before submitting.
        </p>

        <div className="handover-summary">
          <div className="handover-summary-section">
            <h4>Outgoing Supervisor</h4>
            <p>
              <strong>{currentUser?.name}</strong> ({currentUser?.badge_number})
              <br />
              Duty {currentDuty?.code} • {currentDuty?.startTime} - {currentDuty?.endTime}
            </p>
          </div>

          <div className="handover-summary-section">
            <h4>Incoming Supervisor</h4>
            <p>
              {incomingSupervisor === 'next_shift' ? (
                <em>Next Shift Supervisor (unassigned)</em>
              ) : (
                <strong>{incomingSup?.name || incomingSupervisor}</strong>
              )}
            </p>
          </div>

          <div className="handover-summary-section">
            <h4>Breakdowns ({selectedBreakdowns.length})</h4>
            <ul className="handover-summary-list">
              {selectedBreakdowns.map(id => {
                const breakdown = activeBreakdowns.find(b => (b.id || b.breakdown_id) === id);
                return (
                  <li key={id}>
                    <span style={{ color: getSeverityColor(breakdown?.severity) }}>
                      {getSeverityIcon(breakdown?.severity)}
                    </span>
                    {breakdown?.fleet_no} - {breakdown?.issue_category || 'General'}
                    {handoverNotes[id] && (
                      <span className="handover-summary-note">
                        📝 "{handoverNotes[id].substring(0, 50)}..."
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {generalNotes && (
            <div className="handover-summary-section">
              <h4>General Notes</h4>
              <p className="handover-summary-general-notes">{generalNotes}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="handover-modal-overlay" onClick={onClose}>
      <div className="handover-modal" onClick={(e) => e.stopPropagation()}>
        <div className="handover-modal__header">
          <div className="handover-modal__title">
            <span className="handover-modal__icon">🔄</span>
            <h2>Shift Handover</h2>
          </div>
          <button className="handover-modal__close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="handover-modal__progress">
          <div className={`handover-progress-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
            <span className="handover-progress-number">1</span>
            <span className="handover-progress-label">Select</span>
          </div>
          <div className="handover-progress-line"></div>
          <div className={`handover-progress-step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
            <span className="handover-progress-number">2</span>
            <span className="handover-progress-label">Notes</span>
          </div>
          <div className="handover-progress-line"></div>
          <div className={`handover-progress-step ${step >= 3 ? 'active' : ''}`}>
            <span className="handover-progress-number">3</span>
            <span className="handover-progress-label">Confirm</span>
          </div>
        </div>

        <div className="handover-modal__body">
          {error && (
            <div className="handover-error">
              <span>⚠️</span> {error}
            </div>
          )}

          {isLoading ? (
            <div className="handover-loading">
              <div className="handover-spinner"></div>
              <p>Loading breakdowns...</p>
            </div>
          ) : (
            <>
              {step === 1 && renderStep1()}
              {step === 2 && renderStep2()}
              {step === 3 && renderStep3()}
            </>
          )}
        </div>

        <div className="handover-modal__footer">
          {step > 1 && (
            <button
              className="handover-btn handover-btn--secondary"
              onClick={() => setStep(step - 1)}
              disabled={isSubmitting}
            >
              ← Back
            </button>
          )}

          <div className="handover-footer-spacer"></div>

          {step < 3 ? (
            <button
              className="handover-btn handover-btn--primary"
              onClick={() => setStep(step + 1)}
              disabled={step === 1 && selectedBreakdowns.length === 0 && activeBreakdowns.length > 0}
            >
              Next →
            </button>
          ) : (
            <button
              className="handover-btn handover-btn--success"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="handover-btn-spinner"></span>
                  Submitting...
                </>
              ) : (
                <>✓ Complete Handover</>
              )}
            </button>
          )}

          {(activeBreakdowns.length === 0 || step === 1) && (
            <button
              className="handover-btn handover-btn--outline"
              onClick={onClose}
            >
              {activeBreakdowns.length === 0 ? 'Close' : 'Skip Handover'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DutyHandoverModal;
