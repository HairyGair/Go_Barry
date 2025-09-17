import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import './App.css'

// Import BreakdownGuide
import BreakdownGuideApp from './breakdown-guide/App.jsx'

// Import Dashboard Router
import { DashboardRouter } from './dashboards'

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

// Loading Component
// const Loading = () => (
//   <div className="loading-container">
//     <div className="loading"></div>
//     <p>Loading Breakdown Guide...</p>
//   </div>
// )

// Main Navigation Component
const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  
  return (
    <nav className="main-nav">
      <div className="nav-container">
        <Link to="/" className="logo">
          <img src="/GO_NORTHEAST_WHITE_RGB.png" alt="Go North East" />
          {/* <span>Breakdown Guide</span> */}
        </Link>
        
        <button 
          className="menu-toggle"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          ☰
        </button>
        
        <ul className={`nav-links ${isMenuOpen ? 'open' : ''}`}>
          <li><Link to="/breakdown-guide" onClick={() => setIsMenuOpen(false)}>Breakdown Guide</Link></li>
          <li><Link to="/dashboards/breakdown" onClick={() => setIsMenuOpen(false)}>Live Dashboard</Link></li>
          <li><Link to="/fleet-intelligence" onClick={() => setIsMenuOpen(false)}>Fleet Intelligence</Link></li>
          <li><Link to="/management" onClick={() => setIsMenuOpen(false)}>Management</Link></li>
          <li><Link to="/sdc-operations" onClick={() => setIsMenuOpen(false)}>SDC Operations</Link></li>
        </ul>
      </div>
    </nav>
  )
}

// Home Page Component
const HomePage = () => {
  const [stats, setStats] = useState({
    activeBreakdowns: 0,
    todayTotal: 0,
    avgResponseTime: 0
  })
  
  return (
    <div className="home-page">
      <div className="hero">
        <h1>Go North East Breakdown Management System</h1>
        <p>Ensuring passenger safety through structured assessment and rapid response</p>
      </div>
      
      <div className="quick-stats">
        <div className="stat-card">
          <h3>Active Breakdowns</h3>
          <div className="stat-value">{stats.activeBreakdowns}</div>
        </div>
        <div className="stat-card">
          <h3>Today's Total</h3>
          <div className="stat-value">{stats.todayTotal}</div>
        </div>
        <div className="stat-card">
          <h3>Avg Response Time</h3>
          <div className="stat-value">{stats.avgResponseTime} min</div>
        </div>
      </div>
      
      <div className="quick-links">
        <Link to="/breakdown-guide" className="quick-link-card primary">
          <h3>🚨 Report Breakdown</h3>
          <p>Start safety assessment wizard</p>
        </Link>
        <Link to="/dashboards/breakdown" className="quick-link-card">
          <h3>📊 Live Dashboard</h3>
          <p>Monitor active breakdowns</p>
        </Link>
        <Link to="/fleet-intelligence" className="quick-link-card">
          <h3>🔧 Fleet Intelligence</h3>
          <p>Vehicle health & analytics</p>
        </Link>
      </div>
    </div>
  )
}



// Main App Component
function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  
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
  
  return (
    <Router>
      <div className="app">
        {!isOnline && (
          <div className="offline-banner">
            ⚠️ You are currently offline. Some features may be limited.
          </div>
        )}
        
        <Navigation />
        
        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route 
              path="/breakdown-guide/*" 
              element={<BreakdownGuide />} 
            />
            <Route path="/dashboards/*" element={<DashboardRouter />} />
            <Route path="/live-dashboard" element={<Navigate to="/dashboards/breakdown" />} />
            <Route path="/fleet-intelligence" element={<ComingSoon title="Fleet Intelligence" />} />
            <Route path="/management" element={<ComingSoon title="Management Dashboard" />} />
            <Route path="/sdc-operations" element={<ComingSoon title="SDC Operations" />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
        
        <footer className="main-footer">
          <p>&copy; 2025 Go North East. Part of GoAhead Group.</p>
          <p>Version 1.0.0 | Environment: Production</p>
        </footer>
      </div>
    </Router>
  )
}

export default App
