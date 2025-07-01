# Operations Centre Testing Guide

## ⚠️ Prerequisites
- Node.js 18+ (required for ES modules)
- Go BARRY development server running
- Test dependencies installed

## 🚀 Quick Start

### 1. Install Dependencies
```bash
# Install chrome-launcher if needed
npm install --save-dev chrome-launcher

# Or run the install script
chmod +x scripts/install-test-deps.sh
./scripts/install-test-deps.sh
```

### 2. Start Development Server
```bash
# In one terminal:
cd Go_BARRY
npm start
# Press 'w' to open in web browser
```

### 3. Verify Services
```bash
# In another terminal:
node scripts/check-services.js
```

### 4. Run Tests

#### Individual Test Suites:
```bash
# Unit Tests (if Jest is configured)
cd Go_BARRY
npm run test:operations

# Integration Tests
node scripts/integration-test.js

# Performance Tests
node scripts/performance-test.js

# Accessibility Tests
node scripts/accessibility-test.js
```

#### All Tests:
```bash
node scripts/run-all-tests.js
```

## 🔧 Troubleshooting

### "require is not defined" Error
All scripts now use ES modules. Make sure you're using Node.js 18+.

### "Cannot find module" Error
Install missing dependencies:
```bash
npm install --save-dev puppeteer lighthouse @axe-core/puppeteer chrome-launcher
```

### "Connection refused" Error
Make sure the Expo dev server is running:
```bash
cd Go_BARRY
npm start
```

### Tests Timeout
- Increase timeout in test scripts
- Check if localhost:19006 is accessible
- Try running with headless: false to see what's happening

## 📊 Expected Results

### Integration Tests
- ✅ Navigation works
- ✅ UK localisation correct
- ✅ All 6 cards visible
- ✅ Status bar present

### Performance Tests
- Target: Lighthouse score > 90
- FCP < 2s
- LCP < 2.5s
- TTI < 3.5s

### Accessibility Tests
- No critical violations
- No serious violations
- WCAG AA compliance

## 📝 Notes

- Tests run against http://localhost:19006
- Make sure no other services are using port 19006
- Screenshots saved on test failures
- Reports saved in JSON format with timestamps
