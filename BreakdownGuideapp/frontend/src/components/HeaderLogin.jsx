import React, { useState, useEffect } from 'react';
import { authHelpers, supabase } from '../services/supabase-client.js';
import { apiConfig } from '../breakdown-guide/components/common/constants.js';

// Hardcoded supervisor list as fallback
const FALLBACK_SUPERVISORS = [
  { id: '32f1b875-c214-4b96-88ff-5639fcfd908d', name: 'Anthony Gair', email: 'anthony.gair@gonortheast.co.uk' },
  { id: '39df73b1-41d3-4b6d-a1ce-dec1ce79b1af', name: 'Barry Perryman', email: 'barry.perryman@gonortheast.co.uk' },
  { id: '80de4f3e-ecf9-44d9-ba17-8f0443ae1570', name: 'Alex Woodcock', email: 'alex.woodcock@gonortheast.co.uk' },
  { id: '1ba16aee-9941-4978-87f9-d42085bb8623', name: 'Andrew Cowley', email: 'andrew.cowley@gonortheast.co.uk' },
  { id: 'bf8f6160-700e-49fb-80eb-c3f472ce59ef', name: 'Claire Fiddler', email: 'claire.fiddler@gonortheast.co.uk' },
  { id: '2e5ad3e1-18da-48e7-b94b-f3e2d92f7cd8', name: 'David Hall', email: 'david.hall@gonortheast.co.uk' },
  { id: 'da1f6c46-a2be-4f25-ba75-48b8e88e038b', name: 'James Daglish', email: 'james.daglish@gonortheast.co.uk' },
  { id: '1c81de74-d0c7-4176-a1ea-88d1dfd6d924', name: 'John Paterson', email: 'john.paterson@gonortheast.co.uk' },
  { id: '0e461a49-001c-4120-acfa-d8a4a43babb3', name: 'Simon Glass', email: 'simon.glass@gonortheast.co.uk' }
];

const HeaderLogin = ({ onLoginSuccess }) => {
  const [supervisors, setSupervisors] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingSupervisors, setLoadingSupervisors] = useState(true);
  const [useFallback, setUseFallback] = useState(false);

  // Load supervisors list on mount
  useEffect(() => {
    loadSupervisors();
  }, []);

  const loadSupervisors = async () => {
    try {
      setLoadingSupervisors(true);
      setError('');

      // Try to load supervisors from backend API first
      console.log('🔍 Loading supervisors from backend API...');
      const response = await fetch(`${apiConfig.baseUrl}/api/auth/supervisors`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const supervisorData = await response.json();
        if (supervisorData && supervisorData.length > 0) {
          console.log('✅ Loaded supervisors from backend:', supervisorData);
          setSupervisors(supervisorData.map(s => ({
            id: s.id,
            name: s.full_name || s.name,
            email: s.email
          })));
          setUseFallback(false);
          return;
        }
      }

      console.log('⚠️ Backend API failed, trying Supabase...');

      // Fallback to Supabase
      let { data, error } = await supabase
        .from('supervisors')
        .select('id, name, email')
        .order('name');

      if (!error && data && data.length > 0) {
        console.log('✅ Loaded supervisors from Supabase:', data);
        setSupervisors(data);
        setUseFallback(false);
        return;
      }

      // Final fallback to hardcoded list
      console.log('⚠️ All sources failed, using hardcoded supervisor list');
      setSupervisors(FALLBACK_SUPERVISORS);
      setUseFallback(true);
      setError('Using offline supervisor list');

    } catch (err) {
      console.error('Error loading supervisors:', err);
      setError('Using offline supervisor list');
      setSupervisors(FALLBACK_SUPERVISORS);
      setUseFallback(true);
    } finally {
      setLoadingSupervisors(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!selectedEmail) {
      setError('Please select a supervisor');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Try backend API login first
      console.log('🔐 Attempting backend API login...');
      const response = await fetch(`${apiConfig.baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: selectedEmail })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.user) {
          console.log('✅ Backend API login successful:', result.user);
          const session = {
            id: result.user.user_id,
            supervisorId: result.user.supervisorId,
            name: result.user.name,
            email: result.user.email,
            depot: result.user.depot || 'SDC',
            role: result.user.role || 'supervisor',
            isAdmin: result.user.role === 'admin',
            timestamp: new Date().toISOString(),
            authenticated: true,
            backendAuth: true
          };

          setSelectedEmail('');
          setPassword('');
          onLoginSuccess(session);
          return;
        }
      }

      console.log('⚠️ Backend API login failed, trying fallback mode...');

      // If using fallback, simulate login for testing
      if (useFallback) {
        const supervisor = supervisors.find(s => s.email === selectedEmail);
        if (supervisor && password === 'testpassword') { // Test password for fallback mode
          const session = {
            id: supervisor.id,
            supervisorId: supervisor.id,
            name: supervisor.name,
            email: supervisor.email,
            depot: 'SDC',
            role: 'supervisor',
            isAdmin: supervisor.email === 'anthony.gair@gonortheast.co.uk',
            timestamp: new Date().toISOString(),
            authenticated: true,
            fallbackMode: true
          };

          setSelectedEmail('');
          setPassword('');
          onLoginSuccess(session);
          return;
        } else {
          throw new Error('Invalid login credentials (hint: testpassword)');
        }
      }

      // Last resort: Try Supabase authentication
      console.log('⚠️ Trying Supabase authentication as last resort...');
      const authResult = await authHelpers.signInWithPassword(selectedEmail, password);

      if (!authResult.supervisor) {
        throw new Error('Supervisor profile not found');
      }

      const session = {
        id: authResult.supervisor.id,
        supervisorId: authResult.supervisor.id,
        name: authResult.supervisor.name,
        email: authResult.supervisor.email,
        depot: 'SDC', // All supervisors work at SDC
        role: authResult.supervisor.role || 'supervisor',
        isAdmin: authResult.supervisor.role === 'admin',
        timestamp: new Date().toISOString(),
        authenticated: true,
        supabaseSession: authResult.session
      };

      // Clear form
      setSelectedEmail('');
      setPassword('');

      onLoginSuccess(session);
      
    } catch (err) {
      console.error('Login error:', err);
      if (err.message === 'Invalid login credentials') {
        setError(useFallback ? 'Invalid password (hint: testpassword)' : 'Invalid password');
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="header-login-form">
      {useFallback && (
        <div className="offline-indicator">
          ⚠️ Using offline supervisor list
        </div>
      )}
      <div className="header-login-inputs">
        <label htmlFor="supervisor-select">Supervisor:</label>
        <select
          id="supervisor-select"
          value={selectedEmail}
          onChange={(e) => setSelectedEmail(e.target.value)}
          className="header-select"
          disabled={loadingSupervisors || loading}
        >
          <option value="">Select SDC Supervisor</option>
          {supervisors.map((supervisor) => (
            <option key={supervisor.id} value={supervisor.email}>
              {supervisor.name}
            </option>
          ))}
        </select>
        
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="header-password"
          disabled={loading}
        />
        
        <button 
          type="submit" 
          className="header-login-btn"
          disabled={loading || !selectedEmail || !password}
        >
          {loading ? '...' : 'Login'}
        </button>
      </div>
      
      {error && error !== 'Using offline supervisor list' && (
        <div className="header-error">
          {error}
        </div>
      )}
    </form>
  );
};

export default HeaderLogin;
