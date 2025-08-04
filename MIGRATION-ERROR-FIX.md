## PostgreSQL Migration Error Fixed! ✅

The error was caused by PostgreSQL not supporting `WHERE` clauses in `CONSTRAINT` definitions. 

### The Problem:
```sql
-- This doesn't work in PostgreSQL:
CONSTRAINT unique_active_alert UNIQUE (alert_id, alert_type) WHERE status IN ('Active', 'Reactivated')
```

### The Solution:
Use a partial unique index instead:
```sql
-- This works:
CREATE UNIQUE INDEX idx_unique_active_alert ON disruptions(alert_id, alert_type) 
WHERE status IN ('Active', 'Reactivated');
```

### What This Does:
- Prevents duplicate active/reactivated alerts (same alert can't be active twice)
- Allows multiple ended/completed records for the same alert (for history)
- Achieves the same goal with proper PostgreSQL syntax

### Fixed Migration Files:
1. `/backend/migrations/create-disruptions-table.sql` - Original file updated
2. `/backend/migrations/create-disruptions-table-FIXED.sql` - Clean copy ready to run

### To Run the Migration:
1. Copy the contents of either fixed migration file
2. Paste into Supabase SQL Editor
3. Click "Run"
4. Should complete without errors

The fixed migration creates:
- `disruptions` table with all columns
- `disruption_audit_log` table for tracking
- `active_disruptions` view for easy querying
- All necessary indexes for performance
- Functions for reactivation and logging
- RLS policies for security
