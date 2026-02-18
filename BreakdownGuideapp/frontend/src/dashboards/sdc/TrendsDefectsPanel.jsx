import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { apiConfig } from '../../breakdown-guide/components/common/constants';
import { useConnectionManager } from '../../hooks/useConnectionManager';
import './TrendsDefectsPanel.css';

/**
 * TrendsDefectsPanel - Fleet Defect Intelligence Component
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

/* ---- SVG Icon Helpers ---- */
const Icon = {
  alertTriangle: (s = 16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  checkCircle: (s = 16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  trendingUp: (s = 16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  building: (s = 16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22V12h6v10"/><path d="M8 6h.01M16 6h.01M12 6h.01M8 10h.01M16 10h.01M12 10h.01"/></svg>,
  sparkles: (s = 16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2.09 6.26L20.18 9.27l-4.64 4.14L16.73 21 12 17.27 7.27 21l1.19-7.59L3.82 9.27l6.09-1.01z"/></svg>,
  refresh: (s = 14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>,
  barChart: (s = 14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  clipboard: (s = 14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>,
  mail: (s = 14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22 6 12 13 2 6"/></svg>,
  x: (s = 16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  calendar: (s = 14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  arrowUp: (s = 12) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>,
  arrowDown: (s = 12) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>,
};

const TrendsDefectsPanel = () => {
  // State Management
  const [timeframe, setTimeframe] = useState('7d');
  const [defectData, setDefectData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [escalationModal, setEscalationModal] = useState({ isOpen: false, vehicle: null });
  const [refreshing, setRefreshing] = useState(false);
  const [realtimeItems, setRealtimeItems] = useState(new Set());
  const [criticalAlert, setCriticalAlert] = useState(null);
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

  // Fetch defect data from API
  const fetchDefectData = useCallback(async () => {
    try {
      setRefreshing(true);
      const headers = { 'Content-Type': 'application/json' };

      const [repeatRes, trendsRes, depotRes, predictiveRes] = await Promise.all([
        fetch(`${apiConfig.baseUrl}/api/defects/repeat`, {
          method: 'POST', headers, credentials: 'include',
          body: JSON.stringify({ timeframe })
        }),
        fetch(`${apiConfig.baseUrl}/api/defects/trends`, {
          method: 'POST', headers, credentials: 'include',
          body: JSON.stringify({ timeframe, groupByType: true })
        }),
        fetch(`${apiConfig.baseUrl}/api/defects/depot-stats?timeframe=${timeframe}`, {
          headers, credentials: 'include'
        }),
        fetch(`${apiConfig.baseUrl}/api/defects/predictive`, {
          headers, credentials: 'include'
        })
      ]);

      const repeatData = await repeatRes.json();
      const trendsData = await trendsRes.json();
      const depotData = await depotRes.json();
      const predictiveData = await predictiveRes.json();

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
          repeat_vehicles: 0,
          top_issue: d.topIssue || 'None'
        })),
        predictiveAlerts: (predictiveData.alerts || []).map(a => ({
          priority: a.priority,
          prediction_type: a.type || a.message?.substring(0, 50),
          vehicles_affected: a.vehicles ? a.vehicles.length : a.affectedCount || 0,
          confidence_score: 75,
          description: a.message || a.recommendation,
          vehicle_list: a.vehicles || [],
          recommendation: a.recommendation || 'Review affected vehicles',
          predicted_timeframe: '7-14 days'
        }))
      });
    } catch (error) {
      console.error('Error fetching defect data:', error);
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

  // Auto-refresh every 30 seconds
  useEffect(() => {
    fetchDefectData();
    const interval = setInterval(fetchDefectData, 30000);
    return () => clearInterval(interval);
  }, [fetchDefectData]);

  // WebSocket message handler
  useEffect(() => {
    if (!connectionManager) return;
    const unsubscribe = connectionManager.onMessage((message) => {
      if (import.meta.env.DEV) {
        console.log('[Defect Intelligence] WebSocket message received:', message);
      }
      const { type, data } = message;
      switch (type) {
        case 'NEW_REPEAT_DEFECT': handleNewRepeatDefect(data); break;
        case 'TREND_UPDATE': handleTrendUpdate(data); break;
        case 'CRITICAL_PATTERN': handleCriticalPattern(data); break;
        case 'DEPOT_STATS_UPDATE': handleDepotStatsUpdate(data); break;
        case 'PREDICTIVE_ALERT': handlePredictiveAlert(data); break;
        default: console.warn('[Defect Intelligence] Unknown message type:', type);
      }
    });
    return () => unsubscribe();
  }, [connectionManager]);

  const handleNewRepeatDefect = useCallback((data) => {
    setDefectData(prevData => {
      if (!prevData) return prevData;
      const newVehicle = { ...data, isRealtime: true, realtimeTimestamp: new Date().toISOString() };
      const existingIndex = prevData.criticalVehicles.findIndex(v => v.fleet_number === data.fleet_number);
      let updatedVehicles;
      if (existingIndex >= 0) {
        updatedVehicles = [...prevData.criticalVehicles];
        updatedVehicles[existingIndex] = newVehicle;
      } else {
        updatedVehicles = [newVehicle, ...prevData.criticalVehicles];
      }
      setRealtimeItems(prev => new Set([...prev, `vehicle-${data.fleet_number}`]));
      setTimeout(() => {
        setRealtimeItems(prev => { const s = new Set(prev); s.delete(`vehicle-${data.fleet_number}`); return s; });
      }, 10000);
      return { ...prevData, criticalVehicles: updatedVehicles };
    });
  }, []);

  const handleTrendUpdate = useCallback((data) => {
    setDefectData(prevData => {
      if (!prevData) return prevData;
      const updatedIssue = { ...data, isRealtime: true, realtimeTimestamp: new Date().toISOString() };
      const existingIndex = prevData.trendingIssues.findIndex(i => i.issue_type === data.issue_type);
      let updatedIssues;
      if (existingIndex >= 0) {
        updatedIssues = [...prevData.trendingIssues];
        updatedIssues[existingIndex] = updatedIssue;
      } else {
        updatedIssues = [updatedIssue, ...prevData.trendingIssues];
      }
      updatedIssues.sort((a, b) => b.occurrences - a.occurrences);
      setRealtimeItems(prev => new Set([...prev, `trend-${data.issue_type}`]));
      setTimeout(() => {
        setRealtimeItems(prev => { const s = new Set(prev); s.delete(`trend-${data.issue_type}`); return s; });
      }, 10000);
      return { ...prevData, trendingIssues: updatedIssues };
    });
  }, []);

  const handleCriticalPattern = useCallback((data) => {
    setCriticalAlert(data);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 10000);
    fetchDefectData();
  }, [fetchDefectData]);

  const handleDepotStatsUpdate = useCallback((data) => {
    setDefectData(prevData => {
      if (!prevData) return prevData;
      const updatedDepot = { ...data, isRealtime: true, realtimeTimestamp: new Date().toISOString() };
      const existingIndex = prevData.depotHotspots.findIndex(d => d.depot_id === data.depot_id);
      let updatedDepots;
      if (existingIndex >= 0) {
        updatedDepots = [...prevData.depotHotspots];
        updatedDepots[existingIndex] = updatedDepot;
      } else {
        updatedDepots = [...prevData.depotHotspots, updatedDepot];
      }
      setRealtimeItems(prev => new Set([...prev, `depot-${data.depot_id}`]));
      setTimeout(() => {
        setRealtimeItems(prev => { const s = new Set(prev); s.delete(`depot-${data.depot_id}`); return s; });
      }, 10000);
      return { ...prevData, depotHotspots: updatedDepots };
    });
  }, []);

  const handlePredictiveAlert = useCallback((data) => {
    setDefectData(prevData => {
      if (!prevData) return prevData;
      const newAlert = { ...data, isRealtime: true, realtimeTimestamp: new Date().toISOString() };
      const isDuplicate = prevData.predictiveAlerts.some(
        a => a.prediction_type === data.prediction_type && JSON.stringify(a.vehicle_list) === JSON.stringify(data.vehicle_list)
      );
      if (isDuplicate) return prevData;
      const updatedAlerts = [newAlert, ...prevData.predictiveAlerts];
      setRealtimeItems(prev => new Set([...prev, `alert-${data.prediction_type}`]));
      setTimeout(() => {
        setRealtimeItems(prev => { const s = new Set(prev); s.delete(`alert-${data.prediction_type}`); return s; });
      }, 10000);
      if (data.priority === 'high') {
        setCriticalAlert({ title: 'New Predictive Alert', message: data.prediction_type, priority: data.priority });
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 8000);
      }
      return { ...prevData, predictiveAlerts: updatedAlerts };
    });
  }, []);

  const handleEscalate = useCallback(async (vehicle) => {
    setEscalationModal({ isOpen: true, vehicle });
  }, []);

  const confirmEscalation = useCallback(async () => {
    const { vehicle } = escalationModal;
    try {
      await fetch(`${apiConfig.baseUrl}/api/defects/escalate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
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
      await fetchDefectData();
      setEscalationModal({ isOpen: false, vehicle: null });
      alert(`Escalation sent for vehicle ${vehicle.fleetNumber}`);
    } catch (error) {
      console.error('Error escalating vehicle:', error);
      alert('Failed to escalate. Please try again.');
    }
  }, [escalationModal, timeframe, fetchDefectData]);

  const handleGenerateReport = useCallback(async () => {
    try {
      const response = await fetch(`${apiConfig.baseUrl}/api/defects/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          timeframe,
          includeRepeatDefects: true, includeTrends: true,
          includeDepotStats: true, includePredictive: true, format: 'json'
        })
      });
      const data = await response.json();
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

  const handleNotifyEngineering = useCallback(async (vehicles) => {
    try {
      await fetch(`${apiConfig.baseUrl}/api/defects/notifications/maintenance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          type: 'critical_repeat_defects', priority: 'high',
          vehicles: vehicles.map(v => v.fleetNumber || v.fleet_number),
          message: `${vehicles.length} vehicle(s) with critical repeat defects require immediate attention in ${timeframe} timeframe`,
          notifyEngineering: true, notifyManagement: true
        })
      });
      alert(`Engineering team notified about ${vehicles.length} vehicle(s)`);
    } catch (error) {
      console.error('Error sending notification:', error);
      alert('Failed to send notification. Please try again.');
    }
  }, [timeframe]);

  // Loading state
  if (loading && !defectData) {
    return (
      <div className="fdi__loading">
        <div className="fdi__spinner" />
        <p className="fdi__loading-text">Analyzing fleet defects...</p>
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
    <div className="fdi">
      {/* Critical Pattern Notification */}
      {showNotification && criticalAlert && (
        <div className="fdi__notification">
          <div className="fdi__notification-content">
            <span className="fdi__notification-icon">
              {Icon.alertTriangle(22)}
            </span>
            <div className="fdi__notification-text">
              <strong>{criticalAlert.title || 'Critical Pattern Detected'}</strong>
              <p>{criticalAlert.message}</p>
            </div>
            <button className="fdi__notification-close" onClick={() => setShowNotification(false)}>
              {Icon.x(16)}
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="fdi__header">
        <div className="fdi__header-left">
          <h2 className="fdi__title">Fleet Defect Intelligence</h2>
          <p className="fdi__subtitle">Pattern detection and predictive maintenance</p>
        </div>
        <div className="fdi__header-right">
          {/* Connection Status */}
          <div className="fdi__connection">
            {connectionManager.isConnected ? (
              <div className="fdi__connection--live">
                <span className="fdi__live-dot" />
                <span className="fdi__status-text">LIVE</span>
              </div>
            ) : (
              <div className="fdi__connection--reconnecting">
                <span className="fdi__reconnecting-dot" />
                <span className="fdi__status-text">Reconnecting...</span>
              </div>
            )}
          </div>

          {/* Timeframe Selector */}
          <div className="fdi__timeframe">
            {['24h', '7d', '30d'].map(tf => (
              <button
                key={tf}
                className={`fdi__timeframe-btn ${timeframe === tf ? 'fdi__timeframe-btn--active' : ''}`}
                onClick={() => setTimeframe(tf)}
              >
                {tf === '24h' ? '24 Hours' : tf === '7d' ? '7 Days' : '30 Days'}
              </button>
            ))}
          </div>

          {/* Actions */}
          <button className="fdi__action-btn" onClick={() => fetchDefectData()} disabled={refreshing}>
            {Icon.refresh()} <span>Refresh</span>
          </button>
          <button className="fdi__action-btn" onClick={handleGenerateReport}>
            {Icon.barChart()} <span>Report</span>
          </button>
        </div>
      </div>

      {/* ---- Critical Vehicles - Repeat Defects ---- */}
      <div className="fdi__section" style={{ '--stagger': 1 }}>
        <div className="fdi__section-header">
          <h3 className="fdi__section-title">
            {Icon.alertTriangle(18)}
            Critical Vehicles &mdash; Repeat Defects
          </h3>
          <span className="fdi__badge">{criticalVehicles.length}</span>
        </div>

        {criticalVehicles.length === 0 ? (
          <div className="fdi__empty">
            <p>{Icon.checkCircle(16)} No repeat defect patterns detected</p>
          </div>
        ) : (
          <div className="fdi__vehicle-grid">
            {criticalVehicles.map((vehicle, idx) => {
              const isRealtime = realtimeItems.has(`vehicle-${vehicle.fleet_number}`);
              return (
                <div
                  key={vehicle.fleet_number}
                  className={`fdi__vehicle-card ${isRealtime ? 'fdi__vehicle-card--live' : ''}`}
                  style={{ '--i': idx }}
                >
                  <div className="fdi__vehicle-card-header">
                    <span className="fdi__vehicle-number">
                      {vehicle.fleet_number}
                      {isRealtime && <span className="fdi__live-badge">LIVE</span>}
                    </span>
                    <span className={`fdi__severity-badge ${vehicle.defect_count >= 5 ? 'fdi__severity-badge--critical' : 'fdi__severity-badge--warning'}`}>
                      {vehicle.defect_count} defects
                    </span>
                  </div>

                  <div className="fdi__vehicle-details">
                    <div className="fdi__detail-row">
                      <span className="fdi__detail-label">Depot</span>
                      <span className="fdi__detail-value">{vehicle.depot}</span>
                    </div>
                    <div className="fdi__detail-row">
                      <span className="fdi__detail-label">Most Common</span>
                      <span className="fdi__detail-value">{vehicle.top_issue}</span>
                    </div>
                    <div className="fdi__detail-row">
                      <span className="fdi__detail-label">Last Seen</span>
                      <span className="fdi__detail-value">{vehicle.last_defect}</span>
                    </div>
                    <div className="fdi__detail-row">
                      <span className="fdi__detail-label">Pattern Score</span>
                      <span className="fdi__detail-value">{vehicle.pattern_score}%</span>
                    </div>
                  </div>

                  <div className="fdi__vehicle-actions">
                    {vehicle.defect_count >= 3 && (
                      <button className="fdi__btn--escalate" onClick={() => handleEscalate(vehicle)}>
                        {Icon.alertTriangle(14)} Escalate to Engineering
                      </button>
                    )}
                    <button className="fdi__btn--secondary">
                      {Icon.clipboard()} View History
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {criticalVehicles.length > 0 && (
          <div className="fdi__section-footer">
            <button className="fdi__btn--bulk" onClick={() => handleNotifyEngineering(criticalVehicles)}>
              {Icon.mail()} Notify Engineering Team ({criticalVehicles.length} vehicles)
            </button>
          </div>
        )}
      </div>

      {/* ---- Trending Issues Across Fleet ---- */}
      <div className="fdi__section" style={{ '--stagger': 2 }}>
        <div className="fdi__section-header">
          <h3 className="fdi__section-title">
            {Icon.trendingUp(18)}
            Trending Issues Across Fleet
          </h3>
          <span className="fdi__badge">{trendingIssues.length}</span>
        </div>

        <div className="fdi__trending-grid">
          {trendingIssues.map((issue, index) => {
            const isRealtime = realtimeItems.has(`trend-${issue.issue_type}`);
            return (
              <div
                key={index}
                className={`fdi__trending-card ${isRealtime ? 'fdi__trending-card--live' : ''}`}
                style={{ '--i': index }}
              >
                <div className="fdi__trending-header">
                  <span className="fdi__trending-rank">#{index + 1}</span>
                  <h4 className="fdi__trending-title">
                    {issue.issue_type}
                    {isRealtime && <span className="fdi__live-badge--sm">LIVE</span>}
                  </h4>
                </div>

                <div className="fdi__trending-stats">
                  <div className="fdi__stat-box">
                    <div className="fdi__stat-value">{issue.occurrences}</div>
                    <div className="fdi__stat-label">Occurrences</div>
                  </div>
                  <div className="fdi__stat-box">
                    <div className="fdi__stat-value">{issue.vehicles_affected}</div>
                    <div className="fdi__stat-label">Vehicles</div>
                  </div>
                  <div className="fdi__stat-box">
                    <div className={`fdi__stat-value ${issue.trend === 'up' ? 'fdi__stat-value--up' : 'fdi__stat-value--down'}`}>
                      <span className={issue.trend === 'up' ? 'fdi__trend-up' : 'fdi__trend-down'}>
                        {issue.trend === 'up' ? Icon.arrowUp() : Icon.arrowDown()} {issue.change_percentage}%
                      </span>
                    </div>
                    <div className="fdi__stat-label">Trend</div>
                  </div>
                </div>

                <div className="fdi__trending-depots">
                  <span className="fdi__trending-depots-label">Top Depots:</span>
                  <div className="fdi__tags">
                    {issue.top_depots.map(depot => (
                      <span key={depot} className="fdi__tag">{depot}</span>
                    ))}
                  </div>
                </div>

                <div className="fdi__bar fdi__bar--lg">
                  <div
                    className={`fdi__bar-fill ${issue.trend === 'up' ? 'fdi__bar-fill--warning' : 'fdi__bar-fill--teal'}`}
                    style={{ width: `${trendingIssues[0] ? (issue.occurrences / trendingIssues[0].occurrences) * 100 : 0}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ---- Depot Defect Hotspots ---- */}
      <div className="fdi__section" style={{ '--stagger': 3 }}>
        <div className="fdi__section-header">
          <h3 className="fdi__section-title">
            {Icon.building(18)}
            Depot Defect Hotspots
          </h3>
        </div>

        <div className="fdi__depot-grid">
          {depotHotspots.map((depot, idx) => {
            const severity = depot.defect_rate > 15 ? 'critical' : depot.defect_rate > 10 ? 'warning' : 'normal';
            const isRealtime = realtimeItems.has(`depot-${depot.depot_id}`);
            return (
              <div
                key={depot.depot_id}
                className={`fdi__depot-card fdi__depot-card--${severity} ${isRealtime ? 'fdi__depot-card--live' : ''}`}
                style={{ '--i': idx }}
              >
                <div className="fdi__depot-card-header">
                  <h4 className="fdi__depot-name">
                    {depot.depot_name}
                    {isRealtime && <span className="fdi__live-badge--sm">LIVE</span>}
                  </h4>
                  <span className={`fdi__depot-rate fdi__depot-rate--${severity}`}>
                    {depot.defect_rate}%
                  </span>
                </div>

                <div className="fdi__depot-stats">
                  <div className="fdi__depot-stat-row">
                    <span>Total Defects</span>
                    <strong>{depot.total_defects}</strong>
                  </div>
                  <div className="fdi__depot-stat-row">
                    <span>Fleet Size</span>
                    <strong>{depot.fleet_size} vehicles</strong>
                  </div>
                  <div className="fdi__depot-stat-row">
                    <span>Repeat Offenders</span>
                    <strong>{depot.repeat_vehicles}</strong>
                  </div>
                  <div className="fdi__depot-stat-row">
                    <span>Top Issue</span>
                    <strong>{depot.top_issue}</strong>
                  </div>
                </div>

                <div className="fdi__bar">
                  <div
                    className={`fdi__bar-fill fdi__bar-fill--${severity === 'critical' ? 'critical' : severity === 'warning' ? 'warning' : 'success'}`}
                    style={{ width: `${depot.defect_rate}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ---- Predictive Maintenance Alerts ---- */}
      <div className="fdi__section" style={{ '--stagger': 4 }}>
        <div className="fdi__section-header">
          <h3 className="fdi__section-title">
            {Icon.sparkles(18)}
            Predictive Maintenance Alerts
          </h3>
          <span className="fdi__badge">{predictiveAlerts.length}</span>
        </div>

        {predictiveAlerts.length === 0 ? (
          <div className="fdi__empty">
            <p>{Icon.checkCircle(16)} No predictive maintenance alerts</p>
          </div>
        ) : (
          <div className="fdi__alerts">
            {predictiveAlerts.map((alert, index) => {
              const isRealtime = realtimeItems.has(`alert-${alert.prediction_type}`);
              return (
                <div
                  key={index}
                  className={`fdi__alert-card fdi__alert-card--${alert.priority} ${isRealtime ? 'fdi__alert-card--live' : ''}`}
                  style={{ '--i': index }}
                >
                  <div className="fdi__alert-header">
                    <div className="fdi__alert-left">
                      <span className="fdi__alert-icon">
                        <span className={`fdi__priority-dot fdi__priority-dot--${alert.priority}`} />
                      </span>
                      <div>
                        <h4 className="fdi__alert-title">
                          {alert.prediction_type}
                          {isRealtime && <span className="fdi__live-badge--sm">LIVE</span>}
                        </h4>
                        <p className="fdi__alert-subtitle">
                          {alert.vehicles_affected} vehicles affected
                        </p>
                      </div>
                    </div>
                    <div className="fdi__alert-right">
                      <span className="fdi__confidence">
                        {alert.confidence_score}% confidence
                      </span>
                    </div>
                  </div>

                  <div className="fdi__alert-body">
                    <p className="fdi__alert-desc">{alert.description}</p>

                    <div className="fdi__alert-vehicles">
                      <span className="fdi__alert-vehicles-label">Affected Vehicles</span>
                      <div className="fdi__tags">
                        {alert.vehicle_list.slice(0, 5).map(vehicle => (
                          <span key={vehicle} className="fdi__tag--vehicle">{vehicle}</span>
                        ))}
                        {alert.vehicle_list.length > 5 && (
                          <span className="fdi__tag">+{alert.vehicle_list.length - 5} more</span>
                        )}
                      </div>
                    </div>

                    <div className="fdi__alert-rec">
                      <strong>Recommendation: </strong>{alert.recommendation}
                    </div>
                  </div>

                  <div className="fdi__alert-footer">
                    <span className="fdi__alert-time">Predicted: {alert.predicted_timeframe}</span>
                    <button className="fdi__btn--action">
                      {Icon.calendar()} Schedule Maintenance
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ---- Escalation Modal ---- */}
      {escalationModal.isOpen && (
        <div className="fdi__modal-overlay" onClick={() => setEscalationModal({ isOpen: false, vehicle: null })}>
          <div className="fdi__modal" onClick={(e) => e.stopPropagation()}>
            <div className="fdi__modal-header">
              <h3 className="fdi__modal-title">
                {Icon.alertTriangle(18)} Escalate to Engineering
              </h3>
              <button className="fdi__modal-close" onClick={() => setEscalationModal({ isOpen: false, vehicle: null })}>
                {Icon.x(18)}
              </button>
            </div>

            <div className="fdi__modal-body">
              <p className="fdi__modal-text">
                You are about to escalate vehicle <strong>{escalationModal.vehicle?.fleet_number}</strong> to the engineering team.
              </p>

              <div className="fdi__modal-details">
                <div className="fdi__modal-detail-row">
                  <span>Defect Count</span>
                  <strong>{escalationModal.vehicle?.defect_count}</strong>
                </div>
                <div className="fdi__modal-detail-row">
                  <span>Pattern Score</span>
                  <strong>{escalationModal.vehicle?.pattern_score}%</strong>
                </div>
                <div className="fdi__modal-detail-row">
                  <span>Top Issue</span>
                  <strong>{escalationModal.vehicle?.top_issue}</strong>
                </div>
                <div className="fdi__modal-detail-row">
                  <span>Depot</span>
                  <strong>{escalationModal.vehicle?.depot}</strong>
                </div>
              </div>

              <p className="fdi__modal-warning">
                This will notify the engineering supervisor and flag this vehicle for immediate review.
              </p>
            </div>

            <div className="fdi__modal-footer">
              <button className="fdi__btn--cancel" onClick={() => setEscalationModal({ isOpen: false, vehicle: null })}>
                Cancel
              </button>
              <button className="fdi__btn--confirm" onClick={confirmEscalation}>
                Confirm Escalation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrendsDefectsPanel;
