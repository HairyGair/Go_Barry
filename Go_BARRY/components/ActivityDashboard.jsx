import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSupervisorSession } from './hooks/useSupervisorSession';
import ActivityCharts from './ActivityCharts';

const TIME_PERIODS = [
  { id: 'today', label: 'Today', icon: 'calendar-today' },
  { id: 'week', label: 'This Week', icon: 'calendar-week' },
  { id: 'custom', label: 'Custom Range', icon: 'calendar-range' }
];

const DUTY_COLORS = {
  D100: '#FF6B6B',
  D200: '#4ECDC4',
  D400: '#45B7D1',
  D500: '#96CEB4'
};

export default function ActivityDashboard() {
  const { supervisorSession, supervisorName, isAdmin } = useSupervisorSession();
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [selectedSupervisor, setSelectedSupervisor] = useState(null);
  const [showSupervisorPicker, setShowSupervisorPicker] = useState(false);
  const [activityData, setActivityData] = useState({
    shifts: [],
    actions: [],
    stats: {
      totalHours: 0,
      shiftsCompleted: 0,
      alertsDismissed: 0,
      breaksUsed: 0
    }
  });
  const [loading, setLoading] = useState(true);

  // Set date range based on selected period
  useEffect(() => {
    const now = new Date();
    switch (selectedPeriod) {
      case 'today':
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);
        setStartDate(todayStart);
        setEndDate(todayEnd);
        break;
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        setStartDate(weekStart);
        setEndDate(weekEnd);
        break;
      // custom range handled by date pickers
    }
  }, [selectedPeriod]);

  // Fetch activity data when dates change
  useEffect(() => {
    if (supervisorSession?.supervisor?.badge) {
      fetchActivityData();
    }
  }, [startDate, endDate, supervisorSession]);

  const fetchActivityData = async () => {
    setLoading(true);
    try {
      // Fetch activity summary with date range
      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });
      
      const response = await fetch(
        `https://go-barry.onrender.com/api/shifts/activity-summary/${supervisorSession.supervisor.badge}?${params}`
      );
      const data = await response.json();
      
      if (data.success) {
        setActivityData({
          shifts: data.shifts || [],
          actions: data.actions || [],
          stats: data.summary || {
            totalHours: 0,
            shiftsCompleted: 0,
            alertsDismissed: 0,
            breaksUsed: 0
          }
        });
      }
    } catch (error) {
      console.error('Error fetching activity data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-GB', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short' 
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (start, end) => {
    if (!end) return 'In Progress';
    const minutes = (new Date(end) - new Date(start)) / 60000;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  // Export functions
  const exportPDF = async () => {
    // For web, we'll create a simple HTML and trigger print
    if (Platform.OS === 'web') {
      const printWindow = window.open('', '', 'width=800,height=600');
      const html = `
        <html>
          <head>
            <title>Activity Report - ${supervisorName}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { color: #1f2937; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th, td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; }
              th { background-color: #f3f4f6; font-weight: bold; }
              .summary { display: flex; gap: 20px; margin: 20px 0; }
              .summary-item { flex: 1; text-align: center; padding: 15px; border: 1px solid #e5e7eb; }
            </style>
          </head>
          <body>
            <h1>Activity Report - ${supervisorName}</h1>
            <p>Period: ${formatDate(startDate)} - ${formatDate(endDate)}</p>
            
            <div class="summary">
              <div class="summary-item">
                <h3>${activityData.stats.totalHours}</h3>
                <p>Hours Worked</p>
              </div>
              <div class="summary-item">
                <h3>${activityData.stats.shiftsCompleted}</h3>
                <p>Shifts Completed</p>
              </div>
              <div class="summary-item">
                <h3>${activityData.stats.alertsDismissed}</h3>
                <p>Alerts Handled</p>
              </div>
            </div>
            
            <h2>Shift Details</h2>
            <table>
              <tr>
                <th>Date</th>
                <th>Duty</th>
                <th>Clock In</th>
                <th>Clock Out</th>
                <th>Duration</th>
                <th>Break</th>
              </tr>
              ${activityData.shifts.map(shift => `
                <tr>
                  <td>${formatDate(new Date(shift.clock_in))}</td>
                  <td>${shift.duty_code}</td>
                  <td>${formatTime(shift.clock_in)}</td>
                  <td>${shift.clock_out ? formatTime(shift.clock_out) : 'Ongoing'}</td>
                  <td>${formatDuration(shift.clock_in, shift.clock_out)}</td>
                  <td>${shift.break_start ? 'Yes' : 'No'}</td>
                </tr>
              `).join('')}
            </table>
          </body>
        </html>
      `;
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const exportCSV = () => {
    // Create CSV content
    const headers = ['Date', 'Duty', 'Clock In', 'Clock Out', 'Duration', 'Break Taken'];
    const rows = activityData.shifts.map(shift => [
      formatDate(new Date(shift.clock_in)),
      shift.duty_code,
      formatTime(shift.clock_in),
      shift.clock_out ? formatTime(shift.clock_out) : 'Ongoing',
      formatDuration(shift.clock_in, shift.clock_out),
      shift.break_start ? 'Yes' : 'No'
    ]);
    
    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Download CSV
    if (Platform.OS === 'web') {
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `activity_report_${supervisorSession.supervisor.badge}_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const emailSummary = async () => {
    try {
      const response = await fetch('https://go-barry.onrender.com/api/shifts/email-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supervisorBadge: supervisorSession.supervisor.badge,
          supervisorName,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          stats: activityData.stats
        })
      });
      
      if (response.ok) {
        alert('Summary email sent successfully!');
      } else {
        alert('Failed to send email. Please try again.');
      }
    } catch (error) {
      alert('Email service unavailable. Please try again later.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Activity Dashboard</Text>
        <Text style={styles.subtitle}>{supervisorName}'s Performance</Text>
      </View>

      {/* Time Period Selector */}
      <View style={styles.periodSelector}>
        {TIME_PERIODS.map(period => (
          <TouchableOpacity
            key={period.id}
            style={[
              styles.periodButton,
              selectedPeriod === period.id && styles.periodButtonActive
            ]}
            onPress={() => setSelectedPeriod(period.id)}
          >
            <MaterialCommunityIcons 
              name={period.icon} 
              size={20} 
              color={selectedPeriod === period.id ? '#fff' : '#64748b'} 
            />
            <Text style={[
              styles.periodText,
              selectedPeriod === period.id && styles.periodTextActive
            ]}>
              {period.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Date Range Display - Web Only (using HTML5 inputs) */}
      {selectedPeriod === 'custom' && Platform.OS === 'web' && (
        <View style={styles.dateRangeContainer}>
          <input
            type="date"
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #e5e7eb',
              fontSize: '14px',
              color: '#1f2937',
            }}
            value={startDate.toISOString().split('T')[0]}
            onChange={(e) => setStartDate(new Date(e.target.value))}
          />
          
          <MaterialCommunityIcons name="arrow-right" size={20} color="#64748b" />
          
          <input
            type="date"
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #e5e7eb',
              fontSize: '14px',
              color: '#1f2937',
            }}
            value={endDate.toISOString().split('T')[0]}
            onChange={(e) => setEndDate(new Date(e.target.value))}
          />
        </View>
      )}

      {/* Statistics Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <MaterialCommunityIcons name="clock-outline" size={24} color="#3b82f6" />
          <Text style={styles.statValue}>{activityData.stats.totalHours}</Text>
          <Text style={styles.statLabel}>Hours Worked</Text>
        </View>
        
        <View style={styles.statCard}>
          <MaterialCommunityIcons name="briefcase-check" size={24} color="#10b981" />
          <Text style={styles.statValue}>{activityData.stats.shiftsCompleted}</Text>
          <Text style={styles.statLabel}>Shifts</Text>
        </View>
        
        <View style={styles.statCard}>
          <MaterialCommunityIcons name="alert-circle-check-outline" size={24} color="#f59e0b" />
          <Text style={styles.statValue}>{activityData.stats.alertsDismissed}</Text>
          <Text style={styles.statLabel}>Alerts Handled</Text>
        </View>
        
        <View style={styles.statCard}>
          <MaterialCommunityIcons name="coffee" size={24} color="#8b5cf6" />
          <Text style={styles.statValue}>{activityData.stats.breaksUsed}</Text>
          <Text style={styles.statLabel}>Breaks Taken</Text>
        </View>
      </View>

      {/* Export Actions */}
      <View style={styles.exportSection}>
        <Text style={styles.sectionTitle}>Export Options</Text>
        <View style={styles.exportButtons}>
          <TouchableOpacity 
            style={styles.exportButton}
            onPress={() => exportPDF()}
          >
            <MaterialCommunityIcons name="file-pdf-box" size={20} color="#dc2626" />
            <Text style={styles.exportButtonText}>Export PDF</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.exportButton}
            onPress={() => exportCSV()}
          >
            <MaterialCommunityIcons name="file-excel" size={20} color="#059669" />
            <Text style={styles.exportButtonText}>Export CSV</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.exportButton}
            onPress={() => emailSummary()}
          >
            <MaterialCommunityIcons name="email" size={20} color="#3b82f6" />
            <Text style={styles.exportButtonText}>Email Summary</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Visual Charts */}
      {!loading && activityData.shifts.length > 0 && (
        <ActivityCharts activityData={activityData} />
      )}

      {/* Shift History */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Shift History</Text>
        {loading ? (
          <Text style={styles.loadingText}>Loading...</Text>
        ) : activityData.shifts.length === 0 ? (
          <Text style={styles.emptyText}>No shifts found for this period</Text>
        ) : (
          activityData.shifts.map((shift, index) => (
            <View key={shift.id} style={styles.shiftCard}>
              <View style={[styles.dutyBadge, { backgroundColor: DUTY_COLORS[shift.duty_code] }]}>
                <Text style={styles.dutyBadgeText}>{shift.duty_code}</Text>
              </View>
              
              <View style={styles.shiftDetails}>
                <Text style={styles.shiftDate}>
                  {formatDate(new Date(shift.clock_in))}
                </Text>
                <Text style={styles.shiftTime}>
                  {formatTime(shift.clock_in)} - {shift.clock_out ? formatTime(shift.clock_out) : 'Ongoing'}
                </Text>
                <Text style={styles.shiftDuration}>
                  {formatDuration(shift.clock_in, shift.clock_out)}
                </Text>
              </View>

              {shift.break_start && (
                <View style={styles.breakIndicator}>
                  <MaterialCommunityIcons name="coffee" size={16} color="#8b5cf6" />
                  <Text style={styles.breakText}>30m</Text>
                </View>
              )}

              {shift.handover_notes && (
                <TouchableOpacity style={styles.notesButton}>
                  <MaterialCommunityIcons name="note-text" size={16} color="#64748b" />
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </View>

      {/* Recent Actions Timeline */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Actions</Text>
        {loading ? (
          <Text style={styles.loadingText}>Loading...</Text>
        ) : activityData.actions.length === 0 ? (
          <Text style={styles.emptyText}>No actions recorded for this period</Text>
        ) : (
          activityData.actions.slice(0, 10).map((action, index) => (
            <View key={index} style={styles.actionItem}>
              <View style={[styles.actionIcon, { backgroundColor: getActionColor(action.action) }]}>
                <MaterialCommunityIcons 
                  name={getActionIcon(action.action)} 
                  size={16} 
                  color="#fff" 
                />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>{getActionTitle(action.action)}</Text>
                <Text style={styles.actionDetails}>
                  {action.details ? JSON.stringify(action.details) : 'No details'}
                </Text>
                <Text style={styles.actionTime}>
                  {formatTime(action.timestamp)} - {formatDate(new Date(action.timestamp))}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

// Helper functions for actions
const getActionIcon = (action) => {
  switch (action) {
    case 'CLOCK_IN': return 'clock-in';
    case 'CLOCK_OUT': return 'clock-out';
    case 'BREAK_START': return 'coffee';
    case 'BREAK_END': return 'coffee-off';
    case 'DISMISS_ALERT': return 'alert-circle-check-outline';
    case 'LOGIN': return 'login';
    case 'LOGOUT': return 'logout';
    default: return 'circle';
  }
};

const getActionColor = (action) => {
  switch (action) {
    case 'CLOCK_IN': return '#10b981';
    case 'CLOCK_OUT': return '#ef4444';
    case 'BREAK_START': return '#8b5cf6';
    case 'BREAK_END': return '#8b5cf6';
    case 'DISMISS_ALERT': return '#f59e0b';
    case 'LOGIN': return '#3b82f6';
    case 'LOGOUT': return '#6b7280';
    default: return '#6b7280';
  }
};

const getActionTitle = (action) => {
  switch (action) {
    case 'CLOCK_IN': return 'Clocked In';
    case 'CLOCK_OUT': return 'Clocked Out';
    case 'BREAK_START': return 'Break Started';
    case 'BREAK_END': return 'Break Ended';
    case 'DISMISS_ALERT': return 'Alert Dismissed';
    case 'LOGIN': return 'Logged In';
    case 'LOGOUT': return 'Logged Out';
    default: return action;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
  },
  periodSelector: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  periodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 8,
  },
  periodButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  periodText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  periodTextActive: {
    color: '#fff',
  },
  dateRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  loadingText: {
    textAlign: 'center',
    color: '#6b7280',
    padding: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6b7280',
    padding: 20,
    fontStyle: 'italic',
  },
  shiftCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  dutyBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  dutyBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  shiftDetails: {
    flex: 1,
  },
  shiftDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  shiftTime: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  shiftDuration: {
    fontSize: 12,
    color: '#3b82f6',
    marginTop: 2,
  },
  breakIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    marginRight: 8,
  },
  breakText: {
    fontSize: 12,
    color: '#8b5cf6',
    marginLeft: 4,
  },
  notesButton: {
    padding: 8,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  actionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  actionDetails: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  actionTime: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 4,
  },
  exportSection: {
    padding: 20,
  },
  exportButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  exportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 8,
  },
  exportButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
});