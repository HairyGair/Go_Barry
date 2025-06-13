# Go Barry cPanel Deployment Guide
## Complete Guide to Hosting on cPanel with gobarry.co.uk

### 🎯 Overview
This guide will help you deploy Go Barry to your cPanel hosting with your custom domain `gobarry.co.uk`.

### 🏗️ Architecture
- **Frontend**: `gobarry.co.uk` → cPanel Static Hosting
- **Backend**: `api.gobarry.co.uk` → External Service (Railway/Render/Heroku)
- **Domain**: Your custom domain with SSL

---

## 📋 Prerequisites

### ✅ What You Need
- [ ] cPanel hosting account with file manager access
- [ ] Domain `gobarry.co.uk` pointed to your cPanel server
- [ ] SSL certificate (recommended)
- [ ] External service for backend API (Railway, Render, or Heroku)

### 🔍 Check Your cPanel Capabilities
Log into your cPanel and verify:
- [ ] File Manager access
- [ ] Static website hosting support
- [ ] .htaccess support
- [ ] SSL/HTTPS available
- [ ] Domain management

---

## 🚀 Step 1: Prepare the Frontend Build

### 1.1 Install Dependencies
```bash
cd "/Users/anthony/Go BARRY App/Go_BARRY"
npm install
```

### 1.2 Build for cPanel
```bash
npm run build:cpanel
```

### 1.3 Test Locally (Optional)
```bash
npm run serve:cpanel
# Visit http://localhost:3000 to test
```

---

## 📦 Step 2: Create Deployment Package

### 2.1 Run Deployment Script
```bash
cd "/Users/anthony/Go BARRY App"
chmod +x deploy-to-cpanel.sh
./deploy-to-cpanel.sh
```

This creates: `gobarry-cpanel-deployment.zip`

### 2.2 Package Contents
- ✅ `index.html` - Main application
- ✅ `static/` - JavaScript, CSS, images
- ✅ `.htaccess` - Routing and optimization
- ✅ `asset-manifest.json` - Build manifest
- ✅ `favicon.ico` - Site icon

---

## 📁 Step 3: Upload to cPanel

### 3.1 Access cPanel File Manager
1. Log into your cPanel
2. Open "File Manager"
3. Navigate to `public_html` directory

### 3.2 Clear Existing Files (if any)
```
⚠️ BACKUP FIRST if you have existing content!
```
- Select all files in `public_html`
- Delete existing content

### 3.3 Upload Deployment Package
1. Click "Upload" in File Manager
2. Select `gobarry-cpanel-deployment.zip`
3. Upload the file
4. Return to File Manager

### 3.4 Extract Files
1. Right-click `gobarry-cpanel-deployment.zip`
2. Select "Extract"
3. Extract to current directory (`public_html`)
4. Delete the zip file after extraction

### 3.5 Verify File Structure
Your `public_html` should now contain:
```
public_html/
├── index.html
├── .htaccess
├── static/
│   ├── js/
│   ├── css/
│   └── media/
├── asset-manifest.json
└── favicon.ico
```

---

## 🔧 Step 4: Backend API Setup

Since cPanel typically doesn't support Node.js well, you need an external backend service.

### Option A: Deploy to Railway (Recommended)

1. **Sign up at [Railway](https://railway.app)**
2. **Connect your GitHub repository**
3. **Deploy the backend:**
   ```bash
   # In your backend directory
   cd "/Users/anthony/Go BARRY App/backend"
   
   # Create railway.json
   echo '{
     "build": {
       "builder": "nixpacks"
     },
     "start": "npm start"
   }' > railway.json
   ```
4. **Set environment variables in Railway dashboard:**
   - `TOMTOM_API_KEY`
   - `MAPQUEST_API_KEY`
   - `HERE_API_KEY`
   - `NATIONAL_HIGHWAYS_API_KEY`
   - `CORS_ORIGIN=https://gobarry.co.uk`

### Option B: Deploy to Render

1. **Use existing `render.yaml` configuration**
2. **Update environment variables**
3. **Deploy and get URL**

### Option C: Deploy to Heroku

1. **Install Heroku CLI**
2. **Create Heroku app:**
   ```bash
   cd "/Users/anthony/Go BARRY App/backend"
   heroku create barry-api
   git push heroku main
   ```

---

## 🌐 Step 5: Domain Configuration

### 5.1 Set Up Subdomain for API
In your domain registrar or cPanel DNS:

```dns
# Add CNAME record
Name: api
Type: CNAME
Value: your-backend-service-url.railway.app
TTL: 3600
```

### 5.2 Verify Domain Setup
Test these URLs:
- ✅ `https://gobarry.co.uk` (Frontend)
- ✅ `https://api.gobarry.co.uk/api/health` (Backend)

---

## 🔒 Step 6: SSL Configuration

### 6.1 Enable SSL in cPanel
1. Go to "SSL/TLS" in cPanel
2. Enable "Force HTTPS Redirect"
3. Install SSL certificate (Let's Encrypt or paid)

### 6.2 Update .htaccess for HTTPS
Uncomment these lines in your `.htaccess`:
```apache
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

---

## 🧪 Step 7: Testing Your Deployment

### 7.1 Frontend Tests
- [ ] Visit `https://gobarry.co.uk`
- [ ] Check all pages load correctly
- [ ] Verify routing works (refresh page on any route)
- [ ] Test mobile responsiveness

### 7.2 Backend Tests
```bash
# Test API health
curl https://api.gobarry.co.uk/api/health

# Test alerts endpoint
curl https://api.gobarry.co.uk/api/alerts

# Test CORS
curl -H "Origin: https://gobarry.co.uk" \
  -H "Access-Control-Request-Method: GET" \
  -X OPTIONS \
  https://api.gobarry.co.uk/api/alerts
```

### 7.3 Integration Tests
- [ ] Open browser developer tools
- [ ] Check Network tab for API calls
- [ ] Verify alerts are loading
- [ ] Test supervisor login
- [ ] Check maps functionality

---

## 🔧 Troubleshooting

### Issue: "Cannot GET /" on refresh
**Solution:** Verify `.htaccess` is uploaded and contains SPA routing rules.

### Issue: CORS errors
**Solution:** 
1. Check backend `CORS_ORIGIN` includes your domain
2. Verify API subdomain is working
3. Check .htaccess CORS headers

### Issue: Assets not loading
**Solution:**
1. Check file permissions (755 for directories, 644 for files)
2. Verify static files are in correct location
3. Check browser console for 404 errors

### Issue: API not responding
**Solution:**
1. Test API URL directly in browser
2. Check external service logs
3. Verify environment variables are set

### Issue: SSL/HTTPS problems
**Solution:**
1. Check SSL certificate is installed
2. Verify HTTPS redirect is working
3. Check mixed content warnings

---

## 📊 Performance Optimization

### 7.1 Enable GZIP (Already in .htaccess)
- Reduces file sizes by ~70%
- Faster loading times

### 7.2 Browser Caching (Already in .htaccess)
- Static assets cached for 1 year
- HTML cached for 1 hour

### 7.3 CDN (Optional)
Consider using Cloudflare for:
- Additional caching
- DDoS protection
- Performance improvements

---

## 🔄 Updates and Maintenance

### Updating the Frontend
```bash
# Make changes to your code
cd "/Users/anthony/Go BARRY App"

# Rebuild and redeploy
./deploy-to-cpanel.sh

# Upload new gobarry-cpanel-deployment.zip to cPanel
# Extract and replace files
```

### Updating the Backend
- Deploy changes to your external service (Railway/Render/Heroku)
- Environment variables persist automatically
- No frontend changes needed unless API endpoints change

### Monitoring
- Check website regularly: https://gobarry.co.uk
- Monitor API health: https://api.gobarry.co.uk/api/health
- Review cPanel error logs if issues occur

---

## 📞 Support Resources

### cPanel Documentation
- File Manager: Check your hosting provider's docs
- Domain Management: Contact your registrar
- SSL Certificates: Check cPanel SSL/TLS section

### External Services
- **Railway**: https://docs.railway.app
- **Render**: https://render.com/docs
- **Heroku**: https://devcenter.heroku.com

### Go Barry Specific
- Backend logs: Check your external service dashboard
- Frontend issues: Check browser console
- API problems: Test endpoints directly

---

## ✅ Deployment Checklist

### Pre-Deployment
- [ ] Domain pointing to cPanel server
- [ ] cPanel access confirmed
- [ ] SSL certificate available
- [ ] External backend service ready

### During Deployment
- [ ] Frontend build completed successfully
- [ ] Files uploaded to public_html
- [ ] .htaccess file in place
- [ ] Backend deployed to external service
- [ ] API subdomain configured

### Post-Deployment
- [ ] Frontend loads at gobarry.co.uk
- [ ] API responds at api.gobarry.co.uk
- [ ] HTTPS redirects working
- [ ] All pages/routes accessible
- [ ] Alerts loading correctly
- [ ] Mobile responsive

### Final Verification
- [ ] Test from different devices
- [ ] Check in multiple browsers
- [ ] Verify all functionality works
- [ ] Monitor for 24 hours

---

## 🎉 Success!

Your Go Barry application should now be live at:
- **🌐 Frontend**: https://gobarry.co.uk
- **🔗 API**: https://api.gobarry.co.uk

Enjoy your fully deployed traffic intelligence platform!
