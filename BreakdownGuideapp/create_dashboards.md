## 🚀 Dashboard Migration Prompt: HTML to React Components

### **Project Goal**
Convert 4 existing HTML dashboards into React components that integrate seamlessly with the Go North East Breakdown Guide React application, sharing authentication, state management, and existing components.

### **Current State**
- 4 HTML dashboards in `/public/dashboards/`:
  - `breakdown-dashboard-enhanced.html` - Real-time engineering response tracking
  - `engineering-dashboard-live.html` - Engineering team performance
  - `management-overview-dashboard.html` - Executive KPIs
  - `sdc-operations-dashboard.html` - Service Delivery Centre ops
- Shared navigation system (`shared-navigation.js`)
- Incorrect backend URL hardcoded (`go-barry.onrender.com` instead of `breakdown-guide.onrender.com`)

### **Target Architecture**

```
src/
├── dashboards/                    # New dashboard directory
│   ├── components/               # Shared dashboard components
│   │   ├── DashboardLayout.jsx  # Common layout wrapper
│   │   ├── StatsCard.jsx        # Reusable stat cards
│   │   ├── LiveIndicator.jsx    # Connection status
│   │   └── FilterBar.jsx        # Common filter component
│   ├── breakdown/                # Breakdown dashboard
│   │   ├── BreakdownDashboard.jsx
│   │   ├── BreakdownCard.jsx    
│   │   └── EngineeringStats.jsx
│   ├── engineering/              # Engineering dashboard
│   │   ├── EngineeringDashboard.jsx
│   │   └── DepotPerformance.jsx
│   ├── management/               # Management dashboard
│   │   ├── ManagementDashboard.jsx
│   │   └── KPICards.jsx
│   ├── sdc/                      # SDC operations
│   │   ├── SDCDashboard.jsx
│   │   └── PriorityAlerts.jsx
│   ├── DashboardRouter.jsx      # Dashboard routing
│   └── index.js                  # Dashboard exports
```

### **Step-by-Step Implementation**

#### **Step 1: Create Dashboard Infrastructure**
```bash
# Create directory structure
mkdir -p src/dashboards/components
mkdir -p src/dashboards/breakdown
mkdir -p src/dashboards/engineering
mkdir -p src/dashboards/management
mkdir -p src/dashboards/sdc
```

#### **Step 2: Create Shared Components**

**DashboardLayout.jsx** - Common wrapper for all dashboards:
```jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { apiConfig } from '../breakdown-guide/components/common/constants';

const DashboardLayout = ({ children, title, activeTab }) => {
  // Shared navigation, header, connection status
  // Uses apiConfig.baseUrl for correct backend URL
};
```

#### **Step 3: Convert First Dashboard (Breakdown Enhanced)**

Transform HTML/JS into React component:
- Extract inline styles → CSS modules or styled-components
- Convert vanilla JS functions → React hooks (useState, useEffect)
- Replace hardcoded URLs with `apiConfig.baseUrl`
- Convert DOM manipulation → React state updates
- Implement real-time updates with useEffect/WebSocket

#### **Step 4: Integrate with React Router**

Update main `App.jsx`:
```jsx
import { DashboardRouter } from './dashboards';

// Add dashboard routes
<Route path="/dashboards/*" element={<DashboardRouter />} />
```

#### **Step 5: Share Authentication & State**

- Use existing `SupervisorLogin` component
- Share Supabase client from `services/supabase-client.js`
- Create dashboard context for shared state
- Reuse existing components from breakdown-guide

### **Conversion Guidelines**

1. **API Integration**
   - Replace: `const BACKEND_URL = 'https://go-barry.onrender.com'`
   - With: `import { apiConfig } from '../breakdown-guide/components/common/constants'`
   - Use: `apiConfig.baseUrl`

2. **State Management**
   ```jsx
   // Convert vanilla JS state
   let allBreakdowns = [];
   
   // To React state
   const [allBreakdowns, setAllBreakdowns] = useState([]);
   ```

3. **Real-time Updates**
   ```jsx
   useEffect(() => {
     const interval = setInterval(fetchLiveBreakdowns, 5000);
     return () => clearInterval(interval);
   }, []);
   ```

4. **Reuse Existing Components**
   - Import icons from `breakdown-guide/components/common/icons.jsx`
   - Use existing color constants
   - Share authentication logic

5. **Styling Approach**
   - Extract inline styles to CSS modules
   - Use existing Tailwind classes where applicable
   - Maintain GNE branding consistency

### **Implementation Order**

1. **Phase 1**: Dashboard infrastructure and layout
2. **Phase 2**: Breakdown Dashboard (most complex, good test case)
3. **Phase 3**: SDC Operations Dashboard
4. **Phase 4**: Engineering Dashboard
5. **Phase 5**: Management Dashboard
6. **Phase 6**: WebSocket integration for real-time updates

### **Key Benefits**

- ✅ Correct backend URL from environment variables
- ✅ Shared authentication with main app
- ✅ Reusable components
- ✅ Consistent styling
- ✅ Better state management
- ✅ Easier maintenance
- ✅ Type safety (if using TypeScript)

### **Testing Checklist**

- [ ] All dashboards load without errors
- [ ] API calls use correct backend URL
- [ ] Real-time updates work
- [ ] Navigation between dashboards
- [ ] Mobile responsive
- [ ] Authentication shared with main app
- [ ] Filters and sorting work
- [ ] Performance (no memory leaks)

Would you like me to start implementing this plan by creating the first React component (BreakdownDashboard)?