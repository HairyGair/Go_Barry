# Roadworks API Fix - 400 Error Resolution

## 🚨 Issue Identified
The API was returning 400 (Bad Request) errors due to:
- Compound date filters not supported by Supabase in the format used
- The filter `'sm_start_date': 'gte.${dateFrom},lte.${dateTo}'` was invalid

## ✅ Fix Applied
Removed the problematic date filter from the main `/api/roadworks/unified` endpoint.

## 🧪 Quick Test

Test if the basic connection works:
```bash
curl https://go-barry.onrender.com/api/roadworks/test-connection
```

Test if roadworks load now:
```bash
curl "https://go-barry.onrender.com/api/roadworks/unified" | jq '.metadata'
```

## ⚠️ Potential Issues with This Week Endpoint

The `/api/roadworks/this-week` endpoint may also have issues as it uses:
```javascript
'sm_start_date': `lte.${endOfWeek.toISOString()}`,
'sm_end_date': `gte.${startOfWeek.toISOString()}`,
```

If this also fails, we may need to:
1. Fetch all roadworks without date filters
2. Filter in JavaScript after fetching

## 🚀 Deploy the Fix

```bash
git add -A
git commit -m "Fix: Remove compound date filter causing 400 errors"
git push
```

## 📊 Expected Result
- Roadworks should now load successfully
- You'll get up to 2000 roadworks ordered by start date (ascending)
- Current/near-term roadworks will appear first

## 🔍 If Still Not Working

Check these debug endpoints:
```bash
# Check basic connection
curl https://go-barry.onrender.com/api/roadworks/test-connection

# Check raw data without processing
curl https://go-barry.onrender.com/api/roadworks/debug-raw

# Check environment variables
curl https://go-barry.onrender.com/api/roadworks/env-check
```

The main issue was the date filter format. With it removed, the API should work again.
