# Go BARRY App HTML Modularization Project

## 🎯 **OBJECTIVE**
Break down the large 1.15MB `/Users/anthony/Go BARRY App/Go_BARRY/public/breakdown-guide/guide.html` file into smaller, manageable components while maintaining 100% functionality.

## 📁 **CURRENT PROJECT STRUCTURE**
```
/Users/anthony/Go BARRY App/Go_BARRY/public/breakdown-guide/
├── guide.html (1.15MB - ORIGINAL MONOLITHIC FILE)
├── index-modular.html (NEW - modular entry point)
├── styles/
│   └── main.css ✅ (extracted CSS styles)
├── components/
│   ├── common/
│   │   ├── icons.js ✅ (all SVG icon components)
│   │   └── constants.js ✅ (colors, configuration)
│   └── wizards/ (NEEDS POPULATION)
│       ├── InteriorLightsWizard.js ❌ (TO CREATE)
│       ├── ExteriorLightsWizard.js ❌ (TO CREATE)
│       ├── WheelchairLiftWizard.js ❌ (TO CREATE)
│       ├── DestinationDisplayWizard.js ❌ (TO CREATE)
│       ├── BatteryWizard.js ❌ (TO CREATE)
│       ├── CoolingSystemWizard.js ❌ (TO CREATE)
│       └── DemistersHeatersWizard.js ❌ (TO CREATE)
└── App.js ❌ (TO CREATE - main application component)
```

## 🔧 **TECHNICAL DETAILS**
- **Original file**: React app with Babel client-side compilation
- **Dependencies**: React 18, Tailwind CSS, Babel standalone
- **Architecture**: Single HTML file with embedded `<script type="text/babel">`
- **Components identified**: ~7 wizard components + main App component
- **File size issue**: Too large for Claude Code to process efficiently

## ✅ **COMPLETED WORK**
1. **Created modular directory structure**
2. **Extracted CSS** into `styles/main.css`
3. **Created icon components** in `components/common/icons.js`
4. **Set up constants** in `components/common/constants.js`
5. **Created modular HTML template** (`index-modular.html`)

## 🎯 **NEXT TASKS (Priority Order)**

### **IMMEDIATE NEXT STEP:**
Extract wizard components from the original `guide.html` file:

1. **Read the original file**: `filesystem:read_file` on the guide.html
2. **Locate wizard components**: Search for patterns like `const InteriorLightsWizard = (`
3. **Extract each wizard**: Copy component code to individual files
4. **Convert to proper format**: Ensure each component exports to global scope
5. **Create main App.js**: Extract the main App component
6. **Test functionality**: Verify modular version works identically

### **EXTRACTION PATTERN:**
Each wizard file should follow this structure:
```javascript
// Component code extracted from original file
const InteriorLightsWizard = ({ currentStep, responses, updateResponse, onNext, onPrevious, onComplete }) => {
    // ... component implementation
};

// Export to global scope for loading
window.InteriorLightsWizard = InteriorLightsWizard;
```

### **TESTING STRATEGY:**
1. Compare original vs modular functionality
2. Check all wizard flows work correctly
3. Verify styling and animations intact
4. Ensure responsive design maintained

## 🚨 **CRITICAL REQUIREMENTS**
- **Maintain 100% functionality** - no features should break
- **Preserve all styling** - animations, responsive design, etc.
- **Keep loading performance** - modular should load as fast or faster
- **Ensure compatibility** - React 18, Babel, Tailwind versions unchanged

## 📋 **FILE LOCATIONS**
- **Project root**: `/Users/anthony/Go BARRY App/Go_BARRY/public/breakdown-guide/`
- **Original file**: `guide.html` (1,154,141 bytes)
- **Working directory**: Same as above

## 🎪 **CONTEXT FOR NEXT SESSION**
This is a Go North East bus breakdown guide application. The original file contains multiple wizard components that guide mechanics through different breakdown scenarios (lights, wheelchair lift, battery, etc.). The app uses React with client-side Babel compilation and Tailwind CSS for styling.

**Start by reading the original guide.html file and extracting the first wizard component (InteriorLightsWizard) to establish the pattern.**