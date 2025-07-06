/**
 * Hybrid Street Manager Storage Service
 * 
 * Replaces the bloated streetmanager_notifications table with:
 * - Lightweight summaries in Supabase (1KB each vs 500KB+ full payloads)  
 * - Full notification payloads in local JSON files
 * - Automatic cleanup after roadwork end date + 7 days
 * - Driver message template storage for reuse
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync, readFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Storage directory for full notification payloads
const STORAGE_DIR = join(__dirname, '../data/streetmanager');

class HybridStreetManagerStorage {
  constructor() {
    // Use ANON key as fallback if SERVICE key not available
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
    
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      supabaseKey
    );
    
    // Ensure storage directory exists
    if (!existsSync(STORAGE_DIR)) {
      mkdirSync(STORAGE_DIR, { recursive: true });
    }
  }

  /**
   * Store a Street Manager notification using hybrid approach
   * @param {Object} notification - Full notification payload from webhook
   */
  async storeNotification(notification) {
    try {
      // Extract key fields for lightweight summary
      const summary = this.extractSummary(notification);
      
      // Calculate cleanup date (end_date + 7 days)
      summary.cleanup_date = this.calculateCleanupDate(summary.end_date);
      
      // Store full payload as JSON file
      const filename = `${summary.notification_id}.json`;
      summary.file_reference = filename;
      
      this.writeNotificationFile(filename, notification);
      
      // Store lightweight summary in database
      const { data, error } = await this.supabase
        .from('streetmanager_summaries')
        .upsert(summary, { onConflict: 'notification_id' });
      
      if (error) {
        console.error('❌ Failed to store summary:', error);
        return { success: false, error };
      }
      
      console.log(`✅ Stored notification ${summary.notification_id} (${summary.location})`);
      return { success: true, data };
      
    } catch (error) {
      console.error('❌ Storage error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Extract lightweight summary from full notification
   */
  extractSummary(notification) {
    return {
      notification_id: notification.notificationId || notification.id,
      location: this.extractLocation(notification),
      status: notification.status || 'unknown',
      severity: notification.severity || notification.trafficManagementType,
      contractor: notification.organisationName || notification.contractor,
      start_date: notification.startDate || notification.validFrom,
      end_date: notification.endDate || notification.validTo,
      created_at: new Date().toISOString()
    };
  }

  /**
   * Extract location from various notification formats
   */
  extractLocation(notification) {
    // Try different location fields
    if (notification.location) return notification.location;
    if (notification.address) return notification.address;
    if (notification.street) return notification.street;
    if (notification.description) {
      // Extract location from description
      const match = notification.description.match(/(?:on|at|in)\s+([A-Z][a-z\s]+(?:Road|Street|Lane|Avenue|Way))/i);
      if (match) return match[1];
    }
    return 'Unknown Location';
  }

  /**
   * Calculate cleanup date (end_date + 7 days)
   */
  calculateCleanupDate(endDate) {
    if (!endDate) return null;
    
    const end = new Date(endDate);
    if (isNaN(end.getTime())) return null;
    
    const cleanup = new Date(end);
    cleanup.setDate(cleanup.getDate() + 7);
    return cleanup.toISOString();
  }

  /**
   * Write notification to JSON file
   */
  writeNotificationFile(filename, notification) {
    const filepath = join(STORAGE_DIR, filename);
    writeFileSync(filepath, JSON.stringify(notification, null, 2));
  }

  /**
   * Read full notification from JSON file
   */
  readNotificationFile(filename) {
    const filepath = join(STORAGE_DIR, filename);
    if (!existsSync(filepath)) return null;
    
    try {
      const content = readFileSync(filepath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.error(`❌ Failed to read ${filename}:`, error);
      return null;
    }
  }

  /**
   * Get notification with full details (summary + payload)
   */
  async getNotificationWithDetails(notificationId) {
    // Get summary from database
    const { data: summary, error } = await this.supabase
      .from('streetmanager_summaries')
      .select('*')
      .eq('notification_id', notificationId)
      .single();
    
    if (error || !summary) {
      return { summary: null, fullPayload: null };
    }
    
    // Get full payload from file
    const fullPayload = summary.file_reference 
      ? this.readNotificationFile(summary.file_reference)
      : null;
    
    return { summary, fullPayload };
  }

  /**
   * Get current active notifications (summaries only for dashboard)
   */
  async getActiveNotifications() {
    const { data, error } = await this.supabase
      .from('streetmanager_summaries')
      .select('*')
      .in('status', ['active', 'planned', 'in-progress'])
      .order('created_at', { ascending: false });
    
    return { data, error };
  }

  /**
   * Store/update driver message template
   */
  async storeMessageTemplate(locationKey, messageTemplate, supervisorBadge) {
    const { data, error } = await this.supabase
      .from('driver_message_templates')
      .upsert({
        location_key: locationKey.toLowerCase().trim(),
        message_template: messageTemplate,
        last_used: new Date().toISOString(),
        times_used: 1,
        created_by: supervisorBadge
      }, { 
        onConflict: 'location_key',
        ignoreDuplicates: false 
      });
    
    if (!error && data) {
      // Increment usage count if template already exists
      await this.supabase.rpc('increment_template_usage', {
        location_key: locationKey.toLowerCase().trim()
      });
    }
    
    return { data, error };
  }

  /**
   * Get message template for location
   */
  async getMessageTemplate(locationKey) {
    const { data, error } = await this.supabase
      .from('driver_message_templates')
      .select('*')
      .eq('location_key', locationKey.toLowerCase().trim())
      .single();
    
    return { data, error };
  }

  /**
   * Run cleanup job - remove old notifications past retention period
   */
  async runCleanupJob() {
    console.log('🧹 Starting Street Manager cleanup job...');
    
    const now = new Date().toISOString();
    let cleanedCount = 0;
    
    try {
      // Find notifications ready for cleanup
      const { data: expiredNotifications, error } = await this.supabase
        .from('streetmanager_summaries')
        .select('notification_id, file_reference')
        .lt('cleanup_date', now);
      
      if (error) {
        console.error('❌ Cleanup query failed:', error);
        return { success: false, error };
      }
      
      if (!expiredNotifications || expiredNotifications.length === 0) {
        console.log('✅ No notifications ready for cleanup');
        return { success: true, cleanedCount: 0 };
      }
      
      // Delete JSON files
      for (const notification of expiredNotifications) {
        if (notification.file_reference) {
          const filepath = join(STORAGE_DIR, notification.file_reference);
          if (existsSync(filepath)) {
            unlinkSync(filepath);
          }
        }
        cleanedCount++;
      }
      
      // Delete database records
      const { error: deleteError } = await this.supabase
        .from('streetmanager_summaries')
        .delete()
        .lt('cleanup_date', now);
      
      if (deleteError) {
        console.error('❌ Database cleanup failed:', deleteError);
        return { success: false, error: deleteError };
      }
      
      // Log cleanup job
      await this.supabase
        .from('cleanup_jobs')
        .insert({
          job_type: 'streetmanager_cleanup',
          records_cleaned: cleanedCount,
          status: 'completed'
        });
      
      console.log(`✅ Cleanup completed: ${cleanedCount} notifications removed`);
      return { success: true, cleanedCount };
      
    } catch (error) {
      console.error('❌ Cleanup job failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats() {
    // Database stats
    const { data: dbStats, error } = await this.supabase
      .from('streetmanager_summaries')
      .select('status', { count: 'exact' });
    
    // File system stats
    let fileCount = 0;
    let totalFileSize = 0;
    
    if (existsSync(STORAGE_DIR)) {
      const files = readdirSync(STORAGE_DIR).filter(f => f.endsWith('.json'));
      fileCount = files.length;
      
      // Calculate total file size (approximate)
      totalFileSize = fileCount * 250; // Estimate 250KB per notification file
    }
    
    return {
      database: {
        total_records: dbStats?.length || 0,
        size_estimate: `${((dbStats?.length || 0) * 1)} KB` // ~1KB per summary
      },
      files: {
        total_files: fileCount,
        size_estimate: `${Math.round(totalFileSize / 1024)} MB`
      },
      error
    };
  }
}

export default HybridStreetManagerStorage;