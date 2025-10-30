# IT Whitelist Request - Go North East Breakdown Management System

**Date:** October 18, 2025
**Requested by:** Anthony Gair - Go North East
**Department:** Operations / Engineering
**Priority:** Medium - Business Critical Application

---

## Executive Summary

Go North East has deployed an internal breakdown management system used by supervisors to manage vehicle breakdowns and ensure passenger safety. The application is currently blocked by the corporate firewall and requires whitelisting to function.

**Business Impact:**
- Supervisors cannot access critical breakdown guidance at depot locations
- Delays in breakdown resolution affecting passenger service
- Safety compliance documentation cannot be accessed in real-time

---

## Domains Requiring Whitelist

Please whitelist the following domains for HTTPS access (port 443):

### Primary Application Domains
1. **breakdowns.gobarry.co.uk** (Frontend Application)
   - Purpose: Main web interface for breakdown management
   - Hosted on: Pixelish cPanel (UK-based)
   - SSL: Let's Encrypt certificate

2. **api.breakdowns.gobarry.co.uk** (Backend API)
   - Purpose: REST API for application data
   - Hosted on: Pixelish cPanel (UK-based)
   - SSL: Let's Encrypt certificate
   - Authentication: JWT tokens (no personal data exposure)

### Database Service
3. **oieliubbvvdzhzvikzal.supabase.co**
   - Purpose: PostgreSQL database hosting
   - Provider: Supabase (AWS-backed, enterprise-grade)
   - Region: eu-west-1 (Ireland)
   - Data: Breakdown records, supervisor credentials (encrypted)

### Optional - Legacy Fallback (Can be blocked after migration)
4. **breakdown-guide.onrender.com**
   - Purpose: Legacy backend (being phased out)
   - Note: System will work without this if items 1-3 are whitelisted

---

## Technical Details

### Protocols Required
- **HTTPS (443)** - All communications encrypted
- **WSS (443)** - WebSocket for real-time updates (optional, graceful fallback available)

### Security Measures
- All connections use TLS 1.2 or higher
- JWT-based authentication
- Rate limiting implemented
- No third-party tracking scripts
- No data leaving Go North East control (except Supabase hosting)

### Data Handled
- Vehicle breakdown records
- Supervisor authentication (hashed passwords)
- Operational guidance documents
- No personal customer data
- No payment information

---

## Why Is This Blocked?

The application appears to be blocked due to:
1. **Keyword filtering** - "breakdowns" may trigger security filters
2. **Unknown domain** - New internal application not yet whitelisted
3. **External API calls** - Calls to api.breakdowns.gobarry.co.uk

**Evidence:**
- Application loads successfully on personal networks (home broadband)
- Application fails to load on Go North East corporate network
- No console errors suggest network-level blocking (not application error)

---

## Alternative URLs (If "breakdowns" is problematic)

If the firewall flags "breakdowns" as a security keyword, we can use alternative subdomains:

- **ops.gobarry.co.uk** (Operations Dashboard)
- **fleet.gobarry.co.uk** (Fleet Management)
- **guide.gobarry.co.uk** (Breakdown Guide)

Please advise if a rename would expedite approval.

---

## Business Justification

### Current Usage
- **9 active supervisors** across all Go North East depots
- **Daily usage** during operational hours (04:00 - 02:00)
- **Critical for compliance** with safety procedures

### Benefits
- Faster breakdown resolution (avg 15 minutes saved per incident)
- Consistent safety procedures across all depots
- Digital audit trail for regulatory compliance
- Reduced paper-based processes

### Cost of Blocking
- Supervisors must use personal devices (security risk)
- Access via mobile data (unreliable in depot locations)
- Delay in accessing critical safety information

---

## Testing After Whitelist

Once domains are whitelisted, I will:

1. Test from multiple depot locations
2. Verify all API endpoints are accessible
3. Confirm real-time data synchronization
4. Document any remaining issues

**Test URL:** https://breakdowns.gobarry.co.uk/diagnostic.html
(This page will show exactly which resources are loading/blocked)

---

## Contact Information

**Technical Contact:**
Anthony Gair
Email: anthony.gair@gonortheast.co.uk
Phone: [Your phone number]

**Business Sponsor:**
[Operations Manager Name]
Department: Operations

---

## Appendix: IP Addresses (If Domain Whitelisting Not Supported)

If your firewall requires IP-based whitelisting instead of domain names:

**Pixelish Hosting (breakdowns.gobarry.co.uk):**
- IP: 85.234.151.224 (or check current DNS)

**Supabase (oieliubbvvdzhzvikzal.supabase.co):**
- IP Range: Supabase uses AWS dynamic IPs (domain whitelisting required)
- Alternative: Allow all *.supabase.co traffic

---

## Security Review

This application has been:
- ✅ Developed internally by Go North East
- ✅ Hosted on company-controlled infrastructure (gobarry.co.uk domain)
- ✅ Protected with authentication (no public access)
- ✅ Encrypted communications (HTTPS/TLS)
- ✅ Rate-limited to prevent abuse
- ✅ No external tracking or advertising scripts
- ✅ GDPR compliant data handling

---

**Approval Requested By:** [Date needed]
**Implementation Window:** Any time (no user disruption)

Thank you for your assistance in enabling this critical business application.
