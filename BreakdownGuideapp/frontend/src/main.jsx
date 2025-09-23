import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './styles/global-theme.css'  // Global theme colors
import './dashboards/dashboard-styles.css'
import './dashboards/dashboard-animations.css'
import './dashboards/breakdown/breakdown-styles.css'
import './dashboards/engineering/engineering-override.css'  // Remove gradients
import 'leaflet/dist/leaflet.css'
import './styles/activity-feed-override.css'  // Override activity feed widget styles
import './styles/integrated-layout.css'  // Integrated layout improvements

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
