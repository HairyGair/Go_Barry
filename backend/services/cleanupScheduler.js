// backend/services/cleanupScheduler.js
// Scheduled cleanup jobs for dismissed alerts using node-cron
// Memory optimized for Render.com 2GB RAM constraint

import cron from 'node-cron';
import { dismissedAlertsCleanupService } from './dismissedAlertsCleanupService.js';

/**
 * Cleanup Scheduler Service
 * Manages scheduled cleanup operations for dismissed alerts
 */
class CleanupScheduler {
  constructor() {
    this.scheduledJobs = new Map();
    this.isRunning = false;
    this.lastRunTime = null;
    this.nextRunTime = null;
    
    // Configuration from environment variables
    this.enabledJobs = {
      // Daily cleanup check at 2 AM UTC (low traffic time)
      daily: {
        enabled: process.env.CLEANUP_DAILY_ENABLED !== 'false',
        schedule: process.env.CLEANUP_DAILY_SCHEDULE || '0 2 * * *',
        description: 'Daily cleanup of dismissed alerts'
      },
      
      // Weekly deep cleanup on Sundays at 3 AM UTC
      weekly: {
        enabled: process.env.CLEANUP_WEEKLY_ENABLED !== 'false',
        schedule: process.env.CLEANUP_WEEKLY_SCHEDULE || '0 3 * * 0',
        description: 'Weekly deep cleanup and statistics'
      },
      
      // Monthly maintenance on 1st of month at 4 AM UTC
      monthly: {
        enabled: process.env.CLEANUP_MONTHLY_ENABLED !== 'false',
        schedule: process.env.CLEANUP_MONTHLY_SCHEDULE || '0 4 1 * *',
        description: 'Monthly maintenance and optimization'
      }
    };
    
    console.log('⏰ Cleanup Scheduler initialized');
    console.log('📅 Scheduled jobs configuration:', this.enabledJobs);
  }

  /**
   * Start all scheduled cleanup jobs
   */
  async startScheduler() {
    try {
      console.log('🚀 Starting cleanup scheduler...');
      
      // Schedule daily cleanup
      if (this.enabledJobs.daily.enabled) {
        this.scheduleJob('daily', this.enabledJobs.daily.schedule, async () => {
          await this.performDailyCleanup();
        }, this.enabledJobs.daily.description);
      }
      
      // Schedule weekly cleanup
      if (this.enabledJobs.weekly.enabled) {
        this.scheduleJob('weekly', this.enabledJobs.weekly.schedule, async () => {
          await this.performWeeklyCleanup();
        }, this.enabledJobs.weekly.description);
      }
      
      // Schedule monthly maintenance
      if (this.enabledJobs.monthly.enabled) {
        this.scheduleJob('monthly', this.enabledJobs.monthly.schedule, async () => {
          await this.performMonthlyMaintenance();
        }, this.enabledJobs.monthly.description);
      }
      
      this.isRunning = true;
      console.log('✅ Cleanup scheduler started successfully');
      console.log(`📊 ${this.scheduledJobs.size} jobs scheduled`);
      
      // Log next run times
      this.logNextRunTimes();
      
      return {
        success: true,
        scheduled_jobs: this.scheduledJobs.size,
        next_run_times: this.getNextRunTimes()
      };
      
    } catch (error) {
      console.error('❌ Failed to start cleanup scheduler:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Stop all scheduled cleanup jobs
   */
  stopScheduler() {
    console.log('🛑 Stopping cleanup scheduler...');
    
    let stoppedCount = 0;
    this.scheduledJobs.forEach((job, name) => {
      job.destroy();
      stoppedCount++;
      console.log(`📴 Stopped ${name} cleanup job`);
    });
    
    this.scheduledJobs.clear();
    this.isRunning = false;
    
    console.log(`✅ Cleanup scheduler stopped (${stoppedCount} jobs terminated)`);
    
    return {
      success: true,
      stopped_jobs: stoppedCount
    };
  }

  /**
   * Schedule a cleanup job
   */
  scheduleJob(name, schedule, task, description) {
    try {
      const job = cron.schedule(schedule, async () => {
        if (this.isJobRunning(name)) {
          console.log(`⏳ Skipping ${name} cleanup - previous job still running`);
          return;
        }
        
        await this.executeJob(name, task);
      }, {
        scheduled: true,
        timezone: 'UTC'
      });
      
      this.scheduledJobs.set(name, job);
      console.log(`📅 Scheduled ${name} cleanup: ${schedule} (${description})`);
      
    } catch (error) {
      console.error(`❌ Failed to schedule ${name} job:`, error);
    }
  }

  /**
   * Execute a cleanup job with error handling and logging
   */
  async executeJob(jobName, task) {
    const startTime = Date.now();
    console.log(`🚀 Starting ${jobName} cleanup job...`);
    
    try {
      // Set job as running
      this.setJobRunning(jobName, true);
      
      // Execute the task
      const result = await task();
      
      const executionTime = Date.now() - startTime;
      this.lastRunTime = new Date().toISOString();
      
      console.log(`✅ ${jobName} cleanup completed in ${executionTime}ms`);
      
      // Log successful execution
      await dismissedAlertsCleanupService.logCleanupOperation(
        {
          ...result,
          job_name: jobName,
          execution_time_ms: executionTime
        },
        `scheduled_${jobName}`
      );
      
      return {
        success: true,
        job_name: jobName,
        execution_time_ms: executionTime,
        result
      };
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(`❌ ${jobName} cleanup failed:`, error);
      
      // Log failed execution
      await dismissedAlertsCleanupService.logCleanupOperation(
        {
          job_name: jobName,
          execution_time_ms: executionTime,
          deleted_count: 0,
          errors: [error.message],
          processed_tables: [],
          dry_run: false
        },
        `scheduled_${jobName}_failed`
      );
      
      return {
        success: false,
        job_name: jobName,
        execution_time_ms: executionTime,
        error: error.message
      };
      
    } finally {
      // Mark job as completed
      this.setJobRunning(jobName, false);
    }
  }

  /**
   * Perform daily cleanup - light maintenance
   */
  async performDailyCleanup() {
    console.log('🌅 Performing daily cleanup...');
    
    // Get statistics first
    const stats = await dismissedAlertsCleanupService.getCleanupStats();
    console.log('📊 Daily cleanup stats:', stats);
    
    // Perform cleanup only if there are records to clean
    const eligibleResult = await dismissedAlertsCleanupService.findEligibleRecords();
    if (!eligibleResult.success) {
      throw new Error(`Failed to find eligible records: ${eligibleResult.error}`);
    }
    
    if (eligibleResult.total_eligible === 0) {
      console.log('✨ No records eligible for cleanup today');
      return {
        deleted_count: 0,
        message: 'No records eligible for cleanup',
        stats: stats.stats
      };
    }
    
    // Perform cleanup
    const cleanupResult = await dismissedAlertsCleanupService.performCleanup(eligibleResult.eligible_records);
    if (!cleanupResult.success) {
      throw new Error(`Cleanup failed: ${cleanupResult.error}`);
    }
    
    return cleanupResult.results;
  }

  /**
   * Perform weekly cleanup - more thorough
   */
  async performWeeklyCleanup() {
    console.log('📅 Performing weekly cleanup...');
    
    // Get comprehensive statistics
    const stats = await dismissedAlertsCleanupService.getCleanupStats();
    console.log('📊 Weekly cleanup stats:', stats);
    
    // Force more aggressive cleanup for weekly run
    const originalBatchSize = dismissedAlertsCleanupService.batchSize;
    const originalMaxTime = dismissedAlertsCleanupService.maxOperationTime;
    
    // Increase limits for weekly cleanup
    dismissedAlertsCleanupService.batchSize = Math.min(originalBatchSize * 2, 200);
    dismissedAlertsCleanupService.maxOperationTime = Math.min(originalMaxTime * 2, 60000); // Max 60 seconds
    
    try {
      const cleanupResult = await dismissedAlertsCleanupService.performCleanup();
      
      // Restore original settings
      dismissedAlertsCleanupService.batchSize = originalBatchSize;
      dismissedAlertsCleanupService.maxOperationTime = originalMaxTime;
      
      if (!cleanupResult.success) {
        throw new Error(`Weekly cleanup failed: ${cleanupResult.error}`);
      }
      
      return {
        ...cleanupResult.results,
        weekly_stats: stats.stats,
        enhanced_cleanup: true
      };
      
    } catch (error) {
      // Restore original settings on error
      dismissedAlertsCleanupService.batchSize = originalBatchSize;
      dismissedAlertsCleanupService.maxOperationTime = originalMaxTime;
      throw error;
    }
  }

  /**
   * Perform monthly maintenance
   */
  async performMonthlyMaintenance() {
    console.log('🗓️ Performing monthly maintenance...');
    
    // Get detailed statistics for the month
    const stats = await dismissedAlertsCleanupService.getCleanupStats();
    console.log('📊 Monthly maintenance stats:', stats);
    
    // Perform thorough cleanup with extended time limits
    const originalMaxTime = dismissedAlertsCleanupService.maxOperationTime;
    dismissedAlertsCleanupService.maxOperationTime = 120000; // 2 minutes for monthly
    
    try {
      const cleanupResult = await dismissedAlertsCleanupService.performCleanup();
      
      // Restore original settings
      dismissedAlertsCleanupService.maxOperationTime = originalMaxTime;
      
      if (!cleanupResult.success) {
        throw new Error(`Monthly maintenance failed: ${cleanupResult.error}`);
      }
      
      console.log('🎉 Monthly maintenance completed successfully');
      
      return {
        ...cleanupResult.results,
        monthly_stats: stats.stats,
        maintenance_type: 'full_monthly',
        recommendations: this.generateMaintenanceRecommendations(stats.stats)
      };
      
    } catch (error) {
      // Restore original settings on error
      dismissedAlertsCleanupService.maxOperationTime = originalMaxTime;
      throw error;
    }
  }

  /**
   * Generate maintenance recommendations based on statistics
   */
  generateMaintenanceRecommendations(stats) {
    const recommendations = [];
    
    if (stats.dismissed_alerts?.ageGroups?.['90d+'] > 100) {
      recommendations.push('Consider reducing retention periods for some dismissal types');
    }
    
    if (stats.streetworks?.dismissed_count > 1000) {
      recommendations.push('High volume of dismissed streetworks - consider batch optimization');
    }
    
    if (stats.manual_incidents?.dismissed_count > 500) {
      recommendations.push('Manual incidents cleanup performing well');
    }
    
    return recommendations;
  }

  /**
   * Check if a job is currently running
   */
  isJobRunning(jobName) {
    return this.runningJobs?.has(jobName) || false;
  }

  /**
   * Set job running status
   */
  setJobRunning(jobName, isRunning) {
    if (!this.runningJobs) {
      this.runningJobs = new Set();
    }
    
    if (isRunning) {
      this.runningJobs.add(jobName);
    } else {
      this.runningJobs.delete(jobName);
    }
  }

  /**
   * Get next run times for all scheduled jobs
   */
  getNextRunTimes() {
    const nextRuns = {};
    
    this.scheduledJobs.forEach((job, name) => {
      try {
        // Get next execution time from cron job
        const nextDate = job.nextDate();
        if (nextDate) {
          nextRuns[name] = nextDate.toISOString();
        }
      } catch (error) {
        console.warn(`⚠️ Could not get next run time for ${name}:`, error.message);
        nextRuns[name] = 'unknown';
      }
    });
    
    return nextRuns;
  }

  /**
   * Log next run times to console
   */
  logNextRunTimes() {
    const nextRuns = this.getNextRunTimes();
    console.log('⏰ Next scheduled cleanup runs:');
    
    Object.entries(nextRuns).forEach(([jobName, nextTime]) => {
      if (nextTime !== 'unknown') {
        const date = new Date(nextTime);
        console.log(`  - ${jobName}: ${date.toLocaleString()} UTC`);
      } else {
        console.log(`  - ${jobName}: Schedule unknown`);
      }
    });
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      is_running: this.isRunning,
      scheduled_jobs: Array.from(this.scheduledJobs.keys()),
      last_run_time: this.lastRunTime,
      next_run_times: this.getNextRunTimes(),
      enabled_jobs: this.enabledJobs,
      running_jobs: this.runningJobs ? Array.from(this.runningJobs) : []
    };
  }

  /**
   * Manual trigger for cleanup (for testing or emergency use)
   */
  async triggerManualCleanup(jobType = 'daily') {
    console.log(`🔧 Manual trigger for ${jobType} cleanup...`);
    
    if (this.isJobRunning(`manual_${jobType}`)) {
      return {
        success: false,
        error: 'Manual cleanup already running'
      };
    }
    
    let task;
    switch (jobType) {
      case 'daily':
        task = () => this.performDailyCleanup();
        break;
      case 'weekly':
        task = () => this.performWeeklyCleanup();
        break;
      case 'monthly':
        task = () => this.performMonthlyMaintenance();
        break;
      default:
        return {
          success: false,
          error: `Unknown cleanup type: ${jobType}`
        };
    }
    
    return await this.executeJob(`manual_${jobType}`, task);
  }
}

// Export singleton instance
export const cleanupScheduler = new CleanupScheduler();
export default cleanupScheduler;