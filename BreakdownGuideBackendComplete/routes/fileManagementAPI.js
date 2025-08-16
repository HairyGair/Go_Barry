// Alternative File Management System for Go BARRY
// Provides document management capabilities while waiting for SharePoint access

import express from 'express';
import multer from 'multer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase with error handling
let supabase = null;
try {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    console.log('✅ Supabase client initialized for file management');
  } else {
    console.warn('⚠️ Supabase configuration missing for file management');
  }
} catch (error) {
  console.error('❌ Failed to initialize Supabase client:', error.message);
}

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Allow common document types
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
      'image/jpeg',
      'image/png',
      'image/gif'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'), false);
    }
  }
});

// Create documents table if it doesn't exist
const initializeDocumentsTable = async () => {
  try {
    const { error } = await supabase.rpc('create_documents_table', {});
    if (error && !error.message.includes('already exists')) {
      console.error('Error creating documents table:', error);
    }
  } catch (error) {
    console.log('Documents table initialization skipped (may already exist)');
  }
};

// Initialize on module load
initializeDocumentsTable();

// GET /api/file-management/health - Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'File Management API is running',
    supabaseConnected: !!supabase,
    timestamp: new Date().toISOString()
  });
});

// GET /api/file-management/documents - List all documents
router.get('/documents', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({
        success: false,
        error: 'Document management service not available - Supabase not configured'
      });
    }
    
    const { category, search, limit = 50 } = req.query;
    
    let query = supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));
    
    if (category) {
      query = query.eq('category', category);
    }
    
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    res.json({
      success: true,
      documents: data,
      count: data.length
    });
  } catch (error) {
    console.error('Error listing documents:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/file-management/upload - Upload a document
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file provided'
      });
    }
    
    const { 
      title, 
      description = '', 
      category = 'general',
      tags = '',
      uploaded_by = 'system'
    } = req.body;
    
    if (!title) {
      return res.status(400).json({
        success: false,
        error: 'Title is required'
      });
    }
    
    // Generate unique filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileExtension = path.extname(req.file.originalname);
    const safeTitle = title.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `${safeTitle}_${timestamp}${fileExtension}`;
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        metadata: {
          originalName: req.file.originalname,
          uploadedBy: uploaded_by
        }
      });
    
    if (uploadError) throw uploadError;
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(fileName);
    
    // Save metadata to database
    const { data: docData, error: docError } = await supabase
      .from('documents')
      .insert([{
        title,
        description,
        category,
        tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
        file_name: fileName,
        original_name: req.file.originalname,
        file_size: req.file.size,
        mime_type: req.file.mimetype,
        storage_path: uploadData.path,
        public_url: urlData.publicUrl,
        uploaded_by,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (docError) throw docError;
    
    res.json({
      success: true,
      document: docData,
      message: 'File uploaded successfully'
    });
    
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/file-management/download/:id - Download a document
router.get('/download/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get document metadata
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .single();
    
    if (docError || !doc) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }
    
    // Get file from storage
    const { data: fileData, error: fileError } = await supabase.storage
      .from('documents')
      .download(doc.storage_path);
    
    if (fileError) throw fileError;
    
    // Set appropriate headers
    res.setHeader('Content-Type', doc.mime_type);
    res.setHeader('Content-Disposition', `attachment; filename="${doc.original_name}"`);
    res.setHeader('Content-Length', doc.file_size);
    
    // Convert blob to buffer and send
    const buffer = Buffer.from(await fileData.arrayBuffer());
    res.send(buffer);
    
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// DELETE /api/file-management/documents/:id - Delete a document
router.delete('/documents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get document to find storage path
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .single();
    
    if (docError || !doc) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }
    
    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('documents')
      .remove([doc.storage_path]);
    
    if (storageError) {
      console.warn('Error deleting from storage:', storageError);
    }
    
    // Delete from database
    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);
    
    if (deleteError) throw deleteError;
    
    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/file-management/categories - Get document categories
router.get('/categories', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('category')
      .not('category', 'is', null);
    
    if (error) throw error;
    
    const categories = [...new Set(data.map(item => item.category))];
    
    res.json({
      success: true,
      categories: categories.sort()
    });
  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/file-management/create-folder - Create a category/folder
router.post('/create-folder', async (req, res) => {
  try {
    const { name, description = '' } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Folder name is required'
      });
    }
    
    // Create a placeholder document to establish the category
    const { data, error } = await supabase
      .from('document_categories')
      .insert([{
        name: name.toLowerCase(),
        display_name: name,
        description,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    res.json({
      success: true,
      category: data,
      message: 'Category created successfully'
    });
    
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/file-management/stats - Get document statistics
router.get('/stats', async (req, res) => {
  try {
    const { data: docs, error } = await supabase
      .from('documents')
      .select('category, file_size, created_at');
    
    if (error) throw error;
    
    const stats = {
      totalDocuments: docs.length,
      totalSize: docs.reduce((sum, doc) => sum + (doc.file_size || 0), 0),
      byCategory: {},
      recentUploads: docs.filter(doc => {
        const uploadDate = new Date(doc.created_at);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return uploadDate > weekAgo;
      }).length
    };
    
    // Group by category
    docs.forEach(doc => {
      const category = doc.category || 'uncategorized';
      if (!stats.byCategory[category]) {
        stats.byCategory[category] = 0;
      }
      stats.byCategory[category]++;
    });
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;