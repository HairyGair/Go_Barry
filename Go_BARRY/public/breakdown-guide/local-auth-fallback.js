// Local Authentication Fallback for Breakdown Guide
// Provides offline authentication when backend server is unavailable

(function() {
    'use strict';
    
    console.log('🔐 Installing Local Authentication Fallback...');
    
    // Default supervisor credentials for local authentication
    const LOCAL_SUPERVISORS = {
        'supervisor001': { password: 'Barry123!', name: 'Alex Woodcock', badge: 'AW001' },
        'supervisor002': { password: 'Barry123!', name: 'Andrew Cowley', badge: 'AC002' },
        'supervisor003': { password: 'Barry123!', name: 'Anthony Gair', badge: 'AG003', isAdmin: true },
        'supervisor004': { password: 'Barry123!', name: 'Claire Fiddler', badge: 'CF004' },
        'supervisor005': { password: 'Barry123!', name: 'David Hall', badge: 'DH005' },
        'supervisor006': { password: 'Barry123!', name: 'James Daglish', badge: 'JD006' },
        'supervisor007': { password: 'Barry123!', name: 'John Paterson', badge: 'JP007' },
        'supervisor008': { password: 'Barry123!', name: 'Simon Glass', badge: 'SG008' },
        'supervisor009': { password: 'Barry123!', name: 'Barry Perryman', badge: 'BP009', isAdmin: true }
    };
    
    // Override fetch to intercept login requests
    const originalFetch = window.fetch;
    
    window.fetch = async function(url, options) {
        // Check if this is a login request
        if (url.includes('/api/auth/login')) {
            console.log('🔐 Intercepting login request for local authentication');
            
            try {
                // First try the actual backend
                const response = await Promise.race([
                    originalFetch(url, options),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Request timeout')), 3000)
                    )
                ]);
                
                // If backend responds successfully, use it
                if (response.ok) {
                    console.log('✅ Backend authentication successful');
                    return response;
                }
            } catch (error) {
                console.log('⚠️ Backend unavailable, using local authentication');
            }
            
            // Fall back to local authentication
            try {
                const body = JSON.parse(options.body);
                const supervisorId = body.supervisorId;
                const password = body.password;
                
                console.log('🔐 Attempting local authentication for:', supervisorId);
                
                // Check local credentials
                const supervisor = LOCAL_SUPERVISORS[supervisorId];
                
                if (supervisor && password === supervisor.password) {
                    console.log('✅ Local authentication successful');
                    
                    // Create successful response
                    const sessionData = {
                        success: true,
                        supervisor: {
                            supervisorId: supervisorId,
                            name: supervisor.name,
                            badge: supervisor.badge,
                            isAdmin: supervisor.isAdmin || false,
                            depot: 'Local Mode',
                            email: `${supervisor.badge.toLowerCase()}@gonortheast.co.uk`
                        },
                        token: 'local-session-' + Date.now(),
                        message: 'Authenticated locally (offline mode)'
                    };
                    
                    // Return mock successful response
                    return new Response(JSON.stringify(sessionData), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' }
                    });
                } else {
                    console.log('❌ Local authentication failed');
                    
                    // Return authentication failure
                    return new Response(JSON.stringify({
                        success: false,
                        error: 'Invalid credentials. Use password: Barry123!'
                    }), {
                        status: 401,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
            } catch (error) {
                console.error('❌ Local authentication error:', error);
                
                return new Response(JSON.stringify({
                    success: false,
                    error: 'Authentication failed. Please try again.'
                }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }
        
        // For all other requests, use original fetch
        return originalFetch(url, options);
    };
    
    // Add visual indicator for local mode
    window.addEventListener('DOMContentLoaded', () => {
        // Check if we're in local mode
        setTimeout(() => {
            const passwordInfo = document.querySelector('.text-blue-600');
            if (passwordInfo && passwordInfo.textContent.includes('Barry123')) {
                // Add local mode indicator
                const indicator = document.createElement('div');
                indicator.className = 'bg-amber-100 border border-amber-400 text-amber-700 px-4 py-2 rounded mb-4 text-sm';
                indicator.innerHTML = `
                    <strong>Local Mode Active</strong><br>
                    Backend server unavailable. Using local authentication.<br>
                    All assessments will be saved locally.
                `;
                
                const form = document.querySelector('form');
                if (form) {
                    form.insertBefore(indicator, form.firstChild);
                }
            }
        }, 1000);
    });
    
    // Store local authentication state
    window.LocalAuthFallback = {
        isActive: true,
        supervisors: LOCAL_SUPERVISORS,
        
        // Method to update local password
        updatePassword: function(supervisorId, newPassword) {
            if (this.supervisors[supervisorId]) {
                this.supervisors[supervisorId].password = newPassword;
                console.log(`✅ Password updated for ${supervisorId}`);
                return true;
            }
            return false;
        },
        
        // Method to check if using local auth
        isLocalMode: function() {
            return !window.navigator.onLine || this.isActive;
        },
        
        // Method to test backend connectivity
        testBackend: async function() {
            try {
                const backendUrl = window.BACKEND_URL || 'https://go-barry.onrender.com';
                const response = await originalFetch(`${backendUrl}/api/health`, {
                    method: 'GET',
                    signal: AbortSignal.timeout(3000)
                });
                return response.ok;
            } catch {
                return false;
            }
        }
    };
    
    console.log('✅ Local Authentication Fallback installed');
    console.log('📝 Default password for all supervisors: Barry123!');
    
    // Test backend connectivity on load
    window.LocalAuthFallback.testBackend().then(isOnline => {
        console.log(`🌐 Backend server status: ${isOnline ? 'Online' : 'Offline (using local mode)'}`);
    });
    
})();
