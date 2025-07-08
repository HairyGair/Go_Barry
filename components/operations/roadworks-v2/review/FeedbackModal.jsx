/*
 * Go Barry - Feedback Modal
 * Detailed feedback form for diversion effectiveness review
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { roadworksStyles, colors, spacing } from '../styles/roadworks.styles';

const FeedbackModal = ({ 
  visible, 
  diversion, 
  onClose, 
  onSubmit, 
  controllerName 
}) => {
  const [effectivenessRating, setEffectivenessRating] = useState(0);
  const [delayRating, setDelayRating] = useState(0);
  const [driverFeedbackRating, setDriverFeedbackRating] = useState(0);
  const [passengerComplaintRating, setPassengerComplaintRating] = useState(0);
  const [overallSatisfaction, setOverallSatisfaction] = useState(0);
  const [reviewNotes, setReviewNotes] = useState('');
  const [improvements, setImprovements] = useState('');
  const [wouldRecommend, setWouldRecommend] = useState(null);

  const resetForm = () => {
    setEffectivenessRating(0);
    setDelayRating(0);
    setDriverFeedbackRating(0);
    setPassengerComplaintRating(0);
    setOverallSatisfaction(0);
    setReviewNotes('');
    setImprovements('');
    setWouldRecommend(null);
  };

  const handleSubmit = () => {
    if (effectivenessRating === 0) {
      Alert.alert('Required', 'Please provide an effectiveness rating');
      return;
    }

    const reviewData = {
      effectivenessRating,
      delayRating,
      driverFeedbackRating,
      passengerComplaintRating,
      overallSatisfaction,
      reviewNotes: reviewNotes.trim(),
      improvements: improvements.trim(),
      wouldRecommend,
      quickReview: false
    };

    onSubmit(reviewData);
    resetForm();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const renderStarRating = (rating, setRating, label, required = false) => {
    return (
      <View style={roadworksStyles.ratingSection}>
        <Text style={roadworksStyles.ratingLabel}>
          {label} {required && <Text style={roadworksStyles.requiredAsterisk}>*</Text>}
        </Text>
        <View style={roadworksStyles.starsRow}>
          {[1, 2, 3, 4, 5].map(star => (
            <Pressable
              key={star}
              style={roadworksStyles.starButton}
              onPress={() => setRating(star)}
            >
              <Ionicons
                name={star <= rating ? 'star' : 'star-outline'}
                size={24}
                color={star <= rating ? colors.warning : colors.textMuted}
              />
            </Pressable>
          ))}
        </View>
        <Text style={roadworksStyles.ratingDescription}>
          {rating === 0 ? 'Tap to rate' :
           rating === 1 ? 'Poor' :
           rating === 2 ? 'Fair' :
           rating === 3 ? 'Good' :
           rating === 4 ? 'Very Good' :
           'Excellent'}
        </Text>
      </View>
    );
  };

  if (!visible || !diversion) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={roadworksStyles.modalContainer}>
        {/* Header */}
        <View style={roadworksStyles.modalHeader}>
          <View>
            <Text style={roadworksStyles.modalTitle}>Diversion Review</Text>
            <Text style={roadworksStyles.modalSubtitle}>
              {diversion.location || 'Unknown Location'}
            </Text>
          </View>
          
          <Pressable
            style={roadworksStyles.modalCloseButton}
            onPress={handleClose}
          >
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </Pressable>
        </View>

        <ScrollView
          style={roadworksStyles.modalContent}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Diversion Summary */}
          <View style={roadworksStyles.diversionSummary}>
            <Text style={roadworksStyles.summaryTitle}>Diversion Details</Text>
            
            <View style={roadworksStyles.summaryRow}>
              <Text style={roadworksStyles.summaryLabel}>Route Affected:</Text>
              <Text style={roadworksStyles.summaryValue}>
                {diversion.routeAffected || 'Unknown'}
              </Text>
            </View>
            
            <View style={roadworksStyles.summaryRow}>
              <Text style={roadworksStyles.summaryLabel}>Diversion Route:</Text>
              <Text style={roadworksStyles.summaryValue}>
                {diversion.diversionRoute || 'Not specified'}
              </Text>
            </View>
            
            <View style={roadworksStyles.summaryRow}>
              <Text style={roadworksStyles.summaryLabel}>Duration:</Text>
              <Text style={roadworksStyles.summaryValue}>
                {diversion.startDate && diversion.endDate
                  ? `${Math.ceil((new Date(diversion.endDate) - new Date(diversion.startDate)) / (1000 * 60 * 60))}h`
                  : 'Ongoing'}
              </Text>
            </View>
          </View>

          {/* Rating Sections */}
          {renderStarRating(
            effectivenessRating,
            setEffectivenessRating,
            'Overall Effectiveness',
            true
          )}

          {renderStarRating(
            delayRating,
            setDelayRating,
            'Delay Management'
          )}

          {renderStarRating(
            driverFeedbackRating,
            setDriverFeedbackRating,
            'Driver Feedback'
          )}

          {renderStarRating(
            passengerComplaintRating,
            setPassengerComplaintRating,
            'Passenger Experience'
          )}

          {renderStarRating(
            overallSatisfaction,
            setOverallSatisfaction,
            'Overall Satisfaction'
          )}

          {/* Would Recommend */}
          <View style={roadworksStyles.recommendSection}>
            <Text style={roadworksStyles.ratingLabel}>
              Would you recommend this diversion approach for similar situations?
            </Text>
            <View style={roadworksStyles.recommendButtons}>
              <Pressable
                style={[
                  roadworksStyles.recommendButton,
                  wouldRecommend === true && roadworksStyles.recommendButtonSelected
                ]}
                onPress={() => setWouldRecommend(true)}
              >
                <Ionicons 
                  name="thumbs-up" 
                  size={20} 
                  color={wouldRecommend === true ? colors.textPrimary : colors.success} 
                />
                <Text style={[
                  roadworksStyles.recommendButtonText,
                  wouldRecommend === true && roadworksStyles.recommendButtonTextSelected
                ]}>
                  Yes
                </Text>
              </Pressable>
              
              <Pressable
                style={[
                  roadworksStyles.recommendButton,
                  wouldRecommend === false && roadworksStyles.recommendButtonSelected
                ]}
                onPress={() => setWouldRecommend(false)}
              >
                <Ionicons 
                  name="thumbs-down" 
                  size={20} 
                  color={wouldRecommend === false ? colors.textPrimary : colors.error} 
                />
                <Text style={[
                  roadworksStyles.recommendButtonText,
                  wouldRecommend === false && roadworksStyles.recommendButtonTextSelected
                ]}>
                  No
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Review Notes */}
          <View style={roadworksStyles.textSection}>
            <Text style={roadworksStyles.textLabel}>Review Notes</Text>
            <TextInput
              style={roadworksStyles.textArea}
              placeholder="Describe the effectiveness of this diversion, any issues encountered, or positive outcomes..."
              placeholderTextColor={colors.textMuted}
              value={reviewNotes}
              onChangeText={setReviewNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Improvement Suggestions */}
          <View style={roadworksStyles.textSection}>
            <Text style={roadworksStyles.textLabel}>Improvement Suggestions</Text>
            <TextInput
              style={roadworksStyles.textArea}
              placeholder="What could be improved for future similar diversions?"
              placeholderTextColor={colors.textMuted}
              value={improvements}
              onChangeText={setImprovements}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Controller Info */}
          <View style={roadworksStyles.reviewerInfo}>
            <Ionicons name="person-circle" size={16} color={colors.primary} />
            <Text style={roadworksStyles.reviewerText}>
              Review by: {controllerName}
            </Text>
            <Text style={roadworksStyles.reviewerDate}>
              {new Date().toLocaleDateString('en-GB')} at {new Date().toLocaleTimeString('en-GB', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={roadworksStyles.modalActions}>
          <Pressable
            style={roadworksStyles.modalCancelButton}
            onPress={handleClose}
          >
            <Text style={roadworksStyles.modalCancelText}>Cancel</Text>
          </Pressable>
          
          <Pressable
            style={[
              roadworksStyles.modalSubmitButton,
              effectivenessRating === 0 && roadworksStyles.modalSubmitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={effectivenessRating === 0}
          >
            <Ionicons name="checkmark" size={16} color={colors.textPrimary} />
            <Text style={roadworksStyles.modalSubmitText}>Submit Review</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

export default FeedbackModal;