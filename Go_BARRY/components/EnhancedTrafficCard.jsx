// Go_BARRY/components/EnhancedTrafficCard.jsx
// Completely redesigned traffic card with modern UI and supervisor actions

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Share,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { geocodeLocation } from '../services/geocoding';

const { width } = Dimensions.get('window');

const EnhancedTrafficCard = ({ 
  alert,
  onPress = null,
  style = {},
  supervisorSession = null,
  onDismiss = null,
  onAcknowledge = null
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDismissModal, setShowDismissModal] = useState(false);
  const [dismissReason, setDismissReason] = useState('');
  const [dismissNotes, setDismissNotes] = useState('');

  if (!alert) {
    return (
      <View style={[styles.card, styles.errorCard, style]}>
        <Text style={styles.errorText}>❌ No alert data available</Text>
      </View>
    );
  }

  const {
    id = 'unknown',
    title = 'Traffic Alert',
    description = 'No description available',
    location = 'Location not specified',
    authority = 'Unknown',
    affectsRoutes = [],
    startDate = null,
    endDate = null,
    status = 'green',
    severity = 'Low',
    type = 'roadwork',
    source = 'unknown',
    lastUpdated = null,
    locationAccuracy = 'low',
    routeMatchMethod = 'basic',
    calculatedSeverity = null
  } = alert;

  const getStatusColors = () => {
    const colors = {
      red: {
        gradient: ['#DC2626', '#EF4444'],
        background: 'rgba(220, 38, 38, 0.08)',
        borderColor: '#DC2626',
        textColor: '#FFFFFF'
      },
      amber: {
        gradient: ['#D97706', '#F59E0B'],
        background: 'rgba(217, 119, 6, 0.08)',
        borderColor: '#D97706',
        textColor: '#FFFFFF'
      },
      green: {
        gradient: ['#059669', '#10B981'],
        background: 'rgba(5, 150, 105, 0.08)',
        borderColor: '#059669',
        textColor: '#FFFFFF'
      }
    };
    return colors[status] || colors.green;
  };

  const getSeverityIcon = () => {
    const finalSeverity = calculatedSeverity || severity;
    switch (finalSeverity) {
      case 'High': return { icon: '🔴', color: '#EF4444' };
      case 'Medium': return { icon: '🟡', color: '#F59E0B' };
      default: return { icon: '🟢', color: '#10B981' };
    }
  };

  const getTypeInfo = () => {
    const types = {
      incident: { icon: '🚨', label: 'Traffic Incident', color: '#EF4444' },
      congestion: { icon: '🚦', label: 'Traffic Congestion', color: '#F59E0B' },
      roadwork: { icon: '🚧', label: 'Roadworks', color: '#3B82F6' }
    };
    return types[type] || types.roadwork;
  };

  const getLocationAccuracyBadge = () => {
    if (locationAccuracy === 'high') {
      return { icon: '📍', text: 'Precise Location', color: '#10B981' };
    }
    return { icon: '📍', text: 'General Area', color: '#F59E0B' };
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return null;
    }
  };

  const handleShare = () => {
    const shareText = [
      `🚦 BARRY Alert: ${title}`,
      `📍 Location: ${location}`,
      description && `Details: ${description}`,
      affectsRoutes?.length ? `🚌 Routes: ${affectsRoutes.join(', ')}` : '',
      `Status: ${status.toUpperCase()} | Severity: ${calculatedSeverity || severity}`,
      authority ? `Source: ${authority}` : '',
      '\n📱 Sent from BARRY Enhanced App'
    ].filter(Boolean).join('\n');
    Share.share({ message: shareText });
  };

  const handleDismiss = () => {
    if (!supervisorSession) {
      Alert.alert('Access Denied', 'Please log in as a supervisor to dismiss alerts.');
      return;
    }
    setShowDismissModal(true);
  };

  const confirmDismiss = () => {
    if (!dismissReason.trim()) {
      Alert.alert('Error', 'Please select a reason for dismissal.');
      return;
    }
    
    if (onDismiss) {
      onDismiss(id, dismissReason, dismissNotes);
    }
    
    setShowDismissModal(false);
    setDismissReason('');
    setDismissNotes('');
  };

  const handleAcknowledge = () => {
    if (onAcknowledge) {
      onAcknowledge(id);
    }
    Alert.alert('Acknowledged', 'Alert has been acknowledged.');
  };

  const handleOpenMap = async () => {
    try {
      let latitude, longitude;
      
      // Check if alert already has coordinates
      if (alert.coordinates && Array.isArray(alert.coordinates) && alert.coordinates.length >= 2) {
        [latitude, longitude] = alert.coordinates;
      } else if (alert.coordinates && alert.coordinates.lat && alert.coordinates.lng) {
        latitude = alert.coordinates.lat;
        longitude = alert.coordinates.lng;
      } else if (location && location !== 'Location not specified') {
        // Try to geocode the location
        const geocodedLocation = await geocodeLocation(location, alert);
        if (geocodedLocation) {
          latitude = geocodedLocation.latitude;
          longitude = geocodedLocation.longitude;
        }
      }
      
      if (!latitude || !longitude) {
        Alert.alert(
          'Location Not Available',
          'Unable to determine the exact coordinates for this alert. The location may be too general or geocoding failed.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      const alertTitle = encodeURIComponent(title || 'Traffic Alert');
      const alertLocation = encodeURIComponent(location || 'Traffic Location');
      
      // Create map URLs for different platforms
      const mapUrls = {
        // Apple Maps (iOS)
        appleMaps: `maps://maps.apple.com/?q=${alertTitle}&ll=${latitude},${longitude}&z=15`,
        // Google Maps (Android/iOS)
        googleMaps: `https://maps.google.com/maps?q=${latitude},${longitude}&z=15`,
        // Google Maps App (if installed)
        googleMapsApp: `comgooglemaps://?q=${latitude},${longitude}&zoom=15`,
        // Web fallback
        webMaps: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}&zoom=15`
      };
      
      let mapUrl;
      
      if (Platform.OS === 'ios') {
        // Try Apple Maps first on iOS, then Google Maps
        const canOpenAppleMaps = await Linking.canOpenURL(mapUrls.appleMaps);
        if (canOpenAppleMaps) {
          mapUrl = mapUrls.appleMaps;
        } else {
          const canOpenGoogleMaps = await Linking.canOpenURL(mapUrls.googleMapsApp);
          mapUrl = canOpenGoogleMaps ? mapUrls.googleMapsApp : mapUrls.webMaps;
        }
      } else {
        // Try Google Maps app first on Android, then web
        const canOpenGoogleMaps = await Linking.canOpenURL(mapUrls.googleMapsApp);
        mapUrl = canOpenGoogleMaps ? mapUrls.googleMapsApp : mapUrls.webMaps;
      }
      
      console.log(`🗺️ Opening map for alert: ${title} at ${latitude}, ${longitude}`);
      console.log(`🗺️ Using URL: ${mapUrl}`);
      
      await Linking.openURL(mapUrl);
      
    } catch (error) {
      console.error('❌ Error opening map:', error);
      Alert.alert(
        'Unable to Open Map',
        'There was an error opening the map app. Please make sure you have a maps app installed.',
        [{ text: 'OK' }]
      );
    }
  };

  const colors = getStatusColors();
  const severityInfo = getSeverityIcon();
  const typeInfo = getTypeInfo();
  const locationInfo = getLocationAccuracyBadge();

  const dismissReasons = [
    { value: 'false_alarm', label: 'False Alarm' },
    { value: 'resolved', label: 'Issue Resolved' },
    { value: 'duplicate', label: 'Duplicate Alert' },
    { value: 'maintenance', label: 'Planned Maintenance' },
    { value: 'low_impact', label: 'Low Impact' },
    { value: 'other', label: 'Other' }
  ];

  return (
    <>
      <View style={[
        styles.card,
        { 
          borderLeftColor: colors.borderColor,
          backgroundColor: colors.background,
        },
        style
      ]}>
        {/* Enhanced Status Bar with Gradient */}
        <View style={[
          styles.statusBar, 
          { 
            background: `linear-gradient(90deg, ${colors.gradient[0]}, ${colors.gradient[1]})`,
            backgroundColor: colors.gradient[0] // Fallback for React Native
          }
        ]} />
        
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.headerTop}>
            <View style={styles.statusInfo}>
              <Text style={[styles.severityIcon, { color: severityInfo.color }]}>
                {severityInfo.icon}
              </Text>
              <Text style={[styles.typeIcon, { color: typeInfo.color }]}>
                {typeInfo.icon}
              </Text>
              <View style={styles.statusBadges}>
                <View style={[styles.statusBadge, { backgroundColor: colors.borderColor }]}>
                  <Text style={styles.statusBadgeText}>{status.toUpperCase()}</Text>
                </View>
                <View style={[styles.severityBadge, { backgroundColor: severityInfo.color }]}>
                  <Text style={styles.severityBadgeText}>
                    {calculatedSeverity || severity}
                  </Text>
                </View>
              </View>
            </View>
            
            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
                <Ionicons name="share-social-outline" size={20} color="#3B82F6" />
              </TouchableOpacity>
              
              <TouchableOpacity onPress={handleOpenMap} style={styles.mapButton}>
                <Ionicons name="map" size={18} color="#FFFFFF" />
              </TouchableOpacity>
              
              {supervisorSession && (
                <TouchableOpacity onPress={handleDismiss} style={styles.dismissButton}>
                  <Ionicons name="close" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              )}
              
              <TouchableOpacity onPress={handleAcknowledge} style={styles.acknowledgeButton}>
                <Ionicons name="checkmark" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Main Content */}
        <TouchableOpacity
          onPress={onPress || (() => setIsExpanded(!isExpanded))}
          style={styles.contentContainer}
          activeOpacity={0.7}
        >
          {/* Enhanced Location Display */}
          <View style={styles.locationSection}>
            <View style={styles.locationHeader}>
              <Text style={styles.locationMain} numberOfLines={2}>
                {location}
              </Text>
              <View style={styles.locationAccuracy}>
                <Text style={[styles.accuracyBadge, { color: locationInfo.color }]}>
                  {locationInfo.icon} {locationInfo.text}
                </Text>
              </View>
            </View>
            
            {/* Enhanced Route Matching Display */}
            {routeMatchMethod === 'enhanced' && (
              <View style={styles.enhancedBadge}>
                <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                <Text style={styles.enhancedText}>Enhanced Route Matching</Text>
              </View>
            )}
          </View>

          {/* Title and Description */}
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          
          {startDate && (
            <Text style={styles.startTime}>
              📅 {formatDateTime(startDate)}
            </Text>
          )}

          {/* Enhanced Route Display */}
          {affectsRoutes && affectsRoutes.length > 0 && (
            <View style={styles.routeSection}>
              <Text style={styles.routeLabel}>🚌 Affected Routes ({affectsRoutes.length}):</Text>
              <View style={styles.routeBadgeContainer}>
                {affectsRoutes.slice(0, 8).map((route, index) => (
                  <View key={`${route}-${index}`} style={styles.routeBadge}>
                    <Text style={styles.routeBadgeText}>{route}</Text>
                  </View>
                ))}
                {affectsRoutes.length > 8 && (
                  <View style={styles.moreRoutesBadge}>
                    <Text style={styles.moreRoutesText}>
                      +{affectsRoutes.length - 8}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Expand/Collapse Button */}
          <TouchableOpacity
            onPress={() => setIsExpanded(!isExpanded)}
            style={styles.expandButton}
          >
            <Text style={styles.expandButtonText}>
              {isExpanded ? 'Show Less' : 'Show More Details'}
            </Text>
            <Ionicons 
              name={isExpanded ? 'chevron-up' : 'chevron-down'} 
              size={16} 
              color="#3B82F6" 
            />
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Expanded Details */}
        {isExpanded && (
          <View style={styles.expandedContent}>
            {/* Enhanced Alert Information */}
            <View style={styles.detailCard}>
              <Text style={styles.detailCardTitle}>📋 Alert Information</Text>
              <Text style={styles.detailCardText}>
                <Text style={styles.detailLabel}>Type: </Text>
                {typeInfo.label}
              </Text>
              <Text style={styles.detailCardText}>
                <Text style={styles.detailLabel}>Source: </Text>
                {authority || source}
              </Text>
              <Text style={styles.detailCardText}>
                <Text style={styles.detailLabel}>Alert ID: </Text>
                {id}
              </Text>
              {lastUpdated && (
                <Text style={styles.detailCardText}>
                  <Text style={styles.detailLabel}>Last Updated: </Text>
                  {formatDateTime(lastUpdated)}
                </Text>
              )}
            </View>

            {/* Description */}
            <View style={styles.detailCard}>
              <Text style={styles.detailCardTitle}>📝 Description</Text>
              <Text style={styles.detailDescription}>{description}</Text>
            </View>

            {/* Timing Information */}
            {(startDate || endDate) && (
              <View style={styles.detailCard}>
                <Text style={styles.detailCardTitle}>⏰ Timing Details</Text>
                {startDate && (
                  <Text style={styles.detailCardText}>
                    <Text style={styles.detailLabel}>Start: </Text>
                    {formatDateTime(startDate)}
                  </Text>
                )}
                {endDate && (
                  <Text style={styles.detailCardText}>
                    <Text style={styles.detailLabel}>End: </Text>
                    {formatDateTime(endDate)}
                  </Text>
                )}
              </View>
            )}

            {/* All Routes (if more than 8) */}
            {affectsRoutes && affectsRoutes.length > 8 && (
              <View style={styles.detailCard}>
                <Text style={styles.detailCardTitle}>
                  🚌 All Affected Routes ({affectsRoutes.length})
                </Text>
                <View style={styles.allRoutesBadgeContainer}>
                  {affectsRoutes.map((route, index) => (
                    <View key={`expanded-${route}-${index}`} style={styles.routeBadge}>
                      <Text style={styles.routeBadgeText}>{route}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Dismissal Modal */}
      <Modal
        visible={showDismissModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDismissModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Dismiss Alert</Text>
              <TouchableOpacity
                onPress={() => setShowDismissModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.alertSummary}>
                <Text style={styles.alertSummaryTitle}>{title}</Text>
                <Text style={styles.alertSummaryLocation}>{location}</Text>
              </View>

              <Text style={styles.fieldLabel}>Reason for Dismissal *</Text>
              <View style={styles.reasonButtons}>
                {dismissReasons.map((reason) => (
                  <TouchableOpacity
                    key={reason.value}
                    style={[
                      styles.reasonButton,
                      dismissReason === reason.value && styles.reasonButtonSelected
                    ]}
                    onPress={() => setDismissReason(reason.value)}
                  >
                    <Text style={[
                      styles.reasonButtonText,
                      dismissReason === reason.value && styles.reasonButtonTextSelected
                    ]}>
                      {reason.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Additional Notes (Optional)</Text>
              <TextInput
                style={styles.notesInput}
                multiline
                numberOfLines={4}
                placeholder="Add any additional context or information..."
                placeholderTextColor="#9CA3AF"
                value={dismissNotes}
                onChangeText={setDismissNotes}
              />

              {supervisorSession && (
                <View style={styles.supervisorInfo}>
                  <Text style={styles.supervisorInfoTitle}>Supervisor</Text>
                  <Text style={styles.supervisorInfoText}>
                    {supervisorSession.supervisor?.name} ({supervisorSession.supervisor?.badge})
                  </Text>
                  <Text style={styles.supervisorInfoText}>
                    {supervisorSession.supervisor?.role}
                  </Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowDismissModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalConfirmButton,
                  !dismissReason && styles.modalConfirmButtonDisabled
                ]}
                onPress={confirmDismiss}
                disabled={!dismissReason}
              >
                <Text style={styles.modalConfirmText}>Dismiss Alert</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 6,
    borderRadius: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 8,
  },
  errorCard: {
    borderLeftColor: '#6B7280',
    backgroundColor: '#F9FAFB',
  },
  errorText: {
    color: '#6B7280',
    textAlign: 'center',
    padding: 16,
    fontSize: 14,
  },
  statusBar: {
    height: 4,
  },
  headerSection: {
    padding: 16,
    paddingBottom: 0,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  severityIcon: {
    fontSize: 18,
  },
  typeIcon: {
    fontSize: 18,
  },
  statusBadges: {
    flexDirection: 'row',
    gap: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  severityBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  shareButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  mapButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
  },
  dismissButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#EF4444',
  },
  acknowledgeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#10B981',
  },
  contentContainer: {
    padding: 16,
    paddingTop: 0,
  },
  locationSection: {
    marginBottom: 12,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  locationMain: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
  },
  locationAccuracy: {
    alignSelf: 'flex-start',
  },
  accuracyBadge: {
    fontSize: 10,
    fontWeight: '600',
  },
  enhancedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
  },
  enhancedText: {
    fontSize: 10,
    color: '#10B981',
    fontWeight: '600',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    lineHeight: 22,
  },
  startTime: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    fontWeight: '500',
  },
  routeSection: {
    marginBottom: 16,
  },
  routeLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
    fontWeight: '600',
  },
  routeBadgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  routeBadge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  routeBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  moreRoutesBadge: {
    backgroundColor: '#9CA3AF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  moreRoutesText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginTop: 12,
    gap: 6,
  },
  expandButtonText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
  },
  expandedContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#F9FAFB',
  },
  detailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  detailCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  detailCardText: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
    lineHeight: 18,
  },
  detailLabel: {
    fontWeight: '600',
    color: '#374151',
  },
  detailDescription: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  allRoutesBadgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  alertSummary: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  alertSummaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  alertSummaryLocation: {
    fontSize: 12,
    color: '#6B7280',
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  reasonButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  reasonButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  reasonButtonSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  reasonButtonText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  reasonButtonTextSelected: {
    color: '#FFFFFF',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1F2937',
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  supervisorInfo: {
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  supervisorInfoTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 4,
  },
  supervisorInfoText: {
    fontSize: 12,
    color: '#1E40AF',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  modalConfirmButton: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
  },
  modalConfirmButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  modalConfirmText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default EnhancedTrafficCard;
