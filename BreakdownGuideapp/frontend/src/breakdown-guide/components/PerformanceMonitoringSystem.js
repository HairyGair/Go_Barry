/**
 * Performance Monitoring System
 * Phase 2 Priority 5: System optimization and health tracking
 * 
 * Features:
 * - Real-time performance monitoring and metrics
 * - System health checks and alerting
 * - Resource usage tracking and optimization
 * - User experience monitoring
 * - Automated performance reporting
 */

class PerformanceMonitoringSystem {
    constructor() {
        this.metrics = new Map();
        this.healthChecks = new Map();
        this.performanceObserver = null;
        this.resourceObserver = null;
        this.userMetrics = new Map();
        this.alerts = [];
        
        this.config = {
            monitoringInterval: 30000, // 30 seconds
            healthCheckInterval: 60000, // 1 minute
            performanceThresholds: {
                pageLoadTime: 3000, // 3 seconds
                apiResponseTime: 1000, // 1 second
                memoryUsage: 100 * 1024 * 1024, // 100MB
                cacheHitRate: 0.8, // 80%
                errorRate: 0.01 // 1%
            },
            alertSeverityLevels: ['Low', 'Medium', 'High', 'Critical']
        };
        
        this.init();
    }
    
    init() {
        console.log('📈 Performance Monitoring System initializing...');
        
        // Set up performance observers
        this.setupPerformanceObservers();
        
        // Set up health checks
        this.setupHealthChecks();
        
        // Set up user experience monitoring
        this.setupUserExperienceMonitoring();
        
        // Set up resource monitoring
        this.setupResourceMonitoring();
        
        // Start monitoring intervals
        this.startMonitoring();
        
        console.log('✅ Performance Monitoring System initialized');
    }
    
    setupPerformanceObservers() {
        if ('PerformanceObserver' in window) {
            // Monitor navigation timing
            this.performanceObserver = new PerformanceObserver((list) => {
                list.getEntries().forEach(entry => {
                    this.processPerformanceEntry(entry);
                });
            });
            
            this.performanceObserver.observe({
                entryTypes: ['navigation', 'resource', 'measure', 'paint']
            });
        }
        
        // Monitor Long Tasks (if supported)
        if ('PerformanceObserver' in window) {
            try {
                const longTaskObserver = new PerformanceObserver((list) => {
                    list.getEntries().forEach(entry => {
                        this.trackLongTask(entry);
                    });
                });
                longTaskObserver.observe({ entryTypes: ['longtask'] });
            } catch (e) {
                console.log('Long task monitoring not supported');
            }
        }
    }
    
    setupHealthChecks() {
        // API connectivity check
        this.healthChecks.set('api_connectivity', {
            name: 'API Connectivity',
            check: () => this.checkApiConnectivity(),
            interval: 60000,
            threshold: 2000,
            lastCheck: 0,
            status: 'Unknown'
        });
        
        // WebSocket connectivity check
        this.healthChecks.set('websocket_connectivity', {
            name: 'WebSocket Connectivity',
            check: () => this.checkWebSocketConnectivity(),
            interval: 30000,
            threshold: 1000,
            lastCheck: 0,
            status: 'Unknown'
        });
        
        // Local storage health check
        this.healthChecks.set('local_storage', {
            name: 'Local Storage',
            check: () => this.checkLocalStorageHealth(),
            interval: 300000, // 5 minutes
            threshold: 100,
            lastCheck: 0,
            status: 'Unknown'
        });
        
        // Service Worker health check
        this.healthChecks.set('service_worker', {
            name: 'Service Worker',
            check: () => this.checkServiceWorkerHealth(),
            interval: 120000, // 2 minutes
            threshold: 500,
            lastCheck: 0,
            status: 'Unknown'
        });
        
        // Memory usage check
        this.healthChecks.set('memory_usage', {
            name: 'Memory Usage',
            check: () => this.checkMemoryUsage(),
            interval: 60000,
            threshold: this.config.performanceThresholds.memoryUsage,
            lastCheck: 0,
            status: 'Unknown'
        });
    }
    
    setupUserExperienceMonitoring() {
        // Track user interactions
        ['click', 'touch', 'keypress'].forEach(eventType => {
            document.addEventListener(eventType, (event) => {
                this.trackUserInteraction(eventType, event);
            });
        });
        
        // Track page visibility changes
        document.addEventListener('visibilitychange', () => {
            this.trackVisibilityChange();
        });
        
        // Track connection changes
        window.addEventListener('online', () => {
            this.trackConnectivityChange('online');
        });
        
        window.addEventListener('offline', () => {
            this.trackConnectivityChange('offline');
        });
        
        // Track errors
        window.addEventListener('error', (event) => {
            this.trackError('javascript', event);
        });
        
        window.addEventListener('unhandledrejection', (event) => {
            this.trackError('promise', event);
        });
    }
    
    setupResourceMonitoring() {
        if ('memory' in performance) {
            // Monitor memory usage
            setInterval(() => {
                this.trackMemoryUsage();
            }, 30000);
        }
        
        // Monitor DOM size
        setInterval(() => {
            this.trackDOMMetrics();
        }, 60000);
        
        // Monitor cache performance
        if ('caches' in window) {
            setInterval(() => {
                this.trackCachePerformance();
            }, 120000);
        }
    }
    
    startMonitoring() {
        // Main monitoring loop
        setInterval(() => {
            this.performHealthChecks();
            this.calculatePerformanceScores();
            this.checkThresholds();
        }, this.config.monitoringInterval);
        
        // Generate reports
        setInterval(() => {
            this.generatePerformanceReport();
        }, 300000); // Every 5 minutes
    }
    
    processPerformanceEntry(entry) {
        switch (entry.entryType) {
            case 'navigation':
                this.trackNavigationTiming(entry);
                break;
            case 'resource':
                this.trackResourceTiming(entry);
                break;
            case 'measure':
                this.trackCustomMeasure(entry);
                break;
            case 'paint':
                this.trackPaintTiming(entry);
                break;
        }
    }
    
    trackNavigationTiming(entry) {
        const timing = {
            pageLoadTime: entry.loadEventEnd - entry.fetchStart,
            domContentLoaded: entry.domContentLoadedEventEnd - entry.fetchStart,
            firstByte: entry.responseStart - entry.fetchStart,
            domInteractive: entry.domInteractive - entry.fetchStart,
            timestamp: Date.now()
        };
        
        this.updateMetric('navigation_timing', timing);
        
        // Check page load threshold
        if (timing.pageLoadTime > this.config.performanceThresholds.pageLoadTime) {
            this.createAlert('High Page Load Time', 
                `Page loaded in ${timing.pageLoadTime}ms`, 'Medium');
        }
    }
    
    trackResourceTiming(entry) {
        const resourceType = entry.initiatorType || 'unknown';
        const timing = {
            name: entry.name,
            type: resourceType,
            duration: entry.duration,
            size: entry.transferSize || 0,
            timestamp: Date.now()
        };
        
        this.updateMetricArray('resource_timing', timing);
        
        // Track slow resources
        if (timing.duration > 2000) { // 2 seconds
            this.createAlert('Slow Resource Load', 
                `${resourceType} took ${Math.round(timing.duration)}ms`, 'Low');
        }
    }
    
    trackCustomMeasure(entry) {
        this.updateMetric(`custom_measure_${entry.name}`, {
            duration: entry.duration,
            timestamp: Date.now()
        });
    }
    
    trackPaintTiming(entry) {
        this.updateMetric(`paint_${entry.name}`, {
            startTime: entry.startTime,
            timestamp: Date.now()
        });
    }
    
    trackLongTask(entry) {
        const longTask = {
            duration: entry.duration,
            startTime: entry.startTime,
            attribution: entry.attribution || [],
            timestamp: Date.now()
        };
        
        this.updateMetricArray('long_tasks', longTask);
        
        if (entry.duration > 100) { // 100ms threshold
            this.createAlert('Long Task Detected', 
                `Task blocked main thread for ${Math.round(entry.duration)}ms`, 'High');
        }
    }
    
    trackUserInteraction(type, event) {
        const interaction = {
            type: type,
            timestamp: Date.now(),
            target: event.target?.tagName || 'unknown',
            path: window.location.pathname
        };
        
        this.updateMetricArray('user_interactions', interaction);
        this.incrementMetric('total_interactions');
    }
    
    trackVisibilityChange() {
        const visibility = {
            state: document.visibilityState,
            timestamp: Date.now()
        };
        
        this.updateMetricArray('visibility_changes', visibility);
        
        if (document.visibilityState === 'visible') {
            this.incrementMetric('page_views');
        }
    }
    
    trackConnectivityChange(state) {
        const connectivity = {
            state: state,
            timestamp: Date.now(),
            connection: navigator.connection ? {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt
            } : null
        };
        
        this.updateMetricArray('connectivity_changes', connectivity);
        this.updateMetric('current_connectivity', state);
    }
    
    trackError(type, event) {
        const error = {
            type: type,
            message: event.message || event.reason?.message || 'Unknown error',
            filename: event.filename || 'unknown',
            lineno: event.lineno || 0,
            colno: event.colno || 0,
            stack: event.error?.stack || event.reason?.stack || '',
            timestamp: Date.now(),
            url: window.location.href
        };
        
        this.updateMetricArray('errors', error);
        this.incrementMetric('error_count');
        
        // Create alert for errors
        this.createAlert('Application Error', 
            `${type}: ${error.message}`, 'High');
    }
    
    trackMemoryUsage() {
        if ('memory' in performance) {
            const memory = {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit,
                timestamp: Date.now()
            };
            
            this.updateMetric('memory_usage', memory);
            
            // Check memory threshold
            if (memory.used > this.config.performanceThresholds.memoryUsage) {
                this.createAlert('High Memory Usage', 
                    `Memory usage: ${Math.round(memory.used / 1024 / 1024)}MB`, 'Medium');
            }
        }
    }
    
    trackDOMMetrics() {
        const dom = {
            nodes: document.querySelectorAll('*').length,
            depth: this.calculateDOMDepth(),
            size: new Blob([document.documentElement.outerHTML]).size,
            timestamp: Date.now()
        };
        
        this.updateMetric('dom_metrics', dom);
    }
    
    calculateDOMDepth() {
        let maxDepth = 0;
        
        function getDepth(element, currentDepth = 0) {
            maxDepth = Math.max(maxDepth, currentDepth);
            for (let child of element.children) {
                getDepth(child, currentDepth + 1);
            }
        }
        
        getDepth(document.body);
        return maxDepth;
    }
    
    async trackCachePerformance() {
        if ('caches' in window) {
            try {
                const cacheNames = await caches.keys();
                let totalRequests = 0;
                let totalHits = 0;
                
                // This is a simplified cache analysis
                // In production, you'd track cache hits/misses more accurately
                for (const cacheName of cacheNames) {
                    const cache = await caches.open(cacheName);
                    const requests = await cache.keys();
                    totalRequests += requests.length;
                    totalHits += Math.round(requests.length * 0.85); // Estimated hit rate
                }
                
                const hitRate = totalRequests > 0 ? totalHits / totalRequests : 0;
                
                this.updateMetric('cache_performance', {
                    hitRate: hitRate,
                    totalCaches: cacheNames.length,
                    totalRequests: totalRequests,
                    timestamp: Date.now()
                });
                
                if (hitRate < this.config.performanceThresholds.cacheHitRate) {
                    this.createAlert('Low Cache Hit Rate', 
                        `Cache hit rate: ${Math.round(hitRate * 100)}%`, 'Medium');
                }
            } catch (error) {
                console.error('Cache performance tracking failed:', error);
            }
        }
    }
    
    async performHealthChecks() {
        const now = Date.now();
        
        for (const [key, healthCheck] of this.healthChecks) {
            if (now - healthCheck.lastCheck > healthCheck.interval) {
                try {
                    const result = await healthCheck.check();
                    healthCheck.status = result.status;
                    healthCheck.lastCheck = now;
                    healthCheck.responseTime = result.responseTime;
                    healthCheck.details = result.details;
                    
                    // Check threshold
                    if (result.responseTime > healthCheck.threshold) {
                        this.createAlert(`${healthCheck.name} Slow Response`, 
                            `Response time: ${result.responseTime}ms`, 'Medium');
                    }
                    
                    if (result.status === 'Error') {
                        this.createAlert(`${healthCheck.name} Failed`, 
                            result.details || 'Health check failed', 'High');
                    }
                    
                } catch (error) {
                    healthCheck.status = 'Error';
                    healthCheck.lastCheck = now;
                    healthCheck.details = error.message;
                    
                    this.createAlert(`${healthCheck.name} Error`, 
                        error.message, 'High');
                }
            }
        }
    }
    
    async checkApiConnectivity() {
        const startTime = Date.now();
        
        try {
            const response = await fetch('/api/health', {
                method: 'GET',
                timeout: 5000
            });
            
            const responseTime = Date.now() - startTime;
            
            return {
                status: response.ok ? 'Healthy' : 'Warning',
                responseTime: responseTime,
                details: response.ok ? 'API responsive' : `HTTP ${response.status}`
            };
        } catch (error) {
            return {
                status: 'Error',
                responseTime: Date.now() - startTime,
                details: error.message
            };
        }
    }
    
    async checkWebSocketConnectivity() {
        const startTime = Date.now();
        
        if (window.RealTime) {
            const isConnected = window.RealTime.isConnected();
            const responseTime = Date.now() - startTime;
            
            return {
                status: isConnected ? 'Healthy' : 'Warning',
                responseTime: responseTime,
                details: isConnected ? 'WebSocket connected' : 'WebSocket disconnected'
            };
        }
        
        return {
            status: 'Warning',
            responseTime: Date.now() - startTime,
            details: 'WebSocket manager not available'
        };
    }
    
    async checkLocalStorageHealth() {
        const startTime = Date.now();
        
        try {
            const testKey = 'health_check_test';
            const testValue = Date.now().toString();
            
            localStorage.setItem(testKey, testValue);
            const retrieved = localStorage.getItem(testKey);
            localStorage.removeItem(testKey);
            
            const responseTime = Date.now() - startTime;
            
            return {
                status: retrieved === testValue ? 'Healthy' : 'Error',
                responseTime: responseTime,
                details: retrieved === testValue ? 'Local storage working' : 'Local storage read/write failed'
            };
        } catch (error) {
            return {
                status: 'Error',
                responseTime: Date.now() - startTime,
                details: error.message
            };
        }
    }
    
    async checkServiceWorkerHealth() {
        const startTime = Date.now();
        
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.ready;
                const responseTime = Date.now() - startTime;
                
                return {
                    status: registration.active ? 'Healthy' : 'Warning',
                    responseTime: responseTime,
                    details: registration.active ? 'Service worker active' : 'Service worker not active'
                };
            } catch (error) {
                return {
                    status: 'Error',
                    responseTime: Date.now() - startTime,
                    details: error.message
                };
            }
        }
        
        return {
            status: 'Warning',
            responseTime: Date.now() - startTime,
            details: 'Service worker not supported'
        };
    }
    
    async checkMemoryUsage() {
        const startTime = Date.now();
        
        if ('memory' in performance) {
            const memory = performance.memory;
            const responseTime = Date.now() - startTime;
            const usageRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
            
            return {
                status: usageRatio < 0.8 ? 'Healthy' : usageRatio < 0.9 ? 'Warning' : 'Error',
                responseTime: responseTime,
                details: `Memory usage: ${Math.round(usageRatio * 100)}% (${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB)`
            };
        }
        
        return {
            status: 'Warning',
            responseTime: Date.now() - startTime,
            details: 'Memory API not available'
        };
    }
    
    calculatePerformanceScores() {
        const scores = {
            overall: 0,
            performance: this.calculatePerformanceScore(),
            reliability: this.calculateReliabilityScore(),
            usability: this.calculateUsabilityScore(),
            timestamp: Date.now()
        };
        
        scores.overall = (scores.performance + scores.reliability + scores.usability) / 3;
        this.updateMetric('performance_scores', scores);
        
        return scores;
    }
    
    calculatePerformanceScore() {
        let score = 100;
        
        // Page load time impact
        const loadTime = this.getMetric('navigation_timing')?.pageLoadTime || 0;
        if (loadTime > 3000) score -= 20;
        else if (loadTime > 2000) score -= 10;
        
        // Memory usage impact
        const memory = this.getMetric('memory_usage');
        if (memory) {
            const usageRatio = memory.used / memory.limit;
            if (usageRatio > 0.8) score -= 15;
            else if (usageRatio > 0.6) score -= 5;
        }
        
        // Long tasks impact
        const longTasks = this.getMetricArray('long_tasks') || [];
        const recentLongTasks = longTasks.filter(task => 
            Date.now() - task.timestamp < 300000 // Last 5 minutes
        );
        score -= Math.min(20, recentLongTasks.length * 5);
        
        return Math.max(0, score);
    }
    
    calculateReliabilityScore() {
        let score = 100;
        
        // Error rate impact
        const errors = this.getMetricArray('errors') || [];
        const recentErrors = errors.filter(error => 
            Date.now() - error.timestamp < 300000 // Last 5 minutes
        );
        score -= Math.min(30, recentErrors.length * 10);
        
        // Health check failures
        let failedChecks = 0;
        this.healthChecks.forEach(check => {
            if (check.status === 'Error') failedChecks++;
        });
        score -= failedChecks * 15;
        
        // Connectivity issues
        const connectivity = this.getMetric('current_connectivity');
        if (connectivity === 'offline') score -= 25;
        
        return Math.max(0, score);
    }
    
    calculateUsabilityScore() {
        let score = 100;
        
        // User interaction responsiveness
        const interactions = this.getMetricArray('user_interactions') || [];
        const recentInteractions = interactions.filter(interaction => 
            Date.now() - interaction.timestamp < 300000 // Last 5 minutes
        );
        
        // If no interactions, assume good usability
        if (recentInteractions.length === 0) return score;
        
        // Cache performance impact
        const cache = this.getMetric('cache_performance');
        if (cache && cache.hitRate < 0.8) score -= 10;
        
        return Math.max(0, score);
    }
    
    checkThresholds() {
        const currentMetrics = this.getCurrentMetrics();
        
        // Check error rate
        const errors = this.getMetricArray('errors') || [];
        const recentErrors = errors.filter(error => 
            Date.now() - error.timestamp < 300000 // Last 5 minutes
        );
        const totalInteractions = this.getMetric('total_interactions') || 1;
        const errorRate = recentErrors.length / totalInteractions;
        
        if (errorRate > this.config.performanceThresholds.errorRate) {
            this.createAlert('High Error Rate', 
                `Error rate: ${Math.round(errorRate * 100)}%`, 'High');
        }
    }
    
    createAlert(title, message, severity = 'Medium') {
        const alert = {
            id: Date.now(),
            title: title,
            message: message,
            severity: severity,
            timestamp: Date.now(),
            acknowledged: false
        };
        
        this.alerts.unshift(alert);
        
        // Keep only last 50 alerts
        if (this.alerts.length > 50) {
            this.alerts = this.alerts.slice(0, 50);
        }
        
        console.log(`🚨 Performance Alert [${severity}]: ${title} - ${message}`);
        
        // Notify subscribers
        this.notifySubscribers('performance_alert', alert);
        
        // Show high/critical alerts as notifications
        if (severity === 'High' || severity === 'Critical') {
            if (window.PushNotificationManager) {
                window.PushNotificationManager.showInAppNotification(
                    `Performance Alert: ${title}`, 'warning'
                );
            }
        }
        
        return alert;
    }
    
    generatePerformanceReport() {
        const report = {
            timestamp: Date.now(),
            period: '5min',
            summary: {
                overall_score: this.calculatePerformanceScores().overall,
                health_status: this.getOverallHealthStatus(),
                active_alerts: this.alerts.filter(a => !a.acknowledged).length,
                total_errors: this.getMetricArray('errors')?.length || 0
            },
            metrics: this.getCurrentMetrics(),
            health_checks: this.getHealthCheckStatus(),
            alerts: this.alerts.slice(0, 10), // Recent alerts
            recommendations: this.generateRecommendations()
        };
        
        console.log('📊 Performance report generated');
        this.notifySubscribers('performance_report', report);
        
        return report;
    }
    
    getOverallHealthStatus() {
        let healthyCount = 0;
        let totalCount = 0;
        
        this.healthChecks.forEach(check => {
            totalCount++;
            if (check.status === 'Healthy') healthyCount++;
        });
        
        const healthyRatio = totalCount > 0 ? healthyCount / totalCount : 1;
        
        if (healthyRatio >= 0.9) return 'Excellent';
        if (healthyRatio >= 0.7) return 'Good';
        if (healthyRatio >= 0.5) return 'Fair';
        return 'Poor';
    }
    
    getHealthCheckStatus() {
        const status = {};
        this.healthChecks.forEach((check, key) => {
            status[key] = {
                name: check.name,
                status: check.status,
                responseTime: check.responseTime,
                lastCheck: check.lastCheck,
                details: check.details
            };
        });
        return status;
    }
    
    generateRecommendations() {
        const recommendations = [];
        
        // Performance recommendations
        const scores = this.getMetric('performance_scores');
        if (scores && scores.performance < 70) {
            recommendations.push({
                type: 'performance',
                priority: 'High',
                title: 'Optimize Page Performance',
                description: 'Consider code splitting, lazy loading, or resource optimization',
                impact: 'High'
            });
        }
        
        // Memory recommendations
        const memory = this.getMetric('memory_usage');
        if (memory && memory.used / memory.limit > 0.8) {
            recommendations.push({
                type: 'memory',
                priority: 'Medium',
                title: 'Optimize Memory Usage',
                description: 'Consider memory cleanup, object pooling, or reducing data retention',
                impact: 'Medium'
            });
        }
        
        // Error recommendations
        const errors = this.getMetricArray('errors') || [];
        const recentErrors = errors.filter(error => 
            Date.now() - error.timestamp < 3600000 // Last hour
        );
        if (recentErrors.length > 5) {
            recommendations.push({
                type: 'reliability',
                priority: 'High',
                title: 'Address Error Rate',
                description: 'High error rate detected. Review recent error logs and fix critical issues',
                impact: 'High'
            });
        }
        
        return recommendations;
    }
    
    // Utility methods
    updateMetric(key, value) {
        this.metrics.set(key, value);
    }
    
    updateMetricArray(key, value) {
        if (!this.metrics.has(key)) {
            this.metrics.set(key, []);
        }
        const array = this.metrics.get(key);
        array.push(value);
        
        // Keep only last 100 entries
        if (array.length > 100) {
            array.splice(0, array.length - 100);
        }
    }
    
    incrementMetric(key, amount = 1) {
        const current = this.metrics.get(key) || 0;
        this.metrics.set(key, current + amount);
    }
    
    getMetric(key) {
        return this.metrics.get(key);
    }
    
    getMetricArray(key) {
        return this.metrics.get(key) || [];
    }
    
    getCurrentMetrics() {
        const metrics = {};
        this.metrics.forEach((value, key) => {
            metrics[key] = value;
        });
        return metrics;
    }
    
    // Subscription management
    subscribe(eventType, callback) {
        if (!this.subscribers) {
            this.subscribers = new Map();
        }
        if (!this.subscribers.has(eventType)) {
            this.subscribers.set(eventType, new Set());
        }
        this.subscribers.get(eventType).add(callback);
    }
    
    unsubscribe(eventType, callback) {
        if (this.subscribers && this.subscribers.has(eventType)) {
            this.subscribers.get(eventType).delete(callback);
        }
    }
    
    notifySubscribers(eventType, data) {
        if (this.subscribers && this.subscribers.has(eventType)) {
            this.subscribers.get(eventType).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('❌ Performance monitoring subscriber error:', error);
                }
            });
        }
    }
    
    // Public API methods
    getPerformanceReport() {
        return this.generatePerformanceReport();
    }
    
    getActiveAlerts() {
        return this.alerts.filter(alert => !alert.acknowledged);
    }
    
    acknowledgeAlert(alertId) {
        const alert = this.alerts.find(a => a.id === alertId);
        if (alert) {
            alert.acknowledged = true;
            return true;
        }
        return false;
    }
    
    clearAcknowledgedAlerts() {
        this.alerts = this.alerts.filter(alert => !alert.acknowledged);
    }
    
    // Custom performance marks (for measuring specific operations)
    markStart(name) {
        if ('performance' in window && 'mark' in performance) {
            performance.mark(`${name}-start`);
        }
    }
    
    markEnd(name) {
        if ('performance' in window && 'mark' in performance && 'measure' in performance) {
            const endMark = `${name}-end`;
            const startMark = `${name}-start`;
            
            performance.mark(endMark);
            
            try {
                performance.measure(name, startMark, endMark);
            } catch (error) {
                console.warn('Performance measure failed:', error);
            }
        }
    }
}

// Performance Status Component
const PerformanceStatus = () => {
    const [report, setReport] = React.useState(null);
    const [alerts, setAlerts] = React.useState([]);
    
    React.useEffect(() => {
        if (window.PerformanceMonitoringSystem) {
            // Get initial report
            const initialReport = window.PerformanceMonitoringSystem.getPerformanceReport();
            setReport(initialReport);
            setAlerts(window.PerformanceMonitoringSystem.getActiveAlerts());
            
            // Subscribe to updates
            const handleReport = (data) => setReport(data);
            const handleAlert = (data) => setAlerts(prev => [data, ...prev.slice(0, 4)]);
            
            window.PerformanceMonitoringSystem.subscribe('performance_report', handleReport);
            window.PerformanceMonitoringSystem.subscribe('performance_alert', handleAlert);
            
            return () => {
                window.PerformanceMonitoringSystem.unsubscribe('performance_report', handleReport);
                window.PerformanceMonitoringSystem.unsubscribe('performance_alert', handleAlert);
            };
        }
    }, []);
    
    if (!report) {
        return React.createElement('div', {
            className: 'p-4 text-center text-gray-300'
        }, '📈 Loading performance data...');
    }
    
    const getScoreColor = (score) => {
        if (score >= 80) return 'text-green-400';
        if (score >= 60) return 'text-yellow-400';
        if (score >= 40) return 'text-orange-400';
        return 'text-red-400';
    };
    
    const getHealthColor = (status) => {
        switch (status) {
            case 'Excellent': return 'text-green-400';
            case 'Good': return 'text-blue-400';
            case 'Fair': return 'text-yellow-400';
            case 'Poor': return 'text-red-400';
            default: return 'text-gray-400';
        }
    };
    
    return React.createElement('div', {
        className: 'space-y-4'
    }, [
        React.createElement('h3', {
            key: 'title',
            className: 'text-lg font-semibold text-white'
        }, '📈 System Performance'),
        
        // Overall score
        React.createElement('div', {
            key: 'overall-score',
            className: 'p-4 bg-gray-800/40 rounded-lg border border-gray-600/30'
        }, [
            React.createElement('div', {
                key: 'score-header',
                className: 'flex items-center justify-between mb-2'
            }, [
                React.createElement('span', {
                    key: 'label',
                    className: 'text-sm text-gray-300'
                }, 'Overall Score'),
                React.createElement('span', {
                    key: 'value',
                    className: `text-xl font-bold ${getScoreColor(report.summary.overall_score)}`
                }, `${Math.round(report.summary.overall_score)}/100`)
            ]),
            
            React.createElement('div', {
                key: 'health-status',
                className: 'flex items-center justify-between'
            }, [
                React.createElement('span', {
                    key: 'health-label',
                    className: 'text-sm text-gray-300'
                }, 'Health Status'),
                React.createElement('span', {
                    key: 'health-value',
                    className: `text-sm font-medium ${getHealthColor(report.summary.health_status)}`
                }, report.summary.health_status)
            ])
        ]),
        
        // Active alerts
        alerts.length > 0 && React.createElement('div', {
            key: 'alerts',
            className: 'space-y-2'
        }, [
            React.createElement('h4', {
                key: 'alerts-title',
                className: 'text-sm font-medium text-white'
            }, `🚨 Active Alerts (${alerts.length})`),
            
            ...alerts.slice(0, 3).map(alert => 
                React.createElement('div', {
                    key: alert.id,
                    className: `p-2 rounded border ${
                        alert.severity === 'Critical' ? 'bg-red-500/20 border-red-400/30' :
                        alert.severity === 'High' ? 'bg-orange-500/20 border-orange-400/30' :
                        alert.severity === 'Medium' ? 'bg-yellow-500/20 border-yellow-400/30' :
                        'bg-blue-500/20 border-blue-400/30'
                    }`
                }, [
                    React.createElement('div', {
                        key: 'alert-title',
                        className: 'text-xs font-medium text-white'
                    }, alert.title),
                    React.createElement('div', {
                        key: 'alert-message',
                        className: 'text-xs text-gray-300 mt-1'
                    }, alert.message)
                ])
            )
        ]),
        
        // Quick metrics
        React.createElement('div', {
            key: 'quick-metrics',
            className: 'grid grid-cols-2 gap-3'
        }, [
            React.createElement('div', {
                key: 'errors',
                className: 'p-3 bg-red-500/20 border border-red-400/30 rounded-lg'
            }, [
                React.createElement('div', {
                    key: 'error-count',
                    className: 'text-lg font-bold text-red-200'
                }, report.summary.total_errors || 0),
                React.createElement('div', {
                    key: 'error-label',
                    className: 'text-xs text-red-300'
                }, 'Total Errors')
            ]),
            
            React.createElement('div', {
                key: 'active-alerts',
                className: 'p-3 bg-amber-500/20 border border-amber-400/30 rounded-lg'
            }, [
                React.createElement('div', {
                    key: 'alert-count',
                    className: 'text-lg font-bold text-amber-200'
                }, report.summary.active_alerts || 0),
                React.createElement('div', {
                    key: 'alert-label',
                    className: 'text-xs text-amber-300'
                }, 'Active Alerts')
            ])
        ])
    ]);
};

// Initialize Performance Monitoring
window.PerformanceMonitoringSystem = new PerformanceMonitoringSystem();

// Export components and utilities
window.PerformanceStatus = PerformanceStatus;
window.PerformanceMonitoring = {
    getReport: () => window.PerformanceMonitoringSystem.getPerformanceReport(),
    getActiveAlerts: () => window.PerformanceMonitoringSystem.getActiveAlerts(),
    acknowledgeAlert: (id) => window.PerformanceMonitoringSystem.acknowledgeAlert(id),
    markStart: (name) => window.PerformanceMonitoringSystem.markStart(name),
    markEnd: (name) => window.PerformanceMonitoringSystem.markEnd(name),
    subscribe: (eventType, callback) => window.PerformanceMonitoringSystem.subscribe(eventType, callback),
    unsubscribe: (eventType, callback) => window.PerformanceMonitoringSystem.unsubscribe(eventType, callback)
};

console.log('📈 Performance monitoring system loaded');
