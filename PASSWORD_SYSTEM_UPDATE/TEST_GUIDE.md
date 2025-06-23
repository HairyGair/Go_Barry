# PASSWORD SYSTEM - TEST GUIDE

## 🧪 Testing Checklist

### 1. First-Time User Test
**User**: Alex Woodcock (or any supervisor except Barry)

- [ ] Open Go BARRY in incognito/private browser
- [ ] Click "Supervisor Login"
- [ ] Select "Alex Woodcock"
- [ ] Select any duty (e.g., "Duty 200")
- [ ] Enter any text in password field
- [ ] Click "Login"
- [ ] **Expected**: Password setup modal appears
- [ ] Set password (min 6 chars)
- [ ] Confirm password matches
- [ ] Click "Set Password"
- [ ] **Expected**: Login successful, modal closes

### 2. Existing User Test (Barry)
**User**: Barry Perryman

- [ ] Click "Supervisor Login"
- [ ] Select "Barry Perryman"
- [ ] Select any duty
- [ ] Enter password: "Barry123"
- [ ] Click "Login"
- [ ] **Expected**: Login successful (no setup modal)

### 3. Returning User Test
**User**: Alex Woodcock (after setting password)

- [ ] Refresh page or return later
- [ ] Click "Supervisor Login"
- [ ] Select "Alex Woodcock"
- [ ] Select duty
- [ ] Enter the password you created
- [ ] **Expected**: Login successful

### 4. Wrong Password Test
- [ ] Try logging in with wrong password
- [ ] **Expected**: Error message "Incorrect password"

### 5. Password Validation Test
Try setting these passwords in setup modal:

- [ ] "12345" → **Expected**: Error "Password must be at least 6 characters"
- [ ] "password" → **Expected**: Error "Please choose a stronger password"
- [ ] Mismatched passwords → **Expected**: Error "Passwords do not match"
- [ ] "alex2024" → **Expected**: Success

### 6. Change Password Test
After logging in:

- [ ] Open Supervisor Control panel
- [ ] Click "Change Password" button
- [ ] Enter current password
- [ ] Enter new password (different, 6+ chars)
- [ ] Confirm new password
- [ ] Click "Change Password"
- [ ] **Expected**: Success message
- [ ] Log out and log back in with new password
- [ ] **Expected**: Login works with new password

### 7. Session Persistence Test
- [ ] Log in as supervisor
- [ ] Refresh the page
- [ ] **Expected**: Still logged in
- [ ] Close browser, reopen
- [ ] **Expected**: Still logged in (session persists)

### 8. Multi-User Test
- [ ] Set up passwords for 2-3 supervisors
- [ ] Log in/out with different accounts
- [ ] **Expected**: Each has their own password

### 9. Cancel Operations Test
- [ ] Start password setup, click Cancel
- [ ] **Expected**: Returns to login, no password set
- [ ] Start password change, click Cancel
- [ ] **Expected**: Modal closes, password unchanged

### 10. Edge Cases
- [ ] Very long password (50+ chars)
- [ ] Special characters in password
- [ ] Spaces in password
- [ ] Unicode/emoji in password (🔐)
- [ ] **Expected**: All should work

## 🐛 Common Issues & Solutions

### "Password is required" error
- **Cause**: Trying to login without setting password first
- **Fix**: Let the setup modal appear and set password

### Can't see password field
- **Cause**: Old version cached
- **Fix**: Clear browser cache, hard refresh (Ctrl+Shift+R)

### Password setup modal not appearing
- **Cause**: JavaScript error
- **Fix**: Check browser console, ensure all files copied correctly

### Lost password
- **Fix**: In browser console:
```javascript
// Clear password for specific supervisor
localStorage.removeItem('barry_supervisor_passwords');
```

## ✅ Success Criteria
- All supervisors can set passwords
- Passwords persist across sessions
- Barry's existing password works
- Password change works
- No console errors
- Smooth user experience

## 📊 Test Results Template
```
Date: _______
Tester: _______
Browser: _______

First-Time Setup: ✅/❌
Existing User (Barry): ✅/❌
Password Change: ✅/❌
Validation: ✅/❌
Persistence: ✅/❌

Notes:
_______________________
_______________________
```