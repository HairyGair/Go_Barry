/**
 * Street Manager Hook for Frontend Polling
 * Provides real-time access to Street Manager roadworks data via Supabase
 * © 2024-2025 Anthony Gair. All rights reserved.
 */

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

/**
 * Custom hook for managing Street Manager roadworks data
 * @param {Object} options - Configuration options
 * @returns {Object} Street Manager data and functions
 */
export const useStreetManager = (options = {}) => {
  const {
    pollInterval = 60000, // 1 minute default
    autoStart = true,
    maxRetries = 3
  } = options;

  // State management
  const [queuedRoadworks, setQueuedRoadworks] = useState([]);
  const [activeRoadworks, setActiveRoadworks] = useState([]);
  const [completedRoadworks, setCompletedRoadworks] = useState([]);
  const [stats, setStats] = useState({
    pendingReview: 0,
    approved: 0,
    monitoring: 0,
    critical: 0,
    high: 0,
    total: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [retryCount, setRetryCount] = useState(0);

  /**
   * Fetch roadworks data from Supabase
   */
  const fetchRoadworks = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);

    try {
      setConnectionStatus('connecting');

      // Fetch queued roadworks (pending review)
      const { data: queuedData, error: queuedError } = await supabase
        .from('streetworks')
        .select('*')
        .eq('status', 'pending_review')
        .eq('review_required', true)
        .order('priority', { ascending: true })
        .order('created_at', { ascending: false })
        .limit(50);

      if (queuedError) throw queuedError;

      // Fetch active roadworks
      const { data: activeData, error: activeError } = await supabase
        .from('streetworks')
        .select('*')
        .in('status', ['approved', 'monitoring', 'active'])
        .order('severity', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(100);

      if (activeError) throw activeError;

      // Fetch recently completed roadworks (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: completedData, error: completedError } = await supabase
        .from('streetworks')
        .select('*')
        .eq('status', 'completed')
        .gte('updated_at', sevenDaysAgo.toISOString())
        .order('updated_at', { ascending: false })
        .limit(50);

      if (completedError) throw completedError;

      // Process and enhance data
      const processedQueued = processRoadworksData(queuedData || [], 'queued');
      const processedActive = processRoadworksData(activeData || [], 'active');
      const processedCompleted = processRoadworksData(completedData || [], 'completed');

      // Update state
      setQueuedRoadworks(processedQueued);
      setActiveRoadworks(processedActive);
      setCompletedRoadworks(processedCompleted);

      // Calculate stats
      calculateStats(processedQueued, processedActive, processedCompleted);

      setLastUpdate(new Date());
      setConnectionStatus('connected');
      setRetryCount(0);

    } catch (fetchError) {
      console.error('Error fetching Street Manager data:', fetchError);
      setError(fetchError.message);
      setConnectionStatus('error');
      
      // Implement retry logic
      if (retryCount < maxRetries) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => fetchRoadworks(false), 5000); // Retry after 5 seconds
      }
    } finally {
      setLoading(false);
    }
  }, [maxRetries, retryCount]);

  /**
   * Process raw roadworks data and add computed fields
   */
  const processRoadworksData = (rawData, category) => {
    return rawData.map(roadwork => {
      const now = new Date();
      const startDate = roadwork.sm_start_date ? new Date(roadwork.sm_start_date) : null;
      const endDate = roadwork.sm_end_date ? new Date(roadwork.sm_end_date) : null;

      return {
        ...roadwork,
        // Add computed fields
        id: roadwork.id,
        location_description: roadwork.sm_location_description || 
                             `${roadwork.sm_street_name || 'Unknown Street'}, ${roadwork.sm_area_name || 'Unknown Area'}`,
        work_type: roadwork.sm_traffic_management_type || 'unknown',
        promoter_organisation: roadwork.sm_promoter_name || 'Unknown',
        start_date: roadwork.sm_start_date,
        end_date: roadwork.sm_end_date,
        
        // Status indicators
        isOverrun: endDate && endDate < now && category === 'active',
        isStartingSoon: startDate && startDate > now && startDate <= new Date(now.getTime() + 24 * 60 * 60 * 1000), // Within 24 hours
        daysSinceStart: startDate ? Math.floor((now - startDate) / (1000 * 60 * 60 * 24)) : null,
        daysUntilEnd: endDate ? Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)) : null,
        
        // Route information
        affectedRoutes: roadwork.auto_matched_routes || roadwork.confirmed_routes || [],
        hasRoutes: (roadwork.auto_matched_routes?.length || 0) > 0 || (roadwork.confirmed_routes?.length || 0) > 0,
        
        // Priority and severity
        priority: roadwork.priority || 3,
        severity: roadwork.severity || 'medium',
        
        // Source tracking
        source: 'StreetManager',
        category
      };
    });
  };

  /**
   * Calculate statistics from roadworks data
   */
  const calculateStats = (queued, active, completed) => {
    const allRoadworks = [...queued, ...active, ...completed];
    
    const newStats = {
      pendingReview: queued.length,
      approved: active.filter(r => r.status === 'approved').length,
      monitoring: active.filter(r => r.status === 'monitoring').length,
      critical: allRoadworks.filter(r => r.severity === 'critical').length,
      high: allRoadworks.filter(r => r.severity === 'high').length,
      total: allRoadworks.length,
      
      // Additional useful stats
      overrun: active.filter(r => r.isOverrun).length,
      startingSoon: active.filter(r => r.isStartingSoon).length,
      withRoutes: allRoadworks.filter(r => r.hasRoutes).length,
      completedThisWeek: completed.length
    };

    setStats(newStats);
  };

  /**
   * Submit supervisor review for a roadwork
   */
  const submitReview = useCallback(async (roadworkId, reviewData, supervisorInfo) => {
    try {
      setLoading(true);

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'https://go-barry.onrender.com'}/api/roadworks-v2/${roadworkId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...reviewData,
          supervisorId: supervisorInfo.id,
          supervisorName: supervisorInfo.name,
          supervisorBadge: supervisorInfo.badge,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`Review submission failed: ${response.status}`);
      }

      const result = await response.json();

      // Refresh data after successful review
      await fetchRoadworks(false);

      return { success: true, result };

    } catch (reviewError) {
      console.error('Error submitting review:', reviewError);
      setError(reviewError.message);
      return { success: false, error: reviewError.message };
    } finally {
      setLoading(false);
    }
  }, [fetchRoadworks]);

  /**
   * Quick approve roadwork without detailed review
   */
  const quickApprove = useCallback(async (roadworkId, supervisorInfo) => {
    return await submitReview(roadworkId, {
      status: 'approved',
      severity: 'medium',
      diversionRequired: false,
      notes: 'Quick approved by supervisor'
    }, supervisorInfo);
  }, [submitReview]);

  /**
   * Dismiss roadwork as not relevant
   */
  const dismissRoadwork = useCallback(async (roadworkId, reason, supervisorInfo) => {
    return await submitReview(roadworkId, {
      status: 'rejected',
      notes: reason || 'Dismissed as not relevant to Go North East operations'
    }, supervisorInfo);
  }, [submitReview]);

  /**
   * Get roadworks by status
   */
  const getRoadworksByStatus = useCallback((status) => {
    switch (status.toLowerCase()) {
      case 'queued':
      case 'pending':
        return queuedRoadworks;
      case 'active':
      case 'approved':
      case 'monitoring':
        return activeRoadworks.filter(r => 
          status.toLowerCase() === 'active' ? true : r.status === status.toLowerCase()
        );
      case 'completed':
        return completedRoadworks;
      case 'overrun':
        return activeRoadworks.filter(r => r.isOverrun);
      case 'critical':
        return [...queuedRoadworks, ...activeRoadworks].filter(r => r.severity === 'critical');
      default:
        return [];
    }
  }, [queuedRoadworks, activeRoadworks, completedRoadworks]);

  /**
   * Search roadworks by text
   */
  const searchRoadworks = useCallback((query) => {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const searchTerm = query.toLowerCase().trim();
    const allRoadworks = [...queuedRoadworks, ...activeRoadworks, ...completedRoadworks];

    return allRoadworks.filter(roadwork => 
      roadwork.location_description?.toLowerCase().includes(searchTerm) ||
      roadwork.sm_street_name?.toLowerCase().includes(searchTerm) ||
      roadwork.sm_area_name?.toLowerCase().includes(searchTerm) ||
      roadwork.promoter_organisation?.toLowerCase().includes(searchTerm) ||
      roadwork.sm_reference?.toLowerCase().includes(searchTerm) ||
      roadwork.affectedRoutes?.some(route => route.toLowerCase().includes(searchTerm))
    );
  }, [queuedRoadworks, activeRoadworks, completedRoadworks]);

  /**
   * Force refresh data
   */
  const refresh = useCallback(() => {
    setRetryCount(0);
    fetchRoadworks(true);
  }, [fetchRoadworks]);

  // Set up polling effect
  useEffect(() => {
    if (!autoStart) return;

    // Initial fetch
    fetchRoadworks();

    // Set up polling interval
    const interval = setInterval(() => {
      fetchRoadworks(false);
    }, pollInterval);

    return () => clearInterval(interval);
  }, [autoStart, pollInterval, fetchRoadworks]);

  // Set up real-time subscriptions (optional enhancement)
  useEffect(() => {
    if (!supabase) return;

    // Subscribe to streetworks table changes
    const subscription = supabase
      .channel('streetworks_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'streetworks' 
        }, 
        (payload) => {
          console.log('Street Manager real-time update:', payload);
          // Refresh data when changes occur
          fetchRoadworks(false);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchRoadworks]);

  return {
    // Data
    queuedRoadworks,
    activeRoadworks,
    completedRoadworks,
    stats,
    
    // State
    loading,
    error,
    lastUpdate,
    connectionStatus,
    retryCount,
    
    // Functions
    fetchRoadworks,
    submitReview,
    quickApprove,
    dismissRoadwork,
    getRoadworksByStatus,
    searchRoadworks,
    refresh,
    
    // Computed properties
    hasQueuedRoadworks: queuedRoadworks.length > 0,
    hasActiveRoadworks: activeRoadworks.length > 0,
    hasOverruns: stats.overrun > 0,
    hasCritical: stats.critical > 0,
    isConnected: connectionStatus === 'connected'
  };
};

/**
 * Simplified hook for just getting queue count (for badges, etc.)
 */
export const useQueueCount = () => {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchCount = useCallback(async () => {
    try {
      setLoading(true);
      
      const { count: queueCount, error } = await supabase
        .from('streetworks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending_review')
        .eq('review_required', true);

      if (error) throw error;

      setCount(queueCount || 0);
    } catch (error) {
      console.error('Error fetching queue count:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCount();
    
    // Refresh count every 2 minutes
    const interval = setInterval(fetchCount, 2 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [fetchCount]);

  return { count, loading, refresh: fetchCount };
};

export default useStreetManager;