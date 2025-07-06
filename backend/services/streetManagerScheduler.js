/**
 * Street Manager Cleanup Scheduler
 * Runs daily cleanup jobs to maintain hybrid storage system
 */

import HybridStreetManagerStorage from './hybridStreetManagerStorage.js';

class StreetManagerScheduler {
  constructor() {
    this.hybridStorage = new HybridStreetManagerStorage();
    this.cleanupInterval = null;
    this.isRunning = false;
  }

  /**
   * Start the scheduler
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️ Street Manager scheduler already running');
      return;
    }

    console.log('🕒 Starting Street Manager cleanup scheduler');
    console.log('📅 Daily cleanup at 2:00 AM (removes data 7+ days old)');
    
    // Run immediately if we haven't cleaned up in 24+ hours
    this.checkForInitialCleanup();
    
    // Schedule daily cleanup at 2 AM
    this.scheduleDaily();
    
    this.isRunning = true;
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.isRunning = false;
    console.log('🛑 Street Manager scheduler stopped');
  }

  /**
   * Check if we need an initial cleanup
   */
  async checkForInitialCleanup() {
    try {
      // Check last cleanup job
      const { data: lastCleanup } = await this.hybridStorage.supabase
        .from('cleanup_jobs')
        .select('run_date')
        .eq('job_type', 'streetmanager_cleanup')
        .order('run_date', { ascending: false })
        .limit(1);

      const now = new Date();
      let shouldRunCleanup = false;

      if (!lastCleanup || lastCleanup.length === 0) {
        console.log('🧹 No previous cleanup found - running initial cleanup');
        shouldRunCleanup = true;
      } else {
        const lastCleanupDate = new Date(lastCleanup[0].run_date);
        const hoursSinceLastCleanup = (now - lastCleanupDate) / (1000 * 60 * 60);
        
        if (hoursSinceLastCleanup >= 24) {
          console.log(`🧹 Last cleanup was ${Math.round(hoursSinceLastCleanup)} hours ago - running cleanup`);
          shouldRunCleanup = true;
        } else {
          console.log(`✅ Last cleanup was ${Math.round(hoursSinceLastCleanup)} hours ago - no cleanup needed`);
        }
      }

      if (shouldRunCleanup) {
        await this.runCleanup();
      }
    } catch (error) {
      console.error('❌ Failed to check initial cleanup:', error);
    }
  }

  /**
   * Schedule daily cleanup at 2 AM
   */
  scheduleDaily() {
    // Check every hour if it's time for cleanup
    this.cleanupInterval = setInterval(async () => {
      const now = new Date();
      
      // Run at 2 AM (02:00)
      if (now.getHours() === 2 && now.getMinutes() < 5) {
        await this.runCleanup();
      }
    }, 5 * 60 * 1000); // Check every 5 minutes during the 2 AM hour
  }

  /**
   * Run the cleanup job
   */
  async runCleanup() {
    try {
      console.log('🧹 Starting scheduled Street Manager cleanup...');
      
      const result = await this.hybridStorage.runCleanupJob();
      
      if (result.success) {
        console.log(`✅ Cleanup completed: ${result.cleanedCount} old notifications removed`);
        
        // Log storage stats after cleanup
        const stats = await this.hybridStorage.getStorageStats();
        console.log(`📊 Storage after cleanup: ${stats.database.size_estimate} (DB) + ${stats.files.size_estimate} (files)`);
      } else {
        console.error('❌ Cleanup failed:', result.error);
      }
    } catch (error) {
      console.error('❌ Cleanup scheduler error:', error);
    }
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      running: this.isRunning,
      next_cleanup: this.getNextCleanupTime(),
      schedule: 'Daily at 2:00 AM',
      retention_policy: '7 days after roadwork completion'
    };
  }

  /**
   * Calculate next cleanup time
   */
  getNextCleanupTime() {
    const now = new Date();
    const tomorrow2AM = new Date(now);
    tomorrow2AM.setDate(tomorrow2AM.getDate() + 1);
    tomorrow2AM.setHours(2, 0, 0, 0);
    
    // If it's already past 2 AM today, next cleanup is tomorrow
    if (now.getHours() >= 2) {
      return tomorrow2AM.toISOString();
    } else {
      // If it's before 2 AM today, next cleanup is today
      const today2AM = new Date(now);
      today2AM.setHours(2, 0, 0, 0);
      return today2AM.toISOString();
    }
  }
}

// Create singleton instance
const streetManagerScheduler = new StreetManagerScheduler();

export default streetManagerScheduler;