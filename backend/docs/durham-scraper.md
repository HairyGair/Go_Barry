# Durham Roadworks Scraper Configuration

The Durham roadworks scraper uses Puppeteer to fetch data from Durham County Council's website. Since it requires Chrome/Chromium, it needs special configuration on different environments.

## Local Development

Works out of the box - Puppeteer will automatically download Chrome when you run `npm install`.

## Production (Render.com)

The Durham scraper is **disabled by default** on Render because:
1. Chrome installation requires system-level packages
2. It adds complexity and memory usage
3. Other roadwork sources (Street Manager, manual entries) still work

### To Enable on Render (Not Recommended)

If you absolutely need Durham scraper on production:

1. Use a Docker deployment instead of Node.js deployment
2. Include Chrome in your Dockerfile:
   ```dockerfile
   RUN apt-get update && apt-get install -y chromium
   ```
3. Remove `DURHAM_SCRAPER_ENABLED=false` from render.yaml

## Environment Variables

- `DURHAM_SCRAPER_ENABLED`: Set to `false` to disable the scraper
- `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD`: Set to `true` to skip Chrome download
- `PUPPETEER_EXECUTABLE_PATH`: Path to system Chrome/Chromium (if using system install)

## Testing

Run the scraper locally:
```bash
npm run durham-scraper
```

Continuous mode (updates every 30 minutes):
```bash
npm run durham-scraper:watch
```

## Troubleshooting

### "Could not find Chrome" Error
- **On Render**: This is expected - Durham scraper is disabled
- **Locally**: Run `npm install` to download Chrome
- **On Linux**: Install Chromium: `apt-get install chromium-browser`

### Memory Issues
The scraper needs ~500MB RAM. If you get memory errors:
1. Close other applications
2. Increase Node.js memory: `NODE_OPTIONS="--max-old-space-size=4096"`

### Website Changes
If the scraper stops finding roadworks:
1. Check if Durham's website structure changed
2. Update selectors in `durhamRoadworks.js`
3. The scraper has fallback methods that try different selectors

## Data Sources Priority

1. **Street Manager**: National UK roadworks system (primary source)
2. **Durham Council**: Web scraping (when available)
3. **Manual Entries**: Supervisor-created roadworks

Even without Durham scraper, the system still gets comprehensive roadwork data from Street Manager and manual entries.
