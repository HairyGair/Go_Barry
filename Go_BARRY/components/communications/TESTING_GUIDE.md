# Email Integration Testing Guide

## 🧪 Testing Overview

The Email Integration component has been fully integrated with the Go BARRY platform. Here are the different ways to test it:

## 1. Backend API Testing

### Option A: Node.js Test Script
```bash
cd /Users/anthony/Go BARRY App/backend
node test-communications-api.js
```

This will test all API endpoints including:
- Health check
- Email templates
- Distribution lists
- Email validation
- Email sending
- VoIP endpoints

### Option B: Web-based Test Page
1. Make sure the backend is running:
   ```bash
   cd backend
   npm start
   ```

2. Open in browser:
   ```
   http://localhost:3001/public/test-email-integration.html
   ```
   
   Or for production:
   ```
   https://go-barry.onrender.com/public/test-email-integration.html
   ```

3. Click through each test button to verify functionality

### Option C: Direct API Testing with cURL
```bash
# Test health endpoint
curl -X GET https://go-barry.onrender.com/api/communications/health \
  -H "supervisor-id: supervisor003" \
  -H "supervisor-name: Anthony Gair"

# Get email templates
curl -X GET https://go-barry.onrender.com/api/communications/email/templates \
  -H "supervisor-id: supervisor003" \
  -H "supervisor-name: Anthony Gair"

# Send test email
curl -X POST https://go-barry.onrender.com/api/communications/email/send \
  -H "Content-Type: application/json" \
  -H "supervisor-id: supervisor003" \
  -H "supervisor-name: Anthony Gair" \
  -d '{
    "to": ["test@example.com"],
    "subject": "Test Email",
    "body": "This is a test email from Go BARRY",
    "priority": "normal"
  }'
```

## 2. Frontend Component Testing

### In the Go BARRY App:
1. Start the Expo development server:
   ```bash
   cd Go_BARRY
   npm start
   ```

2. Open in web browser (press 'w' in Expo CLI)

3. Login as a supervisor (e.g., AG003)

4. Navigate to the Supervisor Screen

5. Click on "Email Integration" in the sidebar (or press Ctrl+5)

6. Test the following features:
   - **Compose Tab**: 
     - Click quick access buttons
     - Add/remove recipients
     - Change priority
     - Toggle receipts
     - Send test email
   - **Templates Tab**: View available templates
   - **Lists Tab**: View distribution lists
   - **Sent Tab**: View sent emails after sending
   - **Outlook Web Access**: Click button to open Outlook

### Component States to Test:
- [x] Empty states (no templates, no sent emails)
- [x] Loading states (when sending email)
- [x] Error states (invalid recipients, network errors)
- [x] Success states (email sent confirmation)

## 3. Integration Testing Checklist

### ✅ Backend Checks:
- [ ] Communications API route is registered at `/api/communications`
- [ ] All endpoints return proper JSON responses
- [ ] Supervisor authentication headers are validated
- [ ] Email validation works correctly
- [ ] Message queuing system accepts emails

### ✅ Frontend Checks:
- [ ] Component loads without errors
- [ ] API calls include proper supervisor headers
- [ ] Templates and lists fetch on component mount
- [ ] Email sending shows loading state
- [ ] Success/error alerts display correctly
- [ ] Sent emails appear in history
- [ ] Outlook Web button opens new window/tab

### ✅ End-to-End Flow:
1. [ ] Login as supervisor
2. [ ] Navigate to Email Integration
3. [ ] Add recipients using quick access
4. [ ] Enter subject and message
5. [ ] Select priority
6. [ ] Send email
7. [ ] Verify success message
8. [ ] Check sent emails tab
9. [ ] Open Outlook Web Access

## 4. Expected Behaviors

### Successful Email Send:
- Loading spinner appears
- API returns messageId and status
- Success alert shows
- Form resets
- Email appears in sent list

### Failed Email Send:
- Loading spinner appears
- API returns error
- Error alert shows with message
- Form retains data for retry

### Outlook Web Access:
- **On Web**: Opens new window/tab to Outlook
- **On Mobile**: Shows modal explaining desktop-only feature

## 5. Troubleshooting

### Common Issues:

1. **CORS Errors**:
   - Check backend is running
   - Verify API URL is correct
   - Check CORS headers in backend

2. **Authentication Errors**:
   - Ensure supervisor headers are sent
   - Check supervisor is logged in
   - Verify badge ID is valid

3. **Email Not Sending**:
   - Check all required fields filled
   - Verify recipient emails are valid
   - Check backend logs for errors

4. **Templates Not Loading**:
   - Check API endpoint is accessible
   - Verify backend emailService is initialized
   - Check network tab for errors

## 6. Performance Metrics

Expected performance:
- Component load: < 1s
- API response: < 2s
- Email send: < 3s
- Outlook Web open: < 1s

## 7. Next Steps

After testing is complete:
1. Deploy to production
2. Test with real Microsoft 365 accounts
3. Configure actual email delivery (currently queued only)
4. Add email tracking and analytics
5. Implement attachment support

## Notes

- The current implementation uses a web embed approach for Outlook
- Emails are queued but not actually sent (pending Microsoft Graph setup)
- Templates and distribution lists are currently hard-coded examples
- Full Microsoft 365 integration can be added later