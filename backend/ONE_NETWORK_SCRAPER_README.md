# One.Network Scraper for Go BARRY

This service scrapes roadworks and road closure data from One.Network for Go North East operating regions.

## How it works

The scraper uses Puppeteer to:
1. Log into One.Network using stored credentials
2. Navigate to each Go North East region (Newcastle, Sunderland, Gateshead, etc.)
3. Enable roadworks and road closures layers
4. Click on visible map markers to extract popup data
5. Transform and save the data to Supabase

## Setup

### 1. Install dependencies
```bash
npm install puppeteer
```

### 2. Environment variables
Add to your `.env` file:
```
# One.Network sync (optional)
ONE_NETWORK_SYNC_ENABLED=true  # Set to enable automatic 30-minute sync

# Supabase (required)
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
```

### 3. Test the scraper
```bash
node test-one-network.js
```

## Usage

### Manual trigger via API
```bash
curl -X POST http://localhost:3001/api/roadworks/sync/one-network
```

### Automatic sync
Set `ONE_NETWORK_SYNC_ENABLED=true` in your `.env` file. The scraper will:
- Run on startup (after 10 seconds)
- Run every 30 minutes thereafter

## Data Schema

The scraper transforms One.Network data to match your existing schema:

```javascript
{
  id: 'uuid',
  roadworkId: 'ONE-12345',
  title: 'Roadworks on A1',
  description: 'Lane closure for maintenance',
  location: 'A1 Northbound, Junction 65',
  lat: 54.9783,
  lng: -1.6178,
  startDate: '2025-01-01T00:00:00Z',
  endDate: '2025-01-31T23:59:59Z',
  severity: 'high|medium|low',
  impact: 'high|medium|low',
  status: 'active',
  source: 'one.network',
  affectedRoutes: [],
  geometry: null,
  createdAt: '2025-01-25T12:00:00Z',
  updatedAt: '2025-01-25T12:00:00Z'
}
```

## Regions Covered

- Newcastle upon Tyne
- Gateshead
- Sunderland
- Durham
- South Shields
- Washington

## Technical Details

### Pros:
- Visual scraping avoids complex protobuf decoding
- Can see exactly what data is being extracted
- Easier to debug and maintain

### Cons:
- Slower than API-based approach
- Requires headless browser (more resource intensive)
- May break if One.Network changes their UI

### Performance:
- Initial run: ~5-10 minutes (depending on number of markers)
- Subsequent runs: Faster due to deduplication
- Memory usage: ~500MB (Puppeteer browser)

## Troubleshooting

### Browser doesn't launch
- Ensure Puppeteer dependencies are installed: `sudo apt-get install chromium-browser` (on Linux)
- Set `headless: true` in production

### Login fails
- Check credentials in `oneNetworkService.js`
- One.Network may have changed their login flow

### No markers found
- Check if layers are properly enabled
- Zoom levels may need adjustment
- One.Network may have changed their map implementation

### Data not saving
- Check Supabase credentials
- Ensure `roadworks` table exists with correct schema
- Check Supabase logs for errors

## Future Improvements

1. **Parallel processing**: Open multiple browser tabs for different regions
2. **Better marker detection**: Use more sophisticated element selection
3. **Caching**: Skip recently processed markers
4. **Error recovery**: Resume from last successful region on failure
5. **Data enrichment**: Match with GTFS routes for `affectedRoutes`

## Alternative Approaches

If this scraper becomes unmaintainable, consider:

1. **Council APIs**: Direct feeds from Newcastle, Sunderland, Gateshead councils
2. **roadworks.org API**: National street works register (if they provide API access)
3. **Manual import**: Weekly CSV export from One.Network (if available)
4. **Crowd-sourcing**: Driver/supervisor reported roadworks via Go BARRY app
