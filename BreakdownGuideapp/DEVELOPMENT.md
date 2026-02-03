# Development Guide - Go BARRY Breakdown Management System

**Document Version:** 2.2
**Last Updated:** November 11, 2025 (Professional Design System v1.0)
**Target Audience:** Developers, AI Assistants, Future Maintainers

---

## ⚠️ CRITICAL: Documentation Rules

**For AI Assistants:** Before making ANY changes, read **[DOCUMENTATION_STANDARDS.md](./DOCUMENTATION_STANDARDS.md)**

**Key Rules:**
1. 🚫 **DO NOT create new .md files** without explicit user approval
2. ✅ **DO update existing documentation** when making significant changes
3. ✅ **DO add inline comments** for complex code logic
4. ✅ **DO ask first** if you think new documentation is needed

**October 30, 2025 Cleanup:**
- Removed 115+ legacy documentation files
- Cleaned local repository (38% reduction)
- Cleaned production cPanel (86% reduction)
- All systems verified operational

See **[CLAUDE.md](./CLAUDE.md)** for complete cleanup details.

---

## 📋 Table of Contents

1. [Documentation Guidelines](#documentation-guidelines)
2. [Design System Guide](#design-system-guide)
3. [Development Environment Setup](#development-environment-setup)
4. [Project Structure](#project-structure)
5. [Code Standards](#code-standards)
6. [Development Workflow](#development-workflow)
7. [Testing Guidelines](#testing-guidelines)
8. [Deployment Process](#deployment-process)
9. [Common Tasks](#common-tasks)
10. [Troubleshooting](#troubleshooting)
11. [Best Practices](#best-practices)

---

## 📚 Documentation Guidelines

### When to Update Documentation

**Always update documentation when:**
- Adding new features or major functionality
- Changing architecture or tech stack
- Modifying API endpoints
- Updating database schema
- Changing deployment process
- Fixing critical bugs with workarounds

**Which files to update:**
- **CLAUDE.md** - Add to "Recent System Changes" for significant features
- **README.md** - Update if setup process changes
- **DEPLOYMENT.md** - Update if deployment process changes
- **DEVELOPMENT.md** (this file) - Update if development workflow changes

### How to Update Documentation

**Step 1:** Read the existing file first
```bash
# Use Read tool or cat command
cat CLAUDE.md
```

**Step 2:** Find the relevant section
- Look for existing section that covers this topic
- Don't create duplicate sections

**Step 3:** Update inline using Edit tool
- Make precise edits to existing content
- Don't delete and rewrite entire sections

**Step 4:** Update "Last Updated" date
- Change date at top of file
- Add note in parentheses if significant (e.g., "Post-Cleanup")

**Step 5:** Commit documentation separately
```bash
git add CLAUDE.md
git commit -m "docs: Update CLAUDE.md with feature X details"
```

### What NOT to Do

**🚫 Never:**
- Create new .md files without explicit user request
- Create temporary status files (*_STATUS.md, *_SUMMARY.md)
- Create versioned duplicates (*_V1.md, *_V2.md)
- Create dated files (*_20251030.md)
- Create "URGENT" or "NOW" files

**✅ Instead:**
- Update existing relevant documentation
- Add inline code comments
- Use detailed git commit messages
- Ask user if genuinely need new file

---

## 🎨 Design System Guide

The application uses a comprehensive professional design system implemented with CSS variables (design tokens). All developers should use this system for new components.

### Quick Start with Design Tokens

**1. File Locations:**
- `frontend/src/styles/design-tokens.css` - All CSS variables (150+ tokens)
- `frontend/src/styles/components.css` - Pre-built component classes (40+ classes)
- `DESIGN_SYSTEM.md` - Complete design system documentation
- `frontend/DESIGN_TOKENS_QUICK_REFERENCE.md` - Quick reference for developers

**2. Using Design Tokens in CSS:**
```css
/* ✅ CORRECT - Use design tokens */
.my-component {
  color: var(--color-text-primary);
  padding: var(--spacing-lg);
  background: var(--color-red-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  transition: all var(--transition-base);
}

/* ❌ WRONG - Don't hardcode values */
.my-component {
  color: #111827;              /* Use token instead */
  padding: 24px;               /* Use var(--spacing-lg) */
  background: #E30613;         /* Use var(--color-red-primary) */
  border-radius: 12px;         /* Use var(--radius-lg) */
  box-shadow: 0 4px 6px ...;   /* Use var(--shadow-md) */
}
```

**3. Using Pre-Built Component Classes:**
```html
<!-- Buttons -->
<button class="btn btn-primary">Primary Action</button>
<button class="btn btn-secondary">Secondary Action</button>
<button class="btn btn-danger btn-lg">Delete (Large)</button>

<!-- Cards -->
<div class="card card--glass">
  <div class="card-header">
    <h3>Card Title</h3>
  </div>
  <div class="card-body">Content here</div>
</div>

<!-- Forms -->
<div class="form-group">
  <label class="form-label required">Name</label>
  <input class="form-input" type="text" />
  <span class="form-help">Helper text</span>
</div>

<!-- Layout -->
<div class="flex flex-between flex-gap-lg">
  <div>Left side</div>
  <div>Right side</div>
</div>

<div class="grid grid-4 grid-gap-lg">
  <div class="card">Item 1</div>
  <div class="card">Item 2</div>
  <div class="card">Item 3</div>
  <div class="card">Item 4</div>
</div>
```

### Color Tokens

**Brand Colors:**
- `var(--color-red-primary)` - the operator red (#E30613)
- `var(--color-navy-primary)` - Navy blue (#003B5C)

**Status Colors:**
- `var(--color-success)` - Green for success (#10B981)
- `var(--color-warning)` - Amber for warning (#F59E0B)
- `var(--color-critical)` - Red for errors (#DC2626)
- `var(--color-info)` - Blue for information (#3B82F6)

**Text Colors:**
- `var(--color-text-primary)` - Main text (#111827)
- `var(--color-text-secondary)` - Secondary text (#6B7280)
- `var(--color-text-tertiary)` - Muted text (#9CA3AF)
- `var(--color-text-inverse)` - White text (#FFFFFF)

### Spacing Tokens

```css
var(--spacing-xs)    /* 4px - micro spacing */
var(--spacing-sm)    /* 8px - small spacing */
var(--spacing-md)    /* 16px - standard padding */
var(--spacing-lg)    /* 24px - large spacing */
var(--spacing-xl)    /* 32px - extra large */
var(--spacing-2xl)   /* 48px - 2x large */
var(--spacing-3xl)   /* 64px - 3x large */
```

### Shadow Tokens

```css
var(--shadow-sm)     /* Subtle shadow */
var(--shadow-md)     /* Medium shadow */
var(--shadow-lg)     /* Large shadow */
var(--shadow-hover)  /* Hover lift effect */
var(--shadow-lift)   /* Lifting effect */
```

### Border Radius Tokens

```css
var(--radius-sm)     /* 4px - small elements */
var(--radius-md)     /* 8px - standard components */
var(--radius-lg)     /* 12px - cards and modals */
var(--radius-xl)     /* 16px - large containers */
var(--radius-full)   /* 9999px - fully rounded pills */
```

### Transition Tokens

```css
var(--transition-fast)      /* 150ms - quick feedback */
var(--transition-base)      /* 200ms - standard animation */
var(--transition-slow)      /* 300ms - smooth motion */
var(--transition-slowest)   /* 500ms - gradual transition */
```

### Dark Mode (Ready When Needed)

Dark mode CSS is pre-configured with automatic color overrides. No additional CSS needed - just enable the media query when needed.

### Documentation References

For detailed information:
- **Complete Guide:** `DESIGN_SYSTEM.md`
- **Quick Reference:** `frontend/DESIGN_TOKENS_QUICK_REFERENCE.md`
- **All Variables:** `frontend/src/styles/design-tokens.css`
- **All Components:** `frontend/src/styles/components.css`

---

## 🛠️ Development Environment Setup

### Prerequisites

**Required Software:**
- Node.js 18.0.0+ ([Download](https://nodejs.org/))
- npm 9.0.0+ (included with Node.js)
- MySQL 8.0+ ([Download](https://dev.mysql.com/downloads/))
- Git ([Download](https://git-scm.com/))

**Optional but Recommended:**
- Visual Studio Code ([Download](https://code.visualstudio.com/))
- MySQL Workbench ([Download](https://dev.mysql.com/downloads/workbench/))
- Postman or Insomnia (API testing)
- Chrome DevTools

**VS Code Extensions:**
- ESLint
- Prettier
- MySQL (by Weijan Chen)
- GitLens
- Tailwind CSS IntelliSense

### Local Setup

**1. Clone Repository:**
```bash
cd "/Users/anthony/Go BARRY App/BreakdownGuideapp"
git status  # Verify you're in the right directory
```

**2. Backend Setup:**
```bash
cd backend
npm install

# Create .env file
cp .env.cpanel.example .env

# Edit .env with your local settings:
# - MySQL credentials
# - JWT_SECRET (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
# - API_BASE_URL=http://localhost:3001
# - ALLOWED_ORIGINS=http://localhost:5173
```

**3. Frontend Setup:**
```bash
cd ../frontend
npm install

# Create .env file
cp .env.example .env

# Edit .env with your local settings:
# - VITE_API_URL=http://localhost:3001
# - VITE_API_BASE_URL=http://localhost:3001/api
# - VITE_WS_URL=ws://localhost:3001/ws
```

**4. Database Setup:**
```bash
# Create database
mysql -u root -p -e "CREATE DATABASE breakdown_local CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Import schema
mysql -u root -p breakdown_local < backend/migrations/complete_schema.sql

# Create test supervisor
mysql -u root -p breakdown_local <<EOF
INSERT INTO supervisors (email, name, badge_number, depot, role, password_hash, is_active)
VALUES (
  'dev@example.com',
  'Dev User',
  'DV001',
  'Washington',
  'admin',
  '\$2b\$10\$YpY5.PypQrzDEUGQEo.tK.x6fLXobT7eXJLJL7LVkQJYdLZqhZqJO',  -- Password: dev123
  1
);
EOF
```

**5. Start Development Servers:**

Terminal 1 (Backend):
```bash
cd backend
npm run dev
# Server starts on http://localhost:3001
# Hot-reloads with nodemon on file changes
```

Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
# Server starts on http://localhost:5173
# Hot-reloads with Vite HMR
```

**6. Verify Setup:**
```bash
# Test backend health
curl http://localhost:3001/api/health

# Expected response: {"status":"healthy","timestamp":"..."}

# Test login
curl -X POST http://localhost:3001/api/supervisor/login \
  -H "Content-Type: application/json" \
  -d '{"email":"dev@example.com","password":"dev123"}'

# Expected response: {"token":"...","user":{...}}
```

---

## 📁 Project Structure

### Directory Layout

```
BreakdownGuideapp/
├── backend/                      # Node.js Express API
│   ├── routes/                   # API route handlers
│   │   ├── auth.js              # Authentication & duty selection
│   │   ├── breakdowns.js        # Breakdown CRUD
│   │   ├── breakdownsAPI.js     # SDC dashboard endpoints
│   │   ├── activity.js          # Activity feed
│   │   ├── analytics.js         # Analytics & reporting
│   │   ├── engineering.js       # Engineer management
│   │   ├── fleet.js             # Fleet/vehicle data
│   │   ├── supervisors.js       # Supervisor management
│   │   ├── wizards.js           # Diagnostic wizards
│   │   └── webSocketHandler.js  # WebSocket connections
│   ├── middleware/
│   │   └── authMiddleware.js    # JWT verification, rate limiting
│   ├── services/
│   │   ├── activityLogger.js    # Activity logging service
│   │   └── ...                  # Other business logic services
│   ├── config/
│   │   └── mysql.js             # MySQL connection pool
│   ├── data/                    # JSON cache files (legacy/temp)
│   ├── migrations/              # Database schema migrations
│   │   ├── complete_schema.sql  # Full database schema
│   │   └── *.sql                # Individual migrations
│   ├── server.js                # Express app entry point
│   ├── package.json             # Dependencies
│   └── .env                     # Environment variables (not in git)
│
├── frontend/                     # React SPA
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   │   ├── ModernAppHeader.jsx
│   │   │   ├── HeaderLogin.jsx
│   │   │   ├── DutySelectionModal.jsx
│   │   │   ├── ActivityFeed.jsx
│   │   │   └── ...
│   │   ├── pages/               # Route-level page components
│   │   │   ├── Home.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── BreakdownGuide.jsx
│   │   │   ├── Engineering.jsx
│   │   │   └── ...
│   │   ├── services/            # API communication layer
│   │   │   ├── api.js           # Main API service
│   │   │   └── auth.js          # Authentication service
│   │   ├── hooks/               # Custom React hooks
│   │   ├── utils/               # Helper functions
│   │   ├── App.jsx              # Root application component
│   │   ├── main.jsx             # Application entry point
│   │   └── index.css            # Global styles
│   ├── public/                  # Static assets
│   │   ├── index.html           # HTML template
│   │   └── assets/              # Images, icons, etc.
│   ├── vite.config.js          # Vite configuration
│   ├── package.json            # Dependencies
│   └── .env                    # Environment variables (not in git)
│
├── docs/                        # Comprehensive documentation
│   ├── CPANEL_ONLY_DEPLOYMENT_GUIDE.md
│   ├── MASTER_CPANEL_DOCUMENTATION_INDEX.md
│   ├── COMPLETE_API_ENDPOINT_AUDIT.md
│   └── ...
│
├── CLAUDE.md                   # AI assistant guide
├── README.md                   # Project overview
├── PROJECT_GOALS.md           # Objectives and roadmap
├── DEVELOPMENT.md             # This file
└── .gitignore                 # Git ignore rules
```

### Key Files to Know

**Backend:**
- `server.js` - Express app initialization, middleware setup
- `routes/auth.js` - Login, duty selection, session management
- `routes/breakdowns.js` - Main breakdown CRUD operations
- `routes/breakdownsAPI.js` - SDC dashboard-specific endpoints
- `middleware/authMiddleware.js` - JWT verification logic
- `config/mysql.js` - Database connection pool configuration

**Frontend:**
- `src/App.jsx` - Root component, routing setup
- `src/components/ModernAppHeader.jsx` - Navigation bar
- `src/components/DutySelectionModal.jsx` - Duty selection UI
- `src/services/api.js` - Axios instance, API call helpers

---

## 🔴 CRITICAL: Frontend API Path Convention

### ⚠️ THE RULE: Always Include `/api` Prefix

**When creating ANY frontend API service file, ALL endpoints MUST include `/api` prefix:**

```javascript
// ❌ WRONG - Will return 404!
apiClient.get('/preferences')
apiClient.post('/breakdowns')
apiClient.get('/admin/fleet/import-csv')

// ✅ CORRECT - Always use /api prefix
apiClient.get('/api/preferences')
apiClient.post('/api/breakdowns')
apiClient.get('/api/admin/fleet/import-csv')
```

### Why This Rule Exists

Backend routes are registered with `/api` prefix in Express:

```javascript
// backend/server.js
app.use('/api/preferences', authenticateSupervisor, preferencesRoutes);
app.use('/api/admin/fleet', authenticateAdmin, adminFleetRoutes);
app.use('/api/breakdowns', authenticateSupervisor, breakdownsRoutes);
```

Frontend MUST call the **complete path** including `/api`.

### Template for New API Services

Copy this template when creating new API service files:

```javascript
// ✅ CORRECT TEMPLATE - All endpoints have /api prefix
export const myAPI = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiClient.get(`/api/my-endpoint${queryString ? `?${queryString}` : ''}`);
  },

  getById: (id) => apiClient.get(`/api/my-endpoint/${id}`),

  create: (data) => apiClient.post('/api/my-endpoint', data),

  update: (id, data) => apiClient.put(`/api/my-endpoint/${id}`, data),

  delete: (id) => apiClient.delete(`/api/my-endpoint/${id}`)
};
```

### Historical Context

**November 10, 2025 Issue:**
- File: `frontend/src/services/preferencesAPI.js`
- Problem: Missing `/api` prefix on all 6 endpoints (getPreferences, updatePreferences, etc.)
- Result: 404 errors when accessing Settings page
- Fix: Added `/api` prefix to all endpoint calls
- Prevention: This documented rule prevents future occurrences

### Checklist for Code Review

When reviewing frontend code, check:
- ✅ All `apiClient.get()` calls start with `/api/`
- ✅ All `apiClient.post()` calls start with `/api/`
- ✅ All `apiClient.put()` calls start with `/api/`
- ✅ All `apiClient.patch()` calls start with `/api/`
- ✅ All `apiClient.delete()` calls start with `/api/`

---

## 📝 Code Standards

### General Principles

**SOLID Principles:**
- Single Responsibility: Each function/component does one thing well
- Open/Closed: Open for extension, closed for modification
- Liskov Substitution: Subtypes must be substitutable for their base types
- Interface Segregation: Prefer small, specific interfaces
- Dependency Inversion: Depend on abstractions, not concretions

**DRY (Don't Repeat Yourself):**
- Extract common logic into reusable functions
- Create utility modules for shared functionality
- Use React components for reusable UI elements

**KISS (Keep It Simple, Stupid):**
- Write simple, readable code
- Avoid over-engineering
- Prefer clarity over cleverness

### Backend (Node.js/Express)

**Naming Conventions:**
```javascript
// Variables and functions: camelCase
const breakdownId = 'BRK-20251030-001';
function generateBreakdownId() { }

// Constants: UPPER_SNAKE_CASE
const MAX_RETRIES = 3;
const API_BASE_URL = process.env.API_BASE_URL;

// Classes: PascalCase (if used)
class BreakdownService { }

// Files: kebab-case.js
// auth-middleware.js, breakdown-service.js, activity-logger.js
```

**Async/Await Pattern:**
```javascript
// ✅ GOOD: Async/await with try-catch
async function getBreakdown(id) {
  try {
    const [results] = await db.query(
      'SELECT * FROM breakdowns WHERE id = ?',
      [id]
    );

    if (results.length === 0) {
      throw new Error('Breakdown not found');
    }

    return results[0];
  } catch (error) {
    console.error('Error fetching breakdown:', error);
    throw error;  // Re-throw for caller to handle
  }
}

// ❌ BAD: Promise chains
function getBreakdown(id) {
  return db.query('SELECT * FROM breakdowns WHERE id = ?', [id])
    .then(([results]) => {
      if (results.length === 0) throw new Error('Not found');
      return results[0];
    })
    .catch(error => console.error(error));
}
```

**Route Handler Structure:**
```javascript
// ✅ GOOD: Consistent structure
router.post('/api/breakdowns', async (req, res) => {
  try {
    // 1. Validate input
    const { fleet_no, location, issue } = req.body;
    if (!fleet_no || !location || !issue) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // 2. Business logic
    const breakdown = await createBreakdown({
      fleet_no,
      location,
      issue,
      supervisor_badge: req.user.badge_number
    });

    // 3. Success response
    res.status(201).json({
      success: true,
      breakdown,
      message: 'Breakdown created successfully'
    });
  } catch (error) {
    // 4. Error handling
    console.error('Breakdown creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create breakdown',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});
```

**Database Queries:**
```javascript
// ✅ GOOD: Parameterized queries
const [results] = await db.query(
  'SELECT * FROM breakdowns WHERE supervisor_badge = ? AND status = ?',
  [badge, 'active']
);

// ❌ BAD: String concatenation (SQL injection risk!)
const [results] = await db.query(
  `SELECT * FROM breakdowns WHERE supervisor_badge = '${badge}'`
);
```

**Error Handling:**
```javascript
// ✅ GOOD: Specific error types and messages
try {
  const breakdown = await getBreakdown(id);
  if (!breakdown) {
    return res.status(404).json({
      success: false,
      error: 'Breakdown not found'
    });
  }
  // ... rest of logic
} catch (error) {
  if (error.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      error: 'Breakdown ID already exists'
    });
  }
  throw error;  // Let global error handler catch it
}
```

### Frontend (React)

**Component Structure:**
```javascript
// ✅ GOOD: Functional component with hooks
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';  // Future enhancement

/**
 * BreakdownCard component displays a single breakdown in the dashboard.
 *
 * @param {Object} breakdown - The breakdown data object
 * @param {Function} onUpdate - Callback when breakdown is updated
 */
export default function BreakdownCard({ breakdown, onUpdate }) {
  // State declarations
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Effects
  useEffect(() => {
    // Side effects here
    return () => {
      // Cleanup
    };
  }, [breakdown.id]);

  // Event handlers
  const handleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleUpdate = async () => {
    setIsLoading(true);
    try {
      await onUpdate(breakdown.id);
    } catch (error) {
      console.error('Update failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Render
  return (
    <div className="breakdown-card">
      {/* JSX here */}
    </div>
  );
}

// PropTypes (future enhancement)
// BreakdownCard.propTypes = {
//   breakdown: PropTypes.object.isRequired,
//   onUpdate: PropTypes.func.isRequired
// };
```

**File Naming:**
```
// Components: PascalCase.jsx
BreakdownCard.jsx
DutySelectionModal.jsx
ModernAppHeader.jsx

// Utilities/Services: camelCase.js
apiService.js
authHelpers.js
dateUtils.js

// Pages: PascalCase.jsx (if using)
Dashboard.jsx
BreakdownGuide.jsx
```

**State Management:**
```javascript
// ✅ GOOD: Clear state updates
const [breakdowns, setBreakdowns] = useState([]);

// Add new breakdown
setBreakdowns([...breakdowns, newBreakdown]);

// Update existing breakdown
setBreakdowns(breakdowns.map(b =>
  b.id === updatedBreakdown.id ? updatedBreakdown : b
));

// Remove breakdown
setBreakdowns(breakdowns.filter(b => b.id !== removedId));

// ❌ BAD: Direct state mutation
breakdowns.push(newBreakdown);  // Don't do this!
setBreakdowns(breakdowns);
```

**API Calls:**
```javascript
// ✅ GOOD: Proper error handling
async function fetchBreakdowns() {
  try {
    const response = await api.get('/api/breakdowns/live');
    setBreakdowns(response.data.data);
  } catch (error) {
    console.error('Failed to fetch breakdowns:', error);
    setError('Failed to load breakdowns. Please try again.');
  } finally {
    setLoading(false);
  }
}
```

### CSS/Styling (TailwindCSS)

**Utility Classes:**
```javascript
// ✅ GOOD: Organized classes
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md">
  <span className="text-lg font-semibold text-gray-800">
    Fleet {breakdown.fleet_no}
  </span>
</div>

// ❌ BAD: Too many classes, hard to read
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-200 mb-4">
```

**Responsive Design:**
```javascript
// Mobile-first approach
<div className="p-4 md:p-6 lg:p-8">
  <h1 className="text-xl md:text-2xl lg:text-3xl">
    Breakdown Dashboard
  </h1>
</div>
```

---

## 🔄 Development Workflow

### Git Workflow

**Branch Strategy:**
```bash
# Main branch is production-ready
git checkout main
git pull origin main

# Make changes directly on main for small fixes
# OR create feature branch for larger features
git checkout -b feature/duty-selection-modal

# Make changes, commit often
git add .
git commit -m "feat: add duty selection modal"

# Push to repository
git push origin feature/duty-selection-modal
# OR
git push origin main
```

**Commit Message Format:**
```bash
# Format: <type>: <description>

# Types:
feat:     # New feature
fix:      # Bug fix
docs:     # Documentation changes
style:    # Code style changes (formatting, no logic change)
refactor: # Code refactoring
test:     # Adding or updating tests
chore:    # Maintenance tasks

# Examples:
git commit -m "feat: add photo upload functionality"
git commit -m "fix: resolve WebSocket connection timeout"
git commit -m "docs: update API endpoint documentation"
git commit -m "refactor: simplify breakdown creation logic"
```

### Development Cycle

**1. Plan:**
- Review requirements
- Check existing code patterns
- Identify affected files
- Plan database changes if needed

**2. Develop:**
- Write code following standards
- Add comments for complex logic
- Test incrementally
- Use console.log sparingly (remove before commit)

**3. Test:**
- Test locally (see Testing Guidelines)
- Verify in multiple browsers
- Check mobile responsiveness
- Test edge cases

**4. Review:**
- Review your own code first
- Check for console.log statements
- Verify error handling
- Ensure consistent style

**5. Commit:**
- Stage related changes together
- Write clear commit message
- Push to repository

**6. Deploy:**
- Follow deployment guide
- Test in production
- Monitor logs
- Verify functionality

---

## 🧪 Testing Guidelines

### Manual Testing Checklist

**Every Feature Should Be Tested:**
- [ ] Happy path (everything works correctly)
- [ ] Error cases (invalid input, network errors)
- [ ] Edge cases (empty data, maximum values)
- [ ] Browser compatibility (Chrome, Firefox, Safari)
- [ ] Mobile responsiveness
- [ ] Performance (load time, memory usage)

### Backend API Testing

**Using curl:**
```bash
# Login and get token
TOKEN=$(curl -s -X POST http://localhost:3001/api/supervisor/login \
  -H "Content-Type: application/json" \
  -d '{"email":"dev@example.com","password":"dev123"}' \
  | jq -r '.token')

# Test protected endpoint
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/breakdowns/live | jq

# Test with invalid data
curl -X POST http://localhost:3001/api/breakdowns \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"fleet_no":""}' | jq
# Should return 400 Bad Request
```

**Using Postman/Insomnia:**
1. Create collection for all endpoints
2. Setup environment variables (base_url, token)
3. Test each endpoint with valid and invalid data
4. Save example responses

### Frontend Testing

**Browser DevTools:**
```javascript
// Network tab
// - Check API calls
// - Verify request/response payloads
// - Monitor loading times

// Console tab
// - Check for errors
// - Verify no console.log statements (production)
// - Monitor WebSocket messages

// Application tab
// - Check localStorage (should be minimal)
// - Verify sessionStorage
// - Check cookies

// Performance tab
// - Measure page load time
// - Identify slow components
// - Check memory leaks
```

**Responsive Testing:**
```
// Test at these breakpoints:
Mobile:  375px (iPhone SE)
Tablet:  768px (iPad)
Desktop: 1280px (Standard laptop)
Large:   1920px (Full HD monitor)
```

### Database Testing

**Test Queries:**
```sql
-- Test parameterized query
PREPARE stmt FROM 'SELECT * FROM breakdowns WHERE supervisor_badge = ?';
SET @badge = 'AG003';
EXECUTE stmt USING @badge;

-- Test transaction
START TRANSACTION;
INSERT INTO breakdowns (...) VALUES (...);
INSERT INTO activities (...) VALUES (...);
-- If both succeed:
COMMIT;
-- If error:
ROLLBACK;

-- Test index usage
EXPLAIN SELECT * FROM breakdowns WHERE status = 'active';
-- Should show "Using index" in Extra column
```

---

## 🚀 Deployment Process

### Pre-Deployment Checklist

- [ ] All tests pass locally
- [ ] No console.log statements in code
- [ ] No hardcoded values (use environment variables)
- [ ] Error handling implemented
- [ ] API responses use consistent format
- [ ] Documentation updated if needed
- [ ] Database migrations tested (if applicable)
- [ ] .env files not committed to git

### Backend Deployment

**Via SSH:**
```bash
# Connect to server
ssh user@85.234.151.224

# Navigate to backend directory
cd ~/api

# Backup current code (optional)
cp -r . ../api-backup-$(date +%Y%m%d)

# Upload new files via SFTP/CyberDuck
# OR pull from git (if using git on server)

# Install dependencies (if package.json changed)
npm ci --production

# Restart PM2
pm2 restart breakdown-backend

# Check logs
pm2 logs breakdown-backend --lines 100

# Monitor for errors
pm2 status
```

**Verify Deployment:**
```bash
# Test health endpoint
curl https://api.breakdowns.gobarry.co.uk/api/health

# Test login
curl -X POST https://api.breakdowns.gobarry.co.uk/api/supervisor/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

### Frontend Deployment

**Build and Upload:**
```bash
# Local machine - Build frontend
cd frontend
npm run build
# Output in frontend/dist/

# Upload via CyberDuck or cPanel File Manager:
# 1. Connect to server via SFTP
# 2. Navigate to ~/public_html/breakdowns.gobarry.co.uk/
# 3. Delete all existing files
# 4. Upload all files from frontend/dist/

# OR via command line (if SSH access):
scp -r dist/* user@85.234.151.224:~/public_html/breakdowns.gobarry.co.uk/
```

**Verify Deployment:**
```bash
# Visit URL
open https://breakdowns.gobarry.co.uk

# Hard refresh to clear cache
# Mac: Cmd+Shift+R
# Windows: Ctrl+Shift+R

# Check browser console for errors
# Check Network tab for failed requests
```

### Database Migrations

**Apply Migration:**
```bash
# Via phpMyAdmin (cPanel):
# 1. Login to phpMyAdmin
# 2. Select gobarryco_breakdown database
# 3. Click SQL tab
# 4. Paste migration SQL
# 5. Click Execute

# OR via command line:
mysql -h 85.234.151.224 -u gobarryco_Gair -p gobarryco_breakdown < migration.sql
```

**Verify Migration:**
```sql
-- Check table structure
DESCRIBE table_name;

-- Check for new data
SELECT * FROM table_name LIMIT 10;

-- Verify indexes
SHOW INDEX FROM table_name;
```

---

## 🔧 Common Tasks

### Adding a New API Endpoint

**1. Create Route Handler:**
```javascript
// File: backend/routes/breakdowns.js

router.get('/api/breakdowns/:id/timeline', async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch breakdown and events
    const [breakdown] = await db.query(
      'SELECT * FROM breakdowns WHERE breakdown_id = ?',
      [id]
    );

    const [events] = await db.query(
      'SELECT * FROM activities WHERE breakdown_id = ? ORDER BY timestamp DESC',
      [id]
    );

    res.json({
      success: true,
      breakdown: breakdown[0],
      events
    });
  } catch (error) {
    console.error('Error fetching timeline:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch timeline'
    });
  }
});
```

**2. Update API Documentation:**
```markdown
// File: docs/COMPLETE_API_ENDPOINT_AUDIT.md

### GET /api/breakdowns/:id/timeline

Fetch breakdown with full timeline of events.

**Authentication:** Required

**Parameters:**
- `id` (path) - Breakdown ID (e.g., BRK-20251030-001)

**Response:**
```json
{
  "success": true,
  "breakdown": { ... },
  "events": [ ... ]
}
```
```

**3. Test Endpoint:**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/breakdowns/BRK-20251030-001/timeline | jq
```

### Adding a New React Component

**1. Create Component File:**
```javascript
// File: frontend/src/components/BreakdownTimeline.jsx

import React from 'react';

export default function BreakdownTimeline({ breakdownId }) {
  const [timeline, setTimeline] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchTimeline() {
      try {
        const response = await fetch(
          `/api/breakdowns/${breakdownId}/timeline`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        const data = await response.json();
        setTimeline(data);
      } catch (error) {
        console.error('Failed to fetch timeline:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchTimeline();
  }, [breakdownId]);

  if (loading) return <div>Loading...</div>;
  if (!timeline) return <div>No timeline available</div>;

  return (
    <div className="breakdown-timeline">
      {timeline.events.map(event => (
        <div key={event.id} className="timeline-event">
          <span>{event.timestamp}</span>
          <span>{event.message}</span>
        </div>
      ))}
    </div>
  );
}
```

**2. Import and Use:**
```javascript
// File: frontend/src/pages/BreakdownDetail.jsx

import BreakdownTimeline from '../components/BreakdownTimeline';

export default function BreakdownDetail({ breakdownId }) {
  return (
    <div>
      <h1>Breakdown Details</h1>
      <BreakdownTimeline breakdownId={breakdownId} />
    </div>
  );
}
```

### Adding a Database Migration

**1. Create Migration File:**
```sql
-- File: backend/migrations/006_add_photos_table.sql
-- Description: Add photos table for breakdown photo uploads
-- Date: 2025-10-30

CREATE TABLE IF NOT EXISTS breakdown_photos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  breakdown_id VARCHAR(50) NOT NULL,
  photo_url VARCHAR(255) NOT NULL,
  photo_thumbnail_url VARCHAR(255),
  uploaded_by VARCHAR(20),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (breakdown_id) REFERENCES breakdowns(breakdown_id) ON DELETE CASCADE,
  INDEX idx_breakdown_id (breakdown_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Add column to breakdowns table
ALTER TABLE breakdowns
ADD COLUMN photo_count INT DEFAULT 0;
```

**2. Test Migration Locally:**
```bash
mysql -u root -p breakdown_local < backend/migrations/006_add_photos_table.sql

# Verify
mysql -u root -p breakdown_local -e "DESCRIBE breakdown_photos;"
```

**3. Apply to Production:**
```bash
# Via phpMyAdmin (recommended)
# OR
mysql -h 85.234.151.224 -u gobarryco_Gair -p gobarryco_breakdown \
  < backend/migrations/006_add_photos_table.sql
```

**4. Update Code:**
```javascript
// backend/routes/photos.js
router.post('/api/breakdowns/:id/photos', async (req, res) => {
  // Photo upload logic here
});
```

---

## 🐛 Troubleshooting

### Backend Issues

**Issue: Backend won't start**
```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs breakdown-backend --lines 100

# Common causes:
# 1. Port in use - Change PORT in .env
# 2. MySQL connection failed - Check DB credentials in .env
# 3. Missing dependencies - Run npm install
# 4. Syntax error - Check recent code changes

# Restart with fresh logs
pm2 delete breakdown-backend
cd ~/api
pm2 start ecosystem.config.js --name breakdown-backend
```

**Issue: Database queries failing**
```bash
# Test MySQL connection
mysql -h 85.234.151.224 -u gobarryco_Gair -p gobarryco_breakdown

# Check for locked tables
mysql> SHOW PROCESSLIST;
mysql> SHOW OPEN TABLES WHERE In_use > 0;

# Check connection pool
# In backend code, log pool status:
console.log('Pool connections:', db.pool._allConnections.length);
```

**Issue: JWT token verification failing**
```bash
# Check JWT_SECRET matches between .env and database
# Check token expiration (default: 24 hours)
# Verify Authorization header format: "Bearer <token>"

# Debug in backend:
console.log('Token:', req.headers.authorization);
console.log('Decoded:', jwt.decode(token));
```

### Frontend Issues

**Issue: Frontend showing blank page**
```bash
# Check browser console for errors
# Common issues:
# 1. JavaScript error - Check console
# 2. API connection failed - Check Network tab
# 3. Cached old version - Hard refresh (Cmd+Shift+R)

# Rebuild frontend
cd frontend
rm -rf dist node_modules/.vite
npm install
npm run build
```

**Issue: API calls failing with CORS error**
```bash
# Check backend CORS configuration in server.js:
const cors = require('cors');
app.use(cors({
  origin: ['https://breakdowns.gobarry.co.uk', 'http://localhost:5173'],
  credentials: true
}));

# Check frontend API URL in .env:
VITE_API_URL=https://api.breakdowns.gobarry.co.uk
```

**Issue: WebSocket not connecting**
```bash
# Check WebSocket URL in frontend .env:
VITE_WS_URL=wss://api.breakdowns.gobarry.co.uk/ws

# Test WebSocket endpoint:
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" \
  https://api.breakdowns.gobarry.co.uk/ws

# Check PM2 logs for WebSocket errors:
pm2 logs breakdown-backend | grep -i websocket
```

---

## 💡 Best Practices

### Security

**Environment Variables:**
```bash
# ✅ GOOD: Use environment variables
const JWT_SECRET = process.env.JWT_SECRET;
const DB_PASSWORD = process.env.DB_PASSWORD;

# ❌ BAD: Hardcode secrets
const JWT_SECRET = 'my-secret-key-123';
```

**Input Validation:**
```javascript
// ✅ GOOD: Validate all input
router.post('/api/breakdowns', async (req, res) => {
  const { fleet_no, location } = req.body;

  if (!fleet_no || !/^\d{4}$/.test(fleet_no)) {
    return res.status(400).json({ error: 'Invalid fleet number' });
  }

  if (!location || location.length < 3) {
    return res.status(400).json({ error: 'Invalid location' });
  }

  // ... rest of logic
});
```

**SQL Injection Prevention:**
```javascript
// ✅ GOOD: Parameterized queries
const [results] = await db.query(
  'SELECT * FROM breakdowns WHERE id = ?',
  [req.params.id]
);

// ❌ BAD: String concatenation
const [results] = await db.query(
  `SELECT * FROM breakdowns WHERE id = ${req.params.id}`
);
```

### Performance

**Database Queries:**
```javascript
// ✅ GOOD: Select specific columns
const [results] = await db.query(
  'SELECT id, breakdown_id, fleet_no, status FROM breakdowns WHERE status = ?',
  ['active']
);

// ❌ BAD: Select all columns
const [results] = await db.query('SELECT * FROM breakdowns WHERE status = ?', ['active']);
```

**React Rendering:**
```javascript
// ✅ GOOD: Memoize expensive computations
const sortedBreakdowns = React.useMemo(() => {
  return breakdowns.sort((a, b) => b.priority - a.priority);
}, [breakdowns]);

// ❌ BAD: Sort on every render
const sortedBreakdowns = breakdowns.sort((a, b) => b.priority - a.priority);
```

**API Calls:**
```javascript
// ✅ GOOD: Cancel requests on unmount
useEffect(() => {
  const controller = new AbortController();

  fetch('/api/breakdowns', { signal: controller.signal })
    .then(response => response.json())
    .then(data => setBreakdowns(data));

  return () => controller.abort();
}, []);
```

### Code Organization

**Separation of Concerns:**
```javascript
// ✅ GOOD: Separate business logic from route handlers

// services/breakdownService.js
export async function createBreakdown(data) {
  const breakdownId = generateBreakdownId();

  const [result] = await db.query(
    'INSERT INTO breakdowns (breakdown_id, fleet_no, ...) VALUES (?, ?, ...)',
    [breakdownId, data.fleet_no, ...]
  );

  return { id: result.insertId, breakdown_id: breakdownId };
}

// routes/breakdowns.js
router.post('/api/breakdowns', async (req, res) => {
  try {
    const breakdown = await createBreakdown(req.body);
    res.json({ success: true, breakdown });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

**DRY (Don't Repeat Yourself):**
```javascript
// ✅ GOOD: Reusable utility function

// utils/database.js
export async function executeQuery(query, params) {
  try {
    const [results] = await db.query(query, params);
    return results;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Use in multiple places
const breakdowns = await executeQuery('SELECT * FROM breakdowns WHERE status = ?', ['active']);
const activities = await executeQuery('SELECT * FROM activities WHERE breakdown_id = ?', [id]);
```

---

## 📚 Additional Resources

### Documentation
- **CLAUDE.md** - AI assistant guide
- **README.md** - Project overview
- **PROJECT_GOALS.md** - Objectives and roadmap
- **docs/CPANEL_ONLY_DEPLOYMENT_GUIDE.md** - Deployment procedures
- **docs/COMPLETE_API_ENDPOINT_AUDIT.md** - API reference

### External Resources
- [Node.js Documentation](https://nodejs.org/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [React Documentation](https://react.dev/)
- [MySQL Reference](https://dev.mysql.com/doc/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

### Tools
- [Postman](https://www.postman.com/) - API testing
- [MySQL Workbench](https://www.mysql.com/products/workbench/) - Database management
- [VS Code](https://code.visualstudio.com/) - Code editor
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/) - Browser debugging

---

## 🆘 Getting Help

**For Development Questions:**
- Check this guide first
- Review related documentation in `/docs/`
- Check git history for similar implementations
- Contact project owner: anthony.gair@example.com

**For Production Issues:**
- Check PM2 logs: `pm2 logs breakdown-backend`
- Check browser console for errors
- Review troubleshooting section above
- Contact project owner immediately for critical issues

---

**Last Updated:** October 30, 2025
**Next Review:** November 30, 2025
**Maintainer:** Anthony Gair
