# Staging Deployment Guide
## Roadworks Manager V2 - Staging Environment Setup

### 1. Pre-Deployment Checklist ✅

#### A. Code Verification
- [x] All tests passing (Backend: 98.3%, Frontend: 100%, Integration: 100%)
- [x] SQL setup script created and verified
- [x] Environment variables configured
- [x] Email configuration documented

#### B. Dependencies Check
```bash
# Backend dependencies
cd backend
npm list pdfkit nodemailer node-cron

# Frontend dependencies  
cd Go_BARRY
npm list react-native-chart-kit
```

### 2. Staging Environment Setup

#### A. Create Staging Supabase Project
1. **New Project**: Create separate Supabase project for staging
2. **Database Setup**: Run the complete SQL setup script
3. **Environment Variables**: Use staging-specific values
4. **Test Data**: Add sample roadworks for testing

#### B. Render.com Staging Service
1. **New Service**: Create staging service on Render
2. **Repository**: Connect to same GitHub repo
3. **Branch**: Use `staging` or `main` branch
4. **Environment**: Set to staging configuration

### 3. Backend Staging Deployment

#### A. Render.com Configuration
```yaml
# render.yaml (staging service)
services:
  - type: web
    name: go-barry-staging
    env: node
    buildCommand: npm install
    startCommand: npm run start
    envVars:
      - key: NODE_ENV
        value: staging
      - key: PORT
        value: 3001
      - key: SUPABASE_URL
        sync: false
      - key: SUPABASE_ANON_KEY
        sync: false
      - key: SMTP_USER
        sync: false
      - key: SMTP_PASS
        sync: false
```

#### B. Environment Variables (Staging)
```bash
# Copy from .env.staging
NODE_ENV=staging
SUPABASE_URL=your_staging_supabase_url
SUPABASE_ANON_KEY=your_staging_anon_key
SMTP_USER=staging@gobarry.co.uk
REPORT_RECIPIENTS=anthony.gair@gobarry.co.uk
LOG_LEVEL=debug
ENABLE_DEBUG_LOGS=true
```

#### C. Deployment Commands
```bash
# Local build test
npm run build

# Deploy to staging
git push origin staging

# Or manual deploy
curl -X POST \
  -H "Authorization: Bearer your_render_api_token" \
  https://api.render.com/v1/services/your_staging_service_id/deploys
```

### 4. Frontend Staging Deployment

#### A. Build Configuration
```bash
# Build for staging
cd Go_BARRY
EXPO_PUBLIC_API_BASE_URL=https://go-barry-staging.onrender.com npm run build:web
```

#### B. Deploy Options

##### Option 1: cPanel Staging Subdomain
```bash
# Upload to staging.gobarry.co.uk
npm run build:cpanel
# Upload dist/ folder to staging subdomain
```

##### Option 2: Render Static Site
```bash
# Create static site service on Render
# Point to Go_BARRY/dist folder
# Environment: staging
```

### 5. Database Migration (Staging)

#### A. Supabase Staging Setup
```sql
-- 1. Execute main setup script
-- Copy entire content from setup-supabase-tables.sql

-- 2. Add staging test data
INSERT INTO diversion_templates (
  location_hash, 
  route_description, 
  diversion_route, 
  affected_routes,
  created_by
) VALUES 
  ('54.978300,-1.617800', 'STAGING - Newcastle City Centre', 'Via Grey Street (TEST)', ARRAY['1', '2'], 'AG003'),
  ('54.970000,-1.620000', 'STAGING - Grainger Street', 'Via Dean Street (TEST)', ARRAY['35', '36'], 'BP009');

-- 3. Add test roadworks
INSERT INTO streetworks (
  permit_ref,
  status,
  location_description,
  work_type,
  sm_promoter_name,
  sm_start_date,
  sm_end_date
) VALUES 
  ('STAGING-001', 'approved', 'STAGING - Test Street, Newcastle', 'road_closure', 'Test Promoter', NOW(), NOW() + INTERVAL '7 days'),
  ('STAGING-002', 'monitoring', 'STAGING - Demo Road, Gateshead', 'lane_closure', 'Demo Company', NOW() - INTERVAL '2 days', NOW() + INTERVAL '3 days');
```

#### B. Data Verification
```bash
# Test API endpoints
curl https://go-barry-staging.onrender.com/api/health
curl -H "x-supervisor: AG003" https://go-barry-staging.onrender.com/api/roadworks-v2/analytics
```

### 6. Integration Testing

#### A. Backend API Tests
```bash
# Run staging integration tests
cd backend
npm run test:integration:staging

# Test specific endpoints
curl -X POST \
  -H "Content-Type: application/json" \
  -H "x-supervisor: AG003" \
  -d '{"location":{"lat":54.9783,"lng":-1.6178,"description":"Newcastle"}}' \
  https://go-barry-staging.onrender.com/api/roadworks-v2/diversions/suggest
```

#### B. Frontend Integration Tests
```bash
# Test component rendering
cd Go_BARRY
node test-components.js

# Test API connectivity
npm run test:integration
```

#### C. Email Testing
```bash
# Test report generation
curl -X POST \
  -H "Content-Type: application/json" \
  -H "x-supervisor: AG003" \
  -d '{"type": "test", "recipients": ["anthony.gair@gobarry.co.uk"]}' \
  https://go-barry-staging.onrender.com/api/roadworks-v2/reports/generate
```

### 7. Performance Testing

#### A. Load Testing
```bash
# Test endpoint performance
ab -n 100 -c 10 https://go-barry-staging.onrender.com/api/health

# Test analytics endpoint
ab -n 50 -c 5 -H "x-supervisor: AG003" https://go-barry-staging.onrender.com/api/roadworks-v2/analytics
```

#### B. Memory Monitoring
```javascript
// Add to staging server
setInterval(() => {
  const usage = process.memoryUsage();
  console.log('Memory usage:', {
    rss: Math.round(usage.rss / 1024 / 1024) + 'MB',
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024) + 'MB',
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024) + 'MB'
  });
}, 60000);
```

### 8. User Acceptance Testing

#### A. Test Scenarios
1. **Supervisor Login**: Test with AG003, BP009 credentials
2. **Analytics Dashboard**: Verify all charts load correctly
3. **Controller Review**: Test diversion rating functionality
4. **Audit Logging**: Verify all actions are tracked
5. **Report Generation**: Test PDF creation and email delivery

#### B. Test Checklist
- [ ] Homepage loads without errors
- [ ] Analytics dashboard renders charts
- [ ] Controller interface accessible (controller login)
- [ ] Audit log viewer shows entries
- [ ] Diversion suggestions work
- [ ] Report generation completes
- [ ] Email delivery successful
- [ ] Performance acceptable (<3s response)

### 9. Staging Validation

#### A. Critical Path Testing
```bash
# 1. Health check
curl https://go-barry-staging.onrender.com/api/health

# 2. Authentication
curl -H "x-supervisor: AG003" https://go-barry-staging.onrender.com/api/roadworks-v2/analytics

# 3. Core functionality
curl -X POST -H "Content-Type: application/json" -H "x-supervisor: AG003" \
  -d '{"location":{"lat":54.9783,"lng":-1.6178}}' \
  https://go-barry-staging.onrender.com/api/roadworks-v2/diversions/suggest

# 4. Report generation
curl -X POST -H "Content-Type: application/json" -H "x-supervisor: AG003" \
  -d '{"type":"daily"}' \
  https://go-barry-staging.onrender.com/api/roadworks-v2/reports/generate
```

#### B. Data Integrity Check
```sql
-- Verify table creation
SELECT table_name FROM information_schema.tables 
WHERE table_name IN (
  'diversion_templates', 'geocoding_cache', 'supervisor_audit_log',
  'system_event_log', 'data_access_log', 'report_generation_log'
);

-- Check sample data
SELECT COUNT(*) FROM diversion_templates;
SELECT COUNT(*) FROM streetworks WHERE permit_ref LIKE 'STAGING-%';
```

### 10. Rollback Plan

#### A. If Issues Occur
1. **Immediate**: Disable problematic routes via feature flags
2. **Database**: Restore from backup snapshot
3. **Code**: Revert to previous working commit
4. **Monitoring**: Check logs for error patterns

#### B. Emergency Contacts
- **Technical**: anthony.gair@gobarry.co.uk
- **Operations**: operations@gonortheast.co.uk
- **Staging Access**: Use AG003 supervisor credentials

### 11. Production Readiness Checklist

After successful staging validation:
- [ ] All staging tests passed
- [ ] Performance meets requirements
- [ ] Security validation complete
- [ ] Email delivery confirmed
- [ ] Data integrity verified
- [ ] User acceptance testing passed
- [ ] Documentation updated
- [ ] Production environment prepared
- [ ] Deployment schedule confirmed
- [ ] Rollback plan verified

---

## Next Steps

1. **Complete staging deployment**
2. **Run full test suite**
3. **Validate all functionality**
4. **Schedule production deployment**
5. **Prepare production monitoring**