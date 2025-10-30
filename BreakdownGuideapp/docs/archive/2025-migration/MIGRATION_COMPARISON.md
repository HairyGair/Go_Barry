# Server Migration Comparison: Supabase vs MySQL

Quick reference showing the key differences between the original Supabase implementation and the new MySQL implementation.

## Import Statements

### Before (Supabase)
```javascript
import { createClient } from '@supabase/supabase-js';
```

### After (MySQL)
```javascript
import db, { healthCheck as dbHealthCheck, closePool } from './config/mysql.js';
```

---

## Database Initialization

### Before (Supabase)
```javascript
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
console.log('✅ Supabase client initialized');
```

### After (MySQL)
```javascript
const dbHost = process.env.DB_HOST || process.env.MYSQL_HOST || 'localhost';
const dbName = process.env.DB_NAME || process.env.MYSQL_DATABASE || 'gobarryco_breakdowns';

if (!process.env.DB_USER && !process.env.MYSQL_USER) {
  console.error('❌ Missing MySQL user configuration');
  process.exit(1);
}

if (!process.env.DB_PASSWORD && !process.env.MYSQL_PASSWORD) {
  console.error('❌ Missing MySQL password configuration');
  process.exit(1);
}

console.log('✅ MySQL client configuration loaded');
console.log(`   Database: ${dbName}@${dbHost}`);
```

---

## Connection Verification

### Before (Supabase)
```javascript
async function verifySupabaseConnection() {
  try {
    console.log('🔍 Verifying Supabase connection...');

    const { data, error } = await supabase
      .from('breakdowns')
      .select('id')
      .limit(1);

    if (error) {
      console.error('❌ Supabase connection failed:', error.message);
      return false;
    }

    console.log('✅ Supabase connection verified');
    return true;
  } catch (err) {
    console.error('❌ Supabase connection error:', err.message);
    return false;
  }
}
```

### After (MySQL)
```javascript
async function verifyDatabaseConnection() {
  try {
    console.log('🔍 Verifying MySQL database connection...');

    const isHealthy = await dbHealthCheck();

    if (!isHealthy) {
      console.error('❌ MySQL connection health check failed');
      return false;
    }

    console.log('✅ MySQL database connection verified');
    console.log(`📊 Database accessible and responsive`);
    return true;
  } catch (err) {
    console.error('❌ MySQL connection error:', err.message);
    return false;
  }
}
```

---

## Health Check Endpoint

### Before (Supabase)
```javascript
app.get('/health', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('breakdowns')
      .select('id')
      .limit(1);

    const supabaseStatus = error ? 'disconnected' : 'connected';

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'breakdown-guide-api',
      supabase: {
        status: supabaseStatus,
        url: supabaseUrl,
        error: error ? error.message : null
      },
      // ... other fields
    });
  } catch (err) {
    // Error handling
  }
});
```

### After (MySQL)
```javascript
app.get('/health', async (req, res) => {
  try {
    const isHealthy = await dbHealthCheck();
    const dbStatus = isHealthy ? 'connected' : 'disconnected';

    res.json({
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      service: 'breakdown-guide-api',
      database: {
        type: 'mysql',
        status: dbStatus,
        host: dbHost,
        name: dbName,
        error: isHealthy ? null : 'Health check failed'
      },
      // ... other fields
    });
  } catch (err) {
    // Error handling
  }
});
```

---

## Error Handling

### Before (Supabase)
```javascript
// Supabase-specific errors
if (err.message && err.message.includes('JWT')) {
  statusCode = 401;
  errorType = 'authentication_error';
}
// ... other error handling
```

### After (MySQL)
```javascript
// JWT/Authentication errors (unchanged)
if (err.message && err.message.includes('JWT')) {
  statusCode = 401;
  errorType = 'authentication_error';
}

// ADDED: MySQL-specific errors
if (err.code === 'ER_DUP_ENTRY') {
  statusCode = 409;
  errorType = 'duplicate_resource';
} else if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_ROW_IS_REFERENCED_2') {
  statusCode = 400;
  errorType = 'constraint_violation';
} else if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
  statusCode = 503;
  errorType = 'database_connection_error';
}
```

---

## Graceful Shutdown

### Before (Supabase)
```javascript
// No explicit shutdown handler for Supabase
// (Supabase client handles cleanup automatically)
```

### After (MySQL)
```javascript
// ADDED: Graceful shutdown for MySQL connection pool
process.on('SIGTERM', async () => {
  console.log('📡 SIGTERM signal received: closing HTTP server and database connections');

  server.close(() => {
    console.log('✅ HTTP server closed');
  });

  try {
    await closePool();
    console.log('✅ MySQL connection pool closed');
  } catch (error) {
    console.error('❌ Error closing MySQL pool:', error);
  }

  process.exit(0);
});

process.on('SIGINT', async () => {
  // Same as SIGTERM
});
```

---

## Server Startup

### Before (Supabase)
```javascript
server.listen(PORT, async () => {
  console.log(`🚀 Breakdown Guide API running on port ${PORT}`);
  // ... startup messages

  const supabaseConnected = await verifySupabaseConnection();
  if (!supabaseConnected) {
    console.warn('⚠️  Starting server despite Supabase connection issues');
  }

  // ... route listings
  console.log('\n✅ Server ready for connections with supervisors route');
});
```

### After (MySQL)
```javascript
server.listen(PORT, async () => {
  console.log(`🚀 Breakdown Guide API running on port ${PORT}`);
  // ... startup messages

  const dbConnected = await verifyDatabaseConnection();
  if (!dbConnected) {
    console.warn('⚠️  Starting server despite MySQL connection issues');
    console.warn('   Check your environment variables and network connection');
  }

  // ... route listings
  console.log('\n✅ Server ready for connections with MySQL database');
});
```

---

## Exports

### Before (Supabase)
```javascript
export { app, supabase };
```

### After (MySQL)
```javascript
export { app, db };
```

---

## Activity Logger Initialization

### Before (Supabase)
```javascript
activityLogger.setSupabaseClient(supabase);
```

### After (MySQL)
```javascript
activityLogger.setDatabaseClient(db);
```

**NOTE**: The activityLogger service needs to be updated to accept `db` instead of `supabase` and use MySQL query helpers.

---

## Environment Variables

### Before (Supabase)
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### After (MySQL)
```env
# Primary MySQL variables
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=gobarryco_breakdowns

# Fallback MySQL variables (optional)
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=your_mysql_user
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=gobarryco_breakdowns

# Connection pool settings (optional)
MYSQL_CONNECTION_LIMIT=10
```

---

## Key Differences Summary

| Aspect | Supabase | MySQL |
|--------|----------|-------|
| **Connection** | HTTP-based client | Connection pool |
| **Query Syntax** | Supabase Query Builder | SQL with parameterized queries |
| **Authentication** | Built-in Supabase Auth | Custom JWT implementation |
| **Connection Pooling** | Automatic | Manual configuration (10 connections) |
| **Graceful Shutdown** | Automatic | Manual pool cleanup required |
| **Error Codes** | Supabase-specific | MySQL error codes (ER_*) |
| **Health Check** | Table query | SELECT 1 query |
| **Environment Setup** | 2-3 variables | 5-6 variables |
| **Hosting** | Cloud-based | Local or remote MySQL server |

---

## What Stayed The Same

- Express middleware configuration
- All route imports and configurations
- CORS settings
- WebSocket handling
- 404 handler
- General error handling patterns (except database-specific errors)
- Server startup logging format
- API documentation HTML page (except "Powered by" footer)
- Memory optimization approach

---

## Migration Benefits

1. **Local Control**: Database runs on same server (no external API calls)
2. **Lower Latency**: Direct socket connection vs HTTP requests
3. **Cost Reduction**: No Supabase subscription fees
4. **Standard SQL**: Familiar MySQL syntax
5. **Connection Pooling**: Better control over database connections
6. **cPanel Compatible**: Works with standard cPanel MySQL databases

## Migration Challenges

1. **Query Rewrite**: All Supabase queries need conversion to SQL
2. **Auth Changes**: Need custom JWT instead of Supabase Auth
3. **Real-time**: Need custom implementation (Supabase Realtime not available)
4. **Transaction Handling**: Need explicit transaction management
5. **Connection Management**: Manual pool configuration required
