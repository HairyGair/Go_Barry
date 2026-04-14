/**
 * Go BARRY Breakdown Management System - Main Application
 *
 * Copyright © 2025 Anthony Gair. All Rights Reserved.
 *
 * This software is proprietary and confidential. Unauthorized copying,
 * distribution, modification, or use is strictly prohibited.
 *
 * See LICENSE.md for full terms and conditions.
 *
 * @author Anthony Gair
 * @version 2.0.0
 * @license Proprietary
 */

import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect, useMemo, useRef, useCallback, lazy, Suspense } from 'react'
import './App.css'

// Phase 6.4: Global accessibility styles for touch targets
import './styles/accessibility.css'

// Import AuthProvider
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx'

// Import Authentication Components
import MySQLLoginPage from './components/MySQLLoginPage.jsx'
import DutySelectionModal from './components/DutySelectionModal.jsx'
import DutyIndicator from './components/DutyIndicator.jsx'
import WelcomeMessage from './components/WelcomeMessage.jsx'

// Import Minimal User Menu (floating dropdown in top-right)
import MinimalUserMenu from './components/MinimalUserMenu.jsx'

// Import Go BARRY Logo
import { GoBarryBanner } from './components/GoBarryLogo.jsx'

// Import Footer Component
import AppFooter from './components/AppFooter.jsx'

// Lazy-loaded heavy components
const BreakdownGuideApp = lazy(() => import('./breakdown-guide/App.jsx'))
const FleetIntelligenceDashboard = lazy(() => import('./dashboards/fleet-intelligence/FleetIntelligenceDashboard'))
const EngineeringDisplay = lazy(() => import('./dashboards/engineering/EngineeringDisplay'))
const HomePage = lazy(() => import('./components/HomePage.jsx'))
const SettingsPage = lazy(() => import('./components/SettingsPage.jsx'))

// Import Dashboard Router (itself lazy-loads dashboards internally)
import { DashboardRouter } from './dashboards'

// Import NotificationPanel
import NotificationPanel from './components/NotificationPanel.jsx'

// Import QuickFeedback and ErrorBoundary
import QuickFeedback from './components/QuickFeedback.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

// Import Duty Notes Widget
import DutyNotesWidget from './components/DutyNotesWidget.jsx'

// Import End of Shift Modal
import EndOfShiftModal from './components/EndOfShiftModal.jsx'

// Import Handover Reminder Toast
import HandoverReminderToast from './components/HandoverReminderToast.jsx'

// Import Duty Theme Provider (Phase 8.2)
import DutyThemeProvider from './components/DutyThemeProvider.jsx'
import './components/DutyThemeProvider.css'

// Import Shift Summary Modal (Phase 8.4)
import ShiftSummaryModal from './components/ShiftSummaryModal.jsx'
import './components/ShiftSummaryModal.css'

// Import Session Timeout Warning (Phase 9.3)
import SessionTimeoutWarning from './components/SessionTimeoutWarning.jsx'
import './components/SessionTimeoutWarning.css'

// Import Shift Reminder Service
import shiftReminderService from './services/shiftReminderService.js'

// Import Voice Announcement Service (Phase 6.2)
import voiceAnnouncementService from './services/voiceAnnouncementService.js'

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
          <GoBarryBanner height={40} theme="dark" showTagline={false} />
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
                    <span>Display</span>
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
                    <span>Operations</span>
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
  const [activeBreakdownsList, setActiveBreakdownsList] = useState([])
  const [showDutyModal, setShowDutyModal] = useState(false)
  const [currentDuty, setCurrentDuty] = useState(null)
  const [dutyChecked, setDutyChecked] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)
  const [shiftWarningLevel, setShiftWarningLevel] = useState(null) // 30, 15, 5, or 0
  const [showEndOfShiftModal, setShowEndOfShiftModal] = useState(false)
  const [acknowledgedWarnings, setAcknowledgedWarnings] = useState(new Set())
  const [showShiftSummary, setShowShiftSummary] = useState(false) // Phase 8.4
  const [shiftStats, setShiftStats] = useState({}) // Phase 8.4 - aggregated stats
  const [showDemoBanner, setShowDemoBanner] = useState(true) // Demo mode banner visibility
  const location = useLocation()
  const navigate = useNavigate()

  // Dynamic page title based on route
  useEffect(() => {
    const titles = {
      '/': 'Home',
      '/breakdown-guide': 'Breakdown Guide',
      '/dashboards/sdc': 'Operations Dashboard',
      '/dashboards/control-room': 'Display Dashboard',
      '/dashboards/engineering': 'Engineering Dashboard',
      '/dashboards/engineering/manage': 'Engineer Management',
      '/dashboards/management': 'Management Dashboard',
      '/dashboards/gtfs/routes': 'Route Status',
      '/dashboards/gtfs/timetable': 'Timetable Viewer',
      '/dashboards/gtfs/stops': 'Stop Finder',
      '/dashboards/fleet-defects': 'Fleet Intelligence',
      '/dashboards/ev-charges': 'EV Charges',
      '/fleet-intelligence': 'Fleet Intelligence',
      '/settings': 'Settings',
      '/help': 'Help & Support',
    }
    const pageTitle = titles[location.pathname] || 'Page'
    document.title = `${pageTitle} - Go BARRY`
  }, [location.pathname])

  // Detect demo user
  const isDemoUser = currentUser?.badge_number === 'DEMO01' || currentUser?.is_demo === true

  // Check for existing duty on mount and validate expiration
  useEffect(() => {
    const existingDuty = sessionStorage.getItem('currentDuty')
    if (existingDuty) {
      try {
        const dutyData = JSON.parse(existingDuty)

        // Check if duty has shift end time and hasn't expired
        if (dutyData.shiftEnd) {
          const shiftEndTime = new Date(dutyData.shiftEnd)
          const now = new Date()

          if (now < shiftEndTime) {
            // Duty still valid
            console.log('✅ Existing duty valid until:', shiftEndTime.toLocaleString())
            setCurrentDuty(dutyData)
          } else {
            // Duty expired
            console.log('⏰ Duty expired at:', shiftEndTime.toLocaleString())
            sessionStorage.removeItem('currentDuty')
            sessionStorage.removeItem('showDutyModal')
          }
        } else {
          // Legacy duty without shift end time - keep for now
          console.log('⚠️ Legacy duty without expiration found')
          setCurrentDuty(dutyData)
        }
      } catch (error) {
        console.error('Error parsing existing duty:', error)
        sessionStorage.removeItem('currentDuty')
      }
    }
    setDutyChecked(true)
  }, [])

  const isEngineeringManager = currentUser?.role === 'engineering_manager'

  // Auto-set Day Shift for demo users (skip duty selection entirely)
  useEffect(() => {
    if (isAuthenticated && !isSessionChecking && isDemoUser && !currentDuty) {
      console.log('🎭 Demo user detected - auto-setting Day Shift (Duty 200)')
      const demoDuty = {
        code: '200',
        name: 'Day Shift',
        startTime: '07:30',
        endTime: '17:00',
        shiftStart: new Date().toISOString(),
        shiftEnd: new Date(Date.now() + 9.5 * 60 * 60 * 1000).toISOString(),
        isDemo: true
      }
      setCurrentDuty(demoDuty)
      sessionStorage.setItem('currentDuty', JSON.stringify(demoDuty))
      sessionStorage.removeItem('showDutyModal')
      setShowDemoBanner(true)
    }
  }, [isAuthenticated, isSessionChecking, isDemoUser, currentDuty])

  // Show duty modal after login if no valid duty exists
  // Only runs AFTER sessionStorage duty check completes (dutyChecked=true)
  // Engineering managers and demo users skip duty selection entirely
  useEffect(() => {
    if (isAuthenticated && !isSessionChecking && dutyChecked && !currentDuty && !isEngineeringManager && !isDemoUser) {
      console.log('🔔 Authenticated with no duty - showing duty modal')
      setShowDutyModal(true)
      sessionStorage.removeItem('showDutyModal')
    }
  }, [isAuthenticated, isSessionChecking, dutyChecked, currentDuty, isEngineeringManager, isDemoUser])

  // Redirect engineering_manager to their landing page
  useEffect(() => {
    if (isAuthenticated && !isSessionChecking && isEngineeringManager && location.pathname === '/') {
      navigate('/dashboards/engineering/manage', { replace: true })
    }
  }, [isAuthenticated, isSessionChecking, isEngineeringManager, location.pathname, navigate])

  // Monitor shift time for end-of-shift warnings (30/15/5/0 minutes)
  useEffect(() => {
    if (!currentDuty || !currentDuty.endTime) return;

    const checkShiftWarnings = () => {
      const now = new Date();
      const [endHour, endMin] = currentDuty.endTime.split(':').map(Number);
      const [startHour] = currentDuty.startTime.split(':').map(Number);

      const endTime = new Date();
      endTime.setHours(endHour, endMin, 0, 0);

      // Handle overnight shifts
      if (endHour < startHour) {
        if (now.getHours() < 12) {
          // We're in the early morning of the next day
        } else {
          endTime.setDate(endTime.getDate() + 1);
        }
      }

      const remainingMs = endTime - now;
      const remainingMinutes = Math.floor(remainingMs / (1000 * 60));

      // Determine warning level based on remaining time
      let newWarningLevel = null;

      if (remainingMinutes <= 0) {
        newWarningLevel = 0;
      } else if (remainingMinutes <= 5) {
        newWarningLevel = 5;
      } else if (remainingMinutes <= 15) {
        newWarningLevel = 15;
      } else if (remainingMinutes <= 30) {
        newWarningLevel = 30;
      }

      // Only show modal if we hit a new warning threshold that hasn't been acknowledged
      if (newWarningLevel !== null && newWarningLevel !== shiftWarningLevel) {
        if (newWarningLevel === 0 || !acknowledgedWarnings.has(newWarningLevel)) {
          console.log(`⏰ Shift warning triggered: ${newWarningLevel} minutes`);
          setShiftWarningLevel(newWarningLevel);
          setShowEndOfShiftModal(true);
        }
      }
    };

    // Check immediately and then every 30 seconds
    checkShiftWarnings();
    const timer = setInterval(checkShiftWarnings, 30000);

    return () => clearInterval(timer);
  }, [currentDuty, shiftWarningLevel, acknowledgedWarnings]);

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

  // Initialize shift reminder service when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      console.log('🔔 Initializing shift reminder service');
      shiftReminderService.initialize();
    }

    return () => {
      shiftReminderService.stopMonitoring();
    };
  }, [isAuthenticated]);

  // Phase 6.2: Initialize voice announcement service when on duty
  useEffect(() => {
    if (isAuthenticated && currentDuty) {
      console.log('🔊 Initializing voice announcement service');
      voiceAnnouncementService.initializeVoice();

      // Start monitoring if enabled in settings
      const settings = voiceAnnouncementService.getSettings();
      if (settings.enabled) {
        voiceAnnouncementService.startMonitoring();
        // Announce duty start
        voiceAnnouncementService.announceDutyStart(currentDuty);
      }
    }

    return () => {
      voiceAnnouncementService.stopMonitoring();
    };
  }, [isAuthenticated, currentDuty]);

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
  const handleStatsChange = useCallback((count, breakdownsList = []) => {
    setActiveBreakdowns(count)
    setActiveBreakdownsList(breakdownsList)
  }, [])

  // Handover reminder handlers
  const handleStartHandover = useCallback(() => {
    // TODO: Open DutyHandoverModal when integrated
    console.log('🔄 Starting handover...')
  }, [])

  const handleQuickResolve = useCallback(async (breakdownId) => {
    console.log('✅ Quick resolving breakdown:', breakdownId)
    // TODO: Call API to resolve breakdown
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

  // End of shift modal handlers
  const handleAcknowledgeWarning = useCallback(() => {
    if (shiftWarningLevel !== 0) {
      setAcknowledgedWarnings(prev => new Set([...prev, shiftWarningLevel]));
      setShowEndOfShiftModal(false);
    }
  }, [shiftWarningLevel]);

  const handleExtendShift = useCallback(() => {
    // Extend by 30 minutes
    if (currentDuty) {
      const [endHour, endMin] = currentDuty.endTime.split(':').map(Number);
      const newEndTime = new Date();
      newEndTime.setHours(endHour, endMin + 30, 0, 0);

      const newEndTimeStr = `${String(newEndTime.getHours()).padStart(2, '0')}:${String(newEndTime.getMinutes()).padStart(2, '0')}`;

      const extendedDuty = {
        ...currentDuty,
        endTime: newEndTimeStr,
        extended: true,
        originalEndTime: currentDuty.originalEndTime || currentDuty.endTime
      };

      setCurrentDuty(extendedDuty);
      sessionStorage.setItem('currentDuty', JSON.stringify(extendedDuty));
      setShowEndOfShiftModal(false);
      setShiftWarningLevel(null);
      setAcknowledgedWarnings(new Set());
      console.log('✅ Shift extended by 30 minutes to:', newEndTimeStr);
    }
  }, [currentDuty]);

  // Phase 8.4: Show summary modal before ending shift
  const handleEndShift = useCallback(() => {
    // Calculate shift stats for summary
    const stats = {
      breakdownsHandled: activeBreakdowns,
      breakdownsResolved: 0, // Would need API call for accurate count
      breakdownsPending: activeBreakdowns,
      assessmentsCompleted: 0, // Would need API call
      avgResponseTime: null, // Would need API call
      shiftExtended: currentDuty?.extended || false,
      isFirstShift: false, // Would check from user profile
      performance: 'good'
    };
    setShiftStats(stats);
    setShowEndOfShiftModal(false);
    setShowShiftSummary(true);
    console.log('📊 Showing shift summary');
  }, [activeBreakdowns, currentDuty]);

  // Phase 8.4: Confirm end shift after summary
  const handleConfirmEndShift = useCallback((summaryData) => {
    console.log('✅ Shift summary confirmed:', summaryData);
    sessionStorage.removeItem('currentDuty');
    setCurrentDuty(null);
    setShowShiftSummary(false);
    setShiftWarningLevel(null);
    setAcknowledgedWarnings(new Set());
    setShowDutyModal(true);
    console.log('🚪 Shift ended');
  }, []);

  // Phase 8.4: Cancel summary and continue working
  const handleCancelSummary = useCallback(() => {
    setShowShiftSummary(false);
    setShowEndOfShiftModal(false);
    console.log('↩️ Continuing shift');
  }, []);

  // Only hide header for full-screen control room display
  const hideNav = location.pathname === '/dashboards/control-room' || location.pathname.includes('/display')

  // Flag to toggle between classic and modern header
  const useModernHeader = true // Set to false to use classic header

  // Show login page if not authenticated
  if (!isAuthenticated && !isSessionChecking) {
    return <MySQLLoginPage />
  }

  // Show loading while checking session
  if (isSessionChecking) {
    return (
      <div className="app-loading" role="status" aria-live="polite">
        <div className="loading-spinner" aria-hidden="true"></div>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className={`app ${!isOnline ? 'offline' : ''} ${isDemoUser && showDemoBanner ? 'demo-mode' : ''}`}>
      {/* Skip to main content link for keyboard/screen reader users */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {useModernHeader ? (
        // Minimal User Menu - Floating dropdown in top-right
        !hideNav && (
          <MinimalUserMenu
            currentDuty={currentDuty}
            onDutyClick={handleDutyClick}
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
        <div className="offline-banner" role="alert" aria-live="assertive">
          You are currently offline. Some features may be limited.
        </div>
      )}

      {/* Demo Mode Banner */}
      {isDemoUser && showDemoBanner && (
        <div className="demo-mode-banner">
          <span className="demo-mode-banner-text">
            Demo Mode - Exploring with sample data
          </span>
          <button
            className="demo-mode-hide-btn"
            onClick={() => setShowDemoBanner(false)}
            title="Hide banner (for screenshots)"
          >
            Hide
          </button>
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

      <main id="main-content" className={`main-container ${hideNav ? 'no-nav' : ''}`}>
        <Suspense fallback={<div className="loading-container" role="status" aria-live="polite"><div className="loading-spinner" aria-hidden="true"></div><p>Loading...</p></div>}>
          <Routes>
            <Route path="/" element={<HomePage onStatsChange={handleStatsChange} currentDuty={currentDuty} />} />
            <Route path="/breakdown-guide/*" element={<BreakdownGuide />} />
            <Route path="/dashboards/*" element={<DashboardRouter />} />
            <Route path="/fleet-intelligence" element={<FleetIntelligenceDashboard />} />
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
        </Suspense>
      </main>

      {/* App Footer - GairWare Branding - Always visible */}
      <AppFooter variant={hideNav ? 'dark' : 'default'} />

      {/* Quick Feedback Widget - Always visible when logged in (hidden on Control Room Display) */}
      {isAuthenticated && !hideNav && <QuickFeedback />}

      {/* Duty Notes Widget - Quick note input (hidden on Control Room Display) */}
      {isAuthenticated && currentDuty && !hideNav && (
        <DutyNotesWidget
          currentDuty={currentDuty}
          position="bottom-left"
        />
      )}

      {/* End of Shift Warning Modal (hidden on Control Room Display) */}
      {isAuthenticated && currentDuty && !hideNav && (
        <EndOfShiftModal
          currentDuty={currentDuty}
          activeBreakdowns={activeBreakdowns}
          isVisible={showEndOfShiftModal}
          warningLevel={shiftWarningLevel}
          onExtendShift={handleExtendShift}
          onEndShift={handleEndShift}
          onStartHandover={() => {
            setShowEndOfShiftModal(false);
            // Trigger handover modal if available
          }}
        />
      )}

      {/* Handover Reminder Toast - Shows near shift end with active breakdowns (hidden on Control Room Display) */}
      {isAuthenticated && currentDuty && !hideNav && (
        <HandoverReminderToast
          activeBreakdowns={activeBreakdownsList}
          currentDuty={currentDuty}
          onStartHandover={handleStartHandover}
          onQuickResolve={handleQuickResolve}
          onViewBreakdowns={() => window.location.href = '/dashboards/sdc'}
          isVisible={true}
        />
      )}

      {/* Phase 8.4: Shift Summary Modal - Shows before ending shift (hidden on Control Room Display) */}
      {isAuthenticated && currentDuty && !hideNav && (
        <ShiftSummaryModal
          isVisible={showShiftSummary}
          currentDuty={currentDuty}
          currentUser={currentUser}
          shiftStats={shiftStats}
          onConfirmEnd={handleConfirmEndShift}
          onCancel={handleCancelSummary}
          onAddNotes={(notes) => console.log('📝 Shift notes:', notes)}
        />
      )}

      {/* Phase 9.3: Session Timeout Warning */}
      {isAuthenticated && currentDuty && (
        <SessionTimeoutWarning />
      )}
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
        <DutyThemeProvider>
          <Router>
            <Suspense fallback={<div className="loading-container" role="status" aria-live="polite"><div className="loading-spinner" aria-hidden="true"></div><p>Loading...</p></div>}>
              <Routes>
                {/* Public routes - no authentication required */}
                <Route path="/dashboards/engineering/display" element={<EngineeringDisplay />} />
                {/* All other routes require authentication */}
                <Route path="*" element={<AppContent />} />
              </Routes>
            </Suspense>
          </Router>
        </DutyThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
