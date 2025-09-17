/**
 * Mobile Wizard Integration
 * Phase 2: Connects mobile-optimized wizards to the main application
 * 
 * Features:
 * - Automatic mobile detection
 * - Wizard type routing
 * - Fallback to regular wizards
 * - Performance optimization for mobile
 */

// Mobile detection utility
const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           window.innerWidth <= 768;
};

// Force mobile mode (for testing)
let forceMobileMode = localStorage.getItem('forceMobileMode') === 'true';

const setMobileMode = (enabled) => {
    forceMobileMode = enabled;
    localStorage.setItem('forceMobileMode', enabled.toString());
    window.dispatchEvent(new CustomEvent('mobileModeChanged', { detail: { enabled } }));
};

// Mobile wizard router
const getMobileWizard = (wizardType) => {
    const mobileWizards = {
        'steering': window.MobileSteeringWizard,
        'brakes': window.MobileBrakesWizard,
        'general': window.MobileGeneralAssessmentWizard,
        // Add more mobile wizards as they're created
    };
    
    return mobileWizards[wizardType] || null;
};

// Enhanced wizard wrapper that chooses between mobile and regular
const EnhancedWizardWrapper = ({ wizardType, ...props }) => {
    const [useMobile, setUseMobile] = React.useState(
        forceMobileMode || isMobileDevice()
    );
    
    React.useEffect(() => {
        const handleMobileModeChange = (event) => {
            setUseMobile(event.detail.enabled || isMobileDevice());
        };
        
        window.addEventListener('mobileModeChanged', handleMobileModeChange);
        
        // Listen for window resize to detect orientation changes
        const handleResize = () => {
            if (!forceMobileMode) {
                setUseMobile(isMobileDevice());
            }
        };
        
        window.addEventListener('resize', handleResize);
        
        return () => {
            window.removeEventListener('mobileModeChanged', handleMobileModeChange);
            window.removeEventListener('resize', handleResize);
        };
    }, []);
    
    const MobileWizard = getMobileWizard(wizardType);
    
    // Use mobile wizard if available and mobile mode is enabled
    if (useMobile && MobileWizard) {
        return React.createElement(MobileWizard, props);
    }
    
    // Fallback to regular wizard (would need to map to existing wizards)
    const RegularWizard = getRegularWizard(wizardType);
    if (RegularWizard) {
        return React.createElement(RegularWizard, props);
    }
    
    // Final fallback
    return React.createElement('div', {
        className: 'text-center text-red-400 p-8'
    }, `Wizard "${wizardType}" not found`);
};

// Helper to get regular wizards (would map to existing wizard components)
const getRegularWizard = (wizardType) => {
    const regularWizards = {
        'steering': window.SteeringWizard,
        'brakes': window.BrakesWizard,
        // Map to existing wizard components
    };
    
    return regularWizards[wizardType];
};

// Mobile toggle component for testing/preference
const MobileToggle = () => {
    const [isMobile, setIsMobile] = React.useState(
        forceMobileMode || isMobileDevice()
    );
    
    const toggleMobile = () => {
        const newMode = !forceMobileMode;
        setMobileMode(newMode);
        setIsMobile(newMode || isMobileDevice());
    };
    
    return React.createElement('div', {
        className: 'fixed top-4 right-4 z-50'
    }, [
        React.createElement('button', {
            key: 'toggle',
            onClick: toggleMobile,
            className: `px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                isMobile 
                    ? 'bg-blue-600 text-white border border-blue-500' 
                    : 'bg-gray-600 text-gray-300 border border-gray-500'
            } hover:opacity-80`
        }, [
            React.createElement('span', { key: 'icon', className: 'mr-2' }, '📱'),
            React.createElement('span', { key: 'text' }, isMobile ? 'Mobile' : 'Desktop')
        ])
    ]);
};

// Export functions
window.MobileIntegration = {
    isMobileDevice,
    setMobileMode,
    getMobileWizard,
    EnhancedWizardWrapper,
    MobileToggle
};

// Auto-apply mobile optimizations on load
document.addEventListener('DOMContentLoaded', () => {
    // Add mobile-specific meta tags if not present
    if (isMobileDevice() || forceMobileMode) {
        const metaViewport = document.querySelector('meta[name="viewport"]');
        if (!metaViewport) {
            const meta = document.createElement('meta');
            meta.name = 'viewport';
            meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
            document.head.appendChild(meta);
        }
        
        // Add mobile-specific styles
        const mobileStyles = document.createElement('style');
        mobileStyles.textContent = `
            /* Mobile-specific optimizations */
            @media (max-width: 768px) {
                /* Prevent zoom on input focus */
                input, select, textarea {
                    font-size: 16px !important;
                }
                
                /* Better touch targets */
                button, a, input, select {
                    min-height: 44px;
                }
                
                /* Prevent horizontal scroll */
                body {
                    overflow-x: hidden;
                }
                
                /* Better mobile typography */
                body {
                    font-size: 16px;
                    line-height: 1.5;
                }
                
                /* Safe area padding for newer phones */
                .mobile-safe-area {
                    padding-top: env(safe-area-inset-top);
                    padding-bottom: env(safe-area-inset-bottom);
                    padding-left: env(safe-area-inset-left);
                    padding-right: env(safe-area-inset-right);
                }
            }
            
            /* Improved touch feedback */
            .mobile-touch-feedback {
                -webkit-tap-highlight-color: rgba(59, 130, 246, 0.3);
                tap-highlight-color: rgba(59, 130, 246, 0.3);
            }
            
            /* Better scrolling on mobile */
            .mobile-scroll {
                -webkit-overflow-scrolling: touch;
                overflow-scrolling: touch;
            }
        `;
        document.head.appendChild(mobileStyles);
        
        // Add mobile class to body
        document.body.classList.add('mobile-optimized');
    }
});
