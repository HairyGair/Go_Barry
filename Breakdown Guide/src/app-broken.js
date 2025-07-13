/**
 * Go North East - Breakdown Guide
 * Main Application JavaScript
 * Version 1.1 - Enhanced Homepage & Navigation
 */

// ========================================
// Constants & Configuration
// ========================================
const APP_VERSION = '1.3';
const STORAGE_PREFIX = 'breakdownGuide_';
const MAX_RECENT_ITEMS = 5;
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

// DOM Elements
const elements = {
    // Screens
    welcomeScreen: null,
    categoryScreen: null,
    wizardScreen: null,
    
    // Buttons
    startDiagnosisBtn: null,
    searchIssuesBtn: null,
    recentLogsBtn: null,
    helpBtn: null,
    backToWelcomeBtn: null,
    quickRefBtn: null,
    emergencyBtn: null,
    
    // Modals
    quickRefModal: null,
    emergencyModal: null,
    
    // Other
    loadingOverlay: null,
    categoryGrid: null,
    categorySearch: null,
    statusIndicator: null,
    statusText: null
};

// Application State
const appState = {
    currentScreen: 'welcome',
    currentIssue: null,
    currentStep: 0,
    diagnosticHistory: [],
    recentCategories: [],
    notes: '',
    sessionStartTime: Date.now(),
    systemStatus: 'online'
};

// Issue Categories with full data
const issueCategories = [
    { id: 'road-traffic', name: 'Road Traffic Incidents', icon: '🚗', priority: 3, description: 'Handle collisions and incidents' },
    { id: 'brakes', name: 'Brakes', icon: '🛑', priority: 1, description: 'Brake system failures or issues' },
    { id: 'steering', name: 'Steering', icon: '🎯', priority: 1, description: 'Steering problems or unresponsiveness' },
    { id: 'abs-light', name: 'ABS Light', icon: '🚨', priority: 1, description: 'ABS warning light procedures' },
    { id: 'battery-light', name: 'Battery Light On', icon: '🔋', priority: 2, description: 'Battery/charging system issues' },
    { id: 'oil-warning', name: 'Oil Warning Light', icon: '🛢️', priority: 1, description: 'Oil pressure warnings' },
    { id: 'overheating', name: 'Overheating', icon: '🌡️', priority: 2, description: 'Engine temperature issues' },
    { id: 'low-water', name: 'Low Water', icon: '💧', priority: 2, description: 'Coolant level problems' },
    { id: 'doors', name: 'Doors Not Working', icon: '🚪', priority: 2, description: 'Door mechanism failures' },
    { id: 'broken-windows', name: 'Broken Windows', icon: '🪟', priority: 3, description: 'Window damage assessment' },
    { id: 'buzzers', name: 'Buzzers Sounding', icon: '🔔', priority: 3, description: 'Warning buzzer diagnosis' },
    { id: 'cutting-out', name: 'Cutting Out/Fuel', icon: '⛽', priority: 3, description: 'Engine cutting out or fuel issues' },
    { id: 'demisters', name: 'Demisters/Heaters', icon: '🌫️', priority: 3, description: 'Heating and demisting problems' },
    { id: 'exterior-lights', name: 'Exterior Lights', icon: '💡', priority: 3, description: 'Headlights, indicators, brake lights' },
    { id: 'excessive-smoke', name: 'Excessive Smoke', icon: '💨', priority: 3, description: 'Exhaust smoke issues' },
    { id: 'gear-selection', name: 'Gear Selection', icon: '⚙️', priority: 3, description: 'Gearbox selection problems' },
    { id: 'gearbox-temp', name: 'Gearbox Temperature', icon: '🔥', priority: 3, description: 'Transmission overheating' },
    { id: 'interior-lights', name: 'Interior Lights', icon: '💡', priority: 3, description: 'Cabin lighting failures' },
    { id: 'damage', name: 'Interior/Exterior Damage', icon: '🔨', priority: 3, description: 'Body or interior damage' },
    { id: 'loose-wheel-nuts', name: 'Loose Wheel Nuts', icon: '🔩', priority: 1, description: 'CRITICAL: Wheel security issues - STOP immediately' },
    { id: 'non-starter', name: 'Non Starter', icon: '🔑', priority: 3, description: 'Engine won\'t start' },
    { id: 'puncture', name: 'Puncture', icon: '🛞', priority: 3, description: 'Tyre puncture procedures' },
    { id: 'ramp', name: 'Ramp Issues', icon: '♿', priority: 3, description: 'Wheelchair ramp problems' },
    { id: 'repeat-defects', name: 'Repeat Defects', icon: '🔄', priority: 3, description: 'Recurring issue escalation' },
    { id: 'speedo', name: 'Speedo Not Working', icon: '📊', priority: 3, description: 'Speedometer failures' },
    { id: 'suspension', name: 'Suspension', icon: '🛞', priority: 3, description: 'Suspension system issues' },
    { id: 'warning-lights', name: 'Warning Lights', icon: '🚨', priority: 3, description: 'Dashboard warning lights' },
    { id: 'wing-mirrors', name: 'Wing Mirrors', icon: '🪞', priority: 3, description: 'Mirror damage or adjustment' },
    { id: 'wipers', name: 'Wipers/Screenwash', icon: '🚿', priority: 3, description: 'Wiper or washer problems' }
];

// ========================================
// Initialization
// ========================================
let sessionManager = null;
let recentSessions = null;

document.addEventListener('DOMContentLoaded', initializeApp);

function initializeApp() {
    console.log('🚀 Initializing Go North East Breakdown Guide v' + APP_VERSION);
    
    // Initialize session manager
    sessionManager = new SessionManager();
    sessionManager.init();
    
    // Cache DOM elements
    cacheElements();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load saved state
    loadAppState();
    
    // Initialize categories
    initializeCategories();
    
    // Update homepage
    updateHomepage();
    
    // Start system monitoring
    startSystemMonitoring();
    
    // Show welcome screen
    showScreen('welcome');
    
    console.log('✅ Application initialized successfully');
}

function cacheElements() {
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
    
    // Modals
    elements.quickRefModal = document.getElementById('quickRefModal');
    elements.emergencyModal = document.getElementById('emergencyModal');
    
    // Other
    elements.loadingOverlay = document.getElementById('loadingOverlay');
    elements.categoryGrid = document.getElementById('categoryGrid');
    elements.categorySearch = document.getElementById('categorySearch');
    elements.statusIndicator = document.getElementById('statusIndicator');
    elements.statusText = document.getElementById('statusText');
}

function setupEventListeners() {
    // Welcome screen buttons
    elements.startDiagnosisBtn?.addEventListener('click', () => showScreen('category'));
    elements.searchIssuesBtn?.addEventListener('click', () => {
        showScreen('category');
        setTimeout(() => elements.categorySearch?.focus(), 100);
    });
    elements.recentLogsBtn?.addEventListener('click', showRecentLogs);
    elements.helpBtn?.addEventListener('click', showHelp);
    
    // Navigation
    elements.backToWelcomeBtn?.addEventListener('click', () => {
        showScreen('welcome');
        updateHomepage();
    });
    
    // Header buttons
    elements.quickRefBtn?.addEventListener('click', () => showModal('quickRef'));
    elements.emergencyBtn?.addEventListener('click', () => showModal('emergency'));
    
    // Modal close buttons
    document.getElementById('closeQuickRefBtn')?.addEventListener('click', () => hideModal('quickRef'));
    document.getElementById('closeEmergencyBtn')?.addEventListener('click', () => hideModal('emergency'));
    
    // Category search
    elements.categorySearch?.addEventListener('input', filterCategories);
    
    // Category filters
    document.getElementById('filterAll')?.addEventListener('click', () => setFilter('all'));
    document.getElementById('filterCritical')?.addEventListener('click', () => setFilter('critical'));
    document.getElementById('filterHigh')?.addEventListener('click', () => setFilter('high'));
    document.getElementById('filterNormal')?.addEventListener('click', () => setFilter('normal'));
    
    // Sort selector
    document.getElementById('sortSelect')?.addEventListener('change', (e) => sortCategories(e.target.value));
    
    // Wizard navigation
    document.getElementById('wizardBackBtn')?.addEventListener('click', handleWizardBack);
    document.getElementById('returnToCategoriesBtn')?.addEventListener('click', () => {
        if (confirm('Are you sure you want to exit this diagnostic?')) {
            showScreen('category');
        }
    });
    document.getElementById('previousStepBtn')?.addEventListener('click', previousStep);
    document.getElementById('saveNotesBtn')?.addEventListener('click', saveNotes);
    
    // Close modals on outside click
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            hideAllModals();
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    // Track page visibility for session management
    document.addEventListener('visibilitychange', handleVisibilityChange);
}

function filterCategories(event) {
    const searchTerm = (event?.target?.value || elements.categorySearch?.value || '').toLowerCase();
    const cards = elements.categoryGrid.querySelectorAll('.category-card');
    
    let visibleCount = 0;
    cards.forEach(card => {
        const title = card.querySelector('.card-title').textContent.toLowerCase();
        const description = card.title.toLowerCase();
        if (title.includes(searchTerm) || description.includes(searchTerm)) {
            card.style.display = '';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });
    
    // Show "no results" message if needed
    let noResults = document.getElementById('noResults');
    if (visibleCount === 0 && searchTerm) {
        if (!noResults) {
            noResults = document.createElement('div');
            noResults.id = 'noResults';
            noResults.className = 'no-results';
            noResults.textContent = 'No issues found matching your search.';
            elements.categoryGrid.appendChild(noResults);
        }
    } else if (noResults) {
        noResults.remove();
    }
    
    // Update visible count
    updateVisibleCount(visibleCount);
}

let currentFilter = 'all';
let currentSort = 'priority';

function setFilter(filter) {
    currentFilter = filter;
    
    // Update button states
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-filter="${filter}"]`)?.classList.add('active');
    
    // Apply filter
    applyFiltersAndSort();
}

function sortCategories(sortBy) {
    currentSort = sortBy;
    applyFiltersAndSort();
}

function applyFiltersAndSort() {
    const cards = Array.from(elements.categoryGrid.querySelectorAll('.category-card'));
    const searchTerm = elements.categorySearch?.value.toLowerCase() || '';
    
    // First, filter by priority
    let filteredCards = cards;
    if (currentFilter !== 'all') {
        filteredCards = cards.filter(card => {
            const priority = parseInt(card.dataset.priority);
            switch (currentFilter) {
                case 'critical': return priority === 1;
                case 'high': return priority === 2;
                case 'normal': return priority === 3;
                default: return true;
            }
        });
    }
    
    // Then apply search filter
    let visibleCards = filteredCards;
    if (searchTerm) {
        visibleCards = filteredCards.filter(card => {
            const title = card.querySelector('.card-title').textContent.toLowerCase();
            const description = card.title.toLowerCase();
            return title.includes(searchTerm) || description.includes(searchTerm);
        });
    }
    
    // Sort the visible cards
    const sortedCards = [...visibleCards].sort((a, b) => {
        switch (currentSort) {
            case 'priority':
                const priorityA = parseInt(a.dataset.priority);
                const priorityB = parseInt(b.dataset.priority);
                if (priorityA !== priorityB) return priorityA - priorityB;
                return a.querySelector('.card-title').textContent.localeCompare(b.querySelector('.card-title').textContent);
            
            case 'alphabetical':
                return a.querySelector('.card-title').textContent.localeCompare(b.querySelector('.card-title').textContent);
            
            case 'recent':
                const idA = a.dataset.categoryId;
                const idB = b.dataset.categoryId;
                const indexA = appState.recentCategories.indexOf(idA);
                const indexB = appState.recentCategories.indexOf(idB);
                if (indexA === -1 && indexB === -1) return 0;
                if (indexA === -1) return 1;
                if (indexB === -1) return -1;
                return indexA - indexB;
            
            default:
                return 0;
        }
    });
    
    // Hide all cards first
    cards.forEach(card => {
        card.style.display = 'none';
        card.classList.add('hidden');
    });
    
    // Show and reorder visible cards
    sortedCards.forEach((card, index) => {
        card.style.display = '';
        card.classList.remove('hidden');
        card.style.order = index;
    });
    
    // Update visible count
    updateVisibleCount(sortedCards.length);
    
    // Show/hide no results message
    let noResults = document.getElementById('noResults');
    if (sortedCards.length === 0) {
        if (!noResults) {
            noResults = document.createElement('div');
            noResults.id = 'noResults';
            noResults.className = 'no-results';
            noResults.textContent = currentFilter !== 'all' 
                ? `No ${currentFilter} priority issues found.`
                : 'No issues found matching your criteria.';
            elements.categoryGrid.appendChild(noResults);
        }
    } else if (noResults) {
        noResults.remove();
    }
}

function updateVisibleCount(count) {
    const visibleCountEl = document.getElementById('visibleCount');
    if (visibleCountEl) {
        visibleCountEl.textContent = count;
    }
    
    const summaryEl = document.getElementById('categorySummary');
    if (summaryEl) {
        const total = issueCategories.length;
        summaryEl.textContent = count === total 
            ? `Showing all ${total} issues`
            : `Showing ${count} of ${total} issues`;
    }
}

// ========================================
// Homepage Functions
// ========================================
function updateHomepage() {
    // Update recent activity section
    updateRecentActivity();
    
    // Update quick stats
    updateQuickStats();
    
    // Update system status
    updateSystemStatus();
}

function updateRecentActivity() {
    const welcomeContent = document.querySelector('.welcome-content');
    
    // Remove existing recent section if present
    const existingRecent = document.getElementById('recentSection');
    if (existingRecent) {
        existingRecent.remove();
    }
    
    if (appState.recentCategories.length > 0) {
        const recentSection = document.createElement('div');
        recentSection.id = 'recentSection';
        recentSection.className = 'recent-section';
        recentSection.innerHTML = `
            <h2 class="recent-title">Recent Issues</h2>
            <div class="recent-grid"></div>
        `;
        
        const recentGrid = recentSection.querySelector('.recent-grid');
        
        // Show up to 5 most recent unique categories
        const uniqueRecent = [...new Set(appState.recentCategories)].slice(0, MAX_RECENT_ITEMS);
        
        uniqueRecent.forEach(categoryId => {
            const category = issueCategories.find(c => c.id === categoryId);
            if (category) {
                const recentCard = createQuickAccessCard(category);
                recentGrid.appendChild(recentCard);
            }
        });
        
        // Insert after safety declaration
        const safetyDeclaration = welcomeContent.querySelector('.safety-declaration');
        safetyDeclaration.parentNode.insertBefore(recentSection, safetyDeclaration.nextSibling);
    }
}

function createQuickAccessCard(category) {
    const card = document.createElement('button');
    card.className = 'quick-access-card';
    card.innerHTML = `
        <span class="quick-icon">${category.icon}</span>
        <span class="quick-name">${category.name}</span>
    `;
    card.addEventListener('click', () => {
        showScreen('category');
        setTimeout(() => {
            document.querySelector(`[data-category-id="${category.id}"]`)?.click();
        }, 100);
    });
    return card;
}

function updateQuickStats() {
    const welcomeContent = document.querySelector('.welcome-content');
    
    // Remove existing stats if present
    const existingStats = document.getElementById('quickStats');
    if (existingStats) {
        existingStats.remove();
    }
    
    // Calculate stats
    const todayLogs = appState.diagnosticHistory.filter(log => {
        const logDate = new Date(log.timestamp);
        const today = new Date();
        return logDate.toDateString() === today.toDateString();
    }).length;
    
    const criticalCount = issueCategories.filter(c => c.priority === 1).length;
    
    // Create stats section
    const statsSection = document.createElement('div');
    statsSection.id = 'quickStats';
    statsSection.className = 'quick-stats';
    statsSection.innerHTML = `
        <div class="stat-card">
            <div class="stat-value">${todayLogs}</div>
            <div class="stat-label">Today's Diagnostics</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${criticalCount}</div>
            <div class="stat-label">Critical Issues</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${issueCategories.length}</div>
            <div class="stat-label">Total Categories</div>
        </div>
    `;
    
    // Insert before action grid
    const actionGrid = welcomeContent.querySelector('.action-grid');
    actionGrid.parentNode.insertBefore(statsSection, actionGrid);
}

function updateSystemStatus() {
    if (elements.statusIndicator && elements.statusText) {
        const isOnline = navigator.onLine;
        elements.statusIndicator.className = `status-indicator ${isOnline ? 'online' : 'offline'}`;
        elements.statusText.textContent = isOnline ? 'System Online' : 'Offline Mode';
        appState.systemStatus = isOnline ? 'online' : 'offline';
    }
}

// ========================================
// Screen Management
// ========================================
function showScreen(screenName) {
    console.log(`📱 Switching to screen: ${screenName}`);
    
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Show requested screen
    const screen = elements[screenName + 'Screen'];
    if (screen) {
        screen.classList.add('active');
        appState.currentScreen = screenName;
        saveAppState();
        
        // Update breadcrumb
        updateBreadcrumb(screenName);
        
        // Screen-specific actions
        if (screenName === 'welcome') {
            updateHomepage();
        } else if (screenName === 'category') {
            elements.categorySearch.value = '';
            filterCategories();
        }
    }
}

function updateBreadcrumb(screenName) {
    const breadcrumb = document.getElementById('breadcrumbTrail');
    if (!breadcrumb) return;
    
    switch (screenName) {
        case 'welcome':
            breadcrumb.textContent = 'Home';
            break;
        case 'category':
            breadcrumb.textContent = 'Home > Select Issue';
            break;
        case 'wizard':
            const category = issueCategories.find(c => c.id === appState.currentIssue);
            breadcrumb.textContent = `Home > ${category ? category.name : 'Diagnostic'}`;
            break;
    }
}

function showModal(modalName) {
    const modal = elements[modalName + 'Modal'];
    if (modal) {
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        
        // Populate modal content
        if (modalName === 'quickRef') {
            populateQuickReference();
        }
    }
}

function hideModal(modalName) {
    const modal = elements[modalName + 'Modal'];
    if (modal) {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
    }
}

function hideAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
    });
}

function populateQuickReference() {
    const modalBody = elements.quickRefModal.querySelector('.modal-body');
    modalBody.innerHTML = `
        <div class="quick-ref-content">
            <h3>Critical Safety Procedures</h3>
            <div class="ref-section">
                <h4>🛑 Immediate Stop Required:</h4>
                <ul>
                    <li>Brake pedal sinks to floor</li>
                    <li>Steering excessive play or unresponsive</li>
                    <li>Oil warning light on</li>
                    <li>Loose wheel nuts</li>
                    <li>Red ABS light remains after reset</li>
                </ul>
            </div>
            <div class="ref-section">
                <h4>⚠️ Changeover at Next Stop:</h4>
                <ul>
                    <li>Amber ABS light</li>
                    <li>Temperature 80-100°C</li>
                    <li>Battery light (if belts intact)</li>
                    <li>One brake light not working</li>
                </ul>
            </div>
            <div class="ref-section">
                <h4>📞 Emergency Contacts:</h4>
                <ul>
                    <li>Engineering Support: 0191 XXX XXXX</li>
                    <li>Control Room: 0191 XXX XXXX</li>
                    <li>On-Call Manager: 07XXX XXXXXX</li>
                </ul>
            </div>
        </div>
    `;
}

// ========================================
// Screen Management
// ========================================
function showScreen(screenName) {
    console.log(`📱 Switching to screen: ${screenName}`);
    
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Show requested screen
    const screen = elements[screenName + 'Screen'];
    if (screen) {
        screen.classList.add('active');
        appState.currentScreen = screenName;
        saveAppState();
        
        // Update breadcrumb
        updateBreadcrumb(screenName);
        
        // Screen-specific actions
        if (screenName === 'welcome') {
            updateHomepage();
        } else if (screenName === 'category') {
            elements.categorySearch.value = '';
            filterCategories();
        }
    }
}

function updateBreadcrumb(screenName) {
    const breadcrumb = document.getElementById('breadcrumbTrail');
    if (!breadcrumb) return;
    
    switch (screenName) {
        case 'welcome':
            breadcrumb.textContent = 'Home';
            break;
        case 'category':
            breadcrumb.textContent = 'Home > Select Issue';
            break;
        case 'wizard':
            const category = issueCategories.find(c => c.id === appState.currentIssue);
            breadcrumb.textContent = `Home > ${category ? category.name : 'Diagnostic'}`;
            break;
    }
}

function showModal(modalName) {
    const modal = elements[modalName + 'Modal'];
    if (modal) {
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        
        // Populate modal content
        if (modalName === 'quickRef') {
            populateQuickReference();
        }
    }
}

function hideModal(modalName) {
    const modal = elements[modalName + 'Modal'];
    if (modal) {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
    }
}

function hideAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
    });
}

function populateQuickReference() {
    const modalBody = elements.quickRefModal.querySelector('.modal-body');
    modalBody.innerHTML = `
        <div class="quick-ref-content">
            <h3>Critical Safety Procedures</h3>
            <div class="ref-section">
                <h4>🛑 Immediate Stop Required:</h4>
                <ul>
                    <li>Brake pedal sinks to floor</li>
                    <li>Steering excessive play or unresponsive</li>
                    <li>Oil warning light on</li>
                    <li>Loose wheel nuts</li>
                    <li>Red ABS light remains after reset</li>
                </ul>
            </div>
            <div class="ref-section">
                <h4>⚠️ Changeover at Next Stop:</h4>
                <ul>
                    <li>Amber ABS light</li>
                    <li>Temperature 80-100°C</li>
                    <li>Battery light (if belts intact)</li>
                    <li>One brake light not working</li>
                </ul>
            </div>
            <div class="ref-section">
                <h4>📞 Emergency Contacts:</h4>
                <ul>
                    <li>Engineering Support: 0191 XXX XXXX</li>
                    <li>Control Room: 0191 XXX XXXX</li>
                    <li>On-Call Manager: 07XXX XXXXXX</li>
                </ul>
            </div>
        </div>
    `;
}

// ========================================
// Category Management
// ========================================
function initializeCategories() {
    // Sort by priority (1 = critical, 2 = high, 3 = normal)
    issueCategories.sort((a, b) => {
        if (a.priority !== b.priority) {
            return a.priority - b.priority;
        }
        return a.name.localeCompare(b.name);
    });
    
    // Render categories
    renderCategories(issueCategories);
}

function renderCategories(categories) {
    if (!elements.categoryGrid) return;
    
    elements.categoryGrid.innerHTML = '';
    
    categories.forEach(category => {
        const categoryCard = createCategoryCard(category);
        elements.categoryGrid.appendChild(categoryCard);
    });
}

function createCategoryCard(category) {
    const card = document.createElement('button');
    card.className = 'action-card category-card';
    card.dataset.categoryId = category.id;
    card.dataset.priority = category.priority;
    card.title = category.description;
    
    // Add priority styling
    if (category.priority === 1) {
        card.classList.add('safety-critical');
    } else if (category.priority === 2) {
        card.classList.add('high-priority');
    }
    
    card.innerHTML = `
        <span class="card-icon">${category.icon}</span>
        <h3 class="card-title">${category.name}</h3>
        ${category.priority === 1 ? '<span class="priority-badge">SAFETY CRITICAL</span>' : ''}
    `;
    
    card.addEventListener('click', () => startDiagnostic(category.id));
    
    return card;
}

function filterCategories(event) {
    const searchTerm = (event?.target?.value || elements.categorySearch?.value || '').toLowerCase();
    const cards = elements.categoryGrid.querySelectorAll('.category-card');
    
    let visibleCount = 0;
    cards.forEach(card => {
        const title = card.querySelector('.card-title').textContent.toLowerCase();
        const description = card.title.toLowerCase();
        if (title.includes(searchTerm) || description.includes(searchTerm)) {
            card.style.display = '';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });
    
    // Show "no results" message if needed
    let noResults = document.getElementById('noResults');
    if (visibleCount === 0 && searchTerm) {
        if (!noResults) {
            noResults = document.createElement('div');
            noResults.id = 'noResults';
            noResults.className = 'no-results';
            noResults.textContent = 'No issues found matching your search.';
            elements.categoryGrid.appendChild(noResults);
        }
    } else if (noResults) {
        noResults.remove();
    }
}

// ========================================
// Diagnostic Functions
// ========================================
let wizard = null;

function startDiagnostic(categoryId) {
    console.log(`🔧 Starting diagnostic for: ${categoryId}`);
    
    // Set current issue
    appState.currentIssue = categoryId;
    appState.currentStep = 0;
    
    // Add to recent categories
    appState.recentCategories.unshift(categoryId);
    appState.recentCategories = appState.recentCategories.slice(0, 10); // Keep last 10
    
    // Log start of diagnostic
    logAction('Started diagnostic', { category: categoryId });
    
    // Show wizard screen
    showScreen('wizard');
    
    // Check if diagnostic flow exists
    if (diagnosticFlows[categoryId]) {
        // Initialize wizard engine
        if (!wizard) {
            wizard = new DiagnosticWizard('wizardContent', {
                onComplete: handleDiagnosticComplete,
                onStepChange: handleStepChange,
                onValidationError: handleValidationError
            });
        }
        
        // Load the flow
        wizard.loadFlow(categoryId);
    } else {
        // Load placeholder for unimplemented flows
        loadDiagnosticStep();
    }
}

function loadDiagnosticStep() {
    const wizardContent = document.getElementById('wizardContent');
    const wizardTitle = document.getElementById('wizardTitle');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    
    const category = issueCategories.find(c => c.id === appState.currentIssue);
    if (!category) return;
    
    wizardTitle.textContent = category.name;
    
    // Placeholder content
    wizardContent.innerHTML = `
        <div class="step-header">
            <span class="step-number">${appState.currentStep + 1}</span>
            <h2 class="step-title">Initial Assessment</h2>
        </div>
        <div class="step-content">
            <div class="safety-warning">
                <h3>⚠️ Diagnostic Not Yet Implemented</h3>
                <p>The diagnostic flow for <strong>${category.name}</strong> is being developed.</p>
                <p>Description: ${category.description}</p>
                <p>Priority Level: ${category.priority === 1 ? 'SAFETY CRITICAL' : category.priority === 2 ? 'High' : 'Normal'}</p>
            </div>
            <div class="step-info">
                <h3>Next Steps:</h3>
                <ul>
                    <li>Diagnostic flows will be implemented in Phase 2</li>
                    <li>Each issue will have step-by-step guidance</li>
                    <li>Safety checks will be enforced</li>
                    <li>All decisions will be logged</li>
                </ul>
            </div>
        </div>
    `;
    
    // Update progress
    progressBar.style.width = '20%';
    progressText.textContent = 'Step 1 of 5';
    
    // Update navigation buttons
    updateWizardButtons();
}

function updateWizardButtons(isComplete = false) {
    const previousBtn = document.getElementById('previousStepBtn');
    const saveNotesBtn = document.getElementById('saveNotesBtn');
    const returnBtn = document.getElementById('returnToCategoriesBtn');
    
    if (previousBtn) {
        if (wizard) {
            previousBtn.disabled = !wizard.canGoBack();
        } else {
            previousBtn.disabled = appState.currentStep === 0;
        }
    }
    
    if (isComplete && returnBtn) {
        returnBtn.textContent = '✓ Complete - Return to Categories';
        returnBtn.classList.add('btn-success');
    }
}

function handleWizardBack() {
    if (wizard && wizard.canGoBack()) {
        wizard.goBack();
    } else if (appState.currentStep > 0) {
        previousStep();
    } else {
        if (confirm('Exit this diagnostic and return to categories?')) {
            showScreen('category');
        }
    }
}

function previousStep() {
    if (wizard && wizard.canGoBack()) {
        wizard.goBack();
    } else if (appState.currentStep > 0) {
        appState.currentStep--;
        logAction('Went to previous step', { step: appState.currentStep });
        loadDiagnosticStep();
    }
}

function handleDiagnosticComplete(summary) {
    console.log('✓ Diagnostic complete:', summary);
    logAction('Completed diagnostic', summary);
    
    // Save completed session
    const category = issueCategories.find(c => c.id === appState.currentIssue);
    sessionManager.saveSession({
        issue: appState.currentIssue,
        issueTitle: category ? category.name : appState.currentIssue,
        status: 'completed',
        currentStep: 'complete',
        totalSteps: Object.keys(wizard.currentFlow.flow.steps).length - 1,
        responses: summary.responses,
        outcome: summary.outcome,
        duration: summary.duration,
        notes: appState.notes
    });
    
    // Show completion message
    const wizardContent = document.getElementById('wizardContent');
    if (wizardContent) {
        // The summary is already rendered by the wizard
        // Update buttons
        updateWizardButtons(true);
    }
}

function handleStepChange(step, progress) {
    console.log('📊 Step changed:', step.title, progress);
    
    // Save session progress
    const category = issueCategories.find(c => c.id === appState.currentIssue);
    sessionManager.saveSession({
        issue: appState.currentIssue,
        issueTitle: category ? category.name : appState.currentIssue,
        status: 'in-progress',
        currentStep: wizard.currentStepId,
        totalSteps: progress.total,
        stepHistory: wizard.stepHistory,
        responses: wizard.responses,
        notes: appState.notes
    });
    
    // Update wizard title if needed
    const wizardTitle = document.getElementById('wizardTitle');
    if (wizardTitle && category) {
        wizardTitle.textContent = `${category.name} - ${step.title}`;
    }
    
    // Update buttons
    updateWizardButtons();
}

function handleValidationError(errors) {
    console.error('⚠️ Validation errors:', errors);
    // Errors are already displayed by the wizard
}

// ========================================
// Utility Functions
// ========================================
function showLoading(show = true) {
    if (elements.loadingOverlay) {
        elements.loadingOverlay.classList.toggle('active', show);
    }
}

function showRecentLogs() {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content modal-large">
            <div class="modal-header">
                <h2>Recent Diagnostic Sessions</h2>
                <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div class="modal-body" id="recentSessionsContainer">
                <!-- Recent sessions will be rendered here -->
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Initialize recent sessions component
    recentSessions = new RecentSessions('recentSessionsContainer', sessionManager);
    
    // Set up callbacks
    recentSessions.onSessionSelect = (session) => {
        modal.remove();
        // Resume the diagnostic
        if (session.status === 'in-progress') {
            appState.currentIssue = session.issue;
            showScreen('wizard');
            
            if (wizard) {
                wizard.loadFlow(session.issue);
                // Restore saved state
                wizard.currentStepId = session.currentStep;
                wizard.stepHistory = session.stepHistory || [];
                wizard.responses = session.responses || {};
                wizard.renderCurrentStep();
            }
        }
    };
    
    recentSessions.render();
}

function generateLogsHTML() {
    if (appState.diagnosticHistory.length === 0) {
        return '<p>No diagnostic sessions recorded yet.</p>';
    }
    
    const recentLogs = appState.diagnosticHistory.slice(-20).reverse();
    let html = '<div class="logs-list">';
    
    recentLogs.forEach(log => {
        const date = new Date(log.timestamp);
        const category = issueCategories.find(c => c.id === log.issue);
        html += `
            <div class="log-item">
                <div class="log-time">${date.toLocaleString()}</div>
                <div class="log-action">${log.action}</div>
                ${category ? `<div class="log-category">${category.icon} ${category.name}</div>` : ''}
            </div>
        `;
    });
    
    html += '</div>';
    return html;
}

function showHelp() {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Help & User Guide</h2>
                <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="help-content">
                    <h3>How to Use the Breakdown Guide</h3>
                    <ol>
                        <li><strong>Start Diagnosis:</strong> Click to view all issue categories</li>
                        <li><strong>Select Issue:</strong> Choose the problem reported by the driver</li>
                        <li><strong>Follow Steps:</strong> Work through each step carefully</li>
                        <li><strong>Safety First:</strong> Red items require immediate stop</li>
                        <li><strong>Take Notes:</strong> Record observations in the notes section</li>
                        <li><strong>Complete:</strong> Follow the recommended action</li>
                    </ol>
                    
                    <h3>Priority Levels</h3>
                    <ul>
                        <li><span style="color: #dc2626;">Red Border:</span> Safety Critical - Immediate stop</li>
                        <li><span style="color: #f59e0b;">Orange Border:</span> High Priority - Changeover soon</li>
                        <li><span style="color: #6b7280;">Gray Border:</span> Normal - Can continue with caution</li>
                    </ul>
                    
                    <h3>Keyboard Shortcuts</h3>
                    <ul>
                        <li><kbd>Esc</kbd> - Close modals</li>
                        <li><kbd>Ctrl + S</kbd> - Save notes</li>
                        <li><kbd>/</kbd> - Focus search (on category screen)</li>
                    </ul>
                    
                    <h3>Support</h3>
                    <p>For technical support or to report issues with this application:</p>
                    <ul>
                        <li>Engineering Support: 0191 XXX XXXX</li>
                        <li>IT Helpdesk: 0191 XXX XXXX</li>
                    </ul>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function handleKeyboardShortcuts(event) {
    // ESC key closes modals
    if (event.key === 'Escape') {
        hideAllModals();
        const tempModals = document.querySelectorAll('.modal:not(#quickRefModal):not(#emergencyModal)');
        tempModals.forEach(modal => modal.remove());
    }
    
    // Ctrl/Cmd + S saves notes
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        saveNotes();
    }
    
    // Forward slash focuses search on category screen
    if (event.key === '/' && appState.currentScreen === 'category') {
        event.preventDefault();
        elements.categorySearch?.focus();
    }
}

function handleVisibilityChange() {
    if (document.hidden) {
        // Page is hidden
        appState.lastActivity = Date.now();
    } else {
        // Page is visible again
        const inactiveTime = Date.now() - (appState.lastActivity || Date.now());
        if (inactiveTime > SESSION_TIMEOUT) {
            // Session expired - return to home
            showScreen('welcome');
            alert('Your session has expired. Please start a new diagnostic.');
        }
    }
}

// ========================================
// State Management
// ========================================
function saveAppState() {
    try {
        const stateToSave = {
            ...appState,
            savedAt: Date.now()
        };
        localStorage.setItem(STORAGE_PREFIX + 'state', JSON.stringify(stateToSave));
    } catch (error) {
        console.error('Failed to save app state:', error);
    }
}

function loadAppState() {
    try {
        const savedState = localStorage.getItem(STORAGE_PREFIX + 'state');
        if (savedState) {
            const parsed = JSON.parse(savedState);
            // Don't restore screen state - always start at welcome
            parsed.currentScreen = 'welcome';
            Object.assign(appState, parsed);
        }
    } catch (error) {
        console.error('Failed to load app state:', error);
    }
}

function saveNotes() {
    const notesInput = document.getElementById('notesInput');
    if (notesInput) {
        appState.notes = notesInput.value;
        saveAppState();
        logAction('Notes saved', { length: appState.notes.length });
        
        // Show confirmation
        const saveBtn = document.getElementById('saveNotesBtn');
        const originalText = saveBtn.textContent;
        saveBtn.textContent = '✓ Saved';
        setTimeout(() => {
            saveBtn.textContent = originalText;
        }, 2000);
    }
}

// ========================================
// Logging
// ========================================
function logAction(action, details = {}) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        action: action,
        details: details,
        screen: appState.currentScreen,
        issue: appState.currentIssue,
        user: 'supervisor' // In future, could add user identification
    };
    
    appState.diagnosticHistory.push(logEntry);
    
    // Keep only last 100 entries
    if (appState.diagnosticHistory.length > 100) {
        appState.diagnosticHistory = appState.diagnosticHistory.slice(-100);
    }
    
    saveAppState();
    console.log('📝 Action logged:', logEntry);
}

// ========================================
// System Monitoring
// ========================================
function startSystemMonitoring() {
    // Check online status
    window.addEventListener('online', updateSystemStatus);
    window.addEventListener('offline', updateSystemStatus);
    
    // Initial status check
    updateSystemStatus();
    
    // Periodic status check
    setInterval(updateSystemStatus, 30000); // Every 30 seconds
}

// ========================================
// State Management
// ========================================
function saveAppState() {
    try {
        const stateToSave = {
            ...appState,
            savedAt: Date.now()
        };
        localStorage.setItem(STORAGE_PREFIX + 'state', JSON.stringify(stateToSave));
    } catch (error) {
        console.error('Failed to save app state:', error);
    }
}

function loadAppState() {
    try {
        const savedState = localStorage.getItem(STORAGE_PREFIX + 'state');
        if (savedState) {
            const parsed = JSON.parse(savedState);
            // Don't restore screen state - always start at welcome
            parsed.currentScreen = 'welcome';
            Object.assign(appState, parsed);
        }
    } catch (error) {
        console.error('Failed to load app state:', error);
    }
}

function saveNotes() {
    const notesInput = document.getElementById('notesInput');
    if (notesInput) {
        appState.notes = notesInput.value;
        saveAppState();
        logAction('Notes saved', { length: appState.notes.length });
        
        // Show confirmation
        const saveBtn = document.getElementById('saveNotesBtn');
        const originalText = saveBtn.textContent;
        saveBtn.textContent = '✓ Saved';
        setTimeout(() => {
            saveBtn.textContent = originalText;
        }, 2000);
    }
}

// ========================================
// Logging
// ========================================
function logAction(action, details = {}) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        action: action,
        details: details,
        screen: appState.currentScreen,
        issue: appState.currentIssue,
        user: 'supervisor' // In future, could add user identification
    };
    
    appState.diagnosticHistory.push(logEntry);
    
    // Keep only last 100 entries
    if (appState.diagnosticHistory.length > 100) {
        appState.diagnosticHistory = appState.diagnosticHistory.slice(-100);
    }
    
    saveAppState();
    console.log('📝 Action logged:', logEntry);
}

// ========================================
// System Monitoring
// ========================================
function startSystemMonitoring() {
    // Check online status
    window.addEventListener('online', updateSystemStatus);
    window.addEventListener('offline', updateSystemStatus);
    
    // Initial status check
    updateSystemStatus();
    
    // Periodic status check
    setInterval(updateSystemStatus, 30000); // Every 30 seconds
}

// ========================================
// Additional Styles
// ========================================
const additionalStyles = document.createElement('style');
additionalStyles.textContent = `
    /* Recent Activity Section */
    .recent-section {
        margin: 2rem 0;
        padding: 1.5rem;
        background-color: var(--color-gray-50);
        border-radius: var(--border-radius-lg);
    }
    
    .recent-title {
        font-size: var(--font-size-xl);
        margin-bottom: 1rem;
        color: var(--gne-navy);
    }
    
    .recent-grid {
        display: flex;
        gap: 0.75rem;
        flex-wrap: wrap;
        justify-content: center;
    }
    
    .quick-access-card {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        background-color: var(--color-white);
        border: 2px solid var(--color-gray-300);
        border-radius: var(--border-radius-md);
        cursor: pointer;
        transition: all var(--transition-base);
    }
    
    .quick-access-card:hover {
        border-color: var(--gne-red);
        transform: translateY(-1px);
    }
    
    .quick-icon {
        font-size: var(--font-size-lg);
    }
    
    .quick-name {
        font-size: var(--font-size-sm);
        font-weight: 500;
        color: var(--gne-navy);
    }
    
    /* Quick Stats */
    .quick-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 1rem;
        margin: 2rem 0;
    }
    
    .stat-card {
        background-color: var(--color-white);
        padding: 1.5rem;
        border-radius: var(--border-radius-md);
        text-align: center;
        box-shadow: var(--shadow-sm);
    }
    
    .stat-value {
        font-size: var(--font-size-3xl);
        font-weight: 700;
        color: var(--gne-navy);
    }
    
    .stat-label {
        font-size: var(--font-size-sm);
        color: var(--color-gray-600);
        margin-top: 0.25rem;
    }
    
    /* Priority Badge */
    .priority-badge {
        display: inline-block;
        padding: 4px 8px;
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        background-color: var(--color-danger);
        color: white;
        border-radius: 4px;
        margin-top: 8px;
    }
    
    .category-card.high-priority {
        border-color: var(--color-warning);
    }
    
    .category-card.high-priority:hover {
        border-color: var(--color-warning);
        background-color: #fef3c7;
    }
    
    /* No Results Message */
    .no-results {
        grid-column: 1 / -1;
        text-align: center;
        padding: 3rem;
        color: var(--color-gray-500);
        font-size: var(--font-size-lg);
    }
    
    /* Step Header */
    .step-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1.5rem;
    }
    
    .step-number {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        background-color: var(--gne-navy);
        color: white;
        border-radius: 50%;
        font-weight: 600;
        font-size: var(--font-size-lg);
    }
    
    .step-title {
        font-size: var(--font-size-2xl);
        color: var(--gne-navy);
        margin: 0;
    }
    
    .step-content {
        margin-left: 3.5rem;
    }
    
    .step-info {
        margin-top: 2rem;
    }
    
    .step-info h3 {
        color: var(--gne-navy);
        margin-bottom: 0.5rem;
    }
    
    .step-info ul {
        margin-left: 1.5rem;
        color: var(--color-gray-700);
    }
    
    /* Logs */
    .logs-list {
        max-height: 400px;
        overflow-y: auto;
    }
    
    .log-item {
        padding: 0.75rem;
        border-bottom: 1px solid var(--color-gray-200);
    }
    
    .log-item:last-child {
        border-bottom: none;
    }
    
    .log-time {
        font-size: var(--font-size-sm);
        color: var(--color-gray-500);
    }
    
    .log-action {
        font-weight: 500;
        color: var(--gne-navy);
    }
    
    .log-category {
        font-size: var(--font-size-sm);
        color: var(--color-gray-600);
        margin-top: 0.25rem;
    }
    
    /* Help Content */
    .help-content h3 {
        color: var(--gne-navy);
        margin-top: 1.5rem;
        margin-bottom: 0.75rem;
    }
    
    .help-content h3:first-child {
        margin-top: 0;
    }
    
    .help-content ol,
    .help-content ul {
        margin-left: 1.5rem;
        line-height: 1.8;
    }
    
    .help-content kbd {
        background-color: var(--color-gray-100);
        border: 1px solid var(--color-gray-300);
        border-radius: 3px;
        padding: 2px 6px;
        font-family: monospace;
        font-size: var(--font-size-sm);
    }
    
    /* Quick Reference Content */
    .quick-ref-content h3 {
        color: var(--gne-navy);
        margin-bottom: 1rem;
    }
    
    .ref-section {
        margin-bottom: 1.5rem;
        padding: 1rem;
        background-color: var(--color-gray-50);
        border-radius: var(--border-radius-md);
    }
    
    .ref-section h4 {
        color: var(--gne-navy);
        margin-bottom: 0.5rem;
    }
    
    .ref-section ul {
        margin-left: 1.5rem;
        line-height: 1.8;
    }
`;
document.head.appendChild(additionalStyles);

// ========================================
// State Management
// ========================================
function loadAppState() {
    try {
        const savedState = localStorage.getItem(STORAGE_PREFIX + 'appState');
        if (savedState) {
            const state = JSON.parse(savedState);
            Object.assign(appState, state);
        }
    } catch (error) {
        console.error('Failed to load app state:', error);
    }
}

function saveAppState() {
    try {
        localStorage.setItem(STORAGE_PREFIX + 'appState', JSON.stringify(appState));
    } catch (error) {
        console.error('Failed to save app state:', error);
    }
}

// ========================================
// System Monitoring
// ========================================
function startSystemMonitoring() {
    // Update system status every 30 seconds
    setInterval(updateSystemStatus, 30000);
    
    // Monitor online/offline events
    window.addEventListener('online', updateSystemStatus);
    window.addEventListener('offline', updateSystemStatus);
}

function handleVisibilityChange() {
    if (document.hidden) {
        // Page is hidden, save state
        saveAppState();
    } else {
        // Page is visible, refresh status
        updateSystemStatus();
    }
}

// ========================================
// Keyboard Shortcuts
// ========================================
function handleKeyboardShortcuts(e) {
    // Alt+S: Start diagnosis
    if (e.altKey && e.key === 's') {
        e.preventDefault();
        showScreen('category');
    }
    
    // Alt+H: Home
    if (e.altKey && e.key === 'h') {
        e.preventDefault();
        showScreen('welcome');
    }
    
    // Escape: Close modals
    if (e.key === 'Escape') {
        hideAllModals();
    }
}

// ========================================
// Logging
// ========================================
function logAction(action, details = {}) {
    const logEntry = {
        action,
        details,
        timestamp: new Date().toISOString(),
        category: appState.currentIssue,
        sessionId: sessionManager?.getCurrentSessionId()
    };
    
    appState.diagnosticHistory.push(logEntry);
    
    // Keep only last 100 entries
    if (appState.diagnosticHistory.length > 100) {
        appState.diagnosticHistory = appState.diagnosticHistory.slice(-100);
    }
    
    saveAppState();
    console.log('Action logged:', action, details);
}

// ========================================
// Notes Management
// ========================================
function saveNotes() {
    const notesInput = document.getElementById('notesInput');
    if (notesInput) {
        appState.notes = notesInput.value;
        saveAppState();
        
        // Update session
        sessionManager?.updateSession({ notes: appState.notes });
        
        // Show confirmation
        const saveBtn = document.getElementById('saveNotesBtn');
        if (saveBtn) {
            const originalText = saveBtn.textContent;
            saveBtn.textContent = '✓ Saved';
            saveBtn.classList.add('btn-success');
            
            setTimeout(() => {
                saveBtn.textContent = originalText;
                saveBtn.classList.remove('btn-success');
            }, 2000);
        }
    }
}

// ========================================
// Additional Styles (if needed)
// ========================================
const additionalStyles = document.createElement('style');
additionalStyles.textContent = `
    module.exports = {
        initializeApp,
        showScreen,
        startDiagnostic,
        logAction,
        updateHomepage
    };
}