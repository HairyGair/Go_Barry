# Quick Start - Deploy Backend to cPanel

## TL;DR - One Command Deployment

```bash
cd /Users/anthony/Go\ BARRY\ App/BreakdownGuideapp/backend
npm run deploy
```

**Password when prompted**: `juvwyh-1nuJdu-gyqrut`

That's it! The script will:
1. ✅ Upload all backend files
2. ✅ Install dependencies
3. ✅ Configure environment
4. ✅ Restart the application
5. ✅ Test the deployment

---

## What's Deployed

### Files Uploaded
- `server.js` - Main application
- `app.js` - Passenger entry point
- `package.json` - Dependencies
- `.htaccess` - Apache/Passenger config
- `routes/` - All API endpoints
- `services/` - Business logic
- `middleware/` - Authentication & security
- `data/` - Static data files
- `config/` - Database configuration

### Environment
- **URL**: https://api.breakdowns.gobarry.co.uk
- **Database**: MySQL on localhost (cPanel)
- **Node.js**: Version 20.x
- **Server**: Apache + Passenger

---

## Testing After Deployment

### 1. Health Check
```bash
curl https://api.breakdowns.gobarry.co.uk/health
```
Expected: `{"status":"ok","timestamp":"...","database":"connected"}`

### 2. Supervisors Endpoint
```bash
curl https://api.breakdowns.gobarry.co.uk/api/supervisors
```
Expected: Array of supervisor objects

### 3. Browser Test
Open in browser:
- https://api.breakdowns.gobarry.co.uk/health

---

## Troubleshooting

### App Not Responding
```bash
# SSH into server
ssh gobarryco@gobarry.co.uk

# Check if app is running
ps aux | grep node

# Check logs
tail -f ~/logs/stderr.log

# Force restart
touch ~/backend/tmp/restart.txt
```

### Database Connection Error
```bash
# Test MySQL locally on server
ssh gobarryco@gobarry.co.uk
mysql -h localhost -u gobarryco_Gair -p gobarryco_breakdown
# Password: Turnip1105!!!!!
```

### Module Not Found
```bash
# Reinstall dependencies
ssh gobarryco@gobarry.co.uk
cd ~/backend
rm -rf node_modules
/opt/cpanel/ea-nodejs20/bin/npm install --production
touch tmp/restart.txt
```

---

## Manual Restart

If you need to restart the app:

**Method 1: SSH**
```bash
ssh gobarryco@gobarry.co.uk
touch ~/backend/tmp/restart.txt
```

**Method 2: cPanel Interface**
1. Login: https://gobarry.co.uk:2083
2. Go to "Setup Node.js App"
3. Click "Restart" button

---

## Re-deploying After Changes

Just run the same command:
```bash
npm run deploy
```

The script will:
- Upload only changed files
- Keep node_modules intact
- Restart automatically

---

## Access Information

### SSH
```
Host: gobarry.co.uk
User: gobarryco
Password: juvwyh-1nuJdu-gyqrut
```

### cPanel
```
URL: https://gobarry.co.uk:2083
User: gobarryco
Password: juvwyh-1nuJdu-gyqrut
```

### Database (from server only)
```
Host: localhost
User: gobarryco_Gair
Password: Turnip1105!!!!!
Database: gobarryco_breakdown
```

---

## Frontend Configuration

The frontend is already configured to use the cPanel backend:
```
VITE_API_URL=https://api.breakdowns.gobarry.co.uk
```

Located in: `/frontend/.env`

No changes needed to frontend after backend deployment!

---

## Support

For detailed deployment information, see:
- `CPANEL_COMPLETE_DEPLOYMENT.md` - Full deployment guide
- `deploy-complete.sh` - Deployment script source

**Contact**: anthony@gobarry.co.uk
