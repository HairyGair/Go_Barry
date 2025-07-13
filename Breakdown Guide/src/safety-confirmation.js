/**
 * Go North East - Breakdown Guide
 * Safety Confirmation System
 * Ensures critical decisions are double-checked
 */

class SafetyConfirmation {
    constructor() {
        this.criticalActions = [
            'vehicle-stop',
            'engineering-required',
            'immediate-changeover',
            'safety-critical'
        ];
    }

    /**
     * Show a safety confirmation dialog
     * @param {Object} options - Configuration options
     * @param {string} options.title - Dialog title
     * @param {string} options.message - Main message
     * @param {string} options.severity - 'critical', 'warning', 'info'
     * @param {string} options.confirmText - Text user must type
     * @param {Function} options.onConfirm - Callback on confirmation
     * @param {Function} options.onCancel - Callback on cancellation
     */
    show(options) {
        const {
            title = 'Safety Confirmation Required',
            message,
            severity = 'warning',
            confirmText = 'CONFIRM',
            onConfirm,
            onCancel
        } = options;

        // Create modal overlay
        const modal = document.createElement('div');
        modal.className = 'safety-modal-overlay active';
        modal.innerHTML = `
            <div class="safety-modal ${severity}">
                <div class="safety-modal-header">
                    <span class="safety-icon">${this.getSeverityIcon(severity)}</span>
                    <h2>${title}</h2>
                </div>
                
                <div class="safety-modal-body">
                    <p class="safety-message">${message}</p>
                    
                    <div class="safety-confirm-section">
                        <p class="confirm-instruction">
                            Type <strong>${confirmText}</strong> to confirm this action:
                        </p>
                        <input 
                            type="text" 
                            class="safety-confirm-input" 
                            id="safetyConfirmInput"
                            placeholder="Type ${confirmText} here"
                            autocomplete="off"
                        >
                        <p class="confirm-hint" id="confirmHint"></p>
                    </div>
                    
                    ${severity === 'critical' ? `
                        <div class="safety-warning">
                            <strong>⚠️ This is a SAFETY CRITICAL decision</strong>
                            <p>This action cannot be undone and may affect vehicle operation.</p>
                        </div>
                    ` : ''}
                </div>
                
                <div class="safety-modal-footer">
                    <button class="btn btn-secondary" id="safetyCancelBtn">
                        Cancel
                    </button>
                    <button class="btn btn-danger" id="safetyConfirmBtn" disabled>
                        Confirm Action
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Get elements
        const input = document.getElementById('safetyConfirmInput');
        const confirmBtn = document.getElementById('safetyConfirmBtn');
        const cancelBtn = document.getElementById('safetyCancelBtn');
        const hint = document.getElementById('confirmHint');

        // Focus input
        setTimeout(() => input.focus(), 100);

        // Input validation
        input.addEventListener('input', (e) => {
            const value = e.target.value.toUpperCase();
            const required = confirmText.toUpperCase();
            
            if (value === required) {
                confirmBtn.disabled = false;
                confirmBtn.classList.add('ready');
                hint.textContent = '✓ Ready to confirm';
                hint.className = 'confirm-hint success';
            } else if (required.startsWith(value) && value.length > 0) {
                confirmBtn.disabled = true;
                confirmBtn.classList.remove('ready');
                hint.textContent = `Continue typing... (${value.length}/${required.length})`;
                hint.className = 'confirm-hint partial';
            } else if (value.length > 0) {
                confirmBtn.disabled = true;
                confirmBtn.classList.remove('ready');
                hint.textContent = 'Text does not match';
                hint.className = 'confirm-hint error';
            } else {
                confirmBtn.disabled = true;
                confirmBtn.classList.remove('ready');
                hint.textContent = '';
                hint.className = 'confirm-hint';
            }
        });

        // Enter key submission
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !confirmBtn.disabled) {
                confirmBtn.click();
            }
        });

        // Button handlers
        confirmBtn.addEventListener('click', () => {
            // Add confirmation animation
            confirmBtn.innerHTML = '✓ Confirmed';
            confirmBtn.disabled = true;
            
            // Log the confirmation
            this.logConfirmation(title, severity);
            
            setTimeout(() => {
                modal.remove();
                if (onConfirm) onConfirm();
            }, 500);
        });

        cancelBtn.addEventListener('click', () => {
            modal.remove();
            if (onCancel) onCancel();
        });

        // Click outside to cancel (with warning)
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                if (severity === 'critical') {
                    // Don't allow click-outside for critical confirmations
                    this.shakeModal(modal.querySelector('.safety-modal'));
                } else {
                    modal.remove();
                    if (onCancel) onCancel();
                }
            }
        });

        // ESC key to cancel (except for critical)
        const escHandler = (e) => {
            if (e.key === 'Escape' && severity !== 'critical') {
                modal.remove();
                document.removeEventListener('keydown', escHandler);
                if (onCancel) onCancel();
            }
        };
        document.addEventListener('keydown', escHandler);
    }

    /**
     * Show a countdown confirmation for time-sensitive decisions
     */
    showCountdown(options) {
        const {
            title = 'Action Required',
            message,
            countdown = 10,
            onConfirm,
            onTimeout
        } = options;

        let timeLeft = countdown;

        const modal = document.createElement('div');
        modal.className = 'safety-modal-overlay active';
        modal.innerHTML = `
            <div class="safety-modal countdown">
                <div class="safety-modal-header">
                    <span class="safety-icon">⏱️</span>
                    <h2>${title}</h2>
                </div>
                
                <div class="safety-modal-body">
                    <p class="safety-message">${message}</p>
                    
                    <div class="countdown-display">
                        <div class="countdown-circle">
                            <svg viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="45" class="countdown-bg"></circle>
                                <circle cx="50" cy="50" r="45" class="countdown-progress" 
                                        stroke-dasharray="283" 
                                        stroke-dashoffset="0"></circle>
                            </svg>
                            <div class="countdown-number" id="countdownNumber">${countdown}</div>
                        </div>
                        <p class="countdown-text">seconds to confirm</p>
                    </div>
                </div>
                
                <div class="safety-modal-footer">
                    <button class="btn btn-primary btn-large" id="countdownConfirmBtn">
                        Confirm Action
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const numberEl = document.getElementById('countdownNumber');
        const progressEl = modal.querySelector('.countdown-progress');
        const confirmBtn = document.getElementById('countdownConfirmBtn');

        // Start countdown
        const interval = setInterval(() => {
            timeLeft--;
            numberEl.textContent = timeLeft;
            
            // Update progress circle
            const progress = (countdown - timeLeft) / countdown;
            const offset = 283 * progress;
            progressEl.style.strokeDashoffset = offset;
            
            if (timeLeft <= 3) {
                numberEl.classList.add('urgent');
            }
            
            if (timeLeft <= 0) {
                clearInterval(interval);
                modal.remove();
                if (onTimeout) onTimeout();
            }
        }, 1000);

        // Confirm handler
        confirmBtn.addEventListener('click', () => {
            clearInterval(interval);
            confirmBtn.innerHTML = '✓ Confirmed';
            confirmBtn.disabled = true;
            
            setTimeout(() => {
                modal.remove();
                if (onConfirm) onConfirm();
            }, 500);
        });
    }

    /**
     * Show supervisor override option
     */
    showOverride(options) {
        const {
            title = 'Supervisor Override Required',
            message,
            reason = '',
            onOverride,
            onCancel
        } = options;

        const modal = document.createElement('div');
        modal.className = 'safety-modal-overlay active';
        modal.innerHTML = `
            <div class="safety-modal override">
                <div class="safety-modal-header">
                    <span class="safety-icon">🔐</span>
                    <h2>${title}</h2>
                </div>
                
                <div class="safety-modal-body">
                    <p class="safety-message">${message}</p>
                    
                    <div class="override-form">
                        <label for="overrideReason">
                            <strong>Reason for override:</strong> (Required)
                        </label>
                        <textarea 
                            id="overrideReason" 
                            class="override-reason-input"
                            placeholder="Explain why this safety protocol is being overridden..."
                            rows="4"
                        >${reason}</textarea>
                        
                        <label for="supervisorId">
                            <strong>Supervisor ID:</strong>
                        </label>
                        <input 
                            type="text" 
                            id="supervisorId" 
                            class="supervisor-id-input"
                            placeholder="Enter your supervisor ID"
                        >
                    </div>
                    
                    <div class="safety-warning">
                        <strong>⚠️ Warning:</strong> This override will be logged and may be audited.
                    </div>
                </div>
                
                <div class="safety-modal-footer">
                    <button class="btn btn-secondary" id="overrideCancelBtn">
                        Cancel
                    </button>
                    <button class="btn btn-warning" id="overrideConfirmBtn" disabled>
                        Confirm Override
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const reasonInput = document.getElementById('overrideReason');
        const idInput = document.getElementById('supervisorId');
        const confirmBtn = document.getElementById('overrideConfirmBtn');
        const cancelBtn = document.getElementById('overrideCancelBtn');

        // Validation
        const validate = () => {
            const hasReason = reasonInput.value.trim().length >= 10;
            const hasId = idInput.value.trim().length >= 3;
            confirmBtn.disabled = !(hasReason && hasId);
        };

        reasonInput.addEventListener('input', validate);
        idInput.addEventListener('input', validate);

        // Handlers
        confirmBtn.addEventListener('click', () => {
            const overrideData = {
                reason: reasonInput.value.trim(),
                supervisorId: idInput.value.trim(),
                timestamp: new Date().toISOString()
            };
            
            this.logOverride(overrideData);
            
            modal.remove();
            if (onOverride) onOverride(overrideData);
        });

        cancelBtn.addEventListener('click', () => {
            modal.remove();
            if (onCancel) onCancel();
        });
    }

    // Utility methods
    getSeverityIcon(severity) {
        switch (severity) {
            case 'critical': return '🛑';
            case 'warning': return '⚠️';
            case 'info': return 'ℹ️';
            default: return '⚠️';
        }
    }

    shakeModal(element) {
        element.classList.add('shake');
        setTimeout(() => element.classList.remove('shake'), 500);
    }

    logConfirmation(action, severity) {
        if (typeof logAction === 'function') {
            logAction('Safety confirmation', {
                action: action,
                severity: severity,
                timestamp: new Date().toISOString()
            });
        }
    }

    logOverride(overrideData) {
        if (typeof logAction === 'function') {
            logAction('Supervisor override', overrideData);
        }
    }
}

// Export for use in main app
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SafetyConfirmation;
}