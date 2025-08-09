# Breakdown Logging - Quick Fix Guide

## Current Issue
The routes are working but returning: `{"success":false,"error":"No API key found in request"}`

## Solution

### 1. Check your environment variables:
```bash
node test-breakdown-env.js
```

### 2. If Supabase is not configured:

**Edit your `.env` file** (not `.env.example`) and add:
```env
SUPABASE_URL=your-supabase-project-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**To find these values:**
1. Go to your Supabase dashboard
2. Click on "Settings" → "API"
3. Copy:
   - `Project URL` → paste as `SUPABASE_URL`
   - `service_role` key (under Project API keys) → paste as `SUPABASE_SERVICE_ROLE_KEY`

### 3. Restart the server:
```bash
# Stop with Ctrl+C, then:
npm start
```

### 4. Create the database table:
If you haven't already, run the SQL from `backend/sql/breakdowns_schema.sql` in your Supabase SQL Editor.

### 5. Test again:
```bash
node test-breakdown-logging.js
```

## Quick Test
Once configured, this should work:
```bash
curl http://localhost:3001/api/admin-breakdowns
```

Expected response: `{"success":true,"logs":[],"pagination":{...}}`

## Common Issues

**Still getting "No API key found"?**
- Make sure you saved the `.env` file
- Check that the `.env` file is in the `backend` directory
- Verify the environment variable names match exactly

**Getting "relation does not exist"?**
- The database table hasn't been created yet
- Run the SQL schema in Supabase

**Server won't start?**
- Run `npm install` to ensure `uuid` package is installed
