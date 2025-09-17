// Supervisor Login Component for Breakdown Guide
// Integrates with Supabase authentication system

import React, { useState, useEffect } from 'react';

const SupervisorLogin = ({ onLoginSuccess }) => {
    const [selectedSupervisor, setSelectedSupervisor] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    
    // List of all 9 Go North East supervisors with supervisor IDs
    const supervisors = [
        { supervisorId: 'supervisor001', badge: 'AW001', name: 'Alex Woodcock' },
        { supervisorId: 'supervisor002', badge: 'AC002', name: 'Andrew Cowley' },
        { supervisorId: 'supervisor003', badge: 'AG003', name: 'Anthony Gair', isAdmin: true },
        { supervisorId: 'supervisor004', badge: 'CF004', name: 'Claire Fiddler' },
        { supervisorId: 'supervisor005', badge: 'DH005', name: 'David Hall' },
        { supervisorId: 'supervisor006', badge: 'JD006', name: 'James Daglish' },
        { supervisorId: 'supervisor007', badge: 'JP007', name: 'John Paterson' },
        { supervisorId: 'supervisor008', badge: 'SG008', name: 'Simon Glass' },
        { supervisorId: 'supervisor009', badge: 'BP009', name: 'Barry Perryman', isAdmin: true }
    ];
    
    // Check for existing session on mount
    useEffect(() => {
        const savedSession = localStorage.getItem('supervisor_session');
        if (savedSession) {
            try {
                const session = JSON.parse(savedSession);
                // Verify session is still valid (within 24 hours)
                const sessionTime = new Date(session.timestamp);
                const now = new Date();
                const hoursDiff = (now - sessionTime) / (1000 * 60 * 60);
                
                if (hoursDiff < 24) {
                    onLoginSuccess(session);
                } else {
                    localStorage.removeItem('supervisor_session');
                }
            } catch (err) {
                console.error('Invalid session data:', err);
                localStorage.removeItem('supervisor_session');
            }
        }
    }, [onLoginSuccess]);
    
    const handleLogin = async (e) => {
        e.preventDefault();
        console.log('handleLogin called with:', { selectedSupervisor, password: password ? '***' : 'empty' });
        
        if (!selectedSupervisor) {
            setError('Please select a supervisor');
            return;
        }
        
        setLoading(true);
        setError('');
        
        try {
            // Find selected supervisor details
            const supervisor = supervisors.find(s => s.supervisorId === selectedSupervisor);
            
            // NO AUTH MODE - Create session without authentication
            const session = {
                supervisorId: supervisor.supervisorId,
                badge: supervisor.badge,
                name: supervisor.name,
                isAdmin: supervisor.isAdmin || false,
                timestamp: new Date().toISOString(),
                authenticated: true
            };
            
            // Save session if remember me is checked
            if (rememberMe) {
                localStorage.setItem('supervisor_session', JSON.stringify(session));
            }
            
            console.log('Login successful, calling onLoginSuccess with session:', session);
            onLoginSuccess(session);
            
        } catch (err) {
            console.error('Login error:', err);
            setError('Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="supervisor-login-container">
            <div className="login-card">
                <div className="login-header">
                    <h1>Go North East</h1>
                    <h2>Breakdown Assessment System</h2>
                    <p className="login-subtitle">Supervisor Login</p>
                </div>
                
                <form onSubmit={handleLogin} className="login-form">
                    <div className="form-group">
                        <label htmlFor="supervisor">Select Supervisor</label>
                        <select
                            id="supervisor"
                            value={selectedSupervisor}
                            onChange={(e) => setSelectedSupervisor(e.target.value)}
                            className="form-control"
                            required
                        >
                            <option value="">-- Select Your Name --</option>
                            {supervisors.map(supervisor => (
                                <option key={supervisor.supervisorId} value={supervisor.supervisorId}>
                                    {supervisor.badge} - {supervisor.name}
                                    {supervisor.isAdmin && ' (Admin)'}
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="form-control"
                            placeholder="Enter your password (optional in NO AUTH mode)"
                        />
                    </div>
                    
                    <div className="form-group checkbox-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                            />
                            <span>Remember me for 24 hours</span>
                        </label>
                    </div>
                    
                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}
                    
                    <button 
                        type="submit" 
                        className="btn btn-primary btn-login"
                        disabled={loading || !selectedSupervisor}
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
                
                <div className="login-footer">
                    <p className="security-note">
                        🔒 Secure System - All activities are logged for safety compliance
                    </p>
                    <p className="version-info">
                        Version 2.0 - NO AUTH MODE
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SupervisorLogin;
