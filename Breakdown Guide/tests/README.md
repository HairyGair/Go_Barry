# Breakdown Guide Testing Framework

## Overview

This testing framework provides comprehensive test coverage for the Go North East Breakdown Guide application. It includes automated tests for functionality, navigation, data persistence, error handling, and browser compatibility.

## Running Tests

### Browser-based Test Runner

1. Open `/tests/index.html` in a web browser
2. Click "Run All Tests" to execute the complete test suite
3. Or select specific tests and click "Run Selected"

### Command Line (Future Enhancement)

```bash
npm test
```

## Test Categories

### 1. ABS Light Tests (`abs-light-tests.js`)
- Complete flow testing for Amber and Red ABS scenarios
- Navigation and back button functionality
- Progress bar updates
- Data persistence
- Safety confirmation requirements

### 2. Navigation Tests (`navigation-tests.js`)
- Screen transitions
- Breadcrumb updates
- State preservation
- Exit confirmations
- Keyboard navigation support

### 3. Data Persistence Tests (`data-persistence-tests.js`)
- Session creation and storage
- Auto-save functionality
- Session recovery after refresh
- 30-day data expiry
- Export functionality
- Storage limit handling

### 4. Error Handling Tests (`error-handling-tests.js`)
- Invalid input handling
- Offline functionality
- Missing data scenarios
- Concurrent session handling
- Edge cases and boundary conditions

### 5. Browser Compatibility Tests (`browser-compatibility-tests.js`)
- Chrome, Firefox, Edge compatibility
- Mobile browser detection
- CSS feature support
- JavaScript API availability
- Responsive design validation

## Test Structure

Each test follows this pattern:

```javascript
testRunner.addTest(
    'Test Name',
    'Test description',
    async () => {
        // Test implementation
        // Uses assert helpers and utility functions
    }
);
```

## Assert Helpers

- `assert.isTrue(condition, message)` - Check if condition is true
- `assert.equals(actual, expected, message)` - Check if values are equal
- `assert.exists(selector, message)` - Check if element exists
- `assert.isVisible(selector, message)` - Check if element is visible
- `assert.containsText(selector, text, message)` - Check element text
- `assert.hasClass(selector, className, message)` - Check element class
- `assert.arrayLength(array, length, message)` - Check array length

## Utility Functions

- `utils.waitForElement(selector, timeout)` - Wait for element to appear
- `utils.waitFor(condition, timeout)` - Wait for condition to be true
- `utils.wait(ms)` - Simple delay
- `utils.click(selector)` - Simulate click
- `utils.typeText(selector, text)` - Simulate typing
- `utils.getText(selector)` - Get element text
- `utils.checkStorage(key, expectedValue)` - Check localStorage

## Writing New Tests

1. Create a new file in `/tests/scenarios/`
2. Add tests using the `testRunner.addTest()` method
3. Include the script in `/tests/index.html`
4. Follow existing patterns for consistency

Example:

```javascript
testRunner.addTest(
    'My New Test',
    'Tests a specific feature',
    async () => {
        // Arrange
        await testRunner.utils.click('#startButton');
        
        // Act
        await testRunner.utils.waitForElement('.result');
        
        // Assert
        testRunner.assert.containsText('.result', 'Expected text');
    }
);
```

## Test Results

The test runner provides:
- Real-time test execution status
- Pass/fail indicators
- Execution time for each test
- Error messages for failed tests
- Summary statistics
- Console output capture

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Reset state between tests when needed
3. **Descriptive Names**: Use clear, descriptive test names
4. **Single Responsibility**: Test one thing per test
5. **Meaningful Assertions**: Use specific error messages
6. **Async Handling**: Use async/await for asynchronous operations

## Continuous Integration (Future)

Tests can be integrated with CI/CD pipelines using headless browser testing:

```yaml
# Example GitHub Actions configuration
- name: Run Tests
  run: |
    npm install
    npm test
```

## Troubleshooting

### Tests Timing Out
- Increase timeout values in `waitForElement` calls
- Check for missing elements or incorrect selectors

### Intermittent Failures
- Add explicit waits for animations/transitions
- Ensure proper state cleanup between tests

### Browser-Specific Issues
- Use feature detection instead of browser detection
- Test in multiple browsers during development

## Coverage Goals

Target coverage metrics:
- **Functionality**: 100% of critical paths
- **UI Interactions**: 95% of user interactions
- **Error Handling**: 90% of error scenarios
- **Browser Support**: Chrome, Firefox, Edge (latest 2 versions)

## Future Enhancements

1. Integration with test coverage tools
2. Visual regression testing
3. Performance benchmarking
4. Accessibility testing
5. Mobile device emulation
6. API mocking capabilities