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

// Default export
const constants = {
    colors,
    breakdownConfig,
    apiConfig
};

export default constants;
