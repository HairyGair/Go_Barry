/**
 * Enhanced Brake Information Rendering
 * Provides clean, structured display for brake safety information
 */

// Override the renderInfoStep function for enhanced brake info display
const originalRenderInfoStep = window.renderInfoStep || function() {};

function renderInfoStep(step, container) {
    // Check if this is an enhanced brake info step
    if (step.enhanced && step.sections) {
        renderEnhancedBrakeInfo(step, container);
    } else {
        // Use original rendering for other info steps
        originalRenderInfoStep(step, container);
        
        // Fallback: Add next button for info steps
        if (!container.querySelector('.btn-primary')) {
            const nextBtn = document.createElement('button');
            nextBtn.className = 'btn btn-primary';
            nextBtn.textContent = 'Next';
            nextBtn.addEventListener('click', nextStep);
            container.appendChild(nextBtn);
        }
    }
}

function renderEnhancedBrakeInfo(step, container) {
    // Add enhanced warning box styling
    const warningBox = container.querySelector('.warning-box');
    if (warningBox) {
        warningBox.className = 'critical-warning-enhanced';
        warningBox.innerHTML = `
            <div class="warning-content-enhanced">
                <span class="warning-icon-enhanced">⚠️ ⚠️</span>
                <div class="warning-text-enhanced">
                    <strong>SAFETY IS NON-NEGOTIABLE</strong><br>
                    If any brake defect is confirmed, the vehicle must stop immediately.
                </div>
            </div>
        `;
    }

    // Clear existing content and add title underline
    const stepContent = container.querySelector('.step-content');
    if (stepContent) {
        stepContent.innerHTML = '';
        
        const titleUnderline = document.createElement('div');
        titleUnderline.className = 'title-underline';
        stepContent.appendChild(titleUnderline);
    }

    // Render each section
    step.sections.forEach(section => {
        const sectionDiv = document.createElement('div');
        sectionDiv.className = section.type === 'legal' ? 'legal-section' : 'info-section';
        
        // Section title
        const sectionTitle = document.createElement('h2');
        sectionTitle.className = 'section-title';
        sectionTitle.innerHTML = `
            <span class="section-icon">${section.icon}</span>
            <span>${section.title}</span>
        `;
        sectionDiv.appendChild(sectionTitle);
        
        // Section content
        const sectionContent = document.createElement('div');
        sectionContent.className = section.type === 'legal' ? 'legal-content' : 'section-content';
        
        if (section.content) {
            const contentP = document.createElement('p');
            contentP.textContent = section.content;
            sectionContent.appendChild(contentP);
        }
        
        // Handle lists
        if (section.list) {
            const listContainer = document.createElement('ul');
            listContainer.className = 'criteria-list';
            
            section.list.forEach((item, index) => {
                const listItem = document.createElement('li');
                listItem.className = 'criteria-item';
                
                const icon = document.createElement('span');
                icon.className = 'criteria-icon';
                icon.textContent = section.numbered ? `${index + 1}.` : '•';
                
                const text = document.createElement('span');
                text.textContent = item;
                
                listItem.appendChild(icon);
                listItem.appendChild(text);
                listContainer.appendChild(listItem);
            });
            
            sectionContent.appendChild(listContainer);
        }
        
        // Add emphasis text
        if (section.emphasis) {
            const emphasisP = document.createElement('p');
            emphasisP.className = 'text-emphasis';
            emphasisP.innerHTML = `<strong>${section.emphasis}</strong>`;
            emphasisP.style.marginTop = '16px';
            sectionContent.appendChild(emphasisP);
        }
        
        sectionDiv.appendChild(sectionContent);
        
        if (stepContent) {
            stepContent.appendChild(sectionDiv);
        } else {
            container.appendChild(sectionDiv);
        }
    });
    
    // Add next button
    const nextBtn = document.createElement('button');
    nextBtn.className = 'btn btn-primary enhanced-next-btn';
    nextBtn.textContent = 'Next';
    nextBtn.addEventListener('click', nextStep);
    container.appendChild(nextBtn);
}

// Enhanced CSS Styles
function addEnhancedBrakeStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* Enhanced Brake Information Styles */
        .critical-warning-enhanced {
            background: linear-gradient(135deg, #fef3c7, #fcd34d);
            border: 2px solid #f59e0b;
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0 32px 0;
            position: relative;
            overflow: hidden;
        }
        
        .critical-warning-enhanced::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #dc2626, #f59e0b);
        }
        
        .warning-content-enhanced {
            display: flex;
            align-items: flex-start;
            gap: 16px;
        }
        
        .warning-icon-enhanced {
            font-size: 2rem;
            flex-shrink: 0;
        }
        
        .warning-text-enhanced {
            font-weight: 600;
            font-size: 1.1rem;
            color: #92400e;
            line-height: 1.5;
        }
        
        .title-underline {
            height: 3px;
            background: linear-gradient(90deg, #dc2626, #f59e0b);
            border-radius: 2px;
            margin: 0 auto 32px;
            width: 100px;
        }
        
        .info-section {
            background: #f9fafb;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 24px;
        }
        
        .section-title {
            font-size: 1.25rem;
            font-weight: 600;
            color: #1a2b5a;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .section-icon {
            font-size: 1.5rem;
        }
        
        .section-content {
            color: #374151;
            line-height: 1.6;
        }
        
        .criteria-list {
            list-style: none;
            margin: 16px 0;
            padding: 0;
        }
        
        .criteria-item {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            padding: 12px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .criteria-item:last-child {
            border-bottom: none;
        }
        
        .criteria-icon {
            color: #dc2626;
            font-weight: 600;
            font-size: 1.1rem;
            flex-shrink: 0;
            margin-top: 2px;
            min-width: 20px;
        }
        
        .legal-section {
            background: linear-gradient(135deg, #eff6ff, #dbeafe);
            border-left: 4px solid #3b82f6;
            padding: 20px;
            margin: 24px 0;
            border-radius: 0 8px 8px 0;
        }
        
        .legal-content {
            color: #1e3a8a;
            font-size: 0.95rem;
            line-height: 1.5;
        }
        
        .text-emphasis {
            font-weight: 600;
            color: #1a2b5a;
        }
        
        .enhanced-next-btn {
            margin-top: 32px;
            padding: 12px 32px;
            font-size: 1rem;
            font-weight: 600;
            border-radius: 8px;
            background: #dc2626;
            color: white;
            border: none;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        
        .enhanced-next-btn:hover {
            background: #b91c1c;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
        }
        
        /* Override step title for enhanced pages */
        .step-container .step-title {
            font-size: 2rem;
            font-weight: 700;
            color: #1a2b5a;
            margin-bottom: 8px;
            text-align: center;
        }
        
        /* Responsive improvements */
        @media (max-width: 768px) {
            .warning-content-enhanced {
                flex-direction: column;
                gap: 12px;
            }
            
            .warning-icon-enhanced {
                align-self: center;
            }
            
            .criteria-item {
                flex-direction: column;
                gap: 8px;
                text-align: left;
            }
            
            .criteria-icon {
                align-self: flex-start;
            }
            
            .section-title {
                flex-direction: column;
                text-align: center;
                gap: 8px;
            }
        }
    `;
    
    // Only add if not already added
    if (!document.querySelector('#enhanced-brake-styles')) {
        style.id = 'enhanced-brake-styles';
        document.head.appendChild(style);
    }
}

// Initialize enhanced styling
document.addEventListener('DOMContentLoaded', () => {
    addEnhancedBrakeStyles();
});

// Override the global renderInfoStep function
window.renderInfoStep = renderInfoStep;

console.log('✅ Enhanced brake information rendering loaded');
