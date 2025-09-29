/**
 * SDCProgressiveLoader Component
 * Progressive loading for assessment steps - clean, minimal design
 */

import React from 'react';

const SDCProgressiveLoader = ({ 
  currentStep = 0, 
  totalSteps = 5,
  stepDescription = '',
  isLoading = false 
}) => {
  const progress = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0;

  return (
    <div className="progressive-loader">
      <div className="loader-header">
        <span className="step-indicator">
          Step {currentStep} of {totalSteps}
        </span>
        {stepDescription && (
          <span className="step-description">{stepDescription}</span>
        )}
      </div>
      
      <div className="progress-track">
        <div 
          className="progress-fill" 
          style={{ width: `${progress}%` }}
        />
        <div className="progress-dots">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div 
              key={i}
              className={`dot ${i < currentStep ? 'completed' : ''} ${i === currentStep - 1 ? 'active' : ''}`}
            />
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="loading-indicator">
          <span className="loading-text">Processing...</span>
        </div>
      )}

      <style jsx>{`
        .progressive-loader {
          padding: 16px 0;
        }

        .loader-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .step-indicator {
          font-size: 13px;
          font-weight: 600;
          color: #374151;
        }

        .step-description {
          font-size: 13px;
          color: #6b7280;
        }

        .progress-track {
          position: relative;
          height: 8px;
          background: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          background: #3b82f6;
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .progress-dots {
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          transform: translateY(-50%);
          display: flex;
          justify-content: space-between;
          padding: 0 4px;
        }

        .dot {
          width: 16px;
          height: 16px;
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 50%;
          transition: all 0.3s ease;
        }

        .dot.completed {
          background: #3b82f6;
          border-color: #3b82f6;
        }

        .dot.active {
          border-color: #3b82f6;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
        }

        .loading-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 12px;
        }

        .loading-text {
          font-size: 12px;
          color: #6b7280;
        }
      `}</style>
    </div>
  );
};

export default SDCProgressiveLoader;