/*
 * Go Barry - Geographic Heatmap Component
 * Interactive map with incident hotspots and route visualization
 */

import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { statisticsTheme } from '../../styles/statistics.styles.js';

const GeographicHeatmap = ({ 
  timeRange = 'today',
  loading = false,
  data,
  onHotspotClick,
  showRoutes = true,
  showLegend = true 
}) => {
  const [viewMode, setViewMode] = useState('heatmap'); // 'heatmap', 'routes', 'both'
  const [selectedArea, setSelectedArea] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(2);
  const [mapCenter, setMapCenter] = useState({ lat: 54.9783, lng: -1.6174 }); // Newcastle center

  // Mock geographic data for demonstration
  const [mockData, setMockData] = useState([]);

  useEffect(() => {
    const generateMockHotspots = () => {
      const areas = [
        { name: 'Newcastle City Centre', lat: 54.9783, lng: -1.6174, incidents: 15, severity: 'high' },
        { name: 'Gateshead', lat: 54.9526, lng: -1.6019, incidents: 8, severity: 'medium' },
        { name: 'Sunderland', lat: 54.9063, lng: -1.3820, incidents: 6, severity: 'low' },
        { name: 'Durham', lat: 54.7753, lng: -1.5849, incidents: 12, severity: 'high' },
        { name: 'Cramlington', lat: 55.0874, lng: -1.5889, incidents: 4, severity: 'low' },
        { name: 'Consett', lat: 54.8519, lng: -1.8312, incidents: 7, severity: 'medium' },
        { name: 'Washington', lat: 54.9000, lng: -1.5197, incidents: 9, severity: 'medium' },
        { name: 'Chester-le-Street', lat: 54.8564, lng: -1.5714, incidents: 5, severity: 'low' },
        { name: 'Hexham', lat: 54.9717, lng: -2.1030, incidents: 3, severity: 'low' },
        { name: 'North Shields', lat: 55.0174, lng: -1.4481, incidents: 11, severity: 'high' }
      ];

      return areas.map(area => ({
        ...area,
        id: area.name.toLowerCase().replace(/\s+/g, '_'),
        routes: generateRouteData(area.name),
        recentIncidents: generateIncidentHistory(area.incidents)
      }));
    };

    const generateRouteData = (areaName) => {
      const routesByArea = {
        'Newcastle City Centre': ['1', '2', '21', '22', 'Q3', 'X21'],
        'Gateshead': ['21', '93', '94', 'X66'],
        'Sunderland': ['2', '20', '35', '99'],
        'Durham': ['21', '43', '44', 'X12'],
        'Cramlington': ['43', '44', '52'],
        'Consett': ['X30', 'X31', 'X70'],
        'Washington': ['4', '8', '82', '85'],
        'Chester-le-Street': ['21', '28', '34'],
        'Hexham': ['X84', 'X85', '680'],
        'North Shields': ['1', '11', '41', '42']
      };

      return routesByArea[areaName] || ['21'];
    };

    const generateIncidentHistory = (count) => {
      const incidents = [];
      const now = new Date();
      
      for (let i = 0; i < count; i++) {
        const time = new Date(now.getTime() - (Math.random() * 24 * 60 * 60 * 1000));
        incidents.push({
          id: `inc_${i + 1}`,
          time: time.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
          type: ['Traffic', 'Roadwork', 'Incident', 'Weather'][Math.floor(Math.random() * 4)],
          severity: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)]
        });
      }
      
      return incidents.sort((a, b) => new Date(`2000/01/01 ${b.time}`) - new Date(`2000/01/01 ${a.time}`));
    };

    setMockData(generateMockHotspots());
  }, [timeRange]);

  const mapData = data || mockData;

  // Calculate intensity for heatmap colors
  const maxIncidents = Math.max(...mapData.map(item => item.incidents));
  
  const getHotspotColor = (incidents, severity) => {
    const intensity = incidents / maxIncidents;
    
    if (severity === 'high') {
      return `rgba(239, 68, 68, ${0.3 + intensity * 0.7})`;
    } else if (severity === 'medium') {
      return `rgba(245, 158, 11, ${0.3 + intensity * 0.7})`;
    } else {
      return `rgba(16, 185, 129, ${0.3 + intensity * 0.7})`;
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'high': return 'alert-circle';
      case 'medium': return 'alert';
      case 'low': return 'information';
      default: return 'map-marker';
    }
  };

  const renderWebMap = () => {
    // For web, render an interactive SVG map
    const mapWidth = 600;
    const mapHeight = 400;
    
    return (
      <View style={styles.webMapContainer}>
        <svg width={mapWidth} height={mapHeight} style={styles.svg}>
          {/* Map Background */}
          <rect 
            width={mapWidth} 
            height={mapHeight} 
            fill="#F3F4F6" 
            stroke="#E5E7EB"
            strokeWidth="1"
          />
          
          {/* Grid Lines */}
          {[1, 2, 3, 4].map(i => (
            <g key={`grid-${i}`}>
              <line
                x1={i * (mapWidth / 5)}
                y1={0}
                x2={i * (mapWidth / 5)}
                y2={mapHeight}
                stroke="#E5E7EB"
                strokeWidth="1"
                strokeDasharray="2,2"
              />
              <line
                x1={0}
                y1={i * (mapHeight / 5)}
                x2={mapWidth}
                y2={i * (mapHeight / 5)}
                stroke="#E5E7EB"
                strokeWidth="1"
                strokeDasharray="2,2"
              />
            </g>
          ))}
          
          {/* Area Labels */}
          <text x={mapWidth / 2} y={30} textAnchor="middle" fontSize="16" fontWeight="bold" fill="#374151">
            Go North East Coverage Area
          </text>
          <text x={100} y={60} fontSize="12" fill="#6B7280">Newcastle</text>
          <text x={200} y={100} fontSize="12" fill="#6B7280">Gateshead</text>
          <text x={450} y={80} fontSize="12" fill="#6B7280">Sunderland</text>
          <text x={300} y={300} fontSize="12" fill="#6B7280">Durham</text>
          
          {/* Hotspots */}
          {mapData.map((hotspot, index) => {
            const x = 100 + (index % 3) * 150 + Math.random() * 100;
            const y = 100 + Math.floor(index / 3) * 80 + Math.random() * 50;
            const radius = 8 + (hotspot.incidents / maxIncidents) * 15;
            
            return (
              <g key={hotspot.id}>
                {/* Hotspot Circle */}
                <circle
                  cx={x}
                  cy={y}
                  r={radius}
                  fill={getHotspotColor(hotspot.incidents, hotspot.severity)}
                  stroke={
                    hotspot.severity === 'high' ? statisticsTheme.charts.danger :
                    hotspot.severity === 'medium' ? statisticsTheme.charts.warning :
                    statisticsTheme.charts.secondary
                  }
                  strokeWidth="2"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedArea(hotspot)}
                />
                
                {/* Hotspot Label */}
                <text
                  x={x}
                  y={y + radius + 15}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#374151"
                  fontWeight="500"
                >
                  {hotspot.name.split(' ')[0]}
                </text>
                
                {/* Incident Count */}
                <text
                  x={x}
                  y={y + 3}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="bold"
                  fill={
                    hotspot.severity === 'high' ? '#FFFFFF' :
                    hotspot.severity === 'medium' ? '#000000' :
                    '#FFFFFF'
                  }
                >
                  {hotspot.incidents}
                </text>
              </g>
            );
          })}
          
          {/* Route Lines (if enabled) */}
          {showRoutes && viewMode !== 'heatmap' && (
            <g>
              {/* Major route indicators */}
              <line x1={50} y1={150} x2={550} y2={150} stroke={statisticsTheme.charts.primary} strokeWidth="3" strokeDasharray="5,5" />
              <line x1={150} y1={50} x2={150} y2={350} stroke={statisticsTheme.charts.secondary} strokeWidth="2" strokeDasharray="3,3" />
              <line x1={300} y1={50} x2={450} y2={300} stroke={statisticsTheme.charts.info} strokeWidth="2" strokeDasharray="3,3" />
            </g>
          )}
        </svg>
        
        {/* Map Controls */}
        <View style={styles.mapControls}>
          <TouchableOpacity 
            style={styles.mapControlButton}
            onPress={() => setZoomLevel(Math.min(zoomLevel + 1, 5))}
          >
            <MaterialCommunityIcons name="plus" size={16} color={statisticsTheme.colors.textPrimary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.mapControlButton}
            onPress={() => setZoomLevel(Math.max(zoomLevel - 1, 1))}
          >
            <MaterialCommunityIcons name="minus" size={16} color={statisticsTheme.colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderMobileList = () => {
    // Mobile fallback - area list with statistics
    return (
      <ScrollView style={styles.mobileList} showsVerticalScrollIndicator={false}>
        {mapData.map((area) => (
          <TouchableOpacity
            key={area.id}
            style={[
              styles.areaCard,
              selectedArea?.id === area.id && styles.areaCardSelected
            ]}
            onPress={() => setSelectedArea(selectedArea?.id === area.id ? null : area)}
          >
            <View style={styles.areaHeader}>
              <View style={styles.areaInfo}>
                <MaterialCommunityIcons 
                  name={getSeverityIcon(area.severity)} 
                  size={20} 
                  color={
                    area.severity === 'high' ? statisticsTheme.charts.danger :
                    area.severity === 'medium' ? statisticsTheme.charts.warning :
                    statisticsTheme.charts.secondary
                  }
                />
                <View style={styles.areaNameContainer}>
                  <Text style={styles.areaName}>{area.name}</Text>
                  <Text style={styles.areaRoutes}>
                    Routes: {area.routes.join(', ')}
                  </Text>
                </View>
              </View>
              
              <View style={styles.areaStats}>
                <Text style={styles.incidentCount}>{area.incidents}</Text>
                <Text style={styles.incidentLabel}>incidents</Text>
              </View>
            </View>
            
            {selectedArea?.id === area.id && (
              <View style={styles.areaDetails}>
                <View style={styles.recentIncidents}>
                  <Text style={styles.detailsTitle}>Recent Incidents</Text>
                  {area.recentIncidents.slice(0, 3).map((incident, index) => (
                    <View key={incident.id} style={styles.incidentItem}>
                      <Text style={styles.incidentTime}>{incident.time}</Text>
                      <Text style={styles.incidentType}>{incident.type}</Text>
                      <Text style={[
                        styles.incidentSeverity,
                        {
                          color: incident.severity === 'High' ? statisticsTheme.charts.danger :
                                 incident.severity === 'Medium' ? statisticsTheme.charts.warning :
                                 statisticsTheme.charts.secondary
                        }
                      ]}>
                        {incident.severity}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  const renderLegend = () => {
    if (!showLegend) return null;

    return (
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Legend</Text>
        
        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: statisticsTheme.charts.danger }]} />
            <Text style={styles.legendText}>High Severity (10+ incidents)</Text>
          </View>
          
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: statisticsTheme.charts.warning }]} />
            <Text style={styles.legendText}>Medium Severity (5-9 incidents)</Text>
          </View>
          
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: statisticsTheme.charts.secondary }]} />
            <Text style={styles.legendText}>Low Severity (1-4 incidents)</Text>
          </View>
        </View>
        
        {showRoutes && (
          <View style={styles.routeLegend}>
            <Text style={styles.legendSubtitle}>Route Types</Text>
            <View style={styles.legendItem}>
              <View style={[styles.routeLine, { backgroundColor: statisticsTheme.charts.primary }]} />
              <Text style={styles.legendText}>Major Routes (21, X21)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.routeLine, { backgroundColor: statisticsTheme.charts.secondary }]} />
              <Text style={styles.legendText}>City Routes (1, 2, Q3)</Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderViewControls = () => (
    <View style={styles.viewControls}>
      <Text style={styles.controlsTitle}>View Mode</Text>
      <View style={styles.viewButtons}>
        {[
          { key: 'heatmap', label: 'Heatmap', icon: 'fire' },
          { key: 'routes', label: 'Routes', icon: 'routes' },
          { key: 'both', label: 'Combined', icon: 'layers' }
        ].map((mode) => (
          <TouchableOpacity
            key={mode.key}
            style={[
              styles.viewButton,
              viewMode === mode.key && styles.viewButtonActive
            ]}
            onPress={() => setViewMode(mode.key)}
          >
            <MaterialCommunityIcons 
              name={mode.icon} 
              size={14} 
              color={viewMode === mode.key ? '#FFFFFF' : statisticsTheme.colors.textSecondary}
            />
            <Text style={[
              styles.viewButtonText,
              viewMode === mode.key && styles.viewButtonTextActive
            ]}>
              {mode.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStats = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <Text style={styles.statValue}>
          {mapData.reduce((sum, area) => sum + area.incidents, 0)}
        </Text>
        <Text style={styles.statLabel}>Total Incidents</Text>
      </View>
      
      <View style={styles.statCard}>
        <Text style={styles.statValue}>
          {mapData.filter(area => area.severity === 'high').length}
        </Text>
        <Text style={styles.statLabel}>High Priority Areas</Text>
      </View>
      
      <View style={styles.statCard}>
        <Text style={styles.statValue}>
          {new Set(mapData.flatMap(area => area.routes)).size}
        </Text>
        <Text style={styles.statLabel}>Affected Routes</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialCommunityIcons 
          name="loading" 
          size={32} 
          color={statisticsTheme.colors.textSecondary}
          style={styles.loadingIcon}
        />
        <Text style={styles.loadingText}>Loading geographic data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.title}>🗺️ Geographic Incident Analysis</Text>
          <Text style={styles.subtitle}>
            Incident hotspots and route impact visualization for {timeRange}
          </Text>
        </View>
        
        {Platform.OS === 'web' && renderViewControls()}
      </View>

      {renderStats()}

      <View style={styles.mapSection}>
        {Platform.OS === 'web' ? renderWebMap() : renderMobileList()}
        {renderLegend()}
      </View>

      {/* Selected Area Details */}
      {selectedArea && (
        <View style={styles.selectedAreaPanel}>
          <View style={styles.selectedAreaHeader}>
            <MaterialCommunityIcons 
              name={getSeverityIcon(selectedArea.severity)} 
              size={20} 
              color={
                selectedArea.severity === 'high' ? statisticsTheme.charts.danger :
                selectedArea.severity === 'medium' ? statisticsTheme.charts.warning :
                statisticsTheme.charts.secondary
              }
            />
            <Text style={styles.selectedAreaTitle}>{selectedArea.name}</Text>
            <TouchableOpacity onPress={() => setSelectedArea(null)}>
              <MaterialCommunityIcons 
                name="close" 
                size={16} 
                color={statisticsTheme.colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
          
          <View style={styles.selectedAreaContent}>
            <View style={styles.selectedAreaStats}>
              <View style={styles.selectedStat}>
                <Text style={styles.selectedStatValue}>{selectedArea.incidents}</Text>
                <Text style={styles.selectedStatLabel}>Incidents</Text>
              </View>
              <View style={styles.selectedStat}>
                <Text style={styles.selectedStatValue}>{selectedArea.routes.length}</Text>
                <Text style={styles.selectedStatLabel}>Routes</Text>
              </View>
              <View style={styles.selectedStat}>
                <Text style={[
                  styles.selectedStatValue,
                  {
                    color: selectedArea.severity === 'high' ? statisticsTheme.charts.danger :
                           selectedArea.severity === 'medium' ? statisticsTheme.charts.warning :
                           statisticsTheme.charts.secondary
                  }
                ]}>
                  {selectedArea.severity.toUpperCase()}
                </Text>
                <Text style={styles.selectedStatLabel}>Severity</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: statisticsTheme.colors.cardBg,
    borderRadius: statisticsTheme.borderRadius.md,
    padding: statisticsTheme.spacing.lg,
    marginBottom: statisticsTheme.spacing.md,
    ...statisticsTheme.shadows.sm,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: statisticsTheme.spacing.lg,
    flexWrap: 'wrap',
    gap: statisticsTheme.spacing.md,
  },

  headerInfo: {
    flex: 1,
  },

  title: {
    fontSize: 18,
    fontWeight: '600',
    color: statisticsTheme.colors.textPrimary,
    marginBottom: 4,
  },

  subtitle: {
    fontSize: 14,
    color: statisticsTheme.colors.textSecondary,
  },

  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: statisticsTheme.spacing.lg,
    backgroundColor: '#F9FAFB',
    borderRadius: statisticsTheme.borderRadius.sm,
    padding: statisticsTheme.spacing.md,
  },

  statCard: {
    alignItems: 'center',
  },

  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: statisticsTheme.colors.textPrimary,
  },

  statLabel: {
    fontSize: 12,
    color: statisticsTheme.colors.textSecondary,
    marginTop: 4,
  },

  viewControls: {
    alignItems: 'flex-end',
  },

  controlsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: statisticsTheme.colors.textSecondary,
    marginBottom: statisticsTheme.spacing.sm,
  },

  viewButtons: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: statisticsTheme.borderRadius.md,
    padding: 4,
  },

  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: statisticsTheme.spacing.sm,
    paddingVertical: statisticsTheme.spacing.xs,
    borderRadius: statisticsTheme.borderRadius.sm,
    gap: 4,
  },

  viewButtonActive: {
    backgroundColor: statisticsTheme.charts.primary,
  },

  viewButtonText: {
    fontSize: 11,
    color: statisticsTheme.colors.textSecondary,
    fontWeight: '500',
  },

  viewButtonTextActive: {
    color: '#FFFFFF',
  },

  mapSection: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    gap: statisticsTheme.spacing.lg,
    marginBottom: statisticsTheme.spacing.lg,
  },

  webMapContainer: {
    flex: 1,
    position: 'relative',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: statisticsTheme.borderRadius.sm,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  svg: {
    backgroundColor: 'transparent',
  },

  mapControls: {
    position: 'absolute',
    top: 10,
    right: 10,
    gap: 4,
  },

  mapControlButton: {
    width: 32,
    height: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        ':hover': {
          backgroundColor: '#F9FAFB',
        },
      },
    }),
  },

  mobileList: {
    flex: 1,
    maxHeight: 300,
  },

  areaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: statisticsTheme.borderRadius.sm,
    padding: statisticsTheme.spacing.md,
    marginBottom: statisticsTheme.spacing.sm,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  areaCardSelected: {
    borderColor: statisticsTheme.charts.primary,
    backgroundColor: '#F0F9FF',
  },

  areaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  areaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: statisticsTheme.spacing.sm,
  },

  areaNameContainer: {
    flex: 1,
  },

  areaName: {
    fontSize: 14,
    fontWeight: '600',
    color: statisticsTheme.colors.textPrimary,
  },

  areaRoutes: {
    fontSize: 11,
    color: statisticsTheme.colors.textSecondary,
    marginTop: 2,
  },

  areaStats: {
    alignItems: 'center',
  },

  incidentCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: statisticsTheme.colors.textPrimary,
  },

  incidentLabel: {
    fontSize: 10,
    color: statisticsTheme.colors.textSecondary,
  },

  areaDetails: {
    marginTop: statisticsTheme.spacing.md,
    paddingTop: statisticsTheme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },

  recentIncidents: {
    gap: statisticsTheme.spacing.xs,
  },

  detailsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: statisticsTheme.colors.textPrimary,
    marginBottom: statisticsTheme.spacing.sm,
  },

  incidentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },

  incidentTime: {
    fontSize: 11,
    color: statisticsTheme.colors.textSecondary,
    width: 50,
  },

  incidentType: {
    fontSize: 11,
    color: statisticsTheme.colors.textPrimary,
    flex: 1,
  },

  incidentSeverity: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },

  legend: {
    backgroundColor: '#F9FAFB',
    borderRadius: statisticsTheme.borderRadius.sm,
    padding: statisticsTheme.spacing.md,
    minWidth: Platform.OS === 'web' ? 200 : '100%',
  },

  legendTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: statisticsTheme.colors.textPrimary,
    marginBottom: statisticsTheme.spacing.sm,
  },

  legendSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: statisticsTheme.colors.textPrimary,
    marginTop: statisticsTheme.spacing.sm,
    marginBottom: statisticsTheme.spacing.xs,
  },

  legendItems: {
    gap: statisticsTheme.spacing.xs,
  },

  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: statisticsTheme.spacing.sm,
  },

  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },

  routeLine: {
    width: 20,
    height: 3,
    borderRadius: 1.5,
  },

  legendText: {
    fontSize: 11,
    color: statisticsTheme.colors.textSecondary,
  },

  routeLegend: {
    marginTop: statisticsTheme.spacing.sm,
    paddingTop: statisticsTheme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },

  selectedAreaPanel: {
    backgroundColor: '#F0F9FF',
    borderRadius: statisticsTheme.borderRadius.sm,
    padding: statisticsTheme.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: statisticsTheme.charts.primary,
  },

  selectedAreaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: statisticsTheme.spacing.sm,
    marginBottom: statisticsTheme.spacing.md,
  },

  selectedAreaTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: statisticsTheme.colors.textPrimary,
    flex: 1,
  },

  selectedAreaContent: {
    gap: statisticsTheme.spacing.md,
  },

  selectedAreaStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },

  selectedStat: {
    alignItems: 'center',
  },

  selectedStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: statisticsTheme.colors.textPrimary,
  },

  selectedStatLabel: {
    fontSize: 12,
    color: statisticsTheme.colors.textSecondary,
    marginTop: 4,
  },

  loadingContainer: {
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingIcon: {
    ...Platform.select({
      web: {
        animationKeyframes: 'spin',
        animationDuration: '1s',
        animationTimingFunction: 'linear',
        animationIterationCount: 'infinite',
      },
    }),
  },

  loadingText: {
    fontSize: 14,
    color: statisticsTheme.colors.textSecondary,
    marginTop: statisticsTheme.spacing.md,
  },
});

export default GeographicHeatmap;
