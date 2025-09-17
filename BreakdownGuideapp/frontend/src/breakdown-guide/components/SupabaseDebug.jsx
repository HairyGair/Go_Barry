import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase-client.js';

const SupabaseDebug = () => {
    const [debugInfo, setDebugInfo] = useState({
        loading: true,
        envVars: {},
        connectionTest: null,
        supervisorsTest: null,
        authTest: null,
        error: null
    });

    useEffect(() => {
        runDebugTests();
    }, []);

    const runDebugTests = async () => {
        try {
            // Check environment variables
            const envVars = {
                supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
                hasAnonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
                anonKeyLength: import.meta.env.VITE_SUPABASE_ANON_KEY?.length || 0,
                nodeEnv: import.meta.env.NODE_ENV,
                mode: import.meta.env.MODE
            };

            console.log('🔍 Environment variables:', envVars);

            // Test 1: Basic connection
            let connectionTest = null;
            try {
                const { data, error } = await supabase
                    .from('supervisors')
                    .select('count', { count: 'exact', head: true });

                connectionTest = {
                    success: !error,
                    error: error?.message,
                    data: data
                };
            } catch (err) {
                connectionTest = {
                    success: false,
                    error: err.message,
                    data: null
                };
            }

            // Test 2: Supervisors table
            let supervisorsTest = null;
            if (connectionTest.success) {
                try {
                    const { data, error } = await supabase
                        .from('supervisors')
                        .select('name, email')
                        .limit(3);

                    supervisorsTest = {
                        success: !error,
                        error: error?.message,
                        count: data?.length || 0,
                        sample: data?.[0] || null
                    };
                } catch (err) {
                    supervisorsTest = {
                        success: false,
                        error: err.message,
                        count: 0,
                        sample: null
                    };
                }
            }

            // Test 3: Auth system
            let authTest = null;
            try {
                const { data, error } = await supabase.auth.getSession();
                authTest = {
                    success: !error,
                    error: error?.message,
                    hasSession: !!data.session
                };
            } catch (err) {
                authTest = {
                    success: false,
                    error: err.message,
                    hasSession: false
                };
            }

            setDebugInfo({
                loading: false,
                envVars,
                connectionTest,
                supervisorsTest,
                authTest,
                error: null
            });

        } catch (err) {
            setDebugInfo({
                loading: false,
                envVars: {},
                connectionTest: null,
                supervisorsTest: null,
                authTest: null,
                error: err.message
            });
        }
    };

    const StatusIcon = ({ success }) => (
        <span style={{ fontSize: '16px' }}>
            {success ? '✅' : '❌'}
        </span>
    );

    if (debugInfo.loading) {
        return (
            <div style={{
                position: 'fixed',
                top: '10px',
                right: '10px',
                background: '#1a1a1a',
                color: '#fff',
                padding: '15px',
                borderRadius: '8px',
                fontSize: '12px',
                border: '1px solid #333',
                maxWidth: '300px',
                zIndex: 9999
            }}>
                🔍 Testing Supabase connection...
            </div>
        );
    }

    return (
        <div style={{
            position: 'fixed',
            top: '10px',
            right: '10px',
            background: '#1a1a1a',
            color: '#fff',
            padding: '15px',
            borderRadius: '8px',
            fontSize: '11px',
            border: '1px solid #333',
            maxWidth: '350px',
            zIndex: 9999,
            maxHeight: '400px',
            overflowY: 'auto'
        }}>
            <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>
                🔍 Supabase Debug Info
            </div>

            <div style={{ marginBottom: '8px' }}>
                <strong>Environment:</strong><br/>
                URL: {debugInfo.envVars.supabaseUrl}<br/>
                Key: {debugInfo.envVars.hasAnonKey ? `✅ (${debugInfo.envVars.anonKeyLength} chars)` : '❌ Missing'}<br/>
                Mode: {debugInfo.envVars.mode}
            </div>

            <div style={{ marginBottom: '8px' }}>
                <StatusIcon success={debugInfo.connectionTest?.success} />
                <strong> Connection Test:</strong><br/>
                {debugInfo.connectionTest?.success ? (
                    '✅ Connected successfully'
                ) : (
                    <span style={{ color: '#ff6b6b' }}>
                        ❌ {debugInfo.connectionTest?.error || 'Failed'}
                    </span>
                )}
            </div>

            {debugInfo.supervisorsTest && (
                <div style={{ marginBottom: '8px' }}>
                    <StatusIcon success={debugInfo.supervisorsTest.success} />
                    <strong> Supervisors Table:</strong><br/>
                    {debugInfo.supervisorsTest.success ? (
                        <>
                            ✅ Found {debugInfo.supervisorsTest.count} supervisors<br/>
                            {debugInfo.supervisorsTest.sample && (
                                <span style={{ fontSize: '10px', color: '#ccc' }}>
                                    Sample: {debugInfo.supervisorsTest.sample.name}
                                </span>
                            )}
                        </>
                    ) : (
                        <span style={{ color: '#ff6b6b' }}>
                            ❌ {debugInfo.supervisorsTest.error}
                        </span>
                    )}
                </div>
            )}

            <div style={{ marginBottom: '8px' }}>
                <StatusIcon success={debugInfo.authTest?.success} />
                <strong> Auth System:</strong><br/>
                {debugInfo.authTest?.success ? (
                    '✅ Auth system working'
                ) : (
                    <span style={{ color: '#ff6b6b' }}>
                        ❌ {debugInfo.authTest?.error || 'Failed'}
                    </span>
                )}
            </div>

            <button
                onClick={runDebugTests}
                style={{
                    background: '#333',
                    color: '#fff',
                    border: '1px solid #555',
                    padding: '5px 10px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    cursor: 'pointer',
                    marginTop: '5px'
                }}
            >
                🔄 Retest
            </button>
        </div>
    );
};

export default SupabaseDebug;