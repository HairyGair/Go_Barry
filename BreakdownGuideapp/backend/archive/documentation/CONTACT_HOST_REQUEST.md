# Request to Hosting Provider (If mysql2 v2.3.3 Doesn't Work)

## Issue Summary

Node.js application crashes with "WebAssembly.instantiate(): Out of memory" error on shared hosting.

## Root Cause

- **Node.js v22.19.0** includes undici library with WebAssembly dependency
- **Shared hosting memory limits** cannot allocate WebAssembly modules
- This is a known compatibility issue between Node.js 22+ and shared hosting environments

## Request to Pixelish Hosting Support

**Subject:** Request to Install Node.js 18 LTS for Shared Hosting

**Message:**

Hello Pixelish Support Team,

I'm running a Node.js application on my shared hosting account (gobarryco@server) but encountering WebAssembly memory allocation errors with Node.js v22.19.0.

```
RangeError: WebAssembly.instantiate(): Out of memory: Cannot allocate Wasm memory for new instance
at lazyllhttp (node:internal/deps/undici/undici:5829:32)
```

This is a known issue where Node.js v22 includes undici (with WebAssembly) which requires more memory than shared hosting typically provides.

**RESOLUTION REQUEST:**

Could you please install **Node.js 18 LTS** (v18.x) on the server or for my account specifically?

- Node.js 18 is still officially supported until April 2025
- Node.js 18 doesn't have the undici/WebAssembly dependency issues
- My application is fully compatible with Node.js 18+
- This is the recommended version for shared hosting environments

**Account Details:**
- Username: gobarryco
- Server: 85.234.151.224
- Current Node version: v22.19.0
- Requested Node version: v18.20.x (any 18.x version)

**Alternative Options:**
- Install Node.js 18 globally on the server
- Install Node.js 18 via cPanel "Setup Node.js App" for my account
- Provide access to nvm (Node Version Manager) to switch versions
- Increase WebAssembly memory limits for Node.js 22

Thank you for your assistance!

Best regards,
Anthony Gair
Go BARRY / Go North East

---

## Technical Background (For Reference)

### Why Node.js 22 Causes Issues

Node.js v22 introduced undici as the default HTTP client for fetch API:
- Undici uses WebAssembly for performance
- WebAssembly requires continuous memory allocation
- Shared hosting memory limits (typically 512MB-1GB) are insufficient
- This causes "Out of memory" errors during runtime

### Why Node.js 18 is Better for Shared Hosting

Node.js v18 LTS:
- No undici dependency (uses older HTTP libraries)
- Lower memory footprint (ideal for shared hosting)
- Officially supported until April 2025
- Used by millions of production applications
- Fully compatible with ES6 modules and modern JavaScript

### References

- [Node.js Official Support Timeline](https://github.com/nodejs/release#release-schedule)
- [undici WebAssembly Issues on Shared Hosting](https://github.com/nodejs/undici/issues?q=webassembly)
- [Node.js Best Practices for Shared Hosting](https://nodejs.org/en/docs/guides/simple-profiling/)

---

## If Host Cannot Help

### Alternative Solutions:

1. **Use VPS/Cloud Hosting** - Upgrade from shared to VPS (Render, DigitalOcean, AWS EC2)
2. **Use Serverless** - Deploy to Vercel, Netlify, or Cloudflare Workers
3. **Use Docker** - If host supports Docker, container with Node 18
4. **Use Different Database Driver** - Switch from mysql2 to older 'mysql' package

### Estimated Costs:

- **Keep Shared Hosting:** $0/month (if Node 18 can be installed)
- **Upgrade to VPS:** $5-10/month (basic VPS with more memory)
- **Use Render.com:** $7/month (starter tier with 512MB RAM + Node 18)
- **Use Railway.app:** $5/month (starter tier)

**Recommendation:** Try to get Node 18 on Pixelish first (free), then consider Render.com as backup ($7/month)
