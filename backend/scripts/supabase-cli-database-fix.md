# Supabase CLI Database Bloat Fix

## Supabase CLI is now installed! Let's use it to fix the database bloat.

### Step 1: Login to Supabase CLI

You'll need to authenticate with your Supabase account:

```bash
supabase login
```

This will open a browser window for you to authorize the CLI.

### Step 2: Find Your Project Reference ID

1. Go to your Supabase dashboard
2. Look for your project ID (usually in the URL or settings)
3. It looks like: `abcdefghijklmnop` (16 characters)

### Step 3: Link Your Project

```bash
supabase link --project-ref YOUR_PROJECT_ID
```

Replace `YOUR_PROJECT_ID` with your actual project reference.

### Step 4: Inspect Database Bloat

```bash
supabase db inspect db-bloat --linked
```

This should show you detailed information about what's causing the bloat.

### Step 5: Try Database Reset (Nuclear Option)

If the bloat inspection shows the issue, you can reset the database:

```bash
# First, dump current data
supabase db dump --linked > go-barry-backup-$(date +%Y%m%d).sql

# Reset the database (this clears all bloat)
supabase db reset --linked

# Restore your essential data from our previous backup
```

### Step 6: Alternative - Manual VACUUM via CLI

The CLI might allow direct PostgreSQL commands:

```bash
supabase db shell --linked
```

Then in the PostgreSQL shell:
```sql
VACUUM FULL;
\q
```

## What Each Command Does:

- **`supabase login`**: Authenticates you with Supabase
- **`supabase link`**: Connects CLI to your specific project  
- **`db inspect db-bloat`**: Shows detailed bloat analysis
- **`db reset`**: Completely resets database (removes all bloat)
- **`db shell`**: Opens direct PostgreSQL connection (bypass SQL Editor)

## Expected Results:

If successful, your database should go from 510MB to <50MB and automatically unpause.

## Next Steps:

Run the first command to get started:
```bash
supabase login
```

Let me know what happens!