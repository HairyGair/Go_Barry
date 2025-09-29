# 🧪 SDC Operations Dashboard Testing Guide

## 📋 Test Scenarios Overview

This guide provides comprehensive testing scenarios for the enhanced SDC Operations Dashboard functionality.

---

## 🎯 **Scenario 1: Assessment in Progress - Live Updates**

### **Test Description:**
Verify that live assessment progress is displayed as supervisors work through wizards.

### **Prerequisites:**
- SDC Dashboard is open and connected
- At least one supervisor account available for testing
- Backend API endpoints are functional

### **Test Steps:**

#### **Step 1.1: Start Assessment**
```bash
# Open breakdown guide in separate tab/window
1. Navigate to /breakdown-guide
2. Login with supervisor credentials (e.g., AG003)
3. Start any wizard assessment
4. Note the breakdown ID generated
```

#### **Step 1.2: Verify Live Tracking**
```bash
# Check SDC Dashboard shows progress
1. Switch to SDC Dashboard tab
2. Verify AssessmentProgressCard appears
3. Check progress ring shows current step
4. Verify supervisor name is displayed
5. Confirm elapsed time is updating
```

#### **Step 1.3: Test Step Progression**
```bash
# Progress through wizard steps
1. Return to breakdown guide
2. Complete 1-2 wizard steps
3. Switch back to SDC Dashboard
4. Verify progress ring updates (e.g., 3/5 steps)
5. Check step description updates
6. Confirm timing information updates
```

### **Expected Results:**
- ✅ Progress card appears immediately when assessment starts
- ✅ Step counter updates in real-time (e.g., "2/5")
- ✅ Progress ring fills proportionally
- ✅ Elapsed time increments every second
- ✅ Step description shows current wizard action
- ✅ Supervisor information displays correctly

### **Debugging Commands:**
```javascript
// Check WebSocket connection
console.log('WebSocket State:', websocketService.getConnectionState('/ws/sdc-dashboard'));

// Monitor real-time messages
websocketService.subscribe('/ws/sdc-dashboard', (data) => {
  console.log('Real-time message:', data);
});

// Check active assessments
fetch('/api/breakdowns/in-progress').then(r => r.json()).then(console.log);
```

---

## ✅ **Scenario 2: Assessment Completed - Decision & Redirect**

### **Test Description:**
Verify that completed assessments show decisions and trigger dashboard redirects.

### **Test Steps:**

#### **Step 2.1: Complete Assessment**
```bash
# Finish wizard assessment
1. Complete all wizard steps in breakdown guide
2. Submit final assessment with decision (STOP/AMBER/CONTINUE)
3. Note the breakdown ID for tracking
```

#### **Step 2.2: Verify Dashboard Redirect**
```bash
# Check automatic redirect behavior
1. Assessment completion should redirect to:
   /dashboards/sdc?highlight={breakdownId}
2. Verify breakdown card is highlighted
3. Check highlight animation/styling
4. Confirm decision badge shows correct status
```

#### **Step 2.3: Verify Decision Display**
```bash
# Check decision information
1. Locate the completed breakdown card
2. Verify decision badge (🛑 STOP, ⚡ AMBER, ✅ CONTINUE)
3. Check color coding matches decision
4. Confirm "Edit Assessment" button appears
5. Verify assessment timestamp is displayed
```

### **Expected Results:**
- ✅ Automatic redirect to SDC Dashboard with highlight
- ✅ Breakdown card shows prominent highlighting (8-10 seconds)
- ✅ Decision badge displays with correct icon and color
- ✅ "Edit Assessment" button is visible and functional
- ✅ Progress card disappears from active assessments
- ✅ Breakdown moves to appropriate filter category

### **URL Check:**
```bash
# Expected redirect URL format
/dashboards/sdc?highlight=BD-2025-00034
```

---

## 🔄 **Scenario 3: Edit Assessment - Audit Trail Workflow**

### **Test Description:**
Test the edit assessment functionality and audit trail creation.

### **Test Steps:**

#### **Step 3.1: Initiate Edit**
```bash
# Start edit process
1. Find a completed breakdown card
2. Click "Edit Assessment" button
3. Verify EditAssessmentModal opens
4. Check all three tabs are present:
   - Assessment Details
   - Audit Trail
   - Edit Assessment
```

#### **Step 3.2: Review Assessment Details**
```bash
# Check assessment tab
1. Click "Assessment Details" tab
2. Verify decision badge shows correctly
3. Check supervisor information
4. Confirm completion timestamp
5. Review wizard responses if available
```

#### **Step 3.3: Review Audit Trail**
```bash
# Check audit history
1. Click "Audit Trail" tab
2. Verify chronological history display
3. Check timestamps are formatted correctly
4. Confirm action descriptions are clear
5. Look for user attribution
```

#### **Step 3.4: Perform Edit**
```bash
# Execute edit workflow
1. Click "Edit Assessment" tab
2. Read warning message
3. Enter detailed reason for edit
4. Check confirmation checkbox
5. Click "Edit Assessment" button
6. Verify redirect to breakdown guide with parameters
```

### **Expected Results:**
- ✅ Modal opens with three functional tabs
- ✅ Assessment details display correctly
- ✅ Audit trail shows chronological history
- ✅ Edit form requires reason and confirmation
- ✅ Redirect includes edit parameters: `/breakdown-guide?edit={id}&return={url}&reason={reason}`
- ✅ Audit log entry created for edit initiation

### **Audit Trail Check:**
```javascript
// Check audit logging
fetch(`/api/audit/assessment/${breakdownId}`)
  .then(r => r.json())
  .then(data => console.log('Audit trail:', data));
```

---

## 📡 **Scenario 4: WebSocket Failure - Polling Fallback**

### **Test Description:**
Test automatic fallback to polling when WebSocket connection fails.

### **Test Steps:**

#### **Step 4.1: Simulate WebSocket Failure**
```bash
# Method 1: Browser DevTools
1. Open DevTools → Network tab
2. Check "Offline" to simulate network failure
3. Wait 10 seconds, then uncheck "Offline"
4. Monitor connection recovery

# Method 2: Block WebSocket Requests
1. DevTools → Network → Filter to WS
2. Right-click WebSocket connection → Block request URL
3. Refresh dashboard
4. Verify polling fallback activates
```

#### **Step 4.2: Verify Polling Activation**
```bash
# Check fallback behavior
1. Monitor Network tab for XHR requests
2. Verify polling requests every 5 seconds
3. Check connection status indicator shows "Reconnecting"
4. Confirm data still updates via polling
```

#### **Step 4.3: Test Reconnection**
```bash
# Restore WebSocket connection
1. Unblock WebSocket requests
2. Wait for automatic reconnection
3. Verify connection status returns to "Live"
4. Check WebSocket messages resume
5. Confirm polling stops when WebSocket reconnects
```

### **Expected Results:**
- ✅ Automatic detection of WebSocket failure
- ✅ Seamless fallback to polling (5-second intervals)
- ✅ Connection status indicator shows "Reconnecting"
- ✅ Data continues updating via polling
- ✅ Automatic WebSocket reconnection when available
- ✅ Polling stops when WebSocket reconnects

### **Connection Monitoring:**
```javascript
// Monitor connection state
setInterval(() => {
  console.log('Connection State:', websocketService.getStats());
}, 2000);
```

---

## 👥 **Scenario 5: Multiple Supervisors - Filtering & Context**

### **Test Description:**
Test filtering and context switching with multiple supervisor accounts.

### **Test Steps:**

#### **Step 5.1: Setup Multiple Assessments**
```bash
# Create multiple active assessments
1. Use supervisor AG003 to start assessment #1
2. Use supervisor BP009 to start assessment #2  
3. Use different supervisor for assessment #3
4. Return to SDC Dashboard
```

#### **Step 5.2: Test "My Breakdowns" Filter**
```bash
# Test supervisor-specific filtering
1. Ensure supervisor is logged in (check localStorage)
2. Click "My Breakdowns" filter
3. Verify only current supervisor's breakdowns show
4. Check breakdown counter updates correctly
5. Test filter persistence (refresh page)
```

#### **Step 5.3: Test Context Switching**
```bash
# Switch supervisor contexts
1. Logout current supervisor
2. Login as different supervisor
3. Return to SDC Dashboard
4. Verify "My Breakdowns" shows different results
5. Check supervisor info in breakdown counter
```

#### **Step 5.4: Test Filter Persistence**
```bash
# Verify filter memory
1. Select "In Assessment" filter
2. Refresh browser page
3. Verify filter selection persists
4. Check search query persistence
5. Test across browser sessions
```

### **Expected Results:**
- ✅ Multiple assessments display correctly
- ✅ "My Breakdowns" filter shows only current supervisor's work
- ✅ Supervisor context switching works properly
- ✅ Filter selections persist across page loads
- ✅ Breakdown counter shows supervisor-specific counts
- ✅ Search functionality works with filters

### **Supervisor Context Check:**
```javascript
// Check current supervisor context
console.log('Current Supervisor:', localStorage.getItem('currentSupervisor'));
console.log('Session Data:', sessionStorage.getItem('supervisorSession'));
```

---

## 📱 **Scenario 6: Mobile Responsive Design Verification**

### **Test Description:**
Verify mobile responsive design and touch functionality.

### **Test Steps:**

#### **Step 6.1: Mobile Viewport Testing**
```bash
# Test different screen sizes
1. DevTools → Toggle device toolbar
2. Test iPhone 12 Pro (390x844)
3. Test iPad (768x1024)
4. Test Galaxy S20 (360x800)
5. Test custom breakpoints (320px, 768px, 1024px)
```

#### **Step 6.2: Touch Interface Testing**
```bash
# Test touch interactions
1. Tap breakdown cards (minimum 44px targets)
2. Test swipe gestures on filter bar
3. Verify button sizes are touch-friendly
4. Check modal interactions on mobile
5. Test scroll behavior in assessment progress
```

#### **Step 6.3: Layout Verification**
```bash
# Check responsive layouts
1. Verify breakdown counter hides on mobile
2. Check dashboard header stacks properly
3. Confirm filter tabs scroll horizontally
4. Test modal full-screen behavior
5. Verify breakdown cards stack vertically
```

#### **Step 6.4: Performance Testing**
```bash
# Mobile performance checks
1. Test WebSocket connections on mobile networks
2. Verify polling intervals adjust for mobile
3. Check battery impact of real-time updates
4. Test offline/online transitions
5. Verify haptic feedback (if implemented)
```

### **Expected Results:**
- ✅ Layout adapts to all screen sizes
- ✅ Touch targets meet 44px minimum
- ✅ Breakdown counter hides on mobile
- ✅ Horizontal scrolling works for filters
- ✅ Modals display full-screen on mobile
- ✅ Performance remains smooth on mobile
- ✅ Real-time updates work on cellular networks

### **Responsive Breakpoints:**
```css
/* Key breakpoints to test */
@media (max-width: 320px) { /* Small phones */ }
@media (max-width: 375px) { /* iPhone SE */ }
@media (max-width: 768px) { /* Tablets */ }
@media (max-width: 1024px) { /* Small desktops */ }
```

---

## 🔧 **Debug Tools & Commands**

### **WebSocket Connection Debugging:**
```javascript
// Check WebSocket service status
console.log(websocketService.getStats());

// Monitor all real-time messages
websocketService.subscribe('/ws/sdc-dashboard', console.log);

// Test connection manually
websocketService.connect('/ws/sdc-dashboard', {
  onOpen: () => console.log('Connected'),
  onMessage: (data) => console.log('Message:', data),
  onError: (error) => console.log('Error:', error)
});
```

### **API Endpoint Testing:**
```bash
# Test breakdown endpoints
curl -X GET "https://breakdown-guide.onrender.com/api/breakdowns/active"
curl -X GET "https://breakdown-guide.onrender.com/api/breakdowns/in-progress"
curl -X GET "https://breakdown-guide.onrender.com/api/audit/assessment/{id}"
```

### **Local Storage Debugging:**
```javascript
// Check supervisor session
console.log('Supervisor:', localStorage.getItem('currentSupervisor'));
console.log('Filters:', localStorage.getItem('sdc-filters'));

// Clear session for testing
localStorage.removeItem('currentSupervisor');
sessionStorage.clear();
```

### **Performance Monitoring:**
```javascript
// Monitor component re-renders
console.time('dashboard-render');
// ... component renders
console.timeEnd('dashboard-render');

// Check memory usage
console.log(performance.memory);
```

---

## ✅ **Test Completion Checklist**

- [ ] **Assessment Progress** - Live updates working
- [ ] **Assessment Completion** - Redirect and highlighting functional  
- [ ] **Edit Assessment** - Modal and audit trail working
- [ ] **WebSocket Fallback** - Polling activates on connection failure
- [ ] **Multi-Supervisor** - Filtering and context switching functional
- [ ] **Mobile Responsive** - Layout and touch interactions working
- [ ] **Performance** - Real-time updates smooth across devices
- [ ] **Error Handling** - Graceful degradation on failures

---

## 🚀 **Test Automation Scripts**

For automated testing, consider implementing:

```javascript
// Automated test suite structure
describe('SDC Dashboard Integration Tests', () => {
  test('Assessment progress tracking', async () => {
    // Automated assessment progress test
  });
  
  test('WebSocket fallback behavior', async () => {
    // Automated connection failure test
  });
  
  test('Mobile responsive layout', async () => {
    // Automated viewport testing
  });
});
```

This comprehensive testing guide ensures all enhancement features work correctly across different scenarios and devices. Each test includes specific steps, expected results, and debugging tools to quickly identify and resolve any issues.