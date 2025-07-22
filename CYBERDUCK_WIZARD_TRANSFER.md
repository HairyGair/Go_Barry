# CyberDuck Wizard Transfer Instructions

## Current Status
✅ Breakdown guide is loading at: https://www.gobarry.co.uk/breakdown-guide/index
❌ Only SteeringWizard is working - need to upload the other 23 wizards

## Files to Transfer

### Source Location (on your Mac):
`/Users/anthony/Go BARRY App/Go_BARRY/public/breakdown-guide/components/wizards/`

### Destination (on your server):
`/public_html/breakdown-guide/components/wizards/`

## CyberDuck Transfer Steps

### 1. Connect and Navigate
1. Open CyberDuck
2. Connect to your server
3. Navigate to: `/public_html/breakdown-guide/components/wizards/`

### 2. Upload All Wizard Files

Select and upload these 23 files (SteeringWizard.js is already there):

**Safety Critical Wizards (Red):**
- [ ] ABSLightWizard.js
- [ ] BrakesWizard.js
- [ ] LooseWheelNutsWizard.js
- [ ] OilWarningLightWizard.js
- [ ] PunctureWizard.js

**High Priority Wizards (Orange):**
- [ ] RepeatDefectsWizard.js
- [ ] RoadTrafficIncidentsWizard.js
- [ ] TracerItHelperWizard.js

**Operational Wizards (Blue):**
- [ ] BatteryWizard.js
- [ ] BuzzersWizard.js
- [ ] CoolingSystemWizard.js
- [ ] DemistersHeatersWizard.js
- [ ] DestinationDisplayWizard.js
- [ ] DoorsWizard.js
- [ ] ExcessiveSmokeWizard.js
- [ ] ExteriorLightsWizard.js
- [ ] GearSelectionWizard.js
- [ ] GearboxWizard.js
- [ ] InteriorLightsWizard.js
- [ ] NonStarterWizard.js
- [ ] SuspensionWizard.js
- [ ] WarningLightsWizard.js
- [ ] WheelchairLiftWizard.js

### 3. How to Upload in CyberDuck

**Option A - Upload All at Once:**
1. In Finder, go to: `/Users/anthony/Go BARRY App/Go_BARRY/public/breakdown-guide/components/wizards/`
2. Select all .js files EXCEPT SteeringWizard.js (Cmd+Click to multi-select)
3. Drag them into CyberDuck window at `/public_html/breakdown-guide/components/wizards/`

**Option B - Upload One by One:**
1. In CyberDuck, make sure you're in `/public_html/breakdown-guide/components/wizards/`
2. Click the "Upload" button in CyberDuck toolbar
3. Navigate to the source folder
4. Select the wizard files
5. Click "Upload"

### 4. Verify Upload
After uploading, you should see 24 .js files in the wizards directory:
- Each file should be around 10-30 KB
- Total of 24 wizard files

### 5. Set Permissions (if needed)
- Right-click on each .js file
- Select "Info" or "Get Info"
- Set permissions to 644 (rw-r--r--)

## Testing After Upload

1. Go to: https://www.gobarry.co.uk/breakdown-guide/index
2. Try clicking on different wizard buttons:
   - **Brakes** (Red section)
   - **Interior Lights** (Blue section)
   - **Repeat Defects** (Orange section)

3. Each wizard should now load properly with its assessment steps

## Troubleshooting

**If wizards still don't load:**
1. Clear browser cache (Ctrl+F5 or Cmd+Shift+R)
2. Check browser console for errors (F12 → Console tab)
3. Verify file names match exactly (case-sensitive!)
4. Check that all files uploaded completely

**Common Issues:**
- File didn't upload completely (check file size)
- Wrong directory (must be in `/breakdown-guide/components/wizards/`)
- Browser caching old version (try incognito/private mode)

## Expected Result
After successful upload:
- All category buttons should work
- Clicking any wizard should start the assessment
- Progress bar should show "24 of 31 Wizards Complete (77%)"
- No more "coming soon" messages for implemented wizards

---

**Time Required**: 5-10 minutes
**Files to Upload**: 23 wizard JavaScript files
**Total Size**: Approximately 500KB