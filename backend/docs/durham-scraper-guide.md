# Durham Roadworks Scraper - Implementation Guide

## Overview
The Durham roadworks scraper fetches current roadwork information from Durham County Council's website (https://www.durham.gov.uk/roadworks) and integrates it into the Go BARRY traffic intelligence system.

## Implementation Details

### 1. Lightweight Scraper (`durhamRoadworksLight.js`)
- **Technology**: Uses `axios` for HTTP requests and `cheerio` for HTML parsing
- **No Browser Required**: Unlike the original Puppeteer version, this doesn't need Chrome/Chromium
- **Memory Efficient**: Uses ~10MB vs ~500MB for browser-based scraping
- **Faster**: Typically completes in 1-3 seconds vs 10-20 seconds

### 2. Original Scraper (`durhamRoadworks.js`)
- **Technology**: Uses Puppeteer (headless Chrome)
- **Fallback**: Now falls back to lightweight scraper if Chrome isn't available
- **Use Case**: Only needed if Durham changes their site to require JavaScript rendering

## Testing the Scraper

### Method 1: Web Interface
1. Start the backend: `cd backend && npm start`
2. Open browser to: `http://localhost:3001/public/durham-test.html`
3. Click "Test Durham Scraper" button
4. View results in the interface

### Method 2: API Endpoint
```bash
# Test the Durham scraper via API
curl http://localhost:3001/api/roadworks/test/durham

# Or on production
curl https://go-barry.onrender.com/api/roadworks/test/durham
```

### Method 3: Command Line Script
```bash
cd backend

# Test lightweight scraper
node scripts/test-durham-lightweight.js

# Test original scraper (requires Chrome)
npm run durham-scraper

# Debug website structure
node scripts/debug-durham-website.js
```

## Data Structure

The scraper extracts the following information from each roadwork:

```javascript
{
  id: "DURHAM-1234567890-0",
  title: "Bridge closure / Roadworks / License - Roadworks",
  location: "A1(M) Durham",
  severity: "high", // Based on traffic management type
  startDate: "2025-03-10T00:00:00.000Z",
  endDate: "2026-08-25T23:59:59.999Z",
  source: "Durham County Council",
  description: "Bridge closure / Roadworks / License - Roadworks\nTraffic Management: Bridge closure / Roadworks / License - Roadworks\nContractor: Durham County Council",
  affectedRoutes: ["X21", "21"], // Extracted from location/description
  coordinates: null // Would need geocoding
}
```

### Severity Mapping
- **High**: Road closure, closed
- **Medium**: Traffic lights, convoy, lane closure, narrow, diversion
- **Low**: All other traffic management types

## Integration with Go BARRY

### 1. Unified Roadworks Manager
The Durham scraper is integrated via `unifiedRoadworksManager.js`:
- Called alongside StreetManager and manual roadworks
- Results are deduplicated based on location/description hash
- Cached for 30 minutes to reduce load on Durham's website

### 2. API Endpoints
- `/api/roadworks/unified` - Get all roadworks including Durham
- `/api/roadworks/test/durham` - Test Durham scraper specifically
- `/api/alerts-enhanced` - Main alerts endpoint includes Durham roadworks

### 3. Frontend Display
Durham roadworks appear in:
- Enhanced Dashboard (supervisor view)
- Display Screen (control room)
- Roadworks Manager interface

## Troubleshooting

### Common Issues

1. **No roadworks found**
   - Check if Durham website is accessible
   - Verify table structure hasn't changed
   - Run debug script to inspect HTML structure

2. **Cheerio not installed**
   ```bash
   cd backend
   npm install cheerio
   ```

3. **Network errors**
   - Check internet connectivity
   - Verify firewall allows outbound HTTPS
   - Try increasing timeout in scraper

4. **Chrome not available (Render.com)**
   - This is expected on cloud platforms
   - Lightweight scraper will be used automatically
   - No action needed

### Debug Commands

```bash
# Check what's on the Durham website
node scripts/debug-durham-website.js

# Test with verbose logging
DEBUG=* node scripts/test-durham-lightweight.js

# Check if cheerio is installed
npm list cheerio
```

## Deployment Notes

### Local Development
- Both scrapers work fine locally
- Chrome/Chromium needed for Puppeteer version
- Lightweight version recommended for speed

### Render.com Production
- Puppeteer scraper won't work (no Chrome)
- Lightweight scraper works perfectly
- No additional configuration needed

### Environment Variables
```bash
# Optional: Disable Durham scraper
DURHAM_SCRAPER_ENABLED=false

# Optional: Force Puppeteer executable path
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

## Future Improvements

1. **Geocoding**: Add coordinates for better map integration
2. **Route Matching**: Improve GTFS route detection
3. **Caching**: Implement Redis caching for production
4. **Monitoring**: Add alerts if scraper fails repeatedly
5. **API Integration**: Check if Durham provides official API

## Maintenance

The scraper may need updates if Durham changes their website structure. To update:

1. Run the debug script to see current HTML structure
2. Update CSS selectors in `durhamRoadworksLight.js`
3. Test thoroughly before deploying
4. Update this documentation with changes

## Contact

For issues or questions about the Durham scraper:
- Check Go Barry documentation
- Review error logs in backend console
- Test with debug scripts first