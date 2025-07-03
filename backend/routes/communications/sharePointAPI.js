import express from 'express';
import sharePointService from '../../services/communications/sharePointService.js';

const router = express.Router();

// Get SharePoint site information
router.get('/site-info', async (req, res) => {
  try {
    const accessToken = req.headers.authorization?.replace('Bearer ', '');
    
    if (!accessToken) {
      return res.status(401).json({ 
        success: false, 
        error: 'Access token required' 
      });
    }
    
    const result = await sharePointService.getSiteInfo(accessToken);
    res.json(result);
  } catch (error) {
    console.error('❌ Error getting site info:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// List document libraries
router.get('/libraries', async (req, res) => {
  try {
    const accessToken = req.headers.authorization?.replace('Bearer ', '');
    
    if (!accessToken) {
      return res.status(401).json({ 
        success: false, 
        error: 'Access token required' 
      });
    }
    
    const result = await sharePointService.getDocumentLibraries(accessToken);
    res.json(result);
  } catch (error) {
    console.error('❌ Error listing libraries:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// List files in library
router.get('/files', async (req, res) => {
  try {
    const accessToken = req.headers.authorization?.replace('Bearer ', '');
    const { libraryId, folderPath } = req.query;
    
    if (!accessToken) {
      return res.status(401).json({ 
        success: false, 
        error: 'Access token required' 
      });
    }
    
    const result = await sharePointService.listFiles(
      accessToken, 
      libraryId, 
      folderPath
    );
    res.json(result);
  } catch (error) {
    console.error('❌ Error listing files:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get recent files
router.get('/files/recent', async (req, res) => {
  try {
    const accessToken = req.headers.authorization?.replace('Bearer ', '');
    const { limit = 10 } = req.query;
    
    if (!accessToken) {
      return res.status(401).json({ 
        success: false, 
        error: 'Access token required' 
      });
    }
    
    const result = await sharePointService.getRecentFiles(
      accessToken, 
      parseInt(limit)
    );
    res.json(result);
  } catch (error) {
    console.error('❌ Error getting recent files:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Search files
router.get('/search', async (req, res) => {
  try {
    const accessToken = req.headers.authorization?.replace('Bearer ', '');
    const { query, fileType } = req.query;
    
    if (!accessToken) {
      return res.status(401).json({ 
        success: false, 
        error: 'Access token required' 
      });
    }
    
    if (!query) {
      return res.status(400).json({ 
        success: false, 
        error: 'Search query required' 
      });
    }
    
    const result = await sharePointService.searchFiles(
      accessToken,
      query,
      fileType
    );
    res.json(result);
  } catch (error) {
    console.error('❌ Error searching files:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Upload file
router.post('/upload', async (req, res) => {
  try {
    const accessToken = req.headers.authorization?.replace('Bearer ', '');
    const { content, fileName, folderPath, metadata } = req.body;
    
    if (!accessToken) {
      return res.status(401).json({ 
        success: false, 
        error: 'Access token required' 
      });
    }
    
    if (!content || !fileName) {
      return res.status(400).json({ 
        success: false, 
        error: 'Content and fileName are required' 
      });
    }
    
    // Convert base64 to buffer if needed
    const fileContent = content.includes('base64,') 
      ? Buffer.from(content.split('base64,')[1], 'base64')
      : content;
    
    const result = await sharePointService.uploadFile(
      accessToken,
      fileContent,
      fileName,
      folderPath,
      metadata
    );
    res.json(result);
  } catch (error) {
    console.error('❌ Error uploading file:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create folder
router.post('/folders', async (req, res) => {
  try {
    const accessToken = req.headers.authorization?.replace('Bearer ', '');
    const { folderName, parentPath } = req.body;
    
    if (!accessToken) {
      return res.status(401).json({ 
        success: false, 
        error: 'Access token required' 
      });
    }
    
    if (!folderName) {
      return res.status(400).json({ 
        success: false, 
        error: 'Folder name required' 
      });
    }
    
    const result = await sharePointService.createFolder(
      accessToken,
      folderName,
      parentPath
    );
    res.json(result);
  } catch (error) {
    console.error('❌ Error creating folder:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Download file
router.get('/download/:fileId', async (req, res) => {
  try {
    const accessToken = req.headers.authorization?.replace('Bearer ', '');
    
    if (!accessToken) {
      return res.status(401).json({ 
        success: false, 
        error: 'Access token required' 
      });
    }
    
    const result = await sharePointService.downloadFile(
      accessToken,
      req.params.fileId
    );
    
    if (!result.success) {
      return res.status(404).json(result);
    }
    
    // Set appropriate headers
    res.setHeader('Content-Type', result.file.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.file.name}"`);
    res.send(result.file.content);
  } catch (error) {
    console.error('❌ Error downloading file:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Store report
router.post('/reports', async (req, res) => {
  try {
    const accessToken = req.headers.authorization?.replace('Bearer ', '');
    const reportData = req.body;
    
    if (!accessToken) {
      return res.status(401).json({ 
        success: false, 
        error: 'Access token required' 
      });
    }
    
    if (!reportData.title || !reportData.content) {
      return res.status(400).json({ 
        success: false, 
        error: 'Title and content are required' 
      });
    }
    
    const result = await sharePointService.storeReport(accessToken, reportData);
    res.json(result);
  } catch (error) {
    console.error('❌ Error storing report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
