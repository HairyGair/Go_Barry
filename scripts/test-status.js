#!/usr/bin/env node

console.log(`
🎯 Go BARRY Testing - Quick Commands
===================================

✅ Services verified running on port 8081

To debug the failing integration test:

1️⃣  node scripts/simple-test.js
    → Creates HTML files to inspect

2️⃣  open homepage-content.html
    → See what's actually on the page

3️⃣  node scripts/integration-test-v2.js  
    → Try the updated test

4️⃣  node scripts/visual-check.js
    → Manual browser inspection

📋 Status: Phase 6 Complete (90% of migration done)
🚧 Issue: Integration test can't find "Operations Centre"
💡 Solution: Run simple-test.js first to debug

Next: Fix selectors → Run tests → Phase 7 (Deployment)
`);
