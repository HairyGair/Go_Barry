import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { apiConfig } from '../../breakdown-guide/components/common/constants';
import { useConnectionManager } from '../../hooks/useConnectionManager';

/**
 * TrendsDefectsPanel - SDC Operations Dashboard Component
 *
 * Fleet intelligence dashboard displaying:
 * - Repeat vehicle defects with automatic escalation
 * - Trending defect patterns across the fleet
 * - Depot-specific issue hotspots
 * - Predictive maintenance alerts
 *
 * Features:
 * - Real-time defect tracking and analysis via WebSocket
 * - Automatic escalation workflow for repeat offenders
 * - Pattern detection for common issues
 * - Depot performance comparison
 * - Predictive maintenance scoring
 * - Report generation and notifications
 * - Hybrid WebSocket + polling fallback
 */
const TrendsDefectsPanel = () => {
  // State Management
  const [timeframe, setTimeframe] = useState('7d'); // 24h, 7d, 30d
  const [defectData, setDefectData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [escalationModal, setEscalationModal] = useState({ isOpen: false, vehicle: null });
  const [refreshing, setRefreshing] = useState(false);
  const [realtimeItems, setRealtimeItems] = useState(new Set()); // Track items that came via WebSocket
  const [criticalAlert, setCriticalAlert] = useState(null); // Critical pattern notification
  const [showNotification, setShowNotification] = useState(false);

  // WebSocket Connection Manager
  const connectionManager = useConnectionManager({
    endpoint: '/ws?channel=defect-intelligence',
    autoConnect: true,
    primary: 'websocket',
    fallback: 'polling',
    autoFailover: true,
    destroyOnUnmount: true
  });

  // Fetch defect data from API (calls multiple endpoints and combines)
  const fetchDefectData = useCallback(async () => {
    try {
      setRefreshing(true);
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Fetch from all defect intelligence endpoints in parallel
      const [repeatRes, trendsRes, depotRes, predictiveRes] = await Promise.all([
        fetch(`${apiConfig.baseUrl}/api/defects/repeat`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ timeframe })
        }),
        fetch(`${apiConfig.baseUrl}/api/defects/trends`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ timeframe, groupByType: true })
        }),
        fetch(`${apiConfig.baseUrl}/api/defects/depot-stats?timeframe=${timeframe}`, {
          headers
        }),
        fetch(`${apiConfig.baseUrl}/api/defects/predictive`, {
          headers
        })
      ]);

      // Parse all responses
      const repeatData = await repeatRes.json();
      const trendsData = await trendsRes.json();
      const depotData = await depotRes.json();
      const predictiveData = await predictiveRes.json();

      // Transform data to match component's expected format
      setDefectData({
        criticalVehicles: (repeatData.vehicles || []).map(v => ({
          fleet_number: v.fleetNumber,
          depot: v.depot || 'Unknown',
          defect_count: v.defectCount || 0,
          top_issue: v.defects && v.defects.length > 0 ? v.defects[0].type : 'Unknown',
          last_defect: v.defects && v.defects.length > 0 ? new Date(v.defects[v.defects.length - 1].date).toLocaleString() : 'Unknown',
          pattern_score: Math.round((v.averageSeverityScore || 0) * 30),
          defects: v.defects || []
        })),
        trendingIssues: (trendsData.trends || []).map(t => ({
          issue_type: t.defectType,
          occurrences: t.currentCount,
          vehicles_affected: t.affectedModels ? t.affectedModels.length : 0,
          trend: t.trend === 'rising' ? 'up' : t.trend === 'falling' ? 'down' : 'stable',
          change_percentage: Math.abs(t.changePercent || 0),
          top_depots: t.affectedModels || []
        })),
        depotHotspots: (depotData.depots || []).map(d => ({
          depot_id: d.name?.substring(0, 2).toUpperCase() || 'UK',
          depot_name: d.name,
          defect_rate: d.defectRate || 0,
          total_defects: d.defectCount || 0,
          fleet_size: d.vehicleCount || 0,
          repeat_vehicles: 0, // Not provided by backend
          top_issue: d.topIssue || 'None'
        })),
        predictiveAlerts: (predictiveData.alerts || []).map(a => ({
          priority: a.priority,
          prediction_type: a.type || a.message?.substring(0, 50),
          vehicles_affected: a.vehicles ? a.vehicles.length : a.affectedCount || 0,
          confidence_score: 75, // Default confidence
          description: a.message || a.recommendation,
          vehicle_list: a.vehicles || [],
          recommendation: a.recommendation || 'Review affected vehicles',
          predicted_timeframe: '7-14 days'
        }))
      });
    } catch (error) {
      console.error('Error fetching defect data:', error);
      // Set empty data structure on error
      setDefectData({
        criticalVehicles: [],
        trendingIssues: [],
        depotHotspots: [],
        predictiveAlerts: []
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [timeframe]);

  // Auto-refresh every 30 seconds (kept alongside WebSocket for redundancy)
  useEffect(() => {
    fetchDefectData();
    const interval = setInterval(fetchDefectData, 30000);
    return () => clearInterval(interval);
  }, [fetchDefectData]);

  // WebSocket message handler for real-time updates
  useEffect(() => {
    if (!connectionManager) return;

    const unsubscribe = connectionManager.onMessage((message) => {
      // Log message in development mode
      if (process.env.NODE_ENV === 'development') {
        console.log('[Defect Intelligence] WebSocket message received:', message);
      }

      const { type, data, timestamp } = message;

      switch (type) {
        case 'NEW_REPEAT_DEFECT':
          handleNewRepeatDefect(data);
          break;

        case 'TREND_UPDATE':
          handleTrendUpdate(data);
          break;

        case 'CRITICAL_PATTERN':
          handleCriticalPattern(data);
          break;

        case 'DEPOT_STATS_UPDATE':
          handleDepotStatsUpdate(data);
          break;

        case 'PREDICTIVE_ALERT':
          handlePredictiveAlert(data);
          break;

        default:
          console.warn('[Defect Intelligence] Unknown message type:', type);
      }
    });

    return () => unsubscribe();
  }, [connectionManager]);

  // Handler: New repeat defect detected
  const handleNewRepeatDefect = useCallback((data) => {
    setDefectData(prevData => {
      if (!prevData) return prevData;

      const newVehicle = {
        ...data,
        isRealtime: true,
        realtimeTimestamp: new Date().toISOString()
      };

      // Check if vehicle already exists
      const existingIndex = prevData.criticalVehicles.findIndex(
        v => v.fleet_number === data.fleet_number
      );

      let updatedVehicles;
      if (existingIndex >= 0) {
        // Update existing vehicle
        updatedVehicles = [...prevData.criticalVehicles];
        updatedVehicles[existingIndex] = newVehicle;
      } else {
        // Add new vehicle at the beginning
        updatedVehicles = [newVehicle, ...prevData.criticalVehicles];
      }

      // Mark as realtime item
      setRealtimeItems(prev => new Set([...prev, `vehicle-${data.fleet_number}`]));

      // Remove realtime badge after 10 seconds
      setTimeout(() => {
        setRealtimeItems(prev => {
          const updated = new Set(prev);
          updated.delete(`vehicle-${data.fleet_number}`);
          return updated;
        });
      }, 10000);

      return {
        ...prevData,
        criticalVehicles: updatedVehicles
      };
    });
  }, []);

  // Handler: Trend update
  const handleTrendUpdate = useCallback((data) => {
    setDefectData(prevData => {
      if (!prevData) return prevData;

      const updatedIssue = {
        ...data,
        isRealtime: true,
        realtimeTimestamp: new Date().toISOString()
      };

      // Find and update existing trend or add new one
      const existingIndex = prevData.trendingIssues.findIndex(
        issue => issue.issue_type === data.issue_type
      );

      let updatedIssues;
      if (existingIndex >= 0) {
        updatedIssues = [...prevData.trendingIssues];
        updatedIssues[existingIndex] = updatedIssue;
      } else {
        updatedIssues = [updatedIssue, ...prevData.trendingIssues];
      }

      // Sort by occurrences
      updatedIssues.sort((a, b) => b.occurrences - a.occurrences);

      // Mark as realtime item
      setRealtimeItems(prev => new Set([...prev, `trend-${data.issue_type}`]));

      setTimeout(() => {
        setRealtimeItems(prev => {
          const updated = new Set(prev);
          updated.delete(`trend-${data.issue_type}`);
          return updated;
        });
      }, 10000);

      return {
        ...prevData,
        trendingIssues: updatedIssues
      };
    });
  }, []);

  // Handler: Critical pattern detected
  const handleCriticalPattern = useCallback((data) => {
    setCriticalAlert(data);
    setShowNotification(true);

    // Auto-hide notification after 10 seconds
    setTimeout(() => {
      setShowNotification(false);
    }, 10000);

    // Refresh data to show the critical pattern
    fetchDefectData();
  }, [fetchDefectData]);

  // Handler: Depot statistics update
  const handleDepotStatsUpdate = useCallback((data) => {
    setDefectData(prevData => {
      if (!prevData) return prevData;

      const updatedDepot = {
        ...data,
        isRealtime: true,
        realtimeTimestamp: new Date().toISOString()
      };

      const existingIndex = prevData.depotHotspots.findIndex(
        depot => depot.depot_id === data.depot_id
      );

      let updatedDepots;
      if (existingIndex >= 0) {
        updatedDepots = [...prevData.depotHotspots];
        updatedDepots[existingIndex] = updatedDepot;
      } else {
        updatedDepots = [...prevData.depotHotspots, updatedDepot];
      }

      // Mark as realtime item
      setRealtimeItems(prev => new Set([...prev, `depot-${data.depot_id}`]));

      setTimeout(() => {
        setRealtimeItems(prev => {
          const updated = new Set(prev);
          updated.delete(`depot-${data.depot_id}`);
          return updated;
        });
      }, 10000);

      return {
        ...prevData,
        depotHotspots: updatedDepots
      };
    });
  }, []);

  // Handler: Predictive maintenance alert
  const handlePredictiveAlert = useCallback((data) => {
    setDefectData(prevData => {
      if (!prevData) return prevData;

      const newAlert = {
        ...data,
        isRealtime: true,
        realtimeTimestamp: new Date().toISOString()
      };

      // Check for duplicate alerts
      const isDuplicate = prevData.predictiveAlerts.some(
        alert => alert.prediction_type === data.prediction_type &&
                 JSON.stringify(alert.vehicle_list) === JSON.stringify(data.vehicle_list)
      );

      if (isDuplicate) {
        return prevData;
      }

      // Add new alert at the beginning
      const updatedAlerts = [newAlert, ...prevData.predictiveAlerts];

      // Mark as realtime item
      setRealtimeItems(prev => new Set([...prev, `alert-${data.prediction_type}`]));

      setTimeout(() => {
        setRealtimeItems(prev => {
          const updated = new Set(prev);
          updated.delete(`alert-${data.prediction_type}`);
          return updated;
        });
      }, 10000);

      // Show toast notification for predictive alerts
      if (data.priority === 'high') {
        setCriticalAlert({
          title: 'New Predictive Alert',
          message: data.prediction_type,
          priority: data.priority
        });
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 8000);
      }

      return {
        ...prevData,
        predictiveAlerts: updatedAlerts
      };
    });
  }, []);

  // Handle escalation action
  const handleEscalate = useCallback(async (vehicle) => {
    setEscalationModal({ isOpen: true, vehicle });
  }, []);

  const confirmEscalation = useCallback(async () => {
    const { vehicle } = escalationModal;

    try {
      await fetch(`${apiConfig.baseUrl}/api/defects/escalate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken') || sessionStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          vehicleId: vehicle.fleetNumber,
          fleetNumber: vehicle.fleetNumber,
          defects: vehicle.defects || [],
          escalationType: 'repeat_defects',
          recipient: 'engineering_director',
          cc: ['general_manager', 'engineering_manager'],
          message: `Vehicle ${vehicle.fleetNumber} has ${vehicle.defectCount} defects in ${timeframe}. Immediate attention required.`,
          priority: 'high'
        })
      });

      // Refresh data after escalation
      await fetchDefectData();
      setEscalationModal({ isOpen: false, vehicle: null });
      alert(`Escalation sent for vehicle ${vehicle.fleetNumber}`);
    } catch (error) {
      console.error('Error escalating vehicle:', error);
      alert('Failed to escalate. Please try again.');
    }
  }, [escalationModal, timeframe, fetchDefectData]);

  // Generate report
  const handleGenerateReport = useCallback(async () => {
    try {
      const response = await fetch(`${apiConfig.baseUrl}/api/defects/report`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken') || sessionStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          timeframe,
          includeRepeatDefects: true,
          includeTrends: true,
          includeDepotStats: true,
          includePredictive: true,
          format: 'json'
        })
      });

      const data = await response.json();

      // For now, download as JSON (PDF generation can be added later)
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fleet-defects-${timeframe}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      alert('Report downloaded successfully');
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report. Please try again.');
    }
  }, [timeframe]);

  // Send notification to engineering
  const handleNotifyEngineering = useCallback(async (vehicles) => {
    try {
      await fetch(`${apiConfig.baseUrl}/api/defects/notifications/maintenance`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken') || sessionStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'critical_repeat_defects',
          priority: 'high',
          vehicles: vehicles.map(v => v.fleetNumber || v.fleet_number),
          message: `${vehicles.length} vehicle(s) with critical repeat defects require immediate attention in ${timeframe} timeframe`,
          notifyEngineering: true,
          notifyManagement: true
        })
      });

      alert(`Engineering team notified about ${vehicles.length} vehicle(s)`);
    } catch (error) {
      console.error('Error sending notification:', error);
      alert('Failed to send notification. Please try again.');
    }
  }, [timeframe]);

  if (loading && !defectData) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Analyzing fleet defects...</p>
      </div>
    );
  }

  const {
    criticalVehicles = [],
    trendingIssues = [],
    depotHotspots = [],
    predictiveAlerts = []
  } = defectData || {};

  return (
    <div style={styles.container}>
      {/* Critical Pattern Notification */}
      {showNotification && criticalAlert && (
        <div style={styles.criticalNotification}>
          <div style={styles.notificationContent}>
            <span style={styles.notificationIcon}>
              {criticalAlert.priority === 'high' ? '🚨' : '⚠️'}
            </span>
            <div style={styles.notificationText}>
              <strong>{criticalAlert.title || 'Critical Pattern Detected'}</strong>
              <p>{criticalAlert.message}</p>
            </div>
            <button
              style={styles.notificationClose}
              onClick={() => setShowNotification(false)}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <h2 style={styles.title}>Fleet Defect Intelligence</h2>
          <p style={styles.subtitle}>Pattern detection and predictive maintenance</p>
        </div>
        <div style={styles.headerRight}>
          {/* Connection Status Indicator */}
          <div style={styles.connectionStatus}>
              {connectionManager.isConnected ? (
                <div style={styles.connectedStatus}>
                  <span style={styles.liveIndicator}></span>
                  <span style={styles.statusText}>LIVE</span>
                </div>
              ) : (
                <div style={styles.disconnectedStatus}>
                  <span style={styles.reconnectingIndicator}></span>
                  <span style={styles.statusText}>Reconnecting...</span>
                </div>
              )}
          </div>

          {/* Timeframe Selector */}
          <div style={styles.timeframeSelector}>
            {['24h', '7d', '30d'].map(tf => (
              <button
                key={tf}
                style={{
                  ...styles.timeframeButton,
                  ...(timeframe === tf ? styles.timeframeButtonActive : {})
                }}
                onClick={() => setTimeframe(tf)}
              >
                {tf === '24h' ? '24 Hours' : tf === '7d' ? '7 Days' : '30 Days'}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <button
            style={styles.actionButton}
            onClick={() => fetchDefectData()}
            disabled={refreshing}
          >
            {refreshing ? '⟳' : '🔄'} Refresh
          </button>
          <button
            style={styles.actionButton}
            onClick={handleGenerateReport}
          >
            📊 Report
          </button>
        </div>
      </div>

      {/* Critical Vehicles - Repeat Defects */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>
            🚨 Critical Vehicles - Repeat Defects
          </h3>
          <span style={styles.badge}>{criticalVehicles.length}</span>
        </div>

        {criticalVehicles.length === 0 ? (
          <div style={styles.emptyState}>
            <p>✅ No repeat defect patterns detected</p>
          </div>
        ) : (
          <div style={styles.vehicleGrid}>
            {criticalVehicles.map(vehicle => {
              const isRealtime = realtimeItems.has(`vehicle-${vehicle.fleet_number}`);

              return (
                <div
                  key={vehicle.fleet_number}
                  style={{
                    ...styles.vehicleCard,
                    ...(isRealtime ? styles.vehicleCardRealtime : {})
                  }}
                >
                  <div style={styles.vehicleCardHeader}>
                    <div style={styles.vehicleNumber}>
                      {vehicle.fleet_number}
                      {isRealtime && (
                        <span style={styles.realtimeBadge}>LIVE</span>
                      )}
                    </div>
                    <div style={{
                      ...styles.severityBadge,
                      backgroundColor: vehicle.defect_count >= 5 ? '#dc2626' : '#f59e0b'
                    }}>
                      {vehicle.defect_count} defects
                    </div>
                  </div>

                <div style={styles.vehicleDetails}>
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Depot:</span>
                    <span style={styles.detailValue}>{vehicle.depot}</span>
                  </div>
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Most Common:</span>
                    <span style={styles.detailValue}>{vehicle.top_issue}</span>
                  </div>
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Last Seen:</span>
                    <span style={styles.detailValue}>{vehicle.last_defect}</span>
                  </div>
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Pattern Score:</span>
                    <span style={styles.detailValue}>
                      {vehicle.pattern_score}%
                    </span>
                  </div>
                </div>

                <div style={styles.vehicleActions}>
                  {vehicle.defect_count >= 3 && (
                    <button
                      style={styles.escalateButton}
                      onClick={() => handleEscalate(vehicle)}
                    >
                      ⚠️ Escalate to Engineering
                    </button>
                  )}
                  <button style={styles.secondaryButton}>
                    📋 View History
                  </button>
                </div>
              </div>
              );
            })}
          </div>
        )}

        {criticalVehicles.length > 0 && (
          <div style={styles.sectionFooter}>
            <button
              style={styles.bulkActionButton}
              onClick={() => handleNotifyEngineering(criticalVehicles)}
            >
              📧 Notify Engineering Team ({criticalVehicles.length} vehicles)
            </button>
          </div>
        )}
      </div>

      {/* Trending Issues */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>
            📈 Trending Issues Across Fleet
          </h3>
          <span style={styles.badge}>{trendingIssues.length}</span>
        </div>

        <div style={styles.trendingGrid}>
          {trendingIssues.map((issue, index) => {
            const isRealtime = realtimeItems.has(`trend-${issue.issue_type}`);

            return (
              <div
                key={index}
                style={{
                  ...styles.trendingCard,
                  ...(isRealtime ? styles.trendingCardRealtime : {})
                }}
              >
                <div style={styles.trendingHeader}>
                  <span style={styles.trendingRank}>#{index + 1}</span>
                  <h4 style={styles.trendingTitle}>
                    {issue.issue_type}
                    {isRealtime && (
                      <span style={styles.realtimeBadgeSmall}>LIVE</span>
                    )}
                  </h4>
                </div>

              <div style={styles.trendingStats}>
                <div style={styles.statBox}>
                  <div style={styles.statValue}>{issue.occurrences}</div>
                  <div style={styles.statLabel}>Occurrences</div>
                </div>
                <div style={styles.statBox}>
                  <div style={styles.statValue}>{issue.vehicles_affected}</div>
                  <div style={styles.statLabel}>Vehicles</div>
                </div>
                <div style={styles.statBox}>
                  <div style={{
                    ...styles.statValue,
                    color: issue.trend === 'up' ? '#dc2626' : '#10b981'
                  }}>
                    {issue.trend === 'up' ? '↑' : '↓'} {issue.change_percentage}%
                  </div>
                  <div style={styles.statLabel}>Trend</div>
                </div>
              </div>

              <div style={styles.trendingDepots}>
                <span style={styles.trendingDepotsLabel}>Top Depots:</span>
                <div style={styles.depotTags}>
                  {issue.top_depots.map(depot => (
                    <span key={depot} style={styles.depotTag}>{depot}</span>
                  ))}
                </div>
              </div>

              <div style={styles.trendingBar}>
                <div
                  style={{
                    ...styles.trendingBarFill,
                    width: `${(issue.occurrences / trendingIssues[0].occurrences) * 100}%`,
                    backgroundColor: issue.trend === 'up' ? '#f59e0b' : '#3b82f6'
                  }}
                />
              </div>
            </div>
            );
          })}
        </div>
      </div>

      {/* Depot Hotspots */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>
            🏭 Depot Defect Hotspots
          </h3>
        </div>

        <div style={styles.depotGrid}>
          {depotHotspots.map(depot => {
            const severity = depot.defect_rate > 15 ? 'critical' : depot.defect_rate > 10 ? 'warning' : 'normal';
            const isRealtime = realtimeItems.has(`depot-${depot.depot_id}`);

            return (
              <div
                key={depot.depot_id}
                style={{
                  ...styles.depotCard,
                  ...(isRealtime ? styles.depotCardRealtime : {}),
                  borderLeft: `4px solid ${
                    severity === 'critical' ? '#dc2626' :
                    severity === 'warning' ? '#f59e0b' : '#10b981'
                  }`
                }}
              >
                <div style={styles.depotCardHeader}>
                  <h4 style={styles.depotName}>
                    {depot.depot_name}
                    {isRealtime && (
                      <span style={styles.realtimeBadgeSmall}>LIVE</span>
                    )}
                  </h4>
                  <span style={{
                    ...styles.depotRate,
                    color: severity === 'critical' ? '#dc2626' :
                           severity === 'warning' ? '#f59e0b' : '#10b981'
                  }}>
                    {depot.defect_rate}%
                  </span>
                </div>

                <div style={styles.depotStats}>
                  <div style={styles.depotStatRow}>
                    <span>Total Defects:</span>
                    <strong>{depot.total_defects}</strong>
                  </div>
                  <div style={styles.depotStatRow}>
                    <span>Fleet Size:</span>
                    <strong>{depot.fleet_size} vehicles</strong>
                  </div>
                  <div style={styles.depotStatRow}>
                    <span>Repeat Offenders:</span>
                    <strong>{depot.repeat_vehicles}</strong>
                  </div>
                  <div style={styles.depotStatRow}>
                    <span>Top Issue:</span>
                    <strong>{depot.top_issue}</strong>
                  </div>
                </div>

                <div style={styles.depotBar}>
                  <div
                    style={{
                      ...styles.depotBarFill,
                      width: `${depot.defect_rate}%`,
                      backgroundColor: severity === 'critical' ? '#dc2626' :
                                     severity === 'warning' ? '#f59e0b' : '#10b981'
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Predictive Maintenance Alerts */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>
            🔮 Predictive Maintenance Alerts
          </h3>
          <span style={styles.badge}>{predictiveAlerts.length}</span>
        </div>

        {predictiveAlerts.length === 0 ? (
          <div style={styles.emptyState}>
            <p>✅ No predictive maintenance alerts</p>
          </div>
        ) : (
          <div style={styles.alertsList}>
            {predictiveAlerts.map((alert, index) => {
              const isRealtime = realtimeItems.has(`alert-${alert.prediction_type}`);

              return (
                <div
                  key={index}
                  style={{
                    ...styles.alertCard,
                    ...(isRealtime ? styles.alertCardRealtime : {}),
                    borderLeft: `4px solid ${
                      alert.priority === 'high' ? '#dc2626' :
                      alert.priority === 'medium' ? '#f59e0b' : '#3b82f6'
                    }`
                  }}
                >
                  <div style={styles.alertHeader}>
                    <div style={styles.alertLeft}>
                      <span style={styles.alertIcon}>
                        {alert.priority === 'high' ? '🔴' :
                         alert.priority === 'medium' ? '🟡' : '🔵'}
                      </span>
                      <div>
                        <h4 style={styles.alertTitle}>
                          {alert.prediction_type}
                          {isRealtime && (
                            <span style={styles.realtimeBadgeSmall}>LIVE</span>
                          )}
                        </h4>
                        <p style={styles.alertSubtitle}>
                          {alert.vehicles_affected} vehicles affected
                        </p>
                      </div>
                    </div>
                    <div style={styles.alertRight}>
                      <div style={styles.confidenceScore}>
                        {alert.confidence_score}% confidence
                      </div>
                    </div>
                  </div>

                <div style={styles.alertBody}>
                  <p style={styles.alertDescription}>{alert.description}</p>

                  <div style={styles.alertVehicles}>
                    <span style={styles.alertVehiclesLabel}>Affected Vehicles:</span>
                    <div style={styles.vehicleTags}>
                      {alert.vehicle_list.slice(0, 5).map(vehicle => (
                        <span key={vehicle} style={styles.vehicleTag}>
                          {vehicle}
                        </span>
                      ))}
                      {alert.vehicle_list.length > 5 && (
                        <span style={styles.vehicleTag}>
                          +{alert.vehicle_list.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={styles.alertRecommendation}>
                    <strong>Recommendation:</strong> {alert.recommendation}
                  </div>
                </div>

                <div style={styles.alertFooter}>
                  <span style={styles.alertTimestamp}>
                    Predicted: {alert.predicted_timeframe}
                  </span>
                  <button style={styles.alertActionButton}>
                    Schedule Maintenance
                  </button>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Escalation Modal */}
      {escalationModal.isOpen && (
        <div style={styles.modalOverlay} onClick={() => setEscalationModal({ isOpen: false, vehicle: null })}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>⚠️ Escalate to Engineering</h3>
              <button
                style={styles.modalClose}
                onClick={() => setEscalationModal({ isOpen: false, vehicle: null })}
              >
                ×
              </button>
            </div>

            <div style={styles.modalBody}>
              <p style={styles.modalText}>
                You are about to escalate vehicle <strong>{escalationModal.vehicle?.fleet_number}</strong> to the engineering team.
              </p>

              <div style={styles.modalDetails}>
                <div style={styles.modalDetailRow}>
                  <span>Defect Count:</span>
                  <strong>{escalationModal.vehicle?.defect_count}</strong>
                </div>
                <div style={styles.modalDetailRow}>
                  <span>Pattern Score:</span>
                  <strong>{escalationModal.vehicle?.pattern_score}%</strong>
                </div>
                <div style={styles.modalDetailRow}>
                  <span>Top Issue:</span>
                  <strong>{escalationModal.vehicle?.top_issue}</strong>
                </div>
                <div style={styles.modalDetailRow}>
                  <span>Depot:</span>
                  <strong>{escalationModal.vehicle?.depot}</strong>
                </div>
              </div>

              <p style={styles.modalWarning}>
                This will notify the engineering supervisor and flag this vehicle for immediate review.
              </p>
            </div>

            <div style={styles.modalFooter}>
              <button
                style={styles.modalCancelButton}
                onClick={() => setEscalationModal({ isOpen: false, vehicle: null })}
              >
                Cancel
              </button>
              <button
                style={styles.modalConfirmButton}
                onClick={confirmEscalation}
              >
                Confirm Escalation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Styles
const styles = {
  container: {
    padding: '20px',
    backgroundColor: '#f8fafc',
    minHeight: '100vh',
    position: 'relative'
  },
  // Critical notification banner
  criticalNotification: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    zIndex: 2000,
    maxWidth: '400px',
    animation: 'slideInRight 0.3s ease-out'
  },
  notificationContent: {
    backgroundColor: '#fef2f2',
    border: '2px solid #dc2626',
    borderRadius: '8px',
    padding: '16px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    boxShadow: '0 10px 40px rgba(220, 38, 38, 0.3)',
    animation: 'pulse 2s ease-in-out infinite'
  },
  notificationIcon: {
    fontSize: '24px',
    flexShrink: 0
  },
  notificationText: {
    flex: 1
  },
  notificationClose: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    color: '#dc2626',
    cursor: 'pointer',
    padding: '0',
    width: '24px',
    height: '24px',
    lineHeight: '24px',
    flexShrink: 0
  },
  // Connection status
  connectionStatus: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: '8px 14px',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    border: '1px solid #e2e8f0'
  },
  connectedStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  disconnectedStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  liveIndicator: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#10b981',
    animation: 'pulse 2s ease-in-out infinite'
  },
  reconnectingIndicator: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#f59e0b',
    animation: 'pulse 1s ease-in-out infinite'
  },
  statusText: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  // Realtime badges
  realtimeBadge: {
    display: 'inline-block',
    marginLeft: '8px',
    backgroundColor: '#10b981',
    color: 'white',
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: '700',
    letterSpacing: '0.5px',
    animation: 'pulse 2s ease-in-out infinite'
  },
  realtimeBadgeSmall: {
    display: 'inline-block',
    marginLeft: '8px',
    backgroundColor: '#10b981',
    color: 'white',
    padding: '2px 6px',
    borderRadius: '3px',
    fontSize: '9px',
    fontWeight: '700',
    letterSpacing: '0.5px',
    animation: 'pulse 2s ease-in-out infinite'
  },
  // Realtime card animations
  vehicleCardRealtime: {
    animation: 'pulseCard 2s ease-in-out 3',
    boxShadow: '0 0 0 2px #10b981',
    backgroundColor: '#f0fdf4'
  },
  trendingCardRealtime: {
    animation: 'pulseCard 2s ease-in-out 3',
    boxShadow: '0 0 0 2px #10b981',
    backgroundColor: '#f0fdf4'
  },
  depotCardRealtime: {
    animation: 'pulseCard 2s ease-in-out 3',
    boxShadow: '0 0 0 2px #10b981',
    backgroundColor: '#f0fdf4'
  },
  alertCardRealtime: {
    animation: 'pulseCard 2s ease-in-out 3',
    boxShadow: '0 0 0 2px #10b981',
    backgroundColor: '#f0fdf4'
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px'
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #e2e8f0',
    borderTop: '4px solid #3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  loadingText: {
    marginTop: '16px',
    color: '#64748b',
    fontSize: '14px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '16px'
  },
  headerLeft: {
    flex: 1
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1e293b',
    margin: 0,
    marginBottom: '4px'
  },
  subtitle: {
    fontSize: '14px',
    color: '#64748b',
    margin: 0
  },
  headerRight: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  timeframeSelector: {
    display: 'flex',
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '4px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  timeframeButton: {
    padding: '8px 16px',
    border: 'none',
    background: 'transparent',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    color: '#64748b',
    transition: 'all 0.2s'
  },
  timeframeButtonActive: {
    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    color: 'white',
    boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)'
  },
  actionButton: {
    padding: '10px 18px',
    backgroundColor: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    color: '#1e293b',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.2s',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  section: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1e293b',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  badge: {
    backgroundColor: '#3b82f6',
    color: 'white',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: '600'
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: '#64748b',
    fontSize: '14px'
  },
  vehicleGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '16px'
  },
  vehicleCard: {
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '16px',
    transition: 'all 0.2s'
  },
  vehicleCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  vehicleNumber: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1e293b'
  },
  severityBadge: {
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    color: 'white'
  },
  vehicleDetails: {
    marginBottom: '16px'
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '6px 0',
    fontSize: '13px'
  },
  detailLabel: {
    color: '#64748b'
  },
  detailValue: {
    fontWeight: '600',
    color: '#1e293b'
  },
  vehicleActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  escalateButton: {
    padding: '10px',
    backgroundColor: '#dc2626',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    transition: 'all 0.2s'
  },
  secondaryButton: {
    padding: '10px',
    backgroundColor: '#f1f5f9',
    color: '#475569',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    transition: 'all 0.2s'
  },
  sectionFooter: {
    marginTop: '20px',
    paddingTop: '20px',
    borderTop: '1px solid #e2e8f0'
  },
  bulkActionButton: {
    padding: '12px 20px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    width: '100%',
    transition: 'all 0.2s'
  },
  trendingGrid: {
    display: 'grid',
    gap: '16px'
  },
  trendingCard: {
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '16px',
    transition: 'all 0.2s'
  },
  trendingHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px'
  },
  trendingRank: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#3b82f6',
    minWidth: '35px'
  },
  trendingTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1e293b',
    margin: 0
  },
  trendingStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
    marginBottom: '12px'
  },
  statBox: {
    textAlign: 'center'
  },
  statValue: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1e293b'
  },
  statLabel: {
    fontSize: '12px',
    color: '#64748b',
    marginTop: '4px'
  },
  trendingDepots: {
    marginBottom: '12px'
  },
  trendingDepotsLabel: {
    fontSize: '13px',
    color: '#64748b',
    marginBottom: '6px',
    display: 'block'
  },
  depotTags: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap'
  },
  depotTag: {
    backgroundColor: '#f1f5f9',
    color: '#475569',
    padding: '4px 10px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500'
  },
  trendingBar: {
    height: '8px',
    backgroundColor: '#f1f5f9',
    borderRadius: '4px',
    overflow: 'hidden'
  },
  trendingBarFill: {
    height: '100%',
    transition: 'width 0.3s ease'
  },
  depotGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '16px'
  },
  depotCard: {
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '16px',
    transition: 'all 0.2s'
  },
  depotCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  depotName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1e293b',
    margin: 0
  },
  depotRate: {
    fontSize: '18px',
    fontWeight: '700'
  },
  depotStats: {
    marginBottom: '12px'
  },
  depotStatRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '6px 0',
    fontSize: '13px',
    color: '#64748b'
  },
  depotBar: {
    height: '6px',
    backgroundColor: '#f1f5f9',
    borderRadius: '3px',
    overflow: 'hidden'
  },
  depotBarFill: {
    height: '100%',
    transition: 'width 0.3s ease'
  },
  alertsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  alertCard: {
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '16px',
    transition: 'all 0.2s'
  },
  alertHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  alertLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flex: 1
  },
  alertIcon: {
    fontSize: '24px'
  },
  alertTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1e293b',
    margin: 0,
    marginBottom: '4px'
  },
  alertSubtitle: {
    fontSize: '13px',
    color: '#64748b',
    margin: 0
  },
  alertRight: {
    textAlign: 'right'
  },
  confidenceScore: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#3b82f6',
    backgroundColor: '#eff6ff',
    padding: '6px 12px',
    borderRadius: '6px'
  },
  alertBody: {
    marginBottom: '12px'
  },
  alertDescription: {
    fontSize: '14px',
    color: '#475569',
    marginBottom: '12px',
    lineHeight: '1.5'
  },
  alertVehicles: {
    marginBottom: '12px'
  },
  alertVehiclesLabel: {
    fontSize: '13px',
    color: '#64748b',
    marginBottom: '6px',
    display: 'block'
  },
  vehicleTags: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap'
  },
  vehicleTag: {
    backgroundColor: '#eff6ff',
    color: '#3b82f6',
    padding: '4px 10px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600'
  },
  alertRecommendation: {
    backgroundColor: '#f8fafc',
    padding: '12px',
    borderRadius: '6px',
    fontSize: '13px',
    color: '#1e293b',
    lineHeight: '1.5'
  },
  alertFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '12px',
    borderTop: '1px solid #e2e8f0'
  },
  alertTimestamp: {
    fontSize: '12px',
    color: '#64748b'
  },
  alertActionButton: {
    padding: '8px 16px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    transition: 'all 0.2s'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '0',
    maxWidth: '500px',
    width: '90%',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid #e2e8f0'
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1e293b',
    margin: 0
  },
  modalClose: {
    background: 'none',
    border: 'none',
    fontSize: '28px',
    color: '#64748b',
    cursor: 'pointer',
    padding: '0',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
    transition: 'all 0.2s'
  },
  modalBody: {
    padding: '24px'
  },
  modalText: {
    fontSize: '14px',
    color: '#475569',
    marginBottom: '16px',
    lineHeight: '1.5'
  },
  modalDetails: {
    backgroundColor: '#f8fafc',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '16px'
  },
  modalDetailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    fontSize: '14px',
    color: '#64748b'
  },
  modalWarning: {
    fontSize: '13px',
    color: '#f59e0b',
    backgroundColor: '#fffbeb',
    padding: '12px',
    borderRadius: '6px',
    border: '1px solid #fef3c7'
  },
  modalFooter: {
    display: 'flex',
    gap: '12px',
    padding: '20px 24px',
    borderTop: '1px solid #e2e8f0'
  },
  modalCancelButton: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#f1f5f9',
    color: '#475569',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.2s'
  },
  modalConfirmButton: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#dc2626',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.2s'
  }
};

// Add CSS animations to the document
if (typeof document !== 'undefined') {
  const styleId = 'trends-defects-animations';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes pulse {
        0%, 100% {
          opacity: 1;
        }
        50% {
          opacity: 0.5;
        }
      }

      @keyframes pulseCard {
        0%, 100% {
          transform: scale(1);
          box-shadow: 0 0 0 2px #10b981;
        }
        50% {
          transform: scale(1.02);
          box-shadow: 0 0 0 4px #10b981;
        }
      }

      @keyframes slideInRight {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      @keyframes spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }
    `;
    document.head.appendChild(style);
  }
}

export default TrendsDefectsPanel;
