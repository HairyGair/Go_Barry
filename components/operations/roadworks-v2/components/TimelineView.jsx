/*
 * Go Barry - Timeline View Component
 * Chronological roadworks planning and scheduling visualization
 */

import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { roadworksStyles, colors, spacing } from '../styles/roadworks.styles';

const TimelineView = ({
  roadworks = [],
  selectedDate = null,
  onDateSelect,
  onRoadworkSelect,
  viewMode = 'week', // 'day', 'week', 'month'
  showFilters = true,
  compactMode = false
}) => {
  const [currentDate, setCurrentDate] = useState(selectedDate || new Date());
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'active', 'planned', 'critical'

  // Get timeline data organized by date
  const timelineData = useMemo(() => {
    const data = new Map();
    
    roadworks.forEach(roadwork => {
      // Add start date events
      if (roadwork.startDate) {
        const startDate = new Date(roadwork.startDate).toDateString();
        if (!data.has(startDate)) {
          data.set(startDate, { date: startDate, events: [] });
        }
        data.get(startDate).events.push({
          ...roadwork,
          eventType: 'start',
          time: roadwork.startTime || '09:00',
          title: `Starts: ${roadwork.title || roadwork.location}`
        });
      }
      
      // Add end date events
      if (roadwork.endDate) {
        const endDate = new Date(roadwork.endDate).toDateString();
        if (!data.has(endDate)) {
          data.set(endDate, { date: endDate, events: [] });
        }
        data.get(endDate).events.push({
          ...roadwork,
          eventType: 'end',
          time: roadwork.endTime || '17:00',
          title: `Ends: ${roadwork.title || roadwork.location}`
        });
      }
      
      // Add milestone events
      if (roadwork.milestones) {
        roadwork.milestones.forEach(milestone => {
          const milestoneDate = new Date(milestone.date).toDateString();
          if (!data.has(milestoneDate)) {
            data.set(milestoneDate, { date: milestoneDate, events: [] });
          }
          data.get(milestoneDate).events.push({
            ...roadwork,
            eventType: 'milestone',
            time: milestone.time || '12:00',
            title: `${milestone.title}: ${roadwork.title || roadwork.location}`,
            milestone: milestone
          });
        });
      }
    });
    
    // Sort events within each date by time
    data.forEach(dayData => {
      dayData.events.sort((a, b) => a.time.localeCompare(b.time));
    });
    
    return data;
  }, [roadworks]);

  // Get dates to display based on view mode
  const getDisplayDates = () => {
    const dates = [];
    const today = new Date(currentDate);
    
    switch (viewMode) {
      case 'day':
        dates.push(new Date(today));
        break;
      case 'week':
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        for (let i = 0; i < 7; i++) {
          const date = new Date(startOfWeek);
          date.setDate(startOfWeek.getDate() + i);
          dates.push(date);
        }
        break;
      case 'month':
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        for (let d = new Date(startOfMonth); d <= endOfMonth; d.setDate(d.getDate() + 1)) {
          dates.push(new Date(d));
        }
        break;
    }
    
    return dates;
  };

  // Get event color based on type and severity
  const getEventColor = (event) => {
    if (event.severity === 'critical') return colors.critical;
    
    switch (event.eventType) {
      case 'start': return colors.success;
      case 'end': return colors.warning;
      case 'milestone': return colors.info;
      default: return colors.primary;
    }
  };

  // Get event icon
  const getEventIcon = (event) => {
    switch (event.eventType) {
      case 'start': return 'play-circle';
      case 'end': return 'stop-circle';
      case 'milestone': return 'flag';
      default: return 'construct';
    }
  };

  // Filter events based on active filter
  const filterEvents = (events) => {
    if (activeFilter === 'all') return events;
    
    return events.filter(event => {
      switch (activeFilter) {
        case 'active': return event.status === 'active';
        case 'planned': return event.status === 'planned';
        case 'critical': return event.severity === 'critical';
        default: return true;
      }
    });
  };

  // Navigate dates
  const navigateDate = (direction) => {
    const newDate = new Date(currentDate);
    
    switch (viewMode) {
      case 'day':
        newDate.setDate(newDate.getDate() + direction);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction * 7));
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + direction);
        break;
    }
    
    setCurrentDate(newDate);
  };

  const renderTimelineHeader = () => (
    <View style={[roadworksStyles.filterHeader, { marginBottom: spacing.sm }]}>
      <View style={roadworksStyles.row}>
        <Ionicons name="time" size={20} color={colors.primary} />
        <Text style={roadworksStyles.filterTitle}>Timeline View</Text>
        <View style={[roadworksStyles.tabBadge, { backgroundColor: colors.primary }]}>
          <Text style={roadworksStyles.tabBadgeText}>
            {Array.from(timelineData.values()).reduce((total, day) => total + day.events.length, 0)}
          </Text>
        </View>
      </View>
      
      <View style={roadworksStyles.row}>
        <Pressable
          style={roadworksStyles.quickActionButton}
          onPress={() => navigateDate(-1)}
        >
          <Ionicons name="chevron-back" size={16} color={colors.textMuted} />
        </Pressable>
        
        <Text style={[roadworksStyles.quickActionText, { minWidth: 120, textAlign: 'center' }]}>
          {viewMode === 'day' && currentDate.toLocaleDateString('en-GB', { 
            weekday: 'long', day: 'numeric', month: 'short' 
          })}
          {viewMode === 'week' && `Week of ${currentDate.toLocaleDateString('en-GB', { 
            day: 'numeric', month: 'short' 
          })}`}
          {viewMode === 'month' && currentDate.toLocaleDateString('en-GB', { 
            month: 'long', year: 'numeric' 
          })}
        </Text>
        
        <Pressable
          style={roadworksStyles.quickActionButton}
          onPress={() => navigateDate(1)}
        >
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </Pressable>
      </View>
    </View>
  );

  const renderViewModeSelector = () => (
    <View style={[roadworksStyles.tabContainer, { marginBottom: spacing.md }]}>
      {['day', 'week', 'month'].map((mode) => (
        <Pressable
          key={mode}
          style={[
            roadworksStyles.tab,
            viewMode === mode && roadworksStyles.tabActive
          ]}
          onPress={() => setCurrentDate(new Date())} // Reset to today when changing mode
        >
          <Text style={[
            roadworksStyles.tabText,
            viewMode === mode && roadworksStyles.tabTextActive
          ]}>
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </Text>
        </Pressable>
      ))}
    </View>
  );

  const renderFilterButtons = () => (
    <View style={[roadworksStyles.filterRow, { marginBottom: spacing.md }]}>
      {[
        { key: 'all', label: 'All Events', icon: 'list' },
        { key: 'active', label: 'Active', icon: 'play-circle', color: colors.success },
        { key: 'planned', label: 'Planned', icon: 'calendar', color: colors.warning },
        { key: 'critical', label: 'Critical', icon: 'warning', color: colors.critical }
      ].map((filter) => (
        <Pressable
          key={filter.key}
          style={[
            roadworksStyles.filterChip,
            activeFilter === filter.key && roadworksStyles.filterChipActive
          ]}
          onPress={() => setActiveFilter(filter.key)}
        >
          <View style={roadworksStyles.row}>
            <Ionicons 
              name={filter.icon} 
              size={14} 
              color={activeFilter === filter.key 
                ? colors.textPrimary 
                : (filter.color || colors.textMuted)
              } 
            />
            <Text style={[
              roadworksStyles.filterChipText,
              activeFilter === filter.key && roadworksStyles.filterChipTextActive
            ]}>
              {filter.label}
            </Text>
          </View>
        </Pressable>
      ))}
    </View>
  );

  const renderTimelineEvent = (event, index) => (
    <Pressable
      key={`${event.id}-${event.eventType}-${index}`}
      style={[
        roadworksStyles.roadworkCard,
        { 
          marginBottom: spacing.sm,
          borderLeftWidth: 4,
          borderLeftColor: getEventColor(event),
          paddingLeft: spacing.md
        }
      ]}
      onPress={() => onRoadworkSelect?.(event)}
    >
      <View style={roadworksStyles.roadworkCardHeader}>
        <View style={roadworksStyles.row}>
          <Ionicons 
            name={getEventIcon(event)} 
            size={16} 
            color={getEventColor(event)} 
          />
          <Text style={[roadworksStyles.statTrendText, { fontWeight: '500' }]}>
            {event.time}
          </Text>
        </View>
        
        <View style={[
          roadworksStyles.statusBadge,
          { backgroundColor: getEventColor(event) }
        ]}>
          <Text style={roadworksStyles.statusBadgeText}>
            {event.eventType.toUpperCase()}
          </Text>
        </View>
      </View>
      
      <Text style={[roadworksStyles.roadworkTitle, { fontSize: 16 }]} numberOfLines={2}>
        {event.title}
      </Text>
      
      {event.description && (
        <Text style={roadworksStyles.roadworkDescription} numberOfLines={2}>
          {event.description}
        </Text>
      )}
      
      <View style={roadworksStyles.roadworkMeta}>
        {event.affectsRoutes && event.affectsRoutes.length > 0 && (
          <View style={roadworksStyles.row}>
            <Ionicons name="bus" size={12} color={colors.textMuted} />
            <Text style={roadworksStyles.statTrendText}>
              {event.affectsRoutes.slice(0, 3).join(', ')}
              {event.affectsRoutes.length > 3 && ` +${event.affectsRoutes.length - 3} more`}
            </Text>
          </View>
        )}
        
        <View style={[
          roadworksStyles.statusBadge,
          { backgroundColor: colors.surface }
        ]}>
          <Text style={[roadworksStyles.statusBadgeText, { color: colors.textSecondary }]}>
            {event.source || 'Manual'}
          </Text>
        </View>
      </View>
    </Pressable>
  );

  const renderTimelineDay = (date) => {
    const dateKey = date.toDateString();
    const dayData = timelineData.get(dateKey);
    const isToday = date.toDateString() === new Date().toDateString();
    const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
    
    let events = dayData ? filterEvents(dayData.events) : [];

    return (
      <View 
        key={dateKey}
        style={[
          roadworksStyles.section,
          compactMode && { marginBottom: spacing.sm }
        ]}
      >
        {/* Date Header */}
        <Pressable
          style={[
            roadworksStyles.filterHeader,
            {
              backgroundColor: isToday ? colors.primary : (isSelected ? colors.interactive : colors.surface),
              borderRadius: 8,
              marginBottom: spacing.sm
            }
          ]}
          onPress={() => onDateSelect?.(date)}
        >
          <View style={roadworksStyles.row}>
            <Ionicons 
              name={isToday ? "today" : "calendar"} 
              size={16} 
              color={isToday || isSelected ? colors.textPrimary : colors.textSecondary} 
            />
            <Text style={[
              roadworksStyles.filterTitle,
              { 
                color: isToday || isSelected ? colors.textPrimary : colors.textSecondary,
                fontSize: compactMode ? 14 : 16
              }
            ]}>
              {date.toLocaleDateString('en-GB', { 
                weekday: compactMode ? 'short' : 'long',
                day: 'numeric', 
                month: 'short' 
              })}
            </Text>
            {isToday && (
              <View style={[roadworksStyles.statusBadge, { backgroundColor: colors.success }]}>
                <Text style={roadworksStyles.statusBadgeText}>TODAY</Text>
              </View>
            )}
          </View>
          
          {events.length > 0 && (
            <View style={[roadworksStyles.tabBadge, { 
              backgroundColor: isToday || isSelected ? colors.textPrimary : colors.warning 
            }]}>
              <Text style={[
                roadworksStyles.tabBadgeText,
                { color: isToday || isSelected ? colors.primary : colors.textPrimary }
              ]}>
                {events.length}
              </Text>
            </View>
          )}
        </Pressable>
        
        {/* Events */}
        {events.length > 0 ? (
          events.map((event, index) => renderTimelineEvent(event, index))
        ) : (
          !compactMode && (
            <View style={[roadworksStyles.emptyContainer, { padding: spacing.md }]}>
              <Ionicons name="calendar" size={24} color={colors.textMuted} />
              <Text style={roadworksStyles.statTrendText}>No events scheduled</Text>
            </View>
          )
        )}
      </View>
    );
  };

  const displayDates = getDisplayDates();

  return (
    <View style={roadworksStyles.filterContainer}>
      {renderTimelineHeader()}
      
      {showFilters && (
        <>
          {renderViewModeSelector()}
          {renderFilterButtons()}
        </>
      )}
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing.lg }}
      >
        {displayDates.map(date => renderTimelineDay(date))}
        
        {displayDates.every(date => {
          const dayData = timelineData.get(date.toDateString());
          return !dayData || filterEvents(dayData.events).length === 0;
        }) && (
          <View style={roadworksStyles.emptyContainer}>
            <Ionicons name="time" size={48} color={colors.textMuted} />
            <Text style={roadworksStyles.emptyTitle}>No Timeline Events</Text>
            <Text style={roadworksStyles.emptyDescription}>
              No roadwork events found for the selected {viewMode} period.
              Try changing the date range or adjusting your filters.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default TimelineView;