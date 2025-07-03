# Communications Platform - Component Wireframes
**Based on Admin Dashboard & Operations Screen UI patterns**
**Date**: July 2, 2025

## Layout Overview
```
┌─────────────────────────────────────────────────────────────┐
│  COMMUNICATIONS HUB                              [X] [-] [□] │
├─────────────────────────────────────────────────────────────┤
│  🗣️ Communications Platform                                  │
│  Unified messaging and communication tools                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │  TICKETER   │ │    EMAIL    │ │  8x8 VOIP   │          │
│  │     🚌      │ │     ✉️      │ │     📞      │          │
│  │             │ │             │ │             │          │
│  │ Send Driver │ │ Quick Email │ │ Make Call   │          │
│  │  Messages   │ │   Compose   │ │  Directory  │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
│                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │ SHAREPOINT  │ │  MESSAGES   │ │   REPORTS   │          │
│  │     📁      │ │     💬      │ │     📊      │          │
│  │             │ │             │ │             │          │
│  │  Documents  │ │Distribution │ │  Automated  │          │
│  │   & Files   │ │   Center    │ │   Reports   │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. Ticketer Component (Driver Messaging)
```
┌─────────────────────────────────────────────────────────────┐
│  [← Back]  Ticketer - Driver Messaging          Barry P.    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────┐           │
│  │  Quick Message to Drivers                    │           │
│  ├─────────────────────────────────────────────┤           │
│  │                                             │           │
│  │  Select Routes:                             │           │
│  │  [✓] 21   [✓] X21  [ ] 56   [ ] Q3        │           │
│  │  [Select All] [Clear All]                   │           │
│  │                                             │           │
│  │  Message Type:                              │           │
│  │  (•) Service Update  ( ) Diversion          │           │
│  │  ( ) General Info    ( ) Emergency          │           │
│  │                                             │           │
│  │  Message:                                   │           │
│  │  ┌─────────────────────────────────────┐   │           │
│  │  │                                     │   │           │
│  │  │  Type your message here...          │   │           │
│  │  │                                     │   │           │
│  │  └─────────────────────────────────────┘   │           │
│  │  [0/140 characters]                        │           │
│  │                                             │           │
│  │  [💾 Save as Template]  [📤 Send Message]  │           │
│  └─────────────────────────────────────────────┘           │
│                                                             │
│  Recent Messages                                            │
│  ┌─────────────────────────────────────────────┐           │
│  │ • 10:45 - Route 21: Diversion via Queen St │           │
│  │ • 09:30 - All Routes: Weather warning       │           │
│  │ • 08:15 - Route X21: Delays expected        │           │
│  └─────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Email Integration (Outlook Web Access)
```
┌─────────────────────────────────────────────────────────────┐
│  [← Back]  Email - Outlook Integration          Barry P.    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Quick Actions:                                             │
│  [📧 New Email] [📋 Templates] [👥 Contacts] [📥 Inbox]    │
│                                                             │
│  ┌─────────────────────────────────────────────┐           │
│  │  Outlook Web Access                         │           │
│  │  ┌───────────────────────────────────────┐ │           │
│  │  │ To: [supervisors@gonortheast.co.uk ▼] │ │           │
│  │  │ Subject: [                          ] │ │           │
│  │  ├───────────────────────────────────────┤ │           │
│  │  │                                       │ │           │
│  │  │  [Outlook interface embedded here]    │ │           │
│  │  │                                       │ │           │
│  │  │                                       │ │           │
│  │  │                                       │ │           │
│  │  │                                       │ │           │
│  │  └───────────────────────────────────────┘ │           │
│  └─────────────────────────────────────────────┘           │
│                                                             │
│  Quick Templates:                                           │
│  [🚧 Incident Report] [⚠️ Service Alert] [📊 Daily Report]  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. 8x8 VoIP Integration
```
┌─────────────────────────────────────────────────────────────┐
│  [← Back]  8x8 Phone System                     Barry P.    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────┬─────────────────────┐         │
│  │  Quick Dial              │  8x8 Web Client    │         │
│  ├─────────────────────────┼─────────────────────┤         │
│  │                         │                     │         │
│  │  [🚨 999 Emergency]     │  ┌───────────────┐ │         │
│  │                         │  │               │ │         │
│  │  Frequently Called:     │  │  8x8 Phone    │ │         │
│  │  ┌─────────────────┐    │  │  Interface    │ │         │
│  │  │ Control Room    │    │  │               │ │         │
│  │  │ 0191 XXX XXXX  │    │  │  [Embedded]   │ │         │
│  │  └─────────────────┘    │  │               │ │         │
│  │  ┌─────────────────┐    │  │               │ │         │
│  │  │ Newcastle Depot │    │  │               │ │         │
│  │  │ 0191 XXX XXXX  │    │  └───────────────┘ │         │
│  │  └─────────────────┘    │                     │         │
│  │  ┌─────────────────┐    │  Call History:     │         │
│  │  │ On-Call Super   │    │  • 14:23 Control   │         │
│  │  │ 07XXX XXXXXX   │    │  • 13:45 Depot     │         │
│  │  └─────────────────┘    │  • 12:30 Barry P   │         │
│  │                         │                     │         │
│  └─────────────────────────┴─────────────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. SharePoint Integration
```
┌─────────────────────────────────────────────────────────────┐
│  [← Back]  SharePoint - Documents               Barry P.    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Quick Access:                                              │
│  [📄 Upload] [🔍 Search] [📁 My Recent] [⭐ Favorites]      │
│                                                             │
│  ┌─────────────────────────────────────────────┐           │
│  │  📁 Operations                               │           │
│  │  └── 📁 Procedures                          │           │
│  │      ├── 📄 Daily_Handover_Template.docx    │           │
│  │      ├── 📄 Incident_Response_Guide.pdf     │           │
│  │      └── 📄 Route_Diversion_Process.docx    │           │
│  │  └── 📁 Reports                             │           │
│  │      ├── 📄 2025-07-02_Morning_Report.pdf   │           │
│  │      └── 📄 2025-07-01_Incident_Log.xlsx    │           │
│  │                                             │           │
│  │  📁 Communications                           │           │
│  │  └── 📁 Templates                           │           │
│  │      ├── 📄 Service_Alert_Template.msg      │           │
│  │      └── 📄 Customer_Notice_Template.docx   │           │
│  └─────────────────────────────────────────────┘           │
│                                                             │
│  Recent Activity:                                           │
│  • Barry P uploaded "Morning_Handover.docx" 2 mins ago     │
│  • Alex W modified "Route_21_Diversion.pdf" 15 mins ago    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Enhanced Message Distribution
```
┌─────────────────────────────────────────────────────────────┐
│  [← Back]  Message Distribution Center          Barry P.    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Active Channels:                                           │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐                │
│  │    ✅     │ │    ✅     │ │    ❌     │                │
│  │ Ticketer  │ │   Email   │ │    SMS    │                │
│  │ Available │ │ Available │ │  Offline  │                │
│  └───────────┘ └───────────┘ └───────────┘                │
│                                                             │
│  Compose Multi-Channel Message:                             │
│  ┌─────────────────────────────────────────────┐           │
│  │ Recipients:                                 │           │
│  │ [✓] All Drivers (Ticketer)                │           │
│  │ [✓] Supervisors (Email)                   │           │
│  │ [ ] Control Room (Email)                  │           │
│  │                                           │           │
│  │ Message:                                  │           │
│  │ ┌───────────────────────────────────┐     │           │
│  │ │                                   │     │           │
│  │ │ Type unified message here...      │     │           │
│  │ │                                   │     │           │
│  │ └───────────────────────────────────┘     │           │
│  │                                           │           │
│  │ [Use Template ▼] [Schedule ⏰] [Send Now] │           │
│  └─────────────────────────────────────────────┘           │
│                                                             │
│  Message History:                                           │
│  ┌─────────────────────────────────────────────┐           │
│  │ Time  | Channels | Message          | Status│           │
│  │ 10:45 | T,E      | Route 21 delay   | ✅ Sent│          │
│  │ 09:30 | E        | Weather warning  | ✅ Sent│          │
│  └─────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Enhanced Automated Reports
```
┌─────────────────────────────────────────────────────────────┐
│  [← Back]  Automated Reports                    Barry P.    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Report Schedule:                                           │
│  ┌─────────────────────────────────────────────┐           │
│  │ Report Type        | Schedule    | Status   │           │
│  │ Start of Service   | Daily 00:15 | ✅ Active│           │
│  │ Alert Summary      | Daily 23:30 | ✅ Active│           │
│  │ Performance Report | Weekly Mon  | ✅ Active│           │
│  │ Incident Report    | On-demand   | Ready    │           │
│  └─────────────────────────────────────────────┘           │
│                                                             │
│  Quick Actions:                                             │
│  [📊 Generate Report] [📅 Edit Schedule] [📧 Recipients]    │
│                                                             │
│  Recent Reports:                                            │
│  ┌─────────────────────────────────────────────┐           │
│  │ 📄 Start of Service - July 2, 2025           │           │
│  │    Generated: 00:15 | Size: 245KB           │           │
│  │    Recipients: 8 | Status: ✅ Sent          │           │
│  │    [📥 Download] [📧 Resend] [👁️ Preview]   │           │
│  ├─────────────────────────────────────────────┤           │
│  │ 📄 Alert Summary - July 1, 2025              │           │
│  │    Generated: 23:30 | Size: 189KB           │           │
│  │    Recipients: 12 | Status: ✅ Sent         │           │
│  │    [📥 Download] [📧 Resend] [👁️ Preview]   │           │
│  └─────────────────────────────────────────────┘           │
│                                                             │
│  System Stats:                                              │
│  Reports Generated: 156 | Success Rate: 99.2%              │
│  Next Scheduled: Alert Summary at 23:30                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Design Specifications

### Color Usage (Matching Admin Dashboard)
- **Headers**: White (#FFFFFF) with light gray border (#E5E7EB)
- **Backgrounds**: Light gray (#F8FAFC) for main, white for sections
- **Cards**: Very light gray (#F9FAFB) with 1px border
- **Primary Actions**: Blue (#3B82F6)
- **Success**: Green (#10B981)
- **Warning**: Orange (#F59E0B)
- **Error**: Red (#EF4444)

### Typography
- **Page Title**: 24px bold
- **Section Headers**: 18px semibold
- **Body Text**: 14px regular
- **Small Text**: 12px regular
- **All text**: System font stack

### Spacing & Layout
- **Page Padding**: 20px
- **Section Spacing**: 16px
- **Card Padding**: 16px
- **Element Spacing**: 12px
- **Border Radius**: 10px for cards, 8px for buttons

### Interactive Elements
- **Buttons**: 14px semibold text, 8px vertical / 16px horizontal padding
- **Inputs**: 14px text, 8px vertical / 12px horizontal padding
- **Cards**: Subtle shadow on hover
- **Links**: Blue color, underline on hover

### Component-Specific Colors
- **Ticketer**: Blue (#3B82F6)
- **Email**: Green (#10B981)
- **VoIP**: Purple (#7C3AED)
- **SharePoint**: Teal (#059669)
- **Messages**: Purple (#8B5CF6)
- **Reports**: Orange (#F59E0B)