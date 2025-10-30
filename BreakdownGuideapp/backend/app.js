/**
 * Passenger-Compatible Entry Point for Go BARRY Backend
 *
 * This file serves as a CommonJS wrapper for the ES6 module server.js
 * to ensure compatibility with Phusion Passenger on cPanel shared hosting.
 *
 * Addresses:
 * - WebAssembly memory limitations on shared hosting
 * - ES6 module compatibility with Passenger
 * - Memory optimization for production environment
 */

// Set environment variables to optimize for shared hosting
process.env.NODE_OPTIONS = '--no-experimental-fetch --max-old-space-size=512';
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

console.log('🚀 Starting Go BARRY Backend via Passenger');
console.log('📍 Environment:', process.env.NODE_ENV);
console.log('💾 Memory limit: 512MB');
console.log('🔧 Node version:', process.version);

// Handle uncaught errors gracefully
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  // Don't exit in production - let Passenger manage restarts
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
});

// Dynamically import the ES6 module server
(async () => {
  try {
    console.log('📦 Loading server module...');

    // Import the ES6 module
    const serverModule = await import('./server.js');

    // The server should already be listening from server.js
    const app = serverModule.app;

    if (!app) {
      throw new Error('Server module did not export app');
    }

    console.log('✅ Server module loaded successfully');
    console.log('🎯 Application ready for Passenger');

  } catch (error) {
    console.error('❌ Failed to start server:', error);

    // If it's a WASM error, provide helpful guidance
    if (error.message && error.message.includes('WebAssembly')) {
      console.error('');
      console.error('🔍 WebAssembly Error Detected:');
      console.error('   This is caused by memory limitations on shared hosting.');
      console.error('   Possible solutions:');
      console.error('   1. Downgrade Node.js to v18 (LTS)');
      console.error('   2. Remove dependencies that use WASM');
      console.error('   3. Contact hosting provider for memory increase');
      console.error('');
    }

    // Exit with error code
    process.exit(1);
  }
})();
