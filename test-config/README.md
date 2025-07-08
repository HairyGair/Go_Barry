# Test Configuration

This directory contains Jest configuration files for the Go BARRY project.

## Files

- `jest.config.js` - Main Jest configuration
- `jest.setup.js` - Jest setup file with global mocks and utilities

## Important Notes

These configuration files were moved from `/app/admin/` to prevent them from being bundled with the application. Test configuration files should never be placed in the `app` directory as they will be included in the application bundle.

## Running Tests

To run the admin dashboard tests:

```bash
# From the project root
npm test -- app/admin/__tests__
```

Or with a specific configuration:

```bash
# Use the test config
jest --config ./test-config/jest.config.js app/admin/__tests__
```
