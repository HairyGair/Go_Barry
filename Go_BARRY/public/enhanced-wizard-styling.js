/**
 * Enhanced Wizard Styling and UI
 * Restores the beautiful modal wizard appearance with working state management
 */

(function() {
    'use strict';
    
    console.log('🎨 Loading enhanced wizard styling...');
    
    // Enhanced CSS for beautiful wizard modals
    const wizardCSS = `
        /* Enhanced Wizard Styling */
        .step-container {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 12px;
            padding: 30px;
            margin: 20px auto;
            max-width: 800px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            animation: slideIn 0.3s ease-out;
        }
        
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .step-title {
            color: #1a2b5a;
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 20px;
            text-align: center;
            border-bottom: 3px solid #dc2626;
            padding-bottom: 15px;
        }
        
        .step-content {
            color: #374151;
            font-size: 18px;
            line-height: 1.6;
            margin-bottom: 25px;
            text-align: center;
        }
        
        .warning-box {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            border: 2px solid #f59e0b;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            font-weight: 600;
            color: #92400e;
            box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2);
        }
        
        .info-box {
            background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
            border: 2px solid #3b82f6;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            font-weight: 500;
            color: #1e40af;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
        }
        
        .checklist-container {
            background: rgba(243, 244, 246, 0.8);
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        
        .checklist-container h3 {
            color: #1a2b5a;
            font-size: 20px;
            margin-bottom: 15px;
            text-align: center;
        }
        
        .checklist {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        
        .checklist li {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 12px 16px;
            margin: 8px 0;
            position: relative;
            padding-left: 45px;
            font-weight: 500;
            color: #374151;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .checklist li:before {
            content: "⚠️";
            position: absolute;
            left: 15px;
            top: 12px;
            font-size: 16px;
        }
        
        .options-container {
            display: flex;
            flex-direction: column;
            gap: 15px;
            margin: 30px 0;
        }
        
        .option-button {
            background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
            border: 2px solid #d1d5db;
            border-radius: 12px;
            padding: 20px 25px;
            font-size: 18px;
            font-weight: 600;
            color: #374151;
            cursor: pointer;
            transition: all 0.3s ease;
            text-align: left;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            position: relative;
            overflow: hidden;
        }
        
        .option-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
            border-color: #9ca3af;
        }
        
        .option-button.critical {
            background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
            border-color: #dc2626;
            color: #991b1b;
        }
        
        .option-button.critical:hover {
            background: linear-gradient(135deg, #fca5a5 0%, #f87171 100%);
            color: white;
        }
        
        .option-button.warning {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            border-color: #f59e0b;
            color: #92400e;
        }
        
        .option-button.warning:hover {
            background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
            color: white;
        }
        
        .option-button.continue {
            background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
            border-color: #10b981;
            color: #047857;
        }
        
        .option-button.continue:hover {
            background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
            color: white;
        }
        
        .instructions-container {
            background: rgba(239, 246, 255, 0.8);
            border-radius: 12px;
            padding: 25px;
            margin: 25px 0;
            border: 2px solid #3b82f6;
        }
        
        .instructions-container h3 {
            color: #1e40af;
            font-size: 22px;
            margin-bottom: 20px;
            text-align: center;
        }
        
        .instructions-list {
            padding-left: 0;
            counter-reset: step-counter;
        }
        
        .instructions-list li {
            background: white;
            border-radius: 8px;
            padding: 15px 20px;
            margin: 12px 0;
            position: relative;
            padding-left: 60px;
            font-weight: 500;
            color: #374151;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            counter-increment: step-counter;
        }
        
        .instructions-list li:before {
            content: counter(step-counter);
            position: absolute;
            left: 20px;
            top: 15px;
            background: #3b82f6;
            color: white;
            width: 25px;
            height: 25px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 14px;
        }
        
        .final-result {
            border-radius: 12px;
            padding: 30px;
            margin: 25px 0;
            text-align: center;
        }
        
        .final-result.stop {
            background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
            border: 3px solid #dc2626;
            box-shadow: 0 8px 25px rgba(220, 38, 38, 0.3);
        }
        
        .final-result.warning {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            border: 3px solid #f59e0b;
            box-shadow: 0 8px 25px rgba(245, 158, 11, 0.3);
        }
        
        .final-result.continue {
            background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
            border: 3px solid #10b981;
            box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
        }
        
        .result-text {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 20px;
            color: #374151;
        }
        
        .stop-alert {
            background: #dc2626;
            color: white;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            box-shadow: 0 4px 15px rgba(220, 38, 38, 0.4);
        }
        
        .stop-alert h3 {
            margin: 0 0 10px 0;
            font-size: 24px;
        }
        
        .actions-section, .contacts-section {
            background: rgba(255, 255, 255, 0.9);
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            text-align: left;
        }
        
        .actions-section h3, .contacts-section h3 {
            color: #1a2b5a;
            font-size: 18px;
            margin-bottom: 15px;
            text-align: center;
        }
        
        .actions-section ul, .contacts-section ul {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        
        .actions-section li, .contacts-section li {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 12px 16px;
            margin: 8px 0;
            position: relative;
            padding-left: 35px;
            color: #374151;
        }
        
        .actions-section li:before {
            content: "✓";
            position: absolute;
            left: 12px;
            top: 12px;
            color: #10b981;
            font-weight: bold;
        }
        
        .contacts-section li:before {
            content: "📞";
            position: absolute;
            left: 12px;
            top: 12px;
        }
        
        .btn {
            padding: 15px 30px;
            border: none;
            border-radius: 8px;
            font-size: 18px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            margin: 10px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .btn-primary {
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
            color: white;
        }
        
        .btn-primary:hover {
            background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%);
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(185, 28, 28, 0.4);
        }
        
        .continue-btn, .next-btn, .complete-btn {
            display: block;
            margin: 30px auto;
            min-width: 200px;
        }
        
        /* Wizard Screen Enhancements */
        #wizardScreen {
            background: linear-gradient(135deg, #1a2b5a 0%, #2c4a7a 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        #wizardContent {
            max-width: none;
            margin: 0;
        }
        
        /* Progress Bar Enhancements */
        #progressBar {
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
            border-radius: 10px;
            transition: width 0.5s ease;
            box-shadow: 0 2px 8px rgba(220, 38, 38, 0.3);
        }
        
        /* Breadcrumb Enhancements */
        #breadcrumbTrail {
            color: rgba(255, 255, 255, 0.8);
            font-weight: 500;
            margin-bottom: 10px;
        }
        
        /* Wizard Title Enhancements */
        #wizardTitle {
            color: white;
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 20px;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        }
    `;
    
    // Inject enhanced CSS
    function injectEnhancedCSS() {
        const existingStyle = document.getElementById('enhanced-wizard-style');
        if (existingStyle) {
            existingStyle.remove();
        }
        
        const style = document.createElement('style');
        style.id = 'enhanced-wizard-style';
        style.textContent = wizardCSS;
        document.head.appendChild(style);
        
        console.log('✅ Enhanced wizard CSS injected');
    }
    
    // Enhanced step rendering with beautiful styling
    function generateEnhancedStepHTML(step, issueId, stepIndex) {
        let html = `
            <div class="step-container">
                <h2 class="step-title">${step.title}</h2>
        `;
        
        if (step.warning) {
            html += `<div class="warning-box">⚠️ ${step.warning}</div>`;
        }
        
        html += `<div class="step-content">${step.content}</div>`;
        
        if (step.info) {
            html += `<div class="info-box">ℹ️ ${step.info}</div>`;
        }
        
        // Add type-specific content with enhanced styling
        if (step.type === 'question') {
            if (step.checklist) {
                html += `
                    <div class="checklist-container">
                        <h3>🔍 Check for these symptoms:</h3>
                        <ul class="checklist">
                `;
                step.checklist.forEach(item => {
                    html += `<li>${item}</li>`;
                });
                html += '</ul></div>';
            }
            
            if (step.options) {
                html += '<div class="options-container">';
                step.options.forEach((option, index) => {
                    const severityClass = option.severity || '';
                    const buttonText = option.icon ? `${option.icon} ${option.text}` : option.text;
                    html += `<button class="option-button ${severityClass}" data-option="${index}">${buttonText}</button>`;
                });
                html += '</div>';
            }
        } else if (step.type === 'action') {
            if (step.instructions) {
                html += `
                    <div class="instructions-container">
                        <h3>📋 Follow these steps:</h3>
                        <ol class="instructions-list">
                `;
                step.instructions.forEach(instruction => {
                    html += `<li>${instruction}</li>`;
                });
                html += '</ol></div>';
            }
            
            if (step.timer) {
                html += `
                    <div class="info-box">
                        <strong>⏱️ Timer:</strong> Allow ${step.timer} seconds for completion
                    </div>
                `;
            }
            
            html += '<button class="btn btn-primary continue-btn">✅ Continue</button>';
        } else if (step.type === 'final') {
            html += `<div class="final-result ${step.severity}">`;
            html += `<div class="result-text">${step.result}</div>`;
            
            if (step.severity === 'stop' && step.stopReason) {
                html += `
                    <div class="stop-alert">
                        <h3>🛑 VEHICLE MUST STOP</h3>
                        <p>${step.stopReason}</p>
                    </div>
                `;
            }
            
            if (step.actions && step.actions.length > 0) {
                html += `
                    <div class="actions-section">
                        <h3>✅ Required Actions:</h3>
                        <ul>
                `;
                step.actions.forEach(action => {
                    html += `<li>${action}</li>`;
                });
                html += '</ul></div>';
            }
            
            if (step.contacts && step.contacts.length > 0) {
                html += `
                    <div class="contacts-section">
                        <h3>📞 Required Contacts:</h3>
                        <ul>
                `;
                step.contacts.forEach(contact => {
                    html += `<li>${contact}</li>`;
                });
                html += '</ul></div>';
            }
            
            html += '</div>';
            html += '<button class="btn btn-primary complete-btn">🏁 Complete Diagnosis</button>';
        } else {
            // Info step
            html += '<button class="btn btn-primary next-btn">➡️ Next</button>';
        }
        
        html += '</div>';
        return html;
    }
    
    // Override the existing generateStepHTML function
    function enhanceExistingWizard() {
        // Wait for the minimal fix to load
        setTimeout(() => {
            if (window.generateStepHTML) {
                // Override with enhanced version
                window.generateStepHTML = generateEnhancedStepHTML;
                console.log('✅ Enhanced step HTML generator applied');
            }
        }, 100);
    }
    
    // Initialize enhanced styling
    function initializeEnhancedWizard() {
        injectEnhancedCSS();
        enhanceExistingWizard();
        
        console.log('🎨 Enhanced wizard styling initialized');
    }
    
    // Wait for DOM and existing scripts to load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeEnhancedWizard);
    } else {
        initializeEnhancedWizard();
    }
    
    console.log('🎨 Enhanced wizard styling loaded');
    
})();