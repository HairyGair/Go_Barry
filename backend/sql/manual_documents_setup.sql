-- Manual Documents Setup for Go BARRY
-- Run this in the Supabase SQL Editor to create the documents management system

-- 1. Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) DEFAULT 'general',
  tags TEXT[], -- Array of tags for better organization
  file_name VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  storage_path VARCHAR(500) NOT NULL,
  public_url VARCHAR(500),
  uploaded_by VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create document categories table
CREATE TABLE IF NOT EXISTS document_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Insert default categories
INSERT INTO document_categories (name, display_name, description) VALUES
  ('reports', 'Traffic Reports', 'Daily and incident traffic reports'),
  ('procedures', 'Procedures', 'Standard operating procedures and guides'),
  ('templates', 'Templates', 'Message and document templates'),
  ('training', 'Training Materials', 'Training documents and guides'),
  ('policies', 'Policies', 'Company policies and guidelines'),
  ('general', 'General', 'General documents and files')
ON CONFLICT (name) DO NOTHING;

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_tags ON documents USING GIN(tags);

-- 5. Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Create trigger for updated_at
DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. Create storage bucket for documents (if not exists)
-- This needs to be done via the Supabase dashboard or storage API

-- 8. Verify the setup
SELECT 'Documents table created successfully' as status;
SELECT COUNT(*) as category_count FROM document_categories;