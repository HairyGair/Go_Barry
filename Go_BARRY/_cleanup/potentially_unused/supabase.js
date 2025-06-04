// Go_BARRY/services/supabase.js
// Simplified SupaBase integration without real-time (for React Native compatibility)

// Simple HTTP-based SupaBase client for React Native
class SimpleSupabaseClient {
  constructor(url, key) {
    this.url = url;
    this.key = key;
    this.headers = {
      'Content-Type': 'application/json',
      'apikey': key,
      'Authorization': `Bearer ${key}`
    };
  }

  // Simple GET request to SupaBase REST API
  async select(table, options = {}) {
    try {
      let url = `${this.url}/rest/v1/${table}`;
      const params = new URLSearchParams();

      // Add select fields
      if (options.select) {
        params.append('select', options.select);
      } else {
        params.append('select', '*');
      }

      // Add filters
      if (options.eq) {
        Object.entries(options.eq).forEach(([key, value]) => {
          params.append(key, `eq.${value}`);
        });
      }

      // Add ordering
      if (options.order) {
        params.append('order', options.order);
      }

      // Add limit
      if (options.limit) {
        params.append('limit', options.limit);
      }

      url += `?${params.toString()}`;

      console.log('📊 SupaBase GET:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: this.headers,
        // Add timeout for React Native
        signal: AbortSignal.timeout ? AbortSignal.timeout(10000) : undefined
      });

      console.log('📊 SupaBase response status:', response.status);
      console.log('📊 SupaBase response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ SupaBase error response:', errorText);
        
        let errorMessage = `SupaBase error: ${response.status}`;
        
        if (response.status === 401) {
          errorMessage += ' - Authentication failed. Check your API key.';
        } else if (response.status === 403) {
          errorMessage += ' - Access forbidden. Check Row Level Security policies.';
        } else if (response.status === 404) {
          errorMessage += ' - Table not found. Check table name and database setup.';
        } else {
          errorMessage += ` - ${errorText}`;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log(`✅ SupaBase returned ${data.length} records`);

      return { data, error: null };
    } catch (error) {
      console.error('❌ SupaBase select error:', error);
      
      // Provide more specific error messages
      if (error.message.includes('Network request failed')) {
        console.error('💡 Network error suggestions:');
        console.error('   1. Check internet connection');
        console.error('   2. Check if SupaBase project is active');
        console.error('   3. Try running the debug script');
        console.error('   4. Check Row Level Security policies');
      }
      
      return { data: null, error };
    }
  }

  // Simple POST request to insert data
  async insert(table, data) {
    try {
      const url = `${this.url}/rest/v1/${table}`;

      console.log('📝 SupaBase INSERT:', table);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...this.headers,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`SupaBase error: ${response.status} - ${error}`);
      }

      const result = await response.json();
      console.log('✅ SupaBase insert successful');

      return { data: result, error: null };
    } catch (error) {
      console.error('❌ SupaBase insert error:', error);
      return { data: null, error };
    }
  }

  // Simple health check
  async healthCheck() {
    try {
      const result = await this.select('traffic_alerts', { limit: 1 });
      return {
        status: result.error ? 'error' : 'healthy',
        connected: !result.error,
        error: result.error?.message
      };
    } catch (error) {
      return {
        status: 'error',
        connected: false,
        error: error.message
      };
    }
  }
}

// Configuration - replace with your actual SupaBase details
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://haountnqhecfrsonivbq.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'fallback-key-here';

// Simple traffic service for React Native
class SimpleSupabaseTrafficService {
  constructor() {
    // Check if we have valid config
    if (SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_ANON_KEY !== 'PUT_YOUR_ANON_KEY_HERE') {
      this.client = new SimpleSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      this.enabled = true;
      console.log('✅ SupaBase configured and enabled');
    } else {
      this.enabled = false;
      console.log('⚠️ SupaBase API key missing - add your anon key to enable live data');
      console.log('📍 Go to: https://supabase.com/dashboard → Settings → API → Copy anon public key');
    }
  }

  async getAlerts(filters = {}) {
    if (!this.enabled) {
      throw new Error('SupaBase not configured - using sample data');
    }

    try {
      console.log('📊 Fetching alerts from SupaBase...');

      const options = {
        select: '*',
        order: 'created_at.desc'
      };

      // Apply filters
      if (filters.type) {
        options.eq = { ...options.eq, type: filters.type };
      }

      if (filters.status) {
        options.eq = { ...options.eq, status: filters.status };
      }

      if (filters.severity) {
        options.eq = { ...options.eq, severity: filters.severity };
      }

      const result = await this.client.select('traffic_alerts', options);

      if (result.error) {
        throw result.error;
      }

      console.log(`✅ Fetched ${result.data.length} alerts from SupaBase`);

      return {
        success: true,
        data: {
          alerts: this.transformAlertsForApp(result.data),
          metadata: {
            totalAlerts: result.data.length,
            lastUpdated: new Date().toISOString(),
            dataSource: 'supabase_simple',
            filters: filters
          }
        }
      };
    } catch (error) {
      console.error('❌ SupaBase fetch error:', error);
      throw error;
    }
  }

  // Transform SupaBase data to match app expectations
  transformAlertsForApp(alerts) {
    return alerts.map(alert => ({
      id: alert.id,
      title: alert.title,
      description: alert.description,
      location: alert.location,
      authority: alert.authority,
      type: alert.type,
      severity: alert.severity,
      status: alert.status,
      source: alert.source,
      affectsRoutes: alert.affects_routes || [],
      startDate: alert.start_date,
      endDate: alert.end_date,
      lastUpdated: alert.last_updated,

      // Traffic-specific fields
      congestionLevel: alert.congestion_level,
      currentSpeed: alert.current_speed,
      freeFlowSpeed: alert.free_flow_speed,
      jamFactor: alert.jam_factor,
      delayMinutes: alert.delay_minutes,
      incidentType: alert.incident_type,
      roadClosed: alert.road_closed,
      estimatedClearTime: alert.estimated_clear_time,

      // Metadata
      confidence: alert.confidence,
      dataSource: alert.data_source
    }));
  }

  async getActiveAlerts() {
    try {
      const result = await this.getAlerts({ status: 'red' });
      return {
        success: true,
        alerts: result.data.alerts,
        metadata: {
          count: result.data.alerts.length,
          dataSource: 'supabase_active'
        }
      };
    } catch (error) {
      console.error('❌ Active alerts fetch error:', error);
      throw error;
    }
  }

  async getAlertsByType(type) {
    return this.getAlerts({ type });
  }

  async healthCheck() {
    if (!this.enabled) {
      return {
        status: 'disabled',
        connected: false,
        message: 'SupaBase not configured - using sample data mode'
      };
    }

    return this.client.healthCheck();
  }

  // No real-time in this simple version
  subscribeToUpdates() {
    console.log('⚠️ Real-time updates not available in simplified mode');
    return () => {}; // Return empty unsubscribe function
  }

  addUpdateListener() {
    console.log('⚠️ Real-time updates not available in simplified mode');
    return () => {}; // Return empty unsubscribe function
  }

  unsubscribeFromUpdates() {
    // No-op in simple mode
  }
}

// Export singleton instance
export const supabaseTrafficService = new SimpleSupabaseTrafficService();

// Export the class for testing
export { SimpleSupabaseTrafficService };