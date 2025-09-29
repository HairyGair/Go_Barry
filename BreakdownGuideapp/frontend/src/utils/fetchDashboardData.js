// Fixed version of fetchDashboardData.js
// This file ensures activities have the correct structure for LiveActivityFeed

import { apiConfig } from '../breakdown-guide/components/common/constants.js';
import { fetchAllActivities } from '../api/activityAggregator.js';

// Circuit breaker state
if (!window.dashboardCircuitBreaker) {
  window.dashboardCircuitBreaker = {
    failureCount: 0,
    lastFailureTime: 0,
    isOpen: false,
    threshold: 3,
    resetTimeout: 60000
  };
}

// Request cache
if (!window.dashboardRequestCache) {
  window.dashboardRequestCache = {
    lastRequestTime: 0,
    pendingRequest: null,
    cachedData: null,
    MIN_REQUEST_INTERVAL: 10000
  };
}

// Helper functions
function checkCircuitBreaker() {
  const breaker = window.dashboardCircuitBreaker;
  
  if (breaker.isOpen && Date.now() - breaker.lastFailureTime > breaker.resetTimeout) {
    console.log('🔌 Circuit breaker: Resetting after timeout');
    breaker.isOpen = false;
    breaker.failureCount = 0;
  }
  
  return !breaker.isOpen;
}

function recordFailure() {
  const breaker = window.dashboardCircuitBreaker;
  breaker.failureCount++;
  breaker.lastFailureTime = Date.now();
  
  if (breaker.failureCount >= breaker.threshold) {
    breaker.isOpen = true;
    console.log(`🔌 Circuit breaker: OPEN after ${breaker.failureCount} failures`);
  }
}

function recordSuccess() {
  const breaker = window.dashboardCircuitBreaker;
  if (breaker.failureCount > 0) {
    console.log('✅ Circuit breaker: Connection restored');
  }
  breaker.failureCount = 0;
  breaker.isOpen = false;
}

function formatTimeFromTimestamp(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffMins < 1440) {
    const hours = Math.floor(diffMins / 60);
    return `${hours}h ago`;
  } else {
    return date.toLocaleString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

function getDefaultData() {
  return {
    stats: {
      activeBreakdowns: 0,
      todayTotal: 0,
      avgResponseTime: 0,
      fleetHealth: 100
    },
    activityFeed: [],
    metadata: {
      sources: {
        breakdowns: false,
        activity: false,
        engineering: false,
        analytics: false,
        wizards: false,
        auth: false
      },
      totalActivities: 0,
      lastUpdated: new Date().toISOString(),
      error: 'Unable to connect to server'
    }
  };
}

export async function fetchDashboardData() {
  try {
    const now = Date.now();
    const cache = window.dashboardRequestCache;
    
    // Check circuit breaker first
    if (!checkCircuitBreaker()) {
      console.log('🔌 Circuit breaker is OPEN - returning cached data');
      return cache.cachedData || getDefaultData();
    }

    // Check if we have a pending request
    if (cache.pendingRequest) {
      return await cache.pendingRequest;
    }

    // Check if we need to throttle
    if (now - cache.lastRequestTime < cache.MIN_REQUEST_INTERVAL) {
      if (cache.cachedData) {
        console.log('📦 Returning cached data (throttled)');
        return cache.cachedData;
      }
    }

    cache.lastRequestTime = now;

    // Create the request promise
    cache.pendingRequest = (async () => {
      try {
        console.log('🔄 Fetching dashboard data...');
        
        // Fetch core data
        const [breakdownsResponse, statsResponse] = await Promise.all([
          fetch(`${apiConfig.baseUrl}/api/breakdowns/live`, { 
            signal: AbortSignal.timeout(10000)
          }),
          fetch(`${apiConfig.baseUrl}/api/breakdowns/stats?period=today`, { 
            signal: AbortSignal.timeout(10000)
          }).catch(() => null)
        ]);

        // Check if core request failed
        if (!breakdownsResponse.ok) {
          throw new Error(`Core API failed: ${breakdownsResponse.status}`);
        }

        const breakdownsData = await breakdownsResponse.json();
        console.log('📊 Breakdowns data:', breakdownsData);
        
        // Handle stats response
        let statsData = {};
        if (statsResponse && statsResponse.ok) {
          statsData = await statsResponse.json();
          console.log('📈 Stats data:', statsData);
        }

        // Try to fetch activity feed with better error handling
        let activityData = { activities: [], sources: {} };
        try {
          console.log('🔄 Attempting to fetch activities...');
          activityData = await fetchAllActivities(25);
          console.log('✅ Activity data from aggregator:', activityData);
        } catch (e) {
          console.log('⚠️ Activity aggregator failed:', e.message);
          console.log('⚠️ Stack trace:', e.stack);
          // Ensure we have a valid structure even on error
          activityData = {
            activities: [],
            sources: { error: true, errorMessage: e.message },
            total: 0,
            timestamp: new Date().toISOString(),
            source: 'error_fallback'
          };
        }

        // Calculate stats
        const activeBreakdowns = breakdownsData.breakdowns ? 
          breakdownsData.breakdowns.filter(b => 
            ['active', 'pending', 'in_progress', 'received', 'acknowledged', 'dispatched', 'on_site'].includes(b.status)
          ).length : 0;
        
        const todayTotal = statsData.total || breakdownsData.breakdowns?.length || 0;
        
        // Calculate average response time
        let totalResponseTime = 0;
        let responseCount = 0;
        
        if (breakdownsData.breakdowns) {
          breakdownsData.breakdowns.forEach(breakdown => {
            if (breakdown.acknowledged_at && breakdown.received_at) {
              const responseTime = (new Date(breakdown.acknowledged_at) - new Date(breakdown.received_at)) / (1000 * 60);
              totalResponseTime += responseTime;
              responseCount++;
            }
          });
        }
        
        const avgResponseTime = responseCount > 0 ? Math.round(totalResponseTime / responseCount) : 0;
        const fleetHealth = 100 - Math.min(activeBreakdowns * 2, 20);

        // Process activities - ensure they have the right structure
        let activities = [];

        // First try to use activities from the aggregator
        if (activityData.activities && activityData.activities.length > 0) {
          console.log('🎯 Using activities from aggregator:', activityData.activities.length);
          activities = activityData.activities.map(activity => ({
            // Core fields that LiveActivityFeed expects
            id: activity.id || `activity-${Date.now()}-${Math.random()}`,
            type: activity.type || 'ACTIVITY',
            icon: activity.icon || '📋',
            message: activity.message || 'Activity',
            time: activity.time || formatTimeFromTimestamp(activity.timestamp || new Date()),
            timestamp: activity.timestamp || activity.created_at || new Date().toISOString(),
            
            // Additional fields for proper display
            depot: activity.depot || 'SDC',
            severity: activity.severity || 'normal',
            priority: activity.priority || 5,
            decision: activity.decision,
            status: activity.status || activity.decision,
            
            // Fields for enriched display
            supervisorName: activity.supervisorName || activity.supervisor_name || activity.reported_by,
            busNumber: activity.busNumber || activity.fleet_no || activity.fleet_number,
            fleet_no: activity.fleet_no || activity.fleet_number,
            issue: activity.issue || activity.issue_type || activity.issue_category,
            issue_type: activity.issue_type || activity.issue_category,
            location: activity.location || activity.location_description,
            location_description: activity.location || activity.location_description,
            route: activity.route || activity.route_number,
            route_number: activity.route || activity.route_number,
            passengersOnBoard: activity.passengersOnBoard || activity.passengers_on_board,
            
            // Metadata
            source: activity.source || 'aggregator',
            metadata: activity.metadata || {}
          }));
        } 
        // Fallback: create activities from breakdowns
        else if (breakdownsData.breakdowns && breakdownsData.breakdowns.length > 0) {
          console.log('🔄 Creating activities from breakdowns:', breakdownsData.breakdowns.length);
          activities = breakdownsData.breakdowns
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 25)
            .map(breakdown => ({
              // Core fields
              id: `breakdown-${breakdown.id || breakdown.breakdown_id || Date.now()}`,
              type: breakdown.wizard_decision ? 'ASSESSMENT_COMPLETED' : 'BREAKDOWN_REPORTED',
              icon: breakdown.severity === 'STOP' ? '🚨' : 
                    breakdown.severity === 'AMBER' ? '⚡' : 
                    breakdown.wizard_decision ? '✅' : '⚠️',
              message: breakdown.wizard_decision ?
                `${breakdown.supervisor_name || 'Supervisor'} completed ${breakdown.issue_category || 'assessment'} for ${breakdown.fleet_no || 'vehicle'} - ${breakdown.wizard_decision}` :
                `${breakdown.supervisor_name || 'Supervisor'} reported ${breakdown.issue_category || 'breakdown'} on ${breakdown.fleet_no || 'vehicle'}`,
              time: formatTimeFromTimestamp(breakdown.created_at),
              timestamp: breakdown.created_at,
              
              // Additional fields
              depot: breakdown.depot || 'Unknown',
              severity: breakdown.severity === 'STOP' ? 'critical' : 
                       breakdown.severity === 'AMBER' ? 'warning' : 'normal',
              priority: 1,
              decision: breakdown.wizard_decision || breakdown.severity,
              status: breakdown.wizard_decision || breakdown.severity,
              
              // Enriched fields
              supervisorName: breakdown.supervisor_name,
              busNumber: breakdown.fleet_no,
              fleet_no: breakdown.fleet_no,
              issue: breakdown.issue_category,
              issue_type: breakdown.issue_category,
              location: breakdown.location || breakdown.location_description,
              location_description: breakdown.location || breakdown.location_description,
              route: breakdown.route || breakdown.route_number,
              route_number: breakdown.route || breakdown.route_number,
              passengersOnBoard: breakdown.passengers_on_board,
              
              // Metadata
              source: 'breakdowns',
              metadata: {
                breakdownId: breakdown.id || breakdown.breakdown_id,
                wizardType: breakdown.wizard_type
              }
            }));
        } else {
          console.log('⚠️ No activities available from any source');
        }

        console.log('📦 Final activities array:', activities);
        console.log('📦 Activity count:', activities.length);
        if (activities.length > 0) {
          console.log('📦 First activity structure:', activities[0]);
        }

        const result = {
          stats: {
            activeBreakdowns,
            todayTotal,
            avgResponseTime,
            fleetHealth
          },
          activityFeed: activities,
          metadata: {
            sources: activityData.sources || { breakdowns: true },
            totalActivities: activities.length,
            lastUpdated: new Date().toISOString()
          }
        };

        // Record success and cache
        recordSuccess();
        cache.cachedData = result;
        cache.pendingRequest = null;

        console.log('✅ Dashboard data ready:', result);
        return result;

      } catch (error) {
        recordFailure();
        console.error('❌ Dashboard data fetch error:', error);
        cache.pendingRequest = null;
        return cache.cachedData || getDefaultData();
      }
    })();

    return await cache.pendingRequest;

  } catch (error) {
    console.error('💥 Unexpected error in fetchDashboardData:', error);
    if (window.dashboardRequestCache) {
      window.dashboardRequestCache.pendingRequest = null;
    }
    return getDefaultData();
  }
}

// Data manager singleton - FORCE RESET TO FIX INFINITE LOOP
if (window.homepageDataManager) {
  console.log('🔄 Resetting existing homepage data manager to fix infinite loop');
  window.homepageDataManager.reset();
}

// Data manager singleton
if (!window.homepageDataManager) {
  window.homepageDataManager = {
    callbacks: new Set(),
    isPolling: false,
    intervalId: null,
    lastData: null,
    pollCount: 0,
    
    subscribe(callback) {
      if (this.callbacks.has(callback)) return;
      
      this.callbacks.add(callback);
      
      if (this.lastData) {
        callback(this.lastData);
      }
      
      if (!this.isPolling && this.callbacks.size > 0) {
        this.startPolling();
      }
    },
    
    unsubscribe(callback) {
      this.callbacks.delete(callback);
      
      if (this.callbacks.size === 0 && this.isPolling) {
        this.stopPolling();
      }
    },
    
    async fetchData() {
      try {
        const data = await fetchDashboardData();
        this.lastData = data;
        
        this.callbacks.forEach(cb => {
          try {
            cb(data);
          } catch (error) {
            console.error('Error in data callback:', error);
          }
        });
      } catch (error) {
        console.error('Homepage data fetch error:', error);
        
        if (this.lastData) {
          this.callbacks.forEach(cb => {
            try {
              cb(this.lastData);
            } catch (error) {
              console.error('Error in data callback:', error);
            }
          });
        }
      }
    },
    
    startPolling() {
      if (this.isPolling || this.intervalId) return;
      
      this.isPolling = true;
      this.pollCount++;
      console.log(`🔄 Starting homepage data polling (instance #${this.pollCount})`);
      
      this.fetchData();
      
      this.intervalId = setInterval(() => {
        if (this.callbacks.size > 0) {
          this.fetchData();
        }
      }, 30000);
    },
    
    stopPolling() {
      if (!this.isPolling || !this.intervalId) return;
      
      this.isPolling = false;
      console.log(`🛑 Stopping homepage data polling (instance #${this.pollCount})`);
      
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
    },
    
    reset() {
      this.stopPolling();
      this.callbacks.clear();
      this.lastData = null;
      this.pollCount = 0;
      console.log('🔄 Homepage data manager reset');
    }
  };
}

export const dataManager = window.homepageDataManager;
