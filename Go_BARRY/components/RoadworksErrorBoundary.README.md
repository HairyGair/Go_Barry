# RoadworksErrorBoundary

A specialized React error boundary component designed to catch and handle errors in the RoadworksManagerDashboard and related roadworks components. This error boundary provides a robust user experience with retry functionality, clear error messaging, and proper integration with React Native and Expo.

## Features

- **Error Catching**: Catches JavaScript errors anywhere in the child component tree
- **Retry Functionality**: Allows users to retry failed operations with configurable retry limits
- **User-Friendly Messages**: Provides context-aware error messages based on error types
- **Debug Information**: Shows technical details in development mode only
- **React Native Compatible**: Works seamlessly with React Native and Expo
- **Customizable**: Supports custom fallback components and error handlers
- **Reset Capability**: Allows users to reset the component state completely

## Usage

### Basic Usage

```jsx
import RoadworksErrorBoundary from './components/RoadworksErrorBoundary';
import RoadworksManagerDashboard from './components/RoadworksManagerDashboard';

function App() {
  return (
    <RoadworksErrorBoundary
      onClose={() => console.log('Closing roadworks')}
      onError={(error, errorInfo) => {
        console.error('Roadworks error:', error);
      }}
    >
      <RoadworksManagerDashboard />
    </RoadworksErrorBoundary>
  );
}
```

### Advanced Usage with Custom Props

```jsx
<RoadworksErrorBoundary
  maxRetries={5}
  onClose={handleClose}
  onError={handleError}
  fallbackComponent={(error, retry, reset) => (
    <CustomErrorDisplay 
      error={error} 
      onRetry={retry} 
      onReset={reset} 
    />
  )}
>
  <RoadworksManagerDashboard />
</RoadworksErrorBoundary>
```

### Using the HOC Wrapper

```jsx
import withRoadworksErrorBoundary from './components/withRoadworksErrorBoundary';
import RoadworksManagerDashboard from './components/RoadworksManagerDashboard';

const SafeRoadworksManager = withRoadworksErrorBoundary(
  RoadworksManagerDashboard,
  {
    maxRetries: 3,
    onError: (error, errorInfo) => {
      // Send to error tracking service
      analytics.track('roadworks_error', { error: error.message });
    }
  }
);

// Use the wrapped component
<SafeRoadworksManager onClose={handleClose} />
```

## Props

### Required Props
- `children`: React components to wrap with error boundary

### Optional Props
- `maxRetries` (number, default: 3): Maximum number of retry attempts
- `onClose` (function): Callback when user clicks close button
- `onError` (function): Callback when error occurs, receives (error, errorInfo)
- `fallbackComponent` (function): Custom fallback UI, receives (error, retry, reset)

## Error Types and Messages

The error boundary provides context-aware error messages:

- **Convex Errors**: "Unable to connect to the roadworks data service"
- **Network Errors**: "Network connection issue. Please check your internet connection"
- **Geocoding Errors**: "Location services are temporarily unavailable"
- **Permission Errors**: "You do not have permission to access this roadworks feature"
- **Default**: "The roadworks manager encountered an unexpected error"

## Implementation Details

### Error Boundary Lifecycle

1. **Error Occurs**: Component catches error in `componentDidCatch`
2. **State Update**: `getDerivedStateFromError` updates component state
3. **Fallback UI**: Error boundary renders user-friendly error interface
4. **User Actions**: User can retry, reset, or close the component
5. **Recovery**: On retry/reset, error boundary clears error state

### State Management

```javascript
state = {
  hasError: false,      // Whether error occurred
  error: null,          // The error object
  errorInfo: null,      // React error info
  retryCount: 0,        // Number of retry attempts
  isRetrying: false     // Whether currently retrying
}
```

### React Native Compatibility

- Uses only React Native compatible components (View, Text, TouchableOpacity, etc.)
- Platform-specific styling with `Platform.OS` checks
- Safe handling of `__DEV__` flag for debug information
- Proper SafeAreaView usage for mobile devices
- Responsive design that works on web and mobile

## Testing

Use the provided test component to verify error boundary functionality:

```jsx
import RoadworksErrorBoundaryTest from './components/__tests__/RoadworksErrorBoundary.test';

// Render test component to trigger and test error scenarios
<RoadworksErrorBoundaryTest />
```

## Integration Points

The error boundary is integrated at these locations:

1. **Roadworks Page** (`/app/disruptions/roadworks.jsx`)
2. **Disruption Centre** (`/app/disruption-centre/index.jsx`)

## Best Practices

1. **Wrap at Component Level**: Wrap the RoadworksManagerDashboard directly, not parent containers
2. **Provide Error Handlers**: Always provide `onError` prop for logging and analytics
3. **Set Reasonable Retry Limits**: Default of 3 retries is usually sufficient
4. **Handle Close Actions**: Implement proper cleanup in `onClose` callback
5. **Test Error Scenarios**: Use the test component to verify error handling
6. **Monitor in Production**: Track error occurrences for debugging

## Development vs Production

- **Development**: Shows detailed error information and component stack traces
- **Production**: Shows user-friendly messages only, hides technical details
- **Logging**: All errors are logged to console regardless of environment

## Troubleshooting

### Common Issues

1. **Error Boundary Not Triggering**: Ensure error occurs during render, not in event handlers
2. **Infinite Retry Loop**: Check that retry logic doesn't cause the same error repeatedly
3. **Missing Error Handler**: Provide `onError` prop to capture and log errors properly
4. **Platform Issues**: Verify all React Native components work on target platforms

### Debugging

```jsx
// Enable detailed error logging
<RoadworksErrorBoundary
  onError={(error, errorInfo) => {
    console.group('🚨 Roadworks Error');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Component Stack:', errorInfo?.componentStack);
    console.groupEnd();
  }}
>
  <RoadworksManagerDashboard />
</RoadworksErrorBoundary>
```

## Future Enhancements

- Integration with error tracking services (Sentry, Bugsnag)
- Automatic error reporting to backend
- User feedback collection on errors
- Progressive error recovery strategies
- Performance monitoring integration