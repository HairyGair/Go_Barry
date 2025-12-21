/**
 * Admin Duty Audit Trail Component
 * Phase 9.2: Comprehensive duty action audit viewer
 *
 * Features:
 * - View recent audit entries
 * - Search and filter by supervisor, action type, date
 * - View supervisor history
 * - Daily summary reports
 * - Overtime tracking reports
 * - Export audit data
 */

import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../services/api-client.js';
import './AdminDutyAudit.css';

// Action type labels for display
const ACTION_LABELS = {
  'DUTY_START': { label: 'Duty Start', icon: '🟢', color: '#10b981' },
  'DUTY_END': { label: 'Duty End', icon: '🔴', color: '#ef4444' },
  'DUTY_EXTEND': { label: 'Duty Extended', icon: '⏰', color: '#f59e0b' },
  'DUTY_CHANGE': { label: 'Duty Changed', icon: '🔄', color: '#3b82f6' },
  'DUTY_SKIP': { label: 'View Only', icon: '👁️', color: '#6b7280' },
  'HANDOVER_INITIATED': { label: 'Handover Started', icon: '🤝', color: '#8b5cf6' },
  'HANDOVER_COMPLETED': { label: 'Handover Complete', icon: '✅', color: '#10b981' },
  'HANDOVER_RECEIVED': { label: 'Handover Received', icon: '📥', color: '#3b82f6' },
  'HANDOVER_REJECTED': { label: 'Handover Rejected', icon: '❌', color: '#ef4444' },
  'OVERTIME_START': { label: 'Overtime Started', icon: '⚠️', color: '#f59e0b' },
  'OVERTIME_ALERT': { label: 'Overtime Alert', icon: '🚨', color: '#ef4444' },
  'BREAK_START': { label: 'Break Started', icon: '☕', color: '#6b7280' },
  'BREAK_END': { label: 'Break Ended', icon: '▶️', color: '#10b981' },
  'FORCE_ASSIGN': { label: 'Force Assigned', icon: '🔒', color: '#dc2626' },
  'FORCE_END': { label: 'Force Ended', icon: '⛔', color: '#dc2626' },
  'SESSION_TIMEOUT': { label: 'Session Timeout', icon: '⏳', color: '#6b7280' },
  'NOTE_ADDED': { label: 'Note Added', icon: '📝', color: '#3b82f6' },
  'EXTENSION_REQUESTED': { label: 'Extension Request', icon: '📤', color: '#8b5cf6' },
  'EXTENSION_APPROVED': { label: 'Extension Approved', icon: '✅', color: '#10b981' },
  'EXTENSION_DENIED': { label: 'Extension Denied', icon: '❌', color: '#ef4444' }
};

const AdminDutyAudit = () => {
  // Tab state
  const [activeTab, setActiveTab] = useState('recent'); // recent, supervisor, daily, overtime

  // Recent audit entries
  const [recentEntries, setRecentEntries] = useState([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const [recentHours, setRecentHours] = useState(24);

  // Supervisor search
  const [supervisorBadge, setSupervisorBadge] = useState('');
  const [supervisorHistory, setSupervisorHistory] = useState(null);
  const [supervisorLoading, setSupervisorLoading] = useState(false);

  // Daily summary
  const [dailySummary, setDailySummary] = useState([]);
  const [dailyLoading, setDailyLoading] = useState(false);

  // Overtime report
  const [overtimeReport, setOvertimeReport] = useState(null);
  const [overtimeLoading, setOvertimeLoading] = useState(false);

  // Search filters
  const [searchFilters, setSearchFilters] = useState({
    actionType: '',
    dutyCode: '',
    depot: '',
    startDate: '',
    endDate: ''
  });
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Action types list
  const [actionTypes, setActionTypes] = useState([]);

  // Load action types on mount
  useEffect(() => {
    loadActionTypes();
  }, []);

  // Load recent entries when tab changes or hours changes
  useEffect(() => {
    if (activeTab === 'recent') {
      loadRecentEntries();
    } else if (activeTab === 'daily') {
      loadDailySummary();
    } else if (activeTab === 'overtime') {
      loadOvertimeReport();
    }
  }, [activeTab, recentHours]);

  // Load action types for filter dropdown
  const loadActionTypes = async () => {
    try {
      const data = await apiClient.get('/api/audit/action-types');
      if (data.success) {
        setActionTypes(data.actionTypes);
      }
    } catch (error) {
      console.error('Failed to load action types:', error);
    }
  };

  // Load recent audit entries
  const loadRecentEntries = async () => {
    try {
      setRecentLoading(true);
      const data = await apiClient.get(`/api/audit/recent?hours=${recentHours}&limit=100`);
      if (data.success) {
        setRecentEntries(data.entries);
      }
    } catch (error) {
      console.error('Failed to load recent entries:', error);
    } finally {
      setRecentLoading(false);
    }
  };

  // Load supervisor history
  const loadSupervisorHistory = async (e) => {
    e?.preventDefault();
    if (!supervisorBadge.trim()) return;

    try {
      setSupervisorLoading(true);
      const data = await apiClient.get(`/api/audit/supervisor/${supervisorBadge.trim()}?days=30`);
      if (data.success) {
        setSupervisorHistory(data);
      }
    } catch (error) {
      console.error('Failed to load supervisor history:', error);
    } finally {
      setSupervisorLoading(false);
    }
  };

  // Load daily summary
  const loadDailySummary = async () => {
    try {
      setDailyLoading(true);
      const data = await apiClient.get('/api/audit/daily-summary?days=7');
      if (data.success) {
        setDailySummary(data.summary);
      }
    } catch (error) {
      console.error('Failed to load daily summary:', error);
    } finally {
      setDailyLoading(false);
    }
  };

  // Load overtime report
  const loadOvertimeReport = async () => {
    try {
      setOvertimeLoading(true);
      const data = await apiClient.get('/api/audit/overtime-report?days=30');
      if (data.success) {
        setOvertimeReport(data);
      }
    } catch (error) {
      console.error('Failed to load overtime report:', error);
    } finally {
      setOvertimeLoading(false);
    }
  };

  // Search audit logs
  const handleSearch = async (e) => {
    e?.preventDefault();
    try {
      setSearchLoading(true);
      const params = new URLSearchParams();
      if (searchFilters.actionType) params.append('actionType', searchFilters.actionType);
      if (searchFilters.dutyCode) params.append('dutyCode', searchFilters.dutyCode);
      if (searchFilters.depot) params.append('depot', searchFilters.depot);
      if (searchFilters.startDate) params.append('startDate', searchFilters.startDate);
      if (searchFilters.endDate) params.append('endDate', searchFilters.endDate);

      const data = await apiClient.get(`/api/audit/search?${params.toString()}`);
      if (data.success) {
        setSearchResults(data.entries);
      }
    } catch (error) {
      console.error('Failed to search audit logs:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  // Export audit data
  const handleExport = async (format = 'csv') => {
    try {
      const response = await fetch(`/api/audit/export?days=30&format=${format}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (format === 'csv') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `duty_audit_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to export audit data:', error);
    }
  };

  // Format time ago
  const formatTimeAgo = (minutesAgo) => {
    if (minutesAgo < 1) return 'Just now';
    if (minutesAgo < 60) return `${minutesAgo}m ago`;
    const hours = Math.floor(minutesAgo / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get action display info
  const getActionInfo = (actionType) => {
    return ACTION_LABELS[actionType] || { label: actionType, icon: '📋', color: '#6b7280' };
  };

  // Render audit entry row
  const renderAuditEntry = (entry, index) => {
    const actionInfo = getActionInfo(entry.action_type);

    return (
      <div key={entry.id || index} className="audit-entry">
        <div className="audit-entry-icon" style={{ backgroundColor: actionInfo.color + '20' }}>
          <span>{actionInfo.icon}</span>
        </div>

        <div className="audit-entry-content">
          <div className="audit-entry-header">
            <span className="audit-entry-action" style={{ color: actionInfo.color }}>
              {actionInfo.label}
            </span>
            <span className="audit-entry-time">
              {entry.minutes_ago !== undefined ? formatTimeAgo(entry.minutes_ago) : formatDate(entry.created_at)}
            </span>
          </div>

          <div className="audit-entry-details">
            <span className="audit-entry-supervisor">
              <strong>{entry.supervisor_name}</strong>
              <span className="badge-number">({entry.supervisor_badge})</span>
            </span>
            {entry.duty_code && (
              <span className="audit-entry-duty">
                Duty {entry.duty_code}
                {entry.duty_name && ` - ${entry.duty_name}`}
              </span>
            )}
          </div>

          {entry.overtime_minutes > 0 && (
            <div className="audit-entry-overtime">
              ⚠️ {entry.overtime_minutes} minutes overtime
            </div>
          )}

          {entry.notes && (
            <div className="audit-entry-notes">
              {entry.notes}
            </div>
          )}

          {entry.supervisor_depot && (
            <span className="audit-entry-depot">{entry.supervisor_depot}</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="admin-duty-audit">
      <div className="audit-header">
        <h2>Duty Audit Trail</h2>
        <p className="audit-description">
          Track all duty-related actions for compliance and reporting. View supervisor activity, overtime tracking, and shift patterns.
        </p>
      </div>

      {/* Tabs */}
      <div className="audit-tabs">
        <button
          className={`audit-tab ${activeTab === 'recent' ? 'active' : ''}`}
          onClick={() => setActiveTab('recent')}
        >
          📋 Recent Activity
        </button>
        <button
          className={`audit-tab ${activeTab === 'supervisor' ? 'active' : ''}`}
          onClick={() => setActiveTab('supervisor')}
        >
          👤 Supervisor History
        </button>
        <button
          className={`audit-tab ${activeTab === 'daily' ? 'active' : ''}`}
          onClick={() => setActiveTab('daily')}
        >
          📊 Daily Summary
        </button>
        <button
          className={`audit-tab ${activeTab === 'overtime' ? 'active' : ''}`}
          onClick={() => setActiveTab('overtime')}
        >
          ⏰ Overtime Report
        </button>
        <button
          className={`audit-tab ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab('search')}
        >
          🔍 Search
        </button>
      </div>

      {/* Recent Activity Tab */}
      {activeTab === 'recent' && (
        <div className="audit-panel">
          <div className="audit-panel-header">
            <h3>Recent Duty Activity</h3>
            <div className="audit-controls">
              <select
                value={recentHours}
                onChange={(e) => setRecentHours(Number(e.target.value))}
                className="audit-select"
              >
                <option value={6}>Last 6 hours</option>
                <option value={12}>Last 12 hours</option>
                <option value={24}>Last 24 hours</option>
                <option value={48}>Last 48 hours</option>
                <option value={168}>Last 7 days</option>
              </select>
              <button onClick={loadRecentEntries} className="audit-refresh-btn">
                🔄 Refresh
              </button>
            </div>
          </div>

          {recentLoading ? (
            <div className="audit-loading">Loading recent activity...</div>
          ) : recentEntries.length === 0 ? (
            <div className="audit-empty">No audit entries found for this period.</div>
          ) : (
            <div className="audit-entries-list">
              {recentEntries.map(renderAuditEntry)}
            </div>
          )}
        </div>
      )}

      {/* Supervisor History Tab */}
      {activeTab === 'supervisor' && (
        <div className="audit-panel">
          <div className="audit-panel-header">
            <h3>Supervisor History</h3>
          </div>

          <form onSubmit={loadSupervisorHistory} className="supervisor-search-form">
            <input
              type="text"
              value={supervisorBadge}
              onChange={(e) => setSupervisorBadge(e.target.value.toUpperCase())}
              placeholder="Enter badge number (e.g., AG003)"
              className="audit-input"
            />
            <button type="submit" className="audit-search-btn" disabled={supervisorLoading}>
              {supervisorLoading ? '⏳' : '🔍'} Search
            </button>
          </form>

          {supervisorHistory && (
            <div className="supervisor-history">
              <div className="supervisor-summary">
                <h4>Summary for {supervisorHistory.badge} (Last 30 days)</h4>
                <div className="summary-stats">
                  <div className="stat-card">
                    <span className="stat-value">{supervisorHistory.summary.dutyStarts}</span>
                    <span className="stat-label">Shifts Started</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-value">{supervisorHistory.summary.dutyEnds}</span>
                    <span className="stat-label">Shifts Ended</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-value">{supervisorHistory.summary.extensions}</span>
                    <span className="stat-label">Extensions</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-value">{supervisorHistory.summary.handoversOut}</span>
                    <span className="stat-label">Handovers Out</span>
                  </div>
                  <div className="stat-card overtime">
                    <span className="stat-value">{Math.floor(supervisorHistory.summary.totalOvertimeMinutes / 60)}h {supervisorHistory.summary.totalOvertimeMinutes % 60}m</span>
                    <span className="stat-label">Total Overtime</span>
                  </div>
                </div>
              </div>

              <div className="audit-entries-list">
                {supervisorHistory.entries.map(renderAuditEntry)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Daily Summary Tab */}
      {activeTab === 'daily' && (
        <div className="audit-panel">
          <div className="audit-panel-header">
            <h3>Daily Summary (Last 7 Days)</h3>
            <button onClick={loadDailySummary} className="audit-refresh-btn">
              🔄 Refresh
            </button>
          </div>

          {dailyLoading ? (
            <div className="audit-loading">Loading daily summary...</div>
          ) : dailySummary.length === 0 ? (
            <div className="audit-empty">No data available.</div>
          ) : (
            <div className="daily-summary-table">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Supervisors</th>
                    <th>Starts</th>
                    <th>Ends</th>
                    <th>Extensions</th>
                    <th>Overtime</th>
                    <th>Handovers</th>
                    <th>View Only</th>
                  </tr>
                </thead>
                <tbody>
                  {dailySummary.map((day, index) => (
                    <tr key={index}>
                      <td>{new Date(day.audit_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</td>
                      <td>{day.unique_supervisors}</td>
                      <td className="positive">{day.total_starts}</td>
                      <td className="positive">{day.total_ends}</td>
                      <td>{day.total_extensions}</td>
                      <td className={day.overtime_occurrences > 0 ? 'warning' : ''}>{day.overtime_occurrences}</td>
                      <td>{day.total_handovers}</td>
                      <td>{day.view_only_logins}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Overtime Report Tab */}
      {activeTab === 'overtime' && (
        <div className="audit-panel">
          <div className="audit-panel-header">
            <h3>Overtime Report (Last 30 Days)</h3>
            <button onClick={loadOvertimeReport} className="audit-refresh-btn">
              🔄 Refresh
            </button>
          </div>

          {overtimeLoading ? (
            <div className="audit-loading">Loading overtime report...</div>
          ) : !overtimeReport ? (
            <div className="audit-empty">No overtime data available.</div>
          ) : (
            <div className="overtime-report">
              <div className="overtime-summary">
                <div className="stat-card large">
                  <span className="stat-value">{Math.floor(overtimeReport.totalOvertimeMinutes / 60)}h {overtimeReport.totalOvertimeMinutes % 60}m</span>
                  <span className="stat-label">Total Overtime</span>
                </div>
                <div className="stat-card large">
                  <span className="stat-value">{overtimeReport.totalOccurrences}</span>
                  <span className="stat-label">Overtime Events</span>
                </div>
              </div>

              <h4>By Supervisor</h4>
              <div className="overtime-by-supervisor">
                {Object.entries(overtimeReport.bySupervisor || {}).map(([badge, data]) => (
                  <div key={badge} className="supervisor-overtime-card">
                    <div className="supervisor-info">
                      <strong>{data.name}</strong>
                      <span className="badge-number">({badge})</span>
                      <span className="depot">{data.depot}</span>
                    </div>
                    <div className="overtime-total">
                      {Math.floor(data.totalOvertimeMinutes / 60)}h {data.totalOvertimeMinutes % 60}m
                    </div>
                    <div className="occurrence-count">
                      {data.occurrences?.length || 0} occurrences
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search Tab */}
      {activeTab === 'search' && (
        <div className="audit-panel">
          <div className="audit-panel-header">
            <h3>Search Audit Logs</h3>
          </div>

          <form onSubmit={handleSearch} className="search-form">
            <div className="search-filters">
              <div className="filter-group">
                <label>Action Type</label>
                <select
                  value={searchFilters.actionType}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, actionType: e.target.value }))}
                  className="audit-select"
                >
                  <option value="">All Actions</option>
                  {actionTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>Duty Code</label>
                <select
                  value={searchFilters.dutyCode}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, dutyCode: e.target.value }))}
                  className="audit-select"
                >
                  <option value="">All Duties</option>
                  <option value="100">Duty 100 (Early)</option>
                  <option value="200">Duty 200 (Day)</option>
                  <option value="400">Duty 400 (Late)</option>
                  <option value="500">Duty 500 (Night)</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Depot</label>
                <select
                  value={searchFilters.depot}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, depot: e.target.value }))}
                  className="audit-select"
                >
                  <option value="">All Depots</option>
                  <option value="SDC">SDC</option>
                  <option value="Riverside">Riverside</option>
                  <option value="Consett">Consett</option>
                  <option value="Deptford">Deptford</option>
                  <option value="Percy Main">Percy Main</option>
                  <option value="Hexham">Hexham</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Start Date</label>
                <input
                  type="date"
                  value={searchFilters.startDate}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  className="audit-input"
                />
              </div>

              <div className="filter-group">
                <label>End Date</label>
                <input
                  type="date"
                  value={searchFilters.endDate}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  className="audit-input"
                />
              </div>
            </div>

            <div className="search-actions">
              <button type="submit" className="audit-search-btn" disabled={searchLoading}>
                {searchLoading ? '⏳ Searching...' : '🔍 Search'}
              </button>
              <button
                type="button"
                className="audit-export-btn"
                onClick={() => handleExport('csv')}
              >
                📥 Export CSV
              </button>
            </div>
          </form>

          {searchResults.length > 0 && (
            <div className="search-results">
              <h4>Search Results ({searchResults.length})</h4>
              <div className="audit-entries-list">
                {searchResults.map(renderAuditEntry)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDutyAudit;
