// utils/requestThrottler.js
// Request throttling system for API rate limiting with business hours

class RequestThrottler {
  constructor(requestsPerDay = 2500, serviceName = 'Unknown', businessHours = null) {
    this.requestsPerDay = requestsPerDay;
    this.serviceName = serviceName;
    
    // Business hours: 6:00 AM to 12:15 AM (18.25 hours)
    this.businessHours = businessHours || {
      startHour: 6,    // 6:00 AM
      startMinute: 0,
      endHour: 0,      // 12:15 AM (next day)
      endMinute: 15
    };
    
    // Calculate operating hours per day
    this.operatingHours = this.calculateOperatingHours();
    this.msPerOperatingDay = this.operatingHours * 60 * 60 * 1000;
    this.msPerRequest = this.msPerOperatingDay / requestsPerDay;
    
    // State tracking
    this.requestQueue = [];
    this.isProcessing = false;
    this.dailyCount = 0;
    this.lastResetTime = Date.now();
    
    console.log(`🕐 ${serviceName} throttler: ${requestsPerDay} requests/day over ${this.operatingHours}h = 1 request every ${Math.round(this.msPerRequest/1000)}s`);
    console.log(`📅 Business hours: ${this.formatBusinessHours()}`);
  }
  
  // Calculate operating hours (handles day transition at midnight)
  calculateOperatingHours() {
    const { startHour, startMinute, endHour, endMinute } = this.businessHours;
    
    // Convert to minutes
    const startMinutes = startHour * 60 + startMinute;
    let endMinutes = endHour * 60 + endMinute;
    
    // If end is next day (like 12:15 AM), add 24 hours
    if (endMinutes < startMinutes) {
      endMinutes += 24 * 60;
    }
    
    const totalMinutes = endMinutes - startMinutes;
    return totalMinutes / 60; // Return as hours
  }
  
  // Format business hours for display
  formatBusinessHours() {
    const { startHour, startMinute, endHour, endMinute } = this.businessHours;
    
    const formatTime = (hour, minute) => {
      const h = hour === 0 ? 12 : (hour > 12 ? hour - 12 : hour);
      const ampm = hour < 12 ? 'AM' : 'PM';
      const m = minute.toString().padStart(2, '0');
      return `${h}:${m} ${ampm}`;
    };
    
    const start = formatTime(startHour, startMinute);
    const end = formatTime(endHour === 0 ? 24 : endHour, endMinute);
    
    return `${start} - ${end} (${this.operatingHours}h operating)`;
  }
  
  // Check if current time is within business hours
  isWithinBusinessHours(time = new Date()) {
    const hour = time.getHours();
    const minute = time.getMinutes();
    const currentMinutes = hour * 60 + minute;
    
    const { startHour, startMinute, endHour, endMinute } = this.businessHours;
    const startMinutes = startHour * 60 + startMinute;
    let endMinutes = endHour * 60 + endMinute;
    
    // Handle day transition (end time is next day)
    if (endMinutes < startMinutes) {
      // Business hours cross midnight
      return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
    } else {
      // Normal business hours within same day
      return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    }
  }
  
  // Get milliseconds until next business hours start
  msUntilBusinessHours(time = new Date()) {
    const { startHour, startMinute } = this.businessHours;
    
    const now = new Date(time);
    const nextStart = new Date(now);
    nextStart.setHours(startHour, startMinute, 0, 0);
    
    // If we've passed today's start time, use tomorrow's start
    if (nextStart <= now) {
      nextStart.setDate(nextStart.getDate() + 1);
    }
    
    return nextStart.getTime() - now.getTime();
  }
  
  // Add request to queue
  async makeRequest(requestFn, context = 'unknown') {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({
        requestFn,
        context,
        resolve,
        reject,
        timestamp: Date.now()
      });
      
      this.processQueue();
    });
  }
  
  // Process queued requests with business hours and throttling
  async processQueue() {
    if (this.isProcessing || this.requestQueue.length === 0) {
      return;
    }
    
    this.isProcessing = true;
    
    try {
      while (this.requestQueue.length > 0) {
        // Check if we're within business hours
        const now = new Date();
        if (!this.isWithinBusinessHours(now)) {
          const msUntilOpen = this.msUntilBusinessHours(now);
          const hoursUntilOpen = Math.round(msUntilOpen / (1000 * 60 * 60));
          
          console.log(`🚫 ${this.serviceName}: Outside business hours. Waiting ${hoursUntilOpen}h until 6:00 AM`);
          
          // Schedule to retry when business hours start
          setTimeout(() => {
            this.isProcessing = false;
            this.processQueue();
          }, Math.min(msUntilOpen, 30 * 60 * 1000)); // Check every 30 minutes max
          
          return;
        }
        
        // Check if we need to reset daily counter
        this.checkDailyReset();
        
        // Check daily limit
        if (this.dailyCount >= this.requestsPerDay) {
          console.warn(`⚠️ ${this.serviceName}: Daily limit reached (${this.dailyCount}/${this.requestsPerDay})`);
          this.rejectAllPending('Daily rate limit exceeded');
          break;
        }
        
        const request = this.requestQueue.shift();
        const waitTime = Math.max(0, this.msPerRequest - (Date.now() - (this.lastRequestTime || 0)));
        
        if (waitTime > 0) {
          console.log(`⏱️ ${this.serviceName}: Waiting ${Math.round(waitTime/1000)}s for rate limit (${request.context})`);
          await this.sleep(waitTime);
        }
        
        // Double-check business hours after waiting
        if (!this.isWithinBusinessHours()) {
          console.log(`🚫 ${this.serviceName}: Business hours ended during wait, re-queuing request`);
          this.requestQueue.unshift(request); // Put back at front
          this.isProcessing = false;
          this.processQueue(); // Restart processing
          return;
        }
        
        try {
          console.log(`📡 ${this.serviceName}: Making request ${this.dailyCount + 1}/${this.requestsPerDay} (${request.context})`);
          
          const result = await request.requestFn();
          this.dailyCount++;
          this.lastRequestTime = Date.now();
          
          request.resolve(result);
          
        } catch (error) {
          console.error(`❌ ${this.serviceName}: Request failed (${request.context}):`, error.message);
          request.reject(error);
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }
  
  // Reset daily counter (only during business hours)
  checkDailyReset() {
    const now = Date.now();
    const msInDay = 24 * 60 * 60 * 1000;
    
    if (now - this.lastResetTime >= msInDay) {
      console.log(`🔄 ${this.serviceName}: Daily counter reset (was ${this.dailyCount})`);
      this.dailyCount = 0;
      this.lastResetTime = now;
    }
  }
  
  // Reject all pending requests
  rejectAllPending(reason) {
    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift();
      request.reject(new Error(reason));
    }
  }
  
  // Get status
  getStatus() {
    const now = new Date();
    const withinHours = this.isWithinBusinessHours(now);
    
    return {
      serviceName: this.serviceName,
      dailyCount: this.dailyCount,
      dailyLimit: this.requestsPerDay,
      queueLength: this.requestQueue.length,
      isProcessing: this.isProcessing,
      msPerRequest: this.msPerRequest,
      remainingToday: this.requestsPerDay - this.dailyCount,
      businessHours: {
        formatted: this.formatBusinessHours(),
        operatingHours: this.operatingHours,
        currentlyOpen: withinHours,
        nextOpenTime: withinHours ? null : new Date(Date.now() + this.msUntilBusinessHours()).toISOString()
      }
    };
  }
  
  // Simple sleep utility
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Global throttlers for different services with Go North East business hours
const businessHours = {
  startHour: 6,    // 6:00 AM
  startMinute: 0,
  endHour: 0,      // 12:15 AM (next day)
  endMinute: 15
};

const geocodingThrottler = new RequestThrottler(2000, 'Geocoding', businessHours); // Leave some margin
const tomtomThrottler = new RequestThrottler(2500, 'TomTom', businessHours);

export { RequestThrottler, geocodingThrottler, tomtomThrottler };
