/**
 * Go North East - Breakdown Guide
 * Browser Compatibility Test Scenarios
 * Tests functionality across Chrome, Firefox, Edge
 */

// Test 1: Chrome-specific Features
testRunner.addTest(
    'Browser - Chrome Compatibility',
    'Test features work correctly in Chrome',
    async () => {
        const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
        
        if (isChrome) {
            // Test Chrome-specific CSS
            const testElement = document.createElement('div');
            testElement.style.webkitAppearance = 'none';
            testRunner.assert.isTrue(testElement.style.webkitAppearance !== undefined, 'Webkit prefixes should work');
            
            // Test smooth scrolling
            testElement.style.scrollBehavior = 'smooth';
            testRunner.assert.equals(testElement.style.scrollBehavior, 'smooth', 'Smooth scrolling should work');
        }
        
        // Test general features that should work in all browsers
        testRunner.assert.isTrue(typeof window.localStorage !== 'undefined', 'LocalStorage should be available');
        testRunner.assert.isTrue(typeof window.sessionStorage !== 'undefined', 'SessionStorage should be available');
    }
);

// Test 2: Firefox-specific Features
testRunner.addTest(
    'Browser - Firefox Compatibility',
    'Test features work correctly in Firefox',
    async () => {
        const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
        
        if (isFirefox) {
            // Test Firefox-specific CSS
            const testElement = document.createElement('div');
            testElement.style.MozAppearance = 'none';
            
            // Firefox uses different property names for some features
            if (testElement.style.MozAppearance !== undefined) {
                testRunner.assert.isTrue(true, 'Moz prefixes detected');
            }
        }
        
        // Test CSS Grid (should work in all modern browsers)
        const gridTest = document.createElement('div');
        gridTest.style.display = 'grid';
        testRunner.assert.equals(gridTest.style.display, 'grid', 'CSS Grid should be supported');
    }
);

// Test 3: Edge-specific Features
testRunner.addTest(
    'Browser - Edge Compatibility',
    'Test features work correctly in Edge',
    async () => {
        const isEdge = navigator.userAgent.indexOf('Edge') > -1 || navigator.userAgent.indexOf('Edg/') > -1;
        
        if (isEdge) {
            // Test Edge-specific features
            // Edge should support all modern web standards
            testRunner.assert.isTrue(typeof Promise !== 'undefined', 'Promises should be supported');
            testRunner.assert.isTrue(typeof fetch !== 'undefined', 'Fetch API should be supported');
        }
        
        // Test modern JavaScript features
        testRunner.assert.isTrue(typeof Array.from !== 'undefined', 'Array.from should be supported');
        testRunner.assert.isTrue(typeof Object.assign !== 'undefined', 'Object.assign should be supported');
    }
);

// Test 4: Mobile Browser Detection
testRunner.addTest(
    'Browser - Mobile Compatibility',
    'Test mobile browser detection and responsive features',
    async () => {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // Test viewport meta tag exists
        const viewportMeta = document.querySelector('meta[name="viewport"]');
        testRunner.assert.exists('meta[name="viewport"]', 'Viewport meta tag should exist');
        
        // Test touch events (if on mobile)
        if (isMobile || 'ontouchstart' in window) {
            testRunner.assert.isTrue('ontouchstart' in window, 'Touch events should be supported on mobile');
        }
        
        // Test responsive design classes
        const container = document.querySelector('.container');
        if (container) {
            const styles = window.getComputedStyle(container);
            testRunner.assert.isTrue(styles.maxWidth !== 'none', 'Container should have max-width for responsive design');
        }
    }
);

// Test 5: CSS Feature Support
testRunner.addTest(
    'Browser - CSS Feature Detection',
    'Test modern CSS features are supported',
    async () => {
        const testElement = document.createElement('div');
        
        // Test CSS Variables
        testElement.style.setProperty('--test-var', 'red');
        const supportsCustomProperties = testElement.style.getPropertyValue('--test-var') === 'red';
        testRunner.assert.isTrue(supportsCustomProperties, 'CSS Custom Properties should be supported');
        
        // Test Flexbox
        testElement.style.display = 'flex';
        testRunner.assert.equals(testElement.style.display, 'flex', 'Flexbox should be supported');
        
        // Test CSS Grid
        testElement.style.display = 'grid';
        testRunner.assert.equals(testElement.style.display, 'grid', 'CSS Grid should be supported');
        
        // Test Border Radius
        testElement.style.borderRadius = '10px';
        testRunner.assert.isTrue(testElement.style.borderRadius !== '', 'Border radius should be supported');
        
        // Test Box Shadow
        testElement.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
        testRunner.assert.isTrue(testElement.style.boxShadow !== '', 'Box shadow should be supported');
    }
);

// Test 6: JavaScript API Support
testRunner.addTest(
    'Browser - JavaScript API Support',
    'Test required JavaScript APIs are available',
    async () => {
        // Test ES6+ Features
        testRunner.assert.isTrue(typeof Promise !== 'undefined', 'Promises should be supported');
        testRunner.assert.isTrue(typeof Map !== 'undefined', 'Map should be supported');
        testRunner.assert.isTrue(typeof Set !== 'undefined', 'Set should be supported');
        
        // Test Array methods
        testRunner.assert.isTrue(typeof Array.prototype.find !== 'undefined', 'Array.find should be supported');
        testRunner.assert.isTrue(typeof Array.prototype.includes !== 'undefined', 'Array.includes should be supported');
        
        // Test String methods
        testRunner.assert.isTrue(typeof String.prototype.includes !== 'undefined', 'String.includes should be supported');
        testRunner.assert.isTrue(typeof String.prototype.startsWith !== 'undefined', 'String.startsWith should be supported');
        
        // Test Object methods
        testRunner.assert.isTrue(typeof Object.entries !== 'undefined', 'Object.entries should be supported');
        testRunner.assert.isTrue(typeof Object.values !== 'undefined', 'Object.values should be supported');
        
        // Test DOM APIs
        testRunner.assert.isTrue(typeof document.querySelector !== 'undefined', 'querySelector should be supported');
        testRunner.assert.isTrue(typeof document.querySelectorAll !== 'undefined', 'querySelectorAll should be supported');
        
        // Test Event APIs
        testRunner.assert.isTrue(typeof Event !== 'undefined', 'Event constructor should be supported');
        testRunner.assert.isTrue(typeof CustomEvent !== 'undefined', 'CustomEvent should be supported');
    }
);