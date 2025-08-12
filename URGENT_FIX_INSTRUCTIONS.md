## 🚨 **IMMEDIATE ACTION REQUIRED**

The breakdown tracking system is **fully deployed** but the **database tables are missing**.

## ✅ **Quick Fix (2 minutes)**

### **Option 1: Use Supabase Dashboard**

1. **Open Supabase**: https://app.supabase.com
2. **Select your project** (the one connected to Go BARRY)
3. **Click "SQL Editor"** (left sidebar)
4. **Click "New Query"**
5. **Copy & Paste this minimal migration:**

```sql
-- Quick Migration for Breakdown Tracking
CREATE TABLE IF NOT EXISTS breakdowns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  breakdown_id VARCHAR(20),
  daily_id INTEGER,
  fleet_no VARCHAR(20),
  supervisor_badge VARCHAR(10),
  supervisor_name VARCHAR(100),
  depot_id VARCHAR(50),
  location TEXT,
  wizard_type VARCHAR(50),
  status VARCHAR(20) DEFAULT 'received',
  severity VARCHAR(20),
  diagnosis TEXT,
  diagnosed_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  wizard_steps JSONB DEFAULT '[]',
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Grant permissions
GRANT ALL ON breakdowns TO anon, authenticated;

-- Test insert
INSERT INTO breakdowns (breakdown_id, fleet_no, supervisor_badge) 
VALUES ('TEST-001', 'TEST', 'TEST');

SELECT 'Tables created successfully!' as status;
```

6. **Click "RUN"** (or press Ctrl/Cmd + Enter)
7. **You should see**: "Tables created successfully!"

### **Option 2: Check Render Environment Variables**

If tables exist but still failing, check Render.com:

1. Go to https://dashboard.render.com
2. Select "go-barry" service
3. Click "Environment" tab
4. Verify these exist:
   - `SUPABASE_URL` = Your Supabase project URL
   - `SUPABASE_ANON_KEY` = Your Supabase anon key

### **Option 3: Get Supabase Credentials**

If missing, get them from Supabase:
1. Go to Supabase Dashboard
2. Click "Settings" → "API"
3. Copy:
   - **Project URL** → Set as `SUPABASE_URL` in Render
   - **anon public key** → Set as `SUPABASE_ANON_KEY` in Render
4. Save and redeploy

## 🧪 **Test After Fix**

```bash
# Run this to verify it's working:
curl -X POST https://go-barry.onrender.com/api/breakdowns/start \
  -H "Content-Type: application/json" \
  -d '{"fleet_number":"TEST","supervisor_badge":"AG003","supervisor_name":"Test","location":"Test","depot_id":"Test","wizard_type":"test"}'
```

You should see:
```json
{"success":true,"breakdown_id":"BD-2025-00001","daily_id":1}
```

## 📊 **Status Check**

| Component | Status | Action Needed |
|-----------|--------|--------------|
| Backend Code | ✅ Deployed | None |
| API Routes | ✅ Active | None |
| Frontend | ✅ Ready | None |
| Database Tables | ❌ Missing | **Run migration above** |
| Supabase Connection | ❓ Check | **Verify env vars if migration fails** |

## 🎯 **The system is 99% complete - just needs the database tables!**