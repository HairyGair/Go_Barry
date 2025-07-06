# SharePoint Excel Integration Setup Guide

## ✅ **Phase 1: Azure AD Configuration (COMPLETED)**

### Backend Implementation Status:
- ✅ Microsoft Graph Auth Service (`microsoftGraphAuth.js`)
- ✅ SharePoint Excel Service (`sharePointExcelService.js`) 
- ✅ API Routes (`sharePointExcelAPI.js`)
- ✅ Extended existing auth service with SharePoint permissions
- ✅ All routes registered in main server

## 🔧 **Phase 2: Azure AD App Registration (REQUIRED)**

You need to configure these in Azure Portal:

### 1. Azure AD App Registration
1. Go to [Azure Portal](https://portal.azure.com) → Azure Active Directory → App registrations
2. Find your existing Go BARRY app registration
3. Add these **API Permissions**:
   - Microsoft Graph → Delegated permissions:
     - `Files.ReadWrite.All` (Access user files)
     - `Sites.ReadWrite.All` (Access SharePoint sites)
     - `User.Read` (Already configured)
     - `Mail.Send` (Already configured)

### 2. Environment Variables Setup
Update these in your deployment environment (Render.com):

```bash
# Already configured:
AZURE_CLIENT_ID=your-app-registration-client-id
AZURE_CLIENT_SECRET=your-client-secret
AZURE_TENANT_ID=your-tenant-id
AZURE_REDIRECT_URI=https://go-barry.onrender.com/api/auth/microsoft/callback

# No additional variables needed - uses existing config!
```

## 📊 **Phase 3: Document Configuration (COMPLETED)**

### SharePoint Documents Configured:
1. **On Time Request**: `0D85361B-20DF-4F90-A0EF-C4A1C68B17DC`
2. **Daily Lost Mileage**: `01D73A9C-5F4C-4688-BB15-54EEC40D1739`

## 🌐 **Phase 4: API Endpoints (COMPLETED)**

### Available Endpoints:
- `GET /api/sharepoint/auth-status/:supervisorId` - Check authentication
- `GET /api/sharepoint/permissions/:supervisorId` - Test SharePoint access
- `GET /api/sharepoint/documents/onTimeRequest/data/:supervisorId` - Get On Time data
- `GET /api/sharepoint/documents/dailyLostMileage/data/:supervisorId` - Get Lost Mileage data
- `POST /api/sharepoint/documents/onTimeRequest/submit` - Add new request
- `POST /api/sharepoint/documents/dailyLostMileage/submit` - Add new report
- `PATCH /api/sharepoint/documents/:documentKey/update` - Update cells

## 🔄 **Phase 5: Real-time Updates (COMPLETED)**

### Webhook Support:
- `POST /api/sharepoint/webhooks/:documentKey/subscribe` - Setup real-time notifications
- `POST /api/sharepoint/webhooks/callback` - Handle SharePoint change notifications

## 🎯 **Next Steps for Frontend:**

### 1. Authentication Flow
```javascript
// Check auth status
const authResponse = await fetch(`/api/sharepoint/auth-status/${supervisorId}`);

// If not authenticated, redirect to login
if (!authResponse.isAuthenticated) {
  window.location.href = authResponse.loginUrl;
}
```

### 2. Get Document Data
```javascript
// Get On Time Request data
const onTimeData = await fetch(`/api/sharepoint/documents/onTimeRequest/data/${supervisorId}`);

// Structure returned:
{
  success: true,
  requests: [
    {
      id: 1,
      driverName: "John Smith",
      badge: "DR001", 
      shift: "Early Turn",
      route: "21",
      scheduledFinish: "15:00",
      requestedFinish: "14:30",
      reason: "Medical appointment",
      status: "Pending"
    }
  ],
  totalCount: 1,
  lastModified: "2025-07-06T10:30:00Z"
}
```

### 3. Submit New Data
```javascript
// Submit new On Time Request
const newRequest = await fetch('/api/sharepoint/documents/onTimeRequest/submit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    supervisorId: 'AG003',
    driverName: 'John Smith',
    badge: 'DR001',
    shift: 'Early Turn',
    route: '21',
    scheduledFinish: '15:00',
    requestedFinish: '14:30',
    reason: 'Medical appointment'
  })
});
```

## 🚀 **Benefits Over iframe Embedding:**

✅ **Native editing** - Custom forms and interfaces  
✅ **Real-time sync** - Changes appear instantly across all users  
✅ **Better mobile UX** - Optimized for touch devices  
✅ **Offline support** - Queue changes when offline  
✅ **Custom validation** - Business rule enforcement  
✅ **Integration** - Connect with Go BARRY's supervisor system  

## 🔐 **Security Features:**

✅ **Supervisor-based auth** - Uses existing supervisor authentication  
✅ **Scoped permissions** - Only access specific SharePoint documents  
✅ **Token management** - Automatic refresh and secure storage  
✅ **Audit logging** - Track all document changes  

## ⚡ **Performance:**

✅ **Structured data** - Parsed Excel data instead of full document rendering  
✅ **Selective updates** - Only sync changed cells  
✅ **Caching** - Smart data caching with real-time invalidation  

---

**Status**: Backend implementation complete, ready for Azure AD permission configuration and frontend development.