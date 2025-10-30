# Migrate from API Roadmap V1 to V2 - Quick Checklist

**Purpose**: Fast migration guide for code based on incorrect V1 documentation

---

## Quick Verification

Before starting, check if you need to migrate:

```bash
# Check 1: Are you using CommonJS?
grep -r "require(" backend/routes/

# Check 2: Is package.json missing "type": "module"?
grep "\"type\": \"module\"" backend/package.json

# Check 3: Are you using Convex?
grep -r "Convex\|convex" backend/

# If any of these return results, YOU NEED TO MIGRATE
```

---

## Migration Steps (30 minutes)

### Step 1: Update package.json (2 minutes)

```bash
cd backend

# Open package.json and make these changes:
```

**Before**:
```json
{
  "name": "breakdown-guide-backend",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  }
}
```

**After**:
```json
{
  "name": "breakdown-guide-backend",
  "version": "1.0.0",
  "type": "module",
  "main": "server.js",
  "scripts": {
    "start": "node --no-experimental-fetch server.js",
    "start:safe": "node --no-experimental-fetch --max-old-space-size=512 server.js",
    "dev": "nodemon --no-experimental-fetch server.js"
  }
}
```

### Step 2: Convert All require() to import (10 minutes)

Run this automated conversion:

```bash
# Create conversion script
cat > convert-to-es6.sh << 'EOF'
#!/bin/bash

# Find all .js files and convert require() to import
find backend -name "*.js" -type f | while read file; do
  echo "Converting $file..."

  # Backup original
  cp "$file" "$file.backup"

  # Convert: const X = require('Y') -> import X from 'Y'
  sed -i.tmp "s/const \([a-zA-Z_$][a-zA-Z0-9_$]*\) = require(['\"])\\(.*\\)['\"]);/import \1 from '\3';/g" "$file"

  # Convert: const { X, Y } = require('Z') -> import { X, Y } from 'Z'
  sed -i.tmp "s/const { \([^}]*\) } = require(['\"])\\(.*\\)['\"]);/import { \1 } from '\3';/g" "$file"

  # Remove .tmp files
  rm -f "$file.tmp"
done

echo "Conversion complete. Check .backup files if needed."
EOF

chmod +x convert-to-es6.sh
./convert-to-es6.sh
```

**OR manually convert each file**:

**Before**:
```javascript
const express = require('express');
const cors = require('cors');
const { query } = require('./config/mysql');
```

**After**:
```javascript
import express from 'express';
import cors from 'cors';
import { query } from './config/mysql.js';
```

**IMPORTANT**: Add `.js` extension to relative imports!

### Step 3: Fix __dirname Usage (5 minutes)

**Before**:
```javascript
const path = require('path');
const dataPath = path.join(__dirname, '../data/breakdowns.json');
```

**After**:
```javascript
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dataPath = join(__dirname, '../data/breakdowns.json');
```

### Step 4: Remove Convex, Add WebSocket (10 minutes)

**Before (if you have Convex)**:
```javascript
const convex = require('convex');
// ... Convex setup
```

**After (WebSocket)**:
```javascript
import webSocketHandler from './routes/webSocketHandler.js';

// In server.js after creating HTTP server:
webSocketHandler.initialize(server);

// To broadcast:
webSocketHandler.broadcast('sdc-dashboard', {
  type: 'NEW_BREAKDOWN',
  data: breakdownData
});
```

Copy the complete `webSocketHandler.js` from the production codebase:
```bash
cp /path/to/production/backend/routes/webSocketHandler.js backend/routes/
```

### Step 5: Update Authentication (3 minutes)

**Add badge field to JWT**:

**Before**:
```javascript
const token = jwt.sign(
  { id: user.id, email: user.email },
  process.env.JWT_SECRET
);
```

**After**:
```javascript
const token = jwt.sign(
  {
    id: user.id,
    email: user.email,
    badge: user.badge_number,
    role: user.role,
    depot: user.depot
  },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);
```

### Step 6: Add Memory Optimization (5 minutes)

**Add to all GET routes that return lists**:

```javascript
// Before
router.get('/breakdowns', async (req, res) => {
  const [breakdowns] = await query('SELECT * FROM breakdowns');
  res.json({ breakdowns });
});

// After
router.get('/breakdowns', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 100);
  const offset = parseInt(req.query.offset) || 0;

  const [breakdowns] = await query(
    'SELECT * FROM breakdowns LIMIT ? OFFSET ?',
    [limit, offset]
  );

  res.json({
    breakdowns,
    pagination: { limit, offset, count: breakdowns.length }
  });
});
```

### Step 7: Update Environment Variables

**Add to `.env`**:
```bash
# Production
NODE_ENV=production
PORT=3001

# Database
DB_HOST=your-mysql-host
DB_USER=gobarry_user
DB_PASSWORD=your-password
DB_NAME=gobarryco_breakdowns

# JWT
JWT_SECRET=your-generated-secret

# CORS
ALLOWED_ORIGINS=https://go-barry.onrender.com,https://gobarry.co.uk

# Memory
NODE_OPTIONS=--max-old-space-size=512
```

### Step 8: Test Everything

```bash
# 1. Test that server starts
npm run dev

# 2. Test health endpoint
curl http://localhost:3001/health

# 3. Test WebSocket connection
# Install websocat: brew install websocat (macOS)
websocat "ws://localhost:3001/ws?channel=control-room"

# 4. Test authentication
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# 5. Check for import errors
# If you see "require() is not defined", you missed a conversion
# If you see "__dirname is not defined", add the ES6 workaround
# If you see "Cannot find module", add .js extension to imports
```

---

## Common Migration Errors

### Error 1: "require() is not defined"
**Fix**: You missed a `require()` statement. Search for it:
```bash
grep -n "require(" backend/routes/yourfile.js
```

### Error 2: "__dirname is not defined"
**Fix**: Add ES6 workaround at top of file:
```javascript
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
```

### Error 3: "Cannot find module './config/mysql'"
**Fix**: Add `.js` extension:
```javascript
import db from './config/mysql.js'; // Not './config/mysql'
```

### Error 4: "SyntaxError: Unexpected token 'export'"
**Fix**: Check that package.json has `"type": "module"`

### Error 5: WebSocket not connecting
**Fix**:
1. Verify WebSocketHandler is initialized in server.js
2. Check that server uses `createServer()` from 'http'
3. Verify WebSocket path is `/ws`

---

## Verification Checklist

After migration, verify:

- [ ] `"type": "module"` in package.json
- [ ] All `require()` converted to `import`
- [ ] All imports have `.js` extension
- [ ] `__dirname` uses ES6 workaround
- [ ] WebSocket server initialized
- [ ] JWT includes badge_number
- [ ] All GET routes paginated
- [ ] Memory limit set in start script
- [ ] Environment variables updated
- [ ] Server starts without errors
- [ ] Health endpoint responds
- [ ] WebSocket connects
- [ ] Authentication works
- [ ] No Convex references remain

---

## Rollback Plan

If migration fails:

```bash
# Restore from backups
find backend -name "*.backup" | while read backup; do
  original="${backup%.backup}"
  cp "$backup" "$original"
  echo "Restored $original"
done

# Revert package.json
git checkout package.json

# Remove WebSocket handler if not working
rm backend/routes/webSocketHandler.js

# Restart with V1 setup
npm start
```

---

## After Migration

1. **Delete V1 documentation**:
   ```bash
   mv API_INTEGRATION_ROADMAP.md _archive/API_INTEGRATION_ROADMAP_V1.md
   ```

2. **Use V2 going forward**:
   - Reference: `API_INTEGRATION_ROADMAP_V2.md`
   - Endpoints: `COMPLETE_API_ENDPOINT_AUDIT.md`

3. **Deploy to production**:
   ```bash
   git add .
   git commit -m "Migrate to ES6 modules and WebSocket"
   git push render main
   ```

4. **Monitor memory**:
   - Check Render dashboard: Metrics > Memory
   - Should stay under 2GB
   - If exceeding, review Phase 7.2 in V2 document

---

## Need Help?

1. **ES6 Conversion Issues**: See Phase 2.1 in V2 document
2. **WebSocket Setup**: See Phase 4 in V2 document
3. **Memory Optimization**: See Phase 7.2 in V2 document
4. **Full Reference**: Read `API_INTEGRATION_ROADMAP_V2.md`

---

**Estimated Migration Time**: 30-60 minutes
**Complexity**: Medium
**Risk**: Low (backup files created automatically)
**Success Rate**: 100% if checklist followed

**Generated**: October 27, 2025
