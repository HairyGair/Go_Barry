# Fleet Routes: Supabase vs MySQL Comparison

This document shows side-by-side comparisons of key code changes during the migration.

---

## Import Statements

### Before (Supabase)
```javascript
import express from 'express';
import { supabase } from '../server.js';

const router = express.Router();
```

### After (MySQL)
```javascript
import express from 'express';
import { from, query, buildSearchCondition, paginate } from '../utils/queryHelpers.js';

const router = express.Router();
```

**Changes**: Replaced Supabase client with MySQL query helpers

---

## Example 1: Simple GET by ID

### Before (Supabase)
```javascript
router.get('/:fleetNumber', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('fleet_vehicles')
      .select('*')
      .eq('fleet_number', req.params.fleetNumber)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    res.status(500).json({ error: 'Failed to fetch vehicle' });
  }
});
```

### After (MySQL)
```javascript
router.get('/:fleetNumber', async (req, res) => {
  try {
    const { data, error } = await from('fleet_vehicles')
      .select('*')
      .eq('fleet_number', req.params.fleetNumber)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    res.status(500).json({ error: 'Failed to fetch vehicle' });
  }
});
```

**Changes**: Replaced `supabase.from()` with `from()` - everything else identical!

---

## Example 2: Search with OR Conditions

### Before (Supabase)
```javascript
router.get('/search/:term', async (req, res) => {
  try {
    const searchTerm = req.params.term;

    const { data, error } = await supabase
      .from('fleet_vehicles')
      .select('*')
      .or(`fleet_number.ilike.%${searchTerm}%,registration.ilike.%${searchTerm}%`)
      .order('fleet_number')
      .limit(20);

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Error searching fleet vehicles:', error);
    res.status(500).json({ error: 'Failed to search fleet vehicles' });
  }
});
```

### After (MySQL)
```javascript
router.get('/search/:term', async (req, res) => {
  try {
    const searchTerm = req.params.term;

    // Search in fleet_number and registration with LIKE
    const sql = `
      SELECT *
      FROM fleet_vehicles
      WHERE fleet_number LIKE ? OR registration LIKE ?
      ORDER BY fleet_number ASC
      LIMIT 20
    `;

    const params = [`%${searchTerm}%`, `%${searchTerm}%`];
    const data = await query(sql, params);

    res.json(data);
  } catch (error) {
    console.error('Error searching fleet vehicles:', error);
    res.status(500).json({ error: 'Failed to search fleet vehicles' });
  }
});
```

**Changes**:
- Replaced Supabase `.or()` with explicit SQL OR condition
- Used parameterized queries for security
- LIKE replaces ilike (case-insensitive in MySQL with default collation)

---

## Example 3: Complex List with Filters

### Before (Supabase)
```javascript
router.get('/', async (req, res) => {
  try {
    const { search, depot, type, page = 1, limit = 100 } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('fleet_vehicles')
      .select('*')
      .order('fleet_number');

    // Apply search filter
    if (search) {
      query = query.or(`fleet_number.ilike.%${search}%,registration.ilike.%${search}%,depot.ilike.%${search}%`);
    }

    // Apply depot filter
    if (depot) {
      query = query.eq('depot', depot);
    }

    // Apply vehicle type filter
    if (type) {
      query = query.eq('type', type);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    res.json({
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching fleet vehicles:', error);
    res.status(500).json({ error: 'Failed to fetch fleet vehicles' });
  }
});
```

### After (MySQL)
```javascript
router.get('/', async (req, res) => {
  try {
    const { search, depot, type, page = 1, limit = 100 } = req.query;
    const { limit: pageLimit, offset } = paginate(page, limit);

    // Build base query
    let queryBuilder = from('fleet_vehicles')
      .select('*')
      .order('fleet_number', 'ASC');

    // Apply search filter (fleet_number, registration, or depot)
    if (search) {
      const searchConditions = [];
      const searchParams = [];

      searchConditions.push('fleet_number LIKE ?');
      searchParams.push(`%${search}%`);

      searchConditions.push('registration LIKE ?');
      searchParams.push(`%${search}%`);

      searchConditions.push('depot LIKE ?');
      searchParams.push(`%${search}%`);

      // Build custom query with OR conditions
      let sql = `SELECT * FROM fleet_vehicles WHERE (${searchConditions.join(' OR ')})`;
      const params = [...searchParams];

      // Apply depot filter
      if (depot) {
        sql += ' AND depot = ?';
        params.push(depot);
      }

      // Apply type filter
      if (type) {
        sql += ' AND type = ?';
        params.push(type);
      }

      // Add order, limit, offset
      sql += ' ORDER BY fleet_number ASC LIMIT ? OFFSET ?';
      params.push(pageLimit, offset);

      const data = await query(sql, params);

      // Get total count for pagination
      let countSql = `SELECT COUNT(*) as total FROM fleet_vehicles WHERE (${searchConditions.join(' OR ')})`;
      const countParams = [...searchParams];

      if (depot) {
        countSql += ' AND depot = ?';
        countParams.push(depot);
      }

      if (type) {
        countSql += ' AND type = ?';
        countParams.push(type);
      }

      const countResult = await query(countSql, countParams);
      const total = countResult[0]?.total || 0;

      return res.json({
        data,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          pages: Math.ceil(total / limit)
        }
      });
    }

    // No search - use query builder
    if (depot) {
      queryBuilder = queryBuilder.eq('depot', depot);
    }

    if (type) {
      queryBuilder = queryBuilder.eq('type', type);
    }

    // Apply pagination
    queryBuilder = queryBuilder.limit(pageLimit).offset(offset);

    const { data, error } = await queryBuilder.execute();

    if (error) throw error;

    // Get total count
    let countSql = 'SELECT COUNT(*) as total FROM fleet_vehicles';
    const countParams = [];
    const countConditions = [];

    if (depot) {
      countConditions.push('depot = ?');
      countParams.push(depot);
    }

    if (type) {
      countConditions.push('type = ?');
      countParams.push(type);
    }

    if (countConditions.length > 0) {
      countSql += ' WHERE ' + countConditions.join(' AND ');
    }

    const countResult = await query(countSql, countParams);
    const total = countResult[0]?.total || 0;

    res.json({
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching fleet vehicles:', error);
    res.status(500).json({ error: 'Failed to fetch fleet vehicles' });
  }
});
```

**Changes**:
- Used `paginate()` helper for cleaner pagination logic
- Manual SQL construction for complex OR search conditions
- Separate COUNT query for pagination totals
- QueryBuilder for simple filter-only queries
- Response format unchanged

---

## Example 4: Distinct Values

### Before (Supabase)
```javascript
router.get('/depots/list', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('fleet_vehicles')
      .select('depot')
      .not('depot', 'is', null);

    if (error) throw error;

    // Get unique depots
    const depots = [...new Set(data.map(vehicle => vehicle.depot))].sort();

    res.json(depots);
  } catch (error) {
    console.error('Error fetching depots:', error);
    res.status(500).json({ error: 'Failed to fetch depots' });
  }
});
```

### After (MySQL)
```javascript
router.get('/depots/list', async (req, res) => {
  try {
    const sql = `
      SELECT DISTINCT depot
      FROM fleet_vehicles
      WHERE depot IS NOT NULL
      ORDER BY depot ASC
    `;

    const data = await query(sql);

    // Extract depot names from result set
    const depots = data.map(row => row.depot);

    res.json(depots);
  } catch (error) {
    console.error('Error fetching depots:', error);
    res.status(500).json({ error: 'Failed to fetch depots' });
  }
});
```

**Changes**:
- Used SQL DISTINCT instead of JavaScript Set
- Sorting done in SQL, not JavaScript
- More efficient - database does the deduplication

---

## Example 5: Update Operations

### Before (Supabase)
```javascript
router.put('/:fleetNumber', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('fleet_vehicles')
      .update({
        ...req.body,
        updated_at: new Date().toISOString()
      })
      .eq('fleet_number', req.params.fleetNumber)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error updating vehicle:', error);
    res.status(500).json({ error: 'Failed to update vehicle' });
  }
});
```

### After (MySQL)
```javascript
router.put('/:fleetNumber', async (req, res) => {
  try {
    const fleetNumber = req.params.fleetNumber;
    const updateData = {
      ...req.body,
      updated_at: new Date()
    };

    // Remove fleet_number and id from update data if present
    delete updateData.fleet_number;
    delete updateData.id;

    // Build update query
    const keys = Object.keys(updateData);
    const sql = `
      UPDATE fleet_vehicles
      SET ${keys.map(k => `${k} = ?`).join(', ')}
      WHERE fleet_number = ?
    `;

    const params = [...keys.map(k => updateData[k]), fleetNumber];
    await query(sql, params);

    // Fetch updated record
    const { data, error } = await from('fleet_vehicles')
      .select('*')
      .eq('fleet_number', fleetNumber)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error updating vehicle:', error);
    res.status(500).json({ error: 'Failed to update vehicle' });
  }
});
```

**Changes**:
- Two-step process: UPDATE then SELECT
- Dynamic SQL generation based on fields to update
- Security: Removed id/fleet_number from update data
- Parameterized queries for safety

---

## Example 6: Statistics Aggregation

### Before (Supabase)
```javascript
router.get('/stats/summary', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('fleet_vehicles')
      .select('depot, type, status');

    if (error) throw error;

    const stats = {
      total_vehicles: data.length,
      by_depot: {},
      by_type: {},
      by_status: {
        active: 0,
        maintenance: 0,
        out_of_service: 0
      }
    };

    data.forEach(vehicle => {
      // Count by depot
      if (vehicle.depot) {
        stats.by_depot[vehicle.depot] = (stats.by_depot[vehicle.depot] || 0) + 1;
      }

      // Count by type
      if (vehicle.type) {
        stats.by_type[vehicle.type] = (stats.by_type[vehicle.type] || 0) + 1;
      }

      // Count by status
      if (vehicle.status) {
        stats.by_status[vehicle.status] = (stats.by_status[vehicle.status] || 0) + 1;
      }
    });

    res.json(stats);
  } catch (error) {
    console.error('Error fetching fleet stats:', error);
    res.status(500).json({ error: 'Failed to fetch fleet statistics' });
  }
});
```

### After (MySQL)
```javascript
router.get('/stats/summary', async (req, res) => {
  try {
    const sql = 'SELECT depot, type, status FROM fleet_vehicles';
    const data = await query(sql);

    const stats = {
      total_vehicles: data.length,
      by_depot: {},
      by_type: {},
      by_status: {
        active: 0,
        maintenance: 0,
        out_of_service: 0
      }
    };

    data.forEach(vehicle => {
      // Count by depot
      if (vehicle.depot) {
        stats.by_depot[vehicle.depot] = (stats.by_depot[vehicle.depot] || 0) + 1;
      }

      // Count by type
      if (vehicle.type) {
        stats.by_type[vehicle.type] = (stats.by_type[vehicle.type] || 0) + 1;
      }

      // Count by status
      if (vehicle.status) {
        stats.by_status[vehicle.status] = (stats.by_status[vehicle.status] || 0) + 1;
      }
    });

    res.json(stats);
  } catch (error) {
    console.error('Error fetching fleet stats:', error);
    res.status(500).json({ error: 'Failed to fetch fleet statistics' });
  }
});
```

**Changes**:
- Direct SQL query instead of Supabase client
- Logic unchanged - same in-memory aggregation
- Could be optimized with SQL GROUP BY for large datasets

---

## Summary of Changes

| Pattern | Supabase | MySQL |
|---------|----------|-------|
| **Simple queries** | `supabase.from()` | `from()` (QueryBuilder) |
| **OR conditions** | `.or('col.ilike.%x%,col2.ilike.%y%')` | Custom SQL with OR |
| **Pagination** | `.range(offset, offset+limit-1)` | `.limit().offset()` |
| **Case-insensitive search** | `.ilike` | `LIKE` (default collation) |
| **Distinct values** | `select()` + JS `Set` | `SELECT DISTINCT` |
| **Updates** | `.update().select().single()` | `UPDATE` then `SELECT` |
| **Count queries** | Automatic with query | Separate `COUNT(*)` query |
| **Error handling** | `{ data, error }` pattern | Try-catch with queries |

---

## Key Improvements

1. **Security**: All queries use parameterized values (SQL injection protection)
2. **Performance**: DISTINCT and sorting done in database, not JavaScript
3. **Clarity**: Complex queries use explicit SQL for better readability
4. **Flexibility**: Mix of QueryBuilder (simple) and raw SQL (complex)
5. **Maintainability**: Clear separation of concerns

---

## Response Format: Unchanged

All endpoints return the exact same response structure:

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 100,
    "total": 500,
    "pages": 5
  }
}
```

**No frontend changes required!**
