// backend/services/sharePointExcelService.js
// SharePoint Excel Integration Service using Microsoft Graph API

import { Client } from '@microsoft/microsoft-graph-client';
import microsoftEmailService from './microsoftEmailService.js';

class SharePointExcelService {
  constructor() {
    this.tenantId = process.env.AZURE_TENANT_ID;
    this.clientId = process.env.AZURE_CLIENT_ID;
    this.clientSecret = process.env.AZURE_CLIENT_SECRET;
    
    // SharePoint site configuration for Go North East
    this.sharePointSiteId = 'goaheadgroup.sharepoint.com,sites,GNETS0011';
    
    // Document configurations
    this.documents = {
      onTimeRequest: {
        fileName: 'On Time Request.xlsx',
        driveItemId: '0D85361B-20DF-4F90-A0EF-C4A1C68B17DC',
        worksheetName: 'Sheet1'
      },
      dailyLostMileage: {
        fileName: 'Daily lost miles report - SDC.xlsx', 
        driveItemId: '01D73A9C-5F4C-4688-BB15-54EEC40D1739',
        worksheetName: 'Sheet1'
      }
    };

    console.log('📊 SharePoint Excel Service initialized');
    console.log('📊 Site ID:', this.sharePointSiteId);
  }

  /**
   * Get Microsoft Graph client with supervisor authentication
   */
  getGraphClient(supervisorId) {
    const tokenData = microsoftEmailService.supervisorTokens.get(supervisorId);
    if (!tokenData || !tokenData.accessToken) {
      throw new Error(`Supervisor ${supervisorId} not authenticated with Microsoft`);
    }

    return Client.init({
      authProvider: (done) => {
        done(null, tokenData.accessToken);
      }
    });
  }

  /**
   * Check if supervisor has required SharePoint permissions
   */
  async checkSharePointPermissions(supervisorId) {
    try {
      const graphClient = this.getGraphClient(supervisorId);
      
      // Try to access the SharePoint site
      const site = await graphClient
        .api(`/sites/${this.sharePointSiteId}`)
        .get();

      console.log('📊 SharePoint site access verified for supervisor:', supervisorId);
      return {
        hasAccess: true,
        siteName: site.displayName,
        siteUrl: site.webUrl
      };

    } catch (error) {
      console.error('📊 SharePoint permission check failed:', error);
      return {
        hasAccess: false,
        error: error.message,
        requiresReauth: error.message.includes('Insufficient privileges')
      };
    }
  }

  /**
   * Get Excel workbook metadata
   */
  async getWorkbookInfo(supervisorId, documentKey) {
    try {
      const document = this.documents[documentKey];
      if (!document) {
        throw new Error(`Unknown document: ${documentKey}`);
      }

      const graphClient = this.getGraphClient(supervisorId);
      
      // Get the workbook
      const workbook = await graphClient
        .api(`/sites/${this.sharePointSiteId}/drive/items/${document.driveItemId}/workbook`)
        .get();

      console.log('📊 Workbook accessed:', document.fileName);
      
      return {
        success: true,
        document: documentKey,
        fileName: document.fileName,
        workbookId: workbook.id,
        lastModified: workbook.lastModifiedDateTime
      };

    } catch (error) {
      console.error('📊 Get workbook info failed:', error);
      throw new Error(`Failed to access ${documentKey}: ${error.message}`);
    }
  }

  /**
   * Get worksheet data from Excel file
   */
  async getWorksheetData(supervisorId, documentKey, range = null) {
    try {
      const document = this.documents[documentKey];
      if (!document) {
        throw new Error(`Unknown document: ${documentKey}`);
      }

      const graphClient = this.getGraphClient(supervisorId);
      
      // Get worksheet data
      const apiUrl = `/sites/${this.sharePointSiteId}/drive/items/${document.driveItemId}/workbook/worksheets/${document.worksheetName}`;
      const rangeUrl = range ? `${apiUrl}/range(address='${range}')` : `${apiUrl}/usedRange`;
      
      const worksheetData = await graphClient
        .api(rangeUrl)
        .get();

      console.log('📊 Worksheet data retrieved:', {
        document: documentKey,
        range: range || 'usedRange',
        rowCount: worksheetData.rowCount,
        columnCount: worksheetData.columnCount
      });

      return {
        success: true,
        document: documentKey,
        range: worksheetData.address,
        rowCount: worksheetData.rowCount,
        columnCount: worksheetData.columnCount,
        values: worksheetData.values,
        lastModified: new Date().toISOString()
      };

    } catch (error) {
      console.error('📊 Get worksheet data failed:', error);
      throw new Error(`Failed to read ${documentKey} data: ${error.message}`);
    }
  }

  /**
   * Update cells in Excel worksheet
   */
  async updateWorksheetCells(supervisorId, documentKey, range, values) {
    try {
      const document = this.documents[documentKey];
      if (!document) {
        throw new Error(`Unknown document: ${documentKey}`);
      }

      const graphClient = this.getGraphClient(supervisorId);
      
      // Update the range
      const updateData = {
        values: values
      };

      const result = await graphClient
        .api(`/sites/${this.sharePointSiteId}/drive/items/${document.driveItemId}/workbook/worksheets/${document.worksheetName}/range(address='${range}')`)
        .patch(updateData);

      console.log('📊 Worksheet updated:', {
        document: documentKey,
        range: range,
        rowsUpdated: values.length,
        supervisor: supervisorId
      });

      return {
        success: true,
        document: documentKey,
        range: range,
        updatedValues: result.values,
        lastModified: new Date().toISOString()
      };

    } catch (error) {
      console.error('📊 Update worksheet failed:', error);
      throw new Error(`Failed to update ${documentKey}: ${error.message}`);
    }
  }

  /**
   * Add a new row to Excel worksheet
   */
  async addWorksheetRow(supervisorId, documentKey, values) {
    try {
      const document = this.documents[documentKey];
      if (!document) {
        throw new Error(`Unknown document: ${documentKey}`);
      }

      const graphClient = this.getGraphClient(supervisorId);
      
      // Get current used range to determine where to add the new row
      const usedRange = await graphClient
        .api(`/sites/${this.sharePointSiteId}/drive/items/${document.driveItemId}/workbook/worksheets/${document.worksheetName}/usedRange`)
        .get();

      const nextRowIndex = usedRange.rowCount + 1;
      const newRange = `A${nextRowIndex}:${String.fromCharCode(64 + values.length)}${nextRowIndex}`;

      // Add the new row
      const result = await this.updateWorksheetCells(supervisorId, documentKey, newRange, [values]);

      console.log('📊 New row added:', {
        document: documentKey,
        rowIndex: nextRowIndex,
        range: newRange,
        supervisor: supervisorId
      });

      return {
        success: true,
        document: documentKey,
        newRowIndex: nextRowIndex,
        range: newRange,
        values: values,
        lastModified: new Date().toISOString()
      };

    } catch (error) {
      console.error('📊 Add row failed:', error);
      throw new Error(`Failed to add row to ${documentKey}: ${error.message}`);
    }
  }

  /**
   * Create a SharePoint webhook subscription for real-time updates
   */
  async createWebhookSubscription(supervisorId, documentKey, callbackUrl) {
    try {
      const document = this.documents[documentKey];
      if (!document) {
        throw new Error(`Unknown document: ${documentKey}`);
      }

      const graphClient = this.getGraphClient(supervisorId);
      
      const subscription = {
        changeType: 'updated',
        notificationUrl: callbackUrl,
        resource: `/sites/${this.sharePointSiteId}/drive/items/${document.driveItemId}`,
        expirationDateTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour
        clientState: `${documentKey}_${supervisorId}_${Date.now()}`
      };

      const result = await graphClient
        .api('/subscriptions')
        .post(subscription);

      console.log('📊 Webhook subscription created:', {
        subscriptionId: result.id,
        document: documentKey,
        expiresAt: result.expirationDateTime
      });

      return {
        success: true,
        subscriptionId: result.id,
        document: documentKey,
        callbackUrl: callbackUrl,
        expiresAt: result.expirationDateTime,
        clientState: result.clientState
      };

    } catch (error) {
      console.error('📊 Create webhook failed:', error);
      throw new Error(`Failed to create webhook for ${documentKey}: ${error.message}`);
    }
  }

  /**
   * Get formatted data for On Time Request document
   */
  async getOnTimeRequestData(supervisorId) {
    try {
      const rawData = await this.getWorksheetData(supervisorId, 'onTimeRequest');
      
      // Parse the Excel data into structured format
      const headers = rawData.values[0] || [];
      const rows = rawData.values.slice(1) || [];

      const requests = rows.map((row, index) => ({
        id: index + 1,
        driverName: row[0] || '',
        badge: row[1] || '',
        shift: row[2] || '',
        route: row[3] || '',
        scheduledFinish: row[4] || '',
        requestedFinish: row[5] || '',
        reason: row[6] || '',
        status: row[7] || 'Pending',
        submittedAt: row[8] || new Date().toISOString(),
        lastModified: rawData.lastModified
      }));

      return {
        success: true,
        document: 'onTimeRequest',
        headers: headers,
        requests: requests,
        totalCount: requests.length,
        lastModified: rawData.lastModified
      };

    } catch (error) {
      console.error('📊 Get On Time Request data failed:', error);
      throw error;
    }
  }

  /**
   * Get formatted data for Daily Lost Mileage document
   */
  async getDailyLostMileageData(supervisorId) {
    try {
      const rawData = await this.getWorksheetData(supervisorId, 'dailyLostMileage');
      
      // Parse the Excel data into structured format
      const headers = rawData.values[0] || [];
      const rows = rawData.values.slice(1) || [];

      const reports = rows.map((row, index) => ({
        id: index + 1,
        date: row[0] || '',
        route: row[1] || '',
        lostMiles: parseFloat(row[2]) || 0,
        reason: row[3] || '',
        impact: row[4] || '',
        status: row[5] || 'Open',
        reportedBy: row[6] || '',
        lastModified: rawData.lastModified
      }));

      return {
        success: true,
        document: 'dailyLostMileage',
        headers: headers,
        reports: reports,
        totalLostMiles: reports.reduce((sum, report) => sum + report.lostMiles, 0),
        totalCount: reports.length,
        lastModified: rawData.lastModified
      };

    } catch (error) {
      console.error('📊 Get Daily Lost Mileage data failed:', error);
      throw error;
    }
  }

  /**
   * Submit a new On Time Request
   */
  async submitOnTimeRequest(supervisorId, requestData) {
    try {
      const newRow = [
        requestData.driverName || '',
        requestData.badge || '',
        requestData.shift || '',
        requestData.route || '',
        requestData.scheduledFinish || '',
        requestData.requestedFinish || '',
        requestData.reason || '',
        'Pending',
        new Date().toISOString()
      ];

      const result = await this.addWorksheetRow(supervisorId, 'onTimeRequest', newRow);

      return {
        success: true,
        message: 'On Time Request submitted successfully',
        requestId: result.newRowIndex,
        ...result
      };

    } catch (error) {
      console.error('📊 Submit On Time Request failed:', error);
      throw error;
    }
  }

  /**
   * Submit a new Daily Lost Mileage report
   */
  async submitLostMileageReport(supervisorId, reportData) {
    try {
      const newRow = [
        reportData.date || new Date().toISOString().split('T')[0],
        reportData.route || '',
        reportData.lostMiles || 0,
        reportData.reason || '',
        reportData.impact || '',
        'Open',
        reportData.reportedBy || supervisorId,
        new Date().toISOString()
      ];

      const result = await this.addWorksheetRow(supervisorId, 'dailyLostMileage', newRow);

      return {
        success: true,
        message: 'Lost Mileage report submitted successfully',
        reportId: result.newRowIndex,
        ...result
      };

    } catch (error) {
      console.error('📊 Submit Lost Mileage report failed:', error);
      throw error;
    }
  }
}

export default new SharePointExcelService();