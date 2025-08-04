// webpack.config.js - Custom webpack configuration for Expo Web
const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);
  
  // Add proxy configuration for development
  if (config.mode === 'development') {
    config.devServer = {
      ...config.devServer,
      proxy: {
        '/api': {
          target: 'https://go-barry.onrender.com',
          changeOrigin: true,
          secure: false,
          logLevel: 'debug',
          onProxyReq: (proxyReq, req, res) => {
            console.log(`[Proxy] ${req.method} ${req.url} -> https://go-barry.onrender.com${req.url}`);
          },
          onProxyRes: (proxyRes, req, res) => {
            console.log(`[Proxy] Response: ${proxyRes.statusCode}`);
          },
          onError: (err, req, res) => {
            console.error('[Proxy] Error:', err);
          }
        }
      }
    };
  }
  
  return config;
};
