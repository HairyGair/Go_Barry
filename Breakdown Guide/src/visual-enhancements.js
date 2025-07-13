/**
 * Go North East - Breakdown Guide
 * Visual Enhancements
 * Animations, transitions, and polish
 */

class VisualEnhancements {
    constructor() {
        this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.theme = 'light';
        this.animations = !this.reducedMotion;
    }

    /**
     * Initialize visual enhancements
     */
    init() {
        this.addLoadingStates();
        this.addSuccessAnimations();
        this.addPageTransitions();
        this.addInteractiveElements();
        this.initializeTheme();
        this.addAccessibilityFeatures();
    }

    /**
     * Add loading states to buttons and actions
     */
    addLoadingStates() {
        // Override button clicks to show loading state
        document.addEventListener('click', (e) => {
            const button = e.target.closest('button');
            if (button && button.dataset.loading !== 'false') {
                this.showButtonLoading(button);
            }
        });
    }

    /**
     * Show loading state on button
     */
    showButtonLoading(button) {
        if (button.disabled) return;
        
        const originalContent = button.innerHTML;
        const originalWidth = button.offsetWidth;
        
        button.style.minWidth = originalWidth + 'px';
        button.dataset.originalContent = originalContent;
        button.disabled = true;
        button.classList.add('loading');
        
        button.innerHTML = '<span class="spinner-small"></span> Loading...';
        
        // Auto-restore after 3 seconds (failsafe)
        setTimeout(() => {
            this.hideButtonLoading(button);
        }, 3000);
    }

    /**
     * Hide loading state on button
     */
    hideButtonLoading(button) {
        if (!button.classList.contains('loading')) return;
        
        button.classList.remove('loading');
        button.disabled = false;
        button.innerHTML = button.dataset.originalContent || button.innerHTML;
        button.style.minWidth = '';
        delete button.dataset.originalContent;
    }

    /**
     * Add success animations
     */
    addSuccessAnimations() {
        // Create success checkmark animation element
        const successTemplate = `
            <div class="success-animation" id="successAnimation">
                <div class="success-circle">
                    <svg viewBox="0 0 52 52">
                        <circle cx="26" cy="26" r="25" fill="none" class="success-circle-outline"/>
                        <path fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" class="success-checkmark"/>
                    </svg>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', successTemplate);
    }

    /**
     * Show success animation
     */
    showSuccess(message = 'Success!', duration = 2000) {
        const animation = document.getElementById('successAnimation');
        const messageEl = animation.querySelector('.success-message') || 
                         document.createElement('div');
        
        messageEl.className = 'success-message';
        messageEl.textContent = message;
        
        if (!animation.contains(messageEl)) {
            animation.appendChild(messageEl);
        }
        
        animation.classList.add('show');
        
        setTimeout(() => {
            animation.classList.remove('show');
        }, duration);
    }

    /**
     * Add page transitions
     */
    addPageTransitions() {
        if (this.reducedMotion) return;
        
        // Override showScreen to add transitions
        const originalShowScreen = window.showScreen;
        window.showScreen = (screenName) => {
            this.transitionToScreen(screenName, originalShowScreen);
        };
    }

    /**
     * Transition between screens
     */
    transitionToScreen(screenName, originalFunction) {
        const currentScreen = document.querySelector('.screen.active');
        const newScreen = document.getElementById(screenName + 'Screen');
        
        if (!currentScreen || !newScreen || currentScreen === newScreen) {
            originalFunction(screenName);
            return;
        }
        
        // Add transition classes
        currentScreen.classList.add('transitioning-out');
        newScreen.classList.add('transitioning-in');
        
        setTimeout(() => {
            originalFunction(screenName);
            
            currentScreen.classList.remove('transitioning-out');
            newScreen.classList.remove('transitioning-in');
            
            // Scroll to top of new screen
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 300);
    }

    /**
     * Add interactive elements
     */
    addInteractiveElements() {
        // Add ripple effect to buttons
        document.addEventListener('click', (e) => {
            const button = e.target.closest('button, .action-card');
            if (button && !this.reducedMotion) {
                this.createRipple(e, button);
            }
        });
        
        // Add hover effects to cards
        this.addCardHoverEffects();
        
        // Add focus indicators
        this.enhanceFocusIndicators();
    }

    /**
     * Create ripple effect
     */
    createRipple(event, element) {
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        
        element.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
    }

    /**
     * Add card hover effects
     */
    addCardHoverEffects() {
        const cards = document.querySelectorAll('.action-card, .category-card, .session-card');
        
        cards.forEach(card => {
            card.addEventListener('mouseenter', (e) => {
                if (!this.reducedMotion) {
                    card.style.transform = 'translateY(-2px)';
                }
            });
            
            card.addEventListener('mouseleave', (e) => {
                card.style.transform = '';
            });
        });
    }

    /**
     * Enhance focus indicators
     */
    enhanceFocusIndicators() {
        // Add custom focus class on tab navigation
        let mouseDown = false;
        
        document.addEventListener('mousedown', () => mouseDown = true);
        document.addEventListener('mouseup', () => mouseDown = false);
        
        document.addEventListener('focusin', (e) => {
            if (!mouseDown) {
                e.target.classList.add('keyboard-focus');
            }
        });
        
        document.addEventListener('focusout', (e) => {
            e.target.classList.remove('keyboard-focus');
        });
    }

    /**
     * Initialize theme system
     */
    initializeTheme() {
        // Check for saved theme preference
        const savedTheme = localStorage.getItem(STORAGE_PREFIX + 'theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        this.theme = savedTheme || (prefersDark ? 'dark' : 'light');
        this.applyTheme(this.theme);
        
        // Add theme toggle button
        this.addThemeToggle();
    }

    /**
     * Add theme toggle button
     */
    addThemeToggle() {
        const themeToggle = document.createElement('button');
        themeToggle.id = 'themeToggle';
        themeToggle.className = 'theme-toggle';
        themeToggle.setAttribute('aria-label', 'Toggle theme');
        themeToggle.innerHTML = this.theme === 'dark' ? '☀️' : '🌙';
        
        themeToggle.addEventListener('click', () => {
            this.toggleTheme();
        });
        
        document.body.appendChild(themeToggle);
    }

    /**
     * Toggle theme
     */
    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        this.applyTheme(this.theme);
        
        const toggle = document.getElementById('themeToggle');
        if (toggle) {
            toggle.innerHTML = this.theme === 'dark' ? '☀️' : '🌙';
        }
        
        // Save preference
        localStorage.setItem(STORAGE_PREFIX + 'theme', this.theme);
    }

    /**
     * Apply theme
     */
    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
    }

    /**
     * Add accessibility features
     */
    addAccessibilityFeatures() {
        // Skip to main content link
        this.addSkipLink();
        
        // High contrast mode
        this.addHighContrastToggle();
        
        // Font size controls
        this.addFontSizeControls();
        
        // Announce screen changes
        this.addScreenAnnouncements();
    }

    /**
     * Add skip to main content link
     */
    addSkipLink() {
        const skipLink = document.createElement('a');
        skipLink.href = '#main-content';
        skipLink.className = 'skip-link';
        skipLink.textContent = 'Skip to main content';
        
        document.body.insertAdjacentElement('afterbegin', skipLink);
        
        // Ensure main content has ID
        const mainContent = document.querySelector('.main-content');
        if (mainContent && !mainContent.id) {
            mainContent.id = 'main-content';
        }
    }

    /**
     * Add high contrast toggle
     */
    addHighContrastToggle() {
        const preferences = sessionManager?.getPreferences() || {};
        
        if (preferences.highContrast) {
            document.documentElement.classList.add('high-contrast');
        }
    }

    /**
     * Add font size controls
     */
    addFontSizeControls() {
        const controls = document.createElement('div');
        controls.className = 'font-size-controls';
        controls.innerHTML = `
            <button class="font-size-btn" onclick="visualEnhancements.changeFontSize(-1)" aria-label="Decrease font size">
                A-
            </button>
            <button class="font-size-btn" onclick="visualEnhancements.changeFontSize(0)" aria-label="Reset font size">
                A
            </button>
            <button class="font-size-btn" onclick="visualEnhancements.changeFontSize(1)" aria-label="Increase font size">
                A+
            </button>
        `;
        
        // Add to header
        const headerActions = document.querySelector('.header-actions');
        if (headerActions) {
            headerActions.insertAdjacentElement('afterbegin', controls);
        }
    }

    /**
     * Change font size
     */
    changeFontSize(delta) {
        const root = document.documentElement;
        const currentSize = parseFloat(getComputedStyle(root).fontSize);
        
        if (delta === 0) {
            root.style.fontSize = ''; // Reset
        } else {
            const newSize = Math.max(12, Math.min(24, currentSize + delta));
            root.style.fontSize = newSize + 'px';
        }
        
        // Save preference
        if (sessionManager) {
            sessionManager.savePreferences({
                fontSize: delta === 0 ? 'default' : root.style.fontSize
            });
        }
    }

    /**
     * Add screen reader announcements
     */
    addScreenAnnouncements() {
        // Create announcement area
        const announcer = document.createElement('div');
        announcer.id = 'screenAnnouncer';
        announcer.className = 'sr-only';
        announcer.setAttribute('aria-live', 'polite');
        announcer.setAttribute('aria-atomic', 'true');
        
        document.body.appendChild(announcer);
        
        // Override showScreen to announce changes
        const originalShowScreen = window.showScreen;
        window.showScreen = (screenName) => {
            originalShowScreen(screenName);
            
            // Announce screen change
            const screenTitles = {
                'welcome': 'Welcome screen',
                'category': 'Select issue category',
                'wizard': 'Diagnostic wizard'
            };
            
            const title = screenTitles[screenName] || screenName;
            this.announce(`Navigated to ${title}`);
        };
    }

    /**
     * Make screen reader announcement
     */
    announce(message) {
        const announcer = document.getElementById('screenAnnouncer');
        if (announcer) {
            announcer.textContent = message;
            
            // Clear after announcement
            setTimeout(() => {
                announcer.textContent = '';
            }, 1000);
        }
    }

    /**
     * Show tooltip
     */
    showTooltip(element, text, position = 'top') {
        const tooltip = document.createElement('div');
        tooltip.className = `tooltip tooltip-${position}`;
        tooltip.textContent = text;
        
        document.body.appendChild(tooltip);
        
        const rect = element.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        
        let top, left;
        
        switch (position) {
            case 'top':
                top = rect.top - tooltipRect.height - 8;
                left = rect.left + (rect.width - tooltipRect.width) / 2;
                break;
            case 'bottom':
                top = rect.bottom + 8;
                left = rect.left + (rect.width - tooltipRect.width) / 2;
                break;
            case 'left':
                top = rect.top + (rect.height - tooltipRect.height) / 2;
                left = rect.left - tooltipRect.width - 8;
                break;
            case 'right':
                top = rect.top + (rect.height - tooltipRect.height) / 2;
                left = rect.right + 8;
                break;
        }
        
        tooltip.style.top = top + 'px';
        tooltip.style.left = left + 'px';
        
        // Show with animation
        requestAnimationFrame(() => {
            tooltip.classList.add('show');
        });
        
        // Auto-hide after delay
        setTimeout(() => {
            tooltip.classList.remove('show');
            setTimeout(() => tooltip.remove(), 200);
        }, 3000);
        
        return tooltip;
    }
}

// Create global instance
const visualEnhancements = new VisualEnhancements();

// Export for use in main app
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VisualEnhancements;
}