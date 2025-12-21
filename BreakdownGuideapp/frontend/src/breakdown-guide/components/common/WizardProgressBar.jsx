/**
 * WizardProgressBar - Visual progress indicator for wizard steps
 *
 * Features:
 * - Animated progress bar with fill effect
 * - Step dots with completion states
 * - Step counter text
 * - Responsive design
 * - Accessibility support
 *
 * @example
 * <WizardProgressBar
 *   currentStep={2}
 *   totalSteps={5}
 *   wizardTitle="Steering Assessment"
 * />
 */

import React from 'react';
import './WizardProgressBar.css';

const WizardProgressBar = ({
  currentStep = 1,
  totalSteps = 5,
  wizardTitle = '',
  showStepLabels = false,
  stepLabels = []
}) => {
  // Calculate progress percentage
  const progressPercent = Math.min(((currentStep) / totalSteps) * 100, 100);

  return (
    <div className="wizard-progress-container" role="navigation" aria-label="Assessment progress">
      {/* Wizard Title */}
      {wizardTitle && (
        <div className="wizard-progress-title">
          <span className="wizard-title-text">{wizardTitle}</span>
        </div>
      )}

      {/* Progress Bar Track */}
      <div className="wizard-progress-track" role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={totalSteps}>
        <div
          className="wizard-progress-fill"
          style={{ width: `${progressPercent}%` }}
        />

        {/* Step Dots Overlay */}
        <div className="wizard-step-dots">
          {Array.from({ length: totalSteps }).map((_, index) => {
            const stepNumber = index + 1;
            const isCompleted = stepNumber < currentStep;
            const isActive = stepNumber === currentStep;
            const isPending = stepNumber > currentStep;

            return (
              <div
                key={index}
                className={`wizard-step-dot ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''} ${isPending ? 'pending' : ''}`}
                aria-label={`Step ${stepNumber}${isCompleted ? ' completed' : isActive ? ' current' : ' pending'}`}
              >
                {isCompleted ? (
                  <svg className="check-icon" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <span className="step-number">{stepNumber}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Labels (optional) */}
      {showStepLabels && stepLabels.length > 0 && (
        <div className="wizard-step-labels">
          {stepLabels.map((label, index) => (
            <span
              key={index}
              className={`step-label ${index + 1 === currentStep ? 'active' : ''} ${index + 1 < currentStep ? 'completed' : ''}`}
            >
              {label}
            </span>
          ))}
        </div>
      )}

      {/* Step Counter */}
      <div className="wizard-step-counter">
        <span className="current-step">{currentStep}</span>
        <span className="step-separator">/</span>
        <span className="total-steps">{totalSteps}</span>
        <span className="step-text">steps</span>
      </div>
    </div>
  );
};

export default WizardProgressBar;
