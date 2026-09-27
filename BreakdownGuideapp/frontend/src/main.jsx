// Build timestamp: 2025-11-04 22:05:00 - Cache buster
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { initAppUpdates } from './services/appUpdate'
// Self-hosted brand fonts (latin subset) — Inter (UI), Outfit (display), JetBrains Mono (figures)
import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-500.css'
import '@fontsource/inter/latin-600.css'
import '@fontsource/inter/latin-700.css'
import '@fontsource/inter/latin-800.css'
import '@fontsource/outfit/latin-500.css'
import '@fontsource/outfit/latin-600.css'
import '@fontsource/outfit/latin-700.css'
import '@fontsource/outfit/latin-800.css'
import '@fontsource/jetbrains-mono/latin-400.css'
import '@fontsource/jetbrains-mono/latin-500.css'
import '@fontsource/jetbrains-mono/latin-600.css'
import '@fontsource/jetbrains-mono/latin-700.css'
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

// Service worker: poll for deploys and apply them when safe (see appUpdate.js)
initAppUpdates();
