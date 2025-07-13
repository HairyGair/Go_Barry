# Manual Testing Checklist - Phase 1 & 2

## Getting Started
1. Open terminal in the project directory
2. Run: `./start-server.sh` (or open index.html directly in browser)
3. Navigate to: http://localhost:8080/src/

## 1. Homepage Testing ✓
- [ ] Go North East branding displays correctly
- [ ] Safety declaration is prominent
- [ ] All 4 action buttons work:
  - [ ] Start Diagnosis → Categories
  - [ ] Search Issues → Categories with focus on search
  - [ ] Recent Logs → Shows modal (or empty state)
  - [ ] Help & About → Shows help

## 2. Category Screen Testing ✓
- [ ] All 29 categories display
- [ ] Critical issues (5) show red border and "SAFETY CRITICAL" badge:
  - [ ] Brakes
  - [ ] Steering  
  - [ ] Oil Warning Light
  - [ ] Loose Wheel Nuts
  - [ ] ABS Light
- [ ] Search functionality:
  - [ ] Type "brake" - filters to brake-related issues
  - [ ] Type "xyz" - shows "no results" message
  - [ ] Clear search - shows all issues again
- [ ] Filter buttons:
  - [ ] "Critical (5)" - shows only red-bordered issues
  - [ ] "High Priority (4)" - shows amber-bordered issues
  - [ ] "Normal (20)" - shows regular issues
  - [ ] "All Issues (29)" - shows everything
- [ ] Sort dropdown:
  - [ ] Priority sort - critical issues first
  - [ ] Alphabetical - A-Z ordering
  - [ ] Recent - (if you've clicked some categories)

## 3. Critical Issue Testing ✓

### 3a. Test Brakes Flow
- [ ] Click "Brakes" category
- [ ] Check ANY symptom (e.g., "Brake pedal sinks...")
- [ ] Click "One or more symptoms present"
- [ ] Verify:
  - [ ] Red "STOP IMMEDIATELY" banner
  - [ ] "BRAKE SYSTEM FAILURE" message
  - [ ] PG9 risk warning
  - [ ] No option to continue driving
- [ ] Click "Vehicle Stopped - Engineering Contacted"
- [ ] Should require safety confirmation modal
- [ ] Must type exact text to proceed

### 3b. Test Steering Flow
- [ ] Return to categories
- [ ] Click "Steering"
- [ ] Select "Excessive play" symptom
- [ ] Continue → Immediate stop screen
- [ ] Verify "Loss of steering control risk" warning
- [ ] Verify "Vehicle requires recovery" message

### 3c. Test Loose Wheel Nuts
- [ ] Click "Loose Wheel Nuts"
- [ ] Should immediately show "EXTREME DANGER"
- [ ] Lists all required contacts:
  - [ ] Engineering
  - [ ] Depot Engineering Manager
  - [ ] General Manager
  - [ ] Engineering Delivery Director
- [ ] Continue → Shows 7-item checklist
- [ ] Cannot proceed without checking all items

### 3d. Test ABS Light (Amber vs Red)
- [ ] Click "ABS Light"
- [ ] Select "Amber" → Reset procedure → Light clears → Can continue
- [ ] Go back and select "Red" → Reset → Light remains → MUST STOP

## 4. Safety Features ✓
- [ ] Quick Reference button (header) - shows critical procedures
- [ ] Emergency Stops button - shows all stop-required issues
- [ ] Back buttons work throughout
- [ ] Exit confirmation when leaving mid-diagnosis
- [ ] Notes can be saved during diagnosis

## 5. Data Persistence ✓
- [ ] Start a diagnosis, add notes
- [ ] Refresh the page
- [ ] Click "Recent Logs" - should show your session
- [ ] Can resume incomplete session

## 6. Edge Cases ✓
- [ ] Try to proceed without selecting options - should be blocked
- [ ] Test on mobile viewport - should be responsive
- [ ] Work offline - app should still function

## Common Issues to Check
1. **Safety Confirmations**: Critical stops MUST require typed confirmation
2. **No Continue Path**: Verify NO critical issue allows continuing in service
3. **Visual Indicators**: Red borders and badges for critical issues
4. **Clear Instructions**: Each step should be unambiguous

## Automated Testing
Run automated test suite:
```bash
./run-tests.sh
# Open http://localhost:8080/tests/
# Click "Run All Tests"
# Should see 36 tests, all passing
```

## What's NOT Implemented Yet
- Most category flows (only 5 critical ones done)
- Go-Check integration
- Photo uploads
- PDF exports
- User authentication
- Multi-language support

## Feedback Questions
1. Is the safety messaging clear and prominent enough?
2. Are the critical stop procedures unambiguous?
3. Is the filtering/sorting intuitive?
4. Any confusing navigation or unclear instructions?
5. Does it feel like it would work well on a tablet in a depot?