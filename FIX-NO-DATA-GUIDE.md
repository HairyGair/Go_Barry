# Go BARRY - Fix No Data Issue - Step by Step Guide

## 🚨 Problem: No data coming through to Browser, Display Screen, or any interface

## 🔧 Solution Steps

### Step 1: Test Backend APIs (Priority 1)
```bash
# Navigate to project root
cd "/Users/anthony/Go BARRY App"

# Make scripts executable
chmod +x start-backend-test.sh
chmod +x start-frontend-test.sh

# Test backend APIs directly
cd backend
node test-backend-apis.js
```

**Expected Output:**
- ✅ TomTom API: SUCCESS (X alerts)
- ✅/❌ MapQuest API: Results vary  
- ✅/❌ HERE API: Results vary
- ✅/❌ National Highways: Results vary

**If ALL APIs fail:**
- Check internet connection
- Verify API keys in backend/.env
- Check if Newcastle area has traffic incidents

### Step 2: Start Backend Server (Priority 1)
```bash
# From project root
./start-backend-test.sh

# OR manually:
cd backend
npm install
npm run dev
```

**Expected Output:**
```
🚦 BARRY Backend Started with Enhanced Geocoding
📡 Server: http://localhost:3001
🌐 Public: https://go-barry.onrender.com
```

**Test Backend is Running:**
```bash
# In another terminal
curl http://localhost:3001/api/health
curl http://localhost:3001/api/alerts
```

### Step 3: Start Frontend and Test API Connection
```bash
# From project root  
./start-frontend-test.sh

# OR manually:
cd Go_BARRY
npm install
expo start --web
```

**Access Test Interface:**
1. Open browser to `http://localhost:8081` (or port shown)
2. Go to `/browser-main`
3. Click "API Test" in sidebar (last item, orange bug icon)
4. Click "🧪 Run Tests" button

### Step 4: Diagnose Results

#### ✅ If APIs work but frontend shows no data:
- **Issue**: Frontend-Backend connection
- **Fix**: Check API_CONFIG in `Go_BARRY/config/api.js`
- **Verify**: URLs point to correct backend (localhost:3001 or render.com)

#### ❌ If APIs don't work:
- **TomTom fails**: Check TOMTOM_API_KEY in .env
- **All fail**: Check internet/firewall
- **Node errors**: Update Node.js to v18+

#### 🔄 If backend won't start:
- **Port conflict**: Change PORT in .env or kill process on 3001
- **Missing deps**: Run `npm install` in backend folder
- **Permission errors**: Check file permissions

### Step 5: Fix Common Issues

#### Issue 1: "Cannot connect to localhost:3001"
```bash
# Check if backend is running
lsof -i :3001
# If nothing, start backend:
cd backend && npm run dev
```

#### Issue 2: "API keys not working"
```bash
# Test specific API:
cd backend
node -e "
import dotenv from 'dotenv';
dotenv.config();
console.log('TomTom:', process.env.TOMTOM_API_KEY ? 'SET' : 'MISSING');
console.log('MapQuest:', process.env.MAPQUEST_API_KEY ? 'SET' : 'MISSING');
"
```

#### Issue 3: "Enhanced alerts endpoint failed"
- Fallback to `/api/alerts` endpoint works
- Enhanced features may be disabled
- Check backend logs for errors

### Step 6: Verify All Interfaces

#### Browser Interface:
1. Go to `http://localhost:8081/browser-main`
2. Should show dashboard with traffic data
3. Use API Test tab to verify connection

#### Display Screen:
1. Go to `http://localhost:8081/display`  
2. Should show 24/7 monitoring display
3. Data should refresh every 15 seconds

#### Production Test:
1. Check `https://gobarry.co.uk`
2. Should connect to `https://go-barry.onrender.com` backend
3. May take 30 seconds for Render to wake up

### Step 7: Enable Debug Mode

Add to frontend for more debugging:
```javascript
// In browser console:
localStorage.setItem('BARRY_DEBUG', 'true');
// Refresh page - will show detailed logs
```

Add to backend for more debugging:
```bash
# Set in backend/.env:
LOG_LEVEL=debug
```

## 🎯 Success Indicators

**Backend Working:**
- ✅ APIs return traffic data
- ✅ Server starts on port 3001
- ✅ Health endpoint responds

**Frontend Working:**
- ✅ API Test shows green checkmarks
- ✅ Dashboard displays traffic alerts
- ✅ Routes and locations are enhanced

**Full System Working:**
- ✅ Browser shows live traffic data
- ✅ Display screen cycles through alerts
- ✅ Data refreshes automatically

## 🚨 Emergency Contacts

**If still no data:**
1. Check project documentation in `GoBarry.txt`
2. Review `TROUBLESHOOTING.md`
3. Test production endpoints directly:
   - https://go-barry.onrender.com/api/health
   - https://go-barry.onrender.com/api/alerts

**Quick Reset:**
```bash
# Kill all processes
pkill -f "expo\|node"
# Clear caches
cd Go_BARRY && expo start --clear
cd backend && rm -rf node_modules && npm install
```

Follow these steps in order and the data should start flowing! 🚦✨
