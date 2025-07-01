# Statistics Component Implementation Plan
## Go BARRY - Operations Centre Statistics Dashboard

**Created:** 1st July 2025  
**Author:** Claude & Anthony Gair  
**Status:** Planning Phase  
**Priority:** Medium  

---

## 📋 Overview

The Statistics Component will provide supervisors with comprehensive real-time analytics and performance metrics for the Go BARRY traffic intelligence platform. This dashboard will enable data-driven decision making and operational insights.

### 🎯 Goals
- **Real-time operational visibility** for supervisors
- **Performance tracking** across all system components
- **Route impact analysis** for better resource allocation
- **Supervisor activity monitoring** and performance metrics
- **System health dashboard** for technical oversight

---

## 🏗️ Architecture & Design

### Component Structure
```
StatisticsComponent/
├── components/
│   ├── StatisticsHeader.jsx
│   ├── RealTimeOverview.jsx
│   ├── RouteImpactSection.jsx
│   ├── DataSourceStatus.jsx
│   ├── SupervisorActivity.jsx
│   ├── charts/
│   │   ├── AlertVolumeChart.jsx
│   │   ├── IncidentCategoriesChart.jsx
│   │   ├── ResponseTimeChart.jsx
│   │   └── GeographicHeatmap.jsx
│   └── filters/
│       ├── TimeRangeFilter.jsx
│       └── ExportOptions.jsx
├── hooks/
│   ├── useStatisticsData.js
│   └── useChartData.js
├── utils/
│   ├── chartHelpers.js
│   └── dataFormatters.js
└── styles/
    └── statistics.styles.js
```

### Data Architecture
```javascript
const statisticsDataModel = {
  realTime: {
    alertsToday: number,
    alertsTrend: string,
    incidentsManaged: number,
    incidentsTrend: string,
    activeRoadworks: number,
    roadworksTrend: string,
    systemHealth: number
  },
  
  routeImpact: {
    mostAffected: Array<{
      route: string,
      incidents: number,
      avgDelay: string,
      severity: 'low' | 'medium' | 'high'
    }>,
    criticalRoutes: Array<string>,
    performanceMetrics: {
      totalRoutes: number,
      affectedRoutes: number,
      averageDelay: string
    }
  },
  
  dataSources: {
    tomtom: DataSourceStatus,
    nationalHighways: DataSourceStatus,
    streetManager: DataSourceStatus,
    convex: DataSourceStatus
  },
  
  supervisorActivity: {
    activeToday: number,
    totalActions: number,
    avgResponseTime: string,
    topPerformers: Array<SupervisorMetrics>
  },
  
  historicalData: {
    alertVolume: Array<TimeSeriesData>,
    incidentCategories: Array<CategoryData>,
    responseTimes: Array<ResponseTimeData>
  }
}

interface DataSourceStatus {
  status: 'online' | 'offline' | 'degraded';
  responseTime: string;
  lastUpdate: string;
  errorRate?: number;
}

interface SupervisorMetrics {
  name: string;
  actions: number;
  avgResponseTime: string;
  efficiency: number;
}
```

---


## 📊 Dashboard Layout

### Real-Time Overview (Top Section)
```
┌──────────────────────────────────────────────────────────────────────────────┐
│  📈 TODAY'S OPERATIONS - Tuesday, 1st July 2025                              │
├──────────────┬──────────────┬──────────────┬──────────────┬─────────────────┤
│  🔔 247 Alerts Processed   │ 🚨 23 Incidents Managed      │ 🛠️ 12 Roadworks │
│  ↑ 12% vs yesterday        │ ↓ 3% vs yesterday            │ → No change     │
├──────────────┴──────────────┴──────────────┴──────────────┴─────────────────┤
│ 👥 6 Supervisors Online     │ 💡 System Health: 89%       │ 🟢 All Systems Go │
└──────────────────────────────────────────────────────────────────────────────┘
```
**UI Annotations:**
- Each metric is presented as a column card with icon, bold stat, subtitle, and trend arrow.
- Use coloured chips (🟢, 🟡, 🔴) to indicate status (e.g., system health, supervisor online).
- Hover tooltips on trend indicators (arrow/percentage) to show historical context.
- Responsive design: On mobile, metrics stack vertically for readability.

### Main Dashboard (Three Column Layout)
```
┌────────────────────────┬────────────────────────┬────────────────────────┐
│ 🚌 <RouteImpactSection>│ 📊 <AlertVolumeChart>   │ 👥 <SupervisorActivity> │
│   - Table (sortable)   │   - Line + Pie Chart    │   - Top performers     │
│   - Severity tags      │   - Time filterable     │   - Avg response chip  │
│   - Route tags         │   - Hover detail        │   - Sparkline activity │
├────────────────────────┼────────────────────────┼────────────────────────┤
│ 🔌 <DataSourceStatus>  │ ⏱️ <ResponseTimeChart> │ 🗺️ <GeographicHeatmap> │
│   - Chip per source    │   - Bar chart by hour   │   - Map (Leaflet.js)   │
│   - Status colours     │   - Target line overlay │   - Zoom & pan         │
└────────────────────────┴────────────────────────┴────────────────────────┘
```
**Component & Interactivity Annotations:**
- `<RouteImpactSection>`: Sortable table, severity tags (colour-coded), clickable route tags for drill-down.
- `<AlertVolumeChart>`: Line and pie chart combo, time filterable (via dropdown), hover for detailed values.
- `<SupervisorActivity>`: Leaderboard of top performers, average response time chip, sparkline for activity trend.
- `<DataSourceStatus>`: One chip per source (TomTom, National Highways, etc.), status colour (🟢, 🟡, 🔴), hover for last update/error.
- `<ResponseTimeChart>`: Bar chart by hour, overlay line for target, accessible via keyboard.
- `<GeographicHeatmap>`: Interactive map (Leaflet.js), hotspots pin-based, zoom & pan, legend bar.
- All charts animate on load, all metrics and controls support keyboard navigation and ARIA roles.

### Bottom Section - Recent Activity
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ 📋 <RecentActivityLog>                                                       │
│ - Table view with timestamp, user, and action                               │
│ - Colour-coded icons for action types                                       │
│ - [Export] as CSV, [Time Filter] dropdown (Today, Week, Month)              │
└──────────────────────────────────────────────────────────────────────────────┘
```
**Description:**
- `<RecentActivityLog>`: Table with columns for time, user, action. Action types show coloured icons (e.g. create, update, system).
- Export options use `<ExportOptions />` component (CSV, PDF, Email).
- Time filter uses `<TimeRangeFilter />` component (dropdown: Today, Week, Month).

> All primary UI elements must follow the operations theme, support reduced motion preference, and comply with ARIA guidelines for screen readers.

---

## 🖼️ UI Wireframe Design Reference

All layout designs should be wireframed in Figma or Adobe XD using the Go BARRY design system.

- **Metric Card Template:**  
  - Icon + Bold Stat + Subtitle + Trend
- **Chart Container:**  
  - Title bar with info icon and filter options  
  - Inner chart area padded with 24px
- **Map Container:**  
  - Legend bar  
  - Pin-based heatmapping
- **Responsive layout:**  
  - Collapsible sections on mobile  
  - Stackable column components

---

## 🔧 Implementation Phases

### Phase 1: Foundation (Day 1 - 4 hours)
**Objective:** Basic dashboard with real-time overview

#### Tasks:
1. **Create component structure** (30 mins)
   - Set up directories and base files
   - Create StatisticsComponent.jsx main file
   - Set up styling framework

2. **Build Real-Time Overview** (90 mins)
   - Create metric cards component
   - Implement trend indicators
   - Add responsive grid layout

3. **Data Source Status Panel** (60 mins)
   - Create status indicator components
   - Add health check integration
   - Implement automatic refresh

4. **Basic API Integration** (60 mins)
   - Create useStatisticsData hook
   - Set up API endpoints structure
   - Implement error handling

**Deliverables:**
- ✅ Functional basic dashboard
- ✅ Real-time metric cards
- ✅ Data source health monitoring
- ✅ Responsive layout

### Phase 2: Analytics & Charts (Day 2 - 5 hours)
**Objective:** Add comprehensive charts and route analytics

#### Tasks:
1. **Chart Library Integration** (45 mins)
   - Install and configure Recharts
   - Create base chart components
   - Set up theming for charts

2. **Alert Volume Chart** (75 mins)
   - Time series line chart
   - Interactive tooltips
   - Zoom and pan functionality

3. **Incident Categories Chart** (60 mins)
   - Pie chart with drill-down
   - Color-coded categories
   - Percentage labels

4. **Route Impact Analysis** (90 mins)
   - Most affected routes table
   - Performance metrics cards
   - Critical routes alerts

5. **Response Time Analytics** (60 mins)
   - Bar chart by time periods
   - Target vs actual indicators
   - Supervisor performance comparison

**Deliverables:**
- ✅ Interactive charts with real data
- ✅ Route performance analytics
- ✅ Response time tracking
- ✅ Visual incident categorization

### Phase 3: Advanced Features (Day 3 - 4 hours)
**Objective:** Add advanced analytics and user experience features

#### Tasks:
1. **Geographic Heatmap** (90 mins)
   - Incident location visualization
   - Hotspot identification
   - Interactive map integration

2. **Time Range Filtering** (60 mins)
   - Date picker component
   - Dynamic data refresh
   - Period comparison

3. **Supervisor Activity Dashboard** (75 mins)
   - Performance leaderboard
   - Activity timeline
   - Efficiency metrics

4. **Export Functionality** (45 mins)
   - CSV data export
   - PDF report generation
   - Email sharing options

**Deliverables:**
- ✅ Geographic visualization
- ✅ Flexible time filtering
- ✅ Supervisor performance tracking
- ✅ Data export capabilities

---

## 🔌 API Endpoints Required

### New Backend Endpoints
```javascript
// Dashboard Overview
GET /api/statistics/dashboard
Response: {
  realTime: RealTimeMetrics,
  summary: DashboardSummary
}

// Route Performance
GET /api/statistics/routes/performance?timeRange=today
Response: {
  mostAffected: Array<RouteMetrics>,
  criticalRoutes: Array<string>,
  performance: PerformanceMetrics
}

// Alert Analytics
GET /api/statistics/alerts/volume?timeRange=today&groupBy=hour
Response: {
  volume: Array<TimeSeriesPoint>,
  categories: Array<CategoryBreakdown>
}

// Incident Analytics
GET /api/statistics/incidents/categories?timeRange=week
Response: {
  categories: Array<IncidentCategory>,
  trends: Array<TrendData>
}

// Supervisor Activity
GET /api/statistics/supervisors/activity?timeRange=today
Response: {
  active: Array<SupervisorStatus>,
  performance: Array<SupervisorMetrics>,
  leaderboard: Array<SupervisorRanking>
}

// System Health
GET /api/statistics/system/health
Response: {
  dataSources: DataSourceHealth,
  performance: SystemPerformance,
  uptime: UptimeMetrics
}

// Geographic Data
GET /api/statistics/geographic/hotspots?timeRange=today
Response: {
  hotspots: Array<GeographicHotspot>,
  distribution: Array<AreaMetrics>
}

// Export Data
GET /api/statistics/export?type=csv&timeRange=today&sections=all
Response: CSV file download

POST /api/statistics/reports/generate
Body: { type: 'daily' | 'weekly', format: 'pdf' | 'csv' }
Response: { reportUrl: string, expiresAt: timestamp }
```

### Convex Schema Extensions
```javascript
// convex/schema.ts - Add statistics tables
export default defineSchema({
  // ... existing tables
  
  statisticsCache: defineTable({
    cacheKey: v.string(),
    data: v.any(),
    timeRange: v.string(),
    generatedAt: v.number(),
    expiresAt: v.number()
  }).index("by_cache_key", ["cacheKey"]),
  
  supervisorMetrics: defineTable({
    supervisorId: v.string(),
    date: v.string(), // YYYY-MM-DD
    actionsCount: v.number(),
    avgResponseTime: v.number(),
    efficiency: v.number(),
    lastActivity: v.number()
  }).index("by_supervisor_date", ["supervisorId", "date"]),
  
  routePerformance: defineTable({
    routeId: v.string(),
    date: v.string(),
    incidentCount: v.number(),
    avgDelay: v.number(),
    severity: v.string()
  }).index("by_route_date", ["routeId", "date"])
});

// convex/statistics.ts - New functions
export const getDashboardMetrics = query({
  handler: async (ctx) => {
    // Implementation for real-time dashboard data
  }
});

export const getRoutePerformance = query({
  args: { timeRange: v.string() },
  handler: async (ctx, args) => {
    // Implementation for route analytics
  }
});

export const getSupervisorActivity = query({
  args: { timeRange: v.string() },
  handler: async (ctx, args) => {
    // Implementation for supervisor metrics
  }
});
```

---

## 🎨 UI/UX Specifications

### Design System Integration
```javascript
// Use existing operations theme
import { operationsTheme } from '../styles/theme.exports.js';

const statisticsTheme = {
  ...operationsTheme,
  charts: {
    primary: '#3B82F6',
    secondary: '#10B981', 
    warning: '#F59E0B',
    danger: '#EF4444',
    grid: '#E5E7EB',
    text: '#374151'
  },
  metrics: {
    success: '#10B981',
    warning: '#F59E0B',
    critical: '#EF4444',
    neutral: '#6B7280'
  }
};
```

### Component Styling Guidelines
- **Consistent spacing** using operationsTheme.spacing
- **Responsive design** with breakpoints for mobile/tablet/desktop
- **Accessible colors** meeting WCAG AA standards
- **Loading states** for all data components
- **Error boundaries** for graceful failure handling

### Interactive Elements
- **Hover effects** on charts and clickable elements
- **Tooltip information** for detailed metrics
- **Click-to-drill-down** functionality
- **Keyboard navigation** support
- **Touch-friendly** controls for mobile

---

## 📱 Responsive Design

### Breakpoints
```javascript
const breakpoints = {
  mobile: 'max-width: 768px',
  tablet: 'min-width: 769px and max-width: 1024px',
  desktop: 'min-width: 1025px'
};
```

### Layout Adaptations
- **Mobile:** Single column, stacked cards
- **Tablet:** Two column, simplified charts
- **Desktop:** Three column, full feature set

### Chart Responsive Behavior
- **Mobile:** Simplified charts, swipe navigation
- **Tablet:** Medium complexity, touch interactions
- **Desktop:** Full featured charts with all interactions

---

## 🔍 Testing Strategy

### Unit Tests
```javascript
// Components to test
StatisticsComponent.test.jsx
RealTimeOverview.test.jsx
AlertVolumeChart.test.jsx
IncidentCategoriesChart.test.jsx
RouteImpactSection.test.jsx
DataSourceStatus.test.jsx
SupervisorActivity.test.jsx

// Hooks to test
useStatisticsData.test.js
useChartData.test.js

// Utils to test
chartHelpers.test.js
dataFormatters.test.js
```

### Integration Tests
- **API integration** with real endpoints
- **Convex queries** with sample data
- **Chart rendering** with various data sets
- **Export functionality** end-to-end
- **Real-time updates** via WebSocket

### Performance Tests
- **Chart rendering** with large datasets
- **Memory usage** with continuous updates
- **Load time** optimization
- **Mobile performance** validation

---

## 📈 Performance Considerations

### Data Optimization
- **Caching strategy** for expensive calculations
- **Lazy loading** for non-critical charts
- **Data pagination** for large datasets
- **Incremental updates** for real-time data

### Rendering Optimization
- **React.memo** for expensive components
- **useMemo** for complex calculations
- **Virtual scrolling** for large lists
- **Chart animation** performance tuning

### API Efficiency
- **Request batching** for multiple metrics
- **Background refresh** for updated data
- **Conditional requests** based on data freshness
- **Error retry** logic with exponential backoff

---

## 🚀 Deployment & Monitoring

### Deployment Checklist
- [ ] All API endpoints implemented and tested
- [ ] Convex schema updated and deployed
- [ ] Frontend components built and tested
- [ ] Performance benchmarks validated
- [ ] Mobile responsive testing completed
- [ ] Accessibility testing passed
- [ ] Error handling verified
- [ ] Documentation updated

### Monitoring Metrics
- **Component load times**
- **API response times**
- **Chart rendering performance**
- **User interaction patterns**
- **Error rates and types**

### Success Metrics
- **Dashboard load time** < 2 seconds
- **Chart interaction responsiveness** < 100ms
- **Data refresh frequency** every 30 seconds
- **Mobile usability score** > 90
- **Supervisor adoption rate** > 80%

---

## 📝 Future Enhancements

### Phase 4: Advanced Analytics (Future)
- **Predictive analytics** for incident forecasting
- **Machine learning insights** for pattern recognition
- **Custom dashboard** creation by supervisors
- **Alert correlation** analysis
- **Performance benchmarking** against historical data

### Phase 5: Integration Expansions (Future)
- **Email reporting** automation
- **Slack integration** for key metrics
- **Mobile app** dedicated statistics view
- **External dashboard** sharing for management
- **API access** for third-party integrations

---

## 📋 Acceptance Criteria

### Functional Requirements
- ✅ Display real-time operational metrics
- ✅ Show route performance analytics
- ✅ Monitor data source health
- ✅ Track supervisor activity
- ✅ Provide historical trend analysis
- ✅ Enable data export functionality
- ✅ Support responsive design
- ✅ Integrate with existing authentication

### Non-Functional Requirements
- ✅ Load dashboard in < 2 seconds
- ✅ Update data every 30 seconds
- ✅ Support 10+ concurrent users
- ✅ Maintain 99% uptime
- ✅ WCAG AA accessibility compliance
- ✅ Cross-browser compatibility
- ✅ Mobile-first responsive design

### User Experience Requirements
- ✅ Intuitive navigation
- ✅ Clear visual hierarchy
- ✅ Meaningful error messages
- ✅ Consistent with Operations Centre design
- ✅ Fast interactive responses
- ✅ Helpful tooltips and guidance

---

## 📞 Next Steps

1. **Review and approval** of this plan
2. **API endpoint specification** finalization
3. **Convex schema updates** implementation
4. **Phase 1 development** kickoff
5. **Testing strategy** setup
6. **Performance baseline** establishment

---

**Plan Status:** 📋 Ready for Implementation  
**Estimated Total Time:** 12-15 hours across 3 development days  
**Risk Level:** Low - builds on existing patterns and infrastructure  
**Dependencies:** None - can be developed independently  

*This plan provides a comprehensive roadmap for implementing a professional-grade statistics dashboard that will give Go BARRY supervisors the operational insights they need to make data-driven decisions.*