/**
 * EMERGENCY FIX for Missing Buttons in Breakdown Guide
 * This completely fixes the wizard rendering issues
 */

console.log('🔧 Loading emergency wizard fix...');

// Wait for DOM and other scripts to load
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Applying emergency wizard fixes...');
    
    // Override the entire DiagnosticWizard class if it exists
    if (typeof DiagnosticWizard !== 'undefined') {
        
        // Fix the renderActions method
        DiagnosticWizard.prototype.renderActions = function(actions) {
            console.log('🔧 Rendering actions:', actions);
            if (!actions || actions.length === 0) {
                return '<p>No actions available</p>';
            }
            
            return actions.map(action => {
                const buttonId = `action-${action.id}`;
                let buttonClass = 'btn';
                let buttonStyle = `
                    display: inline-block;
                    padding: 12px 24px;
                    margin: 8px 4px;
                    border: none;
                    border-radius: 6px;
                    font-weight: 600;
                    cursor: pointer;
                    font-size: 14px;
                    text-decoration: none;
                    transition: background-color 0.2s;
                `;
                
                // Set colors based on action type
                switch(action.type) {
                    case 'danger':
                        buttonStyle += 'background-color: #dc2626; color: white;';
                        buttonClass += ' btn-danger';
                        break;
                    case 'success':
                        buttonStyle += 'background-color: #059669; color: white;';
                        buttonClass += ' btn-success';
                        break;
                    case 'warning':
                        buttonStyle += 'background-color: #d97706; color: white;';
                        buttonClass += ' btn-warning';
                        break;
                    case 'secondary':
                        buttonStyle += 'background-color: #6b7280; color: white;';
                        buttonClass += ' btn-secondary';
                        break;
                    default:
                        buttonStyle += 'background-color: #3b82f6; color: white;';
                        buttonClass += ' btn-primary';
                }
                
                return `
                    <button 
                        class="${buttonClass}" 
                        id="${buttonId}"
                        data-action-id="${action.id}"
                        data-action-type="${action.type || 'primary'}"
                        data-next-step="${action.nextStep || ''}"
                        data-condition="${action.condition || ''}"
                        data-requires-confirmation="${action.requiresConfirmation || false}"
                        style="${buttonStyle}"
                        ${action.disabled ? 'disabled' : ''}>
                        ${action.label}
                    </button>
                `;
            }).join('');
        };

        // Fix the renderChecklist method
        DiagnosticWizard.prototype.renderChecklist = function(step) {
            console.log('🔧 Rendering checklist for step:', step.id);
            
            const warningHtml = step.content.warning ? `
                <div class="alert alert-${step.content.warning.type || 'warning'}" style="
                    padding: 12px;
                    margin: 16px 0;
                    border-radius: 6px;
                    background-color: #fee2e2;
                    border: 1px solid #dc2626;
                    color: #dc2626;
                    font-weight: 600;
                ">
                    ${step.content.warning.text}
                </div>
            ` : '';
            
            const checklistHtml = step.content.items.map((item, index) => {
                const itemStyle = `
                    display: block;
                    margin: 12px 0;
                    padding: 12px;
                    border: 2px solid ${item.critical ? '#dc2626' : '#d1d5db'};
                    border-radius: 6px;
                    cursor: pointer;
                    background-color: ${item.critical ? '#fef2f2' : '#ffffff'};
                    transition: all 0.2s;
                `;
                
                const checkboxStyle = `
                    margin-right: 12px;
                    transform: scale(1.3);
                    cursor: pointer;
                `;
                
                const labelStyle = `
                    font-weight: ${item.critical ? 'bold' : 'normal'};
                    color: ${item.critical ? '#dc2626' : '#374151'};
                    cursor: pointer;
                    user-select: none;
                `;
                
                return `
                    <label class="checkbox-item ${item.critical ? 'critical' : ''}" style="${itemStyle}">
                        <input type="checkbox" 
                               id="check-${item.id}" 
                               value="${item.id}"
                               style="${checkboxStyle}"
                               ${this.responses[this.currentStepId]?.includes(item.id) ? 'checked' : ''}>
                        <span class="checkbox-label" style="${labelStyle}">
                            ${item.critical ? '🚨 ' : ''}${item.label}
                        </span>
                    </label>
                `;
            }).join('');
            
            const html = `
                <div class="step-container" style="max-width: 800px; margin: 0 auto;">
                    <div class="step-header">
                        <h2 class="step-title" style="color: #1f2937; margin-bottom: 16px;">${step.title}</h2>
                    </div>
                    
                    ${warningHtml}
                    
                    <div class="step-content">
                        <p class="step-description" style="margin-bottom: 20px; font-size: 16px; line-height: 1.5;">${step.content.description}</p>
                        
                        <div class="checklist-container" style="margin: 20px 0;">
                            ${checklistHtml}
                        </div>
                    </div>
                    
                    <div class="step-actions" style="margin-top: 30px; text-align: center;">
                        ${this.renderActions(step.actions)}
                    </div>
                </div>
            `;
            
            this.container.innerHTML = html;
            this.attachChecklistHandlers(step);
        };

        // Fix the attachChecklistHandlers method
        DiagnosticWizard.prototype.attachChecklistHandlers = function(step) {
            console.log('🔧 Attaching checklist handlers for:', step.id);
            
            const self = this;
            
            // Attach button click handlers
            step.actions.forEach(action => {
                const btn = document.getElementById(`action-${action.id}`);
                if (btn) {
                    console.log('🔧 Attaching handler to button:', action.id);
                    
                    btn.addEventListener('click', function(e) {
                        e.preventDefault();
                        console.log('🔧 Button clicked:', action.id);
                        
                        const checked = Array.from(document.querySelectorAll('.checklist-container input:checked'))
                            .map(cb => cb.value);
                        
                        console.log('🔧 Checked items:', checked);
                        
                        let shouldProceed = true;
                        let errorMessage = '';
                        
                        // Check conditions
                        if (action.condition === 'anySelected' && checked.length === 0) {
                            shouldProceed = false;
                            errorMessage = 'Please select at least one symptom to proceed with this option.';
                        } else if (action.condition === 'noneSelected' && checked.length > 0) {
                            shouldProceed = false;
                            errorMessage = 'Please uncheck all symptoms to use this option, or choose "Symptoms Present" if any symptoms apply.';
                        }
                        
                        if (!shouldProceed) {
                            alert(errorMessage);
                            return;
                        }
                        
                        // Store response
                        self.responses[self.currentStepId] = checked;
                        
                        // Handle confirmation for critical actions
                        if (action.requiresConfirmation && checked.length > 0) {
                            const confirmMessage = `CRITICAL SAFETY ISSUE DETECTED!

${checked.length} brake system symptom(s) identified that require the vehicle to STOP IMMEDIATELY.

This is a safety-critical situation that requires immediate action.

Click OK to proceed with the stop procedure.`;
                            
                            if (confirm(confirmMessage)) {
                                self.handleAction(action);
                            }
                        } else {
                            self.handleAction(action);
                        }
                    });
                    
                    // Visual feedback on hover
                    btn.addEventListener('mouseenter', function() {
                        if (!this.disabled) {
                            this.style.opacity = '0.9';
                            this.style.transform = 'translateY(-1px)';
                        }
                    });
                    
                    btn.addEventListener('mouseleave', function() {
                        this.style.opacity = '1';
                        this.style.transform = 'translateY(0)';
                    });
                } else {
                    console.error('🔧 Button not found:', `action-${action.id}`);
                }
            });
            
            // Attach checkbox change handlers
            const checkboxes = document.querySelectorAll('.checklist-container input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                checkbox.addEventListener('change', function() {
                    console.log('🔧 Checkbox changed:', this.value, this.checked);
                    self.updateActionButtons(step);
                    
                    // Visual feedback for parent label
                    const label = this.closest('label');
                    if (label) {
                        if (this.checked) {
                            label.style.backgroundColor = this.closest('.critical') ? '#fecaca' : '#f3f4f6';
                            label.style.borderColor = this.closest('.critical') ? '#dc2626' : '#6b7280';
                        } else {
                            label.style.backgroundColor = this.closest('.critical') ? '#fef2f2' : '#ffffff';
                            label.style.borderColor = this.closest('.critical') ? '#dc2626' : '#d1d5db';
                        }
                    }
                });
            });
            
            console.log('🔧 Found checkboxes:', checkboxes.length);
            console.log('🔧 Step actions:', step.actions.length);
            
            // Initial button state update
            this.updateActionButtons(step);
        };

        // Fix the updateActionButtons method
        DiagnosticWizard.prototype.updateActionButtons = function(step) {
            const checked = document.querySelectorAll('.checklist-container input:checked');
            
            step.actions.forEach(action => {
                const btn = document.getElementById(`action-${action.id}`);
                if (!btn) return;
                
                let enabled = true;
                
                if (action.condition === 'anySelected') {
                    enabled = checked.length > 0;
                } else if (action.condition === 'noneSelected') {
                    enabled = checked.length === 0;
                }
                
                btn.disabled = !enabled;
                
                // Visual feedback
                if (enabled) {
                    btn.style.opacity = '1';
                    btn.style.cursor = 'pointer';
                } else {
                    btn.style.opacity = '0.5';
                    btn.style.cursor = 'not-allowed';
                }
            });
        };

        // Fix the handleAction method if needed
        if (!DiagnosticWizard.prototype.handleAction) {
            DiagnosticWizard.prototype.handleAction = function(action) {
                console.log('🔧 Handling action:', action);
                
                // Log action if specified
                if (action.logAction) {
                    console.log('🔧 Logging action:', action.logAction);
                }
                
                // Save to history
                this.history.push({
                    stepId: this.currentStepId,
                    action: action.id,
                    timestamp: new Date(),
                    responses: this.responses[this.currentStepId]
                });
                
                // Navigate to next step
                if (action.nextStep) {
                    this.currentStepId = action.nextStep;
                    this.renderStep();
                } else {
                    console.log('🔧 No next step defined, showing completion');
                    this.showCompletion();
                }
            };
        }

        // Add completion method if missing
        if (!DiagnosticWizard.prototype.showCompletion) {
            DiagnosticWizard.prototype.showCompletion = function() {
                this.container.innerHTML = `
                    <div style="text-align: center; padding: 40px;">
                        <h2>✅ Diagnostic Complete</h2>
                        <p>The diagnostic procedure has been completed.</p>
                        <button onclick="showScreen('category')" style="
                            background-color: #3b82f6;
                            color: white;
                            padding: 12px 24px;
                            border: none;
                            border-radius: 6px;
                            cursor: pointer;
                            font-size: 14px;
                            font-weight: 600;
                        ">Return to Categories</button>
                    </div>
                `;
            };
        }

        console.log('🔧 Emergency wizard fixes applied successfully!');
        
        // Test if we're currently on a broken step and re-render
        if (window.wizardInstance && window.wizardInstance.currentStepId) {
            console.log('🔧 Re-rendering current step...');
            setTimeout(() => {
                window.wizardInstance.renderStep();
            }, 100);
        }
        
    } else {
        console.error('🔧 DiagnosticWizard class not found - cannot apply fixes');
    }
});

// Also apply fixes immediately if DOM is already loaded
if (document.readyState === 'loading') {
    console.log('🔧 DOM not ready, waiting...');
} else {
    console.log('🔧 DOM ready, applying fixes now...');
    setTimeout(() => {
        if (typeof DiagnosticWizard !== 'undefined' && window.wizardInstance) {
            console.log('🔧 Re-rendering current wizard step...');
            window.wizardInstance.renderStep();
        }
    }, 500);
}

console.log('🔧 Emergency wizard fix script loaded');
