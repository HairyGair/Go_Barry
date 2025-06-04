# BARRY Traffic Intelligence - Render Deployment Guide

## 🚀 Deploy to Render

This guide will help you deploy both the backend API and frontend web app to Render.com.

### Prerequisites

1. **Render Account**: Sign up at [render.com](https://render.com)
2. **GitHub Repository**: Push your code to GitHub
3. **API Keys**: Get keys from TomTom, MapQuest, HERE, National Highways

### 📡 Backend Deployment

The backend will be deployed as a **Web Service** on Render.

#### Environment Variables Needed:
```
TOMTOM_API_KEY=your_tomtom_key
MAPQUEST_API_KEY=your_mapquest_key  
HERE_API_KEY=your_here_key
NATIONAL_HIGHWAYS_API_KEY=your_national_highways_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
NODE_ENV=production
PORT=10000
```

#### Backend Features:
- ✅ Real-time traffic data from TomTom, MapQuest, HERE
- ✅ Enhanced location processing with OpenStreetMap
- ✅ GTFS route matching (231 Go North East routes)
- ✅ Supervisor accountability system
- ✅ Alert dismissal and note-taking
- ✅ Health monitoring and statistics

### 🌐 Frontend Deployment

The frontend will be deployed as a **Static Site** using Expo Web.

#### Features:
- ✅ Enhanced Traffic Dashboard
- ✅ Real-time alert monitoring
- ✅ Route impact analysis
- ✅ Supervisor login and management
- ✅ Mobile-responsive design
- ✅ PWA capabilities

### 🔧 Deployment Steps

#### Option 1: Automatic Deployment (Recommended)

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin main
   ```

2. **Connect to Render**:
   - Go to [render.com/dashboard](https://render.com/dashboard)
   - Click "New +" → "Blueprint"
   - Connect your GitHub repository
   - Render will automatically detect the `render.yaml` file

3. **Configure Environment Variables**:
   - In the Render dashboard, go to your backend service
   - Add all the environment variables listed above
   - Save and deploy

#### Option 2: Manual Deployment

**Backend:**
1. Create new Web Service on Render
2. Connect GitHub repo
3. Set build command: `cd backend && npm install`
4. Set start command: `cd backend && npm start`
5. Add environment variables

**Frontend:**
1. Create new Static Site on Render
2. Connect same GitHub repo
3. Set build command: `cd Go_BARRY && npm install && npm run build:web`
4. Set publish directory: `Go_BARRY/dist`

### 🌍 Production URLs

After deployment, your services will be available at:
- **Backend API**: `https://barry-backend.onrender.com`
- **Frontend Web App**: `https://barry-frontend.onrender.com`

### 📱 Mobile App

The React Native mobile app can still be developed locally:
```bash
cd Go_BARRY
expo start
```

### 🔍 API Endpoints

Once deployed, test these endpoints:
- Health: `https://barry-backend.onrender.com/api/health`
- Alerts: `https://barry-backend.onrender.com/api/alerts-enhanced`
- Config: `https://barry-backend.onrender.com/api/config`

### 🛠️ Local Development

To continue local development after deployment:
```bash
# Backend
cd backend
npm run dev

# Frontend  
cd Go_BARRY
expo start
```

### 📊 Features Overview

#### Backend Services:
- **TomTom Traffic API**: Real-time incident data
- **MapQuest Traffic**: Enhanced location processing  
- **OpenStreetMap**: Geocoding and street names
- **GTFS Integration**: 231 Go North East bus routes
- **Supervisor System**: Accountability and alert management

#### Frontend Dashboard:
- **Real-time Monitoring**: Live traffic alerts
- **Enhanced Intelligence**: Location accuracy indicators
- **Route Analysis**: Bus route impact assessment
- **Supervisor Mode**: Staff accountability features
- **Mobile Responsive**: Works on all devices

### 🔒 Security

- Environment variables are securely stored in Render
- API keys are not exposed in the frontend
- CORS properly configured for production
- Data persistence with file-based storage

### 📞 Support

If you encounter issues:
1. Check Render deployment logs
2. Verify environment variables are set
3. Test API endpoints individually
4. Check CORS configuration

### 🎯 Next Steps

After deployment:
1. Test all features in production
2. Monitor performance and logs
3. Set up custom domain (optional)
4. Configure CI/CD for automatic deployments
5. Add monitoring and alerting
