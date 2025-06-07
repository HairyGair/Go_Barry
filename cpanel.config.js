// Go_BARRY/cpanel.config.js
// cPanel-specific configuration for static web hosting

export const CPANEL_CONFIG = {
  // Production domain configuration
  domain: 'gobarry.co.uk',
  subdomain: 'www.gobarry.co.uk',
  
  // Backend API configuration
  apiUrl: 'https://api.gobarry.co.uk',
  
  // Build settings for cPanel
  build: {
    outputDir: 'dist',
    publicPath: '/',
    assetsDir: 'assets',
    indexPath: 'index.html'
  },
  
  // File upload settings
  upload: {
    targetDir: 'public_html',
    excludeFiles: [
      '*.map',
      '*.log',
      'node_modules',
      '.git',
      '.env*'
    ]
  },
  
  // Optimization settings
  optimization: {
    minify: true,
    splitChunks: true,
    serviceWorker: true,
    gzip: true
  },
  
  // cPanel-specific headers and redirects
  htaccess: {
    enableGzip: true,
    enableCaching: true,
    spa: true, // Single Page Application support
    cors: true
  }
};

export default CPANEL_CONFIG;
