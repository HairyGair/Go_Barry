// backend/routes/streetManagerDiagnostics.js
// Comprehensive diagnostics for StreetManager integration

import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { loadStreetManagerFallback, checkWebhookHealth } from '../services/streetManagerFallback.js';
import fetch from 'node-fetch';

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/**
 * GET /api/streetmanager/diagnostics/health
 * Comprehensive health check for StreetManager integration
 */
router.get('/health', async (req, res) => {
  try {
    const diagnostics = {
      timestamp: new Date().toISOString(),
      webhook: {},
      database: {},
      api: {},
      fallback: {},
      overall: { status: 'unknown', issues: [] }
    };

    // 1. Check webhook endpoint accessibility
    try {
      const webhookResponse = await fetch('https://go-barry.onrender.com/api/streetmanager/webhook', {
        method: 'GET',
        timeout: 10000
      });
      
      if (webhookResponse.ok) {
        const webhookData = await webhookResponse.json();
        diagnostics.webhook = {
          status: 'accessible',
          endpoint: 'https://go-barry.onrender.com/api/streetmanager/webhook',
          responseTime: Date.now() - Date.now(), // Would need proper timing
          storageType: webhookData.storage?.type,
          lastWebhook: webhookData.storage?.lastWebhook || 'Never'
        };
      } else {
        diagnostics.webhook = {
          status: 'error',
          error: `HTTP ${webhookResponse.status}: ${webhookResponse.statusText}`
        };
        diagnostics.overall.issues.push('Webhook endpoint not accessible');
      }
    } catch (webhookError) {
      diagnostics.webhook = {
        status: 'error',
        error: webhookError.message
      };
      diagnostics.overall.issues.push('Webhook endpoint connection failed');
    }

    // 2. Check webhook health via service
    try {
      const webhookHealth = await checkWebhookHealth();
      diagnostics.webhook.health = webhookHealth;
      
      if (!webhookHealth.healthy) {
        diagnostics.overall.issues.push(`Webhook unhealthy: ${webhookHealth.recentCount} recent notifications`);
      }
    } catch (healthError) {
      diagnostics.webhook.healthError = healthError.message;
      diagnostics.overall.issues.push('Cannot check webhook health');
    }

    // 3. Check database connectivity and data
    try {
      // Test basic connection
      const { data: connectionTest, error: connectionError } = await supabase
        .from('streetworks')
        .select('id')
        .limit(1);

      if (connectionError) {
        throw connectionError;
      }

      // Get detailed database stats
      const { count: totalNotifications } = await supabase
        .from('streetworks')
        .select('*', { count: 'exact', head: true });

      const { data: recentNotifications } = await supabase
        .from('streetworks')
        .select('created_at, sm_event_type')
        .order('created_at', { ascending: false })
        .limit(10);

      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const { count: recentCount } = await supabase
        .from('streetworks')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', yesterday.toISOString());

      diagnostics.database = {
        status: 'connected',
        totalNotifications: totalNotifications || 0,
        recentNotifications: recentCount || 0,
        lastNotification: recentNotifications?.[0]?.created_at || 'Never',
        latestEventTypes: recentNotifications?.map(n => n.sm_event_type || 'unknown').slice(0, 5) || []
      };

      if (totalNotifications === 0) {
        diagnostics.overall.issues.push('No webhook notifications in database');
      } else if (recentCount === 0) {
        diagnostics.overall.issues.push('No recent webhook notifications (24h)');
      }

    } catch (dbError) {
      diagnostics.database = {
        status: 'error',
        error: dbError.message
      };
      diagnostics.overall.issues.push('Database connection failed');
    }

    // 4. Check unified API endpoint
    try {
      const apiResponse = await fetch('https://go-barry.onrender.com/api/roadworks/unified?source=all', {
        timeout: 15000
      });
      
      if (apiResponse.ok) {
        const apiData = await apiResponse.json();
        const streetManagerSource = apiData.metadata?.sources?.streetManager;
        
        diagnostics.api = {
          status: 'accessible',
          endpoint: '/api/roadworks/unified?source=all',
          streetManagerSuccess: streetManagerSource?.success || false,
          streetManagerCount: streetManagerSource?.count || 0,
          totalRoadworks: apiData.metadata?.totalCount || 0
        };

        if (!streetManagerSource?.success) {
          diagnostics.overall.issues.push(`API StreetManager source failed: ${streetManagerSource?.error || 'Unknown error'}`);
        }
      } else {
        diagnostics.api = {
          status: 'error',
          error: `HTTP ${apiResponse.status}: ${apiResponse.statusText}`
        };
        diagnostics.overall.issues.push('Unified API not accessible');
      }
    } catch (apiError) {
      diagnostics.api = {
        status: 'error',
        error: apiError.message
      };
      diagnostics.overall.issues.push('Unified API connection failed');
    }

    // 5. Check fallback system
    try {
      const fallbackResult = await loadStreetManagerFallback();
      diagnostics.fallback = {
        status: fallbackResult.success ? 'available' : 'failed',
        count: fallbackResult.count || 0,
        source: fallbackResult.source,
        error: fallbackResult.error
      };

      if (!fallbackResult.success) {
        diagnostics.overall.issues.push('Fallback data system failed');
      }
    } catch (fallbackError) {
      diagnostics.fallback = {
        status: 'error',
        error: fallbackError.message
      };
      diagnostics.overall.issues.push('Fallback system error');
    }

    // 6. Determine overall status
    if (diagnostics.overall.issues.length === 0) {
      diagnostics.overall.status = 'healthy';
    } else if (diagnostics.overall.issues.length <= 2) {
      diagnostics.overall.status = 'degraded';
    } else {
      diagnostics.overall.status = 'unhealthy';
    }

    // 7. Generate recommendations
    diagnostics.recommendations = [];
    
    if (diagnostics.database.totalNotifications === 0) {
      diagnostics.recommendations.push('Configure StreetManager webhook subscription - no notifications received');
      diagnostics.recommendations.push('Verify webhook URL is registered: https://go-barry.onrender.com/api/streetmanager/webhook');
      diagnostics.recommendations.push('Check StreetManager portal for webhook status');
    } else if (diagnostics.database.recentNotifications === 0) {
      diagnostics.recommendations.push('Check if StreetManager webhook is still active - no recent notifications');
      diagnostics.recommendations.push('Verify webhook subscription has not expired');
    }

    if (diagnostics.webhook.status === 'error') {
      diagnostics.recommendations.push('Fix webhook endpoint accessibility issues');
    }

    if (diagnostics.fallback.status === 'failed') {
      diagnostics.recommendations.push('Configure fallback data source for service continuity');
    }

    res.json({
      success: true,
      diagnostics
    });

  } catch (error) {
    console.error('❌ Diagnostics health check failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      diagnostics: {
        timestamp: new Date().toISOString(),
        overall: { status: 'error', error: error.message }
      }
    });
  }
});

/**
 * POST /api/streetmanager/diagnostics/test-webhook
 * Test webhook processing with sample data
 */
router.post('/test-webhook', async (req, res) => {
  try {
    const testPayload = {
      Type: 'Notification',
      MessageId: `test-${Date.now()}`,
      TopicArn: 'arn:aws:sns:eu-west-2:123456789:streetmanager-notifications',
      Subject: 'StreetManager Test Notification',
      Message: JSON.stringify({
        event_reference: `TEST-${Date.now()}`,
        event_type: 'PERMIT_GRANTED',
        object_type: 'PERMIT',
        object_reference: `TEST-PERMIT-${Date.now()}`,
        event_time: new Date().toISOString(),
        object_data: {
          permit_reference_number: `SM-TEST-${Date.now()}`,
          work_reference_number: `WR-TEST-${Date.now()}`,
          street_name: 'Grey Street',
          area_name: 'Newcastle City Centre',
          town: 'Newcastle upon Tyne',
          usrn: '25001234',
          work_category_ref: 'standard',
          activity_type: 'Utility Works',
          is_emergency_works: false,
          is_traffic_sensitive: 'Yes',
          traffic_management_type: 'multi_way_signals',
          proposed_start_date: new Date().toISOString(),
          proposed_end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          highway_authority: 'Newcastle City Council',
          promoter_organisation: 'Test Utility Company',
          works_location_coordinates: 'POINT(-1.6131 54.9738)'
        }
      }),
      Timestamp: new Date().toISOString(),
      SignatureVersion: '1',
      Signature: 'test-signature-bypass'
    };

    console.log('🧪 Processing test webhook payload...');

    // Send to webhook endpoint with bypass header
    const webhookResponse = await fetch('https://go-barry.onrender.com/api/streetmanager/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'x-amz-sns-message-type': 'Notification',
        'x-test-webhook': 'true' // Flag for testing
      },
      body: JSON.stringify(testPayload)
    });

    let webhookResult = { status: webhookResponse.status };
    try {
      webhookResult.response = await webhookResponse.json();
    } catch (e) {
      webhookResult.response = await webhookResponse.text();
    }

    // Check if notification was saved
    const { data: savedNotification, error: checkError } = await supabase
      .from('streetworks')
      .select('*')
      .eq('notification_id', `streetmanager_PERMIT_${testPayload.Message.split('"object_reference":"')[1]?.split('"')[0]}_${testPayload.MessageId}`)
      .single();

    res.json({
      success: true,
      test: {
        payload: testPayload,
        webhookResponse: webhookResult,
        savedToDatabase: !!savedNotification,
        databaseError: checkError?.message,
        notification: savedNotification
      },
      instructions: [
        'This test sends a sample StreetManager notification to the webhook endpoint',
        'Check the webhook response and database save status',
        'If successful, the notification should appear in the roadworks manager',
        'Use this to verify webhook processing without waiting for real notifications'
      ]
    });

  } catch (error) {
    console.error('❌ Test webhook failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/streetmanager/diagnostics/summary
 * Quick summary of StreetManager integration status
 */
router.get('/summary', async (req, res) => {
  try {
    const summary = {
      timestamp: new Date().toISOString(),
      status: 'unknown',
      counts: {},
      lastActivity: null,
      issues: []
    };

    // Get basic counts
    try {
      const { count: totalNotifications } = await supabase
        .from('streetworks')
        .select('*', { count: 'exact', head: true });

      const { data: latestNotification } = await supabase
        .from('streetworks')
        .select('webhook_received_at, webhook_event_type')
        .order('webhook_received_at', { ascending: false })
        .limit(1);

      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const { count: recentCount } = await supabase
        .from('streetworks')
        .select('*', { count: 'exact', head: true })
        .gte('webhook_received_at', yesterday.toISOString());

      summary.counts = {
        total: totalNotifications || 0,
        recent24h: recentCount || 0
      };

      summary.lastActivity = latestNotification?.[0]?.webhook_received_at || null;

      // Determine status
      if (totalNotifications === 0) {
        summary.status = 'no_data';
        summary.issues.push('No webhook notifications received');
      } else if (recentCount === 0) {
        summary.status = 'stale';
        summary.issues.push('No recent activity (24h)');
      } else {
        summary.status = 'active';
      }

    } catch (error) {
      summary.status = 'error';
      summary.issues.push(`Database error: ${error.message}`);
    }

    // Test fallback availability
    try {
      const fallbackResult = await loadStreetManagerFallback();
      summary.fallbackAvailable = fallbackResult.success;
      summary.fallbackCount = fallbackResult.count;
    } catch (error) {
      summary.fallbackAvailable = false;
      summary.issues.push(`Fallback error: ${error.message}`);
    }

    res.json({
      success: true,
      summary
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;