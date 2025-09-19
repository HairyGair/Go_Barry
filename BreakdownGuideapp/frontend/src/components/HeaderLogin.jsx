import React, { useState, useEffect } from 'react';
import { authHelpers, supabase } from '../services/supabase-client.js';

// Hardcoded supervisor list as fallback
const FALLBACK_SUPERVISORS = [
  { id: '6a56f4cd-e6cf-4122-a97d-fecaa85df76a', name: 'Anthony Gair', email: 'anthony.gair@gonortheast.co.uk' },
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
      setError(''); // Clear any previous errors
      
      // Check if we should use fallback data
      const shouldUseFallback = localStorage.getItem('use_fallback_supervisors') === 'true';
      
      if (shouldUseFallback) {
        console.log('Using fallback supervisor data');
        setSupervisors(FALLBACK_SUPERVISORS);
        setUseFallback(true);
        return;
      }
      
      // Try to load from Supabase
      let { data, error } = await supabase
        .from('supervisors')
        .select('id, name, email')
        .order('name');
      
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        console.warn('No supervisors found in database, using fallback');
        setSupervisors(FALLBACK_SUPERVISORS);
        setUseFallback(true);
        localStorage.setItem('use_fallback_supervisors', 'true');
      } else {
        console.log('Loaded supervisors from database:', data);
        setSupervisors(data);
        setUseFallback(false);
      }
    } catch (err) {
      console.error('Error loading supervisors:', err);
      setError('Using offline supervisor list');
      setSupervisors(FALLBACK_SUPERVISORS);
      setUseFallback(true);
      localStorage.setItem('use_fallback_supervisors', 'true');
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
          throw new Error('Invalid login credentials');
        }
      }
      
      // Try Supabase authentication
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
