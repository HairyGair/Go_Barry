/**
 * Protected Route Component
 * Ensures user is authenticated AND has selected a duty before accessing protected pages
 *
 * Flow:
 * 1. Check if user is authenticated
 * 2. Check if duty is selected
 * 3. If both true, render children
 * 4. If missing duty, show DutySelectionModal (mandatory, cannot skip)
 * 5. If not authenticated, redirect to login
 */

import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import DutySelectionModal from './DutySelectionModal';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, currentUser, isSessionChecking } = useAuth();
  const [currentDuty, setCurrentDuty] = useState(null);
  const [showDutyModal, setShowDutyModal] = useState(false);

  // Check for existing duty on mount and when auth changes
  useEffect(() => {
    if (isAuthenticated && !isSessionChecking) {
      const existingDuty = sessionStorage.getItem('currentDuty');
      if (existingDuty) {
        try {
          const duty = JSON.parse(existingDuty);
          setCurrentDuty(duty);
          setShowDutyModal(false);
        } catch (error) {
          console.error('Error parsing existing duty:', error);
          setShowDutyModal(true);
        }
      } else {
        // No duty found - show modal
        setShowDutyModal(true);
      }
    }
  }, [isAuthenticated, isSessionChecking]);

  // Handle duty selection
  const handleDutySelected = (dutyData) => {
    console.log('✅ ProtectedRoute: Duty selected:', dutyData);
    setCurrentDuty(dutyData);
    setShowDutyModal(false);
  };

  // Show loading while checking session
  if (isSessionChecking) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Checking session...</p>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Show duty selection modal if no duty selected (mandatory)
  if (showDutyModal || !currentDuty) {
    return (
      <DutySelectionModal
        onDutySelected={handleDutySelected}
        currentUser={currentUser}
      />
    );
  }

  // Authenticated and duty selected - render protected content
  return <>{children}</>;
};

export default ProtectedRoute;
