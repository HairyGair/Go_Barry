/**
 * cPanel Database Connection Configuration
 *
 * This file provides a drop-in replacement for Supabase client
 * after migrating to cPanel MySQL/PostgreSQL.
 *
 * SETUP INSTRUCTIONS:
 * 1. Install required package:
 *    npm install mysql2  (for MySQL)
 *    npm install pg      (for PostgreSQL, already installed)
 *
 * 2. Update backend/.env with cPanel credentials:
 *    DB_TYPE=mysql
 *    DB_HOST=localhost
 *    DB_PORT=3306
 *    DB_NAME=username_gobarry_breakdown
 *    DB_USER=username_gobarry_user
 *    DB_PASSWORD=your_secure_password
 *
 * 3. Replace Supabase imports with this file:
 *    import { db } from './config/database-cpanel.js';
 *
 * 4. Update queries to use native SQL (see examples below)
 *
 * @author Anthony Gair
 * @version 1.0.0
 */

import mysql from 'mysql2/promise';
// Uncomment for PostgreSQL:
// import pg from 'pg';
// const { Pool } = pg;

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306, // 3306 for MySQL, 5432 for PostgreSQL
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  // Connection pool settings
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  // Timezone handling
  timezone: '+00:00',
  // Character set
  charset: 'utf8mb4'
};

// Create connection pool
let pool;

if (process.env.DB_TYPE === 'postgres') {
  // PostgreSQL
  // pool = new Pool({
  //   host: dbConfig.host,
  //   port: dbConfig.port,
  //   user: dbConfig.user,
  //   password: dbConfig.password,
  //   database: dbConfig.database,
  //   max: dbConfig.connectionLimit,
  //   idleTimeoutMillis: 30000,
  //   connectionTimeoutMillis: 2000,
  // });
} else {
  // MySQL (default)
  pool = mysql.createPool(dbConfig);
}

/**
 * Test database connection
 * @returns {Promise<boolean>} Connection status
 */
export async function testConnection() {
  try {
    console.log('🔄 Testing database connection...');
    console.log(`   Host: ${dbConfig.host}`);
    console.log(`   Database: ${dbConfig.database}`);
    console.log(`   User: ${dbConfig.user}`);

    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

/**
 * Execute a SELECT query
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Array>} Query results
 */
export async function query(sql, params = []) {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('Query error:', error.message);
    console.error('SQL:', sql);
    console.error('Params:', params);
    throw error;
  }
}

/**
 * Execute an INSERT query
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} Insert result with insertId
 */
export async function insert(sql, params = []) {
  try {
    const [result] = await pool.execute(sql, params);
    return {
      insertId: result.insertId,
      affectedRows: result.affectedRows
    };
  } catch (error) {
    console.error('Insert error:', error.message);
    console.error('SQL:', sql);
    console.error('Params:', params);
    throw error;
  }
}

/**
 * Execute an UPDATE query
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<number>} Number of affected rows
 */
export async function update(sql, params = []) {
  try {
    const [result] = await pool.execute(sql, params);
    return result.affectedRows;
  } catch (error) {
    console.error('Update error:', error.message);
    console.error('SQL:', sql);
    console.error('Params:', params);
    throw error;
  }
}

/**
 * Execute a DELETE query
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<number>} Number of affected rows
 */
export async function remove(sql, params = []) {
  try {
    const [result] = await pool.execute(sql, params);
    return result.affectedRows;
  } catch (error) {
    console.error('Delete error:', error.message);
    console.error('SQL:', sql);
    console.error('Params:', params);
    throw error;
  }
}

/**
 * Execute a transaction
 * @param {Function} callback - Async function with queries to execute
 * @returns {Promise<any>} Transaction result
 */
export async function transaction(callback) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    console.error('Transaction error:', error.message);
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Get connection pool statistics
 * @returns {Object} Pool statistics
 */
export function getPoolStats() {
  return {
    totalConnections: pool.pool._allConnections.length,
    activeConnections: pool.pool._allConnections.length - pool.pool._freeConnections.length,
    freeConnections: pool.pool._freeConnections.length,
    queuedRequests: pool.pool._connectionQueue.length
  };
}

/**
 * Close database connection pool
 * Call this on application shutdown
 */
export async function closePool() {
  try {
    await pool.end();
    console.log('✅ Database connection pool closed');
  } catch (error) {
    console.error('❌ Error closing pool:', error.message);
  }
}

// Export pool for advanced usage
export { pool };

// Default export with helper functions
export default {
  pool,
  query,
  insert,
  update,
  remove,
  transaction,
  testConnection,
  getPoolStats,
  closePool
};

// ============================================================================
// MIGRATION EXAMPLES
// ============================================================================

/**
 * Example 1: Supabase to MySQL - Get all breakdowns
 *
 * BEFORE (Supabase):
 * const { data, error } = await supabase
 *   .from('breakdowns')
 *   .select('*')
 *   .eq('status', 'active')
 *   .order('created_at', { ascending: false });
 *
 * AFTER (MySQL):
 * import { query } from './config/database-cpanel.js';
 *
 * const breakdowns = await query(
 *   'SELECT * FROM breakdowns WHERE status = ? ORDER BY created_at DESC',
 *   ['active']
 * );
 */

/**
 * Example 2: Supabase to MySQL - Get single breakdown
 *
 * BEFORE (Supabase):
 * const { data, error } = await supabase
 *   .from('breakdowns')
 *   .select('*')
 *   .eq('id', breakdownId)
 *   .single();
 *
 * AFTER (MySQL):
 * const [breakdown] = await query(
 *   'SELECT * FROM breakdowns WHERE id = ? LIMIT 1',
 *   [breakdownId]
 * );
 */

/**
 * Example 3: Supabase to MySQL - Insert new breakdown
 *
 * BEFORE (Supabase):
 * const { data, error } = await supabase
 *   .from('breakdowns')
 *   .insert({
 *     fleet_no: '6333',
 *     supervisor_id: 'uuid',
 *     status: 'active',
 *     created_at: new Date()
 *   })
 *   .select()
 *   .single();
 *
 * AFTER (MySQL):
 * const result = await insert(
 *   `INSERT INTO breakdowns
 *    (id, fleet_no, supervisor_id, status, created_at)
 *    VALUES (UUID(), ?, ?, ?, NOW())`,
 *   ['6333', supervisorId, 'active']
 * );
 *
 * const breakdownId = result.insertId;
 */

/**
 * Example 4: Supabase to MySQL - Update breakdown
 *
 * BEFORE (Supabase):
 * const { data, error } = await supabase
 *   .from('breakdowns')
 *   .update({ status: 'resolved' })
 *   .eq('id', breakdownId)
 *   .select()
 *   .single();
 *
 * AFTER (MySQL):
 * const affectedRows = await update(
 *   'UPDATE breakdowns SET status = ?, updated_at = NOW() WHERE id = ?',
 *   ['resolved', breakdownId]
 * );
 */

/**
 * Example 5: Supabase to MySQL - Delete breakdown
 *
 * BEFORE (Supabase):
 * const { error } = await supabase
 *   .from('breakdowns')
 *   .delete()
 *   .eq('id', breakdownId);
 *
 * AFTER (MySQL):
 * const affectedRows = await remove(
 *   'DELETE FROM breakdowns WHERE id = ?',
 *   [breakdownId]
 * );
 */

/**
 * Example 6: Supabase to MySQL - Join queries
 *
 * BEFORE (Supabase):
 * const { data, error } = await supabase
 *   .from('breakdowns')
 *   .select(`
 *     *,
 *     supervisors (name, email),
 *     fleet_vehicles (vehicle_type, depot)
 *   `)
 *   .eq('status', 'active');
 *
 * AFTER (MySQL):
 * const breakdowns = await query(`
 *   SELECT
 *     b.*,
 *     s.name as supervisor_name,
 *     s.email as supervisor_email,
 *     f.vehicle_type,
 *     f.depot
 *   FROM breakdowns b
 *   LEFT JOIN supervisors s ON b.supervisor_id = s.id
 *   LEFT JOIN fleet_vehicles f ON b.fleet_no = f.fleet_no
 *   WHERE b.status = ?
 * `, ['active']);
 */

/**
 * Example 7: Supabase to MySQL - Search with LIKE
 *
 * BEFORE (Supabase):
 * const { data, error } = await supabase
 *   .from('fleet_vehicles')
 *   .select('*')
 *   .ilike('fleet_no', `%${searchTerm}%`);
 *
 * AFTER (MySQL):
 * const vehicles = await query(
 *   'SELECT * FROM fleet_vehicles WHERE fleet_no LIKE ?',
 *   [`%${searchTerm}%`]
 * );
 */

/**
 * Example 8: Supabase to MySQL - Count records
 *
 * BEFORE (Supabase):
 * const { count, error } = await supabase
 *   .from('breakdowns')
 *   .select('*', { count: 'exact', head: true })
 *   .eq('status', 'active');
 *
 * AFTER (MySQL):
 * const [result] = await query(
 *   'SELECT COUNT(*) as count FROM breakdowns WHERE status = ?',
 *   ['active']
 * );
 * const count = result.count;
 */

/**
 * Example 9: Supabase to MySQL - Pagination
 *
 * BEFORE (Supabase):
 * const { data, error } = await supabase
 *   .from('breakdowns')
 *   .select('*')
 *   .range(0, 9)
 *   .order('created_at', { ascending: false });
 *
 * AFTER (MySQL):
 * const page = 1;
 * const limit = 10;
 * const offset = (page - 1) * limit;
 *
 * const breakdowns = await query(
 *   'SELECT * FROM breakdowns ORDER BY created_at DESC LIMIT ? OFFSET ?',
 *   [limit, offset]
 * );
 */

/**
 * Example 10: Supabase to MySQL - Transaction
 *
 * BEFORE (Supabase):
 * // Supabase doesn't have explicit transaction support in client
 * // Had to use multiple queries
 *
 * AFTER (MySQL):
 * await transaction(async (connection) => {
 *   await connection.execute(
 *     'INSERT INTO breakdowns (...) VALUES (...)',
 *     [...]
 *   );
 *
 *   await connection.execute(
 *     'UPDATE fleet_vehicles SET status = ? WHERE fleet_no = ?',
 *     ['breakdown', fleetNo]
 *   );
 *
 *   await connection.execute(
 *     'INSERT INTO activities (...) VALUES (...)',
 *     [...]
 *   );
 * });
 */
