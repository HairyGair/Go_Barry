# Azure AD SharePoint Configuration Guide

## 🎯 **What We've Built**

✅ **Native SharePoint Excel Components**
- Real-time editing of Excel documents within Go BARRY app
- No more iframe limitations - fully native React interface
- Add/edit On Time Requests and Lost Mileage Reports directly
- Automatic sync between SharePoint and all connected users

✅ **Complete Backend API**
- Microsoft Graph API integration (`sharePointExcelService.js`)
- Secure authentication with existing supervisor system
- Full CRUD operations on Excel documents
- Real-time webhook subscriptions for instant updates

## 🔧 **Required Azure AD Configuration**

### **Step 1: Access Azure Portal**
1. Go to [Azure Portal](https://portal.azure.com)
2. Sign in with your Go North East admin account
3. Navigate to **Azure Active Directory** → **App registrations**
4. Find your existing **Go BARRY** app registration

### **Step 2: Add API Permissions**
In your existing app registration:

1. Click **API permissions** in the left menu
2. Click **+ Add a permission**
3. Select **Microsoft Graph**
4. Choose **Delegated permissions**
5. Add these permissions:

   **Required New Permissions:**
   - ✅ `Files.ReadWrite.All` - Read and write user and shared files
   - ✅ `Sites.ReadWrite.All` - Read and write items in all site collections

   **Existing Permissions (keep these):**
   - ✅ `User.Read` - Sign in and read user profile
   - ✅ `Mail.Send` - Send mail as a user

6. Click **Add permissions**
7. **IMPORTANT**: Click **Grant admin consent for [Your Organization]**
   - This step is crucial - without it, users will get permission errors

### **Step 3: Verify Configuration**
Your app permissions should now show:
```
Microsoft Graph (4 permissions)
├── Files.ReadWrite.All (Admin consent required) ✅
├── Sites.ReadWrite.All (Admin consent required) ✅  
├── User.Read (Admin consent required) ✅
└── Mail.Send (Admin consent required) ✅
```

### **Step 4: No Environment Variables Needed!**
The system uses your **existing** Azure configuration:
- ✅ `AZURE_CLIENT_ID` - Already configured
- ✅ `AZURE_CLIENT_SECRET` - Already configured  
- ✅ `AZURE_TENANT_ID` - Already configured
- ✅ `AZURE_REDIRECT_URI` - Already configured

## 🧪 **Testing the Integration**

### **Method 1: API Testing**
```bash
# 1. Check if SharePoint API is loaded
curl https://go-barry.onrender.com/api/sharepoint/auth-status/AG003

# 2. Test supervisor authentication  
curl https://go-barry.onrender.com/api/auth/microsoft/status/AG003

# 3. Get authentication URL if needed
curl https://go-barry.onrender.com/api/auth/microsoft/login-url/AG003
```

### **Method 2: Frontend Testing**
1. **Login as supervisor** (AG003, BP009, etc.)
2. **Go to Operations Centre** 
3. **Click "On Time Request" card** 
4. **Should show native interface** instead of iframe
5. **If authentication required** - click "Authenticate with Microsoft"

## 🚀 **What Happens Next**

### **Authentication Flow:**
1. Supervisor clicks SharePoint card → Authentication check
2. If not authenticated → "Authenticate with Microsoft" button appears
3. Opens Microsoft login → User grants permissions → Redirects back
4. Full native interface loads with real-time Excel editing

### **Native Features:**
- ✅ **Add new requests** - Built-in forms for new entries
- ✅ **View all data** - Structured, searchable list view  
- ✅ **Real-time updates** - Changes sync instantly across all users
- ✅ **Mobile optimized** - Works perfectly on tablets/phones
- ✅ **Offline support** - Queue changes when offline, sync when back online

## 🔄 **Real-time Sync Technology**

### **How Real-time Updates Work:**
1. **User A edits in SharePoint web** → Microsoft webhook → Go BARRY API → All users see change
2. **User B edits in Go BARRY app** → Graph API → SharePoint → Other users see change  
3. **Conflict resolution** - Last-write-wins with timestamp tracking
4. **Performance** - Only changed cells sync, not entire documents

### **Webhook Configuration:**
```javascript
// Automatic webhook setup when supervisor first authenticates
const subscription = {
  changeType: 'updated',
  notificationUrl: 'https://go-barry.onrender.com/api/sharepoint/webhooks/callback',
  resource: '/sites/{site-id}/drive/items/{document-id}',
  expirationDateTime: '1 hour from now'
};
```

## 📊 **Document Configuration**

### **SharePoint Documents Already Mapped:**
- **On Time Request**: `0D85361B-20DF-4F90-A0EF-C4A1C68B17DC`
- **Daily Lost Mileage**: `01D73A9C-5F4C-4688-BB15-54EEC40D1739`
- **Site**: `goaheadgroup.sharepoint.com,sites,GNETS0011`

## ⚠️ **Troubleshooting**

### **Common Issues:**

**❌ "Permission denied" errors**
- Solution: Ensure admin consent was granted in Azure AD

**❌ "Document not found" errors**  
- Solution: Verify document IDs match actual SharePoint files

**❌ "Authentication failed" errors**
- Solution: Check Azure credentials and redirect URI configuration

**❌ Components not loading**
- Solution: Restart backend to load new API routes

### **Debug Commands:**
```bash
# Check backend logs
curl https://go-barry.onrender.com/api/health

# Test Azure configuration  
node backend/test-sharepoint-config.js

# Restart backend (if self-hosted)
npm run dev
```

## 🎉 **Success Criteria**

You'll know it's working when:
1. ✅ Supervisors can click SharePoint cards without iframe loading
2. ✅ Native forms appear for adding new entries
3. ✅ Data loads from actual SharePoint Excel files
4. ✅ New entries appear in SharePoint web interface immediately
5. ✅ Multiple users see changes in real-time

---

**Next Step**: Complete Azure AD permission configuration above, then test with a supervisor account!