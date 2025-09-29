/**
 * BreakdownGuideCompletion Component
 * Handles the completion flow from breakdown guide to SDC Dashboard
 */

import React, { useEffect, useState } from 'react';
import navigationService from '../services/navigationService';
import { apiConfig } from '../breakdown-guide/components/common/constants';

const BreakdownGuideCompletion = ({ 
  breakdownId,
  decision,
  wizardType,
  supervisorBadge,
  fleetNumber,
  onComplete
}) => {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!breakdownId || !decision) {
      console.error('Missing required data for completion');
      return;
    }

    // Start redirect countdown
    setIsRedirecting(true);
    
    // Countdown timer
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          handleRedirect();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [breakdownId, decision]);

  const handleRedirect = async () => {
    try {
      // Log completion activity
      await logCompletionActivity();

      // Get return URL from query params
      const urlParams = new URLSearchParams(window.location.search);
      const returnUrl = urlParams.get('return');

      // Prepare completion data
      const completionData = {
        breakdownId,
        decision,
        wizardType,
        supervisorBadge,
        fleetNumber,
        returnUrl,
        timestamp: new Date().toISOString()
      };

      // Notify parent component
      if (onComplete) {
        onComplete(completionData);
      }

      // Handle navigation
      navigationService.handleBreakdownGuideCompletion(completionData);
      
    } catch (error) {
      console.error('Error during completion redirect:', error);
      // Fallback to manual navigation
      navigationService.navigateToSDCDashboard(breakdownId, {
        decision,
        highlight: true,
        scrollTo: true
      });
    }
  };

  const logCompletionActivity = async () => {
    try {
      await fetch(`${apiConfig.baseUrl}/api/activity/log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'assessment_completed_redirect',
          breakdown_id: breakdownId,
          fleet_number: fleetNumber,
          supervisor_badge: supervisorBadge,
          decision: decision,
          wizard_type: wizardType,
          message: `Redirecting to SDC Dashboard after ${decision} decision`,
          source: 'breakdown_guide_completion',
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Failed to log completion activity:', error);
    }
  };

  const getDecisionColor = () => {
    switch (decision) {
      case 'STOP': return '#dc2626';
      case 'AMBER':
      case 'CHANGEOVER': return '#f59e0b';
      case 'CONTINUE': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getDecisionIcon = () => {
    switch (decision) {
      case 'STOP': return '🛑';
      case 'AMBER':
      case 'CHANGEOVER': return '⚡';
      case 'CONTINUE': return '✅';
      default: return '📋';
    }
  };

  if (!isRedirecting) {
    return null;
  }

  return (
    <div className="completion-overlay">
      <div className="completion-container">
        <div className="completion-content">
          <div className="completion-icon">
            {getDecisionIcon()}
          </div>
          
          <h2 className="completion-title">Assessment Complete!</h2>
          
          <div className="completion-details">
            <div className="detail-item">
              <span className="detail-label">Breakdown ID:</span>
              <span className="detail-value">{breakdownId}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Fleet Number:</span>
              <span className="detail-value">{fleetNumber}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Decision:</span>
              <span className="detail-value" style={{ color: getDecisionColor(), fontWeight: 'bold' }}>
                {decision}
              </span>
            </div>
          </div>

          <div className="redirect-message">
            <p>Redirecting to SDC Dashboard in <strong>{countdown}</strong> seconds...</p>
            <p className="redirect-note">Your breakdown will be highlighted for easy identification</p>
          </div>

          <button 
            className="skip-button"
            onClick={handleRedirect}
          >
            Go Now
          </button>
        </div>
      </div>

      <style jsx>{`
        .completion-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          animation: fadeIn 0.3s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .completion-container {
          background: white;
          border-radius: 16px;
          padding: 32px;
          max-width: 480px;
          width: 90%;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
          animation: slideUp 0.3s ease-out;
        }

        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .completion-content {
          text-align: center;
        }

        .completion-icon {
          font-size: 64px;
          margin-bottom: 20px;
          animation: bounce 0.5s ease-out;
        }

        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .completion-title {
          font-size: 28px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 24px 0;
        }

        .completion-details {
          background: #f8fafc;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 24px;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #e2e8f0;
        }

        .detail-item:last-child {
          border-bottom: none;
        }

        .detail-label {
          font-size: 14px;
          color: #64748b;
          font-weight: 500;
        }

        .detail-value {
          font-size: 14px;
          color: #1e293b;
          font-weight: 600;
          font-family: 'Monaco', 'Consolas', monospace;
        }

        .redirect-message {
          margin-bottom: 24px;
        }

        .redirect-message p {
          margin: 0 0 8px 0;
          font-size: 16px;
          color: #475569;
        }

        .redirect-message strong {
          color: #3b82f6;
          font-size: 20px;
          font-weight: 700;
        }

        .redirect-note {
          font-size: 14px !important;
          color: #64748b !important;
          font-style: italic;
        }

        .skip-button {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
          border: none;
          padding: 12px 32px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .skip-button:hover {
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .skip-button:active {
          transform: translateY(0);
        }

        @media (max-width: 640px) {
          .completion-container {
            padding: 24px;
          }

          .completion-title {
            font-size: 24px;
          }

          .completion-icon {
            font-size: 48px;
          }

          .redirect-message p {
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
};

export default BreakdownGuideCompletion;