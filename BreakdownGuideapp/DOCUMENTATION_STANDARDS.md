# Documentation Standards

**Last Updated:** October 30, 2025
**Purpose:** Maintain clean, organized documentation after October 2025 cleanup
**Audience:** AI Assistants & Developers

---

## 🚫 Critical Rule: NO NEW .md FILES

### For AI Assistants (Claude, GPT, Copilot, etc.)

**YOU ARE STRICTLY PROHIBITED FROM CREATING NEW .md FILES.**

This is not a suggestion—it is a **hard rule** to maintain the clean documentation structure achieved through extensive cleanup.

### Why This Rule Exists

**October 30, 2025 Cleanup:**
- Removed **115+ legacy documentation files** from the project
- Reduced root directory from **83 to 50** .md files (38% reduction)
- Cleaned production cPanel from **120+ to 17** files (86% reduction)
- Archived 87 files in organized structure
- Verified all systems operational

**Problem Before Cleanup:**
- Documentation files created without oversight
- Multiple files covering same topics
- Outdated migration guides mixed with current docs
- Difficult to find accurate information
- Confusing for new developers

**Solution:**
- Strict control over documentation creation
- Update existing docs instead of creating new ones
- Clear ownership of each documentation file
- Regular maintenance of existing files

---

## ✅ What TO Do Instead

### 1. Update Existing Documentation

**When you need to document something:**

**Step 1:** Identify the appropriate existing file:
- Code architecture? → **CLAUDE.md** or **ARCHITECTURE.md**
- Deployment process? → **DEPLOYMENT.md**
- Development workflow? → **DEVELOPMENT.md**
- API changes? → **API_DOCUMENTATION.md**
- Database changes? → **DATABASE_ANALYSIS_REPORT.md**

**Step 2:** Read the existing file first using the Read tool

**Step 3:** Update the relevant section using the Edit tool

**Step 4:** Update the "Last Updated" date at the top of the file

**Example:**
```
# WRONG ❌
Create new file: DUTY_SELECTION_FEATURE.md

# RIGHT ✅
Update CLAUDE.md section: "Recent System Changes"
Add details about duty selection feature
Update "Last Updated: October 30, 2025"
```

### 2. Add Inline Code Comments

For complex code logic, add comments directly in the code:

```javascript
// ✅ Good - Document in code
/**
 * Duty Selection Flow
 * 1. User logs in with email/password
 * 2. Modal appears with duty options (100/200/400/500)
 * 3. POST to /api/auth/set-duty
 * 4. Duty badge appears in navigation
 */
async function handleDutySelection(duty) {
  // ... code here
}
```

```markdown
❌ Bad - Create new .md file
Create: DUTY_SELECTION_IMPLEMENTATION.md
```

### 3. Use Git Commit Messages

Document changes in detailed commit messages:

```bash
# ✅ Good commit message
git commit -m "feat: Add duty selection modal after login

- Created DutySelectionModal.jsx component
- Added POST /api/auth/set-duty endpoint
- Integrated modal in App.jsx with useEffect
- Duty badge now shows in navigation
- Updated CLAUDE.md with implementation details"
```

### 4. Ask First

If you genuinely believe a new .md file is necessary:

**Ask the user:**
> "I believe we need new documentation for [TOPIC]. Should I:
> A) Update existing [FILE.md] with this information
> B) Add inline comments to the code
> C) Create a new [NEW_FILE.md] (requires your approval)"

**Only create if user explicitly says "yes, create [FILENAME].md"**

---

## 📋 Essential Documentation Files

### Core Documentation (Never Delete)

**1. CLAUDE.md** - AI Assistant Guide
- **Purpose:** Complete project context for AI assistants
- **Update:** When adding new features, changing architecture, or fixing major bugs
- **Owner:** Anthony Gair

**2. README.md** - Project Overview
- **Purpose:** Quick start guide for new developers
- **Update:** When setup process changes, tech stack changes, or deployment changes
- **Owner:** Anthony Gair

**3. DEPLOYMENT.md** - Deployment Guide
- **Purpose:** Step-by-step deployment instructions
- **Update:** When deployment process changes
- **Owner:** Anthony Gair

**4. DEVELOPMENT.md** - Development Guide
- **Purpose:** Local development setup and workflow
- **Update:** When development process changes
- **Owner:** Anthony Gair

**5. PROJECT_GOALS.md** - Objectives & Roadmap
- **Purpose:** Project vision, goals, and future plans
- **Update:** Quarterly or when priorities change
- **Owner:** Anthony Gair

### Technical Documentation (Keep Current)

**6. ARCHITECTURE.md** - System Architecture
- **Purpose:** High-level system design
- **Update:** When architecture changes significantly

**7. DATABASE_ANALYSIS_REPORT.md** - Database Schema
- **Purpose:** Complete database documentation
- **Update:** When schema changes (migrations)

**8. API_DOCUMENTATION.md** - API Reference
- **Purpose:** Complete API endpoint documentation
- **Update:** When endpoints added/changed/removed

### Deployment Documentation (Keep Updated)

**9. CPANEL_ONLY_DEPLOYMENT_GUIDE.md** - Primary Deployment
- **Purpose:** Complete cPanel deployment process
- **Update:** When deployment steps change

**10. CPANEL_QUICK_START_10MIN.md** - Quick Deploy
- **Purpose:** Fast deployment for urgent fixes
- **Update:** Keep in sync with main guide

### Historical Documentation (Archive, Don't Update)

Files in `docs/archive/` are preserved for historical reference:
- `docs/archive/2025-migration/` - Migration documentation
- `docs/archive/deployment-old/` - Old deployment guides
- `docs/archive/fixes/` - Historical fix summaries
- `docs/archive/backend-old/` - Old backend documentation

**DO NOT update archived files** - they are historical snapshots.

---

## 🔄 Documentation Update Process

### When Making Code Changes

**Minor changes** (bug fixes, small features):
1. Add inline comments if code is complex
2. Update git commit message with details
3. No documentation update needed

**Major changes** (new features, architecture changes):
1. Update relevant .md file (CLAUDE.md, DEPLOYMENT.md, etc.)
2. Update "Last Updated" date
3. Add to "Recent System Changes" section in CLAUDE.md
4. Detailed git commit message
5. Commit documentation changes separately

### Example: Adding New Feature

```bash
# 1. Implement the feature
# ... code changes ...

# 2. Update CLAUDE.md
# Edit CLAUDE.md → Add to "Recent System Changes"
# Update "Last Updated: October 30, 2025"

# 3. Commit code
git add backend/routes/new-feature.js
git commit -m "feat: Add new feature XYZ"

# 4. Commit documentation
git add CLAUDE.md
git commit -m "docs: Update CLAUDE.md with new feature XYZ details"

# 5. Push
git push origin main
```

### What to Document

**Document:**
- ✅ New features and how they work
- ✅ Architecture changes
- ✅ API endpoint changes
- ✅ Database schema changes
- ✅ Deployment process changes
- ✅ Configuration changes
- ✅ Known issues and workarounds

**Don't Document:**
- ❌ Temporary status updates ("working on X")
- ❌ Action items ("TODO: fix Y")
- ❌ Personal notes
- ❌ Debugging logs
- ❌ Test results (unless critical)

---

## ❌ Forbidden Patterns

### DO NOT Create These Types of Files

**Status Files:**
- ❌ FEATURE_X_STATUS.md
- ❌ IMPLEMENTATION_PROGRESS.md
- ❌ CURRENT_WORK.md
- ❌ TODO_LIST.md

**Instead:** Use git commit messages and project management tools

**Fix Summaries:**
- ❌ BUG_FIX_SUMMARY.md
- ❌ QUICK_FIX_GUIDE.md
- ❌ URGENT_FIX.md

**Instead:** Update TROUBLESHOOTING section in CLAUDE.md

**Temporary Guides:**
- ❌ DEPLOY_NOW.md
- ❌ SETUP_NOW.md
- ❌ TEST_THIS.md

**Instead:** Update DEPLOYMENT.md or DEVELOPMENT.md

**Versioned Duplicates:**
- ❌ DEPLOYMENT_V1.md
- ❌ DEPLOYMENT_V2.md
- ❌ API_DOCS_OLD.md

**Instead:** Update existing file in place, git history preserves old versions

**Analysis Reports:**
- ❌ ANALYSIS_REPORT_20251030.md
- ❌ REVIEW_SUMMARY.md
- ❌ AUDIT_RESULTS.md

**Instead:** Add findings to relevant existing documentation

---

## ✅ When New Files ARE Allowed

### Explicit User Request

User says: **"Create a new file called SECURITY_POLICY.md"**
- ✅ Create the file as requested
- ✅ Follow naming conventions
- ✅ Keep it focused and concise

### New Major System Component

Adding a completely new system that doesn't fit existing docs:
- ✅ Ask user first: "Should I create [COMPONENT_NAME].md?"
- ✅ Only create if approved
- ✅ Update CLAUDE.md with link to new file

### Official Standards/Policies

New company-wide standards that need separate documentation:
- ✅ SECURITY_POLICY.md
- ✅ CODE_OF_CONDUCT.md
- ✅ CONTRIBUTING.md
- ✅ LICENSE.md

**But ask first!**

---

## 📊 Documentation Health Metrics

### Current State (Post-Cleanup)

**Root Directory:**
- Total .md files: 50 (down from 83)
- Essential files: 10
- Technical docs: 15
- Deployment guides: 10
- Historical/archive: 15

**Backend Directory:**
- Total files: 17 (down from 120+)
- Active code only
- No documentation clutter

**Quality Indicators:**
- ✅ Each topic has ONE authoritative file
- ✅ No duplicate content
- ✅ Clear ownership
- ✅ Regular updates
- ✅ Accurate information
- ✅ Easy to navigate

### Red Flags (Don't Let These Happen)

**Warning Signs:**
- ❌ Multiple files with similar names
- ❌ *_STATUS.md or *_SUMMARY.md files
- ❌ Dated filenames (*_20251030.md)
- ❌ Version suffixes (*_V1.md, *_V2.md)
- ❌ "URGENT" or "NOW" in filenames
- ❌ More than 60 .md files in root

**If you see these, it means cleanup is needed again.**

---

## 🎯 Success Criteria

**Good Documentation:**
- ✅ Single source of truth for each topic
- ✅ Always up-to-date
- ✅ Easy to find information
- ✅ No duplicates or conflicts
- ✅ Clear ownership
- ✅ Regularly maintained

**Bad Documentation:**
- ❌ Multiple files on same topic
- ❌ Outdated information
- ❌ Conflicting guidance
- ❌ Temporary status files
- ❌ Unclear ownership
- ❌ Rarely updated

---

## 📞 Questions?

**For AI Assistants:**
- If unsure, **ask the user** before creating any .md file
- Default to **updating existing files**
- When in doubt, **add inline comments** instead

**For Developers:**
- Read this file before creating documentation
- Follow the update process
- Keep documentation clean and organized
- Delete temporary files after use

---

## 🔄 Maintenance

**Monthly Review:**
- Check for duplicate files
- Remove outdated temporary files
- Update key documentation with recent changes
- Verify all links still work

**Quarterly Cleanup:**
- Archive old documentation if needed
- Review and update all essential files
- Remove any accumulated clutter
- Update this standards file if needed

---

**Last Updated:** October 30, 2025
**Next Review:** November 30, 2025
**Owner:** Anthony Gair
**Status:** Active and Enforced ✅
