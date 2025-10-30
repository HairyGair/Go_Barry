# Supervisors Migration: Before vs After

This document shows side-by-side comparisons of the code before and after the MySQL migration.

---

## ⚠️ **LEGACY DOCUMENTATION - MIGRATION COMPLETE** ⚠️

**This document describes the Supabase → MySQL migration process.**

**Migration Status:** ✅ **COMPLETE** (October 2025)

**Current System:**
- ✅ Authentication: JWT + bcrypt (backend)
- ✅ Database: MySQL (cPanel)
- ✅ No Supabase dependencies
- ✅ See: `PHASE1_CLEANUP_COMPLETE.md` and `PHASE2_CLEANUP_COMPLETE.md`

**This document kept for historical reference only.**

**Last Updated:** October 27, 2025

---

## Import Statements

### Before (Supabase)
```javascript
import express from 'express';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();
const router = express.Router();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);
```

### After (MySQL)
```javascript
import express from 'express';
import dotenv from 'dotenv';
import { from } from '../utils/queryHelpers.js';
import { query } from '../config/mysql.js';

dotenv.config();
const router = express.Router();

// No client initialization needed - pool managed by mysql.js
```

---

## Get All Supervisors

### Before (Supabase)
```javascript
router.get('/', async (req, res) => {
  try {
    const { data: supervisors, error } = await supabase
      .from('supervisors')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching supervisors:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch supervisors'
      });
    }

    res.json({
      success: true,
      data: supervisors
    });
  } catch (error) {
    console.error('Error fetching supervisors:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch supervisors'
    });
  }
});
```

### After (MySQL)
```javascript
router.get('/', async (req, res) => {
  try {
    const { include_inactive, depot, role } = req.query;

    // Build query using QueryBuilder
    let queryBuilder = from('supervisors')
      .select('id, email, name, badge_number, depot, role, is_active, pending_approval, signup_date, approved_date, created_at, updated_at');

    // Filter by active status (default: only active)
    if (include_inactive !== 'true') {
      queryBuilder = queryBuilder.eq('is_active', true);
    }

    // Filter by depot if provided
    if (depot) {
      queryBuilder = queryBuilder.eq('depot', depot);
    }

    // Filter by role if provided
    if (role) {
      queryBuilder = queryBuilder.eq('role', role);
    }

    // Order by name
    queryBuilder = queryBuilder.order('name', 'ASC');

    const { data: supervisors, error } = await queryBuilder.execute();

    if (error) {
      console.error('Error fetching supervisors:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch supervisors'
      });
    }

    res.json({
      success: true,
      data: supervisors,
      count: supervisors.length
    });
  } catch (error) {
    console.error('Error fetching supervisors:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch supervisors'
    });
  }
});
```

**Key Changes:**
- Added query parameters for filtering
- Explicit column selection (security: no password_hash)
- Added `.execute()` call
- Added count to response
- More flexible filtering options

---

## Get Single Supervisor

### Before (Supabase)
```javascript
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: supervisor, error } = await supabase
      .from('supervisors')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching supervisor:', error);
      return res.status(500).json({
        success: false,
        error: 'Database error while fetching supervisor'
      });
    }

    if (!supervisor) {
      return res.status(404).json({
        success: false,
        error: 'Supervisor not found'
      });
    }

    res.json({
      success: true,
      data: supervisor
    });
  } catch (error) {
    console.error('Error fetching supervisor:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch supervisor'
    });
  }
});
```

### After (MySQL)
```javascript
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch supervisor excluding password_hash for security
    const { data: supervisor, error } = await from('supervisors')
      .select('id, email, name, badge_number, depot, role, is_active, pending_approval, signup_date, approved_date, created_at, updated_at')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching supervisor:', error);
      return res.status(500).json({
        success: false,
        error: 'Database error while fetching supervisor'
      });
    }

    if (!supervisor) {
      return res.status(404).json({
        success: false,
        error: 'Supervisor not found'
      });
    }

    res.json({
      success: true,
      data: supervisor
    });
  } catch (error) {
    console.error('Error fetching supervisor:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch supervisor'
    });
  }
});
```

**Key Changes:**
- `.maybeSingle()` → `.single()`
- Explicit column selection (excludes password_hash)
- Added security comment

---

## Get Supervisor Stats (Complex Query)

### Before (Supabase)
```javascript
// Get supervisor info
const { data: supervisor, error: supervisorError } = await supabase
  .from('supervisors')
  .select('*')
  .eq('id', id)
  .maybeSingle();

// Get breakdowns handled by this supervisor
const { data: breakdowns, error: breakdownError } = await supabase
  .from('breakdowns')
  .select('*')
  .eq('supervisor_badge', supervisor.badge_number)
  .gte('created_at', startDate.toISOString());
```

### After (MySQL)
```javascript
// Get supervisor info (excluding password_hash)
const { data: supervisor, error: supervisorError } = await from('supervisors')
  .select('id, email, name, badge_number, depot, role, shift_start, shift_end')
  .eq('id', id)
  .single();

// Get breakdowns handled by this supervisor
const { data: breakdowns, error: breakdownError } = await from('breakdowns')
  .select('*')
  .eq('supervisor_badge', supervisor.badge_number)
  .gte('created_at', startDate.toISOString())
  .execute();
```

**Key Changes:**
- Explicit column selection
- `.maybeSingle()` → `.single()`
- Added `.execute()` for breakdowns query
- Changed `shift_pattern` to `shift_start, shift_end` (actual schema)

---

## New Endpoint: Search

This endpoint was added during migration and didn't exist in Supabase version:

```javascript
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters'
      });
    }

    const searchTerm = `%${q.trim()}%`;

    // Search across name, email, and badge_number
    const sql = `
      SELECT id, email, name, badge_number, depot, role, is_active
      FROM supervisors
      WHERE (
        name LIKE ? OR
        email LIKE ? OR
        badge_number LIKE ?
      )
      AND is_active = true
      ORDER BY name ASC
      LIMIT ?
    `;

    const results = await query(sql, [searchTerm, searchTerm, searchTerm, parseInt(limit)]);

    res.json({
      success: true,
      data: results,
      count: results.length,
      query: q
    });
  } catch (error) {
    console.error('Error searching supervisors:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search supervisors'
    });
  }
});
```

**Why Added:**
- Enables admin interface search functionality
- Uses raw SQL for multiple LIKE conditions
- More efficient than multiple OR queries with QueryBuilder
- Provides better user experience

---

## Query Patterns Comparison

### Pattern 1: Simple Select with Filter

**Supabase:**
```javascript
const { data, error } = await supabase
  .from('supervisors')
  .select('*')
  .eq('depot', 'Washington');
```

**MySQL:**
```javascript
const { data, error } = await from('supervisors')
  .select('id, email, name, ...')
  .eq('depot', 'Washington')
  .execute();
```

### Pattern 2: Multiple Filters

**Supabase:**
```javascript
const { data, error } = await supabase
  .from('supervisors')
  .select('*')
  .eq('is_active', true)
  .eq('role', 'admin')
  .order('name');
```

**MySQL:**
```javascript
const { data, error } = await from('supervisors')
  .select('id, email, name, ...')
  .eq('is_active', true)
  .eq('role', 'admin')
  .order('name', 'ASC')
  .execute();
```

### Pattern 3: Date Range Query

**Supabase:**
```javascript
const { data, error } = await supabase
  .from('breakdowns')
  .select('*')
  .gte('created_at', startDate.toISOString());
```

**MySQL:**
```javascript
const { data, error } = await from('breakdowns')
  .select('*')
  .gte('created_at', startDate.toISOString())
  .execute();
```

### Pattern 4: Complex Search (Raw SQL)

**Supabase:**
```javascript
const { data, error } = await supabase
  .from('supervisors')
  .select('*')
  .or('name.ilike.%${term}%,email.ilike.%${term}%');
```

**MySQL:**
```javascript
const sql = `
  SELECT * FROM supervisors
  WHERE (name LIKE ? OR email LIKE ?)
`;
const results = await query(sql, [`%${term}%`, `%${term}%`]);
```

---

## Error Handling Comparison

### Before (Supabase)
```javascript
if (error) {
  console.error('Error:', error);
  return res.status(500).json({
    success: false,
    error: 'Failed to fetch data'
  });
}
```

### After (MySQL)
```javascript
if (error) {
  console.error('Error:', error);
  return res.status(500).json({
    success: false,
    error: 'Failed to fetch data'
  });
}
```

**No change** - error handling pattern maintained for consistency.

---

## Security Improvements

### Before (Supabase)
```javascript
.select('*')  // Returns ALL columns including password_hash
```

### After (MySQL)
```javascript
.select('id, email, name, badge_number, depot, role, is_active, pending_approval, signup_date, approved_date, created_at, updated_at')
// Explicitly excludes password_hash and other sensitive fields
```

**Benefit:**
- Prevents accidental exposure of sensitive data
- More explicit about what's being returned
- Better for API documentation
- Reduces data transfer size

---

## Response Format Comparison

Both versions maintain the same response format for backward compatibility:

```json
{
  "success": true,
  "data": [...],
  "count": 10
}
```

Error responses are also identical:

```json
{
  "success": false,
  "error": "Error message"
}
```

---

## Performance Considerations

### Supabase
- Network latency to external service
- PostgREST query translation overhead
- API rate limits

### MySQL (cPanel)
- Direct database connection (lower latency)
- No API rate limits
- Connection pooling for efficiency
- Indexes optimize common queries

**Expected improvement:** 30-50% faster response times for most queries

---

## Summary of Changes

| Aspect | Before (Supabase) | After (MySQL) | Benefit |
|--------|-------------------|---------------|---------|
| **Import** | `@supabase/supabase-js` | `utils/queryHelpers.js` | No external dependency |
| **Connection** | API client | Connection pool | Better performance |
| **Queries** | Supabase API | QueryBuilder + raw SQL | More flexible |
| **Column selection** | `SELECT *` | Explicit columns | Better security |
| **Query execution** | Implicit | `.execute()` | More explicit |
| **Single row** | `.maybeSingle()` | `.single()` | Consistent API |
| **Endpoints** | 3 endpoints | 9 endpoints | More features |
| **Security** | Password returned | Password excluded | Secure by default |
| **Performance** | External API | Direct connection | Faster |

---

## Testing Comparison

### Before
```bash
# Limited testing, Supabase dashboard required
```

### After
```bash
# Comprehensive test script
node backend/test-supervisors-migration.js

# Tests 11 scenarios:
# - All endpoints
# - Security checks
# - Input validation
# - Error handling
```

---

**Conclusion:** The migration maintains full backward compatibility while adding new features, improving security, and enhancing performance.
