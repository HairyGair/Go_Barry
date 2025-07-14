# SDC Guide Wizard Enhancement - Implementation Guide

## PROJECT CONTEXT
Building comprehensive interactive diagnostic wizards for Go BARRY's bus breakdown guide system. Current basic wizards need enhancement to be information-rich, specific, and heavily integrated with SDC Guide content.

**Location:** `/Users/anthony/Go BARRY App/Go_BARRY/public/data/diagnostic-flows-complete.js`

## ENHANCEMENT FRAMEWORK
Apply these 11 improvement patterns to each category wizard:

### 1. PRE-DECISION INFORMATION SCREENS
Add rich context before decisions:
```javascript
{
    type: 'info-screen',
    id: 'category-context',
    title: 'Critical [Category] Information - SDC Guide',
    content: 'Before assessing the issue, review this critical safety information:',
    sdcGuidanceBoxes: [
        {
            title: 'WHY [CATEGORY] IS CRITICAL',
            content: 'Specific safety implications and risks'
        },
        {
            title: 'IMMEDIATE ACTION CRITERIA', 
            content: 'When immediate stopping is required'
        },
        {
            title: 'LEGAL/REGULATORY IMPLICATIONS',
            content: 'PG9 prohibition risks, DVSA requirements'
        }
    ],
    nextStep: 'assessment-start'
}
```

### 2. RICH SYMPTOM DETAIL CARDS
Transform simple choices into detailed information cards:
```javascript
choices: [
    {
        text: 'PRIMARY SYMPTOM NAME',
        detailedDescription: 'Complete description of what driver experiences',
        whyDangerous: 'Technical explanation of safety implications',
        immediateAction: 'Clear directive on required response',
        sdcPageReference: 'Exact SDC Guide page/section reference',
        technicalCause: 'What causes this symptom',
        progressionRisk: 'How quickly this can worsen',
        action: 'outcome-id',
        severity: 'stop/urgent/planned'
    }
]
```

### 3. CONTEXT-RICH ASSESSMENT QUESTIONS
Add specific troubleshooting from SDC Guide:
```javascript
{
    type: 'assessment-detailed',
    id: 'detailed-assessment',
    title: '[Category] Assessment - Ask Driver These Specific Questions',
    sdcQuestions: [
        {
            question: '"Exact question to ask driver"',
            purpose: 'Why this question is diagnostically important',
            criticalResponse: 'What response triggers immediate action',
            followUp: 'Additional questions if needed'
        }
    ],
    interpretationGuide: {
        positiveResponse: 'What positive answers indicate',
        negativeResponse: 'What negative answers indicate',
        uncertainResponse: 'How to handle unclear answers'
    }
}
```

### 4. ENGINEERING CONTEXT PANELS
Provide technical background:
```javascript
{
    type: 'technical-context',
    title: 'Understanding [Category] System Failures',
    engineeringInsights: [
        {
            symptom: 'Specific symptom',
            technicalCause: 'Root technical cause',
            progressionRisk: 'How/when it worsens',
            engineeringPriority: 'Response urgency level',
            repairComplexity: 'Typical fix requirements',
            downTimeEstimate: 'Expected service impact'
        }
    ],
    systemOverview: 'How this system works and why failures matter'
}
```

### 5. SPECIFIC SDC GUIDE TEXT INTEGRATION
Include exact SDC Guide content:
```javascript
{
    type: 'sdc-reference',
    title: 'SDC Guide - Exact Text Reference',
    sdcText: `"Exact quoted text from SDC Guide"`,
    pageReference: 'SDC Guide Page X, Section Y',
    additionalContext: 'Why this text is critical to follow',
    complianceNote: 'Legal/regulatory importance'
}
```

### 6. PROGRESSIVE INFORMATION DISCLOSURE
Build understanding gradually:
```javascript
{
    type: 'progressive-assessment',
    stages: [
        {
            level: 'initial',
            question: 'Broad category question',
            context: 'Why categorization matters',
            options: ['Category A', 'Category B', 'Category C']
        },
        {
            level: 'detailed', 
            question: 'Specific symptom question',
            context: 'Technical background for this category',
            options: ['Specific symptom 1', 'Specific symptom 2']
        },
        {
            level: 'verification',
            question: 'Confirmation question',
            context: 'Why verification is critical',
            options: ['Confirmed', 'Need more assessment']
        }
    ]
}
```

### 7. DECISION CONSEQUENCES PREVIEW
Show outcomes before selection:
```javascript
choices: [
    {
        text: 'SYMPTOM DESCRIPTION',
        preview: {
            outcome: 'IMMEDIATE STOP/URGENT CHANGEOVER/PLANNED CHANGEOVER',
            reason: 'Why this outcome is required',
            nextSteps: ['Step 1', 'Step 2', 'Step 3'],
            reportingCode: 'URG/BDBR/etc',
            timeToResolution: 'Expected service impact',
            passengerImpact: 'Effect on passenger service',
            engineeringResponse: 'What engineering will do'
        },
        action: 'outcome-id'
    }
]
```

### 8. INTERACTIVE CHECKLISTS
Comprehensive system checks:
```javascript
{
    type: 'interactive-checklist',
    title: 'Complete [Category] System Check',
    instructions: 'Work through each category systematically',
    checklistSections: [
        {
            category: 'Primary Function',
            purpose: 'Verify core system operation',
            items: [
                {
                    check: 'Specific check item',
                    normal: 'What normal operation looks like',
                    abnormal: 'Warning signs to look for'
                }
            ]
        }
    ],
    evaluation: {
        allPass: 'If all checks pass, proceed to...',
        anyFail: 'If ANY check fails, proceed to...',
        uncertain: 'If uncertain about any check, proceed to...'
    }
}
```

### 9. RELATED ISSUE CROSS-REFERENCES
Connect to other categories:
```javascript
{
    type: 'cross-reference',
    title: 'Related Issues to Consider',
    relatedSections: [
        {
            section: 'Related Category Name',
            relevance: 'Why this category might also be affected',
            quickCheck: 'Quick verification step',
            actionIfPresent: 'What to do if this is also present'
        }
    ],
    systemInteractions: 'How this system affects others'
}
```

### 10. COMPREHENSIVE OUTCOME SCREENS
Detailed final outcomes:
```javascript
{
    type: 'comprehensive-outcome',
    id: 'outcome-id',
    title: 'OUTCOME TITLE - COMPLETE RESPONSE PROTOCOL',
    
    situationSummary: {
        diagnosis: 'What has been identified',
        severity: 'Why this severity level',
        urgency: 'Time-critical factors'
    },
    
    immediateActions: {
        step1: {
            action: 'First immediate action',
            details: 'Specific instructions',
            timeframe: 'When this must be completed',
            safetyNote: 'Critical safety considerations'
        }
        // Additional steps as needed
    },
    
    communicationScripts: {
        toDriver: '"Exact script for driver communication"',
        toEngineering: '"Exact script for engineering communication"',
        toControl: '"Exact script for service control communication"',
        toPassengers: '"Script for passenger communication if needed"'
    },
    
    documentationRequirements: {
        goCheck: 'What to record in Go-Check system',
        epMorris: 'EP Morris reporting code and description',
        incidentReport: 'Additional reporting requirements',
        followUp: 'Follow-up documentation needed'
    },
    
    monitoringInstructions: {
        ifContinuing: 'Monitoring requirements for continued service',
        escalationTriggers: 'When to escalate or stop',
        reportingSchedule: 'Ongoing reporting requirements'
    },
    
    engineeringGuidance: {
        expectedResponse: 'What engineering will typically do',
        timeEstimate: 'Expected response/repair time',
        serviceImpact: 'Impact on passenger service',
        alternativeOptions: 'Possible alternative actions'
    }
}
```

### 11. LEARNING REINFORCEMENT
Educational context:
```javascript
{
    type: 'learning-point',
    title: 'Key Learning - Why This Matters',
    insight: 'Technical insight about this issue type',
    realWorldExample: 'Practical example of consequences',
    supervisorTip: 'Practical advice for decision-making',
    commonMistakes: 'What supervisors often get wrong',
    bestPractice: 'Recommended approach'
}
```

## IMPLEMENTATION PRIORITY
For each category, implement in this order:
1. **Rich Symptom Detail Cards** (#2) - Immediate practical value
2. **SDC Guide Text Integration** (#5) - Ensures compliance
3. **Comprehensive Outcome Screens** (#10) - Complete response protocols
4. **Progressive Information Disclosure** (#6) - Better decision flow
5. **Pre-Decision Information Screens** (#1) - Context setting
6. **Assessment Questions** (#3) - Detailed troubleshooting
7. **Technical Context** (#4) - Engineering background
8. **Decision Consequences Preview** (#7) - Informed choices
9. **Interactive Checklists** (#8) - Systematic checking
10. **Cross-References** (#9) - System integration awareness
11. **Learning Reinforcement** (#11) - Education value

## CURRENT STATUS
- **Brakes category**: Basic structure implemented, ready for enhancement
- **Next target**: Enhance brakes category with all 11 improvements
- **Future**: Apply same enhancement pattern to all other categories

## TECHNICAL NOTES
- Maintain exact SDC Guide text and page references
- Include proper EP Morris reporting codes (URG vs BDBR)
- Ensure all outcomes include comprehensive action protocols
- Add educational value while maintaining practical focus
- Cross-reference related categories where systems interact

## FILES TO MODIFY
- Primary: `/Users/anthony/Go BARRY App/Go_BARRY/public/data/diagnostic-flows-complete.js`
- Reference: SDC Guide PDF for exact text and procedures

**NEXT ACTION**: Implement comprehensive enhancement of brakes category using all 11 improvement patterns, then replicate approach for other categories.