// backend/services/timeBasedPollingManager.js
// Free Tier Compliance Manager for Go BARRY - Respects API call windows

class TimeBasedPollingManager {
  constructor() {
    this.allowedTimeStart = { hours: 5, minutes: 15 }; // 05:15
    this.allowedTimeEnd = { hours: 0, minutes: 15 };   // 00:15 (next day)
    this.lastPollTimes = new Map(); // Track last poll per source
    this.minimumIntervals = {
      tomtom: 60000,      // 1 minute (free tier: 1000 calls/day)
      here: 90000,        // 1.5 minutes (free tier: 250k/month)
      mapquest: 120000,   // 2 minutes (free tier: 15k/month)
      nationalHighways: 300000, // 5 minutes (government API - be respectful)
      streetmanager: 180000,     // 3 minutes (webhook-based, low overhead)
      manual_incidents: 30000    // 30 seconds (local data)
    };
    this.dailyCallCounts = new Map();
    this.lastResetDate = new Date().toDateString();
    this.isOverrideMode = false; // Emergency override
  }

  // Check if current time is within allowed polling window
  isWithinAllowedTime() {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;
    
    const startTime = this.allowedTimeStart.hours * 60 + this.allowedTimeStart.minutes;
    const endTime = this.allowedTimeEnd.hours * 60 + this.allowedTimeEnd.minutes; // 00:15 = 15 minutes
    
    // Handle overnight window (05:15 to 00:15 next day)
    if (startTime > endTime) {
      // Allowed from 05:15 to 23:59 OR from 00:00 to 00:15
      return currentTime >= startTime || currentTime <= endTime;
    } else {
      // Normal window within same day
      return currentTime >= startTime && currentTime <= endTime;
    }
  }

  // Check if specific source can be polled based on rate limits
  canPollSource(sourceName) {
    // Emergency override allows all polling
    if (this.isOverrideMode) {
      console.log(`🚨 OVERRIDE MODE: Allowing ${sourceName} poll despite restrictions`);
      return { allowed: true, reason: 'Emergency override active' };
    }

    // Check time window first
    if (!this.isWithinAllowedTime()) {
      return { 
        allowed: false, 
        reason: `Outside allowed polling window (05:15-00:15). Current time: ${new Date().toLocaleTimeString()}`,
        nextWindow: this.getNextAllowedTime()
      };
    }

    // Reset daily counters if needed
    this.resetDailyCountersIfNeeded();

    // Check minimum interval since last poll
    const lastPoll = this.lastPollTimes.get(sourceName);
    const minimumInterval = this.minimumIntervals[sourceName] || 60000;
    const now = Date.now();
    
    if (lastPoll && (now - lastPoll) < minimumInterval) {
      const remainingTime = minimumInterval - (now - lastPoll);
      return { 
        allowed: false, 
        reason: `Minimum interval not met. Wait ${Math.round(remainingTime/1000)}s`,
        remainingTime: remainingTime
      };
    }

    // Check daily limits (conservative estimates for free tiers)
    const dailyLimits = {
      tomtom: 800,        // Conservative: 800/1000 daily limit
      here: 1000,         // Conservative: ~1000 calls/day (250k/month)
      mapquest: 400,      // Conservative: 400/500 daily limit  
      nationalHighways: 200, // Conservative for government API
      streetmanager: 500, // Webhook-based, but still limit
      manual_incidents: 2000 // Local data, higher limit
    };

    const dailyCount = this.dailyCallCounts.get(sourceName) || 0;
    const dailyLimit = dailyLimits[sourceName] || 100;

    if (dailyCount >= dailyLimit) {
      return { 
        allowed: false, 
        reason: `Daily limit reached (${dailyCount}/${dailyLimit})`,
        resetTime: this.getNextDayReset()
      };
    }

    return { allowed: true, reason: 'Within limits' };
  }

  // Record successful poll
  recordPoll(sourceName, success = true) {
    const now = Date.now();
    this.lastPollTimes.set(sourceName, now);
    
    if (success) {
      const currentCount = this.dailyCallCounts.get(sourceName) || 0;
      this.dailyCallCounts.set(sourceName, currentCount + 1);
      
      console.log(`✅ Recorded poll for ${sourceName}: ${currentCount + 1} calls today`);
    }
  }

  // Get next allowed polling time
  getNextAllowedTime() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (now.getHours() >= 0 && now.getHours() < 5) {
      // Currently in early morning, next window is 05:15 today
      const nextWindow = new Date(now);
      nextWindow.setHours(5, 15, 0, 0);
      return nextWindow;
    } else {
      // Past 05:15 today, next window is 05:15 tomorrow
      const nextWindow = new Date(tomorrow);
      nextWindow.setHours(5, 15, 0, 0);
      return nextWindow;
    }
  }

  // Get time until daily reset
  getNextDayReset() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  }

  // Reset daily counters if new day
  resetDailyCountersIfNeeded() {
    const currentDate = new Date().toDateString();
    if (currentDate !== this.lastResetDate) {
      console.log(`🔄 Resetting daily API call counters for new day: ${currentDate}`);
      this.dailyCallCounts.clear();
      this.lastResetDate = currentDate;
    }
  }

  // Emergency override for critical situations
  enableEmergencyOverride(reason, durationMinutes = 60) {
    this.isOverrideMode = true;
    console.log(`🚨 EMERGENCY OVERRIDE ENABLED: ${reason} (${durationMinutes} minutes)`);
    
    // Auto-disable after specified duration
    setTimeout(() => {
      this.isOverrideMode = false;
      console.log(`✅ Emergency override automatically disabled after ${durationMinutes} minutes`);
    }, durationMinutes * 60 * 1000);
  }

  disableEmergencyOverride() {
    this.isOverrideMode = false;
    console.log(`✅ Emergency override manually disabled`);
  }

  // Get comprehensive status
  getStatus() {
    const now = new Date();
    const withinWindow = this.isWithinAllowedTime();
    
    return {
      currentTime: now.toISOString(),
      withinAllowedWindow: withinWindow,
      allowedWindow: "05:15 - 00:15 (19 hours daily)",
      emergencyOverride: this.isOverrideMode,
      nextAllowedTime: withinWindow ? null : this.getNextAllowedTime().toISOString(),
      dailyCounts: Object.fromEntries(this.dailyCallCounts),
      lastPollTimes: Object.fromEntries(
        Array.from(this.lastPollTimes.entries()).map(([key, value]) => [
          key, 
          new Date(value).toISOString()
        ])
      ),
      limits: {
        daily: {
          tomtom: "800/1000 calls",
          here: "1000 calls (~250k/month)",
          mapquest: "400/500 calls", 
          nationalHighways: "200 calls (conservative)",
          streetmanager: "500 calls (webhook-based)",
          manual_incidents: "2000 calls (local)"
        },
        intervals: {
          tomtom: "60 seconds",
          here: "90 seconds", 
          mapquest: "120 seconds",
          nationalHighways: "300 seconds",
          streetmanager: "180 seconds",
          manual_incidents: "30 seconds"
        }
      }
    };
  }

  // Get optimized polling schedule
  getOptimizedSchedule() {
    const sources = Object.keys(this.minimumIntervals);
    const schedule = {};
    
    sources.forEach(source => {
      const pollCheck = this.canPollSource(source);
      const interval = this.minimumIntervals[source];
      const dailyCount = this.dailyCallCounts.get(source) || 0;
      
      schedule[source] = {
        canPollNow: pollCheck.allowed,
        reason: pollCheck.reason,
        nextPollIn: pollCheck.remainingTime || 0,
        minimumInterval: `${interval/1000}s`,
        dailyUsage: dailyCount,
        status: pollCheck.allowed ? 'READY' : 'WAITING'
      };
    });
    
    return {
      timestamp: new Date().toISOString(),
      overallStatus: this.isWithinAllowedTime() ? 'ACTIVE_WINDOW' : 'OUTSIDE_WINDOW',
      emergencyMode: this.isOverrideMode,
      sources: schedule
    };
  }
}

// Create singleton instance
const timeBasedPollingManager = new TimeBasedPollingManager();

export default timeBasedPollingManager;
