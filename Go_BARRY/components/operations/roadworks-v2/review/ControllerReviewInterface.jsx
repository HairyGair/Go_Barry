/*
 * Go Barry - Controller Review Interface
 * Interface for control room staff to review and rate diversion effectiveness
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { roadworksStyles, colors, spacing } from '../styles/roadworks.styles';
import DiversionReviewCard from './DiversionReviewCard';
import EffectivenessRating from './EffectivenessRating';
import FeedbackModal from './FeedbackModal';

const ControllerReviewInterface = ({ baseUrl, sessionId, controllerName, isController = false }) => {
  const [activeDiversions, setActiveDiversions] = useState([]);
  const [completedDiversions, setCompletedDiversions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDiversion, setSelectedDiversion] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all'); // all, pending, reviewed
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch diversions for review
  const fetchDiversions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${baseUrl}/api/roadworks-v2/diversions/review`, {
        headers: {
          'x-session-id': sessionId,
          'x-controller': controllerName
        }
      });

      if (response.ok) {
        const data = await response.json();
        setActiveDiversions(data.activeDiversions || []);
        setCompletedDiversions(data.completedDiversions || []);
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (fetchError) {
      console.error('Failed to fetch diversions for review:', fetchError);
      setError(fetchError.message);
      Alert.alert('Error', 'Failed to load diversions for review');
    } finally {
      setLoading(false);
    }
  };

  // Submit diversion effectiveness review
  const submitReview = async (diversionId, reviewData) => {
    try {
      const response = await fetch(`${baseUrl}/api/roadworks-v2/diversions/${diversionId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId,
          'x-controller': controllerName
        },
        body: JSON.stringify({
          ...reviewData,
          reviewedBy: controllerName,
          reviewedAt: new Date().toISOString()
        })
      });

      if (response.ok) {
        Alert.alert('Success', 'Diversion effectiveness review submitted');
        setShowFeedbackModal(false);
        setSelectedDiversion(null);
        fetchDiversions(); // Refresh data
      } else {
        throw new Error('Failed to submit review');
      }
    } catch (reviewError) {
      console.error('Error submitting review:', reviewError);
      Alert.alert('Error', 'Failed to submit review');
    }
  };

  // Handle quick rating
  const handleQuickRating = async (diversion, rating) => {
    await submitReview(diversion.id, {
      effectivenessRating: rating,
      quickReview: true,
      notes: `Quick rating: ${rating}/5 stars`
    });
  };

  // Filter diversions based on search and status
  const getFilteredDiversions = (diversions) => {
    return diversions.filter(diversion => {
      const matchesSearch = searchQuery === '' || 
        diversion.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        diversion.routeAffected?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        diversion.diversionRoute?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || 
        (filterStatus === 'pending' && !diversion.reviewedAt) ||
        (filterStatus === 'reviewed' && diversion.reviewedAt);
      
      return matchesSearch && matchesStatus;
    });
  };

  useEffect(() => {
    if (isController) {
      fetchDiversions();
    }
  }, [isController]);

  // Non-controller view
  if (!isController) {
    return (
      <View style={roadworksStyles.accessDeniedContainer}>
        <Ionicons name="shield-outline" size={64} color={colors.textMuted} />
        <Text style={roadworksStyles.accessDeniedTitle}>Controller Access Required</Text>
        <Text style={roadworksStyles.accessDeniedDescription}>
          This interface is restricted to control room staff for reviewing diversion effectiveness.
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={roadworksStyles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={roadworksStyles.loadingText}>Loading diversions for review...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={roadworksStyles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color={colors.error} />
        <Text style={roadworksStyles.errorTitle}>Error Loading Reviews</Text>
        <Text style={roadworksStyles.errorDescription}>{error}</Text>
        <Pressable
          style={roadworksStyles.retryButton}
          onPress={fetchDiversions}
        >
          <Text style={roadworksStyles.retryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  const allDiversions = [...activeDiversions, ...completedDiversions];
  const filteredDiversions = getFilteredDiversions(allDiversions);
  const pendingReviews = allDiversions.filter(d => !d.reviewedAt).length;

  return (
    <View style={roadworksStyles.container}>
      {/* Header */}
      <View style={roadworksStyles.section}>
        <View style={[roadworksStyles.row, { justifyContent: 'space-between', marginBottom: spacing.md }]}>
          <View>
            <Text style={roadworksStyles.sectionTitle}>Controller Review</Text>
            <Text style={roadworksStyles.textMuted}>
              Review diversion effectiveness • {pendingReviews} pending reviews
            </Text>
          </View>
          
          <View style={roadworksStyles.controllerBadge}>
            <Ionicons name="radio" size={16} color={colors.primary} />
            <Text style={roadworksStyles.controllerName}>{controllerName}</Text>
          </View>
        </View>

        {/* Search and Filters */}
        <View style={roadworksStyles.searchContainer}>
          <View style={[roadworksStyles.searchBox, { flex: 1 }]}>
            <Ionicons name="search" size={16} color={colors.textMuted} />
            <TextInput
              style={roadworksStyles.searchInput}
              placeholder="Search diversions..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <View style={[roadworksStyles.filterDropdown, { marginLeft: spacing.sm }]}>
            <Pressable
              style={roadworksStyles.filterButton}
              onPress={() => {
                const options = ['all', 'pending', 'reviewed'];
                const currentIndex = options.indexOf(filterStatus);
                const nextIndex = (currentIndex + 1) % options.length;
                setFilterStatus(options[nextIndex]);
              }}
            >
              <Text style={roadworksStyles.filterButtonText}>
                {filterStatus === 'all' ? 'All' : 
                 filterStatus === 'pending' ? 'Pending' : 'Reviewed'}
              </Text>
              <Ionicons name="chevron-down" size={12} color={colors.textMuted} />
            </Pressable>
          </View>
        </View>

        {/* Summary Statistics */}
        <View style={roadworksStyles.reviewStatsContainer}>
          <View style={roadworksStyles.reviewStatCard}>
            <Text style={roadworksStyles.reviewStatNumber}>{activeDiversions.length}</Text>
            <Text style={roadworksStyles.reviewStatLabel}>Active Diversions</Text>
          </View>
          <View style={roadworksStyles.reviewStatCard}>
            <Text style={roadworksStyles.reviewStatNumber}>{pendingReviews}</Text>
            <Text style={roadworksStyles.reviewStatLabel}>Pending Reviews</Text>
          </View>
          <View style={roadworksStyles.reviewStatCard}>
            <Text style={roadworksStyles.reviewStatNumber}>
              {allDiversions.filter(d => d.effectivenessRating >= 4).length}
            </Text>
            <Text style={roadworksStyles.reviewStatLabel}>Highly Rated</Text>
          </View>
          <View style={roadworksStyles.reviewStatCard}>
            <Text style={roadworksStyles.reviewStatNumber}>
              {allDiversions.filter(d => d.reviewedAt).length}
            </Text>
            <Text style={roadworksStyles.reviewStatLabel}>Reviewed</Text>
          </View>
        </View>
      </View>

      {/* Diversions List */}
      <ScrollView
        style={roadworksStyles.scrollContainer}
        contentContainerStyle={{ padding: spacing.md }}
        showsVerticalScrollIndicator={false}
      >
        {filteredDiversions.length === 0 ? (
          <View style={roadworksStyles.emptyContainer}>
            <Ionicons name="checkmark-circle" size={48} color={colors.success} />
            <Text style={roadworksStyles.emptyTitle}>
              {filterStatus === 'pending' ? 'No Pending Reviews' : 'No Diversions Found'}
            </Text>
            <Text style={roadworksStyles.emptyDescription}>
              {filterStatus === 'pending' 
                ? 'All diversions have been reviewed' 
                : searchQuery 
                  ? 'Try adjusting your search filters'
                  : 'No diversions available for review at this time'}
            </Text>
          </View>
        ) : (
          <View style={roadworksStyles.reviewGrid}>
            {filteredDiversions.map(diversion => (
              <DiversionReviewCard
                key={diversion.id}
                diversion={diversion}
                onReview={() => {
                  setSelectedDiversion(diversion);
                  setShowFeedbackModal(true);
                }}
                onQuickRating={(rating) => handleQuickRating(diversion, rating)}
                isController={true}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Detailed Feedback Modal */}
      <FeedbackModal
        visible={showFeedbackModal}
        diversion={selectedDiversion}
        onClose={() => {
          setShowFeedbackModal(false);
          setSelectedDiversion(null);
        }}
        onSubmit={(reviewData) => {
          if (selectedDiversion) {
            submitReview(selectedDiversion.id, reviewData);
          }
        }}
        controllerName={controllerName}
      />
    </View>
  );
};

export default ControllerReviewInterface;