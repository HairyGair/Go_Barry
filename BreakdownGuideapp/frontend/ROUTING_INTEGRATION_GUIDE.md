# 🗺️ Routing Integration Guide

## Overview
Complete routing integration between breakdown guide and SDC Dashboard with seamless navigation flow, automatic highlighting, and focus management.

## 🎯 Navigation Flow Architecture

### 1. Breakdown Guide → SDC Dashboard Flow

```javascript
// Complete assessment in breakdown guide
breakdownGuide.complete() 
  → Show completion overlay (3s countdown)
  → navigationService.handleBreakdownGuideCompletion()
  → redirect('/dashboards/sdc?highlight=' + breakdownId)
  → Apply highlight effect & focus on breakdown card
```

### 2. SDC Dashboard → Breakdown Guide Flow (Edit)

```javascript
// Edit assessment from SDC Dashboard
sdcDashboard.editAssessment(breakdownId)
  → navigationService.navigateToBreakdownGuide(breakdownId, { mode: 'edit' })
  → redirect('/breakdown-guide?edit=' + breakdownId + '&return=' + returnUrl)
  → Complete edit
  → Return to SDC Dashboard with highlight
```

## 📦 Key Components

### NavigationService (`/src/services/navigationService.js`)
Core service managing all navigation logic:

```javascript
import navigationService from '../services/navigationService';

// Navigate to SDC Dashboard with highlighting
navigationService.navigateToSDCDashboard('BD-2025-00034', {
  decision: 'STOP',
  highlight: true,
  scrollTo: true,
  flashDuration: 10000 // 10 seconds
});

// Navigate to breakdown guide for editing
navigationService.navigateToBreakdownGuide('BD-2025-00034', {
  mode: 'edit',
  reason: 'Incorrect decision recorded',
  returnUrl: '/dashboards/sdc?highlight=BD-2025-00034'
});
```

### useNavigationIntegration Hook
React hook for component integration:

```javascript
import useNavigationIntegration from '../hooks/useNavigationIntegration';

const MyComponent = () => {
  const {
    navigateToSDCDashboard,
    navigateToBreakdownGuide,
    highlightElement,
    urlParams,
    isHighlighting
  } = useNavigationIntegration();

  // Use navigation methods
  const handleComplete = () => {
    navigateToSDCDashboard(breakdownId, {
      decision: 'STOP',
      highlight: true
    });
  };

  // Check for highlight on mount
  useEffect(() => {
    if (urlParams.highlight) {
      console.log('Highlighting breakdown:', urlParams.highlight);
    }
  }, [urlParams]);
};
```

### BreakdownGuideCompletion Component
Handles the completion flow with visual feedback:

```jsx
import BreakdownGuideCompletion from '../components/BreakdownGuideCompletion';

// Use in breakdown guide
const handleWizardComplete = (decision) => {
  return (
    <BreakdownGuideCompletion
      breakdownId={breakdownId}
      decision={decision}
      wizardType="steering"
      supervisorBadge="AG003"
      fleetNumber="6334"
      onComplete={(data) => console.log('Completed:', data)}
    />
  );
};
```

## 🌟 Highlighting System

### URL Parameters
```
/dashboards/sdc?highlight=BD-2025-00034&decision=STOP&flashDuration=15000&scrollTo=true
```

| Parameter | Description | Default |
|-----------|-------------|---------|
| `highlight` | Breakdown ID to highlight | - |
| `decision` | Decision made (STOP/AMBER/CONTINUE) | - |
| `flashDuration` | Highlight duration in milliseconds | 10000 |
| `scrollTo` | Auto-scroll to element | true |
| `completed` | Flag indicating return from completion | false |

### Highlight Styles
Import the navigation highlight styles:

```jsx
import '../styles/navigation-highlights.css';
```

Features:
- Pulse animations with decision-specific colors
- Flash effects for attention
- Smooth scroll-to-view
- Accessibility focus management
- Mobile-responsive animations

### Apply Highlighting

```javascript
// In SDC Dashboard component
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const highlightId = params.get('highlight');
  
  if (highlightId) {
    navigationService.applyHighlight(highlightId, {
      duration: 15000,
      scrollTo: true,
      flashCount: 3,
      focusElement: true,
      animationClass: 'highlight-flash'
    });
  }
}, []);
```

## 🔄 Integration Examples

### 1. Complete Breakdown Guide Integration

```jsx
// In breakdown guide wizard component
const CompleteAssessment = ({ breakdownData, decision }) => {
  const handleCompletion = async () => {
    try {
      // Save assessment
      await saveAssessment({ ...breakdownData, decision });
      
      // Show completion screen with redirect
      setShowCompletion(true);
      
    } catch (error) {
      console.error('Failed to complete assessment:', error);
    }
  };

  if (showCompletion) {
    return (
      <BreakdownGuideCompletion
        breakdownId={breakdownData.breakdown_id}
        decision={decision}
        wizardType={breakdownData.wizard_type}
        supervisorBadge={breakdownData.supervisor_badge}
        fleetNumber={breakdownData.fleet_number}
      />
    );
  }

  return (
    <button onClick={handleCompletion}>
      Complete Assessment
    </button>
  );
};
```

### 2. SDC Dashboard Integration

```jsx
// In SDC Dashboard component
import useNavigationIntegration from '../hooks/useNavigationIntegration';

const SDCDashboard = () => {
  const { 
    urlParams, 
    highlightElement,
    getHighlightTarget,
    isHighlighting 
  } = useNavigationIntegration();
  
  const [breakdowns, setBreakdowns] = useState([]);

  // Handle highlighting on data load
  useEffect(() => {
    if (breakdowns.length > 0 && urlParams.highlight) {
      // Find and highlight the target breakdown
      const targetBreakdown = breakdowns.find(
        b => b.breakdown_id === urlParams.highlight
      );
      
      if (targetBreakdown) {
        highlightElement(urlParams.highlight, {
          duration: parseInt(urlParams.flashDuration) || 10000,
          decision: urlParams.decision
        });
      }
    }
  }, [breakdowns, urlParams]);

  // Render breakdown cards with highlight support
  return (
    <div>
      {breakdowns.map(breakdown => (
        <div
          key={breakdown.breakdown_id}
          id={breakdown.breakdown_id}
          data-breakdown-id={breakdown.breakdown_id}
          className={`breakdown-card ${
            breakdown.breakdown_id === urlParams.highlight ? 'highlighted' : ''
          }`}
        >
          {/* Breakdown card content */}
        </div>
      ))}
    </div>
  );
};
```

### 3. Edit Assessment Flow

```jsx
// In breakdown card component
const BreakdownCard = ({ breakdown }) => {
  const { navigateToBreakdownGuide } = useNavigationIntegration();
  
  const handleEditAssessment = () => {
    // Store current state
    const returnUrl = window.location.href;
    
    // Navigate to breakdown guide with edit mode
    navigateToBreakdownGuide(breakdown.breakdown_id, {
      mode: 'edit',
      reason: 'Review required',
      returnUrl: returnUrl,
      wizardType: breakdown.wizard_type
    });
  };

  return (
    <div className="breakdown-card">
      {/* Card content */}
      <button onClick={handleEditAssessment}>
        Edit Assessment
      </button>
    </div>
  );
};
```

## 🎨 Visual Feedback Components

### Completion Notification
Automatic notification on return from breakdown guide:

```javascript
// Automatically shown when completed=true in URL
if (urlParams.completed === 'true') {
  // Shows success notification with:
  // - Completion confirmation
  // - Breakdown ID
  // - Decision made
  // - Auto-dismiss after 8 seconds
}
```

### Scroll Indicator
Shows when element is below viewport:

```html
<div class="scroll-to-highlight">
  Click to view highlighted breakdown ↓
</div>
```

### Highlight Badge
Visual indicator on highlighted cards:

```html
<span class="highlight-badge new">NEW</span>
```

## 🔐 State Management

### Cross-Window Communication
For multi-tab scenarios:

```javascript
// Store pending highlight before navigation
navigationService.storePendingHighlight('BD-2025-00034', {
  decision: 'STOP',
  source: 'breakdown_guide'
});

// Retrieve on destination page
const pendingHighlight = navigationService.getPendingHighlight();
if (pendingHighlight) {
  // Apply highlight
}
```

### Navigation State Persistence
For return journeys:

```javascript
// Store state before leaving
navigationService.storeNavigationState({
  breakdownId: 'BD-2025-00034',
  filters: currentFilters,
  scrollPosition: window.scrollY
});

// Restore on return
const savedState = navigationService.getNavigationState('BD-2025-00034');
if (savedState) {
  // Restore filters and scroll position
}
```

## ♿ Accessibility Features

### Focus Management
- Automatic focus on highlighted elements
- Proper tabindex handling
- Keyboard navigation support

### Screen Reader Announcements
```javascript
// Announces to screen readers
"Breakdown BD-2025-00034 completed with decision: STOP. Element highlighted and focused."
```

### ARIA Attributes
- `role="status"` for live updates
- `aria-live="polite"` for announcements
- Proper focus indicators

## 🚀 Implementation Checklist

- [ ] Import NavigationService in components
- [ ] Add useNavigationIntegration hook to SDC Dashboard
- [ ] Implement BreakdownGuideCompletion in wizard
- [ ] Include navigation-highlights.css styles
- [ ] Add URL parameter processing on page load
- [ ] Test highlight animations across browsers
- [ ] Verify mobile responsiveness
- [ ] Test accessibility with screen readers
- [ ] Validate cross-tab navigation
- [ ] Monitor performance with multiple highlights

## 📱 Mobile Considerations

- Reduced animation duration (1.5s vs 2s)
- Touch-friendly tap targets
- Adjusted highlight padding
- Optimized scroll behavior
- Responsive notification sizing

## 🔍 Debugging

### Navigation Logs
```javascript
// View navigation history
const history = navigationService.getNavigationHistory();
console.log('Navigation history:', history);
```

### Connection Status
```javascript
// Check if on correct page
console.log('On SDC Dashboard:', navigationService.isOnSDCDashboard());
console.log('On Breakdown Guide:', navigationService.isOnBreakdownGuide());
```

This routing integration provides a seamless, accessible, and visually engaging navigation experience between the breakdown guide and SDC Dashboard.