import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const templates = [
  {
    id: 'rtc',
    icon: 'car',
    title: 'Road Traffic Collision',
    template: 'RTC at [location] affecting routes [routes]. Police on scene.',
    type: 'Road Traffic Collision',
    actionTaken: 'Emergency services managing traffic flow'
  },
  {
    id: 'road-closed',
    icon: 'close-circle',
    title: 'Road Closure',
    template: 'Road closed at [location]. Routes [routes] diverted via [diversion].',
    type: 'Road Closure',
    actionTaken: 'Diversion in place'
  },
  {
    id: 'emergency-block',
    icon: 'medical',
    title: 'Emergency Services Blocking',
    template: 'Ambulance blocking at [location]. Routes [routes] delayed.',
    type: 'Emergency Services Blocking',
    actionTaken: 'Buses holding back until clear'
  },
  {
    id: 'burst-main',
    icon: 'water',
    title: 'Burst Water Main',
    template: 'Burst water main at [location]. Routes [routes] diverted.',
    type: 'Utilities',
    actionTaken: 'Northumbrian Water on site'
  },
  {
    id: 'traffic-lights',
    icon: 'traffic-light',
    title: 'Traffic Light Failure',
    template: 'Traffic lights failed at [location]. Routes [routes] experiencing delays.',
    type: 'Traffic Light Failure',
    actionTaken: 'Police managing junction'
  },
  {
    id: 'flooding',
    icon: 'rainy',
    title: 'Flooding',
    template: 'Flooding at [location]. Routes [routes] suspended between [stops].',
    type: 'Flooding',
    actionTaken: 'Services terminating short of affected area'
  },
  {
    id: 'breakdown',
    icon: 'bus',
    title: 'Vehicle Breakdown',
    template: 'Bus breakdown at [location] blocking carriageway. Routes [routes] delayed.',
    type: 'Vehicle Breakdown',
    actionTaken: 'Recovery en route'
  },
  {
    id: 'event-traffic',
    icon: 'people',
    title: 'Event Traffic',
    template: 'Heavy traffic due to [event] at [location]. Routes [routes] experiencing delays.',
    type: 'Event Traffic',
    actionTaken: 'Additional time added to services'
  }
];

const IncidentTemplates = ({ onSelectTemplate, selectedRoutes = [], location = '' }) => {
  const applyTemplate = (template) => {
    // Replace placeholders with actual data
    let description = template.template;
    let actionTaken = template.actionTaken;
    
    // Replace location
    if (location) {
      description = description.replace('[location]', location);
      actionTaken = actionTaken.replace('[location]', location);
    }
    
    // Replace routes
    if (selectedRoutes.length > 0) {
      const routeList = selectedRoutes.join(', ');
      description = description.replace('[routes]', routeList);
      actionTaken = actionTaken.replace('[routes]', routeList);
    }
    
    // Return template data
    onSelectTemplate({
      type: template.type,
      description,
      actionTaken,
      templateId: template.id
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quick Templates</Text>
      <Text style={styles.subtitle}>Select a template to pre-fill incident details</Text>
      
      <ScrollView style={styles.templateList} showsVerticalScrollIndicator={false}>
        {templates.map((template) => (
          <TouchableOpacity
            key={template.id}
            style={styles.templateCard}
            onPress={() => applyTemplate(template)}
            activeOpacity={0.7}
          >
            <View style={styles.templateIcon}>
              <Ionicons 
                name={template.icon} 
                size={24} 
                color="#FF6B6B"
              />
            </View>
            <View style={styles.templateContent}>
              <Text style={styles.templateTitle}>{template.title}</Text>
              <Text style={styles.templatePreview} numberOfLines={2}>
                {template.template}
              </Text>
            </View>
            <Ionicons 
              name="chevron-forward" 
              size={20} 
              color="#666"
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      <View style={styles.tipContainer}>
        <Ionicons name="information-circle" size={16} color="#4ECDC4" />
        <Text style={styles.tipText}>
          Templates will automatically include your selected location and routes
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  templateList: {
    flex: 1,
  },
  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  templateIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFE5E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  templateContent: {
    flex: 1,
    marginRight: 8,
  },
  templateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  templatePreview: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8FFFE',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  tipText: {
    fontSize: 13,
    color: '#2A8B88',
    marginLeft: 8,
    flex: 1,
  },
});

export default IncidentTemplates;