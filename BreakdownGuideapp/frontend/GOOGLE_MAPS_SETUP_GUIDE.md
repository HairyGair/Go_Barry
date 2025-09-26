# Google Maps API Setup Guide

This guide will help you set up Google's Reverse Geocoding API to get real street addresses and location names instead of raw coordinates in the Live Activity Feed.

## 🚀 Quick Setup (5 minutes)

### Step 1: Get a Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Geocoding API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Geocoding API"
   - Click "Enable"

4. Create an API key:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy the generated API key

### Step 2: Configure the API Key

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Add your API key to `.env`:
   ```bash
   REACT_APP_GOOGLE_MAPS_API_KEY=AIzaSyBvOkBwgGlbUiuS-oMTHjwmCb2C6MhvtNQ
   ```
   *(Replace with your actual API key)*

3. Restart the frontend server:
   ```bash
   npm run dev
   ```

### Step 3: Test the Integration

1. Open the Go BARRY application
2. Look for activities in the Live Activity Feed
3. Click the "📍 View Location" button
4. You should now see real addresses like:
   - "Newcastle Central Station, Newcastle upon Tyne"
   - "High Street, Gateshead"
   - "Park Lane, Sunderland"

## 🔧 Configuration Options

### API Usage Limits

Google's Geocoding API has the following free tier limits:
- **$200 free credit per month**
- **40,000 requests per month free**
- **$5.00 per 1000 requests** after free tier

For Go BARRY's usage (9 supervisors, location lookups on-demand), this should be well within the free tier.

### Security Settings (Recommended)

1. **Restrict API Key** (In Google Cloud Console):
   - Go to "APIs & Services" > "Credentials"
   - Click on your API key
   - Under "API restrictions", select "Restrict key"
   - Choose "Geocoding API" only

2. **HTTP Referrer Restrictions**:
   - Add your domain: `https://your-domain.com/*`
   - For development: `http://localhost:3000/*`, `http://localhost:3002/*`

### Fallback Strategy

The system includes smart fallbacks:

1. **Primary**: Google Reverse Geocoding API
2. **Fallback 1**: Local landmark database (70+ North East locations)
3. **Fallback 2**: General area names ("North East England")

This ensures location services always work, even if:
- API key is not configured
- API quota is exceeded
- Network issues occur

## 🧪 Testing Different Scenarios

The system will handle various coordinate formats:

```javascript
// Test coordinates for Go North East area:
const testCoordinates = [
  { lat: 54.9783, lng: -1.6178 }, // Newcastle city center
  { lat: 54.9611, lng: -1.5797 }, // Gateshead Interchange
  { lat: 54.9085, lng: -1.3830 }, // Sunderland
  { lat: 54.7761, lng: -1.5733 }  // Durham
];
```

## 💡 What You'll Get

**Before**: Raw coordinates like `54.959207, -1.656686`

**After**: Real addresses like:
- "Grey Street, Newcastle upon Tyne"
- "High Level Bridge, Gateshead"
- "Fawcett Street, Sunderland"
- "North Road, Durham"
- "Eldon Square Bus Station, Newcastle upon Tyne"

## 🔍 How It Works

1. User clicks "📍 View Location" button
2. System extracts coordinates from activity data
3. Google's Geocoding API converts coordinates to address
4. Results are cached to minimize API calls
5. Friendly popup shows: `📍 Location Details: [Address]`

## 🆘 Troubleshooting

### "Unable to determine location"
- Check API key is correctly set in `.env`
- Verify Geocoding API is enabled in Google Cloud Console
- Check browser console for detailed error messages

### API Quota Exceeded
- The system will automatically fall back to local landmarks
- Consider upgrading Google Cloud billing if needed
- Monitor usage in Google Cloud Console

### No API Key Warning
```
Google Maps API key not configured, using fallback location service
```
- This is expected during development
- Add your API key to `.env` file
- Restart the server

## 📊 Monitoring Usage

Check your API usage in [Google Cloud Console](https://console.cloud.google.com/):
- Go to "APIs & Services" > "Geocoding API"
- View usage charts and quotas
- Set up billing alerts if needed

## 🚀 Production Deployment

For production deployment:

1. **Secure API Key Storage**: Store API key as environment variable on server
2. **Domain Restrictions**: Limit API key to your production domain
3. **Monitoring**: Set up Google Cloud alerting for quota usage
4. **Backup Plan**: Ensure fallback location service is working

This setup will provide professional-grade location services for the Go BARRY breakdown management system!