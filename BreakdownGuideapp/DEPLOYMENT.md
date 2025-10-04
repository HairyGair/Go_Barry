# Deployment Guide - Breakdown Management System

## Overview

This document explains the complete deployment workflow for the Breakdown Management System, including the dual-repository setup and how to properly deploy changes to production.

## Quick Reference

### Production Deployment Commands

```bash
# CRITICAL: Always push to the 'breakdown' remote for production deployment
git add .
git commit -m "Your commit message"
git push breakdown main    # Triggers Render.com deployment
```

### Common Mistake to Avoid

```bash
# ❌ WRONG - This pushes to Go_Barry repo (development only)
git push origin main

# ✅ CORRECT - This pushes to Breakdown_Guide repo (Render deployment)
git push breakdown main
```

---

## Deployment Architecture

### Production Stack

| Component | Platform | URL |
|-----------|----------|-----|
| Backend API | Render.com | https://breakdown-guide.onrender.com |
| Frontend | cPanel | https://breakdowns.gobarry.co.uk |
| Database | Supabase | https://oieliubbvvdzhzvikzal.supabase.co |
| Git Repository (Production) | GitHub | https://github.com/HairyGair/Breakdown_Guide |

### Dual Repository Setup

This project uses TWO git repositories:

1. **Origin** (`origin`) - Development Repository
   - URL: https://github.com/HairyGair/Go_Barry.git
   - Purpose: Historical development, feature branches, experimental work
   - **NOT used for deployment**

2. **Breakdown** (`breakdown`) - Production Repository
   - URL: https://github.com/HairyGair/Breakdown_Guide.git
   - Purpose: Production code, Render.com deployment source
   - **This is the deployment repository**

See [REPOSITORY_STRUCTURE.md](./REPOSITORY_STRUCTURE.md) for detailed explanation.

---

## Step-by-Step Deployment Process

### 1. Development Workflow

```bash
# Start from main branch
cd /Users/anthony/Go\ BARRY\ App/BreakdownGuideapp
git checkout main

# Make your changes
# Edit files, test locally

# Stage changes
git add .

# Commit changes
git commit -m "feat: Add new feature

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

### 2. Deploy to Production (Render.com)

```bash
# Push to breakdown remote (triggers Render deployment)
git push breakdown main
```

**What happens next:**
1. Code is pushed to `Breakdown_Guide` repository
2. Render.com detects the push via webhook
3. Render runs build command: `cd backend && npm install`
4. Render starts service: `cd backend && node server.js`
5. Health check runs on `/api/health-extended`
6. New version goes live (usually 2-5 minutes)

### 3. Verify Deployment

```bash
# Check Render deployment status
# Visit: https://dashboard.render.com

# Test health endpoint
curl https://breakdown-guide.onrender.com/api/health-extended

# Expected response:
# {
#   "status": "healthy",
#   "timestamp": "2025-10-02T...",
#   "services": { ... }
# }
```

### 4. Optional: Push to Development Repository

```bash
# If you want to keep both repos in sync
git push origin main
```

---

## Render.com Configuration

### Service Configuration

The deployment is configured via `render.yaml` in the root directory:

```yaml
services:
  - type: web
    name: go-barry
    runtime: node
    region: oregon
    plan: starter # $7/month plan
    buildCommand: cd backend && npm install
    startCommand: cd backend && node server.js
    healthCheckPath: /api/health-extended
    autoDeploy: false
```

### Environment Variables

Set these in the Render.com dashboard under "Environment":

**Required:**
- `NODE_ENV=production`
- `PORT=3001`
- `SUPABASE_URL=https://haountnghecfrsoniubq.supabase.co`
- `SUPABASE_ANON_KEY` (see render.yaml)
- `SUPABASE_SERVICE_KEY` (add manually for security)

**Optional:**
- `WHAT3WORDS_API_KEY=UA0764K8`
- `GOOGLE_ROADS_API_KEY` (see render.yaml)

### Accessing Render Dashboard

1. Visit https://dashboard.render.com
2. Login with GitHub account (HairyGair)
3. Select "go-barry" service
4. View logs, metrics, and deployment history

---

## Frontend Deployment Options

### Option 1: Render.com (Recommended for Production)

**Add to `render.yaml`:**
```yaml
  - type: web
    name: breakdown-guide-frontend
    env: static
    buildCommand: cd frontend && npm install && npm run build
    staticPublishPath: frontend/dist
```

**Deploy:**
```bash
git push breakdown main
# Render will deploy both backend and frontend
```

### Option 2: cPanel (Alternative)

**Build locally:**
```bash
cd /Users/anthony/Go\ BARRY\ App/BreakdownGuideapp/frontend
npm run build
```

**Deploy:**
```bash
# Use the deployment script
./deploy-to-cpanel.sh

# Or manually upload
# Upload contents of frontend/dist/ to cPanel public_html
```

### Option 3: Separate Deployment Folder

The `breakdown-guide-deploy` folder is a standalone clone of the production repository:

```bash
cd /Users/anthony/Go\ BARRY\ App/BreakdownGuideapp/breakdown-guide-deploy

# This folder has its own git setup
git remote -v
# origin  https://github.com/HairyGair/Breakdown_Guide.git

# Use this if you want to work in a clean production environment
git pull origin main
# Make changes
git push origin main  # Triggers Render deployment
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] All changes tested locally (`npm run dev` in both backend and frontend)
- [ ] No console errors in browser
- [ ] Authentication working
- [ ] Database migrations applied (if any)
- [ ] Environment variables set in Render dashboard
- [ ] `render.yaml` updated if config changed

### Deployment

- [ ] Code committed to git
- [ ] Pushed to `breakdown` remote: `git push breakdown main`
- [ ] Render deployment triggered (check dashboard)
- [ ] Build completes successfully (no errors in logs)
- [ ] Health check passes

### Post-Deployment

- [ ] Visit production URL: https://breakdown-guide.onrender.com
- [ ] Test critical features:
  - [ ] Login with supervisor account
  - [ ] Create breakdown
  - [ ] View activity feed
  - [ ] Dashboard loads correctly
- [ ] Check Render logs for errors
- [ ] Monitor for 10-15 minutes for stability

---

## Rollback Procedure

If deployment fails or introduces bugs:

### Option 1: Revert Git Commit

```bash
# Find the last working commit
git log --oneline -10

# Revert to previous commit
git revert HEAD
git push breakdown main

# Or reset to specific commit (use with caution)
git reset --hard <commit-hash>
git push breakdown main --force
```

### Option 2: Render Dashboard Rollback

1. Visit https://dashboard.render.com
2. Select "go-barry" service
3. Click "Deploys" tab
4. Find last successful deployment
5. Click "Redeploy" on that version

---

## Common Deployment Issues

### Issue 1: Build Fails on Render

**Symptoms:**
- Render shows "Build failed" status
- Error in build logs

**Solutions:**
```bash
# Check that build command works locally
cd backend
npm install
# Should complete without errors

# Check for syntax errors
npm run test

# Verify package.json has all dependencies
```

### Issue 2: Service Won't Start

**Symptoms:**
- Build succeeds but service crashes
- Health check fails

**Solutions:**
```bash
# Check start command works locally
cd backend
node server.js
# Should start without errors

# Check environment variables in Render dashboard
# Verify SUPABASE_URL, SUPABASE_SERVICE_KEY are set

# Check logs in Render dashboard for error messages
```

### Issue 3: Pushed to Wrong Repository

**Symptoms:**
- Pushed to `origin` instead of `breakdown`
- Render didn't deploy

**Solutions:**
```bash
# Push to correct repository
git push breakdown main

# Verify which remotes exist
git remote -v

# Check where code was pushed
git log --oneline --all --graph -10
```

### Issue 4: Environment Variables Not Set

**Symptoms:**
- "SUPABASE_URL is undefined" errors
- Authentication failures

**Solutions:**
1. Visit Render dashboard
2. Go to "Environment" tab
3. Add missing variables
4. Trigger manual deploy

---

## Monitoring and Logs

### Render Logs

```bash
# View in dashboard
https://dashboard.render.com → go-barry → Logs

# Common log patterns to watch:
# ✅ "Server running on port 3001"
# ✅ "Connected to Supabase"
# ❌ "Error: Cannot find module"
# ❌ "ECONNREFUSED"
```

### Health Check

```bash
# Manual health check
curl https://breakdown-guide.onrender.com/api/health-extended

# Automated monitoring
# Render automatically pings /api/health-extended every 5 minutes
# Service restarts if health check fails
```

### Database Monitoring

```bash
# Check Supabase dashboard
https://app.supabase.com/project/oieliubbvvdzhzvikzal

# View:
# - Database size
# - Active connections
# - Query performance
# - Table sizes
```

---

## Deployment Schedule

### Recommended Deployment Times

- **Best:** Tuesday-Thursday, 10:00-14:00 GMT (low supervisor usage)
- **Avoid:** Monday mornings, Friday afternoons, weekends
- **Emergency fixes:** Any time (document in commit message)

### Deployment Frequency

- **Minor updates:** As needed (bug fixes, UI tweaks)
- **Major features:** Weekly or bi-weekly
- **Breaking changes:** Coordinate with supervisors, announce in advance

---

## Security Considerations

### API Keys and Secrets

**Never commit these to git:**
- `SUPABASE_SERVICE_KEY`
- `SUPABASE_ANON_KEY`
- Any API keys

**Always set in Render dashboard only**

### Database Credentials

- Stored in Render environment variables
- Not in `render.yaml` (use `sync: false`)
- Rotate keys quarterly

### CORS Configuration

The backend is configured to allow requests from:
- `https://breakdown-guide.onrender.com`
- `http://localhost:5173` (development)

Update `backend/server.js` if deploying to new domain.

---

## Performance Optimization

### Render Free Tier Limitations

- **RAM:** 512 MB (starter plan: 2 GB)
- **CPU:** Shared
- **Sleep after inactivity:** 15 minutes (starter plan: no sleep)

### Optimization Tips

1. **Enable starter plan** ($7/month) to prevent sleep
2. **Minimize dependencies** in package.json
3. **Use efficient queries** (indexed columns)
4. **Cache frequent requests** (future enhancement)

---

## Troubleshooting Quick Commands

```bash
# Check which remote you're tracking
git remote -v

# See where you last pushed
git log --oneline --all --graph -5

# Test backend locally
cd backend && npm run dev

# Test frontend locally
cd frontend && npm run dev

# Check Render service status
curl -I https://breakdown-guide.onrender.com/api/health-extended

# View recent deployments
git log breakdown/main --oneline -10
```

---

## Additional Resources

- [Render.com Documentation](https://render.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Project README](./README.md)
- [Repository Structure](./REPOSITORY_STRUCTURE.md)
- [API Documentation](./docs/API.md)
- [Setup Guide](./docs/SETUP.md)

---

## Support

**For deployment issues:**
- Check Render dashboard logs first
- Review this guide's troubleshooting section
- Contact: anthony.gair@gonortheast.co.uk

**Last Updated:** October 2, 2025
**Version:** 2.0.0
