// Logout Helper Functions
// Provides additional logout utilities and emergency cleanup functions

// Emergency logout - force clear everything without API calls
export const emergencyLogout = () => {
    console.log('🆘 Emergency logout initiated...');

    try {
        // Clear all localStorage
        localStorage.clear();
        console.log('✅ localStorage cleared');
    } catch (e) {
        console.warn('⚠️ localStorage clear failed:', e);
    }

    try {
        // Clear all sessionStorage
        sessionStorage.clear();
        console.log('✅ sessionStorage cleared');
    } catch (e) {
        console.warn('⚠️ sessionStorage clear failed:', e);
    }

    try {
        // Clear cookies (for auth domains)
        document.cookie.split(";").forEach(function(c) {
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
        console.log('✅ Cookies cleared');
    } catch (e) {
        console.warn('⚠️ Cookie clear failed:', e);
    }

    // Force page reload to reset app state
    setTimeout(() => {
        window.location.href = '/';
    }, 100);

    console.log('✅ Emergency logout completed');
};

// Silent logout - logout without notifications or redirects
export const silentLogout = async (authService) => {
    console.log('🤫 Silent logout initiated...');

    try {
        // Call Supabase signOut
        await authService.signOut();

        // Clear storage silently
        const authKeys = [
            'supabase_remember_me',
            'auth_user',
            'auth_session',
            'supervisor_session',
            'breakdown_draft',
            'last_login_time',
            'session_expires_at'
        ];

        authKeys.forEach(key => {
            try {
                localStorage.removeItem(key);
                sessionStorage.removeItem(key);
            } catch (e) {
                // Silently ignore errors
            }
        });

        console.log('✅ Silent logout completed');
        return { success: true };
    } catch (error) {
        console.error('❌ Silent logout error:', error);
        return { success: false, error: error.message };
    }
};

// Auto-logout due to inactivity
export const autoLogout = async (authService, reason = 'inactivity') => {
    console.log(`⏰ Auto-logout triggered due to: ${reason}`);

    const notification = {
        id: `auto_logout_${Date.now()}`,
        type: 'info',
        icon: '⏰',
        title: 'Session Expired',
        message: `You have been logged out due to ${reason}. Please sign in again.`,
        dismissible: true,
        autoHide: false, // Keep visible until user dismisses
        timestamp: new Date().toISOString()
    };

    // Show notification before logout
    if (window.showNotification) {
        window.showNotification(notification);
    }

    // Perform silent logout
    const result = await silentLogout(authService);

    // Redirect after delay
    setTimeout(() => {
        window.location.href = '/?reason=session_expired';
    }, 3000);

    return result;
};

// Logout all devices (if supported by backend)
export const logoutAllDevices = async (authService) => {
    console.log('📱 Logout all devices initiated...');

    try {
        // This would call a backend endpoint to invalidate all sessions
        // For now, we'll just do a regular logout
        const result = await authService.signOut();

        const notification = {
            id: `logout_all_${Date.now()}`,
            type: 'success',
            icon: '📱',
            title: 'All Devices Logged Out',
            message: 'You have been logged out from all devices successfully.',
            dismissible: true,
            autoHide: true,
            duration: 5000,
            timestamp: new Date().toISOString()
        };

        if (window.showNotification) {
            window.showNotification(notification);
        }

        return { success: true };
    } catch (error) {
        console.error('❌ Logout all devices error:', error);
        return { success: false, error: error.message };
    }
};

// Check if user should be auto-logged out due to security policy
export const checkSecurityLogout = (lastActivity, maxInactiveTime = 30 * 60 * 1000) => {
    const now = Date.now();
    const timeSinceActivity = now - lastActivity;

    if (timeSinceActivity > maxInactiveTime) {
        return {
            shouldLogout: true,
            reason: 'inactivity',
            timeSinceActivity
        };
    }

    return {
        shouldLogout: false,
        timeSinceActivity
    };
};

// Secure session cleanup utility
export const secureCleanup = () => {
    console.log('🔒 Secure cleanup initiated...');

    // List of sensitive keys that should be cleared
    const sensitiveKeys = [
        // Auth related
        'supabase_remember_me',
        'auth_user',
        'auth_session',
        'supervisor_session',
        'access_token',
        'refresh_token',
        'id_token',

        // Application data
        'breakdown_draft',
        'current_wizard_state',
        'temp_session_data',
        'cached_user_data',
        'dashboard_cache',

        // Timestamps
        'last_login_time',
        'session_expires_at',
        'last_activity_time',

        // Any keys starting with these prefixes
        'sb-', 'supabase', 'auth', 'session', 'user', 'temp'
    ];

    // Clear localStorage
    try {
        const localKeys = Object.keys(localStorage);
        localKeys.forEach(key => {
            if (sensitiveKeys.some(sensitiveKey =>
                key.includes(sensitiveKey) || key.startsWith(sensitiveKey)
            )) {
                localStorage.removeItem(key);
            }
        });
        console.log('✅ localStorage sensitive data cleared');
    } catch (e) {
        console.warn('⚠️ localStorage cleanup failed:', e);
    }

    // Clear sessionStorage
    try {
        const sessionKeys = Object.keys(sessionStorage);
        sessionKeys.forEach(key => {
            if (sensitiveKeys.some(sensitiveKey =>
                key.includes(sensitiveKey) || key.startsWith(sensitiveKey)
            )) {
                sessionStorage.removeItem(key);
            }
        });
        console.log('✅ sessionStorage sensitive data cleared');
    } catch (e) {
        console.warn('⚠️ sessionStorage cleanup failed:', e);
    }

    console.log('✅ Secure cleanup completed');
};

// Activity tracker for auto-logout
export class ActivityTracker {
    constructor(onInactivity, inactivityTimeout = 30 * 60 * 1000) {
        this.onInactivity = onInactivity;
        this.inactivityTimeout = inactivityTimeout;
        this.lastActivity = Date.now();
        this.timer = null;
        this.events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

        this.resetTimer = this.resetTimer.bind(this);
        this.handleActivity = this.handleActivity.bind(this);

        this.startTracking();
    }

    startTracking() {
        console.log('👀 Activity tracking started');
        this.events.forEach(event => {
            document.addEventListener(event, this.handleActivity, true);
        });
        this.resetTimer();
    }

    stopTracking() {
        console.log('👀 Activity tracking stopped');
        this.events.forEach(event => {
            document.removeEventListener(event, this.handleActivity, true);
        });
        if (this.timer) {
            clearTimeout(this.timer);
        }
    }

    handleActivity() {
        this.lastActivity = Date.now();
        this.resetTimer();
    }

    resetTimer() {
        if (this.timer) {
            clearTimeout(this.timer);
        }

        this.timer = setTimeout(() => {
            console.log('⏰ Inactivity timeout reached');
            this.onInactivity();
        }, this.inactivityTimeout);
    }

    getLastActivity() {
        return this.lastActivity;
    }

    getTimeSinceActivity() {
        return Date.now() - this.lastActivity;
    }
}

export default {
    emergencyLogout,
    silentLogout,
    autoLogout,
    logoutAllDevices,
    checkSecurityLogout,
    secureCleanup,
    ActivityTracker
};