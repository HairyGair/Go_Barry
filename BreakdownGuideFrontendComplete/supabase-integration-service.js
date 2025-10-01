/*
 * Enhanced Supabase Integration Service for Go BARRY Breakdown Management
 * Production-ready with real-time subscriptions, caching, and error handling
 * 
 * Copyright (c) 2025 Anthony Gair. All rights reserved.
 */

import { createClient } from '@supabase/supabase-js';

class BreakdownSupabaseService {
  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL || window.SUPABASE_URL;
    this.supabaseAnonKey = process.env.SUPABASE_ANON_KEY || window.SUPABASE_ANON_KEY;
    this.supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || window.SUPABASE_SERVICE_KEY;
    
    this.client = null;
    this.serviceClient = null;
    this.subscriptions = new Map();
    this.cache = new Map();
    this.isInitialized = false;
    this.retryAttempts = 0;
    this.maxRetries = 3;
    
    // Performance monitoring
    this.metrics = {
      queries: 0,
      errors: 0,
      cacheHits: 0,
      subscriptions: 0,
      lastError: null
    };
    
    this.init();
  }

  async init() {
    try {
      if (!this.supabaseUrl || !this.supabaseAnonKey) {
        console.error('❌ Supabase configuration missing');
        throw new Error('Supabase URL and Anon Key required');
      }

      // Create main client
      this.client = createClient(this.supabaseUrl, this.supabaseAnonKey, {
        auth: {
          persistSession: typeof window !== 'undefined', // Persist only in browser
          autoRefreshToken: true,
          detectSessionInUrl: false
        },
        realtime: {
          params: {
            eventsPerSecond: 5
          }
        },
        global: {
          headers: {
            'X-Client-Info': 'go-barry-breakdown-frontend-v2'
          }
        }
      });

      // Create service client if available
      if (this.supabaseServiceKey) {
        this.serviceClient = createClient(this.supabaseUrl, this.supabaseServiceKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false
          },
          global: {
            headers: {
              'X-Client-Info': 'go-barry-breakdown-service-v2'
            }
          }
        });
      }

      // Test connection
      await this.testConnection();
      this.isInitialized = true;
      console.log('✅ Supabase Breakdown Service initialized');
      
      return true;
    } catch (error) {
      console.error('❌ Supabase initialization failed:', error);
      this.metrics.lastError = error.message;
      return false;
    }
  }

  async testConnection() {
    try {
      const { data, error } = await this.client
        .from('breakdowns')
        .select('count')
        .limit(1);

      if (error && !error.message.includes('relation "breakdowns" does not exist')) {
        throw error;
      }

      console.log('✅ Supabase connection test passed');
      return true;
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      throw error;
    }
  }

  // =====================================================
  // AUTHENTICATION
  // =====================================================

  async loginSupervisor(badge, password) {
    try {
      this.metrics.queries++;
      
      // For development, use simple badge-based auth
      // In production, implement proper password authentication
      const { data: supervisor, error } = await this.client
        .from('supervisors')
        .select('*')
        .eq('badge', badge.toUpperCase())
        .eq('active', true)
        .single();

      if (error || !supervisor) {
        throw new Error('Invalid supervisor badge or inactive account');
      }

      // Create session
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const session = {
        supervisorId: supervisor.badge,
        supervisorName: supervisor.name,
        role: supervisor.role,
        sessionId,
        depot: supervisor.depot_id,
        loginTime: new Date().toISOString(),
        lastActivity: new Date().toISOString()
      };

      // Store session in database
      await this.client
        .from('supervisor_sessions')
        .insert({
          session_id: sessionId,
          supervisor_badge: supervisor.badge,
          supervisor_name: supervisor.name,
          active: true,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        });

      // Update supervisor last login
      await this.client
        .from('supervisors')
        .update({ 
          last_login: new Date().toISOString(),
          session_data: session
        })
        .eq('badge', supervisor.badge);

      // Store session locally
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('gobarry_supervisor_session', JSON.stringify(session));
      }

      console.log(`✅ Supervisor ${badge} logged in successfully`);
      return { success: true, session, supervisor };
    } catch (error) {
      console.error('❌ Login failed:', error);
      this.metrics.errors++;
      this.metrics.lastError = error.message;
      return { success: false, error: error.message };
    }
  }

  async verifySession(sessionId) {
    try {
      const { data: session, error } = await this.client
        .from('supervisor_sessions')
        .select('*, supervisors!inner(*)')
        .eq('session_id', sessionId)
        .eq('active', true)
        .gte('expires_at', new Date().toISOString())
        .single();

      if (error || !session) {
        return { valid: false, error: 'Session not found or expired' };
      }

      // Update last activity
      await this.client
        .from('supervisor_sessions')
        .update({ 
          last_activity: new Date().toISOString(),
          last_heartbeat: new Date().toISOString()
        })
        .eq('session_id', sessionId);

      return { 
        valid: true, 
        supervisor: session.supervisors,
        session: {
          sessionId: session.session_id,
          supervisorId: session.supervisor_badge,
          supervisorName: session.supervisor_name,
          role: session.supervisors.role,
          depot: session.supervisors.depot_id
        }
      };
    } catch (error) {
      console.error('❌ Session verification failed:', error);
      return { valid: false, error: error.message };
    }
  }

  // =====================================================
  // BREAKDOWN OPERATIONS
  // =====================================================

  async createBreakdown(breakdownData) {
    try {
      this.metrics.queries++;
      
      const {
        fleet_number,
        supervisor_badge,
        supervisor_name,
        location,
        location_coords,
        location_w3w,
        location_type = 'route',
        depot_id = 'Washington',
        route_number,
        wizard_type = 'general'
      } = breakdownData;

      // Convert coordinates for PostGIS if provided
      let locationPoint = null;
      if (location_coords && location_coords.lat && location_coords.lng) {
        locationPoint = `POINT(${location_coords.lng} ${location_coords.lat})`;
      }

      // Call the database function
      const { data, error } = await this.client
        .rpc('create_breakdown', {
          p_fleet_number: fleet_number,
          p_supervisor_badge: supervisor_badge,
          p_supervisor_name: supervisor_name,
          p_location: location,
          p_location_coords: locationPoint,
          p_depot_id: depot_id,
          p_route_id: route_number,
          p_wizard_type: wizard_type
        });

      if (error) throw error;

      // Clear cache
      this.clearCacheByPattern('breakdowns_');
      
      console.log(`✅ Breakdown created: ${data.breakdown_id}`);
      return { success: true, ...data };
    } catch (error) {
      console.error('❌ Create breakdown failed:', error);
      this.metrics.errors++;
      this.metrics.lastError = error.message;
      return { success: false, error: error.message };
    }
  }

  async updateBreakdownLocation(breakdownId, locationData) {
    try {
      this.metrics.queries++;
      
      const {
        location,
        location_coords,
        location_w3w,
        location_type,
        location_verified = false,
        updated_by
      } = locationData;

      let locationPoint = null;
      if (location_coords && location_coords.lat && location_coords.lng) {
        locationPoint = `POINT(${location_coords.lng} ${location_coords.lat})`;
      }

      const updateData = {
        location,
        location_w3w,
        location_type,
        location_verified,
        location_updated_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (locationPoint) {
        updateData.location_coords = locationPoint;
      }

      const { data, error } = await this.client
        .from('breakdowns')
        .update(updateData)
        .eq('breakdown_id', breakdownId)
        .select()
        .single();

      if (error) throw error;

      // Log location update
      await this.client
        .from('breakdown_location_history')
        .insert({
          breakdown_id: breakdownId,
          location,
          location_coords: locationPoint,
          location_w3w,
          location_type,
          updated_by,
          update_source: 'manual'
        });

      // Log event
      await this.logBreakdownEvent(breakdownId, 'location_updated', {
        new_location: location,
        type: location_type,
        verified: location_verified,
        updated_by
      }, updated_by);

      this.clearCacheByPattern('breakdowns_');
      console.log(`✅ Location updated for breakdown ${breakdownId}`);
      return { success: true, breakdown: data };
    } catch (error) {
      console.error('❌ Update location failed:', error);
      this.metrics.errors++;
      return { success: false, error: error.message };
    }
  }

  async logWizardStep(breakdownId, stepData) {
    try {
      this.metrics.queries++;
      
      const { step_type, step_data, timestamp } = stepData;

      // Get current breakdown
      const { data: breakdown, error: fetchError } = await this.client
        .from('breakdowns')
        .select('wizard_steps')
        .eq('breakdown_id', breakdownId)
        .single();

      if (fetchError) throw fetchError;

      // Add new step
      const wizardSteps = breakdown.wizard_steps || [];
      wizardSteps.push({
        type: step_type,
        timestamp: timestamp || new Date().toISOString(),
        data: step_data || {}
      });

      // Update breakdown
      const { error: updateError } = await this.client
        .from('breakdowns')
        .update({
          wizard_steps: wizardSteps,
          updated_at: new Date().toISOString()
        })
        .eq('breakdown_id', breakdownId);

      if (updateError) throw updateError;

      // Log event
      await this.logBreakdownEvent(breakdownId, 'wizard_step', {
        step_type,
        step_data,
        total_steps: wizardSteps.length
      });

      this.clearCacheByPattern('breakdowns_');
      return { success: true, total_steps: wizardSteps.length };
    } catch (error) {
      console.error('❌ Log wizard step failed:', error);
      this.metrics.errors++;
      return { success: false, error: error.message };
    }
  }

  async diagnoseBreakdown(breakdownId, diagnosisData) {
    try {
      this.metrics.queries++;
      
      const {
        diagnosis,
        severity = 'AMBER',
        passenger_cloud_required = false,
        diagnosed_by
      } = diagnosisData;

      const diagnosedAt = new Date().toISOString();

      const { data, error } = await this.client
        .from('breakdowns')
        .update({
          status: 'decision',
          diagnosed_at: diagnosedAt,
          diagnosis,
          severity,
          passenger_cloud_used: passenger_cloud_required,
          updated_at: diagnosedAt
        })
        .eq('breakdown_id', breakdownId)
        .select()
        .single();

      if (error) throw error;

      // Log diagnosis event
      await this.logBreakdownEvent(breakdownId, 'diagnosed', {
        diagnosis,
        severity,
        passenger_cloud_required
      }, diagnosed_by);

      this.clearCacheByPattern('breakdowns_');
      console.log(`✅ Breakdown ${breakdownId} diagnosed as ${severity}`);
      return { success: true, breakdown: data, diagnosed_at: diagnosedAt };
    } catch (error) {
      console.error('❌ Diagnose breakdown failed:', error);
      this.metrics.errors++;
      return { success: false, error: error.message };
    }
  }

  async resolveBreakdown(breakdownId, resolutionData) {
    try {
      this.metrics.queries++;
      
      const {
        resolution_notes,
        resolving_supervisor,
        returned_to_service = true
      } = resolutionData;

      const resolvedAt = new Date().toISOString();

      const { data, error } = await this.client
        .from('breakdowns')
        .update({
          status: 'cleared',
          resolved_at: resolvedAt,
          resolution_notes,
          resolving_supervisor,
          returned_to_service_at: returned_to_service ? resolvedAt : null,
          updated_at: resolvedAt
        })
        .eq('breakdown_id', breakdownId)
        .select()
        .single();

      if (error) throw error;

      // Log resolution event
      await this.logBreakdownEvent(breakdownId, 'resolved', {
        resolution_notes,
        returned_to_service
      }, resolving_supervisor);

      this.clearCacheByPattern('breakdowns_');
      console.log(`✅ Breakdown ${breakdownId} resolved`);
      return { success: true, breakdown: data, resolved_at: resolvedAt };
    } catch (error) {
      console.error('❌ Resolve breakdown failed:', error);
      this.metrics.errors++;
      return { success: false, error: error.message };
    }
  }

  // =====================================================
  // DATA RETRIEVAL
  // =====================================================

  async getActiveBreakdowns(useCache = true) {
    const cacheKey = 'breakdowns_active';
    
    if (useCache && this.cache.has(cacheKey)) {
      this.metrics.cacheHits++;
      return this.cache.get(cacheKey);
    }

    try {
      this.metrics.queries++;
      
      const { data, error } = await this.client
        .from('active_breakdowns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const result = { success: true, breakdowns: data, total: data.length };
      
      if (useCache) {
        this.cache.set(cacheKey, result);
        setTimeout(() => this.cache.delete(cacheKey), 30000); // 30 second cache
      }

      return result;
    } catch (error) {
      console.error('❌ Get active breakdowns failed:', error);
      this.metrics.errors++;
      return { success: false, error: error.message, breakdowns: [] };
    }
  }

  async getTodayBreakdowns() {
    const cacheKey = 'breakdowns_today';
    
    if (this.cache.has(cacheKey)) {
      this.metrics.cacheHits++;
      return this.cache.get(cacheKey);
    }

    try {
      this.metrics.queries++;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await this.client
        .from('breakdowns')
        .select(`
          *,
          supervisors!inner(name, depot_id),
          fleet_vehicles(make, model, reliability_score)
        `)
        .gte('created_at', today.toISOString())
        .eq('archived', false)
        .order('daily_id', { ascending: true });

      if (error) throw error;

      const result = { success: true, breakdowns: data, total: data.length };
      
      this.cache.set(cacheKey, result);
      setTimeout(() => this.cache.delete(cacheKey), 60000); // 1 minute cache

      return result;
    } catch (error) {
      console.error('❌ Get today breakdowns failed:', error);
      this.metrics.errors++;
      return { success: false, error: error.message, breakdowns: [] };
    }
  }

  async getBreakdownStatistics() {
    const cacheKey = 'breakdown_stats';
    
    if (this.cache.has(cacheKey)) {
      this.metrics.cacheHits++;
      return this.cache.get(cacheKey);
    }

    try {
      this.metrics.queries++;
      
      // Get basic stats
      const { data: activeData } = await this.client
        .from('breakdowns')
        .select('status, severity, created_at, diagnosed_at')
        .eq('archived', false);

      const now = new Date();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const thirtyMinsAgo = new Date(now - 30 * 60 * 1000);

      const stats = {
        active: activeData.filter(b => b.status !== 'cleared').length,
        today: activeData.filter(b => new Date(b.created_at) >= today).length,
        overdue: activeData.filter(b => 
          b.status === 'decision' && 
          b.diagnosed_at && 
          new Date(b.diagnosed_at) <= thirtyMinsAgo
        ).length,
        critical: activeData.filter(b => 
          b.severity === 'STOP' && 
          b.status !== 'cleared'
        ).length,
        timestamp: now.toISOString()
      };

      this.cache.set(cacheKey, stats);
      setTimeout(() => this.cache.delete(cacheKey), 15000); // 15 second cache

      return stats;
    } catch (error) {
      console.error('❌ Get statistics failed:', error);
      this.metrics.errors++;
      return {
        active: 0,
        today: 0,
        overdue: 0,
        critical: 0,
        error: error.message
      };
    }
  }

  async getFleetHistory(fleetNumber, days = 7) {
    try {
      this.metrics.queries++;
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await this.client
        .from('breakdowns')
        .select('*')
        .eq('fleet_no', fleetNumber)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        success: true,
        fleet_number: fleetNumber,
        breakdowns: data,
        count: data.length,
        should_flag: data.length >= 3
      };
    } catch (error) {
      console.error('❌ Get fleet history failed:', error);
      this.metrics.errors++;
      return { success: false, error: error.message, breakdowns: [] };
    }
  }

  // =====================================================
  // REAL-TIME SUBSCRIPTIONS
  // =====================================================

  subscribeToActiveBreakdowns(callback) {
    const subscriptionKey = 'active_breakdowns';
    
    if (this.subscriptions.has(subscriptionKey)) {
      this.subscriptions.get(subscriptionKey).unsubscribe();
    }

    const subscription = this.client
      .channel('breakdown_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'breakdowns',
        filter: 'archived=eq.false'
      }, (payload) => {
        console.log('🔄 Breakdown change detected:', payload);
        this.clearCacheByPattern('breakdowns_');
        callback(payload);
      })
      .subscribe();

    this.subscriptions.set(subscriptionKey, subscription);
    this.metrics.subscriptions++;

    console.log('✅ Subscribed to active breakdowns');
    return subscription;
  }

  subscribeToSupervisorSessions(callback) {
    const subscriptionKey = 'supervisor_sessions';
    
    if (this.subscriptions.has(subscriptionKey)) {
      this.subscriptions.get(subscriptionKey).unsubscribe();
    }

    const subscription = this.client
      .channel('session_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'supervisor_sessions'
      }, (payload) => {
        console.log('🔄 Session change detected:', payload);
        callback(payload);
      })
      .subscribe();

    this.subscriptions.set(subscriptionKey, subscription);
    this.metrics.subscriptions++;

    return subscription;
  }

  unsubscribe(subscriptionKey) {
    if (this.subscriptions.has(subscriptionKey)) {
      this.subscriptions.get(subscriptionKey).unsubscribe();
      this.subscriptions.delete(subscriptionKey);
      console.log(`✅ Unsubscribed from ${subscriptionKey}`);
    }
  }

  unsubscribeAll() {
    this.subscriptions.forEach((subscription, key) => {
      subscription.unsubscribe();
    });
    this.subscriptions.clear();
    console.log('✅ All subscriptions cleared');
  }

  // =====================================================
  // UTILITY FUNCTIONS
  // =====================================================

  async logBreakdownEvent(breakdownId, eventType, eventData = {}, byBadge = 'SYSTEM') {
    try {
      await this.client
        .from('breakdown_events')
        .insert({
          breakdown_id: breakdownId,
          event_type: eventType,
          event_data: eventData,
          by_badge: byBadge,
          occurred_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('❌ Log event failed:', error);
    }
  }

  clearCacheByPattern(pattern) {
    const keysToDelete = [];
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  clearAllCache() {
    this.cache.clear();
  }

  getMetrics() {
    return {
      ...this.metrics,
      cacheSize: this.cache.size,
      subscriptionsActive: this.subscriptions.size,
      isInitialized: this.isInitialized
    };
  }

  getHealthStatus() {
    return {
      service: 'Breakdown Supabase Service',
      initialized: this.isInitialized,
      client: !!this.client,
      serviceClient: !!this.serviceClient,
      metrics: this.getMetrics(),
      timestamp: new Date().toISOString()
    };
  }
}

// Create singleton instance
const breakdownSupabaseService = new BreakdownSupabaseService();

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = breakdownSupabaseService;
} else if (typeof window !== 'undefined') {
  window.BreakdownSupabaseService = breakdownSupabaseService;
}

export default breakdownSupabaseService;