# 🧪 Testing Integration Guide

## 📋 Overview

This guide shows how to integrate the testing tools into your SDC Dashboard for comprehensive testing of the enhancement features.

---

## 🎯 **Quick Integration Steps**

### **Step 1: Add Test Launcher to SDC Dashboard**

Add the TestLauncher component to your SDC Dashboard:

```jsx
// In /src/dashboards/sdc/SDCDashboard.jsx
import TestLauncher from '../../components/testing/TestLauncher';

const SDCDashboard = () => {
  // ... existing code ...
  
  return (
    <DashboardLayout title="SDC Operations Centre" icon="🎯">
      {/* ... existing dashboard content ... */}
      
      {/* Add Test Launcher (only shows in development) */}
      <TestLauncher />
    </DashboardLayout>
  );
};
```

### **Step 2: Enable Testing Environment Variables**

Add to your `.env.development` file:

```bash
# Testing Configuration
VITE_ENABLE_TESTING=true
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
```

### **Step 3: Verify Dependencies**

Ensure these dependencies are available:

```jsx
// Required imports that should already exist
import websocketService from '../../services/websocket';
import { apiConfig } from '../../breakdown-guide/components/common/constants';
```

---

## 🔧 **Manual Testing Scenarios**

### **Scenario 1: Assessment in Progress**

**Test Steps:**
1. Click the 🧪 test button (bottom-left in development)
2. Click "Run Test" for "🔄 Assessment Progress Test"
3. Watch for real-time progress updates on dashboard
4. Verify progress ring and step descriptions update

**Expected Results:**
- ✅ Progress card appears
- ✅ Steps increment from 1/5 to 5/5
- ✅ Elapsed time updates every second
- ✅ Supervisor information displays

### **Scenario 2: Assessment Completion**

**Test Steps:**
1. Run "✅ Assessment Completion Test"
2. Verify automatic redirect with highlight parameter
3. Check decision badge (STOP/AMBER/CONTINUE)
4. Confirm "Edit Assessment" button appears

**Expected Results:**
- ✅ Redirect to `/dashboards/sdc?highlight=BD-2025-XXXXX`
- ✅ Breakdown card highlighted for 8-10 seconds
- ✅ Decision badge shows correct color and icon
- ✅ Progress card removed from active assessments

### **Scenario 3: Edit Assessment**

**Test Steps:**
1. Click "Edit Assessment" on completed breakdown
2. Test all three tabs in modal
3. Complete edit workflow with reason
4. Verify redirect to breakdown guide

**Expected Results:**
- ✅ Modal opens with three functional tabs
- ✅ Audit trail displays chronologically
- ✅ Edit form validates required fields
- ✅ Redirect includes edit parameters

### **Scenario 4: WebSocket Fallback**

**Test Steps:**
1. Run "📡 WebSocket Fallback Test"
2. Block WebSocket in DevTools Network tab
3. Verify polling activates (XHR requests every 5s)
4. Unblock WebSocket and confirm reconnection

**Expected Results:**
- ✅ Automatic fallback to polling
- ✅ Connection status shows "Reconnecting"
- ✅ Data updates continue via polling
- ✅ WebSocket reconnects when available

### **Scenario 5: Multi-Supervisor**

**Test Steps:**
1. Login with different supervisor accounts
2. Test "My Breakdowns" filter
3. Verify supervisor context switching
4. Check filter persistence across sessions

**Expected Results:**
- ✅ Filters show correct supervisor data
- ✅ Context switching updates counters
- ✅ Filter state persists on page reload
- ✅ No data leakage between supervisors

### **Scenario 6: Mobile Responsive**

**Test Steps:**
1. Open DevTools → Toggle device toolbar
2. Test iPhone, iPad, and Galaxy S20 viewports
3. Verify touch targets and scrolling
4. Test modal behavior on mobile

**Expected Results:**
- ✅ Breakdown counter hides on mobile
- ✅ Layout stacks vertically
- ✅ Filter tabs scroll horizontally
- ✅ Touch targets meet 44px minimum

---

## 🚀 **Automated Testing**

### **Run All Tests**

The testing panel provides automated tests for all scenarios:

1. **Click "🚀 Run All Tests"** in the testing panel
2. **Watch progress** as each test executes
3. **Review results** - ✅ Pass, ❌ Fail, ⚠️ Warning
4. **Check test data** by expanding result details

### **Individual Test Execution**

Each test can be run individually:

```javascript
// Manual test execution via console
testAssessmentProgress();
testAssessmentCompletion(); 
testWebSocketConnection();
testSupervisorContext();
testMobileResponsive();
testEditAssessment();
```

---

## 📊 **Test Results Interpretation**

### **Status Indicators:**

- **✅ PASSED** - Test completed successfully
- **❌ FAILED** - Critical error occurred
- **⚠️ WARNING** - Test passed with minor issues
- **⏳ PENDING** - Test not yet run

### **Common Issues:**

#### **WebSocket Connection Failures**
```javascript
// Debug WebSocket issues
console.log('WebSocket State:', websocketService.getStats());
```

#### **API Endpoint Failures**
```javascript
// Test API connectivity
fetch('/api/breakdowns/active')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

#### **Supervisor Context Issues**
```javascript
// Check supervisor session
console.log('Current Supervisor:', localStorage.getItem('currentSupervisor'));
```

---

## 🔍 **Debug Tools**

### **WebSocket Monitoring**

Monitor real-time messages:

```javascript
websocketService.subscribe('/ws/sdc-dashboard', (data) => {
  console.log('Real-time message:', data);
});
```

### **Connection Status**

Check connection health:

```javascript
// Connection statistics
console.log(websocketService.getStats());

// Specific endpoint status
console.log('SDC Connected:', websocketService.isConnected('/ws/sdc-dashboard'));
```

### **Performance Monitoring**

Track performance metrics:

```javascript
// Monitor component render times
console.time('dashboard-update');
// ... component updates
console.timeEnd('dashboard-update');

// Memory usage
console.log('Memory:', performance.memory);
```

---

## 📱 **Mobile Testing Setup**

### **Device Simulation**

1. **Open DevTools** (F12)
2. **Toggle Device Toolbar** (Ctrl+Shift+M)
3. **Select Device Presets:**
   - iPhone 12 Pro (390x844)
   - iPad (768x1024)
   - Galaxy S20 (360x800)

### **Touch Simulation**

Enable touch events in DevTools:
1. **Settings** → **Experiments**
2. **Enable "Touch"**
3. **Restart DevTools**

### **Network Throttling**

Test mobile network conditions:
1. **Network Tab** → **Throttling Dropdown**
2. **Select "Slow 3G"**
3. **Monitor real-time update performance**

---

## 🎯 **Test Coverage Matrix**

| Feature | Manual Test | Automated Test | Mobile Test | Notes |
|---------|-------------|----------------|-------------|-------|
| Assessment Progress | ✅ | ✅ | ✅ | Real-time updates |
| Assessment Completion | ✅ | ✅ | ✅ | Redirect functionality |
| Edit Assessment | ✅ | ✅ | ✅ | Audit trail |
| WebSocket Fallback | ✅ | ✅ | ⚠️ | Network dependent |
| Multi-Supervisor | ✅ | ✅ | ✅ | Context switching |
| Mobile Responsive | ✅ | ✅ | ✅ | Layout adaptation |

---

## 🚨 **Critical Test Points**

### **Must Pass Before Deployment:**

1. **Real-time Updates Work** - Progress tracking functional
2. **Redirect Logic Functions** - Assessment completion redirects properly
3. **Edit Audit Trail Logs** - Audit entries created correctly
4. **Fallback Mechanism Works** - Polling activates on WebSocket failure
5. **Mobile Layout Adapts** - No broken layouts on mobile devices
6. **Filter Persistence Works** - Filters survive page reloads

### **Performance Benchmarks:**

- **Real-time update latency:** < 2 seconds
- **WebSocket reconnection:** < 10 seconds
- **Polling fallback activation:** < 10 seconds
- **Mobile touch response:** < 100ms
- **Dashboard load time:** < 3 seconds

---

## 🔧 **Troubleshooting Common Issues**

### **Issue: Tests Don't Appear**

**Solution:**
```javascript
// Check development mode
console.log('Environment:', import.meta.env.MODE);
console.log('Hostname:', window.location.hostname);
```

### **Issue: WebSocket Connection Fails**

**Solution:**
```javascript
// Check WebSocket URL
console.log('WebSocket URL:', websocketConfig.url);

// Manual connection test
websocketService.connect('/ws/test', {
  onOpen: () => console.log('Test connection successful'),
  onError: (error) => console.log('Connection failed:', error)
});
```

### **Issue: Real-time Updates Don't Work**

**Solution:**
```javascript
// Check message handlers
console.log('Message handlers:', websocketService.messageHandlers);

// Test message sending
websocketService.send('/ws/sdc-dashboard', { type: 'test', data: 'hello' });
```

---

## 📋 **Final Testing Checklist**

Before marking testing complete:

- [ ] All 6 main test scenarios pass
- [ ] Mobile responsive design verified on 3+ devices  
- [ ] WebSocket fallback mechanism tested
- [ ] Audit trail functionality confirmed
- [ ] Performance benchmarks met
- [ ] No console errors during testing
- [ ] All critical user workflows functional
- [ ] Cross-browser compatibility verified

**Testing Complete Date:** `_________________`

**Tested By:** `_________________`

**Deployment Approved:** [ ] YES [ ] NO

---

This integration guide provides everything needed to thoroughly test the SDC Dashboard enhancement features. The combination of automated and manual testing ensures comprehensive coverage of all functionality.