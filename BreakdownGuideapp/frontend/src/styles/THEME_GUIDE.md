# Go North East Theme System

## Overview
This theme system ensures consistent colors, spacing, and styling throughout the entire Go North East Breakdown Guide application.

## File Structure
```
src/styles/
├── theme.js              # JavaScript theme constants and helpers
├── global-theme.css      # CSS variables and global styles
└── ThemeProvider.jsx     # React utilities and hooks
```

## Usage

### 1. CSS Variables (Recommended)
Use CSS variables in your stylesheets for consistency:

```css
.my-component {
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
}

.my-button {
  background-color: var(--color-primary);
  padding: var(--spacing-sm) var(--spacing-md);
}

.status-stop {
  color: var(--color-stop);
}
```

### 2. JavaScript Theme Import
For React components using inline styles or styled-components:

```javascript
import { theme } from '@/styles/theme';

const MyComponent = () => {
  return (
    <div style={{
      backgroundColor: theme.colors.bgSecondary,
      padding: theme.spacing.md,
      borderRadius: theme.radius.md,
    }}>
      Content
    </div>
  );
};
```

### 3. Theme Utilities
Use the provided utility functions:

```javascript
import { getStatusColor, getStatusBackground } from '@/styles/theme';

const StatusBadge = ({ status }) => {
  const color = getStatusColor(status);
  const bgColor = getStatusBackground(status, 0.1);
  
  return (
    <span style={{ color, backgroundColor: bgColor }}>
      {status}
    </span>
  );
};
```

### 4. React Hooks
For more complex theme usage:

```javascript
import { useThemeStyles } from '@/styles/ThemeProvider';

const MyComponent = () => {
  const { getButtonStyle, getBadgeStyle, getCardStyle, theme } = useThemeStyles();
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div style={getCardStyle(isHovered)}>
      <button style={getButtonStyle('primary', isHovered)}>
        Click Me
      </button>
      <span style={getBadgeStyle('success')}>
        Active
      </span>
    </div>
  );
};
```

## Color Palette

### Primary Colors
- **Primary Red**: `#e4251b` - Go North East brand red
- **Primary Dark**: `#c41e17` - Hover state red
- **Primary Light**: `#ff4136` - Light red for highlights

### Background Colors (Dark Theme)
- **Primary BG**: `#121212` - Main dark background
- **Secondary BG**: `#1a1a1a` - Card backgrounds
- **Tertiary BG**: `#242424` - Elevated surfaces
- **Hover BG**: `#2a2a2a` - Hover states

### Text Colors
- **Primary**: `#ffffff` - Main text
- **Secondary**: `#a0a0a0` - Secondary text
- **Muted**: `#666666` - Disabled/muted text

### Status Colors
- **Success**: `#28a745` - Green
- **Warning**: `#ffc107` - Yellow
- **Danger**: `#dc3545` - Red
- **Info**: `#17a2b8` - Blue

### Decision Colors
- **STOP**: `#e4251b` - Red (same as primary)
- **AMBER**: `#ff9800` - Orange
- **CONTINUE**: `#28a745` - Green

## Pre-built Classes

### Cards
```html
<div class="theme-card">
  <div class="theme-card-header">Header</div>
  Content
</div>
```

### Buttons
```html
<button class="theme-btn theme-btn-primary">Primary</button>
<button class="theme-btn theme-btn-secondary">Secondary</button>
<button class="theme-btn theme-btn-danger">Danger</button>
```

### Badges
```html
<span class="theme-badge theme-badge-success">Active</span>
<span class="theme-badge theme-badge-warning">Pending</span>
<span class="theme-badge theme-badge-danger">Critical</span>
<span class="theme-badge theme-badge-stop">STOP</span>
<span class="theme-badge theme-badge-amber">AMBER</span>
<span class="theme-badge theme-badge-continue">CONTINUE</span>
```

### Forms
```html
<input class="theme-input" type="text" />
<select class="theme-select">
  <option>Option 1</option>
</select>
<textarea class="theme-textarea"></textarea>
```

### Tables
```html
<table class="theme-table">
  <thead>
    <tr>
      <th>Header 1</th>
      <th>Header 2</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Data 1</td>
      <td>Data 2</td>
    </tr>
  </tbody>
</table>
```

### Modals
```html
<div class="theme-modal-overlay">
  <div class="theme-modal">
    Modal content
  </div>
</div>
```

### Utility Classes
```html
<!-- Text Colors -->
<p class="text-primary">Primary text</p>
<p class="text-secondary">Secondary text</p>
<p class="text-muted">Muted text</p>
<p class="text-danger">Danger text</p>

<!-- Backgrounds -->
<div class="bg-secondary">Secondary background</div>

<!-- Spacing -->
<div class="p-md m-lg">Padded and margined</div>
```

## Applying to Dashboards

### Update Existing Dashboard Components

1. Replace hardcoded colors with CSS variables:
   ```css
   /* Before */
   background-color: #1a1a1a;
   
   /* After */
   background-color: var(--bg-secondary);
   ```

2. Import theme in JavaScript:
   ```javascript
   import { theme } from '@/styles/theme';
   ```

3. Use pre-built classes:
   ```jsx
   <div className="theme-card">
     <span className="theme-badge theme-badge-danger">Critical</span>
   </div>
   ```

## Best Practices

1. **Always use theme variables** instead of hardcoding colors
2. **Use semantic color names** (e.g., `--color-danger` not `--red`)
3. **Apply dark theme considerations** - ensure sufficient contrast
4. **Test hover states** - use provided hover utilities
5. **Maintain consistency** - use the same spacing scale throughout

## Migration Checklist

- [ ] Import global-theme.css in main.jsx
- [ ] Update Breakdown Dashboard to use theme
- [ ] Update SDC Dashboard to use theme
- [ ] Update Engineering Dashboard to use theme
- [ ] Update Management Dashboard to use theme
- [ ] Update breakdown-guide components
- [ ] Replace all hardcoded colors
- [ ] Test all hover states
- [ ] Verify mobile responsiveness

## Examples

### Dashboard Card
```jsx
<div className="theme-card">
  <div className="theme-card-header">
    <h3 style={{ color: theme.colors.textPrimary }}>
      Breakdown BD-2025-0001
    </h3>
    <span className="theme-badge theme-badge-danger">STOP</span>
  </div>
  <div style={{ color: theme.colors.textSecondary }}>
    Vehicle requires immediate attention
  </div>
</div>
```

### Status Indicator
```jsx
const StatusDot = ({ status }) => {
  const color = getStatusColor(status);
  return (
    <span 
      className="theme-status-indicator" 
      style={{ backgroundColor: color }}
    />
  );
};
```

This theme system ensures the entire Go North East application maintains consistent branding and dark theme throughout all components.
