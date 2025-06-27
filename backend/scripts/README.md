# Durham Roadworks Scraper Scripts

This directory contains scripts for testing and debugging the Durham roadworks scraper.

## Available Scripts

### 🧪 Test Scripts

#### `test-durham-lightweight.js`
Tests the lightweight Durham scraper (axios + cheerio version).
```bash
node scripts/test-durham-lightweight.js
```
- Shows all roadworks found
- Displays severity breakdown
- No browser required

#### `test-durham-light.js`
Quick test of the lightweight scraper with minimal output.
```bash
node scripts/test-durham-light.js
```

### 🔍 Debug Scripts

#### `debug-durham-website.js`
Analyzes the Durham website structure to help debug scraping issues.
```bash
node scripts/debug-durham-website.js
```
- Shows table structure
- Counts rows and columns
- Identifies CSS selectors

### 🏃 Run Scripts

#### `run-durham-scraper.js`
Runs the full Durham scraper (Puppeteer version).
```bash
node scripts/run-durham-scraper.js
# or
npm run durham-scraper
```
- Uses headless Chrome
- More detailed extraction
- Falls back to lightweight if Chrome unavailable

#### `run-durham-scraper-continuous.js`
Runs the scraper continuously at intervals.
```bash
node scripts/run-durham-scraper-continuous.js
# or
npm run durham-scraper:watch
```

## Quick Testing

1. **Check if scraper works:**
   ```bash
   node scripts/test-durham-lightweight.js
   ```

2. **Debug website changes:**
   ```bash
   node scripts/debug-durham-website.js
   ```

3. **Test API endpoint:**
   ```bash
   curl http://localhost:3001/api/roadworks/test/durham
   ```

4. **Use web interface:**
   Open `http://localhost:3001/public/durham-test.html`

## Troubleshooting

- **No roadworks found**: Website may have no active roadworks or structure changed
- **Module not found**: Run `npm install` in backend directory
- **Network error**: Check internet connection and firewall
- **Chrome not found**: Expected on cloud platforms, lightweight version will be used

For more details, see `/backend/docs/durham-scraper-guide.md`