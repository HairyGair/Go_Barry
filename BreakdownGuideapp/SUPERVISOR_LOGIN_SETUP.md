# Supervisor Login Setup Guide

## Problem
Supervisors are getting "Server temporarily overloaded" errors because they don't have Supabase Authentication accounts set up. The supervisors exist in the database but need corresponding authentication users.

## Required Supervisors
These supervisors need Supabase Auth accounts created (13 total):

| Name | Email | Badge | Depot |
|------|-------|-------|-------|
| Simon Glass | simon.glass@gonortheast.co.uk | SG001 | SDC |
| David Hall | david.hall@gonortheast.co.uk | DH001 | SDC |
| Barry Perryman | barry.perryman@gonortheast.co.uk | BP001 | SDC |
| Claire Fiddler | claire.fiddler@gonortheast.co.uk | CF001 | SDC |
| Alex Woodcock | alex.woodcock@gonortheast.co.uk | AW001 | SDC |
| James Daglish | james.daglish@gonortheast.co.uk | JD003 | SDC |
| Andrew Cowley | andrew.cowley@gonortheast.co.uk | AC001 | SDC |
| John Paterson | john.paterson@gonortheast.co.uk | JP001 | SDC |
| Ben Maxfield | ben.maxfield@gonortheast.co.uk | BM001 | SDC |
| Anthony Gair | anthony.gair@gonortheast.co.uk | AG003 | Washington |
| Lee Mutch | lee.mutch@gonortheast.co.uk | LM001 | Washington |
| Joshua Devlin | joshua.devlin@gonortheast.co.uk | JD002 | Washington |
| Test Supervisor | test@test.com | TEST01 | SDC |

## Solution Steps

### Option 1: Manual Setup (Recommended)
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to your project: `oieliubbvvdzhzvikzal`
3. Go to **Authentication** > **Users**
4. Click **"Add User"** or **"Invite User"**
5. For each supervisor above:
   - Enter their email address
   - Set a temporary password (e.g., `TempPass123!`)
   - Click **Create User**
   - ✅ **Important:** Make sure "Confirm email" is checked/enabled

### Option 2: Automated Setup (Requires Service Role Key)
If you have the Supabase service role key:

1. Add service role key to environment:
   ```bash
   export SUPABASE_SERVICE_ROLE_KEY="your_service_role_key_here"
   ```

2. Run the setup script:
   ```bash
   cd /Users/anthony/Go\ BARRY\ App/BreakdownGuideapp
   node setup-auth-users.js
   ```

## Default Passwords
- Most supervisors: `TempPass123!`
- test@test.com: `test123`

**⚠️ IMPORTANT:** Supervisors should change their passwords immediately after first login.

## Verification
After creating the auth users, test login with:
- Email: `simon.glass@gonortheast.co.uk`
- Password: `TempPass123!`

## How Login Works
1. Supervisor enters email and password on login page
2. Supabase Authentication validates credentials
3. System looks up supervisor data from `supervisors` table
4. Session is created with supervisor details including badge number
5. Supervisor can access the breakdown system

## Current Status
✅ Supervisors table populated with all required supervisors
✅ All supervisors marked as active
❌ Supabase Auth users need to be created (causing the login errors)

Once the auth users are created, the "Server temporarily overloaded" error will be resolved and supervisors can log in normally.