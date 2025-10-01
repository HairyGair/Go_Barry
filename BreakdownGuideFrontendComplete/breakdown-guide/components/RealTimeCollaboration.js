/**
 * Real-time Collaboration Component
 * Phase 2 Priority 4: Multi-supervisor collaboration on breakdowns
 * 
 * Features:
 * - Multiple supervisors working on same breakdown
 * - Live cursor/activity indicators
 * - Conflict resolution for simultaneous edits
 * - Real-time status updates
 * - Collaborative decision making
 */

const RealTimeCollaboration = ({ breakdownId, currentSupervisor }) => {
    const [activeSupervisors, setActiveSupervisors] = React.useState(new Map());
    const [breakdownStatus, setBreakdownStatus] = React.useState(null);
    const [conflicts, setConflicts] = React.useState([]);
    const [collaborationRequests, setCollaborationRequests] = React.useState([]);
    const [isConnected, setIsConnected] = React.useState(false);
    const [showCollaborators, setShowCollaborators] = React.useState(true);

    React.useEffect(() => {
        if (!breakdownId) return;

        // Subscribe to real-time updates for this breakdown
        if (window.RealTime) {
            window.RealTime.subscribeToBreakdown(breakdownId);
            
            // Set up event listeners
            const handleBreakdownUpdate = (event) => {
                const { breakdownId: updatedId, updates, updatedBy } = event.detail;
                if (updatedId === breakdownId) {
                    handleStatusUpdate(updates, updatedBy);
                }
            };

            const handleSupervisorActivity = (event) => {
                const { supervisorId, activity } = event.detail;
                if (activity.breakdownId === breakdownId) {
                    updateSupervisorActivity(supervisorId, activity);
                }
            };

            const handleCollaborationRequest = (event) => {
                const { breakdownId: requestId, fromSupervisor, requestType } = event.detail;
                if (requestId === breakdownId) {
                    addCollaborationRequest(fromSupervisor, requestType);
                }
            };

            const handleConnectionChange = (status) => {
                setIsConnected(status === 'connected');
            };

            // Register event listeners
            window.addEventListener('breakdown-updated', handleBreakdownUpdate);
            window.addEventListener('supervisor-activity', handleSupervisorActivity);
            window.addEventListener('collaboration-request', handleCollaborationRequest);
            window.RealTime.onConnectionChange(handleConnectionChange);

            // Set initial connection status
            setIsConnected(window.RealTime.isConnected());

            return () => {
                // Cleanup
                window.removeEventListener('breakdown-updated', handleBreakdownUpdate);
                window.removeEventListener('supervisor-activity', handleSupervisorActivity);
                window.removeEventListener('collaboration-request', handleCollaborationRequest);
                window.RealTime.unsubscribeFromBreakdown(breakdownId);
            };
        }
    }, [breakdownId]);

    const handleStatusUpdate = (updates, updatedBy) => {
        setBreakdownStatus(prev => ({ ...prev, ...updates }));

        // Check for conflicts
        if (updatedBy !== currentSupervisor) {
            const conflict = {
                id: Date.now(),
                updatedBy,
                updates,
                timestamp: new Date().toISOString()
            };
            setConflicts(prev => [...prev, conflict]);
        }
    };

    const updateSupervisorActivity = (supervisorId, activity) => {
        setActiveSupervisors(prev => {
            const updated = new Map(prev);
            updated.set(supervisorId, {
                ...activity,
                lastSeen: Date.now()
            });
            return updated;
        });

        // Broadcast own activity
        if (supervisorId === currentSupervisor) {
            window.RealTime?.broadcastActivity({
                breakdownId,
                action: activity.action,
                section: activity.section
            });
        }
    };

    const addCollaborationRequest = (fromSupervisor, requestType) => {
        const request = {
            id: Date.now(),
            fromSupervisor,
            requestType,
            timestamp: Date.now()
        };
        setCollaborationRequests(prev => [...prev, request]);
    };

    const requestAssistance = () => {
        if (window.RealTime?.isConnected()) {
            window.RealTime.requestBreakdownCollaboration(breakdownId, 'assistance');
        }
    };

    const resolveConflict = (conflictId, action) => {
        setConflicts(prev => prev.filter(c => c.id !== conflictId));
        // Could implement conflict resolution logic here
    };

    const acceptCollaborationRequest = (requestId) => {
        setCollaborationRequests(prev => prev.filter(r => r.id !== requestId));
        // Join collaboration
    };

    const declineCollaborationRequest = (requestId) => {
        setCollaborationRequests(prev => prev.filter(r => r.id !== requestId));
    };

    // Clean up old activity (supervisors who haven't been active for 5 minutes)
    React.useEffect(() => {
        const interval = setInterval(() => {
            const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
            setActiveSupervisors(prev => {
                const updated = new Map();
                prev.forEach((activity, supervisorId) => {
                    if (activity.lastSeen > fiveMinutesAgo) {
                        updated.set(supervisorId, activity);
                    }
                });
                return updated;
            });
        }, 60000); // Check every minute

        return () => clearInterval(interval);
    }, []);

    const getActivityColor = (action) => {
        const colors = {
            'viewing': 'bg-blue-500',
            'editing': 'bg-amber-500',
            'assessing': 'bg-green-500',
            'photo_taking': 'bg-purple-500',
            'decision_making': 'bg-red-500'
        };
        return colors[action] || 'bg-gray-500';
    };

    const getActivityIcon = (action) => {
        const icons = {
            'viewing': '👁️',
            'editing': '✏️',
            'assessing': '🔍',
            'photo_taking': '📸',
            'decision_making': '⚖️'
        };
        return icons[action] || '👤';
    };

    if (!breakdownId) {
        return null;
    }

    return (
        <div className="space-y-4">
            {/* Connection status */}
            <div className="flex items-center justify-between p-3 bg-gray-800/40 rounded-lg border border-gray-600/30">
                <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'} animate-pulse`}></div>
                    <span className="text-sm text-gray-300">
                        {isConnected ? 'Real-time connected' : 'Connection lost'}
                    </span>
                </div>
                
                <button
                    onClick={() => setShowCollaborators(!showCollaborators)}
                    className="text-xs text-blue-300 hover:text-blue-200"
                >
                    {showCollaborators ? 'Hide' : 'Show'} Collaborators
                </button>
            </div>

            {/* Active supervisors */}
            {showCollaborators && activeSupervisors.size > 0 && (
                <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-400/30">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-blue-200">
                            👥 Active Supervisors ({activeSupervisors.size})
                        </h4>
                        <button
                            onClick={requestAssistance}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs text-white transition-all"
                        >
                            🤝 Request Help
                        </button>
                    </div>
                    
                    <div className="space-y-2">
                        {Array.from(activeSupervisors.entries()).map(([supervisorId, activity]) => (
                            <div key={supervisorId} className="flex items-center space-x-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs ${getActivityColor(activity.action)}`}>
                                    {getActivityIcon(activity.action)}
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm font-medium text-white">
                                        {supervisorId === currentSupervisor ? 'You' : supervisorId}
                                    </div>
                                    <div className="text-xs text-gray-300">
                                        {activity.action.replace('_', ' ')} • {activity.section || 'General'}
                                    </div>
                                </div>
                                <div className="text-xs text-gray-400">
                                    {Math.round((Date.now() - activity.lastSeen) / 1000)}s ago
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Collaboration requests */}
            {collaborationRequests.length > 0 && (
                <div className="space-y-2">
                    {collaborationRequests.map(request => (
                        <div key={request.id} className="p-3 bg-amber-500/20 border border-amber-400/30 rounded-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm font-medium text-amber-200">
                                        🤝 Collaboration Request
                                    </div>
                                    <div className="text-xs text-amber-300">
                                        {request.fromSupervisor} requests {request.requestType}
                                    </div>
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => acceptCollaborationRequest(request.id)}
                                        className="px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs text-white"
                                    >
                                        Accept
                                    </button>
                                    <button
                                        onClick={() => declineCollaborationRequest(request.id)}
                                        className="px-2 py-1 bg-gray-600 hover:bg-gray-700 rounded text-xs text-white"
                                    >
                                        Decline
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Conflicts */}
            {conflicts.length > 0 && (
                <div className="space-y-2">
                    <h4 className="font-semibold text-red-200">⚠️ Conflicts Detected</h4>
                    {conflicts.map(conflict => (
                        <div key={conflict.id} className="p-3 bg-red-500/20 border border-red-400/30 rounded-lg">
                            <div className="text-sm text-red-200 mb-2">
                                {conflict.updatedBy} made changes while you were working
                            </div>
                            <div className="text-xs text-red-300 mb-3">
                                Updated: {Object.keys(conflict.updates).join(', ')}
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => resolveConflict(conflict.id, 'accept')}
                                    className="px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs text-white"
                                >
                                    Accept Changes
                                </button>
                                <button
                                    onClick={() => resolveConflict(conflict.id, 'reject')}
                                    className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs text-white"
                                >
                                    Keep Mine
                                </button>
                                <button
                                    onClick={() => resolveConflict(conflict.id, 'merge')}
                                    className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs text-white"
                                >
                                    Merge
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Real-time status indicator */}
            {breakdownStatus && (
                <div className="p-3 bg-green-500/10 rounded-lg border border-green-400/30">
                    <div className="text-sm font-medium text-green-200 mb-1">
                        📊 Live Status
                    </div>
                    <div className="text-xs text-green-300">
                        Status: {breakdownStatus.status || 'Unknown'}
                        {breakdownStatus.lastUpdated && (
                            <span className="ml-2">
                                • Updated {new Date(breakdownStatus.lastUpdated).toLocaleTimeString()}
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Quick actions */}
            <div className="grid grid-cols-2 gap-2">
                <button
                    onClick={() => window.RealTime?.broadcastActivity({
                        breakdownId,
                        action: 'assessing',
                        section: 'safety'
                    })}
                    className="p-2 bg-blue-600/20 border border-blue-400/30 rounded text-blue-200 text-xs hover:bg-blue-600/30 transition-all"
                >
                    🔍 Start Assessment
                </button>
                <button
                    onClick={() => window.RealTime?.broadcastActivity({
                        breakdownId,
                        action: 'decision_making',
                        section: 'final'
                    })}
                    className="p-2 bg-amber-600/20 border border-amber-400/30 rounded text-amber-200 text-xs hover:bg-amber-600/30 transition-all"
                >
                    ⚖️ Making Decision
                </button>
            </div>
        </div>
    );
};

// Real-time Activity Tracker Hook
const useRealTimeActivity = (breakdownId, supervisorId) => {
    const [activity, setActivity] = React.useState(null);

    const trackActivity = React.useCallback((action, section = null) => {
        const newActivity = {
            breakdownId,
            action,
            section,
            timestamp: Date.now()
        };
        
        setActivity(newActivity);
        
        // Broadcast activity if real-time is connected
        if (window.RealTime?.isConnected()) {
            window.RealTime.broadcastActivity(newActivity);
        }
    }, [breakdownId]);

    const startViewing = () => trackActivity('viewing');
    const startEditing = (section) => trackActivity('editing', section);
    const startAssessing = (section) => trackActivity('assessing', section);
    const startPhotoTaking = () => trackActivity('photo_taking');
    const startDecisionMaking = () => trackActivity('decision_making');

    return {
        activity,
        trackActivity,
        startViewing,
        startEditing,
        startAssessing,
        startPhotoTaking,
        startDecisionMaking
    };
};

// Real-time Status Sync Hook
const useRealTimeStatusSync = (breakdownId, onStatusUpdate) => {
    const [isConnected, setIsConnected] = React.useState(false);

    React.useEffect(() => {
        const handleConnectionChange = (status) => {
            setIsConnected(status === 'connected');
        };

        const handleBreakdownUpdate = (event) => {
            const { breakdownId: updatedId, updates, updatedBy } = event.detail;
            if (updatedId === breakdownId && onStatusUpdate) {
                onStatusUpdate(updates, updatedBy);
            }
        };

        if (window.RealTime) {
            window.RealTime.onConnectionChange(handleConnectionChange);
            window.addEventListener('breakdown-updated', handleBreakdownUpdate);
            setIsConnected(window.RealTime.isConnected());
        }

        return () => {
            if (window.RealTime) {
                window.removeEventListener('breakdown-updated', handleBreakdownUpdate);
            }
        };
    }, [breakdownId, onStatusUpdate]);

    const updateStatus = React.useCallback((status, notes = '') => {
        if (window.RealTime?.isConnected()) {
            window.RealTime.updateBreakdownStatus(breakdownId, status, notes);
        }
    }, [breakdownId]);

    return {
        isConnected,
        updateStatus
    };
};

// Export components and hooks
window.RealTimeCollaboration = RealTimeCollaboration;
window.useRealTimeActivity = useRealTimeActivity;
window.useRealTimeStatusSync = useRealTimeStatusSync;

console.log('🤝 Real-time collaboration system loaded');
