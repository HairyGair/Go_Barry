# Supabase CLI Vacuum Operations

## Based on the Supabase documentation you found:

### Option 1: Install Supabase CLI and try VACUUM commands

1. **Install Supabase CLI:**
```bash
npm install -g supabase
```

2. **Login to Supabase:**
```bash
supabase login
```

3. **Link to your project:**
```bash
supabase link --project-ref [YOUR_PROJECT_ID]
```

4. **Try running VACUUM via CLI:**
```bash
supabase db inspect db-bloat --linked
```

5. **Manual vacuum operation:**
```bash
supabase db reset --linked
# OR
supabase db vacuum --linked
```

### Option 2: Use the SQL Editor with VACUUM FULL syntax

Based on the documentation, try this in SQL Editor:

```sql
VACUUM (FULL, ANALYZE) roadworks;
VACUUM (FULL, ANALYZE) supervisors;
VACUUM (FULL, ANALYZE) supervisor_sessions;
VACUUM (FULL, ANALYZE) message_templates;
```

### Option 3: Database Reset via CLI

If VACUUM doesn't work, the CLI allows database reset:

```bash
# Backup first
supabase db dump --linked > backup.sql

# Reset database (this will clear bloat)
supabase db reset --linked

# Restore your data
supabase db push --linked
```