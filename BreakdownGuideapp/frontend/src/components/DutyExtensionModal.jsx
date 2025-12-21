/**
 * DutyExtensionModal Component
 * Phase 2.5: Request duty shift extensions
 *
 * Features:
 * - Duration selection (30, 60, 90, 120 minutes)
 * - Reason input
 * - Visual time preview
 * - Submit and cancel actions
 */

import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/api-client.js';
import './DutyExtensionModal.css';

const EXTENSION_OPTIONS = [
  { value: 30, label: '30 minutes', icon: '⏱️' },
  { value: 60, label: '1 hour', icon: '🕐' },
  { value: 90, label: '1.5 hours', icon: '🕜' },
  { value: 120, label: '2 hours', icon: '🕑' }
];

const DutyExtensionModal = ({
  isOpen,
  onClose,
  currentDuty,
  supervisorInfo,
  onExtensionRequested
}) => {
  const [selectedDuration, setSelectedDuration] = useState(60);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [newEndTime, setNewEndTime] = useState('');

  // Calculate new end time when duration changes
  useEffect(() => {
    if (currentDuty?.endTime && selectedDuration) {
      const [hourStr, minStr] = currentDuty.endTime.split(':');
      const originalEnd = new Date();
      originalEnd.setHours(parseInt(hourStr), parseInt(minStr), 0, 0);
      const newEnd = new Date(originalEnd.getTime() + selectedDuration * 60000);
      const formattedTime = `${String(newEnd.getHours()).padStart(2, '0')}:${String(newEnd.getMinutes()).padStart(2, '0')}`;
      setNewEndTime(formattedTime);
    }
  }, [currentDuty?.endTime, selectedDuration]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedDuration(60);
      setReason('');
      setError(null);
      setSuccess(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!reason.trim()) {
      setError('Please provide a reason for the extension request');
      return;
    }

    if (!supervisorInfo?.id || !currentDuty?.code) {
      setError('Missing supervisor or duty information');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await apiClient.post('/api/extensions/request', {
        supervisorId: supervisorInfo.id,
        supervisorBadge: supervisorInfo.badge,
        supervisorName: supervisorInfo.name,
        dutyCode: currentDuty.code,
        originalEndTime: currentDuty.endTime,
        extensionMinutes: selectedDuration,
        reason: reason.trim()
      });

      if (response.success) {
        setSuccess(true);
        if (onExtensionRequested) {
          onExtensionRequested(response);
        }
        // Auto-close after 2 seconds on success
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setError(response.error || 'Failed to submit extension request');
      }
    } catch (err) {
      console.error('Extension request error:', err);
      setError('Failed to submit extension request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="extension-modal-overlay" onClick={onClose}>
      <div className="extension-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="extension-modal__header">
          <div className="extension-modal__header-content">
            <span className="extension-modal__icon">⏰</span>
            <div>
              <h2 className="extension-modal__title">Request Shift Extension</h2>
              <p className="extension-modal__subtitle">Duty {currentDuty?.code} - {currentDuty?.endTime}</p>
            </div>
          </div>
          <button className="extension-modal__close" onClick={onClose}>✕</button>
        </div>

        {/* Success State */}
        {success ? (
          <div className="extension-modal__success">
            <span className="extension-modal__success-icon">✅</span>
            <h3>Extension Request Submitted</h3>
            <p>Your request for {selectedDuration} minutes has been submitted for approval.</p>
            <p className="extension-modal__success-time">New end time will be: {newEndTime}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Time Preview */}
            <div className="extension-modal__time-preview">
              <div className="extension-modal__time-block">
                <span className="extension-modal__time-label">Current End</span>
                <span className="extension-modal__time-value">{currentDuty?.endTime}</span>
              </div>
              <span className="extension-modal__time-arrow">→</span>
              <div className="extension-modal__time-block extension-modal__time-block--new">
                <span className="extension-modal__time-label">New End</span>
                <span className="extension-modal__time-value">{newEndTime}</span>
              </div>
            </div>

            {/* Duration Selection */}
            <div className="extension-modal__section">
              <label className="extension-modal__label">Extension Duration</label>
              <div className="extension-modal__duration-grid">
                {EXTENSION_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`extension-modal__duration-btn ${
                      selectedDuration === option.value ? 'extension-modal__duration-btn--selected' : ''
                    }`}
                    onClick={() => setSelectedDuration(option.value)}
                  >
                    <span className="extension-modal__duration-icon">{option.icon}</span>
                    <span className="extension-modal__duration-label">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Reason Input */}
            <div className="extension-modal__section">
              <label className="extension-modal__label" htmlFor="extension-reason">
                Reason for Extension <span className="extension-modal__required">*</span>
              </label>
              <textarea
                id="extension-reason"
                className="extension-modal__textarea"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="E.g., Handling ongoing breakdown, waiting for replacement vehicle, completing handover documentation..."
                rows={3}
                maxLength={500}
                required
              />
              <span className="extension-modal__char-count">{reason.length}/500</span>
            </div>

            {/* Error Message */}
            {error && (
              <div className="extension-modal__error">
                ⚠️ {error}
              </div>
            )}

            {/* Actions */}
            <div className="extension-modal__actions">
              <button
                type="button"
                className="extension-modal__btn extension-modal__btn--cancel"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="extension-modal__btn extension-modal__btn--submit"
                disabled={isSubmitting || !reason.trim()}
              >
                {isSubmitting ? '⏳ Submitting...' : '📝 Submit Request'}
              </button>
            </div>

            {/* Info Note */}
            <p className="extension-modal__note">
              Extension requests require approval from a supervisor or admin.
              You will be notified once your request is reviewed.
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default DutyExtensionModal;
