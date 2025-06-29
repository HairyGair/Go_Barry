// Analytics Service for Go BARRY
import React from 'react';
import { Platform, Dimensions } from 'react-native';

class AnalyticsService {
  constructor() {
    this.queue = [];
    this.sessionId = this.generateSessionId();
    this.userId = null;
    this.isInitialized = false;
    this.debugMode = process.env.NODE_ENV === 'development';
  }

  // Initialize analytics with configuration
  init(config = {}) {
    const {
      apiKey = process.env.EXPO_PUBLIC_ANALYTICS_KEY,
      endpoint = 'https://go-barry.onrender.com/api/analytics',
      flushInterval = 30000, // 30 seconds
      enableAutoTracking = true,
    } = config;

    this.config = { apiKey, endpoint, flushInterval, enableAutoTracking };
    this.isInitialized = true;

    if (Platform.OS === 'web' && enableAutoTracking) {
      this.setupAutoTracking();
    }

    // Start flush interval
    this.flushInterval = setInterval(() => this.flush(), flushInterval);

    this.track('session_start', {
      platform: Platform.OS,
      userAgent: Platform.OS === 'web' ? navigator.userAgent : 'React Native',
      screenResolution: this.getScreenResolution(),
    });

    if (this.debugMode) {
      console.log('📊 Analytics initialized:', this.config);
    }
  }

  // Generate unique session ID
  generateSessionId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Set user identification
  identify(userId, traits = {}) {
    this.userId = userId;
    this.track('user_identified', {
      userId,
      ...traits,
    });
  }

  // Track custom events
  track(eventName, properties = {}) {
    if (!this.isInitialized) {
      console.warn('Analytics not initialized. Call init() first.');
      return;
    }

    const event = {
      event: eventName,
      properties: {
        ...properties,
        sessionId: this.sessionId,
        userId: this.userId,
        timestamp: new Date().toISOString(),
        platform: Platform.OS,
      },
    };

    this.queue.push(event);

    if (this.debugMode) {
      console.log('📊 Event tracked:', event);
    }

    // Auto-flush if queue is getting large
    if (this.queue.length >= 50) {
      this.flush();
    }
  }

  // Page view tracking
  pageView(pageName, properties = {}) {
    this.track('page_view', {
      page: pageName,
      url: Platform.OS === 'web' ? window.location.href : pageName,
      referrer: Platform.OS === 'web' ? document.referrer : null,
      ...properties,
    });
  }

  // Track user interactions
  interaction(action, category, label, value) {
    this.track('user_interaction', {
      action,
      category,
      label,
      value,
    });
  }

  // Track performance metrics
  performance(metric, value, unit = 'ms') {
    this.track('performance_metric', {
      metric,
      value,
      unit,
    });
  }

  // Track errors
  error(errorMessage, errorStack, context = {}) {
    this.track('error_occurred', {
      errorMessage,
      errorStack,
      ...context,
    });
  }

  // Feature usage tracking
  featureUsed(featureName, properties = {}) {
    this.track('feature_used', {
      feature: featureName,
      ...properties,
    });
  }

  // Track API calls
  apiCall(endpoint, method, statusCode, duration) {
    this.track('api_call', {
      endpoint,
      method,
      statusCode,
      duration,
      success: statusCode >= 200 && statusCode < 300,
    });
  }

  // Setup automatic tracking for web
  setupAutoTracking() {
    if (Platform.OS !== 'web') return;

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      this.track('visibility_change', {
        visible: !document.hidden,
      });
    });

    // Track clicks
    document.addEventListener('click', (e) => {
      const target = e.target;
      const tagName = target.tagName;
      const text = target.innerText || target.value || target.alt;
      const href = target.href;
      
      if (['A', 'BUTTON', 'INPUT'].includes(tagName)) {
        this.interaction('click', tagName.toLowerCase(), text, href);
      }
    });

    // Track form submissions
    document.addEventListener('submit', (e) => {
      const form = e.target;
      const formName = form.name || form.id || 'unknown';
      this.track('form_submit', { formName });
    });

    // Track errors
    window.addEventListener('error', (e) => {
      this.error(e.message, e.error?.stack, {
        filename: e.filename,
        lineno: e.lineno,
        colno: e.colno,
      });
    });

    // Track performance
    if (window.performance && window.performance.timing) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const timing = window.performance.timing;
          const loadTime = timing.loadEventEnd - timing.navigationStart;
          const domReady = timing.domContentLoadedEventEnd - timing.navigationStart;
          const firstPaint = window.performance.getEntriesByType('paint')[0]?.startTime;

          this.performance('page_load_time', loadTime);
          this.performance('dom_ready_time', domReady);
          if (firstPaint) {
            this.performance('first_paint', firstPaint);
          }
        }, 0);
      });
    }
  }

  // Flush events to server
  async flush() {
    if (this.queue.length === 0) return;

    const events = [...this.queue];
    this.queue = [];

    try {
      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.config.apiKey,
        },
        body: JSON.stringify({ events }),
      });

      if (!response.ok) {
        // Re-queue events if send failed
        this.queue.unshift(...events);
        console.error('Analytics flush failed:', response.status);
      } else if (this.debugMode) {
        console.log(`📊 Flushed ${events.length} events`);
      }
    } catch (error) {
      // Re-queue events if send failed
      this.queue.unshift(...events);
      console.error('Analytics flush error:', error);
    }
  }

  // Get screen resolution
  getScreenResolution() {
    if (Platform.OS === 'web') {
      return `${window.screen.width}x${window.screen.height}`;
    }
    const { width, height } = Dimensions.get('window');
    return `${width}x${height}`;
  }

  // Clean up
  destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flush();
    this.track('session_end', {
      duration: Date.now() - parseInt(this.sessionId.split('-')[0]),
    });
  }
}

// Create singleton instance
const analytics = new AnalyticsService();

// React hooks for analytics
export const useAnalytics = () => {
  return {
    track: (eventName, properties) => analytics.track(eventName, properties),
    pageView: (pageName, properties) => analytics.pageView(pageName, properties),
    interaction: (action, category, label, value) => 
      analytics.interaction(action, category, label, value),
    featureUsed: (featureName, properties) => 
      analytics.featureUsed(featureName, properties),
    error: (errorMessage, errorStack, context) => 
      analytics.error(errorMessage, errorStack, context),
  };
};

// React component for page tracking
export const AnalyticsPageView = ({ pageName, children }) => {
  React.useEffect(() => {
    analytics.pageView(pageName);
  }, [pageName]);

  return children;
};

export default analytics;