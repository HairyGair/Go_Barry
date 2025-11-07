import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { apiConfig } from '../breakdown-guide/components/common/constants';
import notificationService from '../services/notificationService';
import EnhancedNotifications from './notifications/EnhancedNotifications';
import ChangePasswordModal from './ChangePasswordModal.jsx';
import DepotSelectionModal from './DepotSelectionModal.jsx';
import apiClient from '../services/api-client';
import { useAuth } from '../contexts/AuthContext.jsx';
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
  const { currentUser, isAuthenticated: authIsAuthenticated, logout } = useAuth();
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
  const [showDepotModal, setShowDepotModal] = useState(false);

  // Quick actions for command palette
  const quickActions = [
    { id: 'new-breakdown', label: 'Report New Breakdown', icon: '🚨', shortcut: 'Ctrl+N', action: () => navigate('/breakdown-guide') },
    { id: 'view-dashboard', label: 'Control Room Display', icon: '📺', shortcut: 'Alt+D', action: () => navigate('/dashboards/control-room') },
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
      path: '/dashboards/control-room',
      label: 'Control Room',
      fullLabel: 'Control Room Display',
      icon: '📺',
      color: '#22c55e',
      description: 'Large screen monitoring',
      priority: 2,
      stats: { label: 'Today', value: liveStats.today },
      quickLinks: [
        { path: '/dashboards/control-room', label: 'Control Room' },
        { path: '/dashboards/sdc', label: 'SDC Operations' },
        { path: '/dashboards/engineering', label: 'Engineering' }
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

        // Use apiClient for automatic authentication with fresh tokens
        const result = await apiClient.get(`/api/supervisors/${supervisorIdentifier}/stats`);

        if (result) {
          
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
              onRoute: 0,
              depot: 0
            }));
          }
        }
      } catch (error) {
        console.log('Stats fetch error:', error);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [supervisorData]);


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

  // Logout handler - uses AuthContext
  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return; // Prevent double-clicks

    setIsLoggingOut(true);
    setShowProfileMenu(false); // Close profile menu

    try {
      console.log('🚪 ModernAppHeader: Initiating logout...');

      // Call AuthContext logout to clear user state
      logout();

      // Clear any additional storage items
      localStorage.clear();
      sessionStorage.clear();

      console.log('✅ ModernAppHeader: Logout complete, forcing page reload...');

      // Force page reload to show login page
      window.location.href = '/';
    } catch (error) {
      console.error('❌ ModernAppHeader logout error:', error);

      // Emergency logout fallback
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/';
    } finally {
      setIsLoggingOut(false);
    }
  }, [logout, isLoggingOut]);

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

  // Handle depot selection for engineering display
  const handleDepotSelection = (depot) => {
    const displayId = `${depot.code.toLowerCase()}-yard-1`;
    window.open(`/dashboards/engineering/display?displayId=${displayId}&depot=${depot.code}`, '_blank');
  };

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
                  <Link
                    to={item.comingSoon ? '#' : item.path}
                    className={`nav-link-modern compact ${isActive(item.path) ? 'active' : ''} ${item.comingSoon ? 'coming-soon' : ''}`}
                    style={{ '--nav-color': item.color }}
                    title={item.comingSoon ? `${item.fullLabel} - Coming Soon` : item.fullLabel}
                    onClick={(e) => item.comingSoon && e.preventDefault()}
                  >
                    <span className="nav-icon-modern">{item.icon}</span>
                    <span className="nav-label-modern">{item.label}</span>
                    {!item.comingSoon && item.stats && item.stats.value > 0 && (
                      <span className="nav-stat mini">{item.stats.value}</span>
                    )}
                  </Link>

                  {/* Dropdown on hover - only for active features */}
                  {!item.comingSoon && (
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
                  )}
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

              {/* Engineering Display Button */}
              <button
                className="engineering-display-btn"
                onClick={() => setShowDepotModal(true)}
                title="Open Engineering Display (Choose Depot)"
              >
                <span className="display-icon">📺</span>
                <span className="display-label">Display</span>
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
                  title={currentUser?.name || supervisorData?.name || 'Menu'}
                >
                  <div className="profile-avatar-modern compact">
                    {currentUser?.name?.charAt(0) || supervisorData?.name?.charAt(0) || 'U'}
                  </div>
                  <span className="profile-arrow">▼</span>
                </button>

                {/* Enhanced Profile Dropdown */}
                {showProfileMenu && (
                  <div className="profile-dropdown-modern compact">
                    <div className="profile-header-modern">
                      <div className="profile-avatar-large">
                        {currentUser?.name?.charAt(0) || supervisorData?.name?.charAt(0) || 'U'}
                      </div>
                      <div className="profile-details">
                        <h4>{currentUser?.name || supervisorData?.name || 'User'}</h4>
                        <p>{currentUser?.email || supervisorData?.email || 'user@gonortheast.co.uk'}</p>
                        <span className="profile-badge">{currentUser?.depot || supervisorData?.depot || 'SDC'}</span>
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
                          title={item.comingSoon ? `${item.fullLabel} - Coming Soon` : ''}
                        >
                          <span>{item.icon}</span>
                          <span>{item.fullLabel}</span>
                          {!item.comingSoon && item.stats && item.stats.value > 0 && (
                            <span className="nav-badge">{item.stats.value}</span>
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
            <Link
              key={item.path}
              to={item.comingSoon ? '#' : item.path}
              className={`mobile-nav-item ${isActive(item.path) ? 'active' : ''} ${item.comingSoon ? 'coming-soon' : ''}`}
              onClick={(e) => {
                if (item.comingSoon) {
                  e.preventDefault();
                } else {
                  setIsMenuOpen(false);
                }
              }}
              title={item.comingSoon ? `${item.fullLabel} - Coming Soon` : item.fullLabel}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.fullLabel}</span>
              {!item.comingSoon && item.stats && item.stats.value > 0 && (
                <span className="nav-value">{item.stats.value}</span>
              )}
            </Link>
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
                  title={action.comingSoon ? `${action.label} - Coming Soon` : ''}
                >
                  <span className="command-icon">{action.icon}</span>
                  <span className="command-label">{action.label}</span>
                  <span className="command-shortcut">{action.shortcut}</span>
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

      {/* Depot Selection Modal */}
      <DepotSelectionModal
        isOpen={showDepotModal}
        onClose={() => setShowDepotModal(false)}
        onSelectDepot={handleDepotSelection}
      />
    </>
  );
};

export default ModernAppHeader;