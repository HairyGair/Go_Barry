// Go North East - Phase 3 Analytics Navigation Integration
// Seamless integration with breakdown guide and dashboards

const NavigationIntegration = (() => {
    'use strict';

    // Navigation configuration
    const config = {
        baseUrl: window.location.origin,
        apiEndpoint: '/api/phase3-analytics',
        dashboards: {
            executive: '/phase3-analytics/executive-dashboard.html',
            operations: '/operations-centre',
            breakdown: '/breakdown-guide',
            engineering: '/engineering-response'
        },
        refreshInterval: 30000 // 30 seconds
    };

    // Navigation state management
    let navigationState = {
        currentView: 'executive',
        previousView: null,
        breadcrumbs: [],
        filters: {},
        timeRange: 'today'
    };

    // Initialize navigation system
    function initialize() {
        setupNavigationMenu();
        setupBreadcrumbs();
        setupQuickLinks();
        setupKeyboardShortcuts();
        restoreNavigationState();
        console.log('✅ Phase 3 Navigation Integration initialized');
    }

    // Setup main navigation menu
    function setupNavigationMenu() {
        const navHTML = `
            <nav class="phase3-navigation bg-gray-900 text-white p-4 shadow-lg">
                <div class="container mx-auto flex justify-between items-center">
                    <div class="flex items-center space-x-6">
                        <h1 class="text-xl font-bold">
                            <span class="text-red-500">Go North East</span> Analytics
                        </h1>
                        <div class="flex space-x-4">
                            <button onclick="NavigationIntegration.navigate('executive')" 
                                    class="nav-btn px-4 py-2 rounded hover:bg-gray-700 transition">
                                📊 Executive Dashboard
                            </button>
                            <button onclick="NavigationIntegration.navigate('predictive')" 
                                    class="nav-btn px-4 py-2 rounded hover:bg-gray-700 transition">
                                🔮 Predictive Analytics
                            </button>
                            <button onclick="NavigationIntegration.navigate('reports')" 
                                    class="nav-btn px-4 py-2 rounded hover:bg-gray-700 transition">
                                📈 Reports
                            </button>
                            <button onclick="NavigationIntegration.navigate('breakdown')" 
                                    class="nav-btn px-4 py-2 rounded hover:bg-gray-700 transition">
                                🚌 Breakdown Guide
                            </button>
                        </div>
                    </div>
                    <div class="flex items-center space-x-4">
                        <span class="text-sm" id="last-update">Last update: --:--</span>
                        <button onclick="NavigationIntegration.refresh()" 
                                class="px-3 py-1 bg-blue-600 rounded hover:bg-blue-700">
                            🔄 Refresh
                        </button>
                    </div>
                </div>
            </nav>
        `;

        // Insert navigation if not exists
        if (!document.querySelector('.phase3-navigation')) {
            document.body.insertAdjacentHTML('afterbegin', navHTML);
        }
    }

    // Setup breadcrumb navigation
    function setupBreadcrumbs() {
        const breadcrumbHTML = `
            <div class="breadcrumbs bg-gray-100 px-4 py-2 text-sm">
                <div class="container mx-auto" id="breadcrumb-container">
                    <span class="breadcrumb-item">Home</span>
                </div>
            </div>
        `;

        if (!document.querySelector('.breadcrumbs')) {
            const nav = document.querySelector('.phase3-navigation');
            if (nav) {
                nav.insertAdjacentHTML('afterend', breadcrumbHTML);
            }
        }
    }

    // Setup quick links for common actions
    function setupQuickLinks() {
        const quickLinks = [
            { icon: '🚨', label: 'Active Breakdowns', action: 'viewActiveBreakdowns' },
            { icon: '📊', label: 'Today\'s KPIs', action: 'viewTodayKPIs' },
            { icon: '⚠️', label: 'SLA Alerts', action: 'viewSLAAlerts' },
            { icon: '📈', label: 'Depot Performance', action: 'viewDepotPerformance' }
        ];

        const quickLinksHTML = `
            <div class="quick-links fixed right-4 top-20 bg-white shadow-lg rounded-lg p-3 z-50">
                <h3 class="text-sm font-bold mb-2">Quick Actions</h3>
                ${quickLinks.map(link => `
                    <button onclick="NavigationIntegration.quickAction('${link.action}')" 
                            class="block w-full text-left px-2 py-1 hover:bg-gray-100 rounded text-sm">
                        ${link.icon} ${link.label}
                    </button>
                `).join('')}
            </div>
        `;

        if (!document.querySelector('.quick-links')) {
            document.body.insertAdjacentHTML('beforeend', quickLinksHTML);
        }
    }

    // Setup keyboard shortcuts
    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + key combinations
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 'd': // Dashboard
                        e.preventDefault();
                        navigate('executive');
                        break;
                    case 'p': // Predictive
                        e.preventDefault();
                        navigate('predictive');
                        break;
                    case 'r': // Reports
                        e.preventDefault();
                        navigate('reports');
                        break;
                    case 'b': // Breakdown
                        e.preventDefault();
                        navigate('breakdown');
                        break;
                    case 'f': // Refresh
                        e.preventDefault();
                        refresh();
                        break;
                }
            }
        });
    }

    // Navigate to different sections
    function navigate(section) {
        // Update state
        navigationState.previousView = navigationState.currentView;
        navigationState.currentView = section;
        navigationState.breadcrumbs.push(section);

        // Handle navigation based on section
        switch(section) {
            case 'executive':
                loadExecutiveDashboard();
                break;
            case 'predictive':
                loadPredictiveAnalytics();
                break;
            case 'reports':
                loadReportingSuite();
                break;
            case 'breakdown':
                window.location.href = config.dashboards.breakdown;
                break;
            case 'operations':
                window.location.href = config.dashboards.operations;
                break;
            default:
                console.warn('Unknown navigation section:', section);
        }

        updateBreadcrumbs();
        saveNavigationState();
    }

    // Load executive dashboard view
    function loadExecutiveDashboard() {
        const container = document.getElementById('main-content') || document.body;
        container.innerHTML = '<div class="p-4">Loading Executive Dashboard...</div>';
        
        // Load executive dashboard content
        if (window.ExecutiveDashboard) {
            window.ExecutiveDashboard.initialize();
        } else {
            fetch(config.dashboards.executive)
                .then(response => response.text())
                .then(html => {
                    container.innerHTML = html;
                })
                .catch(error => {
                    console.error('Failed to load executive dashboard:', error);
                    container.innerHTML = '<div class="p-4 text-red-600">Failed to load dashboard</div>';
                });
        }
    }

    // Load predictive analytics view
    function loadPredictiveAnalytics() {
        const container = document.getElementById('main-content') || document.body;
        container.innerHTML = '<div class="p-4">Loading Predictive Analytics...</div>';
        
        // Load predictive analytics content
        if (window.PredictiveAnalyticsEngine) {
            window.PredictiveAnalyticsEngine.initialize();
        }
    }

    // Load reporting suite view
    function loadReportingSuite() {
        const container = document.getElementById('main-content') || document.body;
        container.innerHTML = '<div class="p-4">Loading Reporting Suite...</div>';
        
        // Load reporting suite content
        if (window.AutomatedReportingSuite) {
            window.AutomatedReportingSuite.initialize();
        }
    }

    // Handle quick actions
    function quickAction(action) {
        switch(action) {
            case 'viewActiveBreakdowns':
                navigate('breakdown');
                break;
            case 'viewTodayKPIs':
                navigate('executive');
                if (window.ExecutiveDashboard) {
                    window.ExecutiveDashboard.showKPIs();
                }
                break;
            case 'viewSLAAlerts':
                navigate('executive');
                if (window.ExecutiveDashboard) {
                    window.ExecutiveDashboard.showSLAAlerts();
                }
                break;
            case 'viewDepotPerformance':
                navigate('executive');
                if (window.ExecutiveDashboard) {
                    window.ExecutiveDashboard.showDepotPerformance();
                }
                break;
        }
    }

    // Update breadcrumbs display
    function updateBreadcrumbs() {
        const container = document.getElementById('breadcrumb-container');
        if (container) {
            const breadcrumbs = ['Home', ...navigationState.breadcrumbs.slice(-3)];
            container.innerHTML = breadcrumbs.map((crumb, index) => {
                const isLast = index === breadcrumbs.length - 1;
                return `
                    <span class="breadcrumb-item ${isLast ? 'font-bold' : ''}">
                        ${index > 0 ? ' / ' : ''}
                        ${isLast ? crumb : `<a href="#" onclick="NavigationIntegration.navigateToBreadcrumb(${index})">${crumb}</a>`}
                    </span>
                `;
            }).join('');
        }
    }

    // Navigate to breadcrumb
    function navigateToBreadcrumb(index) {
        if (index === 0) {
            navigate('executive');
        } else {
            const target = navigationState.breadcrumbs[index - 1];
            navigate(target);
        }
    }

    // Refresh current view
    function refresh() {
        const updateTime = new Date().toLocaleTimeString();
        document.getElementById('last-update').textContent = `Last update: ${updateTime}`;
        
        // Trigger refresh based on current view
        switch(navigationState.currentView) {
            case 'executive':
                if (window.ExecutiveDashboard) {
                    window.ExecutiveDashboard.refresh();
                }
                break;
            case 'predictive':
                if (window.PredictiveAnalyticsEngine) {
                    window.PredictiveAnalyticsEngine.refresh();
                }
                break;
            case 'reports':
                if (window.AutomatedReportingSuite) {
                    window.AutomatedReportingSuite.refresh();
                }
                break;
        }
    }

    // Save navigation state to localStorage
    function saveNavigationState() {
        localStorage.setItem('phase3_navigation_state', JSON.stringify(navigationState));
    }

    // Restore navigation state from localStorage
    function restoreNavigationState() {
        const saved = localStorage.getItem('phase3_navigation_state');
        if (saved) {
            try {
                navigationState = JSON.parse(saved);
            } catch (e) {
                console.error('Failed to restore navigation state:', e);
            }
        }
    }

    // Integration with other systems
    function integrateWithBreakdownGuide() {
        // Listen for breakdown events
        window.addEventListener('breakdownCreated', (event) => {
            const { breakdownId, severity } = event.detail;
            if (severity === 'STOP') {
                // Auto-navigate to executive dashboard for critical breakdowns
                navigate('executive');
                // Show alert
                showAlert(`Critical breakdown ${breakdownId} requires immediate attention`, 'error');
            }
        });
    }

    // Show alert notifications
    function showAlert(message, type = 'info') {
        const alertHTML = `
            <div class="alert alert-${type} fixed top-4 right-4 bg-white shadow-lg rounded-lg p-4 z-50">
                <div class="flex items-center">
                    <span class="mr-2">${type === 'error' ? '🚨' : '📢'}</span>
                    <span>${message}</span>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', alertHTML);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            const alert = document.querySelector('.alert');
            if (alert) {
                alert.remove();
            }
        }, 5000);
    }

    // Auto-refresh setup
    function setupAutoRefresh() {
        setInterval(() => {
            refresh();
        }, config.refreshInterval);
    }

    // Public API
    return {
        initialize,
        navigate,
        quickAction,
        navigateToBreadcrumb,
        refresh,
        showAlert,
        getState: () => navigationState,
        config
    };
})();

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        NavigationIntegration.initialize();
    });
} else {
    NavigationIntegration.initialize();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NavigationIntegration;
}