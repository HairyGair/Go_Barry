import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
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

// Home Page Component
const HomePage = ({ isAuthenticated, supervisorSession, onStatsChange }) => {
  const [stats, setStats] = useState({
    activeBreakdowns: 0,
    todayTotal: 0,
    avgResponseTime: 0,
    fleetHealth: 0
  })
  const [activityFeed, setActivityFeed] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Fetch real-time data - always fetch, not just when authenticated
  useEffect(() => {
    fetchDashboardData()
    const interval = setInterval(fetchDashboardData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])
  
  // Notify parent component when stats change
  useEffect(() => {
    if (onStatsChange) {
      onStatsChange(stats.activeBreakdowns)
    }
  }, [stats.activeBreakdowns, onStatsChange])
  
  const fetchDashboardData = async () => {
    try {
      // Simulate fetching real data - replace with actual API calls
      const today = new Date()
      const startOfDay = new Date(today.setHours(0,0,0,0))
      
      // In production, these would be actual API calls:
      // const { data: activeBreakdowns } = await supabase.from('breakdowns').select('*').eq('status', 'active')
      // const { data: todayBreakdowns } = await supabase.from('breakdowns').select('*').gte('created_at', startOfDay)
      
      // TODO: Replace with real API call - for now, set to 0 for accurate display
      setStats({
        activeBreakdowns: 0, // Set to 0 to reflect reality
        todayTotal: Math.floor(Math.random() * 20) + 5,
        avgResponseTime: Math.floor(Math.random() * 15) + 8,
        fleetHealth: Math.floor(Math.random() * 10) + 85
      })
      
      // Simulate activity feed with more realistic data
      setActivityFeed([
        { id: 1, type: 'breakdown', message: 'Breakdown reported - Fleet #6932 at Washington', time: '2 mins ago', severity: 'high', depot: 'Washington' },
        { id: 2, type: 'engineer', message: 'Engineer dispatched to Chester-le-Street', time: '5 mins ago', severity: 'normal', depot: 'Chester-le-Street' },
        { id: 3, type: 'complete', message: 'Assessment completed - Fleet #5847', time: '12 mins ago', severity: 'success', decision: 'AMBER' },
        { id: 4, type: 'alert', message: 'Heavy traffic on A1 - expect delays', time: '15 mins ago', severity: 'warning' },
        { id: 5, type: 'breakdown', message: 'Non-starter - Fleet #7123 at Percy Main', time: '18 mins ago', severity: 'high', depot: 'Percy Main' },
        { id: 6, type: 'engineer', message: 'Engineering attendance complete - Fleet #5021', time: '22 mins ago', severity: 'success' },
        { id: 7, type: 'breakdown', message: 'Steering issue - Fleet #6549 at Riverside', time: '25 mins ago', severity: 'high', depot: 'Riverside' },
        { id: 8, type: 'complete', message: 'Changeover completed - Fleet #8234', time: '30 mins ago', severity: 'normal' }
      ])
      
      setLoading(false)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setLoading(false)
    }
  }
  
  return (
    <div className="home-page">
      <div className="main-content-grid">
        <div className="content-area">
          <div className="hero">
            <h1>Go North East Breakdown Management System</h1>
            <p>Ensuring passenger safety through structured assessment and rapid response</p>
            {isAuthenticated && supervisorSession && (
              <div className="welcome-banner">
                👋 Welcome back, <strong>{supervisorSession.name}</strong>
              </div>
            )}
          </div>
          
          <div className="quick-stats">
            <div className={`stat-card ${stats.activeBreakdowns > 0 ? 'has-active' : ''}`}>
              <div className="stat-icon">⚠️</div>
              <h3>Active Breakdowns</h3>
              <div className="stat-value">{loading ? '...' : stats.activeBreakdowns}</div>
              {stats.activeBreakdowns > 0 && <div className="stat-indicator active"></div>}
            </div>
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <h3>Today's Total</h3>
              <div className="stat-value">{loading ? '...' : stats.todayTotal}</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⏱️</div>
              <h3>Avg Response Time</h3>
              <div className="stat-value">{loading ? '...' : `${stats.avgResponseTime} min`}</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🚌</div>
              <h3>Fleet Health</h3>
              <div className="stat-value">{loading ? '...' : `${stats.fleetHealth}%`}</div>
            </div>
          </div>
          
          {isAuthenticated ? (
            <>
              <div className="quick-action-buttons">
                <Link to="/breakdown-guide" className="quick-action-btn emergency">
                  <img src="/icons/steering.png" alt="" className="btn-icon" onerror="this.style.display='none'" />
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
        
        <aside className="activity-feed-sidebar">
          <div className="activity-feed">
            <h3>Live Activity Feed</h3>
            <div className="activity-list">
              {activityFeed.slice(0, isAuthenticated ? 8 : 5).map(item => (
                <div key={item.id} className={`activity-item ${item.severity}`}>
                  <div className="activity-icon">
                    {item.type === 'breakdown' && '🚨'}
                    {item.type === 'engineer' && '🔧'}
                    {item.type === 'complete' && '✅'}
                    {item.type === 'alert' && '⚠️'}
                  </div>
                  <div className="activity-content">
                    <p>{item.message}</p>
                    <div className="activity-meta">
                      <span className="activity-time">{item.time}</span>
                      {item.depot && <span className="activity-depot">• {item.depot}</span>}
                      {item.decision && <span className={`activity-decision ${item.decision.toLowerCase()}`}>• {item.decision}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {isAuthenticated ? (
              <Link to="/dashboards/breakdown" className="view-all-activity">
                View All Activity →
              </Link>
            ) : (
              <div className="activity-login-prompt">
                <p>Sign in to see full activity feed and access all features</p>
              </div>
            )}
          </div>
        </aside>
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
    const { data: { subscription } } = authHelpers.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const supervisor = await authHelpers.getSupervisorByEmail(session.user.email)
        if (supervisor) {
          const sessionData = {
            id: supervisor.id,
            supervisorId: supervisor.id,
            name: supervisor.name,
            email: supervisor.email,
            depot: 'SDC', // All supervisors work at SDC
            role: supervisor.role,
            isAdmin: supervisor.role === 'admin',
            timestamp: new Date().toISOString(),
            authenticated: true,
            supabaseSession: session
          }
          setSupervisorSession(sessionData)
          setIsAuthenticated(true)
          localStorage.setItem('supervisor_session', JSON.stringify(sessionData))
        }
      } else if (event === 'SIGNED_OUT') {
        setSupervisorSession(null)
        setIsAuthenticated(false)
        localStorage.removeItem('supervisor_session')
      }
      setAuthLoading(false)
    })
    
    return () => subscription?.unsubscribe()
  }, [])
  
  // Check authentication state
  const checkAuthState = async () => {
    try {
      const { session, supervisor } = await authHelpers.getCurrentSession()
      
      if (session && supervisor) {
        const sessionData = {
          id: supervisor.id,
          supervisorId: supervisor.id,
          name: supervisor.name,
          email: supervisor.email,
          depot: 'SDC', // All supervisors work at SDC
          role: supervisor.role,
          isAdmin: supervisor.role === 'admin',
          timestamp: new Date().toISOString(),
          authenticated: true,
          supabaseSession: session
        }
        setSupervisorSession(sessionData)
        setIsAuthenticated(true)
        localStorage.setItem('supervisor_session', JSON.stringify(sessionData))
      } else {
        // Check local storage as fallback
        const savedSession = localStorage.getItem('supervisor_session')
        if (savedSession) {
          try {
            const session = JSON.parse(savedSession)
            // Verify session is still valid (within 24 hours)
            const sessionTime = new Date(session.timestamp)
            const now = new Date()
            const hoursDiff = (now - sessionTime) / (1000 * 60 * 60)
            
            if (hoursDiff < 24) {
              setSupervisorSession(session)
              setIsAuthenticated(true)
            } else {
              localStorage.removeItem('supervisor_session')
            }
          } catch (err) {
            console.error('Invalid session data:', err)
            localStorage.removeItem('supervisor_session')
          }
        }
      }
    } catch (error) {
      console.error('Auth check error:', error)
    } finally {
      setAuthLoading(false)
    }
  }
  
  // Handle successful login
  const handleLoginSuccess = (session) => {
    setSupervisorSession(session)
    setIsAuthenticated(true)
    localStorage.setItem('supervisor_session', JSON.stringify(session))
  }
  
  // Handle sign out
  const handleSignOut = async () => {
    try {
      await authHelpers.signOut()
      setSupervisorSession(null)
      setIsAuthenticated(false)
      localStorage.removeItem('supervisor_session')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }
  
  // Get current shift based on time
  const getCurrentShift = () => {
    const hour = new Date().getHours()
    if (hour >= 6 && hour < 14) {
      return 'Early Shift (06:00 - 14:00)'
    } else if (hour >= 14 && hour < 22) {
      return 'Late Shift (14:00 - 22:00)'
    } else {
      return 'Night Shift (22:00 - 06:00)'
    }
  }
  
  if (authLoading) {
    return (
      <div className="loading-container">
        <div className="loading"></div>
        <p>Loading...</p>
      </div>
    )
  }
  
  // Inner component that can use useLocation
  const AppContent = () => {
    const location = useLocation();
    const isDashboard = location.pathname.startsWith('/dashboards/');
    const isBreakdownGuide = location.pathname.startsWith('/breakdown-guide');
    const hideNavigation = isDashboard || isBreakdownGuide;
    
    return (
      <div className="app">
        {!isOnline && (
          <div className="offline-banner">
            ⚠️ You are currently offline. Some features may be limited.
          </div>
        )}
        
        <Navigation 
          isAuthenticated={isAuthenticated} 
          supervisorSession={supervisorSession} 
          onSignOut={handleSignOut}
          onLoginSuccess={handleLoginSuccess}
          hide={hideNavigation}
          activeBreakdowns={activeBreakdowns}
        />
        
        <main className="main-content">
          <Routes>
            <Route path="/" element={
              <HomePage 
                isAuthenticated={isAuthenticated} 
                supervisorSession={supervisorSession}
                onStatsChange={setActiveBreakdowns}
              />
            } />
            <Route 
              path="/breakdown-guide/*" 
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
            <Route path="/live-dashboard" element={<Navigate to="/dashboards/breakdown" />} />
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
                  element={<ComingSoon title="Management Dashboard" />} 
                />
              } 
            />
            <Route 
              path="/sdc-operations" 
              element={
                <ProtectedRoute 
                  isAuthenticated={isAuthenticated}
                  element={<ComingSoon title="SDC Operations" />} 
                />
              } 
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
        
        <footer className="main-footer enhanced">
          <div className="footer-content">
            <div className="footer-section">
              <p>&copy; 2025 Go North East. Part of GoAhead Group.</p>
              <p>Version 1.0.0 | Environment: Production</p>
            </div>
            <div className="footer-links">
              <a href="/help">Help & Support</a>
              <span>•</span>
              <a href="https://docs.gonortheast.co.uk" target="_blank">Documentation</a>
              <span>•</span>
              <a href="mailto:it.support@gonortheast.co.uk">Contact IT</a>
              <span>•</span>
              <a href="#" onClick={(e) => {e.preventDefault(); alert('Keyboard Shortcuts:\n\nAlt+1: Breakdown Guide\nAlt+2: Live Dashboard\nAlt+3: Fleet Intelligence\nAlt+4: Management\nAlt+5: SDC Operations')}}>
                Keyboard Shortcuts
              </a>
            </div>
            <div className="footer-status">
              <span className={`connection-status ${isOnline ? 'online' : 'offline'}`}>
                {isOnline ? '🟢 Connected' : '🔴 Offline'}
              </span>
              <span className="shift-info">
                {getCurrentShift()}
              </span>
            </div>
          </div>
        </footer>
      </div>
    );
  };
  
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App
