/**
 * Phase 6.2 Testing Suite
 * Go North East - Breakdown Guide
 * Comprehensive testing for Enhanced Action Logging System
 */

// ==================================================
// PHASE 6.2 TESTING SUITE
// ==================================================

class Phase6TestSuite {
    constructor() {
        this.testResults = [];
        this.currentTest = null;
        this.startTime = null;
        this.testData = {
            sessionId: null,
            testUser: 'test_supervisor_' + Date.now(),
            testIssue: 'abs-light',
            testSteps: [],
            testDecisions: [],
            testNotes: [],
            testContacts: []
        };
    }

    /**
     * Run all Phase 6.2 tests
     */
    async runAllTests() {
        console.log('🧪 Starting Phase 6.2 Test Suite...');
        console.log('=====================================');
        
        try {
            // Test 1: Component Initialization
            await this.testComponentInitialization();
            
            // Test 2: Enhanced Logger Functionality
            await this.testEnhancedLogger();
            
            // Test 3: Session Management
            await this.testSessionManagement();
            
            // Test 4: Decision Logging
            await this.testDecisionLogging();
            
            // Test 5: Contact Logging
            await this.testContactLogging();
            
            // Test 6: Export Functionality
            await this.testExportFunctionality();
            
            // Test 7: Log Management Interface
            await this.testLogManagementInterface();
            
            // Test 8: Integration with Existing App
            await this.testAppIntegration();
            
            // Test 9: Data Persistence
            await this.testDataPersistence();
            
            // Test 10: Performance & Error Handling
            await this.testPerformanceAndErrors();
            
            // Generate test report
            this.generateTestReport();
            
        } catch (error) {
            console.error('❌ Test suite failed:', error);
            this.logTestResult('CRITICAL', 'Test Suite Execution', false, error.message);
        }
    }

    /**
     * Test 1: Component Initialization
     */
    async testComponentInitialization() {
        this.startTest('Component Initialization');
        
        try {
            // Check if enhanced logger exists
            const hasEnhancedLogger = !!(window.enhancedDiagnosticLogger);
            this.logTestResult('INIT', 'Enhanced Logger Available', hasEnhancedLogger, 
                hasEnhancedLogger ? 'Enhanced logger found' : 'Using fallback logger');
            
            // Check if basic logger exists as fallback
            const hasBasicLogger = !!(window.diagnosticLogger);
            this.logTestResult('INIT', 'Basic Logger Fallback', hasBasicLogger, 
                hasBasicLogger ? 'Basic logger available' : 'No logger available');
            
            // Check if log management interface exists
            const hasLogManagement = !!(window.logManagementInterface);
            this.logTestResult('INIT', 'Log Management Interface', hasLogManagement, 
                hasLogManagement ? 'Interface available' : 'Interface not found');
            
            // Check if integration layer exists
            const hasIntegration = !!(window.phase6Integration || window.loggingIntegration);
            this.logTestResult('INIT', 'Integration Layer', hasIntegration, 
                hasIntegration ? 'Integration layer active' : 'Integration layer not found');
            
            // Check if status monitor exists
            const hasStatusMonitor = !!(window.phase6StatusMonitor);
            this.logTestResult('INIT', 'Status Monitor', hasStatusMonitor, 
                hasStatusMonitor ? 'Status monitor active' : 'Status monitor not found');
            
            this.completeTest(true);
            
        } catch (error) {
            this.completeTest(false, error.message);
        }
    }

    /**
     * Test 2: Enhanced Logger Functionality
     */
    async testEnhancedLogger() {
        this.startTest('Enhanced Logger Functionality');
        
        try {
            const logger = window.enhancedDiagnosticLogger || window.diagnosticLogger;
            
            if (!logger) {
                this.completeTest(false, 'No logger available for testing');
                return;
            }
            
            // Test session creation
            const sessionId = logger.startSession(
                this.testData.testIssue, 
                'ABS Light Test Issue', 
                this.testData.testUser
            );
            
            this.testData.sessionId = sessionId;
            const sessionCreated = !!(sessionId && logger.currentSession);
            this.logTestResult('LOGGER', 'Session Creation', sessionCreated, 
                sessionCreated ? `Session created: ${sessionId}` : 'Failed to create session');
            
            // Test step logging
            if (logger.logStep) {
                logger.logStep(1, 'Test Step', 'question', 'This is a test step for verification');
                const hasSteps = logger.currentSession?.steps?.length > 0;
                this.logTestResult('LOGGER', 'Step Logging', hasSteps, 
                    hasSteps ? 'Step logged successfully' : 'Step logging failed');
            }
            
            // Test note logging
            if (logger.logNote) {
                logger.logNote('This is a test note for verification', 1, 'test', 'testing', 'normal');
                const hasNotes = logger.currentSession?.notes?.length > 0;
                this.logTestResult('LOGGER', 'Note Logging', hasNotes, 
                    hasNotes ? 'Note logged successfully' : 'Note logging failed');
            }
            
            // Test outcome logging
            if (logger.logOutcome) {
                logger.logOutcome('Test completed', 'continue', [], ['Test verification'], null);
                const hasOutcome = !!(logger.currentSession?.outcome);
                this.logTestResult('LOGGER', 'Outcome Logging', hasOutcome, 
                    hasOutcome ? 'Outcome logged successfully' : 'Outcome logging failed');
            }
            
            this.completeTest(true);
            
        } catch (error) {
            this.completeTest(false, error.message);
        }
    }

    /**
     * Test 3: Session Management
     */
    async testSessionManagement() {
        this.startTest('Session Management');
        
        try {
            const logger = window.enhancedDiagnosticLogger || window.diagnosticLogger;
            
            if (!logger || !logger.currentSession) {
                this.completeTest(false, 'No active session for testing');
                return;
            }
            
            // Test session data integrity
            const session = logger.currentSession;
            const hasRequiredFields = !!(session.sessionId && session.startTime && session.userId);
            this.logTestResult('SESSION', 'Data Integrity', hasRequiredFields, 
                hasRequiredFields ? 'All required fields present' : 'Missing required fields');
            
            // Test session completion
            const completedSession = logger.completeSession();
            const sessionCompleted = !!(completedSession && completedSession.completed);
            this.logTestResult('SESSION', 'Session Completion', sessionCompleted, 
                sessionCompleted ? 'Session completed successfully' : 'Session completion failed');
            
            // Test session history
            const hasHistory = logger.sessionHistory && logger.sessionHistory.length > 0;
            this.logTestResult('SESSION', 'History Storage', hasHistory, 
                hasHistory ? `${logger.sessionHistory.length} sessions in history` : 'No session history');
            
            this.completeTest(true);
            
        } catch (error) {
            this.completeTest(false, error.message);
        }
    }

    /**
     * Test 4: Decision Logging
     */
    async testDecisionLogging() {
        this.startTest('Decision Logging');
        
        try {
            const logger = window.enhancedDiagnosticLogger || window.diagnosticLogger;
            
            // Create a new test session for decision testing
            const sessionId = logger.startSession('test-decisions', 'Decision Test', this.testData.testUser);
            
            if (logger.logDecision) {
                // Test basic decision logging
                logger.logDecision(1, 'Test question?', 'Test answer', 0, 'warning');
                
                // Test decision with confidence and rationale
                if (logger.currentSession) {
                    logger.logDecision(
                        2, 
                        'Is this a test decision?', 
                        'Yes, this is a test', 
                        1, 
                        'continue', 
                        0.95, 
                        'Testing decision logging with confidence'
                    );
                }
                
                const hasDecisions = logger.currentSession?.decisions?.length > 0;
                this.logTestResult('DECISION', 'Decision Logging', hasDecisions, 
                    hasDecisions ? `${logger.currentSession.decisions.length} decisions logged` : 'No decisions logged');
                
                // Test decision data structure
                if (hasDecisions) {
                    const decision = logger.currentSession.decisions[0];
                    const hasRequiredFields = !!(decision.decisionId && decision.timestamp && decision.question);
                    this.logTestResult('DECISION', 'Data Structure', hasRequiredFields, 
                        hasRequiredFields ? 'Decision data structure valid' : 'Invalid decision data structure');
                }
            } else {
                this.logTestResult('DECISION', 'Decision Logging', false, 'logDecision method not available');
            }
            
            logger.completeSession();
            this.completeTest(true);
            
        } catch (error) {
            this.completeTest(false, error.message);
        }
    }

    /**
     * Test 5: Contact Logging
     */
    async testContactLogging() {
        this.startTest('Contact Logging');
        
        try {
            const logger = window.enhancedDiagnosticLogger || window.diagnosticLogger;
            
            // Create a new test session for contact testing
            const sessionId = logger.startSession('test-contacts', 'Contact Test', this.testData.testUser);
            
            if (logger.logContact) {
                // Test contact logging
                logger.logContact(
                    'engineering', 
                    'Test Engineering - 0191 XXX XXXX', 
                    'Test contact for verification', 
                    1, 
                    'Immediate response required'
                );
                
                const hasContacts = logger.currentSession?.contacts?.length > 0;
                this.logTestResult('CONTACT', 'Contact Logging', hasContacts, 
                    hasContacts ? `${logger.currentSession.contacts.length} contacts logged` : 'No contacts logged');
                
                // Test contact response update
                if (hasContacts && logger.updateContactResponse) {
                    const contactId = logger.currentSession.contacts[0].contactId;
                    logger.updateContactResponse(contactId, {
                        outcome: 'Test response received',
                        notes: 'Test response for verification'
                    });
                    
                    const hasResponse = logger.currentSession.contacts[0].response?.received;
                    this.logTestResult('CONTACT', 'Response Update', hasResponse, 
                        hasResponse ? 'Contact response updated' : 'Response update failed');
                }
            } else {
                this.logTestResult('CONTACT', 'Contact Logging', false, 'logContact method not available');
            }
            
            logger.completeSession();
            this.completeTest(true);
            
        } catch (error) {
            this.completeTest(false, error.message);
        }
    }

    /**
     * Test 6: Export Functionality
     */
    async testExportFunctionality() {
        this.startTest('Export Functionality');
        
        try {
            const logger = window.enhancedDiagnosticLogger || window.diagnosticLogger;
            
            if (!logger.sessionHistory || logger.sessionHistory.length === 0) {
                this.logTestResult('EXPORT', 'Test Data', false, 'No session data for export testing');
                this.completeTest(false, 'No data available for export testing');
                return;
            }
            
            // Test CSV export
            if (logger.exportToCSV) {
                const csvData = logger.exportToCSV();
                const csvExportWorks = !!(csvData && csvData.includes('Session ID'));
                this.logTestResult('EXPORT', 'CSV Export', csvExportWorks, 
                    csvExportWorks ? 'CSV export successful' : 'CSV export failed');
            }
            
            // Test JSON export
            if (logger.exportToJSON) {
                const jsonData = logger.exportToJSON();
                const jsonExportWorks = !!(jsonData && jsonData.includes('exportInfo'));
                this.logTestResult('EXPORT', 'JSON Export', jsonExportWorks, 
                    jsonExportWorks ? 'JSON export successful' : 'JSON export failed');
            }
            
            // Test audit trail generation
            if (logger.generateAuditTrail || logger.generateComprehensiveAuditTrail) {
                const auditMethod = logger.generateComprehensiveAuditTrail || logger.generateAuditTrail;
                const auditData = auditMethod.call(logger);
                const auditWorks = !!(auditData && (auditData.sessions || auditData.reportGenerated));
                this.logTestResult('EXPORT', 'Audit Trail', auditWorks, 
                    auditWorks ? 'Audit trail generation successful' : 'Audit trail generation failed');
            }
            
            this.completeTest(true);
            
        } catch (error) {
            this.completeTest(false, error.message);
        }
    }

    /**
     * Test 7: Log Management Interface
     */
    async testLogManagementInterface() {
        this.startTest('Log Management Interface');
        
        try {
            const logManager = window.logManagementInterface;
            
            if (!logManager) {
                this.logTestResult('UI', 'Interface Available', false, 'Log management interface not found');
                this.completeTest(false, 'Log management interface not available');
                return;
            }
            
            // Test interface initialization
            if (logManager.init) {
                logManager.init();
                this.logTestResult('UI', 'Interface Init', true, 'Interface initialized successfully');
            }
            
            // Test modal creation
            const modal = document.getElementById('logManagementModal');
            const modalExists = !!modal;
            this.logTestResult('UI', 'Modal Creation', modalExists, 
                modalExists ? 'Modal created successfully' : 'Modal creation failed');
            
            // Test show/hide functionality
            if (logManager.show && logManager.closeModal) {
                logManager.show();
                const modalVisible = modal && modal.style.display === 'block';
                this.logTestResult('UI', 'Show Modal', modalVisible, 
                    modalVisible ? 'Modal shows correctly' : 'Modal show failed');
                
                logManager.closeModal();
                const modalHidden = modal && modal.style.display === 'none';
                this.logTestResult('UI', 'Hide Modal', modalHidden, 
                    modalHidden ? 'Modal hides correctly' : 'Modal hide failed');
            }
            
            this.completeTest(true);
            
        } catch (error) {
            this.completeTest(false, error.message);
        }
    }

    /**
     * Test 8: Integration with Existing App
     */
    async testAppIntegration() {
        this.startTest('App Integration');
        
        try {
            // Test if original app functions still exist
            const hasStartDiagnostic = typeof window.startDiagnostic === 'function';
            this.logTestResult('INTEGRATION', 'startDiagnostic Function', hasStartDiagnostic, 
                hasStartDiagnostic ? 'Function available' : 'Function missing');
            
            // Test if enhanced functions are integrated
            const hasDisplayStep = typeof window.displayStep === 'function';
            this.logTestResult('INTEGRATION', 'displayStep Function', hasDisplayStep, 
                hasDisplayStep ? 'Function available' : 'Function missing');
            
            // Test if diagnostic flows are available
            const hasDiagnosticFlows = !!(window.diagnosticFlows);
            this.logTestResult('INTEGRATION', 'Diagnostic Flows', hasDiagnosticFlows, 
                hasDiagnosticFlows ? 'Diagnostic flows available' : 'Diagnostic flows missing');
            
            // Test if app state is available
            const hasAppState = !!(window.appState);
            this.logTestResult('INTEGRATION', 'App State', hasAppState, 
                hasAppState ? 'App state available' : 'App state missing');
            
            // Test UI enhancements
            const hasStatusIndicator = !!(document.querySelector('.logging-status-indicator, #loggingStatusIndicator'));
            this.logTestResult('INTEGRATION', 'Status Indicator', hasStatusIndicator, 
                hasStatusIndicator ? 'Status indicator present' : 'Status indicator missing');
            
            this.completeTest(true);
            
        } catch (error) {
            this.completeTest(false, error.message);
        }
    }

    /**
     * Test 9: Data Persistence
     */
    async testDataPersistence() {
        this.startTest('Data Persistence');
        
        try {
            const logger = window.enhancedDiagnosticLogger || window.diagnosticLogger;
            
            // Test localStorage availability
            const hasLocalStorage = !!(window.localStorage);
            this.logTestResult('STORAGE', 'LocalStorage Available', hasLocalStorage, 
                hasLocalStorage ? 'LocalStorage available' : 'LocalStorage not available');
            
            if (!hasLocalStorage) {
                this.completeTest(false, 'LocalStorage not available');
                return;
            }
            
            // Test data saving
            const testKey = 'phase6_test_data';
            const testData = { test: true, timestamp: Date.now() };
            
            try {
                localStorage.setItem(testKey, JSON.stringify(testData));
                const savedData = JSON.parse(localStorage.getItem(testKey));
                const dataSaved = savedData && savedData.test === true;
                this.logTestResult('STORAGE', 'Data Save/Load', dataSaved, 
                    dataSaved ? 'Data persistence working' : 'Data persistence failed');
                
                // Clean up test data
                localStorage.removeItem(testKey);
            } catch (storageError) {
                this.logTestResult('STORAGE', 'Data Save/Load', false, `Storage error: ${storageError.message}`);
            }
            
            // Test logger data persistence
            if (logger && logger.sessionHistory) {
                const hasPersistedSessions = logger.sessionHistory.length > 0;
                this.logTestResult('STORAGE', 'Session Persistence', hasPersistedSessions, 
                    hasPersistedSessions ? `${logger.sessionHistory.length} sessions persisted` : 'No persisted sessions');
            }
            
            this.completeTest(true);
            
        } catch (error) {
            this.completeTest(false, error.message);
        }
    }

    /**
     * Test 10: Performance & Error Handling
     */
    async testPerformanceAndErrors() {
        this.startTest('Performance & Error Handling');
        
        try {
            const logger = window.enhancedDiagnosticLogger || window.diagnosticLogger;
            
            // Test performance of session creation
            const startTime = performance.now();
            const sessionId = logger.startSession('perf-test', 'Performance Test', 'test_user');
            const endTime = performance.now();
            const sessionTime = endTime - startTime;
            
            const performanceGood = sessionTime < 100; // Should take less than 100ms
            this.logTestResult('PERFORMANCE', 'Session Creation Speed', performanceGood, 
                `Session creation took ${sessionTime.toFixed(2)}ms`);
            
            // Test error handling with invalid data
            try {
                if (logger.logDecision) {
                    logger.logDecision(null, null, null, null, null); // Invalid data
                }
                this.logTestResult('ERROR', 'Invalid Data Handling', true, 'Handled invalid data gracefully');
            } catch (errorHandlingError) {
                this.logTestResult('ERROR', 'Invalid Data Handling', false, `Error: ${errorHandlingError.message}`);
            }
            
            // Test memory usage (basic check)
            const memoryUsage = this.estimateMemoryUsage();
            const memoryReasonable = memoryUsage < 10000; // Less than 10MB estimated
            this.logTestResult('PERFORMANCE', 'Memory Usage', memoryReasonable, 
                `Estimated usage: ${memoryUsage}KB`);
            
            if (sessionId) {
                logger.completeSession();
            }
            
            this.completeTest(true);
            
        } catch (error) {
            this.completeTest(false, error.message);
        }
    }

    // ==================================================
    // HELPER METHODS
    // ==================================================

    startTest(testName) {
        this.currentTest = testName;
        this.startTime = Date.now();
        console.log(`🧪 Testing: ${testName}...`);
    }

    completeTest(success, message = '') {
        const duration = Date.now() - this.startTime;
        const status = success ? '✅ PASS' : '❌ FAIL';
        console.log(`${status} ${this.currentTest} (${duration}ms) ${message}`);
        console.log('-------------------------------------');
    }

    logTestResult(category, testName, passed, details) {
        this.testResults.push({
            category,
            testName,
            passed,
            details,
            timestamp: new Date().toISOString()
        });
        
        const status = passed ? '✅' : '❌';
        console.log(`  ${status} ${testName}: ${details}`);
    }

    estimateMemoryUsage() {
        let totalSize = 0;
        
        // Estimate localStorage usage
        for (let key in localStorage) {
            if (key.includes('diagnostic') || key.includes('breakdown') || key.startsWith('gne_')) {
                totalSize += localStorage[key].length + key.length;
            }
        }
        
        return Math.round(totalSize / 1024);
    }

    generateTestReport() {
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.passed).length;
        const failedTests = totalTests - passedTests;
        const successRate = Math.round((passedTests / totalTests) * 100);
        
        console.log(`
🏆 PHASE 6.2 TEST REPORT
=====================================
Total Tests: ${totalTests}
Passed: ${passedTests}
Failed: ${failedTests}
Success Rate: ${successRate}%

Status: ${successRate >= 80 ? '✅ EXCELLENT' : successRate >= 60 ? '⚠️ GOOD' : '❌ NEEDS WORK'}

${successRate >= 80 ? 
    '🎉 Phase 6.2 is working excellently!' : 
    '⚠️ Some issues detected - review failed tests'
}
=====================================
        `);
        
        // Group results by category
        const categories = {};
        this.testResults.forEach(result => {
            if (!categories[result.category]) {
                categories[result.category] = [];
            }
            categories[result.category].push(result);
        });
        
        // Show detailed results by category
        Object.entries(categories).forEach(([category, results]) => {
            const categoryPassed = results.filter(r => r.passed).length;
            const categoryTotal = results.length;
            console.log(`\n📊 ${category}: ${categoryPassed}/${categoryTotal}`);
            
            results.forEach(result => {
                const status = result.passed ? '✅' : '❌';
                console.log(`  ${status} ${result.testName}`);
                if (!result.passed) {
                    console.log(`     └─ ${result.details}`);
                }
            });
        });
        
        return {
            totalTests,
            passedTests,
            failedTests,
            successRate,
            results: this.testResults,
            categories
        };
    }

    /**
     * Quick test for immediate verification
     */
    quickTest() {
        console.log('⚡ Running Quick Phase 6.2 Test...');
        
        const checks = {
            'Enhanced Logger': !!(window.enhancedDiagnosticLogger || window.diagnosticLogger),
            'Log Management': !!window.logManagementInterface,
            'Integration': !!(window.phase6Integration || window.loggingIntegration),
            'Status Monitor': !!window.phase6StatusMonitor,
            'App Functions': typeof window.startDiagnostic === 'function',
            'Storage': !!window.localStorage
        };
        
        const passed = Object.values(checks).filter(Boolean).length;
        const total = Object.keys(checks).length;
        const rate = Math.round((passed / total) * 100);
        
        console.log('Quick Test Results:');
        Object.entries(checks).forEach(([check, result]) => {
            console.log(`${result ? '✅' : '❌'} ${check}`);
        });
        
        console.log(`\nQuick Test: ${rate}% (${passed}/${total})`);
        
        if (rate >= 80) {
            console.log('🎉 Phase 6.2 looks good! Run full test for detailed analysis.');
        } else {
            console.log('⚠️ Issues detected. Running full test recommended.');
        }
        
        return { rate, passed, total, checks };
    }
}

// ==================================================
// INTERACTIVE TESTING FUNCTIONS
// ==================================================

/**
 * Create a test session with sample data
 */
function createTestSession() {
    console.log('🧪 Creating test session...');
    
    const logger = window.enhancedDiagnosticLogger || window.diagnosticLogger;
    if (!logger) {
        console.error('❌ No logger available');
        return null;
    }
    
    // Start test session
    const sessionId = logger.startSession('abs-light', 'ABS Light Test', 'test_supervisor');
    console.log(`✅ Test session created: ${sessionId}`);
    
    // Add test steps
    if (logger.logStep) {
        logger.logStep(1, 'Initial Assessment', 'question', 'Check ABS light color');
        logger.logStep(2, 'Reset Procedure', 'action', 'Perform system reset');
        console.log('✅ Test steps logged');
    }
    
    // Add test decisions
    if (logger.logDecision) {
        logger.logDecision(1, 'What color is the ABS light?', 'Red', 0, 'critical', 0.9, 'Light clearly visible');
        logger.logDecision(2, 'Did reset clear the light?', 'No', 1, 'critical', 0.8, 'Light remains on after reset');
        console.log('✅ Test decisions logged');
    }
    
    // Add test notes
    if (logger.logNote) {
        logger.logNote('Test note: Vehicle shows persistent ABS fault', 2, 'observation', 'safety', 'high');
        console.log('✅ Test notes logged');
    }
    
    // Add test contact
    if (logger.logContact) {
        logger.logContact('engineering', 'Test Engineering - 0191 XXX XXXX', 'Critical ABS system failure', 2, 'Immediate response');
        console.log('✅ Test contact logged');
    }
    
    // Complete session with outcome
    if (logger.logOutcome) {
        logger.logOutcome('Vehicle must stop - critical ABS failure', 'critical', ['Engineering'], ['Stop vehicle', 'Contact depot'], 'Safety critical ABS system failure');
        console.log('✅ Test outcome logged');
    }
    
    // Complete the session
    const completed = logger.completeSession();
    if (completed) {
        console.log('✅ Test session completed successfully');
        console.log('📊 Session data:', completed);
        return completed;
    }
    
    return null;
}

/**
 * Test export functionality
 */
function testExports() {
    console.log('📤 Testing export functionality...');
    
    const logger = window.enhancedDiagnosticLogger || window.diagnosticLogger;
    if (!logger || !logger.sessionHistory || logger.sessionHistory.length === 0) {
        console.log('⚠️ No session data available. Creating test session first...');
        createTestSession();
    }
    
    // Test CSV export
    if (logger.exportToCSV) {
        const csvData = logger.exportToCSV();
        if (csvData) {
            console.log('✅ CSV Export working');
            console.log('📄 CSV Preview:', csvData.substring(0, 200) + '...');
        } else {
            console.log('❌ CSV Export failed');
        }
    }
    
    // Test JSON export
    if (logger.exportToJSON) {
        const jsonData = logger.exportToJSON();
        if (jsonData) {
            console.log('✅ JSON Export working');
            console.log('📄 JSON Preview:', jsonData.substring(0, 200) + '...');
        } else {
            console.log('❌ JSON Export failed');
        }
    }
    
    // Test audit trail
    if (logger.generateAuditTrail || logger.generateComprehensiveAuditTrail) {
        const auditMethod = logger.generateComprehensiveAuditTrail || logger.generateAuditTrail;
        const auditData = auditMethod.call(logger);
        if (auditData) {
            console.log('✅ Audit Trail working');
            console.log('📄 Audit Preview:', JSON.stringify(auditData).substring(0, 200) + '...');
        } else {
            console.log('❌ Audit Trail failed');
        }
    }
}

/**
 * Test log management interface
 */
function testLogInterface() {
    console.log('🖥️ Testing log management interface...');
    
    const logManager = window.logManagementInterface;
    if (!logManager) {
        console.log('❌ Log management interface not available');
        return;
    }
    
    // Test showing the interface
    if (logManager.show) {
        logManager.show();
        console.log('✅ Interface shown - check if modal appeared');
        
        // Auto-hide after 3 seconds for testing
        setTimeout(() => {
            if (logManager.closeModal) {
                logManager.closeModal();
                console.log('✅ Interface hidden');
            }
        }, 3000);
    }
}

// ==================================================
// GLOBAL TEST FUNCTIONS
// ==================================================

// Create global test instance
window.phase6TestSuite = new Phase6TestSuite();

// Convenience functions
window.testPhase6 = () => window.phase6TestSuite.runAllTests();
window.quickTestPhase6 = () => window.phase6TestSuite.quickTest();
window.createTestSession = createTestSession;
window.testExports = testExports;
window.testLogInterface = testLogInterface;

// ==================================================
// AUTO-RUN QUICK TEST
// ==================================================

// Run quick test automatically when loaded
setTimeout(() => {
    console.log('🚀 Phase 6.2 Testing Suite Loaded');
    console.log('=====================================');
    console.log('Available test functions:');
    console.log('• testPhase6() - Run full test suite');
    console.log('• quickTestPhase6() - Run quick verification');
    console.log('• createTestSession() - Create sample data');
    console.log('• testExports() - Test export functions');
    console.log('• testLogInterface() - Test UI interface');
    console.log('=====================================');
    
    // Run quick test automatically
    window.phase6TestSuite.quickTest();
}, 1000);
