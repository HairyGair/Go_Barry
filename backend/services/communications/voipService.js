/*
 * Go Barry - VoIP Service
 * Handles 8x8 VoIP integration and call management
 */

import { createClient } from '@supabase/supabase-js';
import { circuitBreaker } from '../middleware/errorHandler.js';

// Mock data for development - replace with real 8x8 API integration
const mockCallHistory = [
  {
    id: '1',
    direction: 'outbound',
    number: '+441912775555',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    duration: 180,
    status: 'completed'
  },
  {
    id: '2',
    direction: 'inbound',
    number: '+441234567890',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    duration: 240,
    status: 'completed'
  },
  {
    id: '3',
    direction: 'outbound',
    number: '101',
    timestamp: new Date(Date.now() - 10800000).toISOString(),
    duration: 90,
    status: 'completed'
  }
];

const mockContacts = [
  {
    id: '1',
    name: 'Control Room',
    number: '+441912775555',
    department: 'Operations',
    email: 'control@gonortheast.com'
  },
  {
    id: '2',
    name: 'John Smith',
    number: '+441234567890',
    department: 'Transport',
    email: 'j.smith@gonortheast.com'
  },
  {
    id: '3',
    name: 'Emergency Depot',
    number: '+441912775556',
    department: 'Maintenance',
    email: 'depot@gonortheast.com'
  },
  {
    id: '4',
    name: 'Sarah Jones',
    number: '+447700900123',
    department: 'HR',
    email: 's.jones@gonortheast.com'
  },
  {
    id: '5',
    name: 'IT Helpdesk',
    number: '+441912775558',
    department: 'IT',
    email: 'it@gonortheast.com'
  }
];

class VoIPService {
  constructor() {
    this.name = 'VoIP Service';
    this.baseURL = process.env.EIGHTBYEIGHT_API_URL || 'https://api.8x8.com/v1';
    this.apiKey = process.env.EIGHTBYEIGHT_API_KEY;
    this.activeCallSessions = new Map();
    
    // Initialize Supabase if available
    if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
      this.supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
      );
    }
  }

  // Wrapped service methods with circuit breaker
  getCallHistory = circuitBreaker(
    async (supervisorId) => {
      console.log('📞 Fetching call history for supervisor:', supervisorId);
      
      // In production, this would fetch from 8x8 API
      // For now, return mock data
      return {
        success: true,
        history: mockCallHistory,
        totalCalls: mockCallHistory.length,
        supervisorId
      };
    },
    { serviceName: 'voip-history' }
  );

  getContacts = circuitBreaker(
    async (supervisorId) => {
      console.log('📇 Fetching contacts for supervisor:', supervisorId);
      
      // In production, this would fetch from 8x8 API or corporate directory
      // For now, return mock data
      return {
        success: true,
        contacts: mockContacts,
        totalContacts: mockContacts.length,
        supervisorId
      };
    },
    { serviceName: 'voip-contacts' }
  );

  makeCall = circuitBreaker(
    async (callData) => {
      const { from, to, supervisorId } = callData;
      
      console.log('☎️ Initiating call:', { from, to, supervisorId });
      
      // Generate a unique call session ID
      const callSessionId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Store call session
      this.activeCallSessions.set(callSessionId, {
        id: callSessionId,
        from,
        to,
        supervisorId,
        startTime: new Date().toISOString(),
        status: 'initiating',
        direction: 'outbound'
      });
      
      // Log to Supabase if available
      if (this.supabase) {
        try {
          await this.supabase.from('voip_sessions').insert({
            session_id: callSessionId,
            supervisor_id: supervisorId,
            phone_number: to,
            direction: 'outbound',
            status: 'initiating',
            started_at: new Date().toISOString()
          });
        } catch (error) {
          console.error('Error logging to Supabase:', error);
        }
      }
      
      // In production, this would initiate call via 8x8 API
      // For now, simulate success
      return {
        success: true,
        callSessionId,
        message: 'Call initiated successfully',
        webUrl: `https://8x8.com/webphone?dial=${encodeURIComponent(to)}`
      };
    },
    { serviceName: 'voip-make-call' }
  );

  endCall = circuitBreaker(
    async (callSessionId) => {
      console.log('📴 Ending call:', callSessionId);
      
      const session = this.activeCallSessions.get(callSessionId);
      if (!session) {
        throw new Error('Call session not found');
      }
      
      // Calculate call duration
      const duration = Math.floor((Date.now() - new Date(session.startTime).getTime()) / 1000);
      
      // Update session
      session.status = 'ended';
      session.endTime = new Date().toISOString();
      session.duration = duration;
      
      // Update in Supabase if available
      if (this.supabase) {
        try {
          await this.supabase
            .from('voip_sessions')
            .update({
              status: 'ended',
              ended_at: new Date().toISOString(),
              duration_seconds: duration
            })
            .eq('session_id', callSessionId);
        } catch (error) {
          console.error('Error updating Supabase:', error);
        }
      }
      
      // Remove from active sessions
      this.activeCallSessions.delete(callSessionId);
      
      return {
        success: true,
        callSessionId,
        duration,
        message: 'Call ended successfully'
      };
    },
    { serviceName: 'voip-end-call' }
  );

  getActiveCall = circuitBreaker(
    async (supervisorId) => {
      console.log('📱 Getting active call for supervisor:', supervisorId);
      
      // Find active call for supervisor
      for (const [sessionId, session] of this.activeCallSessions.entries()) {
        if (session.supervisorId === supervisorId && session.status !== 'ended') {
          return {
            success: true,
            activeCall: session
          };
        }
      }
      
      return {
        success: true,
        activeCall: null
      };
    },
    { serviceName: 'voip-active-call' }
  );

  updateCallStatus = circuitBreaker(
    async (callSessionId, status) => {
      console.log('🔄 Updating call status:', { callSessionId, status });
      
      const session = this.activeCallSessions.get(callSessionId);
      if (!session) {
        throw new Error('Call session not found');
      }
      
      session.status = status;
      session.lastUpdated = new Date().toISOString();
      
      // Update in Supabase if available
      if (this.supabase) {
        try {
          await this.supabase
            .from('voip_sessions')
            .update({
              status,
              last_updated: new Date().toISOString()
            })
            .eq('session_id', callSessionId);
        } catch (error) {
          console.error('Error updating Supabase:', error);
        }
      }
      
      return {
        success: true,
        callSessionId,
        status,
        message: 'Call status updated successfully'
      };
    },
    { serviceName: 'voip-update-status' }
  );

  searchContacts = circuitBreaker(
    async (query) => {
      console.log('🔍 Searching contacts:', query);
      
      const searchTerm = query.toLowerCase();
      const results = mockContacts.filter(contact =>
        contact.name.toLowerCase().includes(searchTerm) ||
        contact.number.includes(searchTerm) ||
        contact.department.toLowerCase().includes(searchTerm)
      );
      
      return {
        success: true,
        contacts: results,
        query,
        totalResults: results.length
      };
    },
    { serviceName: 'voip-search-contacts' }
  );

  addContact = circuitBreaker(
    async (contactData) => {
      console.log('➕ Adding new contact:', contactData);
      
      const newContact = {
        id: Date.now().toString(),
        ...contactData,
        createdAt: new Date().toISOString()
      };
      
      // In production, this would save to 8x8 API or corporate directory
      mockContacts.push(newContact);
      
      return {
        success: true,
        contact: newContact,
        message: 'Contact added successfully'
      };
    },
    { serviceName: 'voip-add-contact' }
  );

  getCallStatistics = circuitBreaker(
    async (supervisorId, dateRange) => {
      console.log('📊 Getting call statistics:', { supervisorId, dateRange });
      
      // Calculate mock statistics
      const stats = {
        totalCalls: mockCallHistory.length,
        outboundCalls: mockCallHistory.filter(c => c.direction === 'outbound').length,
        inboundCalls: mockCallHistory.filter(c => c.direction === 'inbound').length,
        totalDuration: mockCallHistory.reduce((sum, call) => sum + call.duration, 0),
        averageDuration: Math.round(mockCallHistory.reduce((sum, call) => sum + call.duration, 0) / mockCallHistory.length),
        dateRange
      };
      
      return {
        success: true,
        statistics: stats,
        supervisorId
      };
    },
    { serviceName: 'voip-statistics' }
  );

  // Health check for service status
  healthCheck = async () => {
    const health = {
      service: 'VoIP Service',
      status: 'operational',
      timestamp: new Date().toISOString(),
      features: {
        callHistory: true,
        contacts: true,
        makeCall: true,
        webIntegration: true
      },
      activeCallSessions: this.activeCallSessions.size,
      apiConnection: !!this.apiKey ? 'configured' : 'mock-mode'
    };
    
    return health;
  };
}

// Export singleton instance
export const voipService = new VoIPService();