// ETA Request System - Backend API Endpoints
// Add this to your existing breakdownTrackerV2.js or create as separate module
// Location: /backend/routes/etaRequestSystem.js

const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// WebSocket setup (add to your main server file)
const socketIO = require('socket.io');
let io; // Will be initialized from main server

// Initialize Socket.IO (call this from your main server file)
function initializeSocketIO(server) {
  io = socketIO(server, {
    cors: {
      origin: ["http://localhost:3000", "https://go-barry.onrender.com"],
      methods: ["GET", "POST"]
    }
  });
  
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Join rooms based on user type
    socket.on('join-room', (room) => {
      socket.join(room);
      console.log(`Socket ${socket.id} joined room: ${room}`);
    });
    
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
  
  return io;
}

// Request ETA from Engineering
router.post('/breakdowns/:id/request-eta', async (req, res) => {
  const { id: breakdown_id } = req.params;
  const { 
    requested_by, 
    urgency_level = 'normal', 
    notes,
    fleet_number,
    location,
    depot_id
  } = req.body;
  
  try {
    // Check if there's already a pending request
    const { data: existingRequest } = await supabase
      .from('eta_requests')
      .select('*')
      .eq('breakdown_id', breakdown_id)
      .eq('status', 'pending')
      .single();
    
    if (existingRequest) {
      // Update urgency if needed
      if (urgency_level === 'critical' || 
          (urgency_level === 'urgent' && existingRequest.urgency_level === 'normal')) {
        await supabase
          .from('eta_requests')
          .update({ urgency_level })
          .eq('id', existingRequest.id);
      }
      
      return res.json({ 
        success: true, 
        message: 'ETA request already pending',
        request_id: existingRequest.id 
      });
    }
    
    // Create new ETA request
    const { data: etaRequest, error } = await supabase
      .from('eta_requests')
      .insert({
        breakdown_id,
        requested_by,
        urgency_level,
        notes,
        status: 'pending'
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Update breakdown record
    await supabase
      .from('breakdowns')
      .update({ 
        eta_requested: true,
        eta_requested_at: new Date().toISOString()
      })
      .eq('breakdown_id', breakdown_id);
    
    // Send real-time notification to engineering
    if (io) {
      io.to('engineering').emit('eta-request', {
        request_id: etaRequest.id,
        breakdown_id,
        fleet_number,
        location,
        depot_id,
        urgency: urgency_level,
        requested_by,
        notes,
        timestamp: new Date().toISOString()
      });
    }
    
    // Log the request
    console.log(`ETA Request created: ${breakdown_id} - ${urgency_level}`);
    
    res.json({ 
      success: true, 
      request_id: etaRequest.id,
      message: 'ETA request sent to Engineering'
    });
    
  } catch (error) {
    console.error('Error creating ETA request:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Engineer provides ETA
router.post('/breakdowns/:id/provide-eta', async (req, res) => {
  const { id: breakdown_id } = req.params;
  const { 
    engineer_badge, 
    engineer_name,
    estimated_minutes, 
    notes 
  } = req.body;
  
  try {
    // Calculate ETA timestamp
    const eta_timestamp = new Date();
    eta_timestamp.setMinutes(eta_timestamp.getMinutes() + parseInt(estimated_minutes));
    
    // Update the pending request
    const { data: updatedRequest, error: updateError } = await supabase
      .from('eta_requests')
      .update({
        responded_by: engineer_badge,
        responded_at: new Date().toISOString(),
        estimated_arrival: eta_timestamp.toISOString(),
        response_notes: notes,
        status: 'responded'
      })
      .eq('breakdown_id', breakdown_id)
      .eq('status', 'pending')
      .select()
      .single();
    
    if (updateError) throw updateError;
    
    // Update breakdown record
    await supabase
      .from('breakdowns')
      .update({
        engineer_eta: eta_timestamp.toISOString(),
        engineer_assigned: engineer_badge
      })
      .eq('breakdown_id', breakdown_id);
    
    // Get breakdown details for notification
    const { data: breakdown } = await supabase
      .from('breakdowns')
      .select('fleet_no, location, depot_id')
      .eq('breakdown_id', breakdown_id)
      .single();
    
    // Notify SDC
    if (io) {
      io.to('sdc').emit('eta-provided', {
        breakdown_id,
        fleet_number: breakdown.fleet_no,
        engineer: engineer_badge,
        engineer_name,
        eta_minutes: estimated_minutes,
        eta_time: eta_timestamp.toISOString(),
        notes
      });
    }
    
    res.json({ 
      success: true,
      eta_time: eta_timestamp.toISOString(),
      message: `ETA set: ${estimated_minutes} minutes`
    });
    
  } catch (error) {
    console.error('Error providing ETA:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get pending ETA requests (for engineering dashboard)
router.get('/eta-requests/pending', async (req, res) => {
  try {
    const { data: requests, error } = await supabase
      .from('active_eta_requests')
      .select('*')
      .order('minutes_waiting', { ascending: false });
    
    if (error) throw error;
    
    res.json({
      success: true,
      requests,
      count: requests.length
    });
    
  } catch (error) {
    console.error('Error fetching pending requests:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Cancel ETA request
router.post('/eta-requests/:id/cancel', async (req, res) => {
  const { id } = req.params;
  const { cancelled_by, reason } = req.body;
  
  try {
    const { data, error } = await supabase
      .from('eta_requests')
      .update({
        status: 'cancelled',
        response_notes: `Cancelled by ${cancelled_by}: ${reason}`
      })
      .eq('id', id)
      .eq('status', 'pending');
    
    if (error) throw error;
    
    // Notify engineering
    if (io) {
      io.to('engineering').emit('eta-cancelled', { request_id: id });
    }
    
    res.json({ success: true });
    
  } catch (error) {
    console.error('Error cancelling request:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Auto-escalate old requests (run as cron job)
router.post('/eta-requests/escalate', async (req, res) => {
  try {
    // Call the database function to escalate old requests
    const { error } = await supabase.rpc('escalate_old_eta_requests');
    
    if (error) throw error;
    
    // Get escalated requests to notify
    const { data: escalated } = await supabase
      .from('eta_requests')
      .select('*, breakdowns!inner(fleet_no, location)')
      .eq('status', 'pending')
      .in('urgency_level', ['urgent', 'critical'])
      .gte('requested_at', new Date(Date.now() - 20 * 60000).toISOString());
    
    // Notify engineering of escalations
    if (io && escalated && escalated.length > 0) {
      escalated.forEach(request => {
        io.to('engineering').emit('eta-escalated', {
          request_id: request.id,
          breakdown_id: request.breakdown_id,
          fleet_number: request.breakdowns.fleet_no,
          urgency_level: request.urgency_level
        });
      });
    }
    
    res.json({ 
      success: true, 
      escalated_count: escalated ? escalated.length : 0 
    });
    
  } catch (error) {
    console.error('Error escalating requests:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get ETA statistics
router.get('/eta-requests/stats', async (req, res) => {
  try {
    // Get statistics
    const { data: stats } = await supabase
      .from('eta_requests')
      .select('status, urgency_level')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60000).toISOString());
    
    const summary = {
      total_24h: stats.length,
      pending: stats.filter(r => r.status === 'pending').length,
      responded: stats.filter(r => r.status === 'responded').length,
      critical: stats.filter(r => r.urgency_level === 'critical').length,
      urgent: stats.filter(r => r.urgency_level === 'urgent').length
    };
    
    // Calculate average response time
    const { data: responseTimes } = await supabase
      .from('eta_requests')
      .select('requested_at, responded_at')
      .eq('status', 'responded')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60000).toISOString());
    
    if (responseTimes && responseTimes.length > 0) {
      const avgMinutes = responseTimes.reduce((sum, r) => {
        const requested = new Date(r.requested_at);
        const responded = new Date(r.responded_at);
        return sum + (responded - requested) / 60000;
      }, 0) / responseTimes.length;
      
      summary.avg_response_minutes = Math.round(avgMinutes);
    }
    
    res.json({ success: true, stats: summary });
    
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = {
  router,
  initializeSocketIO
};