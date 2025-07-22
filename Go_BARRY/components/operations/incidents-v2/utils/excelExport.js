/*
 * Go Barry - Excel Export Utility
 * Exports incidents to Excel format for Disruption Database
 */

import { Platform } from 'react-native';

export const exportIncidentsToExcel = async (incidents, filters = {}) => {
  if (Platform.OS !== 'web') {
    console.warn('Excel export only available on web platform');
    return;
  }

  try {
    // Import xlsx dynamically for web only
    const XLSX = await import('xlsx');
    
    // Prepare data for export
    const exportData = incidents.map(incident => ({
      'Incident ID': incident.id,
      'Date': new Date(incident.createdAt).toLocaleDateString('en-GB'),
      'Time': new Date(incident.createdAt).toLocaleTimeString('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      'Type': incident.type || 'Other',
      'Location': incident.location?.description || incident.location?.postcode || 'Unknown',
      'Postcode': incident.location?.postcode || '',
      'Affected Routes': (incident.affectedRoutes || []).join(', '),
      'Description': incident.description || '',
      'Action Taken': incident.actionTaken || '',
      'Status': incident.status || 'Active',
      'Priority': incident.priority || 'Medium',
      'Created By': incident.createdBy || '',
      'Resolved At': incident.resolvedAt ? new Date(incident.resolvedAt).toLocaleString('en-GB') : '',
      'Duration (mins)': incident.resolvedAt ? 
        Math.round((new Date(incident.resolvedAt) - new Date(incident.createdAt)) / 60000) : 
        '',
      'Source': incident.source || 'manual',
      'Diversion Required': incident.actionTaken?.toLowerCase().includes('divert') ? 'Yes' : 'No',
      'Messages Sent': incident.messages ? 'Yes' : 'No',
      'Display Pushed': incident.pushedToDisplay ? 'Yes' : 'No',
    }));

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    const colWidths = [
      { wch: 15 }, // Incident ID
      { wch: 12 }, // Date
      { wch: 8 },  // Time
      { wch: 15 }, // Type
      { wch: 30 }, // Location
      { wch: 10 }, // Postcode
      { wch: 20 }, // Affected Routes
      { wch: 40 }, // Description
      { wch: 30 }, // Action Taken
      { wch: 10 }, // Status
      { wch: 10 }, // Priority
      { wch: 15 }, // Created By
      { wch: 18 }, // Resolved At
      { wch: 12 }, // Duration
      { wch: 10 }, // Source
      { wch: 15 }, // Diversion Required
      { wch: 12 }, // Messages Sent
      { wch: 12 }, // Display Pushed
    ];
    ws['!cols'] = colWidths;

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Incidents');

    // Add summary sheet
    const summaryData = [
      { 'Metric': 'Total Incidents', 'Value': exportData.length },
      { 'Metric': 'Active Incidents', 'Value': exportData.filter(i => i.Status === 'active').length },
      { 'Metric': 'Resolved Incidents', 'Value': exportData.filter(i => i.Status === 'resolved').length },
      { 'Metric': 'High Priority', 'Value': exportData.filter(i => i.Priority === 'high').length },
      { 'Metric': 'Diversions Required', 'Value': exportData.filter(i => i['Diversion Required'] === 'Yes').length },
      { 'Metric': 'Export Date', 'Value': new Date().toLocaleString('en-GB') },
      { 'Metric': 'Exported By', 'Value': filters.exportedBy || 'System' },
    ];

    const summaryWs = XLSX.utils.json_to_sheet(summaryData);
    summaryWs['!cols'] = [{ wch: 20 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

    // Generate filename
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    const filename = `GO_BARRY_Incidents_${dateStr}.xlsx`;

    // Write file
    XLSX.writeFile(wb, filename);

    console.log(`✅ Exported ${exportData.length} incidents to ${filename}`);
    return filename;

  } catch (error) {
    console.error('❌ Error exporting to Excel:', error);
    throw error;
  }
};

// Export for daily Disruption Database
export const exportForDisruptionDatabase = async (incidents, supervisorName) => {
  // Filter only resolved incidents and those with diversions
  const disruptionIncidents = incidents.filter(incident => 
    incident.status === 'resolved' || 
    incident.requiresDisruptionDb || 
    incident.actionTaken?.toLowerCase().includes('divert')
  );

  if (disruptionIncidents.length === 0) {
    console.log('No incidents to export for Disruption Database');
    return null;
  }

  return exportIncidentsToExcel(disruptionIncidents, {
    exportedBy: supervisorName,
    exportType: 'Disruption Database'
  });
};

// Scheduled daily export (to be called by backend cron)
export const scheduledDailyExport = async (baseUrl, sessionId) => {
  try {
    // Get yesterday's resolved incidents
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const response = await fetch(`${baseUrl}/api/incidents/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-session-id': sessionId
      },
      body: JSON.stringify({
        startDate: yesterday.toISOString(),
        endDate: today.toISOString(),
        exportType: 'daily_disruption_db'
      })
    });

    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Disruption_Database_${yesterday.toISOString().split('T')[0]}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      console.log('✅ Daily export completed');
    }
  } catch (error) {
    console.error('❌ Daily export failed:', error);
  }
};
