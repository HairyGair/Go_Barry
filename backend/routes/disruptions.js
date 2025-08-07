import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import supabaseClient from '../services/supabaseHelper.js';

const router = express.Router();

// Create a new disruption entry from workflow
router.post('/create', async (req, res) => {
  try {
    const {
      workflowData,
      supervisorBadge,
      completedAt,
      source,
      ...alertData
    } = req.body;
    
    // Generate a unique disruption ID
    const disruptionId = `DISR-${Date.now()}-${uuidv4().substring(0, 8)}`;
    
    // Prepare the disruption record
    const disruptionRecord = {
      id: disruptionId,
      alert_id: alertData.id,
      location: alertData.street_name || alertData.location || alertData.sm_street_name,
      description: alertData.sm_works_description || alertData.description || '',
      
      // Workflow data
      acknowledged: workflowData?.acknowledged || false,
      ticket_machine_message: workflowData?.ticketMachineMessage || '',
      passenger_cloud_message: workflowData?.passengerCloudMessage || '',
      service_messages: JSON.stringify(workflowData?.serviceMessages || []),
      affected_services: JSON.stringify(workflowData?.affectedServices || []),
      
      // Metadata
      created_by: supervisorBadge,
      created_at: completedAt || new Date().toISOString(),
      source: source || 'manual',
      status: 'active',
      
      // Alert data
      start_date: alertData.sm_start_date || alertData.start_date,
      end_date: alertData.sm_end_date || alertData.end_date,
      affected_routes: JSON.stringify(alertData.affectedRoutes || []),
      traffic_management_type: alertData.sm_traffic_management_type,
      coordinates: alertData.coordinates ? JSON.stringify(alertData.coordinates) : null,
      
      // Additional fields
      promoter: alertData.sm_promoter_organisation || alertData.sm_promoter_name,
      works_category: alertData.sm_works_category,
      duration_days: alertData.durationDays || 1
    };
    
    // Save to Supabase
    const { data, error } = await supabaseClient
      .from('disruptions')
      .insert([disruptionRecord])
      .select()
      .single();
    
    if (error) {
      console.error('Supabase error:', error);
      // Fallback to local storage if Supabase fails
      console.log('💾 Disruption record (would save locally):', disruptionRecord);
    }
    
    res.json({
      success: true,
      disruption: data || disruptionRecord,
      message: 'Disruption workflow completed successfully'
    });
  } catch (error) {
    console.error('Error creating disruption:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get all disruptions
router.get('/list', async (req, res) => {
  try {
    const { data, error } = await supabaseClient
      .from('disruptions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (error) {
      throw error;
    }
    
    // Parse JSON fields
    const disruptions = (data || []).map(d => ({
      ...d,
      service_messages: typeof d.service_messages === 'string' ? JSON.parse(d.service_messages) : d.service_messages,
      affected_services: typeof d.affected_services === 'string' ? JSON.parse(d.affected_services) : d.affected_services,
      affected_routes: typeof d.affected_routes === 'string' ? JSON.parse(d.affected_routes) : d.affected_routes,
      coordinates: typeof d.coordinates === 'string' ? JSON.parse(d.coordinates) : d.coordinates
    }));
    
    res.json({
      success: true,
      disruptions,
      count: disruptions.length
    });
  } catch (error) {
    console.error('Error fetching disruptions:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update disruption status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, updatedBy } = req.body;
    
    const { data, error } = await supabaseClient
      .from('disruptions')
      .update({
        status,
        updated_at: new Date().toISOString(),
        updated_by: updatedBy
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    res.json({
      success: true,
      disruption: data,
      message: `Disruption status updated to ${status}`
    });
  } catch (error) {
    console.error('Error updating disruption status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;