/**
 * SDC Guide Complete Integration - All Categories
 * Loads all diagnostic flows with exact SDC Guide text compliance
 * Version 1.3 - Complete Implementation
 */

// Initialize the main diagnostic flows object if it doesn't exist
window.diagnosticFlows = window.diagnosticFlows || {};

// Load all diagnostic flow parts in sequence
(function loadAllDiagnosticFlows() {
    console.log('Loading all SDC Guide compliant diagnostic flows...');
    
    // Include all the diagnostic flow files
    const scripts = [
        './src/data/diagnostic-flows-sdc-compliant.js',
        './src/data/diagnostic-flows-sdc-part2.js', 
        './src/data/diagnostic-flows-sdc-part3.js',
        './src/data/diagnostic-flows-sdc-part4.js',
        './src/data/diagnostic-flows-sdc-part5.js'
    ];
    
    let loadedCount = 0;
    
    scripts.forEach(scriptPath => {
        const script = document.createElement('script');
        script.src = scriptPath;
        script.onload = () => {
            loadedCount++;
            console.log(`Loaded: ${scriptPath}`);
            
            if (loadedCount === scripts.length) {
                console.log('All SDC Guide diagnostic flows loaded successfully!');
                console.log('Available categories:', Object.keys(window.diagnosticFlows));
                
                // Trigger any post-load initialization
                if (typeof initializeCategories === 'function') {
                    initializeCategories();
                }
            }
        };
        script.onerror = () => {
            console.error(`Failed to load: ${scriptPath}`);
        };
        document.head.appendChild(script);
    });
})();

// Export function to get all available categories
window.getAllCategories = function() {
    return Object.keys(window.diagnosticFlows || {});
};

// Export function to get category by ID
window.getCategory = function(categoryId) {
    return window.diagnosticFlows[categoryId] || null;
};

// Export function to get categories by priority
window.getCategoriesByPriority = function(priority) {
    const flows = window.diagnosticFlows || {};
    return Object.keys(flows).filter(key => flows[key].priority === priority);
};

// Export function to get critical categories (Priority 1)
window.getCriticalCategories = function() {
    return window.getCategoriesByPriority(1);
};

// Export function to get warning categories (Priority 2)
window.getWarningCategories = function() {
    return window.getCategoriesByPriority(2);
};

// Export function to get standard categories (Priority 3)
window.getStandardCategories = function() {
    return window.getCategoriesByPriority(3);
};

// Export function to validate category completeness
window.validateCategories = function() {
    const requiredCategories = [
        // Priority 1 - Critical Issues
        'brakes',
        'steering', 
        'oil-warning',
        'loose-wheel-nuts',
        'puncture',
        
        // Priority 2 - High Priority Issues
        'abs-light',
        'battery-light',
        'overheating',
        'low-water',
        'doors',
        'non-starter',
        'gear-selection',
        'demisters-heaters',
        'cutting-out-fuel',
        'excessive-smoke',
        'gearbox-temperature',
        'broken-windows',
        'exterior-lights',
        'wing-mirrors',
        'wipers-screenwash',
        'ramp-stuck-out',
        'interior-exterior-damage',
        'repeat-defects',
        'speedo-not-working',
        'suspension',
        
        // Priority 3 - Standard Issues
        'buzzers-sounding',
        'interior-lights'
    ];
    
    const availableCategories = Object.keys(window.diagnosticFlows || {});
    const missing = requiredCategories.filter(cat => !availableCategories.includes(cat));
    const extra = availableCategories.filter(cat => !requiredCategories.includes(cat));
    
    return {
        complete: missing.length === 0,
        total: requiredCategories.length,
        implemented: availableCategories.length,
        missing: missing,
        extra: extra
    };
};

console.log('SDC Guide integration script loaded - Ready to load all diagnostic flows');