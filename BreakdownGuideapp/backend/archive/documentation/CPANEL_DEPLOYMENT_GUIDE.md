# Go BARRY Backend - cPanel Deployment Guide

## Current Issue

The backend is deployed to cPanel but there's confusion about:
1. Where files are actually located on the server
2. How the Node.js app starts/restarts
3. Whether the latest code (with route ordering fix) is deployed

## Quick Diagnosis

### Option 1: Run Diagnostic Script via SSH

```bash
ssh gobarryco@gobarry.co.uk 'bash -s' < diagnose-cpanel-deployment.sh
```

This will output a complete report showing:
- Where the backend is deployed
- If Node.js is running
- What startup method is being used (Passenger/PM2/CloudLinux)
- Recent logs
- API endpoint status

### Option 2: Manual SSH Commands

Connect to server:
```bash
ssh gobarryco@gobarry.co.uk
```

Then run these diagnostic commands:

```bash
# Find deployment directory
ls -la ~/gobarry-backend-deploy/
ls -la ~/backend/
ls -la ~/api/

# Check for server.js and supervisors.js
find ~ -name "server.js" -not -path "*/node_modules/*" 2>/dev/null

# Check if Node is running
ps aux | grep node

# Check Passenger processes
ps aux | grep -i passenger

# Check recent logs
tail -20 ~/logs/stderr.log
tail -20 ~/logs/stdout.log

# Test API
curl -s https://api.breakdowns.gobarry.co.uk/api/health | head -10
```

## Known Facts from Previous Conversation

1. **Restart worked with**: `touch ~/api/tmp/restart.txt`
   - This suggests **Passenger** is being used
   - Deployment directory might be `~/api/`

2. **API is responding**: Health check worked at some point
   - URL: https://api.breakdowns.gobarry.co.uk

3. **Missing file**: `/home/gobarryco/api/routes/supervisors.js` doesn't exist
   - Either wrong path OR not deployed yet

## Next Steps After Diagnosis

1. **Run the diagnostic script** to identify current deployment
2. **Choose the appropriate deployment method** (A, B, or C)
3. **Follow the exact commands** for that method
4. **Verify route ordering** in deployed file
5. **Test endpoints** to confirm fix is working
