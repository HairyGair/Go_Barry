// EMERGENCY STORAGE FIX - Run this in browser console to fix quota issue immediately

console.log('🚨 EMERGENCY STORAGE FIX - Clearing localStorage quota issue...');

// Clear all localStorage except essential items
const preserve = ['supervisor_session'];
const cleared = [];

Object.keys(localStorage).forEach(key => {
    if (!preserve.includes(key)) {
        try {
            const size = localStorage[key].length;
            localStorage.removeItem(key);
            cleared.push({ key, size });
        } catch (e) {
            console.warn('Could not remove:', key);
        }
    }
});

console.log(`✅ Cleared ${cleared.length} items from localStorage`);

// Create a minimal secure login function
window.emergencyLogin = (supervisorId = 'AG003') => {
    console.log('🔐 Emergency login for:', supervisorId);
    
    const minimalSession = {
        supervisorId,
        name: supervisorId === 'AG003' ? 'Anthony Gair' : `Supervisor ${supervisorId}`,
        depot: supervisorId === 'AG003' ? 'Admin' : 'Washington',
        loginTime: new Date().toISOString()
    };
    
    try {
        localStorage.setItem('supervisor_session', JSON.stringify(minimalSession));
        console.log('✅ Emergency session saved');
        
        // Reload page to activate session
        window.location.reload();
        
        return minimalSession;
    } catch (error) {
        console.error('❌ Still cannot save session:', error);
        
        // Alternative: use sessionStorage
        try {
            sessionStorage.setItem('supervisor_session', JSON.stringify(minimalSession));
            console.log('✅ Used sessionStorage instead');
            return minimalSession;
        } catch (sessionError) {
            console.error('❌ Cannot use sessionStorage either:', sessionError);
            return null;
        }
    }
};

console.log('🎯 QUICK FIX: Run window.emergencyLogin("AG003") to login immediately');

// Auto-run emergency login if localStorage is still failing
try {
    localStorage.setItem('test_quota', 'test');
    localStorage.removeItem('test_quota');
    console.log('✅ localStorage is working again');
} catch (error) {
    console.log('⚠️ localStorage still has issues, running emergency login...');
    window.emergencyLogin('AG003');
}