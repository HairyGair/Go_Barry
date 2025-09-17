# 🔧 Troubleshooting Guide

## Common Issues and Solutions

### 0. **"Complete Assessment" Button Not Working**

**Error**: Clicking "Complete Assessment" does nothing

**Solution**:
- Make sure the wizard's onComplete handler passes two parameters:
  ```javascript
  onComplete(decision, notes)  // decision: 'STOP'|'AMBER'|'CONTINUE'
  ```
- Check that the wizard properly calculates the decision
- See ABSLightWizard.jsx for correct implementation

---

**Last Updated**: September 16, 2025

### 11. **React Dashboard Issues**

**Error**: Dashboard not loading or showing blank page

**Solution**:
- Check the route is correct: `/dashboards/breakdown` or `/dashboards/sdc`
- Verify DashboardRouter is imported in App.jsx
- Check browser console for component errors
- Make sure dashboard styles are loaded in main.jsx

**Error**: "style jsx" syntax errors

**Solution**:
- The dashboards use inline style jsx for component-scoped CSS
- If build fails, convert to CSS modules or use provided CSS files
- See `/src/dashboards/STYLE_GUIDE.md` for conversion instructions

**Error**: Dashboard data not updating

**Solution**:
- Check backend URL in environment variables
- Verify API endpoint `/api/breakdowns/live` is accessible
- Check Network tab for failed API calls
- Ensure CORS is configured on backend

**Error**: Dashboard looks broken on mobile

**Solution**:
- Dashboards are responsive by default
- Check viewport meta tag in index.html
- Clear browser cache and reload
- Test in browser mobile emulator

---

### 1. **Import Errors**

**Error**: `Cannot find module '@breakdown-guide/...'`

**Solution**:
- Check that vite.config.js has the correct aliases
- Restart the dev server after making changes
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`

---

### 2. **Tailwind Classes Not Working**

**Error**: Tailwind utility classes have no effect

**Solution**:
- Make sure PostCSS is processing the CSS files
- Check that tailwind.config.js is in the root
- Restart dev server after adding Tailwind config
- Run: `npm run dev -- --force` to clear Vite cache

---

### 3. **Icons Not Showing**

**Error**: Icons are undefined or not rendering

**Solution**:
- Import icons from the correct path:
  ```javascript
  import * as Icons from '../common/icons.js';
  const { AlertTriangle, ArrowLeft } = Icons;
  ```

---

### 4. **Fleet Modal Not Opening**

**Error**: Clicking "Select Vehicle" does nothing

**Solution**:
- Check browser console for errors
- Make sure state is updating correctly
- Verify the modal isOpen prop is true

---

### 5. **Styles Look Broken**

**Error**: Components look unstyled or broken

**Solution**:
- Make sure both CSS files are imported:
  ```javascript
  import './styles/main.css';
  import './styles/tailwind.css';
  ```
- Check that styles are not conflicting

---

### 6. **Build Fails**

**Error**: `npm run build` fails

**Solution**:
- Check for TypeScript errors (even in .js files)
- Look for missing imports
- Run: `npm run build -- --debug` for more info

---

### 7. **API Calls Failing**

**Error**: Network errors or 404s

**Solution**:
- Check .env.development has correct API URL
- Verify backend is running
- Check CORS settings on backend
- Use browser DevTools Network tab

---

### 8. **Supervisor Login Not Working**

**Error**: Can't get past login screen

**Solution**:
- NO AUTH mode should be enabled by default
- Check localStorage for old sessions
- Clear browser storage and try again

---

### 9. **Wizards Not Loading**

**Error**: Clicking wizard shows blank screen

**Solution**:
- Check that wizard component exists
- Verify wizard is mapped in wizardComponents object
- Check browser console for component errors

---

### 10. **Memory/Performance Issues**

**Error**: App becomes slow or unresponsive

**Solution**:
- Check for infinite loops in useEffect
- Verify no memory leaks in event listeners
- Use React DevTools Profiler
- Clear browser cache

---

## 🛠️ Debug Commands

```bash
# Clear all caches and reinstall
rm -rf node_modules dist
npm cache clean --force
npm install

# Run with verbose logging
npm run dev -- --debug

# Check for build issues without building
npm run build -- --mode development

# Analyze bundle size
npm run build -- --mode production
npx vite-bundle-visualizer
```

## 📞 Getting Help

If you encounter issues not covered here:

1. **Check Browser Console** - Most errors will show here
2. **Check Network Tab** - For API issues
3. **Check React DevTools** - For component state issues
4. **Review Recent Changes** - Git diff can help identify what changed

---

## 🔍 Useful Browser Extensions

- **React Developer Tools** - Debug React components
- **Redux DevTools** - If using Redux
- **Network Inspector** - Built into browser
- **Lighthouse** - Performance auditing

---

Remember: Most issues are related to imports, paths, or missing dependencies. Start there first!
