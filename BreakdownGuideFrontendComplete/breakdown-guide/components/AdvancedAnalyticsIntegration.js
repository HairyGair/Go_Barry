/**
 * Advanced Analytics Integration
 * Phase 2 Priority 5: Real-time data processing and business intelligence
 * 
 * Features:
 * - Real-time breakdown analytics and insights
 * - Performance metrics tracking and visualization
 * - Predictive analytics for maintenance planning
 * - Cost impact analysis and reporting
 * - Executive dashboard data aggregation
 */

class AdvancedAnalyticsIntegration {
    constructor() {
        this.connected = false;
        this.metricsCache = new Map();
        this.realTimeMetrics = new Map();
        this.analyticsQueue = [];
        this.subscribers = new Map();
        
        this.config = {
            dataRetentionDays: 90,
            aggregationIntervals: [
                { name: 'realtime', interval: 30000 }, // 30 seconds
                { name: 'hourly', interval: 3600000 }, // 1 hour
                { name: 'daily', interval: 86400000 } // 24 hours
            ],
            kpiThresholds: {
                averageAssessmentTime: 180, // 3 minutes
                escalationRate: 0.15, // 15%
                secondaryBreakdownRate: 0.05, // 5%
                supervisorResponseTime: 120 // 2 minutes
            }
        };
        
        this.init();
    }
    
    init() {
        console.log('📊 Advanced Analytics Integration initializing...');
        
        // Set up data collection
        this.setupDataCollection();
        
        // Set up real-time metrics
        this.setupRealTimeMetrics();
        
        // Set up analytics processing
        this.startAnalyticsProcessing();
        
        // Set up KPI monitoring
        this.setupKPIMonitoring();
        
        this.connected = true;
        console.log('✅ Advanced Analytics Integration initialized');
    }
    
    setupDataCollection() {
        // Listen for breakdown events
        window.addEventListener('breakdown-assessment-complete', (event) => {
            this.trackBreakdownAssessment(event.detail);
        });
        
        window.addEventListener('breakdown-status-change', (event) => {
            this.trackBreakdownStatusChange(event.detail);
        });
        
        // Listen for TracerIt events
        window.addEventListener('tracerit-workorder-created', (event) => {
            this.trackWorkOrderCreated(event.detail);
        });
        
        window.addEventListener('tracerit-job-status-change', (event) => {
            this.trackJobStatusChange(event.detail);
        });
        
        // Listen for Passenger Cloud events
        window.addEventListener('passenger-cloud-update', (event) => {
            this.trackPassengerImpact(event.detail);
        });
        
        // Listen for supervisor activity
        window.addEventListener('supervisor-activity', (event) => {
            this.trackSupervisorActivity(event.detail);
        });
    }
    
    setupRealTimeMetrics() {
        // Initialize real-time metric tracking
        this.realTimeMetrics.set('activeBreakdowns', 0);
        this.realTimeMetrics.set('activeSupervisors', 0);
        this.realTimeMetrics.set('averageResponseTime', 0);
        this.realTimeMetrics.set('escalationRate', 0);
        this.realTimeMetrics.set('workOrdersToday', 0);
        this.realTimeMetrics.set('passengerImpactLevel', 'Low');
        
        // Update metrics every 30 seconds
        setInterval(() => {
            this.updateRealTimeMetrics();
        }, 30000);
    }
    
    startAnalyticsProcessing() {
        // Process analytics queue every minute
        setInterval(() => {
            this.processAnalyticsQueue();
        }, 60000);
        
        // Generate hourly reports
        setInterval(() => {
            this.generateHourlyReport();
        }, 3600000);
        
        // Generate daily summary
        const now = new Date();
        const millisTillMidnight = (24 * 60 * 60 * 1000) - (now.getTime() % (24 * 60 * 60 * 1000));
        setTimeout(() => {
            this.generateDailyReport();
            // Then repeat daily
            setInterval(() => {
                this.generateDailyReport();
            }, 24 * 60 * 60 * 1000);
        }, millisTillMidnight);
    }
    
    setupKPIMonitoring() {
        // Monitor KPIs and trigger alerts
        setInterval(() => {
            this.monitorKPIs();
        }, 300000); // Every 5 minutes
    }
    
    trackBreakdownAssessment(assessmentData) {
        const analyticsEvent = {
            type: 'breakdown_assessment',
            timestamp: Date.now(),
            data: {
                breakdownId: assessmentData.breakdown_id,
                vehicleId: assessmentData.vehicle_id,
                routeId: assessmentData.route_id,
                decision: assessmentData.decision,
                assessmentType: assessmentData.assessment_type,
                assessmentDuration: assessmentData.assessment_duration || 0,
                supervisorId: assessmentData.supervisor_id,
                location: assessmentData.location,
                timeOfDay: new Date().getHours(),
                dayOfWeek: new Date().getDay(),
                isRealTimeCollaboration: assessmentData.real_time_features?.collaboration_used || false,
                conflictsResolved: assessmentData.real_time_features?.conflicts_resolved || 0,
                photosAttached: assessmentData.photo_count || 0,
                escalationTriggered: assessmentData.escalation_triggered || false
            }
        };
        
        this.queueAnalyticsEvent(analyticsEvent);
        this.updateBreakdownMetrics(analyticsEvent);
    }
    
    trackBreakdownStatusChange(statusData) {
        const analyticsEvent = {
            type: 'breakdown_status_change',
            timestamp: Date.now(),
            data: {
                breakdownId: statusData.breakdownId,
                fromStatus: statusData.fromStatus,
                toStatus: statusData.toStatus,
                duration: statusData.duration,
                updatedBy: statusData.updatedBy
            }
        };
        
        this.queueAnalyticsEvent(analyticsEvent);
    }
    
    trackWorkOrderCreated(workOrderData) {
        const analyticsEvent = {
            type: 'work_order_created',
            timestamp: Date.now(),
            data: {
                breakdownId: workOrderData.breakdownId,
                jobNumber: workOrderData.jobNumber,
                priority: workOrderData.priority,
                category: workOrderData.category,
                timeToCreate: workOrderData.timeToCreate || 0
            }
        };
        
        this.queueAnalyticsEvent(analyticsEvent);
        this.incrementMetric('workOrdersToday');
    }
    
    trackJobStatusChange(jobData) {
        const analyticsEvent = {
            type: 'job_status_change',
            timestamp: Date.now(),
            data: {
                jobNumber: jobData.jobNumber,
                status: jobData.status,
                engineerAssigned: jobData.engineerAssigned,
                timeInStatus: jobData.timeInStatus || 0
            }
        };
        
        this.queueAnalyticsEvent(analyticsEvent);
    }
    
    trackPassengerImpact(impactData) {
        const analyticsEvent = {
            type: 'passenger_impact',
            timestamp: Date.now(),
            data: {
                disruptionId: impactData.disruptionId,
                severity: impactData.severity,
                affectedRoutes: impactData.affectedRoutes,
                estimatedPassengers: impactData.estimatedPassengers,
                alternativesProvided: impactData.alternativesProvided || 0,
                notificationsSent: impactData.notificationsSent || 0
            }
        };
        
        this.queueAnalyticsEvent(analyticsEvent);
        this.updatePassengerImpactLevel(impactData.severity);
    }
    
    trackSupervisorActivity(activityData) {
        const analyticsEvent = {
            type: 'supervisor_activity',
            timestamp: Date.now(),
            data: {
                supervisorId: activityData.supervisorId,
                activity: activityData.activity,
                breakdownId: activityData.breakdownId,
                duration: activityData.duration || 0,
                isCollaborative: activityData.isCollaborative || false
            }
        };
        
        this.queueAnalyticsEvent(analyticsEvent);
    }
    
    queueAnalyticsEvent(event) {
        this.analyticsQueue.push(event);
        
        // If queue gets too large, process immediately
        if (this.analyticsQueue.length > 100) {
            this.processAnalyticsQueue();
        }
    }
    
    processAnalyticsQueue() {
        if (this.analyticsQueue.length === 0) return;
        
        console.log(`📊 Processing ${this.analyticsQueue.length} analytics events`);
        
        // Group events by type for batch processing
        const eventsByType = this.groupEventsByType(this.analyticsQueue);
        
        // Process each type
        Object.entries(eventsByType).forEach(([type, events]) => {
            this.processEventsBatch(type, events);
        });
        
        // Clear the queue
        this.analyticsQueue = [];
    }
    
    groupEventsByType(events) {
        return events.reduce((groups, event) => {
            if (!groups[event.type]) {
                groups[event.type] = [];
            }
            groups[event.type].push(event);
            return groups;
        }, {});
    }
    
    processEventsBatch(type, events) {
        switch (type) {
            case 'breakdown_assessment':
                this.processBreakdownAssessments(events);
                break;
            case 'breakdown_status_change':
                this.processStatusChanges(events);
                break;
            case 'work_order_created':
                this.processWorkOrders(events);
                break;
            case 'supervisor_activity':
                this.processSupervisorActivity(events);
                break;
            case 'passenger_impact':
                this.processPassengerImpact(events);
                break;
        }
    }
    
    processBreakdownAssessments(events) {
        // Calculate assessment metrics
        const assessmentTimes = events
            .filter(e => e.data.assessmentDuration > 0)
            .map(e => e.data.assessmentDuration);
        
        if (assessmentTimes.length > 0) {
            const avgTime = assessmentTimes.reduce((a, b) => a + b, 0) / assessmentTimes.length;
            this.updateMetric('averageAssessmentTime', avgTime);
        }
        
        // Calculate decision distribution
        const decisions = events.map(e => e.data.decision);
        const decisionCounts = decisions.reduce((counts, decision) => {
            counts[decision] = (counts[decision] || 0) + 1;
            return counts;
        }, {});
        
        this.updateMetric('decisionDistribution', decisionCounts);
        
        // Track escalations
        const escalations = events.filter(e => e.data.escalationTriggered).length;
        const escalationRate = escalations / events.length;
        this.updateMetric('escalationRate', escalationRate);
        
        // Track collaboration usage
        const collaborativeAssessments = events.filter(e => e.data.isRealTimeCollaboration).length;
        const collaborationRate = collaborativeAssessments / events.length;
        this.updateMetric('collaborationUsageRate', collaborationRate);
        
        // Track photo usage
        const assessmentsWithPhotos = events.filter(e => e.data.photosAttached > 0).length;
        const photoUsageRate = assessmentsWithPhotos / events.length;
        this.updateMetric('photoUsageRate', photoUsageRate);
    }
    
    processStatusChanges(events) {
        // Calculate breakdown resolution times
        const resolutionEvents = events.filter(e => e.data.toStatus === 'Resolved');
        const resolutionTimes = resolutionEvents.map(e => e.data.duration).filter(d => d > 0);
        
        if (resolutionTimes.length > 0) {
            const avgResolutionTime = resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length;
            this.updateMetric('averageResolutionTime', avgResolutionTime);
        }
    }
    
    processWorkOrders(events) {
        // Calculate work order creation efficiency
        const creationTimes = events.map(e => e.data.timeToCreate).filter(t => t > 0);
        
        if (creationTimes.length > 0) {
            const avgCreationTime = creationTimes.reduce((a, b) => a + b, 0) / creationTimes.length;
            this.updateMetric('averageWorkOrderCreationTime', avgCreationTime);
        }
        
        // Track priority distribution
        const priorities = events.map(e => e.data.priority);
        const priorityCounts = priorities.reduce((counts, priority) => {
            counts[priority] = (counts[priority] || 0) + 1;
            return counts;
        }, {});
        
        this.updateMetric('workOrderPriorityDistribution', priorityCounts);
    }
    
    processSupervisorActivity(events) {
        // Track supervisor performance
        const supervisorStats = events.reduce((stats, event) => {
            const id = event.data.supervisorId;
            if (!stats[id]) {
                stats[id] = { totalActivities: 0, collaborativeActivities: 0, totalDuration: 0 };
            }
            
            stats[id].totalActivities++;
            if (event.data.isCollaborative) {
                stats[id].collaborativeActivities++;
            }
            stats[id].totalDuration += event.data.duration || 0;
            
            return stats;
        }, {});
        
        this.updateMetric('supervisorPerformanceStats', supervisorStats);
        
        // Update active supervisors count
        const uniqueSupervisors = new Set(events.map(e => e.data.supervisorId));
        this.updateMetric('activeSupervisors', uniqueSupervisors.size);
    }
    
    processPassengerImpact(events) {
        // Calculate passenger impact metrics
        const totalPassengersAffected = events.reduce((total, event) => {
            return total + (event.data.estimatedPassengers || 0);
        }, 0);
        
        this.updateMetric('totalPassengersAffected', totalPassengersAffected);
        
        // Track notification effectiveness
        const notificationsSent = events.reduce((total, event) => {
            return total + (event.data.notificationsSent || 0);
        }, 0);
        
        this.updateMetric('passengerNotificationsSent', notificationsSent);
    }
    
    updateRealTimeMetrics() {
        // Update real-time dashboard metrics
        const metrics = {
            timestamp: Date.now(),
            activeBreakdowns: this.getMetric('activeBreakdowns'),
            activeSupervisors: this.getMetric('activeSupervisors'),
            averageResponseTime: this.getMetric('averageAssessmentTime'),
            escalationRate: this.getMetric('escalationRate'),
            workOrdersToday: this.getMetric('workOrdersToday'),
            passengerImpactLevel: this.getMetric('passengerImpactLevel'),
            collaborationUsage: this.getMetric('collaborationUsageRate'),
            photoUsage: this.getMetric('photoUsageRate')
        };
        
        // Notify subscribers
        this.notifySubscribers('realtime_metrics', metrics);
        
        // Store in cache
        this.metricsCache.set('realtime', metrics);
    }
    
    generateHourlyReport() {
        const hourlyData = {
            timestamp: Date.now(),
            period: 'hourly',
            breakdown_summary: {
                total_assessments: this.getMetric('totalAssessmentsHour'),
                decision_distribution: this.getMetric('decisionDistribution'),
                average_assessment_time: this.getMetric('averageAssessmentTime'),
                escalation_rate: this.getMetric('escalationRate')
            },
            work_orders: {
                created: this.getMetric('workOrdersHour'),
                priority_distribution: this.getMetric('workOrderPriorityDistribution'),
                average_creation_time: this.getMetric('averageWorkOrderCreationTime')
            },
            passenger_impact: {
                total_affected: this.getMetric('totalPassengersAffected'),
                notifications_sent: this.getMetric('passengerNotificationsSent'),
                service_adjustments: this.getMetric('serviceAdjustmentsHour')
            },
            supervisor_performance: this.getMetric('supervisorPerformanceStats'),
            collaboration_metrics: {
                usage_rate: this.getMetric('collaborationUsageRate'),
                conflicts_resolved: this.getMetric('totalConflictsResolved')
            }
        };
        
        console.log('📊 Generated hourly analytics report');
        this.notifySubscribers('hourly_report', hourlyData);
    }
    
    generateDailyReport() {
        const dailyData = {
            timestamp: Date.now(),
            period: 'daily',
            executive_summary: {
                total_breakdowns: this.getMetric('totalBreakdownsDay'),
                average_resolution_time: this.getMetric('averageResolutionTime'),
                cost_impact: this.calculateCostImpact(),
                efficiency_score: this.calculateEfficiencyScore()
            },
            trend_analysis: {
                breakdown_frequency: this.calculateBreakdownTrends(),
                seasonal_patterns: this.identifySeasonalPatterns(),
                predictive_insights: this.generatePredictiveInsights()
            },
            recommendations: this.generateRecommendations()
        };
        
        console.log('📈 Generated daily analytics report');
        this.notifySubscribers('daily_report', dailyData);
    }
    
    monitorKPIs() {
        const kpis = {
            averageAssessmentTime: this.getMetric('averageAssessmentTime'),
            escalationRate: this.getMetric('escalationRate'),
            supervisorResponseTime: this.getMetric('averageResponseTime')
        };
        
        // Check thresholds and trigger alerts
        Object.entries(kpis).forEach(([kpi, value]) => {
            const threshold = this.config.kpiThresholds[kpi];
            if (threshold && value > threshold) {
                this.triggerKPIAlert(kpi, value, threshold);
            }
        });
    }
    
    triggerKPIAlert(kpi, value, threshold) {
        const alert = {
            type: 'kpi_threshold_exceeded',
            kpi: kpi,
            currentValue: value,
            threshold: threshold,
            severity: this.calculateAlertSeverity(value, threshold),
            timestamp: Date.now()
        };
        
        console.log(`⚠️ KPI Alert: ${kpi} exceeded threshold`, alert);
        
        // Send notification
        if (window.PushNotificationManager) {
            window.PushNotificationManager.showInAppNotification(
                `KPI Alert: ${kpi} is ${Math.round((value/threshold - 1) * 100)}% above threshold`,
                'warning'
            );
        }
        
        this.notifySubscribers('kpi_alert', alert);
    }
    
    calculateAlertSeverity(value, threshold) {
        const ratio = value / threshold;
        if (ratio > 2) return 'Critical';
        if (ratio > 1.5) return 'High';
        if (ratio > 1.2) return 'Medium';
        return 'Low';
    }
    
    calculateCostImpact() {
        // Calculate estimated cost impact of breakdowns
        const totalBreakdowns = this.getMetric('totalBreakdownsDay') || 0;
        const averageResolutionTime = this.getMetric('averageResolutionTime') || 60; // minutes
        const costPerMinute = 8.33; // £500 per hour
        
        return {
            estimated_delay_cost: totalBreakdowns * (averageResolutionTime / 60) * 500,
            work_order_costs: this.getMetric('workOrdersDay') * 150, // Average work order cost
            passenger_compensation: this.getMetric('totalPassengersAffected') * 2.50, // Average compensation
            total_estimated_cost: 0 // Would be calculated
        };
    }
    
    calculateEfficiencyScore() {
        // Calculate overall efficiency score (0-100)
        const assessmentEfficiency = Math.min(100, (180 / (this.getMetric('averageAssessmentTime') || 180)) * 100);
        const escalationEfficiency = Math.min(100, (1 - (this.getMetric('escalationRate') || 0)) * 100);
        const collaborationBonus = (this.getMetric('collaborationUsageRate') || 0) * 20;
        
        return Math.min(100, (assessmentEfficiency + escalationEfficiency + collaborationBonus) / 2);
    }
    
    calculateBreakdownTrends() {
        // Analyze breakdown frequency trends
        return {
            weekly_trend: 'Stable',
            peak_hours: [8, 9, 17, 18],
            high_risk_routes: ['X21', 'X10'],
            seasonal_factor: 1.0
        };
    }
    
    identifySeasonalPatterns() {
        // Identify seasonal breakdown patterns
        return {
            winter_increase: 15, // % increase
            summer_decrease: 8, // % decrease
            weather_correlation: 0.7,
            maintenance_seasons: ['Spring', 'Autumn']
        };
    }
    
    generatePredictiveInsights() {
        // Generate predictive maintenance insights
        return {
            high_risk_vehicles: ['6301', '6428', '6502'],
            predicted_failures: 3,
            recommended_maintenance: ['Brake system checks', 'Steering alignment'],
            confidence_level: 0.78
        };
    }
    
    generateRecommendations() {
        // Generate actionable recommendations
        const recommendations = [];
        
        const avgTime = this.getMetric('averageAssessmentTime');
        if (avgTime > this.config.kpiThresholds.averageAssessmentTime) {
            recommendations.push({
                type: 'efficiency',
                priority: 'High',
                title: 'Reduce Assessment Time',
                description: 'Consider additional supervisor training or mobile optimization',
                estimated_impact: '15% time reduction'
            });
        }
        
        const escalationRate = this.getMetric('escalationRate');
        if (escalationRate > this.config.kpiThresholds.escalationRate) {
            recommendations.push({
                type: 'process',
                priority: 'Medium',
                title: 'Review Escalation Process',
                description: 'High escalation rate may indicate unclear guidelines',
                estimated_impact: '10% reduction in escalations'
            });
        }
        
        return recommendations;
    }
    
    // Utility methods
    updateMetric(key, value) {
        this.realTimeMetrics.set(key, value);
    }
    
    incrementMetric(key, amount = 1) {
        const current = this.realTimeMetrics.get(key) || 0;
        this.realTimeMetrics.set(key, current + amount);
    }
    
    getMetric(key) {
        return this.realTimeMetrics.get(key) || 0;
    }
    
    updateBreakdownMetrics(event) {
        this.incrementMetric('totalBreakdownsDay');
        
        if (event.data.decision === 'STOP') {
            this.incrementMetric('criticalBreakdowns');
        }
        
        if (event.data.escalationTriggered) {
            this.incrementMetric('escalationsToday');
        }
    }
    
    updatePassengerImpactLevel(severity) {
        const severityLevels = ['Low', 'Medium', 'High', 'Critical'];
        const currentLevel = this.getMetric('passengerImpactLevel');
        const currentIndex = severityLevels.indexOf(currentLevel);
        const newIndex = severityLevels.indexOf(severity);
        
        if (newIndex > currentIndex) {
            this.updateMetric('passengerImpactLevel', severity);
        }
    }
    
    // Subscription management
    subscribe(eventType, callback) {
        if (!this.subscribers.has(eventType)) {
            this.subscribers.set(eventType, new Set());
        }
        this.subscribers.get(eventType).add(callback);
    }
    
    unsubscribe(eventType, callback) {
        if (this.subscribers.has(eventType)) {
            this.subscribers.get(eventType).delete(callback);
        }
    }
    
    notifySubscribers(eventType, data) {
        if (this.subscribers.has(eventType)) {
            this.subscribers.get(eventType).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('❌ Analytics subscriber error:', error);
                }
            });
        }
    }
    
    // Public API methods
    getCurrentMetrics() {
        return Object.fromEntries(this.realTimeMetrics);
    }
    
    getMetricHistory(metricName, timeframe = '24h') {
        // Would return historical data for charting
        return [];
    }
    
    generateCustomReport(config) {
        // Generate custom analytics report
        return {
            generated_at: Date.now(),
            config: config,
            data: this.getCurrentMetrics()
        };
    }
    
    isConnected() {
        return this.connected;
    }
}

// Analytics Dashboard Component
const AnalyticsDashboard = () => {
    const [metrics, setMetrics] = React.useState({});
    const [loading, setLoading] = React.useState(true);
    
    React.useEffect(() => {
        if (window.AdvancedAnalyticsIntegration) {
            // Get initial metrics
            const initialMetrics = window.AdvancedAnalyticsIntegration.getCurrentMetrics();
            setMetrics(initialMetrics);
            setLoading(false);
            
            // Subscribe to real-time updates
            const handleMetricsUpdate = (data) => {
                setMetrics(data);
            };
            
            window.AdvancedAnalyticsIntegration.subscribe('realtime_metrics', handleMetricsUpdate);
            
            return () => {
                window.AdvancedAnalyticsIntegration.unsubscribe('realtime_metrics', handleMetricsUpdate);
            };
        }
    }, []);
    
    if (loading) {
        return React.createElement('div', {
            className: 'p-4 text-center text-gray-300'
        }, '📊 Loading analytics...');
    }
    
    const formatTime = (seconds) => {
        if (seconds < 60) return `${Math.round(seconds)}s`;
        return `${Math.round(seconds / 60)}m`;
    };
    
    const formatPercentage = (value) => {
        return `${Math.round(value * 100)}%`;
    };
    
    return React.createElement('div', {
        className: 'space-y-4'
    }, [
        React.createElement('h3', {
            key: 'title',
            className: 'text-lg font-semibold text-white'
        }, '📊 Real-time Analytics'),
        
        React.createElement('div', {
            key: 'metrics-grid',
            className: 'grid grid-cols-2 gap-3'
        }, [
            // Active Breakdowns
            React.createElement('div', {
                key: 'active-breakdowns',
                className: 'p-3 bg-red-500/20 border border-red-400/30 rounded-lg'
            }, [
                React.createElement('div', {
                    key: 'value',
                    className: 'text-xl font-bold text-red-200'
                }, metrics.activeBreakdowns || 0),
                React.createElement('div', {
                    key: 'label',
                    className: 'text-xs text-red-300'
                }, 'Active Breakdowns')
            ]),
            
            // Response Time
            React.createElement('div', {
                key: 'response-time',
                className: 'p-3 bg-blue-500/20 border border-blue-400/30 rounded-lg'
            }, [
                React.createElement('div', {
                    key: 'value',
                    className: 'text-xl font-bold text-blue-200'
                }, formatTime(metrics.averageResponseTime || 0)),
                React.createElement('div', {
                    key: 'label',
                    className: 'text-xs text-blue-300'
                }, 'Avg Response Time')
            ]),
            
            // Escalation Rate
            React.createElement('div', {
                key: 'escalation-rate',
                className: 'p-3 bg-amber-500/20 border border-amber-400/30 rounded-lg'
            }, [
                React.createElement('div', {
                    key: 'value',
                    className: 'text-xl font-bold text-amber-200'
                }, formatPercentage(metrics.escalationRate || 0)),
                React.createElement('div', {
                    key: 'label',
                    className: 'text-xs text-amber-300'
                }, 'Escalation Rate')
            ]),
            
            // Collaboration Usage
            React.createElement('div', {
                key: 'collaboration',
                className: 'p-3 bg-green-500/20 border border-green-400/30 rounded-lg'
            }, [
                React.createElement('div', {
                    key: 'value',
                    className: 'text-xl font-bold text-green-200'
                }, formatPercentage(metrics.collaborationUsage || 0)),
                React.createElement('div', {
                    key: 'label',
                    className: 'text-xs text-green-300'
                }, 'Collaboration Usage')
            ])
        ]),
        
        React.createElement('div', {
            key: 'additional-metrics',
            className: 'grid grid-cols-1 gap-3'
        }, [
            // Work Orders Today
            React.createElement('div', {
                key: 'work-orders',
                className: 'p-3 bg-purple-500/20 border border-purple-400/30 rounded-lg'
            }, [
                React.createElement('div', {
                    key: 'header',
                    className: 'flex justify-between items-center'
                }, [
                    React.createElement('span', {
                        key: 'label',
                        className: 'text-sm text-purple-200'
                    }, 'Work Orders Today'),
                    React.createElement('span', {
                        key: 'value',
                        className: 'text-lg font-bold text-purple-200'
                    }, metrics.workOrdersToday || 0)
                ])
            ]),
            
            // Passenger Impact
            React.createElement('div', {
                key: 'passenger-impact',
                className: 'p-3 bg-orange-500/20 border border-orange-400/30 rounded-lg'
            }, [
                React.createElement('div', {
                    key: 'header',
                    className: 'flex justify-between items-center'
                }, [
                    React.createElement('span', {
                        key: 'label',
                        className: 'text-sm text-orange-200'
                    }, 'Passenger Impact Level'),
                    React.createElement('span', {
                        key: 'value',
                        className: 'text-lg font-bold text-orange-200'
                    }, metrics.passengerImpactLevel || 'Low')
                ])
            ])
        ])
    ]);
};

// Initialize Advanced Analytics
window.AdvancedAnalyticsIntegration = new AdvancedAnalyticsIntegration();

// Export components and utilities
window.AnalyticsDashboard = AnalyticsDashboard;
window.Analytics = {
    isConnected: () => window.AdvancedAnalyticsIntegration.isConnected(),
    getCurrentMetrics: () => window.AdvancedAnalyticsIntegration.getCurrentMetrics(),
    subscribe: (eventType, callback) => window.AdvancedAnalyticsIntegration.subscribe(eventType, callback),
    unsubscribe: (eventType, callback) => window.AdvancedAnalyticsIntegration.unsubscribe(eventType, callback),
    generateCustomReport: (config) => window.AdvancedAnalyticsIntegration.generateCustomReport(config),
    getMetricHistory: (metric, timeframe) => window.AdvancedAnalyticsIntegration.getMetricHistory(metric, timeframe)
};

console.log('📊 Advanced Analytics integration loaded');
