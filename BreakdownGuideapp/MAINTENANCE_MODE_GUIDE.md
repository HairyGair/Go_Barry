# Maintenance Mode - Quick Guide

## Overview

The Go BARRY Breakdown Management System includes a professional maintenance page that can be activated when the system needs to be taken offline for updates, maintenance, or other reasons.

## Features

✨ **Professional Design:**
- GairWare branded with logo
- Animated background grid
- Glassmorphic cards with breathing animations
- Real-time clock display
- Responsive design (works on all devices)

🎨 **Visual Elements:**
- GairWare logo with floating animation
- Maintenance icon (wrench) with rotation effect
- Gradient title with glow animation
- Color-coded info cards
- Contact information cards

## How to Enable Maintenance Mode

### Option 1: Quick Enable (Recommended)

**On cPanel:**

1. Navigate to your site's root directory:
   ```
   ~/public_html/breakdowns.gobarry.co.uk/
   ```

2. **Rename `index.html`** to `index.html.backup`

3. **Rename `maintenance.html`** to `index.html`

4. **Done!** The maintenance page is now live.

### Option 2: Using .htaccess (Advanced)

Add this to the top of your `.htaccess` file:

```apache
# Maintenance Mode - Redirect all traffic to maintenance page
RewriteEngine On
RewriteCond %{REQUEST_URI} !^/maintenance\.html$
RewriteRule ^.*$ /maintenance.html [R=503,L]
```

**To disable:** Remove those lines from `.htaccess`

## How to Disable Maintenance Mode

### If you used Option 1:

1. **Rename `index.html`** to `maintenance.html`

2. **Rename `index.html.backup`** to `index.html`

3. **Done!** Your site is back online.

### If you used Option 2:

1. Remove the maintenance lines from `.htaccess`

2. Save the file

3. **Done!** Your site is back online.

## Customization

### Change Expected Return Time

Edit `maintenance.html` line 330:
```html
<div class="info-value">Shortly</div>
```

Change "Shortly" to your estimated time, e.g.:
- "2 hours"
- "30 minutes"
- "By 2:00 PM"

### Update Contact Information

Edit `maintenance.html` lines 347-355:
```html
<div class="contact-item">
  <span class="contact-icon">📞</span>
  <span class="contact-value">SDC Operations</span>
</div>
<div class="contact-item">
  <span class="contact-icon">👤</span>
  <span class="contact-value">Anthony Gair (AG003)</span>
</div>
```

### Change Maintenance Reason

Edit `maintenance.html` lines 318-322:
```html
<li>System updates and improvements are being applied</li>
<li>Enhanced performance optimizations</li>
<li>Security patches and bug fixes</li>
```

## File Locations

**Standalone HTML File:**
```
/frontend/public/maintenance.html
```

**React Component (for integration):**
```
/frontend/src/pages/MaintenancePage.jsx
/frontend/src/pages/MaintenancePage.css
```

## Testing Locally

1. Copy `maintenance.html` from `frontend/public/`

2. Open it in your browser

3. It will display exactly as it would in production

## Important Notes

⚠️ **Before Enabling Maintenance Mode:**
- Notify all supervisors that the system will be offline
- Schedule during low-traffic periods (e.g., late evening)
- Have a rollback plan ready

✅ **Best Practices:**
- Test the maintenance page before deploying
- Keep maintenance windows as short as possible
- Update the "Expected Return" time if delays occur
- Have backup communication channels ready (phone, radio)

## Quick Reference

| Action | File to Upload | File to Rename |
|--------|---------------|----------------|
| **Enable** | `maintenance.html` | Rename to `index.html` |
| **Disable** | `index.html.backup` | Rename to `index.html` |

## Troubleshooting

**Issue:** Maintenance page not showing
- **Solution:** Clear browser cache (Ctrl+Shift+R)
- **Check:** File is named exactly `index.html`

**Issue:** Page looks broken
- **Solution:** Re-upload `maintenance.html` - file may be corrupted

**Issue:** Can't disable maintenance mode
- **Solution:** Delete `index.html` and rename `index.html.backup`

## Support

For issues or questions:
- **Contact:** Anthony Gair (AG003)
- **Email:** anthony.gair@gonortheast.co.uk

---

**© 2025 Go North East | Powered by GairWare**
