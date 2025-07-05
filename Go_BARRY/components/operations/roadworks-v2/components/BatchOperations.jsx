/*
 * Go Barry - Batch Operations Component
 * Batch approve/reject roadworks with filters
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { roadworksStyles, colors, spacing } from '../styles/roadworks.styles';

const BatchOperations = ({ 
  roadworks, 
  onBatchOperation, 
  loading = false,
  sessionId,
  baseUrl 
}) => {
  const [selectedSeverity, setSelectedSeverity] = useState(null);
  const [processing, setProcessing] = useState(false);

  const handleBatchApprove = async () => {
    if (!selectedSeverity) {
      Alert.alert('Select Severity', 'Please select a severity level to batch approve');
      return;
    }

    const filteredRoadworks = roadworks.filter(r => 
      r.severity === selectedSeverity && r.review_status === 'pending'
    );

    if (filteredRoadworks.length === 0) {
      Alert.alert('No Roadworks', `No pending ${selectedSeverity} roadworks to approve`);
      return;
    }

    Alert.alert(
      'Batch Approve',
      `Approve all ${filteredRoadworks.length} ${selectedSeverity} roadworks?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Approve All', 
          style: 'default',
          onPress: async () => {
            setProcessing(true);
            try {
              const response = await fetch(`${baseUrl}/api/roadworks-v2/batch-approve`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-session-id': sessionId
                },
                body: JSON.stringify({
                  severity: selectedSeverity,
                  roadworkIds: filteredRoadworks.map(r => r.id)
                })
              });

              if (response.ok) {
                const result = await response.json();
                Alert.alert('Success', `${result.approved} roadworks approved`);
                onBatchOperation && onBatchOperation('approve', result);
              } else {
                throw new Error('Batch approval failed');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to batch approve roadworks');
            } finally {
              setProcessing(false);
            }
          }
        }
      ]
    );
  };

  const severityOptions = [
    { value: 'critical', label: 'Critical', color: colors.error },
    { value: 'high', label: 'High', color: colors.warning },
    { value: 'medium', label: 'Medium', color: colors.primary },
    { value: 'low', label: 'Low', color: colors.success }
  ];

  const getCountBySeverity = (severity) => {
    return roadworks.filter(r => 
      r.severity === severity && r.review_status === 'pending'
    ).length;
  };

  return (
    <View style={roadworksStyles.batchOperationsContainer}>
      <Text style={roadworksStyles.sectionTitle}>Batch Operations</Text>
      
      <Text style={roadworksStyles.textMuted}>
        Select severity level to batch approve roadworks
      </Text>

      <View style={roadworksStyles.severityGrid}>
        {severityOptions.map(option => {
          const count = getCountBySeverity(option.value);
          const isSelected = selectedSeverity === option.value;
          
          return (
            <Pressable
              key={option.value}
              style={[
                roadworksStyles.batchSeverityCard,
                isSelected && { borderColor: option.color, borderWidth: 2 }
              ]}
              onPress={() => setSelectedSeverity(option.value)}
              disabled={count === 0 || processing}
            >
              <View style={[
                roadworksStyles.severityIndicator,
                { backgroundColor: option.color }
              ]} />
              
              <Text style={roadworksStyles.batchSeverityLabel}>
                {option.label}
              </Text>
              
              <Text style={[
                roadworksStyles.batchSeverityCount,
                count === 0 && { color: colors.textMuted }
              ]}>
                {count} pending
              </Text>
              
              {isSelected && (
                <Ionicons 
                  name="checkmark-circle" 
                  size={20} 
                  color={option.color}
                  style={roadworksStyles.batchSelectedIcon}
                />
              )}
            </Pressable>
          );
        })}
      </View>

      <View style={roadworksStyles.batchActions}>
        <Pressable
          style={[
            roadworksStyles.button,
            roadworksStyles.buttonPrimary,
            (!selectedSeverity || processing) && roadworksStyles.buttonDisabled
          ]}
          onPress={handleBatchApprove}
          disabled={!selectedSeverity || processing}
        >
          {processing ? (
            <ActivityIndicator size="small" color={colors.textPrimary} />
          ) : (
            <>
              <Ionicons name="checkmark-done" size={16} color={colors.textPrimary} />
              <Text style={roadworksStyles.buttonPrimaryText}>
                Approve All {selectedSeverity && `${selectedSeverity.charAt(0).toUpperCase() + selectedSeverity.slice(1)}`}
              </Text>
            </>
          )}
        </Pressable>

        <Pressable
          style={[roadworksStyles.button, roadworksStyles.buttonSecondary]}
          onPress={() => setSelectedSeverity(null)}
          disabled={processing}
        >
          <Text style={roadworksStyles.buttonSecondaryText}>Clear Selection</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default BatchOperations;