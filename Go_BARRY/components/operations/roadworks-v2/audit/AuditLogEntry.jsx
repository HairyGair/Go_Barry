/*
 * Go Barry - Audit Log Entry Component
 * Individual entry display for audit log items
 */

import React, { useState } from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { roadworksStyles, colors } from '../styles/roadworks.styles';

const AuditLogEntry = ({ entry, index }) => {
  const [expanded, setExpanded] = useState(false);
  const [animation] = useState(new Animated.Value(0));

  const toggleExpanded = () => {
    const toValue = expanded ? 0 : 1;
    Animated.timing(animation, {
      toValue,
      duration: 200,
      useNativeDriver: false
    }).start();
    setExpanded(!expanded);
  };

  const getSeverityColor = (severity) => {
    const severityColors = {
      critical: colors.error,
      high: colors.warning,
      medium: colors.info,
      low: colors.success
    };
    return severityColors[severity?.toLowerCase()] || colors.textMuted;
  };

  const getActionIcon = (actionType) => {
    const iconMap = {
      'CREATE_ROADWORK': 'add-circle',
      'UPDATE_ROADWORK': 'create',
      'DELETE_ROADWORK': 'trash',
      'REVIEW_ROADWORK': 'checkmark-circle',
      'APPROVE_ROADWORK': 'thumbs-up',
      'DISMISS_ROADWORK': 'close-circle',
      'CREATE_DIVERSION': 'swap-horizontal',
      'UPDATE_DIVERSION': 'refresh',
      'PUSH_TO_DISPLAY': 'tv',
      'REMOVE_FROM_DISPLAY': 'tv-outline',
      'LOGIN': 'log-in',
      'LOGOUT': 'log-out',
      'VIEW_ANALYTICS': 'analytics',
      'GENERATE_REPORT': 'document-text'
    };
    return iconMap[actionType] || 'information-circle';
  };

  const formatActionType = (actionType) => {
    return actionType?.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown Action';
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderDetailValue = (key, value) => {
    if (value === null || value === undefined) return null;
    
    if (typeof value === 'object') {
      return (
        <View style={roadworksStyles.nestedDetail}>
          <Text style={roadworksStyles.nestedDetailKey}>{key}:</Text>
          {Object.entries(value).map(([nestedKey, nestedValue]) => (
            <View key={nestedKey} style={roadworksStyles.nestedDetailItem}>
              <Text style={roadworksStyles.nestedDetailSubkey}>{nestedKey}:</Text>
              <Text style={roadworksStyles.nestedDetailValue}>
                {typeof nestedValue === 'string' ? nestedValue : JSON.stringify(nestedValue)}
              </Text>
            </View>
          ))}
        </View>
      );
    }

    return (
      <View style={roadworksStyles.detailItem}>
        <Text style={roadworksStyles.detailKey}>{key}:</Text>
        <Text style={roadworksStyles.detailValue}>
          {typeof value === 'string' ? value : JSON.stringify(value)}
        </Text>
      </View>
    );
  };

  const animatedHeight = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 200] // Approximate expanded height
  });

  return (
    <View style={[
      roadworksStyles.auditLogEntry,
      index % 2 === 0 && roadworksStyles.auditLogEntryEven
    ]}>
      <Pressable
        style={roadworksStyles.auditLogEntryHeader}
        onPress={toggleExpanded}
      >
        {/* Left side - Icon and basic info */}
        <View style={roadworksStyles.auditLogEntryLeft}>
          <View style={[
            roadworksStyles.actionIcon,
            { backgroundColor: `${getSeverityColor(entry.severity)}20` }
          ]}>
            <Ionicons
              name={getActionIcon(entry.action_type)}
              size={20}
              color={getSeverityColor(entry.severity)}
            />
          </View>
          
          <View style={roadworksStyles.auditLogEntryInfo}>
            <Text style={roadworksStyles.auditLogEntryAction}>
              {formatActionType(entry.action_type)}
            </Text>
            <View style={roadworksStyles.auditLogEntryMeta}>
              <Text style={roadworksStyles.auditLogEntrySupervisor}>
                {entry.supervisor_badge || 'System'}
              </Text>
              <Text style={roadworksStyles.auditLogEntryMetaDivider}> • </Text>
              <Text style={roadworksStyles.auditLogEntryTime}>
                {formatTimestamp(entry.created_at)}
              </Text>
            </View>
          </View>
        </View>

        {/* Right side - Severity and expand indicator */}
        <View style={roadworksStyles.auditLogEntryRight}>
          <View style={[
            roadworksStyles.severityBadge,
            { backgroundColor: `${getSeverityColor(entry.severity)}20` }
          ]}>
            <Text style={[
              roadworksStyles.severityBadgeText,
              { color: getSeverityColor(entry.severity) }
            ]}>
              {entry.severity?.toUpperCase() || 'UNKNOWN'}
            </Text>
          </View>
          
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={colors.textMuted}
          />
        </View>
      </Pressable>

      {/* Quick summary line */}
      {entry.action_details && (
        <View style={roadworksStyles.auditLogEntrySummary}>
          <Text style={roadworksStyles.auditLogEntrySummaryText} numberOfLines={1}>
            {entry.action_details.location || 
             entry.action_details.roadworkId || 
             entry.action_details.description ||
             'Action performed'}
          </Text>
        </View>
      )}

      {/* Expandable details */}
      <Animated.View style={[
        roadworksStyles.auditLogEntryDetails,
        { height: expanded ? 'auto' : 0, opacity: animation }
      ]}>
        {expanded && (
          <View style={roadworksStyles.auditLogEntryDetailsContent}>
            {/* Target information */}
            {(entry.target_type || entry.target_id) && (
              <View style={roadworksStyles.targetInfo}>
                <Text style={roadworksStyles.targetInfoTitle}>Target:</Text>
                <Text style={roadworksStyles.targetInfoText}>
                  {entry.target_type || 'Unknown'} {entry.target_id && `(${entry.target_id})`}
                </Text>
              </View>
            )}

            {/* Action details */}
            {entry.action_details && Object.keys(entry.action_details).length > 0 && (
              <View style={roadworksStyles.actionDetails}>
                <Text style={roadworksStyles.actionDetailsTitle}>Details:</Text>
                <View style={roadworksStyles.actionDetailsContent}>
                  {Object.entries(entry.action_details).map(([key, value]) => 
                    renderDetailValue(key, value)
                  )}
                </View>
              </View>
            )}

            {/* Metadata */}
            {entry.metadata && (
              <View style={roadworksStyles.metadataSection}>
                <Text style={roadworksStyles.metadataTitle}>Metadata:</Text>
                <View style={roadworksStyles.metadataGrid}>
                  {entry.metadata.ip_address && (
                    <View style={roadworksStyles.metadataItem}>
                      <Ionicons name="globe" size={12} color={colors.textMuted} />
                      <Text style={roadworksStyles.metadataText}>
                        {entry.metadata.ip_address}
                      </Text>
                    </View>
                  )}
                  
                  {entry.metadata.user_agent && (
                    <View style={roadworksStyles.metadataItem}>
                      <Ionicons name="phone-portrait" size={12} color={colors.textMuted} />
                      <Text style={roadworksStyles.metadataText} numberOfLines={1}>
                        {entry.metadata.user_agent}
                      </Text>
                    </View>
                  )}
                  
                  {entry.metadata.session_id && (
                    <View style={roadworksStyles.metadataItem}>
                      <Ionicons name="key" size={12} color={colors.textMuted} />
                      <Text style={roadworksStyles.metadataText}>
                        Session: {entry.metadata.session_id.substring(0, 8)}...
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Full timestamp */}
            <View style={roadworksStyles.fullTimestamp}>
              <Ionicons name="time" size={12} color={colors.textMuted} />
              <Text style={roadworksStyles.fullTimestampText}>
                {new Date(entry.created_at).toLocaleString('en-GB', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </Text>
            </View>
          </View>
        )}
      </Animated.View>
    </View>
  );
};

export default AuditLogEntry;