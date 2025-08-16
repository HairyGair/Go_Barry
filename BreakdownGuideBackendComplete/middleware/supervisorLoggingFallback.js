// backend/middleware/supervisorLoggingFallback.js
// Graceful fallback handling for supervisor logging system failures

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Supervisor Logging Fallback System
 * 
 * Provides graceful degradation when the enhanced supervisor logging system fails:
 * - File-based logging fallback
 * - In-memory activity buffer
 * - Basic console logging
 * - Error recovery mechanisms
 * - Health monitoring for degraded state
 */

class SupervisorLoggingFallback {
  constructor() {
    this.fallbackMode = false;
    this.fallbackReason = null;
    this.fallbackStartTime = null;
    this.activityBuffer = [];
    this.maxBufferSize = 100; // Limit memory usage
    this.fallbackLogPath = path.join(__dirname, '../logs/supervisor-fallback.log');
    this.recoveryAttempts = 0;
    this.maxRecoveryAttempts = 3;
    this.lastRecoveryAttempt = null;
    this.recoveryInterval = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Activate fallback mode
   */
  async activateFallback(reason, error = null) {
    console.warn('⚠️ Activating supervisor logging fallback mode');
    console.warn(`📋 Reason: ${reason}`);
    if (error) {
      console.warn(`❌ Error: ${error.message}`);
    }

    this.fallbackMode = true;
    this.fallbackReason = reason;
    this.fallbackStartTime = new Date().toISOString();

    // Ensure logs directory exists
    try {
      await fs.mkdir(path.dirname(this.fallbackLogPath), { recursive: true });
    } catch (mkdirError) {
      console.warn('⚠️ Could not create logs directory:', mkdirError.message);
    }

    // Log fallback activation
    await this.logToFile({
      event: 'fallback_activated',
      reason,
      error: error?.message || null,
      timestamp: this.fallbackStartTime,
      systemInfo: {
        nodeEnv: process.env.NODE_ENV,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage()
      }
    });

    console.log('✅ Supervisor logging fallback mode activated');
  }

  /**
   * Deactivate fallback mode (recovery successful)
   */
  async deactivateFallback() {
    if (!this.fallbackMode) return;

    console.log('🔄 Deactivating supervisor logging fallback mode');

    // Log recovery
    await this.logToFile({
      event: 'fallback_deactivated',
      fallbackDuration: Date.now() - new Date(this.fallbackStartTime).getTime(),
      bufferedActivities: this.activityBuffer.length,
      recoveryAttempts: this.recoveryAttempts,
      timestamp: new Date().toISOString()
    });

    // Clear fallback state
    this.fallbackMode = false;
    this.fallbackReason = null;
    this.fallbackStartTime = null;
    this.recoveryAttempts = 0;
    this.lastRecoveryAttempt = null;

    // Keep buffer for potential transfer to main system
    console.log(`📦 Preserving ${this.activityBuffer.length} buffered activities for potential transfer`);
    
    console.log('✅ Supervisor logging fallback mode deactivated');
  }

  /**
   * Log activity using fallback methods
   */
  async logActivity(supervisorInfo, action, details = {}, req = null) {
    if (!this.fallbackMode) {
      console.warn('⚠️ logActivity called but fallback mode is not active');
      return;
    }

    const activity = {
      timestamp: new Date().toISOString(),
      supervisor: {
        id: supervisorInfo?.id || 'unknown',
        name: supervisorInfo?.name || 'Unknown Supervisor',
        badge: supervisorInfo?.badge || 'N/A'
      },
      action,
      details,
      request: req ? {
        method: req.method,
        path: req.path,
        userAgent: req.headers['user-agent'],
        ip: req.ip || req.connection?.remoteAddress
      } : null,
      fallbackMode: true
    };

    // Add to in-memory buffer (with size limit)
    this.activityBuffer.push(activity);
    if (this.activityBuffer.length > this.maxBufferSize) {
      // Remove oldest entries to prevent memory issues
      const removed = this.activityBuffer.splice(0, this.activityBuffer.length - this.maxBufferSize);
      console.warn(`⚠️ Fallback buffer full, removed ${removed.length} oldest activities`);
    }

    // Log to file (non-blocking)
    this.logToFile(activity).catch(error => {
      console.warn('⚠️ Fallback file logging failed:', error.message);
    });

    // Console logging for important actions
    if (this.isImportantAction(action)) {
      console.log(`📝 [FALLBACK] ${supervisorInfo?.name || 'Unknown'} - ${action}`);
    }
  }

  /**
   * Check if action is important enough for console logging
   */
  isImportantAction(action) {
    const importantActions = [
      'supervisor_login',
      'supervisor_logout',
      'alert_dismissed',
      'roadwork_dismissed',
      'incident_created',
      'admin_logout_all'
    ];
    return importantActions.includes(action);
  }

  /**
   * Log to fallback file
   */
  async logToFile(data) {
    try {
      const logEntry = JSON.stringify(data) + '\n';
      await fs.appendFile(this.fallbackLogPath, logEntry);
    } catch (error) {
      // Silent fail to prevent cascading errors
      console.warn('⚠️ File logging failed silently:', error.message);
    }
  }

  /**
   * Attempt to recover and return to main logging system
   */
  async attemptRecovery() {
    if (!this.fallbackMode) return { success: true, reason: 'not_in_fallback_mode' };

    const now = Date.now();
    
    // Check if enough time has passed since last attempt
    if (this.lastRecoveryAttempt && (now - this.lastRecoveryAttempt) < this.recoveryInterval) {
      return { success: false, reason: 'too_soon_for_retry' };
    }

    // Check if we've exceeded max attempts
    if (this.recoveryAttempts >= this.maxRecoveryAttempts) {
      return { success: false, reason: 'max_attempts_exceeded' };
    }

    this.recoveryAttempts++;
    this.lastRecoveryAttempt = now;

    console.log(`🔄 Attempting supervisor logging recovery (attempt ${this.recoveryAttempts}/${this.maxRecoveryAttempts})`);

    try {
      // Try to import and reinitialize the main logging system
      const { productionSupervisorLoggingManager } = await import('./productionSupervisorLogging.js');
      
      if (!productionSupervisorLoggingManager.isInitialized) {
        const result = await productionSupervisorLoggingManager.initializeProductionLogging();
        
        if (result.success) {
          console.log('✅ Recovery successful - main logging system restored');
          await this.deactivateFallback();
          return { success: true, result };
        }
      } else {
        console.log('✅ Main logging system already active - ending fallback mode');
        await this.deactivateFallback();
        return { success: true, reason: 'already_active' };
      }

    } catch (recoveryError) {
      console.warn(`⚠️ Recovery attempt ${this.recoveryAttempts} failed:`, recoveryError.message);
      
      await this.logToFile({
        event: 'recovery_failed',
        attempt: this.recoveryAttempts,
        error: recoveryError.message,
        timestamp: new Date().toISOString()
      });
    }

    return { success: false, attempt: this.recoveryAttempts };
  }

  /**
   * Get fallback status and statistics
   */
  getStatus() {
    return {
      fallbackMode: this.fallbackMode,
      fallbackReason: this.fallbackReason,
      fallbackStartTime: this.fallbackStartTime,
      fallbackDuration: this.fallbackStartTime ? 
        Date.now() - new Date(this.fallbackStartTime).getTime() : null,
      
      buffer: {
        size: this.activityBuffer.length,
        maxSize: this.maxBufferSize,
        utilizationPercent: Math.round((this.activityBuffer.length / this.maxBufferSize) * 100)
      },
      
      recovery: {
        attempts: this.recoveryAttempts,
        maxAttempts: this.maxRecoveryAttempts,
        lastAttempt: this.lastRecoveryAttempt,
        nextAttemptEligible: this.lastRecoveryAttempt ? 
          new Date(this.lastRecoveryAttempt + this.recoveryInterval).toISOString() : 'immediately'
      }
    };
  }

  /**
   * Get buffered activities for potential transfer
   */
  getBufferedActivities() {
    return [...this.activityBuffer]; // Return copy
  }

  /**
   * Clear activity buffer (after successful transfer)
   */
  clearBuffer() {
    const count = this.activityBuffer.length;
    this.activityBuffer = [];
    console.log(`🗑️ Cleared ${count} activities from fallback buffer`);
    return count;
  }

  /**
   * Express middleware for automatic fallback handling
   */
  middleware() {
    return (req, res, next) => {
      // Add fallback status to request for debugging
      req.supervisorLoggingFallback = this.getStatus();
      
      // Add fallback headers for monitoring
      if (this.fallbackMode && process.env.NODE_ENV !== 'production') {
        res.set('X-Supervisor-Logging-Fallback', 'active');
        res.set('X-Supervisor-Logging-Fallback-Reason', this.fallbackReason);
      }

      next();
    };
  }

  /**
   * Create fallback logging function for emergency use
   */
  createEmergencyLogger() {
    return (supervisorInfo, action, details = {}, req = null) => {
      if (!this.fallbackMode) {
        // Auto-activate fallback if not already active
        this.activateFallback('emergency_activation', new Error('Emergency logging activation'));
      }
      
      return this.logActivity(supervisorInfo, action, details, req);
    };
  }

  /**
   * Health check for fallback system
   */
  async healthCheck() {
    const health = {
      status: 'operational',
      fallbackMode: this.fallbackMode,
      issues: []
    };

    // Check if fallback mode has been active too long
    if (this.fallbackMode && this.fallbackStartTime) {
      const duration = Date.now() - new Date(this.fallbackStartTime).getTime();
      const maxDuration = 30 * 60 * 1000; // 30 minutes

      if (duration > maxDuration) {
        health.status = 'warning';
        health.issues.push('Fallback mode active for extended period');
      }
    }

    // Check buffer utilization
    const bufferUtil = (this.activityBuffer.length / this.maxBufferSize) * 100;
    if (bufferUtil > 80) {
      health.status = health.status === 'operational' ? 'warning' : health.status;
      health.issues.push('High buffer utilization');
    }

    // Check file system
    try {
      await fs.access(path.dirname(this.fallbackLogPath));
    } catch (fsError) {
      health.status = 'error';
      health.issues.push('Cannot access logs directory');
    }

    return health;
  }
}

// Create singleton instance
const supervisorLoggingFallback = new SupervisorLoggingFallback();

// Export fallback system
export default supervisorLoggingFallback;
export { SupervisorLoggingFallback };