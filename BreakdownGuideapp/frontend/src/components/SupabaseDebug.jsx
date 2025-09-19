import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase-client.js';

const SupabaseDebug = () => {
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [tableInfo, setTableInfo] = useState(null);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      // Try a simple query to check connection
      const { data, error, count } = await supabase
        .from('supervisors')
        .select('*', { count: 'exact', head: true });

      if (error) {
        setConnectionStatus(`Error: ${error.message}`);
      } else {
        setConnectionStatus(`Connected! Supervisors table has ${count || 0} records`);
      }

      // Get table schema info
      const { data: columns, error: schemaError } = await supabase
        .rpc('get_table_columns', { table_name: 'supervisors' })
        .catch(() => ({ data: null, error: 'Schema query not available' }));

      if (columns) {
        setTableInfo(columns);
      }
    } catch (err) {
      setConnectionStatus(`Connection failed: ${err.message}`);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      right: 20,
      background: 'black',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      maxWidth: '300px',
      zIndex: 9999
    }}>
      <div>Supabase Status: {connectionStatus}</div>
      <div style={{ marginTop: '5px' }}>
        URL: {import.meta.env.VITE_SUPABASE_URL || 'Not set'}
      </div>
      <button
        onClick={checkConnection}
        style={{
          marginTop: '5px',
          background: '#3b82f6',
          border: 'none',
          color: 'white',
          padding: '2px 8px',
          borderRadius: '3px',
          cursor: 'pointer'
        }}
      >
        Refresh
      </button>
    </div>
  );
};

export default SupabaseDebug;
