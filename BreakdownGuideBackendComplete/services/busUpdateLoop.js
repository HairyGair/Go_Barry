import busLocationService from './busLocationService.js';
import convexSync from './convexSync.js';

class BusUpdateLoop {
  constructor() {
    this.intervalId = null;
    this.isRunning = false;
    this.updateInterval = parseInt(process.env.BODS_UPDATE_INTERVAL) || 10000;
  }
  
  // Start the update loop
  start() {
    // EMERGENCY: Disable bus update loop due to persistent errors
    console.log('🚨 Bus update loop DISABLED due to persistent Convex/sync errors');
    console.log('⚠️ Bus locations will not be updated until sync is fixed');
    this.isRunning = false;
    return;
    
    if (this.isRunning) {
      console.log('⚠️ Bus update loop already running');
      return;
    }
    
    console.log(`🚌 Starting bus update loop (every ${this.updateInterval}ms)`);
    this.isRunning = true;
    
    // Initial update
    this.performUpdate();
    
    // Schedule regular updates
    this.intervalId = setInterval(() => {
      this.performUpdate();
    }, this.updateInterval);
  }
  
  // Perform single update
  async performUpdate() {
    try {
      const startTime = Date.now();
      
      // Fetch and sync
      await convexSync.syncBusLocations();
      
      const duration = Date.now() - startTime;
      console.log(`⏱️ Bus update completed in ${duration}ms`);
      
    } catch (error) {
      console.error('❌ Bus update failed:', error);
    }
  }
  
  // Stop the loop
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isRunning = false;
      console.log('🛑 Bus update loop stopped');
    }
  }
  
  // Get status
  getStatus() {
    return {
      running: this.isRunning,
      updateInterval: this.updateInterval,
      health: busLocationService.getHealth()
    };
  }
}

export default new BusUpdateLoop();
