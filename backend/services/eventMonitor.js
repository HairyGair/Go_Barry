// backend/services/eventMonitor.js
// Major event monitoring service for Go North East disruption management

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class EventMonitor {
  constructor() {
    this.eventsFile = path.join(__dirname, '../data/major-events.json');
    this.events = [];
    this.loadEvents();
  }

  async loadEvents() {
    try {
      const data = await fs.readFile(this.eventsFile, 'utf8');
      this.events = JSON.parse(data);
    } catch (error) {
      // Initialize with default events structure
      this.events = [];
      await this.saveEvents();
    }
  }

  async saveEvents() {
    await fs.writeFile(this.eventsFile, JSON.stringify(this.events, null, 2));
  }

  // Get currently active events
  async getActiveEvents() {
    const now = new Date();
    const activeEvents = this.events.filter(event => {
      const eventStart = new Date(event.startTime);
      const eventEnd = new Date(event.endTime);
      return eventStart <= now && eventEnd >= now;
    });

    // Sort by severity and return
    activeEvents.sort((a, b) => {
      const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      return (severityOrder[a.severity] || 999) - (severityOrder[b.severity] || 999);
    });

    return {
      active: activeEvents,
      mostSevere: activeEvents[0] || null,
      count: activeEvents.length
    };
  }

  // Add a new event
  async addEvent(eventData) {
    const event = {
      id: `event_${Date.now()}`,
      ...eventData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.events.push(event);
    await this.saveEvents();
    return event;
  }

  // Update an event
  async updateEvent(eventId, updates) {
    const index = this.events.findIndex(e => e.id === eventId);
    if (index === -1) {
      throw new Error('Event not found');
    }

    this.events[index] = {
      ...this.events[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await this.saveEvents();
    return this.events[index];
  }

  // Delete an event
  async deleteEvent(eventId) {
    const index = this.events.findIndex(e => e.id === eventId);
    if (index === -1) {
      throw new Error('Event not found');
    }

    const deleted = this.events.splice(index, 1)[0];
    await this.saveEvents();
    return deleted;
  }

  // Get all events (including past and future)
  async getAllEvents() {
    return this.events;
  }

  // Get upcoming events
  async getUpcomingEvents() {
    const now = new Date();
    return this.events.filter(event => new Date(event.startTime) > now);
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
    const conflicts = this.events.filter(existing => {
      const existingStart = new Date(existing.startTime);
      const existingEnd = new Date(existing.endTime);
      const newStart = new Date(newEvent.startTime);
      const newEnd = new Date(newEvent.endTime);

      // Check time overlap
      const timeOverlap = (newStart <= existingEnd && newEnd >= existingStart);
      
      // Check location proximity (if both have locations)
      const locationConflict = existing.venue === newEvent.venue || 
                             existing.location === newEvent.location;

      return timeOverlap && locationConflict;
    });

    return conflicts;
  }
}

// Create singleton instance
const eventMonitor = new EventMonitor();

export default eventMonitor;