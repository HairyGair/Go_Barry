# Database Migration Guide

## Setting up Supabase Database

### 1. Create a new Supabase project
Go to https://supabase.com and create a new project.

### 2. Run the schema
1. Go to the SQL Editor in your Supabase dashboard
2. Copy the contents of `schema.sql`
3. Run the SQL to create all tables, indexes, and functions

### 3. Get your connection details
From your Supabase project settings, get:
- `SUPABASE_URL` - Your project URL
- `SUPABASE_ANON_KEY` - Your anon/public key
- `SUPABASE_SERVICE_KEY` - Your service key (for admin operations)

### 4. Configure environment variables
Copy `.env.example` to `.env` in the backend folder and fill in your Supabase credentials.

### 5. Enable Realtime (optional)
If you want real-time updates:
1. Go to Database → Replication in Supabase
2. Enable replication for tables: `breakdowns`, `breakdown_events`

### 6. Set up Storage buckets (for photos)
1. Go to Storage in Supabase
2. Create a bucket called `breakdown-photos`
3. Set it to public or configure RLS as needed

## Future Migrations
Place numbered SQL files here for version control:
- `001_initial_schema.sql`
- `002_add_feature_x.sql`
- etc.
