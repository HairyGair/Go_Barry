# Roadworks API Timeout Issue - Debug Plan

## 🚨 Issue
The API is timing out when trying to connect to Supabase, even with the simplest query.

## 🔍 Debug Steps Added

### 1. Check Environment Variables
```bash
curl https://go-barry.onrender.com/api/roadworks/check-env
```
This will show if Supabase URL and API key are properly set in Render.

### 2. Test with Native Fetch
```bash
curl https://go-barry.onrender.com/api/roadworks/test-fetch
```
Tests with Node.js native fetch instead of axios (3-second timeout).

### 3. Simple Axios Test
```bash
curl https://go-barry.onrender.com/api/roadworks/simple-test
```
Basic axios test with 5-second timeout.

## 🚀 Deploy & Test

```bash
git add -A
git commit -m "Debug: Add timeout diagnostics and fetch alternative"
git push
```

## 📊 Possible Causes

1. **Missing/Wrong Supabase Credentials**
   - Check if SUPABASE_URL and SUPABASE_ANON_KEY are set in Render
   - Verify they match your Supabase project

2. **Network/Firewall Issue**
   - Render might be blocked from accessing Supabase
   - Supabase might be down or unreachable

3. **Wrong URL Format**
   - The Supabase URL might be malformed
   - Should be: `https://[project-id].supabase.co`

4. **API Key Issues**
   - The anon key might be invalid or revoked
   - Should start with `eyJ` (JWT token)

## 🎯 Next Steps

1. Run `check-env` first to verify credentials exist
2. If credentials exist, check if they're correct in your Supabase dashboard
3. Try the `test-fetch` endpoint to see if it's an axios-specific issue
4. Check Supabase dashboard for any service issues

The timeout strongly suggests either missing credentials or a network connectivity issue between Render and Supabase.
