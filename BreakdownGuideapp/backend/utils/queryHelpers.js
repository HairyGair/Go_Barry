/**
 * Go BARRY Query Helper Utilities
 *
 * Provides common SQL query patterns and helpers for converting
 * Supabase queries to MySQL queries
 *
 * Features:
 * - Query builder helpers for common patterns
 * - Supabase-style query interface compatibility
 * - Safe parameter escaping
 * - Transaction helpers
 * - Pagination utilities
 * - Search and filter helpers
 *
 * @author Anthony Gair
 * @version 2.0.0
 * @license Proprietary
 */

import { query, select, insert, update, remove, transaction, pool } from '../config/mysql.js';

/**
 * SECURITY: Whitelist of allowed table names to prevent SQL injection
 * Add new tables here as needed
 */
const ALLOWED_TABLES = new Set([
  'breakdowns',
  'breakdown_events',
  'breakdown_dashboard_cards',
  'supervisors',
  'supervisor_sessions',
  'supervisor_shift_history',
  'supervisor_session_audit',
  'activities',
  'fleet_vehicles',
  'engineers',
  'depots',
  'user_preferences',
  'wizard_progress',
  'gtfs_routes',
  'gtfs_stops',
  'gtfs_trips',
  'gtfs_stop_times',
  'gtfs_shapes',
  'gtfs_route_distances',
  'gtfs_import_log',
  'login_analytics',
  'system_settings',
  'bug_reports',
  'bug_report_comments',
  'notification_preferences',
  'duty_breaks',
  'duty_extensions',
  'duty_schedules',
  'shift_templates',
  'duty_handovers',
  'handover_breakdowns',
  'duty_audit_log',
  'duty_notes',
  'route_coverage_analysis',
  'breakdown_lost_trips',
  'replacement_vehicles',
  'engineer_shift_templates',
  'engineer_daily_shifts'
]);

/**
 * SECURITY: Validate identifier (table/column name) to prevent SQL injection
 * Only allows alphanumeric characters and underscores, must start with letter or underscore
 * @param {string} identifier - The identifier to validate
 * @returns {boolean} True if valid
 */
function isValidIdentifier(identifier) {
  if (typeof identifier !== 'string' || identifier.length === 0 || identifier.length > 64) {
    return false;
  }
  // Must match pattern: starts with letter/underscore, followed by letters/numbers/underscores
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(identifier);
}

/**
 * SECURITY: Sanitize and validate a column name
 * @param {string} column - Column name to validate
 * @throws {Error} If column name is invalid
 * @returns {string} The validated column name (backtick-escaped)
 */
function sanitizeColumn(column) {
  // Handle column aliases (e.g., "table.column" or "column AS alias")
  const parts = column.split('.');
  for (const part of parts) {
    // Remove any AS alias for validation
    const cleanPart = part.split(/\s+AS\s+/i)[0].trim();
    if (cleanPart !== '*' && !isValidIdentifier(cleanPart)) {
      throw new Error(`Invalid column name: ${column}`);
    }
  }
  return column;
}

/**
 * SECURITY: Validate table name against whitelist
 * @param {string} table - Table name to validate
 * @throws {Error} If table name is not in whitelist
 * @returns {string} The validated table name
 */
function validateTable(table) {
  if (!isValidIdentifier(table)) {
    throw new Error(`Invalid table name format: ${table}`);
  }
  if (!ALLOWED_TABLES.has(table)) {
    throw new Error(`Table not in whitelist: ${table}. Add it to ALLOWED_TABLES if needed.`);
  }
  return table;
}

/**
 * Query Builder - Provides Supabase-like query interface
 *
 * SECURITY: All table and column names are validated to prevent SQL injection
 *
 * Usage:
 * const { data, error } = await queryBuilder('breakdowns')
 *   .select('*')
 *   .eq('status', 'active')
 *   .order('created_at', 'DESC')
 *   .limit(10)
 *   .execute();
 */
export class QueryBuilder {
  constructor(table) {
    this.table = validateTable(table);
    this.selectColumns = '*';
    this.whereConditions = [];
    this.whereParams = [];
    this.orderByClause = null;
    this.limitValue = null;
    this.offsetValue = null;
  }

  /**
   * Specify columns to select
   * @param {string} columns - Columns to select (comma-separated or '*')
   * @returns {QueryBuilder} this
   */
  select(columns = '*') {
    // SECURITY: Validate each column in the select list
    if (columns !== '*') {
      const columnList = columns.split(',').map(c => c.trim());
      columnList.forEach(col => sanitizeColumn(col));
    }
    this.selectColumns = columns;
    return this;
  }

  /**
   * Add WHERE column = value condition
   * @param {string} column - Column name
   * @param {any} value - Value to match
   * @returns {QueryBuilder} this
   */
  eq(column, value) {
    sanitizeColumn(column);
    this.whereConditions.push(`${column} = ?`);
    this.whereParams.push(value);
    return this;
  }

  /**
   * Add WHERE column != value condition
   * @param {string} column - Column name
   * @param {any} value - Value to not match
   * @returns {QueryBuilder} this
   */
  neq(column, value) {
    sanitizeColumn(column);
    this.whereConditions.push(`${column} != ?`);
    this.whereParams.push(value);
    return this;
  }

  /**
   * Add WHERE column > value condition
   * @param {string} column - Column name
   * @param {any} value - Value to compare
   * @returns {QueryBuilder} this
   */
  gt(column, value) {
    sanitizeColumn(column);
    this.whereConditions.push(`${column} > ?`);
    this.whereParams.push(value);
    return this;
  }

  /**
   * Add WHERE column >= value condition
   * @param {string} column - Column name
   * @param {any} value - Value to compare
   * @returns {QueryBuilder} this
   */
  gte(column, value) {
    sanitizeColumn(column);
    this.whereConditions.push(`${column} >= ?`);
    this.whereParams.push(value);
    return this;
  }

  /**
   * Add WHERE column < value condition
   * @param {string} column - Column name
   * @param {any} value - Value to compare
   * @returns {QueryBuilder} this
   */
  lt(column, value) {
    sanitizeColumn(column);
    this.whereConditions.push(`${column} < ?`);
    this.whereParams.push(value);
    return this;
  }

  /**
   * Add WHERE column <= value condition
   * @param {string} column - Column name
   * @param {any} value - Value to compare
   * @returns {QueryBuilder} this
   */
  lte(column, value) {
    sanitizeColumn(column);
    this.whereConditions.push(`${column} <= ?`);
    this.whereParams.push(value);
    return this;
  }

  /**
   * Add WHERE column LIKE value condition
   * @param {string} column - Column name
   * @param {string} pattern - LIKE pattern (use % for wildcards)
   * @returns {QueryBuilder} this
   */
  like(column, pattern) {
    sanitizeColumn(column);
    this.whereConditions.push(`${column} LIKE ?`);
    this.whereParams.push(pattern);
    return this;
  }

  /**
   * Add WHERE column ILIKE value condition (case-insensitive)
   * @param {string} column - Column name
   * @param {string} pattern - LIKE pattern (use % for wildcards)
   * @returns {QueryBuilder} this
   */
  ilike(column, pattern) {
    sanitizeColumn(column);
    this.whereConditions.push(`LOWER(${column}) LIKE LOWER(?)`);
    this.whereParams.push(pattern);
    return this;
  }

  /**
   * Add WHERE column IN (values) condition
   * @param {string} column - Column name
   * @param {Array} values - Array of values
   * @returns {QueryBuilder} this
   */
  in(column, values) {
    sanitizeColumn(column);
    if (!Array.isArray(values) || values.length === 0) {
      return this;
    }
    const placeholders = values.map(() => '?').join(', ');
    this.whereConditions.push(`${column} IN (${placeholders})`);
    this.whereParams.push(...values);
    return this;
  }

  /**
   * Add WHERE column IS NULL condition
   * @param {string} column - Column name
   * @returns {QueryBuilder} this
   */
  isNull(column) {
    sanitizeColumn(column);
    this.whereConditions.push(`${column} IS NULL`);
    return this;
  }

  /**
   * Add WHERE column IS NOT NULL condition
   * @param {string} column - Column name
   * @returns {QueryBuilder} this
   */
  notNull(column) {
    sanitizeColumn(column);
    this.whereConditions.push(`${column} IS NOT NULL`);
    return this;
  }

  /**
   * Add ORDER BY clause
   * @param {string} column - Column to order by
   * @param {string} direction - 'ASC' or 'DESC' (default: 'ASC')
   * @returns {QueryBuilder} this
   */
  order(column, direction = 'ASC') {
    sanitizeColumn(column);
    // SECURITY: Validate direction to prevent injection
    const validDirections = ['ASC', 'DESC'];
    const normalizedDirection = direction.toUpperCase();
    if (!validDirections.includes(normalizedDirection)) {
      throw new Error(`Invalid ORDER BY direction: ${direction}`);
    }
    this.orderByClause = `${column} ${normalizedDirection}`;
    return this;
  }

  /**
   * Add LIMIT clause
   * @param {number} limit - Maximum number of rows to return
   * @returns {QueryBuilder} this
   */
  limit(limit) {
    this.limitValue = parseInt(limit);
    return this;
  }

  /**
   * Add OFFSET clause
   * @param {number} offset - Number of rows to skip
   * @returns {QueryBuilder} this
   */
  offset(offset) {
    this.offsetValue = parseInt(offset);
    return this;
  }

  /**
   * Add pagination using range (Supabase-style)
   * @param {number} from - Start index (inclusive)
   * @param {number} to - End index (inclusive)
   * @returns {QueryBuilder} this
   */
  range(from, to) {
    this.limitValue = to - from + 1;
    this.offsetValue = from;
    return this;
  }

  /**
   * Build the SQL query string
   * @returns {string} SQL query
   */
  buildQuery() {
    let sql = `SELECT ${this.selectColumns} FROM ${this.table}`;

    if (this.whereConditions.length > 0) {
      sql += ` WHERE ${this.whereConditions.join(' AND ')}`;
    }

    if (this.orderByClause) {
      sql += ` ORDER BY ${this.orderByClause}`;
    }

    if (this.limitValue) {
      sql += ` LIMIT ${this.limitValue}`;
    }

    if (this.offsetValue) {
      sql += ` OFFSET ${this.offsetValue}`;
    }

    return sql;
  }

  /**
   * Execute the query and return Supabase-style response
   * @returns {Promise<Object>} { data, error }
   */
  async execute() {
    try {
      const sql = this.buildQuery();
      const data = await query(sql, this.whereParams);
      return { data, error: null };
    } catch (error) {
      console.error('Query execution error:', error.message);
      return { data: null, error };
    }
  }

  /**
   * Execute query and return single row
   * @returns {Promise<Object>} { data, error }
   */
  async single() {
    try {
      this.limitValue = 1;
      const sql = this.buildQuery();
      const rows = await query(sql, this.whereParams);
      const data = rows.length > 0 ? rows[0] : null;
      return { data, error: null };
    } catch (error) {
      console.error('Query execution error:', error.message);
      return { data: null, error };
    }
  }
}

/**
 * Create a query builder for a table (Supabase-style)
 * @param {string} table - Table name
 * @returns {QueryBuilder} Query builder instance
 *
 * @example
 * const { data, error } = await from('breakdowns')
 *   .select('*')
 *   .eq('status', 'active')
 *   .order('created_at', 'DESC')
 *   .execute();
 */
export function from(table) {
  return new QueryBuilder(table);
}

/**
 * Pagination helper
 * @param {number} page - Page number (1-indexed)
 * @param {number} pageSize - Number of items per page
 * @returns {Object} { limit, offset }
 */
export function paginate(page = 1, pageSize = 10) {
  const limit = parseInt(pageSize);
  const offset = (parseInt(page) - 1) * limit;
  return { limit, offset };
}

/**
 * Search helper - builds LIKE conditions for multiple columns
 * @param {Array<string>} columns - Columns to search
 * @param {string} searchTerm - Search term
 * @returns {Object} { sql, params }
 *
 * @example
 * const search = buildSearchCondition(['fleet_no', 'location'], '6333');
 * const sql = `SELECT * FROM breakdowns WHERE ${search.sql}`;
 * const results = await query(sql, search.params);
 */
export function buildSearchCondition(columns, searchTerm) {
  if (!searchTerm || columns.length === 0) {
    return { sql: '1=1', params: [] };
  }

  // SECURITY: Validate all column names
  columns.forEach(col => sanitizeColumn(col));

  const conditions = columns.map(col => `${col} LIKE ?`);
  const params = columns.map(() => `%${searchTerm}%`);

  return {
    sql: `(${conditions.join(' OR ')})`,
    params
  };
}

/**
 * Date range helper
 * @param {string} column - Date column name
 * @param {Date|string} start - Start date
 * @param {Date|string} end - End date
 * @returns {Object} { sql, params }
 */
export function buildDateRangeCondition(column, start, end) {
  // SECURITY: Validate column name
  sanitizeColumn(column);

  const conditions = [];
  const params = [];

  if (start) {
    conditions.push(`${column} >= ?`);
    params.push(start);
  }

  if (end) {
    conditions.push(`${column} <= ?`);
    params.push(end);
  }

  return {
    sql: conditions.length > 0 ? conditions.join(' AND ') : '1=1',
    params
  };
}

/**
 * Bulk insert helper
 * @param {string} table - Table name
 * @param {Array<Object>} records - Array of records to insert
 * @returns {Promise<Object>} Insert result
 *
 * @example
 * await bulkInsert('breakdowns', [
 *   { fleet_no: '6333', status: 'active' },
 *   { fleet_no: '6334', status: 'active' }
 * ]);
 */
export async function bulkInsert(table, records) {
  // SECURITY: Validate table name
  validateTable(table);

  if (!Array.isArray(records) || records.length === 0) {
    throw new Error('Records must be a non-empty array');
  }

  const keys = Object.keys(records[0]);
  // SECURITY: Validate all column names
  keys.forEach(key => sanitizeColumn(key));

  const placeholders = records.map(() => `(${keys.map(() => '?').join(', ')})`).join(', ');
  const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES ${placeholders}`;

  const params = records.flatMap(record => keys.map(key => record[key]));

  try {
    const [result] = await pool.execute(sql, params);
    return {
      insertedCount: result.affectedRows,
      insertId: result.insertId
    };
  } catch (error) {
    console.error('Bulk insert error:', error.message);
    throw error;
  }
}

/**
 * Upsert helper (INSERT ... ON DUPLICATE KEY UPDATE)
 * @param {string} table - Table name
 * @param {Object} data - Data to insert/update
 * @param {Array<string>} updateKeys - Keys to update on duplicate (default: all except primary key)
 * @returns {Promise<Object>} Upsert result
 *
 * @example
 * await upsert('supervisors', {
 *   id: 'AG003',
 *   name: 'Anthony',
 *   status: 'active'
 * }, ['name', 'status']);
 */
export async function upsert(table, data, updateKeys = null) {
  // SECURITY: Validate table name
  validateTable(table);

  const keys = Object.keys(data);
  // SECURITY: Validate all column names
  keys.forEach(key => sanitizeColumn(key));

  const insertSql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`;

  // If no update keys specified, update all except first key (assumed to be primary key)
  const keysToUpdate = updateKeys || keys.slice(1);
  // SECURITY: Validate update keys
  keysToUpdate.forEach(key => sanitizeColumn(key));

  const updateClause = keysToUpdate.map(k => `${k} = VALUES(${k})`).join(', ');

  const sql = `${insertSql} ON DUPLICATE KEY UPDATE ${updateClause}`;
  const params = keys.map(k => data[k]);

  try {
    const [result] = await pool.execute(sql, params);
    return {
      insertId: result.insertId,
      affectedRows: result.affectedRows,
      // affectedRows = 1 means INSERT, 2 means UPDATE, 0 means no change
      action: result.affectedRows === 1 ? 'inserted' : result.affectedRows === 2 ? 'updated' : 'no_change'
    };
  } catch (error) {
    console.error('Upsert error:', error.message);
    throw error;
  }
}

/**
 * Safe delete with confirmation (requires explicit count parameter)
 * @param {string} table - Table name
 * @param {Object} where - WHERE conditions
 * @param {number} expectedCount - Expected number of rows to delete (safety check)
 * @returns {Promise<number>} Number of deleted rows
 */
export async function safeDelete(table, where, expectedCount) {
  // SECURITY: Validate table name
  validateTable(table);

  if (expectedCount === undefined) {
    throw new Error('safeDelete requires expectedCount parameter for safety');
  }

  const whereKeys = Object.keys(where);
  if (whereKeys.length === 0) {
    throw new Error('DELETE requires WHERE conditions');
  }

  // SECURITY: Validate all column names in WHERE clause
  whereKeys.forEach(key => sanitizeColumn(key));

  // First, count the rows that would be deleted
  const countSql = `SELECT COUNT(*) as count FROM ${table} WHERE ${whereKeys.map(k => `${k} = ?`).join(' AND ')}`;
  const countParams = whereKeys.map(k => where[k]);
  const [countResult] = await query(countSql, countParams);

  const actualCount = countResult.count;

  if (actualCount !== expectedCount) {
    throw new Error(
      `Safety check failed: Expected to delete ${expectedCount} rows, but ${actualCount} rows match the condition`
    );
  }

  // Proceed with delete
  return await remove(table, where);
}

/**
 * Execute query with automatic retry on deadlock
 * @param {Function} queryFn - Async function that executes the query
 * @param {number} maxRetries - Maximum number of retries (default: 3)
 * @returns {Promise<any>} Query result
 */
export async function withRetry(queryFn, maxRetries = 3) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await queryFn();
    } catch (error) {
      lastError = error;

      // Retry on deadlock or lock timeout
      if (error.code === 'ER_LOCK_DEADLOCK' || error.code === 'ER_LOCK_WAIT_TIMEOUT') {
        console.warn(`Deadlock detected, retrying (attempt ${attempt}/${maxRetries})...`);

        // Exponential backoff
        const delay = Math.min(100 * Math.pow(2, attempt - 1), 1000);
        await new Promise(resolve => setTimeout(resolve, delay));

        continue;
      }

      // For other errors, throw immediately
      throw error;
    }
  }

  throw lastError;
}

/**
 * Build WHERE IN clause with proper chunking for large arrays
 * @param {string} column - Column name
 * @param {Array} values - Array of values (can be very large)
 * @param {number} chunkSize - Chunk size (default: 1000)
 * @returns {Object} { sql, params }
 */
export function buildInClause(column, values, chunkSize = 1000) {
  // SECURITY: Validate column name
  sanitizeColumn(column);

  if (!Array.isArray(values) || values.length === 0) {
    return { sql: '1=0', params: [] }; // Return false condition
  }

  if (values.length <= chunkSize) {
    const placeholders = values.map(() => '?').join(', ');
    return {
      sql: `${column} IN (${placeholders})`,
      params: values
    };
  }

  // For large arrays, split into chunks and use OR
  const chunks = [];
  const params = [];

  for (let i = 0; i < values.length; i += chunkSize) {
    const chunk = values.slice(i, i + chunkSize);
    const placeholders = chunk.map(() => '?').join(', ');
    chunks.push(`${column} IN (${placeholders})`);
    params.push(...chunk);
  }

  return {
    sql: `(${chunks.join(' OR ')})`,
    params
  };
}

// Export all helper functions
export default {
  from,
  QueryBuilder,
  paginate,
  buildSearchCondition,
  buildDateRangeCondition,
  bulkInsert,
  upsert,
  safeDelete,
  withRetry,
  buildInClause,
  // SECURITY: Export validation functions for use in other modules
  isValidIdentifier,
  sanitizeColumn,
  validateTable,
  ALLOWED_TABLES,
  // Re-export database functions for convenience
  query,
  select,
  insert,
  update,
  remove,
  transaction
};

// Also export as named exports for convenience
export { query, select, insert, update, remove, transaction };

// SECURITY: Export validation utilities for other modules
export { isValidIdentifier, sanitizeColumn, validateTable, ALLOWED_TABLES };
