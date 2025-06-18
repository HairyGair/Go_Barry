import express from 'express';
import { createClient } from '@supabase/supabase-js';
import microsoftEmailService from '../services/microsoftEmailService.js';

const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// GET /api/roadwork-alerts - List all roadwork alerts with optional filtering
router.get('/', async (req, res) => {
  try {
    const { status, supervisor_id, active_only } = req.query;
    
    let query = supabase
      .from('roadworks')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    
    if (supervisor_id) {
      query = query.eq('created_by_supervisor_id', supervisor_id);
    }
    
    if (active_only === 'true') {
      query = query.in('status', ['pending', 'active']);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Database error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }

    // Add visual status indicators
    const roadworksWithVisuals = data.map(roadwork => ({
      ...roadwork,
      statusColor: getStatusColor(roadwork.status),
      severityColor: getSeverityColor(roadwork.severity),
      isExpired: roadwork.end_date && new Date(roadwork.end_date) < new Date()
    }));

    res.json({ 
      success: true, 
      data: roadworksWithVisuals,
      count: data.length 
    });

  } catch (error) {
    console.error('❌ Get roadwork alerts error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/roadwork-alerts - Create new roadwork alert
router.post('/', async (req, res) => {
  try {
    const {
      title,
      description,
      location,
      areas,
      status = 'pending',
      start_date,
      end_date,
      all_day,
      routes_affected,
      severity = 'medium',
      contact_info,
      web_link,
      created_by_supervisor_id,
      created_by_name,
      email_groups = []
    } = req.body;

    // Validation
    if (!title || !location || !start_date || !created_by_supervisor_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: title, location, start_date, created_by_supervisor_id' 
      });
    }

    // Validate supervisor exists
    const supervisorExists = await validateSupervisor(created_by_supervisor_id);
    if (!supervisorExists) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid supervisor ID' 
      });
    }

    // Create roadwork alert
    const { data: roadwork, error: createError } = await supabase
      .from('roadworks')
      .insert({
        title: title.trim(),
        description: description?.trim(),
        location: location.trim(),
        areas,
        status,
        start_date,
        end_date,
        all_day,
        routes_affected,
        severity,
        contact_info: contact_info?.trim(),
        web_link: web_link?.trim(),
        created_by_supervisor_id,
        created_by_name: created_by_name?.trim(),
        email_sent: false
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ Create roadwork alert error:', createError);
      return res.status(500).json({ success: false, error: createError.message });
    }

    // Send email notifications
    if (email_groups.length > 0) {
      try {
        await sendRoadworkNotifications(roadwork, email_groups);
        
        // Update roadwork as email sent
        await supabase
          .from('roadworks')
          .update({ 
            email_sent: true, 
            email_sent_at: new Date().toISOString() 
          })
          .eq('id', roadwork.id);

      } catch (emailError) {
        console.error('❌ Email notification error:', emailError);
        // Don't fail the request if email fails
      }
    }

    console.log(`✅ Roadwork alert created: ${title} by ${created_by_name}`);
    
    res.status(201).json({ 
      success: true, 
      data: {
        ...roadwork,
        statusColor: getStatusColor(roadwork.status),
        severityColor: getSeverityColor(roadwork.severity)
      }
    });

  } catch (error) {
    console.error('❌ Create roadwork alert error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/roadwork-alerts/:id - Update roadwork alert
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove read-only fields
    delete updates.id;
    delete updates.created_at;
    delete updates.created_by_supervisor_id;
    delete updates.created_by_name;

    const { data, error } = await supabase
      .from('roadworks')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Update roadwork alert error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }

    if (!data) {
      return res.status(404).json({ success: false, error: 'Roadwork alert not found' });
    }

    console.log(`✅ Roadwork alert updated: ${id}`);
    
    res.json({ 
      success: true, 
      data: {
        ...data,
        statusColor: getStatusColor(data.status),
        severityColor: getSeverityColor(data.severity)
      }
    });

  } catch (error) {
    console.error('❌ Update roadwork alert error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/roadwork-alerts/:id - Delete roadwork alert
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('roadworks')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Delete roadwork alert error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }

    console.log(`✅ Roadwork alert deleted: ${id}`);
    res.json({ success: true, message: 'Roadwork alert deleted successfully' });

  } catch (error) {
    console.error('❌ Delete roadwork alert error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/roadwork-alerts/email-groups - Get email groups for notifications
router.get('/email-groups', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('email_groups')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('❌ Get email groups error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }

    res.json({ success: true, data });

  } catch (error) {
    console.error('❌ Get email groups error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/roadwork-alerts/email-groups - Create/update email groups (admin only)
router.post('/email-groups', async (req, res) => {
  try {
    const { name, description, emails, created_by } = req.body;

    if (!name || !emails || !Array.isArray(emails)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: name, emails (array)' 
      });
    }

    const { data, error } = await supabase
      .from('email_groups')
      .upsert({
        name: name.trim(),
        description: description?.trim(),
        emails,
        created_by: created_by?.trim() || 'unknown',
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Upsert email group error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }

    console.log(`✅ Email group saved: ${name}`);
    res.json({ success: true, data });

  } catch (error) {
    console.error('❌ Email group error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Email testing and health endpoints
router.get('/email/test-access', async (req, res) => {
  try {
    const result = await microsoftEmailService.validateEmailAccess();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/email/test', async (req, res) => {
  try {
    const { recipient } = req.body;
    
    if (!recipient) {
      return res.status(400).json({ success: false, error: 'Recipient email required' });
    }

    const result = await microsoftEmailService.sendTestEmail(recipient);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Helper Functions

async function validateSupervisor(supervisorId) {
  try {
    // Import and use the supervisor validation directly
    const { validateSupervisorById } = await import('../services/supervisorManager.js');
    const result = await validateSupervisorById(supervisorId);
    return result.success;
  } catch (error) {
    console.error('❌ Supervisor validation error:', error);
    return false;
  }
}

async function sendRoadworkNotifications(roadwork, emailGroupNames) {
  try {
    // Get email addresses for selected groups
    const { data: emailGroups, error } = await supabase
      .from('email_groups')
      .select('*')
      .in('name', emailGroupNames)
      .eq('is_active', true);

    if (error || !emailGroups.length) {
      throw new Error(`No active email groups found: ${emailGroupNames.join(', ')}`);
    }

    // Collect all unique email addresses
    const allEmails = new Set();
    emailGroups.forEach(group => {
      group.emails.forEach(email => allEmails.add(email));
    });

    const recipients = Array.from(allEmails);
    
    // Send email using Microsoft 365 service
    const emailResult = await microsoftEmailService.sendRoadworkNotification(
      roadwork, 
      recipients, 
      emailGroups
    );

    if (!emailResult.success) {
      throw new Error(`Email send failed: ${emailResult.error}`);
    }

    // Log email sent for each group
    for (const group of emailGroups) {
      await supabase
        .from('roadwork_email_logs')
        .insert({
          roadwork_id: roadwork.id,
          email_group_id: group.id,
          recipient_emails: group.emails,
          email_subject: emailResult.subject || `🚧 New Roadwork Alert: ${roadwork.title}`,
          status: 'sent'
        });
    }

    console.log(`✅ Microsoft 365 notifications sent for roadwork: ${roadwork.title} to ${recipients.length} recipients`);
    
  } catch (error) {
    console.error('❌ Send email error:', error);
    
    // Log failed email attempt
    await supabase
      .from('roadwork_email_logs')
      .insert({
        roadwork_id: roadwork.id,
        email_group_id: null,
        recipient_emails: [],
        email_subject: `Failed: ${roadwork.title}`,
        status: 'failed'
      });
    
    throw error;
  }
}

function getStatusColor(status) {
  const colors = {
    pending: '#f59e0b',  // amber
    active: '#ef4444',   // red  
    finished: '#22c55e'  // green
  };
  return colors[status] || '#6b7280';
}

function getSeverityColor(severity) {
  const colors = {
    low: '#22c55e',     // green
    medium: '#f59e0b',  // amber
    high: '#ef4444'     // red
  };
  return colors[severity] || '#6b7280';
}

export default router;