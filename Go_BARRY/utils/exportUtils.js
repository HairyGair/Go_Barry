/**
 * Export utilities for Disruption Database
 * Supports PDF and Excel/CSV export for disruption data
 */

import { Platform } from 'react-native';

// CSV Export utility
export const exportToCSV = (data, filename = 'disruptions_export') => {
  if (Platform.OS !== 'web') {
    console.warn('CSV export is only supported on web platform');
    return;
  }

  try {
    // Define CSV headers
    const headers = [
      'ID',
      'Type',
      'Status', 
      'Priority',
      'Title',
      'Location',
      'Description',
      'Affected Routes',
      'Created By',
      'Created Date',
      'Last Updated',
      'Authority',
      'Start Date',
      'End Date'
    ];

    // Convert data to CSV rows
    const csvRows = [
      headers.join(','), // Header row
      ...data.map(item => [
        item.id,
        item.type,
        item.status,
        item.priority,
        `"${item.title.replace(/"/g, '""')}"`, // Escape quotes
        `"${item.location.replace(/"/g, '""')}"`,
        `"${(item.description || '').replace(/"/g, '""')}"`,
        `"${(item.affectedRoutes || []).join(', ')}"`,
        item.createdBy,
        new Date(item.createdAt).toLocaleDateString('en-GB'),
        item.lastUpdated ? new Date(item.lastUpdated).toLocaleDateString('en-GB') : '',
        item.authority || '',
        item.startDate ? new Date(item.startDate).toLocaleDateString('en-GB') : '',
        item.endDate ? new Date(item.endDate).toLocaleDateString('en-GB') : ''
      ].join(','))
    ];

    // Create and download CSV
    const csvContent = csvRows.join('\n');
    
    if (typeof Blob === 'undefined' || typeof document === 'undefined') {
      console.warn('CSV export requires web browser environment');
      return false;
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('CSV Export failed:', error);
    return false;
  }
};

// Excel Export (using HTML table method for web compatibility)
export const exportToExcel = (data, filename = 'disruptions_export') => {
  if (Platform.OS !== 'web') {
    console.warn('Excel export is only supported on web platform');
    return;
  }

  try {
    // Create HTML table for Excel
    const htmlTable = generateExcelHTML(data);
    
    // Create and download Excel file
    if (typeof Blob === 'undefined' || typeof document === 'undefined') {
      console.warn('Excel export requires web browser environment');
      return false;
    }
    
    const blob = new Blob([htmlTable], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.xls`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Excel Export failed:', error);
    return false;
  }
};

// Generate HTML table for Excel export
const generateExcelHTML = (data) => {
  const timestamp = new Date().toLocaleString('en-GB');
  
  let html = `
    <html>
      <head>
        <meta charset="utf-8">
        <title>Go BARRY Disruption Report</title>
        <style>
          body { font-family: Arial, sans-serif; }
          .header { background-color: #3B82F6; color: white; padding: 10px; margin-bottom: 20px; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; font-weight: bold; }
          .status-active { background-color: #D1FAE5; }
          .status-monitoring { background-color: #F0F9FF; }
          .status-completed { background-color: #F9FAFB; }
          .priority-critical { background-color: #FEF2F2; color: #DC2626; }
          .priority-high { background-color: #FFF7ED; color: #EA580C; }
          .priority-medium { background-color: #FFFBEB; color: #D97706; }
          .priority-low { background-color: #F7FEE7; color: #65A30D; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Go BARRY Disruption Database Export</h1>
          <p>Generated on: ${timestamp}</p>
          <p>Total Records: ${data.length}</p>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Type</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Title</th>
              <th>Location</th>
              <th>Description</th>
              <th>Affected Routes</th>
              <th>Created By</th>
              <th>Created Date</th>
              <th>Last Updated</th>
              <th>Authority</th>
              <th>Start Date</th>
              <th>End Date</th>
            </tr>
          </thead>
          <tbody>
  `;

  data.forEach(item => {
    html += `
      <tr>
        <td>${item.id}</td>
        <td>${item.type}</td>
        <td class="status-${item.status}">${item.status}</td>
        <td class="priority-${item.priority}">${item.priority}</td>
        <td>${item.title}</td>
        <td>${item.location}</td>
        <td>${item.description || ''}</td>
        <td>${(item.affectedRoutes || []).join(', ')}</td>
        <td>${item.createdBy}</td>
        <td>${new Date(item.createdAt).toLocaleDateString('en-GB')}</td>
        <td>${item.lastUpdated ? new Date(item.lastUpdated).toLocaleDateString('en-GB') : ''}</td>
        <td>${item.authority || ''}</td>
        <td>${item.startDate ? new Date(item.startDate).toLocaleDateString('en-GB') : ''}</td>
        <td>${item.endDate ? new Date(item.endDate).toLocaleDateString('en-GB') : ''}</td>
      </tr>
    `;
  });

  html += `
          </tbody>
        </table>
      </body>
    </html>
  `;

  return html;
};

// PDF Export utility (using browser print for web compatibility)
export const exportToPDF = (data, filename = 'disruptions_export') => {
  if (Platform.OS !== 'web') {
    console.warn('PDF export is only supported on web platform');
    return;
  }

  try {
    if (typeof window === 'undefined') {
      console.warn('PDF export requires web browser environment');
      return false;
    }
    
    // Create a new window for PDF generation
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Popup blocked - please allow popups for PDF export');
    }
    
    const htmlContent = generatePDFHTML(data);
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load then trigger print
    setTimeout(() => {
      printWindow.print();
      // Note: Window will remain open for user to save as PDF
    }, 1000);
    
    return true;
  } catch (error) {
    console.error('PDF Export failed:', error);
    return false;
  }
};

// Generate HTML for PDF export
const generatePDFHTML = (data) => {
  const timestamp = new Date().toLocaleString('en-GB');
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Go BARRY Disruption Report</title>
        <style>
          @page { margin: 1cm; }
          body { 
            font-family: Arial, sans-serif; 
            font-size: 10px;
            line-height: 1.2;
          }
          .header { 
            background-color: #3B82F6; 
            color: white; 
            padding: 15px; 
            margin-bottom: 20px;
            text-align: center;
          }
          .header h1 { margin: 0; font-size: 18px; }
          .header p { margin: 5px 0; font-size: 12px; }
          table { 
            border-collapse: collapse; 
            width: 100%; 
            margin-bottom: 20px;
            page-break-inside: auto;
          }
          tr { page-break-inside: avoid; page-break-after: auto; }
          th, td { 
            border: 1px solid #ddd; 
            padding: 4px; 
            text-align: left;
            vertical-align: top;
          }
          th { 
            background-color: #f2f2f2; 
            font-weight: bold;
            font-size: 9px;
          }
          .type-incident { background-color: #FEF2F2; }
          .type-roadwork { background-color: #FFF7ED; }
          .status-active { background-color: #D1FAE5; }
          .status-monitoring { background-color: #F0F9FF; }
          .priority-critical { background-color: #FEF2F2; font-weight: bold; }
          .priority-high { background-color: #FFF7ED; }
          .footer {
            position: fixed;
            bottom: 0;
            width: 100%;
            text-align: center;
            font-size: 8px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Go BARRY Disruption Database Report</h1>
          <p>Generated: ${timestamp}</p>
          <p>Total Records: ${data.length}</p>
        </div>
        
        <table>
          <thead>
            <tr>
              <th width="5%">ID</th>
              <th width="8%">Type</th>
              <th width="8%">Status</th>
              <th width="8%">Priority</th>
              <th width="20%">Title</th>
              <th width="15%">Location</th>
              <th width="15%">Description</th>
              <th width="10%">Routes</th>
              <th width="8%">Created By</th>
              <th width="8%">Date</th>
            </tr>
          </thead>
          <tbody>
            ${data.map(item => `
              <tr class="type-${item.type}">
                <td>${item.id}</td>
                <td>${item.type}</td>
                <td class="status-${item.status}">${item.status}</td>
                <td class="priority-${item.priority}">${item.priority}</td>
                <td>${item.title}</td>
                <td>${item.location}</td>
                <td>${(item.description || '').substring(0, 100)}${item.description && item.description.length > 100 ? '...' : ''}</td>
                <td>${(item.affectedRoutes || []).slice(0, 3).join(', ')}${item.affectedRoutes && item.affectedRoutes.length > 3 ? '...' : ''}</td>
                <td>${item.createdBy}</td>
                <td>${new Date(item.createdAt).toLocaleDateString('en-GB')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="footer">
          <p>Go BARRY Traffic Intelligence Platform - © 2024-2025 Anthony Gair</p>
        </div>
      </body>
    </html>
  `;
};

// Summary statistics for exports
export const generateExportSummary = (data) => {
  const summary = {
    total: data.length,
    byType: {},
    byStatus: {},
    byPriority: {},
    dateRange: {
      earliest: null,
      latest: null
    }
  };

  data.forEach(item => {
    // Count by type
    summary.byType[item.type] = (summary.byType[item.type] || 0) + 1;
    
    // Count by status
    summary.byStatus[item.status] = (summary.byStatus[item.status] || 0) + 1;
    
    // Count by priority
    summary.byPriority[item.priority] = (summary.byPriority[item.priority] || 0) + 1;
    
    // Track date range
    const itemDate = new Date(item.createdAt);
    if (!summary.dateRange.earliest || itemDate < summary.dateRange.earliest) {
      summary.dateRange.earliest = itemDate;
    }
    if (!summary.dateRange.latest || itemDate > summary.dateRange.latest) {
      summary.dateRange.latest = itemDate;
    }
  });

  return summary;
};

// Export format options
export const EXPORT_FORMATS = {
  CSV: 'csv',
  EXCEL: 'excel', 
  PDF: 'pdf'
};

// Main export function
export const exportDisruptions = async (data, format, filename) => {
  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }

  let success = false;
  
  switch (format) {
    case EXPORT_FORMATS.CSV:
      success = exportToCSV(data, filename);
      break;
    case EXPORT_FORMATS.EXCEL:
      success = exportToExcel(data, filename);
      break;
    case EXPORT_FORMATS.PDF:
      success = exportToPDF(data, filename);
      break;
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }

  if (!success) {
    throw new Error(`Failed to export ${format.toUpperCase()} file`);
  }

  return success;
};