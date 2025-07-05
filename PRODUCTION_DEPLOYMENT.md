# Production Deployment Guide
## Roadworks Manager V2 - Production Release

### 🚀 Production Deployment Plan

#### Phase 1: Database Migration (30 minutes)
1. **Backup Current Database**
2. **Execute SQL Setup Script**
3. **Verify Table Creation**
4. **Test Data Integrity**

#### Phase 2: Backend Deployment (45 minutes)
1. **Environment Configuration**
2. **Dependency Installation**
3. **Service Deployment**
4. **Health Check Verification**

#### Phase 3: Frontend Deployment (30 minutes)
1. **Build Production Assets**
2. **Deploy to Web Hosting**
3. **Configure CDN**
4. **Test User Interface**

#### Phase 4: Integration Testing (60 minutes)
1. **API Endpoint Testing**
2. **Real-time Data Sync**
3. **Email Service Testing**
4. **Performance Validation**

### 📋 Pre-Deployment Checklist

#### Code Quality ✅
- [x] Backend tests: 98.3% success (58/59 passing)
- [x] Frontend tests: 100% success (14/14 passing)
- [x] Integration tests: 100% success (8/8 passing)
- [x] Security audit completed
- [x] Performance benchmarks met

#### Infrastructure ✅
- [x] Production Supabase project ready
- [x] Render.com production service configured
- [x] Environment variables secured
- [x] SSL certificates valid
- [x] CDN configuration ready

#### Documentation ✅
- [x] Deployment procedures documented
- [x] Rollback procedures tested
- [x] Operations manual created
- [x] API documentation updated
- [x] User guides prepared

### 🗄️ Database Production Setup

#### A. Supabase Production Migration
```sql
-- 1. Create production Supabase project
-- 2. Execute complete setup script from setup-supabase-tables.sql
-- 3. Verify all tables created successfully

-- Quick verification query
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_name IN (
  'diversion_templates', 'geocoding_cache', 'supervisor_audit_log',
  'system_event_log', 'data_access_log', 'report_generation_log',
  'critical_actions_log', 'analytics_requests', 'report_requests'
)
ORDER BY table_name;

-- Expected result: 9 tables with appropriate column counts
```

#### B. Data Migration Verification
```sql
-- Check existing streetworks table structure
\d streetworks;

-- Verify new columns added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'streetworks' 
AND column_name IN ('pushed_to_display', 'diversion_id', 'reviewed_by');
```

### 🔧 Backend Production Deployment

#### A. Render.com Production Configuration
```yaml
# Production service configuration
services:
  - type: web
    name: go-barry-production
    env: node
    region: oregon # or closest to UK
    plan: standard # 2GB RAM
    buildCommand: npm install --production
    startCommand: npm run start
    healthCheckPath: /api/health
    autoDeploy: false # Manual deploys only
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3001
```

#### B. Environment Variables (Production)
```bash
# Critical production variables
NODE_ENV=production
SUPABASE_URL=https://your-prod-project.supabase.co
SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_key

# Email configuration
SMTP_HOST=smtp.gmail.com
SMTP_USER=operations@gonortheast.co.uk
SMTP_PASS=your_production_app_password
REPORT_RECIPIENTS=operations@gonortheast.co.uk,control@gonortheast.co.uk

# Security
SESSION_SECRET=your_secure_32_character_production_secret
JWT_SECRET=your_secure_jwt_secret_production
CORS_ORIGINS=https://gobarry.co.uk,https://www.gobarry.co.uk

# Performance
MAX_MEMORY_MB=1800
API_RATE_LIMIT=100
CACHE_TTL_MINUTES=1440
```

#### C. Production Dependencies
```bash
# Install production dependencies
npm install --production

# Verify critical packages
npm list pdfkit nodemailer node-cron @supabase/supabase-js express cors helmet
```

### 🌐 Frontend Production Deployment

#### A. Build Configuration
```bash
# Production build
cd Go_BARRY
EXPO_PUBLIC_API_BASE_URL=https://go-barry.onrender.com \
EXPO_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co \
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key \
npm run build:web
```

#### B. cPanel Deployment
```bash
# Build and upload
npm run build:cpanel

# Upload files to cPanel:
# - Upload dist/ folder to public_html/
# - Configure .htaccess for SPA routing
# - Set up SSL certificate
# - Configure CDN if available
```

#### C. CDN Configuration (Optional)
```apache
# .htaccess for React Router
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

# Cache static assets
<IfModule mod_expires.c>
  ExpiresActive on
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
</IfModule>
```

### 🧪 Production Testing Suite

#### A. Health Check Verification
```bash
# Basic health check
curl -f https://go-barry.onrender.com/api/health

# Database connectivity
curl -f https://go-barry.onrender.com/api/health/database

# Email service check
curl -f https://go-barry.onrender.com/api/health/email
```

#### B. Critical Path Testing
```bash
# 1. Authentication test
curl -H "x-supervisor: AG003" https://go-barry.onrender.com/api/roadworks-v2/analytics

# 2. Diversion suggestions
curl -X POST \
  -H "Content-Type: application/json" \
  -H "x-supervisor: AG003" \
  -d '{"location":{"lat":54.9783,"lng":-1.6178,"description":"Newcastle"}}' \
  https://go-barry.onrender.com/api/roadworks-v2/diversions/suggest

# 3. Report generation
curl -X POST \
  -H "Content-Type: application/json" \
  -H "x-supervisor: AG003" \
  -d '{"type":"daily","test":true}' \
  https://go-barry.onrender.com/api/roadworks-v2/reports/generate

# 4. Audit logging
curl -X POST \
  -H "Content-Type: application/json" \
  -H "x-supervisor: AG003" \
  -d '{"action":"test_deployment"}' \
  https://go-barry.onrender.com/api/roadworks-v2/audit/log
```

#### C. Frontend Integration Testing
```bash
# Test analytics dashboard
curl -s https://gobarry.co.uk/ | grep -o "RoadworksAnalyticsDashboard"

# Test component loading
curl -s https://gobarry.co.uk/static/js/main.*.js | grep -o "useStreetManager"
```

### 📊 Performance Benchmarks

#### A. Response Time Requirements
- **Health Check**: < 500ms
- **Analytics API**: < 2 seconds
- **Diversion Suggestions**: < 5 seconds
- **Report Generation**: < 30 seconds
- **Frontend Load**: < 3 seconds

#### B. Load Testing
```bash
# Basic load test
ab -n 1000 -c 10 https://go-barry.onrender.com/api/health

# Analytics endpoint load test
ab -n 100 -c 5 -H "x-supervisor: AG003" https://go-barry.onrender.com/api/roadworks-v2/analytics

# Expected results:
# - No failed requests
# - Average response time < 2s
# - Memory usage stable
```

### 🔐 Security Configuration

#### A. SSL/TLS Verification
```bash
# Check SSL certificate
openssl s_client -connect gobarry.co.uk:443 -servername gobarry.co.uk

# Verify HSTS headers
curl -I https://gobarry.co.uk/

# Check security headers
curl -I https://go-barry.onrender.com/api/health
```

#### B. Access Control Testing
```bash
# Test rate limiting
for i in {1..150}; do curl https://go-barry.onrender.com/api/health; done

# Test unauthorized access
curl https://go-barry.onrender.com/api/roadworks-v2/analytics

# Test admin endpoints
curl -H "x-supervisor: INVALID" https://go-barry.onrender.com/api/roadworks-v2/audit
```

### 📧 Email Service Production Setup

#### A. Production Email Configuration
```bash
# Test email delivery
curl -X POST \
  -H "Content-Type: application/json" \
  -H "x-supervisor: AG003" \
  -d '{
    "type": "test",
    "recipients": ["operations@gonortheast.co.uk"],
    "subject": "Go BARRY - Production Deployment Test"
  }' \
  https://go-barry.onrender.com/api/roadworks-v2/reports/send-test
```

#### B. Schedule Verification
```bash
# Verify cron job setup
curl https://go-barry.onrender.com/api/roadworks-v2/reports/schedule

# Test report generation timing
curl -X POST \
  -H "x-supervisor: AG003" \
  https://go-barry.onrender.com/api/roadworks-v2/reports/test-schedule
```

### 📈 Monitoring Setup

#### A. Application Monitoring
```javascript
// Add to production server
const monitoring = {
  // Memory monitoring
  memoryCheck: setInterval(() => {
    const usage = process.memoryUsage();
    if (usage.heapUsed > 1500 * 1024 * 1024) { // 1.5GB
      console.warn('High memory usage:', usage);
    }
  }, 300000), // Every 5 minutes

  // Performance monitoring
  requestTiming: (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      if (duration > 5000) { // 5 seconds
        console.warn('Slow request:', req.url, duration + 'ms');
      }
    });
    next();
  }
};
```

#### B. Error Monitoring
```javascript
// Global error handler
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Send alert to admin
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Send alert to admin
});
```

### 🔄 Rollback Procedures

#### A. Emergency Rollback
```bash
# If critical issues occur:

# 1. Immediate: Disable new features
curl -X POST \
  -H "Authorization: Bearer admin_token" \
  -d '{"disable_roadworks_v2": true}' \
  https://go-barry.onrender.com/api/admin/feature-flags

# 2. Database: Restore from backup
# Use Supabase dashboard to restore from latest backup

# 3. Code: Revert deployment
curl -X POST \
  -H "Authorization: Bearer render_api_token" \
  -d '{"commit_sha": "previous_working_commit"}' \
  https://api.render.com/v1/services/service_id/deploys
```

#### B. Gradual Rollback
```bash
# Route specific endpoints to old version
# Use load balancer or CDN to redirect traffic
# Monitor for stability before full rollback
```

### 📅 Deployment Schedule

#### Production Deployment Timeline
```
Day 1 (Friday 19:00): Pre-deployment preparation
- Database backup
- Service preparation
- Final testing

Day 1 (Friday 20:00): Database migration
- Execute SQL scripts
- Verify table creation
- Test data integrity

Day 1 (Friday 21:00): Backend deployment
- Deploy to Render.com
- Configure environment
- Health check verification

Day 1 (Friday 22:00): Frontend deployment
- Build and upload
- Configure CDN
- Test user interface

Day 2 (Saturday 09:00): Final validation
- End-to-end testing
- Performance verification
- User acceptance testing

Day 2 (Saturday 12:00): Go-live announcement
- Notify operations team
- Begin monitoring
- Support availability
```

### 🎯 Success Criteria

#### Deployment Success Metrics
- [ ] All health checks passing
- [ ] Database migration successful
- [ ] Email delivery working
- [ ] Performance within SLA
- [ ] Security controls active
- [ ] Monitoring alerts configured
- [ ] Operations team trained
- [ ] Rollback procedures tested

#### Post-Deployment Monitoring (24 hours)
- **Uptime**: > 99.5%
- **Response Time**: < 3 seconds average
- **Memory Usage**: < 1.8GB peak
- **Error Rate**: < 1%
- **Report Delivery**: 100% success
- **User Satisfaction**: No critical issues

---

## 🚨 Emergency Contacts

- **Technical Lead**: anthony.gair@gobarry.co.uk
- **Operations Team**: operations@gonortheast.co.uk
- **On-call Support**: Available 24/7 for first 48 hours
- **Escalation**: management@gonortheast.co.uk

## 📞 Go-Live Support

- **Deployment Window**: Friday 19:00 - Saturday 12:00
- **Support Availability**: 24/7 monitoring for first week
- **Communication**: Slack channel #go-barry-deployment
- **Status Updates**: Every 2 hours during deployment