/**
 * useNavigationIntegration Hook
 * React hook for seamless navigation integration between breakdown guide and SDC Dashboard
 */

import { useEffect, useCallback, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import navigationService from '../services/navigationService';

export function useNavigationIntegration() {
  const location = useLocation();
  const navigate = useNavigate();
  const [urlParams, setUrlParams] = useState({});
  const [isHighlighting, setIsHighlighting] = useState(false);

  // Process URL parameters on mount and location change
  useEffect(() => {
    const params = navigationService.processUrlParameters();
    setUrlParams(params);

    // Handle highlighting
    if (params.highlight) {
      setIsHighlighting(true);
      
      // Apply highlight effect
      setTimeout(() => {
        navigationService.applyHighlight(params.highlight, {
          duration: parseInt(params.flashDuration) || 10000,
          scrollTo: params.scrollTo !== 'false',
          decision: params.decision,
          focusElement: true
        });
        
        setIsHighlighting(false);
      }, 100); // Small delay to ensure DOM is ready
    }

    // Handle completion flag
    if (params.completed === 'true') {
      console.log('✅ Returning from completed breakdown guide');
      
      // Show success notification
      showCompletionNotification(params);
    }

  }, [location]);

  // Navigate to SDC Dashboard
  const navigateToSDCDashboard = useCallback((breakdownId, options = {}) => {
    return navigationService.navigateToSDCDashboard(breakdownId, options);
  }, []);

  // Navigate to breakdown guide
  const navigateToBreakdownGuide = useCallback((breakdownId, options = {}) => {
    return navigationService.navigateToBreakdownGuide(breakdownId, options);
  }, []);

  // Handle breakdown guide completion
  const handleBreakdownGuideCompletion = useCallback((completionData) => {
    navigationService.handleBreakdownGuideCompletion(completionData);
  }, []);

  // Apply highlight to element
  const highlightElement = useCallback((elementId, options = {}) => {
    navigationService.applyHighlight(elementId, options);
  }, []);

  // Get current highlight target
  const getHighlightTarget = useCallback(() => {
    return urlParams.highlight || null;
  }, [urlParams]);

  // Check if should show completion notification
  const shouldShowCompletionNotification = useCallback(() => {
    return urlParams.completed === 'true';
  }, [urlParams]);

  // Get navigation state
  const getNavigationState = useCallback((breakdownId) => {
    return navigationService.getNavigationState(breakdownId);
  }, []);

  // Clear navigation state
  const clearNavigationState = useCallback((breakdownId) => {
    navigationService.clearNavigationState(breakdownId);
  }, []);

  return {
    // Navigation methods
    navigateToSDCDashboard,
    navigateToBreakdownGuide,
    handleBreakdownGuideCompletion,
    
    // Highlight methods
    highlightElement,
    getHighlightTarget,
    isHighlighting,
    
    // URL parameters
    urlParams,
    
    // State management
    getNavigationState,
    clearNavigationState,
    
    // Completion handling
    shouldShowCompletionNotification,
    
    // Utility
    isOnSDCDashboard: navigationService.isOnSDCDashboard(),
    isOnBreakdownGuide: navigationService.isOnBreakdownGuide()
  };
}

// Helper function to show completion notification
function showCompletionNotification(params) {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = 'completion-notification';
  notification.innerHTML = `
    <div class="notification-content">
      <div class="notification-icon">✅</div>
      <div class="notification-text">
        <strong>Assessment Completed</strong>
        <p>Breakdown ${params.highlight} - Decision: ${params.decision || 'Completed'}</p>
      </div>
      <button class="notification-close" onclick="this.parentElement.parentElement.remove()">✕</button>
    </div>
  `;
  
  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    .completion-notification {
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      padding: 16px 20px;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      z-index: 9999;
      animation: slideIn 0.3s ease-out;
      max-width: 400px;
    }
    
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    .notification-content {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }
    
    .notification-icon {
      font-size: 24px;
      flex-shrink: 0;
    }
    
    .notification-text {
      flex: 1;
    }
    
    .notification-text strong {
      display: block;
      font-size: 16px;
      margin-bottom: 4px;
    }
    
    .notification-text p {
      margin: 0;
      font-size: 14px;
      opacity: 0.9;
    }
    
    .notification-close {
      background: none;
      border: none;
      color: white;
      font-size: 20px;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: background 0.2s ease;
    }
    
    .notification-close:hover {
      background: rgba(255, 255, 255, 0.2);
    }
  `;
  
  document.head.appendChild(style);
  document.body.appendChild(notification);
  
  // Auto-remove after 8 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-in';
    notification.style.animationFillMode = 'forwards';
    
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 8000);
  
  // Add slide out animation
  const slideOutStyle = document.createElement('style');
  slideOutStyle.textContent = `
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(slideOutStyle);
}

// Export hook
export default useNavigationIntegration;