# DISCLAIMER AND LIABILITY LIMITATIONS
## Go BARBARA Breakdown Management System

**Effective Date:** [EFFECTIVE DATE]
**Last Updated:** [UPDATE DATE]
**Version:** 1.0

---

## CRITICAL DISCLAIMER

**READ THIS DISCLAIMER CAREFULLY. IT LIMITS OUR LIABILITY AND YOUR REMEDIES.**

The Go BARRY Breakdown Management System is a **decision-support tool** designed to assist supervisors in managing vehicle breakdowns. **The Service does not replace human judgment, professional engineering expertise, or your organisation's safety procedures.**

By using the Service, you accept these limitations and acknowledge that you are responsible for all operational decisions and their outcomes.

---

## 1. NATURE AND PURPOSE OF THE SERVICE

### 1.1 Decision-Support Tool, Not Decision-Maker
The Service provides:
- Information and suggestions to assist in decision-making
- Diagnostic guidance through assessment wizards
- Real-time operational data and visualisation
- Coordination tools for dispatch and resource allocation
- Analytics and reporting capabilities

The Service does NOT:
- Make decisions for you
- Replace your judgment or expertise
- Guarantee accurate diagnosis of vehicle issues
- Replace professional engineering assessment
- Ensure all breakdowns are captured or reported correctly
- Guarantee real-time accuracy of operational data

### 1.2 Human Responsibility
**Supervisors and engineers retain full responsibility for:**

a) Evaluating breakdown incidents and assessing severity
b) Making decisions about vehicle repairs and safety measures
c) Determining when a vehicle is safe to return to service
d) Ensuring compliance with vehicle safety standards
e) Coordinating appropriate response to incidents
f) Following professional engineering standards and practices
g) Ensuring all safety procedures are followed
h) Using professional judgment to verify Service recommendations

The Service is a tool to assist your decision-making, not a substitute for it.

### 1.3 Supervisors as Experts
This Service assumes supervisors have:
- Knowledge of bus/coach fleet operations
- Understanding of vehicle safety standards
- Familiarity with diagnostic procedures
- Authority to make operational decisions
- Responsibility for safe fleet management

If supervisors lack necessary expertise, they should consult with qualified engineers or specialists before making decisions.

---

## 2. DIAGNOSTIC WIZARD LIMITATIONS

### 2.1 What Diagnostic Wizards Are
Diagnostic wizards are structured assessment tools that:

a) Guide users through a series of questions about symptoms
b) Suggest possible causes based on the symptoms described
c) Recommend assessment steps or tests
d) Help prioritise repair procedures
e) Reference relevant safety checks or maintenance procedures

### 2.2 What Diagnostic Wizards Are NOT
Diagnostic wizards do NOT:

a) **Determine Root Cause:** Cannot definitively identify the root cause of a problem
b) **Replace Engineering Judgment:** Are not a substitute for professional diagnosis
c) **Guarantee Accuracy:** May suggest incorrect causes or miss the actual problem
d) **Ensure Complete Assessment:** May not consider all relevant factors
e) **Eliminate Uncertainty:** Vehicle diagnostics inherently involves uncertainty; the wizard does not change this
f) **Replace Physical Inspection:** Cannot replace hands-on inspection by a qualified engineer
g) **Eliminate Liability:** Using the wizard does not transfer responsibility for diagnostic decisions

### 2.3 Common Diagnostic Limitations
Diagnostic wizards may fail to identify the actual cause because:

a) **Incomplete Symptom Information:** Supervisors may not report all relevant symptoms
b) **Misleading Symptoms:** Symptoms may appear to match one cause but result from another (e.g., electrical issues may present as mechanical problems)
c) **Multiple Issues:** Vehicles may have multiple problems, some of which mask others
d) **Environmental Factors:** Weather, terrain, and driving conditions may cause symptoms that are not actually mechanical problems
e) **User Error:** Incorrect answers to diagnostic questions may lead to incorrect suggestions
f) **Unusual Circumstances:** Rare or unusual problems may not be covered by the wizard

### 2.4 Wizard Misuse
Using diagnostic wizards without proper judgment increases risk:

**Dangerous Practices:**
- Assuming the wizard's suggestion is definitely correct
- Following the wizard's suggestion without understanding why
- Skipping safety procedures because the wizard doesn't mention them
- Proceeding with repairs that contradict professional safety standards
- Returning vehicles to service without physical safety inspection

**Safe Practices:**
- Use the wizard as guidance, not as a final determination
- Verify the wizard's suggestions with physical inspection
- Consult with qualified engineers for complex issues
- Apply your knowledge and experience
- Follow all safety procedures regardless of what the wizard suggests
- Document your decision-making process

---

## 3. REAL-TIME DATA LIMITATIONS

### 3.1 Accuracy Disclaimers

**GPS Location Data:**
- **Accuracy:** GPS is typically accurate to ±5-10 meters, but can be ±30+ meters in poor conditions
- **Delays:** Real-time location may have 30-second to several-minute delays
- **Signal Loss:** GPS signals can be lost in tunnels, underground areas, or urban canyons
- **Multi-path Errors:** Buildings and structures can cause reflected signals leading to incorrect locations
- **Not for Surveillance:** Location data is for operational fleet tracking, not for monitoring individual employees

**Implication:** Do not rely solely on GPS data for critical decisions. Verify location information through communication with the vehicle or driver.

**Breakdown Status Data:**
- **Timing:** May have 5-15 minute delays in reflecting actual status
- **Accuracy:** Depends on timely and accurate supervisor input
- **Completeness:** Not all breakdowns may be captured if supervisors do not report them
- **User Error:** Supervisors may enter incorrect information

**Implication:** Do not assume the Service shows a complete picture of all ongoing breakdowns. Cross-check with radio communication and supervisor reports.

**Route Status Data:**
- **Source:** Derived from third-party data providers (National Highways, local authorities, etc.)
- **Timeliness:** May lag 30+ minutes behind actual conditions
- **Accuracy:** Third-party data may be incomplete or incorrect
- **Interpretation:** May be misinterpreted or not apply to your specific routes

**Implication:** Do not rely solely on Service route status for operational decisions. Verify current conditions through your own monitoring or communication with vehicles.

### 3.2 System Performance
The Service may experience:

a) **Latency:** Delays in updating real-time data (typically <30 seconds but can be longer)
b) **Display Lag:** Maps and visualisations may not update immediately
c) **Data Gaps:** Temporary loss of data due to network issues
d) **Sync Delays:** Coordination between systems may not be instantaneous

These are normal characteristics of web-based systems and do not indicate system failure.

### 3.3 Third-Party Data Dependencies
The Service relies on real-time data from third-party sources:

- **National Highways:** Motorway and major road incident data
- **Local Authorities:** Local road works and traffic information
- **Transport Operators:** Real-time service updates from other operators
- **Google Maps:** Traffic flow and routing information
- **Weather Services:** Weather data (if included)

We do not control these data sources and are not responsible for:
- Inaccuracy or incompleteness of third-party data
- Delays in updating third-party data
- Third-party service outages or changes
- Misinterpretation of third-party data

---

## 4. ENGINEER ETA AND DISPATCH LIMITATIONS

### 4.1 ETA Calculation Accuracy
Engineer ETA (estimated time of arrival) is calculated using:

a) **Google Directions API:** Road distance and typical travel times
b) **Historical Data:** Average travel times on similar routes
c) **Current Traffic:** Real-time traffic information (where available)
d) **Straight-Line Distance:** Fallback if Google API is unavailable

**ETA Accuracy Limitations:**
- Typical accuracy: ±15-30 minutes
- Accuracy decreases during congestion, accidents, or unusual conditions
- Does not account for unexpected delays (accidents, breakdowns on the route, weather changes)
- Based on routing algorithms, which may not reflect optimal routes for emergency dispatch
- Real-time traffic data may be delayed or inaccurate

**Not a Guarantee:** The ETA is an estimate, not a promise. The engineer may arrive earlier or later than estimated.

### 4.2 ETA Countdown Feature
The ETA countdown timer:

a) Counts down from dispatch time to estimated arrival time
b) Changes colour based on time remaining (green/yellow/orange/red)
c) Stops when engineer marks "on site"
d) Is recalculated if traffic or route changes

**Limitations:**
- Timer is based on initial ETA calculation
- Does not update in real-time with traffic changes
- Does not account for delays after dispatch
- May show "overdue" if engineer is delayed by accidents or other factors
- Is for internal awareness only, not a customer commitment

### 4.3 Dispatch Coordination
The dispatch system assists with:
- Identifying available engineers
- Calculating travel time to the incident
- Tracking engineer status (assigned, en route, on site)
- Notifying supervisors of changes

**Important Limitations:**
- System assumes engineer location is accurate (but may be incorrect if engineer is off-system)
- Assumes engineer will proceed directly to incident (but engineer may need to stop for fuel, etc.)
- Does not monitor engineer actual location in real-time
- May not reflect recent changes to engineer availability (e.g., engineer just became unavailable)
- Relies on engineer keeping status updated in the system

---

## 5. TECHNOLOGY INFRASTRUCTURE LIMITATIONS

### 5.1 System Availability and Uptime
The Service is provided "as-is" without guaranteed uptime.

**What We Promise:**
- We use industry-standard security and availability measures
- We maintain regular backups
- We work to restore Service availability quickly after outages
- We provide status updates during significant outages

**What We Do NOT Promise:**
- 24/7 uptime (99.9% or higher)
- Zero downtime
- Immediate restoration after outages
- Recovery of data lost during outages (except from backups)

**Service Interruptions:**
The Service may be unavailable due to:
- Scheduled maintenance (we will provide notice)
- Emergency security patches (may be unannounced)
- Infrastructure failures
- Third-party service outages (hosting provider, Internet connectivity)
- DDoS or security attacks
- Acts of God (natural disasters, power outages)

### 5.2 Dependency on Internet Connectivity
The Service requires:

a) **Internet Connection:** Stable Internet access for the device
b) **Bandwidth:** Adequate bandwidth for real-time data sync
c) **Browser Compatibility:** Modern web browser (Chrome, Firefox, Safari, Edge)

If any of these are unavailable, the Service cannot be accessed. Users are responsible for ensuring adequate connectivity.

### 5.3 Device Requirements
The Service requires:

a) **Device:** Desktop or laptop computer (optimised for web browsers)
b) **Storage:** Minimal storage (Service is cloud-based)
c) **Memory:** 2+ GB RAM recommended
d) **Processor:** Modern processor (not more than 10 years old)

We do not support:
- Mobile devices or tablets (limited support)
- Outdated browsers or devices
- Devices with inadequate specifications

### 5.4 Data Backup Limitations
The Service maintains backups for disaster recovery:

a) **Backup Frequency:** Daily or more frequent
b) **Backup Retention:** Backups retained for [30-90] days
c) **Recovery Time:** Restoration from backup may take [4-24] hours

**Important Limitations:**
- Data loss between last backup and a disaster cannot be recovered
- You are responsible for your own backups of critical data
- Backup restoration may not preserve all recent changes

---

## 6. API AND INTEGRATION LIMITATIONS

### 6.1 API Availability
The Service provides APIs for integration with third-party systems:

**What the API Provides:**
- Access to breakdown records
- Ability to create new incidents
- Route and stop information
- Engineer dispatch and assignment
- Activity and audit logs

**What We Guarantee:**
- Documentation of API functionality
- Support for documented API endpoints
- Reasonable efforts to maintain API stability

**What We Do NOT Guarantee:**
- 100% uptime for APIs (may be slower during peak usage)
- Backward compatibility (we may change or deprecate API endpoints)
- Performance under high load (rate limiting may apply)
- Real-time data updates (APIs have typical 30-second delays)

### 6.2 Rate Limiting
APIs are subject to rate limiting to ensure fair access:

- **Standard Limit:** [X] requests per minute per integration
- **Burst Limit:** [Y] requests per second
- **Excess Requests:** May be queued, delayed, or rejected (HTTP 429 error)

If you exceed rate limits, your integration may be throttled or suspended.

### 6.3 Third-Party API Dependencies
The Service integrates with third-party APIs:

**Google Maps / Google Directions:**
- Availability: Subject to Google's terms and availability
- Accuracy: Google's data and algorithms
- Cost: Billed separately by Google
- Changes: Google may change APIs or pricing without notice

**Other Third-Party Services:**
- Availability: Subject to third-party terms
- Changes: May be modified, deprecated, or discontinued
- Cost: May incur usage-based charges
- Support: Limited to vendor support

If a third-party API becomes unavailable, the Service may lose functionality dependent on that API.

---

## 7. GEOGRAPHIC AND OPERATIONAL LIMITATIONS

### 7.1 Geographic Coverage
The Service is designed for use in the United Kingdom:

a) **GPS Accuracy:** Optimised for UK coordinates
b) **Road Data:** Based on UK road network
c) **Regulatory Compliance:** Designed for UK regulations

**Limited International Support:**
- Service may work with limited functionality in other countries
- GPS, mapping, and regulatory data may not be accurate outside the UK
- Not recommended for international operations
- Support for non-UK customers is limited

### 7.2 Fleet Size and Performance
The Service is designed for typical fleet sizes:

a) **Typical Range:** 50-500 vehicles per organisation
b) **Expected Performance:** Real-time tracking and updates for this scale

**Large Fleet Considerations:**
- Very large fleets (1000+ vehicles) may experience performance degradation
- Real-time updates may be delayed under peak load
- Reporting and analytics may take longer to generate
- Custom performance tuning may be required (additional cost)

If your fleet size exceeds the Service's capacity, contact us for enterprise solutions.

### 7.3 Peak Usage and Performance
The Service may experience slower performance during:

a) Peak operational hours (morning/evening commute times)
b) Major incidents (accidents, large breakdowns)
c) System-wide reporting or backup operations
d) Third-party service outages (Google API, ISP, etc.)

This is normal behaviour for web-based systems serving multiple organisations.

---

## 8. SECURITY AND DATA PROTECTION LIMITATIONS

### 8.1 Security Measures
The Service implements industry-standard security:

a) **Encryption:** TLS/SSL for data in transit
b) **Authentication:** Username/password with token-based sessions
c) **Access Controls:** Role-based permissions
d) **Audit Logging:** Recording of user actions
e) **Updates:** Regular security patches

**What This Means:**
- Your data is protected against common attacks
- Unauthorised users cannot easily access your data
- Your actions are logged for accountability
- We respond to security vulnerabilities promptly

### 8.2 Security Limitations
Security is not absolute:

a) **No Perfect Security:** No system is completely secure against all attacks
b) **Sophisticated Attacks:** Advanced attacks may succeed despite security measures
c) **Insider Threats:** Authorised users with malicious intent may access data
d) **Third-Party Risks:** Third-party services may have security vulnerabilities
e) **User Error:** Users may compromise security by sharing credentials or clicking malicious links

### 8.3 Data Loss Risks
Despite security measures, data loss can occur:

a) **Hardware Failure:** Rare, but possible
b) **Software Bugs:** Defects in code may cause data loss
c) **User Error:** Accidental deletion by supervisors
d) **Malware:** Malicious software may corrupt data
e) **Natural Disasters:** Floods, fires, earthquakes can destroy data centres

**Protections:**
- We maintain daily backups
- Backups are stored in geographically separate locations
- Backup recovery is tested regularly
- Data is encrypted at rest

**Your Responsibility:**
- You should maintain your own backups
- You should test your ability to restore from backup
- You should not rely solely on our backups

---

## 9. LIABILITY LIMITATIONS (CRITICAL)

### 9.1 Limitation of Damages

**IN NO EVENT SHALL [YOUR BUSINESS ENTITY NAME] BE LIABLE FOR:**

a) **Indirect Damages** - Lost profits, lost revenue, lost business opportunity
b) **Consequential Damages** - Damages that result from the Service being unavailable
c) **Special Damages** - Unusual or specific damages not commonly foreseeable
d) **Incidental Damages** - Costs incurred as a result of using the Service
e) **Punitive Damages** - Penalties intended to punish misconduct

### 9.2 Cap on Total Liability

**Our total liability shall not exceed:**
- The amount you paid for the Service in the 12 months immediately preceding the claim, OR
- GBP [AMOUNT], whichever is greater

**This cap applies to:**
- All claims arising from or related to the Service
- Contract, negligence, or any other legal theory
- Any combination of multiple claims

### 9.3 Exceptions (Not Capped)
These limitations do NOT apply to:

a) **Death or Personal Injury** - Caused by our gross negligence (cannot be limited by law)
b) **Fraud or Willful Misconduct** - Our deliberate wrongdoing
c) **Intellectual Property Infringement** - If we infringe your patents or copyrights
d) **Data Protection Breaches** - Our breach of GDPR obligations (subject to GDPR limits)
e) **Indemnification** - Our indemnification obligations for third-party claims
f) **Non-Excludable Liability** - Any liability that cannot legally be excluded or limited

### 9.4 No Liability for Customer Decisions
We assume NO liability for:

a) **Operational Decisions** - Decisions you make based on Service output or suggestions
b) **Repair Decisions** - Decisions about vehicle repairs or maintenance
c) **Safety Decisions** - Decisions about vehicle safety or return-to-service
d) **Data Inaccuracy** - Your reliance on inaccurate data from the Service
e) **Third-Party Issues** - Problems caused by third-party services or data sources
f) **Your Actions** - Your use of the Service in violation of this disclaimer or the Acceptable Use Policy

You are responsible for your own decisions and outcomes.

### 9.5 No Liability for Service Failures (Unless Gross Negligence)
We are NOT liable for:

a) **Service Unavailability** - If the Service is down or inaccessible
b) **Data Loss** - If data is lost or corrupted (except due to our gross negligence)
c) **Inaccurate Data** - If real-time data is delayed or inaccurate
d) **API Failures** - If third-party APIs fail or are unavailable
e) **Performance Issues** - If the Service is slow or performs poorly

**Unless** we were grossly negligent or willfully misconduct caused the issue.

---

## 10. ASSUME THE RISK ACKNOWLEDGMENTS

### 10.1 Your Acknowledgments
By using the Service, you acknowledge and accept:

a) **Risk of Use** - The Service is used entirely at your own risk
b) **Decision Responsibility** - You are responsible for all decisions you make using the Service
c) **Reliance at Own Risk** - You use the Service's suggestions and data at your own risk and judgement
d) **No Warranty** - The Service is provided without warranty of any kind
e) **Limitations** - The Service has inherent limitations that cannot be overcome
f) **Human Oversight Required** - The Service cannot replace human judgment and expertise

### 10.2 No Service Level Agreement
Unless you have a separate, signed SLA:

- We do not guarantee any specific uptime (e.g., 99.9%)
- We do not guarantee response times for support issues
- We do not guarantee data recovery times
- We do not guarantee real-time data accuracy
- We do not guarantee API availability

### 10.3 No Warranty for Third-Party Data
We do not warrant:

a) **Accuracy** - Google Maps, National Highways, or other third-party data
b) **Availability** - That third-party services will remain available
c) **Completeness** - That third-party data includes all relevant information
d) **Timeliness** - That third-party data is current or real-time

You use third-party data at your own risk and should verify critical information independently.

---

## 11. VEHICLE SAFETY DISCLAIMER

### 11.1 Critical Safety Notice
**THE SERVICE DOES NOT REPLACE PROFESSIONAL VEHICLE SAFETY INSPECTIONS OR MAINTENANCE PROCEDURES.**

Breakdowns may indicate serious safety issues. Before returning a vehicle to service:

a) **Professional Inspection** - A qualified mechanic must physically inspect the vehicle
b) **Safety Tests** - All relevant safety tests must be completed
c) **Regulatory Compliance** - The vehicle must comply with all safety regulations
d) **Manufacturer Standards** - Follow the vehicle manufacturer's repair and safety procedures
e) **Documentation** - Repairs and safety measures must be properly documented

### 11.2 Supervisor Responsibility
Supervisors are responsible for ensuring:

a) Only qualified engineers perform repairs
b) All repairs are completed properly and documented
c) Safety tests are completed before return-to-service
d) The vehicle meets all safety standards
e) Drivers are informed of any remaining limitations or restrictions

### 11.3 Service Limitations
The Service cannot:

a) Determine if a vehicle is safe to return to service
b) Replace a professional safety inspection
c) Guarantee diagnostic accuracy
d) Ensure all repairs are completed properly
e) Ensure regulatory compliance

---

## 12. NO GUARANTEE OF RESULTS

### 12.1 No Outcome Guarantees
The Service does NOT guarantee:

a) **Faster Breakdown Resolution** - Using the Service may not reduce resolution time
b) **Improved Safety** - The Service is a tool; safety depends on proper use
c) **Reduced Costs** - The Service may not reduce maintenance or operational costs
d) **Improved Efficiency** - Efficiency improvements depend on your processes and procedures
e) **Employee Satisfaction** - Supervisors may not find the Service satisfactory

### 12.2 Results Depend on Use
Benefits depend on:

a) **Proper Training** - Supervisors must be properly trained to use the Service
b) **Proper Procedure** - You must follow proper procedures and processes
c) **Data Quality** - Benefits depend on accurate, complete data entry
d) **Professional Judgment** - You must apply professional judgment and expertise
e) **System Integration** - You must properly integrate the Service with your operations

---

## 13. ACCEPTANCE OF RISK

### 13.1 Acceptance Checkbox
**By using the Service, you confirm:**

- ☐ I have read and understand this disclaimer
- ☐ I understand the limitations of the Service
- ☐ I accept the Service "as-is" without warranty
- ☐ I understand I am responsible for my own decisions
- ☐ I understand the liability limitations apply to me
- ☐ I understand the Service is a tool, not a replacement for professional judgment
- ☐ I assume all risk of using the Service
- ☐ I will not hold [YOUR BUSINESS ENTITY NAME] liable for outcomes of my decisions

### 13.2 Acknowledgment of Limitations
**You specifically acknowledge:**

1. **Diagnostic Limitations** - Wizards may be inaccurate; professional diagnosis is required
2. **Data Limitations** - Real-time data may be delayed or inaccurate
3. **ETA Limitations** - ETAs are estimates, not guarantees
4. **Safety Responsibility** - Vehicle safety is ultimately your responsibility
5. **Decision Responsibility** - You are responsible for operational decisions
6. **No 24/7 Guarantee** - The Service is not guaranteed to be available 24/7
7. **No Perfect Security** - The Service uses industry-standard but not perfect security
8. **Liability Capped** - Our liability is limited to fees paid

---

## 14. CHANGES TO DISCLAIMER

This disclaimer may be updated at any time. Changes take effect [30] days after posting. Continued use of the Service constitutes acceptance of updated disclaimers.

---

## 15. CONTACT FOR CLARIFICATION

If you do not understand any part of this disclaimer:

**Contact Us:**
- Email: [SUPPORT EMAIL]
- Phone: [PHONE NUMBER]
- Response Time: Within 2 business days

Do NOT use the Service if you do not understand or accept these terms.

---

---

## FINAL STATEMENT

**This disclaimer is intentionally comprehensive and detailed because the Service is used in operational contexts where decisions can have serious consequences.**

We take our responsibility seriously and use industry-standard security, reliability, and backup measures. However, no system is perfect, and we cannot guarantee outcomes.

**By using the Service, you accept:**
- The Service's limitations
- Your responsibility for decisions
- The liability caps and exclusions
- The risks outlined in this disclaimer

If you have any concerns about whether the Service is appropriate for your operations, please contact us before proceeding.

---

---

## IMPORTANT NOTICE

**This document is a template for informational purposes. Before deploying the Service, consult with a qualified attorney licensed in England and Wales to ensure:**

1. All disclaimers and limitations comply with UK law
2. Liability limitations are enforceable and appropriate for your business
3. No material liability is excluded that should not be excluded by law
4. Safety-critical limitations are clearly communicated
5. Language is clear and unambiguous to customers
6. All placeholders are customised with accurate information

This disclaimer should be reviewed annually and updated to reflect changes in the Service, regulatory environment, and business practices.

---

**Document Version:** 1.0
**Status:** Template - Not yet legally reviewed
**Date Created:** [DATE]
**Next Review Date:** [DATE]
