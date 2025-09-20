import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Supabase client with enhanced error handling
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase configuration:');
  console.error('   SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.error('   SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
console.log('✅ Supabase client initialized');

// Verify Supabase connection on startup
async function verifySupabaseConnection() {
  try {
    console.log('🔍 Verifying Supabase connection...');
    
    // Test connection by checking breakdowns table
    const { data, error } = await supabase
      .from('breakdowns')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Supabase connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Supabase connection verified');
    console.log(`📊 Database accessible with ${data ? data.length : 0} test records found`);
    return true;
  } catch (err) {
    console.error('❌ Supabase connection error:', err.message);
    return false;
  }
}

// Parse allowed origins from environment variable
const getAllowedOrigins = () => {
  const envOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [];
  const defaultOrigins = [
    'http://localhost:3000',
    'http://localhost:8081',
    'http://localhost:19006',
    'http://localhost:5173',
    'https://dashboard.render.com',
    'https://breakdown-guide.onrender.com',
    'https://go-barry.onrender.com',
    'https://gobarry.co.uk',
    'https://www.gobarry.co.uk',
    'https://breakdowns.gobarry.co.uk',
    'https://www.breakdowns.gobarry.co.uk'
  ];

  const regexOrigins = [
    /\.onrender\.com$/,
    /\.render\.com$/,
    /\.gobarry\.co\.uk$/,
    /localhost:\d+$/
  ];

  return [...new Set([...defaultOrigins, ...envOrigins]), ...regexOrigins];
};

// Middleware
app.use(helmet());
app.use(cors({
  origin: getAllowedOrigins(),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'X-Kuma-Revision']
}));
app.use(express.json());
app.use(morgan('combined'));

// Enhanced health check endpoint with Supabase status
app.get('/health', async (req, res) => {
  try {
    // Check Supabase connection
    const { data, error } = await supabase
      .from('breakdowns')
      .select('id')
      .limit(1);
    
    const supabaseStatus = error ? 'disconnected' : 'connected';
    
    res.json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'breakdown-guide-api',
      supabase: {
        status: supabaseStatus,
        url: supabaseUrl,
        error: error ? error.message : null
      },
      environment: process.env.NODE_ENV || 'development',
      routes: {
        breakdowns: '/api/breakdowns',
        fleet: '/api/fleet',
        auth: '/api/auth',
        wizards: '/api/wizards',
        engineering: '/api/engineering',
        analytics: '/api/analytics'
      }
    });
  } catch (err) {
    res.status(503).json({ 
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'breakdown-guide-api',
      error: err.message,
      supabase: {
        status: 'error',
        url: supabaseUrl
      }
    });
  }
});

// Import routes
import breakdownRoutes from './routes/breakdowns.js';
import fleetRoutes from './routes/fleet.js';
import authRoutes from './routes/auth.js';
import wizardRoutes from './routes/wizards.js';
import engineeringRoutes from './routes/engineering.js';
import analyticsRoutes from './routes/analytics.js';
import activityRoutes from './routes/activity.js';

// API Routes
app.use('/api/breakdowns', breakdownRoutes);
app.use('/api/fleet', fleetRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/wizards', wizardRoutes);
app.use('/api/engineering', engineeringRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/activity', activityRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Enhanced error handler with Supabase error categorization
app.use((err, req, res, next) => {
  console.error('🔥 Server Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  });

  // Categorize error types
  let statusCode = 500;
  let errorType = 'internal_server_error';
  let userMessage = 'Internal server error';

  // Supabase-specific errors
  if (err.message && err.message.includes('JWT')) {
    statusCode = 401;
    errorType = 'authentication_error';
    userMessage = 'Authentication failed';
  } else if (err.message && err.message.includes('permission')) {
    statusCode = 403;
    errorType = 'permission_denied';
    userMessage = 'Access denied';
  } else if (err.message && err.message.includes('not found')) {
    statusCode = 404;
    errorType = 'resource_not_found';
    userMessage = 'Resource not found';
  } else if (err.message && (err.message.includes('duplicate') || err.message.includes('unique'))) {
    statusCode = 409;
    errorType = 'duplicate_resource';
    userMessage = 'Resource already exists';
  } else if (err.message && err.message.includes('connection')) {
    statusCode = 503;
    errorType = 'database_connection_error';
    userMessage = 'Database connection failed';
  }

  res.status(statusCode).json({ 
    error: errorType,
    message: userMessage,
    details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    timestamp: new Date().toISOString(),
    path: req.path
  });
});

// Start server with Supabase verification
app.listen(PORT, async () => {
  console.log(`🚀 Breakdown Guide API running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  
  // Verify Supabase connection
  const supabaseConnected = await verifySupabaseConnection();
  if (!supabaseConnected) {
    console.warn('⚠️  Starting server despite Supabase connection issues');
    console.warn('   Check your environment variables and network connection');
  }
  
  console.log('\n📋 Available API Routes:');
  console.log(`   POST   http://localhost:${PORT}/api/breakdowns - Create breakdown`);
  console.log(`   GET    http://localhost:${PORT}/api/breakdowns/live - Live breakdowns`);
  console.log(`   PUT    http://localhost:${PORT}/api/breakdowns/:id - Update breakdown`);
  console.log(`   GET    http://localhost:${PORT}/api/breakdowns/stats - Get stats`);
  console.log(`   GET    http://localhost:${PORT}/api/fleet/vehicles - Search vehicles`);
  console.log(`   GET    http://localhost:${PORT}/api/fleet/vehicle/:fleetNumber - Get vehicle`);
  console.log(`   POST   http://localhost:${PORT}/api/auth/login - Supervisor login`);
  console.log(`   POST   http://localhost:${PORT}/api/auth/verify - Verify session`);
  console.log('\n   📊 Engineering Routes:');
  console.log(`   GET    http://localhost:${PORT}/api/engineering/depot-stats - Depot statistics`);
  console.log(`   GET    http://localhost:${PORT}/api/engineering/engineers - All engineers`);
  console.log(`   GET    http://localhost:${PORT}/api/engineering/metrics - Performance metrics`);
  console.log(`   POST   http://localhost:${PORT}/api/engineering/assign - Assign engineer`);
  console.log(`   POST   http://localhost:${PORT}/api/engineering/auto-assign - Auto-assign`);
  console.log('\n   📈 Analytics Routes:');
  console.log(`   GET    http://localhost:${PORT}/api/analytics/kpis - Key performance indicators`);
  console.log(`   GET    http://localhost:${PORT}/api/analytics/trends - Performance trends`);
  console.log(`   GET    http://localhost:${PORT}/api/analytics/depot-comparison - Compare depots`);
  console.log(`   GET    http://localhost:${PORT}/api/analytics/fleet-health - Fleet health`);
  console.log('\n✅ Server ready for connections');
});

export { app, supabase };
