# Go BARRY Testing - Quick Fix Guide

## 🚨 The Problem
Tests are failing with "ERR_CONNECTION_REFUSED" because they can't find Expo at http://localhost:19006

## 🔍 Quick Diagnosis

Run this first:
```bash
node scripts/full-diagnostic.js
```

This will show:
- What ports are in use
- What processes are running
- Whether you're running dev or production

## ✅ Solution Options

### Option 1: Find Current Port
```bash
# See where Expo is actually running
node scripts/find-expo-port.js

# Once you find it (e.g., port 8081), update tests:
node scripts/update-test-port.js 8081
```

### Option 2: Start Expo on Fixed Port
```bash
# Make script executable
chmod +x scripts/start-expo-fixed-port.sh

# Start Expo on port 8081
./scripts/start-expo-fixed-port.sh 8081

# In another terminal, update tests
node scripts/update-test-port.js 8081
```

### Option 3: Manual Check
1. Look at your Expo terminal output
2. Find the line "Web is running at http://localhost:XXXX"
3. Note the port number
4. Run: `node scripts/update-test-port.js XXXX`

## 🧪 Then Run Tests
```bash
# Verify connection
node scripts/check-services.js

# Run tests
node scripts/integration-test.js
```

## 💡 Common Issues

- **"dist" folder exists**: You might be running production build (`npm run serve`) instead of dev server (`npm start`)
- **Wrong terminal**: Make sure you're in Go_BARRY folder when starting Expo
- **Port conflict**: Another service might be using the port

## 🎯 Quick Commands
```bash
# Kill all Expo processes
pkill -f expo

# Start fresh
cd Go_BARRY && expo start --web --clear --port 8081

# Update and test
node ../scripts/update-test-port.js 8081
node ../scripts/integration-test.js
```
