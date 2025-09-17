# SteeringWizard Update Summary - SDC Guide v1.3 & DVSA Compliance

## Update Date: January 12, 2025

### Overview
The SteeringWizard.jsx has been updated to ensure full compliance with:
- SDC Engineering Issues Guide v1.3 - Steering Section (Page 8)
- DVSA's "Categorisation of Vehicle Defects" guidelines

### Key Changes Made

#### 1. **Tranzaura System Integration**
- Updated all references from "Go-Check" to "Tranzaura System"
- Added explicit instructions to record defects in Tranzaura when stationary
- Aligned with December 2024 system migration

#### 2. **DVSA Compliance Enhancements**
- Added header reference to DVSA's "Categorisation of Vehicle Defects" document
- Clarified the 75mm play limit specification for power steering vehicles
- Emphasized that steering defects are classified as "Dangerous" under DVSA categorisation
- Enhanced PG9 prohibition warnings

#### 3. **SDC Guide v1.3 Alignment**
- All 8 critical steering conditions from the SDC Guide are properly listed:
  1. Excessive play in steering wheel (>75mm at rim for power steering)
  2. Difficulty steering or maintaining control
  3. Unusual noises when steering (knocking, grinding, squealing)
  4. Vehicle pulling to one side during operation
  5. Visible damage to steering system (column, linkage)
  6. Leaks from power steering system
  7. Steering becomes stiff or unresponsive
  8. Any steering-related warning light illuminated

#### 4. **Persistent False Reports Guidance**
- Added SDC guidance about reporting persistent false steering complaints to depot management
- Included note: "Report to the depot management team if you feel a particular individual is persistently reporting steering problems that, when investigated by engineering, reveal no fault"
- This helps address unnecessary service disruptions

#### 5. **Safety Messaging Strengthened**
- Reinforced "IMMEDIATE STOP" requirement for any steering defect
- Clarified that NO exceptions exist for "continuing to next changeover"
- Enhanced visual warnings with red color coding
- Added multiple confirmation steps for STOP decisions

### Compliance Verification

The updated SteeringWizard now includes:

✅ **All SDC Guide Requirements**
- Immediate stop for any steering defect
- Complete list of critical conditions
- Tranzaura System recording instructions
- Persistent false report handling

✅ **DVSA Standards**
- 75mm play limit clearly specified
- "Dangerous defects" classification
- PG9 prohibition warnings
- Proper documentation requirements

✅ **Operational Safety**
- Clear decision framework (STOP only - no AMBER/CONTINUE for steering)
- Step-by-step assessment process
- Comprehensive safety warnings
- Audit trail documentation

### Testing Recommendations

1. **Verify Tranzaura Integration**
   - Ensure defect logging works when vehicle is stationary
   - Test EP Morris code (likely BDST for steering)

2. **Decision Flow Testing**
   - Any reported issue → STOP decision
   - Any physical defect found → STOP decision
   - All clear → CONTINUE decision

3. **Compliance Documentation**
   - Verify assessment logs include all required information
   - Test persistent false report escalation process

### Notes

- This wizard takes the most conservative approach as steering is a safety-critical system
- Unlike other systems, there is NO amber/warning state for steering - it's either STOP or CONTINUE
- The wizard emphasizes that ANY steering defect requires immediate vehicle shutdown
- All updates maintain the existing user interface design while enhancing compliance messaging

---

**Version**: 1.1.1
**Author**: Go North East Breakdown Guide Development Team
**Approved By**: Pending SDC Operations Director Review
