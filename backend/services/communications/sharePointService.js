import { Client } from '@microsoft/microsoft-graph-client';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class SharePointService {
  constructor() {
    this.siteId = process.env.SHAREPOINT_SITE_ID || '';
    this.driveId = process.env.SHAREPOINT_DRIVE_ID || '';
    this.reportsLibraryId = process.env.SHAREPOINT_REPORTS_LIBRARY_ID || '';
    this.teamSiteUrl = process.env.SHAREPOINT_TEAM_SITE_URL || '';
  }

  /**
   * Create authenticated Graph client
   */
  getAuthenticatedClient(accessToken) {
    return Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      }
    });
  }

  /**
   * Get SharePoint site information
   */
  async getSiteInfo(accessToken) {
    try {
      const client = this.getAuthenticatedClient(accessToken);
      
      if (this.siteId) {
        // Get site by ID
        const site = await client.api(`/sites/${this.siteId}`).get();
        return { success: true, site };
      } else if (this.teamSiteUrl) {
        // Get site by URL
        const hostname = new URL(this.teamSiteUrl).hostname;
        const sitePath = new URL(this.teamSiteUrl).pathname;
        const site = await client.api(`/sites/${hostname}:${sitePath}`).get();
        return { success: true, site };
      }
      
      return { 
        success: false, 
        error: 'No SharePoint site configured. Set SHAREPOINT_SITE_ID or SHAREPOINT_TEAM_SITE_URL' 
      };
    } catch (error) {
      console.error('❌ SharePoint getSiteInfo error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * List document libraries
   */
  async getDocumentLibraries(accessToken) {
    try {
      const client = this.getAuthenticatedClient(accessToken);
      const siteInfo = await this.getSiteInfo(accessToken);
      
      if (!siteInfo.success) {
        return siteInfo;
      }
      
      const lists = await client
        .api(`/sites/${siteInfo.site.id}/lists`)
        .filter('baseTemplate eq 101') // Document libraries only
        .select('id,displayName,description,webUrl')
        .get();
      
      return { 
        success: true, 
        libraries: lists.value.map(lib => ({
          id: lib.id,
          name: lib.displayName,
          description: lib.description,
          webUrl: lib.webUrl
        }))
      };
    } catch (error) {
      console.error('❌ SharePoint getDocumentLibraries error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * List files in a document library
   */
  async listFiles(accessToken, libraryId = null, folderPath = '') {
    try {
      const client = this.getAuthenticatedClient(accessToken);
      const siteInfo = await this.getSiteInfo(accessToken);
      
      if (!siteInfo.success) {
        return siteInfo;
      }
      
      const targetLibraryId = libraryId || this.reportsLibraryId;
      if (!targetLibraryId) {
        return { success: false, error: 'No library ID specified' };
      }
      
      let apiPath = `/sites/${siteInfo.site.id}/lists/${targetLibraryId}/drive/root`;
      if (folderPath) {
        apiPath += `:/${folderPath}:`;
      }
      apiPath += '/children';
      
      const items = await client
        .api(apiPath)
        .select('id,name,size,lastModifiedDateTime,webUrl,folder,file')
        .orderby('name')
        .get();
      
      return { 
        success: true, 
        items: items.value.map(item => ({
          id: item.id,
          name: item.name,
          type: item.folder ? 'folder' : 'file',
          size: item.size,
          modified: item.lastModifiedDateTime,
          webUrl: item.webUrl,
          mimeType: item.file?.mimeType
        }))
      };
    } catch (error) {
      console.error('❌ SharePoint listFiles error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Upload file to SharePoint
   */
  async uploadFile(accessToken, fileContent, fileName, folderPath = '', metadata = {}) {
    try {
      const client = this.getAuthenticatedClient(accessToken);
      const siteInfo = await this.getSiteInfo(accessToken);
      
      if (!siteInfo.success) {
        return siteInfo;
      }
      
      const libraryId = this.reportsLibraryId;
      if (!libraryId) {
        return { success: false, error: 'No reports library configured' };
      }
      
      // Build the upload path
      let uploadPath = `/sites/${siteInfo.site.id}/lists/${libraryId}/drive/root`;
      if (folderPath) {
        uploadPath += `:/${folderPath}`;
      }
      uploadPath += `:/${fileName}:/content`;
      
      // Upload the file
      const uploadResult = await client
        .api(uploadPath)
        .put(fileContent);
      
      // Update metadata if provided
      if (Object.keys(metadata).length > 0) {
        await client
          .api(`/sites/${siteInfo.site.id}/lists/${libraryId}/items/${uploadResult.id}`)
          .patch({
            fields: metadata
          });
      }
      
      return { 
        success: true, 
        file: {
          id: uploadResult.id,
          name: uploadResult.name,
          webUrl: uploadResult.webUrl,
          size: uploadResult.size,
          created: uploadResult.createdDateTime
        }
      };
    } catch (error) {
      console.error('❌ SharePoint uploadFile error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create folder in SharePoint
   */
  async createFolder(accessToken, folderName, parentPath = '') {
    try {
      const client = this.getAuthenticatedClient(accessToken);
      const siteInfo = await this.getSiteInfo(accessToken);
      
      if (!siteInfo.success) {
        return siteInfo;
      }
      
      const libraryId = this.reportsLibraryId;
      if (!libraryId) {
        return { success: false, error: 'No reports library configured' };
      }
      
      let apiPath = `/sites/${siteInfo.site.id}/lists/${libraryId}/drive/root`;
      if (parentPath) {
        apiPath += `:/${parentPath}:`;
      }
      apiPath += '/children';
      
      const folder = await client
        .api(apiPath)
        .post({
          name: folderName,
          folder: {},
          '@microsoft.graph.conflictBehavior': 'rename'
        });
      
      return { 
        success: true, 
        folder: {
          id: folder.id,
          name: folder.name,
          webUrl: folder.webUrl,
          created: folder.createdDateTime
        }
      };
    } catch (error) {
      console.error('❌ SharePoint createFolder error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Download file from SharePoint
   */
  async downloadFile(accessToken, fileId) {
    try {
      const client = this.getAuthenticatedClient(accessToken);
      const siteInfo = await this.getSiteInfo(accessToken);
      
      if (!siteInfo.success) {
        return siteInfo;
      }
      
      const libraryId = this.reportsLibraryId;
      if (!libraryId) {
        return { success: false, error: 'No reports library configured' };
      }
      
      // Get file metadata
      const fileInfo = await client
        .api(`/sites/${siteInfo.site.id}/lists/${libraryId}/drive/items/${fileId}`)
        .select('id,name,size,file')
        .get();
      
      // Download file content
      const content = await client
        .api(`/sites/${siteInfo.site.id}/lists/${libraryId}/drive/items/${fileId}/content`)
        .get();
      
      return { 
        success: true, 
        file: {
          name: fileInfo.name,
          mimeType: fileInfo.file.mimeType,
          size: fileInfo.size,
          content: content
        }
      };
    } catch (error) {
      console.error('❌ SharePoint downloadFile error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Search for files
   */
  async searchFiles(accessToken, query, fileType = null) {
    try {
      const client = this.getAuthenticatedClient(accessToken);
      const siteInfo = await this.getSiteInfo(accessToken);
      
      if (!siteInfo.success) {
        return siteInfo;
      }
      
      let searchQuery = `${query} AND site:${siteInfo.site.webUrl}`;
      if (fileType) {
        searchQuery += ` AND filetype:${fileType}`;
      }
      
      const results = await client
        .api('/search/query')
        .post({
          requests: [{
            entityTypes: ['driveItem'],
            query: {
              queryString: searchQuery
            },
            size: 50
          }]
        });
      
      const items = results.value[0].hitsContainers[0].hits || [];
      
      return { 
        success: true, 
        results: items.map(hit => ({
          id: hit.resource.id,
          name: hit.resource.name,
          webUrl: hit.resource.webUrl,
          modified: hit.resource.lastModifiedDateTime,
          size: hit.resource.size,
          summary: hit.summary
        }))
      };
    } catch (error) {
      console.error('❌ SharePoint searchFiles error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get recent files
   */
  async getRecentFiles(accessToken, limit = 10) {
    try {
      const client = this.getAuthenticatedClient(accessToken);
      const siteInfo = await this.getSiteInfo(accessToken);
      
      if (!siteInfo.success) {
        return siteInfo;
      }
      
      const libraryId = this.reportsLibraryId;
      if (!libraryId) {
        return { success: false, error: 'No reports library configured' };
      }
      
      const items = await client
        .api(`/sites/${siteInfo.site.id}/lists/${libraryId}/drive/root/children`)
        .select('id,name,size,lastModifiedDateTime,webUrl,file')
        .orderby('lastModifiedDateTime desc')
        .top(limit)
        .get();
      
      return { 
        success: true, 
        files: items.value
          .filter(item => item.file) // Files only
          .map(item => ({
            id: item.id,
            name: item.name,
            size: item.size,
            modified: item.lastModifiedDateTime,
            webUrl: item.webUrl,
            mimeType: item.file.mimeType
          }))
      };
    } catch (error) {
      console.error('❌ SharePoint getRecentFiles error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Store report in SharePoint
   */
  async storeReport(accessToken, reportData) {
    try {
      const { 
        title, 
        content, 
        format = 'html',
        category = 'operational',
        metadata = {}
      } = reportData;
      
      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `${category}_${title.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.${format}`;
      
      // Create folder structure: /Reports/YYYY/MM/
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const folderPath = `Reports/${year}/${month}`;
      
      // Ensure folder exists
      await this.createFolder(accessToken, year.toString(), 'Reports');
      await this.createFolder(accessToken, month, `Reports/${year}`);
      
      // Upload report
      const result = await this.uploadFile(
        accessToken,
        content,
        fileName,
        folderPath,
        {
          Title: title,
          Category: category,
          GeneratedBy: 'Go BARRY System',
          ...metadata
        }
      );
      
      return result;
    } catch (error) {
      console.error('❌ SharePoint storeReport error:', error);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
export default new SharePointService();
