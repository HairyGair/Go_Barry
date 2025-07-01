# Expo Server Troubleshooting Guide

## 1. Find Where Expo is Running

```bash
# Run this to scan common ports
node scripts/find-expo-port.js
```

## 2. Check Expo Terminal Output

When you run `npm start` in the Go_BARRY folder, look for lines like:
- `Web is running at http://localhost:XXXX`
- `Metro is running at http://192.168.X.X:XXXX`
- Or check the URL shown in Expo DevTools

## 3. Common Expo Ports

- **19006** - Default Expo web port
- **19000** - Default Metro bundler port
- **19001** - Default Expo DevTools port
- **8081** - Alternative Metro port
- **3000** - Sometimes used for web

## 4. Test with Specific Port

```bash
# Once you know the port, test it:
node scripts/check-services-port.js 8081

# Or update the environment variable:
export EXPO_PORT=8081
```

## 5. Update Test Scripts

If Expo is running on a different port, update the test scripts:

```javascript
// In integration-test.js, performance-test.js, etc.
// Change this line:
await page.goto('http://localhost:19006');

// To:
const port = process.env.EXPO_PORT || 19006;
await page.goto(`http://localhost:${port}`);
```

## 6. Check Browser

Open your browser and try these URLs manually:
- http://localhost:19006
- http://localhost:19000
- http://localhost:8081
- http://localhost:3000

Which one shows your app?
