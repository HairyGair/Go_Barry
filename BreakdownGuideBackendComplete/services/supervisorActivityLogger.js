// supervisorActivityLogger.js - FIXED to use correct activity_logs table
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
            // Verify activity_logs table exists
            const { error } = await supabase
                .from('activity_logs')
                .select('id')
                .limit(1);
            
            if (error && error.code === '42P01') {
                console.log('⚠️ activity_logs table not found');
            }
        } catch (error) {
            console.warn('⚠️ Could not verify Supabase table');
        }

        // Ensure local directory exists
        try {
            await fs.mkdir(path.dirname(this.localLogFile), { recursive: true });
        } catch (error) {
            // Directory already exists
        }
    }

    async logActivity(supervisorBadge, supervisorName, action, details = {}) {
        // Use the SAME format as supervisorManager.logActivity
        const activity = {
            action,
            details: details,
            supervisor_id: details.supervisor_id || supervisorBadge,
            supervisor_name: supervisorName,
            screen_type: details.screenType || 'supervisor',
            ip_address: details.ip_address || null,
            user_agent: details.user_agent || null,
            created_at: new Date().toISOString()
        };

        try {
            // Insert to activity_logs table (NOT supervisor_activity)
            const { data, error } = await supabase
                .from('activity_logs')
                .insert([activity])
                .select();

            if (error) {
                throw error;
            }

            console.log(`✅ Logged activity: ${supervisorName} - ${action}`);
            console.log(`📊 Activity details:`, activity);
            return { success: true, activity: data?.[0] || activity };
        } catch (error) {
            console.warn('⚠️ Supabase logging failed, using local storage:', error.message);
            
            // Fallback to local storage
            try {
                const activities = await this.getLocalActivities();
                activities.unshift(activity);
                
                // Keep only last 1000 activities
                const limitedActivities = activities.slice(0, 1000);
                
                await fs.writeFile(this.localLogFile, JSON.stringify(limitedActivities, null, 2));
                console.log(`✅ Logged activity locally: ${supervisorName} - ${action}`);
                return { success: true, activity };
            } catch (localError) {
                console.error('❌ Failed to log activity:', localError);
                return { success: false, error: localError.message };
            }
        }
    }

    async getRecentActivities(limit = 50) {
        try {
            // Query from activity_logs table
            const { data, error } = await supabase
                .from('activity_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(limit);

            if (!error && data) {
                return data;
            }
        } catch (error) {
            console.warn('⚠️ Supabase query failed, using local storage');
        }

        // Fallback to local storage
        try {
            const activities = await this.getLocalActivities();
            return activities.slice(0, limit);
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
        return this.logActivity(supervisorBadge, supervisorName, 'supervisor_login', {
            badge: supervisorBadge,
            login_time: new Date().toISOString()
        });
    }

    async logLogout(supervisorBadge, supervisorName) {
        return this.logActivity(supervisorBadge, supervisorName, 'supervisor_logout', {
            badge: supervisorBadge,
            logout_time: new Date().toISOString()
        });
    }

    async logAlertDismissal(supervisorBadge, supervisorName, alertId, reason, location) {
        return this.logActivity(supervisorBadge, supervisorName, 'alert_dismissed', {
            alert_id: alertId,
            reason,
            location: location || 'Unknown location'
        });
    }

    async logRoadworkCreation(supervisorBadge, supervisorName, roadworkData) {
        return this.logActivity(supervisorBadge, supervisorName, 'roadwork_created', {
            location: roadworkData.location || 'Unknown location',
            severity: roadworkData.severity,
            status: roadworkData.status,
            affected_routes: roadworkData.affected_routes
        });
    }

    async logEmailSent(supervisorBadge, supervisorName, emailData) {
        return this.logActivity(supervisorBadge, supervisorName, 'email_sent', {
            recipients: emailData.recipients || [],
            type: emailData.type || 'roadwork_notification',
            subject: emailData.subject
        });
    }

    async logDutyStart(supervisorBadge, supervisorName, dutyNumber) {
        return this.logActivity(supervisorBadge, supervisorName, 'duty_started', {
            duty_number: dutyNumber,
            start_time: new Date().toISOString()
        });
    }

    async logDutyEnd(supervisorBadge, supervisorName, dutyNumber) {
        return this.logActivity(supervisorBadge, supervisorName, 'duty_ended', {
            duty_number: dutyNumber,
            end_time: new Date().toISOString()
        });
    }

    async logSystemAction(supervisorBadge, supervisorName, action, details = {}) {
        return this.logActivity(supervisorBadge, supervisorName, action, details);
    }
}

export default new SupervisorActivityLogger();
