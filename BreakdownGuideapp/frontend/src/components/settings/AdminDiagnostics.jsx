import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../services/api-client';

const AdminDiagnostics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchDiagnostics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.get('/api/diagnostics');
      setData(result.data || result);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err.message || 'Failed to fetch diagnostics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDiagnostics();
    const interval = setInterval(fetchDiagnostics, 30000);
    return () => clearInterval(interval);
  }, [fetchDiagnostics]);

  if (loading && !data) {
    return <div className="diag-loading">Loading diagnostics...</div>;
  }

  if (error && !data) {
    return (
      <div className="diag-error">
        <p>Failed to load diagnostics: {error}</p>
        <button onClick={fetchDiagnostics}>Retry</button>
      </div>
    );
  }

  if (!data) return null;

  const { server, memory, database, integrations, tables, tests } = data;

  return (
    <div className="diag-container">
      <div className="diag-header">
        <h3>System Diagnostics</h3>
        <div className="diag-header-actions">
          <span className="diag-timestamp">
            {lastRefresh && `Updated ${lastRefresh.toLocaleTimeString()}`}
          </span>
          <button className="diag-refresh-btn" onClick={fetchDiagnostics} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Server Info */}
      <div className="diag-section">
        <h4>Server</h4>
        <div className="diag-grid">
          <DiagItem label="Node.js" value={server.nodeVersion} />
          <DiagItem label="Platform" value={`${server.platform} (${server.arch})`} />
          <DiagItem label="Environment" value={server.env} status={server.env === 'production' ? 'ok' : 'warn'} />
          <DiagItem label="PID" value={server.pid} />
          <DiagItem label="Uptime" value={server.uptime_human} />
        </div>
      </div>

      {/* Memory */}
      <div className="diag-section">
        <h4>Memory Usage</h4>
        <div className="diag-grid">
          <DiagItem label="RSS" value={`${memory.rss_mb} MB`} />
          <DiagItem label="Heap Used" value={`${memory.heap_used_mb} MB`} />
          <DiagItem label="Heap Total" value={`${memory.heap_total_mb} MB`} />
          <DiagItem
            label="Heap Usage"
            value={`${memory.heap_usage_pct}%`}
            status={memory.heap_usage_pct > 90 ? 'error' : memory.heap_usage_pct > 70 ? 'warn' : 'ok'}
          />
        </div>
        <div className="diag-bar-container">
          <div
            className={`diag-bar ${memory.heap_usage_pct > 90 ? 'critical' : memory.heap_usage_pct > 70 ? 'warning' : ''}`}
            style={{ width: `${memory.heap_usage_pct}%` }}
          />
        </div>
      </div>

      {/* Database */}
      <div className="diag-section">
        <h4>Database</h4>
        <div className="diag-grid">
          <DiagItem label="Host" value={database.host} />
          <DiagItem label="Database" value={database.database} />
          <DiagItem label="User" value={database.user} />
          <DiagItem
            label="Connection"
            value={tests.mysql_connection?.status === 'ok' ? 'Connected' : tests.mysql_connection?.message}
            status={tests.mysql_connection?.status === 'ok' ? 'ok' : 'error'}
          />
        </div>
      </div>

      {/* Integrations */}
      <div className="diag-section">
        <h4>Integrations</h4>
        <div className="diag-grid">
          <DiagItem label="JWT Secret" value={integrations.jwt_secret ? 'Configured' : 'Missing'} status={integrations.jwt_secret ? 'ok' : 'error'} />
          <DiagItem label="Google Directions" value={integrations.google_directions ? 'Configured' : 'Not set'} status={integrations.google_directions ? 'ok' : 'warn'} />
          <DiagItem label="BODS API" value={integrations.bods_api ? 'Configured' : 'Not set'} status={integrations.bods_api ? 'ok' : 'warn'} />
          {integrations.gtfs_rt && (
            <>
              <DiagItem label="GTFS-RT Active" value={integrations.gtfs_rt.active ? 'Polling' : 'Inactive'} status={integrations.gtfs_rt.active ? 'ok' : 'warn'} />
              <DiagItem label="Live Vehicles" value={integrations.gtfs_rt.total_vehicles ?? 0} />
              <DiagItem label="Last GTFS-RT Update" value={integrations.gtfs_rt.last_update ? new Date(integrations.gtfs_rt.last_update).toLocaleTimeString() : 'Never'} />
            </>
          )}
        </div>
      </div>

      {/* Table Counts */}
      <div className="diag-section">
        <h4>Database Tables</h4>
        <div className="diag-table">
          <table aria-label="Database table row counts">
            <thead>
              <tr>
                <th scope="col">Table</th>
                <th scope="col">Rows</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(tables).map(([name, info]) => (
                <tr key={name}>
                  <td className="diag-table-name">{formatTableName(name)}</td>
                  <td className="diag-table-count">{info.count?.toLocaleString()}</td>
                  <td>
                    <span className={`diag-status-dot ${info.status}`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .diag-container { font-family: 'Inter', -apple-system, sans-serif; }
        .diag-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .diag-header h3 { color: #0097A7; font-size: 18px; font-weight: 700; margin: 0; }
        .diag-header-actions { display: flex; align-items: center; gap: 12px; }
        .diag-timestamp { font-size: 12px; color: #64748B; }
        .diag-refresh-btn {
          background: #1E293B; border: 1px solid #334155; color: #CBD5E1; padding: 6px 14px;
          border-radius: 6px; font-size: 12px; cursor: pointer; transition: all 0.2s;
        }
        .diag-refresh-btn:hover { background: #334155; color: #F1F5F9; }
        .diag-refresh-btn:disabled { opacity: 0.5; cursor: wait; }

        .diag-section { margin-bottom: 20px; padding: 16px; background: #1E293B; border-radius: 10px; border: 1px solid #334155; }
        .diag-section h4 { color: #94A3B8; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px; }

        .diag-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 10px; }
        .diag-item { display: flex; flex-direction: column; gap: 2px; }
        .diag-item-label { font-size: 11px; color: #64748B; }
        .diag-item-value { font-size: 14px; font-weight: 600; color: #F1F5F9; font-family: 'JetBrains Mono', monospace; }
        .diag-item-value.ok { color: #10B981; }
        .diag-item-value.warn { color: #F59E0B; }
        .diag-item-value.error { color: #EF4444; }

        .diag-bar-container { margin-top: 10px; height: 6px; background: #0F172A; border-radius: 3px; overflow: hidden; }
        .diag-bar { height: 100%; background: #0097A7; border-radius: 3px; transition: width 0.5s ease; }
        .diag-bar.warning { background: #F59E0B; }
        .diag-bar.critical { background: #EF4444; }

        .diag-table table { width: 100%; border-collapse: collapse; }
        .diag-table th { font-size: 11px; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px; text-align: left; padding: 6px 10px; border-bottom: 1px solid #334155; }
        .diag-table td { padding: 6px 10px; font-size: 13px; color: #CBD5E1; border-bottom: 1px solid rgba(51, 65, 85, 0.5); }
        .diag-table-name { font-weight: 500; }
        .diag-table-count { font-family: 'JetBrains Mono', monospace; font-weight: 600; color: #F1F5F9; }

        .diag-status-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; }
        .diag-status-dot.ok { background: #10B981; }
        .diag-status-dot.error { background: #EF4444; }
        .diag-status-dot.warn { background: #F59E0B; }

        .diag-loading, .diag-error { text-align: center; padding: 40px; color: #64748B; }
        .diag-error button { margin-top: 12px; background: #0097A7; color: white; border: none; padding: 8px 20px; border-radius: 6px; cursor: pointer; }
      `}</style>
    </div>
  );
};

function DiagItem({ label, value, status }) {
  return (
    <div className="diag-item">
      <span className="diag-item-label">{label}</span>
      <span className={`diag-item-value ${status || ''}`}>{value}</span>
    </div>
  );
}

function formatTableName(name) {
  return name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export default AdminDiagnostics;
