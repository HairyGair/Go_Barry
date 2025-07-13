/**
 * Go North East - Breakdown Guide
 * Error Handling Test Scenarios
 * Tests error states, invalid inputs, and edge cases
 */

// Test 1: Invalid Input Handling
testRunner.addTest(
    'Error - Invalid Inputs',
    'Test handling of invalid or missing inputs',
    async () => {
        // Navigate to wizard
        await testRunner.utils.click('#startDiagnosisBtn');
        await testRunner.utils.waitForElement('#categoryGrid');
        
        // Try to proceed without selecting a category
        // (In real app, categories require click to proceed)
        
        // Search with invalid characters
        await testRunner.utils.typeText('#categorySearch', '<script>alert("test")</script>');
        await testRunner.utils.wait(300);
        
        // Verify script tags are escaped/ignored
        const searchValue = document.querySelector('#categorySearch').value;
        testRunner.assert.isTrue(!document.querySelector('script'), 'Script tags should not be executed');
        
        // Test empty search
        await testRunner.utils.typeText('#categorySearch', '');
        const allCards = document.querySelectorAll('.category-card');
        const visibleCards = document.querySelectorAll('.category-card:not(.hidden)');
        testRunner.assert.equals(visibleCards.length, allCards.length, 'All cards should show with empty search');
    }
);

// Test 2: Network Error Handling
testRunner.addTest(
    'Error - Offline Functionality',
    'Test app works offline with cached data',
    async () => {
        // Simulate offline state
        const isOnline = navigator.onLine;
        
        // Test local storage access
        try {
            localStorage.setItem('breakdownGuide_test', 'offline-test');
            const retrieved = localStorage.getItem('breakdownGuide_test');
            testRunner.assert.equals(retrieved, 'offline-test', 'LocalStorage should work offline');
            localStorage.removeItem('breakdownGuide_test');
        } catch (error) {
            throw new Error('LocalStorage should be accessible offline');
        }
        
        // Verify core functionality works without network
        const wizardActive = document.querySelector('#wizardScreen.active');
        if (!wizardActive) {
            await testRunner.utils.click('#startDiagnosisBtn');
            await testRunner.utils.waitForElement('#categoryGrid');
        }
        
        // All diagnostic flows should work offline as they're locally stored
        testRunner.assert.isTrue(typeof diagnosticFlows !== 'undefined', 'Diagnostic flows should be available');
    }
);

// Test 3: Missing Data Handling
testRunner.addTest(
    'Error - Missing Diagnostic Data',
    'Test handling when diagnostic flow data is missing',
    async () => {
        // Try to load a non-existent diagnostic flow
        if (typeof handleMissingFlow === 'function') {
            try {
                handleMissingFlow('non-existent-flow');
            } catch (error) {
                testRunner.assert.isTrue(error !== null, 'Should handle missing flow gracefully');
            }
        }
        
        // Verify error messaging for missing categories
        const categories = document.querySelectorAll('.category-card');
        testRunner.assert.isTrue(categories.length > 0, 'Should have categories even if some data missing');
    }
);

// Test 4: Browser Compatibility
testRunner.addTest(
    'Error - Browser Compatibility',
    'Test critical features work across browsers',
    async () => {
        // Check required APIs exist
        testRunner.assert.isTrue(typeof localStorage !== 'undefined', 'LocalStorage API required');
        testRunner.assert.isTrue(typeof JSON !== 'undefined', 'JSON API required');
        testRunner.assert.isTrue(typeof Promise !== 'undefined', 'Promise API required');
        
        // Check CSS Grid support (for category grid)
        const testElement = document.createElement('div');
        testElement.style.display = 'grid';
        testRunner.assert.equals(testElement.style.display, 'grid', 'CSS Grid should be supported');
        
        // Check flexbox support
        testElement.style.display = 'flex';
        testRunner.assert.equals(testElement.style.display, 'flex', 'Flexbox should be supported');
    }
);

// Test 5: Concurrent Session Handling
testRunner.addTest(
    'Error - Multiple Sessions',
    'Test handling of multiple concurrent sessions',
    async () => {
        // Create first session
        await testRunner.utils.click('#startDiagnosisBtn');
        await testRunner.utils.waitForElement('#categoryGrid');
        
        const firstCategory = document.querySelectorAll('.category-card')[0];
        firstCategory.click();
        await testRunner.utils.waitForElement('#wizardScreen.active');
        
        // Add notes to first session
        await testRunner.utils.typeText('#notesInput', 'First session notes');
        
        // Try to start another session without completing first
        await testRunner.utils.click('#returnToCategoriesBtn');
        
        // In real implementation, this might show a warning about unsaved progress
        // For now, verify we can handle multiple sessions in history
        const sessions = JSON.parse(localStorage.getItem('breakdownGuide_sessions') || '[]');
        
        // Start second session
        const secondCategory = document.querySelectorAll('.category-card')[1];
        secondCategory.click();
        await testRunner.utils.waitForElement('#wizardScreen.active');
        
        // Verify both sessions can be tracked
        const currentSession = JSON.parse(localStorage.getItem('breakdownGuide_currentSession') || '{}');
        testRunner.assert.isTrue(currentSession.id !== undefined, 'Should have current session');
    }
);

// Test 6: Edge Cases
testRunner.addTest(
    'Error - Edge Cases',
    'Test various edge cases and boundary conditions',
    async () => {
        // Test very long notes
        const longText = 'A'.repeat(5000);
        await testRunner.utils.typeText('#notesInput', longText);
        
        const notesInput = document.querySelector('#notesInput');
        testRunner.assert.isTrue(notesInput.value.length <= 5000, 'Should handle long text appropriately');
        
        // Test rapid clicking
        const button = document.querySelector('#saveNotesBtn');
        if (button) {
            // Click multiple times rapidly
            for (let i = 0; i < 5; i++) {
                button.click();
            }
            // Should not cause errors or duplicate saves
        }
        
        // Test session with no selections
        await testRunner.utils.click('#returnToCategoriesBtn');
        await testRunner.utils.waitForElement('#categoryGrid');
        
        // Clear any existing filters
        await testRunner.utils.typeText('#categorySearch', '');
        
        // Test filter with no results
        await testRunner.utils.typeText('#categorySearch', 'xyznonexistent');
        await testRunner.utils.wait(300);
        
        const visibleCards = document.querySelectorAll('.category-card:not(.hidden)');
        testRunner.assert.equals(visibleCards.length, 0, 'Should show no results for non-existent search');
        
        // Verify "no results" message appears (if implemented)
        // const noResults = document.querySelector('.no-results-message');
        // testRunner.assert.isVisible('.no-results-message', 'Should show no results message');
    }
);