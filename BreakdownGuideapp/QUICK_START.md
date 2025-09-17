# Quick Start - Go North East Breakdown Guide

## 🚀 Get Started in 3 Steps

### 1. Navigate to Frontend Directory
```bash
cd frontend
```

### 2. Install Dependencies (if not done already)
```bash
npm install
```

### 3. Start Development Server
```bash
npm run dev
```

✅ **The app should now be running at http://localhost:3000**

## 📋 Testing Checklist

### Basic Functionality Test
1. **Open** http://localhost:3000 in your browser
2. **Navigate** to breakdown guide (click 'Report Breakdown' or go to `/breakdown-guide`)
3. **Login** - Select any supervisor and login (any password or none)
4. **Select Vehicle** - Click 'Select Vehicle' and choose a bus
5. **Test Assessment** - Click on any wizard (e.g., 'Steering') to test
6. **Complete Assessment** - Go through all steps and observe decision outcome

### ✅ What Should Work
- **All 33 wizards** load without errors
- **Navigation** between steps works smoothly  
- **Auto-progression** on selection buttons
- **Final decisions** display correctly (STOP/AMBER/CONTINUE)
- **Assessment summary** shows comprehensive results
- **Responsive design** works on different screen sizes

### 🧪 Extended Testing
- **Road Traffic Incidents** - Test the complete 7-stage workflow
- **Fleet Selection** - Search by fleet number or registration
- **Different Assessment Types** - Try various wizards (Brakes, ABS Light, etc.)
- **Mobile Responsiveness** - Test on mobile device or browser dev tools

## 🗺️ Dashboard Access

### React Dashboards
The app includes React-based dashboards with real-time monitoring:
- **Breakdown Dashboard**: `/dashboards/breakdown` ✅
  - Engineering response tracking with timeline visualization
  - SLA breach/warning indicators
  - Engineering team assignment
  - Activity feeds and performance metrics
  
- **SDC Operations**: `/dashboards/sdc` ✅
  - Service Delivery Centre control panel
  - Priority alerts and quick actions
  - Real-time statistics and decision tracking
  - 4-stage workflow monitoring

- **Engineering Dashboard**: `/dashboards/engineering` 🔄 (Coming soon)
- **Management Overview**: `/dashboards/management` 🔄 (Coming soon)

### Dashboard Features
- Real-time data updates (5-second refresh)
- Responsive design for all devices
- Filter and search capabilities
- Interactive action buttons
- Live connection indicators
- Keyboard shortcuts (Alt+1-5)

## 🏗️ Build for Production

```bash
# Build the application
npm run build

# Files will be in dist/ folder
# Upload dist/ contents to cPanel for deployment
```

**Production URL**: https://breakdowns.gobarry.co.uk
**Backend API**: https://breakdown-guide.onrender.com

## 🎯 Expected Results

### ✅ Success Indicators
- ✅ App loads without console errors
- ✅ All wizards display properly
- ✅ Navigation flows work correctly
- ✅ Assessments complete with proper decisions
- ✅ Build completes without syntax errors

### 🚨 If You Encounter Issues

1. **Check browser console** for error messages
2. **Verify dependencies** are installed (`npm install`)
3. **Check port availability** (default: localhost:3000)
4. **Review TROUBLESHOOTING.md** for common issues
5. **Check CURRENT_STATUS.md** for latest known issues

## 📝 Additional Resources

- **[README.md](./README.md)** - Full project overview
- **[CURRENT_STATUS.md](./CURRENT_STATUS.md)** - Latest project status  
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Common issues and solutions
- **[CHANGELOG.md](./CHANGELOG.md)** - Version history and recent fixes

---

**Status**: ✅ Production Ready  
**Last Updated**: September 16, 2025
