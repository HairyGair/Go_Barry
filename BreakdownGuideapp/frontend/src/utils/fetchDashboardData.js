// Fetch dashboard data utility function
import { apiConfig } from '../breakdown-guide/components/common/constants.js';
import { fetchAllActivities } from '../api/activityAggregator.js';

// Circuit breaker state
if (!window.dashboardCircuitBreaker) {
  window.dashboardCircuitBreaker = {
    failureCount: 0,
    lastFailureTime: 0,
    isOpen: false,
    threshold: 3, // Open circuit after 3 consecutive failures
    resetTimeout: 60000 // Try again after 1 minute
  };
}

// Create window-level globals to survive hot module reloads
if (!window.dashboardRequestCache) {
  window.dashboardRequestCache = {
    lastRequestTime: 0,
    pendingRequest: null,
    cachedData: null,
    MIN_REQUEST_INTERVAL: 10000 // Minimum 10 seconds between requests
  };
}

// Helper function to check if circuit breaker should open
function checkCircuitBreaker() {
  const breaker = window.dashboardCircuitBreaker;
  
  // Check if we should reset the circuit breaker
  if (breaker.isOpen && Date.now() - breaker.lastFailureTime > breaker.resetTimeout) {
    console.log('🔌 Circuit breaker: Resetting after timeout');
    breaker.isOpen = false;
    breaker.failureCount = 0;
  }
  
  return !breaker.isOpen;
}

// Helper function to record failure
function recordFailure() {
  const breaker = window.dashboardCircuitBreaker;
  breaker.failureCount++;
  breaker.lastFailureTime = Date.now();
  
  if (breaker.failureCount >= breaker.threshold) {
    breaker.isOpen = true;
    console.log(`🔌 Circuit breaker: OPEN after ${breaker.failureCount} failures. Will retry in ${breaker.resetTimeout/1000}s`);
  }
}

// Helper function to record success
function recordSuccess() {
  const breaker = window.dashboardCircuitBreaker;
  if (breaker.failureCount > 0) {
    console.log('✅ Circuit breaker: Connection restored');
  }
  breaker.failureCount = 0;
  breaker.isOpen = false;
}

// Create a stable singleton for homepage data updates
if (!window.homepageDataManager) {
  window.homepageDataManager = {
    callbacks: new Set(),
    isPolling: false,
    intervalId: null,
    lastData: null,
    pollCount: 0,
    
    subscribe(callback) {
      // Prevent duplicate subscriptions
      if (this.callbacks.has(callback)) {
        return;
      }
      
      this.callbacks.add(callback);
      
      // Send last data if available
      if (this.lastData) {
        callback(this.lastData);
      }
      
      // Start polling if not already started and we have subscribers
      if (!this.isPolling && this.callbacks.size > 0) {
        this.startPolling();
      }
    },
    
    unsubscribe(callback) {
      this.callbacks.delete(callback);
      
      // Stop polling only if no more subscribers and polling is active
      if (this.callbacks.size === 0 && this.isPolling) {
        this.stopPolling();
      }
    },
    
    async fetchData() {
      try {
        const data = await fetchDashboardData();
        this.lastData = data;
        
        // Notify all subscribers
        this.callbacks.forEach(cb => {
          try {
            cb(data);
          } catch (error) {
            console.error('Error in data callback:', error);
          }
        });
      } catch (error) {
        console.error('Homepage data fetch error:', error);
        
        // Send cached data if available
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
      // Prevent multiple polling instances
      if (this.isPolling || this.intervalId) {
        return;
      }
      
      this.isPolling = true;
      this.pollCount++;
      console.log(`🔄 Starting homepage data polling (instance #${this.pollCount})`);
      
      // Initial fetch
      this.fetchData();
      
      // Set up interval - 30 seconds
      this.intervalId = setInterval(() => {
        if (this.callbacks.size > 0) {
          this.fetchData();
        }
      }, 30000);
    },
    
    stopPolling() {
      if (!this.isPolling || !this.intervalId) {
        return;
      }
      
      this.isPolling = false;
      console.log(`🛑 Stopping homepage data polling (instance #${this.pollCount})`);
      
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
    },
    
    // Force reset (for debugging)
    reset() {
      this.stopPolling();
      this.callbacks.clear();
      this.lastData = null;
      this.pollCount = 0;
      console.log('🔄 Homepage data manager reset');
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
        return cache.cachedData;
      }
    }

    cache.lastRequestTime = now;

    // Create the request promise and store it to prevent duplicates
    cache.pendingRequest = (async () => {
      try {
        // Start with the core endpoints that should always exist
        const [breakdownsResponse, statsResponse] = await Promise.all([
          fetch(`${apiConfig.baseUrl}/api/breakdowns/live`, { 
            signal: AbortSignal.timeout(10000) // 10 second timeout
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
        
        // Handle stats response safely
        let statsData = {};
        if (statsResponse && statsResponse.ok) {
          statsData = await statsResponse.json();
        }

        // Try to fetch activity feed using the aggregator
        let activityData = {};
        try {
          // Use the activity aggregator which fetches from multiple sources
          activityData = await fetchAllActivities(25);
          console.log('✅ Fetched activities from multiple sources:', activityData.sources);
        } catch (e) {
          // No fallback - return empty data if unified API fails
          console.log('⚠️ Activity API failed, no fallback:', e.message);
          activityData = {
            activities: [],
            sources: { error: true },
            total: 0,
            timestamp: new Date().toISOString(),
            source: 'error_no_fallback'
          };
        }

        // Calculate stats
        const activeBreakdowns = breakdownsData.breakdowns ? 
          breakdownsData.breakdowns.filter(b => 
            ['active', 'pending', 'in_progress', 'received', 'acknowledged', 'dispatched', 'on_site'].includes(b.status)
          ).length : 0;
        
        const todayTotal = statsData.total || breakdownsData.breakdowns?.length || 0;
        
        // Calculate average response time from breakdowns
        let totalResponseTime = 0;
        let responseCount = 0;
        
        if (breakdownsData.breakdowns) {
          breakdownsData.breakdowns.forEach(breakdown => {
            if (breakdown.acknowledged_at && breakdown.received_at) {
              const responseTime = (new Date(breakdown.acknowledged_at) - new Date(breakdown.received_at)) / (1000 * 60); // in minutes
              totalResponseTime += responseTime;
              responseCount++;
            }
          });
        }
        
        const avgResponseTime = responseCount > 0 ? Math.round(totalResponseTime / responseCount) : 0;
        
        // Calculate fleet health (simplified)
        const fleetHealth = 100 - Math.min(activeBreakdowns * 2, 20); // Rough calculation

        // Process activities
        let activities = [];

        // Use activity feed if available
        if (activityData.activities && activityData.activities.length > 0) {
          activities = activityData.activities.slice(0, 25);
        } else if (breakdownsData.breakdowns && breakdownsData.breakdowns.length > 0) {
          // Fallback to breakdown data
          activities = breakdownsData.breakdowns
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 10)
            .map(breakdown => ({
              id: breakdown.id || breakdown.breakdown_id,
              icon: breakdown.severity === 'STOP' ? '🚨' : breakdown.severity === 'AMBER' ? '⚡' : '⚠️',
              message: `${breakdown.supervisor_name || 'Supervisor'} reported ${breakdown.issue_category || 'breakdown'} on ${breakdown.fleet_no || 'vehicle'}`,
              time: formatTimeFromTimestamp(breakdown.created_at),
              timestamp: breakdown.created_at,
              depot: breakdown.depot || 'Unknown',
              decision: breakdown.severity,
              severity: breakdown.severity === 'STOP' ? 'critical' : breakdown.severity === 'AMBER' ? 'warning' : 'normal',
              source: 'breakdowns',
              priority: 1
            }));
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
            sources: activityData.sources || {
              breakdowns: true,
              assessments: false,
              engineering: false,
              decisions: false,
              audit: false
            },
            totalActivities: activities.length,
            lastUpdated: new Date().toISOString()
          }
        };

        // Record success and cache the result
        recordSuccess();
        cache.cachedData = result;
        cache.pendingRequest = null;

        return result;
      } catch (error) {
        // Record failure
        recordFailure();
        console.error('Dashboard data fetch error:', error.message);
        
        // Clear pending request
        cache.pendingRequest = null;
        
        // Return cached data if available, otherwise defaults
        return cache.cachedData || getDefaultData();
      }
    })();

    // Return the pending request promise
    return await cache.pendingRequest;

  } catch (error) {
    console.error('Unexpected error in fetchDashboardData:', error);
    // Clear pending request on error
    if (window.dashboardRequestCache) {
      window.dashboardRequestCache.pendingRequest = null;
    }
    return getDefaultData();
  }
}

// Helper function to get default data
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

// Helper function to format timestamps consistently
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

// Export the manager for debugging
export const dataManager = window.homepageDataManager;
