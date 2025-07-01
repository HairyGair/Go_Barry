# Fixed: Duplicate Screen Name Error

## Issue
"A navigator cannot contain multiple 'Screen' components with the same name (found duplicate screen named 'operations-centre')"

## Root Cause
We had created both:
- `/app/operations-centre/` folder (with index.jsx) 
- `/app/operations-centre.jsx` file

Expo Router was trying to register both as the same route, causing the duplicate error.

## Solution Applied

1. **Removed duplicate file**: Moved `operations-centre.jsx` to backup
2. **Simplified navigation**: 
   - Home page now navigates to `/operations`
   - `/operations` redirects to `/operations-centre/`
   - Removed complex error handling that was causing issues

3. **Cleaned up extra files**: Removed the emergency redirect page

## File Structure Now
```
app/
├── operations.jsx          # Simple redirect to operations-centre/
├── operations-centre/      # Main Operations Centre folder
│   ├── index.jsx          # Main component
│   ├── _layout.jsx        # Layout with error boundary
│   └── components/        # UI components
```

## Navigation Flow
1. User clicks Operations card → navigates to `/operations`
2. `/operations` immediately redirects → `/operations-centre/`
3. Operations Centre loads with proper layout and error handling

## Next Steps
1. Restart the development server:
   ```bash
   npm run reset
   npm start
   ```

2. Test the navigation works locally

3. If working, rebuild for production:
   ```bash
   npm run build:web:production
   ```

The duplicate screen error should now be resolved!
