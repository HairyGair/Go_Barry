# Supabase Database Status & Maintenance Guide

## 🗄️ Database Overview

**Project**: Go North East Breakdown Guide  
**Supabase URL**: `https://oieliubbvvdzhzvikzal.supabase.co`  
**Environment**: Production Ready  
**Last Analysis**: January 2025

---

## 📊 Current Database Schema

### Core Tables

#### 1. **supervisors** 
Primary authentication and user management table
```sql
- id: UUID (Primary Key)
- email: TEXT UNIQUE NOT NULL
- name: TEXT NOT NULL
- depot: TEXT DEFAULT 'Washington'
- role: TEXT CHECK (admin|supervisor|manager) DEFAULT 'supervisor'
- badge_number: TEXT
- is_active: BOOLEAN DEFAULT true
- pending_approval: BOOLEAN DEFAULT false
- signup_date: TIMESTAMPTZ
- approved_date: TIMESTAMPTZ
- auth_user_id: UUID
- created_at: TIMESTAMPTZ DEFAULT NOW()
- updated_at: TIMESTAMPTZ DEFAULT NOW()
```

**Key Users**:
- `anthony.gair@gonortheast.co.uk` (Admin - AG003)
- `lee.mutch@gonortheast.co.uk` (Admin - LM001)
- `joshua.devlin@gonortheast.co.uk` (Supervisor - JD002)
- `test@test.com` (Test User - TEST01)

#### 2. **breakdowns**
Main breakdown incident tracking table
```sql
- id: UUID (Primary Key)
- fleet_no: TEXT NOT NULL
- supervisor_id: TEXT
- supervisor_email: TEXT
- supervisor_name: TEXT
- wizard_type: TEXT
- status: TEXT DEFAULT 'active'
- location_lat: DECIMAL
- location_lng: DECIMAL
- location_address: TEXT
- assessment_data: JSONB
- created_at: TIMESTAMPTZ DEFAULT NOW()
- updated_at: TIMESTAMPTZ DEFAULT NOW()
- completed_at: TIMESTAMPTZ
```

#### 3. **wizard_progress**
Assessment progress tracking
```sql
- id: UUID (Primary Key)
- supervisor_id: TEXT
- supervisor_email: TEXT
- wizard_type: TEXT NOT NULL
- current_step: INTEGER DEFAULT 0
- total_steps: INTEGER
- progress_data: JSONB
- status: TEXT DEFAULT 'in_progress'
- created_at: TIMESTAMPTZ DEFAULT NOW()
- updated_at: TIMESTAMPTZ DEFAULT NOW()
```

#### 4. **fleet_vehicles**
Vehicle fleet information
```sql
- id: UUID (Primary Key)
- fleet_no: TEXT UNIQUE NOT NULL
- vehicle_type: TEXT
- depot: TEXT
- make: TEXT
- model: TEXT
- year: INTEGER
- registration: TEXT
- is_active: BOOLEAN DEFAULT true
- created_at: TIMESTAMPTZ DEFAULT NOW()
- updated_at: TIMESTAMPTZ DEFAULT NOW()
```

---

## 🔐 Security Configuration

### Row Level Security (RLS)
✅ **ENABLED** on all tables

### Current Policies

#### Supervisors Table
- `"Supervisors can view all active supervisors"` - SELECT policy
- `"Allow signup for new supervisors"` - INSERT policy  
- `"Only admins can approve/update supervisors"` - UPDATE policy

#### Breakdowns Table
- `"Users can view their own breakdowns"` - SELECT policy
- `"Users can create breakdowns"` - INSERT policy
- `"Users can update their own breakdowns"` - UPDATE policy

### Authentication
- **Email/Password**: ✅ Enabled
- **Auto-confirm**: ✅ Disabled (requires email confirmation)
- **Session persistence**: ✅ Enabled
- **Auto token refresh**: ✅ Enabled

---

## 📈 Performance Optimization

### Indexes Created
```sql
- idx_supervisors_email ON supervisors(email)
- idx_breakdowns_supervisor_email ON breakdowns(supervisor_email)
- idx_breakdowns_created_at ON breakdowns(created_at DESC)
- idx_wizard_progress_supervisor ON wizard_progress(supervisor_email)
- idx_fleet_vehicles_fleet_no ON fleet_vehicles(fleet_no)
- idx_supervisors_pending_approval ON supervisors(pending_approval)
```

---

## 🔧 Integration Points

### Frontend Integration
- **Client**: `@supabase/supabase-js v2.38.4`
- **Auth Service**: `frontend/src/services/supabase-client.js`
- **Error Handling**: Comprehensive retry logic with exponential backoff
- **Session Management**: Auto-refresh with 5-minute early refresh
- **Network Monitoring**: Online/offline detection

### Backend Integration
- **Server**: Node.js with `@supabase/supabase-js v2.38.4`
- **Auth Routes**: `backend/routes/auth.js`
- **Middleware**: `backend/middleware/authMiddleware.js`
- **API Endpoints**: All CRUD operations with Supabase integration

---

## ⚠️ Maintenance Tasks & Alerts

### 🟢 Status: Healthy
✅ All tables created and configured  
✅ RLS policies active  
✅ Authentication working  
✅ Indexes optimized  
✅ Error handling implemented  

### 🟡 Attention Needed

#### 1. **User Management**
- **When**: Adding new supervisors
- **Action**: Create user in Supabase Auth, then add to supervisors table
- **Command**: Use test page or admin interface

#### 2. **Fleet Data Population**
- **Status**: `fleet_vehicles` table exists but may need data
- **Action**: Import current fleet data
- **Priority**: Medium

#### 3. **Database Cleanup**
- **When**: Monthly
- **Action**: Clean up completed breakdowns older than 6 months
- **Query**: 
```sql
DELETE FROM breakdowns 
WHERE status = 'completed' 
AND completed_at < NOW() - INTERVAL '6 months';
```

### 🔴 Critical Alerts

#### 1. **Authentication Token Expiry**
- **Monitor**: Session refresh failures
- **Location**: Browser console, `supabase-client.js:318-340`
- **Action**: Check Supabase project status, verify environment variables

#### 2. **RLS Policy Conflicts**
- **Symptoms**: Permission denied errors
- **Monitor**: API error logs showing `permission denied for table`
- **Action**: Review and update RLS policies

#### 3. **Database Connection Issues**
- **Monitor**: Network errors, timeout errors
- **Location**: All Supabase operations
- **Action**: Check Supabase status page, verify network connectivity

---

## 🚀 Deployment Checklist

### Before Deployment
- [ ] Verify Supabase project is active
- [ ] Check environment variables are set
- [ ] Confirm RLS policies are active
- [ ] Test authentication flow
- [ ] Verify database schema is up to date

### After Deployment
- [ ] Test user login/logout
- [ ] Verify breakdown creation
- [ ] Check real-time updates
- [ ] Monitor error logs
- [ ] Confirm data persistence

---

## 📞 When to Prompt for Action

### 🚨 **IMMEDIATE ACTION REQUIRED**
Prompt me when you see:
1. **Authentication failures** across multiple users
2. **Database connection timeouts** (>30 seconds)
3. **RLS policy violations** preventing normal operation
4. **Token refresh failures** causing session loss
5. **Supabase project quota exceeded** warnings

### ⚡ **URGENT ACTION NEEDED**
Prompt me when:
1. **New supervisor signup** requires approval
2. **Fleet data import** is needed for vehicle lookups
3. **Database performance degradation** (slow queries >5 seconds)
4. **Backup/restore operations** needed
5. **Schema changes** required for new features

### 📅 **SCHEDULED MAINTENANCE**
Prompt me for:
1. **Monthly cleanup** of old breakdown records
2. **Quarterly user audit** (inactive users, role changes)
3. **Annual security review** (password policies, access patterns)
4. **Performance analysis** (query optimization, index usage)

---

## 🛠️ Quick Actions

### Add New Supervisor
```javascript
// 1. Create in Supabase Auth (use admin panel or test page)
// 2. Add to supervisors table
await supabase.from('supervisors').insert({
  email: 'new.supervisor@gonortheast.co.uk',
  name: 'New Supervisor',
  depot: 'Washington',
  role: 'supervisor',
  badge_number: 'NS001',
  is_active: true
});
```

### Emergency Database Access
```javascript
// Test database connection
const { data, error } = await supabase
  .from('supervisors')
  .select('count')
  .limit(1);

console.log('DB Status:', error ? 'FAILED' : 'OK');
```

### Reset User Session
```javascript
// Clear problematic session
await supabase.auth.signOut();
localStorage.clear(); // Clear all local data
// User must sign in again
```

---

## 📋 Environment Variables

### Required Variables
```bash
# Frontend (.env.production)
VITE_SUPABASE_URL=https://oieliubbvvdzhzvikzal.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_ENABLE_AUTH=true

# Backend
SUPABASE_URL=https://oieliubbvvdzhzvikzal.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Security Notes
- **Public Keys**: Supabase anon key is safe for client-side use
- **Private Keys**: Service role key (if used) must be server-side only
- **Rotation**: Keys should be rotated annually or if compromised

---

## 📊 Monitoring Dashboard

### Key Metrics to Watch
1. **Active Sessions**: Normal 5-15 concurrent users
2. **Database Requests**: <1000 requests/hour typical
3. **Error Rate**: Should be <5% of total requests
4. **Response Time**: Database queries <500ms average
5. **Storage Usage**: Monitor for growth trends

### Health Check Endpoints
- Frontend: `await supabaseHelpers.healthCheck()`
- Backend: `GET /api/health` (includes Supabase connection test)

---

**Last Updated**: January 28, 2025  
**Next Review**: February 28, 2025  
**Contact**: System will prompt for action based on alerts above