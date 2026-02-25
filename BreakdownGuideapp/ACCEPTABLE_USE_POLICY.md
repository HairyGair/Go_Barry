# ACCEPTABLE USE POLICY
## Go BARRY Breakdown Management System

**Effective Date:** [EFFECTIVE DATE]
**Last Updated:** [UPDATE DATE]
**Version:** 1.0

---

## 1. PURPOSE AND SCOPE

This Acceptable Use Policy ("AUP") sets forth the rules and expectations for use of the Go BARRY Breakdown Management System (the "Service"). The Service is a professional tool designed exclusively for real-time breakdown management and fleet operations by authorised supervisors and managers in the bus and coach transport sector.

This policy applies to:
- All users of the Service ("Users")
- All authorised supervisors, managers, and engineers
- All organisations licensed to use the Service ("Customer")
- All personnel with access to Service accounts

By accessing or using the Service, you agree to comply with this policy. Violations may result in:
- Warning or suspension of your account
- Immediate termination of your access
- Termination of the Customer's subscription
- Legal action and damages

---

## 2. AUTHORISED USE

### 2.1 Permitted Use
The Service is licensed exclusively for use by the Customer's authorised personnel to:

a) Record and track vehicle breakdowns in real-time
b) Access diagnostic decision-support wizards and assessment tools
c) Coordinate engineer dispatch and vehicle assignment
d) Track replacement vehicle deployment and BSOG mileage
e) Monitor route status and service disruptions
f) Generate operational reports and analytics
g) Manage engineer shifts and attendance
h) Manage supervisor and user accounts (administrators only)
i) Access historical operational data for review and analysis
j) Use published APIs to integrate the Service with other systems

### 2.2 Authorised User Roles

**Supervisors:**
- View and create breakdown incidents
- Access diagnostic wizards
- Dispatch engineers
- View route status
- Generate reports
- Cannot modify system settings or other users' accounts

**Managers:**
- All supervisor permissions plus:
- View all breakdowns across depots
- Override supervisor decisions
- Generate management reports
- Cannot modify user accounts or system settings

**Engineering Managers:**
- Engineer dispatch and assignment
- Manage engineer shifts and check-ins
- View engineer availability
- Generate engineering reports
- Cannot view supervisor settings or non-engineering functions

**Administrators:**
- All permissions including:
- Create and modify user accounts
- Change user roles and permissions
- Configure system settings
- Access audit logs
- Manage integrations and APIs
- Data export and import

**Restriction:** Only users with explicit administrative role can manage accounts and system settings.

### 2.3 Non-Authorised Users
The following categories of people are NOT authorised to use the Service:

a) Drivers (unless supervisors explicitly grant dashboard access for specific tasks)
b) Members of the public
c) Competitors of the Customer
d) Individuals without a legitimate business need
e) Third-party consultants without written approval from the Customer
f) Individuals whose access has been revoked or suspended

Unauthorised access is a violation of this policy and may result in legal action.

---

## 3. ACCOUNT SECURITY AND RESPONSIBILITY

### 3.1 Account Credentials
Each User receives unique account credentials (email and password) for individual authentication.

**User Responsibilities:**

a) **Confidentiality:** Keep your password confidential and do not share it with anyone
b) **Regular Updates:** Change your password [every 90 days] or when you suspect compromise
c) **Strong Passwords:** Use passwords with:
   - Minimum 12 characters
   - Mix of uppercase, lowercase, numbers, and symbols
   - No dictionary words or personal information
   - No shared or reused passwords from other systems
d) **Session Logout:** Always log out when finished, especially on shared devices
e) **Device Security:** Use secure, updated devices and browsers
f) **VPN/Network:** Access the Service only from secure, trusted networks
g) **Incident Reporting:** Immediately report any suspected unauthorised access to the Customer administrator

### 3.2 Administrator Responsibilities
Customer administrators are responsible for:

a) **Access Management:** Creating, modifying, and revoking user accounts promptly
b) **Credential Management:** Never sharing administrator credentials; using unique credentials per administrator
c) **Audit Monitoring:** Reviewing access logs regularly for suspicious activity
d) **Offboarding:** Immediately removing access for employees who leave or change roles
e) **Access Review:** Conducting quarterly reviews of active users and their role assignments
f) **Incident Response:** Immediately notifying us of any suspected breach or unauthorised access

### 3.3 Account Lockout and Recovery
- Accounts are locked after [5] failed login attempts
- Locked accounts are automatically unlocked after [15] minutes
- Administrators may manually unlock accounts in the admin panel
- Password recovery uses email verification
- Administrators can reset passwords for other users

The Customer is responsible for account security within its own organisation.

---

## 4. DATA ACCURACY AND INTEGRITY

### 4.1 Data Entry Responsibilities
Users creating breakdown records, incident reports, and operational data are responsible for:

a) **Accuracy:** Ensuring all information is accurate, complete, and factual
b) **Timeliness:** Recording information promptly, not retrospectively editing data to hide issues
c) **Completeness:** Including all relevant details to properly assess the incident
d) **Truthfulness:** Not fabricating, exaggerating, or minimising incidents
e) **Compliance:** Following the Customer's data entry procedures and standards

### 4.2 Data Modification Restrictions
- Users may modify their own records within [24 hours] of creation
- Users may not modify records created by other supervisors
- Administrators may modify any record and actions are logged with a change history
- Historical records (older than [30 days]) are marked read-only to maintain data integrity
- All modifications are audited; the system tracks who changed what and when

### 4.3 Prohibited Data Entry
Users shall NOT:

a) **False Incidents:** Create fake or test breakdowns using real vehicle numbers or locations
b) **Misleading Information:** Deliberately enter incorrect location, severity, or diagnosis data
c) **Personal Information:** Record personal details unrelated to the breakdown (e.g., driver names, employee IDs)
d) **Defamatory Content:** Create records containing insulting, racist, or defamatory language
e) **Confidential Information:** Record sensitive business information unrelated to the breakdown
f) **Irrelevant Data:** Use breakdown records for non-operational purposes

The Service is a professional operational tool. Misuse may result in disciplinary action by the Customer and/or suspension of your account.

---

## 5. PROHIBITED ACTIVITIES

### 5.1 System Access Restrictions
Users shall NOT:

a) **Unauthorised Access:** Attempt to access the Service using another user's credentials or login
b) **Account Sharing:** Share login credentials with other users; each user must have their own account
c) **Privilege Escalation:** Attempt to gain higher permission levels by exploiting system vulnerabilities
d) **Reverse Engineering:** Attempt to reverse engineer, decompile, or discover the source code of the Service
e) **Security Testing:** Perform security testing, penetration testing, or vulnerability scanning without written permission from the Licensor
f) **Credential Theft:** Attempt to steal or intercept other users' credentials or authentication tokens
g) **Inactive Accounts:** Reactivate or access accounts that have been deactivated or suspended

### 5.2 Data Extraction and Misuse
Users shall NOT:

a) **Bulk Download:** Download or extract all breakdowns, routes, or other data in bulk
b) **Scraping:** Use automated tools, scripts, or bots to extract data from the Service
c) **Competitive Use:** Extract data to develop competing products or services
d) **Unauthorised Sharing:** Share Customer Data with unauthorised third parties
e) **GTFS Data Extraction:** Download or export GTFS route, stop, or trip data
f) **Data Republication:** Republish or resell data obtained from the Service
g) **Non-Operational Use:** Use operational data for purposes outside of bus fleet management

All Customer Data remains the property of the Customer organisation and is protected. Misuse may result in legal action.

### 5.3 System Interference
Users shall NOT:

a) **Denial of Service:** Attempt to overload, crash, or disable the Service through excessive requests
b) **Resource Abuse:** Generate excessive API requests or large data transfers that strain system resources
c) **Injection Attacks:** Attempt SQL injection, code injection, or other injection attacks
d) **Malware:** Transmit viruses, worms, trojan horses, or other malicious code
e) **Phishing:** Use the Service to create phishing emails or impersonate other users
f) **Disruption:** Interfere with Service availability or other users' access
g) **Network Attacks:** Perform network scanning, packet sniffing, or other network attacks against the Service

Attempts to interfere with the Service are a violation of the Computer Misuse Act 1990 and may result in criminal prosecution.

### 5.4 Unlawful Activities
Users shall NOT use the Service to:

a) **Illegal Activities:** Violate any applicable laws or regulations
b) **Harassment:** Harass, threaten, abuse, or stalk any person
c) **Discrimination:** Create records or communicate content that is racist, sexist, or discriminatory
d) **Defamation:** Make false, defamatory statements about individuals or organisations
e) **Fraud:** Deliberately misrepresent information to obtain benefits or access not authorised
f) **Privacy Violations:** Collect or track personal information without consent
g) **Corruption:** Offer or accept bribes, kickbacks, or improper inducements
h) **Conflicts of Interest:** Abuse position to obtain personal or financial benefit

The Service is a professional tool for authorised business purposes only.

---

## 6. APPROPRIATE CONDUCT

### 6.1 Professional Standards
Users shall:

a) **Professionalism:** Use the Service in a professional manner consistent with the Customer's workplace policies
b) **Respect:** Treat other users and the Service with respect
c) **Compliance:** Follow all Customer policies and procedures
d) **Integrity:** Act honestly and truthfully in all interactions
e) **Confidentiality:** Protect confidential information appropriately
f) **Responsiveness:** Respond promptly to system security notices and updates

### 6.2 Appropriate Use of Communication Features
If the Service includes messaging or communication features, users shall:

a) Not harass or threaten other users
b) Not transmit spam or unsolicited messages
c) Not impersonate other users or send messages on behalf of others
d) Not include inappropriate, offensive, or defamatory content
e) Keep communications professional and job-related

### 6.3 Workplace Conduct
Users shall comply with:

a) Customer's employee handbook and conduct policies
b) Customer's data protection and confidentiality policies
c) Customer's anti-discrimination and anti-harassment policies
d) Customer's social media and public communications policies
e) All applicable laws and regulations

The Customer may impose additional disciplinary action for violations of internal policies.

---

## 7. OPERATIONAL RESPONSIBILITIES

### 7.1 Diagnostic Wizard Responsibility
The Service provides diagnostic decision-support wizards to guide assessment of vehicle breakdowns.

**Important Disclaimer:**
- Wizards are guidance tools only, not replacements for professional engineering judgment
- Supervisors and engineers retain full responsibility for decisions about vehicle repairs and safety
- Diagnostic suggestions are not final determinations; professional assessment is required
- Following a wizard's suggestion does not shift liability for incorrect repair decisions
- Supervisors must use their knowledge and experience to evaluate wizard recommendations

Users shall NOT:
- Follow diagnostic suggestions blindly without critical evaluation
- Assume the wizard has identified the root cause with certainty
- Skip required safety procedures or professional assessments
- Proceed with repairs that contradict professional safety standards
- Blame the Service for incorrect repair decisions

### 7.2 Real-Time Data Reliance
The Service provides real-time breakdown tracking, route status, and operational data.

**Important Limitations:**
- Real-time data may have inherent delays or inaccuracies
- GPS location data is approximate and may be inaccurate
- Route status data is derived from third-party sources
- Engineer ETA calculations are estimates that may not account for unexpected delays
- Supervisors shall not rely solely on Service data for critical operational decisions

Users shall:
- Verify critical information through manual confirmation
- Use manual procedures and backup systems as primary safeguards
- Maintain awareness of Service limitations
- Apply professional judgment to Service recommendations
- Contact supervisors or management if data appears incorrect

### 7.3 Incident Reporting Obligations
Users creating breakdown records are responsible for:

a) **Complete Information:** Including all relevant incident details
b) **Accurate Severity:** Correctly assessing and recording incident severity
c) **Timely Recording:** Creating records promptly, not after the fact
d) **Safety Issues:** Immediately escalating any safety-critical issues to management
e) **Compliance:** Following the Customer's incident reporting procedures

---

## 8. SECURITY INCIDENT REPORTING

### 8.1 Reporting Requirements
Users must immediately report any suspected security incidents:

a) **Unauthorised Access:** Any indication someone accessed your account without permission
b) **Data Breach:** Any evidence that Customer Data was accessed or compromised
c) **Suspicious Activity:** Unusual login attempts, changes to your account, or unexpected notifications
d) **Lost Credentials:** If you believe your password has been compromised
e) **Lost Device:** If a device with Service access was lost or stolen
f) **Malware Suspicion:** If your device may be infected with malware or spyware

**How to Report:**
1. Contact your Customer administrator immediately: [ADMIN CONTACT]
2. The administrator will assess and escalate to the Licensor if necessary
3. Provide details: what happened, when it occurred, accounts affected
4. Do not change passwords yourself; coordinate with the administrator
5. Cooperate fully with the investigation

### 8.2 Investigation Cooperation
When a security incident is reported, Users shall:

a) Preserve evidence (do not delete logs, messages, or account changes)
b) Grant access to affected accounts for investigation
c) Provide detailed information about the incident
d) Change passwords following administrator guidance
e) Comply with any temporary access restrictions
f) Keep the incident confidential during investigation

Failure to cooperate with security investigations may result in account suspension.

---

## 9. MONITORING AND AUDITING

### 9.1 System Monitoring
The Licensor monitors the Service for:

a) Security threats and vulnerabilities
b) System performance and availability
c) Unusual access patterns or activity
d) Potential violations of this policy
e) Compliance with contractual obligations

### 9.2 Audit Logs
The Service maintains comprehensive audit logs recording:

- Login times and IP addresses
- Actions performed (data creation, modification, deletion)
- Reports generated and accessed
- Administrator changes to user accounts
- API access and usage
- Data exports and bulk operations

Audit logs are retained for [12-24] months and are available to Customer administrators.

### 9.3 Customer Admin Access
Customer administrators have access to:

- User activity logs and audit trails
- Login history and access patterns
- Data modification history
- Account changes and role assignments
- System configuration changes

Administrators shall use this access only for legitimate management and security purposes.

### 9.4 Privacy of Monitoring
While the Service monitors activity for security and compliance:

- Monitoring is focused on system and account activity, not personal communications
- Personal conversations (if any) are not routinely monitored without cause
- Investigation of suspected misconduct requires documented suspicion and approval
- Monitoring results are not shared with third parties without legal authority or consent

---

## 10. ENFORCEMENT AND CONSEQUENCES

### 10.1 Violation Detection
Violations of this policy may be detected through:

a) System monitoring and anomaly detection
b) User complaints or reports
c) Customer administrator notification
d) Security incident investigation
e) Routine audit and compliance reviews

### 10.2 Progressive Discipline

**Minor Violations (e.g., password sharing, inactive logout):**
1. First offense: Written warning
2. Second offense: Account suspension for [1-7] days
3. Third offense: Escalation to account termination

**Moderate Violations (e.g., data entry inaccuracy, policy neglect):**
1. First offense: Account suspension for [7-30] days
2. Second offense: Account termination and review by Customer management

**Serious Violations (e.g., attempted unauthorised access, data theft, deliberate system interference):**
1. Immediate account suspension
2. Notification to Customer management and Licensor
3. Potential police and legal referral
4. Account termination and subscription termination

**Critical Violations (e.g., malware transmission, criminal activity):**
- Immediate account termination
- Immediate notification to law enforcement and Licensor
- Potential civil and criminal legal action

### 10.3 Suspension Process

When a violation warrants suspension:

1. **Notice:** The User receives written notice explaining the violation and reason for suspension
2. **Duration:** Suspension period is specified (temporary suspension or permanent termination)
3. **Appeal:** The User may appeal the suspension within [7 days] to the Customer administrator
4. **Review:** The appeal is reviewed and a final decision is communicated
5. **Reinstatement:** Upon completion of the suspension, the account is automatically reactivated unless the decision was permanent termination

### 10.4 Account Termination
When an account is terminated:

- Access is immediately revoked
- All active sessions are terminated
- The User cannot log in or access the Service
- The User's data and activity logs are retained for compliance and legal purposes
- The User cannot reactivate the account without the Customer administrator's approval

If the User is part of a subscription group, termination of individual accounts does not affect other users or the subscription.

### 10.5 Subscription Termination
If violations are serious or widespread, the entire subscription may be terminated:

- The Customer receives written notice of the grounds for termination
- The Customer is given [30] days to cure the violation
- If the violation is not cured, the subscription is terminated
- All Customer Data is securely deleted after [30 days]
- The Customer is not entitled to any refund for early termination

---

## 11. APPEALS AND DISPUTE RESOLUTION

### 11.1 Appeal Rights
Users and Customers have the right to appeal enforcement decisions:

a) **Appeal Window:** Submit an appeal within [7 days] of the enforcement decision
b) **Appeal Process:** Submit written appeal to [APPEALS EMAIL] with:
   - The decision being appealed
   - The grounds for the appeal
   - Supporting evidence or documentation
c) **Review:** The appeal is reviewed by an independent manager not involved in the original decision
d) **Response Time:** A decision is communicated within [10 business days]
e) **Final Determination:** The appeal decision is final and binding

### 11.2 Expedited Appeals
For suspensions longer than [30 days] or account terminations, the Customer may request expedited appeal within [3 days].

### 11.3 Dispute Resolution
If disputes arise regarding policy enforcement:

1. First, the parties attempt good-faith resolution
2. If unresolved, escalation to senior management
3. If still unresolved, mediation or arbitration as specified in the Sales License Agreement

---

## 12. POLICY UPDATES

### 12.1 Policy Changes
The Licensor may update this Acceptable Use Policy at any time:

- Changes are effective [30] days after posting
- Material changes are communicated via email
- Continued use of the Service constitutes acceptance of changes

### 12.2 Customer-Specific Policies
The Customer may establish additional use policies that are more restrictive than this policy:

- The Customer's policies must be communicated in writing to all Users
- The Customer's policies do not override this Acceptable Use Policy
- Violations of the Customer's policies are enforced by the Customer

---

## 13. LEGAL COMPLIANCE

### 13.1 Applicable Laws
This policy is subject to and must be interpreted in compliance with:

a) Laws of England and Wales
b) UK GDPR and Data Protection Act 2018
c) Computer Misuse Act 1990
d) Fraud Act 2006
e) All other applicable UK and international laws

### 13.2 Police and Legal Referral
Serious violations may be reported to:

- Local law enforcement (police)
- Information Commissioner's Office (data breaches)
- National Crime Agency (serious cyber crimes)
- Business regulatory authorities

The Licensor and Customer are entitled to cooperate fully with law enforcement investigations.

### 13.3 Regulatory Compliance
The Customer is responsible for ensuring the Service is used in compliance with:

a) Transport sector regulations and standards
b) Vehicle safety regulations
c) Workplace health and safety laws
d) Employment law and workplace policies
e) Data protection and privacy regulations

---

## 14. CONTACT AND ESCALATION

### 14.1 Policy Questions
For questions about this Acceptable Use Policy:
- Email: [POLICY EMAIL]
- Phone: [PHONE NUMBER]
- Response time: Within 5 business days

### 14.2 Incident Reporting
For security incidents or violations:
- Contact your Customer administrator immediately
- For serious security issues, email: [SECURITY EMAIL]
- 24-hour emergency contact: [EMERGENCY PHONE]

### 14.3 Appeals
For appeals of enforcement decisions:
- Email: [APPEALS EMAIL]
- Include the decision being appealed and grounds for appeal
- Response time: Within 10 business days

---

## 15. ACKNOWLEDGMENT

**By using the Go BARRY Breakdown Management System, you acknowledge:**

1. You have read and understand this Acceptable Use Policy
2. You agree to comply with all terms and conditions
3. Violations may result in account suspension or termination
4. Serious violations may be referred to law enforcement
5. The Service is a professional tool for authorised operational use only
6. You understand the limitations of decision-support tools and diagnostic wizards
7. You assume responsibility for decisions made based on Service data
8. You will immediately report suspected security incidents

---

---

## IMPORTANT NOTICE

**This document is a template for informational purposes. Consult with a qualified attorney licensed in England and Wales before adopting this policy to ensure compliance with:**

1. UK employment law and workplace policies
2. Data protection and privacy regulations
3. Transport sector regulations
4. Your organisation's specific operational requirements
5. Any additional industry-specific requirements

This policy should be reviewed and updated annually to reflect changes in the Service, business requirements, and applicable laws.

---

**Document Version:** 1.0
**Status:** Template - Not yet legally reviewed
**Date Created:** [DATE]
**Next Review Date:** [DATE]
