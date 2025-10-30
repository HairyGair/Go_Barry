/**
 * Assessment Detail Component
 * Displays complete wizard assessment responses for engineering analysis
 *
 * @author Anthony Gair
 * @license Proprietary
 */

import React, { useState } from 'react';
import { parseWizardResponses, getKeySymptoms, getSafetyFlags } from './utils/assessmentParser';

const AssessmentDetail = ({ breakdown, compact = false }) => {
  const [expanded, setExpanded] = useState(!compact);

  if (!breakdown || !breakdown.wizard_assessment_data) {
    return (
      <div className="assessment-detail empty">
        <p className="no-data">No assessment data available</p>
        <style>{`
          .assessment-detail.empty {
            padding: 16px;
            background: rgba(255, 193, 7, 0.1);
            border-radius: 8px;
            border: 1px dashed rgba(255, 193, 7, 0.3);
          }
          .no-data {
            margin: 0;
            color: #ffc107;
            text-align: center;
            font-size: 14px;
          }
        `}</style>
      </div>
    );
  }

  const responses = parseWizardResponses(breakdown.wizard_assessment_data);
  const symptoms = getKeySymptoms(breakdown.wizard_assessment_data);
  const safety = getSafetyFlags(breakdown.wizard_assessment_data);

  // Group responses by importance
  const criticalResponses = responses.filter(r => r.importance === 'critical');
  const highResponses = responses.filter(r => r.importance === 'high');
  const otherResponses = responses.filter(r => !['critical', 'high'].includes(r.importance));

  return (
    <div className="assessment-detail">
      {/* Safety Flags - Always Visible */}
      {safety.hasConcerns && (
        <div className="safety-section">
          <h4 className="section-title">⚠️ Safety Concerns</h4>
          <div className="safety-flags">
            {safety.flags.map((flag, idx) => (
              <div key={idx} className={`safety-flag ${flag.severity}`}>
                <span className="flag-icon">
                  {flag.severity === 'critical' ? '🚨' : '⚠️'}
                </span>
                <span className="flag-message">{flag.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Symptoms Summary */}
      {symptoms.length > 0 && (
        <div className="symptoms-section">
          <h4 className="section-title">🔍 Key Symptoms</h4>
          <ul className="symptoms-list">
            {symptoms.map((symptom, idx) => (
              <li key={idx}>{symptom}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Expandable Full Assessment */}
      {compact && (
        <button
          className="expand-toggle"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? '▼' : '▶'} Full Assessment Details ({responses.length} responses)
        </button>
      )}

      {expanded && (
        <div className="full-assessment">
          {/* Critical Responses */}
          {criticalResponses.length > 0 && (
            <div className="response-group critical">
              <h4 className="group-title">🚨 Critical Information</h4>
              <div className="responses">
                {criticalResponses.map((response, idx) => (
                  <ResponseItem key={idx} response={response} />
                ))}
              </div>
            </div>
          )}

          {/* High Priority Responses */}
          {highResponses.length > 0 && (
            <div className="response-group high">
              <h4 className="group-title">⚡ Important Details</h4>
              <div className="responses">
                {highResponses.map((response, idx) => (
                  <ResponseItem key={idx} response={response} />
                ))}
              </div>
            </div>
          )}

          {/* Other Responses */}
          {otherResponses.length > 0 && (
            <div className="response-group other">
              <h4 className="group-title">📋 Additional Information</h4>
              <div className="responses">
                {otherResponses.map((response, idx) => (
                  <ResponseItem key={idx} response={response} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        .assessment-detail {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          padding: 16px;
          margin-top: 12px;
        }

        .section-title {
          margin: 0 0 12px 0;
          color: white;
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .safety-section {
          margin-bottom: 16px;
          padding-bottom: 16px;
          border-bottom: 2px solid rgba(239, 68, 68, 0.3);
        }

        .safety-flags {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .safety-flag {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 6px;
          font-weight: 600;
        }

        .safety-flag.critical {
          background: rgba(239, 68, 68, 0.2);
          border: 1px solid rgba(239, 68, 68, 0.5);
          color: #ef4444;
        }

        .safety-flag.high {
          background: rgba(245, 158, 11, 0.2);
          border: 1px solid rgba(245, 158, 11, 0.5);
          color: #f59e0b;
        }

        .flag-icon {
          font-size: 18px;
        }

        .flag-message {
          flex: 1;
          font-size: 13px;
        }

        .symptoms-section {
          margin-bottom: 16px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .symptoms-list {
          margin: 0;
          padding-left: 20px;
          color: #e0e0e0;
          font-size: 13px;
        }

        .symptoms-list li {
          margin-bottom: 6px;
          line-height: 1.5;
        }

        .expand-toggle {
          width: 100%;
          padding: 10px 14px;
          background: rgba(100, 181, 246, 0.15);
          border: 1px solid rgba(100, 181, 246, 0.3);
          border-radius: 6px;
          color: #64b5f6;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
          margin-bottom: 12px;
        }

        .expand-toggle:hover {
          background: rgba(100, 181, 246, 0.25);
          border-color: rgba(100, 181, 246, 0.5);
        }

        .full-assessment {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .response-group {
          border-left: 3px solid rgba(255, 255, 255, 0.2);
          padding-left: 12px;
        }

        .response-group.critical {
          border-left-color: #ef4444;
        }

        .response-group.high {
          border-left-color: #f59e0b;
        }

        .response-group.other {
          border-left-color: rgba(255, 255, 255, 0.2);
        }

        .group-title {
          margin: 0 0 10px 0;
          color: white;
          font-size: 13px;
          font-weight: 600;
        }

        .responses {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
      `}</style>
    </div>
  );
};

// Individual Response Item Component
const ResponseItem = ({ response }) => {
  return (
    <div className="response-item">
      <div className="response-question">{response.question}</div>
      <div className="response-answer">{response.answer}</div>

      <style>{`
        .response-item {
          background: rgba(0, 0, 0, 0.2);
          padding: 8px 12px;
          border-radius: 4px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .response-question {
          color: #999;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          margin-bottom: 4px;
        }

        .response-answer {
          color: white;
          font-size: 13px;
          line-height: 1.4;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
};

export default AssessmentDetail;
