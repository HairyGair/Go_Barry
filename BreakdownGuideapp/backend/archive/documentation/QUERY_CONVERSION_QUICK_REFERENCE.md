# Query Conversion Quick Reference

**For:** Breakdowns Routes Migration (Supabase → MySQL)
**Date:** October 16, 2025

---

## Import Statement

```javascript
// OLD
import { supabase } from '../server.js';

// NEW
import { from, query, insert, update } from '../utils/queryHelpers.js';
```

---

## SELECT Queries

### Simple Select All
```javascript
// OLD
const { data, error } = await supabase
  .from('breakdowns')
  .select('*');

// NEW
const { data, error } = await from('breakdowns')
  .select('*')
  .execute();
```

### Select Specific Columns
```javascript
// OLD
const { data, error } = await supabase
  .from('breakdowns')
  .select('breakdown_id, fleet_no, status');

// NEW
const { data, error } = await from('breakdowns')
  .select('breakdown_id, fleet_no, status')
  .execute();
```

### Select Single Row
```javascript
// OLD
const { data, error } = await supabase
  .from('breakdowns')
  .select('*')
  .eq('breakdown_id', id)
  .single();

// NEW
const { data, error } = await from('breakdowns')
  .select('*')
  .eq('breakdown_id', id)
  .single();
```

---

## WHERE Clauses

### Equality (eq)
```javascript
// OLD
.eq('status', 'active')

// NEW
.eq('status', 'active')  // Same!
```

### Not Equal (neq)
```javascript
// OLD
.neq('status', 'resolved')

// NEW
.neq('status', 'resolved')  // Same!
```

### Greater Than (gt, gte)
```javascript
// OLD
.gte('created_at', startDate)

// NEW
.gte('created_at', startDate)  // Same!
```

### IN Clause
```javascript
// OLD
.in('status', ['active', 'pending', 'in_progress'])

// NEW
.in('status', ['active', 'pending', 'in_progress'])  // Same!
```

### LIKE Pattern
```javascript
// OLD
.like('fleet_no', '%6333%')

// NEW
.like('fleet_no', '%6333%')  // Same!
```

### IS NULL
```javascript
// OLD
.is('resolved_at', null)

// NEW
.isNull('resolved_at')
```

### IS NOT NULL
```javascript
// OLD
.not('resolved_at', 'is', null)

// NEW
.notNull('resolved_at')
```

---

## ORDER BY

```javascript
// OLD
.order('created_at', { ascending: false })

// NEW
.order('created_at', 'DESC')  // or 'ASC'
```

---

## LIMIT and OFFSET

### Limit
```javascript
// OLD
.limit(50)

// NEW
.limit(50)  // Same!
```

### Range (Pagination)
```javascript
// OLD
.range(0, 49)  // First 50 records

// NEW
.limit(50).offset(0)
```

### Offset
```javascript
// OLD
// Not directly supported, use range

// NEW
.offset(100)
```

---

## INSERT Queries

### Insert Single Record
```javascript
// OLD
const { data, error } = await supabase
  .from('breakdowns')
  .insert(breakdownData)
  .select()
  .single();

// NEW
const insertResult = await insert('breakdowns', breakdownData);

// Then fetch the inserted record
const { data, error } = await from('breakdowns')
  .select('*')
  .eq('id', insertResult.insertId)
  .single();
```

### Insert with Auto-increment ID
```javascript
// NEW pattern includes insertId
const insertResult = await insert('breakdowns', {
  breakdown_id: 'BD-2025-00123',
  fleet_no: '6333',
  status: 'active'
});

console.log('Inserted ID:', insertResult.insertId);
```

---

## UPDATE Queries

### Update Single Record
```javascript
// OLD
const { data, error } = await supabase
  .from('breakdowns')
  .update({ status: 'resolved' })
  .eq('breakdown_id', id)
  .select()
  .single();

// NEW (two-step pattern)
await update('breakdowns', { breakdown_id: id }, {
  status: 'resolved',
  updated_at: new Date().toISOString()
});

const { data, error } = await from('breakdowns')
  .select('*')
  .eq('breakdown_id', id)
  .single();
```

### Update Multiple Fields
```javascript
// NEW
await update('breakdowns', { breakdown_id }, {
  status: 'cleared',
  resolved_at: new Date().toISOString(),
  resolved_by: username,
  resolution_notes: notes
});
```

---

## DELETE Queries

### Delete Record
```javascript
// OLD
const { error } = await supabase
  .from('breakdowns')
  .delete()
  .eq('breakdown_id', id);

// NEW
import { remove } from '../utils/queryHelpers.js';

await remove('breakdowns', { breakdown_id: id });
```

---

## COUNT Queries

### Count All Records
```javascript
// OLD
const { count, error } = await supabase
  .from('breakdowns')
  .select('*', { count: 'exact', head: true })
  .eq('status', 'active');

// NEW
const countSQL = 'SELECT COUNT(*) as count FROM breakdowns WHERE status = ?';
const result = await query(countSQL, ['active']);
const count = result[0]?.count || 0;
```

### Count with Multiple Conditions
```javascript
// NEW
const countSQL = `
  SELECT COUNT(*) as count FROM breakdowns
  WHERE status = ? AND depot = ? AND created_at >= ?
`;
const result = await query(countSQL, ['active', 'SDC', startDate]);
const count = result[0]?.count || 0;
```

---

## Complex Queries (Raw SQL)

### JOINs
```javascript
// NEW - Use raw SQL for JOINs
const sql = `
  SELECT
    b.*,
    e.event_type,
    e.event_data
  FROM breakdowns b
  LEFT JOIN breakdown_events e ON b.id = e.breakdown_id
  WHERE b.breakdown_id = ?
  ORDER BY e.created_at DESC
`;
const results = await query(sql, [breakdown_id]);
```

### Aggregations
```javascript
// NEW
const sql = `
  SELECT
    depot,
    COUNT(*) as total,
    SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved,
    AVG(TIMESTAMPDIFF(MINUTE, created_at, resolved_at)) as avg_resolution_time
  FROM breakdowns
  WHERE created_at >= ?
  GROUP BY depot
`;
const stats = await query(sql, [startDate]);
```

---

## JSON Fields

### Writing JSON
```javascript
// OLD
wizard_assessment_data: {
  route: 'X21',
  priority: 1
}

// NEW - Explicit JSON.stringify()
wizard_assessment_data: JSON.stringify({
  route: 'X21',
  priority: 1
})
```

### Reading JSON
```javascript
// Query helpers automatically parse JSON fields
const { data } = await from('breakdowns').select('*').eq('id', id).single();

// data.wizard_assessment_data is already a JavaScript object
console.log(data.wizard_assessment_data.route);  // 'X21'
```

### Updating JSON Fields
```javascript
// NEW
await update('breakdowns', { breakdown_id }, {
  wizard_assessment_data: JSON.stringify(updatedData)
});
```

---

## Error Handling

### Supabase-style Errors (Preserved)
```javascript
// Query helpers return { data, error } just like Supabase
const { data, error } = await from('breakdowns').select('*').execute();

if (error) {
  console.error('Query failed:', error.message);
  return res.status(500).json({ error: 'Database error' });
}

// Use data
res.json(data);
```

---

## Transactions

### Multi-step Operations
```javascript
// NEW
import { transaction } from '../utils/queryHelpers.js';

await transaction(async (conn) => {
  // Step 1: Update breakdown
  await conn.execute(
    'UPDATE breakdowns SET status = ? WHERE breakdown_id = ?',
    ['resolved', breakdown_id]
  );

  // Step 2: Create event
  await conn.execute(
    'INSERT INTO breakdown_events (breakdown_id, event_type, event_data) VALUES (?, ?, ?)',
    [breakdown_id, 'resolved', JSON.stringify(eventData)]
  );
});
```

---

## Common Patterns

### Find or Create
```javascript
// NEW
// Check if exists
const { data: existing } = await from('breakdowns')
  .select('*')
  .eq('breakdown_id', id)
  .single();

if (!existing) {
  // Create new
  await insert('breakdowns', newData);
}
```

### Soft Delete (Update Status)
```javascript
// NEW
await update('breakdowns', { breakdown_id }, {
  status: 'deleted',
  deleted_at: new Date().toISOString()
});
```

### Pagination Helper
```javascript
// NEW
import { paginate } from '../utils/queryHelpers.js';

const page = parseInt(req.query.page) || 1;
const pageSize = parseInt(req.query.limit) || 50;

const { limit, offset } = paginate(page, pageSize);

const { data } = await from('breakdowns')
  .select('*')
  .limit(limit)
  .offset(offset)
  .execute();
```

---

## Complete Migration Example

### Before (Supabase)
```javascript
router.post('/acknowledge', async (req, res) => {
  const { breakdown_id, notes } = req.body;

  const { data, error } = await supabase
    .from('breakdowns')
    .update({
      acknowledged_at: new Date().toISOString(),
      sdc_notes: notes,
      status: 'acknowledged'
    })
    .eq('breakdown_id', breakdown_id)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});
```

### After (MySQL)
```javascript
router.post('/acknowledge', async (req, res) => {
  const { breakdown_id, notes } = req.body;

  await update('breakdowns', { breakdown_id }, {
    acknowledged_at: new Date().toISOString(),
    sdc_notes: notes,
    status: 'acknowledged'
  });

  const { data, error } = await from('breakdowns')
    .select('*')
    .eq('breakdown_id', breakdown_id)
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});
```

---

## Tips & Best Practices

1. **Always call `.execute()`** on query builders (except `.single()`)
2. **Use parameterized queries** to prevent SQL injection
3. **JSON fields require explicit stringify** on writes
4. **Updates are split** into update + fetch pattern
5. **Check for errors** after every database operation
6. **Use raw SQL** for complex queries (JOINs, aggregations)
7. **Import only what you need** from queryHelpers

---

**Quick Reference Version:** 1.0
**Last Updated:** October 16, 2025
