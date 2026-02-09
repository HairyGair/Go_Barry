/**
 * Live Route Status Dashboard
 * Real-time status monitoring for all 225 bus routes
 *
 * Features:
 * - Collapsible status groups (RED/AMBER/GREEN) with GREEN hidden by default
 * - Card view and compact table view toggle
 * - Route number quick-jump index strip
 * - Sticky summary bar
 * - Working "View Breakdown Details" navigation
 *
 * Version: 4.0.0 - Ocean Teal Redesign
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import RouteStatusCard from './RouteStatusCard';
import { gtfsApiService } from '../../services/gtfsApiService';
import './LiveRouteStatusDashboard.css';

const REFRESH_INTERVAL = 10000;

const LiveRouteStatusDashboard = () => {
  const navigate = useNavigate();

  // Data state
  const [routes, setRoutes] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('status');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'
  const [showGreenRoutes, setShowGreenRoutes] = useState(false);

  // Collapsible group state
  const [groupCollapsed, setGroupCollapsed] = useState({
    RED: false,
    AMBER: false,
    GREEN: true  // Green collapsed by default
  });

  // Refs
  const refreshIntervalRef = useRef(null);
  const groupRefs = useRef({});
  const searchInputRef = useRef(null);

  // Fetch live route status
  const fetchRouteStatus = useCallback(async () => {
    try {
      const response = await gtfsApiService.getLiveRouteStatus();
      if (response.success) {
        setRoutes(response.routes || []);
        setSummary(response.summary || null);
        setLastUpdated(new Date());
        setError(null);
      } else {
        setError('Failed to fetch route status');
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching route status:', err);
      setError('Unable to connect to API');
      setLoading(false);
    }
  }, []);

  // Auto-refresh setup
  useEffect(() => {
    fetchRouteStatus();
    refreshIntervalRef.current = setInterval(fetchRouteStatus, REFRESH_INTERVAL);
    return () => {
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    };
  }, [fetchRouteStatus]);

  // Navigate to breakdown details
  const handleRouteDetails = useCallback((route) => {
    navigate('/dashboards/control-room', {
      state: { filterRoute: route.routeShortName }
    });
  }, [navigate]);

  // Manual refresh
  const handleManualRefresh = async () => {
    setLoading(true);
    await fetchRouteStatus();
  };

  // Toggle group collapse
  const toggleGroup = useCallback((status) => {
    setGroupCollapsed(prev => ({ ...prev, [status]: !prev[status] }));
  }, []);

  // Toggle green routes visibility
  const toggleGreenRoutes = useCallback(() => {
    setShowGreenRoutes(prev => {
      const next = !prev;
      if (next) {
        setGroupCollapsed(prev => ({ ...prev, GREEN: false }));
      }
      return next;
    });
  }, []);

  // Scroll to group
  const scrollToGroup = useCallback((status) => {
    if (status === 'GREEN' && !showGreenRoutes) {
      setShowGreenRoutes(true);
      setGroupCollapsed(prev => ({ ...prev, GREEN: false }));
      setTimeout(() => {
        groupRefs.current[status]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } else {
      setGroupCollapsed(prev => ({ ...prev, [status]: false }));
      setTimeout(() => {
        groupRefs.current[status]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  }, [showGreenRoutes]);

  // Filter and sort routes
  const filteredRoutes = useMemo(() => {
    let filtered = [...routes];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(route =>
        (route.routeShortName || '').toLowerCase().includes(query) ||
        (route.routeLongName || '').toLowerCase().includes(query) ||
        (route.routeId || '').toLowerCase().includes(query)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'status': {
          const order = { RED: 0, AMBER: 1, GREEN: 2 };
          return order[a.status] - order[b.status];
        }
        case 'number': {
          const numA = parseInt(a.routeShortName) || 999;
          const numB = parseInt(b.routeShortName) || 999;
          return numA - numB;
        }
        case 'name':
          return a.routeLongName.localeCompare(b.routeLongName);
        default:
          return 0;
      }
    });

    return filtered;
  }, [routes, searchQuery, sortBy]);

  // Group routes by status
  const groupedRoutes = useMemo(() => {
    const groups = { RED: [], AMBER: [], GREEN: [] };
    filteredRoutes.forEach(route => {
      if (groups[route.status]) {
        groups[route.status].push(route);
      }
    });
    return groups;
  }, [filteredRoutes]);

  // Generate route quick-jump index
  const routeIndex = useMemo(() => {
    const numbers = new Set();
    routes.forEach(route => {
      const first = route.routeShortName.charAt(0).toUpperCase();
      numbers.add(first);
    });
    return [...numbers].sort((a, b) => {
      const numA = parseInt(a);
      const numB = parseInt(b);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      if (!isNaN(numA)) return -1;
      if (!isNaN(numB)) return 1;
      return a.localeCompare(b);
    });
  }, [routes]);

  // Quick-jump to a route starting with character
  const handleQuickJump = useCallback((char) => {
    setSearchQuery(char);
    setSortBy('number');
    // Expand all groups so results are visible
    setGroupCollapsed({ RED: false, AMBER: false, GREEN: false });
    setShowGreenRoutes(true);
    searchInputRef.current?.focus();
  }, []);

  // Status group config
  const statusConfig = {
    RED: {
      label: 'Problem Routes',
      sublabel: '2+ active breakdowns',
      icon: '\u26A0',
      accentClass: 'group-red'
    },
    AMBER: {
      label: 'At-Risk Routes',
      sublabel: '1 active breakdown',
      icon: '!',
      accentClass: 'group-amber'
    },
    GREEN: {
      label: 'Operational Routes',
      sublabel: 'No active issues',
      icon: '\u2713',
      accentClass: 'group-green'
    }
  };

  // Count of visible problem routes
  const issueCount = (summary?.red_routes || 0) + (summary?.amber_routes || 0);

  return (
    <DashboardLayout>
      <div className="lrs-dashboard">

        {/* Sticky Header Bar */}
        <div className="lrs-header">
          <div className="lrs-header__left">
            <div className="lrs-header__icon-wrap">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </div>
            <div>
              <h1 className="lrs-header__title">Route Status</h1>
              <p className="lrs-header__subtitle">
                {issueCount > 0
                  ? <>{issueCount} route{issueCount !== 1 ? 's' : ''} with active issues</>
                  : <>All routes operational</>
                }
              </p>
            </div>
          </div>
          <div className="lrs-header__right">
            {lastUpdated && (
              <span className="lrs-header__timestamp">
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <button
              className="lrs-refresh-btn"
              onClick={handleManualRefresh}
              disabled={loading}
            >
              <span className={`lrs-refresh-icon ${loading ? 'spinning' : ''}`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10"/>
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                </svg>
              </span>
              {loading ? 'Refreshing' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Summary Stats Row */}
        {summary && (
          <div className="lrs-stats-row">
            <button
              className="lrs-stat-pill lrs-stat-pill--red"
              onClick={() => scrollToGroup('RED')}
              title="Jump to problem routes"
            >
              <span className="lrs-stat-pill__number">{summary.red_routes}</span>
              <span className="lrs-stat-pill__label">Problem</span>
            </button>
            <button
              className="lrs-stat-pill lrs-stat-pill--amber"
              onClick={() => scrollToGroup('AMBER')}
              title="Jump to at-risk routes"
            >
              <span className="lrs-stat-pill__number">{summary.amber_routes}</span>
              <span className="lrs-stat-pill__label">At-Risk</span>
            </button>
            <button
              className="lrs-stat-pill lrs-stat-pill--green"
              onClick={() => scrollToGroup('GREEN')}
              title="Jump to operational routes"
            >
              <span className="lrs-stat-pill__number">{summary.green_routes}</span>
              <span className="lrs-stat-pill__label">Operational</span>
            </button>

            <div className="lrs-stats-divider" />

            <div className="lrs-stat-pill lrs-stat-pill--total">
              <span className="lrs-stat-pill__number">{summary.total_active_breakdowns}</span>
              <span className="lrs-stat-pill__label">Active Breakdowns</span>
            </div>
          </div>
        )}

        {/* Controls Bar */}
        <div className="lrs-controls">
          {/* Search */}
          <div className="lrs-search-wrap">
            <svg className="lrs-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              className="lrs-search-input"
              placeholder="Search routes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="lrs-search-clear" onClick={() => setSearchQuery('')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>

          {/* Sort */}
          <select
            className="lrs-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="status">Sort: Status</option>
            <option value="number">Sort: Route Number</option>
            <option value="name">Sort: Route Name</option>
          </select>

          {/* View Toggle */}
          <div className="lrs-view-toggle">
            <button
              className={`lrs-view-btn ${viewMode === 'cards' ? 'active' : ''}`}
              onClick={() => setViewMode('cards')}
              title="Card view"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7"/>
                <rect x="14" y="3" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/>
              </svg>
            </button>
            <button
              className={`lrs-view-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Table view"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6"/>
                <line x1="8" y1="12" x2="21" y2="12"/>
                <line x1="8" y1="18" x2="21" y2="18"/>
                <line x1="3" y1="6" x2="3.01" y2="6"/>
                <line x1="3" y1="12" x2="3.01" y2="12"/>
                <line x1="3" y1="18" x2="3.01" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Green Routes Toggle */}
          <button
            className={`lrs-toggle-green ${showGreenRoutes ? 'active' : ''}`}
            onClick={toggleGreenRoutes}
          >
            <span className="lrs-toggle-green__dot" />
            {showGreenRoutes ? 'Hide' : 'Show'} Operational
          </button>
        </div>

        {/* Route Quick-Jump Index */}
        {routeIndex.length > 0 && (
          <div className="lrs-quickjump">
            <span className="lrs-quickjump__label">Jump to:</span>
            <div className="lrs-quickjump__strip">
              {routeIndex.map(char => (
                <button
                  key={char}
                  className={`lrs-quickjump__btn ${searchQuery === char ? 'active' : ''}`}
                  onClick={() => handleQuickJump(char)}
                >
                  {char}
                </button>
              ))}
              {searchQuery && (
                <button
                  className="lrs-quickjump__btn lrs-quickjump__btn--clear"
                  onClick={() => { setSearchQuery(''); setSortBy('status'); }}
                >
                  All
                </button>
              )}
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="lrs-error">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span className="lrs-error__text">{error}</span>
            <button onClick={handleManualRefresh} className="lrs-error__retry">Retry</button>
          </div>
        )}

        {/* Loading State */}
        {loading && routes.length === 0 && (
          <div className="lrs-loading">
            <div className="lrs-loading__spinner" />
            <p>Loading route status data...</p>
          </div>
        )}

        {/* Results Info */}
        {!loading && (
          <div className="lrs-results-info">
            Showing <strong>{filteredRoutes.length - (showGreenRoutes ? 0 : groupedRoutes.GREEN.length)}</strong> of <strong>{routes.length}</strong> routes
            {searchQuery && <> matching &ldquo;{searchQuery}&rdquo;</>}
            {!showGreenRoutes && groupedRoutes.GREEN.length > 0 && (
              <span className="lrs-results-info__hidden">
                ({groupedRoutes.GREEN.length} operational routes hidden)
              </span>
            )}
          </div>
        )}

        {/* Route Groups */}
        <div className="lrs-groups">
          {['RED', 'AMBER', 'GREEN'].map(status => {
            const config = statusConfig[status];
            const groupRoutes = groupedRoutes[status] || [];
            const isCollapsed = groupCollapsed[status];

            // Skip green group entirely if not shown and not searching
            if (status === 'GREEN' && !showGreenRoutes && !searchQuery) return null;
            // Skip empty groups
            if (groupRoutes.length === 0) return null;

            return (
              <div
                key={status}
                className={`lrs-group ${config.accentClass}`}
                ref={el => groupRefs.current[status] = el}
              >
                {/* Group Header */}
                <button
                  className="lrs-group__header"
                  onClick={() => toggleGroup(status)}
                >
                  <div className="lrs-group__header-left">
                    <span className={`lrs-group__indicator lrs-indicator--${status.toLowerCase()}`} />
                    <span className="lrs-group__title">{config.label}</span>
                    <span className="lrs-group__count">{groupRoutes.length}</span>
                    <span className="lrs-group__sublabel">{config.sublabel}</span>
                  </div>
                  <svg
                    className={`lrs-group__chevron ${isCollapsed ? '' : 'open'}`}
                    width="20" height="20" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>

                {/* Group Content */}
                {!isCollapsed && (
                  <div className="lrs-group__content">
                    {viewMode === 'table' ? (
                      /* Table View */
                      <div className="lrs-table-wrap">
                        <table className="lrs-table">
                          <thead>
                            <tr>
                              <th className="lrs-table__th--route">Route</th>
                              <th className="lrs-table__th--name">Name</th>
                              <th className="lrs-table__th--status">Status</th>
                              <th className="lrs-table__th--breakdowns">Breakdowns</th>
                              <th className="lrs-table__th--severity">Severity</th>
                              <th className="lrs-table__th--time">Last Incident</th>
                              <th className="lrs-table__th--action"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {groupRoutes.map(route => (
                              <tr key={route.routeId} className="lrs-table__row">
                                <td className="lrs-table__td--route">
                                  <span className="lrs-table__route-badge">{route.routeShortName}</span>
                                </td>
                                <td className="lrs-table__td--name">{route.routeLongName}</td>
                                <td className="lrs-table__td--status">
                                  <span className={`lrs-table__status lrs-table__status--${route.status.toLowerCase()}`}>
                                    {route.status}
                                  </span>
                                </td>
                                <td className="lrs-table__td--breakdowns">
                                  {route.breakdownCount > 0 ? route.breakdownCount : '\u2014'}
                                </td>
                                <td className="lrs-table__td--severity">
                                  {route.breakdownSeverities?.length > 0 ? (
                                    <div className="lrs-table__severity-badges">
                                      {route.breakdownSeverities.map((sev, idx) => (
                                        <span key={idx} className={`lrs-sev-badge lrs-sev-badge--${sev.toLowerCase()}`}>
                                          {sev}
                                        </span>
                                      ))}
                                    </div>
                                  ) : '\u2014'}
                                </td>
                                <td className="lrs-table__td--time">
                                  {route.lastBreakdownTime
                                    ? new Date(route.lastBreakdownTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                    : '\u2014'
                                  }
                                </td>
                                <td className="lrs-table__td--action">
                                  {route.breakdownCount > 0 && (
                                    <button
                                      className="lrs-table__view-btn"
                                      onClick={() => handleRouteDetails(route)}
                                    >
                                      View
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      /* Card View */
                      <div className="lrs-cards-grid">
                        {groupRoutes.map(route => (
                          <RouteStatusCard
                            key={route.routeId}
                            route={route}
                            onDetailsClick={handleRouteDetails}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* No Results */}
          {filteredRoutes.length === 0 && !loading && (
            <div className="lrs-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <p>No routes match your search</p>
              {searchQuery && (
                <button className="lrs-empty__clear" onClick={() => setSearchQuery('')}>
                  Clear search
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="lrs-footer">
          <div className="lrs-footer__defs">
            <span className="lrs-footer__def lrs-footer__def--red">RED: 2+ breakdowns</span>
            <span className="lrs-footer__def lrs-footer__def--amber">AMBER: 1 breakdown</span>
            <span className="lrs-footer__def lrs-footer__def--green">GREEN: No issues</span>
          </div>
          <span className="lrs-footer__meta">
            Auto-refreshes every 10s &middot; Last updated: {lastUpdated?.toLocaleTimeString() || 'Never'}
          </span>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default LiveRouteStatusDashboard;
