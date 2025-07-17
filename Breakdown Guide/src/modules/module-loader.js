/**
 * Module Loader for Breakdown Guide
 * Dynamically loads diagnostic flow modules to avoid context limits
 * Version 1.0
 */

class ModuleLoader {
    constructor() {
        this.loadedModules = new Map();
        this.moduleCache = new Map();
        this.loadingPromises = new Map();
    }

    /**
     * Load a specific issue module
     * @param {string} moduleId - The module identifier
     * @returns {Promise} - Promise that resolves to the module data
     */
    async loadModule(moduleId) {
        // Return cached module if already loaded
        if (this.moduleCache.has(moduleId)) {
            return this.moduleCache.get(moduleId);
        }

        // Return existing loading promise if already in progress
        if (this.loadingPromises.has(moduleId)) {
            return this.loadingPromises.get(moduleId);
        }

        // Create new loading promise
        const loadingPromise = this._loadModuleFile(moduleId);
        this.loadingPromises.set(moduleId, loadingPromise);

        try {
            const module = await loadingPromise;
            this.moduleCache.set(moduleId, module);
            this.loadingPromises.delete(moduleId);
            return module;
        } catch (error) {
            this.loadingPromises.delete(moduleId);
            throw error;
        }
    }

    /**
     * Load multiple modules at once
     * @param {Array} moduleIds - Array of module identifiers
     * @returns {Promise} - Promise that resolves to object with all modules
     */
    async loadModules(moduleIds) {
        const promises = moduleIds.map(id => this.loadModule(id));
        const modules = await Promise.all(promises);
        
        const result = {};
        moduleIds.forEach((id, index) => {
            result[id] = modules[index];
        });
        
        return result;
    }

    /**
     * Load all available modules
     * @returns {Promise} - Promise that resolves to all modules
     */
    async loadAllModules() {
        const moduleList = this.getAvailableModules();
        return this.loadModules(moduleList);
    }

    /**
     * Get list of available modules
     * @returns {Array} - List of module identifiers
     */
    getAvailableModules() {
        return [
            'safety-critical',
            'mechanical-issues', 
            'electrical-issues',
            'operational-issues',
            'emergency-procedures',
            'documentation'
        ];
    }

    /**
     * Internal method to load module file
     * @private
     */
    async _loadModuleFile(moduleId) {
        try {
            // Try to load the module file
            const scriptElement = document.createElement('script');
            scriptElement.src = `./modules/issues/${moduleId}.js`;
            
            return new Promise((resolve, reject) => {
                scriptElement.onload = () => {
                    // Check if module was loaded into global scope
                    const moduleName = this._getModuleVariableName(moduleId);
                    if (window[moduleName]) {
                        resolve(window[moduleName]);
                    } else {
                        reject(new Error(`Module ${moduleId} did not export expected variable ${moduleName}`));
                    }
                };
                
                scriptElement.onerror = () => {
                    reject(new Error(`Failed to load module: ${moduleId}`));
                };
                
                document.head.appendChild(scriptElement);
            });
        } catch (error) {
            console.error(`Error loading module ${moduleId}:`, error);
            throw error;
        }
    }

    /**
     * Get the expected global variable name for a module
     * @private
     */
    _getModuleVariableName(moduleId) {
        return moduleId.replace(/-/g, '_').toUpperCase() + '_MODULE';
    }

    /**
     * Preload critical modules for faster access
     */
    async preloadCriticalModules() {
        const criticalModules = ['safety-critical', 'emergency-procedures'];
        try {
            await this.loadModules(criticalModules);
            console.log('✅ Critical modules preloaded successfully');
        } catch (error) {
            console.error('❌ Failed to preload critical modules:', error);
        }
    }

    /**
     * Clear module cache (for development/testing)
     */
    clearCache() {
        this.moduleCache.clear();
        this.loadingPromises.clear();
        console.log('🧹 Module cache cleared');
    }

    /**
     * Get module loading statistics
     */
    getStats() {
        return {
            loadedModules: this.moduleCache.size,
            activeLoading: this.loadingPromises.size,
            cachedModules: Array.from(this.moduleCache.keys())
        };
    }
}

// Create global module loader instance
window.moduleLoader = new ModuleLoader();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModuleLoader;
}