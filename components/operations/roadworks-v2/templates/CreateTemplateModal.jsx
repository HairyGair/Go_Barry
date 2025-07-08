/*
 * Go Barry - Create/Edit Template Modal
 * Modal for creating or editing diversion templates
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TextInput,
  Pressable,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { roadworksStyles, colors, spacing } from '../styles/roadworks.styles';

const CreateTemplateModal = ({ visible, onClose, onSave, initialData, routes }) => {
  const [formData, setFormData] = useState({
    name: '',
    route_id: '',
    scenario: '',
    diversion_points: [],
    default_severity: 'medium',
    estimated_delay_minutes: 15,
    instructions: ''
  });

  const [currentWaypoint, setCurrentWaypoint] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      // Reset form
      setFormData({
        name: '',
        route_id: '',
        scenario: '',
        diversion_points: [],
        default_severity: 'medium',
        estimated_delay_minutes: 15,
        instructions: ''
      });
    }
  }, [initialData, visible]);

  const handleAddWaypoint = () => {
    if (currentWaypoint.trim()) {
      setFormData(prev => ({
        ...prev,
        diversion_points: [...prev.diversion_points, currentWaypoint.trim()]
      }));
      setCurrentWaypoint('');
    }
  };

  const handleRemoveWaypoint = (index) => {
    setFormData(prev => ({
      ...prev,
      diversion_points: prev.diversion_points.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = () => {
    // Validation
    if (!formData.name || !formData.route_id || !formData.scenario) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    if (formData.diversion_points.length === 0) {
      Alert.alert('Validation Error', 'Please add at least one diversion waypoint');
      return;
    }

    onSave(formData);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={roadworksStyles.modalOverlay}>
        <View style={roadworksStyles.modalContent}>
          <View style={roadworksStyles.modalHeader}>
            <Text style={roadworksStyles.modalTitle}>
              {initialData ? 'Edit Template' : 'Create Diversion Template'}
            </Text>
            <Pressable onPress={onClose} style={roadworksStyles.closeButton}>
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </Pressable>
          </View>

          <ScrollView style={roadworksStyles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Template Name */}
            <View style={roadworksStyles.formGroup}>
              <Text style={roadworksStyles.formLabel}>Template Name *</Text>
              <TextInput
                style={roadworksStyles.input}
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                placeholder="e.g., A1 Northbound Closure at Junction 65"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            {/* Route Selection */}
            <View style={roadworksStyles.formGroup}>
              <Text style={roadworksStyles.formLabel}>Route *</Text>
              <View style={roadworksStyles.routeSelector}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {['21', 'X21', '1', '2', '307', 'Q3'].map(route => (
                    <Pressable
                      key={route}
                      style={[
                        roadworksStyles.routeChip,
                        formData.route_id === route && roadworksStyles.routeChipActive
                      ]}
                      onPress={() => setFormData(prev => ({ ...prev, route_id: route }))}
                    >
                      <Text style={[
                        roadworksStyles.routeChipText,
                        formData.route_id === route && roadworksStyles.routeChipTextActive
                      ]}>
                        {route}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </View>

            {/* Scenario */}
            <View style={roadworksStyles.formGroup}>
              <Text style={roadworksStyles.formLabel}>Scenario Description *</Text>
              <TextInput
                style={[roadworksStyles.input, roadworksStyles.textArea]}
                value={formData.scenario}
                onChangeText={(text) => setFormData(prev => ({ ...prev, scenario: text }))}
                placeholder="Describe when this diversion should be used..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Severity */}
            <View style={roadworksStyles.formGroup}>
              <Text style={roadworksStyles.formLabel}>Default Severity</Text>
              <View style={roadworksStyles.severitySelector}>
                {['low', 'medium', 'high', 'critical'].map(severity => (
                  <Pressable
                    key={severity}
                    style={[
                      roadworksStyles.severityOption,
                      formData.default_severity === severity && roadworksStyles.severityOptionActive
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, default_severity: severity }))}
                  >
                    <Text style={[
                      roadworksStyles.severityOptionText,
                      formData.default_severity === severity && roadworksStyles.severityOptionTextActive
                    ]}>
                      {severity.charAt(0).toUpperCase() + severity.slice(1)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Estimated Delay */}
            <View style={roadworksStyles.formGroup}>
              <Text style={roadworksStyles.formLabel}>Estimated Delay (minutes)</Text>
              <TextInput
                style={roadworksStyles.input}
                value={formData.estimated_delay_minutes.toString()}
                onChangeText={(text) => setFormData(prev => ({ 
                  ...prev, 
                  estimated_delay_minutes: parseInt(text) || 0 
                }))}
                keyboardType="numeric"
                placeholder="15"
              />
            </View>

            {/* Diversion Waypoints */}
            <View style={roadworksStyles.formGroup}>
              <Text style={roadworksStyles.formLabel}>Diversion Waypoints *</Text>
              <View style={roadworksStyles.waypointInput}>
                <TextInput
                  style={[roadworksStyles.input, { flex: 1 }]}
                  value={currentWaypoint}
                  onChangeText={setCurrentWaypoint}
                  placeholder="Enter waypoint location..."
                  placeholderTextColor={colors.textMuted}
                  onSubmitEditing={handleAddWaypoint}
                />
                <Pressable
                  style={[roadworksStyles.iconButton, { marginLeft: spacing.sm }]}
                  onPress={handleAddWaypoint}
                >
                  <Ionicons name="add-circle" size={24} color={colors.primary} />
                </Pressable>
              </View>

              {formData.diversion_points.map((point, index) => (
                <View key={index} style={roadworksStyles.waypointItem}>
                  <View style={roadworksStyles.waypointNumber}>
                    <Text style={roadworksStyles.waypointNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={roadworksStyles.waypointText}>{point}</Text>
                  <Pressable
                    style={roadworksStyles.iconButton}
                    onPress={() => handleRemoveWaypoint(index)}
                  >
                    <Ionicons name="close-circle" size={20} color={colors.error} />
                  </Pressable>
                </View>
              ))}
            </View>

            {/* Instructions */}
            <View style={roadworksStyles.formGroup}>
              <Text style={roadworksStyles.formLabel}>Special Instructions</Text>
              <TextInput
                style={[roadworksStyles.input, roadworksStyles.textArea]}
                value={formData.instructions}
                onChangeText={(text) => setFormData(prev => ({ ...prev, instructions: text }))}
                placeholder="Any special instructions for drivers..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>

          <View style={roadworksStyles.modalFooter}>
            <Pressable
              style={[roadworksStyles.button, roadworksStyles.buttonSecondary]}
              onPress={onClose}
            >
              <Text style={roadworksStyles.buttonSecondaryText}>Cancel</Text>
            </Pressable>

            <Pressable
              style={[roadworksStyles.button, roadworksStyles.buttonPrimary]}
              onPress={handleSubmit}
            >
              <Text style={roadworksStyles.buttonPrimaryText}>
                {initialData ? 'Update Template' : 'Create Template'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default CreateTemplateModal;