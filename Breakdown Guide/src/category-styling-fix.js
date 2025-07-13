/**
 * FINAL FIX - Category Buttons and Styling
 * This fixes the non-working buttons and improves the visual design
 */

console.log('🎨 Loading category styling and interaction fix...');

document.addEventListener('DOMContentLoaded', function() {
    console.log('🎨 Applying category styling and interaction fixes...');
    
    // Add enhanced CSS styles
    const styles = `
        <style>
        /* Enhanced Category Card Styles */
        .category-card {
            display: flex;
            align-items: center;
            padding: 20px;
            margin: 12px 0;
            background: white;
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
            position: relative;
            overflow: hidden;
        }
        
        .category-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
            border-color: #3b82f6;
        }
        
        .category-card.critical {
            border-color: #dc2626;
            background: linear-gradient(135deg, #fef2f2 0%, #ffffff 100%);
        }
        
        .category-card.critical:hover {
            border-color: #b91c1c;
            background: linear-gradient(135deg, #fee2e2 0%, #fef2f2 100%);
        }
        
        .category-card.high {
            border-color: #d97706;
            background: linear-gradient(135deg, #fffbeb 0%, #ffffff 100%);
        }
        
        .category-card.high:hover {
            border-color: #b45309;
            background: linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%);
        }
        
        .category-icon {
            font-size: 48px;
            margin-right: 20px;
            min-width: 60px;
            text-align: center;
            filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
        }
        
        .category-info {
            flex: 1;
            min-width: 0;
        }
        
        .category-title {
            font-size: 20px;
            font-weight: 700;
            color: #1f2937;
            margin: 0 0 8px 0;
            line-height: 1.3;
        }
        
        .category-description {
            font-size: 14px;
            color: #6b7280;
            margin: 0 0 12px 0;
            line-height: 1.4;
        }
        
        .priority-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .priority-badge.critical {
            background: #dc2626;
            color: white;
            box-shadow: 0 2px 4px rgba(220, 38, 38, 0.3);
        }
        
        .priority-badge.high {
            background: #d97706;
            color: white;
            box-shadow: 0 2px 4px rgba(217, 119, 6, 0.3);
        }
        
        .chevron {
            font-size: 24px;
            color: #9ca3af;
            margin-left: 16px;
            transition: all 0.3s ease;
        }
        
        .category-card:hover .chevron {
            color: #3b82f6;
            transform: translateX(4px);
        }
        
        .category-card.critical:hover .chevron {
            color: #dc2626;
        }
        
        .category-card.high:hover .chevron {
            color: #d97706;
        }
        
        /* Active state */
        .category-card:active {
            transform: translateY(0);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        /* Focus state for accessibility */
        .category-card:focus {
            outline: 3px solid #3b82f6;
            outline-offset: 2px;
        }
        
        /* Loading state */
        .category-card.loading {
            opacity: 0.7;
            pointer-events: none;
        }
        
        .category-card.loading::after {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
            animation: shimmer 1.5s infinite;
        }
        
        @keyframes shimmer {
            0% { left: -100%; }
            100% { left: 100%; }
        }
        
        /* Responsive design */
        @media (max-width: 768px) {
            .category-card {
                padding: 16px;
                margin: 8px 0;
            }
            
            .category-icon {
                font-size: 36px;
                margin-right: 16px;
                min-width: 50px;
            }
            
            .category-title {
                font-size: 18px;
            }
            
            .category-description {
                font-size: 13px;
            }
        }
        </style>
    `;
    
    // Add styles to head
    document.head.insertAdjacentHTML('beforeend', styles);
    
    // Enhanced createCategoryCard function with better styling and click handling
    window.createCategoryCard = function(category) {
        console.log('🎨 Creating enhanced category card for:', category.title);
        
        const card = document.createElement('div');
        card.className = 'category-card';
        card.setAttribute('tabindex', '0'); // Make keyboard accessible
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', `Start ${category.title} diagnostic`);
        
        // Add priority classes
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
        
        // Enhanced click handler with visual feedback
        const handleClick = function(e) {
            e.preventDefault();
            console.log('🎨 Category clicked:', category.id);
            
            // Add loading state
            card.classList.add('loading');
            
            // Visual feedback
            card.style.transform = 'scale(0.98)';
            
            setTimeout(() => {
                card.style.transform = '';
                startDiagnostic(category.id);
                
                // Remove loading state after a short delay
                setTimeout(() => {
                    card.classList.remove('loading');
                }, 500);
            }, 150);
        };
        
        // Add multiple event listeners for better accessibility
        card.addEventListener('click', handleClick);
        card.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleClick(e);
            }
        });
        
        // Add hover sound effect (optional)
        card.addEventListener('mouseenter', function() {
            // Could add subtle sound effect here if desired
            console.log('🎨 Hovering over:', category.title);
        });
        
        return card;
    };
    
    // Enhanced startDiagnostic function with better user feedback
    window.startDiagnostic = function(issueId) {
        console.log('🎨 Starting enhanced diagnostic for:', issueId);
        
        // Show loading indicator
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
        }
        
        // Simulate loading time for better UX
        setTimeout(() => {
            if (loadingOverlay) {
                loadingOverlay.style.display = 'none';
            }
            
            // Check if we have the wizard system available
            if (typeof DiagnosticWizard !== 'undefined' && window.diagnosticFlows && window.diagnosticFlows[issueId]) {
                console.log('🎨 Starting wizard for:', issueId);
                
                // Update app state
                if (window.appState) {
                    window.appState.currentIssue = issueId;
                    window.appState.sessionStart = new Date();
                }
                
                // Show wizard screen
                if (typeof showScreen === 'function') {
                    showScreen('wizard');
                }
                
                // Initialize wizard
                if (typeof initializeWizard === 'function') {
                    initializeWizard(issueId);
                } else {
                    // Fallback initialization
                    try {
                        const wizardInstance = new DiagnosticWizard('wizardContent');
                        wizardInstance.loadFlow(issueId);
                        window.wizardInstance = wizardInstance;
                    } catch (error) {
                        console.error('🎨 Error starting wizard:', error);
                        showDiagnosticPreview(issueId);
                    }
                }
            } else {
                // Show preview if wizard isn't available
                showDiagnosticPreview(issueId);
            }
        }, 300);
    };
    
    // Preview function for when full wizard isn't available
    window.showDiagnosticPreview = function(issueId) {
        const issueInfo = {
            'brakes': {
                title: 'Brake Issues',
                icon: '🛑',
                preview: 'This diagnostic will check for brake system problems including pedal feel, unusual noises, and visible leaks. Critical safety issue requiring immediate attention.'
            },
            'abs-light': {
                title: 'ABS Light Warning',
                icon: '🚨', 
                preview: 'This diagnostic will guide you through ABS light reset procedures and determine if the vehicle can continue or requires immediate attention.'
            },
            'oil-warning': {
                title: 'Oil Warning Light',
                icon: '🛢️',
                preview: 'This diagnostic addresses oil pressure warnings requiring immediate vehicle stop to prevent engine damage.'
            }
        };
        
        const info = issueInfo[issueId] || { title: issueId, icon: '❓', preview: 'Diagnostic procedure for this issue.' };
        
        // Create modal preview
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        `;
        
        modal.innerHTML = `
            <div style="
                background: white;
                padding: 40px;
                border-radius: 16px;
                max-width: 500px;
                width: 90%;
                text-align: center;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
            ">
                <div style="font-size: 64px; margin-bottom: 20px;">${info.icon}</div>
                <h2 style="color: #1f2937; margin-bottom: 16px; font-size: 24px;">${info.title}</h2>
                <p style="color: #6b7280; margin-bottom: 30px; line-height: 1.6;">${info.preview}</p>
                <div style="display: flex; gap: 12px; justify-content: center;">
                    <button onclick="this.closest('.modal').remove()" style="
                        background: #6b7280;
                        color: white;
                        padding: 12px 24px;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 600;
                    ">Back to Categories</button>
                    <button onclick="alert('Full diagnostic wizard will be implemented here'); this.closest('.modal').remove();" style="
                        background: #3b82f6;
                        color: white;
                        padding: 12px 24px;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 600;
                    ">Start Diagnostic</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close on background click
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.remove();
            }
        });
    };
    
    // Re-populate categories with enhanced styling
    setTimeout(() => {
        if (typeof populateCategories === 'function') {
            console.log('🎨 Re-populating categories with enhanced styling...');
            populateCategories();
        }
    }, 100);
    
    console.log('🎨 Category styling and interaction fixes applied!');
});

console.log('🎨 Category styling and interaction fix script loaded');
