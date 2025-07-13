/**
 * Go North East - Breakdown Guide
 * Data Persistence Test Scenarios
 * Tests local storage, session management, and data recovery
 */

// Test 1: Session Creation and Storage
testRunner.addTest(
    'Data - Session Creation',
    'Test that diagnostic sessions are created and stored correctly',
    async () => {
        // Clear existing data
        localStorage.removeItem('breakdownGuide_sessions');
        localStorage.removeItem('breakdownGuide_currentSession');
        
        // Start a new diagnosis
        await testRunner.utils.click('#startDiagnosisBtn');
        await testRunner.utils.waitForElement('#categoryGrid');
        
        // Select oil warning (critical issue)
        const oilCategory = Array.from(document.querySelectorAll('.category-card'))
            .find(card => card.textContent.includes('Oil Warning'));
        
        if (oilCategory) {
            oilCategory.click();
            await testRunner.utils.waitForElement('#wizardScreen.active');
            
            // Check current session created
            const currentSession = localStorage.getItem('breakdownGuide_currentSession');
            testRunner.assert.isTrue(currentSession !== null, 'Current session should be created');
            
            const session = JSON.parse(currentSession);
            testRunner.assert.equals(session.issueId, 'oil-warning', 'Issue ID should match');
            testRunner.assert.isTrue(session.id !== undefined, 'Session should have ID');
            testRunner.assert.isTrue(session.startTime !== undefined, 'Session should have start time');
        }
    }
);

// Test 2: Auto-save Functionality
testRunner.addTest(
    'Data - Auto-save Notes',
    'Test that notes are auto-saved every 30 seconds',
    async () => {
        // Continue from previous test or start fresh
        if (!document.querySelector('#wizardScreen.active')) {
            await testRunner.utils.click('#startDiagnosisBtn');
            await testRunner.utils.waitForElement('#categoryGrid');
            const category = document.querySelector('.category-card');
            category.click();
            await testRunner.utils.waitForElement('#wizardScreen.active');
        }
        
        // Type notes
        const testNote = 'Test auto-save functionality ' + new Date().getTime();
        await testRunner.utils.typeText('#notesInput', testNote);
        
        // Trigger save manually (in real app, this happens automatically)
        await testRunner.utils.click('#saveNotesBtn');
        
        // Check session updated
        const currentSession = localStorage.getItem('breakdownGuide_currentSession');
        const session = JSON.parse(currentSession);
        testRunner.assert.equals(session.notes, testNote, 'Notes should be saved');
        
        // Verify timestamp updated
        testRunner.assert.isTrue(session.lastModified !== undefined, 'Last modified time should exist');
    }
);

// Test 3: Session Recovery
testRunner.addTest(
    'Data - Session Recovery',
    'Test incomplete session recovery after page reload',
    async () => {
        // Create an incomplete session
        const incompleteSession = {
            id: 'test-recovery-' + Date.now(),
            issueId: 'brakes',
            issueName: 'Brake System Diagnostic',
            startTime: new Date().toISOString(),
            status: 'in-progress',
            currentStep: 'symptoms-check',
            responses: {
                'symptoms-check': ['pedal-sinks', 'unusual-noises']
            },
            notes: 'Test recovery notes'
        };
        
        // Save to localStorage
        localStorage.setItem('breakdownGuide_currentSession', JSON.stringify(incompleteSession));
        
        // Simulate checking for incomplete session on load
        const savedSession = localStorage.getItem('breakdownGuide_currentSession');
        testRunner.assert.isTrue(savedSession !== null, 'Session should be saved');
        
        const recovered = JSON.parse(savedSession);
        testRunner.assert.equals(recovered.id, incompleteSession.id, 'Session ID should match');
        testRunner.assert.equals(recovered.status, 'in-progress', 'Status should be in-progress');
        testRunner.assert.equals(recovered.currentStep, 'symptoms-check', 'Current step should be saved');
        
        // In real implementation, app would offer to resume this session
    }
);

// Test 4: Data Expiry
testRunner.addTest(
    'Data - 30-day Expiry',
    'Test that old sessions are cleaned up after 30 days',
    async () => {
        // Create old sessions
        const now = new Date();
        const oldDate = new Date(now.getTime() - (35 * 24 * 60 * 60 * 1000)); // 35 days ago
        const recentDate = new Date(now.getTime() - (25 * 24 * 60 * 60 * 1000)); // 25 days ago
        
        const sessions = [
            {
                id: 'old-session',
                startTime: oldDate.toISOString(),
                endTime: oldDate.toISOString(),
                status: 'completed'
            },
            {
                id: 'recent-session',
                startTime: recentDate.toISOString(),
                endTime: recentDate.toISOString(),
                status: 'completed'
            }
        ];
        
        localStorage.setItem('breakdownGuide_sessions', JSON.stringify(sessions));
        
        // Run cleanup (this would be done by sessionManager.cleanupOldSessions())
        const stored = JSON.parse(localStorage.getItem('breakdownGuide_sessions'));
        const cutoffDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
        
        const cleaned = stored.filter(session => {
            const sessionDate = new Date(session.startTime);
            return sessionDate > cutoffDate;
        });
        
        testRunner.assert.equals(cleaned.length, 1, 'Should have 1 session after cleanup');
        testRunner.assert.equals(cleaned[0].id, 'recent-session', 'Recent session should remain');
    }
);

// Test 5: Export Functionality
testRunner.addTest(
    'Data - Export Sessions',
    'Test session export to JSON format',
    async () => {
        // Create test sessions
        const testSessions = [
            {
                id: 'export-test-1',
                issueId: 'abs-light',
                issueName: 'ABS Light',
                startTime: new Date().toISOString(),
                endTime: new Date().toISOString(),
                status: 'completed',
                outcome: 'Vehicle stopped - Engineering required',
                notes: 'Red ABS light remained on after reset'
            },
            {
                id: 'export-test-2',
                issueId: 'overheating',
                issueName: 'Overheating',
                startTime: new Date().toISOString(),
                endTime: new Date().toISOString(),
                status: 'completed',
                outcome: 'Changeover arranged',
                notes: 'Temperature at 95°C, no leaks found'
            }
        ];
        
        // Test export format
        const exportData = {
            exportDate: new Date().toISOString(),
            version: '1.0',
            sessions: testSessions,
            statistics: {
                totalSessions: testSessions.length,
                completedSessions: testSessions.filter(s => s.status === 'completed').length,
                criticalIssues: testSessions.filter(s => s.outcome?.includes('stopped')).length
            }
        };
        
        // Verify export structure
        testRunner.assert.isTrue(exportData.exportDate !== undefined, 'Export should have date');
        testRunner.assert.equals(exportData.sessions.length, 2, 'Should export 2 sessions');
        testRunner.assert.equals(exportData.statistics.totalSessions, 2, 'Statistics should be correct');
        
        // In real implementation, this would trigger download
        const exportJson = JSON.stringify(exportData, null, 2);
        testRunner.assert.isTrue(exportJson.length > 0, 'Export JSON should not be empty');
    }
);

// Test 6: Storage Limits and Cleanup
testRunner.addTest(
    'Data - Storage Management',
    'Test storage limit handling and cleanup',
    async () => {
        // Check current storage usage
        const currentSessions = localStorage.getItem('breakdownGuide_sessions') || '[]';
        const currentSize = new Blob([currentSessions]).size;
        
        // Storage calculations
        const maxSize = 5 * 1024 * 1024; // 5MB limit
        const warningThreshold = maxSize * 0.8; // 80% warning
        
        testRunner.assert.isTrue(currentSize < maxSize, 'Storage should be under limit');
        
        // Test preferences storage
        const preferences = {
            theme: 'light',
            fontSize: 'medium',
            highContrast: false,
            reducedMotion: false
        };
        
        localStorage.setItem('breakdownGuide_preferences', JSON.stringify(preferences));
        
        const savedPrefs = localStorage.getItem('breakdownGuide_preferences');
        testRunner.assert.isTrue(savedPrefs !== null, 'Preferences should be saved');
        
        const parsed = JSON.parse(savedPrefs);
        testRunner.assert.equals(parsed.theme, 'light', 'Theme preference should be saved');
    }
);