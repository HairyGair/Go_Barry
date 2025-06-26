import React, { useEffect, useState } from 'react';
import useSystemOptimization from '../../hooks/useSystemOptimization';
import PerformanceMetricsWidget from '../ui/PerformanceMetricsWidget';

const SystemOptimizationPanel = () => {
  const {
    metrics,
    optimizeSystem,
    clearCache,
    restartService,
    queueStatus,
    optimizeAlerts,
    bottlenecks,
    loading,
    error,
  } = useSystemOptimization();

  return (
    <div className="system-optimization-panel">
      <h2>System Optimization Panel</h2>
      <PerformanceMetricsWidget metrics={metrics} loading={loading} error={error} />
      <div className="optimization-controls">
        <button onClick={clearCache}>Clear Cache</button>
        <button onClick={optimizeSystem}>Optimize System</button>
        <button onClick={optimizeAlerts}>Optimize Alerts</button>
        <button onClick={() => restartService('all')}>Restart All Services</button>
      </div>
      <div className="queue-status">
        <h3>Alert Processing Queue</h3>
        <pre>{JSON.stringify(queueStatus, null, 2)}</pre>
      </div>
      <div className="bottlenecks">
        <h3>Performance Bottlenecks</h3>
        <pre>{JSON.stringify(bottlenecks, null, 2)}</pre>
      </div>
    </div>
  );
};

export default SystemOptimizationPanel;
