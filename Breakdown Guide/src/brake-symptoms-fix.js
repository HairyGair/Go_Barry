/**
 * Quick Fix for Brake Symptoms Checklist Issue
 * This fixes the missing checkboxes and non-responsive buttons
 */

// Override the renderChecklist method in the wizard engine
if (typeof DiagnosticWizard !== 'undefined') {
    DiagnosticWizard.prototype.renderChecklist = function(step) {
        console.log('Rendering checklist step:', step);
        
        const html = `
            <div class="step-container">
                <div class="step-header">
                    <h2 class="step-title">${step.title}</h2>
                </div>
                
                ${step.content.warning ? this.renderWarning(step.content.warning) : ''}
                
                <div class="step-content">
                    <p class="step-description">${step.content.description}</p>
                    
                    <div class="checklist-container">
                        ${step.content.items.map((item, index) => `
                            <label class="checkbox-item ${item.critical ? 'critical' : ''}" style="display: block; margin: 10px 0; padding: 12px; border: 1px solid #ddd; border-radius: 6px; cursor: pointer;">
                                <input type="checkbox" 
                                       id="check-${item.id}" 
                                       value="${item.id}"
                                       style="margin-right: 10px; transform: scale(1.2);"
                                       ${this.responses[this.currentStepId]?.includes(item.id) ? 'checked' : ''}>
                                <span class="checkbox-label" style="font-weight: ${item.critical ? 'bold' : 'normal'}; color: ${item.critical ? '#dc2626' : '#374151'};">
                                    ${item.critical ? '🚨 ' : ''}${item.label}
                                </span>
                            </label>
                        `).join('')}
                    </div>
                </div>
                
                <div class="step-actions" style="margin-top: 30px;">
                    ${this.renderActions(step.actions)}
                </div>
            </div>
        `;
        
        this.container.innerHTML = html;
        this.attachChecklistHandlers(step);
    };

    // Override attachChecklistHandlers to ensure buttons work
    DiagnosticWizard.prototype.attachChecklistHandlers = function(step) {
        console.log('Attaching checklist handlers for step:', step.id);
        
        // Handle action buttons
        step.actions.forEach(action => {
            const btn = document.getElementById(`action-${action.id}`);
            if (btn) {
                btn.addEventListener('click', (e) => {
                    console.log('Action clicked:', action.id);
                    e.preventDefault();
                    
                    const checked = Array.from(document.querySelectorAll('.checklist-container input:checked'))
                        .map(cb => cb.value);
                    
                    console.log('Checked items:', checked);
                    
                    // Check condition
                    let shouldProceed = true;
                    if (action.condition === 'anySelected' && checked.length === 0) {
                        shouldProceed = false;
                        alert('Please select at least one symptom to proceed, or use "No Symptoms Present" if none apply.');
                        return;
                    }
                    if (action.condition === 'noneSelected' && checked.length > 0) {
                        shouldProceed = false;
                        alert('Please uncheck all symptoms to use this option, or use "Symptoms Present" if any symptoms apply.');
                        return;
                    }
                    
                    if (shouldProceed) {
                        this.responses[this.currentStepId] = checked;
                        
                        // Show confirmation for critical actions
                        if (action.requiresConfirmation && checked.length > 0) {
                            if (confirm('CRITICAL SAFETY ISSUE DETECTED!\n\nYou have identified brake system symptoms that require the vehicle to STOP IMMEDIATELY.\n\nConfirm to proceed with stop procedure.')) {
                                this.handleAction(action);
                            }
                        } else {
                            this.handleAction(action);
                        }
                    }
                });
            }
        });
        
        // Update button states on checkbox change
        document.querySelectorAll('.checklist-container input').forEach(cb => {
            cb.addEventListener('change', () => {
                console.log('Checkbox changed:', cb.value, cb.checked);
                this.updateActionButtons(step);
            });
        });
        
        // Initial button state update
        this.updateActionButtons(step);
    };

    // Override updateActionButtons to handle button states properly
    DiagnosticWizard.prototype.updateActionButtons = function(step) {
        step.actions.forEach(action => {
            const btn = document.getElementById(`action-${action.id}`);
            if (!btn) return;
            
            let enabled = true;
            const checked = document.querySelectorAll('.checklist-container input:checked');
            
            // Check conditions
            if (action.condition === 'anySelected') {
                enabled = checked.length > 0;
                btn.style.backgroundColor = enabled ? '#dc2626' : '#9ca3af';
                btn.style.cursor = enabled ? 'pointer' : 'not-allowed';
            } else if (action.condition === 'noneSelected') {
                enabled = checked.length === 0;
                btn.style.backgroundColor = enabled ? '#059669' : '#9ca3af';
                btn.style.cursor = enabled ? 'pointer' : 'not-allowed';
            }
            
            btn.disabled = !enabled;
        });
    };

    // Override renderActions to ensure proper button styling
    DiagnosticWizard.prototype.renderActions = function(actions) {
        return actions.map(action => {
            let buttonClass = 'btn';
            let buttonStyle = 'padding: 12px 24px; margin: 5px; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 14px;';
            
            switch(action.type) {
                case 'danger':
                    buttonStyle += 'background-color: #dc2626; color: white;';
                    break;
                case 'success':
                    buttonStyle += 'background-color: #059669; color: white;';
                    break;
                case 'warning':
                    buttonStyle += 'background-color: #d97706; color: white;';
                    break;
                default:
                    buttonStyle += 'background-color: #3b82f6; color: white;';
            }
            
            return `
                <button class="${buttonClass}" 
                        id="action-${action.id}"
                        data-action-id="${action.id}"
                        style="${buttonStyle}"
                        ${action.disabled ? 'disabled' : ''}>
                    ${action.label}
                </button>
            `;
        }).join('');
    };

    console.log('Brake symptoms checklist fix loaded');
} else {
    console.error('DiagnosticWizard not found - cannot apply fix');
}

// Also ensure the wizard is properly initialized
document.addEventListener('DOMContentLoaded', function() {
    console.log('Brake symptoms fix initializing...');
    
    // Check if we're on the brake symptoms page and fix it
    if (window.location.href.includes('brake') || document.querySelector('.step-title')?.textContent?.includes('Brake')) {
        console.log('Detected brake symptoms page - applying fix');
        
        // If wizard instance exists and is on brake symptoms, re-render
        if (window.wizardInstance && window.wizardInstance.currentStepId === 'symptoms-check') {
            setTimeout(() => {
                window.wizardInstance.renderStep();
            }, 100);
        }
    }
});
