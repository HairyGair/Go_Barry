# Go Barry Domain Setup Guide
## Configuring gobarry.co.uk with Render

### Overview
This guide shows how to set up your custom domain `gobarry.co.uk` with the Go Barry application deployed on Render.

### Architecture
- **Frontend**: `gobarry.co.uk` → Render Static Site
- **Backend API**: `api.gobarry.co.uk` → Render Web Service

### Prerequisites
- Domain `gobarry.co.uk` owned and accessible
- Render account with deployment ready
- Access to DNS management for the domain

## Step 1: Deploy to Render

### 1.1 Run Deployment Script
```bash
cd "/Users/anthony/Go BARRY App"
./deploy-to-gobarry-domain.sh
```

### 1.2 Commit and Push
```bash
git add .
git commit -m "Configure for gobarry.co.uk domain"
git push origin main
```

### 1.3 Deploy on Render
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Connect your repository
3. Use the `render.yaml` file for automatic configuration
4. Deploy both services:
   - `go-barry` (Backend Web Service)
   - `barry-frontend` (Static Site)

## Step 2: Configure Custom Domains in Render

### 2.1 Backend Domain Setup
1. In Render Dashboard, go to your `go-barry` service
2. Go to "Settings" → "Custom Domains"
3. Add custom domain: `api.gobarry.co.uk`
4. Note the verification DNS record provided

### 2.2 Frontend Domain Setup
1. In Render Dashboard, go to your `barry-frontend` service
2. Go to "Settings" → "Custom Domains"
3. Add custom domain: `gobarry.co.uk`
4. Note the verification DNS record provided

## Step 3: DNS Configuration

### 3.1 Add DNS Records
In your domain registrar's DNS settings, add these records:

```dns
# Frontend
Type: CNAME
Name: @ (or gobarry.co.uk)
Value: [your-frontend-render-url].onrender.com

# Backend API
Type: CNAME
Name: api
Value: [your-backend-render-url].onrender.com

# Optional: WWW redirect
Type: CNAME
Name: www
Value: gobarry.co.uk
```

### 3.2 Verification
After adding DNS records:
1. Wait for DNS propagation (up to 24 hours)
2. Verify domains in Render Dashboard
3. Test the endpoints:
   - `https://gobarry.co.uk` (Frontend)
   - `https://api.gobarry.co.uk/api/health` (Backend)

## Step 4: SSL Certificates

Render automatically provides SSL certificates for custom domains:
- Certificates are issued via Let's Encrypt
- Automatic renewal
- HTTPS redirects are enabled by default

## Step 5: Environment Variables

### 5.1 Required Environment Variables in Render
Set these in the Render Dashboard for the `go-barry` service:

```env
NODE_ENV=production
NODE_OPTIONS=--max-old-space-size=2048 --optimize-for-size
PORT=10000

# API Keys (from your .env file)
TOMTOM_API_KEY=9rZJqtnfYpOzlqnypI97nFb5oX17SNzp
MAPQUEST_API_KEY=OeLAWVPNlgnBjW66iamoyiD5kEecJloN
HERE_API_KEY=Xo2Q-IQMOBERx3wCtl0o9Nc6VRVf4uCCJVUAfEbLxs
MAPBOX_API_KEY=pk.eyJ1IjoiaGFpcnlnYWlyMDAiLCJhIjoiY21iNWVsazl5MjFvbjJqc2I4ejBkZmdtZCJ9.CyLjZzGIuPsNFUCc1LlUyg
NATIONAL_HIGHWAYS_API_KEY=d2266b385f64d968f330969398b2961

# Database
SUPABASE_URL=https://haountnghecfrsoniubq.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhhb3VudG5naGVjZnJzb25pdWJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2NzgxNDksImV4cCI6MjA2MzI1NDE0OX0.xtjxeGkxG3cx67IvpI4XxEpWewLG9Bh6bfyQenfTILs

# CORS
CORS_ORIGIN=https://gobarry.co.uk,http://localhost:8081
RENDER_BACKEND_URL=https://api.gobarry.co.uk
PRODUCTION_DOMAIN=gobarry.co.uk
```

## Step 6: Testing Deployment

### 6.1 Health Checks
```bash
# Test backend health
curl https://api.gobarry.co.uk/api/health

# Test alerts endpoint
curl https://api.gobarry.co.uk/api/alerts

# Test enhanced alerts
curl https://api.gobarry.co.uk/api/alerts-enhanced
```

### 6.2 Frontend Testing
1. Visit `https://gobarry.co.uk`
2. Navigate to Alerts tab
3. Verify alerts are loading from the API
4. Check browser console for any errors

## Step 7: Monitoring and Maintenance

### 7.1 Render Monitoring
- Monitor service health in Render Dashboard
- Check logs for any errors
- Set up alerts for downtime

### 7.2 Domain Monitoring
- Verify SSL certificate renewal
- Monitor DNS propagation
- Check domain expiration dates

## Troubleshooting

### Issue: CORS Errors
- Ensure `CORS_ORIGIN` includes your domain
- Check that the domain is properly configured in Render

### Issue: DNS Not Resolving
- Verify DNS records are correct
- Wait for DNS propagation (up to 24 hours)
- Use DNS lookup tools to verify

### Issue: SSL Certificate Issues
- Ensure domain verification is complete in Render
- Check that DNS records point to Render

### Issue: API Not Responding
- Check Render service logs
- Verify environment variables are set
- Test endpoints directly

## Final Configuration Summary

When complete, your setup will be:
- ✅ **Frontend**: https://gobarry.co.uk
- ✅ **Backend**: https://api.gobarry.co.uk
- ✅ **SSL**: Automatic via Render + Let's Encrypt
- ✅ **DNS**: Custom domain with CNAME records
- ✅ **CORS**: Configured for your domain
- ✅ **Environment**: Production-ready with all API keys
