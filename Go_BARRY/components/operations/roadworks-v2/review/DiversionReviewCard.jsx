/*
 * Go Barry - Diversion Review Card
 * Individual card for displaying diversion details and review options
 */

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { roadworksStyles, colors, spacing } from '../styles/roadworks.styles';

const DiversionReviewCard = ({ 
  diversion, 
  onReview, 
  onQuickRating, 
  isController = false 
}) => {
  const getStatusColor = (status) => {
    const colors_map = {
      active: colors.warning,
      completed: colors.success,
      cancelled: colors.error
    };
    return colors_map[status?.toLowerCase()] || colors.textMuted;
  };

  const getEffectivenessColor = (rating) => {
    if (rating >= 4) return colors.success;
    if (rating >= 3) return colors.warning;
    if (rating >= 1) return colors.error;
    return colors.textMuted;
  };

  const formatDuration = (startDate, endDate) => {
    if (!startDate) return 'Unknown duration';
    
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const hours = Math.ceil((end - start) / (1000 * 60 * 60));
    
    if (hours < 24) return `${hours}h`;
    const days = Math.ceil(hours / 24);
    return `${days}d`;
  };

  const getDelayImpact = (delayMinutes) => {
    if (delayMinutes <= 5) return { text: 'Minimal', color: colors.success };
    if (delayMinutes <= 15) return { text: 'Moderate', color: colors.warning };
    return { text: 'Significant', color: colors.error };
  };

  const renderStars = (rating, interactive = false) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const filled = i <= (rating || 0);
      stars.push(
        <Pressable
          key={i}
          style={roadworksStyles.starButton}
          onPress={() => interactive && onQuickRating && onQuickRating(i)}
          disabled={!interactive}
        >
          <Ionicons
            name={filled ? 'star' : 'star-outline'}
            size={16}
            color={filled ? colors.warning : colors.textMuted}
          />
        </Pressable>
      );
    }
    return <View style={roadworksStyles.starsContainer}>{stars}</View>;
  };

  const delayImpact = getDelayImpact(diversion.actualDelay || diversion.estimatedDelay || 0);

  return (
    <View style={[
      roadworksStyles.reviewCard,
      diversion.reviewedAt && roadworksStyles.reviewCardCompleted
    ]}>
      {/* Header */}
      <View style={roadworksStyles.reviewCardHeader}>
        <View style={roadworksStyles.reviewCardLocation}>
          <Ionicons name="location" size={16} color={colors.primary} />
          <Text style={roadworksStyles.reviewCardTitle} numberOfLines={1}>
            {diversion.location || 'Unknown Location'}
          </Text>
        </View>
        
        <View style={[roadworksStyles.statusBadge, { backgroundColor: `${getStatusColor(diversion.status)}20` }]}>
          <Text style={[roadworksStyles.statusBadgeText, { color: getStatusColor(diversion.status) }]}>
            {diversion.status?.toUpperCase() || 'UNKNOWN'}
          </Text>
        </View>
      </View>

      {/* Diversion Details */}
      <View style={roadworksStyles.reviewCardBody}>
        <View style={roadworksStyles.diversionDetail}>
          <Text style={roadworksStyles.diversionDetailLabel}>Route Affected:</Text>
          <Text style={roadworksStyles.diversionDetailValue}>
            {diversion.routeAffected || 'Unknown Route'}
          </Text>
        </View>
        
        <View style={roadworksStyles.diversionDetail}>
          <Text style={roadworksStyles.diversionDetailLabel}>Diversion:</Text>
          <Text style={roadworksStyles.diversionDetailValue} numberOfLines={2}>
            {diversion.diversionRoute || 'No diversion specified'}
          </Text>
        </View>

        <View style={roadworksStyles.diversionMetrics}>
          <View style={roadworksStyles.metricItem}>
            <Ionicons name="time" size={14} color={colors.textMuted} />
            <Text style={roadworksStyles.metricText}>
              {formatDuration(diversion.startDate, diversion.endDate)}
            </Text>
          </View>
          
          <View style={roadworksStyles.metricItem}>
            <Ionicons name="speedometer" size={14} color={delayImpact.color} />
            <Text style={[roadworksStyles.metricText, { color: delayImpact.color }]}>
              {delayImpact.text} delay
            </Text>
          </View>
          
          {diversion.passengersAffected && (
            <View style={roadworksStyles.metricItem}>
              <Ionicons name="people" size={14} color={colors.textMuted} />
              <Text style={roadworksStyles.metricText}>
                ~{diversion.passengersAffected} passengers
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Review Section */}
      <View style={roadworksStyles.reviewSection}>
        {diversion.reviewedAt ? (
          // Already reviewed
          <View style={roadworksStyles.completedReview}>
            <View style={roadworksStyles.reviewHeader}>
              <Text style={roadworksStyles.reviewedByText}>
                Reviewed by {diversion.reviewedBy || 'Controller'} • {' '}
                {new Date(diversion.reviewedAt).toLocaleDateString('en-GB')}
              </Text>
              {diversion.effectivenessRating && renderStars(diversion.effectivenessRating)}
            </View>
            
            {diversion.reviewNotes && (
              <Text style={roadworksStyles.reviewNotes} numberOfLines={2}>
                "{diversion.reviewNotes}"
              </Text>
            )}
          </View>
        ) : (
          // Pending review
          <View style={roadworksStyles.pendingReview}>
            <Text style={roadworksStyles.pendingReviewText}>
              Effectiveness review pending
            </Text>
            
            {isController && (
              <View style={roadworksStyles.reviewActions}>
                {/* Quick rating */}
                <View style={roadworksStyles.quickRatingSection}>
                  <Text style={roadworksStyles.quickRatingLabel}>Quick rating:</Text>
                  {renderStars(0, true)}
                </View>
                
                {/* Detailed review button */}
                <Pressable
                  style={roadworksStyles.detailedReviewButton}
                  onPress={onReview}
                >
                  <Ionicons name="create" size={16} color={colors.primary} />
                  <Text style={roadworksStyles.detailedReviewText}>Detailed Review</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Additional Info */}
      {diversion.templateUsed && (
        <View style={roadworksStyles.templateInfo}>
          <Ionicons name="bookmark" size={12} color={colors.info} />
          <Text style={roadworksStyles.templateText}>
            Used template: {diversion.templateUsed}
          </Text>
        </View>
      )}

      {/* Priority indicator */}
      {diversion.priority === 'high' && (
        <View style={roadworksStyles.priorityIndicator}>
          <Ionicons name="alert" size={12} color={colors.error} />
          <Text style={roadworksStyles.priorityText}>High Priority Review</Text>
        </View>
      )}
    </View>
  );
};

export default DiversionReviewCard;