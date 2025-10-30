# Development Guide

---

## ⚠️ **LEGACY DOCUMENTATION - SUPABASE MIGRATION** ⚠️

**This document describes the OLD architecture using Supabase.**

**System Status:** ✅ **Migrated to MySQL (October 2025)**

**Current Information:**
- ✅ Database: MySQL (cPanel)
- ✅ Authentication: JWT + bcrypt
- ✅ Real-time: Native WebSocket (ws library)
- ✅ Deployment: cPanel self-hosted

**For current documentation, see:**
- Main Guide: `docs/CPANEL_ONLY_DEPLOYMENT_GUIDE.md`
- Quick Start: `docs/CPANEL_QUICK_START_10MIN.md`
- Master Index: `docs/MASTER_CPANEL_DOCUMENTATION_INDEX.md`

**Last Updated:** October 27, 2025 - Supabase fully removed

---

This file provides development guidelines for the Breakdown Management System.

## 📚 Essential Documentation to Read First

Before starting any task, please read these files to understand the system:

1. **README.md** - System overview, architecture, and deployment info
2. **DEPLOYMENT.md** - Dual repository setup and deployment workflow
3. **API_REFERENCE.md** - Complete API endpoint documentation
4. **SYSTEM_STATUS.md** - Current production status and features

## 🏗️ Project Architecture

### Technology Stack
- **Backend**: Node.js + Express (ES6 modules)
- **Frontend**: React + Vite
- **Database**: Supabase PostgreSQL
- **Auth**: Supabase Auth (JWT)
- **Real-time**: WebSocket (ws)

### Production URLs
- **Backend API**: https://breakdown-guide.onrender.com
- **Frontend**: https://breakdowns.gobarry.co.uk
- **Database**: Supabase Project `oieliubbvvdzhzvikzal`

### Git Repository Setup (CRITICAL!)
This project uses TWO git remotes:

```bash
# ✅ PRODUCTION - Always push here for deployment
git push breakdown main    # → https://github.com/HairyGair/Breakdown_Guide

# ❌ LEGACY - Development only, NOT for deployment
git push origin main       # → https://github.com/HairyGair/Go_Barry
```

**Important**: Render.com watches the `breakdown` remote. Always push to `breakdown main` for production deployment.

## 🔑 Key File Locations

### Backend (`/backend/`)
- Routes: `/backend/routes/`
- Services: `/backend/services/`
- Middleware: `/backend/middleware/`
- Data: `/backend/data/` (JSON files for breakdowns, activities)

### Frontend (`/frontend/`)
- Dashboards: `/frontend/src/dashboards/`
- Components: `/frontend/src/components/`
- API Client: `/frontend/src/services/apiClient.js`
- Utils: `/frontend/src/utils/`

## 📝 Development Guidelines

### Before Making Changes
1. Read relevant documentation files (README.md, API_REFERENCE.md, etc.)
2. Check current system status in SYSTEM_STATUS.md
3. Review deployment workflow in DEPLOYMENT.md
4. Verify you understand the dual-repository setup

### Code Standards
- **Backend**: ES6 modules (`import`/`export`), NO CommonJS (`require`)
- **Backend Port**: 3002 (production), 3001 (development)
- **Authentication**: All `/api/breakdowns/*` routes require supervisor auth
- **WebSocket**: Real-time updates on port 3002 at `/ws`

### Deployment Workflow
1. Make changes locally
2. Test thoroughly
3. Commit with descriptive message
4. **Push to `breakdown` remote**: `git push breakdown main`
5. Render auto-deploys in 2-3 minutes

## 🚨 Common Mistakes to Avoid

1. **Wrong Git Remote**: Pushing to `origin` instead of `breakdown`
2. **CommonJS Syntax**: Using `require()` in backend (use `import`)
3. **Wrong Port**: Backend runs on 3002, not 3001
4. **Missing Auth**: Forgetting supervisor authentication on protected routes
5. **File Paths**: Backend uses ES6 modules, so `__dirname` needs special handling

## 🔐 Authentication Context

- **Supervisor Auth**: JWT tokens from Supabase
- **Middleware**: `authenticateSupervisor` for `/api/breakdowns/*`
- **SDC Auth**: Separate `authenticateSDC` for SDC-specific routes
- **Development Bypass**: Set `NODE_ENV=development` for auth bypass

## 🛠️ Useful Commands

### Development
```bash
# Backend
cd backend && npm run dev              # Start with nodemon

# Frontend
cd frontend && npm run dev             # Start Vite dev server
```

### Deployment
```bash
# Deploy to production
git add .
git commit -m "description"
git push breakdown main                # Triggers Render deployment
```

### Database
- Supabase Dashboard: https://app.supabase.com/project/oieliubbvvdzhzvikzal
- Direct Connection: Available via Supabase environment variables

## 📊 Current Production Stats
- **Active Users**: 13 supervisors
- **Depots**: 6 (Washington, Riverside, Consett, Deptford, Percy Main, Hexham)
- **Fleet Size**: 1,000+ vehicles
- **Uptime**: 99.5%
- **API Latency**: <500ms average

## 💡 Development Tips

1. **Always check documentation first** - Read README.md and relevant .md files before coding
2. **Verify git remote** - Use `git remote -v` to confirm you're pushing to the right repo
3. **Check current deployment** - Review Render logs to see what's actually deployed
4. **Test locally first** - Run backend on :3002 and frontend on dev server
5. **Use the correct auth** - Supervisor routes need `authenticateSupervisor` middleware

## 🔒 Intellectual Property Protection

This codebase is protected by copyright and proprietary licensing. All developers must adhere to IP protection measures.

### Copyright Notices
All key source files include copyright headers:
```javascript
/**
 * Go BARRY Breakdown Management System
 *
 * Copyright © 2025 Anthony Gair. All Rights Reserved.
 *
 * This software is proprietary and confidential. Unauthorized copying,
 * distribution, modification, or use is strictly prohibited.
 *
 * @author Anthony Gair
 * @version 2.0.0
 * @license Proprietary
 */
```

**When creating new files**, always include the appropriate copyright header at the top.

### Proprietary License
See `/LICENSE.md` for full terms and conditions. Key points:
- Software is licensed (NOT sold) to Go North East
- No copying, modification, or distribution allowed
- All reverse engineering prohibited
- Trade secret protections apply
- Confidentiality requirements enforced

### Code Obfuscation (Production Builds)
Frontend builds are obfuscated via Vite + Terser configuration:

**Security Measures in `/frontend/vite.config.js`:**
- ✅ Source maps disabled (`sourcemap: false`)
- ✅ Console statements stripped (`drop_console: true`)
- ✅ Variable names mangled (`mangle: { toplevel: true }`)
- ✅ Comments removed (`format: { comments: false }`)
- ✅ Output filenames obfuscated with hashes

**Build Command:**
```bash
cd frontend && npm run build
```

**Production artifacts** in `/frontend/dist/` are fully minified and obfuscated.

### Deployment Security
- Never commit API keys or credentials
- Never expose source maps in production
- Review all console logs before deployment
- Backend environment variables stored securely in Render
- Frontend environment variables injected at build time

### IP Violation Response
If you become aware of unauthorized copying, modification, or distribution:
1. Document the violation with screenshots/evidence
2. Contact Anthony Gair immediately
3. Do NOT engage with the violator directly
4. Preserve all evidence for legal proceedings

---

**Last Updated**: October 9, 2025
**Maintained By**: Anthony Gair
**Organization**: Go North East
