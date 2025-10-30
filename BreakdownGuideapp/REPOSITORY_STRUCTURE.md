# Repository Structure - Breakdown Management System

## Overview

This document explains the git repository architecture for the Breakdown Management System, including the dual-repository setup, branch strategy, and how the repositories relate to each other.

---

## Dual Repository Architecture

The project uses a **dual-repository setup** with two separate GitHub repositories serving different purposes:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  Local Development Environment                         │
│  /Users/anthony/Go BARRY App/BreakdownGuideapp         │
│                                                         │
│  ┌──────────────┐              ┌──────────────┐       │
│  │              │   git push   │              │       │
│  │   origin     │◄─────────────│  Local Git   │       │
│  │  (Go_Barry)  │   origin     │  Repository  │       │
│  │              │              │              │       │
│  └──────────────┘              └──────┬───────┘       │
│       ▲                               │               │
│       │                               │ git push      │
│       │ Development                   │ breakdown     │
│       │ / Experimental                │               │
│       │                               ▼               │
│  ┌────┴──────────┐              ┌──────────────┐     │
│  │               │              │              │     │
│  │   Not used    │              │  breakdown   │     │
│  │ for deployment│              │(Breakdown_   │     │
│  │               │              │  Guide)      │     │
│  └───────────────┘              └──────┬───────┘     │
│                                         │             │
└─────────────────────────────────────────┼─────────────┘
                                          │
                                          │ Webhook
                                          ▼
                              ┌──────────────────────┐
                              │                      │
                              │   Render.com        │
                              │   (Production)      │
                              │                      │
                              │  breakdown-guide    │
                              │  .onrender.com      │
                              │                      │
                              └──────────────────────┘
```

---

## Repository Details

### 1. Origin Remote - Go_Barry Repository

**URL:** https://github.com/HairyGair/Go_Barry.git

**Purpose:**
- Historical development repository
- Contains legacy Go BARRY code (Bus Alerts and Roadworks Reporting)
- Feature branches and experimental work
- Code archival and version history

**Usage:**
```bash
# View origin remote
git remote -v | grep origin
# origin  https://github.com/HairyGair/Go_Barry.git (fetch)
# origin  https://github.com/HairyGair/Go_Barry.git (push)

# Push to origin (optional, for backup/development)
git push origin main
```

**Important:**
- **NOT connected to Render.com deployment**
- Safe for experimental changes
- Can be used for backup purposes
- Not monitored for production deployment

### 2. Breakdown Remote - Breakdown_Guide Repository

**URL:** https://github.com/HairyGair/Breakdown_Guide.git

**Purpose:**
- Production deployment source
- Connected to Render.com via webhook
- Contains stable, production-ready code
- Triggers automatic deployment on push

**Usage:**
```bash
# View breakdown remote
git remote -v | grep breakdown
# breakdown  https://github.com/HairyGair/Breakdown_Guide.git (fetch)
# breakdown  https://github.com/HairyGair/Breakdown_Guide.git (push)

# Push to breakdown (triggers Render deployment)
git push breakdown main
```

**Important:**
- **THIS IS THE DEPLOYMENT REPOSITORY**
- Connected to Render.com
- Only push production-ready code
- Triggers deployment on every push to `main` branch

---

## Git Remote Configuration

### Current Setup

```bash
# Check current remotes
$ git remote -v

breakdown	https://github.com/HairyGair/Breakdown_Guide.git (fetch)
breakdown	https://github.com/HairyGair/Breakdown_Guide.git (push)
origin	https://github.com/HairyGair/Go_Barry.git (fetch)
origin	https://github.com/HairyGair/Go_Barry.git (push)
```

### How Remotes Were Configured

```bash
# Origin was set during initial clone
git clone https://github.com/HairyGair/Go_Barry.git BreakdownGuideapp

# Breakdown remote was added later
cd BreakdownGuideapp
git remote add breakdown https://github.com/HairyGair/Breakdown_Guide.git
```

### Modifying Remotes (If Needed)

```bash
# Add a new remote
git remote add <name> <url>

# Remove a remote
git remote remove <name>

# Rename a remote
git remote rename <old-name> <new-name>

# Change remote URL
git remote set-url <name> <new-url>

# Verify changes
git remote -v
```

---

## Branch Strategy

### Main Branch

**Branch:** `main`

**Purpose:**
- Primary development and production branch
- All stable code merged here
- Protected branch (should be)
- Source for all deployments

**Current Branches:**
```bash
# View all branches
$ git branch -a

* main
  feature/operations-centre-admin-style
  temp-fix-branch
  remotes/breakdown/HEAD -> breakdown/main
  remotes/breakdown/main
  remotes/origin/HEAD -> origin/main
  remotes/origin/add-github-actions-1758971048426
  remotes/origin/codex/fix-syntaxerror-in-index.js
  remotes/origin/feature/operations-centre-admin-style
  remotes/origin/feature/supervisor-duty-selection
  remotes/origin/main
```

### Feature Branches

**Naming Convention:**
- `feature/*` - New features
- `fix/*` - Bug fixes
- `hotfix/*` - Critical production fixes
- `temp-*` - Temporary experiments

**Workflow:**
```bash
# Create feature branch
git checkout -b feature/new-dashboard

# Make changes
git add .
git commit -m "feat: Add new dashboard"

# Merge to main
git checkout main
git merge feature/new-dashboard

# Push to production
git push breakdown main

# Optional: push to origin for backup
git push origin main
```

### Branch Protection (Recommended Setup)

**On GitHub (Breakdown_Guide repository):**
1. Settings → Branches → Add rule
2. Branch name pattern: `main`
3. Enable:
   - Require pull request reviews (1 approval)
   - Require status checks to pass
   - Prevent force push
   - Prevent deletion

---

## Directory Structure

### Git Repository Root vs Working Directory

**IMPORTANT DISCOVERY (October 4, 2025):**

The git repository root is NOT at the BreakdownGuideapp directory level!

**Actual Git Root:**
```
/Users/anthony/Go BARRY App/           ← Git repository root (.git folder here)
└── BreakdownGuideapp/                 ← Project subdirectory
    ├── backend/                       # Node.js Express API
    ├── frontend/                      # React + Vite SPA
    ├── database/                      # SQL migrations
    ├── docs/                          # Documentation
    ├── tests/                         # E2E tests
    ├── breakdown-guide-deploy/        # Standalone deployment folder
    ├── render.yaml                    # Render.com config
    ├── README.md                      # Main documentation
    ├── DEPLOYMENT.md                  # Deployment guide
    └── REPOSITORY_STRUCTURE.md        # This file
```

**Critical Path Information:**
- Git commands must reference files with `BreakdownGuideapp/` prefix
- Example: `git show HEAD:BreakdownGuideapp/backend/routes/breakdownsAPI.js`
- Working directory: `/Users/anthony/Go BARRY App/BreakdownGuideapp/`
- Git directory: `/Users/anthony/Go BARRY App/.git/`

**Why This Matters:**
When using git commands from the `BreakdownGuideapp` subdirectory, you're actually in a subdirectory of the repository, not the root. This explains why:
- `git show HEAD:backend/routes/breakdownsAPI.js` returned different content (752 lines)
- `git show HEAD:BreakdownGuideapp/backend/routes/breakdownsAPI.js` shows correct content (1,525 lines)

### Breakdown Guide Deploy Folder

**Path:** `/Users/anthony/Go BARRY App/BreakdownGuideapp/breakdown-guide-deploy/`

**Purpose:**
- Standalone clone of `Breakdown_Guide` repository
- Clean production environment
- Alternative deployment workspace

**Git Configuration:**
```bash
$ cd breakdown-guide-deploy
$ git remote -v
origin	https://github.com/HairyGair/Breakdown_Guide.git (fetch)
origin	https://github.com/HairyGair/Breakdown_Guide.git (push)
```

**Usage:**
```bash
# Work in clean production environment
cd /Users/anthony/Go\ BARRY\ App/BreakdownGuideapp/breakdown-guide-deploy

# Pull latest production code
git pull origin main

# Make changes
# ...

# Push triggers Render deployment
git push origin main
```

**When to Use:**
- Testing deployment workflow in isolation
- Clean slate for production-only changes
- Separating development from deployment

---

## Workflow Examples

### Scenario 1: Regular Feature Deployment

```bash
# 1. Work in main project directory
cd /Users/anthony/Go\ BARRY\ App/BreakdownGuideapp

# 2. Make changes
# Edit files...

# 3. Stage and commit
git add .
git commit -m "feat: Add analytics dashboard"

# 4. Push to production (Render deployment)
git push breakdown main

# 5. Optional: backup to origin
git push origin main
```

### Scenario 2: Emergency Hotfix

```bash
# 1. Create hotfix branch
git checkout -b hotfix/critical-bug

# 2. Fix the issue
# Edit files...

# 3. Commit fix
git add .
git commit -m "hotfix: Fix critical authentication bug"

# 4. Merge to main
git checkout main
git merge hotfix/critical-bug

# 5. Deploy immediately
git push breakdown main

# 6. Clean up
git branch -d hotfix/critical-bug
```

### Scenario 3: Using Deployment Folder

```bash
# 1. Switch to deployment folder
cd /Users/anthony/Go\ BARRY\ App/BreakdownGuideapp/breakdown-guide-deploy

# 2. Ensure clean state
git status
git pull origin main

# 3. Make production-only changes
# Edit render.yaml, environment configs, etc.

# 4. Deploy
git add .
git commit -m "config: Update Render configuration"
git push origin main  # This triggers Render deployment
```

### Scenario 4: Syncing Both Repositories

```bash
# Keep both repos in sync with same changes
cd /Users/anthony/Go\ BARRY\ App/BreakdownGuideapp

# Make changes
git add .
git commit -m "feat: Add new feature"

# Push to both remotes
git push breakdown main  # Triggers Render deployment
git push origin main     # Updates development repo
```

---

## Common Git Operations

### Checking Remote Status

```bash
# View all remotes
git remote -v

# Show remote branch details
git remote show origin
git remote show breakdown

# List all branches (local + remote)
git branch -a

# See where branches are tracking
git branch -vv
```

### Viewing Commit History

```bash
# View commits on local main
git log --oneline -10

# View commits on breakdown/main (production)
git log breakdown/main --oneline -10

# View commits on origin/main (development)
git log origin/main --oneline -10

# Compare local with production
git log breakdown/main..main --oneline

# Visual branch history
git log --oneline --all --graph -20
```

### Fetching Updates

```bash
# Fetch from breakdown (production)
git fetch breakdown

# Fetch from origin (development)
git fetch origin

# Fetch from all remotes
git fetch --all

# Pull latest from production
git pull breakdown main

# Pull latest from development
git pull origin main
```

### Pushing to Remotes

```bash
# Push to breakdown (triggers deployment)
git push breakdown main

# Push to origin (backup/development)
git push origin main

# Push specific branch to breakdown
git push breakdown feature/new-feature

# Force push (use with extreme caution)
git push breakdown main --force
```

---

## Troubleshooting

### Issue: Pushed to Wrong Remote

**Problem:**
```bash
# Accidentally pushed to origin instead of breakdown
git push origin main
# Render didn't deploy!
```

**Solution:**
```bash
# Simply push to correct remote
git push breakdown main

# Verify deployment triggered
# Check Render dashboard
```

### Issue: Remote Not Found

**Problem:**
```bash
$ git push breakdown main
fatal: 'breakdown' does not appear to be a git repository
```

**Solution:**
```bash
# Check remotes
git remote -v

# If missing, add it
git remote add breakdown https://github.com/HairyGair/Breakdown_Guide.git

# Verify
git remote -v
```

### Issue: Diverged Branches

**Problem:**
```bash
$ git push breakdown main
! [rejected] main -> main (non-fast-forward)
```

**Solution:**
```bash
# Fetch remote changes
git fetch breakdown

# View differences
git log breakdown/main..main --oneline

# Merge remote changes
git pull breakdown main

# Resolve conflicts if any
# Then push
git push breakdown main
```

### Issue: Wrong Repository Cloned

**Problem:**
- Cloned `Go_Barry` but need `Breakdown_Guide`

**Solution:**
```bash
# Option 1: Add breakdown remote to existing repo
git remote add breakdown https://github.com/HairyGair/Breakdown_Guide.git
git fetch breakdown
git branch --set-upstream-to=breakdown/main main

# Option 2: Clone Breakdown_Guide separately
cd /Users/anthony/Go\ BARRY\ App
git clone https://github.com/HairyGair/Breakdown_Guide.git breakdown-guide-deploy
```

---

## Best Practices

### 1. Always Verify Remote Before Pushing

```bash
# Before pushing, check which remote you're using
git remote -v

# View recent pushes
git log --oneline -5

# Verify you're pushing to correct remote
git push breakdown main  # ✅ Correct for deployment
git push origin main     # ❌ Wrong for deployment
```

### 2. Keep Remotes in Sync

```bash
# After every production push, also backup to origin
git push breakdown main && git push origin main
```

### 3. Use Descriptive Commit Messages

```bash
# Good
git commit -m "feat: Add supervisor dashboard with real-time updates"
git commit -m "fix: Resolve authentication token expiry issue"
git commit -m "config: Update Render.com deployment settings"

# Bad
git commit -m "updates"
git commit -m "fix"
git commit -m "changes"
```

### 4. Branch for Features, Merge to Main

```bash
# Don't work directly on main for big features
git checkout -b feature/complex-feature
# Make changes
git commit -m "feat: Complex feature"
git checkout main
git merge feature/complex-feature
git push breakdown main
```

### 5. Test Before Deploying

```bash
# Always test locally first
cd backend && npm run dev
cd frontend && npm run dev

# Test critical features
# Then deploy
git push breakdown main
```

---

## Repository Relationship Diagram

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│              Local Git Repository                      │
│        /Users/anthony/Go BARRY App/                    │
│              BreakdownGuideapp                         │
│                                                         │
│  ┌──────────────────────────────────────────────┐     │
│  │                                              │     │
│  │  Working Directory (Files on Disk)          │     │
│  │  - backend/                                  │     │
│  │  - frontend/                                 │     │
│  │  - docs/                                     │     │
│  │  - etc.                                      │     │
│  │                                              │     │
│  └─────────────┬────────────────────────────────┘     │
│                │ git add / commit                     │
│                ▼                                       │
│  ┌─────────────────────────────────────────────┐     │
│  │                                              │     │
│  │  Local Git Repository (.git/)               │     │
│  │  - Commit history                            │     │
│  │  - Branches (main, feature/*, etc.)         │     │
│  │  - Remote tracking branches                  │     │
│  │                                              │     │
│  └───┬─────────────────────────┬────────────────┘     │
│      │                         │                       │
│      │ git push                │ git push              │
│      │ breakdown               │ origin                │
│      │                         │                       │
└──────┼─────────────────────────┼───────────────────────┘
       │                         │
       ▼                         ▼
┌──────────────────┐      ┌──────────────────┐
│                  │      │                  │
│  breakdown       │      │  origin          │
│  (Breakdown_     │      │  (Go_Barry)      │
│   Guide)         │      │                  │
│                  │      │                  │
│  GitHub Repo     │      │  GitHub Repo     │
│  FOR DEPLOYMENT  │      │  FOR DEVELOPMENT │
│                  │      │                  │
└────────┬─────────┘      └──────────────────┘
         │
         │ Webhook
         │ (on push to main)
         ▼
┌──────────────────────────┐
│                          │
│     Render.com          │
│     (Production)        │
│                          │
│  breakdown-guide        │
│  .onrender.com          │
│                          │
│  - Detects push         │
│  - Runs build           │
│  - Deploys to prod      │
│  - Health check         │
│                          │
└──────────────────────────┘
```

---

## Quick Reference Commands

```bash
# View remotes
git remote -v

# Check which remote branch you're tracking
git branch -vv

# See recent commits on each remote
git log breakdown/main --oneline -5
git log origin/main --oneline -5

# Deploy to production (most important command!)
git push breakdown main

# Backup to development repo
git push origin main

# Sync both repos at once
git push breakdown main && git push origin main

# Check deployment status
curl https://breakdown-guide.onrender.com/api/health-extended
```

---

## Related Documentation

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Complete deployment guide
- [README.md](./README.md) - Main project documentation
- [docs/SETUP.md](./docs/SETUP.md) - Local development setup
- [docs/API.md](./docs/API.md) - API documentation

---

## Support

**For repository structure questions:**
- Review this document
- Check git configuration: `git remote -v`
- Contact: anthony.gair@gonortheast.co.uk

**Last Updated:** October 2, 2025
**Version:** 2.0.0
