/**
 * Go BARRY Breakdown Management System - Main Application
 *
 * Copyright © 2025 Anthony Gair. All Rights Reserved.
 *
 * This software is proprietary and confidential. Unauthorized copying,
 * distribution, modification, or use is strictly prohibited.
 *
 * Licensed exclusively to Go North East for internal breakdown management.
 * See LICENSE.md for full terms and conditions.
 *
 * @author Anthony Gair
 * @version 2.0.0
 * @license Proprietary
 */

import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom'
import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import './App.css'

// Import AuthProvider
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx'

// Import Authentication Components
import MySQLLoginPage from './components/MySQLLoginPage.jsx'
import DutySelectionModal from './components/DutySelectionModal.jsx'
import DutyIndicator from './components/DutyIndicator.jsx'
import WelcomeMessage from './components/WelcomeMessage.jsx'

// Import Modern Header Component
import ModernAppHeader from './components/ModernAppHeader.jsx'

// Import BreakdownGuide
import BreakdownGuideApp from './breakdown-guide/App.jsx'

// Import Dashboard Router
import { DashboardRouter } from './dashboards'

// Import Engineering Display (public standalone route)
import EngineeringDisplay from './dashboards/engineering/EngineeringDisplay'

// Import HomePage
import HomePage from './components/HomePage.jsx'

// Import NotificationPanel
import NotificationPanel from './components/NotificationPanel.jsx'
// Import Settings Page
import SettingsPage from './components/SettingsPage.jsx'

// Import QuickFeedback and ErrorBoundary
import QuickFeedback from './components/QuickFeedback.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

const BreakdownGuide = () => {
  return <BreakdownGuideApp />
}

// Placeholder Components
const ComingSoon = ({ title }) => (
  <div className="coming-soon">
    <h2>{title}</h2>
    <p>This feature is coming soon!</p>
    <p className="coming-soon-date">Expected: September 2025</p>
  </div>
)

// Main Navigation Component with Enhanced Design
const Navigation = ({ hide = false, activeBreakdowns = 0, currentDuty, onDutyClick }) => {
  if (hide) return null;

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const location = useLocation()
  const { currentUser, logout } = useAuth()
  
  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])
  
  const formatTime = () => {
    return currentTime.toLocaleString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  // Check if link is active
  const isLinkActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  }
  
  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isMenuOpen && !e.target.closest('.nav-container')) {
        setIsMenuOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [isMenuOpen])
  
  return (
    <nav className="main-nav">
      <div className="nav-container">
        <Link to="/" className="logo">
          <img src="/GO_NORTHEAST_WHITE_RGB.png" alt="Go North East" />
          <span className="logo-text">Breakdown System</span>
        </Link>
        
        <button 
          className="menu-toggle"
          onClick={(e) => {
            e.stopPropagation()
            setIsMenuOpen(!isMenuOpen)
          }}
        >
          {isMenuOpen ? '✕' : '☰'}
        </button>
        
        <div className={`nav-content ${isMenuOpen ? 'open' : ''}`}>
          <>
            <ul className="nav-links">
                <li>
                  <Link
                    to="/breakdown-guide"
                    className={isLinkActive('/breakdown-guide') ? 'active' : ''}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span className="nav-icon">🚨</span>
                    <span>Breakdown Guide</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/dashboards/control-room"
                    className={isLinkActive('/dashboards') ? 'active' : ''}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span className="nav-icon">📺</span>
                    <span>Control Room</span>
                    {activeBreakdowns > 0 && (
                      <span className="nav-badge">{activeBreakdowns}</span>
                    )}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/fleet-intelligence"
                    className={isLinkActive('/fleet-intelligence') ? 'active' : ''}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span className="nav-icon">🔧</span>
                    <span>Fleet Intelligence</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/management"
                    className={isLinkActive('/management') ? 'active' : ''}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span className="nav-icon">📈</span>
                    <span>Management</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/sdc-operations"
                    className={isLinkActive('/sdc-operations') ? 'active' : ''}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span className="nav-icon">📞</span>
                    <span>SDC Operations</span>
                  </Link>
                </li>
              </ul>
              <div className="nav-user-section">
                <span className="nav-time">{formatTime()}</span>
                {currentDuty && (
                  <DutyIndicator
                    currentDuty={currentDuty}
                    onClick={onDutyClick}
                    isAdmin={currentUser?.role === 'admin'}
                  />
                )}
                <button
                  className="nav-notification-btn"
                  title="Notifications"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <span className="notification-icon">🔔</span>
                  {activeBreakdowns > 0 && (
                    <span className="notification-badge">{activeBreakdowns}</span>
                  )}
                </button>
                <div className="nav-profile-section">
                  <button
                    className="nav-profile-btn"
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                  >
                    <span className="profile-icon">👤</span>
                    <span className="profile-name">{currentUser?.name || 'User'}</span>
                    <span className="profile-arrow">▼</span>
                  </button>
                  {showProfileMenu && (
                    <div className="profile-dropdown">
                      <div className="dropdown-header">
                        <strong>{currentUser?.name || 'User'}</strong>
                        <span>{currentUser?.email || ''}</span>
                      </div>
                      <hr />
                      <Link to="/profile" onClick={() => setShowProfileMenu(false)}>
                        <span>⚙️</span> Settings
                      </Link>
                      <Link to="/help" onClick={() => setShowProfileMenu(false)}>
                        <span>❓</span> Help & Support
                      </Link>
                      <hr />
                      <button onClick={() => logout()} className="dropdown-signout">
                        <span>🚪</span> Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
        </div>
      </div>
      <NotificationPanel 
        isOpen={showNotifications} 
        onClose={() => setShowNotifications(false)} 
      />
    </nav>
  )
}

// Main App Component - With Authentication
const AppContent = () => {
  const { isAuthenticated, currentUser, isSessionChecking } = useAuth()
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [activeBreakdowns, setActiveBreakdowns] = useState(0)
  const [showDutyModal, setShowDutyModal] = useState(false)
  const [currentDuty, setCurrentDuty] = useState(null)
  const [showWelcome, setShowWelcome] = useState(false)
  const location = useLocation()

  // Check for existing duty on mount
  useEffect(() => {
    const existingDuty = sessionStorage.getItem('currentDuty')
    if (existingDuty) {
      try {
        setCurrentDuty(JSON.parse(existingDuty))
      } catch (error) {
        console.error('Error parsing existing duty:', error)
      }
    }
  }, [])

  // Check for duty modal flag after login
  useEffect(() => {
    if (isAuthenticated && !isSessionChecking) {
      const shouldShowDutyModal = sessionStorage.getItem('showDutyModal')
      if (shouldShowDutyModal === 'true' && !currentDuty) {
        setShowDutyModal(true)
      }
    }
  }, [isAuthenticated, isSessionChecking, currentDuty])

  // Online/Offline monitoring
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!e.altKey) return

      const shortcuts = {
        '1': '/breakdown-guide',
        '2': '/dashboards/breakdown',
        '3': '/fleet-intelligence',
        '4': '/management',
        '5': '/sdc-operations'
      }

      if (shortcuts[e.key]) {
        e.preventDefault()
        window.location.href = shortcuts[e.key]
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
  
  // Stats change handler for navigation badge
  const handleStatsChange = useCallback((count) => {
    setActiveBreakdowns(count)
  }, [])

  // Duty selection handler
  const handleDutySelected = useCallback((dutyData) => {
    console.log('✅ Duty selected:', dutyData)
    setCurrentDuty(dutyData)
    setShowDutyModal(false)
    setShowWelcome(true)
  }, [])

  // Duty click handler (admin only)
  const handleDutyClick = useCallback(() => {
    if (currentUser?.role === 'admin') {
      setShowDutyModal(true)
    }
  }, [currentUser])

  const hideNav = location.pathname === '/breakdown-guide' || location.pathname === '/dashboards/control-room'

  // Flag to toggle between classic and modern header
  const useModernHeader = true // Set to false to use classic header

  // Show login page if not authenticated
  if (!isAuthenticated && !isSessionChecking) {
    return <MySQLLoginPage />
  }

  // Show loading while checking session
  if (isSessionChecking) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className={`app ${!isOnline ? 'offline' : ''}`}>
      {useModernHeader ? (
        // Modern Header - Show when not on breakdown-guide page
        !hideNav && (
          <ModernAppHeader
            variant="full"
            isAuthenticated={true}
            activeBreakdowns={activeBreakdowns}
          />
        )
      ) : (
        // Classic Navigation
        <Navigation
          hide={hideNav}
          activeBreakdowns={activeBreakdowns}
          currentDuty={currentDuty}
          onDutyClick={handleDutyClick}
        />
      )}

      {!isOnline && (
        <div className="offline-banner">
          ⚠️ You are currently offline. Some features may be limited.
        </div>
      )}

      {/* Duty Selection Modal */}
      {showDutyModal && (
        <DutySelectionModal
          onDutySelected={handleDutySelected}
          currentUser={currentUser}
        />
      )}

      {/* Welcome Message */}
      {showWelcome && (
        <WelcomeMessage
          currentUser={currentUser}
          currentDuty={currentDuty}
          onClose={() => setShowWelcome(false)}
        />
      )}

      <main className={`main-container ${hideNav ? 'no-nav' : ''} ${useModernHeader && !hideNav ? 'with-modern-header' : ''}`}>
        <Routes>
          <Route path="/" element={<HomePage onStatsChange={handleStatsChange} />} />
          <Route path="/breakdown-guide/*" element={<BreakdownGuide />} />
          <Route path="/dashboards/*" element={<DashboardRouter />} />
          <Route path="/fleet-intelligence" element={<ComingSoon title="Fleet Intelligence" />} />
          <Route path="/management" element={<ComingSoon title="Management Portal" />} />
          <Route path="/sdc-operations" element={<Navigate to="/dashboards/sdc" replace />} />
          <Route path="/profile" element={<Navigate to="/settings" replace />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route
            path="/help"
            element={<ComingSoon title="Help & Support" />}
          />
          <Route
            path="*"
            element={
              <div className="not-found">
                <h2>404 - Page Not Found</h2>
                <p>The page you're looking for doesn't exist.</p>
                <Link to="/">Go back home</Link>
              </div>
            }
          />
        </Routes>
      </main>

      {/* Quick Feedback Widget - Always visible when logged in */}
      {isAuthenticated && <QuickFeedback />}
    </div>
  )
}

// Public Routes Component (no authentication required)
const PublicRoutes = () => {
  return (
    <Routes>
      <Route path="/dashboards/engineering/display" element={<EngineeringDisplay />} />
    </Routes>
  )
}

// Main App Component - With Auth Provider and Error Boundary
function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public routes - no authentication required */}
            <Route path="/dashboards/engineering/display" element={<EngineeringDisplay />} />
            {/* All other routes require authentication */}
            <Route path="*" element={<AppContent />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
