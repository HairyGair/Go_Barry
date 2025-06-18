# Microsoft 365 Integration - Supervisor Login Setup

## 🎯 Overview

The system now uses **supervisor Microsoft accounts** (@gonortheast.co.uk) for authentication. Supervisors log in with their work accounts, and emails are sent from their accounts.

## 1. Azure App Registration Setup

### Step 1: Create Azure App Registration
1. Go to **Azure Portal** → **App registrations** → **New registration**
2. **Name**: `Go BARRY Traffic Intelligence`
3. **Supported account types**: **Accounts in this organizational directory only (Single tenant)**
4. **Redirect URI**: 
   - Platform: **Web**
   - URI: `https://go-barry.onrender.com/api/auth/microsoft/callback`
5. Click **Register**

### Step 2: Configure API Permissions (Delegated)
1. Go to **API permissions** → **Add a permission**
2. Select **Microsoft Graph** → **Delegated permissions**
3. Add these permissions:
   - `Mail.Send` - Send mail on behalf of signed-in user
   - `User.Read` - Read signed-in user's profile
   - `MailboxSettings.Read` - Read user mailbox settings
4. Click **Grant admin consent** (requires tenant admin)

### Step 3: Create Client Secret
1. Go to **Certificates & secrets** → **New client secret**
2. Description: `Go BARRY Supervisor Auth`
3. Expires: 24 months (or as per policy)
4. Click **Add** and **copy the secret value immediately**

### Step 4: Note Required Values
Copy these values for environment variables:
- **Application (client) ID**
- **Directory (tenant) ID** 
- **Client secret value** (from step 3)

## 2. Environment Variables

Add to your backend `.env` file:

```env
# Microsoft 365 Configuration (Required)
AZURE_TENANT_ID=your-tenant-id-here
AZURE_CLIENT_ID=your-client-id-here  
AZURE_CLIENT_SECRET=your-client-secret-here
AZURE_REDIRECT_URI=https://go-barry.onrender.com/api/auth/microsoft/callback
```

## 3. How Supervisor Authentication Works

### Login Flow:
1. **Supervisor clicks "Login with Microsoft"** in CreateRoadworkModal
2. **Popup opens** to Microsoft login page
3. **Supervisor enters @gonortheast.co.uk credentials**
4. **Microsoft redirects** back to Go BARRY with authorization code
5. **Go BARRY exchanges code** for access token
6. **Token stored** for supervisor's session
7. **Emails sent from supervisor's account**

### Key Benefits:
✅ **Real authentication** - Uses actual work accounts  
✅ **Email authenticity** - Emails come from supervisor's address  
✅ **Better audit trail** - Clear who sent what  
✅ **Secure** - No shared service accounts  
✅ **Domain enforcement** - Only @gonortheast.co.uk accounts allowed  

## 4. Testing the Integration

### Check API Endpoints:
```bash
# Get Microsoft login URL for supervisor
GET /api/auth/microsoft/login-url/AG003

# Check supervisor login status
GET /api/auth/microsoft/status/AG003

# Send test email (requires supervisor to be logged in)
POST /api/auth/microsoft/test-email
{
  "supervisorId": "AG003",
  "recipient": "test@gonortheast.co.uk"
}
```

### Test Flow:
1. **Open CreateRoadworkModal**
2. **Check login status** - Should show "Microsoft login required"
3. **Click "Login with Microsoft"** - Popup should open
4. **Login with @gonortheast.co.uk account**
5. **Popup closes** - Status should show "Logged in as [Name]"
6. **Create roadwork** - Emails should send from supervisor's account

## 5. Azure Permissions Explained

| Permission | Type | Purpose |
|------------|------|---------|
| `Mail.Send` | Delegated | Send emails from supervisor's mailbox |
| `User.Read` | Delegated | Get supervisor's name, email, job title |
| `MailboxSettings.Read` | Delegated | Read timezone and other settings |

## 6. Security Considerations

### Domain Restriction:
- **Only @gonortheast.co.uk accounts** can authenticate
- System validates email domain on login
- Rejects external Microsoft accounts

### Token Management:
- **Tokens stored in memory** (not persistent across restarts)
- **Automatic refresh** when tokens expire
- **1-hour token expiration** with refresh capability
- **Supervisor can log out** to revoke access

### Audit Trail:
- **All emails logged** with supervisor who sent them
- **Login/logout events** tracked
- **Failed attempts** monitored

## 7. Troubleshooting

### Common Issues:

**"Only @gonortheast.co.uk accounts are allowed"**
- Supervisor used personal Microsoft account
- Solution: Use work email address

**"Microsoft login expired. Please log in again"**
- Access token expired and refresh failed
- Solution: Click "Login with Microsoft" again

**"Supervisor not logged in to Microsoft 365"**
- Supervisor hasn't authenticated yet
- Solution: Complete Microsoft login before creating roadworks

**Popup blocked**
- Browser blocking popup windows
- Solution: Allow popups for gobarry.co.uk

### Debug Mode:
- Check browser console for authentication errors
- Monitor backend logs for token exchange issues
- Use `/api/auth/microsoft/status/:supervisorId` to check login state

## 8. Production Deployment

### Render.com Environment Variables:
```env
AZURE_TENANT_ID=your-real-tenant-id
AZURE_CLIENT_ID=your-real-client-id
AZURE_CLIENT_SECRET=your-real-secret
AZURE_REDIRECT_URI=https://go-barry.onrender.com/api/auth/microsoft/callback
```

### Azure Redirect URI:
Make sure this EXACT URL is configured in Azure:
`https://go-barry.onrender.com/api/auth/microsoft/callback`

### Frontend Integration:
The CreateRoadworkModal automatically:
- ✅ Checks Microsoft login status on open
- ✅ Shows login button if needed
- ✅ Handles popup authentication flow
- ✅ Displays supervisor's authenticated name/email
- ✅ Prevents roadwork creation without login

## 9. Success Criteria

When properly configured:
- ✅ Supervisors see their Microsoft login status in modal
- ✅ Login popup opens Microsoft authentication
- ✅ Only @gonortheast.co.uk accounts accepted
- ✅ Status shows "Logged in as [Supervisor Name]"
- ✅ Roadwork emails sent from supervisor's email address
- ✅ Recipients see emails from actual supervisor, not service account
- ✅ Full audit trail of who sent what email when

This approach provides **enterprise-grade security** while maintaining **ease of use** for supervisors!