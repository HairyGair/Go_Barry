import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { apiConfig } from '../breakdown-guide/components/common/constants';
import notificationService from '../services/notificationService';
import EnhancedNotifications from './notifications/EnhancedNotifications';
import { useAuth } from '../contexts/AuthContext.jsx';
import ChangePasswordModal from './ChangePasswordModal.jsx';
import './ModernAppHeader.css';

const ModernAppHeader = ({ 
  variant = 'full',
  activeBreakdowns: propActiveBreakdowns = 0,
  isAuthenticated = false,
  supervisorSession = null,
  onSignOut,
  onLoginSuccess
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get auth context
  const { logout, currentUser } = useAuth();
  const headerRef = useRef(null);
  const searchInputRef = useRef(null);
  const lastScrollY = useRef(0);

  // State management
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [supervisorData, setSupervisorData] = useState(null);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [weatherData, setWeatherData] = useState(null);
  const [systemHealth, setSystemHealth] = useState('operational');
  const [activeBreakdowns, setActiveBreakdowns] = useState(propActiveBreakdowns || 2); // Default to 2 for testing
  const [notifications, setNotifications] = useState([]);
  const [liveStats, setLiveStats] = useState({
    active: 0,
    today: 0,
    resolved: 0,
    responseTime: '00:00',
    fleetHealth: 92,
    onRoute: 0,
    depot: 0
  });
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  // Quick actions for command palette
  const quickActions = [
    { id: 'new-breakdown', label: 'Report New Breakdown', icon: '🚨', shortcut: 'Ctrl+N', action: () => navigate('/breakdown-guide') },
    { id: 'view-dashboard', label: 'Live Dashboard', icon: '📊', shortcut: 'Alt+D', action: () => navigate('/dashboards/breakdown'), comingSoon: true },
    { id: 'fleet-status', label: 'Fleet Status', icon: '🚌', shortcut: 'Alt+F', action: () => navigate('/dashboards/engineering'), comingSoon: true },
    { id: 'recent-assessments', label: 'Recent Assessments', icon: '📋', shortcut: 'Alt+R', action: () => navigate('/breakdown-guide/history') },
    { id: 'sdc-operations', label: 'SDC Control Centre', icon: '🎛️', shortcut: 'Alt+S', action: () => navigate('/dashboards/sdc'), comingSoon: true },
    { id: 'emergency-protocol', label: 'Emergency Protocol', icon: '⚠️', shortcut: 'Ctrl+E', action: () => alert('Emergency Protocol Activated') },
    { id: 'team-status', label: 'Team Status', icon: '👥', shortcut: 'Alt+T', action: () => navigate('/dashboards/engineering/teams'), comingSoon: true },
    { id: 'reports', label: 'Generate Report', icon: '📑', shortcut: 'Alt+G', action: () => navigate('/dashboards/management/reports'), comingSoon: true },
  ];

  // Navigation items - prioritized for main nav
  const navigationItems = [
    { 
      path: '/breakdown-guide', 
      label: 'Breakdown',
      fullLabel: 'Breakdown Guide', 
      icon: '🔧',
      color: '#E4002B',
      description: 'Report & manage breakdowns',
      priority: 1,
      stats: { label: 'Active', value: liveStats.active },
      quickLinks: [
        { path: '/breakdown-guide', label: 'New Assessment' },
        { path: '/breakdown-guide/history', label: 'History' },
        { path: '/breakdown-guide/fleet', label: 'Fleet Status' }
      ]
    },
    { 
      path: '/dashboards/breakdown', 
      label: 'Live',
      fullLabel: 'Live Dashboard', 
      icon: '📊',
      color: '#22c55e',
      description: 'Real-time monitoring',
      priority: 2,
      comingSoon: true, // Add coming soon flag
      stats: { label: 'Today', value: liveStats.today },
      quickLinks: [
        { path: '/dashboards/breakdown', label: 'Overview' },
        { path: '/dashboards/breakdown/sla', label: 'SLA Monitor' },
        { path: '/dashboards/breakdown/map', label: 'Live Map' }
      ]
    },
    { 
      path: '/dashboards/sdc', 
      label: 'SDC',
      fullLabel: 'SDC Operations', 
      icon: '🎯',
      color: '#3b82f6',
      description: 'Control centre',
      priority: 3,
      comingSoon: true, // Add coming soon flag
      stats: { label: 'On Route', value: liveStats.onRoute },
      quickLinks: [
        { path: '/dashboards/sdc', label: 'Control Centre' },
        { path: '/dashboards/sdc/dispatch', label: 'Dispatch' },
        { path: '/dashboards/sdc/alerts', label: 'Alerts' }
      ]
    },
    { 
      path: '/dashboards/engineering', 
      label: 'Fleet',
      fullLabel: 'Fleet Intelligence', 
      icon: '⚙️',
      color: '#f59e0b',
      description: 'Engineering & maintenance',
      priority: 4,
      comingSoon: true, // Add coming soon flag
      stats: { label: 'Health', value: `${liveStats.fleetHealth}%` },
      quickLinks: [
        { path: '/dashboards/engineering', label: 'Status' },
        { path: '/dashboards/engineering/teams', label: 'Teams' },
        { path: '/dashboards/engineering/maintenance', label: 'Schedule' }
      ]
    },
    { 
      path: '/dashboards/management', 
      label: 'Reports',
      fullLabel: 'Management', 
      icon: '📈',
      color: '#8b5cf6',
      description: 'Analytics & reports',
      priority: 5,
      comingSoon: true, // Add coming soon flag
      stats: { label: 'Resolved', value: liveStats.resolved },
      quickLinks: [
        { path: '/dashboards/management', label: 'Executive' },
        { path: '/dashboards/management/reports', label: 'Reports' },
        { path: '/dashboards/management/analytics', label: 'Analytics' }
      ]
    }
  ];

  // Update activeBreakdowns when prop changes
  useEffect(() => {
    if (propActiveBreakdowns !== undefined && propActiveBreakdowns !== null) {
      setActiveBreakdowns(propActiveBreakdowns);
    }
  }, [propActiveBreakdowns]);

  // Load supervisor data from props or localStorage
  useEffect(() => {
    if (supervisorSession) {
      setSupervisorData(supervisorSession);
    } else {
      const savedSession = localStorage.getItem('supervisor_session');
      if (savedSession) {
        const session = JSON.parse(savedSession);
        setSupervisorData(session);
      }
    }
  }, [supervisorSession]);

  // Update time
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch live stats
  useEffect(() => {
    const fetchStats = async () => {
      if (!supervisorData || !isAuthenticated) return;
      
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
            setLiveStats(prev => ({ 
              ...prev,
              active: performance.totalBreakdowns - performance.resolvedBreakdowns,
              today: performance.totalBreakdowns,
              resolved: performance.resolvedBreakdowns,
              responseTime: `00:${String(performance.avgResponseTime || 0).padStart(2, '0')}`,
              fleetHealth: performance.resolutionRate || 92,
              onRoute: Math.floor(Math.random() * 50) + 150,
              depot: Math.floor(Math.random() * 10) + 5
            }));
          } else {
            // Fallback to mock data
            setLiveStats(prev => ({ 
              ...prev, 
              active: Math.floor(Math.random() * 3),
              today: Math.floor(Math.random() * 8) + 2,
              resolved: Math.floor(Math.random() * 15) + 5,
              responseTime: `00:${String(Math.floor(Math.random() * 59)).padStart(2, '0')}`
            }));
          }
        } else {
          // Use mock data if endpoint doesn't exist
          setLiveStats(prev => ({ 
            ...prev, 
            activeBreakdowns: Math.floor(Math.random() * 3),
            todayAssessments: Math.floor(Math.random() * 8) + 2,
            avgResponseTime: Math.floor(Math.random() * 15) + 5
          }));
        }
      } catch (error) {
        console.log('Stats fetch error:', error);
        // Use mock data on error
        setLiveStats(prev => ({ 
          ...prev, 
          activeBreakdowns: 0,
          todayAssessments: 3,
          avgResponseTime: 8
        }));
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [supervisorData]);

  // Fetch weather (mock for now)
  useEffect(() => {
    // Mock weather data - replace with actual API
    setWeatherData({
      temp: '12°C',
      condition: 'Partly Cloudy',
      icon: '⛅',
      alerts: []
    });
  }, []);

  // Initialize notification service
  useEffect(() => {
    // Load initial notifications
    const loadNotifications = async () => {
      const notifs = await notificationService.fetchNotifications(supervisorData?.id);
      setNotifications(notifs);
      // Count critical and high priority as active breakdowns
      const activeCount = notifs.filter(n => 
        n.priority === 'critical' || n.priority === 'high'
      ).length;
      setActiveBreakdowns(activeCount);
    };

    if (supervisorData) {
      loadNotifications();
      
      // Subscribe to notification updates
      const unsubscribe = notificationService.subscribe((updatedNotifications) => {
        setNotifications(updatedNotifications);
        const activeCount = updatedNotifications.filter(n => 
          n.priority === 'critical' || n.priority === 'high'
        ).length;
        setActiveBreakdowns(activeCount);
      });

      return unsubscribe;
    }
  }, [supervisorData]);

  // Smart scroll behavior
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          
          if (currentScrollY < 50) {
            setHeaderVisible(true);
          } else if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
            setHeaderVisible(false);
          } else if (currentScrollY < lastScrollY.current) {
            setHeaderVisible(true);
          }
          
          lastScrollY.current = currentScrollY;
          ticking = false;
        });
        
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeydown = (e) => {
      // Command palette (Cmd/Ctrl + K)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
      
      // ESC to close modals
      if (e.key === 'Escape') {
        setShowCommandPalette(false);
        setShowNotifications(false);
        setShowProfileMenu(false);
        setShowMoreMenu(false);
      }
      
      // Quick navigation shortcuts
      if (e.altKey && !e.ctrlKey && !e.shiftKey) {
        switch(e.key) {
          case '1': e.preventDefault(); navigate('/breakdown-guide'); break;
          case '2': e.preventDefault(); navigate('/dashboards/sdc'); break;
          case '3': e.preventDefault(); navigate('/dashboards/breakdown'); break;
          case '4': e.preventDefault(); navigate('/dashboards/engineering'); break;
          case '5': e.preventDefault(); navigate('/dashboards/management'); break;
        }
      }
    };

    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, [navigate]);

  // Focus search when command palette opens
  useEffect(() => {
    if (showCommandPalette && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showCommandPalette]);

  // Enhanced logout handler
  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return; // Prevent double-clicks
    
    setIsLoggingOut(true);
    setShowProfileMenu(false); // Close profile menu
    
    try {
      console.log('🚪 ModernAppHeader: Initiating logout...');
      
      // Use AuthContext logout if available, otherwise fallback to onSignOut prop or basic logout
      if (logout && typeof logout === 'function') {
        await logout(true, '/'); // Show message and redirect to home
        console.log('✅ ModernAppHeader: AuthContext logout completed');
      } else if (onSignOut && typeof onSignOut === 'function') {
        await onSignOut();
        console.log('✅ ModernAppHeader: onSignOut prop called');
      } else {
        // Fallback logout method
        console.log('⚠️ ModernAppHeader: Using fallback logout method');
        localStorage.removeItem('supervisor_session');
        localStorage.removeItem('auth_session');
        localStorage.removeItem('auth_user');
        navigate('/');
      }
    } catch (error) {
      console.error('❌ ModernAppHeader logout error:', error);
      
      // Emergency logout fallback
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/';
    } finally {
      setIsLoggingOut(false);
    }
  }, [logout, onSignOut, navigate, isLoggingOut]);

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path);

  const getPriorityClass = (priority) => {
    switch(priority) {
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      case 'low': return 'priority-low';
      default: return '';
    }
  };

  const getSystemHealthClass = () => {
    switch(systemHealth) {
      case 'operational': return 'health-good';
      case 'degraded': return 'health-warning';
      case 'critical': return 'health-critical';
      default: return '';
    }
  };

  // Filter actions based on search
  const filteredActions = quickActions.filter(action =>
    action.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Modern Header with Glassmorphism */}
      <header 
        ref={headerRef}
        className={`modern-app-header ${headerVisible ? 'visible' : 'hidden'} ${theme}`}
      >
        {/* Top Status Bar - Compact */}
        <div className="status-bar-modern compact">
          <div className="status-bar-left">
            <div className={`system-health ${getSystemHealthClass()}`}>
              <span className="health-indicator"></span>
              <span className="health-text">System OK</span>
            </div>
            {weatherData && (
              <>
                <span className="separator">|</span>
                <span className="weather-compact">
                  {weatherData.icon} {weatherData.temp}
                </span>
              </>
            )}
            <span className="separator">|</span>
            <span className="fleet-status">
              Fleet: {liveStats.fleetHealth}% • Active: {liveStats.active}
            </span>
            <span className="separator">|</span>
            <span className="dev-notice" style={{
              color: '#ffc107',
              fontSize: '11px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              🔨 Some features under construction
            </span>
          </div>
          <div className="status-bar-right">
            <span className="current-time">
              {currentTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
        </div>

        {/* Main Header Content */}
        <div className="header-main compact">
          <div className="header-container-modern">
            {/* Logo Section - Compact */}
            <Link to="/" className="brand-section compact">
              <img 
                src="/gne-logo-horizontal-colour.png" 
                alt="Go North East" 
                className="brand-logo-modern"
              />
            </Link>

            {/* Main Navigation - Priority Items Only */}
            <nav className="nav-center compact">
              {navigationItems.slice(0, 4).map((item) => (
                <div key={item.path} className="nav-item-modern">
                  {item.comingSoon ? (
                    <div
                      className={`nav-link-modern compact coming-soon ${isActive(item.path) ? 'active' : ''}`}
                      style={{ '--nav-color': item.color }}
                      title={`${item.fullLabel} - Coming Soon`}
                    >
                      <span className="nav-icon-modern">{item.icon}</span>
                      <span className="nav-label-modern">{item.label}</span>
                      <span className="coming-soon-indicator">🚧</span>
                    </div>
                  ) : (
                    <Link
                      to={item.path}
                      className={`nav-link-modern compact ${isActive(item.path) ? 'active' : ''}`}
                      style={{ '--nav-color': item.color }}
                      title={item.fullLabel}
                    >
                      <span className="nav-icon-modern">{item.icon}</span>
                      <span className="nav-label-modern">{item.label}</span>
                      {item.stats && item.stats.value > 0 && (
                        <span className="nav-stat mini">{item.stats.value}</span>
                      )}
                    </Link>
                  )}
                  
                  {/* Dropdown on hover */}
                  <div className="nav-dropdown-modern compact">
                    <div className="dropdown-header">
                      <h4>{item.fullLabel}</h4>
                      <p>{item.description}</p>
                    </div>
                    {item.stats && (
                      <div className="dropdown-stats">
                        <span className="dropdown-stat-label">{item.stats.label}:</span>
                        <span className="dropdown-stat-value">{item.stats.value}</span>
                      </div>
                    )}
                    <div className="dropdown-links">
                      {item.quickLinks.map(link => (
                        <Link 
                          key={link.path} 
                          to={link.path} 
                          className="dropdown-link"
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </nav>

            {/* Right Actions - Streamlined */}
            <div className="header-actions-modern compact">
              {/* Search */}
              <button 
                className="action-btn-modern icon-only"
                onClick={() => setShowCommandPalette(true)}
                title="Search (Cmd+K)"
              >
                🔍
              </button>

              {/* Notifications */}
              <button 
                className={`action-btn-modern icon-only ${activeBreakdowns > 0 ? 'has-notifications' : ''}`}
                onClick={() => setShowNotifications(!showNotifications)}
                title={`${activeBreakdowns} notifications`}
              >
                🔔
                {activeBreakdowns > 0 && (
                  <span className="notification-badge">{activeBreakdowns}</span>
                )}
              </button>

              {/* Report Breakdown Button - Always Visible */}
              <button 
                className="report-breakdown-btn"
                onClick={() => navigate('/breakdown-guide')}
                title="Report New Breakdown"
              >
                <span className="breakdown-icon">🚨</span>
                <span className="breakdown-label">Report Breakdown</span>
              </button>

              {/* User Menu with All Settings */}
              <div className="profile-section-modern">
                <button 
                  className="profile-btn-modern compact"
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  title={supervisorData?.name || 'Menu'}
                >
                  <div className="profile-avatar-modern compact">
                    {supervisorData?.name?.charAt(0) || 'U'}
                  </div>
                  <span className="profile-arrow">▼</span>
                </button>

                {/* Enhanced Profile Dropdown */}
                {showProfileMenu && (
                  <div className="profile-dropdown-modern compact">
                    <div className="profile-header-modern">
                      <div className="profile-avatar-large">
                        {supervisorData?.name?.charAt(0) || 'U'}
                      </div>
                      <div className="profile-details">
                        <h4>{supervisorData?.name || 'User'}</h4>
                        <p>{supervisorData?.email || 'user@gonortheast.co.uk'}</p>
                        <span className="profile-badge">{supervisorData?.depot || 'SDC'}</span>
                      </div>
                    </div>
                    
                    <div className="profile-stats-grid">
                      <div className="profile-stat">
                        <span className="stat-value">{liveStats.today}</span>
                        <span className="stat-label">Today</span>
                      </div>
                      <div className="profile-stat">
                        <span className="stat-value">{liveStats.active}</span>
                        <span className="stat-label">Active</span>
                      </div>
                      <div className="profile-stat">
                        <span className="stat-value">{liveStats.resolved}</span>
                        <span className="stat-label">Resolved</span>
                      </div>
                    </div>

                    <div className="profile-quick-actions">
                      <button
                        className="quick-action"
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        title="Toggle Theme"
                      >
                        {theme === 'dark' ? '☀️' : '🌙'}
                      </button>
                      <button
                        className="quick-action"
                        onClick={() => {
                          setShowChangePassword(true);
                          setShowProfileMenu(false);
                        }}
                        title="Change Password"
                      >
                        🔐
                      </button>
                      <button
                        className="quick-action"
                        onClick={() => navigate('/settings')}
                        title="Settings"
                      >
                        ⚙️
                      </button>
                      <button
                        className="quick-action"
                        onClick={() => navigate('/help')}
                        title="Help"
                      >
                        ❓
                      </button>
                    </div>
                    
                    <div className="profile-nav-links">
                      <h5>Navigation</h5>
                      {navigationItems.map(item => (
                        <button 
                          key={item.path}
                          onClick={() => {
                            if (!item.comingSoon) {
                              navigate(item.path);
                              setShowProfileMenu(false);
                            }
                          }}
                          className={`profile-nav-item ${item.comingSoon ? 'coming-soon' : ''}`}
                          disabled={item.comingSoon}
                        >
                          <span>{item.icon}</span>
                          <span>{item.fullLabel}</span>
                          {item.comingSoon ? (
                            <span className="nav-badge coming-soon">🚧</span>
                          ) : (
                            item.stats && item.stats.value > 0 && (
                              <span className="nav-badge">{item.stats.value}</span>
                            )
                          )}
                        </button>
                      ))}
                    </div>
                    
                    <div className="profile-menu-footer">
                      <button 
                        className="logout-btn"
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                      >
                        {isLoggingOut ? (
                          <>⏳ Signing Out...</>
                        ) : (
                          <>🚪 Sign Out</>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Menu Toggle */}
              <button 
                className="mobile-menu-toggle"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <span className={`menu-icon ${isMenuOpen ? 'open' : ''}`}>
                  <span></span>
                  <span></span>
                  <span></span>
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className={`mobile-nav-modern ${isMenuOpen ? 'open' : ''}`}>
          {navigationItems.map(item => (
            item.comingSoon ? (
              <div
                key={item.path}
                className={`mobile-nav-item coming-soon ${isActive(item.path) ? 'active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.fullLabel}</span>
                <span className="coming-soon-mobile">🚧</span>
              </div>
            ) : (
              <Link
                key={item.path}
                to={item.path}
                className={`mobile-nav-item ${isActive(item.path) ? 'active' : ''}`}
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.fullLabel}</span>
                {item.stats && item.stats.value > 0 && (
                  <span className="nav-value">{item.stats.value}</span>
                )}
              </Link>
            )
          ))}
        </div>
      </header>

      {/* Command Palette Modal */}
      {showCommandPalette && (
        <div className="command-palette-overlay" onClick={() => setShowCommandPalette(false)}>
          <div className="command-palette" onClick={(e) => e.stopPropagation()}>
            <div className="command-header">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Type a command or search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="command-input"
              />
              <button 
                className="command-close"
                onClick={() => setShowCommandPalette(false)}
              >
                ESC
              </button>
            </div>
            <div className="command-results">
              {filteredActions.map(action => (
                <button
                  key={action.id}
                  className={`command-item ${action.comingSoon ? 'coming-soon' : ''}`}
                  onClick={() => {
                    if (!action.comingSoon) {
                      action.action();
                      setShowCommandPalette(false);
                      setSearchQuery('');
                    }
                  }}
                  disabled={action.comingSoon}
                >
                  <span className="command-icon">{action.icon}</span>
                  <span className="command-label">{action.label}</span>
                  {action.comingSoon ? (
                    <span className="command-coming-soon">🚧 Soon</span>
                  ) : (
                    <span className="command-shortcut">{action.shortcut}</span>
                  )}
                </button>
              ))}
            </div>
            <div className="command-footer">
              <span>↑↓ Navigate</span>
              <span>↵ Select</span>
              <span>ESC Close</span>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Notifications Panel */}
      <EnhancedNotifications
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        supervisorData={supervisorData}
        onActionClick={(notification, action) => {
          console.log('Notification action:', notification, action);
          // Handle navigation or other actions here
          if (action.action === 'start_assessment') {
            navigate('/breakdown-guide');
          } else if (action.action === 'dashboard') {
            navigate('/dashboards/breakdown');
          }
          setShowNotifications(false);
        }}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
        userEmail={currentUser?.email}
      />
    </>
  );
};

export default ModernAppHeader;