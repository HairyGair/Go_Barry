/**
 * Go North East - Breakdown Assessment Guide
 * Step 7: Final Submission Component
 *
 * Copyright (c) 2025 Anthony Gair. All rights reserved.
 */

import React, { useState } from 'react';
import storageService from '../../services/storageService';
import { authHelpers } from '../../services/supabase-client';

const Step7Submit = ({
  responses = {},
  fleetData = {},
  locationData = {},
  assessmentData = {},
  issueData = {},
  supervisorData = {},
  onSubmissionComplete,
  onPrevious,
  selectedVehicle,
  selectedRoute,
  routeName,
  breakdownLocation
}) => {
  // State management
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState(null); // 'success', 'error', null
  const [errorMessage, setErrorMessage] = useState('');
  const [submissionId, setSubmissionId] = useState(null);

  // Prepare comprehensive submission data
  const prepareSubmissionData = () => {
    const timestamp = new Date().toISOString();

    return {
      // Basic Information
      id: `breakdown_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp,
      reportedAt: timestamp,

      // Fleet Information
      fleetNumber: fleetData.fleetNumber || selectedVehicle,
      route: fleetData.route || selectedRoute,
      routeName: fleetData.routeName || routeName,
      depot: fleetData.depot,

      // Location Information
      locationDescription: locationData.description || breakdownLocation,
      locationCoordinates: locationData.coordinates,
      useGPS: locationData.useGPS || false,

      // Assessment Information
      passengersOnBoard: assessmentData.passengersOnBoard,
      safetyChecks: assessmentData.safetyChecks,
      visualInspection: assessmentData.visualInspection,
      initialObservations: assessmentData.initialObservations,

      // Issue Details
      issueType: issueData.breakdownType || issueData.issueType,
      issueDescription: issueData.issueDescription,
      additionalDetails: issueData.additionalDetails,
      driverComments: issueData.driverComments,

      // Decision and Action
      decision: responses.decision,
      actionTaken: responses.actionTaken,
      notes: responses.notes,
      engineerAssigned: false,
      estimatedRepairTime: responses.estimatedRepairTime,

      // Supervisor Information
      reportedBy: supervisorData?.name || supervisorData?.supervisorName || 'Unknown Supervisor',
      supervisorId: supervisorData?.id || supervisorData?.supervisorId,
      supervisorDepot: supervisorData?.depot,

      // Status and Priority
      status: 'reported',
      priority: responses.priority || 'normal',
      severity: responses.severity || 'medium',

      // Metadata
      submittedFrom: 'breakdown_guide',
      userAgent: navigator.userAgent,
      sessionId: sessionStorage.getItem('session_id') || 'unknown'
    };
  };

  // Submit to backend API
  const submitToBackend = async (submissionData) => {
    try {
      const response = await fetch('/api/breakdowns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return { success: true, data: result };
    } catch (error) {
      console.error('Backend submission error:', error);
      return { success: false, error: error.message };
    }
  };

  // Submit to Supabase with proper field mapping
  const submitToSupabase = async (submissionData) => {
    try {
      // Map our data to Supabase column names
      const supabaseData = {
        // Basic Information
        id: submissionData.id,
        timestamp: submissionData.timestamp,
        reported_at: submissionData.reportedAt,

        // Fleet Information (new fields)
        fleet_number: submissionData.fleetNumber,
        route_number: submissionData.route,
        route_name: submissionData.routeName,
        depot: submissionData.depot,

        // Location Information (new fields)
        location_description: submissionData.locationDescription,
        location_coordinates: submissionData.locationCoordinates ?
          JSON.stringify(submissionData.locationCoordinates) : null,
        location_lat: submissionData.locationCoordinates?.lat || null,
        location_lng: submissionData.locationCoordinates?.lng || null,
        use_gps: submissionData.useGPS || false,

        // Assessment Information (new fields)
        passengers_on_board: submissionData.passengersOnBoard,
        safety_checks: submissionData.safetyChecks ? JSON.stringify(submissionData.safetyChecks) : null,
        visual_inspection: submissionData.visualInspection ? JSON.stringify(submissionData.visualInspection) : null,
        initial_observations: submissionData.initialObservations,

        // Issue Details (enhanced fields)
        issue_type: submissionData.issueType,
        issue_description: submissionData.issueDescription,
        additional_details: submissionData.additionalDetails,
        driver_comments: submissionData.driverComments,

        // Decision and Action
        decision: submissionData.decision,
        action_taken: submissionData.actionTaken,
        notes: submissionData.notes,
        engineer_assigned: submissionData.engineerAssigned || false,
        estimated_repair_time: submissionData.estimatedRepairTime,

        // Supervisor Information (enhanced)
        reported_by: submissionData.reportedBy,
        supervisor_id: submissionData.supervisorId,
        supervisor_depot: submissionData.supervisorDepot,

        // Status and Priority
        status: submissionData.status || 'reported',
        priority: submissionData.priority || 'normal',
        severity: submissionData.severity || 'medium',

        // Metadata
        submitted_from: submissionData.submittedFrom || 'breakdown_guide',
        user_agent: submissionData.userAgent,
        session_id: submissionData.sessionId
      };

      const { data, error } = await authHelpers.supabase
        .from('breakdowns')
        .insert([supabaseData]);

      if (error) {
        console.error('Supabase submission error details:', error);

        // If error is due to missing columns, try with minimal data
        if (error.message.includes('column') && error.message.includes('does not exist')) {
          console.log('🔄 Attempting submission with core fields only...');

          const coreData = {
            id: submissionData.id,
            timestamp: submissionData.timestamp,
            fleet_number: submissionData.fleetNumber,
            issue_type: submissionData.issueType,
            location_description: submissionData.locationDescription,
            reported_by: submissionData.reportedBy,
            status: submissionData.status || 'reported'
          };

          const { data: retryData, error: retryError } = await authHelpers.supabase
            .from('breakdowns')
            .insert([coreData]);

          if (retryError) {
            throw new Error(`Supabase retry failed: ${retryError.message}`);
          }

          console.log('✅ Submitted with core fields successfully');
          return { success: true, data: retryData };
        }

        throw error;
      }

      return { success: true, data };
    } catch (error) {
      console.error('Supabase submission error:', error);
      return { success: false, error: error.message };
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmissionStatus(null);
    setErrorMessage('');

    try {
      // Prepare submission data
      const submissionData = prepareSubmissionData();
      console.log('🚀 Submitting breakdown report:', submissionData);

      // Submit to backend
      const backendResult = await submitToBackend(submissionData);

      // Submit to Supabase as backup
      const supabaseResult = await submitToSupabase(submissionData);

      // Check if at least one submission succeeded
      if (backendResult.success || supabaseResult.success) {
        setSubmissionStatus('success');
        setSubmissionId(submissionData.id);

        // Update storage service after successful submission
        if (fleetData.route || selectedRoute) {
          storageService.updateFrequentRoutes(
            fleetData.route || selectedRoute,
            fleetData.routeName || routeName
          );
        }

        if (fleetData.fleetNumber || selectedVehicle) {
          storageService.saveRecentFleetNumber(fleetData.fleetNumber || selectedVehicle);
        }

        if (locationData.description || breakdownLocation) {
          storageService.saveRecentLocation({
            description: locationData.description || breakdownLocation,
            coordinates: locationData.coordinates,
            timestamp: new Date().toISOString(),
            vehicle: fleetData.fleetNumber || selectedVehicle,
            route: fleetData.route || selectedRoute
          });
        }

        // Clear draft on successful submission
        storageService.clearDraft();

        // Broadcast event for activity feed
        window.dispatchEvent(new CustomEvent('breakdownReported', {
          detail: submissionData
        }));

        // Add to activity feed
        storageService.addActivityItem({
          id: submissionData.id,
          type: 'breakdown_reported',
          message: `Breakdown reported for vehicle ${submissionData.fleetNumber}`,
          icon: '🚌',
          time: new Date().toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          severity: submissionData.severity || 'normal',
          depot: submissionData.depot,
          route: submissionData.route,
          location: submissionData.locationDescription,
          decision: submissionData.decision,
          timestamp: submissionData.timestamp
        });

        // Call completion callback after a brief delay
        setTimeout(() => {
          if (onSubmissionComplete) {
            onSubmissionComplete({
              success: true,
              submissionId: submissionData.id,
              data: submissionData
            });
          }
        }, 2000);

      } else {
        // Both submissions failed
        throw new Error(
          backendResult.error || supabaseResult.error || 'Submission failed'
        );
      }

    } catch (error) {
      console.error('Submission error:', error);
      setSubmissionStatus('error');
      setErrorMessage(error.message || 'An unexpected error occurred during submission');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get submission summary for display
  const getSubmissionSummary = () => {
    return {
      vehicle: fleetData.fleetNumber || selectedVehicle || 'Not specified',
      route: fleetData.route || selectedRoute || 'Not specified',
      location: locationData.description || breakdownLocation || 'Not specified',
      issue: issueData.breakdownType || issueData.issueType || 'Not specified',
      passengers: assessmentData.passengersOnBoard !== undefined
        ? (assessmentData.passengersOnBoard ? 'Yes' : 'No')
        : 'Not specified',
      supervisor: supervisorData?.name || supervisorData?.supervisorName || 'Unknown'
    };
  };

  const summary = getSubmissionSummary();

  return (
    <div className="step-container">
      <div className="step-header">
        <h2>Step 7: Final Submission</h2>
        <p className="step-description">
          Review your breakdown report and submit to the system
        </p>
      </div>

      <div className="step-content">
        {/* Submission Summary */}
        <div className="submission-summary">
          <h3>📋 Breakdown Report Summary</h3>

          <div className="summary-grid">
            <div className="summary-item">
              <strong>Vehicle:</strong>
              <span>{summary.vehicle}</span>
            </div>

            <div className="summary-item">
              <strong>Route:</strong>
              <span>{summary.route}</span>
            </div>

            <div className="summary-item">
              <strong>Location:</strong>
              <span>{summary.location}</span>
            </div>

            <div className="summary-item">
              <strong>Issue Type:</strong>
              <span>{summary.issue}</span>
            </div>

            <div className="summary-item">
              <strong>Passengers on Board:</strong>
              <span>{summary.passengers}</span>
            </div>

            <div className="summary-item">
              <strong>Reported By:</strong>
              <span>{summary.supervisor}</span>
            </div>
          </div>

          {issueData.issueDescription && (
            <div className="summary-description">
              <strong>Issue Description:</strong>
              <p>{issueData.issueDescription}</p>
            </div>
          )}
        </div>

        {/* Submission Status */}
        {submissionStatus === 'success' && (
          <div className="submission-success">
            <div className="success-icon">✅</div>
            <h3>Breakdown Report Submitted Successfully!</h3>
            <p>Report ID: <strong>{submissionId}</strong></p>
            <p>Your breakdown report has been recorded and the appropriate teams have been notified.</p>
            <div className="success-actions">
              <p>✓ Route usage statistics updated</p>
              <p>✓ Fleet number saved to recent list</p>
              <p>✓ Location added to recent locations</p>
              <p>✓ Activity feed updated</p>
              <p>✓ Draft data cleared</p>
            </div>
          </div>
        )}

        {submissionStatus === 'error' && (
          <div className="submission-error">
            <div className="error-icon">❌</div>
            <h3>Submission Failed</h3>
            <p>There was an error submitting your breakdown report:</p>
            <p className="error-message">{errorMessage}</p>
            <button
              onClick={handleSubmit}
              className="btn btn-primary retry-btn"
              disabled={isSubmitting}
            >
              🔄 Retry Submission
            </button>
          </div>
        )}

        {submissionStatus === null && (
          <div className="submission-ready">
            <div className="ready-icon">📤</div>
            <h3>Ready to Submit</h3>
            <p>Please review the information above and click submit when ready.</p>

            <div className="submission-info">
              <h4>What happens when you submit:</h4>
              <ul>
                <li>Report is saved to the breakdown management system</li>
                <li>Relevant teams are automatically notified</li>
                <li>Route and fleet statistics are updated</li>
                <li>Activity feed is updated in real-time</li>
                <li>Draft data is cleared from storage</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="step-navigation">
        {submissionStatus !== 'success' && (
          <button
            type="button"
            onClick={onPrevious}
            className="btn btn-secondary"
            disabled={isSubmitting}
          >
            ← Previous
          </button>
        )}

        {submissionStatus === null && (
          <button
            type="button"
            onClick={handleSubmit}
            className={`btn btn-primary submit-btn ${isSubmitting ? 'submitting' : ''}`}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>🔄 Submitting Report...</>
            ) : (
              <>📤 Submit Breakdown Report</>
            )}
          </button>
        )}

        {submissionStatus === 'success' && (
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="btn btn-success"
          >
            ✅ Start New Report
          </button>
        )}
      </div>

      {/* Progress Indicator */}
      {isSubmitting && (
        <div className="submission-progress">
          <div className="progress-bar">
            <div className="progress-fill"></div>
          </div>
          <p>Submitting your breakdown report...</p>
        </div>
      )}
    </div>
  );
};

export default Step7Submit;