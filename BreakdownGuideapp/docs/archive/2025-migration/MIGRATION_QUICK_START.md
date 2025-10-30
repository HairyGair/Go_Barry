# MySQL Migration - Quick Start Guide

**Go BARRY Backend - Supabase to cPanel MySQL**
**Quick Reference for Developers**

---

## 🎯 What's Changed

We've migrated from **Supabase (PostgreSQL)** to **cPanel MySQL** for production hosting.

### Why?
- Cost optimization (cPanel hosting included)
- Better control over database
- Simplified deployment
- No external dependencies

---

## 🚀 Quick Setup

### 1. Update Your .env File

```bash
# Copy the example file
cp .env.example .env

# Edit .env and add your MySQL credentials:
DB_HOST=localhost
DB_PORT=3306
DB_NAME=gobarryco_breakdowns
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
```

### 2. Verify MySQL Connection

```bash
# Start the server
npm run dev

# You should see:
# ✅ MySQL database connected successfully
# ✅ Test query result: PASS
```

---

## 📚 New Import Patterns

### Option 1: Query Helpers (Recommended)

```javascript
import { from } from '../utils/queryHelpers.js';

// Supabase-style queries
const { data, error } = await from('breakdowns')
  .select('*')
  .eq('status', 'active')
  .order('created_at', 'DESC')
  .limit(10)
  .execute();
```

### Option 2: Direct MySQL Queries

```javascript
import { query, select, insert, update, remove } from '../config/mysql.js';

// Raw SQL
const results = await query(
  'SELECT * FROM breakdowns WHERE status = ?',
  ['active']
);

// Helper functions
const results = await select('breakdowns', { status: 'active' });
```

---

## 🔄 Common Migration Examples

### GET - Fetch Records

**Before (Supabase):**
```javascript
const { data, error } = await supabase
  .from('breakdowns')
  .select('*')
  .eq('status', 'active');
```

**After (MySQL):**
```javascript
const { data, error } = await from('breakdowns')
  .eq('status', 'active')
  .execute();
```

### POST - Create Record

**Before (Supabase):**
```javascript
const { data, error } = await supabase
  .from('breakdowns')
  .insert({ fleet_no: '6333', status: 'active' })
  .select()
  .single();
```

**After (MySQL):**
```javascript
const result = await insert('breakdowns', {
  fleet_no: '6333',
  status: 'active'
});

// Get the inserted record if needed
const [data] = await query(
  'SELECT * FROM breakdowns WHERE id = ?',
  [result.insertId]
);
```

### PUT - Update Record

**Before (Supabase):**
```javascript
const { data, error } = await supabase
  .from('breakdowns')
  .update({ status: 'resolved' })
  .eq('id', breakdownId);
```

**After (MySQL):**
```javascript
const affectedRows = await update(
  'breakdowns',
  { status: 'resolved' },
  { id: breakdownId }
);
```

### DELETE - Remove Record

**Before (Supabase):**
```javascript
const { error } = await supabase
  .from('breakdowns')
  .delete()
  .eq('id', breakdownId);
```

**After (MySQL):**
```javascript
const affectedRows = await remove('breakdowns', { id: breakdownId });
```

---

## 🎨 Query Builder Features

The new query builder supports all common Supabase patterns:

```javascript
// Comparison operators
.eq('column', value)      // =
.neq('column', value)     // !=
.gt('column', value)      // >
.gte('column', value)     // >=
.lt('column', value)      // <
.lte('column', value)     // <=

// Pattern matching
.like('column', '%pattern%')     // LIKE (case-sensitive)
.ilike('column', '%pattern%')    // LIKE (case-insensitive)

// List operations
.in('column', [1, 2, 3])         // IN
.isNull('column')                 // IS NULL
.notNull('column')                // IS NOT NULL

// Ordering and pagination
.order('column', 'DESC')          // ORDER BY
.limit(10)                        // LIMIT
.offset(20)                       // OFFSET
.range(0, 9)                      // LIMIT 10 OFFSET 0

// Execution
.execute()                        // Returns { data, error }
.single()                         // Returns single record { data, error }
```

---

## 🔐 Important Differences

### 1. Authentication
- **Old:** Supabase Auth with built-in JWT
- **New:** Custom JWT implementation in `authMiddleware.js`
- **Action:** Use existing middleware, no changes to route auth

### 2. Response Format
- Both return `{ data, error }` format for compatibility
- Error handling remains the same
- No changes needed in frontend

### 3. Transactions
- **New feature:** MySQL supports native transactions
- Use `transaction()` helper for multi-query operations

```javascript
import { transaction } from '../config/mysql.js';

await transaction(async (connection) => {
  await connection.execute('INSERT INTO ...', [...]);
  await connection.execute('UPDATE ...', [...]);
});
```

---

## 🧪 Testing Your Changes

### 1. Test Database Connection
```javascript
import db from '../config/mysql.js';

// Check health
const isHealthy = await db.healthCheck();
console.log('Database healthy:', isHealthy);

// Get pool stats
const stats = db.getPoolStats();
console.log('Active connections:', stats.activeConnections);
```

### 2. Test Your Route
```bash
# Start server in dev mode
npm run dev

# Test endpoint with curl
curl http://localhost:3001/api/breakdowns

# Or use your API client (Postman, Insomnia, etc.)
```

### 3. Check Console Logs
Look for:
- ✅ MySQL database connected successfully
- ✅ Test query result: PASS
- No ❌ error messages

---

## 📖 Files You'll Work With

### Configuration Files (Don't Modify)
- `/backend/config/mysql.js` - MySQL connection
- `/backend/utils/queryHelpers.js` - Query utilities
- `/backend/.env` - Your credentials

### Files to Update (During Migration)
- `/backend/server.js` - Replace Supabase client
- `/backend/routes/*.js` - Replace Supabase queries
- `/backend/services/*.js` - Update service dependencies
- `/backend/middleware/authMiddleware.js` - Update auth

---

## 🆘 Common Issues

### "Access Denied" Error
- Check DB_USER and DB_PASSWORD in .env
- Verify MySQL user has permissions on database
- Try connecting with MySQL client: `mysql -u username -p`

### "Connection Refused" Error
- Check DB_HOST (should be 'localhost' for cPanel)
- Verify MySQL is running
- Check DB_PORT (default: 3306)

### "Unknown Database" Error
- Verify DB_NAME is correct
- Create database in cPanel if missing
- Check database name matches .env

### "Too Many Connections" Error
- Reduce MYSQL_CONNECTION_LIMIT in .env
- Check for connection leaks (always release connections)
- Monitor with `db.getPoolStats()`

---

## 📞 Getting Help

1. **Check the detailed guide:** `/backend/SUPABASE_TO_MYSQL_MIGRATION_GUIDE.md`
2. **Review query examples:** See "Migration Patterns" section in main guide
3. **Check existing migrations:** Look at completed route files for examples
4. **Test in isolation:** Create a small test file to verify queries

---

## ✅ Migration Checklist

Before you migrate a route file:

- [ ] Read the detailed migration guide
- [ ] Test MySQL connection locally
- [ ] Identify all Supabase queries in the file
- [ ] Replace imports (Supabase → MySQL)
- [ ] Update each query using patterns above
- [ ] Test the route with sample data
- [ ] Verify error handling works
- [ ] Check response format matches frontend expectations
- [ ] Test with actual frontend integration

---

## 🎯 Priority Order

Migrate files in this order:

1. **server.js** (Core - do this first)
2. **authMiddleware.js** (Authentication)
3. **routes/breakdowns.js** (Most used endpoint)
4. **routes/auth.js** (User authentication)
5. **routes/supervisors.js** (User management)
6. All other routes as needed

---

## 💡 Pro Tips

1. **Keep Supabase code commented** during migration for reference
2. **Test each route immediately** after migrating
3. **Use query helpers** for cleaner code
4. **Check for JOIN queries** - they need special attention
5. **Verify date handling** - MySQL uses different date formats
6. **Test with real data** - edge cases appear with production data

---

**Last Updated:** October 15, 2025
**Status:** Ready to Use
**Support:** See `/backend/SUPABASE_TO_MYSQL_MIGRATION_GUIDE.md` for detailed documentation
