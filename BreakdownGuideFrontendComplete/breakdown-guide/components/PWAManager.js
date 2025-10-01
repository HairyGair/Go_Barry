/**
 * PWA Registration and Install System
 * Phase 2: Progressive Web App Implementation
 * 
 * Features:
 * - Service Worker registration and lifecycle management
 * - Install prompt handling (Add to Home Screen)
 * - Background sync registration
 * - Update notifications
 * - Offline detection and handling
 */

class PWAManager {
    constructor() {
        this.registration = null;
        this.deferredPrompt = null;
        this.isOnline = navigator.onLine;
        this.updateAvailable = false;
        
        this.init();
    }
    
    async init() {
        console.log('🚀 PWA Manager initializing...');
        
        // Check if service workers are supported
        if (!('serviceWorker' in navigator)) {
            console.log('❌ Service Workers not supported');
            return;
        }
        
        // Register service worker
        await this.registerServiceWorker();
        
        // Setup install prompt handling
        this.setupInstallPrompt();
        
        // Setup online/offline handling
        this.setupNetworkHandling();
        
        // Setup background sync
        this.setupBackgroundSync();
        
        // Setup update handling
        this.setupUpdateHandling();
        
        console.log('✅ PWA Manager initialized');
    }
    
    async registerServiceWorker() {
        try {
            this.registration = await navigator.serviceWorker.register('/breakdown-guide/sw.js', {
                scope: '/breakdown-guide/'
            });
            
            console.log('✅ Service Worker registered:', this.registration.scope);
            
            // Listen for updates
            this.registration.addEventListener('updatefound', () => {
                console.log('🔄 Service Worker update found');
                this.handleServiceWorkerUpdate();
            });
            
        } catch (error) {
            console.error('❌ Service Worker registration failed:', error);
        }
    }
    
    setupInstallPrompt() {
        // Listen for the beforeinstallprompt event
        window.addEventListener('beforeinstallprompt', (e) => {
            console.log('📲 Install prompt available');
            
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            
            // Store the event so it can be triggered later
            this.deferredPrompt = e;
            
            // Show custom install UI
            this.showInstallUI();
        });
        
        // Listen for app installation
        window.addEventListener('appinstalled', () => {
            console.log('🎉 PWA was installed');
            this.hideInstallUI();
            this.deferredPrompt = null;
            
            // Track installation
            this.trackInstallation();
        });
    }
    
    setupNetworkHandling() {
        // Listen for online/offline events
        window.addEventListener('online', () => {
            console.log('🌐 Back online');
            this.isOnline = true;
            this.handleOnline();
        });
        
        window.addEventListener('offline', () => {
            console.log('📡 Gone offline');
            this.isOnline = false;
            this.handleOffline();
        });
    }
    
    setupBackgroundSync() {
        if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
            console.log('🔄 Background Sync supported');
            
            // Register sync events when assessments are saved offline
            window.addEventListener('assessment-saved-offline', () => {
                this.registerBackgroundSync('assessment-upload');
            });
        } else {
            console.log('❌ Background Sync not supported');
        }
    }
    
    setupUpdateHandling() {
        if (this.registration) {
            // Check for updates periodically
            setInterval(() => {
                this.registration.update();
            }, 60000); // Check every minute
        }
    }
    
    handleServiceWorkerUpdate() {
        const newWorker = this.registration.installing;
        
        newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('🆕 New version available');
                this.updateAvailable = true;
                this.showUpdateNotification();
            }
        });
    }
    
    showInstallUI() {
        // Create install banner
        const installBanner = document.createElement('div');
        installBanner.id = 'pwa-install-banner';
        installBanner.className = 'fixed top-0 left-0 right-0 bg-blue-600 text-white p-4 z-50 shadow-lg';
        installBanner.innerHTML = `
            <div class="flex items-center justify-between max-w-md mx-auto">
                <div class="flex items-center space-x-3">
                    <div class="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                        <span class="text-sm">📱</span>
                    </div>
                    <div>
                        <div class="font-semibold text-sm">Add to Home Screen</div>
                        <div class="text-xs opacity-90">Install for quick access</div>
                    </div>
                </div>
                <div class="flex items-center space-x-2">
                    <button id="pwa-install-btn" class="px-3 py-1 bg-white/20 rounded text-xs font-semibold hover:bg-white/30 transition-all">
                        Install
                    </button>
                    <button id="pwa-dismiss-btn" class="p-1 hover:bg-white/20 rounded transition-all">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(installBanner);
        
        // Add event listeners
        document.getElementById('pwa-install-btn').addEventListener('click', () => {
            this.promptInstall();
        });
        
        document.getElementById('pwa-dismiss-btn').addEventListener('click', () => {
            this.hideInstallUI();
        });
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
            if (document.getElementById('pwa-install-banner')) {
                this.hideInstallUI();
            }
        }, 10000);
    }
    
    hideInstallUI() {
        const banner = document.getElementById('pwa-install-banner');
        if (banner) {
            banner.remove();
        }
    }
    
    async promptInstall() {
        if (this.deferredPrompt) {
            // Show the install prompt
            this.deferredPrompt.prompt();
            
            // Wait for the user to respond to the prompt
            const { outcome } = await this.deferredPrompt.userChoice;
            
            console.log('👤 User choice:', outcome);
            
            if (outcome === 'accepted') {
                console.log('✅ User accepted the install prompt');
            } else {
                console.log('❌ User dismissed the install prompt');
            }
            
            // Clear the deferred prompt
            this.deferredPrompt = null;
            this.hideInstallUI();
        }
    }
    
    showUpdateNotification() {
        // Create update notification
        const updateNotification = document.createElement('div');
        updateNotification.id = 'pwa-update-notification';
        updateNotification.className = 'fixed bottom-4 left-4 right-4 bg-green-600 text-white p-4 rounded-lg shadow-lg z-50 max-w-md mx-auto';
        updateNotification.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                    <div class="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                        <span class="text-sm">🆕</span>
                    </div>
                    <div>
                        <div class="font-semibold text-sm">Update Available</div>
                        <div class="text-xs opacity-90">New features and improvements</div>
                    </div>
                </div>
                <div class="flex items-center space-x-2">
                    <button id="pwa-update-btn" class="px-3 py-1 bg-white/20 rounded text-xs font-semibold hover:bg-white/30 transition-all">
                        Update
                    </button>
                    <button id="pwa-update-dismiss-btn" class="p-1 hover:bg-white/20 rounded transition-all">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(updateNotification);
        
        // Add event listeners
        document.getElementById('pwa-update-btn').addEventListener('click', () => {
            this.applyUpdate();
        });
        
        document.getElementById('pwa-update-dismiss-btn').addEventListener('click', () => {
            updateNotification.remove();
        });
    }
    
    applyUpdate() {
        if (this.registration && this.registration.waiting) {
            // Tell the waiting service worker to become active
            this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            
            // Reload the page to use the new service worker
            window.location.reload();
        }
    }
    
    async registerBackgroundSync(tag) {
        if (this.registration && 'sync' in this.registration) {
            try {
                await this.registration.sync.register(tag);
                console.log('🔄 Background sync registered:', tag);
            } catch (error) {
                console.error('❌ Background sync registration failed:', error);
            }
        }
    }
    
    handleOnline() {
        // Hide offline banner if present
        const offlineBanner = document.getElementById('offline-banner');
        if (offlineBanner) {
            offlineBanner.remove();
        }
        
        // Trigger sync for pending assessments
        this.registerBackgroundSync('assessment-upload');
        
        // Show online notification
        this.showConnectionNotification('Back online', 'success');
    }
    
    handleOffline() {
        // Show offline banner
        this.showOfflineBanner();
        
        // Show offline notification
        this.showConnectionNotification('You\'re offline', 'warning');
    }
    
    showOfflineBanner() {
        // Don't show if already present
        if (document.getElementById('offline-banner')) return;
        
        const offlineBanner = document.createElement('div');
        offlineBanner.id = 'offline-banner';
        offlineBanner.className = 'fixed top-0 left-0 right-0 bg-amber-600 text-white p-2 z-50 text-center text-sm';
        offlineBanner.innerHTML = `
            <div class="flex items-center justify-center space-x-2">
                <div class="w-3 h-3 bg-white/80 rounded-full animate-pulse"></div>
                <span>You're offline - assessments will sync when reconnected</span>
            </div>
        `;
        
        document.body.appendChild(offlineBanner);
    }
    
    showConnectionNotification(message, type = 'info') {
        const colors = {
            success: 'bg-green-600',
            warning: 'bg-amber-600',
            error: 'bg-red-600',
            info: 'bg-blue-600'
        };
        
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 ${colors[type]} text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    trackInstallation() {
        // Track PWA installation for analytics
        if (window.analytics) {
            window.analytics.track('pwa_installed', {
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                platform: navigator.platform
            });
        }
    }
    
    // Public methods for app integration
    async saveAssessmentOffline(assessmentData) {
        try {
            // Save to local storage/IndexedDB
            const pendingAssessments = JSON.parse(localStorage.getItem('pendingAssessments') || '[]');
            
            const assessment = {
                id: Date.now().toString(),
                data: assessmentData,
                timestamp: new Date().toISOString(),
                synced: false
            };
            
            pendingAssessments.push(assessment);
            localStorage.setItem('pendingAssessments', JSON.stringify(pendingAssessments));
            
            // Trigger background sync if online
            if (this.isOnline) {
                await this.registerBackgroundSync('assessment-upload');
            }
            
            // Dispatch event for UI updates
            window.dispatchEvent(new CustomEvent('assessment-saved-offline', {
                detail: { assessment }
            }));
            
            console.log('💾 Assessment saved offline:', assessment.id);
            return assessment.id;
            
        } catch (error) {
            console.error('❌ Failed to save assessment offline:', error);
            throw error;
        }
    }
    
    getPendingAssessments() {
        return JSON.parse(localStorage.getItem('pendingAssessments') || '[]');
    }
    
    isAppInstalled() {
        return window.matchMedia('(display-mode: standalone)').matches ||
               window.navigator.standalone ||
               document.referrer.includes('android-app://');
    }
}

// Initialize PWA Manager
window.PWAManager = new PWAManager();

// Export for use in other modules
window.PWA = {
    saveAssessmentOffline: (data) => window.PWAManager.saveAssessmentOffline(data),
    getPendingAssessments: () => window.PWAManager.getPendingAssessments(),
    isOnline: () => window.PWAManager.isOnline,
    isInstalled: () => window.PWAManager.isAppInstalled(),
    promptInstall: () => window.PWAManager.promptInstall()
};

console.log('🎯 PWA System loaded and ready');
