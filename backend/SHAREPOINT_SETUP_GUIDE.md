# SharePoint Integration Setup Guide for Go BARRY

## Overview
The Go BARRY app has full SharePoint integration capability built-in. This guide will help you configure it to connect to your Go Ahead Group SharePoint at: https://goaheadgroup.sharepoint.com

## 🔧 Required Environment Variables

Add these to your `.env` file (or Render.com environment variables):

### Microsoft Azure App Registration
```bash
# Microsoft Graph API credentials
MICROSOFT_CLIENT_ID=your_azure_app_client_id
MICROSOFT_CLIENT_SECRET=your_azure_app_client_secret
MICROSOFT_TENANT_ID=your_tenant_id_or_goaheadgroup.onmicrosoft.com
MICROSOFT_REDIRECT_URI=https://go-barry.onrender.com/auth/microsoft/callback

# SharePoint specific configuration
SHAREPOINT_TEAM_SITE_URL=https://goaheadgroup.sharepoint.com/teams/YourTeamSite
SHAREPOINT_SITE_ID=your_site_id
SHAREPOINT_DRIVE_ID=your_drive_id
SHAREPOINT_REPORTS_LIBRARY_ID=your_reports_library_id
```

## 📋 Setup Steps

### Step 1: Azure App Registration
You need to register an app in Azure AD with your Go Ahead Group admin:

1. **Go to Azure Portal**: https://portal.azure.com
2. **Navigate to**: Azure Active Directory > App registrations > New registration
3. **App Details**:
   - Name: `Go BARRY - Traffic Intelligence Platform`
   - Supported account types: `Accounts in this organizational directory only`
   - Redirect URI: `Web` → `https://go-barry.onrender.com/auth/microsoft/callback`

4. **API Permissions** (Request these from your IT admin):
   ```
   Microsoft Graph API:
   - User.Read (to identify the logged-in user)
   - Sites.Read.All (to access SharePoint sites)
   - Files.Read.All (to read files from SharePoint)
   - Files.ReadWrite.All (to upload files to SharePoint)
   ```

5. **Generate Client Secret**:
   - Go to "Certificates & secrets"
   - Click "New client secret"
   - Copy the secret value (you won't see it again!)

### Step 2: Get SharePoint Site Information
To get the required SharePoint IDs, use these Microsoft Graph API calls:

#### Get Site ID:
```bash
GET https://graph.microsoft.com/v1.0/sites/goaheadgroup.sharepoint.com:/teams/YourTeamSite
```

#### Get Drive ID:
```bash
GET https://graph.microsoft.com/v1.0/sites/{site-id}/drives
```

#### Get Document Libraries:
```bash
GET https://graph.microsoft.com/v1.0/sites/{site-id}/lists?$filter=baseTemplate eq 101
```

### Step 3: Configure Environment Variables
Update your Render.com environment variables or local `.env` file with the values obtained above.

## 🚀 Available Features

Once configured, Go BARRY users will be able to:

### 📁 **Document Management**
- Browse SharePoint document libraries
- Navigate folders and subfolders
- View recent files
- Download files directly from SharePoint

### 🔍 **Search & Discovery**
- Search across all SharePoint documents
- Filter by file type
- Quick access to recent files

### 📤 **File Upload**
- Upload traffic reports directly to SharePoint
- Automatic folder organization by date
- Metadata tagging (created by supervisor, department, etc.)

### 📊 **Automated Reporting**
- Store operational reports in SharePoint
- Automatic backup of traffic incident reports
- Organized folder structure: `/Reports/YYYY/MM/`

## 🔐 Security Features

- **OAuth 2.0 Authentication**: Users login with their Go Ahead Group credentials
- **Token-based Access**: No passwords stored, uses secure access tokens
- **Permissions-based**: Only accesses what the user has permission to see
- **Activity Logging**: All SharePoint actions logged for audit purposes

## 📱 User Experience

### Access SharePoint:
1. Open Go BARRY app
2. Go to Communications Hub
3. Click "SharePoint Access"
4. Login with Go Ahead Group credentials
5. Browse, search, and upload files

### Automatic Integration:
- Traffic reports automatically saved to SharePoint
- Incident reports backed up to designated folders
- Supervisor activity logs stored securely

## 🛠 Testing the Integration

Once configured, test with these endpoints:

### Health Check:
```bash
GET https://go-barry.onrender.com/api/communications/health
```

### SharePoint Site Info:
```bash
GET https://go-barry.onrender.com/api/communications/sharepoint/site-info
Authorization: Bearer {access_token}
```

### List Libraries:
```bash
GET https://go-barry.onrender.com/api/communications/sharepoint/libraries
Authorization: Bearer {access_token}
```

## 🎯 Next Steps

1. **Contact IT Admin**: Request Azure app registration with required permissions
2. **Get Credentials**: Obtain Client ID, Client Secret, and Tenant ID
3. **Configure Environment**: Add environment variables to Render.com
4. **Test Integration**: Verify connection using the health check endpoints
5. **Train Users**: Show supervisors how to access SharePoint through Go BARRY

## 📞 Support

If you encounter issues:
1. Check environment variables are correctly set
2. Verify Azure app permissions are granted
3. Test API endpoints directly
4. Check backend logs for authentication errors

The SharePoint integration is production-ready and waiting for configuration! 🚀