// services/realTimeCongestionDetector.js
// Real-time congestion detection for GNE network using TomTom Flow API

import axios from 'axios';

class RealTimeCongestionDetector {
  constructor() {
    this.apiKey = process.env.TOMTOM_API_KEY;
    this.congestionThreshold = 0.8; // Speed must be 80% or less of free flow (more sensitive)
    this.redThreshold = 0.6; // Speed must be 60% or less for "red" status
    
    // Key locations across GNE network for monitoring
    this.monitoringPoints = [
      // Newcastle City Centre
      { name: 'Newcastle Central Station', lat: 54.9689, lng: -1.6174, routes: ['Q3', '10', '21', '22', '1', '12'] },
      { name: 'Grey Street/Grainger Street', lat: 54.9698, lng: -1.6125, routes: ['Q3', '10', '21', '22'] },
      { name: 'Clayton Street', lat: 54.9734, lng: -1.6139, routes: ['Q3', '10', '27', '28'] },
      
      // Gateshead
      { name: 'Gateshead Interchange', lat: 54.9626, lng: -1.6014, routes: ['53', '54', '27', '28'] },
      { name: 'High Street Gateshead', lat: 54.9629, lng: -1.6026, routes: ['53', '54', 'Q3'] },
      
      // Major Corridors
      { name: 'A167 Central Motorway', lat: 54.9456, lng: -1.6098, routes: ['21', '22', 'X21'] },
      { name: 'A1058 Coast Road', lat: 55.0089, lng: -1.4892, routes: ['1', '307', '309'] },
      { name: 'A19 Testos Roundabout', lat: 54.9798, lng: -1.5234, routes: ['1', '35', '36'] },
      
      // Sunderland
      { name: 'Sunderland City Centre', lat: 54.9069, lng: -1.3838, routes: ['16', '20', '61', '62'] },
      { name: 'A690 Sunderland Road', lat: 54.8867, lng: -1.4234, routes: ['61', '62', '63'] },
      
      // Durham
      { name: 'Durham Bus Station', lat: 54.7762, lng: -1.5747, routes: ['21', '22', 'X21'] },
      { name: 'A690 Durham Road', lat: 54.8234, lng: -1.5456, routes: ['21', '28'] }
    ];
  }

  async detectCongestion() {
    if (!this.apiKey) {
      console.warn('⚠️ TomTom API key not available for congestion detection');
      return { success: false, error: 'API key missing' };
    }

    console.log('🚦 Detecting real-time congestion across GNE network...');
    const congestionAlerts = [];
    
    try {
      // Check each monitoring point
      for (const point of this.monitoringPoints) {
        try {
          const flowData = await this.getTrafficFlow(point.lat, point.lng);
          
          if (flowData && flowData.currentSpeed && flowData.freeFlowSpeed) {
            const speedRatio = flowData.currentSpeed / flowData.freeFlowSpeed;
            const delayMinutes = Math.round((flowData.currentTravelTime - flowData.freeFlowTravelTime) / 60);
            
            // Determine congestion level
            let congestionLevel = 'green';
            let severity = 'Low';
            
            if (speedRatio <= this.redThreshold) {
              congestionLevel = 'red';
              severity = 'High';
            } else if (speedRatio <= this.congestionThreshold) {
              congestionLevel = 'amber';
              severity = 'Medium';
            }
            
            // Debug: Log all speed data
            console.log(`📍 ${point.name}: ${flowData.currentSpeed}/${flowData.freeFlowSpeed} km/h (${Math.round(speedRatio * 100)}%) - ${congestionLevel}`);
            
            // Create alert if congestion detected
            if (congestionLevel !== 'green') {
              const alert = {
                id: `congestion_${point.name.replace(/\s+/g, '_')}_${Date.now()}`,
                type: 'Traffic Congestion',
                title: `Heavy Congestion - ${point.name}`,
                description: `Traffic congestion detected at ${point.name}. Current speed: ${flowData.currentSpeed} km/h (${Math.round(speedRatio * 100)}% of normal). Estimated delay: ${delayMinutes} minutes.`,
                location: point.name,
                coordinates: { lat: point.lat, lng: point.lng },
                severity: severity,
                status: 'active',
                priority: congestionLevel === 'red' ? 'high' : 'medium',
                
                // Traffic specific data
                congestionLevel: congestionLevel,
                currentSpeed: flowData.currentSpeed,
                freeFlowSpeed: flowData.freeFlowSpeed,
                speedRatio: speedRatio,
                delayMinutes: delayMinutes,
                confidence: flowData.confidence || 0.8,
                
                // Route impact
                affectsRoutes: point.routes,
                routeImpact: {
                  level: congestionLevel === 'red' ? 'high' : 'medium',
                  routes: point.routes,
                  totalRoutes: point.routes.length
                },
                
                // Intelligence scoring (higher score for worse congestion)
                intelligenceScore: this.calculateIntelligenceScore(speedRatio, point.routes.length, delayMinutes),
                
                // Source info
                source: 'tomtom_flow',
                sourceType: 'real_time_congestion',
                lastUpdated: new Date().toISOString(),
                isTrafficIncident: true,
                autoGenerated: true
              };
              
              congestionAlerts.push(alert);
              console.log(`🔴 ${congestionLevel.toUpperCase()} congestion detected at ${point.name}: ${Math.round(speedRatio * 100)}% speed`);
            }
          }
          
          // Small delay to respect API limits
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (pointError) {
          console.warn(`⚠️ Failed to check congestion at ${point.name}:`, pointError.message);
        }
      }
      
      console.log(`✅ Congestion detection complete: ${congestionAlerts.length} alerts generated`);
      
      return {
        success: true,
        alerts: congestionAlerts,
        metadata: {
          total: congestionAlerts.length,
          pointsChecked: this.monitoringPoints.length,
          redCongestion: congestionAlerts.filter(a => a.congestionLevel === 'red').length,
          amberCongestion: congestionAlerts.filter(a => a.congestionLevel === 'amber').length,
          lastUpdated: new Date().toISOString()
        }
      };
      
    } catch (error) {
      console.error('❌ Congestion detection failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async getTrafficFlow(lat, lng) {
    try {
      const url = `https://api.tomtom.com/traffic/services/4/flowSegmentData/relative/10/json`;
      const params = {
        point: `${lat},${lng}`,
        unit: 'KMPH',
        openLr: false,
        key: this.apiKey
      };
      
      const response = await axios.get(url, { params, timeout: 5000 });
      return response.data.flowSegmentData;
      
    } catch (error) {
      if (error.response?.status === 403) {
        console.warn(`⚠️ TomTom Flow API access denied for ${lat},${lng} - upgrade API key needed`);
      } else {
        console.warn(`⚠️ TomTom Flow API error for ${lat},${lng}:`, error.message);
      }
      return null;
    }
  }
  
  calculateIntelligenceScore(speedRatio, routeCount, delayMinutes) {
    let score = 0;
    
    // Base score from speed reduction (0-50 points)
    score += (1 - speedRatio) * 50;
    
    // Route impact bonus (0-25 points)
    score += Math.min(routeCount * 3, 25);
    
    // Delay severity bonus (0-25 points)
    score += Math.min(delayMinutes * 2, 25);
    
    return Math.round(Math.min(score, 100));
  }
}

export default new RealTimeCongestionDetector();