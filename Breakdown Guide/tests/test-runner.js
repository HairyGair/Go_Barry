/**
 * Go North East - Breakdown Guide
 * Test Runner Framework
 * Executes test scenarios and validates functionality
 */

class TestRunner {
    constructor() {
        this.tests = [];
        this.results = [];
        this.currentTest = null;
    }

    /**
     * Register a test scenario
     */
    addTest(name, description, testFunction) {
        this.tests.push({
            name,
            description,
            testFunction,
            status: 'pending'
        });
    }

    /**
     * Run all tests
     */
    async runAll() {
        console.log('🧪 Starting Test Suite...\n');
        
        for (const test of this.tests) {
            await this.runTest(test);
        }
        
        this.showResults();
    }

    /**
     * Run individual test
     */
    async runTest(test) {
        this.currentTest = test;
        console.log(`Running: ${test.name}`);
        
        try {
            const startTime = performance.now();
            await test.testFunction();
            const endTime = performance.now();
            
            test.status = 'passed';
            test.duration = (endTime - startTime).toFixed(2) + 'ms';
            console.log(`✅ PASS: ${test.name} (${test.duration})\n`);
            
        } catch (error) {
            test.status = 'failed';
            test.error = error.message;
            console.error(`❌ FAIL: ${test.name}`);
            console.error(`   Error: ${error.message}\n`);
        }
        
        this.results.push({...test});
    }

    /**
     * Show test results summary
     */
    showResults() {
        const passed = this.results.filter(r => r.status === 'passed').length;
        const failed = this.results.filter(r => r.status === 'failed').length;
        const total = this.results.length;
        
        console.log('\n📊 Test Results Summary');
        console.log('========================');
        console.log(`Total Tests: ${total}`);
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`Success Rate: ${((passed/total) * 100).toFixed(1)}%`);
        
        if (failed > 0) {
            console.log('\n❌ Failed Tests:');
            this.results.filter(r => r.status === 'failed').forEach(test => {
                console.log(`   - ${test.name}: ${test.error}`);
            });
        }
        
        return {
            total,
            passed,
            failed,
            results: this.results
        };
    }

    /**
     * Assert helper functions
     */
    assert = {
        // Check if condition is true
        isTrue: (condition, message) => {
            if (!condition) {
                throw new Error(message || 'Expected condition to be true');
            }
        },

        // Check if values are equal
        equals: (actual, expected, message) => {
            if (actual !== expected) {
                throw new Error(message || `Expected ${expected}, got ${actual}`);
            }
        },

        // Check if element exists
        exists: (selector, message) => {
            const element = document.querySelector(selector);
            if (!element) {
                throw new Error(message || `Element not found: ${selector}`);
            }
            return element;
        },

        // Check if element is visible
        isVisible: (selector, message) => {
            const element = document.querySelector(selector);
            if (!element || element.style.display === 'none' || !element.offsetParent) {
                throw new Error(message || `Element not visible: ${selector}`);
            }
            return element;
        },

        // Check if element contains text
        containsText: (selector, text, message) => {
            const element = document.querySelector(selector);
            if (!element || !element.textContent.includes(text)) {
                throw new Error(message || `Element ${selector} does not contain text: ${text}`);
            }
            return element;
        },

        // Check if element has class
        hasClass: (selector, className, message) => {
            const element = document.querySelector(selector);
            if (!element || !element.classList.contains(className)) {
                throw new Error(message || `Element ${selector} does not have class: ${className}`);
            }
            return element;
        },

        // Check array length
        arrayLength: (array, length, message) => {
            if (!Array.isArray(array) || array.length !== length) {
                throw new Error(message || `Expected array length ${length}, got ${array?.length}`);
            }
        }
    };

    /**
     * Utility functions for testing
     */
    utils = {
        // Wait for element to appear
        waitForElement: async (selector, timeout = 5000) => {
            const startTime = Date.now();
            
            while (Date.now() - startTime < timeout) {
                const element = document.querySelector(selector);
                if (element) return element;
                await this.utils.wait(100);
            }
            
            throw new Error(`Timeout waiting for element: ${selector}`);
        },

        // Wait for condition
        waitFor: async (condition, timeout = 5000) => {
            const startTime = Date.now();
            
            while (Date.now() - startTime < timeout) {
                if (condition()) return;
                await this.utils.wait(100);
            }
            
            throw new Error('Timeout waiting for condition');
        },

        // Simple wait
        wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

        // Simulate click
        click: (selector) => {
            const element = document.querySelector(selector);
            if (!element) throw new Error(`Cannot click: element not found ${selector}`);
            element.click();
        },

        // Simulate input
        typeText: (selector, text) => {
            const element = document.querySelector(selector);
            if (!element) throw new Error(`Cannot type: element not found ${selector}`);
            element.value = text;
            element.dispatchEvent(new Event('input', { bubbles: true }));
        },

        // Get element text
        getText: (selector) => {
            const element = document.querySelector(selector);
            return element ? element.textContent.trim() : null;
        },

        // Check localStorage
        checkStorage: (key, expectedValue) => {
            const value = localStorage.getItem(key);
            if (expectedValue !== undefined && value !== expectedValue) {
                throw new Error(`Storage ${key} expected ${expectedValue}, got ${value}`);
            }
            return value;
        }
    };
}

// Create global test runner instance
const testRunner = new TestRunner();

// Export for use in test files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TestRunner;
}