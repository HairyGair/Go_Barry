import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Alert } from 'react-native';
import { useSupervisor } from './hooks/useSupervisorSession';
import DutySelectionModal from './DutySelectionModal';

const DUTY_INFO = {
  '100': { name: 'Early Breakdown Handler', color: '#FF6B6B' },
  '200': { name: 'Vehicle Regulator', color: '#4ECDC4' },
  '400': { name: 'Afternoon Regulator', color: '#45B7D1' },
  '500': { name: 'Lost Mileage Coordinator', color: '#96CEB4' }
};

export default function ShiftManagementScreen() {
  // Use global shift state from supervisor context
  const { 
    supervisorSession, 
    supervisorName,
    currentShift,
    clockIn,
    clockOut,
    startBreak,
    endBreak,
    isOnBreak,
    isClockedIn,
    fetchCurrentShift
  } = useSupervisor();
  
  const [showDutyModal, setShowDutyModal] = useState(false);
  const [showHandoverModal, setShowHandoverModal] = useState(false);
  const [handoverNotes, setHandoverNotes] = useState('');
  const [timeWorked, setTimeWorked] = useState('00:00');

  // Refresh shift data when component mounts only if needed
  useEffect(() => {
    // Only fetch if we're logged in and don't have current shift data
    if (supervisorSession?.supervisor?.badge && !currentShift) {
      fetchCurrentShift();
    }
  }, []);  // Empty dependency to only run once on mount

  // Update time worked every minute
  useEffect(() => {
    if (currentShift?.clock_in) {
      updateTimeWorked();
      const interval = setInterval(updateTimeWorked, 60000);
      return () => clearInterval(interval);
    }
  }, [currentShift]);

  const updateTimeWorked = () => {
    if (currentShift?.clock_in) {
      const start = new Date(currentShift.clock_in);
      const now = new Date();
      const diff = now - start;
      
      // Subtract break time if applicable
      let breakTime = 0;
      if (currentShift.break_start && currentShift.break_end) {
        breakTime = new Date(currentShift.break_end) - new Date(currentShift.break_start);
      }
      
      const totalMinutes = Math.floor((diff - breakTime) / 60000);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      setTimeWorked(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
    }
  };

  const handleDutySelect = async (dutyCode) => {
    setShowDutyModal(false);
    const result = await clockIn(dutyCode);
    if (result.success) {
      Alert.alert('Success', `Clocked in to D${dutyCode}`);
    } else {
      Alert.alert('Error', result.message || 'Failed to clock in');
    }
  };

  const handleBreak = async () => {
    const result = isOnBreak ? await endBreak() : await startBreak();
    if (result.success) {
      Alert.alert('Success', isOnBreak ? 'Break ended' : 'Break started');
    } else {
      Alert.alert('Error', 'Failed to update break status');
    }
  };

  const handleClockOut = async () => {
    if (!handoverNotes.trim()) {
      Alert.alert('Error', 'Please enter handover notes');
      return;
    }

    const result = await clockOut(handoverNotes);
    if (result.success) {
      setShowHandoverModal(false);
      setHandoverNotes('');
      Alert.alert('Success', 'Clocked out successfully');
    } else {
      Alert.alert('Error', 'Failed to clock out');
    }
  };

  // Not clocked in view
  if (!isClockedIn) {
    return (
      <View style={styles.container}>
        <View style={styles.notClockedIn}>
          <Text style={styles.welcomeText}>Welcome, {supervisorName}</Text>
          <Text style={styles.statusText}>You are not clocked in</Text>
          <TouchableOpacity 
            style={styles.clockInButton}
            onPress={() => setShowDutyModal(true)}
          >
            <Text style={styles.buttonText}>Clock In</Text>
          </TouchableOpacity>
        </View>
        
        <DutySelectionModal
          visible={showDutyModal}
          onSelectDuty={handleDutySelect}
          onCancel={() => setShowDutyModal(false)}
        />
      </View>
    );
  }

  const dutyInfo = DUTY_INFO[currentShift.duty_code];

  // Clocked in view
  return (
    <View style={styles.container}>
      <View style={[styles.dutyCard, { borderColor: dutyInfo?.color || '#666' }]}>
        <View style={[styles.dutyBar, { backgroundColor: dutyInfo?.color || '#666' }]} />
        <View style={styles.dutyContent}>
          <Text style={styles.dutyCode}>D{currentShift.duty_code}</Text>
          <Text style={styles.dutyName}>{dutyInfo?.name || 'Unknown Duty'}</Text>
          <Text style={styles.clockInTime}>
            Clocked in: {new Date(currentShift.clock_in).toLocaleTimeString()}
          </Text>
        </View>
      </View>

      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Time Worked</Text>
          <Text style={styles.statValue}>{timeWorked}</Text>
        </View>
        {isOnBreak && (
          <View style={styles.breakIndicator}>
            <Text style={styles.breakText}>ON BREAK</Text>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[
            styles.breakButton,
            isOnBreak && styles.endBreakButton,
            currentShift.break_start && currentShift.break_end && styles.disabledButton
          ]}
          onPress={handleBreak}
          disabled={currentShift.break_start && currentShift.break_end}
        >
          <Text style={styles.buttonText}>
            {currentShift.break_start && currentShift.break_end 
              ? 'Break Taken' 
              : isOnBreak 
              ? 'End Break' 
              : 'Take 30min Break'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.clockOutButton}
          onPress={() => setShowHandoverModal(true)}
        >
          <Text style={styles.buttonText}>Clock Out</Text>
        </TouchableOpacity>
      </View>

      {/* Handover Modal */}
      {showHandoverModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.handoverModal}>
            <Text style={styles.modalTitle}>Handover Notes</Text>
            <Text style={styles.modalSubtitle}>
              Please provide handover notes for the next shift
            </Text>
            <TextInput
              style={styles.notesInput}
              multiline
              numberOfLines={4}
              value={handoverNotes}
              onChangeText={setHandoverNotes}
              placeholder="Enter any important information for the next shift..."
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowHandoverModal(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleClockOut}
              >
                <Text style={styles.buttonText}>Clock Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5'
  },
  notClockedIn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10
  },
  statusText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 30
  },
  clockInButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 8
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  },
  dutyCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 2,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 20
  },
  dutyBar: {
    width: 12
  },
  dutyContent: {
    padding: 16,
    flex: 1
  },
  dutyCode: {
    fontSize: 24,
    fontWeight: 'bold'
  },
  dutyName: {
    fontSize: 16,
    color: '#666',
    marginTop: 4
  },
  clockInTime: {
    fontSize: 14,
    color: '#999',
    marginTop: 8
  },
  statsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  statItem: {
    alignItems: 'center'
  },
  statLabel: {
    fontSize: 14,
    color: '#666'
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 4
  },
  breakIndicator: {
    backgroundColor: '#FFA500',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20
  },
  breakText: {
    color: 'white',
    fontWeight: 'bold'
  },
  actions: {
    gap: 12
  },
  breakButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center'
  },
  endBreakButton: {
    backgroundColor: '#FFA500'
  },
  disabledButton: {
    backgroundColor: '#ccc'
  },
  clockOutButton: {
    backgroundColor: '#FF6B6B',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center'
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  handoverModal: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top'
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16
  },
  cancelButton: {
    padding: 12
  },
  cancelText: {
    color: '#007AFF',
    fontSize: 16
  },
  confirmButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8
  }
});
