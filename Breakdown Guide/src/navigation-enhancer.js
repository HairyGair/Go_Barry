/**
 * Go North East - Breakdown Guide
 * Enhanced Navigation System
 * Provides breadcrumbs, quick navigation, and step previews
 */

class NavigationEnhancer {
    constructor() {
        this.history = [];
        this.bookmarks = [];
        this.maxHistoryItems = 20;
    }

    /**
     * Initialize the navigation enhancement
     */
    init() {
        this.createNavigationBar();
        this.loadBookmarks();
        this.attachKeyboardShortcuts();
    }

    /**
     * Create the enhanced navigation bar
     */
    createNavigationBar() {
        // Check if nav bar already exists
        if (document.getElementById('enhancedNavBar')) return;

        const navBar = document.createElement('div');
        navBar.id = 'enhancedNavBar';
        navBar.className = 'enhanced-nav-bar';
        navBar.innerHTML = `
            <div class="nav-container">
                <div class="breadcrumb-section">
                    <nav id="breadcrumbNav" class="breadcrumb-nav" aria-label="Breadcrumb">
                        <ol class="breadcrumb-list">
                            <li class="breadcrumb-item">
                                <a href="#" onclick="navigationEnhancer.goHome()">
                                    <span class="breadcrumb-icon">🏠</span>
                                    Home
                                </a>
                            </li>
                        </ol>
                    </nav>
                </div>
                
                <div class="nav-actions">
                    <button class="nav-btn" id="navHistoryBtn" title="History (Alt+H)">
                        <span class="nav-icon">🕒</span>
                        <span class="nav-label">History</span>
                    </button>
                    <button class="nav-btn" id="navBookmarkBtn" title="Bookmarks (Alt+B)">
                        <span class="nav-icon">📌</span>
                        <span class="nav-label">Bookmarks</span>
                    </button>
                    <button class="nav-btn" id="navSearchBtn" title="Quick Search (/)">
                        <span class="nav-icon">🔍</span>
                        <span class="nav-label">Search</span>
                    </button>
                    <button class="nav-btn" id="navHelpBtn" title="Help (F1)">
                        <span class="nav-icon">❓</span>
                        <span class="nav-label">Help</span>
                    </button>
                </div>
            </div>
        `;

        // Insert after header
        const header = document.querySelector('.header');
        if (header) {
            header.insertAdjacentElement('afterend', navBar);
        }

        // Attach event listeners
        this.attachNavListeners();
    }

    /**
     * Update breadcrumb navigation
     */
    updateBreadcrumb(path) {
        const breadcrumbNav = document.getElementById('breadcrumbNav');
        if (!breadcrumbNav) return;

        const breadcrumbList = breadcrumbNav.querySelector('.breadcrumb-list');
        breadcrumbList.innerHTML = '';

        // Always start with home
        const homeItem = document.createElement('li');
        homeItem.className = 'breadcrumb-item';
        homeItem.innerHTML = `
            <a href="#" onclick="navigationEnhancer.goHome()">
                <span class="breadcrumb-icon">🏠</span>
                Home
            </a>
        `;
        breadcrumbList.appendChild(homeItem);

        // Add path items
        path.forEach((item, index) => {
            const li = document.createElement('li');
            li.className = 'breadcrumb-item';
            
            if (index === path.length - 1) {
                // Current page (not clickable)
                li.classList.add('active');
                li.innerHTML = `<span>${item.label}</span>`;
            } else {
                // Clickable breadcrumb
                li.innerHTML = `
                    <a href="#" onclick="navigationEnhancer.navigateTo('${item.screen}', '${item.id}')">
                        ${item.label}
                    </a>
                `;
            }
            
            breadcrumbList.appendChild(li);
        });

        // Add to history
        this.addToHistory({
            path: path,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Show navigation history
     */
    showHistory() {
        const modal = document.createElement('div');
        modal.className = 'nav-modal active';
        modal.innerHTML = `
            <div class="nav-modal-content">
                <div class="nav-modal-header">
                    <h3>Navigation History</h3>
                    <button class="nav-modal-close" onclick="this.closest('.nav-modal').remove()">×</button>
                </div>
                <div class="nav-modal-body">
                    ${this.renderHistory()}
                </div>
                <div class="nav-modal-footer">
                    <button class="btn btn-secondary" onclick="navigationEnhancer.clearHistory(); this.closest('.nav-modal').remove();">
                        Clear History
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    /**
     * Render history items
     */
    renderHistory() {
        if (this.history.length === 0) {
            return '<p class="nav-empty">No navigation history</p>';
        }

        return `
            <div class="nav-history-list">
                ${this.history.slice().reverse().map((item, index) => `
                    <div class="nav-history-item" onclick="navigationEnhancer.navigateToHistory(${this.history.length - 1 - index})">
                        <div class="history-path">
                            ${item.path.map(p => p.label).join(' › ')}
                        </div>
                        <div class="history-time">
                            ${this.formatTime(new Date(item.timestamp))}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Show bookmarks
     */
    showBookmarks() {
        const modal = document.createElement('div');
        modal.className = 'nav-modal active';
        modal.innerHTML = `
            <div class="nav-modal-content">
                <div class="nav-modal-header">
                    <h3>Bookmarked Steps</h3>
                    <button class="nav-modal-close" onclick="this.closest('.nav-modal').remove()">×</button>
                </div>
                <div class="nav-modal-body">
                    ${this.renderBookmarks()}
                </div>
                <div class="nav-modal-footer">
                    <button class="btn btn-primary" onclick="navigationEnhancer.addCurrentBookmark(); this.closest('.nav-modal').remove();">
                        Add Current Step
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    /**
     * Render bookmarks
     */
    renderBookmarks() {
        if (this.bookmarks.length === 0) {
            return '<p class="nav-empty">No bookmarks saved</p>';
        }

        return `
            <div class="nav-bookmark-list">
                ${this.bookmarks.map((bookmark, index) => `
                    <div class="nav-bookmark-item">
                        <div class="bookmark-info" onclick="navigationEnhancer.navigateToBookmark(${index})">
                            <div class="bookmark-title">${bookmark.title}</div>
                            <div class="bookmark-path">${bookmark.path}</div>
                        </div>
                        <button class="bookmark-remove" onclick="event.stopPropagation(); navigationEnhancer.removeBookmark(${index})">
                            ×
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Show quick search
     */
    showQuickSearch() {
        const modal = document.createElement('div');
        modal.className = 'nav-modal active quick-search-modal';
        modal.innerHTML = `
            <div class="nav-modal-content">
                <div class="quick-search-container">
                    <input 
                        type="text" 
                        id="quickSearchInput" 
                        class="quick-search-input"
                        placeholder="Search issues, steps, or commands..."
                        autocomplete="off"
                    >
                    <div class="quick-search-results" id="quickSearchResults"></div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        const input = document.getElementById('quickSearchInput');
        input.focus();

        // Search handler
        input.addEventListener('input', (e) => {
            this.performQuickSearch(e.target.value);
        });

        // Keyboard navigation
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                modal.remove();
            } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                this.navigateSearchResults(e.key === 'ArrowDown' ? 1 : -1);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                this.selectSearchResult();
            }
        });

        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    /**
     * Perform quick search
     */
    performQuickSearch(query) {
        const results = document.getElementById('quickSearchResults');
        if (!results) return;

        if (query.length < 2) {
            results.innerHTML = '';
            return;
        }

        const searchResults = this.searchContent(query);
        
        if (searchResults.length === 0) {
            results.innerHTML = '<div class="search-no-results">No results found</div>';
            return;
        }

        results.innerHTML = searchResults.map((result, index) => `
            <div class="search-result-item ${index === 0 ? 'selected' : ''}" 
                 data-index="${index}"
                 data-type="${result.type}"
                 data-action="${result.action}">
                <span class="result-icon">${result.icon}</span>
                <div class="result-content">
                    <div class="result-title">${this.highlightMatch(result.title, query)}</div>
                    ${result.subtitle ? `<div class="result-subtitle">${result.subtitle}</div>` : ''}
                </div>
                <span class="result-shortcut">${result.shortcut || ''}</span>
            </div>
        `).join('');

        // Add click handlers
        results.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', () => {
                this.executeSearchAction(
                    item.dataset.type,
                    item.dataset.action
                );
                document.querySelector('.quick-search-modal').remove();
            });
        });
    }

    /**
     * Search through content
     */
    searchContent(query) {
        const results = [];
        const q = query.toLowerCase();

        // Search categories
        issueCategories.forEach(category => {
            if (category.name.toLowerCase().includes(q) || 
                category.description.toLowerCase().includes(q)) {
                results.push({
                    type: 'category',
                    action: category.id,
                    title: category.name,
                    subtitle: category.description,
                    icon: category.icon
                });
            }
        });

        // Search commands
        const commands = [
            { title: 'Home', action: 'home', icon: '🏠', shortcut: 'Alt+Home' },
            { title: 'Start Diagnosis', action: 'start', icon: '🔧', shortcut: 'Alt+S' },
            { title: 'Recent Sessions', action: 'recent', icon: '📊', shortcut: 'Alt+R' },
            { title: 'Emergency Stops', action: 'emergency', icon: '🚨', shortcut: 'Alt+E' },
            { title: 'Help', action: 'help', icon: '❓', shortcut: 'F1' }
        ];

        commands.forEach(cmd => {
            if (cmd.title.toLowerCase().includes(q)) {
                results.push({
                    type: 'command',
                    ...cmd
                });
            }
        });

        return results.slice(0, 10); // Limit to 10 results
    }

    /**
     * Highlight search matches
     */
    highlightMatch(text, query) {
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    /**
     * Navigate search results with keyboard
     */
    navigateSearchResults(direction) {
        const results = document.querySelectorAll('.search-result-item');
        const current = document.querySelector('.search-result-item.selected');
        
        if (!current || results.length === 0) return;
        
        const currentIndex = parseInt(current.dataset.index);
        const newIndex = Math.max(0, Math.min(results.length - 1, currentIndex + direction));
        
        current.classList.remove('selected');
        results[newIndex].classList.add('selected');
        results[newIndex].scrollIntoView({ block: 'nearest' });
    }

    /**
     * Select current search result
     */
    selectSearchResult() {
        const selected = document.querySelector('.search-result-item.selected');
        if (selected) {
            selected.click();
        }
    }

    /**
     * Execute search action
     */
    executeSearchAction(type, action) {
        switch (type) {
            case 'category':
                showScreen('category');
                setTimeout(() => {
                    const categoryCard = document.querySelector(`[data-category-id="${action}"]`);
                    if (categoryCard) categoryCard.click();
                }, 100);
                break;
            
            case 'command':
                switch (action) {
                    case 'home':
                        showScreen('welcome');
                        break;
                    case 'start':
                        showScreen('category');
                        break;
                    case 'recent':
                        showRecentLogs();
                        break;
                    case 'emergency':
                        showModal('emergency');
                        break;
                    case 'help':
                        showHelp();
                        break;
                }
                break;
        }
    }

    /**
     * Attach navigation listeners
     */
    attachNavListeners() {
        document.getElementById('navHistoryBtn')?.addEventListener('click', () => this.showHistory());
        document.getElementById('navBookmarkBtn')?.addEventListener('click', () => this.showBookmarks());
        document.getElementById('navSearchBtn')?.addEventListener('click', () => this.showQuickSearch());
        document.getElementById('navHelpBtn')?.addEventListener('click', () => showHelp());
    }

    /**
     * Attach keyboard shortcuts
     */
    attachKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Quick search
            if (e.key === '/' && !e.ctrlKey && !e.altKey && !e.metaKey) {
                const activeElement = document.activeElement;
                if (activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                    this.showQuickSearch();
                }
            }
            
            // Alt shortcuts
            if (e.altKey) {
                switch (e.key.toLowerCase()) {
                    case 'h':
                        e.preventDefault();
                        this.showHistory();
                        break;
                    case 'b':
                        e.preventDefault();
                        this.showBookmarks();
                        break;
                    case 's':
                        e.preventDefault();
                        showScreen('category');
                        break;
                    case 'r':
                        e.preventDefault();
                        showRecentLogs();
                        break;
                    case 'e':
                        e.preventDefault();
                        showModal('emergency');
                        break;
                    case 'home':
                        e.preventDefault();
                        showScreen('welcome');
                        break;
                }
            }
            
            // F1 for help
            if (e.key === 'F1') {
                e.preventDefault();
                showHelp();
            }
        });
    }

    // Navigation methods
    goHome() {
        showScreen('welcome');
    }

    navigateTo(screen, id) {
        showScreen(screen);
        // Additional navigation logic based on screen and id
    }

    navigateToHistory(index) {
        const item = this.history[index];
        if (item && item.path.length > 0) {
            const lastPath = item.path[item.path.length - 1];
            this.navigateTo(lastPath.screen, lastPath.id);
        }
    }

    navigateToBookmark(index) {
        const bookmark = this.bookmarks[index];
        if (bookmark) {
            // Navigate to bookmarked location
            console.log('Navigate to bookmark:', bookmark);
        }
    }

    // History management
    addToHistory(item) {
        this.history.push(item);
        if (this.history.length > this.maxHistoryItems) {
            this.history.shift();
        }
    }

    clearHistory() {
        this.history = [];
    }

    // Bookmark management
    addCurrentBookmark() {
        const currentPath = this.getCurrentPath();
        if (currentPath) {
            const bookmark = {
                title: currentPath[currentPath.length - 1].label,
                path: currentPath.map(p => p.label).join(' › '),
                data: currentPath,
                timestamp: new Date().toISOString()
            };
            
            this.bookmarks.push(bookmark);
            this.saveBookmarks();
        }
    }

    removeBookmark(index) {
        this.bookmarks.splice(index, 1);
        this.saveBookmarks();
        this.showBookmarks(); // Refresh the view
    }

    loadBookmarks() {
        try {
            const saved = localStorage.getItem(STORAGE_PREFIX + 'bookmarks');
            if (saved) {
                this.bookmarks = JSON.parse(saved);
            }
        } catch (error) {
            console.error('Failed to load bookmarks:', error);
        }
    }

    saveBookmarks() {
        try {
            localStorage.setItem(STORAGE_PREFIX + 'bookmarks', JSON.stringify(this.bookmarks));
        } catch (error) {
            console.error('Failed to save bookmarks:', error);
        }
    }

    // Utility methods
    getCurrentPath() {
        // This should be implemented based on current application state
        // For now, return a sample path
        return [
            { label: 'Categories', screen: 'category', id: null },
            { label: 'Current Step', screen: 'wizard', id: 'current' }
        ];
    }

    formatTime(date) {
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }
}

// Create global instance
const navigationEnhancer = new NavigationEnhancer();

// Export for use in main app
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NavigationEnhancer;
}