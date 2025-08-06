import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';

const DUTIES = [
  { code: 'D100', name: 'Early Breakdown Handler', time: '06:00 - 15:30', color: '#FF6B6B' },
  { code: 'D200', name: 'Vehicle Regulator', time: '07:30 - 17:00', color: '#4ECDC4' },
  { code: 'D400', name: 'Afternoon Regulator', time: '12:30 - 22:00', color: '#45B7D1' },
  { code: 'D500', name: 'Lost Mileage Coordinator', time: '14:45 - 00:15', color: '#96CEB4' }
];

export default function DutySelectionModal({ visible, onSelectDuty, onCancel }) {
  const currentTime = new Date().getHours() * 100 + new Date().getMinutes();
  
  const getSuggestedDuty = () => {
    if (currentTime >= 545 && currentTime < 800) return 'D100';
    if (currentTime >= 700 && currentTime < 1300) return 'D200';
    if (currentTime >= 1200 && currentTime < 1500) return 'D400';
    if (currentTime >= 1400) return 'D500';
    return null;
  };
  
  const suggested = getSuggestedDuty();

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Select Your Duty</Text>
          
          {DUTIES.map(duty => (
            <TouchableOpacity
              key={duty.code}
              style={[
                styles.dutyCard,
                { borderColor: duty.color },
                suggested === duty.code && styles.suggested
              ]}
              onPress={() => onSelectDuty(duty.code)}
            >
              <View style={[styles.colorBar, { backgroundColor: duty.color }]} />
              <View style={styles.dutyInfo}>
                <Text style={styles.dutyCode}>{duty.code}</Text>
                <Text style={styles.dutyName}>{duty.name}</Text>
                <Text style={styles.dutyTime}>{duty.time}</Text>
              </View>
              {suggested === duty.code && (
                <Text style={styles.suggestedBadge}>Suggested</Text>
              )}
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center'
  },
  dutyCard: {
    flexDirection: 'row',
    borderWidth: 2,
    borderRadius: 8,
    marginBottom: 10,
    overflow: 'hidden'
  },
  colorBar: {
    width: 8
  },
  dutyInfo: {
    flex: 1,
    padding: 12
  },
  dutyCode: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  dutyName: {
    fontSize: 14,
    color: '#666'
  },
  dutyTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 2
  },
  suggested: {
    backgroundColor: '#f0f8ff'
  },
  suggestedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#007AFF',
    color: 'white',
    fontSize: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10
  },
  cancelButton: {
    marginTop: 10,
    padding: 12,
    alignItems: 'center'
  },
  cancelText: {
    color: '#007AFF',
    fontSize: 16
  }
});
