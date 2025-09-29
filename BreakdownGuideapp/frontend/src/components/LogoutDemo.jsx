// Comprehensive Logout Functionality Demo
// Demonstrates all logout methods and security features

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { ActivityTracker } from '../utils/logoutHelpers.js';

const LogoutDemo = () => {
    const {
        logout,
        emergencyLogout,
        silentLogout,
        autoLogout,
        secureCleanup,
        isAuthenticated,
        currentUser
    } = useAuth();

    const [activityTracker, setActivityTracker] = useState(null);
    const [lastActivity, setLastActivity] = useState(Date.now());
    const [showDemo, setShowDemo] = useState(false);

    // Initialize activity tracker for demo
    useEffect(() => {
        if (isAuthenticated && !activityTracker) {
            const tracker = new ActivityTracker(
                () => {
                    console.log('🔔 Demo: Inactivity detected - would trigger auto-logout');
                    // In real implementation, this would call autoLogout
                },
                5 * 60 * 1000 // 5 minutes for demo
            );
            setActivityTracker(tracker);

            // Update last activity display
            const interval = setInterval(() => {
                setLastActivity(tracker.getLastActivity());
            }, 1000);

            return () => {
                tracker.stopTracking();
                clearInterval(interval);
            };
        }
    }, [isAuthenticated, activityTracker]);

    // Demo: Standard logout with message and redirect
    const handleStandardLogout = async () => {
        console.log('🔐 Demo: Standard logout');
        const result = await logout(true, '/login');
        console.log('Standard logout result:', result);
    };

    // Demo: Silent logout without notifications
    const handleSilentLogout = async () => {
        console.log('🤫 Demo: Silent logout');
        const result = await silentLogout();
        console.log('Silent logout result:', result);
    };

    // Demo: Emergency logout (force clear everything)
    const handleEmergencyLogout = () => {
        console.log('🆘 Demo: Emergency logout');
        const result = emergencyLogout();
        console.log('Emergency logout result:', result);
    };

    // Demo: Auto logout (simulating inactivity)
    const handleAutoLogout = async () => {
        console.log('⏰ Demo: Auto logout');
        const result = await autoLogout('demo_inactivity');
        console.log('Auto logout result:', result);
    };

    // Demo: Secure cleanup only
    const handleSecureCleanup = () => {
        console.log('🔒 Demo: Secure cleanup');
        const result = secureCleanup();
        console.log('Secure cleanup result:', result);
    };

    // Demo: Logout without redirect
    const handleLogoutNoRedirect = async () => {
        console.log('🔄 Demo: Logout without redirect');
        const result = await logout(true, null);
        console.log('Logout no redirect result:', result);
    };

    if (!isAuthenticated) {
        return (
            <div className="logout-demo">
                <h3>🔒 Logout Demo - Not Authenticated</h3>
                <p>Please login first to test logout functionality.</p>
            </div>
        );
    }

    const timeSinceActivity = activityTracker ?
        Math.floor((Date.now() - activityTracker.getLastActivity()) / 1000) : 0;

    return (
        <div className="logout-demo">
            <div className="demo-header">
                <h3>🚪 Comprehensive Logout Functionality Demo</h3>
                <p>Testing all logout methods for user: <strong>{currentUser?.name}</strong></p>
                <button
                    onClick={() => setShowDemo(!showDemo)}
                    className="toggle-demo-btn"
                >
                    {showDemo ? 'Hide' : 'Show'} Demo Controls
                </button>
            </div>

            {showDemo && (
                <>
                    {/* Activity Tracking Info */}
                    <div className="activity-info">
                        <h4>👀 Activity Tracking</h4>
                        <p>Time since last activity: <strong>{timeSinceActivity}s</strong></p>
                        <p>Activity tracker: <strong>{activityTracker ? 'Active' : 'Inactive'}</strong></p>
                        <small>Move mouse, click, or type to reset activity timer</small>
                    </div>

                    {/* Logout Method Buttons */}
                    <div className="logout-methods">
                        <h4>🔐 Logout Methods</h4>

                        <div className="method-group">
                            <h5>Standard Logout</h5>
                            <p>Complete logout with success message and redirect</p>
                            <button onClick={handleStandardLogout} className="logout-btn standard">
                                🚪 Standard Logout
                            </button>
                            <button onClick={handleLogoutNoRedirect} className="logout-btn standard">
                                🔄 Logout (No Redirect)
                            </button>
                        </div>

                        <div className="method-group">
                            <h5>Silent Logout</h5>
                            <p>Logout without notifications or messages</p>
                            <button onClick={handleSilentLogout} className="logout-btn silent">
                                🤫 Silent Logout
                            </button>
                        </div>

                        <div className="method-group">
                            <h5>Emergency Logout</h5>
                            <p>Force logout without API calls (for emergencies)</p>
                            <button onClick={handleEmergencyLogout} className="logout-btn emergency">
                                🆘 Emergency Logout
                            </button>
                        </div>

                        <div className="method-group">
                            <h5>Auto Logout</h5>
                            <p>Simulates automatic logout due to inactivity</p>
                            <button onClick={handleAutoLogout} className="logout-btn auto">
                                ⏰ Auto Logout (Demo)
                            </button>
                        </div>

                        <div className="method-group">
                            <h5>Secure Cleanup</h5>
                            <p>Clear sensitive data without full logout</p>
                            <button onClick={handleSecureCleanup} className="logout-btn cleanup">
                                🔒 Secure Cleanup
                            </button>
                        </div>
                    </div>

                    {/* Usage Examples */}
                    <div className="usage-examples">
                        <h4>💡 Usage Examples</h4>
                        <div className="example-code">
                            <h5>Standard Logout:</h5>
                            <pre>{`
const { logout } = useAuth();

// Logout with message and redirect to home
await logout(true, '/');

// Logout silently without redirect
await logout(false, null);
                            `}</pre>
                        </div>

                        <div className="example-code">
                            <h5>Emergency Logout:</h5>
                            <pre>{`
const { emergencyLogout } = useAuth();

// Force logout when API is unavailable
emergencyLogout();
                            `}</pre>
                        </div>

                        <div className="example-code">
                            <h5>Auto Logout with Activity Tracking:</h5>
                            <pre>{`
import { ActivityTracker } from '../utils/logoutHelpers.js';

const tracker = new ActivityTracker(
  () => autoLogout('inactivity'),
  30 * 60 * 1000 // 30 minutes
);
                            `}</pre>
                        </div>
                    </div>
                </>
            )}

            <style jsx>{`
                .logout-demo {
                    max-width: 800px;
                    margin: 20px auto;
                    padding: 20px;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                .demo-header {
                    margin-bottom: 20px;
                    text-align: center;
                }

                .demo-header h3 {
                    color: #333;
                    margin-bottom: 10px;
                }

                .toggle-demo-btn {
                    background: #007bff;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    margin-top: 10px;
                }

                .toggle-demo-btn:hover {
                    background: #0056b3;
                }

                .activity-info {
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 6px;
                    margin-bottom: 20px;
                }

                .activity-info h4 {
                    margin-top: 0;
                    color: #495057;
                }

                .logout-methods {
                    margin-bottom: 30px;
                }

                .method-group {
                    margin-bottom: 20px;
                    padding: 15px;
                    border: 1px solid #e9ecef;
                    border-radius: 6px;
                }

                .method-group h5 {
                    margin-top: 0;
                    color: #495057;
                }

                .method-group p {
                    color: #6c757d;
                    font-size: 14px;
                    margin-bottom: 10px;
                }

                .logout-btn {
                    padding: 10px 20px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    margin-right: 10px;
                    margin-bottom: 5px;
                    font-weight: 500;
                    transition: all 0.2s ease;
                }

                .logout-btn.standard {
                    background: #28a745;
                    color: white;
                }

                .logout-btn.standard:hover {
                    background: #218838;
                }

                .logout-btn.silent {
                    background: #6f42c1;
                    color: white;
                }

                .logout-btn.silent:hover {
                    background: #5a2d91;
                }

                .logout-btn.emergency {
                    background: #dc3545;
                    color: white;
                }

                .logout-btn.emergency:hover {
                    background: #c82333;
                }

                .logout-btn.auto {
                    background: #fd7e14;
                    color: white;
                }

                .logout-btn.auto:hover {
                    background: #e8650e;
                }

                .logout-btn.cleanup {
                    background: #6c757d;
                    color: white;
                }

                .logout-btn.cleanup:hover {
                    background: #5a6268;
                }

                .usage-examples {
                    border-top: 1px solid #e9ecef;
                    padding-top: 20px;
                }

                .example-code {
                    margin-bottom: 20px;
                }

                .example-code h5 {
                    color: #495057;
                    margin-bottom: 10px;
                }

                .example-code pre {
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 4px;
                    overflow-x: auto;
                    font-size: 14px;
                    border: 1px solid #e9ecef;
                }

                @media (max-width: 600px) {
                    .logout-demo {
                        margin: 10px;
                        padding: 15px;
                    }

                    .logout-btn {
                        display: block;
                        width: 100%;
                        margin-right: 0;
                        margin-bottom: 10px;
                    }
                }
            `}</style>
        </div>
    );
};

export default LogoutDemo;