// EventManager.jsx - Major event management for supervisors
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, Platform } from 'react-native';

const EventManager = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState({});
  const [newEvent, setNewEvent] = useState({
    event: '',
    venue: '',
    location: '',
    startTime: '',
    endTime: '',
    category: 'SPORTING',
    severity: 'MEDIUM',
    description: '',
    affectedRoutes: ''
  });

  useEffect(() => {
    fetchEvents();
    fetchCategories();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://go-barry.onrender.com/api/events/all');
      const data = await response.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('https://go-barry.onrender.com/api/events/categories');
      const data = await response.json();
      setCategories(data.categories || {});
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleAddEvent = async () => {
    if (!newEvent.event || !newEvent.venue || !newEvent.startTime || !newEvent.endTime) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const routesArray = newEvent.affectedRoutes
        .split(',')
        .map(r => r.trim())
        .filter(r => r);

      const response = await fetch('https://go-barry.onrender.com/api/events/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newEvent,
          affectedRoutes: routesArray
        })
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert('Success', 'Event added successfully');
        fetchEvents();
        // Reset form
        setNewEvent({
          event: '',
          venue: '',
          location: '',
          startTime: '',
          endTime: '',
          category: 'SPORTING',
          severity: 'MEDIUM',
          description: '',
          affectedRoutes: ''
        });
      } else {
        Alert.alert('Error', data.error || 'Failed to add event');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add event');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this event?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`https://go-barry.onrender.com/api/events/${eventId}`, {
                method: 'DELETE'
              });
              
              if (response.ok) {
                fetchEvents();
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete event');
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🎪 Major Event Management</Text>
        <Text style={styles.subtitle}>Add events that may cause significant disruption</Text>
      </View>

      {/* Add Event Form */}
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Add New Event</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Event Name *"
          value={newEvent.event}
          onChangeText={(text) => setNewEvent({ ...newEvent, event: text })}
        />

        <TextInput
          style={styles.input}
          placeholder="Venue *"
          value={newEvent.venue}
          onChangeText={(text) => setNewEvent({ ...newEvent, venue: text })}
        />

        <TextInput
          style={styles.input}
          placeholder="Location (if different from venue)"
          value={newEvent.location}
          onChangeText={(text) => setNewEvent({ ...newEvent, location: text })}
        />

        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.halfInput]}
            placeholder="Start Time *"
            value={newEvent.startTime}
            onChangeText={(text) => setNewEvent({ ...newEvent, startTime: text })}
          />
          
          <TextInput
            style={[styles.input, styles.halfInput]}
            placeholder="End Time *"
            value={newEvent.endTime}
            onChangeText={(text) => setNewEvent({ ...newEvent, endTime: text })}
          />
        </View>

        <Text style={styles.label}>Category</Text>
        <View style={styles.categoryGrid}>
          {Object.entries(categories).map(([key, cat]) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.categoryButton,
                newEvent.category === key && styles.categoryButtonActive
              ]}
              onPress={() => setNewEvent({ ...newEvent, category: key })}
            >
              <Text style={styles.categoryIcon}>{cat.icon}</Text>
              <Text style={[
                styles.categoryText,
                newEvent.category === key && styles.categoryTextActive
              ]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Severity</Text>
        <View style={styles.severityRow}>
          {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(sev => (
            <TouchableOpacity
              key={sev}
              style={[
                styles.severityButton,
                newEvent.severity === sev && styles[`severity${sev}`]
              ]}
              onPress={() => setNewEvent({ ...newEvent, severity: sev })}
            >
              <Text style={[
                styles.severityText,
                newEvent.severity === sev && styles.severityTextActive
              ]}>
                {sev}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Description"
          multiline
          numberOfLines={3}
          value={newEvent.description}
          onChangeText={(text) => setNewEvent({ ...newEvent, description: text })}
        />

        <TextInput
          style={styles.input}
          placeholder="Affected Routes (comma separated)"
          value={newEvent.affectedRoutes}
          onChangeText={(text) => setNewEvent({ ...newEvent, affectedRoutes: text })}
        />

        <TouchableOpacity style={styles.addButton} onPress={handleAddEvent}>
          <Text style={styles.addButtonText}>Add Event</Text>
        </TouchableOpacity>
      </View>

      {/* Events List */}
      <View style={styles.listSection}>
        <Text style={styles.sectionTitle}>Current Events</Text>
        
        {loading ? (
          <Text style={styles.loadingText}>Loading events...</Text>
        ) : events.length === 0 ? (
          <Text style={styles.emptyText}>No events scheduled</Text>
        ) : (
          events.map(event => {
            const isActive = new Date(event.startTime) <= new Date() && 
                           new Date(event.endTime) >= new Date();
            
            return (
              <View 
                key={event.id} 
                style={[
                  styles.eventCard,
                  isActive && styles.eventCardActive
                ]}
              >
                <View style={styles.eventHeader}>
                  <Text style={styles.eventIcon}>
                    {categories[event.category]?.icon || '📅'}
                  </Text>
                  <View style={styles.eventDetails}>
                    <Text style={styles.eventName}>{event.event}</Text>
                    <Text style={styles.eventVenue}>{event.venue}</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={() => handleDeleteEvent(event.id)}
                  >
                    <Text style={styles.deleteButtonText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.eventInfo}>
                  <Text style={styles.eventTime}>
                    {new Date(event.startTime).toLocaleString()} - {new Date(event.endTime).toLocaleString()}
                  </Text>
                  {isActive && (
                    <Text style={styles.activeLabel}>ACTIVE NOW</Text>
                  )}
                </View>
                
                {event.description && (
                  <Text style={styles.eventDescription}>{event.description}</Text>
                )}
                
                {event.affectedRoutes && event.affectedRoutes.length > 0 && (
                  <View style={styles.routesContainer}>
                    <Text style={styles.routesLabel}>Affected Routes:</Text>
                    <View style={styles.routeTags}>
                      {event.affectedRoutes.map((route, idx) => (
                        <Text key={idx} style={styles.routeTag}>
                          {route}
                        </Text>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#667eea',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  formSection: {
    backgroundColor: 'white',
    margin: 10,
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  halfInput: {
    flex: 1,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  categoryButton: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    minWidth: 90,
  },
  categoryButtonActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 11,
    color: '#666',
  },
  categoryTextActive: {
    color: 'white',
  },
  severityRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  severityButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  severityLOW: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  severityMEDIUM: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  severityHIGH: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  severityCRITICAL: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  severityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  severityTextActive: {
    color: 'white',
  },
  addButton: {
    backgroundColor: '#10B981',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  listSection: {
    margin: 10,
    marginBottom: 30,
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 20,
    fontStyle: 'italic',
  },
  eventCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  eventCardActive: {
    borderWidth: 2,
    borderColor: '#DC2626',
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  eventIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  eventDetails: {
    flex: 1,
  },
  eventName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  eventVenue: {
    fontSize: 14,
    color: '#666',
  },
  deleteButton: {
    padding: 8,
  },
  deleteButtonText: {
    fontSize: 20,
  },
  eventInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventTime: {
    fontSize: 12,
    color: '#666',
  },
  activeLabel: {
    backgroundColor: '#DC2626',
    color: 'white',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 10,
    fontWeight: '600',
  },
  eventDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
    lineHeight: 18,
  },
  routesContainer: {
    marginTop: 8,
  },
  routesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  routeTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  routeTag: {
    backgroundColor: '#3B82F6',
    color: 'white',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 11,
    fontWeight: '600',
  },
});

export default EventManager;