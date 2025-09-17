/**
 * Go North East - Enhanced Breakdown Logger
 * Supervisor Tracking and Assessment Logging System
 * 
 * Copyright (c) 2025 Anthony Gair. All rights reserved.
 * 
 * This software and associated documentation files (the "Software") are the
 * exclusive property of Anthony Gair. No part of this Software may be used,
 * copied, modified, merged, published, distributed, sublicensed, or sold
 * without the express written permission of Anthony Gair.
 * 
 * Author: Anthony Gair
 * Created: 2025
 * 
 * For licensing inquiries, contact: anthony@gobarry.co.uk
 */

// Enhanced Breakdown Logger with Supervisor Tracking
// Logs every assessment action with complete supervisor details

const BACKEND_URL = import.meta.env.VITE_API_URL || 'https://breakdown-guide.onrender.com';
const LOG_STORAGE_KEY = 'breakdown_assessment_logs';
const PENDING_SYNC_KEY = 'pending_breakdown_sync';

class SupervisorBreakdownLogger {
    constructor() {
        this.supervisor = null;
        this.currentAssessment = null;
        this.assessmentStartTime = null;
        this.actionLog = [];
        this.syncInterval = null;
        this.breakdownId = null;  // Track the breakdown ID from the new system
        this.dailyId = null;      // Track the daily ID
        this.currentBreakdown = null; // Track current breakdown data
        
        // Initialize sync interval for offline logs
        this.startSyncInterval();
    }
    
    // Initialize the logger
    init(config = {}) {
        if (config.NO_AUTH_MODE && config.supervisorData) {
            this.setSupervisor(config.supervisorData);
        }
    }
    
    // Set the current supervisor session
    setSupervisor(session) {
        this.supervisor = session;
        console.log(`Logger initialised for supervisor: ${session.supervisorId}`);
    }
    
    // Start a new breakdown
    async startBreakdown(data) {
        if (!this.supervisor) {
            console.error('No supervisor session active');
            return null;
        }
        
        // Generate a temporary breakdown ID for offline mode
        const generateOfflineId = () => {
            const now = new Date();
            const year = now.getFullYear();
            const random = Math.floor(Math.random() * 10000).toString().padStart(5, '0');
            return `BD-${year}-${random}`;
        };
        
        // Store current breakdown data
        this.currentBreakdown = {
            ...data,
            supervisor: this.supervisor,
            startTime: new Date()
        };
        
        try {
            const response = await fetch(`${BACKEND_URL}/api/breakdowns/v3/start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    vehicleId: data.vehicle.id,
                    fleetNumber: data.vehicle.fleetNumber,
                    registration: data.vehicle.registration,
                    supervisorId: this.supervisor.supervisorId,
                    issueCategory: data.issueCategory,
                    location: data.location || {},
                    driverName: data.driverName,
                    driverPhone: data.driverPhone,
                    depot: data.vehicle.depot || this.supervisor.depot
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.breakdownId = result.breakdownId;
                this.dailyId = result.dailyId;
                this.assessmentStartTime = new Date();
                
                // Log locally
                this.logAction({
                    type: 'BREAKDOWN_STARTED',
                    breakdownId: this.breakdownId,
                    dailyId: this.dailyId,
                    vehicle: data.vehicle,
                    issueCategory: data.issueCategory
                });
                
                return this.breakdownId;
            }
        } catch (error) {
            console.warn('Failed to start breakdown via API, using offline mode:', error);
            
            // OFFLINE MODE: Generate local breakdown ID
            this.breakdownId = generateOfflineId();
            this.dailyId = this.breakdownId; // Use same ID for simplicity
            this.assessmentStartTime = new Date();
            
            // Store for offline sync
            this.storePendingAction({
                type: 'START_BREAKDOWN',
                data,
                timestamp: new Date().toISOString()
            });
            
            // Log the offline breakdown start
            this.logAction({
                type: 'BREAKDOWN_STARTED_OFFLINE',
                breakdownId: this.breakdownId,
                dailyId: this.dailyId,
                vehicle: data.vehicle,
                issueCategory: data.issueCategory
            });
            
            // Return the offline breakdown ID
            return this.breakdownId;
        }
        
        return null;
    }
    
    // Log assessment step
    async logAssessmentStep(data) {
        if (!this.breakdownId) {
            console.error('No active breakdown');
            return;
        }
        
        try {
            await fetch(`${BACKEND_URL}/api/breakdowns/v3/step`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    breakdownId: this.breakdownId,
                    ...data
                })
            });
            
            // Log locally
            this.logAction({
                type: 'ASSESSMENT_STEP',
                ...data
            });
        } catch (error) {
            console.error('Failed to log step:', error);
            this.storePendingAction({
                type: 'LOG_STEP',
                data: { breakdownId: this.breakdownId, ...data },
                timestamp: new Date().toISOString()
            });
        }
    }
    
    // Complete assessment
    async completeAssessment(data) {
        if (!this.breakdownId) {
            console.error('No active breakdown');
            return;
        }
        
        const duration = new Date() - this.assessmentStartTime;
        
        try {
            await fetch(`${BACKEND_URL}/api/breakdowns/v3/complete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    breakdownId: this.breakdownId,
                    decision: data.decision,
                    notes: data.notes,
                    duration: Math.floor(duration / 1000), // seconds
                    completedBy: this.supervisor.supervisorId
                })
            });
            
            // Log locally
            this.logAction({
                type: 'ASSESSMENT_COMPLETED',
                decision: data.decision,
                duration: duration
            });
            
            // Reset state
            this.breakdownId = null;
            this.dailyId = null;
            this.assessmentStartTime = null;
            
        } catch (error) {
            console.error('Failed to complete assessment:', error);
            this.storePendingAction({
                type: 'COMPLETE_ASSESSMENT',
                data: { 
                    breakdownId: this.breakdownId, 
                    ...data,
                    duration 
                },
                timestamp: new Date().toISOString()
            });
        }
    }
    
    // Get current breakdown data
    getCurrentBreakdown() {
        return this.currentBreakdown;
    }
    
    // Log action locally
    logAction(action) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            supervisorId: this.supervisor?.supervisorId,
            supervisorName: this.supervisor?.name,
            depot: this.supervisor?.depot,
            breakdownId: this.breakdownId,
            dailyId: this.dailyId,
            ...action
        };
        
        this.actionLog.push(logEntry);
        
        // Store in local storage
        this.saveToLocalStorage();
        
        console.log('Action logged:', logEntry);
    }
    
    // Save logs to local storage
    saveToLocalStorage() {
        try {
            const existingLogs = JSON.parse(localStorage.getItem(LOG_STORAGE_KEY) || '[]');
            const allLogs = [...existingLogs, ...this.actionLog.slice(-1)]; // Add only the latest
            localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(allLogs));
        } catch (error) {
            console.error('Failed to save to local storage:', error);
        }
    }
    
    // Store pending action for offline sync
    storePendingAction(action) {
        try {
            const pending = JSON.parse(localStorage.getItem(PENDING_SYNC_KEY) || '[]');
            pending.push(action);
            localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(pending));
        } catch (error) {
            console.error('Failed to store pending action:', error);
        }
    }
    
    // Sync pending actions when online
    async syncPendingActions() {
        if (!navigator.onLine) return;
        
        try {
            const pending = JSON.parse(localStorage.getItem(PENDING_SYNC_KEY) || '[]');
            if (pending.length === 0) return;
            
            console.log(`Syncing ${pending.length} pending actions...`);
            
            // Process each pending action
            for (const action of pending) {
                // Implement sync logic based on action type
                console.log('Syncing action:', action);
            }
            
            // Clear pending after successful sync
            localStorage.setItem(PENDING_SYNC_KEY, '[]');
            
        } catch (error) {
            console.error('Failed to sync pending actions:', error);
        }
    }
    
    // Start periodic sync
    startSyncInterval() {
        // Sync every 30 seconds if online
        this.syncInterval = setInterval(() => {
            this.syncPendingActions();
        }, 30000);
        
        // Also sync on online event
        window.addEventListener('online', () => {
            console.log('Back online - syncing pending actions...');
            this.syncPendingActions();
        });
    }
    
    // Get action logs
    getActionLog() {
        return this.actionLog;
    }
    
    // Get all stored logs
    getAllLogs() {
        try {
            return JSON.parse(localStorage.getItem(LOG_STORAGE_KEY) || '[]');
        } catch (error) {
            console.error('Failed to retrieve logs:', error);
            return [];
        }
    }
    
    // Get current breakdown data
    getCurrentBreakdown() {
        return this.currentBreakdown;
    }
    
    // Update current breakdown location
    updateBreakdownLocation(location) {
        if (this.currentBreakdown) {
            this.currentBreakdown.location = location;
        }
    }
    
    // Clear logs
    clearLogs() {
        this.actionLog = [];
        localStorage.removeItem(LOG_STORAGE_KEY);
        localStorage.removeItem(PENDING_SYNC_KEY);
        console.log('All logs cleared');
    }
    
    // Export logs as JSON
    exportLogs() {
        const logs = this.getAllLogs();
        const dataStr = JSON.stringify(logs, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `breakdown-logs-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        console.log(`Exported ${logs.length} log entries`);
    }
}

// Create and export singleton instance
export const supervisorBreakdownLogger = new SupervisorBreakdownLogger();

// Also export the class for testing
export default SupervisorBreakdownLogger;
