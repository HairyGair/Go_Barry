# Operations Centre Testing - Debug Guide

## 🔍 The Problem
The integration test is failing because it can't find "Operations Centre" on the page.

## 🧪 Debug Tests Created

### 1. Simple Test (Recommended First)
```bash
node scripts/simple-test.js
```
- Saves HTML files of the pages
- Shows what content is actually on the page
- Runs quickly in headless mode

### 2. Visual Check
```bash
node scripts/visual-check.js
```
- Opens browser and keeps it open
- Lets you manually inspect what's happening
- Tries multiple URLs

### 3. Debug Integration Test
```bash
node scripts/integration-test-debug.js
```
- Takes screenshots at each step
- Tries multiple selectors
- Shows detailed logs
- Keeps browser open for inspection

### 4. Direct Navigation Test
```bash
node scripts/test-direct-navigation.js
```
- Goes straight to /operations-centre
- Checks if the route exists
- Shows what content is there

### 5. Updated Integration Test
```bash
node scripts/integration-test-v2.js
```
- More flexible than the original
- Better error handling
- Direct navigation approach
- Content-based verification

## 🚀 Quick Troubleshooting

1. **First, run the simple test:**
   ```bash
   node scripts/simple-test.js
   ```

2. **Check the saved HTML files:**
   - Open `homepage-content.html` in a browser
   - Open `operations-centre-content.html` in a browser
   - See what the actual page structure is

3. **Common Issues:**

   **No "Operations Centre" on homepage?**
   - The app might require login first
   - The link might be in a menu/drawer
   - The route might be different

   **404 on /operations-centre?**
   - Try `/operations` instead
   - Check if authentication is required
   - The route might not exist

   **Page loads but looks empty?**
   - React might still be rendering
   - Check the HTML files for hidden content
   - Might need longer wait times

## 📝 Next Steps

Based on what you find:

1. If authentication is required:
   - Add login steps to the test
   - Or test with a logged-in session

2. If the route is different:
   - Update the test to use the correct route
   - Check the app's routing configuration

3. If content is loading dynamically:
   - Add longer wait times
   - Wait for specific elements instead of timeouts

## 🔧 Quick Commands

```bash
# See what's wrong
node scripts/troubleshoot-tests.js

# Run all debug tests
node scripts/simple-test.js && \
node scripts/test-direct-navigation.js && \
node scripts/integration-test-v2.js

# Check the outputs
ls -la *.html *.png
```

The key is to understand what the actual page structure is before trying to test it!
