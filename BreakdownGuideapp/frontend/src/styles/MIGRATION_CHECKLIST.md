# Theme Migration Checklist

## Theme System Implementation Status

### ✅ Created Files
1. `/src/styles/theme.js` - Theme constants and utilities
2. `/src/styles/global-theme.css` - CSS variables and global styles
3. `/src/styles/ThemeProvider.jsx` - React theme utilities
4. `/src/styles/THEME_GUIDE.md` - Usage documentation
5. `/src/styles/index.js` - Central exports
6. `/src/dashboards/DashboardThemeGuide.jsx` - Implementation examples

### ✅ Updated Files
1. `/src/main.jsx` - Added global theme CSS import
2. `/vite.config.js` - Added @styles alias

### 📝 Files to Update

#### Dashboard Components
1. **Breakdown Dashboard** 
   - `/src/dashboards/breakdown/BreakdownDashboard.jsx`
   - `/src/dashboards/breakdown/BreakdownCard.jsx`
   - `/src/dashboards/breakdown/EngineeringStats.jsx`
   - `/src/dashboards/breakdown/breakdown-styles.css`

2. **SDC Dashboard**
   - `/src/dashboards/sdc/SDCDashboard.jsx`
   - `/src/dashboards/sdc/SDCBreakdownCard.jsx`
   - `/src/dashboards/sdc/PriorityAlerts.jsx`
   - `/src/dashboards/sdc/StatusWidget.jsx`
   - `/src/dashboards/sdc/RecentDecisions.jsx`

3. **Engineering Dashboard**
   - `/src/dashboards/engineering/EngineeringDashboard.jsx`
   - `/src/dashboards/engineering/EngineeringCard.jsx`
   - `/src/dashboards/engineering/DepotStats.jsx`
   - `/src/dashboards/engineering/EngineerModal.jsx`

4. **Management Dashboard**
   - `/src/dashboards/management/ManagementDashboard.jsx`
   - `/src/dashboards/management/ExecutiveKPIs.jsx`
   - `/src/dashboards/management/PerformanceTrends.jsx`
   - `/src/dashboards/management/DepotComparison.jsx`
   - `/src/dashboards/management/FleetHealth.jsx`
   - `/src/dashboards/management/ExportPanel.jsx`

#### Shared Components
5. **Dashboard Components**
   - `/src/dashboards/components/DashboardLayout.jsx`
   - `/src/dashboards/components/StatsCard.jsx`
   - `/src/dashboards/components/LiveIndicator.jsx`
   - `/src/dashboards/components/FilterBar.jsx`

6. **Dashboard Styles**
   - `/src/dashboards/dashboard-styles.css`
   - `/src/dashboards/dashboard-animations.css`

#### Breakdown Guide Components
7. **Main Components**
   - `/src/breakdown-guide/App.js`
   - `/src/breakdown-guide/SupervisorLogin.js`
   - `/src/breakdown-guide/FleetSelectionModal.js`

8. **Wizard Components** (33 files)
   - All files in `/src/breakdown-guide/wizards/`
   - Update to use theme colors for STOP/AMBER/CONTINUE

9. **Common Components**
   - `/src/breakdown-guide/common/AssessmentSummary.jsx`
   - `/src/breakdown-guide/common/BreakdownInfoStep.js`
   - `/src/breakdown-guide/common/icons.js`

### 🔄 Migration Steps

#### Step 1: Update CSS Files
Replace hardcoded colors with CSS variables:
```css
/* Before */
background-color: #1a1a1a;
color: #ffffff;
border: 1px solid #333;

/* After */
background-color: var(--bg-secondary);
color: var(--text-primary);
border: 1px solid var(--border);
```

#### Step 2: Update JavaScript Components
Import and use theme:
```javascript
// Import theme
import { theme } from '@styles/theme';
// or
import { getStatusColor } from '@styles/theme';

// Use in styles
const styles = {
  backgroundColor: theme.colors.bgSecondary,
  color: theme.colors.textPrimary,
};
```

#### Step 3: Use Theme Classes
Replace custom classes with theme classes:
```html
<!-- Before -->
<div className="custom-card">

<!-- After -->
<div className="theme-card">
```

### 🎨 Color Mapping

| Old Color | New CSS Variable | New JS Theme |
|-----------|-----------------|--------------|
| #121212 | var(--bg-primary) | theme.colors.bgPrimary |
| #1a1a1a | var(--bg-secondary) | theme.colors.bgSecondary |
| #242424 | var(--bg-tertiary) | theme.colors.bgTertiary |
| #e4251b | var(--color-primary) | theme.colors.primary |
| #ffffff | var(--text-primary) | theme.colors.textPrimary |
| #a0a0a0 | var(--text-secondary) | theme.colors.textSecondary |
| #333333 | var(--border) | theme.colors.border |
| #28a745 | var(--color-success) | theme.colors.success |
| #ffc107 | var(--color-warning) | theme.colors.warning |
| #dc3545 | var(--color-danger) | theme.colors.danger |

### 🔧 Testing

After updating each component:
1. Check all colors match the theme
2. Test hover states
3. Verify status colors (STOP/AMBER/CONTINUE)
4. Test in both light and dark environments
5. Check mobile responsiveness

### 📊 Progress Tracker

- [x] Theme system created
- [ ] Breakdown Dashboard updated
- [ ] SDC Dashboard updated
- [ ] Engineering Dashboard updated
- [ ] Management Dashboard updated
- [ ] Shared components updated
- [ ] Breakdown Guide updated
- [ ] All CSS files migrated
- [ ] All hardcoded colors removed
- [ ] Documentation complete

### 💡 Tips

1. Use Find & Replace for common colors
2. Test one dashboard at a time
3. Keep the theme guide open for reference
4. Update related CSS when updating JS
5. Document any custom colors needed
