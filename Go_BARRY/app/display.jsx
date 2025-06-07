// Go_BARRY/app/display.jsx
// Control Room Display - Beautiful HTML with maps and alerts

import React, { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';

const DisplayApp = () => {
  useEffect(() => {
    if (Platform.OS === 'web') {
      const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BARRY Enhanced Control Room - Maps Integration</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    
    <style>
        :root {
            --bg-primary: #0a0e16; --bg-secondary: #111827; --bg-card: rgba(17, 24, 39, 0.8);
            --bg-glass: rgba(255, 255, 255, 0.05); --border-glass: rgba(255, 255, 255, 0.1);
            --text-primary: #161616; --text-secondary: #222222; --text-muted: #444444; --text-bright: #ffffff;
            --accent-blue: #3b82f6; --accent-cyan: #06b6d4; --accent-purple: #8b5cf6; --accent-emerald: #10b981;
            --gne-red: #E31E24; --gne-red-dark: #B71C1C; --gne-red-light: #FF5252;
            --status-critical: #ef4444; --status-warning: #f59e0b; --status-success: #10b981; --status-info: #3b82f6;
            --shadow-glow: 0 0 30px rgba(227, 30, 36, 0.1); --shadow-card: 0 8px 32px rgba(0, 0, 0, 0.3);
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; background: linear-gradient(135deg, var(--bg-primary) 0%, #1a202c 100%); color: var(--text-primary); height: 100vh; overflow: hidden; font-size: 14px; position: relative; }
        .header { background: linear-gradient(135deg, var(--gne-red) 0%, var(--gne-red-dark) 100%); backdrop-filter: blur(20px); border-bottom: 2px solid var(--gne-red-light); padding: 16px 32px; display: grid; grid-template-columns: auto 1fr auto auto; gap: 32px; align-items: center; box-shadow: 0 8px 32px rgba(227, 30, 36, 0.3); position: relative; z-index: 100; }
        .logo-section { display: flex; align-items: center; gap: 20px; }
        .logo { display: flex; align-items: center; gap: 12px; }
        .logo img { height: 45px; width: auto; filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.3)); }
        .logo-fallback { display: flex; align-items: center; gap: 12px; font-size: 28px; font-weight: 800; color: var(--text-bright); text-shadow: 0 0 20px rgba(255, 255, 255, 0.3); }
        .system-health { display: flex; flex-direction: column; align-items: center; gap: 8px; }
        .health-indicator { display: flex; align-items: center; gap: 10px; padding: 10px 18px; background: rgba(255, 255, 255, 0.15); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 12px; font-size: 16px; font-weight: 600; color: #ffffff; }
        .system-metrics { display: flex; gap: 32px; font-size: 16px; color: rgba(255, 255, 255, 0.9); }
        .system-metric { text-align: center; min-width: 90px; }
        .metric-value { font-weight: 700; font-size: 24px; color: #ffffff; margin-bottom: 2px; }
        .metric-label { font-weight: 600; font-size: 13px; opacity: 0.9; text-transform: uppercase; letter-spacing: 0.5px; }
        .clock-section { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
        .clock { font-size: 28px; font-weight: 700; color: var(--text-bright); letter-spacing: 1px; font-variant-numeric: tabular-nums; text-shadow: 0 0 15px rgba(255, 255, 255, 0.4); }
        .last-update { font-size: 14px; color: rgba(255, 255, 255, 0.8); font-weight: 500; }
        .main-content { height: calc(100vh - 120px); display: grid; grid-template-columns: 450px 1fr; gap: 24px; padding: 20px 32px; }
        .alert-display-section { background: var(--bg-glass); backdrop-filter: blur(20px); border: 1px solid var(--border-glass); border-radius: 20px; padding: 32px; box-shadow: var(--shadow-card); overflow: hidden; position: relative; }
        .alert-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; z-index: 2; position: relative; }
        .alert-title { font-size: 20px; font-weight: 700; color: var(--text-bright); display: flex; align-items: center; gap: 12px; }
        .alert-count { background: linear-gradient(135deg, var(--accent-blue), var(--accent-cyan)); color: var(--text-bright); padding: 8px 20px; border-radius: 20px; font-size: 14px; font-weight: 700; border: 1px solid rgba(255, 255, 255, 0.2); }
        .current-alert { height: calc(100% - 100px); display: flex; align-items: center; justify-content: center; position: relative; }
        .alert-card { background: rgba(24, 35, 54, 0.85); backdrop-filter: blur(22px) saturate(1.5); border-radius: 28px; border: 2px solid rgba(255,255,255,0.2); box-shadow: 0 12px 50px 0 rgba(30, 58, 138, 0.25); padding: 24px; width: 100%; border-left: 10px solid var(--status-critical); position: relative; overflow: hidden; transition: all 0.3s ease; }
        .alert-card-title { font-size: 1.8em; font-weight: 700; margin-bottom: 16px; color: #fff; text-shadow: 0 3px 12px #23272f; z-index: 2; position: relative; line-height: 1.2; }
        .alert-card-location { font-size: 1.4em; font-weight: 600; margin-bottom: 14px; color: #fff; text-shadow: 0 2px 8px #1e40af; z-index: 2; position: relative; display: flex; align-items: center; gap: 8px; }
        .alert-card-description { font-size: 1.1em; font-weight: 500; margin-bottom: 16px; color: #fff; text-shadow: 0 1px 4px #000; z-index: 2; position: relative; line-height: 1.3; }
        .full-map-container { background: var(--bg-glass); backdrop-filter: blur(20px); border: 1px solid var(--border-glass); border-radius: 20px; padding: 24px; box-shadow: var(--shadow-card); position: relative; overflow: hidden; }
        .map-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; z-index: 10; position: relative; }
        .map-title { font-size: 18px; font-weight: 700; color: var(--text-bright); display: flex; align-items: center; gap: 12px; }
        #map { height: calc(100% - 80px); border-radius: 16px; border: 2px solid rgba(255, 255, 255, 0.1); position: relative; z-index: 1; }
        .loading { display: flex; align-items: center; justify-content: center; padding: 60px; color: var(--text-muted); gap: 16px; }
        .spinner { width: 36px; height: 36px; border: 4px solid rgba(255, 255, 255, 0.1); border-top: 4px solid var(--accent-blue); border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .no-alerts { text-align: center; padding: 80px 20px; color: var(--text-muted); }
        .no-alerts i { font-size: 84px; margin-bottom: 32px; color: var(--status-success); }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo-section">
            <div class="logo">
                <img src="../gobarry-logo.png" alt="Go Barry" onerror="this.style.display='none'; document.getElementById('logo-fallback').style.display='flex';">
                <div id="logo-fallback" class="logo-fallback" style="display: none;">
                    <i class="fas fa-traffic-light"></i>
                    <span>BARRY Control</span>
                </div>
            </div>
        </div>
        
        <div class="system-health">
            <div class="health-indicator">
                <span id="system-status-text">OPERATIONAL</span>
            </div>
            <div class="system-metrics">
                <div class="system-metric">
                    <div class="metric-value" id="header-total-alerts">0</div>
                    <div class="metric-label">Total Alerts</div>
                </div>
                <div class="system-metric">
                    <div class="metric-value" id="header-critical">0</div>
                    <div class="metric-label">Critical</div>
                </div>
                <div class="system-metric">
                    <div class="metric-value" id="header-routes">0</div>
                    <div class="metric-label">Routes Affected</div>
                </div>
                <div class="system-metric">
                    <div class="metric-value" id="header-map-alerts">0</div>
                    <div class="metric-label">On Map</div>
                </div>
                <div class="system-metric">
                    <div class="metric-value" id="header-supervisors">0</div>
                    <div class="metric-label">Supervisors</div>
                </div>
            </div>
        </div>

        <div class="clock-section">
            <div class="clock" id="clock">--:--:--</div>
            <div class="last-update" id="last-update">Last Update: --:--</div>
        </div>
    </div>

    <div class="main-content">
        <div class="alert-display-section">
            <div class="alert-header">
                <div class="alert-title">
                    <i class="fas fa-satellite-dish"></i>
                    <span>Live Traffic Intelligence</span>
                </div>
                <div class="alert-count" id="alert-count">0</div>
            </div>
            <div class="current-alert" id="current-alert">
                <div class="loading">
                    <div class="spinner"></div>
                    <span>Initializing traffic intelligence...</span>
                </div>
            </div>
        </div>

        <div class="full-map-container">
            <div class="map-header">
                <div class="map-title">
                    <i class="fas fa-map"></i>
                    <span>Live Traffic Map - North East England</span>
                </div>
            </div>
            <div id="map"></div>
        </div>
    </div>

    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    
    <script>
        const API_BASE_URL = window.location.hostname === 'localhost' ? 'http://localhost:3001' : 'https://go-barry.onrender.com';
        let map, alertMarkers = [], currentAlerts = [], alertIndex = 0, alertCycleTimer = null;
        let activeSupervisors = [];
        const NORTH_EAST_BOUNDS = { center: [54.9783, -1.6178], bounds: [[53.5, -3.0], [56.0, -0.5]], zoom: 12 };
        
        function initializeMap() {
            console.log('Initializing interactive map...');
            map = L.map('map').setView(NORTH_EAST_BOUNDS.center, NORTH_EAST_BOUNDS.zoom);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: 'OpenStreetMap contributors | BARRY Traffic Intelligence',
                maxZoom: 18
            }).addTo(map);
            console.log('Map initialized with North East England coverage');
        }
        
        function clearMapMarkers() {
            alertMarkers.forEach(marker => map.removeLayer(marker));
            alertMarkers = [];
        }
        
        function addAlertToMap(alert, index) {
            if (!alert.coordinates || alert.coordinates.length !== 2) return;
            const lat = alert.coordinates[0];
            const lng = alert.coordinates[1];
            const iconColor = alert.severity === 'High' ? '#ef4444' : alert.severity === 'Medium' ? '#f59e0b' : '#10b981';
            const customIcon = L.divIcon({
                className: 'custom-alert-marker',
                html: '<div style="background: ' + iconColor + '; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 3px 10px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px;">!</div>',
                iconSize: [34, 34],
                iconAnchor: [17, 17]
            });
            const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
            alertMarkers.push(marker);
        }
        
        function createAlertCard(alert) {
            const routeBadges = alert.affectsRoutes && alert.affectsRoutes.length > 0
                ? alert.affectsRoutes.map(route => '<span class="route-badge">' + route + '</span>').join('')
                : '<span class="route-badge" style="opacity: 0.6;">No routes identified</span>';
            
            const startTime = alert.startDate
                ? new Date(alert.startDate).toLocaleString('en-GB', {
                    weekday: 'short', month: 'short', day: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                })
                : 'Time unknown';
            
            const authority = alert.authority || alert.source || 'Unknown authority';
            const incidentType = alert.type === 'roadwork' ? 'Road Works' : 'Traffic Incident';
            
            return '<div class="alert-card">' +
                '<div class="alert-card-title">' + (alert.title || 'Traffic Alert') + '</div>' +
                '<div class="alert-card-location"><i class="fas fa-map-marker-alt"></i>' + (alert.location || 'Location not specified') + '</div>' +
                '<div class="alert-card-description">' + (alert.description || incidentType + ' reported') + '</div>' +
                '</div>';
        }
        
        async function fetchAlerts() {
            try {
                console.log('Fetching alerts with cache busting...');
                const url = API_BASE_URL + '/api/alerts-enhanced?t=' + Date.now() + '&no_cache=true';
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json'
                    }
                });
                
                const data = await response.json();
                
                if (data.success && data.alerts) {
                    const filteredAlerts = data.alerts.filter(alert => {
                        if (alert.id && (alert.id.includes('barry_v3') || alert.id.includes('sample') || alert.source === 'go_barry_v3' || alert.enhanced === true)) {
                            console.warn('Display filtered sample alert:', alert.id);
                            return false;
                        }
                        return true;
                    });
                    
                    currentAlerts = filteredAlerts;
                    updateAlertsDisplay(currentAlerts);
                    updateMapWithAlerts(currentAlerts);
                    updateAnalytics(data.metadata);
                    
                    console.log('Display alerts updated: ' + data.alerts.length + ' to ' + filteredAlerts.length + ' (filtered ' + (data.alerts.length - filteredAlerts.length) + ' samples)');
                    document.getElementById('last-update').textContent = 'Last Update: ' + new Date().toLocaleTimeString('en-GB', { hour12: false, hour: '2-digit', minute: '2-digit' });
                } else {
                    throw new Error('Invalid response format');
                }
            } catch (error) {
                console.error('Error fetching alerts:', error);
                showErrorState();
            }
        }
        
        async function fetchSupervisors() {
            try {
                const response = await fetch(API_BASE_URL + '/api/supervisor/active');
                if (response.ok) {
                    const data = await response.json();
                    activeSupervisors = data.activeSupervisors || [];
                    updateSupervisorDisplay(activeSupervisors);
                }
            } catch (error) {
                activeSupervisors = [];
                updateSupervisorDisplay([]);
            }
        }
        
        function updateSupervisorDisplay(supervisors) {
            document.getElementById('header-supervisors').textContent = supervisors.length;
        }
        
        function updateMapWithAlerts(alerts) {
            clearMapMarkers();
            const mappableAlerts = alerts.filter(alert => alert.coordinates && alert.coordinates.length === 2);
            mappableAlerts.forEach((alert, index) => {
                addAlertToMap(alert, alerts.indexOf(alert));
            });
            document.getElementById('header-map-alerts').textContent = mappableAlerts.length;
        }
        
        function updateAnalytics(metadata) {
            const criticalCount = currentAlerts.filter(a => a.status === 'red' && a.severity === 'High').length;
            const affectedRoutesCount = new Set(currentAlerts.flatMap(a => a.affectsRoutes || [])).size;
            
            document.getElementById('header-total-alerts').textContent = currentAlerts.length;
            document.getElementById('header-critical').textContent = criticalCount;
            document.getElementById('header-routes').textContent = affectedRoutesCount;
            document.getElementById('alert-count').textContent = currentAlerts.length;
        }
        
        function showErrorState() {
            const alertContainer = document.getElementById('current-alert');
            alertContainer.innerHTML = '<div style="text-align: center; padding: 80px; color: var(--text-muted);"><i class="fas fa-exclamation-triangle" style="font-size: 84px; margin-bottom: 32px; color: var(--status-warning);"></i><h3 style="font-size: 24px; margin-bottom: 16px;">Connection Error</h3><p style="font-size: 16px;">Unable to fetch traffic alerts. Retrying...</p></div>';
        }
        
        function updateAlertsDisplay(alerts) {
            const alertContainer = document.getElementById('current-alert');
            
            if (alerts.length === 0) {
                alertContainer.innerHTML = '<div class="no-alerts"><i class="fas fa-shield-check"></i><h3 style="font-size: 28px; margin-bottom: 16px;">All Systems Clear</h3><p style="font-size: 18px;">No active traffic alerts detected</p></div>';
                clearAlertCycle();
                return;
            }
            
            currentAlerts = alerts;
            alertIndex = 0;
            renderCurrentAlert();
            startAlertCycle();
        }
        
        function renderCurrentAlert() {
            const alertContainer = document.getElementById('current-alert');
            
            if (!currentAlerts || currentAlerts.length === 0) {
                alertContainer.innerHTML = '';
                return;
            }
            
            const alert = currentAlerts[alertIndex % currentAlerts.length];
            alertContainer.innerHTML = createAlertCard(alert);
            
            if (alert.coordinates && alert.coordinates.length === 2) {
                const lat = alert.coordinates[0];
                const lng = alert.coordinates[1];
                map.setView([lat, lng], 16, { animate: true, duration: 1 });
            }
        }
        
        function startAlertCycle() {
            clearAlertCycle();
            
            if (!currentAlerts || currentAlerts.length <= 1) return;
            
            alertCycleTimer = setInterval(() => {
                alertIndex = (alertIndex + 1) % currentAlerts.length;
                renderCurrentAlert();
            }, 20000);
        }
        
        function clearAlertCycle() {
            if (alertCycleTimer) {
                clearInterval(alertCycleTimer);
                alertCycleTimer = null;
            }
        }
        
        function updateClock() {
            const now = new Date();
            const timeString = now.toLocaleTimeString('en-GB', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            document.getElementById('clock').textContent = timeString;
        }
        
        function init() {
            console.log('BARRY Enhanced Control Room with Maps Initializing...');
            
            initializeMap();
            updateClock();
            setInterval(updateClock, 1000);
            
            fetchAlerts();
            fetchSupervisors();
            
            setInterval(fetchAlerts, 30000);
            setInterval(fetchSupervisors, 15000);
            
            console.log('BARRY Control Room with Maps Ready');
        }
        
        document.addEventListener('DOMContentLoaded', init);
        
        document.addEventListener('keydown', (event) => {
            if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
                event.preventDefault();
                fetchAlerts();
            }
            
            if (event.key === 'ArrowLeft' && currentAlerts.length > 1) {
                alertIndex = (alertIndex - 1 + currentAlerts.length) % currentAlerts.length;
                renderCurrentAlert();
            }
            
            if (event.key === 'ArrowRight' && currentAlerts.length > 1) {
                alertIndex = (alertIndex + 1) % currentAlerts.length;
                renderCurrentAlert();
            }
        });
    </script>
</body>
</html>`;
      
      document.open();
      document.write(htmlContent);
      document.close();
    }
  }, []);

  return (
    <View style={styles.container}>
      {/* This will be replaced by the HTML content on web */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e16',
  },
});

export default DisplayApp;