// backend/services/eventMonitor.js
// Major event monitoring service for Go North East disruption management - Supabase version

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

class EventMonitor {
  constructor() {
    this.initializeConnection();
  }

  async initializeConnection() {
    try {
      // Test connection to events table
      const { error } = await supabase
        .from('major_events')
        .select('count', { count: 'exact' })
        .limit(1);
        
      if (error) {
        console.error('❌ EventMonitor: Supabase connection failed:', error);
        return;
      }

      console.log('✅ EventMonitor: Connected to Supabase major_events table');
    } catch (error) {
      console.error('❌ EventMonitor: Failed to initialize:', error);
    }
  }

  // Get currently active events
  async getActiveEvents() {
    try {
      const now = new Date().toISOString();
      
      const { data: activeEvents, error } = await supabase
        .from('major_events')
        .select('*')
        .eq('status', 'active')
        .lte('start_time', now)
        .gte('end_time', now)
        .order('severity', { ascending: true }) // CRITICAL first
        .order('start_time', { ascending: false });

      if (error) {
        console.error('❌ Error getting active events:', error);
        return { active: [], mostSevere: null, count: 0 };
      }

      return {
        active: activeEvents || [],
        mostSevere: activeEvents && activeEvents.length > 0 ? activeEvents[0] : null,
        count: activeEvents ? activeEvents.length : 0
      };
    } catch (error) {
      console.error('❌ Error getting active events:', error);
      return { active: [], mostSevere: null, count: 0 };
    }
  }

  // Add a new event
  async addEvent(eventData) {
    try {
      const event = {
        id: `event_${Date.now()}`,
        title: eventData.title,
        description: eventData.description,
        location: eventData.location,
        start_time: eventData.startTime,
        end_time: eventData.endTime,
        event_type: eventData.type || eventData.eventType,
        severity: eventData.severity,
        affected_routes: eventData.affectedRoutes || [],
        status: eventData.status || 'active',
        created_by: eventData.createdBy,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('major_events')
        .insert(event)
        .select()
        .single();

      if (error) {
        console.error('❌ Error adding event:', error);
        throw new Error(`Failed to add event: ${error.message}`);
      }

      console.log(`✅ Added major event: ${event.title} (${event.id})`);
      return data;
    } catch (error) {
      console.error('❌ Error in addEvent:', error);
      throw error;
    }
  }

  // Update an event
  async updateEvent(eventId, updates) {
    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      // Convert field names to match database schema
      if (updates.startTime) {
        updateData.start_time = updates.startTime;
        delete updateData.startTime;
      }
      if (updates.endTime) {
        updateData.end_time = updates.endTime;
        delete updateData.endTime;
      }
      if (updates.eventType) {
        updateData.event_type = updates.eventType;
        delete updateData.eventType;
      }
      if (updates.affectedRoutes) {
        updateData.affected_routes = updates.affectedRoutes;
        delete updateData.affectedRoutes;
      }

      const { data, error } = await supabase
        .from('major_events')
        .update(updateData)
        .eq('id', eventId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating event:', error);
        throw new Error(`Failed to update event: ${error.message}`);
      }

      if (!data) {
        throw new Error('Event not found');
      }

      console.log(`✅ Updated major event: ${eventId}`);
      return data;
    } catch (error) {
      console.error('❌ Error in updateEvent:', error);
      throw error;
    }
  }

  // Delete an event
  async deleteEvent(eventId) {
    try {
      const { data, error } = await supabase
        .from('major_events')
        .delete()
        .eq('id', eventId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error deleting event:', error);
        throw new Error(`Failed to delete event: ${error.message}`);
      }

      if (!data) {
        throw new Error('Event not found');
      }

      console.log(`✅ Deleted major event: ${eventId}`);
      return data;
    } catch (error) {
      console.error('❌ Error in deleteEvent:', error);
      throw error;
    }
  }

  // Get all events (including past and future)
  async getAllEvents() {
    try {
      const { data, error } = await supabase
        .from('major_events')
        .select('*')
        .order('start_time', { ascending: false });

      if (error) {
        console.error('❌ Error getting all events:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Error getting all events:', error);
      return [];
    }
  }

  // Get upcoming events
  async getUpcomingEvents() {
    try {
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('major_events')
        .select('*')
        .gt('start_time', now)
        .order('start_time', { ascending: true });

      if (error) {
        console.error('❌ Error getting upcoming events:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Error getting upcoming events:', error);
      return [];
    }
  }

  // Event categories configuration
  static getEventCategories() {
    return {
      'MAJOR_VENUES': {
        name: 'Major Venues',
        icon: '🏟️',
        venues: [
          'St James\' Park',
          'Stadium of Light',
          'Utilita Arena',
          'Sage Gateshead',
          'Gateshead International Stadium',
          'City Hall Newcastle',
          'Durham Cricket Ground'
        ]
      },
      'PROTESTS': {
        name: 'Protests & Demonstrations',
        icon: '🪧',
        severity: 'HIGH',
        description: 'Protests at civic centres, town halls, bridges'
      },
      'MARCHES': {
        name: 'Marches & Parades',
        icon: '🚶‍♂️',
        severity: 'MEDIUM',
        description: 'Remembrance Sunday, Pride, football-related marches'
      },
      'FESTIVALS': {
        name: 'Festivals & Fairs',
        icon: '🎪',
        severity: 'MEDIUM',
        description: 'Durham Miners Gala, Sunderland Air Show, local festivals'
      },
      'MARKETS': {
        name: 'Markets & Street Closures',
        icon: '🛍️',
        severity: 'LOW',
        description: 'Christmas Markets, street closures for events'
      },
      'CHARITY': {
        name: 'Charity Events',
        icon: '🏃‍♀️',
        severity: 'HIGH',
        description: 'Great North Run, Race for Life, charity walks'
      },
      'SPORTING': {
        name: 'Sporting Events',
        icon: '⚽',
        severity: 'HIGH',
        description: 'Football matches, rugby games, other sporting events'
      }
    };
  }

  // Check for event conflicts
  async checkEventConflicts(newEvent) {
    try {
      const { data: existingEvents, error } = await supabase
        .from('major_events')
        .select('*')
        .eq('status', 'active');

      if (error) {
        console.error('❌ Error checking event conflicts:', error);
        return [];
      }

      const conflicts = existingEvents.filter(existing => {
        const existingStart = new Date(existing.start_time);
        const existingEnd = new Date(existing.end_time);
        const newStart = new Date(newEvent.startTime || newEvent.start_time);
        const newEnd = new Date(newEvent.endTime || newEvent.end_time);

        // Check time overlap
        const timeOverlap = (newStart <= existingEnd && newEnd >= existingStart);
        
        // Check location proximity (if both have locations)
        const locationConflict = existing.location === newEvent.location;

        return timeOverlap && locationConflict;
      });

      return conflicts;
    } catch (error) {
      console.error('❌ Error checking event conflicts:', error);
      return [];
    }
  }

  // Get events by date range
  async getEventsByDateRange(startDate, endDate) {
    try {
      const { data, error } = await supabase
        .from('major_events')
        .select('*')
        .gte('start_time', startDate)
        .lte('end_time', endDate)
        .order('start_time', { ascending: true });

      if (error) {
        console.error('❌ Error getting events by date range:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Error getting events by date range:', error);
      return [];
    }
  }

  // Get event statistics
  async getEventStatistics() {
    try {
      const { data, error } = await supabase
        .from('major_events')
        .select('*');

      if (error) {
        console.error('❌ Error getting event statistics:', error);
        return {
          total: 0,
          active: 0,
          upcoming: 0,
          past: 0,
          bySeverity: {},
          byType: {}
        };
      }

      const now = new Date();
      const stats = {
        total: data.length,
        active: 0,
        upcoming: 0,
        past: 0,
        bySeverity: {},
        byType: {}
      };

      data.forEach(event => {
        const startTime = new Date(event.start_time);
        const endTime = new Date(event.end_time);

        // Categorize by time
        if (startTime <= now && endTime >= now) {
          stats.active++;
        } else if (startTime > now) {
          stats.upcoming++;
        } else {
          stats.past++;
        }

        // Count by severity
        stats.bySeverity[event.severity] = (stats.bySeverity[event.severity] || 0) + 1;

        // Count by type
        stats.byType[event.event_type] = (stats.byType[event.event_type] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('❌ Error getting event statistics:', error);
      return {
        total: 0,
        active: 0,
        upcoming: 0,
        past: 0,
        bySeverity: {},
        byType: {}
      };
    }
  }
}

// Create singleton instance
const eventMonitor = new EventMonitor();

export default eventMonitor;
