// ProtectedRoute Component - Comprehensive Route Protection
// Provides flexible authentication checking with various protection levels

import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

const ProtectedRoute = ({
    children,
    requireAuth = true,
    requireAdmin = false,
    requireRole = null,
    requirePermission = null,
    redirectTo = '/login',
    showLoadingSpinner = true,
    loadingComponent = null,
    fallbackComponent = null,
    unauthorizedComponent = null,
    adminRequiredComponent = null,
    onAuthRequired = null,
    onAccessDenied = null
}) => {
    const {
        isAuthenticated,
        isLoading,
        isSessionChecking,
        currentUser,
        hasPermission,
        isAdmin,
        checkSession
    } = useAuth();

    const location = useLocation();
    const [sessionCheckAttempted, setSessionCheckAttempted] = useState(false);
    const [accessDeniedReason, setAccessDeniedReason] = useState(null);

    // Perform additional session check if needed
    useEffect(() => {
        if (!isSessionChecking && !isAuthenticated && !sessionCheckAttempted) {
            setSessionCheckAttempted(true);
            checkSession();
        }
    }, [isSessionChecking, isAuthenticated, sessionCheckAttempted, checkSession]);

    // Check if user meets role requirements
    const checkRoleRequirement = () => {
        if (!requireRole) return true;

        if (Array.isArray(requireRole)) {
            return requireRole.includes(currentUser?.role);
        }

        return currentUser?.role === requireRole;
    };

    // Check if user meets permission requirements
    const checkPermissionRequirement = () => {
        if (!requirePermission) return true;

        if (Array.isArray(requirePermission)) {
            return requirePermission.some(permission => hasPermission(permission));
        }

        return hasPermission(requirePermission);
    };

    // Determine access level
    const getAccessStatus = () => {
        // If route doesn't require auth, allow access
        if (!requireAuth) {
            return { allowed: true, reason: null };
        }

        // If still loading or checking session, show loading
        if (isLoading || isSessionChecking) {
            return { allowed: false, reason: 'loading' };
        }

        // If not authenticated, require login
        if (!isAuthenticated) {
            return { allowed: false, reason: 'unauthenticated' };
        }

        // If admin required and user is not admin
        if (requireAdmin && !isAdmin) {
            return { allowed: false, reason: 'admin_required' };
        }

        // If specific role required
        if (requireRole && !checkRoleRequirement()) {
            return { allowed: false, reason: 'role_required' };
        }

        // If specific permission required
        if (requirePermission && !checkPermissionRequirement()) {
            return { allowed: false, reason: 'permission_required' };
        }

        // All checks passed
        return { allowed: true, reason: null };
    };

    const accessStatus = getAccessStatus();

    // Update access denied reason if changed
    useEffect(() => {
        if (accessStatus.reason && accessStatus.reason !== 'loading') {
            setAccessDeniedReason(accessStatus.reason);

            // Trigger callbacks
            if (accessStatus.reason === 'unauthenticated' && onAuthRequired) {
                onAuthRequired(location);
            } else if (accessStatus.reason !== 'unauthenticated' && onAccessDenied) {
                onAccessDenied(accessStatus.reason, currentUser, location);
            }
        }
    }, [accessStatus.reason, onAuthRequired, onAccessDenied, location, currentUser]);

    // Handle loading state
    if (accessStatus.reason === 'loading') {
        if (loadingComponent) {
            return loadingComponent;
        }

        if (!showLoadingSpinner) {
            return null;
        }

        return <LoadingSpinner />;
    }

    // Handle unauthenticated users
    if (accessStatus.reason === 'unauthenticated') {
        if (unauthorizedComponent) {
            return unauthorizedComponent;
        }

        if (fallbackComponent) {
            return fallbackComponent;
        }

        // Redirect to login with return URL
        return (
            <Navigate
                to={redirectTo}
                state={{ from: location }}
                replace
            />
        );
    }

    // Handle admin requirement
    if (accessStatus.reason === 'admin_required') {
        if (adminRequiredComponent) {
            return adminRequiredComponent;
        }

        if (fallbackComponent) {
            return fallbackComponent;
        }

        return <AdminRequiredMessage user={currentUser} />;
    }

    // Handle role/permission requirements
    if (accessStatus.reason === 'role_required' || accessStatus.reason === 'permission_required') {
        if (fallbackComponent) {
            return fallbackComponent;
        }

        return (
            <AccessDeniedMessage
                reason={accessStatus.reason}
                user={currentUser}
                requiredRole={requireRole}
                requiredPermission={requirePermission}
            />
        );
    }

    // All checks passed - render children
    return children;
};

// Default Loading Spinner Component
const LoadingSpinner = () => (
    <div className="protected-route-loading">
        <div className="loading-container">
            <div className="loading-spinner">
                <div className="spinner"></div>
            </div>
            <div className="loading-text">
                <h3>Checking Authentication</h3>
                <p>Please wait while we verify your access...</p>
            </div>
        </div>

        <style jsx>{`
            .protected-route-loading {
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                padding: 20px;
            }

            .loading-container {
                text-align: center;
                background: white;
                padding: 40px;
                border-radius: 16px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                max-width: 400px;
                width: 100%;
            }

            .loading-spinner {
                margin-bottom: 24px;
            }

            .spinner {
                width: 40px;
                height: 40px;
                border: 4px solid #f3f4f6;
                border-top: 4px solid #3182ce;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto;
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            .loading-text h3 {
                color: #2d3748;
                margin: 0 0 8px 0;
                font-size: 20px;
                font-weight: 600;
            }

            .loading-text p {
                color: #718096;
                margin: 0;
                font-size: 14px;
            }

            @media (max-width: 640px) {
                .protected-route-loading {
                    padding: 12px;
                }

                .loading-container {
                    padding: 24px 20px;
                }
            }
        `}</style>
    </div>
);

// Admin Required Message Component
const AdminRequiredMessage = ({ user }) => (
    <div className="access-denied-container">
        <div className="access-denied-card">
            <div className="access-denied-icon">🔒</div>
            <h2>Administrator Access Required</h2>
            <p>
                This section requires administrator privileges to access.
            </p>
            <div className="user-info">
                <p><strong>Current User:</strong> {user?.name || 'Unknown'}</p>
                <p><strong>Role:</strong> {user?.role || 'Unknown'}</p>
                <p><strong>Depot:</strong> {user?.depot || 'Unknown'}</p>
            </div>
            <div className="access-denied-actions">
                <button
                    onClick={() => window.history.back()}
                    className="btn btn-secondary"
                >
                    Go Back
                </button>
                <button
                    onClick={() => window.location.href = '/'}
                    className="btn btn-primary"
                >
                    Go to Dashboard
                </button>
            </div>
            <div className="help-text">
                <p>Need admin access? Contact your system administrator.</p>
            </div>
        </div>

        <style jsx>{`
            .access-denied-container {
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
                padding: 20px;
            }

            .access-denied-card {
                background: white;
                padding: 40px;
                border-radius: 16px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                max-width: 500px;
                width: 100%;
                text-align: center;
                border: 2px solid #fca5a5;
            }

            .access-denied-icon {
                font-size: 48px;
                margin-bottom: 16px;
            }

            .access-denied-card h2 {
                color: #dc2626;
                margin: 0 0 16px 0;
                font-size: 24px;
                font-weight: 700;
            }

            .access-denied-card > p {
                color: #6b7280;
                margin: 0 0 24px 0;
                font-size: 16px;
                line-height: 1.5;
            }

            .user-info {
                background: #f9fafb;
                border-radius: 8px;
                padding: 16px;
                margin: 24px 0;
                text-align: left;
            }

            .user-info p {
                margin: 4px 0;
                font-size: 14px;
                color: #374151;
            }

            .access-denied-actions {
                display: flex;
                gap: 12px;
                justify-content: center;
                margin: 24px 0;
                flex-wrap: wrap;
            }

            .btn {
                padding: 10px 20px;
                border: none;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .btn-primary {
                background: #3182ce;
                color: white;
            }

            .btn-primary:hover {
                background: #2c5282;
            }

            .btn-secondary {
                background: #e5e7eb;
                color: #374151;
            }

            .btn-secondary:hover {
                background: #d1d5db;
            }

            .help-text {
                margin-top: 24px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
            }

            .help-text p {
                margin: 0;
                font-size: 12px;
                color: #9ca3af;
            }

            @media (max-width: 640px) {
                .access-denied-container {
                    padding: 12px;
                }

                .access-denied-card {
                    padding: 24px 20px;
                }

                .access-denied-actions {
                    flex-direction: column;
                }
            }
        `}</style>
    </div>
);

// General Access Denied Message Component
const AccessDeniedMessage = ({ reason, user, requiredRole, requiredPermission }) => {
    const getReasonText = () => {
        switch (reason) {
            case 'role_required':
                return `This section requires ${Array.isArray(requiredRole) ? requiredRole.join(' or ') : requiredRole} role access.`;
            case 'permission_required':
                return `This section requires specific permissions to access.`;
            default:
                return 'You do not have sufficient privileges to access this section.';
        }
    };

    return (
        <div className="access-denied-container">
            <div className="access-denied-card">
                <div className="access-denied-icon">⚠️</div>
                <h2>Access Denied</h2>
                <p>{getReasonText()}</p>
                <div className="user-info">
                    <p><strong>Current User:</strong> {user?.name || 'Unknown'}</p>
                    <p><strong>Role:</strong> {user?.role || 'Unknown'}</p>
                    <p><strong>Depot:</strong> {user?.depot || 'Unknown'}</p>
                    {requiredRole && (
                        <p><strong>Required Role:</strong> {Array.isArray(requiredRole) ? requiredRole.join(' or ') : requiredRole}</p>
                    )}
                    {requiredPermission && (
                        <p><strong>Required Permission:</strong> {Array.isArray(requiredPermission) ? requiredPermission.join(' or ') : requiredPermission}</p>
                    )}
                </div>
                <div className="access-denied-actions">
                    <button
                        onClick={() => window.history.back()}
                        className="btn btn-secondary"
                    >
                        Go Back
                    </button>
                    <button
                        onClick={() => window.location.href = '/'}
                        className="btn btn-primary"
                    >
                        Go to Dashboard
                    </button>
                </div>
                <div className="help-text">
                    <p>Need access? Contact your supervisor or system administrator.</p>
                </div>
            </div>

            <style jsx>{`
                .access-denied-container {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #fef3c7 0%, #fcd34d 100%);
                    padding: 20px;
                }

                .access-denied-card {
                    background: white;
                    padding: 40px;
                    border-radius: 16px;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                    max-width: 500px;
                    width: 100%;
                    text-align: center;
                    border: 2px solid #fbbf24;
                }

                .access-denied-icon {
                    font-size: 48px;
                    margin-bottom: 16px;
                }

                .access-denied-card h2 {
                    color: #d97706;
                    margin: 0 0 16px 0;
                    font-size: 24px;
                    font-weight: 700;
                }

                .access-denied-card > p {
                    color: #6b7280;
                    margin: 0 0 24px 0;
                    font-size: 16px;
                    line-height: 1.5;
                }

                .user-info {
                    background: #f9fafb;
                    border-radius: 8px;
                    padding: 16px;
                    margin: 24px 0;
                    text-align: left;
                }

                .user-info p {
                    margin: 4px 0;
                    font-size: 14px;
                    color: #374151;
                }

                .access-denied-actions {
                    display: flex;
                    gap: 12px;
                    justify-content: center;
                    margin: 24px 0;
                    flex-wrap: wrap;
                }

                .btn {
                    padding: 10px 20px;
                    border: none;
                    border-radius: 6px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .btn-primary {
                    background: #3182ce;
                    color: white;
                }

                .btn-primary:hover {
                    background: #2c5282;
                }

                .btn-secondary {
                    background: #e5e7eb;
                    color: #374151;
                }

                .btn-secondary:hover {
                    background: #d1d5db;
                }

                .help-text {
                    margin-top: 24px;
                    padding-top: 20px;
                    border-top: 1px solid #e5e7eb;
                }

                .help-text p {
                    margin: 0;
                    font-size: 12px;
                    color: #9ca3af;
                }

                @media (max-width: 640px) {
                    .access-denied-container {
                        padding: 12px;
                    }

                    .access-denied-card {
                        padding: 24px 20px;
                    }

                    .access-denied-actions {
                        flex-direction: column;
                    }
                }
            `}</style>
        </div>
    );
};

export default ProtectedRoute;

// Export specific variations for convenience
export const AdminRoute = ({ children, ...props }) => (
    <ProtectedRoute requireAdmin={true} {...props}>
        {children}
    </ProtectedRoute>
);

export const SupervisorRoute = ({ children, ...props }) => (
    <ProtectedRoute requireRole={['supervisor', 'admin']} {...props}>
        {children}
    </ProtectedRoute>
);

export const ManagerRoute = ({ children, ...props }) => (
    <ProtectedRoute requireRole={['manager', 'admin']} {...props}>
        {children}
    </ProtectedRoute>
);

export const PermissionRoute = ({ permission, children, ...props }) => (
    <ProtectedRoute requirePermission={permission} {...props}>
        {children}
    </ProtectedRoute>
);

export const PublicRoute = ({ children, ...props }) => (
    <ProtectedRoute requireAuth={false} {...props}>
        {children}
    </ProtectedRoute>
);