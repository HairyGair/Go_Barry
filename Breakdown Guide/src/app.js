/**
 * Go North East - Breakdown Guide
 * Main Application JavaScript
 * Version 3.0 - Phase 5 Complete - Rapid Decision System
 */

// ========================================
// Constants & Configuration
// ========================================
const APP_VERSION = '3.0';
const STORAGE_PREFIX = 'breakdownGuide_';
const MAX_RECENT_ITEMS = 5;
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

// Global wizard instance
let wizardEngine = null;

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
document.addEventListener('DOMContentLoaded', function() {
    console.log(`🎆 Breakdown Guide v${APP_VERSION} - Phase 5 Complete`);
    console.log('📊 Initializing rapid decision system...');
    
    initializeElements();
    initializeEventListeners();
    initializeWizardEngine();
    
    // Load diagnostic flows
    if (typeof diagnosticFlows !== 'undefined') {
        console.log('✅ Diagnostic flows loaded:', Object.keys(diagnosticFlows).length);
        console.log('📋 Available categories:', getAvailableCategories());
    } else {
        console.error('❌ Diagnostic flows not loaded');
    }
    
    // Initialize app state
    showScreen('welcome');
    loadUserPreferences();
    
    console.log('🚀 Rapid Decision System ready for operation');
});

// ========================================
// Element Initialization
// ========================================
function initializeElements() {
    // Navigation elements
    elements.startDiagnosisBtn = document.getElementById('startDiagnosisBtn');
    elements.searchIssuesBtn = document.getElementById('searchIssuesBtn');
    elements.recentLogsBtn = document.getElementById('recentLogsBtn');
    elements.helpBtn = document.getElementById('helpBtn');
    
    // Screen elements
    elements.welcomeScreen = document.getElementById('welcomeScreen');
    elements.categoryScreen = document.getElementById('categoryScreen');
    elements.wizardScreen = document.getElementById('wizardScreen');
    
    // Category screen elements
    elements.backToWelcomeBtn = document.getElementById('backToWelcomeBtn');
    elements.categorySearch = document.getElementById('categorySearch');
    elements.sortSelect = document.getElementById('sortSelect');
    elements.categoryGrid = document.getElementById('categoryGrid');
    elements.visibleCount = document.getElementById('visibleCount');
    
    // Wizard screen elements
    elements.wizardBackBtn = document.getElementById('wizardBackBtn');
    elements.wizardTitle = document.getElementById('wizardTitle');
    elements.wizardContent = document.getElementById('wizardContent');
    elements.progressBar = document.getElementById('progressBar');
    elements.progressText = document.getElementById('progressText');
    
    // Modal elements
    elements.quickRefBtn = document.getElementById('quickRefBtn');
    elements.emergencyBtn = document.getElementById('emergencyBtn');
    elements.quickRefModal = document.getElementById('quickRefModal');
    elements.emergencyModal = document.getElementById('emergencyModal');
}

// ========================================
// Event Listeners
// ========================================
function initializeEventListeners() {
    // Navigation buttons
    if (elements.startDiagnosisBtn) {
        elements.startDiagnosisBtn.addEventListener('click', () => {
            showScreen('category');
            populateCategories();
        });
    }
    
    if (elements.searchIssuesBtn) {
        elements.searchIssuesBtn.addEventListener('click', () => {
            showScreen('category');
            populateCategories();
            if (elements.categorySearch) {
                elements.categorySearch.focus();
            }
        });
    }
    
    // Back buttons
    if (elements.backToWelcomeBtn) {
        elements.backToWelcomeBtn.addEventListener('click', () => showScreen('welcome'));
    }
    
    if (elements.wizardBackBtn) {
        elements.wizardBackBtn.addEventListener('click', () => {
            showScreen('category');
            populateCategories();
        });
    }
    
    // Search and filtering
    if (elements.categorySearch) {
        elements.categorySearch.addEventListener('input', filterCategories);
    }
    
    if (elements.sortSelect) {
        elements.sortSelect.addEventListener('change', populateCategories);
    }
    
    // Modal triggers
    if (elements.quickRefBtn) {
        elements.quickRefBtn.addEventListener('click', () => showModal('quickRefModal'));
    }
    
    if (elements.emergencyBtn) {
        elements.emergencyBtn.addEventListener('click', () => showModal('emergencyModal'));
    }
    
    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) hideModal(modal.id);
        });
    });
    
    // Click outside modal to close
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                hideModal(modal.id);
            }
        });
    });
}

// ========================================
// Wizard Engine Integration
// ========================================
function initializeWizardEngine() {
    if (typeof RapidWizardEngine !== 'undefined') {
        wizardEngine = new RapidWizardEngine();
        console.log('✅ Rapid Wizard Engine initialized');
    } else {
        console.error('❌ RapidWizardEngine not found');
    }
}

// ========================================
// Screen Management
// ========================================
function showScreen(screenName) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Show target screen
    const targetScreen = document.getElementById(screenName + 'Screen');
    if (targetScreen) {
        targetScreen.classList.add('active');
        appState.currentScreen = screenName;
    }
}

// ========================================
// Category Population
// ========================================
function populateCategories() {
    if (!elements.categoryGrid || typeof diagnosticFlows === 'undefined') {
        console.error('Category grid or diagnostic flows not available');
        return;
    }
    
    const flows = Object.values(diagnosticFlows);
    const sortBy = elements.sortSelect ? elements.sortSelect.value : 'priority';
    
    // Sort flows
    flows.sort((a, b) => {
        switch (sortBy) {
            case 'alphabetical':
                return a.title.localeCompare(b.title);
            case 'priority':
                return a.priority - b.priority;
            default:
                return a.priority - b.priority;
        }
    });
    
    // Clear existing content
    elements.categoryGrid.innerHTML = '';
    
    // Create category cards
    flows.forEach(flow => {
        const card = createCategoryCard(flow);
        elements.categoryGrid.appendChild(card);
    });
    
    // Update visible count
    if (elements.visibleCount) {
        elements.visibleCount.textContent = flows.length;
    }
    
    console.log(`📋 Populated ${flows.length} categories`);
}

function createCategoryCard(flow) {
    const card = document.createElement('div');
    card.className = `category-card ${getCategoryClass(flow.category)}`;
    card.setAttribute('data-category', flow.category);
    card.setAttribute('data-priority', flow.priority);
    
    const priorityLabel = getPriorityLabel(flow.category);
    const severityColor = getSeverityColor(flow.category);
    
    card.innerHTML = `
        <div class="category-header">
            <div class="category-icon" style="background-color: ${severityColor}20;">
                ${flow.icon || '🔧'}
            </div>
            <div class="category-badge ${flow.category.replace('_', '-')}">${priorityLabel}</div>
        </div>
        <div class="category-content">
            <h3 class="category-title">${flow.title}</h3>
            <p class="category-description">${getFlowDescription(flow)}</p>
            <div class="category-meta">
                <span class="category-time">${flow.estimatedTime}</span>
                <span class="category-ref">${flow.sdcReference || ''}</span>
            </div>
        </div>
        <div class="category-arrow">→</div>
    `;
    
    // Add click listener
    card.addEventListener('click', () => {
        startDiagnostic(flow.id);
    });
    
    return card;
}

function getCategoryClass(category) {
    const classes = {
        'safety_critical': 'critical',
        'high_priority': 'high-priority',
        'standard': 'standard'
    };
    return classes[category] || 'standard';
}

function getPriorityLabel(category) {
    const labels = {
        'safety_critical': 'SAFETY CRITICAL',
        'high_priority': 'HIGH PRIORITY',
        'standard': 'STANDARD'
    };
    return labels[category] || 'STANDARD';
}

function getSeverityColor(category) {
    const colors = {
        'safety_critical': '#dc2626',
        'high_priority': '#f59e0b',
        'standard': '#10b981'
    };
    return colors[category] || '#10b981';
}

function getFlowDescription(flow) {
    // Get description from first step or use a default
    if (flow.steps && flow.steps[0] && flow.steps[0].content) {
        return flow.steps[0].content;
    }
    
    const defaultDescriptions = {
        'brakes': 'Brake system problems requiring immediate attention',
        'steering': 'Steering system issues and loss of control',
        'oil-warning': 'Engine oil pressure warning requiring immediate attention',
        'loose-wheel-nuts': 'Critical wheel assembly safety issue',
        'abs-light': 'Anti-lock braking system warning lights',
        'overheating': 'Engine overheating assessment and response',
        'battery-warning': 'Electrical charging system warning',
        'doors': 'Door operation issues and safety concerns',
        'non-starter': 'Vehicle will not start - troubleshooting steps',
        'low-water': 'Cooling system water level issues',
        'interior-lights': 'Interior lighting system problems',
        'exterior-lights': 'External lighting system issues',
        'wipers-screenwash': 'Windscreen wiper and washer problems',
        'wing-mirrors': 'Wing mirror damage assessment',
        'vehicle-damage': 'Interior/exterior damage evaluation',
        'speedo-not-working': 'Speedometer malfunction procedures',
        'suspension-issues': 'Suspension system problems',
        'various-buzzers': 'Unidentified warning buzzer sounds'
    };
    
    return defaultDescriptions[flow.id] || 'System diagnostic and assessment';
}

// ========================================
// Diagnostic Flow Management
// ========================================
function startDiagnostic(flowId) {
    console.log(`🔧 Starting diagnostic: ${flowId}`);
    
    if (!wizardEngine) {
        console.error('Wizard engine not initialized');
        showError('System not ready. Please refresh the page.');
        return;
    }
    
    if (!diagnosticFlows[flowId]) {
        console.error(`Flow not found: ${flowId}`);
        showError('Diagnostic flow not found: ' + flowId);
        return;
    }
    
    // Update state
    appState.currentIssue = flowId;
    appState.sessionStart = new Date();
    
    // Show wizard screen
    showScreen('wizard');
    
    // Start the diagnostic flow
    wizardEngine.startDiagnostic(flowId);
    
    // Update wizard title
    const flow = diagnosticFlows[flowId];
    if (elements.wizardTitle) {
        elements.wizardTitle.textContent = flow.title;
    }
}

// ========================================
// Utility Functions
// ========================================
function getAvailableCategories() {
    if (typeof diagnosticFlows === 'undefined') return [];
    
    const categories = new Set();
    Object.values(diagnosticFlows).forEach(flow => {
        categories.add(flow.category);
    });
    
    return Array.from(categories);
}

function filterCategories() {
    const searchTerm = elements.categorySearch ? elements.categorySearch.value.toLowerCase() : '';
    const cards = elements.categoryGrid ? elements.categoryGrid.querySelectorAll('.category-card') : [];
    
    let visibleCount = 0;
    
    cards.forEach(card => {
        const title = card.querySelector('.category-title').textContent.toLowerCase();
        const description = card.querySelector('.category-description').textContent.toLowerCase();
        
        const matches = title.includes(searchTerm) || description.includes(searchTerm);
        
        if (matches) {
            card.style.display = 'block';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });
    
    if (elements.visibleCount) {
        elements.visibleCount.textContent = visibleCount;
    }
}

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        modal.setAttribute('aria-hidden', 'false');
    }
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
    }
}

function showError(message) {
    console.error('Error:', message);
    alert('Error: ' + message); // Simple error display - could be enhanced
}

function loadUserPreferences() {
    // Load user preferences from localStorage if needed
    try {
        const prefs = localStorage.getItem(STORAGE_PREFIX + 'preferences');
        if (prefs) {
            const preferences = JSON.parse(prefs);
            // Apply preferences
        }
    } catch (error) {
        console.warn('Could not load user preferences:', error);
    }
}

// ========================================
// Global Functions (for compatibility)
// ========================================
window.startDiagnostic = startDiagnostic;
window.showScreen = showScreen;
window.populateCategories = populateCategories;
window.appState = appState;

console.log('📋 App.js v3.0 loaded - Rapid Decision System ready');