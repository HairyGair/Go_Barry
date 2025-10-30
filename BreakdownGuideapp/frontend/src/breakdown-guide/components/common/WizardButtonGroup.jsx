import React, { useEffect, useState } from 'react';
import * as Icons from './icons.jsx';

/**
 * WizardButtonGroup - Unified button layout component for all wizard screens
 *
 * Features:
 * - Sticky footer positioning
 * - Consistent spacing and styling
 * - Responsive design (mobile-first)
 * - Accessibility compliant (WCAG 2.1 AA)
 * - Keyboard navigation support
 * - Loading states
 * - Multiple visual variants
 *
 * @example
 * <WizardButtonGroup
 *   onPrevious={() => handleBack()}
 *   onNext={() => handleNext()}
 *   nextLabel="Continue to Assessment"
 *   isNextDisabled={!formValid}
 *   nextVariant="primary"
 * />
 */
const WizardButtonGroup = ({
  // Action handlers
  onPrevious,
  onNext,
  onComplete,
  onCancel,

  // Button labels
  previousLabel = 'Previous',
  nextLabel = 'Continue',
  completeLabel = 'Complete Assessment',
  cancelLabel = 'Cancel',

  // State controls
  isNextDisabled = false,
  isPreviousDisabled = false,
  isLoading = false,

  // Visual variants
  nextVariant = 'primary', // 'primary' | 'success' | 'danger' | 'warning'

  // Layout options
  showPrevious = true,
  singleButton = false,

  // Additional props
  className = '',
  ariaLabel,
}) => {
  const { ArrowLeft, ArrowRight, CheckCircle, Loader, AlertTriangle, XCircle } = Icons;
  const [isKeyboardFocused, setIsKeyboardFocused] = useState(false);

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + Enter to trigger next/complete
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !isNextDisabled) {
        if (onComplete) {
          onComplete();
        } else if (onNext) {
          onNext();
        }
      }

      // Escape to go back
      if (e.key === 'Escape' && onPrevious && !isPreviousDisabled) {
        onPrevious();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onPrevious, onNext, onComplete, isNextDisabled, isPreviousDisabled]);

  // Scroll to top when buttons are clicked (smooth UX)
  const handleActionWithScroll = (action) => {
    if (action) {
      // Small delay to ensure smooth transition
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(action, 150);
    }
  };

  // Get button variant styles
  const getNextButtonStyles = () => {
    const baseStyles = 'px-8 py-4 rounded-lg font-semibold text-white transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg';

    switch (nextVariant) {
      case 'success':
        return `${baseStyles} bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-700 disabled:to-gray-700 shadow-green-500/25`;
      case 'danger':
        return `${baseStyles} bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-gray-700 disabled:to-gray-700 shadow-red-500/25`;
      case 'warning':
        return `${baseStyles} bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:from-gray-700 disabled:to-gray-700 shadow-amber-500/25`;
      case 'primary':
      default:
        return `${baseStyles} bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-700 disabled:to-gray-700 shadow-blue-500/25`;
    }
  };

  const previousButtonStyles = 'px-8 py-4 rounded-lg font-medium text-gray-300 bg-gray-700/80 hover:bg-gray-600/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 backdrop-blur-sm';

  // Get appropriate icon for next button
  const getNextIcon = () => {
    if (isLoading) {
      return <Loader className="w-5 h-5 animate-spin" />;
    }
    if (onComplete) {
      return <CheckCircle className="w-5 h-5" />;
    }
    switch (nextVariant) {
      case 'danger':
        return <AlertTriangle className="w-5 h-5" />;
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      default:
        return <ArrowRight className="w-5 h-5" />;
    }
  };

  // Determine primary action button
  const primaryAction = onComplete || onNext;
  const primaryLabel = onComplete ? completeLabel : nextLabel;

  return (
    <div className={`wizard-button-group ${className}`}>
      {/* Gradient overlay for visual separation */}
      <div className="pointer-events-none fixed bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent z-40" />

      {/* Sticky button container */}
      <div
        className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-md border-t border-white/10 px-4 sm:px-6 lg:px-8 py-4 z-50 safe-area-bottom"
        role="navigation"
        aria-label={ariaLabel || "Wizard navigation controls"}
      >
        <div className="max-w-4xl mx-auto">
          {/* Desktop layout: Row */}
          <div className="hidden sm:flex justify-between items-center gap-4">
            {/* Previous/Back button */}
            {showPrevious && onPrevious && (
              <button
                onClick={() => handleActionWithScroll(onPrevious)}
                disabled={isPreviousDisabled || isLoading}
                className={previousButtonStyles}
                aria-label={`Go to previous step: ${previousLabel}`}
                onFocus={() => setIsKeyboardFocused(true)}
                onBlur={() => setIsKeyboardFocused(false)}
              >
                <div className="flex items-center gap-2">
                  <ArrowLeft className="w-5 h-5" />
                  <span>{previousLabel}</span>
                </div>
              </button>
            )}

            {/* Spacer for single button layout */}
            {!showPrevious && <div />}

            {/* Cancel button (if provided) */}
            {onCancel && (
              <button
                onClick={() => handleActionWithScroll(onCancel)}
                disabled={isLoading}
                className={previousButtonStyles}
                aria-label={cancelLabel}
              >
                <div className="flex items-center gap-2">
                  <XCircle className="w-5 h-5" />
                  <span>{cancelLabel}</span>
                </div>
              </button>
            )}

            {/* Primary action button (Next or Complete) */}
            {primaryAction && (
              <button
                onClick={() => handleActionWithScroll(primaryAction)}
                disabled={isNextDisabled || isLoading}
                className={getNextButtonStyles()}
                aria-label={primaryLabel}
                aria-disabled={isNextDisabled || isLoading}
                onFocus={() => setIsKeyboardFocused(true)}
                onBlur={() => setIsKeyboardFocused(false)}
              >
                <div className="flex items-center gap-2">
                  <span>{isLoading ? 'Processing...' : primaryLabel}</span>
                  {getNextIcon()}
                </div>
              </button>
            )}
          </div>

          {/* Mobile layout: Column (stacked) */}
          <div className="flex sm:hidden flex-col gap-3">
            {/* Primary action first on mobile for thumb reach */}
            {primaryAction && (
              <button
                onClick={() => handleActionWithScroll(primaryAction)}
                disabled={isNextDisabled || isLoading}
                className={`${getNextButtonStyles()} w-full justify-center`}
                aria-label={primaryLabel}
                aria-disabled={isNextDisabled || isLoading}
              >
                <div className="flex items-center justify-center gap-2">
                  <span>{isLoading ? 'Processing...' : primaryLabel}</span>
                  {getNextIcon()}
                </div>
              </button>
            )}

            {/* Previous/Cancel buttons below */}
            <div className="flex gap-3">
              {showPrevious && onPrevious && (
                <button
                  onClick={() => handleActionWithScroll(onPrevious)}
                  disabled={isPreviousDisabled || isLoading}
                  className={`${previousButtonStyles} flex-1`}
                  aria-label={`Go to previous step: ${previousLabel}`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <ArrowLeft className="w-5 h-5" />
                    <span>{previousLabel}</span>
                  </div>
                </button>
              )}

              {onCancel && (
                <button
                  onClick={() => handleActionWithScroll(onCancel)}
                  disabled={isLoading}
                  className={`${previousButtonStyles} flex-1`}
                  aria-label={cancelLabel}
                >
                  <div className="flex items-center justify-center gap-2">
                    <XCircle className="w-5 h-5" />
                    <span>{cancelLabel}</span>
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* Keyboard shortcut hints (only show when keyboard focused) */}
          {isKeyboardFocused && !isLoading && (
            <div className="hidden lg:flex justify-center mt-2 text-xs text-gray-500 gap-4">
              {onPrevious && <span>ESC: Back</span>}
              {primaryAction && <span>Ctrl+Enter: {onComplete ? 'Complete' : 'Continue'}</span>}
            </div>
          )}
        </div>
      </div>

      {/* Safe area spacer to prevent content from being hidden behind buttons */}
      <div className="h-32 sm:h-24" aria-hidden="true" />
    </div>
  );
};

// Export to global scope for backward compatibility
window.WizardButtonGroup = WizardButtonGroup;

export default WizardButtonGroup;
