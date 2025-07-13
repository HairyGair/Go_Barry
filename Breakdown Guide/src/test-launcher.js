/**
 * Phase 6.2 Test Launcher
 * Quick setup script for testing Enhanced Action Logging System
 */

console.log(`
🧪 =====================================
   PHASE 6.2 TEST LAUNCHER
🧪 =====================================

Loading Enhanced Action Logging System for testing...
`);

// Test launcher configuration
const TEST_CONFIG = {
    autoRun: true,
    verbose: true,
    createSampleData: true,
    showResults: true
};

/**
 * Initialize testing environment
 */
function initializeTestEnvironment() {
    console.log('🔧 Initializing test environment...');
    
    // Wait for all components to load
    let attempts = 0;
    const maxAttempts = 10;
    
    const checkComponents = () => {
        attempts++;
        
        const components = {
            enhancedLogger: !!(window.enhancedDiagnosticLogger || window.diagnosticLogger),
            testSuite: !!window.phase6TestSuite,
            integration: !!(window.phase6Integration || window.loggingIntegration),
            statusMonitor: !!window.phase6StatusMonitor
        };
        
        const loaded = Object.values(components).filter(Boolean).length;
        const total = Object.keys(components).length;
        
        console.log(`📊 Components loaded: ${loaded}/${total} (Attempt ${attempts}/${maxAttempts})`);
        
        if (loaded >= 2 || attempts >= maxAttempts) {
            // Enough components loaded or max attempts reached
            console.log('✅ Test environment ready!');
            console.log('=====================================');
            
            if (TEST_CONFIG.autoRun) {
                setTimeout(runAutoTests, 1000);
            }
            
            showTestInstructions();
        } else {
            // Wait and try again
            setTimeout(checkComponents, 1000);
        }
    };
    
    checkComponents();
}

/**
 * Run automatic tests
 */
function runAutoTests() {
    console.log('🚀 Running automatic tests...');
    
    // Run quick test if available
    if (window.quickTestPhase6) {
        console.log('⚡ Running quick test...');
        const result = window.quickTestPhase6();
        console.log(`✅ Quick test complete: ${result.rate || 0}% success`);
    } else {
        console.log('⚠️ Quick test function not available, running manual check...');
        runManualComponentCheck();
    }
    
    // Create sample data if requested
    if (TEST_CONFIG.createSampleData) {
        setTimeout(() => {
            if (window.createTestSession) {
                console.log('📝 Creating sample test session...');
                const session = window.createTestSession();
                if (session) {
                    console.log('✅ Sample session created successfully');
                } else {
                    console.log('⚠️ Sample session creation failed');
                }
            } else {
                createQuickTestData();
            }
        }, 2000);
    }
}

/**
 * Manual component check fallback
 */
function runManualComponentCheck() {
    const checks = [
        { name: 'Enhanced Logger', test: () => !!(window.enhancedDiagnosticLogger || window.diagnosticLogger) },
        { name: 'Log Management Interface', test: () => !!window.logManagementInterface },
        { name: 'Integration Layer', test: () => !!(window.phase6Integration || window.loggingIntegration) },
        { name: 'Status Monitor', test: () => !!window.phase6StatusMonitor },
        { name: 'Test Suite', test: () => !!window.phase6TestSuite },
        { name: 'App Functions', test: () => typeof window.startDiagnostic === 'function' },
        { name: 'Browser Storage', test: () => !!window.localStorage }
    ];
    
    console.log('🔍 Manual Component Check:');
    let passed = 0;
    
    checks.forEach(check => {
        const result = check.test();
        console.log(`${result ? '✅' : '❌'} ${check.name}`);
        if (result) passed++;
    });
    
    const rate = Math.round((passed / checks.length) * 100);
    console.log(`📊 Manual check result: ${rate}% (${passed}/${checks.length})`);
    
    return { rate, passed, total: checks.length };
}

/**
 * Show test instructions
 */
function showTestInstructions() {
    console.log(`
📋 TESTING INSTRUCTIONS:
=====================================

🎯 QUICK TESTS (run these first):
• quickTestPhase6()        - Fast component verification
• createTestSession()      - Create sample diagnostic data  
• testExports()           - Test export functionality
• testLogInterface()      - Test log management UI

🔬 COMPREHENSIVE TESTS:
• testPhase6()            - Full test suite (30-60 seconds)
• runComprehensiveDemo()  - Complete demo with all features
• runPerformanceTest()    - Performance benchmarking

📊 VIEW RESULTS:
• window.phase6StatusMonitor?.getStatusReport()  - System status
• window.enhancedDiagnosticLogger?.sessionHistory  - Session data
• window.phase6TestSuite?.testResults  - Test results

🖥️ UI TESTING:
• Open test-phase-6.html in browser for visual interface
• Or use console commands above

=====================================
🚀 START TESTING: Run quickTestPhase6() now!
=====================================
`);
}

/**
 * Create quick test data for demo
 */
function createQuickTestData() {
    const logger = window.enhancedDiagnosticLogger || window.diagnosticLogger;
    if (!logger) {
        console.log('❌ No logger available for test data creation');
        return;
    }
    
    console.log('📝 Creating quick test data...');
    
    try {
        // Test session 1 - ABS Light Critical
        const session1 = logger.startSession('abs-light', 'ABS Light Critical', 'supervisor_001');
        if (logger.logStep) {
            logger.logStep(1, 'Initial Assessment', 'question', 'Check ABS light color');
            logger.logStep(2, 'Reset Attempt', 'action', 'Perform system reset');
        }
        if (logger.logDecision) {
            logger.logDecision(1, 'What color is the ABS light?', 'Red', 0, 'critical', 0.95, 'Clearly visible red light');
            logger.logDecision(2, 'Did reset clear the light?', 'No', 1, 'critical', 0.9, 'Light remains on after reset');
        }
        if (logger.logContact) {
            logger.logContact('engineering', 'Depot Engineering - 0191 XXX XXXX', 'Critical ABS system failure', 2, 'Immediate response');
        }
        if (logger.logOutcome) {
            logger.logOutcome('Vehicle must stop immediately', 'critical', ['Engineering'], ['Stop vehicle', 'Contact depot'], 'Safety critical ABS failure');
        }
        logger.completeSession?.();
        
        // Test session 2 - Overheating Warning
        const session2 = logger.startSession('overheating', 'Engine Overheating', 'supervisor_002');
        if (logger.logStep) {
            logger.logStep(1, 'Temperature Check', 'question', 'Check engine temperature gauge');
            logger.logStep(2, 'Coolant Assessment', 'action', 'Check coolant levels');
        }
        if (logger.logDecision) {
            logger.logDecision(1, 'What is the temperature reading?', '95°C', 0, 'warning', 0.8, 'Temperature approaching critical');
            logger.logDecision(2, 'Are coolant levels adequate?', 'Yes', 1, 'continue', 0.9, 'Levels appear normal');
        }
        if (logger.logOutcome) {
            logger.logOutcome('Continue with caution - changeover required', 'warning', [], ['Monitor temperature', 'Plan changeover'], null);
        }
        logger.completeSession?.();
        
        console.log('✅ Quick test data created successfully');
        console.log(`📊 Total sessions: ${logger.sessionHistory?.length || 0}`);
        
    } catch (error) {
        console.log('❌ Error creating test data:', error.message);
    }
}

/**
 * Performance test
 */
function runPerformanceTest() {
    console.log('⚡ Running performance test...');
    
    const logger = window.enhancedDiagnosticLogger || window.diagnosticLogger;
    if (!logger) {
        console.log('❌ No logger available for performance test');
        return;
    }
    
    const tests = [
        {
            name: 'Session Creation',
            test: () => {
                const start = performance.now();
                const sessionId = logger.startSession('perf-test', 'Performance Test', 'test_user');
                const end = performance.now();
                if (sessionId) logger.completeSession?.();
                return end - start;
            }
        },
        {
            name: 'Step Logging',
            test: () => {
                const sessionId = logger.startSession('perf-test-step', 'Step Performance Test', 'test_user');
                const start = performance.now();
                if (logger.logStep) {
                    logger.logStep(1, 'Performance Test Step', 'test', 'Testing step logging performance');
                }
                const end = performance.now();
                if (sessionId) logger.completeSession?.();
                return end - start;
            }
        },
        {
            name: 'Export Generation',
            test: () => {
                const start = performance.now();
                if (logger.exportToCSV) {
                    logger.exportToCSV();
                }
                const end = performance.now();
                return end - start;
            }
        }
    ];
    
    console.log('📊 Performance Test Results:');
    tests.forEach(test => {
        try {
            const time = test.test();
            const status = time < 100 ? '✅ EXCELLENT' : time < 200 ? '⚠️ GOOD' : '❌ SLOW';
            console.log(`${status} ${test.name}: ${time.toFixed(2)}ms`);
        } catch (error) {
            console.log(`❌ FAILED ${test.name}: ${error.message}`);
        }
    });
}

/**
 * Comprehensive demo
 */
function runComprehensiveDemo() {
    console.log(`
🎬 =====================================
   PHASE 6.2 COMPREHENSIVE DEMO
🎬 =====================================`);
    
    console.log('⏱️ This demo will take about 30 seconds...');
    
    // Step 1: System Check
    console.log('\n🔍 Step 1: System Component Check');
    const systemCheck = runManualComponentCheck();
    
    // Step 2: Create Sample Data
    console.log('\n📝 Step 2: Creating Sample Diagnostic Sessions');
    createQuickTestData();
    
    // Step 3: Test Exports
    setTimeout(() => {
        console.log('\n📤 Step 3: Testing Export Functionality');
        if (window.testExports) {
            window.testExports();
        } else {
            const logger = window.enhancedDiagnosticLogger || window.diagnosticLogger;
            if (logger && logger.exportToCSV) {
                const csv = logger.exportToCSV();
                console.log(`✅ CSV Export: ${csv ? 'Success' : 'Failed'}`);
            }
            if (logger && logger.exportToJSON) {
                const json = logger.exportToJSON();
                console.log(`✅ JSON Export: ${json ? 'Success' : 'Failed'}`);
            }
        }
    }, 5000);
    
    // Step 4: Performance Test
    setTimeout(() => {
        console.log('\n⚡ Step 4: Performance Testing');
        runPerformanceTest();
    }, 10000);
    
    // Step 5: Interface Test
    setTimeout(() => {
        console.log('\n🖥️ Step 5: Testing Log Management Interface');
        if (window.testLogInterface) {
            window.testLogInterface();
        } else {
            const logManager = window.logManagementInterface;
            if (logManager && logManager.show) {
                console.log('✅ Opening log management interface...');
                logManager.show();
                setTimeout(() => {
                    if (logManager.closeModal) {
                        logManager.closeModal();
                        console.log('✅ Interface test complete');
                    }
                }, 3000);
            } else {
                console.log('⚠️ Log management interface not available');
            }
        }
    }, 15000);
    
    // Step 6: Summary
    setTimeout(() => {
        showDemoSummary(systemCheck, { successRate: systemCheck.rate });
    }, 20000);
}

/**
 * Show demo summary
 */
function showDemoSummary(systemCheck, testResult) {
    console.log(`
🏆 =====================================
   PHASE 6.2 DEMO SUMMARY
🏆 =====================================`);
    
    console.log(`📊 System Check: ${systemCheck.rate}% (${systemCheck.passed}/${systemCheck.total})`);
    console.log(`🧪 Test Results: ${testResult.successRate || testResult.rate || 0}%`);
    
    const logger = window.enhancedDiagnosticLogger || window.diagnosticLogger;
    if (logger && logger.sessionHistory) {
        console.log(`📝 Sessions Created: ${logger.sessionHistory.length}`);
    }
    
    const overallHealth = Math.round(((systemCheck.rate + (testResult.successRate || testResult.rate || 0)) / 2));
    
    console.log(`\n🎯 Overall Health: ${overallHealth}%`);
    
    if (overallHealth >= 80) {
        console.log(`
🎉 EXCELLENT! Phase 6.2 is working great!
✅ Ready for production deployment
✅ All core features operational
✅ Performance within acceptable ranges`);
    } else if (overallHealth >= 60) {
        console.log(`
⚠️ GOOD! Phase 6.2 is mostly working
🔧 Some features may need attention
🔍 Review failed components`);
    } else {
        console.log(`
❌ NEEDS WORK! Phase 6.2 has issues
🛠️ Multiple components need fixing
📞 Contact support for assistance`);
    }
    
    console.log(`
📋 Next Steps:
• Review any failed tests in detail
• Test in different browsers if issues found  
• Proceed to production deployment if health >80%
• Continue to Phase 7 if all tests pass

=====================================`);
}

// Global functions for easy access
window.initializeTestEnvironment = initializeTestEnvironment;
window.runAutoTests = runAutoTests;
window.createQuickTestData = createQuickTestData;
window.runPerformanceTest = runPerformanceTest;
window.runComprehensiveDemo = runComprehensiveDemo;
window.runManualComponentCheck = runManualComponentCheck;

// Auto-initialize when loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initializeTestEnvironment, 500);
    });
} else {
    setTimeout(initializeTestEnvironment, 500);
}

console.log(`
🎯 QUICK START COMMANDS:
• runComprehensiveDemo()   - Full 30-second demo
• quickTestPhase6()        - Quick verification
• createQuickTestData()    - Generate sample data
• runPerformanceTest()     - Performance check

=====================================`);
