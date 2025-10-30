/**
 * Database Service
 * Manages MySQL connection pool with proper error handling and SSL configuration
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Database configuration
const config = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'gobarryco',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gobarryco_breakdowns',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000, // 10 seconds
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  // SSL configuration for production
  ...(process.env.NODE_ENV === 'production' && process.env.DB_SSL === 'true' ? {
    ssl: {
      rejectUnauthorized: true
    }
  } : {})
};

// Create connection pool
const pool = mysql.createPool(config);

/**
 * Test database connection on startup
 * @returns {Promise<boolean>} Connection success status
 */
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute('SELECT 1 as test');
    connection.release();

    console.log('✅ MySQL database connection verified');
    console.log(`📊 Database: ${config.database}`);
    console.log(`🔗 Host: ${config.host}`);

    return true;
  } catch (err) {
    console.error('❌ MySQL database connection failed:', err.message);
    console.error('🔍 Connection details:', {
      host: config.host,
      user: config.user,
      database: config.database
    });

    return false;
  }
}

/**
 * Get a connection from the pool
 * @returns {Promise<mysql.PoolConnection>}
 */
async function getConnection() {
  try {
    return await pool.getConnection();
  } catch (err) {
    console.error('❌ Failed to get database connection:', err.message);
    throw new Error('Database connection unavailable');
  }
}

/**
 * Execute a query with automatic connection management
 * @param {string} query SQL query
 * @param {Array} params Query parameters
 * @returns {Promise<Array>} Query results
 */
async function query(query, params = []) {
  const connection = await getConnection();
  try {
    const [results] = await connection.execute(query, params);
    return results;
  } finally {
    connection.release();
  }
}

/**
 * Execute a transaction with automatic rollback on error
 * @param {Function} callback Transaction callback function
 * @returns {Promise<any>} Transaction result
 */
async function transaction(callback) {
  const connection = await getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

/**
 * Close the connection pool
 * @returns {Promise<void>}
 */
async function close() {
  try {
    await pool.end();
    console.log('✅ Database connection pool closed');
  } catch (err) {
    console.error('❌ Error closing database pool:', err.message);
  }
}

// Handle process termination
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, closing database connections...');
  await close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, closing database connections...');
  await close();
  process.exit(0);
});

// Test connection on module load
testConnection();

export default {
  pool,
  testConnection,
  getConnection,
  query,
  transaction,
  close
};
