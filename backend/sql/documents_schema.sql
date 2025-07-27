-- Documents Management Schema for Go BARRY
-- Alternative to SharePoint while waiting for Azure access

-- Create documents table
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
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Add search index
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', title || ' ' || COALESCE(description, ''))
  ) STORED
);

-- Create document categories table
CREATE TABLE IF NOT EXISTS document_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_search ON documents USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_documents_tags ON documents USING GIN(tags);

-- Insert default categories
INSERT INTO document_categories (name, display_name, description) VALUES
  ('reports', 'Traffic Reports', 'Daily and incident traffic reports'),
  ('procedures', 'Procedures', 'Standard operating procedures and guides'),
  ('templates', 'Templates', 'Message and document templates'),
  ('training', 'Training Materials', 'Training documents and guides'),
  ('policies', 'Policies', 'Company policies and guidelines'),
  ('general', 'General', 'General documents and files')
ON CONFLICT (name) DO NOTHING;

-- Enable Row Level Security (RLS) for security
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (adjust based on your authentication system)
CREATE POLICY "Allow authenticated users to view documents" ON documents
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert documents" ON documents
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow users to update their own documents" ON documents
  FOR UPDATE USING (auth.uid()::text = uploaded_by);

CREATE POLICY "Allow users to delete their own documents" ON documents
  FOR DELETE USING (auth.uid()::text = uploaded_by);

-- Categories are readable by all authenticated users
CREATE POLICY "Allow authenticated users to view categories" ON document_categories
  FOR SELECT USING (auth.role() = 'authenticated');

-- Create storage bucket for documents (run this in Supabase dashboard)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', true);

-- Set up storage policies (run in Supabase dashboard)
-- CREATE POLICY "Allow authenticated users to upload documents" ON storage.objects
--   FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');

-- CREATE POLICY "Allow authenticated users to view documents" ON storage.objects
--   FOR SELECT USING (bucket_id = 'documents' AND auth.role() = 'authenticated');

-- CREATE POLICY "Allow users to delete their own documents" ON storage.objects
--   FOR DELETE USING (bucket_id = 'documents' AND auth.role() = 'authenticated');

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create documents table (for API initialization)
CREATE OR REPLACE FUNCTION create_documents_table()
RETURNS void AS $$
BEGIN
  -- This function ensures the table exists
  -- It's called by the API to initialize the schema
  PERFORM 1 FROM information_schema.tables 
  WHERE table_name = 'documents' AND table_schema = 'public';
  
  IF NOT FOUND THEN
    RAISE NOTICE 'Documents table created successfully';
  END IF;
END;
$$ LANGUAGE plpgsql;