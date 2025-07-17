/**
 * Module Integration for Breakdown Guide
 * Integrates the modular system with existing application
 * Version 1.0
 */

// Module Integration Class
class ModuleIntegration {
    constructor() {
        this.moduleLoader = window.moduleLoader;
        this.loadedFlows = new Map();
        this.isInitialized = false;
    }

    /**
     * Initialize the modular system
     */
    async initialize() {
        try {
            console.log('🔧 Initializing modular breakdown guide system...');
            
            // Load the module loader if not already loaded
            if (!window.moduleLoader) {
                await this.loadModuleLoader();
            }

            // Preload critical modules
            await window.moduleLoader.preloadCriticalModules();
            
            // Create diagnostic flows from loaded modules
            await this.createDiagnosticFlows();
            
            this.isInitialized = true;
            console.log('✅ Modular system initialized successfully');
            
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize modular system:', error);
            return false;
        }
    }

    /**
     * Load the module loader script
     */
    async loadModuleLoader() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = './modules/module-loader.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * Create diagnostic flows from modules
     */
    async createDiagnosticFlows() {
        try {
            // Load all available modules
            const modules = await window.moduleLoader.loadAllModules();
            
            // Combine all flows from modules
            const combinedFlows = {};
            
            Object.values(modules).forEach(module => {
                if (module && typeof module === 'object') {
                    Object.assign(combinedFlows, module);
                }
            });

            // Replace or merge with existing diagnosticFlows
            if (typeof window.diagnosticFlows === 'undefined') {
                window.diagnosticFlows = combinedFlows;
            } else {
                // Merge with existing flows, giving priority to modular ones
                window.diagnosticFlows = { ...window.diagnosticFlows, ...combinedFlows };
            }

            console.log(`✅ Loaded ${Object.keys(combinedFlows).length} diagnostic flows from modules`);
            
        } catch (error) {
            console.error('❌ Failed to create diagnostic flows from modules:', error);
            // Fall back to existing flows if available
            if (typeof window.diagnosticFlows === 'undefined') {
                window.diagnosticFlows = {};
            }
        }
    }

    /**
     * Load a specific flow on demand
     */
    async loadFlow(flowId) {
        try {
            // First check if flow is already available
            if (window.diagnosticFlows && window.diagnosticFlows[flowId]) {
                return window.diagnosticFlows[flowId];
            }

            // Determine which module contains this flow
            const moduleId = this.getModuleForFlow(flowId);
            if (!moduleId) {
                throw new Error(`No module found for flow: ${flowId}`);
            }

            // Load the module
            const module = await window.moduleLoader.loadModule(moduleId);
            
            // Update diagnostic flows
            if (module && module[flowId]) {
                if (!window.diagnosticFlows) {
                    window.diagnosticFlows = {};
                }
                window.diagnosticFlows[flowId] = module[flowId];
                return module[flowId];
            }

            throw new Error(`Flow ${flowId} not found in module ${moduleId}`);
            
        } catch (error) {
            console.error(`❌ Failed to load flow ${flowId}:`, error);
            return null;
        }
    }

    /**
     * Determine which module contains a specific flow
     */
    getModuleForFlow(flowId) {
        // Map flow IDs to their respective modules
        const flowModuleMap = {
            // Safety Critical
            'brakes': 'safety-critical',
            'steering': 'safety-critical', 
            'oil-warning': 'safety-critical',
            'loose-wheel-nuts': 'safety-critical',
            'excessive-smoke': 'safety-critical',
            
            // Mechanical Issues
            'overheating': 'mechanical-issues',
            'suspension': 'mechanical-issues',
            'gearbox-temperature': 'mechanical-issues',
            'puncture': 'mechanical-issues',
            
            // Electrical Issues
            'battery-light': 'electrical-issues',
            'abs-light': 'electrical-issues',
            'warning-lights': 'electrical-issues',
            'interior-lights': 'electrical-issues',
            'exterior-lights': 'electrical-issues',
            
            // Operational Issues
            'non-starter': 'operational-issues',
            'doors': 'operational-issues',
            'low-water': 'operational-issues',
            'wipers-screenwash': 'operational-issues',
            'demisters-heaters': 'operational-issues',
            'speedo': 'operational-issues',
            'ramp-stuck': 'operational-issues',
            
            // Emergency Procedures
            'road-traffic-incident': 'emergency-procedures',
            'broken-windows': 'emergency-procedures',
            'fuel-issues': 'emergency-procedures',
            'various-buzzers': 'emergency-procedures',
            
            // Documentation
            'repeat-defects': 'documentation',
            'gear-selection': 'documentation',
            'contact-information': 'documentation',
            'safety-declaration': 'documentation'
        };

        return flowModuleMap[flowId] || null;
    }

    /**
     * Get module loading statistics
     */
    getStats() {
        if (!window.moduleLoader) {
            return { error: 'Module loader not available' };
        }
        
        return {
            moduleLoader: window.moduleLoader.getStats(),
            totalFlows: window.diagnosticFlows ? Object.keys(window.diagnosticFlows).length : 0,
            isInitialized: this.isInitialized
        };
    }

    /**
     * Refresh all modules (for development)
     */
    async refresh() {
        try {
            console.log('🔄 Refreshing modular system...');
            
            if (window.moduleLoader) {
                window.moduleLoader.clearCache();
            }
            
            await this.initialize();
            
            console.log('✅ Modular system refreshed');
            return true;
        } catch (error) {
            console.error('❌ Failed to refresh modular system:', error);
            return false;
        }
    }
}

// Create global integration instance
window.moduleIntegration = new ModuleIntegration();

// Auto-initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.moduleIntegration.initialize();
    });
} else {
    // DOM already loaded
    window.moduleIntegration.initialize();
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModuleIntegration;
}