import React from 'react';
import RoadworksErrorBoundary from './RoadworksErrorBoundary';

/**
 * Higher Order Component to wrap any component with RoadworksErrorBoundary
 * This provides a convenient way to add error boundary protection to components
 * 
 * @param {React.Component} WrappedComponent - The component to wrap with error boundary
 * @param {Object} errorBoundaryProps - Props to pass to the error boundary
 * @returns {React.Component} - Component wrapped with error boundary
 */
const withRoadworksErrorBoundary = (WrappedComponent, errorBoundaryProps = {}) => {
  const WrappedWithErrorBoundary = (props) => {
    return (
      <RoadworksErrorBoundary
        {...errorBoundaryProps}
        onError={(error, errorInfo) => {
          console.error('Error in wrapped component:', error);
          console.error('Component stack:', errorInfo?.componentStack);
          
          // Call custom error handler if provided
          if (errorBoundaryProps.onError) {
            errorBoundaryProps.onError(error, errorInfo);
          }
        }}
      >
        <WrappedComponent {...props} />
      </RoadworksErrorBoundary>
    );
  };

  // Set display name for debugging
  WrappedWithErrorBoundary.displayName = `withRoadworksErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return WrappedWithErrorBoundary;
};

export default withRoadworksErrorBoundary;

// Usage examples:
//
// 1. Wrap a component directly:
// const SafeRoadworksComponent = withRoadworksErrorBoundary(RoadworksManagerDashboard, {
//   onClose: () => console.log('Roadworks closed'),
//   maxRetries: 3
// });
//
// 2. Use as decorator (if using babel decorators):
// @withRoadworksErrorBoundary({ maxRetries: 5 })
// class MyRoadworksComponent extends React.Component { ... }
//
// 3. Wrap with custom error handling:
// const SafeComponent = withRoadworksErrorBoundary(MyComponent, {
//   onError: (error, errorInfo) => {
//     // Send to error tracking service
//     trackError(error, errorInfo);
//   },
//   fallbackComponent: (error, retry, reset) => (
//     <CustomErrorDisplay error={error} onRetry={retry} onReset={reset} />
//   )
// });