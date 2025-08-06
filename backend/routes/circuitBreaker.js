import express from 'express';
// Use lightweight versions to prevent memory issues
import { circuitBreakers } from '../services/circuitBreakerLite.js';

const router = express.Router();

// Get all circuit breaker statuses
router.get('/status', (req, res) => {
  const statuses = {};
  
  for (const [name, breaker] of Object.entries(circuitBreakers)) {
    statuses[name] = breaker.getStatus();
  }
  
  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    circuitBreakers: statuses
  });
});

// Reset specific circuit breaker
router.post('/reset/:service', (req, res) => {
  const { service } = req.params;
  
  if (!circuitBreakers[service]) {
    return res.status(404).json({
      success: false,
      error: `Circuit breaker for ${service} not found`
    });
  }
  
  circuitBreakers[service].reset();
  
  res.json({
    success: true,
    message: `Circuit breaker for ${service} reset`,
    status: circuitBreakers[service].getStatus()
  });
});

// Get fallback data status (lazy-loaded)
router.get('/fallback/:service', async (req, res) => {
  const { service } = req.params;
  const { maxAge } = req.query;
  
  try {
    // Lazy load fallback manager only when needed
    const { default: fallbackManager } = await import('../services/fallbackDataManager.js');
    
    const fallbackData = await fallbackManager.getFallback(
      service, 
      maxAge ? parseInt(maxAge) : undefined
    );
    
    res.json({
      success: true,
      service,
      hasFallback: !!fallbackData,
      data: fallbackData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Force open circuit breaker (for testing)
router.post('/force-open/:service', (req, res) => {
  const { service } = req.params;
  
  if (!circuitBreakers[service]) {
    return res.status(404).json({
      success: false,
      error: `Circuit breaker for ${service} not found`
    });
  }
  
  // Force failures to open the circuit
  for (let i = 0; i < 10; i++) {
    circuitBreakers[service].onFailure();
  }
  
  res.json({
    success: true,
    message: `Circuit breaker for ${service} forced open`,
    status: circuitBreakers[service].getStatus()
  });
});

export default router;
