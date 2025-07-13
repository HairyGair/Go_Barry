# Testing Guide - What You'll See

## 1. Homepage
When you first load the app, you'll see:
- **Go North East** branding (Navy "Go", Red "NorthEast")
- Red safety declaration box
- 4 main action buttons

## 2. Category Selection Screen
After clicking "Start Diagnosis":
- Search bar at top
- Filter buttons: All (29) | 🛑 Critical (5) | ⚠️ High (4) | ℹ️ Normal (20)
- Sort dropdown on the right
- Grid of issue categories with icons

**Critical issues (RED borders):**
- 🛑 Brakes
- 🎯 Steering
- 🛢️ Oil Warning Light
- 🔩 Loose Wheel Nuts  
- 🚨 ABS Light

## 3. Example Critical Flow - Brakes
1. Click on "Brakes" (red bordered card)
2. You'll see a checklist of symptoms:
   - ☐ Brake pedal sinks to floor...
   - ☐ Braking response delayed...
   - ☐ Unusual noises...
   - etc.
3. Check ANY box and click "One or more symptoms present"
4. You'll see a CRITICAL STOP screen with:
   - 🛑 Big red banner
   - Clear STOP instructions
   - PG9 warning
   - Red "Vehicle Stopped - Engineering Contacted" button
5. Clicking the button shows safety confirmation modal
6. Must type the exact confirmation text to proceed

## 4. What to Test
Focus on:
- **Safety flow** - Can you accidentally allow an unsafe vehicle to continue? (You shouldn't!)
- **Clarity** - Are instructions clear for a supervisor under pressure?
- **Visual hierarchy** - Do critical issues stand out?
- **Mobile usability** - Does it work on tablet/phone?

## 5. Known Limitations
What's NOT working yet:
- Only 5 of 29 issue flows are implemented
- No actual integration with Go-Check system
- No photo upload functionality
- No user accounts/authentication
- Data only saves locally in browser

But what IS working should demonstrate the core safety-first approach and user experience.

Ready to test? Run:
```bash
cd /Users/anthony/Go BARRY App/Breakdown Guide
chmod +x start-server.sh
./start-server.sh
```

Then open: http://localhost:8080/src/