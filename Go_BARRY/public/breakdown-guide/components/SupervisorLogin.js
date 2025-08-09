// Supervisor Login Component for Breakdown Guide
// Integrates with Supabase authentication system

const SupervisorLogin = function({ onLoginSuccess }) {
    const { useState, useEffect } = React;
    
    const [selectedSupervisor, setSelectedSupervisor] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    
    // List of all 9 Go North East supervisors
    const supervisors = [
        { badge: 'AW001', name: 'Alex Woodcock' },
        { badge: 'AC002', name: 'Andrew Cowley' },
        { badge: 'AG003', name: 'Anthony Gair', isAdmin: true },
        { badge: 'CF004', name: 'Claire Fiddler' },
        { badge: 'DH005', name: 'David Hall' },
        { badge: 'JD006', name: 'James Daglish' },
        { badge: 'JP007', name: 'John Paterson' },
        { badge: 'SG008', name: 'Simon Glass' },
        { badge: 'BP009', name: 'Barry Perryman', isAdmin: true }
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
    }, []);
    
    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        try {
            // Get backend URL from environment or use default
            const backendUrl = window.BACKEND_URL || 'https://go-barry.onrender.com';
            
            // Authenticate with backend
            const response = await fetch(`${backendUrl}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    supervisorId: selectedSupervisor,
                    badge: selectedSupervisor,
                    password: password
                })
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                const session = {
                    supervisorId: data.supervisor.badge_number,
                    supervisorName: data.supervisor.name,
                    depot: data.supervisor.depot,
                    isAdmin: data.supervisor.is_admin,
                    token: data.token,
                    timestamp: new Date().toISOString()
                };
                
                // Store session
                if (rememberMe) {
                    localStorage.setItem('supervisor_session', JSON.stringify(session));
                } else {
                    sessionStorage.setItem('supervisor_session', JSON.stringify(session));
                }
                
                // Initialize breakdown analytics with supervisor info
                if (window.BreakdownAnalytics) {
                    window.BreakdownAnalytics.setSupervisor(session);
                }
                
                // Log successful login
                console.log(`Supervisor ${session.supervisorId} logged in successfully`);
                
                onLoginSuccess(session);
            } else {
                setError(data.message || 'Invalid supervisor or password');
            }
        } catch (err) {
            console.error('Login error:', err);
            setError('Unable to connect to authentication server. Please try again.');
        } finally {
            setLoading(false);
        }
    };
    
    return React.createElement('div', {
        className: 'min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4'
    },
        React.createElement('div', {
            className: 'bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full'
        },
            // Logo and Title
            React.createElement('div', { className: 'text-center mb-8' },
                React.createElement('div', { className: 'text-4xl font-bold mb-2' },
                    React.createElement('span', { className: 'text-blue-900' }, 'Go'),
                    React.createElement('span', { className: 'text-red-600' }, 'NorthEast')
                ),
                React.createElement('h2', { className: 'text-2xl font-semibold text-gray-800' }, 
                    'Breakdown Guide'
                ),
                React.createElement('p', { className: 'text-gray-600 mt-2' }, 
                    'Supervisor Authentication Required'
                )
            ),
            
            // Login Form
            React.createElement('form', { onSubmit: handleLogin, className: 'space-y-6' },
                // Supervisor Selection Dropdown
                React.createElement('div', {},
                    React.createElement('label', {
                        htmlFor: 'supervisor',
                        className: 'block text-sm font-medium text-gray-700 mb-2'
                    }, 'Select Supervisor'),
                    React.createElement('select', {
                        id: 'supervisor',
                        value: selectedSupervisor,
                        onChange: (e) => setSelectedSupervisor(e.target.value),
                        required: true,
                        className: 'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 bg-white',
                        disabled: loading
                    },
                        React.createElement('option', { value: '', disabled: true }, 
                            'Choose your supervisor account...'
                        ),
                        ...supervisors.map(supervisor =>
                            React.createElement('option', {
                                key: supervisor.badge,
                                value: supervisor.badge
                            }, `${supervisor.badge} - ${supervisor.name}${supervisor.isAdmin ? ' (Admin)' : ''}`)
                        )
                    )
                ),
                
                // Password Input
                React.createElement('div', {},
                    React.createElement('label', {
                        htmlFor: 'password',
                        className: 'block text-sm font-medium text-gray-700 mb-2'
                    }, 'Password'),
                    React.createElement('input', {
                        id: 'password',
                        type: 'password',
                        value: password,
                        onChange: (e) => setPassword(e.target.value),
                        placeholder: 'Enter your password',
                        required: true,
                        className: 'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200',
                        disabled: loading,
                        autoComplete: 'current-password'
                    })
                ),
                
                // Remember Me Checkbox
                React.createElement('div', { className: 'flex items-center' },
                    React.createElement('input', {
                        id: 'remember',
                        type: 'checkbox',
                        checked: rememberMe,
                        onChange: (e) => setRememberMe(e.target.checked),
                        className: 'h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded',
                        disabled: loading
                    }),
                    React.createElement('label', {
                        htmlFor: 'remember',
                        className: 'ml-2 block text-sm text-gray-700'
                    }, 'Remember me for 24 hours')
                ),
                
                // Error Message
                error && React.createElement('div', {
                    className: 'bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm'
                }, error),
                
                // Submit Button
                React.createElement('button', {
                    type: 'submit',
                    disabled: loading || !selectedSupervisor || !password,
                    className: 'w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
                }, loading ? 'Authenticating...' : 'Sign In')
            ),
            
            // Footer Info
            React.createElement('div', { className: 'mt-6 text-center text-sm text-gray-600' },
                React.createElement('div', { className: 'bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4' },
                    React.createElement('p', { className: 'text-blue-800 font-medium mb-1' }, 'Current Password Information'),
                    React.createElement('p', { className: 'text-blue-700 text-xs' }, 
                        'All supervisors currently use: Barry123!'
                    ),
                    React.createElement('p', { className: 'text-blue-600 text-xs mt-1' }, 
                        'You will be prompted to change this on first login'
                    )
                ),
                React.createElement('p', {}, 'Authorised supervisors only'),
                React.createElement('p', { className: 'mt-1' }, 
                    'All assessments will be logged and audited'
                )
            )
        )
    );
};

// Export for use in main app
window.SupervisorLogin = SupervisorLogin;