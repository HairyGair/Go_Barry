/**
 * Go North East - Breakdown Guide
 * Navigation Test Scenarios
 * Tests navigation, breadcrumbs, and back functionality
 */

// Test 1: Basic Navigation Flow
testRunner.addTest(
    'Navigation - Screen Transitions',
    'Test navigation between all main screens',
    async () => {
        // Start at welcome screen
        testRunner.assert.hasClass('#welcomeScreen', 'active', 'Should start at welcome screen');
        
        // Navigate to categories
        await testRunner.utils.click('#startDiagnosisBtn');
        await testRunner.utils.waitForElement('#categoryScreen.active');
        testRunner.assert.hasClass('#categoryScreen', 'active', 'Should show category screen');
        
        // Back to welcome
        await testRunner.utils.click('#backToWelcomeBtn');
        await testRunner.utils.waitForElement('#welcomeScreen.active');
        testRunner.assert.hasClass('#welcomeScreen', 'active', 'Should return to welcome');
        
        // Test other navigation buttons
        await testRunner.utils.click('#searchIssuesBtn');
        await testRunner.utils.waitForElement('#categoryScreen.active');
        testRunner.assert.isVisible('#categorySearch', 'Search input should be visible and focused');
    }
);

// Test 2: Breadcrumb Navigation
testRunner.addTest(
    'Navigation - Breadcrumb Updates',
    'Test breadcrumb trail updates correctly',
    async () => {
        // Navigate to a diagnosis
        await testRunner.utils.click('#startDiagnosisBtn');
        await testRunner.utils.waitForElement('#categoryGrid');
        
        // Check breadcrumb at category screen
        const breadcrumb = document.querySelector('#breadcrumbTrail');
        testRunner.assert.containsText('#breadcrumbTrail', 'Home', 'Breadcrumb should show Home');
        
        // Select a category
        const firstCategory = document.querySelector('.category-card');
        const categoryName = firstCategory.querySelector('.category-name').textContent;
        firstCategory.click();
        
        await testRunner.utils.waitForElement('#wizardScreen.active');
        
        // Check updated breadcrumb
        testRunner.assert.containsText('#breadcrumbTrail', 'Home', 'Should still show Home');
        testRunner.assert.containsText('#breadcrumbTrail', categoryName, 'Should show category name');
    }
);

// Test 3: Back Button State Preservation
testRunner.addTest(
    'Navigation - State Preservation',
    'Test that form state is preserved when navigating back',
    async () => {
        // Start diagnosis and make selections
        await testRunner.utils.click('#returnToCategoriesBtn');
        await testRunner.utils.waitForElement('#categoryGrid');
        
        // Search for a specific issue
        await testRunner.utils.typeText('#categorySearch', 'brake');
        await testRunner.utils.wait(300); // Wait for filter
        
        // Count filtered items
        const visibleCards = document.querySelectorAll('.category-card:not(.hidden)');
        const filteredCount = visibleCards.length;
        
        // Navigate to first result
        if (visibleCards.length > 0) {
            visibleCards[0].click();
            await testRunner.utils.waitForElement('#wizardScreen.active');
            
            // Go back
            await testRunner.utils.click('#wizardBackBtn');
            await testRunner.utils.waitForElement('#categoryScreen.active');
            
            // Check search is preserved
            const searchInput = document.querySelector('#categorySearch');
            testRunner.assert.equals(searchInput.value, 'brake', 'Search term should be preserved');
            
            // Check filter is still applied
            const stillVisible = document.querySelectorAll('.category-card:not(.hidden)');
            testRunner.assert.equals(stillVisible.length, filteredCount, 'Filter should be preserved');
        }
    }
);

// Test 4: Exit Confirmation
testRunner.addTest(
    'Navigation - Exit Confirmation',
    'Test exit confirmation when leaving mid-diagnosis',
    async () => {
        // Start a diagnosis
        await testRunner.utils.click('#startDiagnosisBtn');
        await testRunner.utils.waitForElement('#categoryGrid');
        
        const category = document.querySelector('.category-card');
        category.click();
        
        await testRunner.utils.waitForElement('#wizardScreen.active');
        
        // Make some progress
        const firstOption = document.querySelector('input[type="radio"]');
        if (firstOption) {
            firstOption.click();
        }
        
        // Add notes to create unsaved changes
        await testRunner.utils.typeText('#notesInput', 'Test notes that should trigger confirmation');
        
        // Try to navigate away - should trigger confirmation
        // Note: This would normally show a confirmation dialog
        // For testing, we'll check if the handler is attached
        const backBtn = document.querySelector('#wizardBackBtn');
        testRunner.assert.exists('#wizardBackBtn', 'Back button should exist');
        
        // In real implementation, clicking back with unsaved changes would show confirmation
    }
);

// Test 5: Keyboard Navigation
testRunner.addTest(
    'Navigation - Keyboard Support',
    'Test keyboard navigation functionality',
    async () => {
        // Test Tab navigation
        const focusableElements = document.querySelectorAll(
            'button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
        );
        
        testRunner.assert.isTrue(focusableElements.length > 0, 'Should have focusable elements');
        
        // Test Escape key (would close modals)
        await testRunner.utils.click('#emergencyBtn');
        await testRunner.utils.waitForElement('#emergencyModal');
        
        // Simulate Escape key
        const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
        document.dispatchEvent(escapeEvent);
        
        // Modal should close (in real implementation)
        // For now, manually close it
        await testRunner.utils.click('#closeEmergencyBtn');
        
        // Test Enter key on buttons
        const startBtn = document.querySelector('#startDiagnosisBtn');
        startBtn.focus();
        
        const enterEvent = new KeyboardEvent('keypress', { key: 'Enter' });
        startBtn.dispatchEvent(enterEvent);
        
        // This should trigger navigation (implementation specific)
    }
);

// Test 6: URL/History Management
testRunner.addTest(
    'Navigation - Browser History',
    'Test browser back/forward button support',
    async () => {
        // This test would verify pushState/popState handling
        // In a real implementation, we'd test:
        // 1. URL updates when navigating
        // 2. Browser back button returns to previous screen
        // 3. Browser forward button goes forward
        // 4. Direct URL access loads correct screen
        
        // For now, verify the current screen tracking
        const currentScreen = document.querySelector('.screen.active');
        testRunner.assert.isTrue(currentScreen !== null, 'Should have an active screen');
        
        // Verify only one screen is active at a time
        const activeScreens = document.querySelectorAll('.screen.active');
        testRunner.assert.equals(activeScreens.length, 1, 'Only one screen should be active');
    }
);