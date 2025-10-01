# Render Deployment Guide - Standalone Breakdown Guide

## 🚀 Deploy to Render (FREE Tier) - Single Service Architecture

This guide shows how to deploy the standalone Breakdown Guide system to Render's free tier using a single web service that serves both the API and frontend.

---

## 📋 Prerequisites

1. **GitHub Repository**: Your code must be in a GitHub repository
2. **Render Account**: Free account at [render.com](https://render.com)
3. **Supabase Project**: Database setup (see Supabase Setup section)

---

## 🏗️ Architecture Overview

**Single Service Deployment:**
- One Render Web Service serves both API and frontend
- Backend (Express) serves API routes at `/api/*`
- Backend serves frontend static files for all other routes
- Uses Render's free tier (no additional costs)

```
Render Web Service (FREE)
├── Express Server (Port 3000)
├── API Routes (/api/*)
├── Static File Serving (/)
└── SPA Routing (index.html fallback)
```

---

## 🔧 Step-by-Step Deployment

### Step 1: Prepare Your Repository

1. **Create GitHub Repository**
   ```bash
   # Navigate to your project
   cd "/Users/anthony/Go BARRY App/BreakdownGuideFrontendComplete"
   
   # Run the setup script
   ./setup-standalone-repo.sh
   
   # Navigate to the new repository
   cd "/Users/anthony/Go BARRY App/breakdown-guide-standalone"
   ```

2. **Push to GitHub**
   - Create a new **PRIVATE** repository on GitHub
   - Name it `breakdown-guide-system` or similar
   - Push your code:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/breakdown-guide-system.git
   git branch -M main
   git push -u origin main
   ```

### Step 2: Configure Environment Variables

Create `backend/.env` with your configuration:

```env
NODE_ENV=production
PORT=3000

# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_public_key

# Database
DATABASE_URL=your_supabase_postgres_url

# Security
JWT_SECRET=your_secure_random_string

# CORS (optional)
CORS_ORIGIN=https://your-app-name.onrender.com
```

### Step 3: Create Render Web Service

1. **Login to Render Dashboard**
   - Go to [dashboard.render.com](https://dashboard.render.com)
   - Login with GitHub

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select `breakdown-guide-system`

3. **Configure Build Settings**
   ```
   Name: breakdown-guide
   Region: Oregon (US-West)
   Branch: main
   Root Directory: (leave blank)
   
   Build Command:
   cd backend && npm install && cd ../frontend && npm install && npm run build && cp -r dist/* ../backend/public/
   
   Start Command:
   cd backend && npm start
   ```

4. **Configure Environment Variables**
   Add all variables from your `.env` file:
   - `NODE_ENV` = `production`
   - `PORT` = `3000`
   - `SUPABASE_URL` = `your_supabase_url`
   - `SUPABASE_SERVICE_KEY` = `your_service_key`
   - `SUPABASE_ANON_KEY` = `your_anon_key`
   - `DATABASE_URL` = `your_database_url`
   - `JWT_SECRET` = `generate_secure_random_string`

5. **Deploy**
   - Click "Create Web Service"
   - Render will automatically build and deploy

---

## 🗄️ Supabase Setup

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Note your project URL and API keys

### Step 2: Setup Database Schema

1. **Run Database Migration**
   - Go to Supabase SQL Editor
   - Run `backend/migrations/database-architecture-complete.sql`

2. **Setup Security Policies**
   - Run `backend/migrations/supabase-security-config.sql`

### Step 3: Configure Authentication

1. **Go to Authentication → Settings**
2. **Site URL**: `https://your-app-name.onrender.com`
3. **Redirect URLs**: Add your Render domain

---

## 📊 Monitoring & Maintenance

### Render Dashboard Monitoring

- **Logs**: Check build and runtime logs
- **Metrics**: Monitor CPU, memory, and bandwidth usage
- **Health**: Automatic health checks on `/api/health`

### Free Tier Limits

- **Hours**: 750 hours/month (enough for 24/7)
- **Bandwidth**: 100GB/month
- **Build Time**: 90 minutes/month
- **Sleep**: Services sleep after 15 min of inactivity

### Performance Tips

1. **Keep Service Awake**
   ```javascript
   // Add to your frontend (optional)
   setInterval(() => {
     fetch('/api/health').catch(() => {})
   }, 14 * 60 * 1000) // Every 14 minutes
   ```

2. **Optimize Bundle Size**
   - Frontend is already optimized with code splitting
   - Gzip compression enabled
   - Static file caching configured

---

## 🔍 Testing Deployment

### Automated Tests

```bash
# Test API endpoints
curl https://your-app-name.onrender.com/api/health

# Test frontend
curl https://your-app-name.onrender.com/
```

### Manual Testing

1. **Visit your app**: `https://your-app-name.onrender.com`
2. **Check API**: `https://your-app-name.onrender.com/api/health`
3. **Test login**: Use supervisor credentials
4. **Start assessment**: Test breakdown wizard flow

---

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures**
   ```
   Solution: Check build logs, ensure all dependencies in package.json
   ```

2. **Environment Variables**
   ```
   Solution: Verify all required env vars are set in Render dashboard
   ```

3. **Database Connection**
   ```
   Solution: Check Supabase URL and keys, verify network access
   ```

4. **Static Files Not Loading**
   ```
   Solution: Ensure build command copies frontend dist to backend/public
   ```

### Debug Commands

```bash
# Check server logs in Render dashboard
# Test locally before deploying:

# Start backend
cd backend && npm run dev

# Start frontend (separate terminal)
cd frontend && npm run dev

# Test API
curl http://localhost:3003/api/health
```

---

## 🔄 Updates & Maintenance

### Deploying Updates

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Update: description of changes"
   git push origin main
   ```

2. **Automatic Deployment**
   - Render automatically rebuilds on git push
   - Monitor deployment in Render dashboard

### Database Updates

1. **Schema Changes**
   - Add new migration SQL files
   - Run via Supabase SQL Editor
   - Update backend code as needed

2. **Data Migration**
   - Use Supabase dashboard for data management
   - Run scripts via SQL Editor

---

## 💰 Cost Optimization

### Free Tier Strategy

- **Single Service**: Keeps you within free limits
- **Efficient Bundling**: Reduces bandwidth usage
- **Smart Caching**: Reduces server load
- **Sleep Mode**: Saves hours when not in use

### Scaling Options

When ready to scale:
- **Paid Plans**: $7/month for always-on service
- **Database**: Supabase Pro $25/month
- **CDN**: Consider Cloudflare for global performance

---

## 📞 Support

### Resources

- **Render Docs**: [render.com/docs](https://render.com/docs)
- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **GitHub Issues**: Report problems in your repository

### Contacts

- **Technical**: anthony@gobarry.co.uk
- **Emergency**: Available 24/7 for critical issues

---

## ✅ Deployment Checklist

- [ ] GitHub repository created (private)
- [ ] Environment variables configured
- [ ] Supabase project setup
- [ ] Database schema installed
- [ ] Render web service created
- [ ] Build command configured correctly
- [ ] Environment variables added to Render
- [ ] Deployment successful
- [ ] API health check passes
- [ ] Frontend loads correctly
- [ ] Authentication works
- [ ] Wizard flow tested
- [ ] Monitoring configured

---

**🎉 Congratulations!** Your Breakdown Guide system is now deployed on Render's free tier with zero additional costs!

The system will automatically handle:
- API requests at `/api/*`
- Frontend serving for all other routes
- Static file caching and compression
- Automatic HTTPS via Render
- Health monitoring and logging