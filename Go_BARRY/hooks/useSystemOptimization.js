import { useState, useEffect, useCallback } from 'react';
import useConvexSync from './useConvexSync';
import useSupervisorSession from '../components/hooks/useSupervisorSession';

const API_BASE = '/api/system';

export default function useSystemOptimization() {
  const [metrics, setMetrics] = useState(null);
  const [queueStatus, setQueueStatus] = useState(null);
  const [bottlenecks, setBottlenecks] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { supervisor } = useSupervisorSession();
  useConvexSync();

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/performance`);
      setMetrics(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchQueueStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/alerts/queue-status`);
      setQueueStatus(await res.json());
    } catch (e) {
      setError(e.message);
    }
  }, []);

  const fetchBottlenecks = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/bottlenecks`);
      setBottlenecks(await res.json());
    } catch (e) {
      setError(e.message);
    }
  }, []);

  const optimizeSystem = useCallback(async () => {
    setLoading(true);
    try {
      await fetch(`${API_BASE}/optimize`, { method: 'POST' });
      await fetchMetrics();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [fetchMetrics]);

  const clearCache = useCallback(async () => {
    setLoading(true);
    try {
      await fetch(`${API_BASE}/cache/clear`, { method: 'POST' });
      await fetchMetrics();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [fetchMetrics]);

  const restartService = useCallback(async (service) => {
    setLoading(true);
    try {
      await fetch(`${API_BASE}/services/restart`, { method: 'POST', body: JSON.stringify({ service }) });
      await fetchMetrics();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [fetchMetrics]);

  const optimizeAlerts = useCallback(async () => {
    setLoading(true);
    try {
      await fetch(`${API_BASE}/alerts/optimize`, { method: 'POST' });
      await fetchMetrics();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [fetchMetrics]);

  useEffect(() => {
    fetchMetrics();
    fetchQueueStatus();
    fetchBottlenecks();
  }, [fetchMetrics, fetchQueueStatus, fetchBottlenecks]);

  return {
    metrics,
    optimizeSystem,
    clearCache,
    restartService,
    queueStatus,
    optimizeAlerts,
    bottlenecks,
    loading,
    error,
  };
}
