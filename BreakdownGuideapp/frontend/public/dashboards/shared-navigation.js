/**
 * Shared Navigation Component for Go North East Dashboard System
 * Provides consistent navigation across all dashboard pages
 */

// Dashboard configuration
const dashboardConfig = {
    sdc: {
        path: 'sdc-operations-dashboard.html',
        roles: ['SDC', 'Supervisor', 'Manager', 'Director', 'Admin'],
        name: 'SDC Operations Centre',
        icon: '📡',
        description: 'Real-time dispatch & monitoring'
    },
    breakdown: {
        path: 'breakdown-dashboard-enhanced.html',
        roles: ['Supervisor', 'Manager', 'SDC', 'Director', 'Admin'],
        name: 'Breakdown Tracker',
        icon: '⏱️',
        description: 'Timed response tracking'
    },
    engineering: {
        path: 'engineering-dashboard-live.html',
        roles: ['Engineer', 'Engineering Manager', 'Director', 'Admin'],
        name: 'Engineering Response Live',
        icon: '⚙️',
        description: 'Technical diagnostics'
    },
    management: {
        path: 'management-overview-dashboard.html',
        roles: ['Manager', 'Director', 'Executive', 'Admin'],
        name: 'Management Overview',
        icon: '📊',
        description: 'KPIs & analytics'
    }
};

// Initialize navigation on page load
document.addEventListener('DOMContentLoaded', function() {
    injectNavigationHTML();
    initializeNavigation();
    setupKeyboardShortcuts();
    highlightCurrentDashboard();
});

// Inject the navigation HTML into the page
function injectNavigationHTML() {
    // Check if navigation already exists
    if (document.querySelector('.shared-nav-container')) return;
    
    const navHTML = `
        <!-- Shared Navigation Bar -->
        <div class="shared-nav-container">
            <div class="shared-nav-header">
                <div class="nav-logo" onclick="goHome()">
                    <span class="go">Go</span><span class="north-east">NorthEast</span>
                    <span class="nav-system-badge">Breakdown Intelligence</span>
                </div>
                
                <div class="nav-dashboard-switcher">
                    <button class="nav-btn" data-dashboard="sdc" onclick="navigateToDashboard('sdc')">
                        📡 SDC
                    </button>
                    <button class="nav-btn" data-dashboard="breakdown" onclick="navigateToDashboard('breakdown')">
                        ⏱️ Tracker
                    </button>
                    <button class="nav-btn" data-dashboard="engineering" onclick="navigateToDashboard('engineering')">
                        ⚙️ Engineering
                    </button>
                    <button class="nav-btn" data-dashboard="management" onclick="navigateToDashboard('management')">
                        📊 Management
                    </button>
                </div>
                
                <div class="nav-quick-actions">
                    <button class="nav-action-btn emergency" onclick="openBreakdownGuide()">
                        🚨 Report
                    </button>
                    <button class="nav-action-btn" onclick="goHome()">
                        🏠 Home
                    </button>
                </div>
            </div>
        </div>
        
        <!-- Floating Quick Access Panel -->
        <div class="floating-quick-panel" id="floatingQuickPanel">
            <button class="panel-toggle-btn" onclick="toggleQuickPanel()">
                <span>☰</span>
            </button>
            
            <div class="quick-panel-content">
                <h4>Quick Navigation</h4>
                
                <div class="quick-panel-section">
                    <button class="quick-btn emergency" onclick="openBreakdownGuide()">
                        🚨 Report Breakdown
                    </button>
                    <button class="quick-btn primary" onclick="openBreakdownGuide()">
                        📖 Breakdown Guide
                    </button>
                </div>
                
                <div class="quick-panel-links">
                    ${Object.entries(dashboardConfig).map(([key, config]) => `
                        <a href="${config.path}" class="quick-link" data-dashboard="${key}">
                            <span>${config.icon} ${config.name}</span>
                            ${key === 'sdc' ? '<span class="live-badge">LIVE</span>' : ''}
                        </a>
                    `).join('')}
                </div>
                
                <div class="quick-panel-info">
                    <div class="info-item">
                        <span class="info-label">Active:</span>
                        <span class="info-value" id="quickPanelActive">0</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Today:</span>
                        <span class="info-value" id="quickPanelToday">0</span>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Mobile Bottom Navigation -->
        <div class="mobile-bottom-nav">
            <a href="../breakdown-guide/guide.html" class="mobile-nav-item">
                <span class="mobile-icon">🔧</span>
                <span class="mobile-label">Guide</span>
            </a>
            <a href="sdc-operations-dashboard.html" class="mobile-nav-item">
                <span class="mobile-icon">📡</span>
                <span class="mobile-label">SDC</span>
            </a>
            <button class="mobile-nav-item mobile-emergency" onclick="openBreakdownGuide()">
                <span class="mobile-icon-large">🚨</span>
            </button>
            <a href="breakdown-dashboard-enhanced.html" class="mobile-nav-item">
                <span class="mobile-icon">⏱️</span>
                <span class="mobile-label">Tracker</span>
            </a>
            <button class="mobile-nav-item" onclick="toggleQuickPanel()">
                <span class="mobile-icon">☰</span>
                <span class="mobile-label">More</span>
            </button>
        </div>
    `;
    
    // Inject at the beginning of body
    document.body.insertAdjacentHTML('afterbegin', navHTML);
    
    // Inject styles if not already present
    if (!document.querySelector('#shared-nav-styles')) {
        const styleHTML = `
            <style id="shared-nav-styles">
                /* Shared Navigation Styles */
                .shared-nav-container {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    background: white;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    z-index: 1000;
                    padding: 10px 20px;
                }
                
                .shared-nav-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    max-width: 1400px;
                    margin: 0 auto;
                }
                
                .nav-logo {
                    display: flex;
                    align-items: baseline;
                    gap: 10px;
                    cursor: pointer;
                    font-size: 20px;
                    font-weight: bold;
                }
                
                .nav-logo .go {
                    color: #003B5C;
                }
                
                .nav-logo .north-east {
                    color: #E4003B;
                }
                
                .nav-system-badge {
                    font-size: 12px;
                    color: #6b7280;
                    font-weight: normal;
                    padding-left: 10px;
                    border-left: 2px solid #e5e7eb;
                    margin-left: 5px;
                }
                
                .nav-dashboard-switcher {
                    display: flex;
                    gap: 8px;
                }
                
                .nav-btn {
                    padding: 8px 16px;
                    background: white;
                    border: 1px solid #e5e7eb;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 13px;
                    color: #4b5563;
                    transition: all 0.2s;
                    white-space: nowrap;
                }
                
                .nav-btn:hover {
                    background: #003B5C;
                    color: white;
                    transform: translateY(-1px);
                }
                
                .nav-btn.active {
                    background: #003B5C;
                    color: white;
                    border-color: #003B5C;
                }
                
                .nav-quick-actions {
                    display: flex;
                    gap: 10px;
                }
                
                .nav-action-btn {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 13px;
                    font-weight: 600;
                    transition: all 0.2s;
                }
                
                .nav-action-btn.emergency {
                    background: #ef4444;
                    color: white;
                }
                
                .nav-action-btn:not(.emergency) {
                    background: #f3f4f6;
                    color: #1f2937;
                }
                
                .nav-action-btn:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                }
                
                /* Floating Quick Panel */
                .floating-quick-panel {
                    position: fixed;
                    right: -300px;
                    top: 80px;
                    width: 280px;
                    background: white;
                    border-radius: 12px 0 0 12px;
                    box-shadow: -4px 0 20px rgba(0,0,0,0.15);
                    transition: right 0.3s ease;
                    z-index: 999;
                }
                
                .floating-quick-panel.active {
                    right: 0;
                }
                
                .panel-toggle-btn {
                    position: absolute;
                    left: -40px;
                    top: 20px;
                    width: 40px;
                    height: 40px;
                    background: #003B5C;
                    color: white;
                    border: none;
                    border-radius: 8px 0 0 8px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 20px;
                }
                
                .quick-panel-content {
                    padding: 20px;
                }
                
                .quick-panel-content h4 {
                    font-size: 14px;
                    text-transform: uppercase;
                    color: #6b7280;
                    margin-bottom: 15px;
                    font-weight: 600;
                }
                
                .quick-panel-section {
                    margin-bottom: 20px;
                }
                
                .quick-btn {
                    width: 100%;
                    padding: 12px;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 600;
                    margin-bottom: 10px;
                    transition: all 0.2s;
                }
                
                .quick-btn.emergency {
                    background: #ef4444;
                    color: white;
                }
                
                .quick-btn.primary {
                    background: #003B5C;
                    color: white;
                }
                
                .quick-btn:hover {
                    transform: translateX(-2px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                }
                
                .quick-panel-links {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    margin-bottom: 20px;
                }
                
                .quick-link {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 10px;
                    background: #f9fafb;
                    border-radius: 6px;
                    text-decoration: none;
                    color: #1f2937;
                    font-size: 13px;
                    transition: all 0.2s;
                }
                
                .quick-link:hover {
                    background: #00A9CE;
                    color: white;
                }
                
                .quick-link.active {
                    background: #003B5C;
                    color: white;
                }
                
                .live-badge {
                    background: #ef4444;
                    color: white;
                    padding: 2px 8px;
                    border-radius: 10px;
                    font-size: 10px;
                    font-weight: 600;
                    animation: pulse 2s infinite;
                }
                
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                }
                
                .quick-panel-info {
                    display: flex;
                    justify-content: space-around;
                    padding-top: 15px;
                    border-top: 1px solid #e5e7eb;
                }
                
                .info-item {
                    text-align: center;
                }
                
                .info-label {
                    font-size: 11px;
                    color: #6b7280;
                    text-transform: uppercase;
                    display: block;
                }
                
                .info-value {
                    font-size: 20px;
                    font-weight: bold;
                    color: #003B5C;
                }
                
                /* Mobile Bottom Navigation */
                .mobile-bottom-nav {
                    display: none;
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    background: white;
                    box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
                    padding: 8px 0;
                    z-index: 999;
                    justify-content: space-around;
                    align-items: center;
                }
                
                .mobile-nav-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 8px;
                    text-decoration: none;
                    color: #6b7280;
                    font-size: 11px;
                    border: none;
                    background: none;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .mobile-nav-item:hover {
                    color: #003B5C;
                }
                
                .mobile-icon {
                    font-size: 20px;
                    margin-bottom: 4px;
                }
                
                .mobile-emergency {
                    background: #ef4444;
                    color: white;
                    border-radius: 50%;
                    width: 56px;
                    height: 56px;
                    margin: -20px 0 0;
                }
                
                .mobile-icon-large {
                    font-size: 24px;
                }
                
                /* Responsive adjustments */
                @media (max-width: 768px) {
                    .shared-nav-container {
                        padding: 10px;
                    }
                    
                    .shared-nav-header {
                        flex-direction: column;
                        gap: 10px;
                    }
                    
                    .nav-dashboard-switcher {
                        display: none;
                    }
                    
                    .nav-quick-actions {
                        display: none;
                    }
                    
                    .mobile-bottom-nav {
                        display: flex;
                    }
                    
                    body {
                        padding-bottom: 80px;
                        padding-top: 60px;
                    }
                }
                
                /* Adjust main content to account for fixed nav */
                body {
                    padding-top: 70px;
                }
            </style>
        `;
        document.head.insertAdjacentHTML('beforeend', styleHTML);
    }
}

// Initialize navigation functionality
function initializeNavigation() {
    // Update active/today counts
    updateNavigationStats();
    
    // Refresh stats every 10 seconds
    setInterval(updateNavigationStats, 10000);
}

// Navigate to a specific dashboard
function navigateToDashboard(dashboardKey) {
    const dashboard = dashboardConfig[dashboardKey];
    if (dashboard) {
        // Use relative path since we're in the dashboard folder
        window.location.href = dashboard.path;
    }
}

// Open breakdown guide
function openBreakdownGuide() {
    // Always use relative path from dashboard folder
    window.location.href = '../breakdown-guide/guide.html';
}

// Go to home page
function goHome() {
    // Always use relative path from dashboard folder
    window.location.href = '../index.html';
}

// Toggle quick panel
function toggleQuickPanel() {
    const panel = document.getElementById('floatingQuickPanel');
    if (panel) {
        panel.classList.toggle('active');
    }
}

// Highlight current dashboard in navigation
function highlightCurrentDashboard() {
    const currentPath = window.location.pathname;
    
    // Find which dashboard we're on
    Object.entries(dashboardConfig).forEach(([key, config]) => {
        if (currentPath.includes(config.path) || currentPath.includes(config.path.split('/').pop())) {
            // Highlight in main nav
            const navBtn = document.querySelector(`[data-dashboard="${key}"]`);
            if (navBtn) {
                navBtn.classList.add('active');
            }
            
            // Highlight in quick panel
            const quickLink = document.querySelector(`.quick-link[data-dashboard="${key}"]`);
            if (quickLink) {
                quickLink.classList.add('active');
            }
        }
    });
}

// Update navigation statistics
async function updateNavigationStats() {
    try {
        const BACKEND_URL = window.location.hostname === 'localhost' 
            ? 'http://localhost:3001' 
            : 'https://go-barry.onrender.com';
            
        const response = await fetch(`${BACKEND_URL}/api/breakdowns/stats`);
        
        if (response.ok) {
            const stats = await response.json();
            
            // Update quick panel stats
            const activeElement = document.getElementById('quickPanelActive');
            const todayElement = document.getElementById('quickPanelToday');
            
            if (activeElement) activeElement.textContent = stats.active || 0;
            if (todayElement) todayElement.textContent = stats.today || 0;
        }
    } catch (error) {
        console.log('Navigation stats unavailable:', error);
    }
}

// Setup keyboard shortcuts
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Alt + Number for quick dashboard access
        if (e.altKey && !e.ctrlKey && !e.shiftKey) {
            switch(e.key) {
                case '1': openBreakdownGuide(); break;
                case '2': navigateToDashboard('sdc'); break;
                case '3': navigateToDashboard('breakdown'); break;
                case '4': navigateToDashboard('engineering'); break;
                case '5': navigateToDashboard('management'); break;
                case 'h': goHome(); break;
                case 'q': toggleQuickPanel(); break;
            }
        }
        
        // Escape to close quick panel
        if (e.key === 'Escape') {
            const panel = document.getElementById('floatingQuickPanel');
            if (panel && panel.classList.contains('active')) {
                panel.classList.remove('active');
            }
        }
    });
}

// Export functions for global use
window.navigateToDashboard = navigateToDashboard;
window.openBreakdownGuide = openBreakdownGuide;
window.goHome = goHome;
window.toggleQuickPanel = toggleQuickPanel;

console.log('✅ Shared Navigation System Loaded - Use Alt+1-5 for quick navigation');
