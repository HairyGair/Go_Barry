import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

const DUTY_COLORS = {
  D100: '#FF6B6B',
  D200: '#4ECDC4',
  D400: '#45B7D1',
  D500: '#96CEB4'
};

export default function ActivityCharts({ activityData }) {
  // Prepare data for weekly hours bar chart
  const prepareWeeklyData = () => {
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekData = weekDays.map(day => ({ day, hours: 0 }));
    
    activityData.shifts.forEach(shift => {
      if (shift.clock_out) {
        const date = new Date(shift.clock_in);
        const dayIndex = date.getDay();
        const hours = (new Date(shift.clock_out) - new Date(shift.clock_in)) / (1000 * 60 * 60);
        weekData[dayIndex].hours += parseFloat(hours.toFixed(1));
      }
    });
    
    return weekData;
  };

  // Prepare data for duty distribution
  const prepareDutyData = () => {
    const dutyCount = {};
    let total = 0;
    
    activityData.shifts.forEach(shift => {
      if (!dutyCount[shift.duty_code]) {
        dutyCount[shift.duty_code] = 0;
      }
      dutyCount[shift.duty_code]++;
      total++;
    });
    
    return Object.entries(dutyCount).map(([duty, count]) => ({
      name: duty,
      value: count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      color: DUTY_COLORS[duty]
    }));
  };

  // Prepare data for activity heatmap
  const prepareHeatmapData = () => {
    const hourlyActivity = Array(24).fill(0);
    let maxActivity = 0;
    
    // Count activities by hour
    activityData.actions.forEach(action => {
      const hour = new Date(action.timestamp).getHours();
      hourlyActivity[hour]++;
      if (hourlyActivity[hour] > maxActivity) {
        maxActivity = hourlyActivity[hour];
      }
    });
    
    // Convert to heatmap format
    return hourlyActivity.map((count, hour) => ({
      hour: hour,
      activity: count,
      intensity: maxActivity > 0 ? count / maxActivity : 0
    }));
  };

  const weeklyData = prepareWeeklyData();
  const dutyData = prepareDutyData();
  const heatmapData = prepareHeatmapData();
  const maxHours = Math.max(...weeklyData.map(d => d.hours), 1);

  return (
    <View style={styles.container}>
      <Text style={styles.mainTitle}>Performance Analytics</Text>

      {/* Weekly Hours Bar Chart */}
      <View style={styles.chartSection}>
        <Text style={styles.chartTitle}>Weekly Hours</Text>
        <View style={styles.barChart}>
          {weeklyData.map((day, index) => (
            <View key={index} style={styles.barColumn}>
              <Text style={styles.barValue}>
                {day.hours > 0 ? day.hours.toFixed(1) : ''}
              </Text>
              <View style={styles.barContainer}>
                <View 
                  style={[
                    styles.bar,
                    { 
                      height: `${(day.hours / maxHours) * 100}%`,
                      backgroundColor: '#3b82f6'
                    }
                  ]} 
                />
              </View>
              <Text style={styles.barLabel}>{day.day}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Duty Distribution */}
      <View style={styles.chartSection}>
        <Text style={styles.chartTitle}>Duty Distribution</Text>
        {dutyData.length === 0 ? (
          <Text style={styles.noDataText}>No shifts recorded</Text>
        ) : (
          <View style={styles.dutyStats}>
            {dutyData.map((duty, index) => (
              <View key={index} style={styles.dutyRow}>
                <View style={[styles.dutyColor, { backgroundColor: duty.color }]} />
                <Text style={styles.dutyName}>{duty.name}</Text>
                <Text style={styles.dutyCount}>{duty.value} shifts</Text>
                <View style={styles.dutyBarContainer}>
                  <View 
                    style={[
                      styles.dutyBar,
                      { 
                        width: `${duty.percentage}%`,
                        backgroundColor: duty.color
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.dutyPercentage}>{duty.percentage}%</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Activity Heatmap */}
      <View style={styles.chartSection}>
        <Text style={styles.chartTitle}>Activity Heatmap (24 Hours)</Text>
        <View style={styles.heatmapContainer}>
          <View style={styles.heatmapGrid}>
            {heatmapData.map((item, index) => (
              <View key={index} style={styles.heatmapCell}>
                <View 
                  style={[
                    styles.heatmapBlock,
                    { 
                      backgroundColor: item.activity === 0 
                        ? '#f3f4f6' 
                        : `rgba(59, 130, 246, ${0.2 + item.intensity * 0.8})`
                    }
                  ]} 
                />
                {index % 3 === 0 && (
                  <Text style={styles.heatmapLabel}>{item.hour}</Text>
                )}
              </View>
            ))}
          </View>
          <View style={styles.heatmapLegend}>
            <Text style={styles.legendText}>Less</Text>
            <View style={styles.legendGradient}>
              {[0.2, 0.4, 0.6, 0.8, 1].map((opacity, i) => (
                <View 
                  key={i} 
                  style={[
                    styles.legendCell,
                    { backgroundColor: `rgba(59, 130, 246, ${opacity})` }
                  ]} 
                />
              ))}
            </View>
            <Text style={styles.legendText}>More</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  mainTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 20,
  },
  chartSection: {
    marginBottom: 30,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  noDataText: {
    textAlign: 'center',
    color: '#6b7280',
    fontStyle: 'italic',
    padding: 20,
  },
  
  // Bar Chart Styles
  barChart: {
    flexDirection: 'row',
    height: 150,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
  },
  barContainer: {
    width: '80%',
    height: 120,
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderRadius: 4,
    minHeight: 2,
  },
  barValue: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
    fontWeight: '600',
  },
  barLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
  },
  
  // Duty Distribution Styles
  dutyStats: {
    gap: 12,
  },
  dutyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dutyColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  dutyName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    width: 50,
  },
  dutyCount: {
    fontSize: 12,
    color: '#6b7280',
    marginRight: 8,
  },
  dutyBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  dutyBar: {
    height: '100%',
  },
  dutyPercentage: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
    marginLeft: 8,
    width: 35,
    textAlign: 'right',
  },
  
  // Heatmap Styles
  heatmapContainer: {
    marginTop: 8,
  },
  heatmapGrid: {
    flexDirection: 'row',
    height: 50,
    gap: 2,
  },
  heatmapCell: {
    flex: 1,
    alignItems: 'center',
  },
  heatmapBlock: {
    width: '100%',
    height: 30,
    borderRadius: 2,
  },
  heatmapLabel: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 4,
  },
  heatmapLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  legendGradient: {
    flexDirection: 'row',
    marginHorizontal: 8,
    gap: 4,
  },
  legendCell: {
    width: 20,
    height: 20,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: '#6b7280',
  },
});