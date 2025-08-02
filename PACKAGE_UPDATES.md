# Intelligent Coordinate Resolution - Package Updates

## 📦 Dependencies to Add

Add these to your backend `package.json`:

```json
{
  "dependencies": {
    // Existing dependencies...
    
    // For one.network web scraping (optional)
    "puppeteer-core": "^22.0.0",
    "@sparticuz/chromium": "^119.0.0"
  }
}
```

## 🔧 Installation

```bash
cd backend
npm install puppeteer-core @sparticuz/chromium
```

## ⚠️ Note on Puppeteer

The puppeteer dependencies are **optional**. The system will work without them, but won't be able to scrape one.network for coordinates. If you don't want to use web scraping, you can skip installing these packages.

## 🎯 Alternative: Lightweight Version

If you want to avoid the heavy puppeteer dependencies, comment out the web scraping functionality in `oneNetworkService.js`:

```javascript
async searchByPermitReference(permitRef) {
  if (!permitRef) return null;

  // Check cache first
  const cached = this.cache.get(permitRef);
  if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
    return cached.data;
  }

  // For lightweight version, just return null
  // The system will fall back to other strategies
  return null;
}
```

The intelligent coordinate resolver will still work with:
- Junction parsing
- Postcode extraction
- Landmark recognition
- Smart geocoding
- All other strategies

Just without the one.network integration.
