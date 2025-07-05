# Email Service Setup Guide
## Roadworks Manager V2 - Email Configuration

### 1. Gmail/Google Workspace Setup (Recommended)

#### A. Enable 2-Factor Authentication
1. Go to your Google Account settings
2. Enable 2-Factor Authentication if not already enabled

#### B. Generate App Password
1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Navigate to **Security** → **2-Step Verification**
3. Scroll down to **App passwords**
4. Select **Mail** and **Custom name** (e.g., "Go BARRY Reports")
5. Copy the 16-character app password
6. Use this password in `SMTP_PASS` environment variable

#### C. Update Environment Variables
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@company.com
SMTP_PASS=your_16_character_app_password
SMTP_FROM=no-reply@gobarry.co.uk
```

### 2. Alternative SMTP Services

#### A. Microsoft Outlook/Office 365
```bash
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@company.com
SMTP_PASS=your_password
```

#### B. SendGrid (Transactional Email)
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key
```

#### C. Amazon SES
```bash
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_ses_access_key
SMTP_PASS=your_ses_secret_key
```

### 3. Test Email Configuration

#### A. Backend Test Script
```javascript
// Run from backend directory
npm run test:email

// Or manually test
node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransporter({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'your_email@company.com',
    pass: 'your_app_password'
  }
});

transporter.sendMail({
  from: 'no-reply@gobarry.co.uk',
  to: 'test@gobarry.co.uk',
  subject: 'Go BARRY - Email Test',
  text: 'Email configuration successful!'
}).then(info => {
  console.log('Email sent:', info.messageId);
}).catch(err => {
  console.error('Email error:', err);
});
"
```

#### B. API Test Endpoint
```bash
# Test report generation endpoint
curl -X POST \
  -H "Content-Type: application/json" \
  -H "x-supervisor: AG003" \
  -d '{"type": "test", "recipients": ["test@gobarry.co.uk"]}' \
  https://your-backend-url/api/roadworks-v2/reports/generate
```

### 4. Production Email Recipients

#### A. Daily Reports (00:15)
```bash
REPORT_RECIPIENTS=operations@gonortheast.co.uk,control@gonortheast.co.uk
```

#### B. Weekly Reports (Sunday 08:00)
```bash
WEEKLY_REPORT_RECIPIENTS=operations@gonortheast.co.uk,management@gonortheast.co.uk
```

#### C. Critical Alerts
```bash
ADMIN_EMAIL=admin@gobarry.co.uk
```

### 5. Email Templates

#### A. Daily Start of Service Report
- **Subject**: `Go BARRY - Start of Service Report - [Date]`
- **Format**: PDF attachment with active roadworks and diversions
- **Recipients**: Operations team, Control room
- **Schedule**: Daily at 00:15

#### B. Weekly Summary Report
- **Subject**: `Go BARRY - Weekly Roadworks Summary - Week [Number]`
- **Format**: PDF with analytics and performance metrics
- **Recipients**: Operations team, Management
- **Schedule**: Sunday at 08:00

#### C. Critical Action Alerts
- **Subject**: `Go BARRY - Critical Action Alert - [Supervisor]`
- **Format**: HTML email with action details
- **Recipients**: Admin team
- **Trigger**: Immediate when critical action logged

### 6. Security Considerations

#### A. Email Authentication
- Use app passwords, not main account passwords
- Rotate passwords every 90 days
- Monitor for unauthorized access

#### B. Content Security
- No sensitive data in email content
- PDF reports password-protected if containing sensitive info
- Use secure attachment methods

#### C. Compliance
- Include unsubscribe links for non-operational emails
- Follow GDPR guidelines for data in emails
- Log all email sends for audit trail

### 7. Troubleshooting

#### A. Common Issues
```bash
# Error: Authentication failed
# Solution: Check app password, enable 2FA

# Error: Connection timeout
# Solution: Check firewall, verify SMTP host/port

# Error: Message rejected
# Solution: Check sender domain, SPF/DKIM records
```

#### B. Testing Commands
```bash
# Test SMTP connection
telnet smtp.gmail.com 587

# Test DNS resolution
nslookup smtp.gmail.com

# Check email logs
tail -f /var/log/mail.log
```

### 8. Monitoring and Alerts

#### A. Email Delivery Monitoring
- Track bounce rates
- Monitor delivery confirmations
- Set up alerts for failed sends

#### B. Performance Metrics
- Email generation time < 30 seconds
- Delivery success rate > 99%
- Report accuracy validation

### 9. Backup Email Configuration

#### A. Secondary SMTP Server
```bash
# Fallback configuration
SMTP_BACKUP_HOST=smtp.outlook.com
SMTP_BACKUP_PORT=587
SMTP_BACKUP_USER=backup@gobarry.co.uk
SMTP_BACKUP_PASS=backup_app_password
```

#### B. Emergency Contacts
- **Technical Issues**: anthony.gair@gobarry.co.uk
- **Operations**: operations@gonortheast.co.uk
- **Management**: management@gonortheast.co.uk

---

## Quick Setup Checklist

- [ ] Generate Gmail app password
- [ ] Update environment variables
- [ ] Test email sending
- [ ] Configure recipient lists
- [ ] Set up monitoring
- [ ] Test report generation
- [ ] Verify PDF attachments
- [ ] Configure backup SMTP
- [ ] Set up alerts
- [ ] Document for operations team