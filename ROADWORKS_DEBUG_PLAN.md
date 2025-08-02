# Roadworks API 400 Error - Debugging Steps

## 🔍 Diagnosis Process

The 400 errors are happening when calling the Supabase API. Let's debug step by step:

### 1. Test Basic Connection
```bash
curl https://go-barry.onrender.com/api/roadworks/test-connection
```

### 2. Test Different Filters
```bash
curl https://go-barry.onrender.com/api/roadworks/test-filters
```

This will test:
- No filters
- Single date filter
- State filter
- Combined filters

### 3. Check Raw Data
```bash
curl https://go-barry.onrender.com/api/roadworks/debug-raw
```

## 🛠️ Changes Made

1. **Removed compound date filter** that was causing 400 errors
2. **Temporarily removed order parameter** to test if it's causing issues
3. **Added better error logging** to show request details
4. **Created test endpoints** to isolate the problem

## 📝 Possible Causes of 400 Error

1. **Invalid filter syntax** - Supabase might not support certain filter formats
2. **Column doesn't exist** - The column name might be wrong
3. **Authentication issue** - API key might be invalid or missing permissions
4. **Table permissions** - The table might not be accessible with the anon key

## 🚀 Deploy & Test

```bash
git add -A
git commit -m "Fix: Debug 400 errors - remove problematic filters and add test endpoints"
git push
```

After deployment, run the test endpoints in order to identify which specific parameter is causing the 400 error.

## 🎯 Expected Outcome

Once we identify the problematic parameter through the test endpoints, we can:
1. Fix the specific issue
2. Re-enable any disabled features that work
3. Get roadworks loading again

The most likely culprit is the date filter format or the order parameter syntax.
