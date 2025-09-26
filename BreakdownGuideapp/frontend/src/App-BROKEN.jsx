import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom'
import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import './App.css'

// Import authentication helpers
import { authHelpers } from './services/supabase-client.js'

// Import HeaderLogin component
import HeaderLogin from './components/HeaderLogin.jsx'

// Import BreakdownGuide
import BreakdownGuideApp from './breakdown-guide/App.jsx'

// Import Dashboard Router
import { DashboardRouter } from './dashboards'

// Import NotificationPanel
import NotificationPanel from './components/NotificationPanel.jsx'
// Import LiveActivityFeed
import LiveActivityFeed from './components/LiveActivityFeed.jsx'
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

// Main Navigation Component
const Navigation = ({ isAuthenticated, supervisorSession, onSignOut, onLoginSuccess, hide = false, activeBreakdowns = 0 }) => {
  if (hide) return null;
  
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  
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
  
  return (
    <nav className="main-nav">
      <div className="nav-container">
        <Link to="/" className="logo">
          <img src="/GO_NORTHEAST_WHITE_RGB.png" alt="Go North East" />
        </Link>
        
        <button 
          className="menu-toggle"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          ☰
        </button>
        
        <div className={`nav-content ${isMenuOpen ? 'open' : ''}`}>
          {isAuthenticated && supervisorSession ? (
            <>
              <ul className="nav-links">
                <li><Link to="/breakdown-guide" onClick={() => setIsMenuOpen(false)}>Breakdown Guide</Link></li>
                <li><Link to="/dashboards/breakdown" onClick={() => setIsMenuOpen(false)}>Live Dashboard</Link></li>
                <li><Link to="/fleet-intelligence" onClick={() => setIsMenuOpen(false)}>Fleet Intelligence</Link></li>
                <li><Link to="/management" onClick={() => setIsMenuOpen(false)}>Management</Link></li>
                <li><Link to="/sdc-operations" onClick={() => setIsMenuOpen(false)}>SDC Operations</Link></li>
              </ul>
              <div className="nav-user-section">
                <span className="nav-time">{formatTime()}</span>
                <button 
                  className="nav-notification-btn" 
                  title="Notifications"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  🔔
                  {activeBreakdowns > 0 && (
                    <span className="notification-badge">{activeBreakdowns}</span>
                  )}
                </button>
                <div className="nav-profile-section">
                  <button 
                    className="nav-profile-btn"
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                  >
                    👤 {supervisorSession.name}
                  </button>
                  {showProfileMenu && (
                    <div className="profile-dropdown">
                      <Link to="/profile" onClick={() => setShowProfileMenu(false)}>
                        ⚙️ Settings
                      </Link>
                      <Link to="/help" onClick={() => setShowProfileMenu(false)}>
                        ❓ Help & Support
                      </Link>
                      <hr />
                      <button onClick={onSignOut} className="dropdown-signout">
                        🚪 Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <HeaderLogin onLoginSuccess={onLoginSuccess} />
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

// Simple HomePage without any polling
const HomePage = ({ isAuthenticated, supervisorSession, onStatsChange }) => {
  const [stats, setStats] = useState({
    activeBreakdowns: 0,
    todayTotal: 0,
    avgResponseTime: 0,
    fleetHealth: 100
  })
  const [activityFeed, setActivityFeed] = useState([])
  const [loading, setLoading] = useState(false)
  
  // Fetch data once when authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setStats({
        activeBreakdowns: 0,
        todayTotal: 0,
        avgResponseTime: 0,
        fleetHealth: 100
      })
      setActivityFeed([])
      return
    }

    // Fetch data once
    const loadData = async () => {
      try {
        setLoading(true)
        const data = await fetchDashboardData()
        if (data) {
          setStats(data.stats || {
            activeBreakdowns: 0,
            todayTotal: 0,
            avgResponseTime: 0,
            fleetHealth: 100
          })
          setActivityFeed(data.activityFeed || [])
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [isAuthenticated])
  
  // Notify parent component when stats change
  useEffect(() => {
    if (onStatsChange) {
      onStatsChange(stats.activeBreakdowns)
    }
  }, [stats.activeBreakdowns, onStatsChange])
  
  const supervisorName = useMemo(() => {
    return supervisorSession?.name || ''
  }, [supervisorSession?.name])
  
  return (
    <div className="home-page">
      <div className="main-content-grid">
        <div className="content-area">
          <div className="hero">
            <h1 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img 
                src="/gne-logo-horizontal-colour.png" 
                alt="Go North East" 
                style={{ 
                  height: '50px', 
                  width: 'auto', 
                  marginRight: '20px', 
                  verticalAlign: 'middle'
                }}
              />
              Breakdown Management System
            </h1>
            <p>Ensuring passenger safety through structured assessment and rapid response</p>
            {isAuthenticated && supervisorName && (
              <div className="welcome-banner">
                👋 Welcome back, <strong>{supervisorName}</strong>
              </div>
            )}
          </div>
          
          {isAuthenticated && (
            <div className="quick-stats">
              <div className={`stat-card ${stats.activeBreakdowns > 0 ? 'has-active' : ''}`}>
                <div className="stat-icon">⚠️</div>
                <div className="stat-label">Active Breakdowns</div>
                <div className="stat-value">{loading ? '...' : stats.activeBreakdowns}</div>
                {stats.activeBreakdowns > 0 && <div className="stat-indicator active"></div>}
              </div>
              <div className="stat-card">
                <div className="stat-icon">📊</div>
                <div className="stat-label">Today's Total</div>
                <div className="stat-value">{loading ? '...' : stats.todayTotal}</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">⏱️</div>
                <h3>Avg Response Time</h3>
                <div className="stat-value">{loading ? '...' : stats.avgResponseTime > 0 ? `${stats.avgResponseTime} min` : '--'}</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🚌</div>
                <div className="stat-label">Fleet Health</div>
                <div className="stat-value">{loading ? '...' : `${stats.fleetHealth}%`}</div>
              </div>
            </div>
          )}
          
          {isAuthenticated ? (
            <>
              <div className="quick-action-buttons">
                <Link to="/breakdown-guide" className="quick-action-btn emergency">
                  <img src="/icons/steering.png" alt="" className="btn-icon" />
                  <span>🚨 Report Breakdown</span>
                </Link>
                <Link to="/dashboards/sdc" className="quick-action-btn">
                  <span>📞 SDC Operations</span>
                </Link>
                <Link to="/dashboards/engineering" className="quick-action-btn">
                  <span>🔧 Engineering</span>
                </Link>
                <a href="/SDC_Guide_To_Breakdowns_v3.pdf" target="_blank" className="quick-action-btn">
                  <span>📋 Assessment Guide</span>
                </a>
              </div>
              
              <div className="quick-links">
                <Link to="/breakdown-guide" className="quick-link-card primary">
                  <div className="card-icon">🚨</div>
                  <h3>Report Breakdown</h3>
                  <p>Start safety assessment wizard</p>
                  <span className="card-action">Start Assessment →</span>
                </Link>
                <Link to="/dashboards/breakdown" className="quick-link-card">
                  <div className="card-icon">📊</div>
                  <h3>Live Dashboard</h3>
                  <p>Monitor active breakdowns</p>
                  <span className="card-action">View Dashboard →</span>
                </Link>
                <Link to="/fleet-intelligence" className="quick-link-card coming-soon">
                  <div className="card-icon">🔧</div>
                  <h3>Fleet Intelligence</h3>
                  <p>Vehicle health & analytics</p>
                  <span className="coming-soon-badge">Coming Soon</span>
                </Link>
              </div>
            </>
          ) : (
            <div className="auth-required">
              <div className="auth-card">
                <h2>🔒 Authentication Required</h2>
                <p>Please sign in using the login form in the header to access the Breakdown Management System</p>
              </div>
              
              <div className="features-preview">
                <h3>System Features</h3>
                <div className="feature-list">
                  <div className="feature-item">
                    <span className="feature-icon">🚨</span>
                    <div>
                      <h4>Breakdown Assessment</h4>
                      <p>SDC-compliant safety assessment wizards</p>
                    </div>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon">📊</span>
                    <div>
                      <h4>Real-time Dashboards</h4>
                      <p>Monitor active breakdowns and performance</p>
                    </div>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon">🔧</span>
                    <div>
                      <h4>Fleet Intelligence</h4>
                      <p>Vehicle health analytics and insights</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {isAuthenticated && (
          <aside className="activity-feed-sidebar">
            <LiveActivityFeed 
              embedded={true} 
              isOpen={true} 
              activities={activityFeed}
            />
          </aside>
        )}
      </div>
    </div>
  )
}

// Protected Route Component
const ProtectedRoute = ({ element, isAuthenticated }) => {
  return isAuthenticated ? element : <Navigate to="/" replace />
}

// Main App Component
function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [activeBreakdowns, setActiveBreakdowns] = useState(0)
  
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [supervisorSession, setSupervisorSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  
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
  
  // Authentication monitoring
  useEffect(() => {
    checkAuthState()
    
    // Listen for auth changes
    const handleAuthChange = (event) => {
      console.log('🔑 Auth event detected:', event.type)
      checkAuthState()
    }
    
    window.addEventListener('storage', handleAuthChange)
    window.addEventListener('auth-change', handleAuthChange)
    
    // Check auth every 5 minutes
    const authInterval = setInterval(checkAuthState, 5 * 60 * 1000)
    
    return () => {
      window.removeEventListener('storage', handleAuthChange)
      window.removeEventListener('auth-change', handleAuthChange)
      clearInterval(authInterval)
    }
  }, [])
  
  // Check authentication state
  const checkAuthState = async () => {
    try {
      const NO_AUTH_MODE = import.meta.env.VITE_ENABLE_AUTH === 'false'
      
      if (NO_AUTH_MODE) {
        const savedSession = localStorage.getItem('supervisor_session')
        if (savedSession) {
          const session = JSON.parse(savedSession)
          setIsAuthenticated(true)
          setSupervisorSession(session)
        } else {
          setIsAuthenticated(false)
          setSupervisorSession(null)
        }
        setAuthLoading(false)
        return
      }
      
      const session = await authHelpers.getSession()
      if (session?.user) {
        const supervisorData = {
          id: session.user.id,
          name: session.user.email?.split('@')[0] || 'User',
          email: session.user.email
        }
        
        setIsAuthenticated(true)
        setSupervisorSession(supervisorData)
        localStorage.setItem('supervisor_session', JSON.stringify(supervisorData))
        console.log('✅ Auth state: Authenticated as', supervisorData.name)
      } else {
        setIsAuthenticated(false)
        setSupervisorSession(null)
        console.log('❌ Auth state: Not authenticated')
      }
    } catch (error) {
      console.error('Auth check error:', error)
      setIsAuthenticated(false)
      setSupervisorSession(null)
    } finally {
      setAuthLoading(false)
    }
  }
  
  // Login handler
  const handleLoginSuccess = async (sessionData) => {
    console.log('🎉 Login successful:', sessionData)
    
    if (sessionData) {
      setIsAuthenticated(true)
      setSupervisorSession(sessionData)
      localStorage.setItem('supervisor_session', JSON.stringify(sessionData))
      
      // Dispatch auth change event
      window.dispatchEvent(new CustomEvent('auth-change', { detail: { authenticated: true } }))
    }
  }
  
  // Sign out handler
  const handleSignOut = async () => {
    console.log('👋 Signing out...')
    
    try {
      const NO_AUTH_MODE = import.meta.env.VITE_ENABLE_AUTH === 'false'
      
      if (NO_AUTH_MODE) {
        localStorage.removeItem('supervisor_session')
      } else {
        await authHelpers.signOut()
      }
      
      setIsAuthenticated(false)
      setSupervisorSession(null)
      
      // Dispatch auth change event
      window.dispatchEvent(new CustomEvent('auth-change', { detail: { authenticated: false } }))
      
      console.log('✅ Sign out successful')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }
  
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
  
  const AppContent = () => {
    const location = useLocation()
    const hideNav = location.pathname === '/breakdown-guide'
    
    return (
      <div className={`app ${!isOnline ? 'offline' : ''}`}>
        <Navigation 
          isAuthenticated={isAuthenticated}
          supervisorSession={supervisorSession}
          onSignOut={handleSignOut}
          onLoginSuccess={handleLoginSuccess}
          hide={hideNav}
          activeBreakdowns={activeBreakdowns}
        />
        
        {!isOnline && (
          <div className="offline-banner">
            ⚠️ You are currently offline. Some features may be limited.
          </div>
        )}
        
        <main className={`main-container ${hideNav ? 'no-nav' : ''}`}>
          <Routes>
            <Route 
              path="/" 
              element={
                <HomePage 
                  isAuthenticated={isAuthenticated} 
                  supervisorSession={supervisorSession}
                  onStatsChange={handleStatsChange}
                />
              } 
            />
            <Route 
              path="/breakdown-guide" 
              element={
                <ProtectedRoute 
                  isAuthenticated={isAuthenticated} 
                  element={<BreakdownGuide />} 
                />
              } 
            />
            <Route 
              path="/dashboards/*" 
              element={
                <ProtectedRoute 
                  isAuthenticated={isAuthenticated} 
                  element={<DashboardRouter />} 
                />
              } 
            />
            <Route 
              path="/fleet-intelligence" 
              element={
                <ProtectedRoute 
                  isAuthenticated={isAuthenticated} 
                  element={<ComingSoon title="Fleet Intelligence" />} 
                />
              } 
            />
            <Route 
              path="/management" 
              element={
                <ProtectedRoute 
                  isAuthenticated={isAuthenticated} 
                  element={<ComingSoon title="Management Portal" />} 
                />
              } 
            />
            <Route 
              path="/sdc-operations" 
              element={
                <ProtectedRoute 
                  isAuthenticated={isAuthenticated} 
                  element={<Navigate to="/dashboards/sdc" replace />} 
                />
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute 
                  isAuthenticated={isAuthenticated} 
                  element={<ComingSoon title="Profile Settings" />} 
                />
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
  
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App
