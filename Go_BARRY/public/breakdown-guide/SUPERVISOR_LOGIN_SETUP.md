# Supervisor Login Setup - Go BARRY Breakdown Guide

## Overview
The breakdown guide now requires supervisor authentication before any assessments can be performed. Every action is logged with supervisor details for complete audit trail.

## Current Password Configuration

**All 9 supervisors currently use the default password: `Barry123!`**

### Supervisor List:

| Badge | Name | Admin Status |
|-------|------|-------------|
| AW001 | Alex Woodcock | Standard |
| AC002 | Andrew Cowley | Standard |
| AG003 | Anthony Gair | **Admin** |
| CF004 | Claire Fiddler | Standard |
| DH005 | David Hall | Standard |
| JD006 | James Daglish | Standard |
| JP007 | John Paterson | Standard |
| SG008 | Simon Glass | Standard |
| BP009 | Barry Perryman | **Admin** |

## Login Process

1. **Supervisor Selection**: Choose from dropdown menu of all 9 supervisors
2. **Password Entry**: Enter current password (`Barry123!`)
3. **Remember Option**: Option to remember login for 24 hours
4. **Authentication**: System validates against backend authentication API

## Security Features

- ✅ JWT token-based authentication
- ✅ bcrypt password hashing
- ✅ Rate limiting (5 attempts per 15 minutes)
- ✅ Secure session management
- ✅ Password expiry (90 days)
- ✅ Forced password change on first login

## What Gets Logged

### Assessment-Level Logging:
- Supervisor badge number and name
- Start/end times and duration  
- Fleet number and depot
- Final decision (STOP/AMBER/CONTINUE)
- Complete responses to all questions

### Action-Level Logging:
- Every button click and response
- Navigation between steps
- Critical safety determinations
- DVSA compliance checks
- Assessment cancellations

### Audit Trail Includes:
- Timestamp for every action
- Supervisor badge number
- Sequence numbers
- Browser information
- Session tokens

## File Locations

### Frontend Components:
- **Login Component**: `/components/SupervisorLogin.js`
- **Enhanced Logger**: `/supervisorBreakdownLogger.js`
- **Updated App**: `/App.js`
- **Enhanced Analytics**: `/breakdown-analytics.js`

### Backend Components:
- **Assessment API**: `/backend/routes/breakdownAssessmentAPI.js`
- **Password Storage**: `/backend/data/supervisor-passwords.json`
- **Authentication**: `/backend/services/authService.js`

## Database Tables Created:

1. **breakdown_assessments**: Complete assessment records with supervisor details
2. **breakdown_action_logs**: Individual actions within each assessment
3. **supervisor_activity_logs**: High-level supervisor activity tracking

## UK English Updates:

- "Authorised supervisors only" (not "Authorized")
- "Sign In" button (British preference)
- All error messages use UK spelling
- Form labels and descriptions use UK English

## Testing the System:

1. Navigate to the breakdown guide
2. Login screen should appear automatically
3. Select any supervisor from dropdown
4. Enter password: `Barry123!`
5. Complete any assessment - all actions will be logged

## Password Management:

Supervisors will be prompted to change their password on first successful login. The system enforces:
- Minimum 8 characters
- Password history (can't reuse last 5 passwords)
- 90-day expiry
- Strong password requirements

## Admin Features:

Only AG003 (Anthony Gair) and BP009 (Barry Perryman) have admin privileges and can:
- View all supervisor activity
- Access enhanced reporting
- Manage system settings