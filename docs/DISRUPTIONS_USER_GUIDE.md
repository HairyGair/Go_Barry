# Go BARRY - Disruptions Management User Guide

**Version:** 1.0  
**Created:** July 2, 2025  
**Last Updated:** July 2, 2025

## 📍 Quick Start Guide

### Accessing Disruptions Management
1. **From Homepage**: Click the orange "Disruptions" card with traffic cone icon
2. **Keyboard Access**: Tab to the Disruptions card, press Enter to open
3. **Direct URL**: Navigate to `/disruptions` in your browser
4. **Login Required**: You must be logged in as a supervisor to access this feature

### Main Features
- **Incident Management**: Create and track traffic incidents with intelligent route matching
- **Roadworks Management**: Manage roadworks and diversions with automated notifications
- **Real-time Updates**: All changes sync instantly across all screens via Convex
- **Supervisor Actions**: Full audit trail of all supervisor interactions

---

## 🚦 Incidents Management

### Creating New Incidents
1. Navigate to Disruptions → **Incidents** tab
2. Click **"Create New Incident"** button
3. Fill in incident details:
   - **Location**: Specific address or road description
   - **Severity**: Critical, High, Medium, or Low
   - **Description**: Detailed incident description
   - **Affected Routes**: System will suggest Go North East routes
4. Click **"Create Incident"** to save

### Managing Existing Incidents
- **View All**: Incidents display in chronological order
- **Update Status**: Click incident to change status (Active → Resolved → Closed)
- **Add Notes**: Add supervisor comments and updates
- **Route Matching**: System automatically identifies affected bus routes
- **Real-time Sync**: Changes appear instantly on Control Room display

### Incident Features
- **GTFS Route Matching**: 80-90% accurate automatic route detection
- **Severity Prediction**: AI-powered severity assessment
- **Supervisor Audit**: Full tracking of who created/modified incidents
- **Auto-expiration**: Incidents automatically expire after 2-8 hours

---

## 🚧 Roadworks Management

### Creating New Roadworks
1. Navigate to Disruptions → **Roadworks** tab  
2. Click **"Create New Roadwork"** button
3. Complete roadwork form:
   - **Location**: Specific street/junction details
   - **Start/End Dates**: Project timeline
   - **Priority Level**: Critical, High, Medium, Low, or Planned
   - **Route Impact**: Affected bus routes and diversions
   - **Email Notifications**: Select notification groups

### Roadwork Status Workflow
1. **Reported** → Initial roadwork submission
2. **Assessing** → Under review by traffic control
3. **Planning** → Diversion plans being created
4. **Active** → Roadwork is live and affecting routes
5. **Completed** → Roadwork finished and routes restored

### Email Integration
- **Microsoft 365**: Connect your official email account
- **Notification Groups**: Send alerts to Traffic Control, Drivers, Control Room
- **Automatic Alerts**: System sends notifications on status changes
- **Custom Messages**: Add specific details for each notification

---

## ⌨️ Keyboard Navigation

### Homepage Navigation
- **Tab**: Move between app cards
- **Enter/Space**: Open selected application
- **Shift+Tab**: Move backwards through cards

### Disruptions Page Navigation
- **Tab**: Navigate between tabs and interactive elements
- **Enter/Space**: Activate buttons and select items
- **Arrow Keys**: Navigate within tab controls
- **Escape**: Return focus to previous element

### Accessibility Features
- **Screen Reader Support**: Full NVDA/JAWS/VoiceOver compatibility
- **High Contrast**: Optimized for high contrast display modes
- **ARIA Labels**: Comprehensive accessibility labeling
- **Focus Indicators**: Clear visual focus indicators throughout

---

## 🔧 Troubleshooting

### Common Issues

#### "Not Logged In" Error
- **Solution**: Return to homepage and log in with supervisor badge number
- **Example**: Enter "AG003" for Anthony Gair, "BP009" for Barry Perryman
- **Session**: Login persists for 10 minutes of inactivity

#### Disruptions Page Not Loading
- **Check**: Ensure backend is running at go-barry.onrender.com
- **Refresh**: Try refreshing the page (Ctrl+R or Cmd+R)
- **Contact**: Report persistent issues to development team

#### Real-time Updates Not Working
- **Convex Status**: Check if Convex sync is operational
- **Network**: Verify internet connection is stable
- **Multiple Tabs**: Close other Go BARRY tabs to reduce conflicts

#### Email Notifications Not Sending
- **Microsoft 365**: Ensure you're logged into your official Go North East account
- **Groups**: Verify email groups are properly configured
- **Status**: Check notification status in roadwork details

### Performance Tips
- **Browser**: Use Chrome, Firefox, Safari, or Edge for best performance
- **Memory**: Close unused tabs to optimize memory usage
- **Updates**: Keep browser updated for latest features

---

## 📊 Advanced Features

### Cross-Screen Synchronization
- **Real-time**: All supervisor actions sync instantly between screens
- **Multi-user**: Multiple supervisors can work simultaneously
- **Display Integration**: Incidents appear on Control Room display automatically
- **Session Tracking**: See which supervisors are currently logged in

### Data Integration
- **TomTom Traffic**: Live traffic data integration
- **National Highways**: Official UK roadworks data
- **GTFS Matching**: Intelligent route matching with 231 Go North East routes
- **Convex Sync**: Cloud-based real-time synchronization

### Audit Trail Features
- **Action Logging**: Every supervisor action is recorded with timestamp
- **Attribution**: Track which supervisor created/modified each item
- **History**: View complete history of incidents and roadworks
- **Compliance**: Full audit trail for operational reporting

---

## 📞 Support & Training

### Getting Help
- **Training Materials**: Available in Supervisor Control → Training & Help
- **Documentation**: Complete system documentation in admin panel
- **Support Contact**: Report issues via System Health → Report Issue
- **Emergency**: For critical system issues, contact IT support immediately

### Best Practices
- **Regular Updates**: Check for new incidents every 30 minutes
- **Accurate Descriptions**: Provide detailed incident descriptions for better route matching
- **Timely Closure**: Close resolved incidents promptly to maintain data accuracy
- **Collaboration**: Coordinate with other supervisors to avoid duplicate entries

### Training Schedule
- **New Supervisors**: Complete orientation includes 30-minute Disruptions training
- **Refresher Training**: Quarterly updates on new features and best practices
- **Advanced Features**: Optional training on email integration and advanced reporting

---

## 🔄 What's Changed from Operations Centre

### Before (Operations Centre)
- Incident/Roadworks management was buried in Operations menu
- Required navigation through multiple screens
- Limited accessibility features
- Mixed with other operational tools

### After (Disruptions App)
- **Dedicated App**: Disruptions has its own homepage card
- **Tab Navigation**: Easy switching between Incidents and Roadworks
- **Better Organization**: Focused specifically on disruption management
- **Enhanced UX**: Improved user interface with better accessibility
- **Real-time Focus**: Optimized for rapid incident response

### Migration Notes
- **Same Functionality**: All previous features are preserved
- **Improved Performance**: Faster loading with lazy loading
- **Better Accessibility**: Full WCAG 2.1 AA compliance
- **Enhanced Mobile**: Improved mobile/tablet experience

---

## 📈 System Requirements

### Browser Compatibility
- **Chrome**: Version 90+ (Recommended)
- **Firefox**: Version 88+
- **Safari**: Version 14+
- **Edge**: Version 90+

### Network Requirements
- **Internet**: Stable broadband connection required
- **Real-time**: WebSocket/Convex connection for live updates
- **Backup**: System works offline with cached data

### Device Compatibility
- **Desktop**: Windows, macOS, Linux
- **Tablet**: iPad, Android tablets (10"+ recommended)
- **Mobile**: iPhone, Android phones (portrait mode)

---

## 📝 Feedback & Improvements

We're constantly improving Go BARRY based on supervisor feedback. To suggest improvements:

1. **In-App Feedback**: Use the feedback option in System Health
2. **Email Suggestions**: Contact the development team
3. **Training Sessions**: Provide feedback during quarterly training
4. **Emergency Issues**: Report critical problems immediately

**Next Planned Features:**
- Automated incident detection from traffic APIs
- Enhanced mobile interface
- Voice-to-text incident reporting
- Advanced analytics and reporting

---

*This guide is part of the Go BARRY traffic intelligence platform. For technical support or additional training, contact your system administrator.*