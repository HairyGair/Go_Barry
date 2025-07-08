# Operations Centre Deployment Guide
## Go BARRY - Phase 7 Complete

### 📋 Pre-Deployment Checklist

Before deploying the Operations Centre to production, ensure all items are checked:

#### ✅ Code Quality
- [x] No console.log statements in production code
- [x] No hardcoded URLs or API keys
- [x] All imports are correct and optimized
- [x] Error boundaries implemented
- [x] Authentication required for access

#### ✅ Configuration
- [x] `.env.production` file created with all variables
- [x] Production configuration in `/config/production.js`
- [x] API endpoints point to `https://go-barry.onrender.com`
- [x] Convex URL configured for real-time sync
- [x] Session timeout set to 10 minutes

#### ✅ Security
- [x] Authentication enforced on all pages
- [x] No sensitive data exposed in client code
- [x] API calls have proper error handling
- [x] CORS configured for production domain
- [x] Session management implemented

#### ✅ Performance
- [x] Lazy loading components created
- [x] Performance monitoring hooks added
- [x] Memory usage optimized for 2GB limit
- [x] Bundle size optimized
- [x] Caching strategy implemented

---

## 🚀 Deployment Steps

### 1. Run Pre-Deployment Checks

```bash
# From Go_BARRY directory
cd Go_BARRY

# Run deployment preparation script
node scripts/deploy-prep.js

# Run security audit
node scripts/security-audit.js

# Run performance optimization
node scripts/performance-optimize.js
```

### 2. Build for Production

```bash
# Clean build
npm run reset

# Build for production
npm run build:web:production

# Test production build locally
npm run serve
```

Visit http://localhost:3000 to test the production build.

### 3. Deploy to Render.com

#### Option A: Automatic Deployment (Recommended)
1. Push code to GitHub main branch
2. Render will automatically build and deploy

#### Option B: Manual Deployment
1. Log into Render.com dashboard
2. Navigate to Go BARRY service
3. Click "Manual Deploy" → "Deploy latest commit"

### 4. Environment Variables on Render

Ensure these are set in Render dashboard:

```env
EXPO_PUBLIC_API_URL=https://go-barry.onrender.com
EXPO_PUBLIC_CONVEX_URL=https://standing-octopus-908.convex.cloud
EXPO_PUBLIC_SUPABASE_URL=https://haountnqhecfrsonivbq.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=[your-key]
EXPO_PUBLIC_TOMTOM_API_KEY=[your-key]
EXPO_PUBLIC_MAPBOX_TOKEN=[your-key]
NODE_ENV=production
```

### 5. Post-Deployment Verification

After deployment, verify:

1. **Access the Operations Centre**
   - Navigate to https://gobarry.co.uk/operations-centre
   - Ensure redirect to login if not authenticated

2. **Check Health Status**
   - All systems should show green
   - API connection verified
   - Convex sync active

3. **Test Core Features**
   - [ ] Duty Boards card loads
   - [ ] Incidents card shows data
   - [ ] Roadworks manager accessible
   - [ ] Disruption database functional
   - [ ] Activity feed updates
   - [ ] Quick actions work

4. **Monitor Performance**
   - Check browser console for errors
   - Verify page load time < 3 seconds
   - Ensure smooth animations
   - Check memory usage

---

## 📊 Monitoring & Maintenance

### Real-time Monitoring

1. **Render Dashboard**
   - CPU and memory usage
   - Request metrics
   - Error logs

2. **Browser DevTools**
   - Network tab for API calls
   - Performance tab for render times
   - Memory profiler for leaks

3. **Error Tracking**
   - Check error boundary logs
   - Monitor failed API calls
   - Track authentication issues

### Maintenance Tasks

**Daily:**
- Check error logs
- Monitor performance metrics
- Verify data sync

**Weekly:**
- Review security audit
- Check for dependency updates
- Analyze usage patterns

**Monthly:**
- Performance optimization review
- Security assessment
- User feedback collection

---

## 🚨 Troubleshooting

### Common Issues

**1. CORS Errors**
- Verify API URL in environment variables
- Check Render CORS settings
- Ensure frontend uses correct domain

**2. Authentication Failures**
- Check supervisor session management
- Verify Convex connection
- Review session timeout settings

**3. Performance Issues**
- Enable lazy loading
- Check memory usage
- Review API call frequency

**4. Build Failures**
- Clear cache: `npm run reset`
- Delete node_modules and reinstall
- Check for TypeScript errors

### Emergency Rollback

If critical issues occur:

1. **Render Rollback:**
   - Go to Render dashboard
   - Click "Rollback" to previous version
   - Select last known good deployment

2. **Manual Rollback:**
   ```bash
   git revert HEAD
   git push origin main
   ```

---

## 👥 Training & Support

### Supervisor Training

1. **Quick Start Guide**
   - How to access Operations Centre
   - Understanding the dashboard
   - Using operation cards

2. **Video Tutorial**
   - 5-minute overview
   - Feature demonstrations
   - Best practices

3. **Support Contacts**
   - Technical: anthony@gobarry.co.uk
   - Operations: supervisors@gonortheast.co.uk

### Developer Notes

**Key Files:**
- Main page: `/app/operations-centre/index.jsx`
- Layout: `/app/operations-centre/_layout.jsx`
- Config: `/app/operations-centre/config/production.js`
- Components: `/app/operations-centre/components/`

**Testing Commands:**
```bash
npm run test:operations
npm run test:integration
npm run test:performance
```

---

## ✅ Phase 7 Completion Summary

**Completed Tasks:**
1. ✅ Code review and cleanup
2. ✅ Production configuration
3. ✅ Security hardening
4. ✅ Performance optimization
5. ✅ Error handling implementation
6. ✅ Deployment scripts created
7. ✅ Documentation updated

**Created Files:**
- `/scripts/deploy-prep.js` - Pre-deployment checker
- `/scripts/security-audit.js` - Security scanner
- `/scripts/performance-optimize.js` - Performance optimizer
- `/app/operations-centre/config/production.js` - Production config
- `/app/operations-centre/components/OperationsErrorBoundary.jsx` - Error handling
- `/app/operations-centre/components/LazyComponents.jsx` - Code splitting
- `/app/operations-centre/hooks/usePerformanceMonitor.js` - Performance tracking
- `.env.production` - Production environment variables

**Next Phase:** Final Testing & Go-Live (Phase 8)

---

*Deployment Guide v1.0*  
*Created: June 30, 2025*  
*Operations Centre Ready for Production! 🚀*
