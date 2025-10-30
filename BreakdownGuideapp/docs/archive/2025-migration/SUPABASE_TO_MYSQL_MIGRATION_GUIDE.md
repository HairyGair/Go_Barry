# Supabase to MySQL Migration Guide

**Go BARRY Breakdown Management System**
**Database Migration: Supabase PostgreSQL → cPanel MySQL**

**Created:** October 15, 2025
**Author:** Anthony Gair
**Status:** Configuration Complete - Implementation Required

---

## Executive Summary

This document outlines the complete migration strategy from Supabase (PostgreSQL) to cPanel MySQL for the Go BARRY backend. The migration configuration is complete with new MySQL connection handlers, query helpers, and environment configuration ready for implementation.

### Migration Objectives
- Replace Supabase PostgreSQL with cPanel MySQL (`gobarryco_breakdowns`)
- Maintain existing API functionality and response formats
- Optimize for 2GB RAM constraint on production server
- Preserve backward compatibility during transition

---

## ✅ Completed Configuration

### 1. MySQL Connection Configuration
**File:** `/backend/config/mysql.js`

**Features:**
- Connection pooling (10 connections default)
- Automatic reconnection handling
- Comprehensive error handling with specific error codes
- Health check functionality
- Pool statistics monitoring
- Helper functions: `query()`, `select()`, `insert()`, `update()`, `remove()`, `transaction()`

**Usage:**
```javascript
import { query, select, insert, update, remove } from '../config/mysql.js';

// Simple query
const results = await query('SELECT * FROM breakdowns WHERE status = ?', ['active']);

// Helper-based query
const results = await select('breakdowns', { status: 'active' });
```

### 2. Query Helper Utilities
**File:** `/backend/utils/queryHelpers.js`

**Features:**
- Supabase-compatible query builder interface
- Query chaining with method calls
- Pagination helpers
- Search and filter utilities
- Bulk operations (bulkInsert, upsert)
- Transaction retry logic for deadlock handling
- Safe delete with confirmation

**Usage:**
```javascript
import { from } from '../utils/queryHelpers.js';

// Supabase-style query
const { data, error } = await from('breakdowns')
  .select('*')
  .eq('status', 'active')
  .order('created_at', 'DESC')
  .limit(10)
  .execute();
```

### 3. Environment Configuration
**File:** `/backend/.env.example`

**Updated variables:**
```bash
# MySQL Configuration (Required)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=gobarryco_breakdowns
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password

# Optional
MYSQL_CONNECTION_LIMIT=10
```

**Legacy Supabase variables** are commented out for reference during migration.

---

## 📋 Files Requiring Migration

### Priority 1: Core Backend Files (CRITICAL)

#### **1. server.js**
**Path:** `/backend/server.js`
**Lines:** 24, 48-60, 62-88, 131-150
**Current Usage:**
```javascript
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

**Required Changes:**
- Replace Supabase client initialization with MySQL connection
- Update health check endpoint to use MySQL health check
- Remove Supabase verification function
- Update activity logger initialization

**Migration Example:**
```javascript
// BEFORE
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// AFTER
import db from './config/mysql.js';
// Export db for use in routes
export { db };
```

#### **2. middleware/authMiddleware.js**
**Path:** `/backend/middleware/authMiddleware.js`
**Lines:** 6, 21, Throughout for authentication checks
**Current Usage:** Supabase client for user authentication

**Required Changes:**
- Replace Supabase authentication with MySQL-based auth
- Update session validation queries
- Modify JWT verification logic

**Impact:** HIGH - Affects all authenticated routes

---

### Priority 2: Route Files (HIGH PRIORITY)

#### **3. routes/breakdowns.js**
**Path:** `/backend/routes/breakdowns.js`
**Supabase Queries:** ~30+ instances
**Sample Queries:**
- Line 52-56: `supabase.from('breakdowns').select().eq('issue_category', issueCategory)`
- Line 77-81: `supabase.from('breakdowns').select().eq('fleet_no', fleetNumber)`
- Throughout: CRUD operations for breakdowns

**Migration Complexity:** HIGH - Many complex queries with filters

#### **4. routes/auth.js**
**Path:** `/backend/routes/auth.js**
**Supabase Queries:** 10+ instances
**Key Operations:**
- Line 38-42: Get all supervisors
- Line 68-72: Get user by ID
- Line 90-98: Get supervisor by username

**Migration Complexity:** MEDIUM - Mostly simple SELECT queries

#### **5. routes/supervisors.js**
**Path:** `/backend/routes/supervisors.js`
**Supabase Queries:** Multiple CRUD operations
**Key Operations:**
- Supervisor management
- Session handling
- Profile updates

**Migration Complexity:** MEDIUM

#### **6. routes/analytics.js**
**Path:** `/backend/routes/analytics.js`
**Supabase Queries:** Complex aggregation queries
**Migration Complexity:** HIGH - Requires complex MySQL queries

#### **7. routes/engineering.js**
**Path:** `/backend/routes/engineering.js`
**Supabase Queries:** Engineering dispatch and tracking
**Migration Complexity:** MEDIUM

#### **8. routes/defects.js**
**Path:** `/backend/routes/defects.js`
**Supabase Queries:** Defect tracking and reporting
**Migration Complexity:** MEDIUM

#### **9. routes/wizards.js**
**Path:** `/backend/routes/wizards.js`
**Supabase Queries:** Wizard assessment data storage
**Migration Complexity:** MEDIUM

#### **10. routes/fleet.js**
**Path:** `/backend/routes/fleet.js`
**Supabase Queries:** Fleet vehicle management
**Migration Complexity:** LOW-MEDIUM

#### **11. routes/activity.js**
**Path:** `/backend/routes/activity.js`
**Supabase Queries:** Activity logging and retrieval
**Migration Complexity:** MEDIUM

#### **12. routes/preferences.js**
**Path:** `/backend/routes/preferences.js`
**Supabase Queries:** User preferences storage
**Migration Complexity:** LOW

#### **13. routes/public.js**
**Path:** `/backend/routes/public.js`
**Supabase Queries:** Public-facing data endpoints
**Migration Complexity:** LOW

#### **14. routes/breakdownsAPI.js**
**Path:** `/backend/routes/breakdownsAPI.js`
**Supabase Queries:** API-specific breakdown endpoints
**Migration Complexity:** MEDIUM-HIGH

#### **15. routes/webSocketHandler.js**
**Path:** `/backend/routes/webSocketHandler.js`
**Supabase Queries:** Real-time data broadcasting
**Migration Complexity:** MEDIUM - Requires real-time data handling

---

### Priority 3: Service Files (MEDIUM PRIORITY)

#### **16. services/activityLogger.js**
**Path:** `/backend/services/activityLogger.js**
**Current Usage:** Supabase client injection for activity logging
**Lines:** 9-10, 80-85, Throughout for logging

**Required Changes:**
- Replace Supabase client with MySQL connection
- Update activity insert operations
- Modify batch logging logic

**Impact:** MEDIUM - Affects system-wide logging

#### **17. services/breakdownIdGenerator.js**
**Path:** `/backend/services/breakdownIdGenerator.js**
**Current Usage:** Supabase for ID generation and tracking
**Migration Complexity:** LOW-MEDIUM

---

### Priority 4: Script Files (LOW PRIORITY)

These files are utilities and can be migrated after core functionality:

- `/backend/scripts/export-schema-from-supabase.js` - Schema export utility
- `/backend/scripts/migrate-supabase-to-cpanel.js` - Migration script
- `/backend/scripts/analyze-location-data.js` - Data analysis
- `/backend/scripts/run-migration.js` - Migration runner
- `/backend/scripts/test-wizard-integration.js` - Testing
- `/backend/scripts/apply-schema-fix.js` - Schema fixes
- `/backend/reset-password.js` - Password reset utility
- `/backend/reset-supervisor.js` - Supervisor reset utility
- `/backend/run-migration.js` - Migration runner

**Note:** These can remain unchanged or be updated last as they're not part of the runtime application.

---

## 🔄 Migration Patterns

### Pattern 1: Simple SELECT Query

**BEFORE (Supabase):**
```javascript
const { data, error } = await supabase
  .from('breakdowns')
  .select('*')
  .eq('status', 'active')
  .order('created_at', { ascending: false });

if (error) throw error;
```

**AFTER (MySQL - Option A: Query Helper):**
```javascript
import { from } from '../utils/queryHelpers.js';

const { data, error } = await from('breakdowns')
  .select('*')
  .eq('status', 'active')
  .order('created_at', 'DESC')
  .execute();

if (error) throw error;
```

**AFTER (MySQL - Option B: Direct Query):**
```javascript
import { query } from '../config/mysql.js';

const data = await query(
  'SELECT * FROM breakdowns WHERE status = ? ORDER BY created_at DESC',
  ['active']
);
```

### Pattern 2: Single Record SELECT

**BEFORE (Supabase):**
```javascript
const { data, error } = await supabase
  .from('breakdowns')
  .select('*')
  .eq('id', breakdownId)
  .single();
```

**AFTER (MySQL):**
```javascript
import { from } from '../utils/queryHelpers.js';

const { data, error } = await from('breakdowns')
  .eq('id', breakdownId)
  .single();
```

### Pattern 3: INSERT Query

**BEFORE (Supabase):**
```javascript
const { data, error } = await supabase
  .from('breakdowns')
  .insert({
    fleet_no: '6333',
    status: 'active',
    supervisor_id: userId
  })
  .select()
  .single();
```

**AFTER (MySQL - Option A: Helper):**
```javascript
import { insert } from '../config/mysql.js';

const result = await insert('breakdowns', {
  fleet_no: '6333',
  status: 'active',
  supervisor_id: userId
});

// Fetch the inserted record if needed
const [data] = await query('SELECT * FROM breakdowns WHERE id = ?', [result.insertId]);
```

**AFTER (MySQL - Option B: Direct):**
```javascript
import { query } from '../config/mysql.js';

await query(
  'INSERT INTO breakdowns (fleet_no, status, supervisor_id) VALUES (?, ?, ?)',
  ['6333', 'active', userId]
);
```

### Pattern 4: UPDATE Query

**BEFORE (Supabase):**
```javascript
const { data, error } = await supabase
  .from('breakdowns')
  .update({ status: 'resolved', resolved_at: new Date() })
  .eq('id', breakdownId)
  .select()
  .single();
```

**AFTER (MySQL):**
```javascript
import { update, query } from '../config/mysql.js';

const affectedRows = await update(
  'breakdowns',
  { status: 'resolved', resolved_at: new Date() },
  { id: breakdownId }
);

// Fetch updated record if needed
const [data] = await query('SELECT * FROM breakdowns WHERE id = ?', [breakdownId]);
```

### Pattern 5: DELETE Query

**BEFORE (Supabase):**
```javascript
const { error } = await supabase
  .from('breakdowns')
  .delete()
  .eq('id', breakdownId);
```

**AFTER (MySQL):**
```javascript
import { remove } from '../config/mysql.js';

const affectedRows = await remove('breakdowns', { id: breakdownId });
```

### Pattern 6: JOIN Query

**BEFORE (Supabase):**
```javascript
const { data, error } = await supabase
  .from('breakdowns')
  .select(`
    *,
    supervisors (name, email),
    fleet_vehicles (vehicle_type)
  `)
  .eq('status', 'active');
```

**AFTER (MySQL):**
```javascript
import { query } from '../config/mysql.js';

const data = await query(`
  SELECT
    b.*,
    s.name as supervisor_name,
    s.email as supervisor_email,
    f.vehicle_type
  FROM breakdowns b
  LEFT JOIN supervisors s ON b.supervisor_id = s.id
  LEFT JOIN fleet_vehicles f ON b.fleet_no = f.fleet_no
  WHERE b.status = ?
`, ['active']);
```

### Pattern 7: Complex Filter (IN, LIKE, etc.)

**BEFORE (Supabase):**
```javascript
const { data, error } = await supabase
  .from('breakdowns')
  .select('*')
  .in('status', ['active', 'pending'])
  .ilike('fleet_no', '%6333%');
```

**AFTER (MySQL):**
```javascript
import { from } from '../utils/queryHelpers.js';

const { data, error } = await from('breakdowns')
  .in('status', ['active', 'pending'])
  .ilike('fleet_no', '%6333%')
  .execute();
```

### Pattern 8: Transaction

**BEFORE (Supabase):**
```javascript
// Supabase doesn't have native transaction support in client library
// Multiple separate queries
```

**AFTER (MySQL):**
```javascript
import { transaction } from '../config/mysql.js';

await transaction(async (connection) => {
  await connection.execute(
    'INSERT INTO breakdowns (fleet_no, status) VALUES (?, ?)',
    ['6333', 'active']
  );

  await connection.execute(
    'UPDATE fleet_vehicles SET status = ? WHERE fleet_no = ?',
    ['breakdown', '6333']
  );
});
```

---

## 🗄️ Database Schema Considerations

### Key Differences: PostgreSQL vs MySQL

1. **UUID vs Auto-increment IDs**
   - PostgreSQL: Uses UUID by default
   - MySQL: Uses AUTO_INCREMENT integers
   - **Action:** Ensure ID columns are properly configured in MySQL schema

2. **Date/Time Handling**
   - PostgreSQL: `TIMESTAMP WITH TIME ZONE`
   - MySQL: `DATETIME` or `TIMESTAMP`
   - **Action:** Verify all date columns use UTC and handle timezone conversion in application

3. **Boolean Type**
   - PostgreSQL: Native `BOOLEAN` type
   - MySQL: `TINYINT(1)` (0 = false, 1 = true)
   - **Action:** Update queries to handle 0/1 instead of true/false

4. **JSON Columns**
   - PostgreSQL: `JSONB` with advanced querying
   - MySQL: `JSON` type (MySQL 5.7+)
   - **Action:** Verify JSON column handling and queries

5. **Text Search**
   - PostgreSQL: Full-text search with `@@` operator
   - MySQL: FULLTEXT indexes with MATCH() AGAINST()
   - **Action:** Update any full-text search queries

6. **Case Sensitivity**
   - PostgreSQL: Case-sensitive by default
   - MySQL: Case-insensitive by default (depends on collation)
   - **Action:** Test string comparisons, especially for usernames/emails

---

## 🔐 Authentication Changes

### Supabase Auth vs Custom MySQL Auth

**Current (Supabase):**
- Built-in authentication with JWT tokens
- Row-level security (RLS)
- User management API

**New (MySQL):**
- Custom JWT token generation and validation
- Session management in `sessions` table
- Manual permission checks in middleware

**Required Changes:**
1. Replace Supabase Auth with custom JWT implementation
2. Store sessions in MySQL instead of Supabase Auth
3. Update password hashing (bcrypt)
4. Implement manual role-based access control

---

## 📊 Performance Optimizations

### Connection Pooling
- Default: 10 connections
- Optimized for 2GB RAM constraint
- Automatic connection reuse

### Query Optimization
- Use prepared statements (automatic with mysql2)
- Implement query result caching where appropriate
- Use indexes for frequently queried columns

### Memory Management
- Stream large result sets
- Limit result set sizes with LIMIT clauses
- Use pagination for large datasets

---

## 🚀 Migration Implementation Steps

### Phase 1: Setup (COMPLETED ✅)
1. ✅ Create MySQL configuration file
2. ✅ Create query helper utilities
3. ✅ Update environment configuration
4. ✅ Document migration requirements

### Phase 2: Core Backend (NEXT)
1. Update `server.js` to use MySQL instead of Supabase
2. Migrate `authMiddleware.js` to MySQL-based authentication
3. Update health check endpoints
4. Test basic server startup and connection

### Phase 3: Critical Routes (HIGH PRIORITY)
1. Migrate `routes/breakdowns.js` (highest traffic)
2. Migrate `routes/auth.js` (authentication)
3. Migrate `routes/supervisors.js` (user management)
4. Test critical user workflows

### Phase 4: Secondary Routes (MEDIUM PRIORITY)
1. Migrate `routes/analytics.js`
2. Migrate `routes/engineering.js`
3. Migrate `routes/defects.js`
4. Migrate `routes/wizards.js`
5. Test all route functionality

### Phase 5: Services and Utilities (MEDIUM PRIORITY)
1. Migrate `services/activityLogger.js`
2. Migrate `services/breakdownIdGenerator.js`
3. Update any other service dependencies

### Phase 6: Testing and Validation (CRITICAL)
1. Unit test all migrated endpoints
2. Integration testing with frontend
3. Load testing to verify performance
4. Data integrity verification

### Phase 7: Deployment (FINAL)
1. Backup Supabase data
2. Deploy to cPanel production environment
3. Monitor for errors and performance issues
4. Gradual rollout with fallback plan

---

## ⚠️ Critical Warnings

1. **DO NOT DELETE** Supabase configuration files until migration is complete and verified
2. **TEST THOROUGHLY** - Authentication is critical, any bugs will lock users out
3. **BACKUP DATA** - Export all Supabase data before final migration
4. **GRADUAL ROLLOUT** - Consider A/B testing or staged rollout
5. **MONITOR CLOSELY** - Watch for errors, performance issues, and data inconsistencies
6. **MAINTAIN COMPATIBILITY** - Ensure frontend works with new backend responses

---

## 📞 Support and Resources

### Documentation
- MySQL2 Package: https://github.com/sidorares/node-mysql2
- MySQL Best Practices: https://dev.mysql.com/doc/refman/8.0/en/optimization.html

### Migration Tools
- `/backend/config/mysql.js` - MySQL connection handler
- `/backend/utils/queryHelpers.js` - Query builder and helpers
- `/backend/config/database-cpanel.js` - Legacy migration reference

### Testing Endpoints
After migration, test these critical endpoints:
- `GET /health` - Server health check
- `POST /api/auth/login` - User authentication
- `GET /api/breakdowns` - Breakdown list
- `POST /api/breakdowns` - Create breakdown
- `GET /api/supervisors` - Supervisor list

---

## 📝 File Summary

### New Files Created
1. `/backend/config/mysql.js` - Production MySQL connection (382 lines)
2. `/backend/utils/queryHelpers.js` - Query utilities (615 lines)
3. `/backend/.env.example` - Updated environment config (69 lines)
4. `/backend/SUPABASE_TO_MYSQL_MIGRATION_GUIDE.md` - This document

### Files Requiring Changes (Priority Order)
1. **server.js** - Core server initialization (CRITICAL)
2. **middleware/authMiddleware.js** - Authentication (CRITICAL)
3. **routes/breakdowns.js** - Main breakdown CRUD (HIGH)
4. **routes/auth.js** - Authentication endpoints (HIGH)
5. **routes/supervisors.js** - User management (HIGH)
6. **routes/analytics.js** - Analytics queries (MEDIUM)
7. **routes/engineering.js** - Engineering dispatch (MEDIUM)
8. **routes/defects.js** - Defect tracking (MEDIUM)
9. **routes/wizards.js** - Wizard assessments (MEDIUM)
10. **routes/fleet.js** - Fleet management (MEDIUM)
11. **routes/activity.js** - Activity logging (MEDIUM)
12. **routes/preferences.js** - User preferences (LOW)
13. **routes/public.js** - Public data (LOW)
14. **routes/breakdownsAPI.js** - API endpoints (MEDIUM)
15. **routes/webSocketHandler.js** - Real-time updates (MEDIUM)
16. **services/activityLogger.js** - Activity logging service (MEDIUM)
17. **services/breakdownIdGenerator.js** - ID generation (LOW)

### Total Impact
- **27 files** contain Supabase references
- **15 route files** require query migration
- **2 service files** require updates
- **10 script files** (optional migration)
- **Estimated Effort:** 40-60 hours for complete migration and testing

---

## ✅ Next Steps

1. **Review this document thoroughly**
2. **Test MySQL connection** with actual cPanel credentials
3. **Create backup** of current Supabase data
4. **Start with server.js migration** - smallest, most critical change
5. **Test each route** immediately after migration
6. **Document any issues** encountered during migration
7. **Update frontend** if API response formats change

---

**Document Version:** 1.0
**Last Updated:** October 15, 2025
**Status:** Ready for Implementation
