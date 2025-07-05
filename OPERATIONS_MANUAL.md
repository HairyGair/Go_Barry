# Go BARRY Roadworks Manager V2 - Operations Manual
## Go North East Supervisors & Operations Team

### 📋 Quick Reference Guide

#### Daily Operations Checklist
- [ ] **06:00**: Check overnight roadwork notifications
- [ ] **06:30**: Review auto-generated Start of Service report (emailed at 00:15)
- [ ] **07:00**: Process any queued roadworks requiring review
- [ ] **Throughout day**: Monitor active roadworks for overruns
- [ ] **18:00**: Review completed roadworks and update diversions

#### Emergency Procedures
- **Critical roadwork**: Call control room, then update Go BARRY
- **System issues**: Contact tech support (anthony.gair@gobarry.co.uk)
- **Missing diversions**: Use quick-add feature, notify depot manually

---

## 🚌 For Supervisors

### Getting Started

#### Accessing Go BARRY
1. **Website**: https://gobarry.co.uk
2. **Login**: Use your supervisor badge (e.g., AG003, BP009)
3. **Password**: Your existing Go BARRY password

#### Main Dashboard
```
┌─────────────────────────────────────────┐
│ 🚧 Roadworks Manager V2                │
├─────────────────────────────────────────┤
│ [📊 Analytics] [👀 Review Queue]       │
│ [🗺️ Map View]   [📋 Active Works]      │
│ [📝 Reports]    [⚙️ Settings]          │
└─────────────────────────────────────────┘
```

### Core Functions

#### 1. Roadwork Queue Management
**Purpose**: Process new roadworks from Street Manager

```
📥 Roadwork Queue (3 new)
├─ A1 Newcastle - Lane Closure
│  Northumbrian Water | Starts: Tomorrow
│  [Review] [Quick Add] [Dismiss]
├─ Felling Bypass - Full Closure  
│  BT Openreach | Starts: Monday
│  [Review] [Quick Add] [Dismiss]
└─ Grainger Street - Utilities
   Scottish Power | Starts: Next Week
   [Review] [Quick Add] [Dismiss]
```

**Actions**:
- **Review**: Open detailed modal to add diversion details
- **Quick Add**: Add with minimal information, update later
- **Dismiss**: Remove if not affecting bus routes

#### 2. Active Roadworks Management
**Purpose**: Monitor ongoing roadworks and diversions

```
🚧 Active Roadworks (5)
├─ Newcastle City Centre - Water Main
│  Routes 1, 2, 35 diverted via Grey Street
│  Status: Active | Ends: Tomorrow
│  [Push to Display] [Update] [Complete]
├─ Team Valley - Road Resurfacing
│  Routes 93, 94 using Kingsway diversion
│  Status: Overrun ⚠️ | Ended: Yesterday
│  [Contact Promoter] [Extend] [Force Complete]
```

**Status Indicators**:
- 🟢 **Active**: Normal operation
- 🟡 **Overrun**: Past expected end date
- 🔴 **Critical**: Major service disruption
- ✅ **Completed**: Work finished

#### 3. Diversion Management
**Purpose**: Create and manage bus route diversions

**Auto-Suggest Feature**:
When adding a diversion, the system suggests:
1. **Historical**: Previous diversions at same location
2. **Geographic**: Alternative parallel routes
3. **GTFS-based**: Calculated detours using route data
4. **Pattern-based**: Similar situations elsewhere

**Creating Diversions**:
```
📍 Location: Grainger Street, Newcastle
🚌 Affected Routes: 1, 2, 35
📝 Diversion: Via Grey Street and Dean Street
⭐ Success Rating: 4.2/5 (based on previous use)
📊 Usage Count: 15 times used successfully

[Save as Template] [Apply Diversion] [Push to Display]
```

#### 4. Display Screen Integration
**Purpose**: Push critical roadworks to control room displays

**Push to Display**:
- Click **"Push to Display"** button on any active roadwork
- Appears on control room map with 🚧 icon
- Shows: Location, affected routes, diversion details
- Auto-removes when roadwork completed

### Daily Workflows

#### Morning Routine (06:00 - 08:00)
1. **Check Email**: Review Start of Service report (sent at 00:15)
2. **Review Queue**: Process any new Street Manager notifications
3. **Check Overruns**: Look for works past expected end date
4. **Update Status**: Mark any completed works from overnight

#### Throughout the Day
1. **Monitor Alerts**: Watch for new roadwork notifications
2. **Update Diversions**: Modify routes based on actual conditions
3. **Communicate**: Share information with depot staff
4. **Track Performance**: Rate diversion effectiveness

#### End of Day (17:00 - 18:00)
1. **Review Completions**: Mark finished roadworks as complete
2. **Update Templates**: Rate diversion effectiveness
3. **Plan Tomorrow**: Check upcoming works requiring preparation
4. **Handover Notes**: Brief next shift on active situations

### Key Features

#### Analytics Dashboard
**Access**: Click **📊 Analytics** on main menu

```
📈 Roadworks Analytics
├─ Overview Stats
│  • Total Roadworks: 125
│  • Active: 8
│  • With Diversions: 6
│  • Avg Duration: 5.2 days
├─ Performance Metrics
│  • Diversion Success: 87%
│  • On-time Completion: 73%
│  • Supervisor Response: 12 minutes avg
└─ Trend Analysis
   • Daily new roadworks chart
   • Completion rate trends
   • Geographic heat map
```

#### Quick Actions
- **Ctrl + N**: Create new roadwork entry
- **Ctrl + Q**: Open roadwork queue
- **Ctrl + D**: Push selected to display
- **Ctrl + R**: Refresh data

#### Mobile Access
- Responsive design works on tablets/phones
- Same login credentials
- Core functions available
- Optimized for touchscreen use

---

## 🎛️ For Control Room Staff

### Display Screen Integration

#### What You'll See
- **Map View**: 🚧 Orange icons for active roadworks
- **Information Panel**: Route diversions and estimated duration
- **Status Updates**: Real-time changes from supervisors

#### When Supervisors Push to Display
1. **Alert Sound**: Brief notification chime
2. **Map Update**: New 🚧 icon appears at roadwork location
3. **Info Panel**: Shows affected routes and diversion details
4. **Timer**: Shows expected duration remaining

#### Your Actions
- **Monitor**: Watch for service impact
- **Communicate**: Radio updates to drivers if needed
- **Feedback**: Rate diversion effectiveness (end of shift)

### Controller Review Interface
**Access**: https://gobarry.co.uk/controller-review (controller login required)

```
🎯 Controller Review Dashboard
├─ Pending Reviews (3)
│  ├─ Newcastle Diversion #247
│  │  Used 5 times | Success: 4.2/5
│  │  [Rate Effectiveness] [Add Notes]
│  └─ Gateshead Route #156
│     New diversion | Needs initial rating
│     [Review & Rate] [Mark Approved]
└─ Performance Summary
   • This week: 23 diversions reviewed
   • Average rating: 4.1/5
   • Top performing: Grey Street route
```

#### Rating Diversions
- **5 stars**: Excellent - no delays, drivers happy
- **4 stars**: Good - minor delays, mostly smooth
- **3 stars**: Average - some issues but workable
- **2 stars**: Poor - significant delays or complaints
- **1 star**: Terrible - major problems, avoid reusing

---

## 📧 Reports & Communication

### Automated Reports

#### Daily Start of Service Report
- **Sent**: Every day at 00:15
- **Recipients**: Operations team, Control room
- **Content**: Active roadworks, diversions, expected impacts
- **Format**: PDF attachment

```
GO NORTH EAST - START OF SERVICE REPORT
Date: [Current Date] - 00:15

ACTIVE ROADWORKS & DIVERSIONS
1. Gosforth High Street - Water main repair
   Services 1, 2, 35 diverted via Salters Road
   Expected duration: 3 more days

2. Team Valley Trading Estate - Road resurfacing  
   Services 93, 94 using Kingsway diversion
   Expected completion: Today 16:00
```

#### Weekly Summary Report
- **Sent**: Sunday at 08:00
- **Recipients**: Operations team, Management
- **Content**: Week's statistics, performance metrics, trends
- **Format**: PDF with charts and analysis

### Manual Reports
Generate on-demand reports from Analytics dashboard:
- **Custom date ranges**
- **Specific routes or areas**
- **Performance analysis**
- **Supervisor activity summary**

---

## 🔧 Troubleshooting

### Common Issues

#### "No new roadworks showing"
1. **Check connection**: Refresh page (Ctrl + F5)
2. **Verify Street Manager**: Webhook may be delayed
3. **Contact support**: If issue persists >1 hour

#### "Diversion suggestions not working"
1. **Location accuracy**: Ensure precise coordinates
2. **Route data**: Check affected routes are correct
3. **Try manual entry**: Add diversion details manually

#### "Can't push to display"
1. **Supervisor access**: Verify you're logged in correctly
2. **Active roadwork**: Only active works can be pushed
3. **Contact control**: Verify they can see updates

#### "Reports not received"
1. **Check spam folder**: Automated emails may be filtered
2. **Verify recipients**: Contact admin to update email list
3. **Manual generation**: Use Reports menu to generate immediately

### Getting Help

#### Technical Support
- **Email**: anthony.gair@gobarry.co.uk
- **Phone**: [Emergency contact number]
- **Response time**: <2 hours during business hours
- **Emergency**: <30 minutes for critical issues

#### Training & Questions
- **Operations team**: operations@gonortheast.co.uk
- **User guides**: Available in Go BARRY help section
- **Video tutorials**: Planned for Phase 4 rollout

---

## 📊 Performance Metrics

### Key Performance Indicators

#### For Supervisors
- **Response time**: <15 minutes to process new roadworks
- **Accuracy**: >95% of diversions marked as effective
- **Completeness**: All roadworks have diversion details
- **Communication**: Display screen updated within 5 minutes

#### For Operations
- **Service reliability**: <5% delay increase during diversions
- **Customer satisfaction**: Monitor complaints related to roadworks
- **Cost efficiency**: Reduced manual coordination time
- **Compliance**: 100% roadworks logged and tracked

### Monthly Review Process
1. **Metrics analysis**: Review performance dashboard
2. **Template optimization**: Update successful diversion routes
3. **Training needs**: Identify supervisor skill gaps
4. **System improvements**: Suggest feature enhancements

---

## 🔐 Security & Access

### User Roles & Permissions

#### Supervisors (AG003, BP009, etc.)
- ✅ View roadworks queue and active works
- ✅ Create and modify diversions
- ✅ Push to display screen
- ✅ Generate reports
- ❌ Admin functions (user management, system config)

#### Controllers (CTRL001, CTRL002, etc.)
- ✅ View display screen integration
- ✅ Rate diversion effectiveness
- ✅ Access controller review interface
- ❌ Create/modify roadworks
- ❌ Admin functions

#### Admins (AG003, BP009 only)
- ✅ All supervisor functions
- ✅ View audit logs
- ✅ Manage diversion templates
- ✅ System configuration
- ✅ User access management

### Data Protection
- **Audit trail**: All actions logged with timestamp and user
- **Secure access**: HTTPS encryption for all communications
- **Regular backups**: Database backed up every 6 hours
- **Compliance**: GDPR compliant data handling

---

## 🚀 Future Enhancements

### Phase 4 (Q2 2025)
- **Enhanced map integration**: Interactive roadwork pins
- **Mobile app**: Dedicated supervisor mobile application
- **AI predictions**: Predict likely overruns and service impact
- **Integration hub**: Direct council system connections

### Phase 5 (Q3 2025)
- **Public API**: Share appropriate data with partners
- **Advanced analytics**: Machine learning for optimization
- **Voice integration**: Voice-activated roadwork updates
- **Passenger information**: Real-time updates for customers

---

## 📞 Emergency Contacts

### Critical Issues (System Down)
- **Technical Emergency**: anthony.gair@gobarry.co.uk
- **Operations Fallback**: Use existing manual processes
- **Management Escalation**: [Management contact]

### Non-Critical Support
- **Feature requests**: Submit via Go BARRY feedback form
- **Training questions**: operations@gonortheast.co.uk
- **Data questions**: Check with supervisor team lead

---

**Last Updated**: July 2025  
**Version**: Roadworks Manager V2.0  
**Contact**: anthony.gair@gobarry.co.uk  
**Emergency Support**: Available 24/7 for first 30 days post-deployment