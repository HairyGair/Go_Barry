import React, { useEffect, useRef, useCallback } from 'react';

/**
 * AccessibleModal - Wraps any modal content with proper WCAG 2.1 AA compliance.
 *
 * Provides: role="dialog", aria-modal, focus trap, Escape key close,
 * focus return to trigger element, aria-labelledby/describedby.
 *
 * Usage:
 *   <AccessibleModal
 *     isOpen={showModal}
 *     onClose={handleClose}
 *     labelId="my-modal-title"      // id of the heading inside
 *     descriptionId="my-modal-desc"  // optional: id of description text
 *     overlayClassName="dsm-overlay" // existing overlay CSS class
 *     containerClassName="dsm-container" // existing container CSS class
 *     closeOnOverlay={true}          // click overlay to close (default true)
 *     closeOnEscape={true}           // Escape key to close (default true)
 *     role="dialog"                  // or "alertdialog" for warnings
 *   >
 *     <h2 id="my-modal-title">Title</h2>
 *     <p id="my-modal-desc">Description</p>
 *     ...content...
 *   </AccessibleModal>
 */
export default function AccessibleModal({
  isOpen,
  onClose,
  children,
  labelId,
  descriptionId,
  overlayClassName = 'modal-overlay',
  containerClassName = 'modal-container',
  closeOnOverlay = true,
  closeOnEscape = true,
  role = 'dialog',
  className = '',
}) {
  const containerRef = useRef(null);
  const triggerRef = useRef(null);

  // Capture the element that opened the modal so we can return focus
  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement;
    }
  }, [isOpen]);

  // Focus the modal container when it opens
  useEffect(() => {
    if (isOpen && containerRef.current) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        containerRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Return focus to trigger when modal closes
  useEffect(() => {
    if (!isOpen && triggerRef.current) {
      triggerRef.current.focus();
      triggerRef.current = null;
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.setAttribute('data-modal-open', 'true');
    } else {
      document.body.style.overflow = '';
      document.body.removeAttribute('data-modal-open');
    }
    return () => {
      document.body.style.overflow = '';
      document.body.removeAttribute('data-modal-open');
    };
  }, [isOpen]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEscape, onClose]);

  // Focus trap - keep Tab cycling within the modal
  const handleKeyDown = useCallback((e) => {
    if (e.key !== 'Tab' || !containerRef.current) return;

    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled]):not([type="hidden"])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    const focusableElements = containerRef.current.querySelectorAll(focusableSelectors);
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey) {
      // Shift+Tab: if on first element, wrap to last
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab: if on last element, wrap to first
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  }, []);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (closeOnOverlay && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className={`${overlayClassName} ${className}`}
      onClick={handleOverlayClick}
      role="presentation"
    >
      <div
        ref={containerRef}
        className={containerClassName}
        role={role}
        aria-modal="true"
        aria-labelledby={labelId}
        aria-describedby={descriptionId || undefined}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
