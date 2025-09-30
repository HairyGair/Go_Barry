// Constants and configuration

// Color palette
export const colors = { 
    navy: '#1a2b5a',
    navyDark: '#003B5C',
    red: '#dc2626',
    redGNE: '#E4002B',
    amber: '#ffa500',
    green: '#28a745',
    gray: '#666666',
    lightGray: '#e0e0e0'
};

// Breakdowns
export const breakdownConfig = {
    idFormat: 'BD-YYYY-NNNNN',
    costPerMinute: 8.50,
    targetAssessmentTime: 180, // 3 minutes in seconds
    priorityServices: ['X10', 'X21', '307', '1']
};

// API Configuration
export const apiConfig = {
    baseUrl: import.meta.env.VITE_API_URL || 'https://breakdown-guide.onrender.com',
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY
};

// WebSocket Configuration
export const websocketConfig = {
    url: import.meta.env.VITE_WS_URL || 'wss://breakdown-guide.onrender.com',
    endpoints: {
        sdcDashboard: '/ws?channel=sdc-dashboard',
        breakdowns: '/ws?channel=breakdowns',
        assessments: '/ws?channel=assessments',
        activities: '/ws?channel=activities'
    },
    reconnectAttempts: 5,
    reconnectInterval: 3000, // 3 seconds
    heartbeatInterval: 30000, // 30 seconds
    connectionTimeout: 10000, // 10 seconds
    retryBackoff: {
        initial: 1000,
        max: 30000,
        factor: 1.5
    },
    features: {
        autoReconnect: true,
        heartbeat: true,
        compression: true,
        binaryFrames: false
    }
};

// Real-time Configuration
export const realtimeConfig = {
    pollingInterval: 5000, // 5 seconds fallback polling
    maxPollingInterval: 30000, // 30 seconds max
    adaptivePolling: true,
    connectionModes: ['websocket', 'polling'],
    fallbackMode: 'polling',
    hybridMode: true, // Use both WebSocket and polling
    retryStrategies: {
        exponentialBackoff: true,
        maxRetries: 10,
        baseDelay: 1000
    }
};

// Default export
const constants = {
    colors,
    breakdownConfig,
    apiConfig,
    websocketConfig,
    realtimeConfig
};

export default constants;
