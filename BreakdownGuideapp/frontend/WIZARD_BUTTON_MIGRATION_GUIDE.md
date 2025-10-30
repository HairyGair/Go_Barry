# Wizard Button Migration Guide

**Component:** WizardButtonGroup
**Purpose:** Unified button layout system for all breakdown guide wizards
**Status:** Ready for implementation

---

## Quick Start

### 1. Import the Component

At the top of your wizard file, add the import:

```javascript
import WizardButtonGroup from '../common/WizardButtonGroup.jsx';
```

### 2. Replace Old Button Patterns

#### Pattern A: Standard Previous/Next Buttons

**OLD CODE:**
```jsx
<div className="flex justify-between">
  <button
    onClick={onPrevious}
    className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
  >
    Previous
  </button>
  <button
    onClick={onNext}
    disabled={!responses.someField}
    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
  >
    Continue
  </button>
</div>
```

**NEW CODE:**
```jsx
<WizardButtonGroup
  onPrevious={onPrevious}
  onNext={onNext}
  isNextDisabled={!responses.someField}
  nextLabel="Continue"
/>
```

---

#### Pattern B: Completion/Final Step

**OLD CODE:**
```jsx
<div className="flex justify-between">
  <button onClick={onPrevious}>Previous</button>
  <button
    onClick={onComplete}
    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-500"
  >
    Complete Assessment
  </button>
</div>
```

**NEW CODE:**
```jsx
<WizardButtonGroup
  onPrevious={onPrevious}
  onComplete={onComplete}
  completeLabel="Complete Assessment"
  nextVariant="success"
/>
```

---

#### Pattern C: First Step (No Previous Button)

**OLD CODE:**
```jsx
<div className="flex justify-end">
  <button
    onClick={onNext}
    disabled={!responses.field}
    className="px-6 py-3 bg-blue-600 text-white rounded-lg"
  >
    Continue to Assessment
  </button>
</div>
```

**NEW CODE:**
```jsx
<WizardButtonGroup
  onNext={onNext}
  showPrevious={false}
  isNextDisabled={!responses.field}
  nextLabel="Continue to Assessment"
/>
```

---

#### Pattern D: Critical/Danger Actions

**OLD CODE:**
```jsx
<button
  onClick={() => onComplete('stop', 'Critical issue identified')}
  className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white font-bold py-3 px-6 rounded-lg"
>
  CONFIRM SAFETY STOP DECISION
</button>
```

**NEW CODE:**
```jsx
<WizardButtonGroup
  onComplete={() => onComplete('stop', 'Critical issue identified')}
  completeLabel="CONFIRM SAFETY STOP DECISION"
  nextVariant="danger"
  showPrevious={true}
  onPrevious={onPrevious}
/>
```

---

##Component API Reference

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onPrevious` | function | - | Handler for back/previous button |
| `onNext` | function | - | Handler for next/continue button |
| `onComplete` | function | - | Handler for completion button (takes precedence over onNext) |
| `onCancel` | function | - | Handler for cancel button (optional) |
| `previousLabel` | string | `'Previous'` | Text label for back button |
| `nextLabel` | string | `'Continue'` | Text label for next button |
| `completeLabel` | string | `'Complete Assessment'` | Text label for complete button |
| `cancelLabel` | string | `'Cancel'` | Text label for cancel button |
| `isNextDisabled` | boolean | `false` | Disables next/complete button |
| `isPreviousDisabled` | boolean | `false` | Disables previous button |
| `isLoading` | boolean | `false` | Shows loading spinner, disables all buttons |
| `nextVariant` | string | `'primary'` | Visual style: `'primary'`, `'success'`, `'danger'`, `'warning'` |
| `showPrevious` | boolean | `true` | Shows/hides previous button |
| `singleButton` | boolean | `false` | Layout optimization for single button |
| `className` | string | `''` | Additional CSS classes |
| `ariaLabel` | string | - | ARIA label for navigation group |

---

## Common Migration Patterns

### Example 1: SteeringWizard Step 1 (First Step)

**Before:**
```jsx
<div className="flex justify-between">
  <button
    onClick={onPrevious}
    disabled={true}
    className="px-6 py-3 bg-gray-600 text-gray-400 rounded-lg cursor-not-allowed transition-colors"
  >
    Previous
  </button>
  <button
    onClick={onNext}
    disabled={responses.passengersOnBoard === null || responses.passengersOnBoard === undefined}
    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
  >
    Continue to Steering Assessment
  </button>
</div>
```

**After:**
```jsx
<WizardButtonGroup
  onPrevious={onPrevious}
  isPreviousDisabled={true}
  onNext={onNext}
  isNextDisabled={responses.passengersOnBoard === null || responses.passengersOnBoard === undefined}
  nextLabel="Continue to Steering Assessment"
/>
```

---

### Example 2: BrakesWizard - Safety Critical Stop Decision

**Before:**
```jsx
<button
  onClick={() => onComplete('STOP', notes)}
  className="mt-6 w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
>
  <AlertTriangle className="w-5 h-5" />
  CONFIRM SAFETY STOP DECISION
</button>
```

**After:**
```jsx
<WizardButtonGroup
  onPrevious={onPrevious}
  onComplete={() => onComplete('STOP', notes)}
  completeLabel="CONFIRM SAFETY STOP DECISION"
  nextVariant="danger"
/>
```

---

### Example 3: DoorsWizard - Intermediate Step

**Before:**
```jsx
<div className="flex justify-between">
  <button
    onClick={onPrevious}
    className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
  >
    Previous
  </button>
  <button
    onClick={onNext}
    disabled={!responses.airSystemCheck}
    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
  >
    Next Step
  </button>
</div>
```

**After:**
```jsx
<WizardButtonGroup
  onPrevious={onPrevious}
  onNext={onNext}
  isNextDisabled={!responses.airSystemCheck}
  nextLabel="Next Step"
/>
```

---

### Example 4: InteriorLightsWizard - Final Success State

**Before:**
```jsx
<div className="flex justify-between">
  <button
    onClick={onPrevious}
    className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
  >
    Previous
  </button>
  <button
    onClick={onComplete}
    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors"
  >
    Complete Assessment
  </button>
</div>
```

**After:**
```jsx
<WizardButtonGroup
  onPrevious={onPrevious}
  onComplete={onComplete}
  completeLabel="Complete Assessment"
  nextVariant="success"
/>
```

---

## Visual Variants Guide

### `primary` (Default - Blue)
- Use for: Standard navigation, continuing to next step
- Color: Blue gradient (#3b82f6 → #2563eb)

### `success` (Green)
- Use for: Successful completion, confirming safe operation
- Color: Green gradient (#10b981 → #059669)
- Example: "Complete Assessment", "Confirm Continue Decision"

### `danger` (Red)
- Use for: Critical stops, safety-critical decisions
- Color: Red gradient (#ef4444 → #dc2626)
- Example: "CONFIRM SAFETY STOP", "Stop Immediately"

### `warning` (Amber/Orange)
- Use for: Caution actions, changeover decisions
- Color: Amber gradient (#f59e0b → #d97706)
- Example: "Arrange Changeover", "Proceed with Caution"

---

## Keyboard Shortcuts (Built-in)

The WizardButtonGroup automatically enables keyboard navigation:

- **Ctrl/Cmd + Enter**: Trigger Next/Complete button
- **Escape**: Trigger Previous/Back button
- **Tab**: Navigate between buttons
- **Enter**: Activate focused button

---

## Accessibility Features (Built-in)

✅ WCAG 2.1 AA compliant
✅ Proper ARIA labels
✅ High contrast focus indicators
✅ Keyboard navigation support
✅ Screen reader friendly
✅ Minimum 44px touch targets on mobile
✅ Loading states with descriptive text

---

## Migration Checklist

For each wizard file:

- [ ] Add `import WizardButtonGroup from '../common/WizardButtonGroup.jsx';`
- [ ] Find all button navigation patterns (search for `<div className="flex justify`)
- [ ] Replace with appropriate `<WizardButtonGroup>` component
- [ ] Test all button states (disabled, loading, variants)
- [ ] Verify keyboard navigation works
- [ ] Test on mobile responsive layout
- [ ] Remove old button CSS classes (if not used elsewhere)

---

## Files to Update (42 Total)

### Batch 1: Critical Wizards (Priority)
1. `/wizards/SteeringWizard.jsx`
2. `/wizards/BrakesWizard.jsx`
3. `/wizards/DoorsWizard.jsx`

### Batch 2: Common Wizards
4. `/wizards/InteriorLightsWizard.jsx`
5. `/wizards/ExteriorLightsWizard.jsx`
6. `/wizards/BatteryWizard.jsx`
7. `/wizards/NonStarterWizard.jsx`
8. `/wizards/CoolingSystemWizard.jsx`
9. `/wizards/DestinationDisplayWizard.jsx`

### Batch 3: Specialized Wizards
10. `/wizards/GearboxWizard.jsx`
11. `/wizards/SuspensionWizard.jsx`
12. `/wizards/PunctureWizard.jsx`
13. `/wizards/WarningLightsWizard.jsx`
14. `/wizards/WheelchairRampWizard.jsx`
15. `/wizards/WipersScreenwashWizard.jsx`
16. `/wizards/DemistersHeatersWizard.jsx`
17. `/wizards/BrokenWindowsWizard.jsx`
18. `/wizards/GearSelectionWizard.jsx`

### Batch 4: Advanced/Extended Wizards
19. `/wizards/InteriorExteriorDamageWizard.jsx`
20. `/wizards/EnhancedSteeringWizard.jsx`
21. `/wizards/InteriorLightsWizard_improved.jsx`
22. `/wizards/LowWaterWizard.jsx`
23. `/wizards/MobileBrakesWizard.jsx`
24. `/wizards/MobileSteeringWizard.jsx`
25. `/wizards/MobileGeneralAssessmentWizard.jsx`
26. `/wizards/OfflineSteeringWizard.jsx`
27. `/wizards/RealTimeEnhancedWizard.jsx`
28. `/wizards/RepeatDefectsWizard.jsx`
29. `/wizards/SpeedoWizard.jsx`
30. `/wizards/WingMirrorsWizard.jsx`
31. `/wizards/TracerItHelperWizard.jsx`
32. `/wizards/CameraEnhancedAssessmentWizard.jsx`
33. `/wizards/CuttingOutFuelWizard.jsx`
34. `/wizards/OilWarningLightWizard.jsx`
35. `/wizards/LooseWheelNutsWizard.jsx`
36. `/wizards/RoadTrafficIncidentsWizardSimple.jsx`
37. `/wizards/RoadTrafficIncidentsWizardWrapper.jsx`
38. `/wizards/RoadTrafficIncidentsWizard.jsx`
39. `/wizards/ABSLightWizard.jsx`
40. `/wizards/BuzzersWizard.jsx`
41. `/wizards/ExcessiveSmokeWizard.jsx`
42. `/wizards/SteeringWizard-with-logging.jsx` (if still in use)

---

## Testing Requirements

After migration of each wizard:

1. **Visual Testing:**
   - Buttons appear at bottom of viewport
   - Gradient overlay visible above buttons
   - Responsive layout works on mobile (< 640px)
   - Buttons stack vertically on mobile

2. **Functional Testing:**
   - Previous button navigates back
   - Next button navigates forward
   - Complete button triggers onComplete handler
   - Disabled states work correctly

3. **Accessibility Testing:**
   - Tab key navigates between buttons
   - Enter key activates buttons
   - Escape key goes back
   - Ctrl+Enter triggers next/complete

4. **Mobile Testing:**
   - Touch targets are adequate (min 44px)
   - Buttons don't overflow screen
   - Safe area insets respected

---

## Benefits Summary

✅ **100% consistency** across all 42 wizards
✅ **Reduced code** by ~400 lines (removing duplicate button code)
✅ **Better UX** with sticky footer and gradient overlay
✅ **Accessibility compliant** WCAG 2.1 AA
✅ **Mobile optimized** responsive layout
✅ **Keyboard navigation** built-in
✅ **Professional appearance** with gradients and shadows
✅ **Easier maintenance** single component to update

---

## Support & Questions

For implementation questions or issues:
1. Check this migration guide
2. Review UI/UX Analysis Report (`WIZARD_BUTTON_UX_ANALYSIS.md`)
3. Examine the WizardButtonGroup component source code
4. Test in browser dev tools for responsive behavior

---

**Last Updated:** October 6, 2025
**Component Version:** 1.0.0
**Maintained By:** Frontend Development Team
