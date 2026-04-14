// Build timestamp: 2025-11-04 22:05:00 - Cache buster
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './styles/global-theme.css'  // Global theme colors
import './dashboards/dashboard-styles.css'
import './dashboards/dashboard-animations.css'
import './dashboards/engineering/engineering-override.css'  // Remove gradients
import 'leaflet/dist/leaflet.css'
import './styles/activity-feed-override.css'  // Override activity feed widget styles
import './styles/integrated-layout.css'  // Integrated layout improvements
import './styles/responsive.css'  // Tablet responsive breakpoints

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)

// Register PWA service worker
if ('serviceWorker' in navigator) {
  import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({
      onNeedRefresh() {
        // New content available — will auto-update on next load
        console.log('New version available');
      },
      onOfflineReady() {
        console.log('App ready to work offline');
      },
    });
  });
}
