# Shared Hosting Memory Fix

## Problem

When running the Go BARRY backend on shared hosting (cPanel) with limited memory, you may encounter this error:

```
RangeError: WebAssembly.instantiate(): Out of memory: Cannot allocate Wasm memory for new instance
    at lazyllhttp (node:internal/deps/undici/undici:5829:32)
```

This happens because:
1. **Node.js 18+ includes `undici`** as the built-in HTTP client for the native `fetch()` API
2. **Undici uses WebAssembly** for performance optimizations
3. **Shared hosting environments** have strict memory limits that prevent WebAssembly memory allocation

## Solution

We've implemented multiple fixes to work around this issue:

### Option 1: Use the Updated npm Scripts (Recommended)

The `package.json` has been updated with the fix built-in:

```bash
# Production start (with WebAssembly disabled)
npm start

# Development with nodemon (with WebAssembly disabled)
npm run dev

# Safe mode with additional memory limits
npm run start:safe
```

### Option 2: Use the Startup Script

```bash
./start-server.sh
```

This script sets the necessary Node.js options before starting the server.

### Option 3: Set Environment Variable

Add this to your `.env` file or hosting environment:

```bash
NODE_OPTIONS=--no-experimental-fetch
```

Or for even more memory constraints:

```bash
NODE_OPTIONS=--no-experimental-fetch --max-old-space-size=512
```

### Option 4: Direct Node Command

If you're running the server manually:

```bash
node --no-experimental-fetch server.js
```

## What This Does

- `--no-experimental-fetch`: Disables Node.js's built-in `fetch()` API, which prevents undici and WebAssembly from loading
- `--max-old-space-size=512`: Limits Node.js heap memory to 512MB (adjust based on your hosting limits)

## Note

This fix does **not** affect functionality because:
- The backend **does not use `fetch()`** in production code
- `fetch()` is only used in test files which import `node-fetch` explicitly
- All HTTP communication uses Express.js for incoming requests
- MySQL database connections use `mysql2` which doesn't require WebAssembly

## Verification

After applying the fix, you should see:

```
🚀 Breakdown Guide API running on port 3001
📍 Environment: production
🔗 Health check: http://localhost:3001/health
🔍 Verifying MySQL database connection...
✅ MySQL database connection verified
```

Without the WebAssembly error!

## cPanel Hosting Setup

If you're using cPanel with Node.js app manager:

1. **Application Startup File**: `server.js`
2. **Application Entry Point**: `start-server.sh` (or use npm script)
3. **Environment Variables**: Add `NODE_OPTIONS=--no-experimental-fetch`
4. **Node.js Version**: Use Node 18 or 20

## Alternative: Downgrade Node.js

If the above fixes don't work, you can also:
- Use Node.js 16.x (which doesn't have the built-in fetch/undici)
- However, this is not recommended as Node 16 is EOL

## Support

If you continue to experience memory issues:
1. Check your hosting provider's memory limits
2. Consider upgrading to a hosting plan with more memory
3. Review the application logs for other memory-intensive operations
4. Contact support with the error logs

---

**Last Updated**: 2025-01-16
**Go BARRY Backend v2.0.0**
