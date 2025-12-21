/**
 * QuickDecisionButtons Component
 * One-click decision buttons for fast breakdown triage
 * Allows supervisors to quickly mark STOP/AMBER/CONTINUE without opening a modal
 */

import React, { useState } from 'react';
import { apiClient } from '../../services/api-client';
import './QuickDecisionButtons.css';

const QuickDecisionButtons = ({
  breakdownId,
  currentDecision,
  onDecisionMade,
  disabled = false,
  compact = false
}) => {
  const [loading, setLoading] = useState(false);
  const [confirmingDecision, setConfirmingDecision] = useState(null);
  const [error, setError] = useState(null);

  const decisions = [
    {
      type: 'STOP',
      icon: '🛑',
      label: 'STOP',
      color: '#dc2626',
      bgColor: 'rgba(220, 38, 38, 0.15)',
      description: 'Vehicle must stop immediately - not safe to continue',
      shortcut: 'S'
    },
    {
      type: 'AMBER',
      icon: '⚠️',
      label: 'AMBER',
      color: '#f59e0b',
      bgColor: 'rgba(245, 158, 11, 0.15)',
      description: 'Monitor closely - can continue with caution',
      shortcut: 'A'
    },
    {
      type: 'CONTINUE',
      icon: '✅',
      label: 'CONTINUE',
      color: '#22c55e',
      bgColor: 'rgba(34, 197, 94, 0.15)',
      description: 'Safe to continue journey as normal',
      shortcut: 'C'
    }
  ];

  const handleDecisionClick = async (decision) => {
    // If already this decision, do nothing
    if (currentDecision === decision.type) {
      return;
    }

    // If confirmation is showing for a different decision, hide it
    if (confirmingDecision && confirmingDecision !== decision.type) {
      setConfirmingDecision(null);
      return;
    }

    // First click: show confirmation
    if (!confirmingDecision) {
      setConfirmingDecision(decision.type);
      // Auto-hide confirmation after 3 seconds
      setTimeout(() => {
        setConfirmingDecision(prev => prev === decision.type ? null : prev);
      }, 3000);
      return;
    }

    // Second click: make the decision
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.patch(`/api/breakdowns/${breakdownId}/decision`, {
        decision: decision.type,
        quick_decision: true
      });

      if (response.data?.success) {
        setConfirmingDecision(null);
        if (onDecisionMade) {
          onDecisionMade(decision.type, response.data);
        }
      } else {
        throw new Error(response.data?.error || 'Failed to update decision');
      }
    } catch (err) {
      console.error('Quick decision error:', err);
      setError(err.message || 'Failed to update decision');
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e) => {
    if (disabled || loading) return;

    const key = e.key.toUpperCase();
    const decision = decisions.find(d => d.shortcut === key);
    if (decision) {
      e.preventDefault();
      handleDecisionClick(decision);
    }
  };

  return (
    <div
      className={`quick-decision-buttons ${compact ? 'compact' : ''}`}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="group"
      aria-label="Quick decision buttons"
    >
      {error && (
        <div className="quick-decision-error">
          {error}
        </div>
      )}

      <div className="quick-decision-buttons__row">
        {decisions.map(decision => {
          const isActive = currentDecision === decision.type;
          const isConfirming = confirmingDecision === decision.type;

          return (
            <button
              key={decision.type}
              className={`quick-decision-btn ${isActive ? 'active' : ''} ${isConfirming ? 'confirming' : ''}`}
              style={{
                '--decision-color': decision.color,
                '--decision-bg': decision.bgColor
              }}
              onClick={() => handleDecisionClick(decision)}
              disabled={disabled || loading}
              title={`${decision.description} (Press ${decision.shortcut})`}
              aria-pressed={isActive}
            >
              <span className="quick-decision-btn__icon">{decision.icon}</span>
              {!compact && (
                <span className="quick-decision-btn__label">{decision.label}</span>
              )}
              {isConfirming && (
                <span className="quick-decision-btn__confirm">
                  Click again to confirm
                </span>
              )}
              {isActive && (
                <span className="quick-decision-btn__active-indicator">
                  Current
                </span>
              )}
            </button>
          );
        })}
      </div>

      {!compact && (
        <div className="quick-decision-buttons__hint">
          <span className="hint-text">
            Keyboard: <kbd>S</kbd> STOP <kbd>A</kbd> AMBER <kbd>C</kbd> CONTINUE
          </span>
        </div>
      )}
    </div>
  );
};

export default QuickDecisionButtons;
