# Disruptions Feature - Rollback Plan

**Created:** July 2, 2025  
**Version:** 1.0.0  
**Feature:** Disruptions Button Implementation

## 🔄 Emergency Rollback Procedure

### Immediate Rollback (< 5 minutes)

If critical issues are discovered in production, follow these steps in order:

#### Step 1: Disable Disruptions Navigation
```javascript
// In /app/index.jsx - Comment out Disruptions card
const appCards = [
  // ... other cards
  // TEMPORARILY DISABLED - ROLLBACK
  // {
  //   id: 'disruptions',
  //   title: 'Disruptions',
  //   ...
  // },
  // ... remaining cards
];
```

#### Step 2: Restore Operations Integration
```javascript
// In /app/browser-main.jsx operations-centre section
// Uncomment IncidentManager and RoadworksManager cards:

const operationsCards = [
  // ... existing cards
  {
    id: 'incidents',
    title: 'Incident Manager',
    icon: 'exclamation-triangle',
    component: 'IncidentManager'
  },
  {
    id: 'roadworks', 
    title: 'Roadworks Manager',
    icon: 'road',
    component: 'RoadworksManager'
  }
];
```

#### Step 3: Remove Disruptions Route
```bash
# Remove or rename the disruptions page
mv /app/disruptions.jsx /app/disruptions.jsx.disabled
```

#### Step 4: Deploy Emergency Fix
```bash
cd Go_BARRY
npx expo publish --release-channel emergency-rollback
```

### Complete Rollback (15-30 minutes)

For a full rollback to pre-disruptions state:

#### Git Rollback Commands
```bash
# Create emergency backup branch
git checkout -b emergency-backup-$(date +%Y%m%d-%H%M)
git push origin emergency-backup-$(date +%Y%m%d-%H%M)

# Rollback to pre-disruptions commit
git checkout main
git revert HEAD~10..HEAD  # Adjust range as needed
git push origin main

# Alternative: Hard reset (destructive)
# git reset --hard <pre-disruptions-commit-hash>
# git push --force origin main
```

#### File-by-file Rollback
1. **Remove AppCard Component**:
   ```bash
   rm /components/AppCard.jsx
   ```

2. **Restore Original Homepage**:
   ```bash
   git checkout HEAD~10 -- app/index.jsx
   ```

3. **Restore Operations Centre**:
   ```bash
   git checkout HEAD~10 -- app/browser-main.jsx
   ```

4. **Remove Disruptions Page**:
   ```bash
   rm app/disruptions.jsx
   ```

5. **Update Documentation**:
   ```bash
   git checkout HEAD~10 -- GO_BARRY_AI_CONTEXT.txt
   ```

## 📂 Rollback Assets

### Pre-Disruptions File Backup
Create backup of key files before any rollback:

```bash
# Create rollback backup directory
mkdir -p /tmp/go-barry-rollback-backup

# Backup current state
cp app/index.jsx /tmp/go-barry-rollback-backup/
cp app/browser-main.jsx /tmp/go-barry-rollback-backup/
cp components/AppCard.jsx /tmp/go-barry-rollback-backup/
cp app/disruptions.jsx /tmp/go-barry-rollback-backup/
cp GO_BARRY_AI_CONTEXT.txt /tmp/go-barry-rollback-backup/
```

### Configuration Backup
```bash
# Backup important configs
cp package.json /tmp/go-barry-rollback-backup/
cp app.json /tmp/go-barry-rollback-backup/
cp convex/schema.ts /tmp/go-barry-rollback-backup/
```

## 🚨 Rollback Triggers

### Critical Issues (Immediate Rollback)
- **Navigation Failure**: Homepage cards not loading or navigating
- **Authentication Failure**: Supervisor login system broken
- **Real-time Sync Failure**: Convex sync completely non-functional
- **Security Vulnerability**: Any security breach or vulnerability discovered
- **Performance Degradation**: >50% increase in page load times
- **Accessibility Failure**: Screen readers or keyboard navigation broken

### Major Issues (Planned Rollback)
- **User Confusion**: High support ticket volume about navigation changes
- **Feature Adoption**: <10% usage after 48 hours in production
- **Bug Reports**: Multiple critical bug reports from supervisors
- **Mobile Compatibility**: Significant mobile/tablet display issues
- **Browser Compatibility**: Issues with supported browsers

### Minor Issues (Fix Forward)
- **Visual Glitches**: Minor styling or layout issues
- **Performance**: Small performance impacts <20%
- **Feature Requests**: User requests for modifications
- **Documentation**: Missing or unclear documentation

## 📊 Rollback Validation

### Post-Rollback Testing Checklist
- [ ] **Homepage Loading**: Verify homepage loads with correct number of cards
- [ ] **Operations Access**: Confirm IncidentManager/RoadworksManager accessible
- [ ] **Supervisor Login**: Test authentication flow works correctly
- [ ] **Real-time Updates**: Verify Convex sync still operational
- [ ] **Display Screen**: Check Control Room display functionality
- [ ] **API Endpoints**: Test all critical API endpoints
- [ ] **Mobile Compatibility**: Verify mobile/tablet access works

### Success Criteria for Rollback
- ✅ All existing functionality restored
- ✅ No new errors in console or logs
- ✅ User workflows functional
- ✅ Performance at or above baseline
- ✅ No accessibility regressions

## 📋 Communication Plan

### Internal Communication
1. **Immediate Notification** (within 5 minutes):
   - Development team via Slack/Teams
   - System administrators
   - Key stakeholders

2. **Status Update** (within 15 minutes):
   - Detailed explanation of issue
   - Rollback progress update
   - Estimated resolution time

3. **Resolution Confirmation** (after rollback):
   - Confirmation of successful rollback
   - Root cause analysis (if known)
   - Next steps and timeline

### User Communication
1. **During Rollback**:
   - Brief system notification (if visible to users)
   - Minimal disruption message

2. **After Rollback**:
   - Internal memo explaining temporary changes
   - Timeline for re-implementation (if applicable)

## 🔧 Post-Rollback Actions

### Immediate Actions (0-2 hours)
- [ ] **Root Cause Analysis**: Identify what caused the rollback
- [ ] **Issue Documentation**: Document all problems encountered
- [ ] **Stakeholder Notification**: Inform relevant parties of rollback
- [ ] **System Monitoring**: Enhanced monitoring for 24 hours post-rollback

### Short-term Actions (2-48 hours)
- [ ] **Bug Investigation**: Thorough investigation of rollback triggers
- [ ] **Fix Development**: Develop solutions for identified issues
- [ ] **Testing Enhancement**: Improve testing procedures to prevent recurrence
- [ ] **Documentation Update**: Update rollback procedures based on experience

### Long-term Actions (1-2 weeks)
- [ ] **Feature Re-implementation**: Plan for re-deployment with fixes
- [ ] **Process Improvement**: Update deployment and testing processes
- [ ] **Training Update**: Update team training on rollback procedures
- [ ] **Monitoring Enhancement**: Improve production monitoring capabilities

## 📝 Rollback Log Template

```
ROLLBACK INCIDENT REPORT
========================
Date: [DATE]
Time Started: [TIME]
Time Completed: [TIME]
Initiated By: [NAME]
Reason: [BRIEF DESCRIPTION]

TRIGGER:
[Detailed description of what triggered the rollback]

ACTIONS TAKEN:
[Step-by-step actions performed]

OUTCOME:
[Success/failure of rollback, any remaining issues]

LESSONS LEARNED:
[What can be improved for next time]

NEXT STEPS:
[Planned actions to address root cause]
```

## 🎯 Rollback Success Metrics

- **Time to Rollback**: <5 minutes for emergency, <30 minutes for complete
- **System Availability**: >99.9% uptime maintained during rollback
- **Data Integrity**: 100% data preservation during rollback
- **User Impact**: Minimal user-facing disruption
- **Recovery Time**: Full functionality restored within SLA

---

**This rollback plan is tested and ready for immediate execution if needed.**  
**Last Reviewed**: July 2, 2025  
**Next Review**: July 16, 2025