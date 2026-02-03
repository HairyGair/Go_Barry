/**
 * the operator - Breakdown Assessment Guide
 * Step 5: Issue Details Component
 *
 * Copyright (c) 2025 Anthony Gair. All rights reserved.
 */

import React, { useState, useEffect } from 'react';

// Common breakdown issues dropdown options
const commonIssues = [
  { value: 'wont_start', label: 'Won\'t start (non-starter)' },
  { value: 'puncture', label: 'Puncture/Flat tyre' },
  { value: 'engine_failure', label: 'Engine failure' },
  { value: 'brake_issue', label: 'Brake issue' },
  { value: 'electrical_fault', label: 'Electrical fault' },
  { value: 'door_fault', label: 'Door fault' },
  { value: 'other', label: 'Other (specify below)' }
];

const Step5IssueDetails = ({
  responses = {},
  onResponseChange,
  onNext,
  onPrevious,
  isValid,
  selectedVehicle,
  selectedRoute,
  routeName,
  breakdownLocation
}) => {
  // State management
  const [breakdownType, setBreakdownType] = useState(responses.breakdownType || '');
  const [issueDescription, setIssueDescription] = useState(responses.issueDescription || '');
  const [additionalDetails, setAdditionalDetails] = useState(responses.additionalDetails || '');
  const [driverComments, setDriverComments] = useState(responses.driverComments || '');

  // Update parent component when responses change
  useEffect(() => {
    if (onResponseChange) {
      onResponseChange({
        breakdownType,
        issueDescription,
        additionalDetails: breakdownType === 'other' ? additionalDetails : '',
        driverComments
      });
    }
  }, [breakdownType, issueDescription, additionalDetails, driverComments, onResponseChange]);

  // Validation
  const isStepValid = () => {
    const hasBreakdownType = breakdownType.trim() !== '';
    const hasDescription = issueDescription.trim() !== '';
    const hasAdditionalDetails = breakdownType !== 'other' || additionalDetails.trim() !== '';

    return hasBreakdownType && hasDescription && hasAdditionalDetails;
  };

  // Handle dropdown change
  const handleBreakdownTypeChange = (e) => {
    const value = e.target.value;
    setBreakdownType(value);

    // Clear additional details if not "other"
    if (value !== 'other') {
      setAdditionalDetails('');
    }
  };

  // Handle next step
  const handleNext = () => {
    if (isStepValid() && onNext) {
      onNext();
    }
  };

  return (
    <div className="step-container">
      <div className="step-header">
        <h2>Step 5: Issue Details</h2>
        <p className="step-description">
          Provide detailed information about the breakdown issue
        </p>
      </div>

      {/* Vehicle and Route Info Display */}
      <div className="vehicle-info-display">
        <div className="info-row">
          <span className="info-label">Vehicle:</span>
          <span className="info-value">{selectedVehicle || 'Not selected'}</span>
        </div>
        {selectedRoute && (
          <div className="info-row">
            <span className="info-label">Route:</span>
            <span className="info-value">
              <span className="route-badge">{selectedRoute}</span>
              {routeName && <span className="route-name">{routeName}</span>}
            </span>
          </div>
        )}
        {breakdownLocation && (
          <div className="info-row">
            <span className="info-label">Location:</span>
            <span className="info-value">{breakdownLocation}</span>
          </div>
        )}
      </div>

      <div className="step-content">
        {/* Breakdown Type Selection */}
        <div className="form-group">
          <label htmlFor="breakdown-type" className="form-label required">
            Type of breakdown:
          </label>
          <select
            id="breakdown-type"
            className="form-select"
            value={breakdownType}
            onChange={handleBreakdownTypeChange}
            required
          >
            <option value="">Select breakdown type...</option>
            {commonIssues.map(issue => (
              <option key={issue.value} value={issue.value}>
                {issue.label}
              </option>
            ))}
          </select>
        </div>

        {/* Additional Details for "Other" */}
        {breakdownType === 'other' && (
          <div className="form-group">
            <label htmlFor="additional-details" className="form-label required">
              Please specify the breakdown type:
            </label>
            <input
              type="text"
              id="additional-details"
              className="form-input"
              value={additionalDetails}
              onChange={(e) => setAdditionalDetails(e.target.value)}
              placeholder="Describe the specific issue..."
              required
            />
          </div>
        )}

        {/* Issue Description */}
        <div className="form-group">
          <label htmlFor="issue-description" className="form-label required">
            Detailed description of the issue:
          </label>
          <textarea
            id="issue-description"
            className="form-textarea"
            value={issueDescription}
            onChange={(e) => setIssueDescription(e.target.value)}
            placeholder="Provide a detailed description of what happened, symptoms observed, etc."
            rows={4}
            required
          />
          <small className="form-hint">
            Include symptoms, what the driver reported, any error messages, etc.
          </small>
        </div>

        {/* Driver Comments */}
        <div className="form-group">
          <label htmlFor="driver-comments" className="form-label">
            Driver comments (if any):
          </label>
          <textarea
            id="driver-comments"
            className="form-textarea"
            value={driverComments}
            onChange={(e) => setDriverComments(e.target.value)}
            placeholder="Any additional comments from the driver..."
            rows={3}
          />
          <small className="form-hint">
            Optional: Record any specific observations or concerns from the driver
          </small>
        </div>

        {/* Issue Summary Box */}
        {breakdownType && issueDescription && (
          <div className="issue-summary">
            <h4>Issue Summary:</h4>
            <div className="summary-content">
              <div className="summary-row">
                <strong>Type:</strong>
                <span>
                  {breakdownType === 'other'
                    ? additionalDetails
                    : commonIssues.find(issue => issue.value === breakdownType)?.label
                  }
                </span>
              </div>
              <div className="summary-row">
                <strong>Description:</strong>
                <span>{issueDescription}</span>
              </div>
              {driverComments && (
                <div className="summary-row">
                  <strong>Driver Comments:</strong>
                  <span>{driverComments}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="step-navigation">
        <button
          type="button"
          onClick={onPrevious}
          className="btn btn-secondary"
        >
          ← Previous
        </button>

        <button
          type="button"
          onClick={handleNext}
          className={`btn btn-primary ${!isStepValid() ? 'btn-disabled' : ''}`}
          disabled={!isStepValid()}
        >
          Next: Assessment Decision →
        </button>
      </div>

      {/* Validation Message */}
      {!isStepValid() && breakdownType && (
        <div className="validation-message">
          {!breakdownType && <p>• Please select a breakdown type</p>}
          {!issueDescription.trim() && <p>• Please provide a detailed description</p>}
          {breakdownType === 'other' && !additionalDetails.trim() && (
            <p>• Please specify the breakdown type for "Other"</p>
          )}
        </div>
      )}

      {/* Help Text */}
      <div className="help-section">
        <h4>Guidelines:</h4>
        <ul>
          <li><strong>Be specific:</strong> Include as much detail as possible about the issue</li>
          <li><strong>Symptoms:</strong> Describe what you can see, hear, or observe</li>
          <li><strong>Driver feedback:</strong> Record exactly what the driver reported</li>
          <li><strong>Error messages:</strong> Note any dashboard warnings or error codes</li>
        </ul>
      </div>
    </div>
  );
};

export default Step5IssueDetails;