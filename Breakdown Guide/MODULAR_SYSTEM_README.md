# Modular Breakdown Guide System

## Overview

The Breakdown Guide has been converted to a **modular file structure** to solve context limit issues and improve maintainability. Instead of one large file, the diagnostic flows are now split into manageable modules.

## File Structure

```
src/
├── modules/
│   ├── module-loader.js          # Handles dynamic module loading
│   ├── module-integration.js     # Integrates with existing app
│   └── issues/
│       ├── safety-critical.js    # Critical safety issues (brakes, steering, oil, etc.)
│       ├── mechanical-issues.js  # Mechanical problems (overheating, suspension, etc.)
│       ├── electrical-issues.js  # Electrical problems (battery, ABS, lights, etc.)
│       ├── operational-issues.js # Operational problems (doors, water, wipers, etc.)
│       ├── emergency-procedures.js # Emergency responses (incidents, fuel leaks, etc.)
│       └── documentation.js      # Reference info and procedures
├── data/
│   └── diagnostic-flows.js       # Original flows (still loaded for compatibility)
└── index.html                    # Updated to include modular system
```

## How It Works

### 1. **Module Loader** (`module-loader.js`)
- Dynamically loads individual issue modules
- Caches loaded modules for performance
- Provides statistics and management functions

### 2. **Module Integration** (`module-integration.js`)
- Connects modular system with existing app
- Merges modular flows with any existing flows
- Handles initialization and error fallbacks

### 3. **Issue Modules** (`issues/*.js`)
Each module contains related diagnostic flows:

- **Safety Critical**: Brakes, steering, oil warnings, loose wheel nuts, excessive smoke
- **Mechanical**: Overheating, suspension, gearbox temperature, punctures
- **Electrical**: Battery lights, ABS lights, interior/exterior lights, warning lights
- **Operational**: Non-starters, doors, low water, wipers, demisters, speedometer, ramps
- **Emergency**: Road traffic incidents, broken windows, fuel issues, buzzers
- **Documentation**: Repeat defects, gear selection, contact info, safety references

## Benefits

### ✅ **Solves Context Limits**
- Each module is small enough to edit without hitting limits
- Can work on individual sections independently

### ✅ **Better Organization**  
- Related issues grouped logically
- Easier to find and update specific procedures

### ✅ **Improved Maintainability**
- Multiple people can work on different modules simultaneously
- Changes are isolated to specific modules
- Version control is cleaner

### ✅ **Performance Optimized**
- Critical modules preload for fast access
- Non-critical modules load on demand
- Efficient caching system

### ✅ **Backward Compatible**
- Works alongside existing diagnostic flows
- Graceful fallback if modules fail to load
- No disruption to current functionality

## Adding New Issues

### To Add a New Diagnostic Flow:

1. **Choose the appropriate module** (safety-critical, mechanical, etc.)
2. **Edit the relevant file** in `src/modules/issues/`
3. **Add your flow object** following the existing pattern:

```javascript
'new-issue-id': {
    id: 'new-issue-id',
    title: 'New Issue Title',
    category: 'appropriate_category',
    priority: 1, // 1=critical, 2=high, 3=moderate, 4=low
    estimatedTime: '30-60 seconds',
    severity: 'critical', // critical, high, moderate, low
    icon: '🔧',
    color: '#dc2626',
    sdcReference: 'SDC Guide Section X: New Issue',
    steps: [
        // Your diagnostic steps here
    ]
}
```

4. **Update the module mapping** in `module-integration.js` if needed

## Development Commands

### Refresh Modular System
```javascript
// In browser console
await window.moduleIntegration.refresh();
```

### Check Module Stats
```javascript
// In browser console
console.log(window.moduleIntegration.getStats());
```

### Clear Module Cache
```javascript
// In browser console
window.moduleLoader.clearCache();
```

## Troubleshooting

### If Modules Don't Load:
1. Check browser console for errors
2. Verify file paths are correct
3. Check that module files export correctly
4. Try refreshing the modular system

### If Flows Are Missing:
1. Check which module should contain the flow
2. Verify the flow ID is in the module mapping
3. Try loading the specific module manually

### Performance Issues:
1. Check module cache status
2. Preload critical modules if needed
3. Consider splitting large modules further

## Migration Notes

- **Original diagnostic flows** are still loaded for compatibility
- **Modular flows take precedence** over original flows with same IDs
- **No changes needed** to existing application logic
- **Fully backward compatible** with current system

## Future Enhancements

- **Hot reloading** for development
- **Module dependency management**
- **Advanced caching strategies**
- **Module versioning system**
- **Automated module generation**

---

This modular system solves your context limit problems while maintaining all existing functionality and providing a foundation for easier future maintenance and development.
