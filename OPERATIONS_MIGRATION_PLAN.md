# Operations Centre Migration Plan
## Go BARRY - Reorganisation & Redesign Strategy

### 🎯 Objectives
1. Create a standalone Operations Centre accessible directly via the home page, with intuitive navigation and role-specific access
2. Implement consistent UK English spelling throughout
3. Modernise the visual design for better usability
4. Reorganise file structure for clarity
5. Ensure seamless integration with existing authentication

---

## 📁 File Structure Reorganisation

### Current Structure
The current layout lacks modular clarity and mixes concerns across directories.
```
/Go_BARRY/
├── app/
│   ├── operations.jsx (US spelling)
│   └── browser-main.jsx (contains old references)
└── components/
    ├── DutyBoards.jsx
    ├── IncidentManager.jsx
    ├── RoadworksManager.jsx
    └── AIDisruptionManager.jsx
```

### Proposed Structure
This restructured layout isolates all operations-related components, supports scalability, and aligns with modern architectural standards.
```
/Go_BARRY/
├── app/
│   ├── operations-centre.jsx (renamed)
│   └── browser-main.jsx (cleaned)
└── components/
    └── operations/  (NEW FOLDER)
        ├── DutyBoards.jsx
        ├── IncidentManager.jsx
        ├── RoadworksManager.jsx
        ├── DisruptionDatabase.jsx
        ├── OperationsHeader.jsx (NEW)
        ├── OperationsNavigation.jsx (NEW)
        └── styles/
            └── operations.styles.js (NEW)
```

---

## 🇬🇧 UK English Updates

### Files to Rename
- `operations.jsx` → `operations-centre.jsx`
- Update all references from "Center" to "Centre"
- Update "color" to "colour" in UI text (keep 'color' in code)

### Text Updates
- "Operations Center" → "Operations Centre"
- "Message Distribution Center" → "Message Distribution Centre"
- "Traffic Control Center" → "Traffic Control Centre"
- "color-coded" → "colour-coded"
- "organize" → "organise"
- "optimize" → "optimise"
- Ensure form labels, tooltips, and modal texts also reflect British spelling.
- Review date formats to ensure consistency (DD/MM/YYYY).

---

## 🎨 Visual Design Redesign

### Current Design Issues
1. Basic tab navigation
2. Generic styling
3. No visual hierarchy
4. Limited branding

### New Design Concepts

#### 1. Modern Dashboard Layout
```
┌─────────────────────────────────────────────────────┐
│ 🚦 Operations Centre         [User] [Notifications] │
├─────────────────────────────────────────────────────┤
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                   │
│ │Duty │ │Incidents│ │Roadworks│ │Disruptions│   Quick Stats     │
│ └─────┘ └─────┘ └─────┘ └─────┘   ───────────     │
│                                     15 Active       │
│                                     3 Critical      │
├─────────────────────────────────────────────────────┤
│                                                     │
│              [Active Component View]                │
│                                                     │
└─────────────────────────────────────────────────────┘
```

#### 2. Colour Scheme (Go North East Brand)
- Primary: #E31E24 (Go North East Red)
- Secondary: #059669 (Operations Green)
- Accent: #06B6D4 (Info Blue)
- Warning: #F59E0B (Alert Amber)
- Background: #0F172A (Dark Mode)
- Surface: #1E293B
- Text: #F8FAFC

#### 3. Component Styling
- Card-based layout with glassmorphism effect
- Smooth transitions between tabs
- Live status indicators
- Responsive grid system
- Animated data updates
- Introduce hover and focus states for accessibility
- Ensure tab order is logical and compatible with screen readers

---

## 🔧 Implementation Steps

### Phase 1: File Migration (Day 1)
1. Create `/components/operations/` directory
   - Responsible: Frontend Dev Team
2. Move the following files into the new directory:
   - DutyBoards.jsx
   - IncidentManager.jsx
   - RoadworksManager.jsx
   - AIDisruptionManager.jsx → Rename to DisruptionDatabase.jsx
   - Responsible: Frontend Dev Team
3. Add two new files:
   - OperationsHeader.jsx (create a component for dashboard branding and user identity)
   - OperationsNavigation.jsx (create a dynamic tab system using routing logic)
   - Responsible: UI Component Team
4. Rename `operations.jsx` to `operations-centre.jsx`
   - Update references in all import paths (e.g., `browser-main.jsx`)
5. Confirm no broken imports exist across the project
6. Conduct peer review before proceeding

### Phase 2: UK English Updates (Day 1)
1. Run a global search/replace for US to UK terms in:
   - Component files
   - Navigation elements
   - Modal content and form labels
   - Responsible: QA/Content Team
2. Check all UI elements for British spelling (colour, centre, etc.)
3. Review and correct all date format usage to DD/MM/YYYY
4. Perform QA pass to identify inconsistencies

### Phase 3: Visual Redesign (Day 2–3)
1. Build reusable design tokens (spacing, typography, palette) in `operations.styles.js`
   - Responsible: Frontend Styling Lead
2. Design and implement new header with user info and notification area
3. Create and link OperationsNavigation with active tab states and keyboard accessibility
4. Replace existing visual layout with card-based design and modern grid
5. Implement animated transitions using React libraries (e.g., Framer Motion)
6. Apply dark mode toggle with persistent user preference storage
7. Conduct mid-phase review with stakeholders for visual approval

### Phase 4: Enhanced Features (Day 4)
1. Develop Real-Time Statistics panel using live API data feeds
2. Add Notification System:
   - Show alerts for: new incidents, task assignments, overdue items
   - Use local toast system for short alerts and modal for critical ones
3. Build Quick Actions bar with links to most-used functions
4. Integrate keyboard shortcuts (documented for user training)
5. Add CSV export functionality to Roadworks and Incidents tables

### Phase 5: Testing & Polish (Day 5)
1. Conduct cross-browser compatibility tests (Chrome, Edge, Safari, Firefox)
2. Optimise load time and verify animation performance (target 60fps)
3. Run accessibility audit using axe or Lighthouse
4. Solicit structured feedback from 3 supervisors using real-world scenarios
5. Document any fixes and update changelog
6. Final sign-off before go-live

---

## 💡 New Features to Add

### Operations Dashboard
- Live incident counter
- Active roadworks map
- Duty coverage indicator
- Recent activity feed

### Quick Actions Bar
- Create new incident
- Report roadwork
- Export daily report
- Emergency broadcast

### Smart Filters
- By severity
- By location
- By time range
- By assigned supervisor

---

## 🚀 Migration Checklist

### Pre-Migration
- [ ] Backup current operations.jsx
- [ ] Document current functionality
- [ ] Create new folder structure
- [ ] Set up git branch

### During Migration
- [ ] Move components to operations/ folder
- [ ] Update all import statements
- [ ] Implement UK spelling changes
- [ ] Create new style system
- [ ] Build new UI components

### Post-Migration
- [ ] Test all functionality
- [ ] Update documentation
- [ ] Train supervisors on new UI
- [ ] Monitor performance
- [ ] Gather feedback

---

## 📊 Success Metrics

1. **Performance**
   - Page load < 2 seconds
   - Smooth 60fps animations
   - Memory usage < 100MB

2. **Usability**
   - 90% task completion rate
   - ≤ 3 clicks to reach any core function from the homepage
   - Positive supervisor feedback

3. **Reliability**
   - Zero critical bugs
   - 99.9% uptime
   - Graceful error handling

---

## 🔐 Security Considerations

1. Maintain existing authentication
2. Audit trail for all actions
3. Role-based permissions
4. Secure data transmission
5. Session management
6. Validate all inputs to prevent injection attacks
7. Regular dependency checks for known vulnerabilities

---

## 📅 Timeline

**Week 1**
- Mon-Tue: File migration & UK updates
- Wed-Thu: Visual redesign implementation
- Fri: Feature enhancements

**Week 2**
- Mon-Tue: Full regression testing and load testing
- Wed: Supervisor and stakeholder training session (recorded)
- Thu-Fri: Go-live, monitoring, and rollback contingency testing

---

## 🎯 Final Deliverables

1. **Reorganised File Structure**
   - Clean component organisation
   - Consistent naming conventions
   - Modular architecture

2. **Modern UI/UX**
   - Professional appearance
   - Intuitive navigation
   - Responsive design

3. **Enhanced Functionality**
   - Real-time updates
   - Better performance
   - Improved workflows

4. **Documentation**
   - Updated user guide
   - Technical documentation
   - Training materials
   - Migration changelog and commit history log

---

## 📝 Notes

- Keep backward compatibility during migration
- Ensure no data loss during transition
- Maintain audit trail continuity
- Consider phased rollout if needed
- Have rollback plan ready

---

*Document prepared by: Anthony Gair*  
*Date: 30/06/2025*  
*Version: 1.0*
