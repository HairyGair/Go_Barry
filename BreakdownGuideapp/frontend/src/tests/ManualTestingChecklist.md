# 📋 Manual Testing Checklist for SDC Dashboard Enhancement

## 🎯 Overview
This checklist provides step-by-step manual testing procedures for all SDC Dashboard enhancement features. Use this for thorough verification before deployment.

---

## ✅ **Test 1: Assessment in Progress - Live Updates**

### **Setup Requirements:**
- [ ] SDC Dashboard is accessible at `/dashboards/sdc`
- [ ] Breakdown Guide is accessible at `/breakdown-guide`
- [ ] Test supervisor credentials available (AG003, BP009, etc.)
- [ ] Backend API is running and responsive

### **Manual Test Steps:**

#### **Step 1.1: Initialize Assessment**
- [ ] **Action:** Open breakdown guide in new tab
- [ ] **Action:** Login with supervisor credentials
- [ ] **Action:** Start any wizard assessment (e.g., Steering)
- [ ] **Verify:** Breakdown ID is generated and displayed
- [ ] **Record:** Breakdown ID: `_________________`

#### **Step 1.2: Verify Progress Tracking**
- [ ] **Action:** Switch to SDC Dashboard tab
- [ ] **Verify:** AssessmentProgressCard appears in dashboard
- [ ] **Verify:** Progress ring shows "1/5" or similar
- [ ] **Verify:** Supervisor name is displayed correctly
- [ ] **Verify:** Fleet number matches breakdown
- [ ] **Verify:** Elapsed time starts counting (updates every second)

#### **Step 1.3: Test Step Progression**
- [ ] **Action:** Return to breakdown guide tab
- [ ] **Action:** Complete step 1 and proceed to step 2
- [ ] **Action:** Switch back to SDC Dashboard
- [ ] **Verify:** Progress ring updates to "2/5"
- [ ] **Verify:** Step description changes
- [ ] **Action:** Complete step 2, return to dashboard
- [ ] **Verify:** Progress ring shows "3/5"
- [ ] **Verify:** Elapsed time continues incrementing

#### **Step 1.4: Test Expandable Details**
- [ ] **Action:** Click on the progress card to expand
- [ ] **Verify:** Assessment details section opens
- [ ] **Verify:** Timeline steps show completed/current status
- [ ] **Verify:** Assessment information displays correctly
- [ ] **Verify:** "View Live Assessment" button is present

### **Expected Visual Indicators:**
- [ ] Progress ring fills proportionally (20%, 40%, 60%, etc.)
- [ ] Current step is highlighted with blue color
- [ ] Completed steps show green checkmarks
- [ ] Supervisor icon and name display clearly
- [ ] Elapsed time format: "2m 30s" or "45s"

### **Pass/Fail Criteria:**
- **PASS:** All progress updates appear within 2 seconds
- **PASS:** Progress ring animation is smooth
- **PASS:** All text information is accurate and readable
- **FAIL:** Progress updates don't appear or are delayed >5 seconds
- **FAIL:** Any visual elements are missing or broken

---

## ✅ **Test 2: Assessment Completed - Decision & Redirect**

### **Manual Test Steps:**

#### **Step 2.1: Complete Assessment**
- [ ] **Action:** Continue from previous test or start new assessment
- [ ] **Action:** Complete all wizard steps
- [ ] **Action:** Submit final assessment with decision (STOP/AMBER/CONTINUE)
- [ ] **Record:** Decision made: `_________________`
- [ ] **Record:** Completion time: `_________________`

#### **Step 2.2: Verify Automatic Redirect**
- [ ] **Verify:** Page automatically redirects to SDC Dashboard
- [ ] **Verify:** URL contains highlight parameter: `?highlight=BD-2025-XXXXX`
- [ ] **Verify:** Specific breakdown card is highlighted
- [ ] **Verify:** Highlight effect is visible (color change, glow, etc.)
- [ ] **Record:** URL after redirect: `_________________`

#### **Step 2.3: Verify Decision Display**
- [ ] **Verify:** Decision badge shows correct icon and text
  - [ ] STOP: 🛑 with red background
  - [ ] AMBER: ⚡ with amber background  
  - [ ] CONTINUE: ✅ with green background
- [ ] **Verify:** "Edit Assessment" button is visible
- [ ] **Verify:** Assessment timestamp is displayed
- [ ] **Verify:** Progress card is removed from active assessments

#### **Step 2.4: Test Highlight Behavior**
- [ ] **Action:** Wait 8-10 seconds
- [ ] **Verify:** Highlight effect gradually fades away
- [ ] **Action:** Refresh page with highlight parameter in URL
- [ ] **Verify:** Highlight effect re-appears on page load

### **Visual Verification:**
- [ ] Decision badge uses correct color scheme
- [ ] Highlight effect is clearly visible but not overwhelming
- [ ] Card layout remains intact with new decision information
- [ ] All text is legible and properly aligned

### **Pass/Fail Criteria:**
- **PASS:** Redirect happens within 3 seconds of completion
- **PASS:** Highlight effect is clearly visible
- **PASS:** Decision badge displays correctly
- **FAIL:** No redirect occurs or takes >10 seconds
- **FAIL:** Highlight effect is not visible or broken
- **FAIL:** Decision information is incorrect or missing

---

## ✅ **Test 3: Edit Assessment - Audit Trail Workflow**

### **Manual Test Steps:**

#### **Step 3.1: Access Edit Modal**
- [ ] **Action:** Find a completed breakdown card
- [ ] **Action:** Click "Edit Assessment" button
- [ ] **Verify:** EditAssessmentModal opens
- [ ] **Verify:** Modal displays three tabs:
  - [ ] "Assessment Details"
  - [ ] "Audit Trail" 
  - [ ] "Edit Assessment"

#### **Step 3.2: Test Assessment Details Tab**
- [ ] **Action:** Click "Assessment Details" tab (should be default)
- [ ] **Verify:** Decision badge displays correctly
- [ ] **Verify:** Supervisor information is accurate
- [ ] **Verify:** Completion timestamp is formatted properly
- [ ] **Verify:** Location and route information (if available)
- [ ] **Verify:** Assessment notes section (if present)
- [ ] **Verify:** Wizard responses grid (if available)

#### **Step 3.3: Test Audit Trail Tab**
- [ ] **Action:** Click "Audit Trail" tab
- [ ] **Verify:** Chronological list of audit entries
- [ ] **Verify:** Timestamps are formatted correctly (DD/MM/YYYY HH:MM:SS)
- [ ] **Verify:** Action descriptions are clear
- [ ] **Verify:** User attribution where available
- [ ] **Record:** Number of audit entries: `_________________`

#### **Step 3.4: Test Edit Workflow**
- [ ] **Action:** Click "Edit Assessment" tab
- [ ] **Verify:** Warning message about audit trail is displayed
- [ ] **Verify:** Current assessment summary is shown
- [ ] **Action:** Leave reason field empty, try to submit
- [ ] **Verify:** Submit button remains disabled
- [ ] **Action:** Enter detailed reason for edit
- [ ] **Action:** Check the confirmation checkbox
- [ ] **Verify:** Submit button becomes enabled
- [ ] **Action:** Click "Edit Assessment" button

#### **Step 3.5: Verify Edit Redirect**
- [ ] **Verify:** Modal closes automatically
- [ ] **Verify:** Page redirects to breakdown guide
- [ ] **Verify:** URL contains edit parameters:
  - [ ] `edit={breakdownId}`
  - [ ] `return={encodedReturnUrl}`
  - [ ] `reason={encodedReason}`
- [ ] **Record:** Edit redirect URL: `_________________`

### **Audit Trail Verification:**
- [ ] New audit entry should be created for "assessment_edit_initiated"
- [ ] Timestamp should match edit initiation time
- [ ] Reason should be recorded in audit entry
- [ ] User information should be captured

### **Pass/Fail Criteria:**
- **PASS:** All three tabs function correctly
- **PASS:** Form validation works as expected
- **PASS:** Redirect includes all required parameters
- **FAIL:** Any tab fails to load or display correctly
- **FAIL:** Form allows submission without required fields
- **FAIL:** Redirect is missing parameters or fails

---

## ✅ **Test 4: WebSocket Failure - Polling Fallback**

### **Manual Test Steps:**

#### **Step 4.1: Verify Initial Connection**
- [ ] **Action:** Open SDC Dashboard
- [ ] **Verify:** Connection status shows "Live" with green indicator
- [ ] **Action:** Open browser DevTools → Network tab
- [ ] **Verify:** WebSocket connection is established (WS tab)
- [ ] **Record:** WebSocket URL: `_________________`

#### **Step 4.2: Simulate Connection Failure**
- [ ] **Action:** In DevTools Network tab, right-click WebSocket connection
- [ ] **Action:** Select "Block request URL" or "Block request domain"
- [ ] **Action:** Refresh the page
- [ ] **Verify:** Connection status changes to "Reconnecting"
- [ ] **Verify:** Network tab shows XHR polling requests (every 5 seconds)

#### **Step 4.3: Test Polling Functionality**
- [ ] **Action:** Start an assessment in another tab (with polling active)
- [ ] **Verify:** Progress updates still appear (may be delayed)
- [ ] **Verify:** Polling interval is approximately 5 seconds
- [ ] **Record:** Polling delay observed: `_________________`

#### **Step 4.4: Test Reconnection**
- [ ] **Action:** In DevTools, unblock the WebSocket URL
- [ ] **Action:** Wait for automatic reconnection
- [ ] **Verify:** Connection status returns to "Live"
- [ ] **Verify:** WebSocket connection re-establishes
- [ ] **Verify:** Polling requests stop when WebSocket reconnects

#### **Step 4.5: Test Connection Recovery**
- [ ] **Action:** Complete an assessment step after reconnection
- [ ] **Verify:** Real-time updates resume immediately
- [ ] **Verify:** No duplicate updates appear
- [ ] **Verify:** System performs as expected

### **Network Monitoring:**
- [ ] Monitor DevTools Console for connection messages
- [ ] Check for exponential backoff retry attempts
- [ ] Verify no JavaScript errors during fallback
- [ ] Confirm graceful degradation without data loss

### **Pass/Fail Criteria:**
- **PASS:** Automatic fallback to polling within 10 seconds
- **PASS:** Data continues updating via polling
- **PASS:** Automatic reconnection when WebSocket available
- **FAIL:** No fallback mechanism activates
- **FAIL:** Data updates stop during connection failure
- **FAIL:** Reconnection fails or causes errors

---

## ✅ **Test 5: Multiple Supervisors - Filtering & Context**

### **Manual Test Steps:**

#### **Step 5.1: Setup Multiple Assessments**
- [ ] **Action:** Create assessments with supervisor AG003
- [ ] **Record:** AG003 breakdown IDs: `_________________`
- [ ] **Action:** Create assessments with supervisor BP009
- [ ] **Record:** BP009 breakdown IDs: `_________________`
- [ ] **Action:** Create assessments with supervisor CD012 (if available)
- [ ] **Record:** CD012 breakdown IDs: `_________________`

#### **Step 5.2: Test Filter Functionality**
- [ ] **Action:** On SDC Dashboard, click "All Breakdowns" filter
- [ ] **Verify:** All breakdowns from all supervisors are visible
- [ ] **Record:** Total breakdown count: `_________________`
- [ ] **Action:** Click "My Breakdowns" filter
- [ ] **Verify:** Only current supervisor's breakdowns are shown
- [ ] **Record:** My breakdowns count: `_________________`

#### **Step 5.3: Test Supervisor Context**
- [ ] **Verify:** Current supervisor info appears in breakdown counter
- [ ] **Verify:** Supervisor name/badge displays correctly
- [ ] **Action:** Note current supervisor information
- [ ] **Record:** Current supervisor: `_________________`

#### **Step 5.4: Test Context Switching**
- [ ] **Action:** Logout current supervisor (if logout available)
- [ ] **Action:** Login as different supervisor
- [ ] **Action:** Return to SDC Dashboard
- [ ] **Verify:** "My Breakdowns" filter shows different results
- [ ] **Verify:** Supervisor info in header updates
- [ ] **Record:** New supervisor context: `_________________`

#### **Step 5.5: Test Filter Persistence**
- [ ] **Action:** Select "In Assessment" filter
- [ ] **Action:** Refresh browser page
- [ ] **Verify:** "In Assessment" filter remains selected
- [ ] **Action:** Enter search query in filter bar
- [ ] **Action:** Refresh page
- [ ] **Verify:** Search query is restored

### **Data Verification:**
- [ ] Breakdown counts update correctly per filter
- [ ] Supervisor attribution is accurate
- [ ] Filter combinations work properly
- [ ] No breakdowns appear in wrong supervisor contexts

### **Pass/Fail Criteria:**
- **PASS:** Filters correctly segregate supervisor data
- **PASS:** Context switching works without errors
- **PASS:** Filter persistence survives page reloads
- **FAIL:** Incorrect breakdowns appear in filtered views
- **FAIL:** Context switching causes data corruption
- **FAIL:** Filter state is lost on page refresh

---

## ✅ **Test 6: Mobile Responsive Design Verification**

### **Manual Test Steps:**

#### **Step 6.1: Viewport Testing**
- [ ] **Action:** Open DevTools → Toggle device toolbar
- [ ] **Test:** iPhone 12 Pro (390x844)
  - [ ] Breakdown counter hides properly
  - [ ] Dashboard header stacks vertically
  - [ ] Filter tabs scroll horizontally
  - [ ] Cards display in single column
- [ ] **Test:** iPad (768x1024)
  - [ ] Layout adapts to tablet size
  - [ ] Touch targets are adequate
  - [ ] Cards display in appropriate grid
- [ ] **Test:** Galaxy S20 (360x800)
  - [ ] Smallest mobile layout works
  - [ ] All content remains accessible
  - [ ] No horizontal overflow

#### **Step 6.2: Touch Interface Testing**
- [ ] **Action:** Switch to touch simulation in DevTools
- [ ] **Test:** Tap breakdown cards
  - [ ] Minimum 44px touch targets
  - [ ] Touch feedback is appropriate
  - [ ] No accidental activations
- [ ] **Test:** Swipe gestures on filter bar
  - [ ] Horizontal scrolling works smoothly
  - [ ] No vertical scroll interference
- [ ] **Test:** Modal interactions
  - [ ] Modal opens full-screen on mobile
  - [ ] Close button is easily tappable
  - [ ] Content scrolls properly within modal

#### **Step 6.3: Layout Verification**
- [ ] **Verify:** Breakdown counter is hidden on mobile (<768px)
- [ ] **Verify:** Dashboard actions remain accessible
- [ ] **Verify:** Progress cards stack vertically
- [ ] **Verify:** Filter tabs scroll when content overflows
- [ ] **Verify:** Assessment modal adapts to mobile screen
- [ ] **Verify:** Edit assessment form is mobile-friendly

#### **Step 6.4: Performance Testing**
- [ ] **Action:** Throttle CPU to 4x slowdown in DevTools
- [ ] **Action:** Throttle network to 3G speeds
- [ ] **Verify:** Real-time updates continue to work
- [ ] **Verify:** UI remains responsive during updates
- [ ] **Verify:** Polling intervals adapt appropriately
- [ ] **Record:** Performance observations: `_________________`

#### **Step 6.5: Orientation Testing**
- [ ] **Action:** Test portrait orientation
- [ ] **Verify:** All content fits within viewport
- [ ] **Action:** Test landscape orientation  
- [ ] **Verify:** Layout adapts appropriately
- [ ] **Verify:** No content is cut off or inaccessible

### **Mobile-Specific Features:**
- [ ] Bottom navigation appears on mobile (if applicable)
- [ ] Emergency breakdown button is prominent
- [ ] Quick actions remain accessible
- [ ] Text is legible at mobile sizes

### **Pass/Fail Criteria:**
- **PASS:** All layouts work across tested devices
- **PASS:** Touch interactions are smooth and accurate
- **PASS:** Performance remains acceptable on mobile
- **FAIL:** Layout breaks on any tested device
- **FAIL:** Touch targets are too small or unresponsive
- **FAIL:** Performance degrades significantly on mobile

---

## 📊 **Test Results Summary**

### **Overall Test Results:**
- [ ] **Assessment Progress Tracking:** PASS / FAIL
- [ ] **Assessment Completion & Redirect:** PASS / FAIL  
- [ ] **Edit Assessment Workflow:** PASS / FAIL
- [ ] **WebSocket Fallback:** PASS / FAIL
- [ ] **Multi-Supervisor Filtering:** PASS / FAIL
- [ ] **Mobile Responsive Design:** PASS / FAIL

### **Critical Issues Found:**
1. `_________________________________________________`
2. `_________________________________________________`
3. `_________________________________________________`

### **Non-Critical Issues Found:**
1. `_________________________________________________`
2. `_________________________________________________`
3. `_________________________________________________`

### **Performance Notes:**
- WebSocket connection stability: `_________________`
- Polling fallback performance: `_________________`
- Mobile performance: `_________________`
- Real-time update latency: `_________________`

### **Browser Compatibility Tested:**
- [ ] Chrome (version: `_______`)
- [ ] Firefox (version: `_______`)
- [ ] Safari (version: `_______`)
- [ ] Edge (version: `_______`)

### **Test Environment:**
- **Date:** `_________________`
- **Tester:** `_________________`
- **Backend API URL:** `_________________`
- **Frontend URL:** `_________________`
- **Test Duration:** `_________________`

### **Deployment Recommendation:**
- [ ] **APPROVED** - All critical tests pass, ready for production
- [ ] **CONDITIONAL** - Minor issues found, address before deployment
- [ ] **REJECTED** - Critical issues found, requires fixes before deployment

**Additional Notes:**
```
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
```

---

## 🔧 **Quick Debug Commands**

Use these commands in browser console for quick debugging:

```javascript
// Check WebSocket status
console.log('WS Status:', websocketService.getStats());

// Monitor real-time messages
websocketService.subscribe('/ws/sdc-dashboard', console.log);

// Check supervisor context
console.log('Supervisor:', localStorage.getItem('currentSupervisor'));

// Check filter persistence
console.log('Filters:', localStorage.getItem('sdc-filters'));

// Test API endpoints
fetch('/api/breakdowns/active').then(r => r.json()).then(console.log);
```

This manual testing checklist ensures comprehensive verification of all SDC Dashboard enhancement features before production deployment.