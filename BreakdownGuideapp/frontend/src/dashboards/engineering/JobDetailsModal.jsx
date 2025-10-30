import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api-client';

const JobDetailsModal = ({ show, onClose, breakdownId }) => {
  const [jobDetails, setJobDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (show && breakdownId) {
      fetchJobDetails();
    }
  }, [show, breakdownId]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get(`/api/engineering/job/${breakdownId}`);

      if (data.success) {
        setJobDetails(data.job);
      }
    } catch (error) {
      console.error('Error fetching job details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'assessment', label: 'Assessment', icon: '📋' },
    { id: 'timeline', label: 'Timeline', icon: '⏱️' },
    { id: 'notes', label: 'Engineer Notes', icon: '📝' }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Job Details: {breakdownId}</h2>
            {jobDetails && (
              <p className="fleet-number">Fleet {jobDetails.fleet_number}</p>
            )}
          </div>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>

        {loading ? (
          <div className="modal-body">
            <div className="loading-spinner">Loading job details...</div>
          </div>
        ) : jobDetails ? (
          <>
            {/* Tab Navigation */}
            <div className="tab-navigation">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span className="tab-icon">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="modal-body">
              {activeTab === 'overview' && (
                <OverviewTab job={jobDetails} />
              )}
              {activeTab === 'assessment' && (
                <AssessmentTab job={jobDetails} />
              )}
              {activeTab === 'timeline' && (
                <TimelineTab job={jobDetails} />
              )}
              {activeTab === 'notes' && (
                <NotesTab job={jobDetails} />
              )}
            </div>
          </>
        ) : (
          <div className="modal-body">
            <p>Job details not found</p>
          </div>
        )}

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-container {
          background: #1a1a2e;
          border-radius: 12px;
          max-width: 900px;
          width: 100%;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          padding: 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .modal-header h2 {
          margin: 0;
          color: white;
          font-size: 24px;
        }

        .fleet-number {
          margin: 4px 0 0 0;
          color: #64b5f6;
          font-size: 14px;
        }

        .close-button {
          background: none;
          border: none;
          color: #999;
          font-size: 28px;
          cursor: pointer;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .close-button:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .tab-navigation {
          display: flex;
          padding: 0 24px;
          gap: 8px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          overflow-x: auto;
        }

        .tab-button {
          background: none;
          border: none;
          color: #999;
          padding: 12px 20px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
          white-space: nowrap;
        }

        .tab-button:hover {
          color: white;
          background: rgba(255, 255, 255, 0.05);
        }

        .tab-button.active {
          color: #64b5f6;
          border-bottom-color: #64b5f6;
        }

        .tab-icon {
          font-size: 18px;
        }

        .modal-body {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
        }

        .modal-footer {
          padding: 16px 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }

        .btn {
          padding: 10px 24px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .loading-spinner {
          text-align: center;
          padding: 60px 20px;
          color: #999;
        }
      `}</style>
    </div>
  );
};

// Overview Tab Component
const OverviewTab = ({ job }) => (
  <div className="overview-tab">
    <div className="info-grid">
      <InfoCard label="Fleet Number" value={job.fleet_number} />
      <InfoCard label="Location" value={job.location || 'Unknown'} />
      <InfoCard label="Depot" value={job.depot || 'Unknown'} />
      <InfoCard label="Supervisor" value={job.supervisor_name || 'Unknown'} />
      <InfoCard
        label="Severity"
        value={job.severity || job.wizard_decision || 'Unknown'}
        className={`severity-${(job.severity || job.wizard_decision || '').toLowerCase()}`}
      />
      <InfoCard label="Issue Category" value={job.issue_category || 'General'} />
      <InfoCard label="Elapsed Time" value={`${job.timeline?.total_elapsed || 0} min`} />
      <InfoCard
        label="Engineer Status"
        value={job.engineer_dispatched_at ? 'Engineer Dispatched' : 'Awaiting Dispatch'}
      />
    </div>

    {job.assessment_summary && (
      <div className="summary-section">
        <h3>Assessment Summary</h3>

        {job.assessment_summary.key_symptoms.length > 0 && (
          <div className="summary-item">
            <h4>Key Symptoms:</h4>
            <ul>
              {job.assessment_summary.key_symptoms.map((symptom, idx) => (
                <li key={idx}>{symptom}</li>
              ))}
            </ul>
          </div>
        )}

        {job.assessment_summary.safety_concerns.length > 0 && (
          <div className="summary-item safety-critical">
            <h4>⚠️ Safety Concerns:</h4>
            <ul>
              {job.assessment_summary.safety_concerns.map((concern, idx) => (
                <li key={idx}>{concern}</li>
              ))}
            </ul>
          </div>
        )}

        {job.assessment_summary.recommended_actions.length > 0 && (
          <div className="summary-item">
            <h4>Recommended Actions:</h4>
            <ul>
              {job.assessment_summary.recommended_actions.map((action, idx) => (
                <li key={idx}>{action}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )}

    <style jsx>{`
      .overview-tab {
        display: flex;
        flex-direction: column;
        gap: 24px;
      }

      .info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 16px;
      }

      .summary-section {
        background: rgba(255, 255, 255, 0.05);
        padding: 20px;
        border-radius: 8px;
      }

      .summary-section h3 {
        margin: 0 0 16px 0;
        color: white;
        font-size: 18px;
      }

      .summary-item {
        margin-bottom: 16px;
      }

      .summary-item:last-child {
        margin-bottom: 0;
      }

      .summary-item h4 {
        margin: 0 0 8px 0;
        color: #64b5f6;
        font-size: 14px;
        font-weight: 600;
      }

      .summary-item ul {
        margin: 0;
        padding-left: 20px;
        color: #ccc;
      }

      .summary-item li {
        margin-bottom: 4px;
      }

      .summary-item.safety-critical {
        background: rgba(239, 68, 68, 0.1);
        padding: 12px;
        border-radius: 6px;
        border-left: 3px solid #ef4444;
      }

      .summary-item.safety-critical h4 {
        color: #ef4444;
      }
    `}</style>
  </div>
);

// Assessment Tab Component
const AssessmentTab = ({ job }) => {
  const wizardData = job.wizard_responses || job.wizard_assessment_data || {};

  return (
    <div className="assessment-tab">
      <h3>Wizard Assessment Data</h3>

      {Object.keys(wizardData).length === 0 ? (
        <p className="no-data">No assessment data available</p>
      ) : (
        <div className="wizard-data">
          {Object.entries(wizardData).map(([key, value]) => (
            <div key={key} className="data-item">
              <span className="data-key">{formatKey(key)}:</span>
              <span className="data-value">{formatValue(value)}</span>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .assessment-tab h3 {
          margin: 0 0 20px 0;
          color: white;
          font-size: 18px;
        }

        .no-data {
          text-align: center;
          padding: 40px;
          color: #999;
        }

        .wizard-data {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .data-item {
          background: rgba(255, 255, 255, 0.05);
          padding: 12px 16px;
          border-radius: 6px;
          display: flex;
          gap: 12px;
        }

        .data-key {
          color: #64b5f6;
          font-weight: 600;
          min-width: 200px;
        }

        .data-value {
          color: white;
          flex: 1;
        }
      `}</style>
    </div>
  );
};

// Timeline Tab Component
const TimelineTab = ({ job }) => {
  const timeline = job.timeline || {};

  const events = [
    { label: 'Breakdown Created', time: job.created_at, icon: '🚨' },
    { label: 'Engineer Accepted', time: job.engineer_accepted_at, icon: '✓', duration: timeline.time_to_accept },
    { label: 'Engineer On Site', time: job.engineer_on_site_at, icon: '📍', duration: timeline.time_to_site },
    { label: 'Fixing Started', time: job.engineer_fixing_at, icon: '🔧' },
    { label: 'Job Completed', time: job.engineer_completed_at, icon: '✅', duration: timeline.time_on_site }
  ].filter(event => event.time);

  return (
    <div className="timeline-tab">
      <div className="timeline-container">
        {events.map((event, idx) => (
          <div key={idx} className="timeline-event">
            <div className="event-icon">{event.icon}</div>
            <div className="event-content">
              <div className="event-label">{event.label}</div>
              <div className="event-time">{formatDateTime(event.time)}</div>
              {event.duration !== null && event.duration !== undefined && (
                <div className="event-duration">{event.duration} minutes elapsed</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {timeline.total_elapsed && (
        <div className="timeline-summary">
          <h4>Total Time: {timeline.total_elapsed} minutes</h4>
        </div>
      )}

      <style jsx>{`
        .timeline-tab {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .timeline-container {
          position: relative;
          padding-left: 40px;
        }

        .timeline-container::before {
          content: '';
          position: absolute;
          left: 15px;
          top: 10px;
          bottom: 10px;
          width: 2px;
          background: rgba(100, 181, 246, 0.3);
        }

        .timeline-event {
          display: flex;
          gap: 16px;
          margin-bottom: 20px;
          position: relative;
        }

        .event-icon {
          position: absolute;
          left: -40px;
          width: 32px;
          height: 32px;
          background: #1a1a2e;
          border: 2px solid #64b5f6;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
        }

        .event-content {
          flex: 1;
          background: rgba(255, 255, 255, 0.05);
          padding: 12px 16px;
          border-radius: 6px;
        }

        .event-label {
          color: white;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .event-time {
          color: #999;
          font-size: 13px;
        }

        .event-duration {
          color: #64b5f6;
          font-size: 12px;
          margin-top: 4px;
        }

        .timeline-summary {
          background: rgba(100, 181, 246, 0.1);
          padding: 16px;
          border-radius: 8px;
          border-left: 3px solid #64b5f6;
        }

        .timeline-summary h4 {
          margin: 0;
          color: #64b5f6;
        }
      `}</style>
    </div>
  );
};

// Notes Tab Component
const NotesTab = ({ job }) => {
  const notes = job.engineer_notes || [];

  return (
    <div className="notes-tab">
      <h3>Engineer Notes</h3>

      {notes.length === 0 ? (
        <p className="no-notes">No engineer notes yet</p>
      ) : (
        <div className="notes-list">
          {notes.map((note, idx) => (
            <div key={idx} className="note-item">
              <div className="note-header">
                <span className="note-engineer">{note.engineer}</span>
                <span className="note-time">{formatDateTime(note.timestamp)}</span>
              </div>
              <div className="note-status">{note.status}</div>
              <div className="note-content">{note.note}</div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .notes-tab h3 {
          margin: 0 0 20px 0;
          color: white;
          font-size: 18px;
        }

        .no-notes {
          text-align: center;
          padding: 40px;
          color: #999;
        }

        .notes-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .note-item {
          background: rgba(255, 255, 255, 0.05);
          padding: 16px;
          border-radius: 8px;
          border-left: 3px solid #64b5f6;
        }

        .note-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .note-engineer {
          color: #64b5f6;
          font-weight: 600;
        }

        .note-time {
          color: #999;
          font-size: 13px;
        }

        .note-status {
          display: inline-block;
          padding: 2px 8px;
          background: rgba(100, 181, 246, 0.2);
          color: #64b5f6;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .note-content {
          color: white;
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
};

// Helper Components
const InfoCard = ({ label, value, className = '' }) => (
  <div className={`info-card ${className}`}>
    <div className="info-label">{label}</div>
    <div className="info-value">{value || 'N/A'}</div>

    <style jsx>{`
      .info-card {
        background: rgba(255, 255, 255, 0.05);
        padding: 16px;
        border-radius: 8px;
      }

      .info-label {
        color: #999;
        font-size: 12px;
        text-transform: uppercase;
        margin-bottom: 8px;
      }

      .info-value {
        color: white;
        font-size: 16px;
        font-weight: 600;
      }

      .info-card.severity-stop .info-value {
        color: #ef4444;
      }

      .info-card.severity-amber .info-value {
        color: #f59e0b;
      }

      .info-card.severity-continue .info-value {
        color: #10b981;
      }
    `}</style>
  </div>
);

// Helper Functions
function formatKey(key) {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

function formatValue(value) {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
}

function formatDateTime(isoString) {
  if (!isoString) return 'N/A';
  const date = new Date(isoString);
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default JobDetailsModal;
