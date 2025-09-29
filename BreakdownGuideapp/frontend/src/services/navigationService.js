/**
 * Navigation Service
 * Handles routing integration between breakdown guide and SDC Dashboard
 * Manages navigation flow, URL parameters, and focus management
 */

import { apiConfig } from '../breakdown-guide/components/common/constants';

class NavigationService {
  constructor() {
    this.navigationHistory = [];
    this.pendingHighlights = new Map();
    this.focusQueue = [];
  }

  /**
   * Navigate from breakdown guide to SDC Dashboard
   * @param {string} breakdownId - The breakdown ID to highlight
   * @param {Object} options - Navigation options
   */
  navigateToSDCDashboard(breakdownId, options = {}) {
    const {
      decision = null,
      highlight = true,
      newTab = false,
      scrollTo = true,
      flashDuration = 10000, // 10 seconds highlight
      returnUrl = null
    } = options;

    // Build URL with parameters
    const params = new URLSearchParams();
    
    if (highlight && breakdownId) {
      params.append('highlight', breakdownId);
    }
    
    if (decision) {
      params.append('decision', decision);
    }
    
    if (scrollTo) {
      params.append('scrollTo', breakdownId);
    }
    
    if (flashDuration) {
      params.append('flashDuration', flashDuration);
    }

    // Store pending highlight for cross-window communication
    this.storePendingHighlight(breakdownId, {
      decision,
      timestamp: new Date().toISOString(),
      source: 'breakdown_guide',
      ...options
    });

    const dashboardUrl = `/dashboards/sdc${params.toString() ? '?' + params.toString() : ''}`;

    // Log navigation for analytics
    this.logNavigation('breakdown_guide', 'sdc_dashboard', {
      breakdownId,
      decision,
      url: dashboardUrl
    });

    // Navigate
    if (newTab) {
      window.open(dashboardUrl, '_blank');
    } else {
      window.location.href = dashboardUrl;
    }

    return dashboardUrl;
  }

  /**
   * Navigate from SDC Dashboard to breakdown guide for editing
   * @param {string} breakdownId - The breakdown ID to edit
   * @param {Object} options - Navigation options
   */
  navigateToBreakdownGuide(breakdownId, options = {}) {
    const {
      mode = 'edit',
      reason = '',
      returnUrl = null,
      wizardType = null,
      preserveData = true
    } = options;

    // Build URL with parameters
    const params = new URLSearchParams();
    
    if (mode === 'edit') {
      params.append('edit', breakdownId);
    } else if (mode === 'view') {
      params.append('view', breakdownId);
    } else if (mode === 'new') {
      params.append('fleet', breakdownId); // Fleet number for new breakdown
    }
    
    if (reason) {
      params.append('reason', reason);
    }
    
    // Auto-generate return URL if not provided
    const actualReturnUrl = returnUrl || this.generateReturnUrl(breakdownId);
    if (actualReturnUrl) {
      params.append('return', actualReturnUrl);
    }
    
    if (wizardType) {
      params.append('wizard', wizardType);
    }
    
    if (preserveData) {
      // Store current state for restoration
      this.storeNavigationState({
        breakdownId,
        mode,
        returnUrl: actualReturnUrl,
        timestamp: new Date().toISOString()
      });
    }

    const guideUrl = `/breakdown-guide${params.toString() ? '?' + params.toString() : ''}`;

    // Log navigation
    this.logNavigation('sdc_dashboard', 'breakdown_guide', {
      breakdownId,
      mode,
      url: guideUrl
    });

    // Navigate
    window.location.href = guideUrl;
    
    return guideUrl;
  }

  /**
   * Handle completion redirect from breakdown guide
   * @param {Object} completionData - Completion data from wizard
   */
  handleBreakdownGuideCompletion(completionData) {
    const {
      breakdownId,
      decision,
      wizardType,
      supervisorBadge,
      returnUrl
    } = completionData;

    console.log(`✅ Breakdown guide completed: ${breakdownId} - Decision: ${decision}`);

    // Clear any stored navigation state
    this.clearNavigationState(breakdownId);

    // Check for return URL
    if (returnUrl) {
      // Add highlight parameter to return URL
      const url = new URL(returnUrl, window.location.origin);
      url.searchParams.set('highlight', breakdownId);
      url.searchParams.set('completed', 'true');
      url.searchParams.set('decision', decision);
      
      window.location.href = url.toString();
    } else {
      // Default to SDC Dashboard
      this.navigateToSDCDashboard(breakdownId, {
        decision,
        highlight: true,
        scrollTo: true,
        flashDuration: 15000 // 15 seconds for completion
      });
    }
  }

  /**
   * Process URL parameters on page load
   * @returns {Object} Parsed parameters
   */
  processUrlParameters() {
    const params = new URLSearchParams(window.location.search);
    const processed = {};

    // Extract all relevant parameters
    const paramKeys = [
      'highlight',
      'decision', 
      'scrollTo',
      'flashDuration',
      'completed',
      'edit',
      'view',
      'return',
      'reason',
      'wizard'
    ];

    paramKeys.forEach(key => {
      if (params.has(key)) {
        processed[key] = params.get(key);
      }
    });

    // Check for pending highlights
    const pendingHighlight = this.getPendingHighlight();
    if (pendingHighlight && !processed.highlight) {
      processed.highlight = pendingHighlight.breakdownId;
      processed.pendingHighlightData = pendingHighlight;
    }

    return processed;
  }

  /**
   * Apply highlighting and focus to element
   * @param {string} elementId - Element ID to highlight
   * @param {Object} options - Highlight options
   */
  applyHighlight(elementId, options = {}) {
    const {
      duration = 10000,
      scrollTo = true,
      flashCount = 3,
      focusElement = true,
      animationClass = 'highlight-flash'
    } = options;

    // Wait for DOM to be ready
    const applyHighlightEffect = () => {
      const element = document.getElementById(elementId) || 
                     document.querySelector(`[data-breakdown-id="${elementId}"]`);
      
      if (!element) {
        console.warn(`Element not found for highlighting: ${elementId}`);
        return false;
      }

      console.log(`✨ Applying highlight to: ${elementId}`);

      // Add highlight class
      element.classList.add(animationClass);
      element.classList.add('highlighted');

      // Scroll into view
      if (scrollTo) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });
      }

      // Focus element for accessibility
      if (focusElement) {
        // Make element focusable if it isn't already
        if (!element.hasAttribute('tabindex')) {
          element.setAttribute('tabindex', '-1');
        }
        
        setTimeout(() => {
          element.focus();
          
          // Announce to screen readers
          this.announceHighlight(elementId, options);
        }, 500);
      }

      // Flash animation
      if (flashCount > 1) {
        let flashes = 0;
        const flashInterval = setInterval(() => {
          element.classList.toggle('flash');
          flashes++;
          
          if (flashes >= flashCount * 2) {
            clearInterval(flashInterval);
            element.classList.remove('flash');
          }
        }, 300);
      }

      // Remove highlight after duration
      setTimeout(() => {
        element.classList.remove(animationClass);
        element.classList.remove('highlighted');
        
        // Remove tabindex if we added it
        if (element.getAttribute('tabindex') === '-1') {
          element.removeAttribute('tabindex');
        }
      }, duration);

      return true;
    };

    // Try immediately and retry if needed
    if (!applyHighlightEffect()) {
      // Retry after DOM updates
      setTimeout(applyHighlightEffect, 100);
      setTimeout(applyHighlightEffect, 500);
      setTimeout(applyHighlightEffect, 1000);
    }
  }

  /**
   * Generate return URL for current location
   * @param {string} breakdownId - Breakdown ID for context
   */
  generateReturnUrl(breakdownId) {
    const currentPath = window.location.pathname;
    const currentParams = new URLSearchParams(window.location.search);
    
    // Add highlight parameter
    currentParams.set('highlight', breakdownId);
    
    return `${currentPath}${currentParams.toString() ? '?' + currentParams.toString() : ''}`;
  }

  /**
   * Store pending highlight for cross-window communication
   */
  storePendingHighlight(breakdownId, data) {
    const highlightData = {
      breakdownId,
      ...data,
      timestamp: new Date().toISOString(),
      expires: Date.now() + 60000 // Expire after 1 minute
    };
    
    try {
      localStorage.setItem('pendingHighlight', JSON.stringify(highlightData));
      this.pendingHighlights.set(breakdownId, highlightData);
    } catch (error) {
      console.error('Failed to store pending highlight:', error);
    }
  }

  /**
   * Get pending highlight from storage
   */
  getPendingHighlight() {
    try {
      const stored = localStorage.getItem('pendingHighlight');
      if (!stored) return null;
      
      const data = JSON.parse(stored);
      
      // Check if expired
      if (data.expires && Date.now() > data.expires) {
        localStorage.removeItem('pendingHighlight');
        return null;
      }
      
      // Clear after retrieving
      localStorage.removeItem('pendingHighlight');
      
      return data;
    } catch (error) {
      console.error('Failed to get pending highlight:', error);
      return null;
    }
  }

  /**
   * Store navigation state for return journey
   */
  storeNavigationState(state) {
    try {
      const key = `navState_${state.breakdownId}`;
      sessionStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to store navigation state:', error);
    }
  }

  /**
   * Clear navigation state
   */
  clearNavigationState(breakdownId) {
    try {
      const key = `navState_${breakdownId}`;
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to clear navigation state:', error);
    }
  }

  /**
   * Get navigation state
   */
  getNavigationState(breakdownId) {
    try {
      const key = `navState_${breakdownId}`;
      const stored = sessionStorage.getItem(key);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to get navigation state:', error);
      return null;
    }
  }

  /**
   * Log navigation for analytics
   */
  logNavigation(from, to, data) {
    const navigationEvent = {
      from,
      to,
      timestamp: new Date().toISOString(),
      ...data
    };
    
    this.navigationHistory.push(navigationEvent);
    
    // Keep only last 50 entries
    if (this.navigationHistory.length > 50) {
      this.navigationHistory = this.navigationHistory.slice(-50);
    }
    
    // Also log to console for debugging
    console.log(`🗺️ Navigation: ${from} → ${to}`, data);
  }

  /**
   * Announce highlight to screen readers
   */
  announceHighlight(breakdownId, options) {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.className = 'sr-only';
    
    const message = options.decision 
      ? `Breakdown ${breakdownId} completed with decision: ${options.decision}. Element highlighted and focused.`
      : `Breakdown ${breakdownId} is now highlighted and focused.`;
    
    announcement.textContent = message;
    document.body.appendChild(announcement);
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }

  /**
   * Check if on SDC Dashboard
   */
  isOnSDCDashboard() {
    return window.location.pathname.includes('/dashboards/sdc');
  }

  /**
   * Check if on breakdown guide
   */
  isOnBreakdownGuide() {
    return window.location.pathname.includes('/breakdown-guide');
  }

  /**
   * Get navigation history
   */
  getNavigationHistory() {
    return this.navigationHistory;
  }

  /**
   * Clear navigation history
   */
  clearNavigationHistory() {
    this.navigationHistory = [];
  }

  /**
   * Add focus management for keyboard navigation
   */
  manageFocus(breakdownId) {
    // Add to focus queue
    this.focusQueue.push(breakdownId);
    
    // Process focus queue
    this.processFocusQueue();
  }

  /**
   * Process focus queue
   */
  processFocusQueue() {
    if (this.focusQueue.length === 0) return;
    
    const breakdownId = this.focusQueue.shift();
    const element = document.getElementById(breakdownId) || 
                   document.querySelector(`[data-breakdown-id="${breakdownId}"]`);
    
    if (element) {
      element.focus();
    } else {
      // Retry after a delay
      setTimeout(() => {
        this.focusQueue.unshift(breakdownId);
        this.processFocusQueue();
      }, 100);
    }
  }
}

// Create singleton instance
const navigationService = new NavigationService();

export default navigationService;

// Export convenience methods
export const {
  navigateToSDCDashboard,
  navigateToBreakdownGuide,
  handleBreakdownGuideCompletion,
  processUrlParameters,
  applyHighlight,
  manageFocus
} = navigationService;