#!/bin/bash
# Quick implementation script for password system - UPDATED with session validation fix

echo "🔐 GO BARRY - Password System Implementation"
echo "==========================================="

# Check if we're in the right directory
if [ ! -d "Go_BARRY" ]; then
    echo "❌ Error: Please run this script from the Go BARRY App directory"
    exit 1
fi

# Create backups
echo "📦 Creating backups..."
mkdir -p Go_BARRY/components/backups
cp Go_BARRY/components/hooks/useSupervisorSession.js Go_BARRY/components/backups/useSupervisorSession.js.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true
cp Go_BARRY/components/SupervisorLogin.jsx Go_BARRY/components/backups/SupervisorLogin.jsx.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true
echo "✅ Backups created"

# Copy new files (using session validation fix version)
echo "📝 Installing password system..."
cp PASSWORD_SYSTEM_UPDATE/01-supervisor-session-with-passwords.js Go_BARRY/components/hooks/useSupervisorSession.js
cp PASSWORD_SYSTEM_UPDATE/02-password-setup-modal.jsx Go_BARRY/components/PasswordSetupModal.jsx
cp PASSWORD_SYSTEM_UPDATE/03-supervisor-login-session-validation-fix.jsx Go_BARRY/components/SupervisorLogin.jsx
cp PASSWORD_SYSTEM_UPDATE/04-change-password-modal.jsx Go_BARRY/components/ChangePasswordModal.jsx
echo "✅ Password system installed with session validation fix"

echo ""
echo "⚠️  IMPORTANT: Login screen disappearing issue"
echo "============================================="
echo "If the login screen flashes and disappears:"
echo "1. Open clear-sessions.html in your browser"
echo "2. Click 'Clear Supervisor Sessions'"
echo "3. Refresh the Go BARRY app"
echo ""
echo "Or run in browser console:"
echo "localStorage.removeItem('barry_supervisor_session');"
echo ""
echo "✅ INSTALLATION COMPLETE!"
echo "======================="
echo ""
echo "Next steps:"
echo "1. Clear old sessions (see above)"
echo "2. Add ChangePasswordModal to SupervisorControl.jsx"
echo "3. Build and deploy: cd Go_BARRY && npm run build:web"
echo "4. Test with a supervisor account"
echo ""
echo "Features added:"
echo "- All supervisors now require passwords"
echo "- First-time setup flow"
echo "- Password change functionality"
echo "- Session validation fix"
echo ""
echo "Barry's existing password (Barry123) will still work."
echo "Other supervisors will set their password on first login."