import React from 'react';

const PerformanceMetricsWidget = ({ metrics, loading, error }) => {
  if (loading) return <div>Loading performance metrics...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!metrics) return <div>No metrics available.</div>;

  return (
    <div className="performance-metrics-widget">
      <h4>Performance Metrics</h4>
      <div className="metrics-section">
        <div>
          <strong>Memory Usage:</strong>
          <progress value={metrics.memory?.heapUsed} max={metrics.memory?.heapTotal} />
          <span>{((metrics.memory?.heapUsed / metrics.memory?.heapTotal) * 100).toFixed(1)}%</span>
        </div>
        <div>
          <strong>API Status:</strong> {metrics.apiStatus}
        </div>
        <div>
          <strong>Database Status:</strong> {metrics.dbStatus}
        </div>
        <div>
          <strong>Alert Queue:</strong> {metrics.alertQueue?.length || 0}
        </div>
        <div>
          <strong>Convex Sync:</strong> {metrics.convexSync?.status || 'unknown'}
        </div>
        {/* Add more metrics and visualizations as needed */}
      </div>
    </div>
  );
};

export default PerformanceMetricsWidget;
