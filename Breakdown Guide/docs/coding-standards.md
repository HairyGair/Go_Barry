# Coding Standards & Conventions

## Overview
This document outlines the coding standards and conventions for the Breakdown Guide App project.

## General Principles
1. **Clarity over cleverness** - Code should be easily understood by other developers
2. **Consistency** - Follow established patterns throughout the project
3. **Safety first** - Any code related to safety decisions must be clearly marked
4. **Documentation** - Comment complex logic and document all functions

## HTML Standards

### File Structure
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Page Title - Go North East Breakdown Guide</title>
    <!-- CSS files -->
    <!-- JS files at end of body -->
</head>
<body>
    <!-- Content -->
    <script src="app.js"></script>
</body>
</html>
```

### Naming Conventions
- Use semantic HTML5 elements
- IDs: camelCase (e.g., `mainContainer`)
- Classes: kebab-case (e.g., `category-button`)
- Data attributes: data-* prefix (e.g., `data-issue-id`)

## CSS Standards

### File Organization
```css
/* 1. Variables and Imports */
:root {
    --gne-navy: #1a2b5a;
    --gne-red: #dc2626;
}

/* 2. Reset/Base Styles */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

/* 3. Layout */
.container { }

/* 4. Components */
.button { }

/* 5. Utilities */
.text-center { }
```

### Naming Conventions
- Use BEM methodology where appropriate
- Component: `.button`
- Element: `.button__icon`
- Modifier: `.button--danger`

### Safety Styling
```css
/* Safety-critical elements must be clearly marked */
.safety-critical {
    border: 2px solid var(--gne-red);
    background-color: #fee2e2;
}

.stop-action {
    background-color: var(--gne-red);
    color: white;
    font-weight: bold;
}
```

## JavaScript Standards

### ES6+ Features
- Use `const` and `let`, never `var`
- Use arrow functions for callbacks
- Use template literals for string interpolation
- Use destructuring where appropriate

### Function Naming
```javascript
// Use descriptive verb-noun pairs
function checkBrakeStatus() { }
function validateUserInput() { }
function handleSteeringIssue() { }

// Safety-critical functions must be prefixed
function SAFETY_performEmergencyStop() { }
function SAFETY_validateCriticalAction() { }
```

### Code Structure
```javascript
// Constants at top
const MAX_TEMPERATURE = 100;
const MIN_BRAKE_PRESSURE = 50;

// State management
let currentIssue = null;
let diagnosticStep = 0;

// Event listeners
document.addEventListener('DOMContentLoaded', initializeApp);

// Functions grouped by purpose
// Initialization functions
function initializeApp() { }

// Navigation functions
function navigateToStep() { }

// Validation functions
function validateInput() { }

// Safety functions
function SAFETY_checkCriticalCondition() { }
```

### Error Handling
```javascript
try {
    // Risky operation
} catch (error) {
    console.error('Error in [function name]:', error);
    // User-friendly error message
    showUserMessage('An error occurred. Please try again.');
    // Log for debugging
    logError(error);
}
```

### Comments
```javascript
/**
 * Checks if the vehicle should stop immediately based on symptoms
 * @param {Array} symptoms - List of reported symptoms
 * @returns {boolean} - True if immediate stop required
 * @safety CRITICAL - This function determines safety-critical decisions
 */
function SAFETY_requiresImmediateStop(symptoms) {
    // Check each symptom against critical list
    // ...
}

// Inline comments for complex logic
if (temperature > 100 && !coolingSystemActive) {
    // Temperature critical and no mitigation active
    return 'STOP';
}
```

## Data Structure Standards

### Issue Definition Format
```javascript
const issueDefinition = {
    id: 'brake-failure',
    title: 'Brake System Failure',
    category: 'critical-safety',
    priority: 1, // 1=Critical, 2=High, 3=Normal
    steps: [
        {
            id: 'symptom-check',
            title: 'Check Symptoms',
            content: 'HTML content here',
            actions: [
                {
                    label: 'Symptoms Present',
                    nextStep: 'immediate-stop',
                    type: 'danger'
                }
            ]
        }
    ]
};
```

### Logging Format
```javascript
const logEntry = {
    timestamp: new Date().toISOString(),
    issueId: 'brake-failure',
    stepId: 'symptom-check',
    action: 'Symptoms Present',
    outcome: 'STOP',
    notes: 'Driver reported complete brake failure',
    userId: 'supervisor-123'
};
```

## Safety Conventions

### Critical Decision Points
```javascript
// All safety-critical decisions must:
// 1. Be clearly marked with SAFETY_ prefix
// 2. Log the decision
// 3. Require confirmation
// 4. Cannot be undone without restart

if (SAFETY_requiresImmediateStop(symptoms)) {
    // Log critical decision
    logCriticalDecision('IMMEDIATE_STOP', symptoms);
    
    // Show confirmation dialog
    const confirmed = await confirmCriticalAction(
        'This will instruct the driver to STOP IMMEDIATELY. Confirm?'
    );
    
    if (confirmed) {
        executeEmergencyStop();
    }
}
```

### Color Coding
- **Red (#dc2626)**: Immediate stop, critical safety
- **Amber (#f59e0b)**: Warning, changeover required
- **Green (#10b981)**: Safe to continue
- **Navy (#1a2b5a)**: Standard UI elements

## Version Control

### Commit Messages
```
type(scope): subject

body

footer
```

Types:
- feat: New feature
- fix: Bug fix
- safety: Safety-critical change
- docs: Documentation
- style: Formatting
- refactor: Code restructuring
- test: Adding tests

Example:
```
safety(brakes): Add immediate stop validation

- Added SAFETY_requiresImmediateStop function
- Implemented confirmation dialog
- Added audit logging for critical decisions

Refs: SDC-Guide-Section-7
```

### Branch Naming
- feature/issue-name
- bugfix/issue-description
- safety/critical-issue
- release/v1.0.0

## Testing Standards

### Test File Naming
- `[filename].test.js`
- Safety tests: `[filename].safety.test.js`

### Test Structure
```javascript
describe('Brake System Diagnostics', () => {
    describe('SAFETY_requiresImmediateStop', () => {
        it('should return true for brake pedal sinking', () => {
            // Test implementation
        });
        
        it('should log critical decision', () => {
            // Test implementation
        });
    });
});
```

## Accessibility Standards
- All interactive elements must be keyboard accessible
- Use ARIA labels for screen readers
- Maintain color contrast ratios (WCAG AA minimum)
- Provide text alternatives for icons

## Performance Standards
- Page load time < 3 seconds
- Diagnostic step navigation < 500ms
- Local storage operations < 100ms
- Search results < 1 second

---

Remember: **Safety is Non-Negotiable** - When in doubt, always err on the side of safety.
