import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

class SupervisorActivityLogger {
    constructor() {
        this.localLogFile = path.join(process.cwd(), 'data', 'supervisor-activity.json');
        this.initializeStorage();
    }

    async initializeStorage() {
        try {
            // Create Supabase table if it doesn't exist
            const { error } = await supabase
                .from('supervisor_activity')
                .select('id')
                .limit(1);
            
            if (error && error.code === '42P01') {
                // Table doesn't exist, create it
                console.log('Creating supervisor_activity table...');
                // Note: In production, this would be handled by migrations
            }
        } catch (error) {
            console.warn('⚠️ Could not initialize Supabase table, using local storage');
        }

        // Ensure local directory exists
        try {
            await fs.mkdir(path.dirname(this.localLogFile), { recursive: true });
        } catch (error) {
            // Directory already exists
        }
    }

    async logActivity(supervisorBadge, action, details = {}) {
        const activity = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            supervisor_badge: supervisorBadge,
            action,
            details: JSON.stringify(details),
            timestamp: new Date().toISOString(),
            created_at: new Date().toISOString()
        };

        try {
            // Try Supabase first
            const { error } = await supabase
                .from('supervisor_activity')
                .insert([activity]);

            if (error) {
                throw error;
            }

            console.log(`✅ Logged activity: ${supervisorBadge} - ${action}`);
            return { success: true, activity };
        } catch (error) {
            console.warn('⚠️ Supabase logging failed, using local storage:', error.message);
            
            // Fallback to local storage
            try {
                const activities = await this.getLocalActivities();
                activities.unshift(activity);
                
                // Keep only last 1000 activities
                const limitedActivities = activities.slice(0, 1000);
                
                await fs.writeFile(this.localLogFile, JSON.stringify(limitedActivities, null, 2));
                console.log(`✅ Logged activity locally: ${supervisorBadge} - ${action}`);
                return { success: true, activity };
            } catch (localError) {
                console.error('❌ Failed to log activity:', localError);
                return { success: false, error: localError.message };
            }
        }
    }

    async getRecentActivities(limit = 50) {
        try {
            // Try Supabase first
            const { data, error } = await supabase
                .from('supervisor_activity')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(limit);

            if (!error && data) {
                return data.map(activity => ({
                    ...activity,
                    details: this.parseDetails(activity.details)
                }));
            }
        } catch (error) {
            console.warn('⚠️ Supabase query failed, using local storage');
        }

        // Fallback to local storage
        try {
            const activities = await this.getLocalActivities();
            return activities.slice(0, limit).map(activity => ({
                ...activity,
                details: this.parseDetails(activity.details)
            }));
        } catch (error) {
            console.error('❌ Failed to get activities:', error);
            return [];
        }
    }

    async getLocalActivities() {
        try {
            const data = await fs.readFile(this.localLogFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            // File doesn't exist or is invalid
            return [];
        }
    }

    parseDetails(details) {
        try {
            return typeof details === 'string' ? JSON.parse(details) : details;
        } catch (error) {
            return details;
        }
    }

    // Convenience methods for common actions
    async logLogin(supervisorBadge, supervisorName) {
        return this.logActivity(supervisorBadge, 'LOGIN', {
            supervisor_name: supervisorName,
            login_time: new Date().toLocaleTimeString()
        });
    }

    async logLogout(supervisorBadge, supervisorName) {
        return this.logActivity(supervisorBadge, 'LOGOUT', {
            supervisor_name: supervisorName,
            logout_time: new Date().toLocaleTimeString()
        });
    }

    async logAlertDismissal(supervisorBadge, supervisorName, alertId, reason, location) {
        return this.logActivity(supervisorBadge, 'DISMISS_ALERT', {
            supervisor_name: supervisorName,
            alert_id: alertId,
            reason,
            location: location || 'Unknown location',
            dismissed_at: new Date().toLocaleTimeString()
        });
    }

    async logRoadworkCreation(supervisorBadge, supervisorName, roadworkData) {
        return this.logActivity(supervisorBadge, 'CREATE_ROADWORK', {
            supervisor_name: supervisorName,
            location: roadworkData.location || 'Unknown location',
            severity: roadworkData.severity,
            status: roadworkData.status,
            created_at: new Date().toLocaleTimeString()
        });
    }

    async logEmailReport(supervisorBadge, supervisorName, reportType, recipients) {
        return this.logActivity(supervisorBadge, 'EMAIL_REPORT', {
            supervisor_name: supervisorName,
            report_type: reportType,
            recipients: recipients || 'Unknown recipients',
            sent_at: new Date().toLocaleTimeString()
        });
    }

    async logSystemAction(supervisorBadge, supervisorName, action, details = {}) {
        return this.logActivity(supervisorBadge, action, {
            supervisor_name: supervisorName,
            ...details,
            performed_at: new Date().toLocaleTimeString()
        });
    }
}

export default new SupervisorActivityLogger();
