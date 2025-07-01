# Operations Centre - Testing Checklist

**Phase 6: Comprehensive Testing**  
**Date Started:** June 30, 2025  
**Status:** In Progress

## 🧪 Test Suites Created

### ✅ Unit Tests
- [x] OperationsHeader.test.js - Tests header component functionality
- [x] StatusBar.test.js - Tests system status display
- [ ] OperationsCard.test.js - Card component tests (TODO)
- [ ] QuickActions.test.js - Quick actions tests (TODO)
- [ ] ActivityFeed.test.js - Activity feed tests (TODO)

### ✅ Integration Tests
- [x] integration-test.js - Full user journey testing
  - Navigation to Operations Centre
  - Page structure verification
  - UK localisation check
  - Component interaction
  - Navigation functionality

### ✅ Performance Tests
- [x] performance-test.js - Lighthouse performance audit
  - Core Web Vitals measurement
  - Resource metrics
  - Performance opportunities
  - Detailed reporting

### ✅ Accessibility Tests
- [x] accessibility-test.js - WCAG compliance testing
  - Automated axe-core testing
  - Keyboard navigation check
  - ARIA attributes verification
  - Color contrast validation
  - Heading structure analysis

## 📋 Manual Testing Checklist

### Functional Testing
- [ ] All gradient cards load correctly
- [ ] Card hover animations work
- [ ] Quick actions are clickable
- [ ] Activity feed shows recent items
- [ ] Status bar updates in real-time
- [ ] Navigation to sub-pages works
- [ ] Back button returns to home
- [ ] All UK spelling is correct

### Visual Testing
- [ ] Dark theme displays correctly
- [ ] Responsive on mobile (375px)
- [ ] Responsive on tablet (768px)
- [ ] Responsive on desktop (1920px)
- [ ] Animations are smooth (60fps)
- [ ] No layout shifts during load
- [ ] Icons display correctly
- [ ] Gradients render properly

### Cross-Browser Testing
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

### Performance Targets
- [ ] First Contentful Paint < 2s
- [ ] Largest Contentful Paint < 2.5s
- [ ] Time to Interactive < 3.5s
- [ ] Total Blocking Time < 300ms
- [ ] Cumulative Layout Shift < 0.1
- [ ] Lighthouse Score > 90

### Accessibility Requirements
- [ ] All interactive elements keyboard accessible
- [ ] Screen reader announces content correctly
- [ ] Color contrast ratio ≥ 4.5:1 (WCAG AA)
- [ ] Focus indicators visible
- [ ] No accessibility violations (critical/serious)
- [ ] Alt text on all images

## 🔧 Test Execution

### Running Tests

```bash
# Install test dependencies first
cd /Users/anthony/Go\ BARRY\ App
npm install --save-dev jest @testing-library/react-native puppeteer lighthouse @axe-core/puppeteer

# Run individual test suites
npm test                           # Unit tests
node scripts/integration-test.js   # Integration tests
node scripts/performance-test.js   # Performance tests
node scripts/accessibility-test.js # Accessibility tests

# Run all tests
node scripts/run-all-tests.js
```

### Test Environment Setup
1. Ensure Go BARRY is running locally: `npm start`
2. Access at: http://localhost:19006
3. Backend API should be accessible
4. Use test supervisor account (e.g., AG003)

## 📊 Test Results Summary

### Latest Test Run: June 30, 2025
- **Unit Tests:** ⏳ Pending (Jest not configured)
- **Integration Tests:** ❌ Failing - Can't find 'Operations Centre' selector
- **Performance Tests:** ⏳ Not run yet
- **Accessibility Tests:** ⏳ Not run yet

### Test Environment
- ✅ Expo running on port 8081
- ✅ Services verified accessible
- ✅ Test scripts converted to ES modules
- ❌ Integration test needs selector fix

### Issues Found
1. **Bundling Error #1** - browser-main-optimized.jsx imports ✅ FIXED
   - Severity: Critical (app wouldn't load)
   - Component: Lazy imports for IncidentManager, RoadworksManager, AIDisruptionManager
   - Fix: Updated import paths to /components/operations/

2. **Bundling Error #2** - operations-old.jsx imports ✅ FIXED  
   - Severity: Critical (app wouldn't load)
   - Component: Direct imports for DutyBoards, IncidentManager, etc.
   - Fix: Updated import paths to /components/operations/

3. **Integration Test Failure** - Cannot find 'Operations Centre' (pending retest)
   - Severity: Blocking
   - Component: Homepage navigation
   - Likely cause: App wasn't loading due to bundling errors

### Debug Tools Created
1. `simple-test.js` - Captures page HTML for inspection
2. `integration-test-v2.js` - More flexible test approach
3. `test-operations-fixed.js` - Updated test for fixed app
4. `visual-check.js` - Manual browser inspection
5. Multiple other debug scripts in `/scripts/`

### Fixes Applied
1. **Import Path Fix** - Updated component imports in browser-main-optimized.jsx
   - Changed to: `../components/operations/IncidentManager`
   - Changed to: `../components/operations/RoadworksManager`
   - Changed to: `../components/operations/DisruptionDatabase`
   - Date: June 30, 2025

## 🚀 Next Steps

After all tests pass:
1. Update test results in this document
2. Create test report for stakeholders
3. Proceed to Phase 7: Deployment Preparation
4. Schedule UAT with supervisors

---

**Tester:** Anthony Gair  
**Last Updated:** June 30, 2025
