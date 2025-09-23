# Database Migration Instructions

## Issue: Missing issue_category Column

The `breakdowns` table is missing the `issue_category` column which is required for the wizard-to-breakdown integration to work properly.

## Error Message
```
"Could not find the 'issue_category' column of 'breakdowns' in the schema cache"
"record "new" has no field "issue_category""
```

## Solution: Manual Column Addition

Since we cannot execute DDL commands through the Supabase client with the current permissions, you need to add the column manually.

### Step 1: Access Supabase Dashboard
1. Go to: https://supabase.com/dashboard/project/oieliubbvvdzhzvikzal
2. Sign in with your Supabase account

### Step 2: Navigate to SQL Editor
1. In the left sidebar, click on "SQL Editor"
2. Click "New Query" or use the existing query editor

### Step 3: Execute Migration SQL
Copy and paste this SQL into the editor:

```sql
-- Add issue_category column to breakdowns table
ALTER TABLE breakdowns ADD COLUMN IF NOT EXISTS issue_category VARCHAR(100);

-- Add a comment to document the column purpose
COMMENT ON COLUMN breakdowns.issue_category IS 'Category of the breakdown issue from SDC wizard assessment (e.g., Steering System, Braking System, Electrical System, Engine Issues, General Assessment)';

-- Verify the column was added
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'breakdowns' AND column_name = 'issue_category';
```

### Step 4: Execute the Query
1. Click the "Run" button (or press Ctrl+Enter)
2. You should see a success message
3. The verification query should return one row showing the new column

### Alternative Method: Table Editor
If you prefer a GUI approach:

1. Go to: Database > Tables > breakdowns
2. Click "Add Column"
3. Fill in:
   - **Name**: `issue_category`
   - **Type**: `varchar`
   - **Length**: `100`
   - **Nullable**: ✅ (checked)
   - **Default**: (leave empty)
4. Click "Save"

## Expected Values for issue_category

The column will store values like:
- "Steering System"
- "Braking System"
- "Electrical System"
- "Engine Issues"
- "General Assessment"
- "Transmission System"
- "Cooling System"
- "Fuel System"

## Testing After Migration

After adding the column, run the test script:
```bash
cd /Users/anthony/Go\ BARRY\ App/BreakdownGuideapp/backend
node test_wizard_integration.js
```

This will verify that:
1. The column exists
2. The wizard-to-breakdown API endpoint works
3. Records can be created and retrieved

## Files Created for This Migration

- `add_issue_category_migration.sql` - Migration SQL
- `execute_migration.js` - Column existence verification
- `test_wizard_integration.js` - Post-migration testing
- `DATABASE_MIGRATION_INSTRUCTIONS.md` - This instruction file