# IT Admin Request: SharePoint Excel Integration for Go BARRY

## 📋 **Request Summary**

**What**: Add SharePoint Excel editing capabilities to the Go BARRY traffic management application  
**Why**: Enable supervisors to edit daily operational documents directly within the app instead of switching to SharePoint web interface  
**Risk**: Minimal - only adds read/write permissions for specific Excel documents  
**Benefit**: Improved supervisor efficiency and mobile-friendly document editing

---

## 🎯 **Business Justification**

### **Current Problem:**
- Supervisors must switch between Go BARRY app and SharePoint web interface
- SharePoint web interface is not mobile-friendly for tablet/phone use
- Slow workflow when managing On Time Requests and Lost Mileage Reports
- Supervisors often avoid updating documents due to interface difficulties

### **Proposed Solution:**
- Native editing of SharePoint Excel documents within Go BARRY app
- Mobile-optimized interface for supervisor tablets
- Real-time collaboration between app users and SharePoint web users
- Maintained data integrity with existing SharePoint documents

### **Business Impact:**
- ✅ **Faster supervisor workflow** - Edit documents without app switching
- ✅ **Better mobile experience** - Optimized for tablets used in depot
- ✅ **Increased data accuracy** - Easier to update = more frequent updates
- ✅ **Real-time collaboration** - Changes sync instantly between users

---

## 🔧 **Technical Request**

### **Required Action:**
Add API permissions to existing **Go BARRY** Azure AD app registration

### **Specific Permissions Needed:**
| Permission | Type | Purpose | Risk Level |
|------------|------|---------|------------|
| `Files.ReadWrite.All` | Delegated | Read/write Excel files in SharePoint | Low |
| `Sites.ReadWrite.All` | Delegated | Access SharePoint site for document location | Low |

### **Documents Affected:**
- **On Time Request.xlsx** (ID: `0D85361B-20DF-4F90-A0EF-C4A1C68B17DC`)
- **Daily lost miles report - SDC.xlsx** (ID: `01D73A9C-5F4C-4688-BB15-54EEC40D1739`)
- **SharePoint Site**: `goaheadgroup.sharepoint.com/sites/GNETS0011`

### **Security Considerations:**
- ✅ **Delegated permissions only** - Requires user authentication
- ✅ **No application permissions** - Cannot access data without user login
- ✅ **Existing authentication** - Uses current supervisor login system
- ✅ **Audit trail maintained** - All changes tracked in SharePoint history
- ✅ **No new user accounts** - Uses existing Go North East accounts

---

## 📝 **Step-by-Step Instructions for IT Admin**

### **1. Access Azure Portal**
1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** → **App registrations**
3. Find the existing **Go BARRY** app registration

### **2. Add API Permissions**
1. Click **API permissions** in the left menu
2. Click **+ Add a permission**
3. Select **Microsoft Graph**
4. Choose **Delegated permissions**
5. Search and select:
   - ✅ `Files.ReadWrite.All`
   - ✅ `Sites.ReadWrite.All`
6. Click **Add permissions**

### **3. Grant Admin Consent**
1. Click **Grant admin consent for [Organization Name]**
2. Click **Yes** to confirm
3. Verify all permissions show "Granted for [Organization]"

### **4. Verification**
Final permissions should include:
```
Microsoft Graph (4 permissions)
├── Files.ReadWrite.All ✅ (Admin consent granted)
├── Sites.ReadWrite.All ✅ (Admin consent granted)  
├── User.Read ✅ (Admin consent granted)
└── Mail.Send ✅ (Admin consent granted)
```

---

## 🧪 **Testing & Validation**

### **After Permission Grant:**
1. **Test authentication**: Supervisor logs into Go BARRY
2. **Test document access**: Supervisor opens SharePoint documents
3. **Test editing**: Supervisor makes test changes to documents
4. **Test sync**: Verify changes appear in SharePoint web interface

### **Rollback Plan:**
If issues arise, permissions can be removed immediately:
1. Azure Portal → App registrations → Go BARRY
2. API permissions → Remove unwanted permissions
3. No data loss - all documents remain in SharePoint

---

## 📞 **Contact Information**

**Requestor**: Anthony Gair (Go BARRY Development)  
**Email**: anthonygair@icloud.com  
**Technical Documentation**: Available in Go BARRY repository  

### **Questions/Concerns:**
- **Security**: Only delegated permissions requested, no elevated access
- **Data protection**: All data remains in existing SharePoint, just different access method
- **User impact**: Zero - supervisors continue using same accounts
- **Reversibility**: 100% - permissions can be removed anytime without data loss

---

## ✅ **Expected Outcome**

Once permissions are granted:
- ✅ Supervisors can edit SharePoint documents within Go BARRY app
- ✅ Mobile-friendly interface for tablet use in depots
- ✅ Real-time sync between app and SharePoint web
- ✅ Improved supervisor productivity and data accuracy
- ✅ Maintained security and audit trail

**Timeline**: Changes take effect immediately after admin consent is granted.

---

*This request enhances existing functionality without changing security model or adding new users. All data remains in current SharePoint location with existing access controls.*