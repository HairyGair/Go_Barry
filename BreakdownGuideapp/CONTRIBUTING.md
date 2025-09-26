# Contributing to Go North East Breakdown Management System

First off, thank you for considering contributing to the Go North East Breakdown Management System! It's people like you that help make this tool better for all our supervisors and engineers.

## Code of Conduct

By participating in this project, you are expected to uphold our Code of Conduct:
- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on constructive criticism
- Show empathy towards other community members

## How Can I Contribute?

### 🐛 Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When creating a bug report, include:

- **Clear and descriptive title**
- **Step-by-step reproduction instructions**
- **Expected behavior**
- **Actual behavior**
- **Screenshots if applicable**
- **System information** (browser, OS, device)

### 💡 Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

- **Use case** - Why is this enhancement needed?
- **Proposed solution** - How should it work?
- **Alternatives considered** - What other solutions did you consider?
- **Additional context** - Mockups, diagrams, or examples

### 🔧 Pull Requests

1. **Fork the repo** and create your branch from `main`
2. **Follow the coding style** (see below)
3. **Test your changes** thoroughly
4. **Update documentation** if needed
5. **Write a clear PR description**

## Development Setup

### Prerequisites

```bash
# Node.js 16+ required
node --version

# npm 7+ required
npm --version
```

### Local Development

```bash
# Clone your fork
git clone https://github.com/your-username/BreakdownGuideapp.git
cd BreakdownGuideapp

# Install dependencies
cd frontend
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## Coding Standards

### JavaScript/React Style Guide

```javascript
// ✅ Good - Use functional components with hooks
const MyComponent = ({ prop1, prop2 }) => {
  const [state, setState] = useState(null);
  
  useEffect(() => {
    // Effect logic
  }, [prop1]);
  
  return <div>{state}</div>;
};

// ❌ Avoid - Class components (unless necessary)
class MyComponent extends React.Component {
  // ...
}
```

### CSS Style Guide

```css
/* ✅ Good - Use CSS variables for theming */
.my-component {
  background: var(--bg-primary);
  color: var(--text-primary);
  padding: var(--spacing-md);
}

/* ✅ Good - Mobile-first responsive design */
.my-component {
  /* Mobile styles */
}

@media (min-width: 768px) {
  .my-component {
    /* Tablet and up */
  }
}
```

### Component Structure

```jsx
// ✅ Good - Clear component organization
import React, { useState, useEffect } from 'react';
import './MyComponent.css';

const MyComponent = ({ 
  prop1, 
  prop2,
  onAction 
}) => {
  // State hooks
  const [state, setState] = useState(null);
  
  // Effect hooks
  useEffect(() => {
    // Logic
  }, []);
  
  // Event handlers
  const handleClick = () => {
    // Handler logic
  };
  
  // Render
  return (
    <div className="my-component">
      {/* Component JSX */}
    </div>
  );
};

export default MyComponent;
```

### Git Commit Messages

Follow the conventional commits specification:

```bash
# Format: <type>(<scope>): <subject>

feat(notifications): add priority filtering
fix(header): resolve badge overflow issue
docs(readme): update installation instructions
style(dashboard): improve mobile layout
refactor(api): optimize database queries
perf(dashboard): lazy load components
test(auth): add login flow tests
chore(deps): update dependencies
```

## Testing

### Unit Tests

```javascript
// MyComponent.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
  
  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<MyComponent onClick={handleClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Integration Tests

Test complete user flows:

```javascript
describe('Breakdown Reporting Flow', () => {
  it('completes full assessment process', async () => {
    // Test complete user journey
  });
});
```

## Documentation

### Code Comments

```javascript
/**
 * Calculates SLA breach time for a breakdown
 * @param {Date} reportedTime - When breakdown was reported
 * @param {number} slaMinutes - SLA target in minutes
 * @returns {Date} - Time when SLA will breach
 */
const calculateSLABreach = (reportedTime, slaMinutes) => {
  // Implementation
};
```

### Component Documentation

```jsx
/**
 * ModernAppHeader Component
 * 
 * The main navigation header for the application.
 * Features smart scroll behavior, notifications, and user profile management.
 * 
 * @component
 * @param {Object} props
 * @param {string} props.variant - Header variant ('full' | 'compact')
 * @param {number} props.activeBreakdowns - Number of active breakdowns
 * @param {Function} props.onSignOut - Callback for sign out action
 * 
 * @example
 * <ModernAppHeader 
 *   variant="full"
 *   activeBreakdowns={3}
 *   onSignOut={handleSignOut}
 * />
 */
```

## Project Structure

```
src/
├── components/           # Reusable React components
│   ├── common/          # Shared components
│   ├── notifications/   # Notification system
│   └── dashboard/       # Dashboard widgets
├── services/            # API and business logic
├── utils/              # Utility functions
├── hooks/              # Custom React hooks
├── styles/             # Global styles
└── tests/              # Test files
```

## Performance Guidelines

### Component Optimization

```javascript
// ✅ Good - Memoize expensive computations
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

// ✅ Good - Memoize callbacks
const handleClick = useCallback(() => {
  // Handler logic
}, [dependency]);

// ✅ Good - Lazy load components
const HeavyComponent = lazy(() => import('./HeavyComponent'));
```

### Bundle Size

- Keep bundle size under 500KB gzipped
- Use dynamic imports for large components
- Analyze bundle with `npm run analyze`

## Accessibility

### WCAG 2.1 AA Compliance

```jsx
// ✅ Good - Semantic HTML and ARIA labels
<button 
  aria-label="Report new breakdown"
  aria-pressed={isActive}
>
  Report Breakdown
</button>

// ✅ Good - Keyboard navigation support
<div 
  tabIndex={0}
  onKeyDown={handleKeyDown}
  role="navigation"
  aria-label="Main navigation"
>
```

## Security

### Data Validation

```javascript
// ✅ Good - Validate all inputs
const validateBusNumber = (busNumber) => {
  const pattern = /^[0-9]{4,5}$/;
  if (!pattern.test(busNumber)) {
    throw new Error('Invalid bus number format');
  }
  return busNumber;
};
```

### API Security

```javascript
// ✅ Good - Use environment variables
const API_URL = import.meta.env.VITE_API_BASE_URL;

// ✅ Good - Include auth headers
const fetchData = async () => {
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
};
```

## Release Process

1. **Create feature branch** from `main`
2. **Develop and test** your feature
3. **Update documentation** and CHANGELOG
4. **Create pull request** with clear description
5. **Code review** by at least one team member
6. **Merge to main** after approval
7. **Deploy to staging** for testing
8. **Deploy to production** after QA approval

## Questions?

Feel free to:
- Open an issue for discussion
- Contact the team on Slack (#breakdown-system-dev)
- Email: dev-team@gonortheast.co.uk

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing to making our breakdown management system better! 🚌💪