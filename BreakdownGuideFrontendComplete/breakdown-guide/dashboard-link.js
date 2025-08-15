// Dashboard Link Integration
// Adds a button to access the Engineering Response Dashboard

document.addEventListener('DOMContentLoaded', function() {
    // Wait for React app to load
    setTimeout(() => {
        // Check if we're on the main menu (not in a wizard)
        const checkAndAddButton = () => {
            const mainContent = document.querySelector('.relative.max-w-7xl.mx-auto');
            const existingButton = document.getElementById('dashboard-link-button');
            
            // Only add if we're on main menu and button doesn't exist
            if (mainContent && !existingButton && document.querySelector('.grid.grid-cols-1')) {
                const dashboardButton = document.createElement('div');
                dashboardButton.id = 'dashboard-link-container';
                dashboardButton.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 1000;
                `;
                
                dashboardButton.innerHTML = `
                    <a href="../dashboard/" 
                       target="_blank"
                       id="dashboard-link-button"
                       style="
                           display: inline-flex;
                           align-items: center;
                           gap: 8px;
                           background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                           color: white;
                           padding: 12px 20px;
                           border-radius: 8px;
                           text-decoration: none;
                           font-weight: 600;
                           font-size: 14px;
                           transition: all 0.3s;
                           box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
                       "
                       onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(102, 126, 234, 0.6)';"
                       onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(102, 126, 234, 0.4)';">
                        📊 Response Dashboard
                    </a>
                `;
                
                document.body.appendChild(dashboardButton);
            }
        };
        
        // Check initially and on any DOM changes
        checkAndAddButton();
        
        // Monitor for navigation changes
        const observer = new MutationObserver(() => {
            checkAndAddButton();
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
    }, 2000);
});

// Also add a floating notification if there are active breakdowns
async function checkActiveBreakdowns() {
    try {
        // Use the same backend URL as configured in the main app
        const apiBase = window.BACKEND_URL || (window.location.hostname === 'localhost' 
            ? 'http://localhost:3001'  // Fixed port number
            : 'https://go-barry.onrender.com');
            
        const response = await fetch(`${apiBase}/api/breakdowns/live`); // Fixed endpoint
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.breakdowns && data.breakdowns.length > 0) {
            const activeCount = data.breakdowns.length;
            
            // Check for overdue breakdowns (over 30 minutes since diagnosis)
            const criticalCount = data.breakdowns.filter(b => {
                if (b.diagnosed_at) {
                    const elapsed = Date.now() - new Date(b.diagnosed_at).getTime();
                    return elapsed > 30 * 60 * 1000; // Over 30 minutes
                }
                return false;
            }).length;
            
            // Remove any existing notification
            const existing = document.getElementById('breakdown-notification');
            if (existing) existing.remove();
            
            // Add a notification badge
            const badge = document.createElement('div');
            badge.id = 'breakdown-notification';
            badge.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: ${criticalCount > 0 ? '#ef4444' : '#f59e0b'};
                color: white;
                padding: 15px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                z-index: 999;
                cursor: pointer;
                animation: pulse 2s infinite;
                font-size: 14px;
                font-weight: 600;
                max-width: 250px;
            `;
            
            badge.innerHTML = `
                🚨 ${activeCount} Active Breakdown${activeCount > 1 ? 's' : ''}
                ${criticalCount > 0 ? `<br><span style="font-size: 12px;">${criticalCount} overdue!</span>` : ''}
            `;
            
            badge.onclick = () => {
                window.open('../dashboard/', '_blank');
            };
            
            // Add pulse animation if not already present
            if (!document.getElementById('pulse-animation-style')) {
                const style = document.createElement('style');
                style.id = 'pulse-animation-style';
                style.textContent = `
                    @keyframes pulse {
                        0%, 100% { transform: scale(1); }
                        50% { transform: scale(1.05); }
                    }
                `;
                document.head.appendChild(style);
            }
            
            document.body.appendChild(badge);
            
            // Remove after 10 seconds if not critical
            if (criticalCount === 0) {
                setTimeout(() => {
                    if (badge.parentNode) badge.remove();
                }, 10000);
            }
            
            console.log(`✅ Found ${activeCount} active breakdowns (${criticalCount} overdue)`);
        } else {
            console.log('📊 No active breakdowns');
        }
    } catch (error) {
        if (error.name === 'TypeError' && (error.message.includes('CORS') || error.message.includes('Failed to fetch'))) {
            console.log('⚠️ CORS Error: Cannot check active breakdowns from this origin');
            console.log('💡 This is normal when running locally - backend is on different domain');
        } else {
            console.log('⚠️ Could not check active breakdowns (backend offline):', error.message);
        }
    }
}

// Check for active breakdowns on load
setTimeout(checkActiveBreakdowns, 3000);

// Check periodically (every 5 minutes)
setInterval(checkActiveBreakdowns, 5 * 60 * 1000);
