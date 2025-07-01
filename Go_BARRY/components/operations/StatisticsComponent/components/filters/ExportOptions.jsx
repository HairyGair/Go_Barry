/*
 * Go Barry - Export Options Component
 * CSV/PDF export and email sharing functionality
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { statisticsTheme } from '../../styles/statistics.styles.js';

const ExportOptions = ({ 
  data,
  timeRange = 'today',
  supervisorName,
  disabled = false,
  onExportStart,
  onExportComplete,
  onExportError
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState(null);

  const exportOptions = [
    {
      type: 'csv',
      label: 'Export CSV',
      description: 'Download data as spreadsheet',
      icon: 'file-table-outline',
      color: statisticsTheme.charts.secondary,
      formats: ['alerts', 'incidents', 'supervisors', 'routes', 'all']
    },
    {
      type: 'pdf',
      label: 'Export PDF',
      description: 'Generate formatted report',
      icon: 'file-pdf-box',
      color: statisticsTheme.charts.danger,
      formats: ['summary', 'detailed', 'charts']
    },
    {
      type: 'email',
      label: 'Email Report',
      description: 'Send via email',
      icon: 'email-outline',
      color: statisticsTheme.charts.info,
      formats: ['summary', 'detailed']
    }
  ];

  const generateFileName = (type, format) => {
    const timestamp = new Date().toISOString().split('T')[0];
    const supervisor = supervisorName?.replace(/\s+/g, '_') || 'system';
    return `go_barry_${format}_${timeRange}_${supervisor}_${timestamp}.${type}`;
  };

  const handleExport = async (type, format) => {
    if (disabled || isExporting) return;

    setIsExporting(true);
    setExportType(type);
    onExportStart?.(type, format);

    try {
      const fileName = generateFileName(type, format);
      
      if (type === 'csv') {
        await exportToCSV(format, fileName);
      } else if (type === 'pdf') {
        await exportToPDF(format, fileName);
      } else if (type === 'email') {
        await sendEmailReport(format);
      }

      onExportComplete?.(type, format, fileName);
      
      if (Platform.OS === 'web') {
        // Show success message
        Alert.alert('Export Complete', `${type.toUpperCase()} export completed successfully.`);
      }
    } catch (error) {
      console.error('Export error:', error);
      onExportError?.(error);
      Alert.alert('Export Failed', `Failed to export ${type.toUpperCase()}: ${error.message}`);
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  const exportToCSV = async (format, fileName) => {
    // Mock CSV export - in real implementation, this would call the backend API
    const csvData = generateCSVData(format);
    
    if (Platform.OS === 'web') {
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      link.click();
    } else {
      // Mobile: Use filesystem or sharing API
      console.log('CSV export for mobile not implemented yet');
    }
  };

  const exportToPDF = async (format, fileName) => {
    // Mock PDF export - in real implementation, this would call the backend API
    const pdfUrl = await generatePDFReport(format);
    
    if (Platform.OS === 'web') {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = fileName;
      link.click();
    } else {
      console.log('PDF export for mobile not implemented yet');
    }
  };

  const sendEmailReport = async (format) => {
    // Mock email sending - in real implementation, this would call the backend API
    const emailData = {
      to: supervisorName ? `${supervisorName.toLowerCase().replace(/\s+/g, '.')}@gonortheast.co.uk` : '',
      subject: `Go BARRY Statistics Report - ${timeRange}`,
      format,
      timeRange,
      data
    };
    
    console.log('Email report would be sent:', emailData);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
  };

  const generateCSVData = (format) => {
    // Mock CSV generation
    const headers = {
      alerts: 'Timestamp,Type,Severity,Route,Location,Status,Supervisor',
      incidents: 'ID,Time,Category,Route,Description,Supervisor,Duration,Status',
      supervisors: 'Name,Actions,Response Time,Efficiency,Last Active',
      routes: 'Route,Incidents,Avg Delay,Severity,Performance Score',
      all: 'Type,Timestamp,Details,Impact,Status'
    };

    const sampleData = {
      alerts: [
        '2025-07-01 09:15,Traffic,High,21,A1 Newcastle,Active,AG003',
        '2025-07-01 09:30,Roadwork,Medium,X21,Gateshead,Resolved,BP009'
      ],
      incidents: [
        'INC001,09:15,Traffic,21,Heavy congestion A1,AG003,25min,Resolved',
        'INC002,10:30,Roadwork,X21,Lane closure Gateshead,BP009,45min,Active'
      ]
    };

    const header = headers[format] || headers.all;
    const rows = sampleData[format] || sampleData.alerts;
    
    return [header, ...rows].join('\n');
  };

  const generatePDFReport = async (format) => {
    // Mock PDF generation - return a data URL or blob URL
    // In real implementation, this would call /api/statistics/export
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return 'data:application/pdf;base64,JVBERi0xLjQKJYGBgYEKCjEgMCBvYmoKPDwKL1RpdGxlIChHbyBCQVJSWSBTdGF0aXN0aWNzKQovQ3JlYXRvciAoR28gQkFSUlkgU3lzdGVtKQovQ3JlYXRpb25EYXRlIChEOjIwMjUwNzAxKQo+PgplbmRvYmoK';
  };

  const renderExportButton = (option) => (
    <View key={option.type} style={styles.exportGroup}>
      <View style={styles.exportHeader}>
        <MaterialCommunityIcons 
          name={option.icon} 
          size={20} 
          color={option.color}
        />
        <View style={styles.exportInfo}>
          <Text style={styles.exportLabel}>{option.label}</Text>
          <Text style={styles.exportDescription}>{option.description}</Text>
        </View>
        {isExporting && exportType === option.type && (
          <MaterialCommunityIcons 
            name="loading" 
            size={16} 
            color={statisticsTheme.colors.textSecondary}
            style={styles.loadingIcon}
          />
        )}
      </View>
      
      <View style={styles.formatButtons}>
        {option.formats.map((format) => (
          <TouchableOpacity
            key={format}
            style={[
              styles.formatButton,
              { borderColor: option.color },
              disabled && styles.formatButtonDisabled
            ]}
            onPress={() => handleExport(option.type, format)}
            disabled={disabled || isExporting}
          >
            <Text style={[
              styles.formatButtonText,
              { color: option.color },
              disabled && styles.formatButtonTextDisabled
            ]}>
              {format.charAt(0).toUpperCase() + format.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const formatDataSummary = () => {
    if (!data) return 'No data selected';
    
    const summary = [];
    if (data.alerts) summary.push(`${data.alerts.length} alerts`);
    if (data.incidents) summary.push(`${data.incidents.length} incidents`);
    if (data.supervisors) summary.push(`${data.supervisors.length} supervisors`);
    
    return summary.join(', ') || 'System data';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons 
          name="download" 
          size={24} 
          color={statisticsTheme.colors.textPrimary}
        />
        <View style={styles.headerInfo}>
          <Text style={styles.title}>Export & Share</Text>
          <Text style={styles.subtitle}>
            Export data for {timeRange} • {formatDataSummary()}
          </Text>
        </View>
      </View>

      <View style={styles.exportOptions}>
        {exportOptions.map(renderExportButton)}
      </View>

      {/* Quick Export Actions */}
      <View style={styles.quickActions}>
        <Text style={styles.quickActionsTitle}>Quick Actions</Text>
        <View style={styles.quickActionButtons}>
          <TouchableOpacity
            style={[styles.quickButton, disabled && styles.quickButtonDisabled]}
            onPress={() => handleExport('csv', 'all')}
            disabled={disabled || isExporting}
          >
            <MaterialCommunityIcons 
              name="download" 
              size={16} 
              color={disabled ? statisticsTheme.colors.textSecondary : '#FFFFFF'}
            />
            <Text style={[
              styles.quickButtonText,
              disabled && styles.quickButtonTextDisabled
            ]}>
              Download All (CSV)
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.quickButton, styles.quickButtonSecondary, disabled && styles.quickButtonDisabled]}
            onPress={() => handleExport('email', 'summary')}
            disabled={disabled || isExporting}
          >
            <MaterialCommunityIcons 
              name="email-fast" 
              size={16} 
              color={disabled ? statisticsTheme.colors.textSecondary : statisticsTheme.charts.primary}
            />
            <Text style={[
              styles.quickButtonTextSecondary,
              disabled && styles.quickButtonTextDisabled
            ]}>
              Email Summary
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Export Status */}
      {isExporting && (
        <View style={styles.exportStatus}>
          <MaterialCommunityIcons 
            name="loading" 
            size={20} 
            color={statisticsTheme.charts.primary}
            style={styles.statusIcon}
          />
          <Text style={styles.statusText}>
            Preparing {exportType?.toUpperCase()} export...
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: statisticsTheme.colors.cardBg,
    borderRadius: statisticsTheme.borderRadius.md,
    padding: statisticsTheme.spacing.lg,
    ...statisticsTheme.shadows.sm,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: statisticsTheme.spacing.lg,
    gap: statisticsTheme.spacing.md,
  },

  headerInfo: {
    flex: 1,
  },

  title: {
    fontSize: 18,
    fontWeight: '600',
    color: statisticsTheme.colors.textPrimary,
  },

  subtitle: {
    fontSize: 14,
    color: statisticsTheme.colors.textSecondary,
    marginTop: 4,
  },

  exportOptions: {
    gap: statisticsTheme.spacing.lg,
    marginBottom: statisticsTheme.spacing.xl,
  },

  exportGroup: {
    backgroundColor: '#F9FAFB',
    borderRadius: statisticsTheme.borderRadius.sm,
    padding: statisticsTheme.spacing.md,
  },

  exportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: statisticsTheme.spacing.md,
    gap: statisticsTheme.spacing.sm,
  },

  exportInfo: {
    flex: 1,
  },

  exportLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: statisticsTheme.colors.textPrimary,
  },

  exportDescription: {
    fontSize: 12,
    color: statisticsTheme.colors.textSecondary,
    marginTop: 2,
  },

  loadingIcon: {
    ...Platform.select({
      web: {
        animation: 'spin 1s linear infinite',
      },
    }),
  },

  formatButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: statisticsTheme.spacing.sm,
  },

  formatButton: {
    paddingHorizontal: statisticsTheme.spacing.md,
    paddingVertical: statisticsTheme.spacing.sm,
    borderRadius: statisticsTheme.borderRadius.sm,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        ':hover': {
          backgroundColor: '#F0F9FF',
        },
      },
    }),
  },

  formatButtonDisabled: {
    borderColor: '#E5E7EB',
    backgroundColor: '#F3F4F6',
    ...Platform.select({
      web: {
        cursor: 'not-allowed',
        ':hover': {
          backgroundColor: '#F3F4F6',
        },
      },
    }),
  },

  formatButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },

  formatButtonTextDisabled: {
    color: statisticsTheme.colors.textSecondary,
  },

  quickActions: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: statisticsTheme.spacing.lg,
    marginBottom: statisticsTheme.spacing.md,
  },

  quickActionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: statisticsTheme.colors.textPrimary,
    marginBottom: statisticsTheme.spacing.md,
  },

  quickActionButtons: {
    flexDirection: 'row',
    gap: statisticsTheme.spacing.md,
  },

  quickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: statisticsTheme.spacing.md,
    paddingVertical: statisticsTheme.spacing.md,
    backgroundColor: statisticsTheme.charts.primary,
    borderRadius: statisticsTheme.borderRadius.sm,
    gap: statisticsTheme.spacing.sm,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'background-color 0.2s ease',
        ':hover': {
          backgroundColor: '#2563EB',
        },
      },
    }),
  },

  quickButtonSecondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: statisticsTheme.charts.primary,
  },

  quickButtonDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
    ...Platform.select({
      web: {
        cursor: 'not-allowed',
        ':hover': {
          backgroundColor: '#F3F4F6',
        },
      },
    }),
  },

  quickButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },

  quickButtonTextSecondary: {
    fontSize: 14,
    fontWeight: '500',
    color: statisticsTheme.charts.primary,
  },

  quickButtonTextDisabled: {
    color: statisticsTheme.colors.textSecondary,
  },

  exportStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: statisticsTheme.spacing.md,
    backgroundColor: '#F0F9FF',
    borderRadius: statisticsTheme.borderRadius.sm,
    borderLeftWidth: 4,
    borderLeftColor: statisticsTheme.charts.primary,
    gap: statisticsTheme.spacing.sm,
  },

  statusIcon: {
    ...Platform.select({
      web: {
        animation: 'spin 1s linear infinite',
      },
    }),
  },

  statusText: {
    fontSize: 14,
    color: statisticsTheme.colors.textPrimary,
    fontWeight: '500',
  },
});

export default ExportOptions;
