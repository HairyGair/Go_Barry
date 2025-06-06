# Go Barry - Production Deployment

## 🎯 Quick Deployment Guide

### Frontend (Static Website)
1. **Build**: `cd frontend && npm run build:cpanel`
2. **Upload**: Upload contents of `cpanel-build/` to cPanel `public_html`
3. **Domain**: Configure `gobarry.co.uk` to point to your cPanel

### Backend (Node.js API)
1. **Upload**: Upload `backend/` files to cPanel Node.js app directory
2. **Configure**: Set up Node.js app in cPanel pointing to `api.gobarry.co.uk`
3. **Environment**: Copy `.env.production` to `.env` and update API keys
4. **Install**: Run `npm install` in cPanel or via SSH
5. **Start**: Start the Node.js application

### Testing
- **Frontend**: https://gobarry.co.uk
- **Backend**: https://api.gobarry.co.uk/api/health

## 📁 File Structure
```
production-deployment/
├── frontend/           # React/Expo web app
├── backend/           # Node.js API server
├── docs/             # Documentation
└── deploy-gobarry.sh # Automated deployment script
```

## 🔧 Configuration
- Frontend automatically detects `gobarry.co.uk` and uses `api.gobarry.co.uk`
- Backend requires API keys in `.env` file
- CORS configured for your domain
