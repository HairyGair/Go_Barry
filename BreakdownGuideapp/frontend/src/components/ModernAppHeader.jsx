import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { apiConfig } from '../breakdown-guide/components/common/constants';
import notificationService from '../services/notificationService';
import EnhancedNotifications from './notifications/EnhancedNotifications';
import ChangePasswordModal from './ChangePasswordModal.jsx';
import DepotSelectionModal from './DepotSelectionModal.jsx';
import DutyBadge from './DutyBadge.jsx';
import { GoBarryBanner } from './GoBarryLogo.jsx';
import apiClient from '../services/api-client';
import { useAuth } from '../contexts/AuthContext.jsx';
import './ModernAppHeader.css';

const ModernAppHeader = ({
  variant = 'full',
  activeBreakdowns: propActiveBreakdowns = 0,
  isAuthenticated = false,
  supervisorSession = null,
  currentDuty = null,
  onDutyClick,
  onSignOut,
  onLoginSuccess,
  // NEW: Unified header props
  showBreadcrumbs = true,           // Enable/disable breadcrumbs
  sdcStats = null,                  // SDC stats: { total, critical, dispatched }
  connectionManager = null,         // For real-time status display
  onRefresh = null,                 // Refresh callback for SDC mode
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
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Auto-detect SDC mode based on current route
  const isSDCMode = location.pathname.startsWith('/dashboards/sdc');

  // Keyboard shortcuts data
  const shortcuts = [
    { key: 'Alt+1', description: 'Go to Breakdown Guide' },
    { key: 'Alt+2', description: 'Go to Operations' },
    { key: 'Alt+3', description: 'Go to Display' },
    { key: 'Alt+4', description: 'Go to Engineering' },
    { key: 'Alt+5', description: 'Go to Fleet Intelligence' },
    { key: 'Alt+6', description: 'Go to Management' },
    { key: 'Alt+Y', description: 'Open Yard Display (new tab)' },
    { key: 'Alt+H', description: 'Go to Home' },
    { key: 'Alt+Q', description: 'Toggle Shortcuts Panel' },
    { key: 'Cmd+K', description: 'Open Command Palette' },
  ];

  // Breadcrumb generation function
  const getBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = [{ path: '/', label: 'Home' }];

    let currentPath = '';
    paths.forEach((segment) => {
      currentPath += `/${segment}`;
      let label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');

      // Custom labels for known routes
      if (segment === 'breakdown-guide') label = 'Breakdown Guide';
      if (segment === 'dashboards') label = 'Dashboards';
      if (segment === 'sdc') label = 'Operations';
      if (segment === 'engineering') label = 'Engineering';
      if (segment === 'display') label = 'Yard Display';
      if (segment === 'control-room') label = 'Display';
      if (segment === 'management') label = 'Management';
      if (segment === 'fleet-defects') label = 'Fleet Defects';
      if (segment === 'fleet-intelligence') label = 'Fleet Intelligence';

      breadcrumbs.push({ path: currentPath, label });
    });

    return breadcrumbs;
  };

  // SDC connection status helpers
  const getConnectionStatus = () => {
    if (!connectionManager?.isConnected) return 'disconnected';
    if (connectionManager.currentMode === 'websocket') return 'realtime';
    if (connectionManager.currentMode === 'polling') return 'polling';
    return 'unknown';
  };

  const getConnectionLabel = () => {
    switch (getConnectionStatus()) {
      case 'realtime': return 'Real-time';
      case 'polling': return 'Polling';
      case 'disconnected': return 'Disconnected';
      default: return 'Unknown';
    }
  };

  // Quick actions for command palette
  const quickActions = [
    { id: 'new-breakdown', label: 'Report New Breakdown', icon: '🚨', shortcut: 'Ctrl+N', action: () => navigate('/breakdown-guide') },
    { id: 'view-dashboard', label: 'Display', icon: '📺', shortcut: 'Alt+D', action: () => navigate('/dashboards/control-room') },
    { id: 'engineering', label: 'Engineering Dashboard', icon: '🔧', shortcut: 'Alt+4', action: () => navigate('/dashboards/engineering') },
    { id: 'yard-display', label: 'Open Yard Display', icon: '🖥️', shortcut: 'Alt+Y', action: () => window.open('/dashboards/engineering/display', '_blank') },
    { id: 'fleet-status', label: 'Fleet Intelligence', icon: '📊', shortcut: 'Alt+F', action: () => navigate('/fleet-intelligence') },
    { id: 'recent-assessments', label: 'Recent Assessments', icon: '📋', shortcut: 'Alt+R', action: () => navigate('/breakdown-guide/history') },
    { id: 'sdc-operations', label: 'Operations Centre', icon: '🎯', shortcut: 'Alt+S', action: () => navigate('/dashboards/sdc') },
    { id: 'emergency-protocol', label: 'Emergency Protocol', icon: '⚠️', shortcut: 'Ctrl+E', action: () => alert('Emergency Protocol Activated') },
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
      label: 'Display',
      fullLabel: 'Display',
      icon: '📺',
      color: '#22c55e',
      description: 'Large screen monitoring',
      priority: 2,
      stats: { label: 'Today', value: liveStats.today },
      quickLinks: [
        { path: '/dashboards/control-room', label: 'Display' },
        { path: '/dashboards/sdc', label: 'Operations' },
        { path: '/dashboards/engineering', label: 'Engineering' }
      ]
    },
    {
      path: '/dashboards/sdc',
      label: 'Ops',
      fullLabel: 'Operations',
      icon: '🎯',
      color: '#3b82f6',
      description: 'Operations dashboard',
      priority: 3,
      stats: { label: 'On Route', value: liveStats.onRoute },
      quickLinks: [
        { path: '/dashboards/sdc', label: 'Operations' },
        { path: '/dashboards/sdc/dispatch', label: 'Dispatch' },
        { path: '/dashboards/sdc/alerts', label: 'Alerts' }
      ]
    },
    {
      path: '/dashboards/engineering',
      label: 'Engineering',
      fullLabel: 'Engineering Dashboard',
      icon: '🔧',
      color: '#f59e0b',
      description: 'Engineering dispatch & yard displays',
      priority: 4,
      stats: { label: 'Jobs', value: liveStats.active || 0 },
      quickLinks: [
        { path: '/dashboards/engineering', label: 'Dispatch Dashboard' },
        { type: 'divider', label: 'Yard Displays' },
        { path: '/dashboards/engineering/display?depot=Washington', label: '🖥️ Washington', external: true },
        { path: '/dashboards/engineering/display?depot=Riverside', label: '🖥️ Riverside', external: true },
        { path: '/dashboards/engineering/display?depot=Consett', label: '🖥️ Consett', external: true },
        { path: '/dashboards/engineering/display?depot=Deptford', label: '🖥️ Deptford', external: true },
        { path: '/dashboards/engineering/display?depot=Percy%20Main', label: '🖥️ Percy Main', external: true },
        { path: '/dashboards/engineering/display?depot=Hexham', label: '🖥️ Hexham', external: true }
      ]
    },
    {
      path: '/fleet-intelligence',
      label: 'Fleet',
      fullLabel: 'Fleet Intelligence',
      icon: '📊',
      color: '#8b5cf6',
      description: 'Fleet analytics & insights',
      priority: 5,
      stats: { label: 'Health', value: `${liveStats.fleetHealth}%` },
      quickLinks: [
        { path: '/fleet-intelligence', label: 'Command Center' },
        { path: '/dashboards/fleet-defects', label: 'Defects' },
        { path: '/dashboards/management', label: 'Reports' }
      ]
    },
    {
      path: '/dashboards/management',
      label: 'Reports',
      fullLabel: 'Management',
      icon: '📈',
      color: '#8b5cf6',
      description: 'Analytics & reports',
      priority: 6,
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
      // SAFETY: Ensure notifs is always an array
      const safeNotifs = Array.isArray(notifs) ? notifs : [];
      setNotifications(safeNotifs);
      // Count critical and high priority as active breakdowns
      const activeCount = safeNotifs.filter(n =>
        n.priority === 'critical' || n.priority === 'high'
      ).length;
      setActiveBreakdowns(activeCount);
    };

    if (supervisorData) {
      loadNotifications();

      // Subscribe to notification updates
      const unsubscribe = notificationService.subscribe((updatedNotifications) => {
        // SAFETY: Ensure updatedNotifications is always an array
        const safeUpdatedNotifs = Array.isArray(updatedNotifications) ? updatedNotifications : [];
        setNotifications(safeUpdatedNotifs);
        const activeCount = safeUpdatedNotifs.filter(n =>
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
        setShowShortcuts(false);
      }

      // Quick navigation shortcuts
      if (e.altKey && !e.ctrlKey && !e.shiftKey) {
        switch(e.key) {
          case '1': e.preventDefault(); navigate('/breakdown-guide'); break;
          case '2': e.preventDefault(); navigate('/dashboards/sdc'); break;
          case '3': e.preventDefault(); navigate('/dashboards/control-room'); break;
          case '4': e.preventDefault(); navigate('/dashboards/engineering'); break;
          case '5': e.preventDefault(); navigate('/fleet-intelligence'); break;
          case '6': e.preventDefault(); navigate('/dashboards/management'); break;
          case 'y':
          case 'Y': e.preventDefault(); window.open('/dashboards/engineering/display', '_blank'); break;
          case 'q':
          case 'Q': e.preventDefault(); setShowShortcuts(prev => !prev); break;
          case 'h':
          case 'H': e.preventDefault(); navigate('/'); break;
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

    console.log('🚪 ModernAppHeader: Logout button clicked');
    setIsLoggingOut(true);
    setShowProfileMenu(false); // Close profile menu

    try {
      console.log('🚪 ModernAppHeader: Initiating logout...');

      // Call AuthContext logout to clear user state
      await logout();

      console.log('✅ ModernAppHeader: AuthContext logout complete');

      // Clear any additional storage items
      localStorage.clear();
      sessionStorage.clear();

      // CRITICAL: Also clear all cookies manually (belt and suspenders approach)
      document.cookie.split(";").forEach(function(c) {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/;domain=.gobarry.co.uk");
      });

      console.log('✅ ModernAppHeader: Storage and cookies cleared, forcing page reload...');

      // Longer delay to ensure everything is cleared
      setTimeout(() => {
        // Use replace instead of href to prevent back button from going to authenticated state
        // Add timestamp to prevent any caching
        window.location.replace('/?logout=' + Date.now());
      }, 200);
    } catch (error) {
      console.error('❌ ModernAppHeader logout error:', error);

      // Emergency logout fallback - ALWAYS succeeds
      try {
        localStorage.clear();
        sessionStorage.clear();
        // Clear cookies
        document.cookie.split(";").forEach(function(c) {
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/;domain=.gobarry.co.uk");
        });
      } catch (storageError) {
        console.error('❌ Storage clear error:', storageError);
      }

      // Force reload no matter what
      setTimeout(() => {
        window.location.replace('/?logout=' + Date.now());
      }, 200);
    } finally {
      // Don't reset isLoggingOut - we're leaving the page anyway
      console.log('🚪 ModernAppHeader: Logout sequence complete');
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
      {/* Single Unified Header */}
      <header
        ref={headerRef}
        className={`modern-app-header unified ${headerVisible ? 'visible' : 'hidden'} ${theme}`}
      >
        {/* Single Header Bar */}
        <div className="header-main compact">
          <div className="header-container-modern">
            {/* Logo Section - Compact */}
            <Link to="/" className="brand-section compact">
              <GoBarryBanner height={45} theme="dark" showTagline={false} />
            </Link>

            {/* Main Navigation - Priority Items Only */}
            <nav className="nav-center compact">
              {navigationItems.slice(0, 5).map((item) => (
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
                        {item.quickLinks.map((link, index) => (
                          link.type === 'divider' ? (
                            <div key={`divider-${index}`} className="dropdown-divider">
                              <span className="divider-label">{link.label}</span>
                            </div>
                          ) : link.external ? (
                            <a
                              key={link.path}
                              href={link.path}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="dropdown-link external"
                            >
                              {link.label}
                              <span className="external-icon">↗</span>
                            </a>
                          ) : (
                            <Link
                              key={link.path}
                              to={link.path}
                              className="dropdown-link"
                            >
                              {link.label}
                            </Link>
                          )
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {/* Right Actions - Clean & Professional */}
            <div className="header-actions-modern compact">
              {/* Active Breakdowns Indicator */}
              {activeBreakdowns > 0 && (
                <button
                  className="header-alert-chip"
                  onClick={() => navigate('/dashboards/sdc')}
                  title={`${activeBreakdowns} active breakdown${activeBreakdowns > 1 ? 's' : ''}`}
                >
                  <span className="alert-pulse"></span>
                  <span className="alert-count">{activeBreakdowns}</span>
                  <span className="alert-label">Active</span>
                </button>
              )}

              {/* Report Breakdown - Primary Action */}
              <button
                className="header-primary-action"
                onClick={() => navigate('/breakdown-guide')}
                title="Report New Breakdown"
              >
                <span>🚨</span>
                <span>Report</span>
              </button>

              {/* Quick Actions Menu */}
              <button
                className="header-icon-btn"
                onClick={() => setShowCommandPalette(true)}
                title="Search & Commands (⌘K)"
              >
                🔍
              </button>

              {/* Notifications */}
              <button
                className={`header-icon-btn ${activeBreakdowns > 0 ? 'has-badge' : ''}`}
                onClick={() => setShowNotifications(!showNotifications)}
                title="Notifications"
              >
                🔔
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
                        <p>{currentUser?.email || supervisorData?.email || 'user@example.com'}</p>
                        <span className="profile-badge">{currentUser?.depot || supervisorData?.depot || 'Operations'}</span>
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
          {/* Mobile Duty Indicator */}
          {currentDuty && !currentDuty.viewOnly && (
            <div className="mobile-duty-indicator" onClick={onDutyClick}>
              <span className="mobile-duty-icon">
                {currentDuty.code === '100' ? '🌅' :
                 currentDuty.code === '200' ? '☀️' :
                 currentDuty.code === '400' ? '🌆' : '🌙'}
              </span>
              <span className="mobile-duty-text">
                Duty {currentDuty.code}
              </span>
              <span className="mobile-duty-time">
                {currentDuty.startTime} - {currentDuty.endTime}
              </span>
            </div>
          )}
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

        {/* Duty Status Bar - Appears below main header when duty is active */}
        {currentDuty && !currentDuty.viewOnly && (
          <div className="duty-status-bar" data-duty={currentDuty.code} onClick={onDutyClick}>
            <div className="duty-status-container">
              <div className="duty-status-left">
                <span className="duty-status-icon">
                  {currentDuty.code === '100' ? '🌅' :
                   currentDuty.code === '200' ? '☀️' :
                   currentDuty.code === '400' ? '🌆' : '🌙'}
                </span>
                <div className="duty-status-info">
                  <span className="duty-status-label">
                    Duty {currentDuty.code} - {currentDuty.name || (
                      currentDuty.code === '100' ? 'Early Shift' :
                      currentDuty.code === '200' ? 'Day Shift' :
                      currentDuty.code === '400' ? 'Late Shift' : 'Night Shift'
                    )}
                  </span>
                  <span className="duty-status-time">
                    {currentDuty.startTime} - {currentDuty.endTime}
                  </span>
                </div>
              </div>
              <div className="duty-status-center">
                <span className="duty-status-user">
                  👤 {currentUser?.name || supervisorData?.name || 'Supervisor'}
                </span>
                {(currentUser?.depot || supervisorData?.depot) && (
                  <span className="duty-status-depot">
                    📍 {currentUser?.depot || supervisorData?.depot}
                  </span>
                )}
              </div>
              <div className="duty-status-right">
                <DutyBadge currentDuty={currentDuty} onClick={onDutyClick} />
              </div>
            </div>
          </div>
        )}
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

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <div className="shortcuts-modal-overlay" onClick={() => setShowShortcuts(false)}>
          <div className="shortcuts-modal" onClick={(e) => e.stopPropagation()}>
            <div className="shortcuts-header">
              <h3>⌨️ Keyboard Shortcuts</h3>
              <button className="shortcuts-close-btn" onClick={() => setShowShortcuts(false)}>
                ESC
              </button>
            </div>
            <div className="shortcuts-list">
              {shortcuts.map((shortcut) => (
                <div key={shortcut.key} className="shortcut-item">
                  <kbd className="shortcut-key">{shortcut.key}</kbd>
                  <span className="shortcut-description">{shortcut.description}</span>
                </div>
              ))}
            </div>
            <div className="shortcuts-footer">
              <span>Press any shortcut to navigate</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ModernAppHeader;