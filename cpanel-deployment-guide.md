# cPanel Deployment Guide for Breakdown Tracking System
**Created**: January 2025

## 📋 Pre-Upload Checklist

### 1. Files to Prepare
- [ ] Copy all files from `/public/breakdown-guide/` directory
- [ ] Copy `/public/enhanced-breakdown-dashboard.html`
- [ ] Include the new `cpanel-deployment-config.js`
- [ ] Update all JavaScript files to use production backend URL
- [ ] Remove any localhost references

### 2. Backend Verification
- [ ] Verify backend is running: https://go-barry.onrender.com/api/health-extended
- [ ] Test API endpoints are accessible
- [ ] Confirm Supabase database is connected

## 🚀 cPanel Upload Steps

### Step 1: Access cPanel File Manager
1. Log into your cPanel account
2. Navigate to **File Manager**
3. Go to `public_html` directory

### Step 2: Create Directory Structure
```
public_html/
├── breakdown/                    # Main breakdown system
│   ├── index.html                # Landing/redirect page
│   ├── guide.html                # Main breakdown guide
│   ├── config.js                 # Configuration file
│   ├── supervisorBreakdownLogger.js
│   ├── wizards/                  # All wizard files
│   │   ├── steering-wizard.js
│   │   ├── brakes-wizard.js
│   │   └── [other wizards...]
│   └── assets/
│       ├── css/
│       └── images/
└── dashboard/
    └── index.html                # Enhanced dashboard
```

### Step 3: Upload Files
1. Click **Upload** in cPanel File Manager
2. Select all prepared files
3. Upload to appropriate directories
4. Set permissions to 644 for files, 755 for directories

### Step 4: Create Landing Page
Create `public_html/breakdown/index.html`:
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Go North East - Breakdown Management System</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            padding: 40px;
            max-width: 600px;
            text-align: center;
        }
        h1 {
            color: #333;
            margin-bottom: 10px;
        }
        .subtitle {
            color: #666;
            margin-bottom: 30px;
        }
        .button-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-top: 30px;
        }
        .btn {
            background: #4F46E5;
            color: white;
            padding: 15px 30px;
            border-radius: 10px;
            text-decoration: none;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s;
            font-weight: 600;
        }
        .btn:hover {
            background: #4338CA;
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(79, 70, 229, 0.3);
        }
        .btn-dashboard {
            background: #10B981;
        }
        .btn-dashboard:hover {
            background: #059669;
        }
        .status {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            margin-top: 20px;
            padding: 10px;
            background: #F3F4F6;
            border-radius: 10px;
        }
        .status-dot {
            width: 10px;
            height: 10px;
            background: #10B981;
            border-radius: 50%;
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚌 Breakdown Management System</h1>
        <p class="subtitle">Go North East - Intelligent Vehicle Assessment Platform</p>
        
        <div class="button-grid">
            <a href="guide.html" class="btn">
                📋 Breakdown Guide
            </a>
            <a href="../dashboard/" class="btn btn-dashboard">
                📊 Live Dashboard
            </a>
        </div>
        
        <div class="status">
            <div class="status-dot"></div>
            <span>System Online - Connected to Go BARRY</span>
        </div>
    </div>
</body>
</html>
```

### Step 5: Update JavaScript Files
Add this to the top of `supervisorBreakdownLogger.js`:
```javascript
// Load configuration
const script = document.createElement('script');
script.src = 'config.js';
document.head.appendChild(script);

// Use CONFIG.BACKEND_URL instead of hardcoded URLs
const BACKEND_URL = window.CONFIG ? window.CONFIG.BACKEND_URL : 'https://go-barry.onrender.com';
```

## 🔐 Security Configuration

### Add .htaccess for Security
Create `.htaccess` in your breakdown directory:
```apache
# Enable HTTPS redirect
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Prevent directory browsing
Options -Indexes

# Cache static assets
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/jpg "access plus 1 month"
    ExpiresByType image/jpeg "access plus 1 month"
    ExpiresByType image/gif "access plus 1 month"
    ExpiresByType image/png "access plus 1 month"
    ExpiresByType text/css "access plus 1 week"
    ExpiresByType application/javascript "access plus 1 week"
</IfModule>

# Compress text files
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css application/javascript
</IfModule>
```

## 🧪 Post-Upload Testing

### 1. Test Breakdown Guide
- [ ] Access: `https://yourdomain.com/breakdown/guide.html`
- [ ] Verify supervisor login works
- [ ] Test a wizard workflow
- [ ] Confirm API calls reach backend

### 2. Test Dashboard
- [ ] Access: `https://yourdomain.com/dashboard/`
- [ ] Verify live breakdowns display
- [ ] Check auto-refresh (every 5 seconds)
- [ ] Test resolve functionality

### 3. Test Integration
- [ ] Start a breakdown in the guide
- [ ] Verify it appears on dashboard
- [ ] Complete diagnosis
- [ ] Check timer starts on dashboard
- [ ] Resolve breakdown
- [ ] Confirm removal from dashboard

## 🔧 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Backend needs to allow your domain
   - Contact backend admin to add domain to CORS whitelist

2. **404 Errors**
   - Check file paths are correct
   - Verify .htaccess rules

3. **API Connection Failed**
   - Verify backend is running
   - Check network tab for error details
   - Ensure HTTPS is used

4. **JavaScript Not Loading**
   - Check console for errors
   - Verify file permissions (644)
   - Clear browser cache

## 📞 Support Contacts

- **Backend Issues**: Check https://go-barry.onrender.com/api/health-extended
- **Database Issues**: Check Supabase dashboard
- **Convex Sync**: Check Convex dashboard at convex.dev

## 🎯 Success Criteria

Your deployment is successful when:
- ✅ Supervisors can log in and access wizards
- ✅ Breakdown assessments create records
- ✅ Dashboard shows live breakdowns
- ✅ Timers work correctly
- ✅ Resolution process functions
- ✅ Data syncs to backend

## 📊 URLs After Deployment

- **Main System**: `https://yourdomain.com/breakdown/`
- **Breakdown Guide**: `https://yourdomain.com/breakdown/guide.html`
- **Live Dashboard**: `https://yourdomain.com/dashboard/`
- **Backend API**: `https://go-barry.onrender.com/api/breakdowns`

---
**Note**: Replace `yourdomain.com` with your actual domain name