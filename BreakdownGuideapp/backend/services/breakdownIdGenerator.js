/**
 * Breakdown ID Generator Service
 * Generates unique breakdown IDs in format: BD-YYYY-NNNNN
 * Includes daily counter and persistence mechanisms
 *
 * MIGRATED TO MYSQL - October 2025
 */

import { query } from '../config/mysql.js';
import { from } from '../utils/queryHelpers.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class BreakdownIdGenerator {
  constructor() {
    this.counterFile = path.join(__dirname, '../data/breakdown-counter.json');
    this.memoryCache = {
      date: null,
      counter: 0,
      lastId: null
    };
  }

  /**
   * Initialize the generator and load existing counter
   */
  async initialize() {
    try {
      await this.loadCounter();
      console.log('✅ Breakdown ID generator initialized');
    } catch (error) {
      console.error('⚠️ Failed to initialize breakdown ID generator:', error);
      // Start with fresh counter if initialization fails
      this.resetDailyCounter();
    }
  }

  /**
   * Generate next breakdown ID with format BD-YYYY-NNNNN
   * Uses daily counter that resets at midnight
   */
  async generateId() {
    const now = new Date();
    const year = now.getFullYear();
    const today = now.toISOString().split('T')[0]; // YYYY-MM-DD

    try {
      // Check if we need to reset the counter (new day)
      if (this.memoryCache.date !== today) {
        await this.resetDailyCounter();
      }

      // Get next number from database count (yearly sequence)
      const nextNumber = await this.getNextNumberFromDatabase(year);

      // Generate the ID
      const breakdownId = `BD-${year}-${nextNumber.toString().padStart(5, '0')}`;

      // Update memory cache
      this.memoryCache.counter = nextNumber;
      this.memoryCache.lastId = breakdownId;
      this.memoryCache.date = today;

      // Persist counter to file (async, don't wait)
      this.saveCounter().catch(err =>
        console.error('Failed to save counter:', err)
      );

      console.log(`📋 Generated breakdown ID: ${breakdownId} (${nextNumber}/${year}, Day: ${today})`);

      return {
        id: breakdownId,
        year: year,
        sequence: nextNumber,
        date: today,
        timestamp: now.toISOString()
      };

    } catch (error) {
      console.error('Error generating breakdown ID:', error);

      // Fallback: Use timestamp-based ID if database fails
      return this.generateFallbackId(year, now);
    }
  }

  /**
   * Get next sequence number from database for the year
   */
  async getNextNumberFromDatabase(year) {
    try {
      // Method 1: Count existing breakdowns for the year
      const countSql = `
        SELECT COUNT(*) as count
        FROM breakdowns
        WHERE created_at >= ? AND created_at < ?
      `;
      const countResult = await query(countSql, [
        `${year}-01-01 00:00:00`,
        `${year + 1}-01-01 00:00:00`
      ]);

      if (countResult && countResult[0]) {
        return (countResult[0].count || 0) + 1;
      }

      // Method 2: Get highest breakdown_id for the year
      const latestSql = `
        SELECT breakdown_id
        FROM breakdowns
        WHERE breakdown_id LIKE ?
        ORDER BY breakdown_id DESC
        LIMIT 1
      `;
      const latestResult = await query(latestSql, [`BD-${year}-%`]);

      if (latestResult && latestResult.length > 0) {
        const lastId = latestResult[0].breakdown_id;
        const lastNumber = parseInt(lastId.split('-')[2], 10);
        return (lastNumber || 0) + 1;
      }

      // If both methods fail, check memory cache
      if (this.memoryCache.lastId && this.memoryCache.lastId.startsWith(`BD-${year}-`)) {
        const lastNumber = parseInt(this.memoryCache.lastId.split('-')[2], 10);
        return lastNumber + 1;
      }

      // Start from 1 if no records found
      return 1;

    } catch (error) {
      console.error('Database error in getNextNumberFromDatabase:', error);

      // Use local counter as fallback
      return this.memoryCache.counter + 1;
    }
  }

  /**
   * Generate fallback ID using timestamp when database is unavailable
   */
  generateFallbackId(year, now) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    const fallbackId = `BD-${year}-F${timestamp.toString().slice(-4)}${random}`;

    console.warn(`⚠️ Using fallback breakdown ID: ${fallbackId}`);

    return {
      id: fallbackId,
      year: year,
      sequence: null,
      date: now.toISOString().split('T')[0],
      timestamp: now.toISOString(),
      fallback: true
    };
  }

  /**
   * Reset daily counter (called at midnight or initialization)
   */
  async resetDailyCounter() {
    const today = new Date().toISOString().split('T')[0];

    this.memoryCache.date = today;
    this.memoryCache.counter = 0;

    console.log(`🔄 Daily counter reset for ${today}`);

    await this.saveCounter();
  }

  /**
   * Load counter from persistent storage
   */
  async loadCounter() {
    try {
      const data = await fs.readFile(this.counterFile, 'utf-8');
      const saved = JSON.parse(data);

      // Only use saved counter if it's from today
      const today = new Date().toISOString().split('T')[0];
      if (saved.date === today) {
        this.memoryCache = saved;
        console.log(`📂 Loaded counter from file: ${saved.counter} (${saved.date})`);
      } else {
        console.log(`📂 Counter file outdated (${saved.date}), starting fresh`);
        await this.resetDailyCounter();
      }
    } catch (error) {
      // File doesn't exist or is corrupted, start fresh
      console.log('📂 No valid counter file found, starting fresh');
      await this.resetDailyCounter();
    }
  }

  /**
   * Save counter to persistent storage
   */
  async saveCounter() {
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(this.counterFile);
      await fs.mkdir(dataDir, { recursive: true });

      // Save counter state
      await fs.writeFile(
        this.counterFile,
        JSON.stringify(this.memoryCache, null, 2),
        'utf-8'
      );
    } catch (error) {
      console.error('Failed to save counter file:', error);
    }
  }

  /**
   * Get current counter status
   */
  getStatus() {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    return {
      current_date: today,
      counter_date: this.memoryCache.date,
      current_counter: this.memoryCache.counter,
      last_generated_id: this.memoryCache.lastId,
      needs_reset: this.memoryCache.date !== today,
      timestamp: now.toISOString()
    };
  }

  /**
   * Validate a breakdown ID format
   */
  validateId(breakdownId) {
    // Check format: BD-YYYY-NNNNN or BD-YYYY-FNNNN (fallback)
    const pattern = /^BD-\d{4}-[F]?\d{5,}$/;

    if (!pattern.test(breakdownId)) {
      return {
        valid: false,
        error: 'Invalid format. Expected: BD-YYYY-NNNNN'
      };
    }

    const parts = breakdownId.split('-');
    const year = parseInt(parts[1], 10);
    const currentYear = new Date().getFullYear();

    if (year < 2020 || year > currentYear + 1) {
      return {
        valid: false,
        error: 'Invalid year in breakdown ID'
      };
    }

    return {
      valid: true,
      year: year,
      sequence: parts[2],
      isFallback: parts[2].startsWith('F')
    };
  }

  /**
   * Get breakdown statistics for reporting
   */
  async getStatistics(year = null) {
    const targetYear = year || new Date().getFullYear();

    try {
      // Get total count for the year
      const countSql = `
        SELECT COUNT(*) as count
        FROM breakdowns
        WHERE created_at >= ? AND created_at < ?
      `;
      const countResult = await query(countSql, [
        `${targetYear}-01-01 00:00:00`,
        `${targetYear + 1}-01-01 00:00:00`
      ]);

      const totalCount = countResult && countResult[0] ? countResult[0].count : 0;

      // Get daily breakdown for current month
      const currentMonth = new Date().getMonth() + 1;
      const monthStartDate = `${targetYear}-${currentMonth.toString().padStart(2, '0')}-01 00:00:00`;
      const monthEndDate = `${targetYear}-${(currentMonth + 1).toString().padStart(2, '0')}-01 00:00:00`;

      const monthlySql = `
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM breakdowns
        WHERE created_at >= ? AND created_at < ?
        GROUP BY DATE(created_at)
      `;
      const monthlyResult = await query(monthlySql, [monthStartDate, monthEndDate]);

      const dailyCounts = {};
      if (monthlyResult) {
        monthlyResult.forEach(record => {
          dailyCounts[record.date] = record.count;
        });
      }

      return {
        year: targetYear,
        total_breakdowns: totalCount,
        next_sequence: totalCount + 1,
        current_month_daily: dailyCounts,
        generator_status: this.getStatus(),
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error getting breakdown statistics:', error);
      return {
        year: targetYear,
        error: error.message,
        generator_status: this.getStatus(),
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Create singleton instance
const breakdownIdGenerator = new BreakdownIdGenerator();

// Initialize on module load
breakdownIdGenerator.initialize().catch(err =>
  console.error('Failed to initialize breakdown ID generator:', err)
);

export default breakdownIdGenerator;
