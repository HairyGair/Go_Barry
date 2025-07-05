/*
 * Go Barry - Template Card Component
 * Display individual diversion template
 */

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { roadworksStyles, colors, spacing } from '../styles/roadworks.styles';

const TemplateCard = ({ template, onPress, onDelete, onDuplicate }) => {
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return colors.error;
      case 'high': return colors.warning;
      case 'medium': return colors.primary;
      default: return colors.success;
    }
  };

  return (
    <Pressable
      style={roadworksStyles.templateCard}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Template: ${template.name}`}
    >
      <View style={roadworksStyles.templateHeader}>
        <View style={[
          roadworksStyles.routeBadge,
          { backgroundColor: colors.primary + '20' }
        ]}>
          <Text style={[roadworksStyles.routeBadgeText, { color: colors.primary }]}>
            Route {template.route_id}
          </Text>
        </View>
        
        <View style={roadworksStyles.row}>
          <Pressable
            style={roadworksStyles.iconButton}
            onPress={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
            accessibilityLabel="Duplicate template"
          >
            <Ionicons name="copy" size={16} color={colors.textMuted} />
          </Pressable>
          
          <Pressable
            style={[roadworksStyles.iconButton, { marginLeft: spacing.xs }]}
            onPress={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            accessibilityLabel="Delete template"
          >
            <Ionicons name="trash" size={16} color={colors.error} />
          </Pressable>
        </View>
      </View>

      <Text style={roadworksStyles.templateTitle}>{template.name}</Text>
      
      <Text style={roadworksStyles.templateScenario} numberOfLines={2}>
        {template.scenario}
      </Text>

      <View style={roadworksStyles.templateStats}>
        <View style={roadworksStyles.row}>
          <Ionicons name="location" size={12} color={colors.textMuted} />
          <Text style={roadworksStyles.templateStatText}>
            {template.diversion_points?.length || 0} waypoints
          </Text>
        </View>
        
        <View style={[roadworksStyles.row, { marginLeft: spacing.md }]}>
          <Ionicons name="time" size={12} color={colors.textMuted} />
          <Text style={roadworksStyles.templateStatText}>
            +{template.estimated_delay_minutes || 0} mins
          </Text>
        </View>
      </View>

      <View style={roadworksStyles.templateFooter}>
        <View style={[
          roadworksStyles.severityBadge,
          { backgroundColor: getSeverityColor(template.default_severity) + '20' }
        ]}>
          <View style={[
            roadworksStyles.severityIndicator,
            { backgroundColor: getSeverityColor(template.default_severity) }
          ]} />
          <Text style={[
            roadworksStyles.severityText,
            { color: getSeverityColor(template.default_severity) }
          ]}>
            {template.default_severity}
          </Text>
        </View>
        
        <Text style={roadworksStyles.templateUseCount}>
          Used {template.use_count || 0} times
        </Text>
      </View>
    </Pressable>
  );
};

export default TemplateCard;