# 🚀 Integration Quick Start Guide

## Current Status
✅ **All files transferred successfully!**
- 33 wizards (BrakesWizard updated for SDC v1.3 compliance)
- All components (Mobile, PWA, Camera, Real-time)
- 4 dashboards
- Complete data files
- PWA support files
- Enhanced UI with Go North East branding
- PNG icon system implemented

## Recent Updates (December 2024)
- 🔄 **Tranzaura Integration**: Replaced Go-Check with Tranzaura defect tracking
- 🎨 **UI Overhaul**: Professional dashboard with logo, stats, and enhanced styling
- 🖼️ **Icon System**: 20 PNG icons implemented, 10 using emoji fallbacks
- 🛡️ **Safety Compliance**: BrakesWizard aligned with DVSA standards

## 🔧 Integration Steps (In Order)

### Step 1: Configure Vite Aliases (5 minutes)
Update `frontend/vite.config.js`:
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@breakdown-guide': path.resolve(__dirname, './src/breakdown-guide'),
      '@dashboards': path.resolve(__dirname, './src/dashboards'),
      '@services': path.resolve(__dirname, './src/services'),
      '@data': path.resolve(__dirname, './src/data')
    }
  },
  // ... rest of config
})
```

### Step 2: Fix Key Import Paths (30 minutes)

#### In `breakdown-guide/App.js`:
```javascript
// OLD:
import { wizards } from './data/diagnostic-flows-complete.js';
import SupervisorLogin from './components/SupervisorLogin.js';

// NEW:
import { wizards } from '@breakdown-guide/data/diagnostic-flows-complete.js';
import SupervisorLogin from '@breakdown-guide/components/SupervisorLogin.js';
```

#### In `supervisorBreakdownLogger.js`:
```javascript
// Update API URL:
const API_BASE = import.meta.env.VITE_API_URL || 'https://breakdown-guide.onrender.com';
```

### Step 3: Wire Up Main App (15 minutes)

Update `frontend/src/App.jsx`:
```javascript
import { lazy, Suspense } from 'react'

// Lazy load the breakdown guide
const BreakdownGuide = lazy(() => import('./breakdown-guide/App.js'))

// In your routes:
<Route 
  path="/breakdown-guide/*" 
  element={
    <Suspense fallback={<div>Loading Breakdown Guide...</div>}>
      <BreakdownGuide />
    </Suspense>
  } 
/>
```

### Step 4: Create Dashboard Wrapper (20 minutes)

Create `frontend/src/dashboards/DashboardLayout.jsx`:
```javascript
import { useEffect, useState } from 'react'

export default function DashboardLayout({ dashboardHtml }) {
  const [content, setContent] = useState('')
  
  useEffect(() => {
    // Parse and inject the HTML
    // Extract scripts and run them
  }, [dashboardHtml])
  
  return (
    <div className="dashboard-container" 
         dangerouslySetInnerHTML={{ __html: content }} />
  )
}
```

### Step 5: Environment Setup (5 minutes)

Update `frontend/.env.production`:
```env
VITE_SUPABASE_URL=https://oieliubbvvdzhzvikzal.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_API_URL=https://breakdown-guide.onrender.com
VITE_ENABLE_AUTH=false
VITE_DEFECT_SYSTEM=tranzaura
```

### Step 6: Test Core Functionality (30 minutes)

1. **Start dev server**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

2. **Test checklist**:
   - [ ] Navigate to `/breakdown-guide`
   - [ ] SupervisorLogin appears (or bypassed in NO AUTH mode)
   - [ ] Can select a vehicle
   - [ ] Can choose a wizard
   - [ ] Wizard steps work
   - [ ] Decision is logged

### Step 7: Quick Dashboard Conversion Example

Convert `engineering-dashboard-live.html` to React:

```javascript
// frontend/src/dashboards/EngineeringDashboard.jsx
import { useEffect, useState } from 'react'
import { supabase } from '@services/supabase-integration-service'

export default function EngineeringDashboard() {
  const [breakdowns, setBreakdowns] = useState([])
  
  useEffect(() => {
    fetchLiveBreakdowns()
    const interval = setInterval(fetchLiveBreakdowns, 5000)
    return () => clearInterval(interval)
  }, [])
  
  const fetchLiveBreakdowns = async () => {
    const { data } = await supabase
      .from('breakdowns')
      .select('*')
      .eq('status', 'active')
    setBreakdowns(data || [])
  }
  
  return (
    <div className="engineering-dashboard">
      {/* Dashboard UI here */}
    </div>
  )
}
```

## 🎯 Priority Fixes

### Must Fix First:
1. ✅ Import paths in `App.js`
2. ✅ Import paths in `supervisorBreakdownLogger.js`
3. ✅ API base URL configuration
4. ✅ Router integration in main App.jsx

### Can Fix Later:
- Dashboard conversions (can stay as HTML initially)
- Individual wizard import optimisations
- Advanced PWA features
- Real-time subscriptions

## 🐛 Common Issues & Solutions

### Issue: "Cannot find module './components/wizards/SteeringWizard'"
**Solution**: Update to `'./wizards/SteeringWizard'` (components is already in the path)

### Issue: "supervisorBreakdownLogger is not defined"
**Solution**: Import it in files that use it:
```javascript
import { supervisorBreakdownLogger } from '@breakdown-guide/supervisorBreakdownLogger.js'
```

### Issue: "API calls failing"
**Solution**: Check that API_BASE is set correctly and CORS is configured on backend

### Issue: "Icons not loading"
**Solution**: Ensure PNG icons are in `public/icons/` directory

### Issue: "Go-Check references"
**Solution**: All Go-Check references should be updated to Tranzaura

### Issue: "Styles not loading"
**Solution**: Import the CSS files:
```javascript
import '@breakdown-guide/styles/main.css'
```

## 📋 File Structure Reference

```
frontend/src/
├── breakdown-guide/
│   ├── App.js                          # Main entry point
│   ├── supervisorBreakdownLogger.js    # Core logic
│   ├── components/
│   │   ├── wizards/                    # 33 wizard files
│   │   ├── common/                     # Shared components
│   │   └── [other components]          # Integration, PWA, etc.
│   ├── data/                          # Diagnostic flows
│   └── services/                      # Fleet database
├── dashboards/                        # Dashboard HTML files
├── data/                             # Fleet JSON
└── services/                         # Supabase integration
```

## 🚦 Ready to Deploy Checklist

Before deploying to production:
- [ ] All import paths fixed
- [ ] Main app router connected
- [ ] At least one wizard tested
- [ ] API endpoints configured
- [ ] Environment variables set
- [ ] Build completes without errors
- [ ] Basic navigation works

## 💡 Pro Tips

1. **Start Simple**: Get one wizard working before fixing all
2. **Use Browser DevTools**: Check Network tab for failed requests
3. **Console Errors**: Fix import errors first, then functionality
4. **Test Offline**: The PWA should work without internet
5. **Mobile First**: Test on mobile early - that's the primary use case

---

**Estimated Integration Time**: 2-3 hours for core functionality

**Next Priority**: Get `/breakdown-guide` route showing the main app, then test one wizard end-to-end.
