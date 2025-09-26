# Modern App Header Documentation

## Overview

The Modern App Header is a sophisticated navigation component featuring glassmorphism design, real-time notifications, and smart scroll behavior. It replaces the legacy navigation with a more compact, feature-rich header.

## Features

### 🎨 Design
- **Glassmorphism effects** - Semi-transparent backgrounds with blur
- **Responsive design** - Adapts to desktop, tablet, and mobile
- **Dark/Light theme** - Automatic theme switching
- **Smooth animations** - Micro-interactions and transitions

### 🔔 Notifications
- **Real-time updates** - Live notification count badge
- **Priority levels** - Critical, High, Medium, Low
- **Rich notifications** - Action buttons, metadata, and filtering
- **Smart grouping** - Organized by type and time

### ⚡ Performance
- **Auto-hide on scroll** - Maximizes content space
- **Lazy loading** - Components load on demand
- **Optimized rendering** - Memoized components
- **Efficient updates** - Targeted re-renders

## Installation

```bash
# The component is already included in the project
# Located at: src/components/ModernAppHeader.jsx
```

## Usage

### Basic Implementation

```jsx
import ModernAppHeader from './components/ModernAppHeader';

function App() {
  return (
    <>
      <ModernAppHeader />
      <main>
        {/* Your content */}
      </main>
    </>
  );
}
```

### With Props

```jsx
<ModernAppHeader 
  variant="full"
  activeBreakdowns={3}
  isAuthenticated={true}
  supervisorSession={userSession}
  onSignOut={handleSignOut}
  onLoginSuccess={handleLogin}
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `string` | `'full'` | Header variant: 'full' or 'compact' |
| `activeBreakdowns` | `number` | `0` | Number of active breakdowns for badge |
| `isAuthenticated` | `boolean` | `false` | User authentication status |
| `supervisorSession` | `object` | `null` | Current user session data |
| `onSignOut` | `function` | - | Callback for sign out action |
| `onLoginSuccess` | `function` | - | Callback for successful login |

## Component Structure

```
ModernAppHeader/
├── Status Bar           # System health, weather, time
├── Main Header         
│   ├── Logo            # Go North East branding
│   ├── Navigation      # Main nav items
│   ├── Actions         # Search, notifications, emergency
│   └── Profile         # User menu with stats
└── Mobile Menu         # Responsive navigation
```

## Styling

### CSS Variables

```css
/* Customize in your CSS */
:root {
  --header-height: 60px;
  --status-bar-height: 28px;
  --primary-color: #E4002B;
  --glass-bg: rgba(255, 255, 255, 0.1);
  --glass-border: rgba(255, 255, 255, 0.2);
  --blur-amount: 12px;
}
```

### Custom Styling

```css
/* Override header styles */
.modern-app-header {
  /* Your custom styles */
}

/* Customize navigation */
.nav-link-modern {
  /* Your nav styles */
}

/* Style notifications */
.notification-badge {
  /* Badge customization */
}
```

## Notification System

### Service Integration

```javascript
import notificationService from '../services/notificationService';

// Subscribe to notifications
useEffect(() => {
  const unsubscribe = notificationService.subscribe((notifications) => {
    // Handle notifications
  });
  
  return unsubscribe;
}, []);
```

### Notification Types

```javascript
const NotificationTypes = {
  EMERGENCY: 'emergency',      // Critical breakdowns
  BREAKDOWN: 'breakdown',      // General breakdown alerts
  SLA: 'sla',                 // SLA warnings
  ASSIGNMENT: 'assignment',   // Task assignments
  FLEET_STATUS: 'fleet_status', // Fleet updates
  OPERATIONAL: 'operational',  // Operational alerts
  SYSTEM: 'system'            // System messages
};
```

### Creating Notifications

```javascript
// Add a new notification
notificationService.add({
  type: NotificationTypes.EMERGENCY,
  priority: 'critical',
  title: 'Emergency Breakdown',
  message: 'Bus 5521 breakdown on A1',
  busNumber: '5521',
  location: 'A1 Northbound',
  actions: [
    { label: 'Assign to Me', action: 'assign_self' },
    { label: 'Dispatch Recovery', action: 'dispatch' }
  ]
});
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Open command palette |
| `Alt + 1` | Navigate to Breakdown Guide |
| `Alt + 2` | Navigate to SDC Operations |
| `Alt + 3` | Navigate to Live Dashboard |
| `Alt + 4` | Navigate to Fleet Intelligence |
| `Alt + 5` | Navigate to Management |
| `ESC` | Close modals/dropdowns |

## Responsive Behavior

### Breakpoints

```css
/* Desktop: Full navigation */
@media (min-width: 1200px) {
  /* All nav items visible */
}

/* Tablet: Compact labels */
@media (max-width: 1199px) {
  /* Shortened labels */
}

/* Mobile: Hamburger menu */
@media (max-width: 768px) {
  /* Mobile navigation */
}
```

### Mobile Optimizations

- Touch-friendly targets (minimum 44x44px)
- Swipe gestures for notifications
- Collapsible navigation
- Optimized font sizes

## Performance Optimization

### Memoization

```jsx
// Memoized navigation items
const navigationItems = useMemo(() => {
  return [...]; // Navigation configuration
}, [liveStats]);

// Memoized callbacks
const handleNotificationClick = useCallback((notification) => {
  // Handle click
}, []);
```

### Lazy Loading

```jsx
// Lazy load heavy components
const EnhancedNotifications = lazy(() => 
  import('./notifications/EnhancedNotifications')
);
```

## Accessibility

### ARIA Labels

```jsx
<button 
  aria-label="Notifications"
  aria-expanded={showNotifications}
  aria-describedby="notification-count"
>
  <span id="notification-count" className="sr-only">
    {activeBreakdowns} active notifications
  </span>
</button>
```

### Keyboard Navigation

- All interactive elements are keyboard accessible
- Focus indicators are visible
- Tab order is logical
- Escape key closes modals

## Troubleshooting

### Common Issues

#### Badge Not Visible
```javascript
// Ensure activeBreakdowns > 0
// Check CSS overflow settings
.notifications-btn {
  overflow: visible !important;
}
```

#### Header Not Hiding on Scroll
```javascript
// Check scroll listener is attached
useEffect(() => {
  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
}, []);
```

#### Theme Not Persisting
```javascript
// Verify localStorage is accessible
localStorage.setItem('theme', theme);
const savedTheme = localStorage.getItem('theme');
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Testing

### Unit Tests

```javascript
import { render, screen } from '@testing-library/react';
import ModernAppHeader from './ModernAppHeader';

test('renders notification badge with count', () => {
  render(<ModernAppHeader activeBreakdowns={3} />);
  expect(screen.getByText('3')).toBeInTheDocument();
});
```

### Integration Tests

```javascript
test('opens notification panel on click', async () => {
  const { getByRole } = render(<ModernAppHeader />);
  const notificationBtn = getByRole('button', { name: /notifications/i });
  
  fireEvent.click(notificationBtn);
  
  await waitFor(() => {
    expect(screen.getByText('Notifications')).toBeVisible();
  });
});
```

## Migration Guide

### From Legacy Header

```jsx
// Old
import Navigation from './components/Navigation';
<Navigation {...props} />

// New
import ModernAppHeader from './components/ModernAppHeader';
<ModernAppHeader {...props} />
```

### Breaking Changes

- `hideNav` prop removed (use `variant` instead)
- `activeBreakdowns` now required for badge
- Profile menu structure changed
- Theme toggle moved to profile dropdown

## Customization

### Adding Navigation Items

```javascript
const navigationItems = [
  { 
    path: '/new-feature', 
    label: 'New Feature',
    icon: '🆕',
    color: '#00ff00',
    description: 'New feature description',
    stats: { label: 'Count', value: 0 }
  }
];
```

### Custom Notification Types

```javascript
// Add to notificationService.js
export const CustomNotificationTypes = {
  ...NotificationTypes,
  CUSTOM: 'custom'
};
```

### Theme Customization

```css
/* Add custom theme */
:root[data-theme="custom"] {
  --bg-primary: #custom-color;
  --text-primary: #custom-text;
  /* ... other variables */
}
```

## Best Practices

1. **Always pass `activeBreakdowns`** - Even if 0
2. **Handle authentication properly** - Pass session data
3. **Use notification service** - Don't manipulate state directly
4. **Test responsive behavior** - Check all breakpoints
5. **Monitor performance** - Use React DevTools
6. **Follow accessibility guidelines** - Test with screen readers
7. **Keep dependencies updated** - Regular maintenance

## Support

For issues or questions:
- Check [CONTRIBUTING.md](../CONTRIBUTING.md)
- Open an issue on GitHub
- Contact the development team

---

*Last updated: January 2024*