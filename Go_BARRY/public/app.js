/**
 * Go North East - Breakdown Guide
 * Main Application JavaScript
 * Version 1.3 - Complete Implementation
 */

// ========================================
// Constants & Configuration
// ========================================
const APP_VERSION = '1.3';
const STORAGE_PREFIX = 'breakdownGuide_';
const MAX_RECENT_ITEMS = 5;
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

// DOM Elements
const elements = {};

// Application State
const appState = {
    currentScreen: 'welcome',
    currentIssue: null,
    currentStep: 0,
    diagnosticHistory: [],
    recentCategories: [],
    notes: '',
    sessionStart: null,
    filters: {
        priority: 'all',
        search: ''
    }
};

// ========================================
// Initialization
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('Breakdown Guide v' + APP_VERSION + ' initializing...');
    initializeElements();
    attachEventListeners();
    loadSavedState();
    showScreen('welcome');
    console.log('Breakdown Guide ready!');
});

function initializeElements() {
    // Screens
    elements.welcomeScreen = document.getElementById('welcomeScreen');
    elements.categoryScreen = document.getElementById('categoryScreen');
    elements.wizardScreen = document.getElementById('wizardScreen');
    
    // Buttons
    elements.startDiagnosisBtn = document.getElementById('startDiagnosisBtn');
    elements.searchIssuesBtn = document.getElementById('searchIssuesBtn');
    elements.recentLogsBtn = document.getElementById('recentLogsBtn');
    elements.helpBtn = document.getElementById('helpBtn');
    elements.backToWelcomeBtn = document.getElementById('backToWelcomeBtn');
    elements.quickRefBtn = document.getElementById('quickRefBtn');
    elements.emergencyBtn = document.getElementById('emergencyBtn');
    elements.wizardBackBtn = document.getElementById('wizardBackBtn');
    elements.previousStepBtn = document.getElementById('previousStepBtn');
    elements.returnToCategoriesBtn = document.getElementById('returnToCategoriesBtn');
    elements.saveNotesBtn = document.getElementById('saveNotesBtn');
    
    // Category controls
    elements.categoryGrid = document.getElementById('categoryGrid');
    elements.categorySearch = document.getElementById('categorySearch');
    elements.sortSelect = document.getElementById('sortSelect');
    elements.visibleCount = document.getElementById('visibleCount');
    
    // Wizard elements
    elements.wizardTitle = document.getElementById('wizardTitle');
    elements.wizardContent = document.getElementById('wizardContent');
    elements.progressBar = document.getElementById('progressBar');
    elements.progressText = document.getElementById('progressText');
    elements.breadcrumbTrail = document.getElementById('breadcrumbTrail');
    elements.notesInput = document.getElementById('notesInput');
    
    // Modals
    elements.quickRefModal = document.getElementById('quickRefModal');
    elements.emergencyModal = document.getElementById('emergencyModal');
    elements.closeQuickRefBtn = document.getElementById('closeQuickRefBtn');
    elements.closeEmergencyBtn = document.getElementById('closeEmergencyBtn');
    
    // Other
    elements.loadingOverlay = document.getElementById('loadingOverlay');
    elements.statusIndicator = document.getElementById('statusIndicator');
    elements.statusText = document.getElementById('statusText');
}

function attachEventListeners() {
    // Welcome screen buttons
    elements.startDiagnosisBtn?.addEventListener('click', () => {
        showScreen('category');
        populateCategories();
    });
    
    elements.searchIssuesBtn?.addEventListener('click', () => {
        showScreen('category');
        populateCategories();
        elements.categorySearch?.focus();
    });
    
    elements.recentLogsBtn?.addEventListener('click', showRecentLogs);
    elements.helpBtn?.addEventListener('click', showHelp);
    
    // Navigation
    elements.backToWelcomeBtn?.addEventListener('click', () => showScreen('welcome'));
    elements.wizardBackBtn?.addEventListener('click', handleWizardBack);
    elements.returnToCategoriesBtn?.addEventListener('click', () => {
        showScreen('category');
        populateCategories();
    });
    
    // Header buttons
    elements.quickRefBtn?.addEventListener('click', showQuickReference);
    elements.emergencyBtn?.addEventListener('click', showEmergencyStops);
    
    // Modal close buttons
    elements.closeQuickRefBtn?.addEventListener('click', () => closeModal('quickRefModal'));
    elements.closeEmergencyBtn?.addEventListener('click', () => closeModal('emergencyModal'));
    
    // Search
    elements.categorySearch?.addEventListener('input', (e) => {
        appState.filters.search = e.target.value;
        filterCategories();
    });
    
    // Sort
    elements.sortSelect?.addEventListener('change', () => {
        populateCategories();
    });
    
    // Wizard controls
    elements.previousStepBtn?.addEventListener('click', previousStep);
    elements.saveNotesBtn?.addEventListener('click', saveNotes);
    
    // Close modals on outside click
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
}

// ========================================
// Screen Management
// ========================================
function showScreen(screenName) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Show selected screen
    switch(screenName) {
        case 'welcome':
            elements.welcomeScreen?.classList.add('active');
            break;
        case 'category':
            elements.categoryScreen?.classList.add('active');
            break;
        case 'wizard':
            elements.wizardScreen?.classList.add('active');
            break;
    }
    
    appState.currentScreen = screenName;
}

// ========================================
// Category Management
// ========================================
function populateCategories() {
    if (!elements.categoryGrid) return;
    
    const categories = getCategoriesFromFlows();
    let filteredCategories = searchCategories(categories);
    
    // Sort categories
    const sortValue = elements.sortSelect?.value || 'priority';
    sortCategories(filteredCategories, sortValue);
    
    // Update count
    if (elements.visibleCount) {
        elements.visibleCount.textContent = filteredCategories.length;
    }
    
    // Clear grid
    elements.categoryGrid.innerHTML = '';
    
    // Populate grid
    filteredCategories.forEach(category => {
        const card = createCategoryCard(category);
        elements.categoryGrid.appendChild(card);
    });
}

function getCategoriesFromFlows() {
    const categories = [];
    
    if (typeof diagnosticFlows !== 'undefined') {
        Object.keys(diagnosticFlows).forEach(key => {
            const flow = diagnosticFlows[key];
            categories.push({
                id: key,
                title: flow.title,
                description: flow.description,
                priority: flow.priority,
                severity: flow.severity,
                icon: getIconForCategory(key)
            });
        });
    }
    
    return categories;
}

function getIconForCategory(categoryId) {
    const iconMap = {
        // Priority 1 - Critical Issues
        'brakes': '🛑',
        'steering': '🎯',
        'oil-warning': '🛢️',
        'loose-wheel-nuts': '🔩',
        'puncture': '🛞',
        
        // Priority 2 - High Priority Issues  
        'abs-light': '🚨',
        'battery-light': '🔋',
        'overheating': '🌡️',
        'low-water': '💧',
        'doors': '🚪',
        'non-starter': '🔑',
        'gear-selection': '⚙️',
        'demisters-heaters': '🌬️',
        'cutting-out-fuel': '⛽',
        'excessive-smoke': '💨',
        'gearbox-temperature': '🌡️',
        'broken-windows': '🪟',
        'exterior-lights': '💡',
        'wing-mirrors': '🪞',
        'wipers-screenwash': '🌧️',
        'ramp-stuck-out': '♿',
        'interior-exterior-damage': '🔧',
        'repeat-defects': '🔄',
        'speedo-not-working': '🌐',
        'suspension': '🔧',
        
        // Priority 3 - Standard Issues
        'buzzers-sounding': '🔊',
        'interior-lights': '💡',
        
        // Legacy/Alternative names
        'abs-red': '🚨',
        'abs-amber': '⚠️',
        'warning-lights-general': '⚠️'
    };
    
    return iconMap[categoryId] || '❓';
}

function createCategoryCard(category) {
    const card = document.createElement('div');
    card.className = 'category-card';
    
    if (category.priority === 1) {
        card.classList.add('critical');
    } else if (category.priority === 2) {
        card.classList.add('high');
    }
    
    card.innerHTML = `
        <span class="category-icon">${category.icon}</span>
        <div class="category-info">
            <h3 class="category-title">${category.title}</h3>
            <p class="category-description">${category.description}</p>
            ${category.priority === 1 ? '<span class="priority-badge critical">SAFETY CRITICAL</span>' : ''}
            ${category.priority === 2 ? '<span class="priority-badge high">HIGH PRIORITY</span>' : ''}
        </div>
        <span class="chevron">→</span>
    `;
    
    card.addEventListener('click', () => startDiagnostic(category.id));
    
    return card;
}

function searchCategories(categories) {
    const searchTerm = appState.filters.search.toLowerCase();
    if (!searchTerm) return categories;
    
    return categories.filter(cat => 
        cat.title.toLowerCase().includes(searchTerm) ||
        cat.description.toLowerCase().includes(searchTerm)
    );
}

function filterCategories() {
    populateCategories();
}

function sortCategories(categories, sortBy) {
    switch(sortBy) {
        case 'priority':
            categories.sort((a, b) => a.priority - b.priority);
            break;
        case 'alphabetical':
            categories.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'recent':
            // Sort by recent usage (if tracked)
            const recentOrder = appState.recentCategories || [];
            categories.sort((a, b) => {
                const aIndex = recentOrder.indexOf(a.id);
                const bIndex = recentOrder.indexOf(b.id);
                if (aIndex === -1 && bIndex === -1) return 0;
                if (aIndex === -1) return 1;
                if (bIndex === -1) return -1;
                return aIndex - bIndex;
            });
            break;
    }
}

// ========================================
// Diagnostic Wizard
// ========================================
function startDiagnostic(issueId) {
    if (typeof diagnosticFlows === 'undefined' || !diagnosticFlows[issueId]) {
        showError('Diagnostic flow not found');
        return;
    }
    
    appState.currentIssue = issueId;
    appState.currentStep = 0;
    appState.sessionStart = new Date();
    appState.notes = '';
    
    // Track recent usage
    if (!appState.recentCategories.includes(issueId)) {
        appState.recentCategories.unshift(issueId);
        if (appState.recentCategories.length > MAX_RECENT_ITEMS) {
            appState.recentCategories.pop();
        }
    }
    
    // Initialize wizard
    if (typeof initializeWizard === 'function') {
        initializeWizard(issueId);
    } else {
        // Fallback implementation
        showScreen('wizard');
        displayStep();
    }
    
    saveState();
}

function displayStep() {
    const flow = diagnosticFlows[appState.currentIssue];
    if (!flow) return;
    
    const step = flow.steps[appState.currentStep];
    if (!step) return;
    
    // Update header
    elements.wizardTitle.textContent = flow.title;
    elements.breadcrumbTrail.textContent = `Home > ${flow.title} > Step ${appState.currentStep + 1}`;
    
    // Update progress
    const progress = ((appState.currentStep + 1) / flow.steps.length) * 100;
    elements.progressBar.style.width = progress + '%';
    elements.progressText.textContent = `Step ${appState.currentStep + 1} of ${flow.steps.length}`;
    
    // Update content
    elements.wizardContent.innerHTML = '';
    
    // Add step content based on type
    const stepContainer = document.createElement('div');
    stepContainer.className = 'step-container';
    
    // Step title
    const stepTitle = document.createElement('h2');
    stepTitle.className = 'step-title';
    stepTitle.textContent = step.title;
    stepContainer.appendChild(stepTitle);
    
    // Warning box
    if (step.warning) {
        const warningBox = document.createElement('div');
        warningBox.className = 'warning-box';
        warningBox.innerHTML = `⚠️ ${step.warning}`;
        stepContainer.appendChild(warningBox);
    }
    
    // Step content
    const stepContent = document.createElement('div');
    stepContent.className = 'step-content';
    stepContent.textContent = step.content;
    stepContainer.appendChild(stepContent);
    
    // Handle different step types
    switch(step.type) {
        case 'question':
            renderQuestionStep(step, stepContainer);
            break;
        case 'action':
            renderActionStep(step, stepContainer);
            break;
        case 'final':
            renderFinalStep(step, stepContainer);
            break;
        case 'info':
            renderInfoStep(step, stepContainer);
            break;
    }
    
    elements.wizardContent.appendChild(stepContainer);
    
    // Update button states
    elements.previousStepBtn.disabled = appState.currentStep === 0;
}

function renderQuestionStep(step, container) {
    if (!step.options) return;
    
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'options-container';
    
    step.options.forEach((option, index) => {
        const optionBtn = document.createElement('button');
        optionBtn.className = 'option-button';
        if (option.severity === 'critical') {
            optionBtn.classList.add('critical');
        }
        optionBtn.textContent = option.text;
        optionBtn.addEventListener('click', () => {
            handleOptionClick(option);
        });
        optionsContainer.appendChild(optionBtn);
    });
    
    container.appendChild(optionsContainer);
}

function renderActionStep(step, container) {
    if (step.checklist) {
        const checklistContainer = document.createElement('div');
        checklistContainer.className = 'checklist-container';
        
        const checklistTitle = document.createElement('h3');
        checklistTitle.textContent = 'Steps to follow:';
        checklistContainer.appendChild(checklistTitle);
        
        const checklist = document.createElement('ul');
        checklist.className = 'checklist';
        
        step.checklist.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item;
            checklist.appendChild(li);
        });
        
        checklistContainer.appendChild(checklist);
        
        if (step.safety) {
            const safetyNote = document.createElement('div');
            safetyNote.className = 'safety-note';
            safetyNote.innerHTML = `<strong>⚠️ Safety:</strong> ${step.safety}`;
            checklistContainer.appendChild(safetyNote);
        }
        
        container.appendChild(checklistContainer);
    }
    
    // Add continue button
    const continueBtn = document.createElement('button');
    continueBtn.className = 'btn btn-primary';
    continueBtn.textContent = 'Continue';
    continueBtn.addEventListener('click', nextStep);
    container.appendChild(continueBtn);
}

function renderFinalStep(step, container) {
    const resultContainer = document.createElement('div');
    resultContainer.className = 'final-result';
    if (step.severity === 'stop') {
        resultContainer.classList.add('stop');
    }
    
    const resultText = document.createElement('p');
    resultText.className = 'result-text';
    resultText.textContent = step.result;
    resultContainer.appendChild(resultText);
    
    if (step.severity === 'stop' && step.stopReason) {
        const stopAlert = document.createElement('div');
        stopAlert.className = 'stop-alert';
        stopAlert.innerHTML = `
            <h3>🛑 VEHICLE MUST STOP</h3>
            <p>${step.stopReason}</p>
        `;
        resultContainer.appendChild(stopAlert);
    }
    
    if (step.contacts) {
        const contactsSection = document.createElement('div');
        contactsSection.className = 'contacts-section';
        contactsSection.innerHTML = '<h3>Required Contacts:</h3>';
        
        const contactsList = document.createElement('ul');
        step.contacts.forEach(contact => {
            const li = document.createElement('li');
            li.textContent = contact;
            contactsList.appendChild(li);
        });
        contactsSection.appendChild(contactsList);
        resultContainer.appendChild(contactsSection);
    }
    
    if (step.actions) {
        const actionsSection = document.createElement('div');
        actionsSection.className = 'actions-section';
        actionsSection.innerHTML = '<h3>Required Actions:</h3>';
        
        const actionsList = document.createElement('ul');
        step.actions.forEach(action => {
            const li = document.createElement('li');
            li.textContent = action;
            actionsList.appendChild(li);
        });
        actionsSection.appendChild(actionsList);
        resultContainer.appendChild(actionsSection);
    }
    
    container.appendChild(resultContainer);
    
    // Add completion button
    const completeBtn = document.createElement('button');
    completeBtn.className = 'btn btn-primary';
    completeBtn.textContent = 'Complete Diagnosis';
    completeBtn.addEventListener('click', completeDiagnosis);
    container.appendChild(completeBtn);
}

function renderInfoStep(step, container) {
    // Add next button for info steps
    const nextBtn = document.createElement('button');
    nextBtn.className = 'btn btn-primary';
    nextBtn.textContent = 'Next';
    nextBtn.addEventListener('click', nextStep);
    container.appendChild(nextBtn);
}

function handleOptionClick(option) {
    if (typeof option.nextStep !== 'undefined') {
        appState.currentStep = option.nextStep;
        displayStep();
    } else {
        // End of flow
        completeDiagnosis();
    }
}

function nextStep() {
    const flow = diagnosticFlows[appState.currentIssue];
    if (appState.currentStep < flow.steps.length - 1) {
        appState.currentStep++;
        displayStep();
    }
}

function previousStep() {
    if (appState.currentStep > 0) {
        appState.currentStep--;
        displayStep();
    }
}

function handleWizardBack() {
    if (appState.currentStep > 0) {
        previousStep();
    } else {
        showScreen('category');
    }
}

function completeDiagnosis() {
    // Save to history
    const session = {
        id: Date.now(),
        issueId: appState.currentIssue,
        issueTitle: diagnosticFlows[appState.currentIssue].title,
        startTime: appState.sessionStart,
        endTime: new Date(),
        notes: appState.notes,
        completed: true
    };
    
    appState.diagnosticHistory.unshift(session);
    if (appState.diagnosticHistory.length > 50) {
        appState.diagnosticHistory = appState.diagnosticHistory.slice(0, 50);
    }
    
    saveState();
    
    // Show completion message
    alert('Diagnosis completed and logged.');
    
    // Return to categories
    showScreen('category');
}

// ========================================
// Notes Management
// ========================================
function saveNotes() {
    appState.notes = elements.notesInput?.value || '';
    saveState();
    alert('Notes saved');
}

// ========================================
// Modals
// ========================================
function showQuickReference() {
    if (elements.quickRefModal) {
        elements.quickRefModal.style.display = 'block';
        
        // Populate quick reference content
        const modalBody = elements.quickRefModal.querySelector('.modal-body');
        if (modalBody) {
            modalBody.innerHTML = `
                <h3>Critical Issues - Immediate Stop Required</h3>
                <ul>
                    <li><strong>Brake Failure:</strong> Pedal sinks, no resistance</li>
                    <li><strong>Steering Issues:</strong> Excessive play, unresponsive</li>
                    <li><strong>Oil Warning Light:</strong> Stop immediately</li>
                    <li><strong>Loose Wheel Nuts:</strong> Do not continue</li>
                    <li><strong>Red ABS Light:</strong> If persists after reset</li>
                </ul>
                
                <h3>High Priority - Changeover Required</h3>
                <ul>
                    <li><strong>Overheating:</strong> Above 100°C</li>
                    <li><strong>Low Water:</strong> With buzzer sounding</li>
                    <li><strong>Battery Light:</strong> With belt failure</li>
                    <li><strong>Door Issues:</strong> Cannot close/retain</li>
                    <li><strong>Amber ABS Light:</strong> After reset attempt</li>
                </ul>
                
                <h3>Emergency Contacts</h3>
                <ul>
                    <li>Engineering: 0191 XXX XXXX</li>
                    <li>Depot Control: 0191 XXX XXXX</li>
                    <li>Out of Hours: 0191 XXX XXXX</li>
                </ul>
            `;
        }
    }
}

function showEmergencyStops() {
    if (elements.emergencyModal) {
        elements.emergencyModal.style.display = 'block';
    }
}

function showRecentLogs() {
    alert('Recent logs feature coming soon');
}

function showHelp() {
    alert('Help documentation coming soon');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// ========================================
// State Management
// ========================================
function saveState() {
    try {
        localStorage.setItem(STORAGE_PREFIX + 'appState', JSON.stringify(appState));
    } catch (e) {
        console.error('Failed to save state:', e);
    }
}

function loadSavedState() {
    try {
        const saved = localStorage.getItem(STORAGE_PREFIX + 'appState');
        if (saved) {
            const savedState = JSON.parse(saved);
            Object.assign(appState, savedState);
        }
    } catch (e) {
        console.error('Failed to load saved state:', e);
    }
}

// ========================================
// Error Handling
// ========================================
function showError(message) {
    alert('Error: ' + message);
}

// ========================================
// Loading State
// ========================================
function showLoading() {
    if (elements.loadingOverlay) {
        elements.loadingOverlay.style.display = 'flex';
    }
}

function hideLoading() {
    if (elements.loadingOverlay) {
        elements.loadingOverlay.style.display = 'none';
    }
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        appState,
        startDiagnostic,
        showScreen
    };
}
