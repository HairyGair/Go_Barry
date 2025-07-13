/**
 * Go North East - Breakdown Guide
 * ABS Light Test Scenarios
 * Tests the complete ABS diagnostic flow
 */

// Test 1: Amber ABS Light - Clears after reset
testRunner.addTest(
    'ABS Light - Amber Clears',
    'Test amber ABS light that clears after reset procedure',
    async () => {
        // Navigate to ABS Light category
        await testRunner.utils.click('#startDiagnosisBtn');
        await testRunner.utils.waitForElement('#categoryGrid');
        
        // Find and click ABS Light category
        const absCategory = Array.from(document.querySelectorAll('.category-card'))
            .find(card => card.textContent.includes('ABS Light'));
        if (!absCategory) throw new Error('ABS Light category not found');
        absCategory.click();
        
        await testRunner.utils.waitForElement('#wizardScreen.active');
        
        // Step 1: Select Amber ABS
        testRunner.assert.containsText('.wizard-title', 'ABS Light');
        await testRunner.utils.click('input[value="amber"]');
        await testRunner.utils.click('button:contains("Continue with Amber")');
        
        // Step 2: Reset procedure
        await testRunner.utils.waitForElement('.timer-action');
        testRunner.assert.containsText('.wizard-content', 'Reset Procedure');
        
        // Confirm reset
        await testRunner.utils.click('input[type="checkbox"]');
        await testRunner.utils.click('button:contains("Continue to 10mph")');
        
        // Step 3: Select light cleared
        await testRunner.utils.waitForElement('input[value="cleared"]');
        await testRunner.utils.click('input[value="cleared"]');
        await testRunner.utils.click('button:contains("Light Cleared")');
        
        // Verify success outcome
        await testRunner.utils.waitForElement('.alert-success');
        testRunner.assert.containsText('.wizard-content', 'Vehicle can remain in service');
    }
);

// Test 2: Red ABS Light - Remains after reset
testRunner.addTest(
    'ABS Light - Red Remains',
    'Test red ABS light that remains on requiring immediate stop',
    async () => {
        // Navigate to ABS Light category
        await testRunner.utils.click('#returnToCategoriesBtn');
        await testRunner.utils.waitForElement('#categoryGrid');
        
        const absCategory = Array.from(document.querySelectorAll('.category-card'))
            .find(card => card.textContent.includes('ABS Light'));
        absCategory.click();
        
        await testRunner.utils.waitForElement('#wizardScreen.active');
        
        // Step 1: Select Red ABS
        await testRunner.utils.click('input[value="red"]');
        await testRunner.utils.click('button:contains("Continue with Red")');
        
        // Step 2: Reset procedure
        await testRunner.utils.waitForElement('.timer-action');
        await testRunner.utils.click('input[type="checkbox"]');
        await testRunner.utils.click('button:contains("Continue to 10mph")');
        
        // Step 3: Select light remains
        await testRunner.utils.waitForElement('input[value="remains"]');
        await testRunner.utils.click('input[value="remains"]');
        await testRunner.utils.click('button:contains("Light Remains")');
        
        // Verify critical stop required
        await testRunner.utils.waitForElement('.alert-danger');
        testRunner.assert.containsText('.wizard-content', 'CRITICAL BRAKE FAILURE');
        testRunner.assert.containsText('.wizard-content', 'Vehicle must NOT continue');
        
        // Verify safety confirmation required
        const confirmBtn = document.querySelector('button[data-requires-confirmation="true"]');
        testRunner.assert.isTrue(confirmBtn !== null, 'Safety confirmation button should exist');
    }
);

// Test 3: Navigation - Back button functionality
testRunner.addTest(
    'ABS Navigation - Back Button',
    'Test back navigation through ABS flow steps',
    async () => {
        // Start fresh diagnosis
        await testRunner.utils.click('#returnToCategoriesBtn');
        await testRunner.utils.waitForElement('#categoryGrid');
        
        const absCategory = Array.from(document.querySelectorAll('.category-card'))
            .find(card => card.textContent.includes('ABS Light'));
        absCategory.click();
        
        // Go through first two steps
        await testRunner.utils.click('input[value="amber"]');
        await testRunner.utils.click('button:contains("Continue with Amber")');
        
        await testRunner.utils.waitForElement('.timer-action');
        
        // Test back button
        await testRunner.utils.click('#previousStepBtn');
        
        // Verify we're back at color selection
        await testRunner.utils.waitForElement('input[value="amber"]');
        testRunner.assert.containsText('.wizard-content', 'What color is the ABS light?');
        
        // Verify amber is still selected
        const amberRadio = document.querySelector('input[value="amber"]');
        testRunner.assert.isTrue(amberRadio.checked, 'Amber should remain selected');
    }
);

// Test 4: Progress Bar Updates
testRunner.addTest(
    'ABS Progress Bar',
    'Test progress bar updates correctly through flow',
    async () => {
        // Fresh start
        await testRunner.utils.click('#wizardBackBtn');
        await testRunner.utils.waitForElement('#categoryGrid');
        
        const absCategory = Array.from(document.querySelectorAll('.category-card'))
            .find(card => card.textContent.includes('ABS Light'));
        absCategory.click();
        
        // Check initial progress
        const progressBar = document.querySelector('#progressBar');
        const progressText = document.querySelector('#progressText');
        
        testRunner.assert.equals(progressBar.style.width, '20%', 'Initial progress should be 20%');
        testRunner.assert.containsText('#progressText', 'Step 1 of 5');
        
        // Move to step 2
        await testRunner.utils.click('input[value="amber"]');
        await testRunner.utils.click('button:contains("Continue with Amber")');
        await testRunner.utils.wait(300); // Wait for transition
        
        // Check updated progress
        testRunner.assert.equals(progressBar.style.width, '40%', 'Progress should be 40%');
        testRunner.assert.containsText('#progressText', 'Step 2 of 5');
    }
);

// Test 5: Data Persistence
testRunner.addTest(
    'ABS Data Persistence',
    'Test session data is saved and can be restored',
    async () => {
        // Start a diagnosis
        await testRunner.utils.click('#wizardBackBtn');
        await testRunner.utils.waitForElement('#categoryGrid');
        
        const absCategory = Array.from(document.querySelectorAll('.category-card'))
            .find(card => card.textContent.includes('ABS Light'));
        absCategory.click();
        
        // Make selections
        await testRunner.utils.click('input[value="red"]');
        await testRunner.utils.click('button:contains("Continue with Red")');
        
        // Add notes
        await testRunner.utils.typeText('#notesInput', 'Test note for ABS diagnosis');
        await testRunner.utils.click('#saveNotesBtn');
        
        // Simulate page refresh by saving current state
        const savedSessions = localStorage.getItem('breakdownGuide_sessions');
        testRunner.assert.isTrue(savedSessions !== null, 'Sessions should be saved');
        
        const sessions = JSON.parse(savedSessions);
        testRunner.assert.isTrue(sessions.length > 0, 'Should have at least one session');
        
        const lastSession = sessions[sessions.length - 1];
        testRunner.assert.equals(lastSession.issueId, 'abs-light', 'Issue ID should be abs-light');
        testRunner.assert.equals(lastSession.notes, 'Test note for ABS diagnosis', 'Notes should be saved');
    }
);

// Test 6: Safety Confirmation for Critical Actions
testRunner.addTest(
    'ABS Safety Confirmation',
    'Test safety confirmation appears for critical stop decisions',
    async () => {
        // Navigate to red ABS remains scenario
        await testRunner.utils.click('#returnToCategoriesBtn');
        await testRunner.utils.waitForElement('#categoryGrid');
        
        const absCategory = Array.from(document.querySelectorAll('.category-card'))
            .find(card => card.textContent.includes('ABS Light'));
        absCategory.click();
        
        // Select Red ABS that remains on
        await testRunner.utils.click('input[value="red"]');
        await testRunner.utils.click('button:contains("Continue with Red")');
        
        await testRunner.utils.waitForElement('.timer-action');
        await testRunner.utils.click('input[type="checkbox"]');
        await testRunner.utils.click('button:contains("Continue to 10mph")');
        
        await testRunner.utils.click('input[value="remains"]');
        await testRunner.utils.click('button:contains("Light Remains")');
        
        // Try to confirm critical action
        const criticalBtn = document.querySelector('button:contains("Engineering Contacted")');
        criticalBtn.click();
        
        // Verify safety modal appears
        await testRunner.utils.waitForElement('.safety-modal-overlay');
        testRunner.assert.exists('.safety-confirm-input', 'Safety confirmation input should appear');
        testRunner.assert.containsText('.safety-modal', 'Type CONFIRM to confirm this action');
    }
);