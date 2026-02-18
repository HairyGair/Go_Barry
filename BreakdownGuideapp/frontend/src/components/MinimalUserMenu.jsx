/**
 * Minimal User Menu
 * A floating dropdown in the top-right corner showing the user's name
 * GoBarry logo in the top-left corner
 * Contains all navigation and user actions
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { GoBarryBanner } from './GoBarryLogo.jsx';
import ChangePasswordModal from './ChangePasswordModal.jsx';
import './MinimalUserMenu.css';

const MinimalUserMenu = ({ currentDuty, onDutyClick }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const menuRef = useRef(null);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const isEngineeringManager = currentUser?.role === 'engineering_manager';

  // Navigation items (Breakdown Guide removed - use Report Breakdown button instead)
  const allNavigationItems = [
    {
      path: '/',
      label: 'Home',
      icon: '🏠',
      description: 'Dashboard home'
    },
    {
      path: '/dashboards/sdc',
      label: 'Operations',
      icon: '🎯',
      description: 'Operations dashboard'
    },
    {
      path: '/dashboards/control-room',
      label: 'Display',
      icon: '📺',
      description: 'Large screen display'
    },
    {
      path: '/dashboards/engineering',
      label: 'Engineering',
      icon: '🛠️',
      description: 'Engineering dispatch',
      hasSubmenu: true,
      submenu: [
        { path: '/dashboards/engineering/display', label: 'All Depots Display', icon: '🏭', external: true },
        { path: '/dashboards/engineering/manage', label: 'Manage Engineers', icon: '👷' }
      ]
    },
    {
      path: '/fleet-intelligence',
      label: 'Fleet Intelligence',
      icon: '📊',
      description: 'Fleet analytics'
    },
    {
      path: '/dashboards/gtfs/routes',
      label: 'Route Status',
      icon: '🚌',
      description: 'Live route status'
    },
    {
      path: '/dashboards/gtfs/timetable',
      label: 'Timetable',
      icon: '🕐',
      description: 'Route timetable viewer'
    },
    {
      path: '/dashboards/gtfs/stops',
      label: 'Stop Finder',
      icon: '🔍',
      description: 'Search stops & departures'
    }
  ];

  // Engineering managers only see engineering-related navigation
  const navigationItems = isEngineeringManager
    ? allNavigationItems.filter(item => item.path.startsWith('/dashboards/engineering'))
    : allNavigationItems;

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeydown = (e) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
      }

      // Quick navigation with Alt key
      if (e.altKey && !e.ctrlKey && !e.shiftKey) {
        switch(e.key) {
          case '1': e.preventDefault(); navigate('/breakdown-guide'); break;
          case '2': e.preventDefault(); navigate('/dashboards/sdc'); break;
          case '3': e.preventDefault(); navigate('/dashboards/control-room'); break;
          case '4': e.preventDefault(); navigate('/dashboards/engineering'); break;
          case '5': e.preventDefault(); navigate('/fleet-intelligence'); break;
          case 'h':
          case 'H': e.preventDefault(); navigate('/'); break;
        }
      }
    };

    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, [navigate]);

  // Logout handler
  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    setIsMenuOpen(false);

    try {
      await logout();
      localStorage.clear();
      sessionStorage.clear();

      // Clear cookies
      document.cookie.split(";").forEach(function(c) {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/;domain=.gobarry.co.uk");
      });

      setTimeout(() => {
        window.location.replace('/?logout=' + Date.now());
      }, 200);
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.clear();
      sessionStorage.clear();
      setTimeout(() => {
        window.location.replace('/?logout=' + Date.now());
      }, 200);
    }
  }, [logout, isLoggingOut]);

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  const getDutyIcon = (code) => {
    switch(code) {
      case '100': return '🌅';
      case '200': return '☀️';
      case '400': return '🌆';
      case '500': return '🌙';
      default: return '📋';
    }
  };

  return (
    <>
      {/* GoBarry Logo - Top Left */}
      <Link to="/" className="minimal-header-logo">
        <GoBarryBanner height={38} theme="dark" showTagline={false} />
      </Link>

      <div className="minimal-user-menu" ref={menuRef}>
        {/* Main Menu Button - Shows User's Full Name */}
        <button
          className={`user-menu-trigger ${isMenuOpen ? 'active' : ''}`}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <div className="user-avatar">
            {currentUser?.name?.charAt(0) || 'U'}
          </div>
          <span className="user-name">{currentUser?.name || 'User'}</span>
          <span className="menu-arrow">{isMenuOpen ? '▲' : '▼'}</span>
        </button>

        {/* Dropdown Menu */}
        {isMenuOpen && (
          <div className="user-menu-dropdown">
            {/* User Info Header */}
            <div className="menu-header">
              <div className="user-info-large">
                <div className="user-avatar-large">
                  {currentUser?.name?.charAt(0) || 'U'}
                </div>
                <div className="user-details">
                  <h3>{currentUser?.name || 'User'}</h3>
                  <p>{currentUser?.email || ''}</p>
                  {currentUser?.depot && (
                    <span className="user-depot">📍 {currentUser.depot}</span>
                  )}
                </div>
              </div>
              <div className="menu-time">
                {formatTime(currentTime)}
              </div>
            </div>

            {/* Current Duty (if active) */}
            {currentDuty && !currentDuty.viewOnly && (
              <button className="duty-indicator" onClick={onDutyClick}>
                <span className="duty-icon">{getDutyIcon(currentDuty.code)}</span>
                <div className="duty-info">
                  <span className="duty-label">Duty {currentDuty.code}</span>
                  <span className="duty-time">{currentDuty.startTime} - {currentDuty.endTime}</span>
                </div>
              </button>
            )}

            {/* Quick Action - hidden for engineering managers */}
            {!isEngineeringManager && (
              <button
                className="quick-action-btn"
                onClick={() => {
                  navigate('/breakdown-guide');
                  setIsMenuOpen(false);
                }}
              >
                <span>🚨</span>
                <span>Report Breakdown</span>
              </button>
            )}

            {/* Navigation Section */}
            <div className="menu-section">
              <h4>Navigation</h4>
              <nav className="menu-nav">
                {navigationItems.map(item => (
                  item.hasSubmenu ? (
                    <div key={item.path} className="nav-item-with-submenu">
                      <div className={`menu-nav-item has-submenu ${isActive(item.path) ? 'active' : ''}`}>
                        <span className="nav-icon">{item.icon}</span>
                        <div className="nav-text">
                          <span className="nav-label">{item.label}</span>
                          <span className="nav-desc">{item.description}</span>
                        </div>
                        <span className="submenu-arrow">‹</span>
                      </div>
                      <div className="nav-submenu">
                        {item.submenu.map(subItem => (
                          subItem.external ? (
                            <a
                              key={subItem.path}
                              href={subItem.path}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="submenu-item"
                              onClick={() => setIsMenuOpen(false)}
                            >
                              <span className="submenu-icon">{subItem.icon}</span>
                              <span className="submenu-label">{subItem.label}</span>
                              <span className="external-icon">↗</span>
                            </a>
                          ) : (
                            <Link
                              key={subItem.path}
                              to={subItem.path}
                              className="submenu-item"
                              onClick={() => setIsMenuOpen(false)}
                            >
                              <span className="submenu-icon">{subItem.icon}</span>
                              <span className="submenu-label">{subItem.label}</span>
                            </Link>
                          )
                        ))}
                      </div>
                    </div>
                  ) : (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`menu-nav-item ${isActive(item.path) ? 'active' : ''}`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span className="nav-icon">{item.icon}</span>
                      <div className="nav-text">
                        <span className="nav-label">{item.label}</span>
                        <span className="nav-desc">{item.description}</span>
                      </div>
                    </Link>
                  )
                ))}
              </nav>
            </div>

            {/* Settings Section */}
            <div className="menu-section">
              <h4>Settings</h4>
              <div className="menu-actions">
                <button onClick={() => {
                  setShowChangePassword(true);
                  setIsMenuOpen(false);
                }}>
                  <span>🔐</span>
                  <span>Change Password</span>
                </button>
                <button onClick={() => {
                  navigate('/settings');
                  setIsMenuOpen(false);
                }}>
                  <span>⚙️</span>
                  <span>Settings</span>
                </button>
              </div>
            </div>

            {/* Logout */}
            <div className="menu-footer">
              <button
                className="logout-btn"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? '⏳ Signing Out...' : '🚪 Sign Out'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
        userEmail={currentUser?.email}
      />
    </>
  );
};

export default MinimalUserMenu;
