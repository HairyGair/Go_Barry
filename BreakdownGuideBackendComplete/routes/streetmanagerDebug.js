// backend/routes/streetmanagerDebug.js
// Debug endpoints for Street Manager roadworks integration

import express from 'express';
import unifiedRoadworksManager from '../services/unifiedRoadworksManager.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// GET /api/streetmanager/status - Check Street Manager integration status
router.get('/status', async (req, res) => {
  try {
    // Check circuit breaker status
    const circuitBreakerStatus = {
      disabled: unifiedRoadworksManager.streetManagerDisabled,
      failures: unifiedRoadworksManager.streetManagerFailures,
      lastFailure: unifiedRoadworksManager.streetManagerLastFailure,
      disabledUntil: unifiedRoadworksManager.streetManagerDisabledUntil,
      timeRemaining: unifiedRoadworksManager.streetManagerDisabledUntil > Date.now() 
        ? Math.round((unifiedRoadworksManager.streetManagerDisabledUntil - Date.now()) / 1000) + ' seconds'
        : 'Not disabled'
    };

    // Check Supabase connection
    let supabaseStatus = { connected: false, error: null, recordCount: 0 };
    try {
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
      );
      
      const { count, error } = await supabase
        .from('streetworks')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        supabaseStatus.error = error.message;
      } else {
        supabaseStatus.connected = true;
        supabaseStatus.recordCount = count || 0;
      }
    } catch (error) {
      supabaseStatus.error = error.message;
    }

    res.json({
      success: true,
      streetManagerStatus: {
        enabled: !unifiedRoadworksManager.streetManagerDisabled,
        circuitBreaker: circuitBreakerStatus,
        supabase: supabaseStatus
      }
    });
  } catch (error) {
    console.error('Error checking Street Manager status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/streetmanager/reset-circuit-breaker - Reset the circuit breaker
router.post('/reset-circuit-breaker', async (req, res) => {
  try {
    console.log('🔄 Resetting Street Manager circuit breaker...');
    
    // Reset the circuit breaker
    unifiedRoadworksManager.resetCircuitBreaker();
    
    res.json({
      success: true,
      message: 'Circuit breaker reset successfully',
      status: {
        disabled: unifiedRoadworksManager.streetManagerDisabled,
        failures: unifiedRoadworksManager.streetManagerFailures
      }
    });
  } catch (error) {
    console.error('Error resetting circuit breaker:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/streetmanager/test-fetch - Test fetching Street Manager data
router.get('/test-fetch', async (req, res) => {
  try {
    console.log('🧪 Testing Street Manager data fetch...');
    
    const result = await unifiedRoadworksManager.getStreetManagerRoadworks();
    
    res.json({
      success: result.success,
      dataCount: result.data ? result.data.length : 0,
      source: result.source,
      fallback: result.fallback || false,
      error: result.error,
      processingTime: result.processingTime,
      sample: result.data && result.data.length > 0 ? result.data.slice(0, 3) : []
    });
  } catch (error) {
    console.error('Error testing Street Manager fetch:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/streetmanager/direct-supabase - Direct Supabase query test
router.get('/direct-supabase', async (req, res) => {
  try {
    console.log('🔍 Direct Supabase streetworks query...');
    
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    
    const { data, error, count } = await supabase
      .from('streetworks')
      .select('*', { count: 'exact' })
      .order('webhook_received_at', { ascending: false })
      .limit(10);
    
    if (error) {
      throw error;
    }
    
    res.json({
      success: true,
      totalCount: count,
      sampleCount: data ? data.length : 0,
      sampleData: data || [],
      fields: data && data.length > 0 ? Object.keys(data[0]) : []
    });
  } catch (error) {
    console.error('Error in direct Supabase query:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error
    });
  }
});

export default router;
