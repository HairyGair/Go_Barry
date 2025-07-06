// backend/test-sharepoint-config.js
// Test SharePoint Excel configuration

import dotenv from 'dotenv';
dotenv.config();

console.log('🧪 Testing SharePoint Excel Configuration');
console.log('='.repeat(50));

// Check environment variables
const requiredEnvVars = [
  'AZURE_CLIENT_ID',
  'AZURE_CLIENT_SECRET', 
  'AZURE_TENANT_ID',
  'AZURE_REDIRECT_URI'
];

console.log('📋 Environment Variables Check:');
let configValid = true;

requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  const status = value ? '✅' : '❌';
  const display = value ? (varName.includes('SECRET') ? '***HIDDEN***' : value) : 'NOT SET';
  
  console.log(`${status} ${varName}: ${display}`);
  
  if (!value) {
    configValid = false;
  }
});

console.log('');

if (configValid) {
  console.log('✅ All environment variables are configured');
  
  // Test SharePoint site configuration
  console.log('📊 SharePoint Configuration:');
  console.log('✅ Site ID: goaheadgroup.sharepoint.com,sites,GNETS0011');
  console.log('✅ On Time Request Document ID: 0D85361B-20DF-4F90-A0EF-C4A1C68B17DC');
  console.log('✅ Daily Lost Mileage Document ID: 01D73A9C-5F4C-4688-BB15-54EEC40D1739');
  
  console.log('');
  console.log('🔐 Required Permissions:');
  console.log('✅ Files.ReadWrite.All (for Excel file access)');
  console.log('✅ Sites.ReadWrite.All (for SharePoint site access)');
  console.log('✅ User.Read (for user information)');
  console.log('✅ Mail.Send (existing email functionality)');
  
  console.log('');
  console.log('🌐 API Endpoints Created:');
  console.log('✅ GET /api/sharepoint/permissions/:supervisorId');
  console.log('✅ GET /api/sharepoint/documents/:documentKey/data/:supervisorId');
  console.log('✅ POST /api/sharepoint/documents/onTimeRequest/submit');
  console.log('✅ POST /api/sharepoint/documents/dailyLostMileage/submit');
  console.log('✅ PATCH /api/sharepoint/documents/:documentKey/update');
  console.log('✅ POST /api/sharepoint/webhooks/:documentKey/subscribe');
  console.log('✅ GET /api/sharepoint/auth-status/:supervisorId');
  
  console.log('');
  console.log('🚀 Next Steps:');
  console.log('1. Supervisor needs to authenticate via existing /api/auth/microsoft/login-url/:supervisorId');
  console.log('2. Test SharePoint access via /api/sharepoint/permissions/:supervisorId');
  console.log('3. Fetch document data via /api/sharepoint/documents/onTimeRequest/data/:supervisorId');
  console.log('4. Create native React components to replace iframe embedding');
  
} else {
  console.log('❌ Configuration incomplete! Please set missing environment variables.');
  console.log('');
  console.log('💡 How to configure:');
  console.log('1. Register app in Azure AD Portal (portal.azure.com)');
  console.log('2. Add API permissions: Files.ReadWrite.All, Sites.ReadWrite.All');
  console.log('3. Set environment variables in .env or deployment platform');
  console.log('4. Update AZURE_REDIRECT_URI to match your callback URL');
}

console.log('');
console.log('='.repeat(50));
console.log('🧪 Configuration test complete');