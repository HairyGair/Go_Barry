import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom'
import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import './App.css'

// Import AuthContext and authentication components
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx'
import ProtectedRoute, { AdminRoute, SupervisorRoute } from './components/ProtectedRoute.jsx'
import SupervisorLoginWithContext from './components/SupervisorLoginWithContext.jsx'

// Import storage service
import storageService from './services/storageService.js'

// Import HeaderLogin component (for fallback)
import HeaderLogin from './components/HeaderLogin.jsx'

// Import Modern Header Component
import ModernAppHeader from './components/ModernAppHeader.jsx'

// Import BreakdownGuide
import BreakdownGuideApp from './breakdown-guide/App.jsx'

// Import Dashboard Router
import { DashboardRouter } from './dashboards'

// Import HomePage and LoginPage components
import HomePage from './components/HomePage.jsx'
import LoginPage from './components/LoginPage.jsx'

// Import NotificationPanel
import NotificationPanel from './components/NotificationPanel.jsx'
// Import dashboard data fetcher
import { fetchDashboardData } from './utils/fetchDashboardData.js'

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
const Navigation = ({ hide = false, activeBreakdowns = 0 }) => {
  if (hide) return null;

  const { isAuthenticated, currentUser, logout } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const location = useLocation()
  
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
          {isAuthenticated && currentUser ? (
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
                    to="/dashboards/breakdown"
                    className={isLinkActive('/dashboards') ? 'active' : ''}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span className="nav-icon">📊</span>
                    <span>Live Dashboard</span>
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
                    <span className="profile-name">{currentUser.name}</span>
                    <span className="profile-arrow">▼</span>
                  </button>
                  {showProfileMenu && (
                    <div className="profile-dropdown">
                      <div className="dropdown-header">
                        <strong>{currentUser.name}</strong>
                        <span>{currentUser.email}</span>
                      </div>
                      <hr />
                      <Link to="/profile" onClick={() => setShowProfileMenu(false)}>
                        <span>⚙️</span> Settings
                      </Link>
                      <Link to="/help" onClick={() => setShowProfileMenu(false)}>
                        <span>❓</span> Help & Support
                      </Link>
                      <hr />
                      <button onClick={logout} className="dropdown-signout">
                        <span>🚪</span> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <SupervisorLoginWithContext compact={true} />
          )}
        </div>
      </div>
      <NotificationPanel 
        isOpen={showNotifications} 
        onClose={() => setShowNotifications(false)} 
      />
    </nav>
  )
}

// Main App Component - Now uses AuthContext
const AppContent = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [activeBreakdowns, setActiveBreakdowns] = useState(0)
  const location = useLocation()
  
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
      if (!e.altKey || !isAuthenticated) return

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
  }, [isAuthenticated])
  
  // Stats change handler for navigation badge
  const handleStatsChange = useCallback((count) => {
    setActiveBreakdowns(count)
  }, [])
  
  if (authLoading) {
    return (
      <div className="auth-loading">
        <div className="spinner"></div>
        <p>Checking authentication...</p>
      </div>
    )
  }

  const hideNav = location.pathname === '/breakdown-guide'

  // Flag to toggle between classic and modern header
  const useModernHeader = true // Set to false to use classic header

  return (
    <div className={`app ${!isOnline ? 'offline' : ''}`}>
      {useModernHeader ? (
        // Modern Header - Only show when authenticated and not on breakdown-guide page
        isAuthenticated && !hideNav && (
          <ModernAppHeader
            variant="full"
            isAuthenticated={isAuthenticated}
            activeBreakdowns={activeBreakdowns}
          />
        )
      ) : (
        // Classic Navigation
        <Navigation
          hide={hideNav}
          activeBreakdowns={activeBreakdowns}
        />
      )}

      {!isOnline && (
        <div className="offline-banner">
          ⚠️ You are currently offline. Some features may be limited.
        </div>
      )}

      <main className={`main-container ${hideNav ? 'no-nav' : ''} ${useModernHeader && !hideNav ? 'with-modern-header' : ''}`}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <HomePage
                onStatsChange={handleStatsChange}
              />
            }
          />
          <Route
            path="/breakdown-guide/*"
            element={
              <ProtectedRoute>
                <BreakdownGuide />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboards/*"
            element={
              <ProtectedRoute>
                <DashboardRouter />
              </ProtectedRoute>
            }
          />
          <Route
            path="/fleet-intelligence"
            element={
              <ProtectedRoute>
                <ComingSoon title="Fleet Intelligence" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/management"
            element={
              <ProtectedRoute>
                <ComingSoon title="Management Portal" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sdc-operations"
            element={
              <ProtectedRoute>
                <Navigate to="/dashboards/sdc" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ComingSoon title="Profile Settings" />
              </ProtectedRoute>
            }
          />
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
    </div>
  )
}

// Main App Component with AuthProvider
function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  )
}

export default App
