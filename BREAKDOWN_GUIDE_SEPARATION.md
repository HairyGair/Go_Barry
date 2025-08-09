# Breakdown Guide Service Separation Guide

## Overview
This guide explains how to deploy the Breakdown Guide as a separate Render service without incurring additional costs. This separation provides:
- **Separate logs** for easier debugging and monitoring
- **Independent scaling** if needed in the future
- **Clear service boundaries** for better maintenance
- **No additional cost** using Render's free tier

## Architecture

```
┌─────────────────────────┐     ┌──────────────────────────┐
│  go-barry.onrender.com  │     │ breakdown.onrender.com   │
│  (Main Backend API)     │◄────│  (Breakdown Guide UI)    │
├─────────────────────────┤     ├──────────────────────────┤
│ - Traffic APIs          │     │ - Static HTML/JS/CSS     │
│ - Supervisor Auth       │     │ - Proxies API calls      │
│ - Database connections  │     │ - Separate logs          │
│ - All business logic    │     │ - Lightweight server     │
└─────────────────────────┘     └──────────────────────────┘
```

## Deployment Steps

### 1. Initial Setup (One-time)

```bash
# Copy breakdown guide files to the new service directory
cd breakdown-guide-service
npm install
npm run copy-files

# Test locally
npm start
# Visit http://localhost:3002
```

### 2. Deploy to Render

#### Option A: Using render.yaml (Recommended)
1. Push the code to your repository
2. In Render Dashboard:
   - Go to "Blueprints" 
   - Click "New Blueprint Instance"
   - Connect your GitHub repo
   - Select the branch with render.yaml
   - Render will automatically create both services

#### Option B: Manual Setup
1. Create a new Web Service in Render
2. Connect the same GitHub repository
3. Configure:
   - **Name**: go-barry-breakdown-guide
   - **Root Directory**: breakdown-guide-service
   - **Build Command**: `npm ci --production && npm run copy-files`
   - **Start Command**: `npm start`
   - **Plan**: Free

### 3. Environment Variables

Set these in Render Dashboard for the Breakdown Guide service:
```
BACKEND_URL=https://go-barry.onrender.com
PORT=10000
NODE_ENV=production
```

### 4. Update DNS (if using custom domain)

If you want breakdown.gobarry.co.uk:
1. Add a CNAME record pointing to your-breakdown-service.onrender.com
2. Add the custom domain in Render settings

## File Structure

```
breakdown-guide-service/
├── server.js              # Express server
├── package.json           # Dependencies
├── copy-breakdown-files.js # Build script
├── .env.example           # Environment template
└── public/                # Static files (copied from main project)
    ├── index.html
    ├── App.js
    ├── components/
    ├── services/
    └── styles/
```

## Benefits

### 1. Separate Logs
- Main backend logs only show API traffic
- Breakdown Guide logs show UI access patterns
- Easier to debug specific issues

### 2. Independent Deployments
- Can update Breakdown Guide without touching main backend
- Rollback one service without affecting the other

### 3. Resource Isolation
- Each service gets its own memory allocation
- No competition for resources between services

### 4. No Additional Cost
- Both services run on Render's free tier
- Same repository, multiple services
- Shared environment variables where needed

## Monitoring

### View Logs Separately
- **Main Backend**: https://dashboard.render.com/web/srv-[main-service-id]/logs
- **Breakdown Guide**: https://dashboard.render.com/web/srv-[breakdown-service-id]/logs

### Health Checks
- Main Backend: https://go-barry.onrender.com/health
- Breakdown Guide: https://[breakdown-url].onrender.com/health

## Maintenance

### Updating Breakdown Guide Files
```bash
# When you update the breakdown guide in main project
cd breakdown-guide-service
npm run copy-files
git add .
git commit -m "Update breakdown guide files"
git push
```

### Syncing Changes
The breakdown guide files still live in the main project for development. The copy-breakdown-files script syncs them to the service directory for deployment.

## Rollback Plan

If you need to revert to the single-service setup:
1. Simply ignore the breakdown-guide-service directory
2. The main backend will continue serving everything as before
3. Delete the Breakdown Guide service from Render

## Troubleshooting

### Issue: API calls failing
- Check BACKEND_URL environment variable
- Verify CORS settings in main backend
- Check network connectivity between services

### Issue: Files not updating
- Run `npm run copy-files` before deployment
- Clear browser cache
- Check build logs in Render

### Issue: Memory issues
- Breakdown Guide service is lightweight (~50MB)
- If issues persist, check for memory leaks in copied JavaScript

## Future Enhancements

Once separated, you could:
- Add CDN for static assets
- Implement caching strategies
- Add analytics specific to Breakdown Guide
- Create supervisor-specific dashboards
- Add WebSocket for real-time updates (separate from main app)