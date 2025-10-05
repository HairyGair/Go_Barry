import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { apiConfig } from '../breakdown-guide/components/common/constants';
import { useAuth } from '../contexts/AuthContext.jsx';

const AppHeader = ({ variant = 'full' }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get auth context
  const { logout, currentUser, isAuthenticated } = useAuth();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [supervisorData, setSupervisorData] = useState(null);
  const [stats, setStats] = useState({ active: 0, today: 0, resolved: 0 });
  const [hoveredNav, setHoveredNav] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Get supervisor data from auth context or localStorage
  useEffect(() => {
    if (currentUser) {
      // Use data from AuthContext if available
      setSupervisorData(currentUser);
    } else {
      // Fallback to localStorage for compatibility
      const savedSession = localStorage.getItem('supervisor_session');
      if (savedSession) {
        const session = JSON.parse(savedSession);
        setSupervisorData(session);
      }
    }
  }, [currentUser]);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);



  // Fetch supervisor-specific stats
  useEffect(() => {
    const fetchStats = async () => {
      if (!supervisorData) return;
      
      try {
        // Try using supervisor badge first, then fallback to ID
        const supervisorIdentifier = supervisorData.supervisorId || supervisorData.badge || supervisorData.id;
        
        
        // Add authentication headers if available
        const headers = {
          'Content-Type': 'application/json'
        };
        
        if (supervisorData.token) {
          headers['Authorization'] = `Bearer ${supervisorData.token}`;
        }
        
        const response = await fetch(`${apiConfig.baseUrl}/api/supervisors/${supervisorIdentifier}/stats`, {
          headers
        });
        if (response.ok) {
          const result = await response.json();
          
          // Handle the actual response format from the API
          if (result.success && result.data) {
            const { performance } = result.data;
            setStats({
              active: performance.totalBreakdowns - performance.resolvedBreakdowns,
              today: performance.totalBreakdowns,
              resolved: performance.resolvedBreakdowns
            });
          } else {
            // Fallback to mock data
            setStats({
              active: Math.floor(Math.random() * 3),
              today: Math.floor(Math.random() * 8) + 2,
              resolved: Math.floor(Math.random() * 15) + 5
            });
          }
        } else {
          // Use mock data if endpoint doesn't exist
          setStats({
            active: Math.floor(Math.random() * 5),
            today: Math.floor(Math.random() * 20) + 5,
            resolved: Math.floor(Math.random() * 15) + 3
          });
        }
      } catch (error) {
        console.log('Stats fetch error:', error);
        // Use mock data for now
        setStats({
          active: Math.floor(Math.random() * 5),
          today: Math.floor(Math.random() * 20) + 5,
          resolved: Math.floor(Math.random() * 15) + 3
        });
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [supervisorData]);

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeydown = (e) => {
      if (e.altKey && !e.ctrlKey && !e.shiftKey) {
        switch(e.key) {
          case '1': 
            e.preventDefault();
            navigate('/breakdown-guide'); 
            break;
          case '2': 
            e.preventDefault();
            navigate('/dashboards/sdc'); 
            break;
          case '3':
            e.preventDefault();
            navigate('/dashboards/control-room');
            break;
          case '4': 
            e.preventDefault();
            navigate('/dashboards/engineering'); 
            break;
          case '5': 
            e.preventDefault();
            navigate('/dashboards/management'); 
            break;
          case 'h': 
          case 'H':
            e.preventDefault();
            navigate('/'); 
            break;
          case 'q':
          case 'Q':
            e.preventDefault();
            setShowShortcuts(!showShortcuts);
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, [navigate, showShortcuts]);

  // Enhanced logout handler
  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return; // Prevent double-clicks
    
    setIsLoggingOut(true);
    setShowProfileMenu(false); // Close profile menu
    
    try {
      console.log('🚪 AppHeader: Initiating logout...');
      
      // Use AuthContext logout if available, otherwise fallback to basic logout
      if (logout && typeof logout === 'function') {
        await logout(true, '/'); // Show message and redirect to home
        console.log('✅ AppHeader: AuthContext logout completed');
      } else {
        // Fallback logout method
        console.log('⚠️ AppHeader: Using fallback logout method');
        localStorage.removeItem('supervisor_session');
        localStorage.removeItem('auth_session');
        localStorage.removeItem('auth_user');
        navigate('/');
      }
    } catch (error) {
      console.error('❌ AppHeader logout error:', error);
      
      // Emergency logout fallback
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/';
    } finally {
      setIsLoggingOut(false);
    }
  }, [logout, navigate, isLoggingOut]);

  const navigationItems = [
    { 
      path: '/breakdown-guide', 
      label: 'Breakdown Guide', 
      shortLabel: 'Guide', 
      icon: '🔧',
      badge: null,
      submenu: [
        { path: '/breakdown-guide', label: 'New Assessment', icon: '➕' },
        { path: '/breakdown-guide/history', label: 'Assessment History', icon: '📋' },
        { path: '/breakdown-guide/fleet', label: 'Fleet Status', icon: '🚌' }
      ]
    },
    {
      path: '/dashboards/control-room',
      label: 'Control Room',
      shortLabel: 'Control',
      icon: '📺',
      badge: stats.active,
      submenu: [
        { path: '/dashboards/control-room', label: 'Control Room Display', icon: '📺' },
        { path: '/dashboards/sdc', label: 'SDC Operations', icon: '🎯' },
        { path: '/dashboards/engineering', label: 'Engineering', icon: '⚙️' }
      ]
    },
    { 
      path: '/dashboards/sdc', 
      label: 'SDC Operations', 
      shortLabel: 'SDC', 
      icon: '🎯',
      badge: null,
      submenu: [
        { path: '/dashboards/sdc', label: 'Control Centre', icon: '🎛️' },
        { path: '/dashboards/sdc/dispatch', label: 'Dispatch Queue', icon: '📤' },
        { path: '/dashboards/sdc/alerts', label: 'Priority Alerts', icon: '🚨' }
      ]
    },
    { 
      path: '/dashboards/engineering', 
      label: 'Fleet Intelligence', 
      shortLabel: 'Fleet', 
      icon: '⚙️',
      badge: null,
      submenu: [
        { path: '/dashboards/engineering', label: 'Engineering Status', icon: '🔧' },
        { path: '/dashboards/engineering/teams', label: 'Team Performance', icon: '👥' },
        { path: '/dashboards/engineering/maintenance', label: 'Maintenance Schedule', icon: '📅' }
      ]
    },
    { 
      path: '/dashboards/management', 
      label: 'Management', 
      shortLabel: 'Manage', 
      icon: '📈',
      badge: null,
      submenu: [
        { path: '/dashboards/management', label: 'Executive Dashboard', icon: '📊' },
        { path: '/dashboards/management/reports', label: 'Reports', icon: '📑' },
        { path: '/dashboards/management/analytics', label: 'Analytics', icon: '📈' }
      ]
    }
  ];

  const shortcuts = [
    { key: 'Alt+1', description: 'Go to Breakdown Guide' },
    { key: 'Alt+2', description: 'Go to SDC Operations' },
    { key: 'Alt+3', description: 'Go to Control Room' },
    { key: 'Alt+4', description: 'Go to Fleet Intelligence' },
    { key: 'Alt+5', description: 'Go to Management' },
    { key: 'Alt+H', description: 'Go to Home' },
    { key: 'Alt+Q', description: 'Toggle Quick Panel' }
  ];

  // Generate breadcrumbs
  const getBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = [{ path: '/', label: 'Home' }];
    
    let currentPath = '';
    paths.forEach((segment, index) => {
      currentPath += `/${segment}`;
      let label = segment.charAt(0).toUpperCase() + segment.slice(1).replace('-', ' ');
      
      // Custom labels for known routes
      if (segment === 'breakdown-guide') label = 'Breakdown Guide';
      if (segment === 'dashboards') label = 'Dashboards';
      if (segment === 'sdc') label = 'SDC Operations';
      if (segment === 'engineering') label = 'Fleet Intelligence';
      
      breadcrumbs.push({ path: currentPath, label });
    });
    
    return breadcrumbs;
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path);

  return (
    <>
      {/* Status Bar */}
      <div className="status-bar">
        <div className="status-bar-content">
          <div className="status-left">

            <span className="system-info" style={{ display: 'flex', alignItems: 'center' }}>
              <img 
                src="/gne-logo.png" 
                alt="GNE" 
                style={{ 
                  height: '16px', 
                  width: 'auto', 
                  marginRight: '8px', 
                  verticalAlign: 'middle',
                  opacity: theme === 'dark' ? '0.9' : '0.8'
                }}
              />
              Breakdown Management System v1.5.3
            </span>
          </div>
          <div className="status-right">
            <span className="depot-info">
              {supervisorData?.depot || 'All Depots'}
            </span>
            <span className="separator">|</span>
            <span className="time-info">
              {currentTime.toLocaleDateString('en-GB', { 
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })} • {currentTime.toLocaleTimeString('en-GB', { 
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="app-header-professional">
        <div className="header-container">
          {/* Logo Section */}
          <Link to="/" className="brand-link">
            <img 
              src="/gne-logo-horizontal-colour.png" 
              alt="Go North East" 
              className="brand-logo"
            />
          </Link>

          {/* Navigation Section - Desktop */}
          <nav className="header-nav desktop-nav">
            {navigationItems.map((item) => (
              <div 
                key={item.path}
                className="nav-item-wrapper"
                onMouseEnter={() => setHoveredNav(item.path)}
                onMouseLeave={() => setHoveredNav(null)}
              >
                <Link
                  to={item.path}
                  className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label desktop-label">{item.label}</span>
                  <span className="nav-label mobile-label">{item.shortLabel || item.label}</span>
                  {item.badge > 0 && (
                    <span className="nav-badge">{item.badge}</span>
                  )}
                </Link>
                
                {/* Mega Menu */}
                {hoveredNav === item.path && item.submenu && (
                  <div className="mega-menu">
                    {item.submenu.map((subitem) => (
                      <Link
                        key={subitem.path}
                        to={subitem.path}
                        className="mega-menu-item"
                      >
                        <span className="submenu-icon">{subitem.icon}</span>
                        <span className="submenu-label">{subitem.label}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Action Section */}
          <div className="header-actions">
            {/* Theme Toggle */}
            <button 
              className="action-btn theme-toggle"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

            {/* Shortcuts */}
            <button 
              className="action-btn shortcuts-btn"
              onClick={() => setShowShortcuts(!showShortcuts)}
              title="Keyboard shortcuts"
            >
              ⌘
            </button>

            {/* Emergency Button */}
            <button 
              className="emergency-btn"
              onClick={() => navigate('/breakdown-guide')}
              title="Report Emergency Breakdown"
            >
              <span className="emergency-icon">🚨</span>
              <span className="emergency-text desktop-only">Emergency</span>
            </button>

            {/* User Profile */}
            <div className="profile-section">
              <button 
                className="profile-btn"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
              >
                <div className="profile-avatar">
                  {supervisorData?.name?.charAt(0) || 'U'}
                </div>
                <div className="profile-info desktop-only">
                  <span className="profile-name">{supervisorData?.name || 'User'}</span>
                  <span className="profile-role">{supervisorData?.role || 'Supervisor'}</span>
                </div>
                <span className="dropdown-arrow">▼</span>
              </button>
              
              {showProfileMenu && (
                <div className="profile-menu">
                  <div className="profile-header">
                    <strong>{supervisorData?.name || 'User'}</strong>
                    <span>{supervisorData?.email || 'user@gonortheast.co.uk'}</span>
                    <span className="depot-label">{supervisorData?.depot || 'All Depots'}</span>
                  </div>
                  <div className="profile-stats">
                    <div className="stat">
                      <span className="stat-value">{stats.today}</span>
                      <span className="stat-label">Today</span>
                    </div>
                    <div className="stat">
                      <span className="stat-value">{stats.active}</span>
                      <span className="stat-label">Active</span>
                    </div>
                    <div className="stat">
                      <span className="stat-value">{stats.resolved}</span>
                      <span className="stat-label">Resolved</span>
                    </div>
                  </div>
                  <div className="profile-actions">
                    <button onClick={() => navigate('/profile')}>My Profile</button>
                    <button onClick={() => navigate('/settings')}>Settings</button>
                    <button 
                      className="logout" 
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                    >
                      {isLoggingOut ? (
                        <>
                          <span className="logout-spinner">⏳</span>
                          Signing Out...
                        </>
                      ) : (
                        <>
                          <span className="logout-icon">🚪</span>
                          Sign Out
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="mobile-menu-btn"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <span className="menu-icon">{isMenuOpen ? '✕' : '☰'}</span>
          </button>
        </div>

        {/* Mobile Navigation */}
        <nav className={`mobile-nav ${isMenuOpen ? 'open' : ''}`}>
          {navigationItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`mobile-nav-item ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => setIsMenuOpen(false)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              {item.badge > 0 && (
                <span className="nav-badge">{item.badge}</span>
              )}
            </Link>
          ))}
        </nav>
      </header>

      {/* Breadcrumbs */}
      <div className="breadcrumbs">
        <div className="breadcrumbs-content">
          {getBreadcrumbs().map((crumb, index) => (
            <React.Fragment key={crumb.path}>
              {index > 0 && <span className="breadcrumb-separator">›</span>}
              <Link 
                to={crumb.path} 
                className={`breadcrumb-item ${index === getBreadcrumbs().length - 1 ? 'active' : ''}`}
              >
                {crumb.label}
              </Link>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Shortcuts Modal */}
      {showShortcuts && (
        <div className="shortcuts-modal" onClick={() => setShowShortcuts(false)}>
          <div className="shortcuts-content" onClick={(e) => e.stopPropagation()}>
            <h3>Keyboard Shortcuts</h3>
            <div className="shortcuts-list">
              {shortcuts.map((shortcut) => (
                <div key={shortcut.key} className="shortcut-item">
                  <kbd>{shortcut.key}</kbd>
                  <span>{shortcut.description}</span>
                </div>
              ))}
            </div>
            <button 
              className="close-btn" 
              onClick={() => setShowShortcuts(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        /* Ensure no margins/padding at top */
        html, body {
          margin: 0;
          padding: 0;
        }
        
        /* Theme Variables */
        :root[data-theme="dark"] {
          --bg-primary: #0a0a0a;
          --bg-secondary: #1a1a1a;
          --bg-tertiary: #2a2a2a;
          --text-primary: #ffffff;
          --text-secondary: #b0b0b0;
          --border-color: rgba(255, 255, 255, 0.1);
          --hover-bg: rgba(255, 255, 255, 0.08);
        }

        :root[data-theme="light"] {
          --bg-primary: #ffffff;
          --bg-secondary: #f5f5f5;
          --bg-tertiary: #e0e0e0;
          --text-primary: #000000;
          --text-secondary: #666666;
          --border-color: rgba(0, 0, 0, 0.1);
          --hover-bg: rgba(0, 0, 0, 0.04);
        }

        /* Status Bar */
        .status-bar {
          background: rgba(26, 26, 26, 0.98);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border-bottom: 1px solid var(--border-color);
          font-size: 12px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-weight: 500;
          color: var(--text-secondary);
          position: sticky;
          top: 0;
          z-index: 1001;
        }
        
        :root[data-theme="light"] .status-bar {
          background: rgba(245, 245, 245, 0.98);
          color: #666666;
          border-bottom-color: rgba(0, 0, 0, 0.1);
        }

        .status-bar-content {
          max-width: 1600px;
          margin: 0 auto;
          padding: 5px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          min-height: 26px;
        }

        .status-left, .status-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }



        .separator {
          color: var(--border-color);
        }

        /* Main Header */
        .app-header-professional {
          background: var(--bg-primary);
          border-bottom: 3px solid #E4002B;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          position: sticky;
          top: 0;
          z-index: 1000;
          backdrop-filter: blur(10px);
        }
        


        .header-container {
          max-width: 1600px;
          margin: 0 auto;
          padding: 0 20px;
          display: flex;
          align-items: center;
          gap: 30px;
          height: 70px;
          position: relative;
        }

        /* Brand Section */
        .brand-link {
          display: flex;
          align-items: center;
          text-decoration: none;
          transition: transform 0.2s ease;
          flex-shrink: 0;
        }

        .brand-link:hover {
          transform: scale(1.05);
        }

        .brand-logo {
          height: 40px;
          width: auto;
          filter: brightness(${theme === 'light' ? '0.8' : '1.1'});
        }

        /* Navigation Section */
        .header-nav {
          display: flex;
          align-items: center;
          gap: 5px;
          flex: 1;
        }

        .nav-item-wrapper {
          position: relative;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 8px 12px;
          border-radius: 6px;
          text-decoration: none;
          color: var(--text-secondary);
          font-size: 13px;
          font-weight: 500;
          transition: all 0.3s ease;
          position: relative;
          white-space: nowrap;
        }

        .nav-item:hover {
          color: var(--text-primary);
          background: var(--hover-bg);
          transform: translateY(-2px);
        }

        .nav-item.active {
          color: var(--text-primary);
          background: rgba(228, 0, 43, 0.15);
        }

        .nav-item.active::after {
          content: '';
          position: absolute;
          bottom: -3px;
          left: 12px;
          right: 12px;
          height: 3px;
          background: #E4002B;
          border-radius: 3px 3px 0 0;
        }

        .nav-badge {
          background: #E4002B;
          color: white;
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 10px;
          margin-left: 6px;
          font-weight: 600;
        }

        /* Mega Menu */
        .mega-menu {
          position: absolute;
          top: 100%;
          left: 0;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
          padding: 12px;
          min-width: 200px;
          margin-top: 8px;
          z-index: 1001;
        }

        .mega-menu-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          text-decoration: none;
          color: var(--text-secondary);
          font-size: 13px;
          border-radius: 6px;
          transition: all 0.2s ease;
        }

        .mega-menu-item:hover {
          background: var(--hover-bg);
          color: var(--text-primary);
        }

        /* Action Buttons */
        .header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }

        .action-btn {
          width: 36px;
          height: 36px;
          border-radius: 6px;
          border: 1px solid var(--border-color);
          background: var(--bg-secondary);
          color: var(--text-secondary);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          font-size: 16px;
        }

        .action-btn:hover {
          background: var(--hover-bg);
          color: var(--text-primary);
          transform: translateY(-2px);
        }

        /* User Profile */
        .profile-section {
          position: relative;
        }

        .profile-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 12px 4px 4px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 24px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .profile-btn:hover {
          background: var(--hover-bg);
        }

        .profile-avatar {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #E4002B 0%, #003B5C 100%);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 14px;
        }

        .profile-info {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          line-height: 1.2;
        }

        .profile-name {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .profile-role {
          font-size: 11px;
          color: var(--text-secondary);
        }

        .dropdown-arrow {
          font-size: 10px;
          color: var(--text-secondary);
          margin-left: 4px;
        }

        /* Profile Menu */
        .profile-menu {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 8px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
          min-width: 260px;
          z-index: 1001;
        }

        .profile-header {
          padding: 16px;
          border-bottom: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .profile-header strong {
          color: var(--text-primary);
          font-size: 14px;
        }

        .profile-header span {
          color: var(--text-secondary);
          font-size: 12px;
        }

        .depot-label {
          background: var(--hover-bg);
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          display: inline-block;
          margin-top: 4px;
        }

        .profile-stats {
          padding: 16px;
          display: flex;
          justify-content: space-around;
          border-bottom: 1px solid var(--border-color);
        }

        .stat {
          text-align: center;
        }

        .stat-value {
          display: block;
          font-size: 20px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .stat-label {
          font-size: 11px;
          color: var(--text-secondary);
        }

        .profile-actions {
          padding: 8px;
        }

        .profile-actions button {
          width: 100%;
          padding: 10px 16px;
          background: none;
          border: none;
          text-align: left;
          color: var(--text-secondary);
          font-size: 13px;
          cursor: pointer;
          border-radius: 6px;
          transition: all 0.2s ease;
        }

        .profile-actions button:hover {
          background: var(--hover-bg);
          color: var(--text-primary);
        }

        .profile-actions button.logout {
          color: #ef4444;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .profile-actions button.logout:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .profile-actions button.logout:disabled:hover {
          background: none;
          color: #ef4444;
        }

        .logout-spinner {
          animation: spin 1s linear infinite;
        }

        .logout-icon {
          font-size: 14px;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Emergency Button */
        .emergency-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
        }

        .emergency-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4);
        }

        .emergency-icon {
          font-size: 16px;
          animation: emergencyPulse 1s infinite;
        }

        @keyframes emergencyPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }

        /* Breadcrumbs */
        .breadcrumbs {
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border-color);
          font-size: 12px;
        }
        


        .breadcrumbs-content {
          max-width: 1600px;
          margin: 0 auto;
          padding: 8px 20px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .breadcrumb-item {
          color: var(--text-secondary);
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .breadcrumb-item:hover {
          color: var(--text-primary);
        }

        .breadcrumb-item.active {
          color: var(--text-primary);
          font-weight: 500;
        }

        .breadcrumb-separator {
          color: var(--text-secondary);
          margin: 0 4px;
        }

        /* Shortcuts Modal */
        .shortcuts-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
        }

        .shortcuts-content {
          background: var(--bg-secondary);
          border-radius: 12px;
          padding: 24px;
          max-width: 400px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
          border: 1px solid var(--border-color);
        }

        .shortcuts-content h3 {
          margin: 0 0 20px 0;
          color: var(--text-primary);
          font-size: 18px;
        }

        .shortcuts-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .shortcut-item {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .shortcut-item kbd {
          background: var(--bg-tertiary);
          padding: 6px 10px;
          border-radius: 4px;
          font-size: 12px;
          font-family: monospace;
          border: 1px solid var(--border-color);
          min-width: 80px;
          text-align: center;
          color: var(--text-primary);
        }

        .shortcut-item span {
          color: var(--text-secondary);
          font-size: 13px;
        }

        .close-btn {
          margin-top: 20px;
          width: 100%;
          padding: 10px;
          background: var(--hover-bg);
          border: 1px solid var(--border-color);
          border-radius: 6px;
          color: var(--text-primary);
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .close-btn:hover {
          background: var(--bg-tertiary);
        }

        /* Show/hide labels based on screen size */
        .mobile-label {
          display: none;
        }
        
        .desktop-only {
          display: initial;
        }
        
        @media (max-width: 1200px) {
          .desktop-label {
            display: none;
          }
          .mobile-label {
            display: initial;
          }
          
          .nav-item {
            padding: 8px 10px;
            font-size: 12px;
          }
          
          .header-container {
            gap: 20px;
          }
        }

        /* Mobile Menu */
        .mobile-menu-btn {
          display: none;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 8px 12px;
          color: var(--text-primary);
          font-size: 24px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .mobile-menu-btn:hover {
          background: var(--hover-bg);
        }

        .mobile-nav {
          display: none;
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: var(--bg-secondary);
          backdrop-filter: blur(10px);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease;
        }

        .mobile-nav.open {
          max-height: 500px;
        }

        .mobile-nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 24px;
          text-decoration: none;
          color: var(--text-secondary);
          font-size: 16px;
          font-weight: 500;
          border-bottom: 1px solid var(--border-color);
          transition: all 0.3s ease;
        }

        .mobile-nav-item:hover {
          color: var(--text-primary);
          background: var(--hover-bg);
          padding-left: 32px;
        }

        .mobile-nav-item.active {
          color: var(--text-primary);
          background: rgba(228, 0, 43, 0.15);
          border-left: 4px solid #E4002B;
        }

        /* Responsive Design */
        @media (max-width: 1024px) {
          .desktop-nav {
            display: none;
          }

          .mobile-menu-btn,
          .mobile-nav {
            display: block;
          }

          .header-actions {
            gap: 8px;
          }

          .desktop-only {
            display: none;
          }
          
          .action-btn {
            width: 32px;
            height: 32px;
          }
          
          .header-container {
            gap: 15px;
          }

          .profile-info {
            display: none;
          }

          .profile-btn {
            padding: 4px;
          }
        }

        @media (max-width: 768px) {
          .header-container {
            padding: 0 12px;
            height: 60px;
            gap: 10px;
          }

          .brand-logo {
            height: 32px;
          }

          .emergency-btn {
            padding: 6px 10px;
            min-width: 40px;
          }

          .emergency-icon {
            font-size: 18px;
          }

          .status-bar {
            font-size: 11px;
          }
          
          .status-bar-content {
            padding: 4px 15px;
            min-height: 24px;
          }

          .status-right {
            display: none;
          }
          
          .breadcrumbs {
            font-size: 11px;
          }

          .breadcrumbs-content {
            padding: 6px 12px;
          }
        }
      `}</style>
    </>
  );
};

export default AppHeader;
