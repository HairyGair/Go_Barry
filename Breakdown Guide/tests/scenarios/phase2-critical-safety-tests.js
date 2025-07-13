/**
 * Go North East - Breakdown Guide
 * Phase 2: Critical Safety Issues Test Scenarios
 * Tests for Brakes, Steering, and Loose Wheel Nuts
 */

// Test 1: Brake System - Any symptom leads to immediate stop
testRunner.addTest(
    'Brakes - Critical Failure',
    'Test that any brake symptom results in immediate stop',
    async () => {
        // Navigate to Brakes category
        await testRunner.utils.click('#startDiagnosisBtn');
        await testRunner.utils.waitForElement('#categoryGrid');
        
        // Find and click Brakes category
        const brakesCategory = Array.from(document.querySelectorAll('.category-card'))
            .find(card => card.textContent.includes('Brakes'));
        testRunner.assert.isTrue(brakesCategory !== null, 'Brakes category should exist');
        testRunner.assert.hasClass(brakesCategory, 'safety-critical', 'Brakes should be marked as safety critical');
        
        brakesCategory.click();
        await testRunner.utils.waitForElement('#wizardScreen.active');
        
        // Check we're in brake diagnostic
        testRunner.assert.containsText('.wizard-title', 'Brake');
        
        // Select first symptom (pedal sinks)
        const firstCheckbox = document.querySelector('input[type="checkbox"]');
        firstCheckbox.click();
        
        // Click continue - should go directly to STOP
        const continueBtn = document.querySelector('button:contains("symptoms present")');
        continueBtn.click();
        
        // Verify immediate stop screen
        await testRunner.utils.waitForElement('.alert-danger');
        testRunner.assert.containsText('.wizard-content', 'BRAKE SYSTEM FAILURE');
        testRunner.assert.containsText('.wizard-content', 'Vehicle must NOT continue');
        testRunner.assert.containsText('.wizard-content', 'PG9 RISK');
        
        // Verify requires confirmation
        const stopBtn = document.querySelector('button[data-requires-confirmation="true"]');
        testRunner.assert.isTrue(stopBtn !== null, 'Should require safety confirmation');
    }
);

// Test 2: Steering - Any issue requires immediate stop
testRunner.addTest(
    'Steering - Critical Failure',
    'Test steering issues require immediate stop',
    async () => {
        // Return to categories
        await testRunner.utils.click('#returnToCategoriesBtn');
        await testRunner.utils.waitForElement('#categoryGrid');
        
        // Find and click Steering category
        const steeringCategory = Array.from(document.querySelectorAll('.category-card'))
            .find(card => card.textContent.includes('Steering'));
        testRunner.assert.isTrue(steeringCategory !== null, 'Steering category should exist');
        testRunner.assert.hasClass(steeringCategory, 'safety-critical', 'Steering should be safety critical');
        
        steeringCategory.click();
        await testRunner.utils.waitForElement('#wizardScreen.active');
        
        // Select excessive play symptom
        const excessivePlay = Array.from(document.querySelectorAll('input[type="checkbox"]'))
            .find(cb => cb.parentElement.textContent.includes('75mm'));
        testRunner.assert.isTrue(excessivePlay !== null, 'Should have excessive play option');
        excessivePlay.click();
        
        // Continue
        const continueBtn = document.querySelector('button:contains("symptoms present")');
        continueBtn.click();
        
        // Verify critical stop
        await testRunner.utils.waitForElement('.alert-danger');
        testRunner.assert.containsText('.wizard-content', 'STEERING SYSTEM FAILURE');
        testRunner.assert.containsText('.wizard-content', 'Loss of steering control risk');
        testRunner.assert.containsText('.wizard-content', 'Vehicle requires recovery');
    }
);

// Test 3: Loose Wheel Nuts - Zero tolerance
testRunner.addTest(
    'Loose Wheel Nuts - Extreme Critical',
    'Test loose wheel nuts immediate stop and reporting',
    async () => {
        // Return to categories
        await testRunner.utils.click('#returnToCategoriesBtn');
        await testRunner.utils.waitForElement('#categoryGrid');
        
        // Find Loose Wheel Nuts
        const wheelNutsCategory = Array.from(document.querySelectorAll('.category-card'))
            .find(card => card.textContent.includes('Loose Wheel Nuts'));
        testRunner.assert.isTrue(wheelNutsCategory !== null, 'Loose Wheel Nuts category should exist');
        
        wheelNutsCategory.click();
        await testRunner.utils.waitForElement('#wizardScreen.active');
        
        // Should immediately show extreme danger
        testRunner.assert.containsText('.wizard-content', 'EXTREME DANGER');
        testRunner.assert.containsText('.wizard-content', 'WHEEL DETACHMENT RISK');
        testRunner.assert.containsText('.wizard-content', 'ZERO TOLERANCE');
        
        // Check mandatory reporting requirements
        testRunner.assert.containsText('.wizard-content', 'Engineering Delivery Director');
        testRunner.assert.containsText('.wizard-content', 'General Manager');
        testRunner.assert.containsText('.wizard-content', 'Depot Engineering Manager');
        
        // Confirm stop
        const confirmBtn = document.querySelector('button:contains("All Management Notified")');
        confirmBtn.click();
        
        // Should show reporting checklist
        await testRunner.utils.waitForElement('.checklist');
        const checklistItems = document.querySelectorAll('input[type="checkbox"]');
        testRunner.assert.arrayLength(Array.from(checklistItems), 7, 'Should have 7 mandatory items');
    }
);

// Test 4: Filter by Critical Priority
testRunner.addTest(
    'Filter - Critical Issues Only',
    'Test filtering to show only critical safety issues',
    async () => {
        // Return to categories
        await testRunner.utils.click('#returnToCategoriesBtn');
        await testRunner.utils.waitForElement('#categoryGrid');
        
        // Click critical filter
        await testRunner.utils.click('#filterCritical');
        
        // Check visible cards
        const visibleCards = document.querySelectorAll('.category-card:not(.hidden)');
        testRunner.assert.equals(visibleCards.length, 5, 'Should show 5 critical issues');
        
        // Verify all visible are critical
        visibleCards.forEach(card => {
            testRunner.assert.equals(card.dataset.priority, '1', 'All visible should be priority 1');
            testRunner.assert.hasClass(card, 'safety-critical', 'Should have safety-critical class');
        });
        
        // Check summary text
        testRunner.assert.containsText('#categorySummary', 'Showing 5 of 29 issues');
    }
);

// Test 5: No Continue Path for Critical Issues
testRunner.addTest(
    'Critical Issues - No Safe Continue',
    'Verify critical issues have no path to continue service',
    async () => {
        // Test each critical flow has no continue option
        const criticalFlows = ['brakes', 'steering', 'oil-warning', 'loose-wheel-nuts'];
        
        for (const flowId of criticalFlows) {
            if (diagnosticFlows[flowId]) {
                const flow = diagnosticFlows[flowId];
                
                // Check each step
                Object.values(flow.flow.steps).forEach(step => {
                    if (step.actions) {
                        step.actions.forEach(action => {
                            // Ensure no action leads to "continue in service"
                            if (action.nextStep && action.nextStep !== 'complete') {
                                const nextStep = flow.flow.steps[action.nextStep];
                                if (nextStep && nextStep.content) {
                                    const content = JSON.stringify(nextStep.content);
                                    testRunner.assert.isTrue(
                                        !content.includes('continue in service') || 
                                        content.includes('must NOT continue') ||
                                        content.includes('STOP'),
                                        `${flowId} should not allow continuing in service`
                                    );
                                }
                            }
                        });
                    }
                });
            }
        }
    }
);

// Test 6: Safety Confirmation Required
testRunner.addTest(
    'Critical Issues - Safety Confirmations',
    'Test that all critical stops require typed confirmation',
    async () => {
        // Navigate to Oil Warning
        await testRunner.utils.click('#filterAll');
        await testRunner.utils.waitForElement('#categoryGrid');
        
        const oilCategory = Array.from(document.querySelectorAll('.category-card'))
            .find(card => card.textContent.includes('Oil Warning'));
        oilCategory.click();
        
        await testRunner.utils.waitForElement('#wizardScreen.active');
        
        // Should show immediate stop
        testRunner.assert.containsText('.wizard-content', 'CRITICAL - Oil Warning Light');
        
        // Try to confirm stop
        const confirmBtn = document.querySelector('button[data-requires-confirmation="true"]');
        confirmBtn.click();
        
        // Should show safety modal
        await testRunner.utils.waitForElement('.safety-modal-overlay');
        const confirmInput = document.querySelector('#safetyConfirmInput');
        testRunner.assert.exists('#safetyConfirmInput', 'Should have confirmation input');
        
        // Type wrong text
        await testRunner.utils.typeText('#safetyConfirmInput', 'WRONG');
        const submitBtn = document.querySelector('#safetyConfirmBtn');
        testRunner.assert.isTrue(submitBtn.disabled, 'Button should be disabled with wrong text');
        
        // Type correct text
        confirmInput.value = '';
        await testRunner.utils.typeText('#safetyConfirmInput', 'STOPPED - All contacts notified');
        testRunner.assert.isTrue(!submitBtn.disabled, 'Button should be enabled with correct text');
    }
);